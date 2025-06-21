#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

const TEST_TYPES = {
  unit: { pattern: 'unit', description: 'Unit tests' },
  regression: { pattern: 'regression', description: 'Regression tests' },
  all: { pattern: '', description: 'All tests' }
};

function runTests(testType = 'all', options = {}) {
  const testConfig = TEST_TYPES[testType] || TEST_TYPES.all;
  
  const jestArgs = [
    '--verbose',
    '--detectOpenHandles',
    '--forceExit'
  ];

  if (testConfig.pattern) {
    jestArgs.push('--testPathPattern', testConfig.pattern);
  }

  if (options.coverage) {
    jestArgs.push('--coverage');
  }

  if (options.watch) {
    jestArgs.push('--watch');
  }

  if (options.updateSnapshots) {
    jestArgs.push('--updateSnapshot');
  }

  console.log(`🧪 Running ${testConfig.description}...`);
  console.log(`Command: npx jest ${jestArgs.join(' ')}\n`);

  const jestProcess = spawn('npx', ['jest', ...jestArgs], {
    stdio: 'inherit',
    cwd: path.dirname(__dirname)
  });

  jestProcess.on('close', (code) => {
    if (code === 0) {
      console.log(`\n✅ ${testConfig.description} passed!`);
    } else {
      console.log(`\n❌ ${testConfig.description} failed!`);
      process.exit(code);
    }
  });
}

// Parse command line arguments
const args = process.argv.slice(2);
const testType = args[0] || 'all';
const options = {
  coverage: args.includes('--coverage'),
  watch: args.includes('--watch'),
  updateSnapshots: args.includes('--update-snapshots')
};

runTests(testType, options); 