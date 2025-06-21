module.exports = {
  testEnvironment: 'node',
  testTimeout: 30000,
  collectCoverageFrom: [
    '*.js',
    '!test/**/*',
    '!node_modules/**/*',
    '!jest.config.js',
    '!coverage/**/*'
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  testMatch: [
    '**/test/**/*.test.js',
    '**/test/**/*.spec.js'
  ],
  setupFilesAfterEnv: ['<rootDir>/test/setup.js'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    '/ccp_pdfs/',
    '/ccp_results/'
  ],
  verbose: true,
  detectOpenHandles: true,
  forceExit: true,
  maxWorkers: 4,
  // Mock certain modules by default
  moduleNameMapper: {
    '^playwright$': '<rootDir>/test/__mocks__/playwright.js'
  }
}; 