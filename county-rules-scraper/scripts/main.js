#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const { program } = require('commander');

const CountyConfigs = require('../src/config/CountyConfigs');
const UniversalScraper = require('../src/scrapers/UniversalScraper');
const OrderAnalyzer = require('../src/processors/OrderAnalyzer');
const VariationAnalyzer = require('../src/processors/VariationAnalyzer');
const KnowledgeGraphGenerator = require('../src/processors/KnowledgeGraphGenerator');

class CountyScraperMain {
  constructor() {
    this.countyConfigs = new CountyConfigs();
    this.scraper = null;
    this.orderAnalyzer = new OrderAnalyzer();
    this.knowledgeGraphGenerator = new KnowledgeGraphGenerator();
    this.outputDir = path.join(process.cwd(), 'results');
    this.documentsDir = path.join(process.cwd(), 'scraped_documents');
  }

  async initialize() {
    await fs.ensureDir(this.outputDir);
    await fs.ensureDir(this.documentsDir);
    
    this.scraper = new UniversalScraper({
      downloadDocuments: true,
      useHeadlessBrowser: false,
      maxConcurrent: 2
    });
  }

  async scrapeCounty(countyName, options = {}) {
    console.log(`\n🏛️  California County Rules Scraper`);
    console.log(`📍 Target County: ${countyName}`);
    console.log(`⏰ Started at: ${new Date().toLocaleString()}`);
    
    try {
      // Load county configuration
      const countyConfig = await this.countyConfigs.loadCountyConfig(countyName);
      console.log(`📋 Configuration loaded for ${countyConfig.county}`);
      console.log(`🌐 Base URL: ${countyConfig.baseUrl}`);

      // Perform scraping
      const scrapingResults = await this.scraper.scrapeCounty(countyConfig);
      console.log(`\n📊 Scraping completed!`);
      console.log(`   📄 Documents processed: ${scrapingResults.documents.length}`);
      console.log(`   ✅ Success rate: ${scrapingResults.stats.success_rate}`);

      // Analyze results
      const analysis = await this.analyzeResults(scrapingResults, options);
      
      // Save results
      const outputFile = await this.saveResults(countyName, scrapingResults, analysis);
      
      // Generate report
      await this.generateReport(countyName, scrapingResults, analysis, outputFile);
      
      return {
        county: countyName,
        documents: scrapingResults.documents.length,
        outputFile: outputFile,
        success: true
      };

    } catch (error) {
      console.error(`💥 Error scraping ${countyName}:`, error);
      return {
        county: countyName,
        error: error.message,
        success: false
      };
    } finally {
      await this.cleanup();
    }
  }

  async analyzeResults(scrapingResults, options) {
    console.log(`\n🔍 Analyzing results...`);
    
    const analysis = {
      county_summary: this.generateCountySummary(scrapingResults),
      document_analysis: this.analyzeDocuments(scrapingResults.documents),
      filing_procedures: this.extractFilingProcedures(scrapingResults.documents),
      high_priority_docs: this.identifyHighPriorityDocs(scrapingResults.documents),
      practitioner_insights: this.generatePractitionerInsights(scrapingResults.documents),
      compliance_requirements: this.extractComplianceRequirements(scrapingResults.documents)
    };

    // Enhanced analysis for orders
    if (options.analyzeOrders) {
      analysis.order_analysis = await this.analyzeOrders(scrapingResults.documents);
    }

    // Cross-reference analysis
    if (options.analyzeCrossReferences) {
      analysis.cross_references = this.analyzeCrossReferences(scrapingResults.documents);
    }

    // Generate knowledge graph
    if (options.generateKnowledgeGraph !== false) { // Default to true
      console.log(`   🕸️  Generating knowledge graph...`);
      analysis.knowledge_graph = await this.knowledgeGraphGenerator.generateKnowledgeGraph(
        scrapingResults.documents, 
        scrapingResults.countyConfig || { county: scrapingResults.county }
      );
      
      // Save knowledge graph files
      const kgOutputDir = path.join(this.outputDir, 'knowledge_graphs');
      await this.knowledgeGraphGenerator.saveKnowledgeGraph(
        analysis.knowledge_graph,
        kgOutputDir,
        scrapingResults.county
      );
      console.log(`   📊 Knowledge graph saved to ${kgOutputDir}`);
    }

    console.log(`   📈 Analysis completed`);
    return analysis;
  }

  generateCountySummary(scrapingResults) {
    return {
      county: scrapingResults.county,
      base_url: scrapingResults.baseUrl,
      scraped_at: scrapingResults.scraped_at,
      total_documents: scrapingResults.documents.length,
      success_rate: scrapingResults.stats.success_rate,
      document_formats: this.getFormatDistribution(scrapingResults.documents),
      document_types: this.getTypeDistribution(scrapingResults.documents),
      filing_relevance: this.getRelevanceDistribution(scrapingResults.documents)
    };
  }

  analyzeDocuments(documents) {
    const analysis = {
      total_count: documents.length,
      by_type: {},
      by_relevance: {},
      by_format: {},
      by_procedural_area: {},
      average_confidence: 0,
      processing_time: {
        total_ms: 0,
        average_ms: 0
      }
    };

    let totalConfidence = 0;
    let totalProcessingTime = 0;

    for (const doc of documents) {
      // Type distribution
      const docType = doc.classification?.document_type || 'UNKNOWN';
      analysis.by_type[docType] = (analysis.by_type[docType] || 0) + 1;

      // Relevance distribution
      const relevance = doc.classification?.filing_relevance || 'NONE';
      analysis.by_relevance[relevance] = (analysis.by_relevance[relevance] || 0) + 1;

      // Format distribution
      const format = doc.format || 'UNKNOWN';
      analysis.by_format[format] = (analysis.by_format[format] || 0) + 1;

      // Procedural area distribution
      const area = doc.classification?.procedural_area || 'ADMINISTRATIVE';
      analysis.by_procedural_area[area] = (analysis.by_procedural_area[area] || 0) + 1;

      // Confidence tracking
      const confidence = doc.classification?.confidence_score || 0;
      totalConfidence += confidence;

      // Processing time tracking
      const processingTime = doc.processing_time_ms || 0;
      totalProcessingTime += processingTime;
    }

    analysis.average_confidence = documents.length > 0 ? 
      (totalConfidence / documents.length).toFixed(1) : 0;
    
    analysis.processing_time.total_ms = totalProcessingTime;
    analysis.processing_time.average_ms = documents.length > 0 ? 
      Math.round(totalProcessingTime / documents.length) : 0;

    return analysis;
  }

  extractFilingProcedures(documents) {
    const procedures = {
      electronic_filing: [],
      deadlines: [],
      service_requirements: [],
      format_requirements: [],
      case_management: [],
      motion_practice: []
    };

    for (const doc of documents) {
      if (doc.classification?.filing_relevance === 'VERY_HIGH' || 
          doc.classification?.filing_relevance === 'HIGH') {
        
        // Extract specific procedure types
        if (doc.filing_analysis?.key_phrases) {
          for (const phrase of doc.filing_analysis.key_phrases) {
            if (phrase.includes('electronic filing') || phrase.includes('e-filing')) {
              procedures.electronic_filing.push({
                document: doc.title,
                url: doc.url,
                phrase: phrase
              });
            } else if (phrase.includes('deadline') || phrase.includes('filing')) {
              procedures.deadlines.push({
                document: doc.title,
                url: doc.url,
                phrase: phrase
              });
            } else if (phrase.includes('service')) {
              procedures.service_requirements.push({
                document: doc.title,
                url: doc.url,
                phrase: phrase
              });
            } else if (phrase.includes('case management')) {
              procedures.case_management.push({
                document: doc.title,
                url: doc.url,
                phrase: phrase
              });
            } else if (phrase.includes('motion')) {
              procedures.motion_practice.push({
                document: doc.title,
                url: doc.url,
                phrase: phrase
              });
            }
          }
        }
      }
    }

    // Limit results
    for (const [key, procedures_list] of Object.entries(procedures)) {
      procedures[key] = procedures_list.slice(0, 10);
    }

    return procedures;
  }

  identifyHighPriorityDocs(documents) {
    return documents
      .filter(doc => 
        doc.classification?.filing_relevance === 'VERY_HIGH' ||
        (doc.classification?.filing_relevance === 'HIGH' && 
         doc.classification?.confidence_score >= 70)
      )
      .sort((a, b) => (b.classification?.confidence_score || 0) - (a.classification?.confidence_score || 0))
      .slice(0, 20)
      .map(doc => ({
        title: doc.title,
        url: doc.url,
        type: doc.classification?.document_type,
        relevance: doc.classification?.filing_relevance,
        confidence: doc.classification?.confidence_score,
        key_insights: doc.filing_analysis?.key_phrases?.slice(0, 3) || []
      }));
  }

  generatePractitionerInsights(documents) {
    const insights = {
      must_know_changes: [],
      new_requirements: [],
      deadline_changes: [],
      technology_updates: [],
      procedure_modifications: []
    };

    for (const doc of documents) {
      if (doc.classification?.practitioner_impact?.level === 'VERY_HIGH' ||
          doc.classification?.practitioner_impact?.level === 'HIGH') {
        
        const insight = {
          document: doc.title,
          url: doc.url,
          impact_level: doc.classification.practitioner_impact.level,
          affected_areas: doc.classification.practitioner_impact.affected_areas || {}
        };

        // Categorize insights
        if (doc.metadata?.has_procedures) {
          insights.procedure_modifications.push(insight);
        }
        if (doc.metadata?.has_deadlines) {
          insights.deadline_changes.push(insight);
        }
        if (doc.classification?.practitioner_impact?.affected_areas?.TECHNOLOGY_CHANGE) {
          insights.technology_updates.push(insight);
        }
        if (doc.classification?.practitioner_impact?.affected_areas?.FILING_REQUIREMENT) {
          insights.new_requirements.push(insight);
        }
        if (doc.classification?.practitioner_impact?.affected_areas?.PROCEDURAL_CHANGE) {
          insights.must_know_changes.push(insight);
        }
      }
    }

    // Limit results
    for (const [key, insights_list] of Object.entries(insights)) {
      insights[key] = insights_list.slice(0, 5);
    }

    return insights;
  }

  extractComplianceRequirements(documents) {
    const requirements = [];

    for (const doc of documents) {
      if (doc.classification?.compliance_requirements?.length > 0) {
        for (const req of doc.classification.compliance_requirements) {
          requirements.push({
            document: doc.title,
            url: doc.url,
            requirement: req.text,
            type: req.type,
            priority: req.priority
          });
        }
      }
    }

    return requirements
      .sort((a, b) => {
        const priorityOrder = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
        return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
      })
      .slice(0, 25);
  }

  async analyzeOrders(documents) {
    const orders = documents.filter(doc => 
      doc.classification?.document_type?.includes('ORDER') ||
      doc.classification?.document_type === 'JUDICIAL_DIRECTIVE'
    );

    const orderAnalysis = [];
    
    for (const order of orders.slice(0, 10)) { // Limit analysis
      try {
        const analysis = this.orderAnalyzer.analyzeJudicialOrder(order.content, order.metadata);
        orderAnalysis.push({
          document: order.title,
          url: order.url,
          analysis: analysis
        });
      } catch (error) {
        console.warn(`Error analyzing order ${order.title}:`, error.message);
      }
    }

    return orderAnalysis;
  }

  analyzeCrossReferences(documents) {
    const allReferences = {
      ccp_sections: new Set(),
      crc_rules: new Set(),
      local_rules: new Set(),
      case_citations: new Set()
    };

    const documentReferences = [];

    for (const doc of documents) {
      if (doc.metadata?.references) {
        const refs = doc.metadata.references;
        
        // Collect all references
        if (refs.ccp_sections) refs.ccp_sections.forEach(ref => allReferences.ccp_sections.add(ref));
        if (refs.crc_rules) refs.crc_rules.forEach(ref => allReferences.crc_rules.add(ref));
        if (refs.local_rules) refs.local_rules.forEach(ref => allReferences.local_rules.add(ref));
        if (refs.case_citations) refs.case_citations.forEach(ref => allReferences.case_citations.add(ref));

        // Document-specific references
        if (Object.values(refs).some(arr => arr.length > 0)) {
          documentReferences.push({
            document: doc.title,
            url: doc.url,
            references: refs
          });
        }
      }
    }

    return {
      summary: {
        total_ccp_references: allReferences.ccp_sections.size,
        total_crc_references: allReferences.crc_rules.size,
        total_local_references: allReferences.local_rules.size,
        total_case_citations: allReferences.case_citations.size
      },
      most_referenced: {
        ccp_sections: Array.from(allReferences.ccp_sections).slice(0, 10),
        crc_rules: Array.from(allReferences.crc_rules).slice(0, 10),
        local_rules: Array.from(allReferences.local_rules).slice(0, 10)
      },
      documents_with_references: documentReferences.slice(0, 15)
    };
  }

  async saveResults(countyName, scrapingResults, analysis) {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${countyName.toLowerCase().replace(/\s+/g, '-')}_${timestamp}.json`;
    const outputFile = path.join(this.outputDir, filename);

    const results = {
      scraping_results: scrapingResults,
      analysis: analysis,
      generated_at: new Date().toISOString(),
      version: '1.0'
    };

    await fs.writeJson(outputFile, results, { spaces: 2 });
    console.log(`💾 Results saved to: ${outputFile}`);
    
    return outputFile;
  }

  async generateReport(countyName, scrapingResults, analysis, outputFile) {
    const reportFile = outputFile.replace('.json', '_report.md');
    
    const report = this.createMarkdownReport(countyName, scrapingResults, analysis);
    
    await fs.writeFile(reportFile, report);
    console.log(`📋 Report generated: ${reportFile}`);
  }

  createMarkdownReport(countyName, scrapingResults, analysis) {
    const report = `
# ${countyName} County Court Rules Analysis Report

**Generated:** ${new Date().toLocaleString()}  
**Base URL:** ${scrapingResults.baseUrl}  
**Documents Processed:** ${scrapingResults.documents.length}  
**Success Rate:** ${scrapingResults.stats.success_rate}  

## Executive Summary

This report analyzes ${scrapingResults.documents.length} legal documents scraped from ${countyName} County Superior Court, focusing on filing procedures, local rules, and judicial orders relevant to legal practitioners.

## Document Overview

### By Document Type
${Object.entries(analysis.document_analysis.by_type).map(([type, count]) => 
  `- **${type}**: ${count} documents`
).join('\n')}

### By Filing Relevance
${Object.entries(analysis.document_analysis.by_relevance).map(([relevance, count]) => 
  `- **${relevance}**: ${count} documents`
).join('\n')}

### By Format
${Object.entries(analysis.document_analysis.by_format).map(([format, count]) => 
  `- **${format}**: ${count} documents`
).join('\n')}

## High Priority Documents

${analysis.high_priority_docs.slice(0, 10).map((doc, index) => 
  `${index + 1}. **${doc.title}** (${doc.type})
   - Relevance: ${doc.relevance}
   - Confidence: ${doc.confidence}%
   - URL: ${doc.url}`
).join('\n\n')}

## Filing Procedures Identified

### Electronic Filing
${analysis.filing_procedures.electronic_filing.slice(0, 3).map(proc => 
  `- ${proc.phrase} (${proc.document})`
).join('\n')}

### Deadlines
${analysis.filing_procedures.deadlines.slice(0, 3).map(proc => 
  `- ${proc.phrase} (${proc.document})`
).join('\n')}

### Service Requirements
${analysis.filing_procedures.service_requirements.slice(0, 3).map(proc => 
  `- ${proc.phrase} (${proc.document})`  
).join('\n')}

## Practitioner Insights

### Must-Know Changes
${analysis.practitioner_insights.must_know_changes.slice(0, 3).map(insight => 
  `- **${insight.document}** - Impact Level: ${insight.impact_level}`
).join('\n')}

### New Requirements
${analysis.practitioner_insights.new_requirements.slice(0, 3).map(insight => 
  `- **${insight.document}** - Impact Level: ${insight.impact_level}`
).join('\n')}

## Compliance Requirements

${analysis.compliance_requirements.slice(0, 5).map((req, index) => 
  `${index + 1}. **${req.type}** (Priority: ${req.priority})
   - ${req.requirement}
   - Source: ${req.document}`
).join('\n\n')}

## Statistics

- **Average Confidence Score:** ${analysis.document_analysis.average_confidence}%
- **Total Processing Time:** ${(analysis.document_analysis.processing_time.total_ms / 1000).toFixed(1)} seconds
- **Average Processing Time per Document:** ${analysis.document_analysis.processing_time.average_ms}ms

---

*This report was automatically generated by the California County Rules Scraper.*
    `.trim();

    return report;
  }

  getFormatDistribution(documents) {
    const distribution = {};
    for (const doc of documents) {
      const format = doc.format || 'UNKNOWN';
      distribution[format] = (distribution[format] || 0) + 1;
    }
    return distribution;
  }

  getTypeDistribution(documents) {
    const distribution = {};
    for (const doc of documents) {
      const type = doc.classification?.document_type || 'UNKNOWN';
      distribution[type] = (distribution[type] || 0) + 1;
    }
    return distribution;
  }

  getRelevanceDistribution(documents) {
    const distribution = {};
    for (const doc of documents) {
      const relevance = doc.classification?.filing_relevance || 'NONE';
      distribution[relevance] = (distribution[relevance] || 0) + 1;
    }
    return distribution;
  }

  async cleanup() {
    if (this.scraper) {
      await this.scraper.cleanup();
    }
  }
}

// CLI Setup
program
  .name('county-scraper')
  .description('California County Court Rules Scraper')
  .version('1.0.0');

program
  .command('scrape')
  .description('Scrape a specific county')
  .argument('<county>', 'County name (e.g., "Santa Clara", "Los Angeles")')
  .option('-o, --analyze-orders', 'Perform detailed order analysis')
  .option('-x, --analyze-cross-references', 'Analyze cross-references between documents')
  .option('-k, --generate-knowledge-graph', 'Generate knowledge graph (default: true)')
  .option('--no-knowledge-graph', 'Skip knowledge graph generation')
  .option('-v, --verbose', 'Verbose output')
  .action(async (county, options) => {
    const scraper = new CountyScraperMain();
    await scraper.initialize();
    
    const result = await scraper.scrapeCounty(county, options);
    
    if (result.success) {
      console.log(`\n✅ Successfully scraped ${result.county}`);
      console.log(`📄 Documents: ${result.documents}`);
      console.log(`💾 Output: ${result.outputFile}`);
    } else {
      console.error(`\n❌ Failed to scrape ${result.county}: ${result.error}`);
      process.exit(1);
    }
  });

program
  .command('list-counties')
  .description('List available county configurations')
  .action(async () => {
    const configs = new CountyConfigs();
    const priorityCounties = configs.getPriorityCounties();
    
    console.log('\n🏛️  Available Counties (Priority Order):');
    for (const county of priorityCounties) {
      console.log(`${county.priority}. ${county.name} - ${county.reason}`);
    }
  });

// Run if called directly
if (require.main === module) {
  program.parse();
}

module.exports = CountyScraperMain; 