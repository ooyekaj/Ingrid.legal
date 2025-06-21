#!/usr/bin/env node

/**
 * Test Script: Download Method Optimization
 * 
 * This script demonstrates how the enhanced PDF download system
 * learns and optimizes download methods for better efficiency.
 */

const { HierarchicalPDFScraper } = require('./hierarchial_scraper.js');

async function testDownloadMethodOptimization() {
  console.log('🧪 Testing Download Method Optimization System');
  console.log('='.repeat(60));

  const scraper = new HierarchicalPDFScraper({
    downloadDir: './test_pdfs',
    outputDir: './test_results',
    delay: 1000,
    maxConcurrent: 1,
    forceRefresh: false
  });

  await scraper.initialize();

  // Simulate some download method learning
  console.log('\n📊 Testing cache operations...');
  
  // Test 1: Initially no preferred method
  let preferred = scraper.getPreferredDownloadMethod('12');
  console.log(`🔍 CCP 12 preferred method (initial): ${preferred || 'None'}`);

  // Test 2: Simulate successful downloads with different methods
  console.log('\n📈 Simulating download attempts...');
  scraper.updateDownloadMethodCache('12', 'pdf_link', true);
  scraper.updateDownloadMethodCache('437', 'browser_print', true);
  scraper.updateDownloadMethodCache('1005', 'print_button', true);
  scraper.updateDownloadMethodCache('12a', 'pdf_link', true);

  // Test 3: Check preferred methods after learning
  console.log('\n🎯 Checking learned preferences...');
  preferred = scraper.getPreferredDownloadMethod('12');
  console.log(`✅ CCP 12 preferred method: ${preferred}`);
  
  preferred = scraper.getPreferredDownloadMethod('437');
  console.log(`✅ CCP 437 preferred method: ${preferred}`);
  
  preferred = scraper.getPreferredDownloadMethod('1005');
  console.log(`✅ CCP 1005 preferred method: ${preferred}`);

  preferred = scraper.getPreferredDownloadMethod('12a');
  console.log(`✅ CCP 12a preferred method: ${preferred}`);

  // Test 4: Save and reload cache
  console.log('\n💾 Testing cache persistence...');
  await scraper.saveDownloadMethodCache();
  
  // Create new scraper instance to test loading
  const scraper2 = new HierarchicalPDFScraper({
    downloadDir: './test_pdfs',
    outputDir: './test_results'
  });
  
  await scraper2.initialize();
  
  // Check if preferences were properly loaded
  preferred = scraper2.getPreferredDownloadMethod('12');
  console.log(`✅ CCP 12 preferred method (after reload): ${preferred}`);

  preferred = scraper2.getPreferredDownloadMethod('437');
  console.log(`✅ CCP 437 preferred method (after reload): ${preferred}`);

  // Test 5: Show cache statistics
  console.log('\n📊 Cache Statistics:');
  console.log(`   • Total cached methods: ${scraper2.downloadMethodCache.size}`);
  
  for (const [key, data] of scraper2.downloadMethodCache.entries()) {
    console.log(`   • ${key}: ${data.preferredMethod} (last updated: ${new Date(data.lastUpdated).toLocaleString()})`);
    for (const [method, stats] of Object.entries(data.attempts)) {
      if (stats.successes > 0 || stats.failures > 0) {
        console.log(`     - ${method}: ${stats.successes} successes, ${stats.failures} failures`);
      }
    }
  }

  console.log('\n🎉 Download Method Optimization Test Complete!');
  console.log('\n💡 Key Benefits:');
  console.log('   • Faster downloads by trying successful methods first');
  console.log('   • Persistent learning across script runs');
  console.log('   • Automatic fallback to standard sequence if preferred method fails');
  console.log('   • Statistics tracking for continuous improvement');
  
  console.log('\n📁 Cache file saved to: test_results/download_method_cache.json');
}

// Run the test
if (require.main === module) {
  testDownloadMethodOptimization().catch(console.error);
}

module.exports = { testDownloadMethodOptimization }; 