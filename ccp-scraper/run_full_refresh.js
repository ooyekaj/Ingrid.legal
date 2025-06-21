#!/usr/bin/env node

/**
 * Full Refresh CCP Scraper
 * 
 * This script runs the CCP scraper with force refresh enabled,
 * bypassing all PDF age checking and processing all rules from scratch.
 * 
 * Usage:
 *   node run_full_refresh.js
 */

const { HierarchicalPDFScraper } = require('./hierarchial_scraper.js');

async function runFullRefresh() {
  console.log('🔄 Running CCP Scraper with FULL REFRESH mode enabled');
  console.log('📋 This will bypass all age checking and process all rules from scratch');
  console.log('⏰ This may take significantly longer than a normal run');
  console.log('='.repeat(80));

  const scraper = new HierarchicalPDFScraper({
    downloadDir: './ccp_pdfs',
    outputDir: './ccp_results',
    delay: 2000,
    maxConcurrent: 2,
    forceRefresh: true // Force refresh enabled
  });

  try {
    console.log('🚀 Starting CCP PDF-first scraping with FORCE REFRESH...');
    const results = await scraper.scrapeHierarchicalPDFs();
    
    console.log('\n🎉 CCP scraping completed successfully!');
    console.log(`📊 Total documents processed: ${results.extracted_documents?.length || 0}`);
    
    const successful = results.extracted_documents?.filter(d => d.file_info?.status === 'success') || [];
    console.log(`✅ Successful extractions: ${successful.length}`);
    
    // Auto-run knowledge graph generation after successful scraping
    if (successful.length > 0) {
      console.log('\n🧠 Starting knowledge graph generation...');
      console.log('='.repeat(60));
      
      try {
        // Import and run the knowledge graph script
        const { CCPKnowledgeGraph } = require('./ccp_knowledge_graph.js');
        
        const knowledgeGraph = new CCPKnowledgeGraph({
          inputFile: './ccp_results/ccp_filing_rules_extraction_results.json',
          outputDir: './ccp_knowledge_graph'
        });

        await knowledgeGraph.initialize();
        const analysis = await knowledgeGraph.generateKnowledgeGraph();
        
        console.log('\n🎉 Knowledge graph generation completed successfully!');
        console.log('\n📊 Knowledge Graph Stats:');
        console.log(`   • ${analysis.totalNodes} CCP sections analyzed`);
        console.log(`   • ${analysis.totalEdges} relationships discovered`);
        console.log(`   • ${Object.keys(analysis.categories).length} categories identified`);
        console.log(`   • Top connected section: CCP ${analysis.centralNodes[0]?.section} (${analysis.centralNodes[0]?.degree} connections)`);
        
        console.log('\n📁 Generated knowledge graph files:');
        console.log('   • ./ccp_knowledge_graph/ccp_knowledge_graph.html - Interactive visualization');
        console.log('   • ./ccp_knowledge_graph/ccp_knowledge_graph.graphml - For Gephi/yEd analysis');
        console.log('   • ./ccp_knowledge_graph/ccp_knowledge_graph_cytoscape.json - For web development');
        console.log('   • ./ccp_knowledge_graph/ccp_knowledge_graph_d3.json - For D3.js visualizations');
        console.log('   • ./ccp_knowledge_graph/analysis_report.md - Detailed analysis report');
        
        console.log('\n🌐 Open ./ccp_knowledge_graph/ccp_knowledge_graph.html in your browser to explore the interactive knowledge graph!');
        
      } catch (graphError) {
        console.error('❌ Knowledge graph generation failed:', graphError.message);
        console.log('⚠️  CCP scraping completed successfully, but knowledge graph generation failed.');
        console.log('💡 You can manually run the knowledge graph script later with: node ccp_knowledge_graph.js');
      }
    } else {
      console.log('\n⚠️  No successful extractions found. Skipping knowledge graph generation.');
    }
    
  } catch (error) {
    console.error('❌ CCP scraping failed:', error);
    process.exit(1);
  }
}

// Run the full refresh
if (require.main === module) {
  runFullRefresh();
}

module.exports = { runFullRefresh }; 