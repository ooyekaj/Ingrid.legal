const ScraperConfig = require('../src/config/ScraperConfig');
const ContentAnalyzer = require('../src/processors/ContentAnalyzer');
const PythonScriptGenerator = require('../src/utils/PythonScriptGenerator');
const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');
const { chromium } = require('playwright');

/**
 * Enhanced HierarchicalPDFScraper with comprehensive metadata extraction
 * Supports enterprise-level CCP/CRC rule analysis and tracking
 */
class EnhancedHierarchicalPDFScraper {
  constructor(options = {}) {
    this.options = { ...ScraperConfig.DEFAULT_OPTIONS, ...options };
    this.downloadDir = this.options.downloadDir;
    this.outputDir = this.options.outputDir;
    this.maxConcurrent = this.options.maxConcurrent;
    this.delay = this.options.delay;
    this.baseUrl = ScraperConfig.URLS.BASE_URL;
    this.ccpTocUrl = ScraperConfig.URLS.CCP_TOC_URL;
    this.tocPdfPath = null;
    this.contentAnalyzer = new ContentAnalyzer();
  }

  async initialize() {
    await fs.mkdir(this.downloadDir, { recursive: true });
    await fs.mkdir(this.outputDir, { recursive: true });
    
    console.log(`📁 Enhanced CCP Scraper Initialized`);
    console.log(`   Download directory: ${this.downloadDir}`);
    console.log(`   Output directory: ${this.outputDir}`);
    console.log(`   Enhanced metadata: ENABLED`);
    console.log(`   Filing questions: 6 categories`);
    console.log(`   Cross-references: CCP, CRC, Evidence Code, Local, Federal`);
  }

  async scrapeHierarchicalPDFs() {
    await this.initialize();
    
    try {
      // Check if we need to download PDFs or just parse existing ones
      let shouldDownload = await this.shouldDownloadPDFs();
      let extractedData;
      
      if (shouldDownload) {
        console.log('\n🔍 Step 1: Downloading CCP Table of Contents PDF...');
        
        // Step 1: Download the main TOC PDF
        this.tocPdfPath = await this.downloadTocPDF();
        if (!this.tocPdfPath) {
          throw new Error('Failed to download Table of Contents PDF');
        }
        
        console.log('\n🔍 Step 2: Extracting section links from TOC PDF...');
        
        // Step 2: Extract all section links from the TOC PDF
        const allSectionLinks = await this.extractSectionLinksFromTocPDF(this.tocPdfPath);
        console.log(`✅ Extracted ${allSectionLinks.length} section links from TOC PDF`);
        
        console.log('\n🔍 Step 3: Checking for existing processed rules...');
        
        // Step 3a: Get already processed rules (if any)
        const existingProcessedRules = await this.getExistingProcessedRules();
        
        console.log('\n🔍 Step 3b: Filtering for filing-related sections...');
        
        // Step 3b: Filter for filing-related sections
        const filingRelatedLinks = this.filterFilingRelatedSections(allSectionLinks);
        console.log(`✅ Filtered to ${filingRelatedLinks.length} filing-related sections`);
        
        // Step 3c: Remove already processed rules from the list
        const newRulesToProcess = filingRelatedLinks.filter(section => {
          return !existingProcessedRules.includes(section.ruleNumber);
        });
        
        const skippedCount = filingRelatedLinks.length - newRulesToProcess.length;
        console.log(`📋 Skipping ${skippedCount} already-processed rules`);
        console.log(`🔍 Processing ${newRulesToProcess.length} new/missing rules`);
        
        console.log('\n🔍 Step 4: Downloading individual rule PDFs...');
        
        // Step 4: Download PDFs for new/missing sections only
        const downloadedFiles = [];
        const allRuleData = [];
        
        if (newRulesToProcess.length === 0) {
          console.log('✅ No new rules to process. All rules are up to date.');
        }
        
        for (let i = 0; i < newRulesToProcess.length; i++) {
          const section = newRulesToProcess[i];
          console.log(`\n  📋 Processing section ${i + 1}/${newRulesToProcess.length}: ${section.ruleNumber} - ${section.title}`);
          
          try {
            const result = await this.downloadIndividualRulePDF(section, i);
            if (result) {
              downloadedFiles.push(result.filePath);
              allRuleData.push(result.ruleData);
              console.log(`    ✅ Downloaded content for section ${section.ruleNumber}`);
            }
                
            // Add delay between downloads
            if (i < newRulesToProcess.length - 1) {
              await this.sleep(this.delay);
            }
            
          } catch (error) {
            console.error(`    ❌ Error processing section ${section.ruleNumber}:`, error.message);
            continue;
          }
        }
        
        console.log(`\n🔍 Step 5: Processing ${downloadedFiles.length} files with ENHANCED analyzer...`);
        
        if (downloadedFiles.length === 0) {
          console.log('⚠️  No files downloaded to process');
          return [];
        }
        
        // Process new files if any were downloaded
        let newExtractedData = [];
        if (downloadedFiles.length > 0) {
          console.log(`🧠 Using enhanced PyMuPDF script with comprehensive metadata extraction...`);
          newExtractedData = await this.processFilesWithEnhancedProcessor(downloadedFiles, allRuleData);
        }
        
        console.log(`\n🔍 Step 6: Merging with existing results...`);
        extractedData = await this.mergeWithExistingResults(newExtractedData, existingProcessedRules);
      } else {
        console.log('\n🔍 Using existing PDF data (< 24 hours old)...');
        extractedData = await this.getExistingPDFData();
      }
      
      // Enhanced results structure
      const results = {
        extraction_summary: {
          total_documents: extractedData.length,
          successful_extractions: extractedData.filter(d => d.file_info?.status === 'success').length,
          failed_extractions: extractedData.filter(d => d.file_info?.status === 'error').length,
          processing_method: shouldDownload ? 'fresh_download' : 'existing_cache',
          enhanced_metadata: true,
          filing_questions_analyzed: 6,
          metadata_version: '2.0',
          processed_at: new Date().toISOString()
        },
        filtering_summary: {
          total_sections_available: 'unknown',
          filing_related_sections: extractedData.length,
          processed_at: new Date().toISOString()
        },
        extracted_documents: extractedData
      };
      
      // Save enhanced results
      const outputPath = path.join(this.outputDir, 'ccp_filing_rules_extraction_results.json');
      await fs.writeFile(outputPath, JSON.stringify(results, null, 2));
      
      console.log(`\n✅ Enhanced extraction completed!`);
      console.log(`📁 Results saved to: ${outputPath}`);
      console.log(`📊 Enhanced Analysis Summary:`);
      console.log(`   • Total documents: ${results.extraction_summary.total_documents}`);
      console.log(`   • Successful extractions: ${results.extraction_summary.successful_extractions}`);
      console.log(`   • Failed extractions: ${results.extraction_summary.failed_extractions}`);
      console.log(`   • Metadata version: ${results.extraction_summary.metadata_version}`);
      console.log(`   • Filing questions analyzed: ${results.extraction_summary.filing_questions_analyzed}`);
      
      return results;
      
    } catch (error) {
      console.error('❌ Error in enhanced CCP scraping:', error);
      throw error;
    }
  }

  async processFilesWithEnhancedProcessor(filePaths, ruleData) {
    console.log(`🧠 Processing ${filePaths.length} files with enhanced metadata extraction...`);
    
    // Filter to only PDF files
    const pdfPaths = filePaths.filter(filePath => 
      filePath.toLowerCase().endsWith('.pdf')
    );
    
    if (pdfPaths.length > 0) {
      console.log(`📄 Processing ${pdfPaths.length} PDF files with enhanced PyMuPDF...`);
      return await this.processPDFsWithEnhancedPyMuPDF(pdfPaths, ruleData);
    }
    
    // Fallback to web-scraped content processing
    const jsonPaths = filePaths.filter(filePath => 
      filePath.toLowerCase().endsWith('.json')
    );
    
    if (jsonPaths.length > 0) {
      console.log(`🌐 Processing ${jsonPaths.length} web-scraped JSON files...`);
      return await this.processWebScrapedJSON(jsonPaths, ruleData);
    }
    
    return [];
  }

  async processPDFsWithEnhancedPyMuPDF(pdfPaths, ruleData) {
    console.log(`🐍 Generating enhanced PyMuPDF script for ${pdfPaths.length} files...`);
    
    const pythonScript = PythonScriptGenerator.generateEnhancedPyMuPDFScript(pdfPaths, ruleData);
    const scriptPath = path.join(this.outputDir, 'enhanced_pymupdf_script.py');
    
    try {
      await fs.writeFile(scriptPath, pythonScript);
      console.log(`📄 Enhanced script saved to: ${scriptPath}`);
      
      console.log(`🔄 Executing enhanced PyMuPDF extraction...`);
      const result = await this.executePythonScript(scriptPath);
      
      if (result.success) {
        console.log(`✅ Enhanced PyMuPDF extraction completed successfully`);
        return result.data.extracted_documents || [];
      } else {
        console.error(`❌ Enhanced PyMuPDF extraction failed:`, result.error);
        return [];
      }
      
    } catch (error) {
      console.error(`❌ Error in enhanced PDF processing:`, error);
      return [];
    }
  }

  async executePythonScript(scriptPath) {
    return new Promise((resolve) => {
      const python = spawn('python3', [scriptPath], {
        cwd: path.dirname(scriptPath),
        stdio: ['inherit', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      python.stdout.on('data', (data) => {
        const output = data.toString();
        stdout += output;
        // Show progress in real-time
        if (output.includes('Processing') || output.includes('✅') || output.includes('❌')) {
          process.stdout.write(output);
        }
      });

      python.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      python.on('close', async (code) => {
        if (code === 0) {
          try {
            // Look for the results file
            const resultsPath = path.join(path.dirname(scriptPath), 'enhanced_ccp_extraction_results.json');
            const resultsContent = await fs.readFile(resultsPath, 'utf8');
            const results = JSON.parse(resultsContent);
            
            resolve({
              success: true,
              data: results,
              stdout,
              stderr
            });
          } catch (error) {
            resolve({
              success: false,
              error: `Failed to read results: ${error.message}`,
              stdout,
              stderr
            });
          }
        } else {
          resolve({
            success: false,
            error: `Python script exited with code ${code}`,
            stdout,
            stderr
          });
        }
      });
    });
  }

  // Include necessary methods from original scraper
  filterFilingRelatedSections(allSectionLinks) {
    console.log(`🔍 Filtering ${allSectionLinks.length} sections for filing relevance...`);
    
    const filingRelated = [];
    const criticalSections = this.getCriticalSections();
    
    for (const section of allSectionLinks) {
      if (this.isFilingRelatedSection(section)) {
        // Add filing relevance analysis
        section.filingRelevance = this.analyzeFilingRelevance(section);
        filingRelated.push(section);
      }
    }
    
    // Sort by filing relevance score (highest first)
    filingRelated.sort((a, b) => (b.filingRelevance?.score || 0) - (a.filingRelevance?.score || 0));
    
    console.log(`✅ Found ${filingRelated.length} filing-related sections`);
    return filingRelated;
  }

  analyzeFilingRelevance(section) {
    const title = section.title.toLowerCase();
    const sectionNum = parseFloat(section.ruleNumber.replace(/[a-z]/g, ''));
    
    let score = 0;
    const matchedKeywords = [];
    const filingQuestions = [];
    
    // Check against filing question keywords
    for (const [questionType, config] of Object.entries(ScraperConfig.FILING_QUESTIONS)) {
      const keywords = config.keywords;
      const matchedInTitle = keywords.filter(keyword => title.includes(keyword.toLowerCase()));
      
      if (matchedInTitle.length > 0) {
        score += matchedInTitle.length * 10;
        matchedKeywords.push(...matchedInTitle);
        filingQuestions.push(questionType.toLowerCase());
      }
    }
    
    // Critical sections get bonus points
    const criticalSections = this.getCriticalSections();
    if (criticalSections.some(critical => critical.section === section.ruleNumber)) {
      score += 50;
    }
    
    return {
      score,
      matchedKeywords: [...new Set(matchedKeywords)],
      filingQuestions: [...new Set(filingQuestions)],
      category: this.categorizeSection(sectionNum, title)
    };
  }

  categorizeSection(sectionNumber, title) {
    const num = parseFloat(sectionNumber.toString().replace(/[a-z]/g, ''));
    const titleLower = title.toLowerCase();
    
    // Use the same categorization logic as the knowledge graph
    if (num >= 1000 && num <= 1020) return 'Service & Notice';
    if (num >= 420 && num <= 475) return 'Pleadings';
    if (num >= 430 && num <= 437) return 'Motions';
    if (num >= 2016 && num <= 2033) return 'Discovery';
    
    // Content-based categorization
    if (titleLower.includes('filing') || titleLower.includes('service')) return 'Filing & Service';
    if (titleLower.includes('motion')) return 'Motion Practice';
    if (titleLower.includes('judgment')) return 'Judgment Procedures';
    if (titleLower.includes('venue') || titleLower.includes('jurisdiction')) return 'Venue & Jurisdiction';
    
    return 'General Procedures';
  }

  getCriticalSections() {
    // Enhanced critical sections for comprehensive analysis
    return [
      // Service and Notice (WHEN, HOW, WHO)
      { section: '1011', question: 'WHEN', description: 'Service hours - 8am to 8pm weekdays, 9am to 5pm weekends' },
      { section: '1012', question: 'HOW', description: 'Personal service methods and procedures' },
      { section: '1013', question: 'HOW', description: 'Service by mail procedures' },
      { section: '1010.6', question: 'HOW', description: 'Electronic service requirements' },
      { section: '415.10', question: 'HOW', description: 'Personal service on individuals' },
      { section: '415.20', question: 'HOW', description: 'Substitute service procedures' },
      
      // Pleadings and Motions (WHAT, FORMAT, WHEN)
      { section: '425.10', question: 'WHAT', description: 'Complaint requirements and format' },
      { section: '431.30', question: 'WHAT', description: 'Answer requirements and format' },
      { section: '472', question: 'WHEN', description: 'Amendment of pleadings timing' },
      { section: '430.10', question: 'WHEN', description: 'Demurrer filing deadlines' },
      { section: '435', question: 'WHEN', description: 'Motion to strike timing' },
      { section: '437c', question: 'WHEN', description: 'Summary judgment motion timing' },
      
      // Venue and Jurisdiction (WHERE)
      { section: '392', question: 'WHERE', description: 'Venue determination rules' },
      { section: '395', question: 'WHERE', description: 'Proper county for filing' },
      { section: '396b', question: 'WHERE', description: 'Motion to change venue' },
      
      // Format and Requirements (FORMAT)
      { section: '1010', question: 'FORMAT', description: 'Service and filing format requirements' },
      { section: '1013a', question: 'FORMAT', description: 'Proof of service format' },
      { section: '128.7', question: 'FORMAT', description: 'Attorney signature requirements' }
    ];
  }

  isFilingRelatedSection(section) {
    const title = section.title.toLowerCase();
    const sectionNum = parseFloat(section.ruleNumber.replace(/[a-z]/g, ''));
    
    // Check against post-judgment enforcement exclusions
    const exclusions = ScraperConfig.POST_JUDGMENT_EXCLUSIONS;
    
    // Check range exclusions
    for (const range of exclusions.ranges) {
      if (sectionNum >= range.start && sectionNum <= range.end) {
        return false;
      }
    }
    
    // Check term exclusions
    for (const term of exclusions.terms) {
      if (title.includes(term.toLowerCase())) {
        return false;
      }
    }
    
    // Check for filing-related keywords
    const filingKeywords = [
      ...ScraperConfig.FILING_QUESTIONS.WHEN.keywords,
      ...ScraperConfig.FILING_QUESTIONS.HOW.keywords,
      ...ScraperConfig.FILING_QUESTIONS.WHAT.keywords,
      ...ScraperConfig.FILING_QUESTIONS.WHERE.keywords,
      ...ScraperConfig.FILING_QUESTIONS.WHO.keywords,
      ...ScraperConfig.FILING_QUESTIONS.FORMAT.keywords
    ];
    
    return filingKeywords.some(keyword => title.includes(keyword.toLowerCase()));
  }

  // Include other necessary methods from the original scraper
  async shouldDownloadPDFs() {
    try {
      const resultsPath = path.join(this.outputDir, 'ccp_filing_rules_extraction_results.json');
      const stats = await fs.stat(resultsPath);
      const fileAge = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60); // hours
      return fileAge > this.options.ruleAgeThreshold;
    } catch {
      return true; // File doesn't exist, need to download
    }
  }

  async getExistingProcessedRules() {
    try {
      const resultsPath = path.join(this.outputDir, 'ccp_filing_rules_extraction_results.json');
      const data = JSON.parse(await fs.readFile(resultsPath, 'utf8'));
      
      if (!data.filtering_summary?.processed_at) return [];
      
      const processedTime = new Date(data.filtering_summary.processed_at);
      const hoursOld = (Date.now() - processedTime.getTime()) / (1000 * 60 * 60);
      
      if (hoursOld > this.options.ruleAgeThreshold) return [];
      
      return data.extracted_documents
        ?.filter(doc => doc.rule_info?.ruleNumber)
        .map(doc => doc.rule_info.ruleNumber) || [];
    } catch {
      return [];
    }
  }

  async mergeWithExistingResults(newExtractedData, existingProcessedRules) {
    if (existingProcessedRules.length === 0) {
      return newExtractedData || [];
    }

    try {
      const resultsPath = path.join(this.outputDir, 'ccp_filing_rules_extraction_results.json');
      const existingResults = JSON.parse(await fs.readFile(resultsPath, 'utf8'));
      
      const combinedDocuments = [...(existingResults.extracted_documents || [])];
      
      if (newExtractedData && Array.isArray(newExtractedData)) {
        combinedDocuments.push(...newExtractedData);
      }
      
      console.log(`📋 Merged ${newExtractedData?.length || 0} new results with ${existingResults.extracted_documents?.length || 0} existing results`);
      
      return combinedDocuments;
    } catch (error) {
      console.log(`⚠️  Error merging results: ${error.message}. Using new results only.`);
      return newExtractedData || [];
    }
  }

  async getExistingPDFData() {
    try {
      const resultsPath = path.join(this.outputDir, 'ccp_filing_rules_extraction_results.json');
      const data = JSON.parse(await fs.readFile(resultsPath, 'utf8'));
      return data.extracted_documents || [];
    } catch {
      return [];
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Implemented methods from the original scraper
  async downloadTocPDF() {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
      console.log(`    🔗 Accessing TOC page: ${this.ccpTocUrl}`);
      
      await page.goto(this.ccpTocUrl, { 
        waitUntil: 'domcontentloaded',
        timeout: 15000 
      });
      
      console.log(`    ✅ Page loaded successfully`);
      await page.waitForTimeout(2000);
      
      const pdfPath = path.join(this.downloadDir, 'ccp_toc.pdf');
      
      console.log(`    🔍 Looking for print button...`);
      
      const printSelectors = [
        '#codes_print a',
        'a[title*="Print"]',
        'a[onclick*="window.print"]',
        'img[alt="print page"]',
        'button:has-text("print"), a:has-text("print"), button:has-text("PDF"), a:has-text("PDF")',
        '[title*="print"], [title*="PDF"]'
      ];
      
      let printButton = null;
      for (const selector of printSelectors) {
        try {
          const buttons = await page.$$(selector);
          if (buttons.length > 0) {
            printButton = buttons[0];
            console.log(`    🖨️  Found print button with selector: ${selector}`);
            break;
          }
        } catch (error) {
          continue;
        }
      }
      
      if (printButton) {
        console.log(`    🖨️  Attempting to trigger print dialog...`);
        
        try {
          const downloadPromise = page.waitForDownload({ timeout: 30000 }).catch(() => null);
          await printButton.click();
          await page.waitForTimeout(2000);
          
          const download = await downloadPromise;
          if (download) {
            await download.saveAs(pdfPath);
            console.log(`    ✅ Downloaded TOC PDF via print button to: ${pdfPath}`);
            await browser.close();
            return pdfPath;
          }
        } catch (error) {
          console.log(`    ⚠️  Print button click failed: ${error.message}`);
        }
      }
      
      console.log(`    📄 Using print-to-PDF fallback...`);
      await page.pdf({
        path: pdfPath,
        format: 'A4',
        printBackground: true,
        margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' }
      });
      
      console.log(`    ✅ Generated TOC PDF to: ${pdfPath}`);
      await browser.close();
      return pdfPath;
      
    } catch (error) {
      await browser.close();
      throw new Error(`Failed to download TOC PDF: ${error.message}`);
    }
  }

  async extractSectionLinksFromTocPDF(tocPdfPath) {
    return new Promise((resolve, reject) => {
      const pythonScript = PythonScriptGenerator.generateTocExtractionScript(tocPdfPath);
      const scriptPath = path.join(this.outputDir, 'extract_toc_links.py');
      
      fs.writeFile(scriptPath, pythonScript)
        .then(() => {
          console.log('🐍 Running TOC link extraction script...');
          
          const pythonProcess = spawn('python3', [scriptPath], {
            stdio: ['inherit', 'pipe', 'pipe']
          });
          
          let output = '';
          let error = '';
          
          pythonProcess.stdout.on('data', (data) => {
            const text = data.toString();
            output += text;
            console.log(text.trim());
          });
          
          pythonProcess.stderr.on('data', (data) => {
            const text = data.toString();
            error += text;
            console.error(text.trim());
          });
          
          pythonProcess.on('close', (code) => {
            if (code === 0) {
              try {
                const resultsPath = path.join(this.outputDir, 'toc_links.json');
                fs.readFile(resultsPath, 'utf8')
                  .then(data => {
                    const links = JSON.parse(data);
                    resolve(links);
                  })
                  .catch(err => reject(new Error(`Failed to read TOC links: ${err.message}`)));
              } catch (parseError) {
                reject(new Error(`Failed to parse TOC links: ${parseError.message}`));
              }
            } else {
              reject(new Error(`TOC extraction script failed with code ${code}: ${error}`));
            }
          });
        })
        .catch(reject);
    });
  }

  async downloadIndividualRulePDF(section, index) {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
      const sectionUrl = section.url;
      console.log(`    📋 Accessing: ${sectionUrl}`);
      
      await page.goto(sectionUrl, { 
        waitUntil: 'domcontentloaded',
        timeout: 15000 
      });
      
      await page.waitForTimeout(2000);
      
      const filename = this.generateRuleFilename(section, index);
      const filePath = path.join(this.downloadDir, filename);
      
      // Try PDF download first
      let pdfDownloaded = false;
      
      // Look for PDF link
      const pdfSelectors = ScraperConfig.SELECTORS.PDF_LINKS;
      const pdfLinks = await page.$$(pdfSelectors);
      
      if (pdfLinks.length > 0) {
        try {
          const downloadPromise = page.waitForDownload({ timeout: 15000 });
          await pdfLinks[0].click();
          const download = await downloadPromise;
          await download.saveAs(filePath);
          pdfDownloaded = true;
          console.log(`    ✅ Downloaded PDF: ${filename}`);
        } catch (error) {
          console.log(`    ⚠️  PDF download failed: ${error.message}`);
        }
      }
      
      if (!pdfDownloaded) {
        // Fallback to web scraping
        console.log(`    🌐 Falling back to web content scraping...`);
        const webFilePath = filePath.replace('.pdf', '.json');
        await this.scrapeWebPageContent(page, webFilePath);
        await browser.close();
        return {
          filePath: webFilePath,
          ruleData: {
            ruleNumber: section.ruleNumber,
            title: section.title,
            url: section.url
          }
        };
      }
      
      await browser.close();
      return {
        filePath: filePath,
        ruleData: {
          ruleNumber: section.ruleNumber,
          title: section.title,
          url: section.url
        }
      };
      
    } catch (error) {
      await browser.close();
      throw new Error(`Failed to download section ${section.ruleNumber}: ${error.message}`);
    }
  }

  async scrapeWebPageContent(page, filePath) {
    try {
      const contentSelectors = ScraperConfig.SELECTORS.CONTENT_AREA;
      
      // Extract content from multiple possible content areas
      let content = await page.evaluate((selectors) => {
        const contentAreas = document.querySelectorAll(selectors);
        let fullContent = '';
        
        contentAreas.forEach(area => {
          if (area && area.textContent) {
            fullContent += area.textContent + '\n\n';
          }
        });
        
        return fullContent.trim();
      }, contentSelectors);
      
      if (!content || content.length < 50) {
        // Fallback: get all text content
        content = await page.evaluate(() => document.body.textContent || '');
      }
      
      // Filter out navigation and irrelevant content
      const lines = content.split('\n').filter(line => {
        const cleanLine = line.trim();
        return cleanLine.length > 10 && 
               !cleanLine.includes('Skip to main content') &&
               !cleanLine.includes('California Legislative Information') &&
               !cleanLine.includes('Contact Us');
      });
      
      const cleanContent = lines.join('\n').trim();
      
      const webData = {
        content: cleanContent,
        url: page.url(),
        scraped_at: new Date().toISOString(),
        content_length: cleanContent.length
      };
      
      await fs.writeFile(filePath, JSON.stringify(webData, null, 2));
      console.log(`    📄 Web content saved: ${path.basename(filePath)}`);
      
    } catch (error) {
      throw new Error(`Failed to scrape web content: ${error.message}`);
    }
  }

  async processWebScrapedJSON(jsonPaths, ruleData) {
    const results = [];
    
    for (let i = 0; i < jsonPaths.length; i++) {
      const jsonPath = jsonPaths[i];
      const ruleInfo = ruleData[i] || {};
      
      try {
        const webData = JSON.parse(await fs.readFile(jsonPath, 'utf8'));
        
        // Use enhanced content analyzer
        const analysis = this.contentAnalyzer.analyzeContent(webData.content, ruleInfo);
        
        const result = {
          rule_info: ruleInfo,
          file_info: {
            file_path: jsonPath,
            file_name: path.basename(jsonPath),
            status: "success",
            content_type: "web_scraped"
          },
          content: {
            full_text: webData.content,
            pages: [{
              page: 1,
              text: webData.content
            }],
            character_count: webData.content.length,
            word_count: webData.content.split(/\s+/).length
          },
          ccp_analysis: analysis,
          extracted_at: new Date().toISOString()
        };
        
        results.push(result);
        console.log(`✅ Enhanced analysis: ${result.content.word_count} words`);
        
      } catch (error) {
        console.error(`❌ Error processing ${jsonPath}: ${error.message}`);
        results.push({
          rule_info: ruleInfo,
          file_info: {
            file_path: jsonPath,
            file_name: path.basename(jsonPath),
            status: "error",
            error: error.message,
            content_type: "web_scraped"
          },
          extracted_at: new Date().toISOString()
        });
      }
    }
    
    return results;
  }

  generateRuleFilename(section, index) {
    const paddedIndex = String(index + 1).padStart(3, '0');
    const sectionNum = section.ruleNumber.replace(/[^a-zA-Z0-9.]/g, '_');
    return `${paddedIndex}_CCP_${sectionNum}.pdf`;
  }
}

// Usage example
async function main() {
  const scraper = new EnhancedHierarchicalPDFScraper({
    downloadDir: './ccp_pdfs',
    outputDir: './ccp_results',
    delay: 2000,
    maxConcurrent: 2,
    ruleAgeThreshold: 24
  });

  try {
    console.log('🚀 Starting Enhanced CCP Scraping with Comprehensive Metadata...');
    console.log('📊 Features: Rule Status Tracking, Filing Question Analysis, Enhanced Cross-References');
    console.log('🎯 Target: Enterprise-level CCP/CRC Rule Analysis');
    
    const results = await scraper.scrapeHierarchicalPDFs();
    
    console.log('\n🎉 Enhanced CCP scraping completed successfully!');
    console.log(`📊 Enhanced Analysis Results:`);
    console.log(`   • Total documents: ${results.extraction_summary?.total_documents || 0}`);
    console.log(`   • Success rate: ${results.extraction_summary?.successful_extractions}/${results.extraction_summary?.total_documents}`);
    console.log(`   • Metadata version: ${results.extraction_summary?.metadata_version}`);
    console.log(`   • Filing questions: ${results.extraction_summary?.filing_questions_analyzed}`);
    
    return results;
    
  } catch (error) {
    console.error('❌ Enhanced CCP scraping failed:', error);
    throw error;
  }
}

module.exports = { EnhancedHierarchicalPDFScraper };

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
} 