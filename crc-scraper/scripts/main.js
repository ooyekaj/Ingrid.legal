/**
 * CRC Scraper Main Orchestration Script
 * Enterprise-level orchestration for California Rules of Court scraping
 */

const yargs = require('yargs');
const cliProgress = require('cli-progress');
const path = require('path');
const fs = require('fs-extra');

// Import core modules
const config = require('../src/config/ScraperConfig');
const Logger = require('../src/utils/Logger');
const FileUtils = require('../src/utils/FileUtils');
const TOCExtractor = require('../src/scrapers/TOCExtractor');
const PDFDownloader = require('../src/scrapers/PDFDownloader');
const ContentAnalyzer = require('../src/processors/ContentAnalyzer');
const CriticalSections = require('../src/filters/CriticalSections');

class CRCScraperOrchestrator {
  constructor(options = {}) {
    this.options = {
      mode: 'full', // full, incremental, knowledge-graph-only, validate
      outputDir: './crc_results',
      concurrency: 5,
      maxRetries: 3,
      verbose: false,
      ...options
    };

    this.logger = new Logger('CRCOrchestrator');
    this.fileUtils = new FileUtils();
    this.progressBar = null;
    
    // Initialize components
    this.tocExtractor = new TOCExtractor();
    this.pdfDownloader = new PDFDownloader();
    this.contentAnalyzer = new ContentAnalyzer();
    this.criticalSections = new CriticalSections();

    // Statistics tracking
    this.stats = {
      startTime: null,
      endTime: null,
      totalRules: 0,
      processedRules: 0,
      failedRules: 0,
      criticalRules: 0,
      knowledgeGraphNodes: 0,
      knowledgeGraphEdges: 0
    };
  }

  /**
   * Main execution function
   */
  async execute() {
    try {
      this.stats.startTime = Date.now();
      this.logger.info('Starting CRC scraper orchestration', { mode: this.options.mode });

      // Ensure output directories exist
      await this.fileUtils.ensureOutputDirectories();

      // Execute based on mode
      switch (this.options.mode) {
        case 'full':
          await this.executeFullScraping();
          break;
        case 'incremental':
          await this.executeIncrementalScraping();
          break;
        case 'knowledge-graph-only':
          await this.executeKnowledgeGraphGeneration();
          break;
        case 'validate':
          await this.executeValidation();
          break;
        default:
          throw new Error(`Unknown mode: ${this.options.mode}`);
      }

      this.stats.endTime = Date.now();
      await this.generateFinalReport();
      
      this.logger.info('CRC scraper orchestration completed successfully');

    } catch (error) {
      this.logger.error('CRC scraper orchestration failed:', error);
      throw error;
    }
  }

  /**
   * Execute full scraping process
   */
  async executeFullScraping() {
    try {
      this.logger.info('Executing full CRC scraping process');

      // Step 1: Extract Table of Contents
      this.logger.info('Step 1: Extracting Table of Contents');
      const tocTimer = this.logger.timer('TOC Extraction');
      const extractedRules = await this.tocExtractor.extractAllRules();
      tocTimer.end({ rulesFound: extractedRules.length });

      this.stats.totalRules = extractedRules.length;
      this.logger.info(`Found ${extractedRules.length} filing-related rules`);

      // Step 2: Filter and prioritize critical rules
      this.logger.info('Step 2: Filtering and prioritizing critical rules');
      const filterTimer = this.logger.timer('Critical Rule Filtering');
      const criticalityResults = this.criticalSections.filterCriticalRules(extractedRules);
      const processingOrder = this.criticalSections.getProcessingOrder(criticalityResults.categorized_rules);
      filterTimer.end({ criticalRules: criticalityResults.analysis.critical_rules_found });

      this.stats.criticalRules = criticalityResults.analysis.critical_rules_found;

      // Save criticality report
      await this.saveCriticalityReport(criticalityResults);

      // Step 3: Download and extract content
      this.logger.info('Step 3: Downloading and extracting rule content');
      const downloadTimer = this.logger.timer('Content Download and Extraction');
      const extractedContent = await this.downloadAndExtractContent(processingOrder);
      downloadTimer.end({ processedRules: extractedContent.length });

      this.stats.processedRules = extractedContent.length;

      // Step 4: Analyze content with filing questions
      this.logger.info('Step 4: Analyzing content with filing question framework');
      const analysisTimer = this.logger.timer('Content Analysis');
      const analyzedRules = await this.analyzeExtractedContent(extractedContent);
      analysisTimer.end({ analyzedRules: analyzedRules.length });

      // Step 5: Generate knowledge graph
      this.logger.info('Step 5: Generating knowledge graph');
      const kgTimer = this.logger.timer('Knowledge Graph Generation');
      const knowledgeGraph = await this.generateKnowledgeGraph(analyzedRules);
      kgTimer.end({ 
        nodes: knowledgeGraph.nodes.length, 
        edges: knowledgeGraph.edges.length 
      });

      this.stats.knowledgeGraphNodes = knowledgeGraph.nodes.length;
      this.stats.knowledgeGraphEdges = knowledgeGraph.edges.length;

      // Step 6: Save results
      this.logger.info('Step 6: Saving results');
      await this.saveResults(analyzedRules, knowledgeGraph, criticalityResults);

      this.logger.info('Full scraping process completed successfully');

    } catch (error) {
      this.logger.error('Full scraping process failed:', error);
      throw error;
    }
  }

  /**
   * Execute incremental scraping (update existing data)
   */
  async executeIncrementalScraping() {
    try {
      this.logger.info('Executing incremental CRC scraping');

      // Load existing data
      const existingDataPath = path.join(this.options.outputDir, 'crc_rules_complete.json');
      let existingRules = [];
      
      if (await fs.pathExists(existingDataPath)) {
        existingRules = await this.fileUtils.loadJSON(existingDataPath);
        this.logger.info(`Loaded ${existingRules.length} existing rules`);
      }

      // Extract current TOC
      const currentRules = await this.tocExtractor.extractAllRules();
      
      // Identify new/changed rules
      const { newRules, changedRules } = this.identifyChanges(existingRules, currentRules);
      
      if (newRules.length === 0 && changedRules.length === 0) {
        this.logger.info('No new or changed rules found');
        return;
      }

      this.logger.info(`Found ${newRules.length} new rules and ${changedRules.length} changed rules`);

      // Process only new/changed rules
      const rulesToProcess = [...newRules, ...changedRules];
      const extractedContent = await this.downloadAndExtractContent(rulesToProcess);
      const analyzedRules = await this.analyzeExtractedContent(extractedContent);

      // Merge with existing data
      const mergedRules = this.mergeRuleData(existingRules, analyzedRules);

      // Regenerate knowledge graph
      const knowledgeGraph = await this.generateKnowledgeGraph(mergedRules);

      // Save updated results
      await this.saveResults(mergedRules, knowledgeGraph);

      this.logger.info('Incremental scraping completed successfully');

    } catch (error) {
      this.logger.error('Incremental scraping failed:', error);
      throw error;
    }
  }

  /**
   * Download and extract content from rules
   */
  async downloadAndExtractContent(rules) {
    try {
      // Create progress bar
      this.progressBar = new cliProgress.SingleBar({
        format: 'Downloading |{bar}| {percentage}% | {value}/{total} | ETA: {eta_formatted} | {rule}',
        barCompleteChar: '\u2588',
        barIncompleteChar: '\u2591',
        hideCursor: true
      });

      this.progressBar.start(rules.length, 0, { rule: 'Starting...' });

      const extractedContent = [];
      const ruleUrls = rules.map(rule => rule.url);

      // Process rules in batches for better performance
      const batchSize = this.options.concurrency;
      for (let i = 0; i < ruleUrls.length; i += batchSize) {
        const batch = ruleUrls.slice(i, i + batchSize);
        const batchResults = await this.pdfDownloader.downloadRulePDFs(batch);
        
        batchResults.forEach((result, index) => {
          const globalIndex = i + index;
          this.progressBar.update(globalIndex + 1, { 
            rule: result ? result.ruleNumber : 'Failed' 
          });
          
          if (result) {
            extractedContent.push(result);
          } else {
            this.stats.failedRules++;
          }
        });

        // Brief pause between batches to avoid overwhelming the server
        await this.delay(1000);
      }

      this.progressBar.stop();
      
      this.logger.info(`Successfully extracted content from ${extractedContent.length} rules`);
      return extractedContent;

    } catch (error) {
      if (this.progressBar) {
        this.progressBar.stop();
      }
      this.logger.error('Failed to download and extract content:', error);
      throw error;
    }
  }

  /**
   * Analyze extracted content with filing question framework
   */
  async analyzeExtractedContent(extractedContent) {
    try {
      const progressBar = new cliProgress.SingleBar({
        format: 'Analyzing |{bar}| {percentage}% | {value}/{total} | ETA: {eta_formatted} | {rule}',
        barCompleteChar: '\u2588',
        barIncompleteChar: '\u2591',
        hideCursor: true
      });

      progressBar.start(extractedContent.length, 0, { rule: 'Starting...' });

      const analyzedRules = [];

      for (let i = 0; i < extractedContent.length; i++) {
        const rule = extractedContent[i];
        
        try {
          progressBar.update(i + 1, { rule: rule.ruleNumber });
          
          const analysis = await this.contentAnalyzer.analyzeContent(
            rule.content, 
            rule.ruleNumber, 
            rule.title
          );

          // Merge extracted content with analysis
          const analyzedRule = {
            ...rule,
            ...analysis,
            processed_at: new Date().toISOString()
          };

          analyzedRules.push(analyzedRule);

        } catch (error) {
          this.logger.error(`Failed to analyze rule ${rule.ruleNumber}:`, error);
          // Include rule with error marker
          analyzedRules.push({
            ...rule,
            analysis_error: error.message,
            processed_at: new Date().toISOString()
          });
        }
      }

      progressBar.stop();
      
      this.logger.info(`Successfully analyzed ${analyzedRules.length} rules`);
      return analyzedRules;

    } catch (error) {
      this.logger.error('Failed to analyze extracted content:', error);
      throw error;
    }
  }

  /**
   * Generate comprehensive knowledge graph
   */
  async generateKnowledgeGraph(analyzedRules) {
    try {
      const knowledgeGraph = {
        nodes: [],
        edges: [],
        metadata: {
          generated_at: new Date().toISOString(),
          total_rules: analyzedRules.length,
          node_types: [],
          edge_types: []
        }
      };

      const nodeMap = new Map();
      const edgeSet = new Set();

      // Create nodes for each rule
      analyzedRules.forEach(rule => {
        const nodeId = `crc_${rule.ruleNumber}`;
        
        const node = {
          id: nodeId,
          type: 'crc_rule',
          label: `Rule ${rule.ruleNumber}`,
          properties: {
            ruleNumber: rule.ruleNumber,
            title: rule.title,
            category: rule.category,
            priority: rule.criticality_assessment?.priority || 4,
            urgency: rule.criticality_assessment?.urgency || 'low_critical',
            url: rule.url,
            filing_relevance_score: rule.criticality_assessment?.filing_relevance_score || 0
          }
        };

        knowledgeGraph.nodes.push(node);
        nodeMap.set(nodeId, node);
      });

      // Create edges based on cross-references
      analyzedRules.forEach(rule => {
        const sourceId = `crc_${rule.ruleNumber}`;
        
        if (rule.enhanced_cross_references) {
          // CRC rule references
          rule.enhanced_cross_references.crc_rules?.forEach(ref => {
            const targetId = `crc_${ref.rule}`;
            const edgeId = `${sourceId}_references_${targetId}`;
            
            if (!edgeSet.has(edgeId) && nodeMap.has(targetId)) {
              knowledgeGraph.edges.push({
                id: edgeId,
                source: sourceId,
                target: targetId,
                type: 'references',
                properties: {
                  relationship_type: ref.relationship_type,
                  description: ref.description
                }
              });
              edgeSet.add(edgeId);
            }
          });

          // CCP section references
          rule.enhanced_cross_references.ccp_sections?.forEach(ref => {
            const targetId = `ccp_${ref.section}`;
            
            // Create CCP node if not exists
            if (!nodeMap.has(targetId)) {
              const ccpNode = {
                id: targetId,
                type: 'ccp_section',
                label: `CCP §${ref.section}`,
                properties: {
                  section: ref.section,
                  relationship_type: ref.relationship_type
                }
              };
              knowledgeGraph.nodes.push(ccpNode);
              nodeMap.set(targetId, ccpNode);
            }

            const edgeId = `${sourceId}_implements_${targetId}`;
            if (!edgeSet.has(edgeId)) {
              knowledgeGraph.edges.push({
                id: edgeId,
                source: sourceId,
                target: targetId,
                type: 'implements',
                properties: {
                  relationship_type: ref.relationship_type,
                  description: ref.description
                }
              });
              edgeSet.add(edgeId);
            }
          });
        }
      });

      // Update metadata
      knowledgeGraph.metadata.node_types = [...new Set(knowledgeGraph.nodes.map(n => n.type))];
      knowledgeGraph.metadata.edge_types = [...new Set(knowledgeGraph.edges.map(e => e.type))];

      this.logger.info(`Generated knowledge graph with ${knowledgeGraph.nodes.length} nodes and ${knowledgeGraph.edges.length} edges`);
      
      return knowledgeGraph;

    } catch (error) {
      this.logger.error('Failed to generate knowledge graph:', error);
      throw error;
    }
  }

  /**
   * Save all results in multiple formats
   */
  async saveResults(analyzedRules, knowledgeGraph, criticalityResults = null) {
    try {
      const outputDir = this.options.outputDir;
      const timestamp = new Date().toISOString().slice(0, 10);

      // Save main rule database
      const rulesPath = path.join(outputDir, 'crc_rules_complete.json');
      await this.fileUtils.saveJSON(analyzedRules, rulesPath);

      // Save knowledge graph in multiple formats
      const kgDir = path.join(outputDir, 'knowledge_graph');
      await fs.ensureDir(kgDir);

      // Cytoscape format
      const cytoscapeData = this.convertToCytoscape(knowledgeGraph);
      await this.fileUtils.saveJSON(cytoscapeData, path.join(kgDir, 'crc_knowledge_graph_cytoscape.json'));

      // D3 format
      const d3Data = this.convertToD3(knowledgeGraph);
      await this.fileUtils.saveJSON(d3Data, path.join(kgDir, 'crc_knowledge_graph_d3.json'));

      // GraphML format
      const graphmlData = this.convertToGraphML(knowledgeGraph);
      await fs.writeFile(path.join(kgDir, 'crc_knowledge_graph.graphml'), graphmlData);

      // Generate comprehensive reports
      await this.fileUtils.generateSummaryReport(analyzedRules, outputDir);

      // Save processing statistics
      await this.fileUtils.saveJSON(this.stats, path.join(outputDir, 'processing_stats.json'));

      this.logger.info(`Results saved to ${outputDir}`);

    } catch (error) {
      this.logger.error('Failed to save results:', error);
      throw error;
    }
  }

  /**
   * Convert knowledge graph to Cytoscape format
   */
  convertToCytoscape(knowledgeGraph) {
    const elements = [];

    // Add nodes
    knowledgeGraph.nodes.forEach(node => {
      elements.push({
        data: {
          id: node.id,
          label: node.label,
          type: node.type,
          ...node.properties
        }
      });
    });

    // Add edges
    knowledgeGraph.edges.forEach(edge => {
      elements.push({
        data: {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          type: edge.type,
          ...edge.properties
        }
      });
    });

    return { elements };
  }

  /**
   * Convert knowledge graph to D3 format
   */
  convertToD3(knowledgeGraph) {
    return {
      nodes: knowledgeGraph.nodes.map(node => ({
        id: node.id,
        label: node.label,
        type: node.type,
        group: node.type,
        ...node.properties
      })),
      links: knowledgeGraph.edges.map(edge => ({
        source: edge.source,
        target: edge.target,
        type: edge.type,
        value: 1,
        ...edge.properties
      }))
    };
  }

  /**
   * Convert knowledge graph to GraphML format
   */
  convertToGraphML(knowledgeGraph) {
    let graphml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    graphml += '<graphml xmlns="http://graphml.graphdrawing.org/xmlns"\n';
    graphml += '         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\n';
    graphml += '         xsi:schemaLocation="http://graphml.graphdrawing.org/xmlns\n';
    graphml += '         http://graphml.graphdrawing.org/xmlns/1.0/graphml.xsd">\n';
    
    // Define keys
    graphml += '  <key id="label" for="node" attr.name="label" attr.type="string"/>\n';
    graphml += '  <key id="type" for="node" attr.name="type" attr.type="string"/>\n';
    graphml += '  <key id="ruleNumber" for="node" attr.name="ruleNumber" attr.type="string"/>\n';
    graphml += '  <key id="title" for="node" attr.name="title" attr.type="string"/>\n';
    graphml += '  <key id="relationship" for="edge" attr.name="relationship" attr.type="string"/>\n';
    
    graphml += '  <graph id="CRC_Knowledge_Graph" edgedefault="directed">\n';
    
    // Add nodes
    knowledgeGraph.nodes.forEach(node => {
      graphml += `    <node id="${node.id}">\n`;
      graphml += `      <data key="label">${this.escapeXML(node.label)}</data>\n`;
      graphml += `      <data key="type">${node.type}</data>\n`;
      if (node.properties.ruleNumber) {
        graphml += `      <data key="ruleNumber">${node.properties.ruleNumber}</data>\n`;
      }
      if (node.properties.title) {
        graphml += `      <data key="title">${this.escapeXML(node.properties.title)}</data>\n`;
      }
      graphml += '    </node>\n';
    });
    
    // Add edges
    knowledgeGraph.edges.forEach(edge => {
      graphml += `    <edge source="${edge.source}" target="${edge.target}">\n`;
      graphml += `      <data key="relationship">${edge.type}</data>\n`;
      graphml += '    </edge>\n';
    });
    
    graphml += '  </graph>\n';
    graphml += '</graphml>\n';
    
    return graphml;
  }

  /**
   * Save criticality report
   */
  async saveCriticalityReport(criticalityResults) {
    try {
      const report = this.criticalSections.generateCriticalityReport(criticalityResults);
      const reportPath = path.join(this.options.outputDir, 'criticality_report.json');
      await this.fileUtils.saveJSON(report, reportPath);
      
      this.logger.info('Criticality report saved');
    } catch (error) {
      this.logger.error('Failed to save criticality report:', error);
    }
  }

  /**
   * Generate final processing report
   */
  async generateFinalReport() {
    try {
      const duration = this.stats.endTime - this.stats.startTime;
      const report = {
        execution_summary: {
          mode: this.options.mode,
          start_time: new Date(this.stats.startTime).toISOString(),
          end_time: new Date(this.stats.endTime).toISOString(),
          duration_ms: duration,
          duration_formatted: this.formatDuration(duration)
        },
        statistics: this.stats,
        performance_metrics: {
          rules_per_minute: Math.round((this.stats.processedRules / duration) * 60000),
          success_rate: ((this.stats.processedRules / this.stats.totalRules) * 100).toFixed(2) + '%',
          critical_rule_percentage: ((this.stats.criticalRules / this.stats.totalRules) * 100).toFixed(2) + '%'
        }
      };

      const reportPath = path.join(this.options.outputDir, 'execution_report.json');
      await this.fileUtils.saveJSON(report, reportPath);

      // Log summary
      this.logger.info('='.repeat(60));
      this.logger.info('CRC SCRAPER EXECUTION SUMMARY');
      this.logger.info('='.repeat(60));
      this.logger.info(`Mode: ${this.options.mode}`);
      this.logger.info(`Duration: ${report.execution_summary.duration_formatted}`);
      this.logger.info(`Total Rules: ${this.stats.totalRules}`);
      this.logger.info(`Processed Rules: ${this.stats.processedRules}`);
      this.logger.info(`Failed Rules: ${this.stats.failedRules}`);
      this.logger.info(`Critical Rules: ${this.stats.criticalRules}`);
      this.logger.info(`Success Rate: ${report.performance_metrics.success_rate}`);
      this.logger.info(`Knowledge Graph Nodes: ${this.stats.knowledgeGraphNodes}`);
      this.logger.info(`Knowledge Graph Edges: ${this.stats.knowledgeGraphEdges}`);
      this.logger.info('='.repeat(60));

    } catch (error) {
      this.logger.error('Failed to generate final report:', error);
    }
  }

  // Utility methods

  escapeXML(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  identifyChanges(existingRules, currentRules) {
    const existingMap = new Map(existingRules.map(r => [r.ruleNumber, r]));
    const newRules = [];
    const changedRules = [];

    currentRules.forEach(rule => {
      const existing = existingMap.get(rule.ruleNumber);
      if (!existing) {
        newRules.push(rule);
      } else if (existing.url !== rule.url || existing.title !== rule.title) {
        changedRules.push(rule);
      }
    });

    return { newRules, changedRules };
  }

  mergeRuleData(existingRules, newRules) {
    const existingMap = new Map(existingRules.map(r => [r.ruleNumber, r]));
    
    newRules.forEach(rule => {
      existingMap.set(rule.ruleNumber, rule);
    });

    return Array.from(existingMap.values());
  }
}

// CLI interface
const argv = yargs
  .option('mode', {
    alias: 'm',
    description: 'Scraping mode',
    choices: ['full', 'incremental', 'knowledge-graph-only', 'validate'],
    default: 'full'
  })
  .option('output', {
    alias: 'o',
    description: 'Output directory',
    default: './crc_results'
  })
  .option('concurrency', {
    alias: 'c',
    description: 'Number of concurrent requests',
    type: 'number',
    default: 5
  })
  .option('verbose', {
    alias: 'v',
    description: 'Verbose logging',
    type: 'boolean',
    default: false
  })
  .help()
  .argv;

// Main execution
async function main() {
  try {
    const orchestrator = new CRCScraperOrchestrator({
      mode: argv.mode,
      outputDir: argv.output,
      concurrency: argv.concurrency,
      verbose: argv.verbose
    });

    await orchestrator.execute();
    process.exit(0);

  } catch (error) {
    console.error('Scraping failed:', error);
    process.exit(1);
  }
}

// Execute if called directly
if (require.main === module) {
  main();
}

module.exports = CRCScraperOrchestrator; 