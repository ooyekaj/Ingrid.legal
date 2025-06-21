const fs = require('fs').promises;
const path = require('path');
const { mockTocLinks, mockPDFAnalysis } = require('../fixtures/mockData');

class TestHelpers {
  /**
   * Create a mock PDF file for testing
   */
  static async createMockPDF(filePath, content = 'Mock PDF content') {
    // Create a simple mock PDF-like file
    const mockPDFHeader = '%PDF-1.4\n';
    const mockContent = mockPDFHeader + content + '\n%%EOF';
    
    // Ensure directory exists
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    
    await fs.writeFile(filePath, mockContent);
    return filePath;
  }

  /**
   * Create mock TOC data file
   */
  static async createMockTocData(outputPath) {
    const dir = path.dirname(outputPath);
    await fs.mkdir(dir, { recursive: true });
    
    await fs.writeFile(outputPath, JSON.stringify(mockTocLinks, null, 2));
    return mockTocLinks;
  }

  /**
   * Create mock PyMuPDF results file
   */
  static async createMockPyMuPDFResults(outputPath) {
    const dir = path.dirname(outputPath);
    await fs.mkdir(dir, { recursive: true });
    
    const results = [mockPDFAnalysis];
    await fs.writeFile(outputPath, JSON.stringify(results, null, 2));
    return results;
  }

  /**
   * Create mock web scraped JSON file
   */
  static async createMockWebScrapedJSON(filePath, content) {
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    
    const webData = {
      source: 'web_scraping',
      title: 'Mock CCP Section',
      url: 'https://example.com/mock',
      content: content || 'Mock legal content with filing requirements',
      timestamp: new Date().toISOString(),
      note: 'Mock data for testing'
    };
    
    await fs.writeFile(filePath, JSON.stringify(webData, null, 2));
    return webData;
  }

  /**
   * Clean up test files and directories
   */
  static async cleanupTestFiles(directory) {
    try {
      const files = await fs.readdir(directory);
      for (const file of files) {
        const filePath = path.join(directory, file);
        const stat = await fs.stat(filePath);
        
        if (stat.isDirectory()) {
          await TestHelpers.cleanupTestFiles(filePath);
          await fs.rmdir(filePath);
        } else {
          await fs.unlink(filePath);
        }
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  }

  /**
   * Create a mock browser instance for Playwright
   */
  static createMockBrowser() {
    const mockPage = {
      goto: jest.fn().mockResolvedValue(undefined),
      waitForTimeout: jest.fn().mockResolvedValue(undefined),
      pdf: jest.fn().mockResolvedValue(undefined),
      $$: jest.fn().mockResolvedValue([]),
      $: jest.fn().mockResolvedValue(null),
      click: jest.fn().mockResolvedValue(undefined),
      waitForEvent: jest.fn().mockResolvedValue({
        saveAs: jest.fn().mockResolvedValue(undefined)
      }),
      evaluate: jest.fn().mockResolvedValue({ 
        title: 'Mock Page', 
        content: 'Mock content with filing requirements shall be served within 30 days',
        url: 'https://example.com',
        timestamp: new Date().toISOString()
      }),
      close: jest.fn().mockResolvedValue(undefined)
    };

    const mockContext = {
      newPage: jest.fn().mockResolvedValue(mockPage),
      close: jest.fn().mockResolvedValue(undefined)
    };

    return {
      newContext: jest.fn().mockResolvedValue(mockContext),
      close: jest.fn().mockResolvedValue(undefined)
    };
  }

  /**
   * Create a mock spawn function for child_process
   */
  static createMockSpawn(mockStdout = '', mockStderr = '', exitCode = 0) {
    return jest.fn(() => ({
      stdout: {
        on: jest.fn((event, callback) => {
          if (event === 'data') {
            setTimeout(() => callback(Buffer.from(mockStdout)), 10);
          }
        })
      },
      stderr: {
        on: jest.fn((event, callback) => {
          if (event === 'data') {
            setTimeout(() => callback(Buffer.from(mockStderr)), 10);
          }
        })
      },
      on: jest.fn((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(exitCode), 20);
        }
      })
    }));
  }

  /**
   * Create mock file system functions
   */
  static createMockFileSystem(options = {}) {
    const {
      existingFiles = [],
      fileStats = { mtime: new Date(), size: 5000 },
      shouldThrowOnAccess = false,
      readFileContent = '{"mock": "data"}'
    } = options;

    return {
      mkdir: jest.fn().mockResolvedValue(undefined),
      writeFile: jest.fn().mockResolvedValue(undefined),
      readFile: jest.fn().mockResolvedValue(readFileContent),
      readdir: jest.fn().mockResolvedValue(existingFiles),
      stat: jest.fn().mockResolvedValue(fileStats),
      access: shouldThrowOnAccess 
        ? jest.fn().mockRejectedValue(new Error('File not found'))
        : jest.fn().mockResolvedValue(undefined),
      unlink: jest.fn().mockResolvedValue(undefined)
    };
  }

  /**
   * Create a mock scraper instance with test configuration
   */
  static createMockScraper(overrides = {}) {
    const { HierarchicalPDFScraper } = require('../../hierarchial_scraper');
    
    const defaultOptions = {
      downloadDir: './test/temp/downloads',
      outputDir: './test/temp/output',
      delay: 10, // Fast for tests
      maxConcurrent: 1
    };

    return new HierarchicalPDFScraper({ ...defaultOptions, ...overrides });
  }

  /**
   * Wait for a specified amount of time (for async test scenarios)
   */
  static async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate test data for section filtering
   */
  static generateTestSections(count = 10, filingRelatedRatio = 0.5) {
    const sections = [];
    const filingKeywords = ['filing', 'service', 'motion', 'pleading', 'summons'];
    const generalKeywords = ['general', 'provisions', 'definitions', 'jurisdiction'];
    
    for (let i = 0; i < count; i++) {
      const isFilingRelated = Math.random() < filingRelatedRatio;
      const keywords = isFilingRelated ? filingKeywords : generalKeywords;
      const keyword = keywords[Math.floor(Math.random() * keywords.length)];
      
      sections.push({
        ruleNumber: `${100 + i}${Math.random() > 0.8 ? '.10' : ''}`,
        title: `CCP Section Test ${keyword.charAt(0).toUpperCase() + keyword.slice(1)}`,
        url: `https://example.com/section/${100 + i}`,
        source: 'test_generation'
      });
    }
    
    return sections;
  }

  /**
   * Validate output structure matches expected format
   */
  static validateOutputStructure(output, expectedStructure) {
    const errors = [];
    
    function validateObject(obj, expected, path = '') {
      for (const [key, expectedValue] of Object.entries(expected)) {
        const currentPath = path ? `${path}.${key}` : key;
        
        if (!(key in obj)) {
          errors.push(`Missing required property: ${currentPath}`);
          continue;
        }
        
        const actualValue = obj[key];
        
        if (expectedValue && typeof expectedValue === 'object' && expectedValue.constructor === Object) {
          // Nested object
          if (typeof actualValue !== 'object' || actualValue === null) {
            errors.push(`Expected object at ${currentPath}, got ${typeof actualValue}`);
          } else {
            validateObject(actualValue, expectedValue, currentPath);
          }
        } else if (Array.isArray(expectedValue)) {
          // Array validation
          if (!Array.isArray(actualValue)) {
            errors.push(`Expected array at ${currentPath}, got ${typeof actualValue}`);
          }
        } else if (typeof expectedValue === 'function') {
          // Jest matcher or function
          try {
            if (expectedValue.name === 'any') {
              // Jest expect.any() matcher
              const expectedType = expectedValue.sample;
              if (typeof actualValue !== expectedType.name.toLowerCase()) {
                errors.push(`Expected ${expectedType.name} at ${currentPath}, got ${typeof actualValue}`);
              }
            }
          } catch (e) {
            // Custom validation function
            if (!expectedValue(actualValue)) {
              errors.push(`Validation failed for ${currentPath}`);
            }
          }
        }
      }
    }
    
    validateObject(output, expectedStructure);
    return errors;
  }

  /**
   * Create a comprehensive test environment
   */
  static async setupTestEnvironment(testName) {
    const testDir = `./test/temp/${testName}`;
    const dirs = [
      `${testDir}/downloads`,
      `${testDir}/output`,
      `${testDir}/pdfs`
    ];
    
    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }
    
    return {
      testDir,
      downloadDir: `${testDir}/downloads`,
      outputDir: `${testDir}/output`,
      pdfDir: `${testDir}/pdfs`,
      cleanup: async () => {
        await TestHelpers.cleanupTestFiles(testDir);
        try {
          await fs.rmdir(testDir);
        } catch (e) {
          // Ignore
        }
      }
    };
  }

  /**
   * Mock console methods to capture output during tests
   */
  static mockConsole() {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    
    const logs = [];
    const errors = [];
    const warnings = [];
    
    console.log = jest.fn((...args) => {
      logs.push(args.join(' '));
    });
    
    console.error = jest.fn((...args) => {
      errors.push(args.join(' '));
    });
    
    console.warn = jest.fn((...args) => {
      warnings.push(args.join(' '));
    });
    
    return {
      logs,
      errors,
      warnings,
      restore: () => {
        console.log = originalLog;
        console.error = originalError;
        console.warn = originalWarn;
      }
    };
  }

  /**
   * Performance testing helper
   */
  static async measurePerformance(asyncFunction, iterations = 1) {
    const measurements = [];
    
    for (let i = 0; i < iterations; i++) {
      const startTime = process.hrtime.bigint();
      await asyncFunction();
      const endTime = process.hrtime.bigint();
      
      const durationMs = Number(endTime - startTime) / 1000000; // Convert to milliseconds
      measurements.push(durationMs);
    }
    
    const average = measurements.reduce((a, b) => a + b) / measurements.length;
    const min = Math.min(...measurements);
    const max = Math.max(...measurements);
    
    return {
      average,
      min,
      max,
      measurements,
      iterations
    };
  }
}

module.exports = TestHelpers; 