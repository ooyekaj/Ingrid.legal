const fs = require('fs').promises;
const path = require('path');

// Global test setup
beforeAll(async () => {
  // Create test directories
  const testDirs = [
    './test/fixtures',
    './test/temp',
    './test/mock_pdfs',
    './test/mock_downloads',
    './test/__mocks__'
  ];
  
  for (const dir of testDirs) {
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  }
  
  console.log('🧪 Test environment initialized');
});

// Clean up after all tests
afterAll(async () => {
  // Clean up test directories
  const cleanupDirs = ['./test/temp', './test/mock_downloads'];
  
  for (const dir of cleanupDirs) {
    try {
      await fs.rmdir(dir, { recursive: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  }
  
  console.log('🧹 Test cleanup completed');
});

// Global test configuration
jest.setTimeout(30000); // 30 second timeout for integration tests

// Console override for cleaner test output
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

beforeEach(() => {
  // Suppress verbose logging during tests unless explicitly needed
  if (!process.env.VERBOSE_TESTS) {
    console.log = jest.fn();
    console.error = jest.fn();
  }
});

afterEach(() => {
  // Restore original console methods
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
}); 