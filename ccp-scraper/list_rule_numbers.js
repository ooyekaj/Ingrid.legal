#!/usr/bin/env node

/**
 * CCP Rule Numbers Lister
 * 
 * Extracts and displays all rule numbers from ccp_filing_rules_extraction_results.json
 * in numerical order for easy reference.
 */

const fs = require('fs').promises;
const path = require('path');

async function listRuleNumbers() {
  try {
    console.log('📋 Extracting CCP Rule Numbers...');
    console.log('='.repeat(50));
    
    // Read the CCP extraction results
    const resultsPath = path.join('./ccp_results', 'ccp_filing_rules_extraction_results.json');
    const resultsContent = await fs.readFile(resultsPath, 'utf8');
    const results = JSON.parse(resultsContent);
    
    // Extract rule numbers
    const ruleNumbers = [];
    
    if (results.extracted_documents && Array.isArray(results.extracted_documents)) {
      for (const doc of results.extracted_documents) {
        if (doc.rule_info?.ruleNumber) {
          ruleNumbers.push(doc.rule_info.ruleNumber);
        }
      }
    }
    
    if (ruleNumbers.length === 0) {
      console.log('❌ No rule numbers found in the results file');
      return;
    }
    
    // Remove duplicates
    const uniqueRuleNumbers = [...new Set(ruleNumbers)];
    
    // Sort numerically (handling lettered subsections like 12a, 12c, etc.)
    uniqueRuleNumbers.sort((a, b) => {
      // Handle complex section numbers with dots (like 410.10, 2025.480)
      const parseSection = (section) => {
        const match = section.match(/^(\d+)(\.\d+)?([a-z]*)?$/);
        if (match) {
          const mainNum = parseInt(match[1]);
          const subNum = match[2] ? parseFloat(match[2]) : 0;
          const letter = match[3] || '';
          return { mainNum, subNum, letter };
        }
        
        // Fallback for any unexpected formats
        return { mainNum: parseInt(section) || 0, subNum: 0, letter: '' };
      };
      
      const aParts = parseSection(a);
      const bParts = parseSection(b);
      
      // Compare main numbers first
      if (aParts.mainNum !== bParts.mainNum) {
        return aParts.mainNum - bParts.mainNum;
      }
      
      // Then compare sub-numbers (decimal parts)
      if (aParts.subNum !== bParts.subNum) {
        return aParts.subNum - bParts.subNum;
      }
      
      // Finally compare letters
      return aParts.letter.localeCompare(bParts.letter);
    });
    
    // Display results
    console.log(`📊 Found ${uniqueRuleNumbers.length} CCP rule numbers:`);
    console.log('');
    
    // Display in columns for better readability
    const columns = 5;
    for (let i = 0; i < uniqueRuleNumbers.length; i += columns) {
      const row = uniqueRuleNumbers.slice(i, i + columns);
      const formattedRow = row.map(num => num.padEnd(8)).join('  ');
      console.log(formattedRow);
    }
    
    console.log('');
    console.log('📋 Summary:');
    console.log(`   • Total rules: ${uniqueRuleNumbers.length}`);
    console.log(`   • First rule: ${uniqueRuleNumbers[0]}`);
    console.log(`   • Last rule: ${uniqueRuleNumbers[uniqueRuleNumbers.length - 1]}`);
    
    // Count by number ranges for additional insights
    const ranges = {
      '1-99': 0,
      '100-499': 0,
      '500-999': 0,
      '1000-1999': 0,
      '2000+': 0
    };
    
    uniqueRuleNumbers.forEach(rule => {
      const mainNum = parseInt(rule.match(/^(\d+)/)[1]);
      if (mainNum < 100) ranges['1-99']++;
      else if (mainNum < 500) ranges['100-499']++;
      else if (mainNum < 1000) ranges['500-999']++;
      else if (mainNum < 2000) ranges['1000-1999']++;
      else ranges['2000+']++;
    });
    
    console.log('\n📊 Distribution by number ranges:');
    for (const [range, count] of Object.entries(ranges)) {
      if (count > 0) {
        console.log(`   • CCP ${range}: ${count} rules`);
      }
    }
    
    // Save to file for easy reference
    const outputPath = path.join('./ccp_results', 'ccp_rule_numbers_list.txt');
    const outputContent = `CCP Rule Numbers List\nGenerated: ${new Date().toISOString()}\nTotal Rules: ${uniqueRuleNumbers.length}\n\n${uniqueRuleNumbers.join('\n')}`;
    await fs.writeFile(outputPath, outputContent);
    
    console.log(`\n💾 Rule numbers list saved to: ${outputPath}`);
    
    // Also save as JSON for programmatic use
    const jsonOutputPath = path.join('./ccp_results', 'ccp_rule_numbers.json');
    const jsonOutput = {
      generated_at: new Date().toISOString(),
      total_rules: uniqueRuleNumbers.length,
      rule_numbers: uniqueRuleNumbers,
      first_rule: uniqueRuleNumbers[0],
      last_rule: uniqueRuleNumbers[uniqueRuleNumbers.length - 1],
      distribution: ranges
    };
    await fs.writeFile(jsonOutputPath, JSON.stringify(jsonOutput, null, 2));
    
    console.log(`💾 Rule numbers JSON saved to: ${jsonOutputPath}`);
    
    return uniqueRuleNumbers;
    
  } catch (error) {
    console.error('❌ Error listing rule numbers:', error.message);
    
    if (error.code === 'ENOENT') {
      console.log('\n💡 Make sure you have run the CCP scraper first:');
      console.log('   node hierarchial_scraper.js');
      console.log('   or');
      console.log('   node run_full_refresh.js');
    }
    
    return [];
  }
}

// Run the script
if (require.main === module) {
  listRuleNumbers();
}

module.exports = { listRuleNumbers };

console.log('🎯 UPDATED CRITICAL CCP SECTIONS FOR FILING, DEADLINES, AND FORMATTING:\n');

const criticalSections = [
  // Original critical sections
  'CCP 437c - Summary Judgment Motion Requirements',
  'CCP 1005 - Motion Filing Deadlines',
  'CCP 1013 - Service Time Extensions',
  'CCP 12 - Time Computation Rules',
  'CCP 430.30 - Demurrer Filing Deadline',
  'CCP 2024.020 - Discovery Cutoff',
  'CCP 2030.300 - Motion to Compel Interrogatories',
  'CCP 2031.310 - Motion to Compel Documents',
  'CCP 2025.480 - Motion to Compel Deposition',
  'CCP 1010 - Service Methods',
  'CCP 1010.6 - Electronic Filing Procedures',
  'CCP 430.10 - Demurrer Grounds',
  'CCP 430.20 - Demurrer Procedure',
  'CCP 430.41 - Meet and Confer for Demurrer',
  'CCP 435 - Motion to Strike Procedure',
  'CCP 472 - Amendment Procedure',
  'CCP 1003 - Ex Parte Application Procedure',
  'CCP 473 - Relief from Default',
  'CCP 392 - Proper Venue',
  'CCP 410.10 - Jurisdiction',
  'CCP 411.10 - Commencing Actions',
  'CCP 425.10 - Complaint Contents',
  'CCP 425.11 - Complaint Caption',
  'CCP 425.12 - Verification Requirements',
  'CCP 431.30 - Answer Contents',
  'CCP 426.10 - Cross-Complaint Requirements',
  'CCP 1014 - Proof of Service',
  'CCP 2025.010 - Deposition Notice',
  'CCP 2030.010 - Interrogatory Requirements',
  'CCP 2031.010 - Document Request Requirements',
  'CCP 664 - Judgment Filing Requirements',
  'CCP 367 - Capacity to Sue',
  'CCP 372 - Minor/Incapacitated Persons',
  'CCP 128.7 - Document Format Standards',
  'CCP 1086 - Writ of Mandate Filing',
  'CCP 1094.5 - Administrative Mandate Filing',
  'CCP 527 - TRO Filing Requirements',
  
  // NEW SECTIONS ADDED FOR COMPREHENSIVE FILING RULES
  '✨ CCP 659 - Motion for New Trial (30-day post-trial deadline)',
  '✨ CCP 659a - New Trial Motion Requirements (format/content)',
  '✨ CCP 663 - Motion for Judgment Notwithstanding Verdict (JNOV)',
  '✨ CCP 1013a - Electronic Service Time Extensions (modern e-filing)',
  '✨ CCP 1010.5 - Overnight Delivery Service (filing method)',
  '✨ CCP 36 - Calendar Preferences (scheduling affects deadlines)',
  '✨ CCP 1048 - Consolidation of Actions (filing procedures)'
];

console.log('📋 CRITICAL FILING SECTIONS (', criticalSections.length, 'total):\n');

criticalSections.forEach((section, index) => {
  if (section.startsWith('✨')) {
    console.log(`${index + 1}. ${section}`);
  } else {
    console.log(`${index + 1}. ${section}`);
  }
});

console.log('\n🎯 FILING QUESTIONS ANSWERED BY THESE SECTIONS:');
console.log('');
console.log('⏰ WHEN: Filing deadlines, time computation, extensions');
console.log('   - CCP 12, 12a, 12c (time computation)');
console.log('   - CCP 1005 (motion deadlines)');
console.log('   - CCP 1013, 1013a (service extensions)');
console.log('   - CCP 659, 663 (post-trial deadlines)');
console.log('   - CCP 36 (calendar preferences)');
console.log('');
console.log('🔧 HOW: Filing procedures, service methods, formats');
console.log('   - CCP 1010, 1010.5, 1010.6 (service methods)');
console.log('   - CCP 430.10-.41 (demurrer procedures)');
console.log('   - CCP 435, 437c (motion procedures)');
console.log('   - CCP 659a (new trial motion format)');
console.log('   - CCP 1048 (consolidation procedures)');
console.log('');
console.log('📍 WHERE: Venue, jurisdiction, proper court');
console.log('   - CCP 392 (venue)');
console.log('   - CCP 410.10, 411.10 (jurisdiction)');
console.log('   - CCP 36 (calendar preferences)');
console.log('');
console.log('📝 WHAT: Required document contents, components');
console.log('   - CCP 425.10-.12 (complaint requirements)');
console.log('   - CCP 437c (summary judgment components)');
console.log('   - CCP 659a (new trial motion contents)');
console.log('   - CCP 1014 (proof of service contents)');
console.log('');
console.log('👤 WHO: Capacity, authority to file');
console.log('   - CCP 367 (capacity to sue)');
console.log('   - CCP 372 (minors/incapacitated)');
console.log('   - CCP 425.12 (verification authority)');
console.log('');
console.log('📄 FORMAT: Document formatting requirements');
console.log('   - CCP 128.7 (document format standards)');
console.log('   - CCP 425.11 (caption format)');
console.log('');
console.log('🏆 ENHANCED COVERAGE NOW INCLUDES:');
console.log('✅ Post-trial filing procedures (659, 659a, 663)');
console.log('✅ Modern electronic filing extensions (1013a)');
console.log('✅ Additional service methods (1010.5)');
console.log('✅ Case management affecting deadlines (36, 1048)');
console.log('✅ Comprehensive WHEN/HOW/WHERE/WHAT/WHO/FORMAT questions');
console.log('');
console.log('🎯 This covers the most critical CCP sections for document filing,');
console.log('   deadlines, and formatting requirements in California courts.'); 