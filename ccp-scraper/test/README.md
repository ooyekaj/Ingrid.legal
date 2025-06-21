# California Legal Scraper Test Suite

This directory contains a comprehensive testing framework for the `HierarchicalPDFScraper` class, designed to ensure reliability, performance, and backward compatibility.

## 🧪 Test Structure

```
test/
├── fixtures/           # Mock data and test fixtures
│   └── mockData.js    # Centralized mock data
├── unit/              # Unit tests
│   └── hierarchical-scraper.unit.test.js
├── regression/        # Regression tests
│   └── scraper.regression.test.js
├── utils/             # Test utilities and helpers
│   └── testHelpers.js
├── setup.js           # Global test configuration
├── run-tests.js       # Test runner script
└── README.md          # This file
```

## 🚀 Quick Start

### Installation

```bash
# Install dependencies
npm install

# Or install just test dependencies
npm install --only=dev
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test types
npm run test:unit
npm run test:regression

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run specific tests with options
node test/run-tests.js unit --coverage
node test/run-tests.js regression
node test/run-tests.js all --coverage
```

## 📋 Test Categories

### Unit Tests (`test/unit/`)

Tests individual methods and functions in isolation:

- **Constructor & Initialization**: Validates proper setup and configuration
- **Section Filtering Logic**: Tests CCP section identification and filtering
- **File Management**: Tests filename generation and file operations
- **PDF Age Detection**: Tests logic for determining when to download fresh PDFs
- **Content Analysis**: Tests extraction and analysis of legal content
- **Python Script Generation**: Tests dynamic script creation
- **Error Handling**: Tests graceful error recovery
- **Utility Methods**: Tests helper functions and edge cases

### Regression Tests (`test/regression/`)

Ensures consistent behavior across versions:

- **Critical Section Detection**: Verifies essential CCP sections are always included
- **Output Format Consistency**: Validates data structure integrity
- **Backward Compatibility**: Tests legacy format support
- **Content Analysis Consistency**: Ensures stable keyword and pattern detection
- **Performance Regression**: Monitors performance characteristics
- **Data Integrity**: Validates consistent results across runs
- **Error Handling**: Tests graceful degradation
- **Version Compatibility**: Ensures configuration stability

## 🛠 Test Utilities

### TestHelpers Class

Located in `test/utils/testHelpers.js`, provides:

- Mock file creation (`createMockPDF`, `createMockTocData`)
- Test environment setup (`setupTestEnvironment`)
- Performance measurement (`measurePerformance`)
- Mock browser and process creation
- Console output capture
- Validation utilities

### Mock Data

Centralized in `test/fixtures/mockData.js`:

- Sample TOC links
- PDF analysis results
- Web scraped content
- File system data
- Error scenarios
- Expected output structures

## 🔧 Configuration

### Jest Configuration

The test suite uses Jest with these key configurations:

```javascript
{
  testEnvironment: 'node',
  testTimeout: 30000,
  collectCoverageFrom: ['*.js', '!test/**/*'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  }
}
```

### Environment Variables

- `VERBOSE_TESTS=true`: Enable verbose console output during tests
- `NODE_ENV=test`: Set automatically during test runs

## 📊 Coverage Reports

Coverage reports are generated in multiple formats:

- **Text**: Console output during test runs
- **LCOV**: Machine-readable format (`coverage/lcov.info`)
- **HTML**: Interactive reports (`coverage/index.html`)

View HTML coverage reports:
```bash
npm run test:coverage
open coverage/index.html
```

## 🎯 Writing New Tests

### Unit Test Example

```javascript
describe('New Feature', () => {
  let scraper;
  
  beforeEach(() => {
    scraper = TestHelpers.createMockScraper();
  });

  test('should handle new functionality', () => {
    // Arrange
    const input = { /* test data */ };
    
    // Act
    const result = scraper.newMethod(input);
    
    // Assert
    expect(result).toBeDefined();
    expect(result).toMatchObject(expectedStructure);
  });
});
```

### Regression Test Example

```javascript
test('should maintain feature consistency', () => {
  // Test that ensures behavior doesn't change between versions
  const results = [];
  
  for (let i = 0; i < 5; i++) {
    results.push(scraper.someMethod(testData));
  }
  
  // All results should be identical
  results.slice(1).forEach(result => {
    expect(result).toEqual(results[0]);
  });
});
```

## 🚨 Mocking Strategy

The test suite extensively mocks external dependencies:

### Playwright (Browser Automation)
```javascript
jest.mock('playwright', () => ({
  chromium: {
    launch: jest.fn(() => mockBrowser)
  }
}));
```

### File System
```javascript
jest.mock('fs', () => ({
  promises: {
    mkdir: jest.fn(),
    writeFile: jest.fn(),
    readFile: jest.fn()
  }
}));
```

### Child Processes
```javascript
jest.mock('child_process', () => ({
  spawn: jest.fn(() => mockProcess)
}));
```

## 🐛 Debugging Tests

### Debug Individual Tests
```bash
# Run specific test file
npx jest test/unit/hierarchical-scraper.unit.test.js

# Run specific test case
npx jest -t "should filter sections correctly"

# Debug with Node inspector
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Debug Output
```bash
# Enable verbose output
VERBOSE_TESTS=true npm test

# Run with Jest debug info
npx jest --verbose --no-cache
```

## 📈 Performance Testing

Performance regression tests monitor:

- Section filtering speed (< 2 seconds for 1000 sections)
- Content analysis efficiency (< 1 second for large text)
- Memory usage patterns
- Async operation timing

## 🔄 Continuous Integration

For CI/CD pipelines:

```yaml
# Example GitHub Actions configuration
- name: Run Tests
  run: |
    npm ci
    npm run test:coverage
    
- name: Upload Coverage
  uses: codecov/codecov-action@v2
  with:
    file: ./coverage/lcov.info
```

## 📝 Test Data Management

### Test Fixtures

Mock data is centralized and versioned to ensure:
- Consistent test results
- Easy maintenance
- Realistic test scenarios
- Edge case coverage

### Cleanup

Tests automatically clean up:
- Temporary files
- Mock directories
- Test databases
- Browser instances

## 🔍 Troubleshooting

### Common Issues

1. **Tests timeout**: Increase timeout in jest.config.js
2. **Memory leaks**: Check for unclosed browser instances
3. **File permissions**: Ensure test directories are writable
4. **Mock issues**: Verify mock implementations match actual APIs

### Debug Commands

```bash
# Check test configuration
npx jest --showConfig

# List all tests
npx jest --listTests

# Run tests with maximum output
npx jest --verbose --silent=false
```

## 🚀 Best Practices

1. **Isolation**: Each test should be independent
2. **Descriptive Names**: Use clear, specific test descriptions
3. **Arrange-Act-Assert**: Follow the AAA pattern
4. **Mock External Dependencies**: Don't make real network calls
5. **Test Edge Cases**: Include boundary conditions and error scenarios
6. **Maintain Coverage**: Aim for >70% code coverage
7. **Performance Awareness**: Monitor test execution time
8. **Documentation**: Keep test documentation up to date

---

For questions or issues with the test suite, refer to the main project documentation or create an issue in the repository. 