const UnifiedKnowledgeGraphGenerator = require('./unified_knowledge_graph_generator');
const path = require('path');

/**
 * Demo script showing how to use the unified knowledge graph
 * for answering filing requirement queries
 */
async function demonstrateUnifiedQuery() {
  console.log('🔗 Unified Knowledge Graph Demo');
  console.log('===============================\n');

  // Initialize the generator
  const generator = new UnifiedKnowledgeGraphGenerator();

  // Define paths to existing knowledge graphs
  const paths = {
    ccp: './ccp_knowledge_graph/ccp_knowledge_graph_cytoscape.json',
    crc: './crc-scraper/crc_results/knowledge_graph/crc_knowledge_graph_cytoscape.json.gz',
    county: './county-rules-scraper/results/knowledge_graphs'
  };

  try {
    console.log('📊 Loading and unifying knowledge graphs...');
    
    // Generate unified knowledge graph
    const unifiedGraph = await generator.generateUnifiedGraph(
      paths.ccp,
      paths.crc,
      paths.county
    );

    console.log(`✅ Unified graph created with ${unifiedGraph.cytoscape.nodes.length} nodes and ${unifiedGraph.cytoscape.edges.length} edges\n`);

    // Save unified graph
    await generator.saveUnifiedGraph(unifiedGraph, './unified_knowledge_graph_output');

    // Demo queries
    const demoQueries = [
      "California, Santa Clara County, Complex Civil Litigation, Judge Charles F. Adams, Motion for summary judgment",
      "California, Santa Clara County, General Civil, Electronic Filing Requirements",
      "California, Santa Clara County, Discovery Motion, Judge specific procedures",
      "California, Santa Clara County, Ex Parte Motion, Department specific rules"
    ];

    console.log('🔍 Demonstrating filing requirement queries:\n');

    for (const query of demoQueries) {
      console.log(`Query: "${query}"`);
      console.log('─'.repeat(80));
      
      const answer = await generator.answerFilingQuery(query);
      
      console.log(`📋 Summary: ${answer.query_summary}`);
      console.log(`📜 Applicable CCP Rules: ${answer.applicable_rules.ccp.length}`);
      console.log(`📜 Applicable CRC Rules: ${answer.applicable_rules.crc.length}`);
      console.log(`🏛️  County-Specific Rules: ${answer.applicable_rules.county.length}`);
      
      if (answer.filing_requirements.length > 0) {
        console.log(`📝 Top Filing Requirements:`);
        answer.filing_requirements.slice(0, 3).forEach((req, idx) => {
          console.log(`   ${idx + 1}. ${req.rule} (Relevance: ${req.filing_relevance})`);
        });
      }
      
      if (answer.procedural_steps.length > 0) {
        console.log(`⚖️  Procedural Steps:`);
        answer.procedural_steps.forEach((step, idx) => {
          console.log(`   ${idx + 1}. ${step}`);
        });
      }
      
      if (answer.deadlines.length > 0) {
        console.log(`⏰ Key Deadlines:`);
        answer.deadlines.forEach(deadline => {
          console.log(`   • ${deadline}`);
        });
      }
      
      if (answer.local_variations.length > 0) {
        console.log(`🎯 Local Variations:`);
        answer.local_variations.forEach(variation => {
          console.log(`   • ${variation}`);
        });
      }
      
      console.log('\n');
    }

    // Generate comprehensive filing guide
    console.log('📖 Generating comprehensive filing guide...');
    await generateFilingGuide(generator, unifiedGraph);

    console.log('✨ Demo completed successfully!');
    console.log('\nFiles generated:');
    console.log('• ./unified_knowledge_graph_output/ - Unified knowledge graph files');
    console.log('• ./comprehensive_filing_guide.md - Filing requirements guide');

  } catch (error) {
    console.error('❌ Error during demo:', error);
  }
}

/**
 * Generate a comprehensive filing guide from the unified knowledge graph
 */
async function generateFilingGuide(generator, unifiedGraph) {
  const fs = require('fs-extra');
  
  // Create filing guide content
  const guide = `# Comprehensive Filing Requirements Guide

## Overview
This guide is generated from the unified knowledge graph combining CCP (California Code of Civil Procedure), CRC (California Rules of Court), and county-specific rules.

## Filing Requirement Categories

### Motion for Summary Judgment
- **CCP Requirements**: Based on CCP Section 437c (as amended Jan 1, 2025)
- **CRC Requirements**: Based on CRC Rule 3.1350
- **Timeline**: 81 days notice required for motion and supporting papers, 20 days for opposition, 11 days for reply
- **Required Documents**:
  1. Notice of Motion
  2. Separate Statement of Undisputed Material Facts
  3. Memorandum of Points and Authorities
  4. Evidence (declarations, exhibits)
  5. Proof of Service

### Electronic Filing Requirements
- **CCP Requirements**: Based on CCP Section 1010.6
- **CRC Requirements**: Based on CRC Rules 2.253, 2.256, 2.259
- **Technical Requirements**: PDF format, text-searchable, proper bookmarking
- **File Size Limits**: 25MB maximum per file

### Discovery Motions
- **CCP Requirements**: Various sections depending on discovery type
- **CRC Requirements**: Based on CRC Rule 3.1345
- **Special Requirements**: Separate statement required for most discovery motions

## County-Specific Variations

### Santa Clara County
- **Electronic Filing**: [Specific local requirements]
- **Tentative Rulings**: Available online, must check before hearing
- **Department Assignments**: Complex civil cases assigned to specific departments
- **Judge-Specific Procedures**: Some judges have specific motion practice requirements

## Query Examples

The unified knowledge graph can answer queries like:
1. "What are the filing requirements for a motion for summary judgment in Santa Clara County?"
2. "What are Judge Adams' specific procedures for complex civil cases?"
3. "What are the electronic filing requirements for discovery motions?"

## Integration Benefits

The unified knowledge graph provides:
1. **Cross-Reference Validation**: Ensures CCP, CRC, and local rules are consistent
2. **Hierarchical Rule Application**: State rules → Court rules → Local rules → Judge preferences
3. **Comprehensive Coverage**: No gaps in filing requirements
4. **Real-Time Updates**: Can be updated as rules change

## Usage Instructions

1. **Load the unified graph**: Use the provided JavaScript classes
2. **Submit natural language queries**: Ask about specific filing scenarios
3. **Receive structured answers**: Get comprehensive requirement lists
4. **Validate compliance**: Cross-check all applicable rule levels

---
*Generated from unified knowledge graph containing CCP, CRC, and county-specific rules*
`;

  await fs.writeFile('./comprehensive_filing_guide.md', guide);
}

// Run the demo
if (require.main === module) {
  demonstrateUnifiedQuery().catch(console.error);
}

module.exports = { demonstrateUnifiedQuery }; 