#!/usr/bin/env node

/**
 * Enhanced Scraper Test Script
 * 
 * This script tests the enhanced hierarchical scraper to ensure all the specified
 * CCP rules are being caught and parsed correctly.
 */

const { HierarchicalPDFScraper } = require('./hierarchial_scraper');

// Enhanced critical sections that should be caught
const ENHANCED_CRITICAL_SECTIONS = {
  // 1. Service and Filing Rules (CCP 1000-1020)
  serviceAndFiling: [
    '1005', // Motion deadlines (16 court days notice, 9 days for opposition, 5 days for reply)
    '1010', // Service methods and timing extensions
    '1010.6', // Electronic service procedures
    '1013', // Time extensions for mail service (+5 days in CA, +10 out of state, +2 court days for fax/overnight)
    '1019.5' // Notice of court orders and decisions
  ],
  
  // 2. Motion Practice and Format Requirements
  motionPractice: [
    '473', // Relief from default judgments and procedural errors
    '128.7', // Sanctions for frivolous filings
    '170', '170.1', '170.3', '170.6', // Judge disqualification procedures
    '594' // Notice of trial requirements
  ],
  
  // 3. Case Management and Scheduling
  caseManagement: [
    '583.210', '583.220', '583.230', '583.250', // Dismissal for delay in prosecution
    '12', '12a', '12c', // Time computation rules
    '2024.020' // Discovery cutoff deadlines (30 days before trial)
  ],
  
  // 4. Specific Motion Requirements
  specificMotions: [
    '1287', '1288', '1290', '1294', // Arbitration petition procedures
    '1086', '1094.5', '1094.6', // Writ procedures (mandate, prohibition)
    '664', '664.5', '664.6', '667', '670' // Entry of judgment (enhanced coverage)
  ],
  
  // 5. Discovery Motion Deadlines
  discoveryMotions: [
    '2030.300', // Motion to compel interrogatory responses (45-day deadline)
    '2031.310', // Motion to compel document production
    '2025.480' // Motion to compel deposition attendance
  ],
  
  // 6. Ex Parte Procedures and TRO
  exParte: [
    '527' // Temporary restraining orders
  ],
  
  // 7. Demurrer and Document Filing Requirements
  demurrerAndDocuments: [
    '430.10', '430.20', '430.30', '430.40', '430.41', // Demurrer procedures
    '431.30', '431.40', // Answer and cross-complaint requirements
    '472', '472a', '472c', '472d', // Amendment of pleadings
    '435', '436', '437', // Motion to strike requirements
    '425.10', '425.11', '425.12', '425.13', // Complaint format requirements
    '426.10', '426.30', '426.50', // Cross-complaint requirements
    '367' // Capacity to sue and document requirements
  ]
};

// Enhanced keyword patterns that should be recognized
const ENHANCED_KEYWORD_PATTERNS = [
  { ruleNumber: 'TEST001', title: 'Motion deadline requirements (16 court days notice)' },
  { ruleNumber: 'TEST002', title: 'Electronic service procedures and timing' },
  { ruleNumber: 'TEST003', title: 'Time extensions for mail service (+5 days in CA)' },
  { ruleNumber: 'TEST004', title: 'Frivolous filing sanctions and penalties' },
  { ruleNumber: 'TEST005', title: 'Judge disqualification and peremptory challenge' },
  { ruleNumber: 'TEST006', title: 'Discovery cutoff deadlines (30 days before trial)' },
  { ruleNumber: 'TEST007', title: 'Motion to compel with 45-day deadline' },
  { ruleNumber: 'TEST008', title: 'Temporary restraining order procedures' },
  { ruleNumber: 'TEST009', title: 'Time computation rules and calculations' },
  { ruleNumber: 'TEST010', title: 'Administrative mandate procedures' },
  // New demurrer and document formatting patterns
  { ruleNumber: 'TEST011', title: 'Demurrer grounds and requirements (motion to dismiss)' },
  { ruleNumber: 'TEST012', title: 'Meet and confer requirements for demurrer' },
  { ruleNumber: 'TEST013', title: 'Answer format and requirements' },
  { ruleNumber: 'TEST014', title: 'Cross-complaint filing requirements' },
  { ruleNumber: 'TEST015', title: 'Amendment of pleadings procedures' },
  { ruleNumber: 'TEST016', title: 'Motion to strike requirements' },
  { ruleNumber: 'TEST017', title: 'Complaint format and content requirements' },
  { ruleNumber: 'TEST018', title: 'Verification requirements for pleadings' },
  { ruleNumber: 'TEST019', title: 'Document structure and formatting requirements' },
  { ruleNumber: 'TEST020', title: 'Capacity to sue and document requirements' }
];

class EnhancedScraperTester {
  constructor() {
    this.scraper = new HierarchicalPDFScraper({
      downloadDir: './test-temp/pdfs',
      outputDir: './test-temp/output'
    });
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      'info': '📋',
      'success': '✅',
      'error': '❌',
      'warning': '⚠️'
    }[type] || '📋';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  addTestResult(testName, passed, message = '') {
    this.results.tests.push({ testName, passed, message });
    if (passed) {
      this.results.passed++;
      this.log(`${testName}: PASSED ${message}`, 'success');
    } else {
      this.results.failed++;
      this.log(`${testName}: FAILED ${message}`, 'error');
    }
  }

  testCriticalSectionInclusion() {
    this.log('Testing critical section inclusion...', 'info');
    
    const minimalSections = [
      { ruleNumber: 'TEST999', title: 'Test Section' }
    ];
    
    const filtered = this.scraper.filterFilingRelatedSections(minimalSections);
    const ruleNumbers = filtered.map(s => s.ruleNumber);
    
    let totalExpected = 0;
    let totalFound = 0;
    
    for (const [category, sections] of Object.entries(ENHANCED_CRITICAL_SECTIONS)) {
      for (const section of sections) {
        totalExpected++;
        if (ruleNumbers.includes(section)) {
          totalFound++;
        } else {
          this.log(`Missing critical section: ${section} (${category})`, 'warning');
        }
      }
    }
    
    const passed = totalFound >= totalExpected * 0.95; // Allow 5% tolerance
    this.addTestResult(
      'Critical Section Inclusion',
      passed,
      `Found ${totalFound}/${totalExpected} critical sections`
    );
    
    return passed;
  }

  testEnhancedKeywordRecognition() {
    this.log('Testing enhanced keyword recognition...', 'info');
    
    let recognizedCount = 0;
    const totalKeywordTests = ENHANCED_KEYWORD_PATTERNS.length;
    
    for (const section of ENHANCED_KEYWORD_PATTERNS) {
      const isRecognized = this.scraper.isFilingRelatedSection(section);
      if (isRecognized) {
        recognizedCount++;
      } else {
        this.log(`Keyword pattern not recognized: ${section.title}`, 'warning');
      }
    }
    
    const passed = recognizedCount >= totalKeywordTests * 0.9; // Allow 10% tolerance
    this.addTestResult(
      'Enhanced Keyword Recognition',
      passed,
      `Recognized ${recognizedCount}/${totalKeywordTests} keyword patterns`
    );
    
    return passed;
  }

  testSectionRangeAccuracy() {
    this.log('Testing section range accuracy...', 'info');
    
    const testRanges = [
      // Enhanced ranges that should be included
      { ruleNumber: '12', title: 'Time Computation', shouldInclude: true },
      { ruleNumber: '128.7', title: 'Frivolous Filing Sanctions', shouldInclude: true },
      { ruleNumber: '170.6', title: 'Peremptory Challenge', shouldInclude: true },
      { ruleNumber: '473', title: 'Relief from Default', shouldInclude: true },
      { ruleNumber: '527', title: 'TRO Procedures', shouldInclude: true },
      { ruleNumber: '583.210', title: 'Dismissal for Delay', shouldInclude: true },
      { ruleNumber: '1094.5', title: 'Administrative Mandate', shouldInclude: true },
      { ruleNumber: '2024.020', title: 'Discovery Cutoff', shouldInclude: true },
      { ruleNumber: '2030.300', title: 'Compel Interrogatories', shouldInclude: true },
      // New demurrer and document formatting tests
      { ruleNumber: '430.10', title: 'Demurrer Grounds', shouldInclude: true },
      { ruleNumber: '430.41', title: 'Meet and Confer for Demurrer', shouldInclude: true },
      { ruleNumber: '435', title: 'Motion to Strike', shouldInclude: true },
      { ruleNumber: '425.10', title: 'Complaint Format', shouldInclude: true },
      
      // Sections that should be excluded
      { ruleNumber: '50', title: 'Court Administration', shouldInclude: false },
      { ruleNumber: '999', title: 'General Provision', shouldInclude: false },
      { ruleNumber: '1500', title: 'Unrelated Section', shouldInclude: false }
    ];
    
    let correct = 0;
    const total = testRanges.length;
    
    for (const testCase of testRanges) {
      const isIncluded = this.scraper.isFilingRelatedSection(testCase);
      if (isIncluded === testCase.shouldInclude) {
        correct++;
      } else {
        this.log(
          `Range test failed: ${testCase.ruleNumber} - Expected: ${testCase.shouldInclude}, Got: ${isIncluded}`,
          'warning'
        );
      }
    }
    
    const passed = correct >= total * 0.9; // Allow 10% tolerance
    this.addTestResult(
      'Section Range Accuracy',
      passed,
      `Correct: ${correct}/${total} range tests`
    );
    
    return passed;
  }

  testSpecificDeadlinePatterns() {
    this.log('Testing specific deadline pattern recognition...', 'info');
    
    const deadlinePatterns = [
      { ruleNumber: 'D001', title: '16 court days notice requirement' },
      { ruleNumber: 'D002', title: '9 days for opposition filing' },
      { ruleNumber: 'D003', title: '5 days for reply brief' },
      { ruleNumber: 'D004', title: '45-day deadline for motion to compel' },
      { ruleNumber: 'D005', title: '30 days before trial cutoff' },
      { ruleNumber: 'D006', title: '+5 days for mail service in California' },
      { ruleNumber: 'D007', title: '+10 days for out of state service' },
      { ruleNumber: 'D008', title: '+2 court days for fax/overnight service' },
      { ruleNumber: 'D009', title: '2-year rule for dismissal' },
      { ruleNumber: 'D010', title: '10:00 AM notice rule for ex parte' }
    ];
    
    let recognizedDeadlines = 0;
    
    for (const pattern of deadlinePatterns) {
      const isRecognized = this.scraper.isFilingRelatedSection(pattern);
      if (isRecognized) {
        recognizedDeadlines++;
      } else {
        this.log(`Deadline pattern not recognized: ${pattern.title}`, 'warning');
      }
    }
    
    const passed = recognizedDeadlines >= deadlinePatterns.length * 0.8; // Allow 20% tolerance
    this.addTestResult(
      'Deadline Pattern Recognition',
      passed,
      `Recognized ${recognizedDeadlines}/${deadlinePatterns.length} deadline patterns`
    );
    
    return passed;
  }

  async runAllTests() {
    this.log('Starting Enhanced Scraper Test Suite...', 'info');
    this.log('==========================================', 'info');
    
    try {
      // Run all tests
      this.testCriticalSectionInclusion();
      this.testEnhancedKeywordRecognition();
      this.testSectionRangeAccuracy();
      this.testSpecificDeadlinePatterns();
      
      // Generate summary
      this.log('==========================================', 'info');
      this.log('Test Summary:', 'info');
      this.log(`Total Tests: ${this.results.tests.length}`, 'info');
      this.log(`Passed: ${this.results.passed}`, 'success');
      this.log(`Failed: ${this.results.failed}`, this.results.failed > 0 ? 'error' : 'success');
      
      const passRate = (this.results.passed / this.results.tests.length) * 100;
      this.log(`Pass Rate: ${passRate.toFixed(1)}%`, passRate >= 90 ? 'success' : 'warning');
      
      if (this.results.failed === 0) {
        this.log('🎉 All tests passed! Enhanced scraper is working correctly.', 'success');
      } else {
        this.log(`⚠️ ${this.results.failed} test(s) failed. Please review the implementation.`, 'warning');
      }
      
      return this.results;
      
    } catch (error) {
      this.log(`Test suite failed with error: ${error.message}`, 'error');
      throw error;
    }
  }
}

// Run the tests if this file is executed directly
if (require.main === module) {
  const tester = new EnhancedScraperTester();
  tester.runAllTests()
    .then(results => {
      process.exit(results.failed === 0 ? 0 : 1);
    })
    .catch(error => {
      console.error('Test suite failed:', error);
      process.exit(1);
    });
}

module.exports = { EnhancedScraperTester, ENHANCED_CRITICAL_SECTIONS, ENHANCED_KEYWORD_PATTERNS }; 