const axios = require('axios');
const cheerio = require('cheerio');
const { playwright } = require('playwright');
const fs = require('fs-extra');
const path = require('path');
const { URL } = require('url');
const pLimit = require('p-limit');

const URLDiscovery = require('../utils/URLDiscovery');
const DocumentClassifier = require('./DocumentClassifier');

class UniversalScraper {
  constructor(config = {}) {
    this.config = {
      timeout: 30000,
      maxConcurrent: 2,
      userAgent: 'Legal Research Tool - California County Rules Scraper',
      downloadDocuments: true,
      useHeadlessBrowser: false,
      retryAttempts: 3,
      ...config
    };
    
    this.limit = pLimit(this.config.maxConcurrent);
    this.urlDiscovery = new URLDiscovery(this.config);
    this.documentClassifier = new DocumentClassifier();
    this.browser = null;
    this.scrapedData = new Map();
  }

  /**
   * Main scraping method for a county
   */
  async scrapeCounty(countyConfig) {
    console.log(`\n🏛️  Starting scrape for ${countyConfig.county} County`);
    console.log(`📍 Base URL: ${countyConfig.baseUrl}`);
    
    try {
      // Initialize browser if needed
      if (this.config.useHeadlessBrowser && !this.browser) {
        await this.initializeBrowser();
      }

      // Step 1: Discover document URLs
      console.log('🔍 Discovering document URLs...');
      const discoveredUrls = await this.urlDiscovery.discoverFilingDocuments(countyConfig);
      console.log(`📄 Found ${discoveredUrls.length} potential documents`);

      if (discoveredUrls.length === 0) {
        console.warn(`⚠️  No documents discovered for ${countyConfig.county}`);
        return { county: countyConfig.county, documents: [], error: 'No documents found' };
      }

      // Step 2: Process documents in batches
      console.log('📖 Processing documents...');
      const processedDocuments = [];
      const batchSize = 5;
      
      for (let i = 0; i < discoveredUrls.length; i += batchSize) {
        const batch = discoveredUrls.slice(i, i + batchSize);
        const batchPromises = batch.map(urlData => 
          this.limit(() => this.processDocument(urlData, countyConfig))
        );
        
        const batchResults = await Promise.allSettled(batchPromises);
        
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value) {
            processedDocuments.push(result.value);
          } else {
            console.warn(`❌ Failed to process: ${batch[index].url}`);
          }
        });

        // Respectful delay between batches
        if (i + batchSize < discoveredUrls.length) {
          await this.sleep(countyConfig.scraping_config?.rate_limit || 2000);
        }
      }

      console.log(`✅ Successfully processed ${processedDocuments.length} documents`);
      
      // Step 3: Analyze and categorize results
      const analysis = this.analyzeScrapedDocuments(processedDocuments, countyConfig);
      
      return {
        county: countyConfig.county,
        baseUrl: countyConfig.baseUrl,
        scraped_at: new Date().toISOString(),
        documents: processedDocuments,
        analysis: analysis,
        stats: {
          discovered: discoveredUrls.length,
          processed: processedDocuments.length,
          success_rate: (processedDocuments.length / discoveredUrls.length * 100).toFixed(1) + '%'
        }
      };

    } catch (error) {
      console.error(`💥 Error scraping ${countyConfig.county}:`, error);
      return {
        county: countyConfig.county,
        error: error.message,
        scraped_at: new Date().toISOString(),
        documents: []
      };
    }
  }

  /**
   * Process individual document
   */
  async processDocument(urlData, countyConfig) {
    const startTime = Date.now();
    
    try {
      console.log(`📄 Processing: ${urlData.title || urlData.url}`);
      
      // Skip if already processed
      if (this.scrapedData.has(urlData.url)) {
        return this.scrapedData.get(urlData.url);
      }

      // Determine processing method based on format
      const format = this.detectDocumentFormat(urlData.url);
      let documentData;

      switch (format) {
        case 'PDF':
          documentData = await this.processPDFDocument(urlData, countyConfig);
          break;
        case 'WORD':
          documentData = await this.processWordDocument(urlData, countyConfig);
          break;
        case 'HTML':
          documentData = await this.processHTMLDocument(urlData, countyConfig);
          break;
        default:
          documentData = await this.processGenericDocument(urlData, countyConfig);
      }

      if (!documentData) {
        return null;
      }

      // Classify the document
      const classification = this.documentClassifier.classifyDocument(
        urlData.url,
        documentData.title,
        documentData.content
      );

      // Create comprehensive document record
      const processedDocument = {
        ...urlData,
        ...documentData,
        classification: classification,
        county: countyConfig.county,
        processing_time_ms: Date.now() - startTime,
        processed_at: new Date().toISOString(),
        format: format,
        filing_analysis: this.analyzeFilingContent(documentData.content),
        judge_specific_info: this.documentClassifier.extractJudgeSpecificInfo(documentData.content),
        metadata: {
          word_count: this.countWords(documentData.content),
          has_deadlines: this.hasDeadlines(documentData.content),
          has_procedures: this.hasProcedures(documentData.content),
          references: this.extractReferences(documentData.content)
        }
      };

      // Cache the result
      this.scrapedData.set(urlData.url, processedDocument);
      
      return processedDocument;

    } catch (error) {
      console.error(`Error processing document ${urlData.url}:`, error.message);
      return {
        ...urlData,
        error: error.message,
        processed_at: new Date().toISOString(),
        county: countyConfig.county
      };
    }
  }

  /**
   * Process HTML documents
   */
  async processHTMLDocument(urlData, countyConfig) {
    try {
      const response = await axios.get(urlData.url, {
        timeout: this.config.timeout,
        headers: { 'User-Agent': this.config.userAgent }
      });

      const $ = cheerio.load(response.data);
      
      // Remove unwanted elements
      $('script, style, nav, header, footer, .advertisement').remove();
      
      // Extract title
      let title = urlData.title || $('title').text().trim() || $('h1').first().text().trim();
      
      // Extract main content using various selectors
      const contentSelectors = [
        '.content', '.main-content', '.page-content',
        '.rule-content', '.order-content', '.document-content',
        'main', 'article', '.text-content', '#content'
      ];
      
      let content = '';
      for (const selector of contentSelectors) {
        const element = $(selector);
        if (element.length > 0 && element.text().trim().length > 100) {
          content = element.text().trim();
          break;
        }
      }
      
      // Fallback to body content if no specific content area found
      if (!content || content.length < 100) {
        content = $('body').text().replace(/\s+/g, ' ').trim();
      }

      // Extract metadata
      const metadata = {
        last_modified: $('meta[name="last-modified"]').attr('content') || 
                      $('meta[property="article:modified_time"]').attr('content'),
        author: $('meta[name="author"]').attr('content'),
        description: $('meta[name="description"]').attr('content'),
        keywords: $('meta[name="keywords"]').attr('content')
      };

      return {
        title: title,
        content: content,
        metadata: metadata,
        html_length: response.data.length,
        content_length: content.length
      };

    } catch (error) {
      console.error(`Error processing HTML document ${urlData.url}:`, error.message);
      return null;
    }
  }

  /**
   * Process PDF documents
   */
  async processPDFDocument(urlData, countyConfig) {
    try {
      // Download PDF
      const response = await axios.get(urlData.url, {
        responseType: 'arraybuffer',
        timeout: this.config.timeout,
        headers: { 'User-Agent': this.config.userAgent }
      });

      // Save PDF if configured
      let localPath = null;
      if (this.config.downloadDocuments) {
        const documentsDir = path.join(process.cwd(), 'scraped_documents', 
          countyConfig.county.toLowerCase().replace(/\s+/g, '-'));
        await fs.ensureDir(documentsDir);
        
        const filename = this.generateFilename(urlData.url, urlData.title, 'pdf');
        localPath = path.join(documentsDir, filename);
        await fs.writeFile(localPath, response.data);
      }

      // Extract text using pdf-parse
      const pdfParse = require('pdf-parse');
      const pdfData = await pdfParse(response.data);

      return {
        title: urlData.title || this.extractTitleFromPDFText(pdfData.text),
        content: pdfData.text,
        local_path: localPath,
        pdf_info: {
          pages: pdfData.numpages,
          info: pdfData.info,
          metadata: pdfData.metadata
        },
        file_size: response.data.length
      };

    } catch (error) {
      console.error(`Error processing PDF document ${urlData.url}:`, error.message);
      return null;
    }
  }

  /**
   * Process Word documents
   */
  async processWordDocument(urlData, countyConfig) {
    try {
      const mammoth = require('mammoth');
      
      // Download document
      const response = await axios.get(urlData.url, {
        responseType: 'arraybuffer',
        timeout: this.config.timeout,
        headers: { 'User-Agent': this.config.userAgent }
      });

      // Save document if configured
      let localPath = null;
      if (this.config.downloadDocuments) {
        const documentsDir = path.join(process.cwd(), 'scraped_documents', 
          countyConfig.county.toLowerCase().replace(/\s+/g, '-'));
        await fs.ensureDir(documentsDir);
        
        const filename = this.generateFilename(urlData.url, urlData.title, 'docx');
        localPath = path.join(documentsDir, filename);
        await fs.writeFile(localPath, response.data);
      }

      // Extract text using mammoth
      const result = await mammoth.extractRawText({ buffer: response.data });

      return {
        title: urlData.title || this.extractTitleFromText(result.value),
        content: result.value,
        local_path: localPath,
        extraction_messages: result.messages,
        file_size: response.data.length
      };

    } catch (error) {
      console.error(`Error processing Word document ${urlData.url}:`, error.message);
      return null;
    }
  }

  /**
   * Process generic documents (fallback)
   */
  async processGenericDocument(urlData, countyConfig) {
    try {
      // Try as HTML first
      const htmlResult = await this.processHTMLDocument(urlData, countyConfig);
      if (htmlResult && htmlResult.content.length > 100) {
        return htmlResult;
      }

      // Fallback to basic text extraction
      const response = await axios.get(urlData.url, {
        timeout: this.config.timeout,
        headers: { 'User-Agent': this.config.userAgent }
      });

      return {
        title: urlData.title || 'Unknown Document',
        content: response.data.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(),
        raw_data: response.data,
        content_type: response.headers['content-type'] || 'unknown'
      };

    } catch (error) {
      console.error(`Error processing generic document ${urlData.url}:`, error.message);
      return null;
    }
  }

  /**
   * Initialize headless browser for JavaScript-heavy sites
   */
  async initializeBrowser() {
    const { chromium } = require('playwright');
    this.browser = await chromium.launch({ headless: true });
    console.log('🌐 Headless browser initialized');
  }

  /**
   * Detect document format from URL
   */
  detectDocumentFormat(url) {
    const urlLower = url.toLowerCase();
    if (urlLower.includes('.pdf')) return 'PDF';
    if (urlLower.includes('.doc')) return 'WORD';
    if (urlLower.includes('.xls')) return 'EXCEL';
    return 'HTML';
  }

  /**
   * Generate appropriate filename for downloaded documents
   */
  generateFilename(url, title, extension) {
    let filename = title || url.split('/').pop() || 'document';
    
    // Clean filename
    filename = filename
      .replace(/[^a-zA-Z0-9\s-_]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 100);
    
    // Add timestamp to avoid conflicts
    const timestamp = Date.now();
    return `${filename}_${timestamp}.${extension}`;
  }

  /**
   * Extract title from PDF text
   */
  extractTitleFromPDFText(text) {
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    if (lines.length > 0) {
      return lines[0].substring(0, 100).trim();
    }
    return 'PDF Document';
  }

  /**
   * Extract title from text content
   */
  extractTitleFromText(text) {
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    if (lines.length > 0) {
      return lines[0].substring(0, 100).trim();
    }
    return 'Document';
  }

  /**
   * Analyze filing-relevant content
   */
  analyzeFilingContent(content) {
    const filingKeywords = [
      'filing deadline', 'must file', 'shall file', 'electronic filing',
      'proof of service', 'case management statement', 'motion practice',
      'pleading requirements', 'service of process'
    ];

    const analysis = {
      filing_mentions: 0,
      key_phrases: [],
      has_deadlines: false,
      has_requirements: false
    };

    const lowerContent = content.toLowerCase();
    
    for (const keyword of filingKeywords) {
      const regex = new RegExp(keyword, 'gi');
      const matches = lowerContent.match(regex);
      if (matches) {
        analysis.filing_mentions += matches.length;
        analysis.key_phrases.push(keyword);
      }
    }

    analysis.has_deadlines = /\b\d+\s*days?\b|\bdeadline\b|\bdue\s+date\b/i.test(content);
    analysis.has_requirements = /\bmust\b|\bshall\b|\brequired\b|\bmandatory\b/i.test(content);

    return analysis;
  }

  /**
   * Count words in content
   */
  countWords(content) {
    return content.split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Check if content has deadline information
   */
  hasDeadlines(content) {
    return /\b\d+\s*days?\b|\bdeadline\b|\bdue\s+date\b|\bwithin\s+\d+/i.test(content);
  }

  /**
   * Check if content has procedural information
   */
  hasProcedures(content) {
    return /\bprocedure\b|\bstep\b|\bprocess\b|\bmust\b|\bshall\b/i.test(content);
  }

  /**
   * Extract legal references
   */
  extractReferences(content) {
    const references = {
      ccp_sections: [],
      crc_rules: [],
      local_rules: [],
      case_citations: []
    };

    // CCP references
    const ccpMatches = content.match(/CCP\s*§?\s*\d+(\.\d+)?/gi) || [];
    references.ccp_sections = [...new Set(ccpMatches)];

    // CRC references
    const crcMatches = content.match(/CRC\s*\d+(\.\d+)?/gi) || [];
    references.crc_rules = [...new Set(crcMatches)];

    // Local rule references
    const localMatches = content.match(/Local\s+Rule\s+\d+(\.\d+)?/gi) || [];
    references.local_rules = [...new Set(localMatches)];

    return references;
  }

  /**
   * Analyze scraped documents for patterns and insights
   */
  analyzeScrapedDocuments(documents, countyConfig) {
    const analysis = {
      document_types: {},
      filing_relevance_distribution: {},
      procedural_areas: {},
      average_confidence: 0,
      high_priority_documents: [],
      filing_procedures_found: []
    };

    let totalConfidence = 0;

    for (const doc of documents) {
      // Document type distribution
      const docType = doc.classification?.document_type || 'UNKNOWN';
      analysis.document_types[docType] = (analysis.document_types[docType] || 0) + 1;

      // Filing relevance distribution
      const relevance = doc.classification?.filing_relevance || 'NONE';
      analysis.filing_relevance_distribution[relevance] = 
        (analysis.filing_relevance_distribution[relevance] || 0) + 1;

      // Procedural area distribution
      const area = doc.classification?.procedural_area || 'ADMINISTRATIVE';
      analysis.procedural_areas[area] = (analysis.procedural_areas[area] || 0) + 1;

      // Confidence tracking
      const confidence = doc.classification?.confidence_score || 0;
      totalConfidence += confidence;

      // High priority documents
      if (relevance === 'VERY_HIGH' || relevance === 'HIGH') {
        analysis.high_priority_documents.push({
          title: doc.title,
          url: doc.url,
          type: docType,
          relevance: relevance,
          confidence: confidence
        });
      }

      // Filing procedures
      if (doc.filing_analysis?.has_requirements) {
        analysis.filing_procedures_found.push({
          title: doc.title,
          url: doc.url,
          key_phrases: doc.filing_analysis.key_phrases
        });
      }
    }

    analysis.average_confidence = documents.length > 0 ? 
      (totalConfidence / documents.length).toFixed(1) : 0;

    return analysis;
  }

  /**
   * Sleep utility for rate limiting
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      console.log('🌐 Browser closed');
    }
  }
}

module.exports = UniversalScraper; 