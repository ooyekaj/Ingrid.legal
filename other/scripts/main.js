const path = require('path');
const ScraperConfig = require('../src/config/ScraperConfig');
const FileUtils = require('../src/utils/FileUtils');
const Logger = require('../src/utils/Logger');
const TOCExtractor = require('../src/scrapers/TOCExtractor');
const SectionFilter = require('../src/filters/SectionFilter');
const CriticalSections = require('../src/filters/CriticalSections');

class HierarchicalPDFScraper {
  constructor(options = {}) {
    this.downloadDir = options.downloadDir || ScraperConfig.DEFAULT_OPTIONS.downloadDir;
    this.outputDir = options.outputDir || ScraperConfig.DEFAULT_OPTIONS.outputDir;
    this.maxConcurrent = options.maxConcurrent || ScraperConfig.DEFAULT_OPTIONS.maxConcurrent;
    this.delay = options.delay || ScraperConfig.DEFAULT_OPTIONS.delay;
    this.baseUrl = ScraperConfig.URLS.BASE_URL;
    this.ccpTocUrl = ScraperConfig.URLS.CCP_TOC_URL;
    this.tocPdfPath = null;
  }

  async initialize() {
    await FileUtils.ensureDirectoryExists(this.downloadDir);
    await FileUtils.ensureDirectoryExists(this.outputDir);
    
    Logger.info(`Download directory: ${this.downloadDir}`);
    Logger.info(`Output directory: ${this.outputDir}`);
  }

  async getExistingProcessedRules() {
    /**
     * Check for existing processed rules from previous runs
     * Returns array of rule numbers that are less than 24 hours old
     */
    try {
      const resultsPath = path.join(this.outputDir, 'ccp_filing_rules_extraction_results.json');
      
      // Check if results file exists
      if (!(await FileUtils.fileExists(resultsPath))) {
        Logger.info('No existing results file found. Will process all rules.');
        return [];
      }

      // Read existing results
      const existingResults = await FileUtils.readJsonFile(resultsPath);
      if (!existingResults) {
        Logger.info('Failed to read existing results file. Will process all rules.');
        return [];
      }
      
      // Check if results are recent (less than 24 hours old)
      if (!existingResults.filtering_summary?.processed_at) {
        Logger.info('Existing results file has no timestamp. Will process all rules.');
        return [];
      }
      
      const processedTime = new Date(existingResults.filtering_summary.processed_at);
      const hoursOld = (Date.now() - processedTime.getTime()) / (1000 * 60 * 60);
      
      if (hoursOld > 24) {
        Logger.info(`Existing results are ${hoursOld.toFixed(1)} hours old (> 24h). Will process all rules.`);
        return [];
      }
      
      // Extract rule numbers from existing results
      const existingRuleNumbers = [];
      if (existingResults.extracted_documents && Array.isArray(existingResults.extracted_documents)) {
        for (const doc of existingResults.extracted_documents) {
          if (doc.rule_info?.ruleNumber) {
            existingRuleNumbers.push(doc.rule_info.ruleNumber);
          }
        }
      }
      
      Logger.info(`Found ${existingRuleNumbers.length} already-processed rules from ${hoursOld.toFixed(1)} hours ago.`);
      Logger.info('Will skip these rules and only process new/missing ones.');
      
      return existingRuleNumbers;
      
    } catch (error) {
      Logger.warning(`Error reading existing results: ${error.message}. Will process all rules.`);
      return [];
    }
  }

  async mergeWithExistingResults(newExtractedData, existingProcessedRules) {
    /**
     * Merge new extraction results with existing results from previous runs
     */
    try {
      if (existingProcessedRules.length === 0) {
        // No existing results to merge with
        return newExtractedData;
      }

      const resultsPath = path.join(this.outputDir, 'ccp_filing_rules_extraction_results.json');
      
      // Read existing results
      const existingResults = await FileUtils.readJsonFile(resultsPath);
      if (!existingResults) {
        Logger.warning('Failed to read existing results for merging. Using new results only.');
        return newExtractedData || [];
      }
      
      // Combine existing and new extracted documents
      const combinedDocuments = [...(existingResults.extracted_documents || [])];
      
      // Add new documents
      if (newExtractedData && Array.isArray(newExtractedData)) {
        combinedDocuments.push(...newExtractedData);
      }
      
      Logger.info(`Merged ${newExtractedData?.length || 0} new results with ${existingResults.extracted_documents?.length || 0} existing results`);
      Logger.info(`Total combined results: ${combinedDocuments.length} documents`);
      
      return combinedDocuments;
      
    } catch (error) {
      Logger.warning(`Error merging with existing results: ${error.message}. Using new results only.`);
      return newExtractedData || [];
    }
  }

  async scrapeHierarchicalPDFs() {
    await this.initialize();
    
    try {
      // Check if we need to download PDFs or just parse existing ones
      let shouldDownload = await FileUtils.shouldDownloadPDFs(this.downloadDir);
      let extractedData;
      
      if (shouldDownload) {
        Logger.section('Step 1: Downloading CCP Table of Contents PDF...');
        
        // Step 1: Download the main TOC PDF
        const tocExtractor = new TOCExtractor(this.outputDir);
        this.tocPdfPath = await tocExtractor.downloadTocPDF(this.downloadDir);
        if (!this.tocPdfPath) {
          throw new Error('Failed to download Table of Contents PDF');
        }
        
        Logger.section('Step 2: Extracting section links from TOC PDF...');
        
        // Step 2: Extract all section links from the TOC PDF
        const allSectionLinks = await tocExtractor.extractSectionLinksFromTocPDF(this.tocPdfPath);
        Logger.success(`Extracted ${allSectionLinks.length} section links from TOC PDF`);
        
        Logger.section('Step 3: Checking for existing processed rules...');
        
        // Step 3a: Get already processed rules (if any)
        const existingProcessedRules = await this.getExistingProcessedRules();
        
        Logger.subsection('Step 3b: Filtering for filing-related sections...');
        
        // Step 3b: Filter for filing-related sections
        const filingRelatedLinks = SectionFilter.filterFilingRelatedSections(allSectionLinks);
        Logger.success(`Filtered to ${filingRelatedLinks.length} filing-related sections`);
        
        // Step 3c: Remove already processed rules from the list
        const newRulesToProcess = filingRelatedLinks.filter(section => {
          return !existingProcessedRules.includes(section.ruleNumber);
        });
        
        const skippedCount = filingRelatedLinks.length - newRulesToProcess.length;
        Logger.info(`Skipping ${skippedCount} already-processed rules`);
        Logger.info(`Processing ${newRulesToProcess.length} new/missing rules`);
        
        // Continue with the rest of the processing...
        extractedData = await this.processNewRules(newRulesToProcess, existingProcessedRules);
      } else {
        // Handle existing PDFs case
        extractedData = await this.processExistingPDFs();
      }
      
      // Step 6: Save comprehensive results
      const comprehensiveResults = await this.saveResults(extractedData, shouldDownload);
      
      return comprehensiveResults;
      
    } catch (error) {
      Logger.error('Error in hierarchical scraping process:', error);
      throw error;
    }
  }

  async processNewRules(newRulesToProcess, existingProcessedRules) {
    Logger.section('Step 4: Downloading individual rule PDFs...');
    
    // Import PDFDownloader here to avoid circular dependencies
    const PDFDownloader = require('../src/scrapers/PDFDownloader');
    const PDFProcessor = require('../src/processors/PDFProcessor');
    
    const downloadedFiles = [];
    const allRuleData = [];
    
    if (newRulesToProcess.length === 0) {
      Logger.success('No new rules to process. All rules are up to date.');
      return await this.mergeWithExistingResults([], existingProcessedRules);
    }
    
    const pdfDownloader = new PDFDownloader(this.downloadDir);
    
    for (let i = 0; i < newRulesToProcess.length; i++) {
      const section = newRulesToProcess[i];
      Logger.info(`Processing section ${i + 1}/${newRulesToProcess.length}: ${section.ruleNumber} - ${section.title}`);
      
      try {
        const result = await pdfDownloader.downloadIndividualRulePDF(section, i);
        if (result) {
          downloadedFiles.push(result.filePath);
          allRuleData.push(result.ruleData);
          Logger.success(`Downloaded content for section ${section.ruleNumber}`);
        }
        
        // Add delay between downloads
        if (i < newRulesToProcess.length - 1) {
          await this.sleep(this.delay);
        }
        
      } catch (error) {
        Logger.error(`Error processing section ${section.ruleNumber}: ${error.message}`);
        continue;
      }
    }
    
    Logger.section(`Step 5: Processing ${downloadedFiles.length} downloaded files...`);
    
    if (downloadedFiles.length === 0) {
      Logger.warning('No files downloaded to process');
      return await this.mergeWithExistingResults([], existingProcessedRules);
    }
    
    // Process new files if any were downloaded
    let newExtractedData = [];
    if (downloadedFiles.length > 0) {
      const pdfProcessor = new PDFProcessor(this.outputDir);
      newExtractedData = await pdfProcessor.processFilesWithEnhancedProcessor(downloadedFiles, allRuleData);
    }
    
    // Merge with existing results
    return await this.mergeWithExistingResults(newExtractedData, existingProcessedRules);
  }

  async processExistingPDFs() {
    Logger.info('CCP section PDFs are recent (< 24 hours old). Processing existing PDFs...');
    
    // Get existing PDFs and their metadata
    const existingPDFData = await this.getExistingPDFData();
    Logger.info(`Processing ${existingPDFData.pdfPaths.length} existing PDFs...`);
    
    if (existingPDFData.pdfPaths.length === 0) {
      Logger.warning('No existing CCP section PDFs found. Forcing fresh download...');
      // Force fresh download by returning to the main flow
      return this.processFreshDownload();
    }
    
    // Check for missing critical sections
    const criticalSections = CriticalSections.getCriticalSections();
    const existingRuleNumbers = existingPDFData.ruleData.map(rule => rule.ruleNumber);
    const missingSections = criticalSections.filter(section => 
      !existingRuleNumbers.includes(section.ruleNumber)
    );
    
    if (missingSections.length > 0) {
      Logger.warning(`Found ${missingSections.length} missing critical sections. Downloading them...`);
      
      const PDFDownloader = require('../src/scrapers/PDFDownloader');
      const PDFProcessor = require('../src/processors/PDFProcessor');
      
      const pdfDownloader = new PDFDownloader(this.downloadDir);
      const downloadedFiles = [];
      const allRuleData = [...existingPDFData.ruleData];
      
      for (let i = 0; i < missingSections.length; i++) {
        const section = missingSections[i];
        Logger.info(`Downloading missing section ${i + 1}/${missingSections.length}: ${section.ruleNumber} - ${section.title}`);
        
        try {
          const result = await pdfDownloader.downloadIndividualRulePDF(section, existingPDFData.ruleData.length + i);
          if (result) {
            downloadedFiles.push(result.filePath);
            allRuleData.push(result.ruleData);
            Logger.success(`Downloaded content for section ${section.ruleNumber}`);
          }
          
          // Add delay between downloads
          if (i < missingSections.length - 1) {
            await this.sleep(this.delay);
          }
          
        } catch (error) {
          Logger.error(`Error processing section ${section.ruleNumber}: ${error.message}`);
          continue;
        }
      }
      
      // Process all files (existing + newly downloaded)
      const allPdfPaths = [...existingPDFData.pdfPaths, ...downloadedFiles];
      const pdfProcessor = new PDFProcessor(this.outputDir);
      const extractedData = await pdfProcessor.processFilesWithEnhancedProcessor(allPdfPaths, allRuleData);
      
      Logger.success(`Processed ${existingPDFData.pdfPaths.length} existing + ${downloadedFiles.length} newly downloaded = ${allPdfPaths.length} total PDFs`);
      return extractedData;
    } else {
      Logger.success('All critical sections already present in existing PDFs');
      const PDFProcessor = require('../src/processors/PDFProcessor');
      const pdfProcessor = new PDFProcessor(this.outputDir);
      return await pdfProcessor.processFilesWithEnhancedProcessor(existingPDFData.pdfPaths, existingPDFData.ruleData);
    }
  }

  async getExistingPDFData() {
    try {
      const files = await FileUtils.getFilesInDirectory(this.downloadDir, '.pdf');
      const ccpSectionPdfFiles = files.filter(file => file.startsWith('ccp_section_'));
      
      const allRuleData = [];
      
      // Extract rule information from filenames
      for (const file of ccpSectionPdfFiles) {
        // Expected format: ccp_section_XXX_YYYY-MM-DD_N.pdf
        const match = file.match(/ccp_section_([0-9.]+)_(\d{4}-\d{2}-\d{2})_(\d+)\.pdf/);
        if (match) {
          const [, sectionNum] = match;
          allRuleData.push({
            ruleNumber: sectionNum,
            title: `CCP Section ${sectionNum}`,
            url: `https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=${sectionNum}`,
            filename: file,
            source: 'existing_pdf',
            filingRelevance: { score: 8, isRelevant: true, source: 'pre_filtered' }
          });
        }
      }
      
      Logger.info(`Found ${ccpSectionPdfFiles.length} existing PDF files`);
      
      // Apply exclusion logic to existing PDFs
      const filteredRuleData = [];
      const filteredPdfPaths = [];
      
      for (let i = 0; i < allRuleData.length; i++) {
        const ruleData = allRuleData[i];
        const isFilingRelated = SectionFilter.isFilingRelatedSection(ruleData);
        
        if (isFilingRelated) {
          filteredRuleData.push(ruleData);
          filteredPdfPaths.push(path.join(this.downloadDir, ruleData.filename));
        } else {
          Logger.debug(`Excluding existing PDF: CCP ${ruleData.ruleNumber} (post-judgment enforcement)`);
        }
      }
      
      const excludedCount = allRuleData.length - filteredRuleData.length;
      Logger.success(`Filtered existing PDFs: ${filteredRuleData.length} included, ${excludedCount} excluded`);
      
      return {
        pdfPaths: filteredPdfPaths,
        ruleData: filteredRuleData
      };
      
    } catch (error) {
      Logger.error('Error getting existing PDF data:', error);
      return { pdfPaths: [], ruleData: [] };
    }
  }

  async saveResults(extractedData, shouldDownload) {
    const filteringSummary = {
      total_sections_found: shouldDownload ? 'N/A (processed from existing)' : 'N/A (used existing PDFs)',
      filing_related_sections: extractedData ? extractedData.length : 0,
      successfully_downloaded: shouldDownload ? 'N/A (processed from existing)' : 'N/A (used existing PDFs)',
      skipped_existing_rules: 0,
      new_rules_processed: 0,
      filtering_criteria: {
        focus: '6 Core Document Filing Questions',
        questions_addressed: [
          'WHEN must documents be filed? (deadlines/timing)',
          'HOW must documents be filed? (format/procedure)', 
          'WHERE must documents be filed? (venue/jurisdiction)',
          'WHAT must be included in document filings? (required components)',
          'WHO can file documents? (capacity/authority)',
          'WHAT format must documents follow? (formatting rules)'
        ],
        exclusions: [
          'Property exemptions (699.700-699.730)',
          'Substantive legal rights and outcomes',
          'Judgment enforcement procedures (unless filing-related)',
          'Trial procedures and jury management',
          'Evidence rules and witness examination'
        ],
        key_sections_included: [
          '12: Time computation for filing deadlines',
          '392-411: Venue and jurisdiction requirements',
          '425-431: Complaint and answer filing requirements',
          '430-438: Demurrer and summary judgment procedures',
          '1005-1014: Motion filing deadlines and service procedures',
          '2024-2033: Discovery filing requirements and deadlines'
        ],
        minimum_relevance_score: 8,
        requires_question_match: true
      },
      processed_at: new Date().toISOString(),
      processing_mode: shouldDownload ? 'fresh_download' : 'existing_pdfs'
    };
    
    const comprehensiveResults = {
      filtering_summary: filteringSummary,
      extracted_documents: extractedData || []
    };
    
    const resultsPath = path.join(this.outputDir, 'ccp_filing_rules_extraction_results.json');
    const success = await FileUtils.writeJsonFile(resultsPath, comprehensiveResults);
    
    if (success) {
      Logger.success(`CCP filing-focused results saved to: ${resultsPath}`);
    } else {
      Logger.error(`Failed to save results to: ${resultsPath}`);
    }
    
    return comprehensiveResults;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Usage example for the new PDF-first approach
async function main() {
  const scraper = new HierarchicalPDFScraper({
    downloadDir: './ccp_pdfs',
    outputDir: './ccp_results',
    delay: 2000,
    maxConcurrent: 2
  });

  try {
    Logger.section('Starting CCP PDF-first scraping...');
    const results = await scraper.scrapeHierarchicalPDFs();
    
    Logger.section('CCP scraping completed successfully!');
    Logger.info(`Total documents processed: ${results.extracted_documents?.length || 0}`);
    
    const successful = results.extracted_documents?.filter(d => d.file_info?.status === 'success') || [];
    Logger.success(`Successful extractions: ${successful.length}`);
    
    // Auto-run knowledge graph generation after successful scraping
    if (successful.length > 0) {
      Logger.section('Starting knowledge graph generation...');
      
      try {
        // Import and run the knowledge graph script
        const { CCPKnowledgeGraph } = require('../ccp_knowledge_graph.js');
        
        const knowledgeGraph = new CCPKnowledgeGraph({
          inputFile: './ccp_results/ccp_filing_rules_extraction_results.json',
          outputDir: './ccp_knowledge_graph'
        });

        await knowledgeGraph.initialize();
        const analysis = await knowledgeGraph.generateKnowledgeGraph();
        
        Logger.success('Knowledge graph generation completed successfully!');
        Logger.info('Knowledge Graph Stats:');
        Logger.info(`• ${analysis.totalNodes} CCP sections analyzed`);
        Logger.info(`• ${analysis.totalEdges} relationships discovered`);
        Logger.info(`• ${Object.keys(analysis.categories).length} categories identified`);
        Logger.info(`• Top connected section: CCP ${analysis.centralNodes[0]?.section} (${analysis.centralNodes[0]?.degree} connections)`);
        
        Logger.info('Generated knowledge graph files:');
        Logger.info('• ./ccp_knowledge_graph/ccp_knowledge_graph.html - Interactive visualization');
        Logger.info('• ./ccp_knowledge_graph/ccp_knowledge_graph.graphml - For Gephi/yEd analysis');
        Logger.info('• ./ccp_knowledge_graph/ccp_knowledge_graph_cytoscape.json - For web development');
        Logger.info('• ./ccp_knowledge_graph/ccp_knowledge_graph_d3.json - For D3.js visualizations');
        Logger.info('• ./ccp_knowledge_graph/analysis_report.md - Detailed analysis report');
        
        Logger.success('Open ./ccp_knowledge_graph/ccp_knowledge_graph.html in your browser to explore the interactive knowledge graph!');
        
      } catch (graphError) {
        Logger.error('Knowledge graph generation failed:', graphError.message);
        Logger.warning('CCP scraping completed successfully, but knowledge graph generation failed.');
        Logger.info('You can manually run the knowledge graph script later with: node ccp_knowledge_graph.js');
      }
    } else {
      Logger.warning('No successful extractions found. Skipping knowledge graph generation.');
    }
    
  } catch (error) {
    Logger.error('CCP scraping failed:', error);
  }
}

// Export for use as module
module.exports = { HierarchicalPDFScraper };

// Run if executed directly
if (require.main === module) {
  main();
} 