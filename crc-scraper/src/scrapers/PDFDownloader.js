/**
 * CRC PDF Downloader
 * Handles PDF download and content extraction with resilience
 */

const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
const { chromium } = require('playwright');
const config = require('../config/ScraperConfig');
const Logger = require('../utils/Logger');
const FileUtils = require('../utils/FileUtils');
const ProgressTracker = require('../utils/ProgressTracker');

class PDFDownloader {
  constructor() {
    this.logger = new Logger('PDFDownloader');
    this.fileUtils = new FileUtils();
    this.progressTracker = new ProgressTracker();
    this.downloadQueue = [];
    this.processing = false;
    this.retryAttempts = new Map();
    this.downloadStats = {
      attempted: 0,
      successful: 0,
      failed: 0,
      skipped: 0
    };
  }

  /**
   * Download and extract content from CRC rule PDFs with smart caching
   * @param {Array} ruleUrls - Array of rule URLs to process
   * @param {string} outputDir - Directory to save PDFs
   * @returns {Promise<Array>} Array of extracted content
   */
  async downloadRulePDFs(ruleUrls, outputDir = config.output.directories.pdfs) {
    try {
      this.logger.info(`Starting PDF download for ${ruleUrls.length} rules`);
      
      // Initialize progress tracking
      this.progressTracker.initializeRun(ruleUrls.length, 'pdf_download');
      
      // Filter out already processed rules
      const urlsToProcess = ruleUrls.filter(url => {
        const ruleNumber = this.extractRuleNumber(url);
        const isProcessed = this.progressTracker.isRuleProcessed(ruleNumber, 'pdf_download');
        if (isProcessed) {
          this.downloadStats.skipped++;
          this.logger.debug(`Skipping already processed rule: ${ruleNumber}`);
        }
        return !isProcessed;
      });

      this.logger.info(`Found ${ruleUrls.length - urlsToProcess.length} already processed rules, ${urlsToProcess.length} to process`);
      
      if (urlsToProcess.length === 0) {
        this.logger.info('All rules already processed, loading existing results');
        return await this.loadExistingResults(ruleUrls, outputDir);
      }
      
      // Ensure output directory exists
      await fs.ensureDir(outputDir);
      
      // Initialize browser for PDF extraction
      const browser = await chromium.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
      });

      const results = [];
      
      // Process in batches for better performance
      const batchSize = config.performance?.concurrency?.batchSize || 10;
      for (let i = 0; i < urlsToProcess.length; i += batchSize) {
        const batch = urlsToProcess.slice(i, i + batchSize);
        this.logger.info(`Processing batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(urlsToProcess.length/batchSize)} (${batch.length} rules)`);
        
        for (const ruleUrl of batch) {
          try {
            const result = await this.processRuleURL(ruleUrl, outputDir, browser);
            if (result) {
              results.push(result);
              // Mark as processed
              this.progressTracker.markRuleProcessed(result.ruleNumber, 'pdf_download', {
                pdfPath: result.pdfPath,
                fileSize: result.metadata.fileSize,
                pages: result.metadata.pages
              });
            }
            
            // Optimized rate limiting
            await this.delay(config.performance?.delays?.betweenRequests || config.navigation.delays.betweenRequests);
          } catch (error) {
            const ruleNumber = this.extractRuleNumber(ruleUrl);
            this.logger.error(`Failed to process rule URL ${ruleUrl}:`, error);
            this.downloadStats.failed++;
            if (ruleNumber) {
              this.progressTracker.markRuleFailed(ruleNumber, 'pdf_download', error);
            }
          }
        }
        
        // Brief pause between batches
        if (i + batchSize < urlsToProcess.length) {
          await this.delay(config.performance?.delays?.betweenPages || config.navigation.delays.betweenPages);
        }
      }

      await browser.close();
      
      // Save final progress
      this.progressTracker.saveProgress();
      
      this.logger.info(`PDF download complete. Stats: ${JSON.stringify(this.downloadStats)}`);
      return results;

    } catch (error) {
      this.logger.error('Error in PDF download process:', error);
      throw error;
    }
  }

  /**
   * Process individual rule URL for PDF download and extraction
   */
  async processRuleURL(ruleUrl, outputDir, browser) {
    try {
      this.downloadStats.attempted++;
      
      const ruleNumber = this.extractRuleNumber(ruleUrl);
      if (!ruleNumber) {
        this.logger.warn(`Could not extract rule number from URL: ${ruleUrl}`);
        return null;
      }

      const pdfPath = path.join(outputDir, `crc_rule_${ruleNumber}.pdf`);
      
      // Check if already downloaded
      if (await fs.pathExists(pdfPath) && !(await this.shouldRedownload(pdfPath, ruleNumber))) {
        this.logger.info(`PDF already exists for rule ${ruleNumber}, extracting content`);
        this.downloadStats.skipped++;
        return await this.extractPDFContent(pdfPath, ruleNumber, ruleUrl);
      }

      // Try direct PDF download first
      let pdfDownloaded = await this.tryDirectPDFDownload(ruleUrl, pdfPath);
      
      // Fallback to browser-based download
      if (!pdfDownloaded) {
        pdfDownloaded = await this.tryBrowserPDFDownload(ruleUrl, pdfPath, browser);
      }

      if (pdfDownloaded) {
        this.downloadStats.successful++;
        return await this.extractPDFContent(pdfPath, ruleNumber, ruleUrl);
      } else {
        this.downloadStats.failed++;
        this.logger.error(`Failed to download PDF for rule ${ruleNumber}`);
        return null;
      }

    } catch (error) {
      this.logger.error(`Error processing rule URL ${ruleUrl}:`, error);
      this.downloadStats.failed++;
      return null;
    }
  }

  /**
   * Try direct PDF download via HTTP request
   */
  async tryDirectPDFDownload(ruleUrl, pdfPath) {
    try {
      // Generate potential PDF URLs
      const pdfUrls = this.generatePDFUrls(ruleUrl);
      
      for (const pdfUrl of pdfUrls) {
        try {
          const response = await axios({
            method: 'GET',
            url: pdfUrl,
            responseType: 'stream',
            timeout: 30000,
            headers: {
              'User-Agent': config.navigation.userAgent,
              'Accept': 'application/pdf,*/*'
            }
          });

          if (response.status === 200 && 
              response.headers['content-type']?.includes('pdf')) {
            
            const writer = fs.createWriteStream(pdfPath);
            response.data.pipe(writer);
            
            return new Promise((resolve, reject) => {
              writer.on('finish', () => {
                this.logger.info(`Successfully downloaded PDF: ${pdfPath}`);
                resolve(true);
              });
              writer.on('error', reject);
            });
          }
        } catch (error) {
          // Continue to next PDF URL
          continue;
        }
      }

      return false;
    } catch (error) {
      this.logger.error('Direct PDF download failed:', error);
      return false;
    }
  }

  /**
   * Try browser-based PDF download
   */
  async tryBrowserPDFDownload(ruleUrl, pdfPath, browser) {
    let page = null;
    
    try {
      page = await browser.newPage();
      
      // Navigate to rule page
      await page.goto(ruleUrl, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });

      // Wait for page to load
      await page.waitForTimeout(config.navigation.delays.pageLoad);

      // Look for PDF download links/buttons
      const pdfTriggers = [
        'a[href*=".pdf"]',
        'button:has-text("PDF")',
        'a:has-text("PDF")',
        '.pdf-download',
        '.print-pdf',
        'button[onclick*="pdf"]'
      ];

      let downloadTriggered = false;
      let downloadPromise = null;
      
      for (const selector of pdfTriggers) {
        try {
          const element = await page.locator(selector).first();
          if (await element.isVisible()) {
            // Set up download promise only when we're about to trigger it
            downloadPromise = page.waitForEvent('download', { timeout: 30000 });
            await element.click();
            downloadTriggered = true;
            break;
          }
        } catch (error) {
          // Continue to next selector
          continue;
        }
      }

      if (!downloadTriggered) {
        // Try print-to-PDF as fallback
        return await this.printToPDF(page, pdfPath);
      }

      // Wait for download only if we triggered one
      if (downloadPromise) {
        const download = await downloadPromise;
        await download.saveAs(pdfPath);
        
        this.logger.info(`Browser download successful: ${pdfPath}`);
        return true;
      }

      return false;

    } catch (error) {
      this.logger.error('Browser PDF download failed:', error);
      
      // Try print-to-PDF as final fallback
      if (page) {
        return await this.printToPDF(page, pdfPath);
      }
      
      return false;
    } finally {
      if (page) {
        await page.close();
      }
    }
  }

  /**
   * Print page to PDF as fallback
   */
  async printToPDF(page, pdfPath) {
    try {
      await page.pdf({
        path: pdfPath,
        format: 'A4',
        printBackground: true,
        margin: { top: '1in', bottom: '1in', left: '1in', right: '1in' }
      });
      
      this.logger.info(`Print-to-PDF successful: ${pdfPath}`);
      return true;
    } catch (error) {
      this.logger.error('Print-to-PDF failed:', error);
      return false;
    }
  }

  /**
   * Extract content from downloaded PDF
   */
  async extractPDFContent(pdfPath, ruleNumber, sourceUrl) {
    try {
      const pdfBuffer = await fs.readFile(pdfPath);
      
      // Use pdfjs-dist to extract content
      const loadingTask = pdfjsLib.getDocument({
        data: pdfBuffer,
        verbosity: 0 // Reduce console output
      });
      
      const pdfDoc = await loadingTask.promise;
      const numPages = pdfDoc.numPages;
      let fullText = '';
      
      // Extract text from all pages
      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdfDoc.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += pageText + '\n';
      }

      const extractedContent = {
        ruleNumber,
        sourceUrl,
        pdfPath,
        title: this.extractTitle(fullText),
        content: this.cleanPDFText(fullText),
        metadata: {
          pages: numPages,
          info: {}, // pdfjs-dist doesn't provide same metadata structure
          extractedAt: new Date().toISOString(),
          fileSize: (await fs.stat(pdfPath)).size,
          wordCount: fullText.split(/\s+/).length
        }
      };

      // Validate extracted content
      if (!this.validateExtractedContent(extractedContent)) {
        this.logger.warn(`Extracted content validation failed for rule ${ruleNumber}`);
      }

      return extractedContent;

    } catch (error) {
      this.logger.error(`Failed to extract PDF content from ${pdfPath}:`, error);
      throw error;
    }
  }

  /**
   * Generate potential PDF URLs for a rule
   */
  generatePDFUrls(ruleUrl) {
    const urls = [];
    const baseUrl = ruleUrl.replace(/\/$/, '');
    
    // Common PDF URL patterns
    urls.push(`${baseUrl}.pdf`);
    urls.push(`${baseUrl}/pdf`);
    urls.push(`${baseUrl}?format=pdf`);
    urls.push(`${baseUrl}&output=pdf`);
    
    // Extract rule number and try pattern-based URLs
    const ruleNumber = this.extractRuleNumber(ruleUrl);
    if (ruleNumber) {
      const titleNumber = ruleNumber.split('.')[0];
      urls.push(`https://courts.ca.gov/cms/rules/printfriendly/rule${titleNumber}_${ruleNumber.replace('.', '')}.pdf`);
      urls.push(`https://courts.ca.gov/documents/rule_${ruleNumber}.pdf`);
    }

    return urls;
  }

  /**
   * Extract rule number from URL
   */
  extractRuleNumber(url) {
    const patterns = [
      /rule(\d+)_(\d+)(?:_(\d+))?([a-z])?/i,
      /rule[-_]?(\d+)\.(\d+)(?:\.(\d+))?([a-z])?/i,
      /(\d+)\.(\d+)(?:\.(\d+))?([a-z])?/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        let ruleNumber = `${match[1]}.${match[2]}`;
        if (match[3]) ruleNumber += `.${match[3]}`;
        if (match[4]) ruleNumber += match[4];
        return ruleNumber;
      }
    }

    return null;
  }

  /**
   * Extract title from PDF text
   */
  extractTitle(text) {
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    
    // Look for title patterns
    const titlePatterns = [
      /^Rule\s+\d+\.\d+(?:\.\d+)?[a-z]?\.\s+(.+)$/i,
      /^Title\s+\d+[:\-\s]+(.+)$/i,
      /^(.{10,100})$/
    ];

    for (const line of lines.slice(0, 10)) { // Check first 10 lines
      for (const pattern of titlePatterns) {
        const match = line.match(pattern);
        if (match) {
          return match[1].trim();
        }
      }
    }

    return 'Unknown Title';
  }

  /**
   * Clean and normalize PDF text
   */
  cleanPDFText(text) {
    if (!text) return '';

    return text
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Remove page numbers and headers/footers (common patterns)
      .replace(/Page\s+\d+\s+of\s+\d+/gi, '')
      .replace(/^\d+\s*$/gm, '') // Standalone numbers (likely page numbers)
      // Remove common PDF artifacts
      .replace(/\f/g, ' ') // Form feed characters
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\r/g, '\n')
      // Clean up multiple newlines
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      // Trim
      .trim();
  }

  /**
   * Validate extracted content quality
   */
  validateExtractedContent(content) {
    const validation = config.errorHandling.validation;
    
    // Check minimum content length
    if (content.content.length < validation.minimumContentLength) {
      return false;
    }

    // Check maximum content length
    if (content.content.length > validation.maxContentLength) {
      return false;
    }

    // Check for rule number format
    if (!validation.ruleNumberFormat.test(content.ruleNumber)) {
      return false;
    }

    // Check for required fields
    for (const field of validation.requiredFields) {
      if (!content[field] || (typeof content[field] === 'string' && content[field].trim().length === 0)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Load existing results for already processed rules
   */
  async loadExistingResults(ruleUrls, outputDir) {
    const results = [];
    
    for (const ruleUrl of ruleUrls) {
      try {
        const ruleNumber = this.extractRuleNumber(ruleUrl);
        if (!ruleNumber) continue;
        
        const pdfPath = path.join(outputDir, `crc_rule_${ruleNumber}.pdf`);
        
        if (await fs.pathExists(pdfPath)) {
          const content = await this.extractPDFContent(pdfPath, ruleNumber, ruleUrl);
          if (content) {
            results.push(content);
            this.downloadStats.skipped++;
          }
        }
      } catch (error) {
        this.logger.warn(`Failed to load existing result for ${ruleUrl}:`, error.message);
      }
    }
    
    return results;
  }

  /**
   * Check if file should be re-downloaded (optimized for smart caching)
   */
  async shouldRedownload(filePath, ruleNumber = null) {
    try {
      // First check if rule is marked as processed in progress tracker
      if (ruleNumber && this.progressTracker.isRuleProcessed(ruleNumber, 'pdf_download')) {
        return false; // Don't re-download if marked as processed
      }
      
      const stats = await fs.stat(filePath);
      
      // Check file size - if it's too small, likely a failed download
      if (stats.size < 1000) { // Less than 1KB
        return true;
      }
      
      const ageInMs = Date.now() - stats.mtime.getTime();
      const maxAge = config.cache.ttl; // Now 2 hours instead of 24
      
      return ageInMs > maxAge;
    } catch (error) {
      return true; // Re-download if file doesn't exist or can't be accessed
    }
  }

  /**
   * Utility delay function
   */
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get download statistics
   */
  getDownloadStats() {
    return { ...this.downloadStats };
  }

  /**
   * Reset download statistics
   */
  resetStats() {
    this.downloadStats = {
      attempted: 0,
      successful: 0,
      failed: 0,
      skipped: 0
    };
  }
}

module.exports = PDFDownloader;