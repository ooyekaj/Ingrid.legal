#!/usr/bin/env node

/**
 * Debug test for dependency discovery with detailed output
 */

const fs = require('fs').promises;
const { HierarchicalPDFScraper } = require('./hierarchial_scraper.js');

async function debugDiscovery() {
  console.log('🔍 DEBUG: Testing Discovery with Lower Thresholds');
  console.log('='.repeat(80));
  
  // Test with very low confidence threshold to see what gets discovered
  const scraper = new HierarchicalPDFScraper({
    enableDependencyDiscovery: true,
    discoveryConfidenceThreshold: 0.3,  // Much lower threshold
    maxDiscoveryDepth: 3
  });
  
  try {
    // Load extraction results
    const data = await fs.readFile('./ccp_results/ccp_filing_rules_extraction_results.json', 'utf8');
    const extractedData = JSON.parse(data);
    
    console.log(`📊 Loaded ${extractedData.extracted_documents.length} documents`);
    
    // Get manual critical sections
    const manualSections = scraper.getCriticalSections();
    console.log(`📋 Manual sections: ${manualSections.length}`);
    
    // Debug: Check what's in the extraction data
    console.log('\n🔍 DEBUG: Sample extraction data structure');
    const sampleDoc = extractedData.extracted_documents[0];
    if (sampleDoc) {
      console.log('Sample document structure:');
      console.log('- ruleNumber:', sampleDoc.rule_info?.ruleNumber);
      console.log('- title:', sampleDoc.rule_info?.title);
      console.log('- cross_references:', sampleDoc.ccp_analysis?.cross_references?.length || 0);
      console.log('- enhanced_cross_references:', Object.keys(sampleDoc.ccp_analysis?.enhanced_cross_references || {}));
      console.log('- relationship_analysis:', Object.keys(sampleDoc.ccp_analysis?.relationship_analysis || {}));
    }
    
    // Test discovery with debug output
    const discoveredRules = await scraper.dependencyDiscovery.discoverRelatedRules(
      manualSections,
      extractedData
    );
    
    console.log(`\n📊 Total discovered at 0.3 threshold: ${discoveredRules.length}`);
    
    // Show first few discoveries
    discoveredRules.slice(0, 5).forEach((rule, index) => {
      console.log(`\n${index + 1}. CCP ${rule.ruleNumber}`);
      console.log(`   Confidence: ${(rule.confidence * 100).toFixed(1)}%`);
      console.log(`   Method: ${rule.discoveryMethod}`);
      console.log(`   Reasons: ${rule.reasons.join('; ')}`);
    });
    
    // Test different thresholds
    console.log('\n📊 Discovery counts at different thresholds:');
    [0.3, 0.4, 0.5, 0.6, 0.7, 0.75, 0.8, 0.85].forEach(threshold => {
      const count = discoveredRules.filter(r => r.confidence >= threshold).length;
      console.log(`   ${threshold}: ${count} rules`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugDiscovery().catch(console.error); 