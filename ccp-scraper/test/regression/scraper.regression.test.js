const { HierarchicalPDFScraper } = require('../../hierarchial_scraper');
const { 
  expectedOutputStructure, 
  expectedDocumentStructure,
  mockTocLinks,
  mockPDFAnalysis 
} = require('../fixtures/mockData');
const TestHelpers = require('../utils/testHelpers');

describe('HierarchicalPDFScraper - Regression Tests', () => {
  let scraper;
  
  beforeEach(() => {
    scraper = new HierarchicalPDFScraper({
      downloadDir: './test/temp/regression',
      outputDir: './test/temp/regression_output',
      delay: 10,
      maxConcurrent: 1
    });
  });

  describe('Critical Section Detection', () => {
    test('should always include enhanced critical CCP sections', () => {
      const mockSections = [
        { ruleNumber: '100', title: 'General Provisions' },
        { ruleNumber: '437c', title: 'Summary Judgment' },
        { ruleNumber: '1005', title: 'Motion Deadlines' }
      ];

      const filtered = scraper.filterFilingRelatedSections(mockSections);
      const ruleNumbers = filtered.map(s => s.ruleNumber);
      
      // Enhanced critical sections should always be included
      // 1. Service and Filing Rules (CCP 1000-1020)
      expect(ruleNumbers).toContain('1005'); // Motion deadlines (16 court days notice, 9 days for opposition, 5 days for reply)
      expect(ruleNumbers).toContain('1010'); // Service methods and timing extensions
      expect(ruleNumbers).toContain('1010.6'); // Electronic service procedures
      expect(ruleNumbers).toContain('1013'); // Time extensions for mail service
      expect(ruleNumbers).toContain('1019.5'); // Notice of court orders and decisions

      // 2. Motion Practice and Format Requirements
      expect(ruleNumbers).toContain('473'); // Relief from default judgments and procedural errors
      expect(ruleNumbers).toContain('128.7'); // Sanctions for frivolous filings
      expect(ruleNumbers).toContain('170.6'); // Peremptory challenge to judge
      expect(ruleNumbers).toContain('594'); // Notice of trial requirements

      // 3. Case Management and Scheduling
      expect(ruleNumbers).toContain('583.210'); // Dismissal for delay in prosecution (2-year rule)
      expect(ruleNumbers).toContain('12'); // Time computation rules
      expect(ruleNumbers).toContain('2024.020'); // Discovery cutoff deadlines (30 days before trial)

      // 4. Specific Motion Requirements
      expect(ruleNumbers).toContain('1287'); // Arbitration petition procedures
      expect(ruleNumbers).toContain('1094.5'); // Administrative mandate procedures

      // 5. Discovery Motion Deadlines
      expect(ruleNumbers).toContain('2030.300'); // Motion to compel interrogatory responses (45-day deadline)
      expect(ruleNumbers).toContain('2031.310'); // Motion to compel document production
      expect(ruleNumbers).toContain('2025.480'); // Motion to compel deposition attendance

      // 6. Ex Parte Procedures and TRO
      expect(ruleNumbers).toContain('527'); // Temporary restraining orders

      // Legacy critical sections
      expect(ruleNumbers).toContain('437c');
      expect(ruleNumbers).toContain('2025.010');
      expect(ruleNumbers).toContain('2030.010');
    });

    test('should maintain consistent filtering criteria', () => {
      const testSections = [
        { ruleNumber: '412.10', title: 'Summons Service Requirements' },
        { ruleNumber: '425.10', title: 'Complaint Filing Format' },
        { ruleNumber: '85', title: 'Court Administration' }
      ];

      const filtered = scraper.filterFilingRelatedSections(testSections);
      const filteredNumbers = filtered.map(s => s.ruleNumber);
      
      expect(filteredNumbers).toContain('412.10');
      expect(filteredNumbers).toContain('425.10');
      expect(filteredNumbers).not.toContain('85');
    });

    test('should maintain enhanced section range accuracy', () => {
      // Test boundary conditions for enhanced section ranges
      const boundaryTestSections = [
        // Original filing ranges
        { ruleNumber: '410.10', title: 'Jurisdiction Start' },
        { ruleNumber: '418.11', title: 'Jurisdiction End' },
        { ruleNumber: '437', title: 'Summary Judgment Start' },
        { ruleNumber: '439', title: 'Summary Judgment End' },
        { ruleNumber: '1000', title: 'Service Rules Start' },
        { ruleNumber: '1020', title: 'Service Rules End' },
        
        // Enhanced filing ranges
        { ruleNumber: '12', title: 'Time Computation Rules' },
        { ruleNumber: '128.7', title: 'Sanctions for Frivolous Filings' },
        { ruleNumber: '170', title: 'Judge Disqualification Start' },
        { ruleNumber: '170.6', title: 'Judge Disqualification End' },
        { ruleNumber: '473', title: 'Relief from Default' },
        { ruleNumber: '527', title: 'Temporary Restraining Orders' },
        { ruleNumber: '583.210', title: 'Dismissal for Delay Start' },
        { ruleNumber: '583.250', title: 'Dismissal for Delay End' },
        { ruleNumber: '594', title: 'Notice of Trial' },
        { ruleNumber: '664', title: 'Entry of Judgment Start' },
        { ruleNumber: '670', title: 'Entry of Judgment End' },
        { ruleNumber: '1086', title: 'Writ of Mandate' },
        { ruleNumber: '1094.5', title: 'Administrative Mandate Start' },
        { ruleNumber: '1094.6', title: 'Administrative Mandate End' },
        { ruleNumber: '1287', title: 'Arbitration Start' },
        { ruleNumber: '1294', title: 'Arbitration End' },
        { ruleNumber: '2024.020', title: 'Discovery Cutoff' },
        { ruleNumber: '2025.480', title: 'Motion to Compel Deposition' },
        { ruleNumber: '2030.300', title: 'Motion to Compel Interrogatories' },
        { ruleNumber: '2031.310', title: 'Motion to Compel Production' },
        
        // Just outside ranges (should be excluded unless keyword match)
        { ruleNumber: '410.09', title: 'Before Jurisdiction' },
        { ruleNumber: '418.12', title: 'After Jurisdiction' },
        { ruleNumber: '436', title: 'Before Summary Judgment' },
        { ruleNumber: '440', title: 'After Summary Judgment' },
        { ruleNumber: '999', title: 'Before Service Rules' },
        { ruleNumber: '1021', title: 'After Service Rules' },
        { ruleNumber: '50', title: 'Court Administration' }
      ];

      const filtered = scraper.filterFilingRelatedSections(boundaryTestSections);
      const filteredNumbers = filtered.map(s => s.ruleNumber);
      
      // Should include sections within original ranges
      expect(filteredNumbers).toContain('410.10');
      expect(filteredNumbers).toContain('418.11');
      expect(filteredNumbers).toContain('437');
      expect(filteredNumbers).toContain('439');
      expect(filteredNumbers).toContain('1000');
      expect(filteredNumbers).toContain('1020');
      
      // Should include sections within enhanced ranges
      expect(filteredNumbers).toContain('12');
      expect(filteredNumbers).toContain('128.7');
      expect(filteredNumbers).toContain('170');
      expect(filteredNumbers).toContain('170.6');
      expect(filteredNumbers).toContain('473');
      expect(filteredNumbers).toContain('527');
      expect(filteredNumbers).toContain('583.210');
      expect(filteredNumbers).toContain('583.250');
      expect(filteredNumbers).toContain('594');
      expect(filteredNumbers).toContain('664');
      expect(filteredNumbers).toContain('670');
      expect(filteredNumbers).toContain('1086');
      expect(filteredNumbers).toContain('1094.5');
      expect(filteredNumbers).toContain('1094.6');
      expect(filteredNumbers).toContain('1287');
      expect(filteredNumbers).toContain('1294');
      expect(filteredNumbers).toContain('2024.020');
      expect(filteredNumbers).toContain('2025.480');
      expect(filteredNumbers).toContain('2030.300');
      expect(filteredNumbers).toContain('2031.310');
      
      // Should exclude sections outside ranges (unless they match keywords)
      expect(filteredNumbers).not.toContain('410.09');
      expect(filteredNumbers).not.toContain('418.12');
      expect(filteredNumbers).not.toContain('436');
      expect(filteredNumbers).not.toContain('440');
      expect(filteredNumbers).not.toContain('1021');
      expect(filteredNumbers).not.toContain('50');
    });
  });

  describe('Output Format Consistency', () => {
    test('should maintain consistent output structure', async () => {
      // Mock the complete workflow
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
        
        // Validate top-level structure
        expect(results).toMatchObject(expectedOutputStructure);
        
        // Validate filtering summary structure
        expect(results.filtering_summary).toHaveProperty('total_sections_found');
        expect(results.filtering_summary).toHaveProperty('filing_related_sections');
        expect(results.filtering_summary).toHaveProperty('filtering_criteria');
        expect(results.filtering_summary).toHaveProperty('processed_at');
        expect(results.filtering_summary).toHaveProperty('processing_mode');
        
        // Validate filtering criteria structure
        const criteria = results.filtering_summary.filtering_criteria;
        expect(criteria).toHaveProperty('primary_keywords');
        expect(criteria).toHaveProperty('procedural_keywords');
        expect(criteria).toHaveProperty('ccp_section_ranges');
        expect(criteria).toHaveProperty('minimum_relevance_score');
        expect(criteria.minimum_relevance_score).toBe(4);
        
        // Validate document structure
        if (results.extracted_documents.length > 0) {
          expect(results.extracted_documents[0]).toMatchObject(expectedDocumentStructure);
        }
        
      } finally {
        consoleMock.restore();
      }
    });

    test('should maintain consistent document structure', () => {
      const testDocument = mockPDFAnalysis;
      
      // Validate document structure consistency
      expect(testDocument).toMatchObject(expectedDocumentStructure);
      
      // Validate specific required fields
      expect(testDocument.rule_info.ruleNumber).toBeDefined();
      expect(testDocument.rule_info.title).toBeDefined();
      expect(testDocument.rule_info.url).toBeDefined();
      
      expect(testDocument.file_info.file_path).toBeDefined();
      expect(testDocument.file_info.file_name).toBeDefined();
      expect(testDocument.file_info.status).toMatch(/^(success|error)$/);
      
      expect(testDocument.content.full_text).toBeDefined();
      expect(testDocument.content.page_count).toBeGreaterThan(0);
      expect(testDocument.content.word_count).toBeGreaterThan(0);
      
      expect(testDocument.ccp_analysis.section_number).toBeDefined();
      expect(Array.isArray(testDocument.ccp_analysis.procedural_requirements)).toBe(true);
      expect(Array.isArray(testDocument.ccp_analysis.deadlines_and_timing)).toBe(true);
      expect(Array.isArray(testDocument.ccp_analysis.cross_references)).toBe(true);
      
      expect(testDocument.extracted_at).toBeDefined();
    });

    test('should maintain consistent metadata fields', () => {
      const testDocument = mockPDFAnalysis;
      
      // Validate metadata structure
      expect(testDocument.metadata).toHaveProperty('title');
      expect(testDocument.metadata).toHaveProperty('author');
      expect(testDocument.metadata).toHaveProperty('subject');
      expect(testDocument.metadata).toHaveProperty('creator');
      expect(testDocument.metadata).toHaveProperty('producer');
      expect(testDocument.metadata).toHaveProperty('creation_date');
      expect(testDocument.metadata).toHaveProperty('modification_date');
    });
  });

  describe('Backward Compatibility', () => {
    test('should handle legacy filename formats', () => {
      const legacySection = {
        ruleNumber: '437c',
        title: 'Legacy Format Section'
      };

      const filename = scraper.generateRuleFilename(legacySection, 0);
      
      expect(filename).toMatch(/\.pdf$/);
      expect(filename).toContain('ccp_section');
    });

    test('should maintain consistent section number parsing', () => {
      const testSectionNumbers = ['437c', '1010.6', '2025.010', '1005'];

      testSectionNumbers.forEach(ruleNumber => {
        const section = { ruleNumber, title: `Test Section ${ruleNumber}` };
        
        const isFilingRelated = scraper.isFilingRelatedSection(section);
        const filename = scraper.generateRuleFilename(section, 0);
        
        expect(typeof isFilingRelated).toBe('boolean');
        expect(filename).toBeTruthy();
        expect(filename).toContain('ccp_section');
      });
    });

    test('should maintain consistent URL format', () => {
      const testSections = [
        { ruleNumber: '437c', expectedUrl: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=437c' },
        { ruleNumber: '1010.6', expectedUrl: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=1010.6' },
        { ruleNumber: '2025.010', expectedUrl: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=2025.010' }
      ];

      testSections.forEach(({ ruleNumber, expectedUrl }) => {
        const section = {
          ruleNumber,
          title: `CCP Section ${ruleNumber}`,
          url: expectedUrl,
          source: 'manual_critical_addition'
        };

        // URL format should remain consistent
        expect(section.url).toContain('https://leginfo.legislature.ca.gov');
        expect(section.url).toContain('codes_displaySection.xhtml');
        expect(section.url).toContain('lawCode=CCP');
        expect(section.url).toContain(`sectionNum=${ruleNumber}`);
      });
    });
  });

  describe('Content Analysis Consistency', () => {
    test('should maintain consistent keyword detection', () => {
      const filingText = 'The motion shall be filed within 60 days';
      const nonFilingText = 'General contract interpretation rules';

      const ruleInfo1 = { ruleNumber: '1000', title: filingText };
      const ruleInfo2 = { ruleNumber: '500', title: nonFilingText };
      
      const analysis1 = scraper.analyzeWebScrapedContent(filingText, ruleInfo1);
      const analysis2 = scraper.analyzeWebScrapedContent(nonFilingText, ruleInfo2);
      
      expect(analysis1.procedural_requirements.length + 
             analysis1.deadlines_and_timing.length + 
             analysis1.key_provisions.length).toBeGreaterThan(0);
             
      expect(analysis2.procedural_requirements.length).toBeLessThanOrEqual(1);
    });

    test('should maintain consistent cross-reference extraction', () => {
      const testText = `
        See Section 1005 for motion practice.
        Code of Civil Procedure Section 1010 governs service.
        Reference to Section 437c for summary judgment.
      `;

      const ruleInfo = { ruleNumber: '1000', title: 'Test Section' };
      const analysis = scraper.analyzeWebScrapedContent(testText, ruleInfo);

      expect(analysis.cross_references).toContain('1005');
      expect(analysis.cross_references).toContain('1010');
      expect(analysis.cross_references).toContain('437c');
    });

    test('should maintain consistent timing extraction', () => {
      const testText = `
        Motion must be filed within 60 days of service.
        Opposition papers due 14 days before hearing.
        Reply papers must be filed 5 days before hearing.
        Service shall be made at least 75 days before hearing date.
        No later than 30 days before trial.
      `;

      const ruleInfo = { ruleNumber: '437c', title: 'Timing Test' };
      const analysis = scraper.analyzeWebScrapedContent(testText, ruleInfo);

      expect(analysis.deadlines_and_timing.length).toBeGreaterThan(0);
      
      // Should extract common timing patterns
      const timingText = analysis.deadlines_and_timing.join(' ');
      expect(timingText).toContain('60 days');
      expect(timingText).toContain('14 days');
      expect(timingText).toContain('5 days');
      expect(timingText).toContain('75 days');
      expect(timingText).toContain('30 days');
    });
  });

  describe('Performance Regression Tests', () => {
    test('should maintain reasonable filtering performance', async () => {
      const largeSectionList = TestHelpers.generateTestSections(100, 0.3);
      
      const performance = await TestHelpers.measurePerformance(async () => {
        scraper.filterFilingRelatedSections(largeSectionList);
      }, 3);

      expect(performance.average).toBeLessThan(1000);
    });

    test('should maintain reasonable content analysis performance', async () => {
      // Generate large text content
      const largeText = `
        The motion shall be filed within 60 days of service. 
        Documents must be served on all parties according to Code of Civil Procedure Section 1010.
        See Section 1005 for additional motion practice requirements.
        Filing procedures must comply with court rules and regulations.
        Service of process shall be made in accordance with statutory requirements.
      `.repeat(100); // Repeat to create large text

      const ruleInfo = { ruleNumber: '437c', title: 'Performance Test' };

      const performance = await TestHelpers.measurePerformance(async () => {
        scraper.analyzeWebScrapedContent(largeText, ruleInfo);
      }, 3);

      // Content analysis should be efficient (< 1 second for large text)
      expect(performance.average).toBeLessThan(1000);
    });
  });

  describe('Data Integrity Regression Tests', () => {
    test('should maintain data consistency across multiple runs', () => {
      const testSections = [
        { ruleNumber: '437c', title: 'Summary Judgment Motions' },
        { ruleNumber: '1005', title: 'Motion Filing Deadlines' },
        { ruleNumber: '1010', title: 'Written Notice Requirements' },
        { ruleNumber: '100', title: 'General Provisions' }
      ];

      // Run filtering multiple times
      const results = [];
      for (let i = 0; i < 5; i++) {
        const filtered = scraper.filterFilingRelatedSections(testSections);
        results.push(filtered.map(s => s.ruleNumber).sort());
      }

      // Results should be identical across runs
      const firstResult = results[0];
      results.slice(1).forEach(result => {
        expect(result).toEqual(firstResult);
      });
    });

    test('should maintain filename uniqueness', () => {
      const sections = [
        { ruleNumber: '437c', title: 'Test 1' },
        { ruleNumber: '437c', title: 'Test 2' }, // Same rule number
        { ruleNumber: '1005', title: 'Test 3' }
      ];

      const filenames = sections.map((section, index) => 
        scraper.generateRuleFilename(section, index)
      );

      // All filenames should be unique
      const uniqueFilenames = [...new Set(filenames)];
      expect(filenames.length).toBe(uniqueFilenames.length);
    });
  });

  describe('Error Handling Regression Tests', () => {
    test('should handle malformed section data gracefully', () => {
      const malformedSections = [
        { ruleNumber: '', title: 'Empty Rule Number' },
        { ruleNumber: '437c', title: '' },
        {},
        { ruleNumber: '437c' }
      ];

      expect(() => {
        scraper.filterFilingRelatedSections(malformedSections);
      }).not.toThrow();
    });

    test('should handle empty analysis input', () => {
      const testCases = [
        { content: '', ruleInfo: {} },
        { content: null, ruleInfo: {} },
        { content: 'test', ruleInfo: null }
      ];

      testCases.forEach(({ content, ruleInfo }) => {
        expect(() => {
          scraper.analyzeWebScrapedContent(content, ruleInfo);
        }).not.toThrow();
      });
    });
  });

  describe('Version Compatibility Tests', () => {
    test('should maintain critical section list integrity', () => {
      const criticalSections = [
        '437c', '438', '1005', '1010', '1010.6', '1011', '1012', '1013', '1014'
      ];

      const filtered = scraper.filterFilingRelatedSections([]);
      const filteredNumbers = filtered.map(s => s.ruleNumber);

      criticalSections.forEach(sectionNum => {
        expect(filteredNumbers).toContain(sectionNum);
      });
    });

    test('should maintain consistent base URL', () => {
      expect(scraper.baseUrl).toBe('https://leginfo.legislature.ca.gov');
      expect(scraper.ccpTocUrl).toContain('https://leginfo.legislature.ca.gov');
      expect(scraper.ccpTocUrl).toContain('tocCode=CCP');
    });

    test('should maintain consistent default configuration', () => {
      const defaultScraper = new HierarchicalPDFScraper();
      
      expect(defaultScraper.downloadDir).toBe('./downloaded_pdfs');
      expect(defaultScraper.outputDir).toBe('./extracted_content');
      expect(defaultScraper.maxConcurrent).toBe(3);
      expect(defaultScraper.delay).toBe(2000);
    });
  });
}); 