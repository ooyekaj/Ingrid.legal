#!/usr/bin/env node

/**
 * Test script for the Dependency Discovery Engine
 * Demonstrates hybrid approach: Manual Critical Sections + Auto-Discovery
 */

const fs = require('fs').promises;
const path = require('path');
const { HierarchicalPDFScraper } = require('./hierarchial_scraper.js');

class DependencyDiscoveryTester {
  constructor() {
    this.scraper = new HierarchicalPDFScraper({
      enableDependencyDiscovery: true,
      discoveryConfidenceThreshold: 0.75,
      maxDiscoveryDepth: 3
    });
    this.testResultsFile = './ccp_results/dependency_discovery_test_results.json';
  }

  async runDiscoveryTest() {
    console.log('🧪 DEPENDENCY DISCOVERY ENGINE TEST');
    console.log('='.repeat(80));
    
    try {
      // Step 1: Load existing extraction results (if available)
      const extractedData = await this.loadExistingExtractionResults();
      
      if (!extractedData) {
        console.log('❌ No extraction results found. Please run the main scraper first.');
        console.log('   Run: node hierarchial_scraper.js');
        return;
      }
      
      console.log(`📊 Loaded ${extractedData.extracted_documents.length} extracted documents for analysis`);
      
      // Step 2: Get manual critical sections
      const manualSections = this.scraper.getCriticalSections();
      console.log(`\n📋 Manual Critical Sections: ${manualSections.length}`);
      this.printSectionSummary('MANUAL CRITICAL SECTIONS', manualSections);
      
      // Step 3: Perform hybrid discovery
      console.log('\n🔬 Starting Hybrid Discovery Analysis...');
      console.log('='.repeat(60));
      
      const hybridSections = await this.scraper.getHybridCriticalSections(extractedData);
      
      // Step 4: Analyze discovery results
      const discoveredSections = hybridSections.filter(section => 
        section.source && section.source.startsWith('auto_discovered_')
      );
      
      console.log(`\n🎯 DISCOVERY RESULTS SUMMARY:`);
      console.log(`   Manual sections: ${manualSections.length}`);
      console.log(`   Auto-discovered: ${discoveredSections.length}`);
      console.log(`   Total hybrid: ${hybridSections.length}`);
      
      if (discoveredSections.length > 0) {
        this.printDiscoveredSections(discoveredSections);
      }
      
      // Step 5: Analyze filing question coverage
      await this.analyzeFilingQuestionCoverage(manualSections, discoveredSections);
      
      // Step 6: Save results
      await this.saveTestResults({
        timestamp: new Date().toISOString(),
        manualSections: manualSections.length,
        discoveredSections: discoveredSections.length,
        totalHybrid: hybridSections.length,
        manualSectionsList: manualSections,
        discoveredSectionsList: discoveredSections,
        hybridSectionsList: hybridSections
      });
      
      console.log(`\n💾 Test results saved to: ${this.testResultsFile}`);
      
    } catch (error) {
      console.error('❌ Error during dependency discovery test:', error);
    }
  }

  async loadExistingExtractionResults() {
    const possiblePaths = [
      './ccp_results/ccp_filing_rules_extraction_results.json',
      './extracted_content/ccp_filing_rules_extraction_results.json',
      './ccp_results/ccp_pymupdf_results.json'
    ];
    
    for (const filePath of possiblePaths) {
      try {
        const data = await fs.readFile(filePath, 'utf8');
        const parsed = JSON.parse(data);
        
        if (parsed.extracted_documents && Array.isArray(parsed.extracted_documents)) {
          console.log(`✅ Loaded extraction results from: ${filePath}`);
          return parsed;
        }
      } catch (error) {
        // Continue to next path
      }
    }
    
    return null;
  }

  printSectionSummary(title, sections) {
    console.log(`\n${title}:`);
    console.log('-'.repeat(40));
    
    // Group by filing questions
    const byQuestion = {
      'WHEN': [],
      'HOW': [],
      'WHERE': [],
      'WHAT': [],
      'WHO': [],
      'FORMAT': []
    };
    
    sections.forEach(section => {
      const source = section.source || '';
      if (source.includes('WHEN')) byQuestion.WHEN.push(section.ruleNumber);
      if (source.includes('HOW')) byQuestion.HOW.push(section.ruleNumber);
      if (source.includes('WHERE')) byQuestion.WHERE.push(section.ruleNumber);
      if (source.includes('WHAT')) byQuestion.WHAT.push(section.ruleNumber);
      if (source.includes('WHO')) byQuestion.WHO.push(section.ruleNumber);
      if (source.includes('FORMAT')) byQuestion.FORMAT.push(section.ruleNumber);
    });
    
    Object.entries(byQuestion).forEach(([question, rules]) => {
      if (rules.length > 0) {
        console.log(`   ${question}: ${rules.length} sections (${rules.join(', ')})`);
      }
    });
  }

  printDiscoveredSections(discoveredSections) {
    console.log(`\n🆕 AUTO-DISCOVERED SECTIONS:`);
    console.log('-'.repeat(60));
    
    discoveredSections.forEach((section, index) => {
      console.log(`${index + 1}. CCP ${section.ruleNumber} - ${section.title.replace(/^CCP Section \d+[a-z]?\s*-\s*/, '')}`);
      console.log(`   Confidence: ${(section.confidence * 100).toFixed(1)}%`);
      console.log(`   Method: ${section.discoveryMethod || section.source.replace('auto_discovered_', '')}`);
      console.log(`   Filing Questions: ${section.filingQuestions?.join(', ') || 'None detected'}`);
      
      if (section.discoveryReasons && section.discoveryReasons.length > 0) {
        console.log(`   Reasons: ${section.discoveryReasons.join('; ')}`);
      }
      console.log('');
    });
  }

  async analyzeFilingQuestionCoverage(manualSections, discoveredSections) {
    console.log(`\n📊 FILING QUESTION COVERAGE ANALYSIS:`);
    console.log('-'.repeat(50));
    
    const coverage = {
      manual: { WHEN: 0, HOW: 0, WHERE: 0, WHAT: 0, WHO: 0, FORMAT: 0 },
      discovered: { WHEN: 0, HOW: 0, WHERE: 0, WHAT: 0, WHO: 0, FORMAT: 0 },
      total: { WHEN: 0, HOW: 0, WHERE: 0, WHAT: 0, WHO: 0, FORMAT: 0 }
    };
    
    // Count manual sections
    manualSections.forEach(section => {
      const source = section.source || '';
      Object.keys(coverage.manual).forEach(question => {
        if (source.includes(question)) {
          coverage.manual[question]++;
          coverage.total[question]++;
        }
      });
    });
    
    // Count discovered sections
    discoveredSections.forEach(section => {
      const questions = section.filingQuestions || [];
      questions.forEach(question => {
        if (coverage.discovered[question] !== undefined) {
          coverage.discovered[question]++;
          coverage.total[question]++;
        }
      });
    });
    
    // Print coverage analysis
    console.log('Filing Question | Manual | Discovered | Total | Improvement');
    console.log('-'.repeat(60));
    
    Object.keys(coverage.manual).forEach(question => {
      const manual = coverage.manual[question];
      const discovered = coverage.discovered[question];
      const total = coverage.total[question];
      const improvement = discovered > 0 ? `+${discovered}` : '-';
      
      console.log(`${question.padEnd(14)} | ${manual.toString().padStart(6)} | ${discovered.toString().padStart(10)} | ${total.toString().padStart(5)} | ${improvement.padStart(11)}`);
    });
    
    const totalManual = Object.values(coverage.manual).reduce((a, b) => a + b, 0);
    const totalDiscovered = Object.values(coverage.discovered).reduce((a, b) => a + b, 0);
    const totalCombined = Object.values(coverage.total).reduce((a, b) => a + b, 0);
    
    console.log('-'.repeat(60));
    console.log(`${'TOTAL'.padEnd(14)} | ${totalManual.toString().padStart(6)} | ${totalDiscovered.toString().padStart(10)} | ${totalCombined.toString().padStart(5)} | +${totalDiscovered.toString().padStart(10)}`);
    
    if (totalDiscovered > 0) {
      const improvementPercent = ((totalDiscovered / totalManual) * 100).toFixed(1);
      console.log(`\n🎯 Discovery improved coverage by ${improvementPercent}%`);
    }
  }

  async saveTestResults(results) {
    try {
      await fs.mkdir('./ccp_results', { recursive: true });
      await fs.writeFile(this.testResultsFile, JSON.stringify(results, null, 2));
    } catch (error) {
      console.error('❌ Error saving test results:', error);
    }
  }
}

// Main execution
async function main() {
  const tester = new DependencyDiscoveryTester();
  await tester.runDiscoveryTest();
}

// Handle command line execution
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { DependencyDiscoveryTester }; 