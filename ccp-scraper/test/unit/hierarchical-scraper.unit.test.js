const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');
const { HierarchicalPDFScraper } = require('../../hierarchial_scraper');
const { 
  mockTocLinks, 
  mockPDFAnalysis, 
  mockMixedSections, 
  mockErrors, 
  mockFileSystemData,
  mockWebScrapedContent
} = require('../fixtures/mockData');
const TestHelpers = require('../utils/testHelpers');

// Mock external dependencies
jest.mock('playwright', () => ({
  chromium: {
    launch: jest.fn()
  }
}));

jest.mock('fs', () => ({
  promises: {
    mkdir: jest.fn(),
    writeFile: jest.fn(),
    readFile: jest.fn(),
    readdir: jest.fn(),
    stat: jest.fn(),
    access: jest.fn(),
    unlink: jest.fn(),
    open: jest.fn(),
    rmdir: jest.fn()
  }
}));

jest.mock('child_process', () => ({
  spawn: jest.fn()
}));

describe('HierarchicalPDFScraper - Unit Tests', () => {
  let scraper;
  let mockBrowser;
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create fresh scraper instance
    scraper = new HierarchicalPDFScraper({
      downloadDir: './test/mock_downloads',
      outputDir: './test/temp',
      delay: 10, // Fast for tests
      maxConcurrent: 1
    });
    
    // Setup mock browser
    mockBrowser = TestHelpers.createMockBrowser();
  });

  describe('Constructor and Initialization', () => {
    test('should initialize with default options', () => {
      const defaultScraper = new HierarchicalPDFScraper();
      
      expect(defaultScraper.downloadDir).toBe('./downloaded_pdfs');
      expect(defaultScraper.outputDir).toBe('./extracted_content');
      expect(defaultScraper.maxConcurrent).toBe(3);
      expect(defaultScraper.delay).toBe(2000);
      expect(defaultScraper.baseUrl).toBe('https://leginfo.legislature.ca.gov');
    });

    test('should initialize with custom options', () => {
      const customScraper = new HierarchicalPDFScraper({
        downloadDir: './custom/downloads',
        outputDir: './custom/output',
        maxConcurrent: 5,
        delay: 1000
      });
      
      expect(customScraper.downloadDir).toBe('./custom/downloads');
      expect(customScraper.outputDir).toBe('./custom/output');
      expect(customScraper.maxConcurrent).toBe(5);
      expect(customScraper.delay).toBe(1000);
    });

    test('should create directories during initialization', async () => {
      fs.mkdir.mockResolvedValue(undefined);
      
      await scraper.initialize();
      
      expect(fs.mkdir).toHaveBeenCalledWith(scraper.downloadDir, { recursive: true });
      expect(fs.mkdir).toHaveBeenCalledWith(scraper.outputDir, { recursive: true });
    });

    test('should handle directory creation errors gracefully', async () => {
      fs.mkdir.mockRejectedValue(new Error('Permission denied'));
      
      await expect(scraper.initialize()).rejects.toThrow('Permission denied');
    });
  });

  describe('Section Filtering Logic', () => {
    test('should identify filing-related sections by number range', () => {
      const testSections = [
        { ruleNumber: '437c', title: 'Summary Judgment' },
        { ruleNumber: '1005', title: 'Motion Deadlines' },
        { ruleNumber: '100', title: 'General Provisions' }, // Should be filtered out
        { ruleNumber: '1010.6', title: 'Electronic Filing' },
        { ruleNumber: '2025.010', title: 'Deposition Procedures' }
      ];

      const filingRelated = testSections.filter(section => 
        scraper.isFilingRelatedSection(section)
      );

      expect(filingRelated.length).toBeGreaterThanOrEqual(4);
      expect(filingRelated.map(s => s.ruleNumber)).toContain('437c');
      expect(filingRelated.map(s => s.ruleNumber)).toContain('1005');
      expect(filingRelated.map(s => s.ruleNumber)).toContain('1010.6');
      expect(filingRelated.map(s => s.ruleNumber)).toContain('2025.010');
      expect(filingRelated.map(s => s.ruleNumber)).not.toContain('100');
    });

    test('should identify filing-related sections by keywords', () => {
      const testSections = [
        { ruleNumber: '999', title: 'Document Filing Requirements' },
        { ruleNumber: '998', title: 'Service of Process Rules' },
        { ruleNumber: '997', title: 'General Contract Law' }, // Should be filtered out
        { ruleNumber: '996', title: 'Motion Practice Guidelines' },
        { ruleNumber: '995', title: 'Pleading Format Standards' }
      ];

      const filingRelated = testSections.filter(section => 
        scraper.isFilingRelatedSection(section)
      );

      expect(filingRelated.length).toBeGreaterThanOrEqual(4);
      expect(filingRelated.map(s => s.ruleNumber)).toContain('999');
      expect(filingRelated.map(s => s.ruleNumber)).toContain('998');
      expect(filingRelated.map(s => s.ruleNumber)).toContain('996');
      expect(filingRelated.map(s => s.ruleNumber)).toContain('995');
      expect(filingRelated.map(s => s.ruleNumber)).not.toContain('997');
    });

    test('should handle mixed section filtering correctly', () => {
      const filtered = scraper.filterFilingRelatedSections(mockMixedSections);
      
      // Should include pre-defined critical sections even if not in input
      const criticalSections = ['437c', '1005', '1010', '1010.6'];
      const foundCritical = filtered.filter(s => 
        criticalSections.includes(s.ruleNumber)
      );
      
      expect(foundCritical.length).toBeGreaterThanOrEqual(criticalSections.length);
    });

    test('should include all enhanced critical sections', () => {
      const minimalSections = [
        { ruleNumber: '999', title: 'Test Section' }
      ];
      
      const filtered = scraper.filterFilingRelatedSections(minimalSections);
      const ruleNumbers = filtered.map(s => s.ruleNumber);
      
      // 1. Service and Filing Rules (CCP 1000-1020)
      expect(ruleNumbers).toContain('1005');
      expect(ruleNumbers).toContain('1010');
      expect(ruleNumbers).toContain('1010.6');
      expect(ruleNumbers).toContain('1013');
      expect(ruleNumbers).toContain('1019.5');
      
      // 2. Motion Practice and Format Requirements
      expect(ruleNumbers).toContain('473');
      expect(ruleNumbers).toContain('128.7');
      expect(ruleNumbers).toContain('170.6');
      expect(ruleNumbers).toContain('594');
      
      // 3. Case Management and Scheduling
      expect(ruleNumbers).toContain('583.210');
      expect(ruleNumbers).toContain('12');
      expect(ruleNumbers).toContain('2024.020');
      
      // 4. Specific Motion Requirements
      expect(ruleNumbers).toContain('1287');
      expect(ruleNumbers).toContain('1094.5');
      
      // 5. Discovery Motion Deadlines
      expect(ruleNumbers).toContain('2030.300');
      expect(ruleNumbers).toContain('2031.310');
      expect(ruleNumbers).toContain('2025.480');
      
      // 6. Ex Parte Procedures and TRO
      expect(ruleNumbers).toContain('527');
    });
    
    test('should recognize enhanced keyword patterns', () => {
      const keywordSections = [
        { ruleNumber: '8001', title: 'Motion deadline requirements (16 court days notice)' },
        { ruleNumber: '8002', title: 'Electronic service procedures' },
        { ruleNumber: '8003', title: 'Time extensions for mail service (+5 days in CA)' },
        { ruleNumber: '8004', title: 'Frivolous filing sanctions' },
        { ruleNumber: '8005', title: 'Peremptory challenge to judge' },
        { ruleNumber: '8006', title: 'Discovery cutoff deadlines (30 days before trial)' },
        { ruleNumber: '8007', title: 'Motion to compel interrogatory responses (45-day deadline)' },
        { ruleNumber: '8008', title: 'Temporary restraining order procedures' },
        { ruleNumber: '8009', title: 'Administrative mandate procedures' },
        { ruleNumber: '8010', title: 'Time computation rules' }
      ];

      const filingRelated = keywordSections.filter(section => 
        scraper.isFilingRelatedSection(section)
      );

      expect(filingRelated.length).toBe(10); // All should be included
      expect(filingRelated.map(s => s.ruleNumber)).toEqual(
        expect.arrayContaining(['8001', '8002', '8003', '8004', '8005', '8006', '8007', '8008', '8009', '8010'])
      );
    });

    test('should exclude sections with exclusion terms', () => {
      const testSections = [
        { ruleNumber: '500', title: 'Criminal Procedure Rules' },
        { ruleNumber: '501', title: 'Evidence Rules for Trial' },
        { ruleNumber: '502', title: 'Filing Requirements' } // Should be included
      ];

      const filingRelated = testSections.filter(section => 
        scraper.isFilingRelatedSection(section)
      );

      expect(filingRelated.map(s => s.ruleNumber)).toContain('502');
      expect(filingRelated.map(s => s.ruleNumber)).not.toContain('500');
      expect(filingRelated.map(s => s.ruleNumber)).not.toContain('501');
    });
  });

  describe('File Management', () => {
    test('should generate correct filenames', () => {
      const section = {
        ruleNumber: '437c',
        title: 'Summary Judgment'
      };

      const filename = scraper.generateRuleFilename(section, 0);
      
      expect(filename).toMatch(/^ccp_section_437_\d{4}-\d{2}-\d{2}_0\.pdf$/);
    });

    test('should generate unique filenames for different indices', () => {
      const section = { ruleNumber: '1005', title: 'Motion Deadlines' };
      
      const filename1 = scraper.generateRuleFilename(section, 0);
      const filename2 = scraper.generateRuleFilename(section, 1);
      
      expect(filename1).not.toBe(filename2);
      expect(filename1).toContain('_0.pdf');
      expect(filename2).toContain('_1.pdf');
    });

    test('should check file existence correctly', async () => {
      fs.access.mockResolvedValue(); // File exists
      
      const exists = await scraper.fileExists('./test/file.pdf');
      
      expect(exists).toBe(true);
      expect(fs.access).toHaveBeenCalledWith('./test/file.pdf');
    });

    test('should handle file not found', async () => {
      fs.access.mockRejectedValue(new Error('File not found'));
      
      const exists = await scraper.fileExists('./test/nonexistent.pdf');
      
      expect(exists).toBe(false);
    });
  });

  describe('PDF Age Detection', () => {
    test('should determine when to download fresh PDFs - recent files', async () => {
      fs.readdir.mockResolvedValue(['ccp_section_437c.pdf']);
      fs.stat.mockResolvedValue(mockFileSystemData.recentPDFStats);

      const shouldDownload = await scraper.shouldDownloadPDFs();
      
      expect(shouldDownload).toBe(false); // Files are recent
    });

    test('should download when no PDFs exist', async () => {
      fs.readdir.mockResolvedValue([]);

      const shouldDownload = await scraper.shouldDownloadPDFs();
      
      expect(shouldDownload).toBe(true);
    });

    test('should download when PDFs are old', async () => {
      fs.readdir.mockResolvedValue(['ccp_section_437c.pdf']);
      fs.stat.mockResolvedValue(mockFileSystemData.oldPDFStats);

      const shouldDownload = await scraper.shouldDownloadPDFs();
      
      expect(shouldDownload).toBe(true);
    });

    test('should handle readdir errors gracefully', async () => {
      fs.readdir.mockRejectedValue(new Error('Access denied'));

      const shouldDownload = await scraper.shouldDownloadPDFs();
      
      expect(shouldDownload).toBe(true); // Default to download on error
    });
  });

  describe('Content Analysis', () => {
    test('should analyze web scraped content correctly', () => {
      const testContent = `
        CCP Section 437c - Summary Judgment Motions
        
        The motion shall be filed within 60 days of service.
        Documents must be served on all parties.
        See Section 1005 for deadline requirements.
        California Rules of Court Rule 3.1110 applies.
        
        Filing Requirements:
        - Motion must be supported by affidavits
        - Service shall be made at least 75 days before hearing
      `;
      
      const ruleInfo = { 
        ruleNumber: '437c', 
        title: 'Summary Judgment',
        filingRelevance: { score: 8, isRelevant: true }
      };
      
      const analysis = scraper.analyzeWebScrapedContent(testContent, ruleInfo);

      expect(analysis.section_number).toBe('437c');
      expect(analysis.procedural_requirements.length).toBeGreaterThan(0);
      expect(analysis.deadlines_and_timing.length).toBeGreaterThan(0);
      expect(analysis.cross_references).toContain('1005');
      expect(analysis.key_provisions.length).toBeGreaterThan(0);
      
      // Check for specific content
      expect(analysis.procedural_requirements.some(req => 
        req.includes('shall be filed within 60 days')
      )).toBe(true);
      expect(analysis.deadlines_and_timing.some(deadline => 
        deadline.includes('within 60 days')
      )).toBe(true);
    });

    test('should handle empty content gracefully', () => {
      const ruleInfo = { ruleNumber: '437c', title: 'Test' };
      const analysis = scraper.analyzeWebScrapedContent('', ruleInfo);

      expect(analysis.section_number).toBe('437c');
      expect(analysis.procedural_requirements).toEqual([]);
      expect(analysis.deadlines_and_timing).toEqual([]);
      expect(analysis.cross_references).toEqual([]);
    });

    test('should extract cross-references correctly', () => {
      const testContent = `
        See Section 1005 for motion requirements.
        Code of Civil Procedure Section 1010 governs service.
        California Rules of Court Rule 3.1110 applies.
        Reference to Section 2025.010 for depositions.
      `;
      
      const ruleInfo = { ruleNumber: '437c', title: 'Test' };
      const analysis = scraper.analyzeWebScrapedContent(testContent, ruleInfo);

      expect(analysis.cross_references).toContain('1005');
      expect(analysis.cross_references).toContain('1010');
      expect(analysis.cross_references).toContain('2025.010');
    });
  });

  describe('Python Script Generation', () => {
    test('should generate TOC extraction script correctly', () => {
      const tocPdfPath = './test/toc.pdf';
      const script = scraper.generateTocExtractionScript(tocPdfPath);
      
      expect(script).toContain('import fitz');
      expect(script).toContain('import json');
      expect(script).toContain(tocPdfPath);
      expect(script).toContain('extract_toc_links');
      expect(script).toContain('displaySection');
    });

    test('should generate PyMuPDF processing script correctly', () => {
      const pdfPaths = ['./test1.pdf', './test2.pdf'];
      const ruleData = [
        { ruleNumber: '437c', title: 'Test 1' },
        { ruleNumber: '1005', title: 'Test 2' }
      ];
      
      const script = scraper.generateEnhancedPyMuPDFScript(pdfPaths, ruleData);
      
      expect(script).toContain('import fitz');
      expect(script).toContain('extract_ccp_content');
      expect(script).toContain('analyze_ccp_content');
      expect(script).toContain('./test1.pdf');
      expect(script).toContain('./test2.pdf');
    });
  });

  describe('Error Handling', () => {
    test('should handle initialization errors gracefully', async () => {
      fs.mkdir.mockRejectedValue(mockErrors.fileSystemError);

      await expect(scraper.initialize()).rejects.toThrow('Permission denied');
    });

    test('should handle PDF verification errors', async () => {
      // Mock file system calls for PDF verification
      fs.stat.mockResolvedValue({ size: 500 }); // Small file
      fs.open.mockResolvedValue({
        read: jest.fn().mockResolvedValue({ buffer: Buffer.from('invalid') }),
        close: jest.fn().mockResolvedValue()
      });

      const isValid = await scraper.verifyPDFContent('./test/invalid.pdf');
      
      expect(isValid).toBe(false);
    });

    test('should handle spawn errors in script execution', async () => {
      const mockSpawn = TestHelpers.createMockSpawn('', 'Python error', 1);
      spawn.mockImplementation(mockSpawn);

      await expect(
        scraper.extractSectionLinksFromTocPDF('./test/toc.pdf')
      ).rejects.toThrow();
    });
  });

  describe('Utility Methods', () => {
    test('should sleep for specified duration', async () => {
      const startTime = Date.now();
      
      await scraper.sleep(50);
      
      const endTime = Date.now();
      expect(endTime - startTime).toBeGreaterThanOrEqual(45); // Allow some variance
    });

    test('should get existing PDF data correctly', async () => {
      fs.readdir.mockResolvedValue(mockFileSystemData.existingPDFs);
      
      const { pdfPaths, ruleData } = await scraper.getExistingPDFData();
      
      expect(pdfPaths.length).toBe(mockFileSystemData.existingPDFs.length);
      expect(ruleData.length).toBe(mockFileSystemData.existingPDFs.length);
      expect(ruleData[0].ruleNumber).toBe('437c');
      expect(ruleData[1].ruleNumber).toBe('1005');
    });

    test('should handle empty existing PDF directory', async () => {
      fs.readdir.mockResolvedValue([]);
      
      const { pdfPaths, ruleData } = await scraper.getExistingPDFData();
      
      expect(pdfPaths).toEqual([]);
      expect(ruleData).toEqual([]);
    });
  });

  describe('Mock Integration Tests', () => {
    test('should process web scraped JSON files correctly', async () => {
      const jsonPaths = ['./test/scraped1.json', './test/scraped2.json'];
      const ruleData = [
        { ruleNumber: '437c', title: 'Test 1', contentType: 'web_scraped' },
        { ruleNumber: '1005', title: 'Test 2', contentType: 'web_scraped' }
      ];
      
      fs.readFile.mockResolvedValue(JSON.stringify(mockWebScrapedContent));
      
      const results = await scraper.processWebScrapedJSON(jsonPaths, ruleData);
      
      expect(results).toHaveLength(2);
      expect(results[0].file_info.status).toBe('success');
      expect(results[0].content.full_text).toBeTruthy();
      expect(results[0].ccp_analysis).toBeDefined();
    });

    test('should handle JSON parsing errors', async () => {
      const jsonPaths = ['./test/invalid.json'];
      const ruleData = [{ ruleNumber: '437c', title: 'Test', contentType: 'web_scraped' }];
      
      fs.readFile.mockResolvedValue('invalid json');
      
      const results = await scraper.processWebScrapedJSON(jsonPaths, ruleData);
      
      expect(results).toHaveLength(1);
      expect(results[0].file_info.status).toBe('error');
      expect(results[0].file_info.error).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    test('should handle sections with letter suffixes correctly', () => {
      const section = { ruleNumber: '437c', title: 'Summary Judgment with Letter' };
      
      const isFilingRelated = scraper.isFilingRelatedSection(section);
      const filename = scraper.generateRuleFilename(section, 0);
      
      expect(isFilingRelated).toBe(true);
      expect(filename).toContain('ccp_section_437');
    });

    test('should handle decimal section numbers', () => {
      const section = { ruleNumber: '1010.6', title: 'Electronic Filing' };
      
      const isFilingRelated = scraper.isFilingRelatedSection(section);
      
      expect(isFilingRelated).toBe(true);
    });

    test('should handle very long section titles', () => {
      const longTitle = 'A'.repeat(300);
      const section = { ruleNumber: '1005', title: longTitle };
      
      const analysis = scraper.analyzeWebScrapedContent(longTitle, section);
      
      expect(analysis.section_title).toBe(longTitle);
    });

    test('should handle empty or undefined rule data', () => {
      const analysis = scraper.analyzeWebScrapedContent('test content', {});
      
      expect(analysis.section_number).toBe('');
      expect(analysis.section_title).toBe('');
      expect(analysis.filing_relevance).toEqual({});
    });
  });
});

describe('HierarchicalPDFScraper - Integration Points', () => {
  let scraper;

  beforeEach(() => {
    scraper = TestHelpers.createMockScraper();
    jest.clearAllMocks();
  });

  test('should handle complete workflow mocking', async () => {
    // Mock all external dependencies
    jest.spyOn(scraper, 'shouldDownloadPDFs').mockResolvedValue(true);
    jest.spyOn(scraper, 'downloadTocPDF').mockResolvedValue('./test/toc.pdf');
    jest.spyOn(scraper, 'extractSectionLinksFromTocPDF').mockResolvedValue(mockTocLinks);
    jest.spyOn(scraper, 'downloadIndividualRulePDF').mockResolvedValue({
      filePath: './test/rule.pdf',
      ruleData: { ruleNumber: '437c' }
    });
    jest.spyOn(scraper, 'processFilesWithEnhancedProcessor').mockResolvedValue([mockPDFAnalysis]);

    const consoleMock = TestHelpers.mockConsole();
    
    try {
      const results = await scraper.scrapeHierarchicalPDFs();

      expect(results).toBeDefined();
      expect(results.extracted_documents).toHaveLength(1);
      expect(results.filtering_summary).toBeDefined();
      expect(results.filtering_summary.processing_mode).toBe('fresh_download');
      
    } finally {
      consoleMock.restore();
    }
  });

  test('should handle existing PDFs workflow', async () => {
    jest.spyOn(scraper, 'shouldDownloadPDFs').mockResolvedValue(false);
    jest.spyOn(scraper, 'getExistingPDFData').mockResolvedValue({
      pdfPaths: ['./test/existing.pdf'],
      ruleData: [{ ruleNumber: '437c', title: 'Existing' }]
    });
    jest.spyOn(scraper, 'processFilesWithEnhancedProcessor').mockResolvedValue([mockPDFAnalysis]);

    const consoleMock = TestHelpers.mockConsole();
    
    try {
      const results = await scraper.scrapeHierarchicalPDFs();

      expect(results).toBeDefined();
      expect(results.filtering_summary.processing_mode).toBe('existing_pdfs');
      
    } finally {
      consoleMock.restore();
    }
  });
}); 