const UnifiedKnowledgeGraphGenerator = require('./unified_knowledge_graph_generator');
const fs = require('fs-extra');
const path = require('path');

/**
 * Test suite for the unified knowledge graph system
 */
class UnifiedSystemTester {
  constructor() {
    this.generator = new UnifiedKnowledgeGraphGenerator();
    this.testResults = [];
  }

  async runAllTests() {
    console.log('🧪 Running Unified Knowledge Graph Tests');
    console.log('========================================\n');

    const tests = [
      'testQueryParsing',
      'testKnowledgeGraphLoading',
      'testCrossSystemConnections',
      'testFilingRequirementAnswers',
      'testOutputGeneration'
    ];

    for (const testName of tests) {
      try {
        console.log(`🔍 Running ${testName}...`);
        await this[testName]();
        console.log(`✅ ${testName} passed\n`);
        this.testResults.push({ test: testName, status: 'PASSED' });
      } catch (error) {
        console.log(`❌ ${testName} failed: ${error.message}\n`);
        this.testResults.push({ test: testName, status: 'FAILED', error: error.message });
      }
    }

    this.printTestSummary();
  }

  /**
   * Test query parsing functionality
   */
  async testQueryParsing() {
    const testQueries = [
      {
        query: "California, Santa Clara County, Complex Civil Litigation, Judge Charles F. Adams, Motion for summary judgment",
        expected: {
          state: 'California',
          county: 'santa clara',
          case_type: 'complex_civil',
          judge: 'charles f. adams',
          motion_type: 'motion_for_summary_judgment'
        }
      },
      {
        query: "California, Los Angeles County, General Civil, Electronic Filing",
        expected: {
          state: 'California',
          county: 'los angeles',
          case_type: 'general_civil'
        }
      }
    ];

    for (const testCase of testQueries) {
      const parsed = this.generator.parseQuery(testCase.query);
      
      if (parsed.state !== testCase.expected.state) {
        throw new Error(`State parsing failed: expected ${testCase.expected.state}, got ${parsed.state}`);
      }
      
      if (parsed.county && parsed.county.toLowerCase() !== testCase.expected.county) {
        throw new Error(`County parsing failed: expected ${testCase.expected.county}, got ${parsed.county}`);
      }
      
      if (testCase.expected.motion_type && parsed.motion_type !== testCase.expected.motion_type) {
        throw new Error(`Motion type parsing failed: expected ${testCase.expected.motion_type}, got ${parsed.motion_type}`);
      }
    }
  }

  /**
   * Test knowledge graph loading
   */
  async testKnowledgeGraphLoading() {
    // Create mock data for testing
    const mockCCPGraph = {
      nodes: [
        {
          data: {
            id: 'CCP_437c',
            label: 'CCP 437c',
            title: 'Summary Judgment',
            category: 'Motion Practice',
            filingRelevance: 9,
            proceduralRequirements: 5
          }
        }
      ]
    };

    const mockCRCGraph = {
      elements: [
        {
          data: {
            id: 'crc_3.1350',
            label: 'Rule 3.1350',
            title: 'Motion for summary judgment',
            category: 'Motion Practice',
            filing_relevance_score: 9,
            procedural_requirements: 4
          }
        }
      ]
    };

    const mockCountyGraph = {
      nodes: [
        {
          data: {
            id: 'santa_clara_judge_adams',
            label: 'Judge Charles F. Adams',
            title: 'Judge Charles F. Adams - Complex Civil',
            category: 'Judge Specific',
            type: 'judge',
            county: 'Santa Clara',
            judge_name: 'Charles F. Adams',
            filing_relevance_score: 8
          }
        }
      ]
    };

    // Test processing functions
    this.generator.processCCPGraph(mockCCPGraph);
    this.generator.processCRCGraph(mockCRCGraph);
    this.generator.processCountyGraphs({ 'santa-clara': mockCountyGraph });

    // Verify nodes were added
    const nodeCount = this.generator.nodes.size;
    if (nodeCount < 3) {
      throw new Error(`Expected at least 3 nodes, got ${nodeCount}`);
    }

    // Verify node types
    const ccpNode = Array.from(this.generator.nodes.values()).find(n => n.type === 'ccp_rule');
    const crcNode = Array.from(this.generator.nodes.values()).find(n => n.type === 'crc_rule');
    const countyNode = Array.from(this.generator.nodes.values()).find(n => n.source === 'county');

    if (!ccpNode) throw new Error('CCP node not found');
    if (!crcNode) throw new Error('CRC node not found');
    if (!countyNode) throw new Error('County node not found');
  }

  /**
   * Test cross-system connections
   */
  async testCrossSystemConnections() {
    // Clear existing data
    this.generator.nodes.clear();
    this.generator.edges.clear();
    this.generator.nodeIdCounter = 1;
    this.generator.edgeIdCounter = 1;

    // Add test nodes
    const ccpNode = this.generator.addNode({
      id: 'CCP_437c',
      type: 'ccp_rule',
      label: 'CCP 437c',
      category: 'Motion Practice'
    });

    const crcNode = this.generator.addNode({
      id: 'crc_3.1350',
      type: 'crc_rule',
      label: 'Rule 3.1350',
      category: 'Motion Practice'
    });

    const countyNode = this.generator.addNode({
      id: 'santa_clara_judge_adams',
      type: 'judge',
      source: 'county',
      county: 'Santa Clara',
      judge_name: 'Charles F. Adams',
      category: 'Judge Specific'
    });

    // Create connections
    this.generator.createCrossSystemConnections();

    // Verify connections were created
    const edgeCount = this.generator.edges.size;
    if (edgeCount === 0) {
      throw new Error('No cross-system connections were created');
    }
  }

  /**
   * Test filing requirement answers
   */
  async testFilingRequirementAnswers() {
    // Setup test data
    await this.testKnowledgeGraphLoading();

    const testQuery = "California, Santa Clara County, Complex Civil Litigation, Judge Charles F. Adams, Motion for summary judgment";
    const answer = await this.generator.answerFilingQuery(testQuery);

    // Verify answer structure
    if (!answer.query_summary) {
      throw new Error('Answer missing query_summary');
    }

    if (!answer.applicable_rules) {
      throw new Error('Answer missing applicable_rules');
    }

    if (!answer.filing_requirements) {
      throw new Error('Answer missing filing_requirements');
    }

    if (!answer.procedural_steps) {
      throw new Error('Answer missing procedural_steps');
    }

    // Verify content
    if (!answer.query_summary.includes('California')) {
      throw new Error('Query summary missing California');
    }

    if (!answer.query_summary.includes('Santa Clara')) {
      throw new Error('Query summary missing Santa Clara');
    }
  }

  /**
   * Test output generation
   */
  async testOutputGeneration() {
    // Setup test data
    await this.testKnowledgeGraphLoading();

    // Generate outputs
    const cytoscapeGraph = this.generator.generateCytoscapeGraph();
    const d3Graph = this.generator.generateD3Graph();
    const graphmlGraph = this.generator.generateGraphMLGraph();
    const queryIndex = this.generator.generateQueryIndex();
    const filingMap = this.generator.generateFilingRequirementsMap();

    // Verify Cytoscape format
    if (!cytoscapeGraph.nodes || !Array.isArray(cytoscapeGraph.nodes)) {
      throw new Error('Cytoscape graph missing nodes array');
    }

    if (!cytoscapeGraph.edges || !Array.isArray(cytoscapeGraph.edges)) {
      throw new Error('Cytoscape graph missing edges array');
    }

    // Verify D3 format
    if (!d3Graph.nodes || !Array.isArray(d3Graph.nodes)) {
      throw new Error('D3 graph missing nodes array');
    }

    if (!d3Graph.links || !Array.isArray(d3Graph.links)) {
      throw new Error('D3 graph missing links array');
    }

    // Verify GraphML format
    if (!graphmlGraph.includes('<?xml version="1.0"')) {
      throw new Error('GraphML format invalid');
    }

    if (!graphmlGraph.includes('<graphml')) {
      throw new Error('GraphML missing root element');
    }

    // Verify query index
    if (typeof queryIndex !== 'object') {
      throw new Error('Query index should be an object');
    }

    // Verify filing requirements map
    if (typeof filingMap !== 'object') {
      throw new Error('Filing requirements map should be an object');
    }

    if (!filingMap.motion_for_summary_judgment) {
      throw new Error('Filing requirements map missing motion_for_summary_judgment');
    }
  }

  /**
   * Print test summary
   */
  printTestSummary() {
    console.log('📊 Test Summary');
    console.log('===============');
    
    const passed = this.testResults.filter(r => r.status === 'PASSED').length;
    const failed = this.testResults.filter(r => r.status === 'FAILED').length;
    
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${Math.round((passed / this.testResults.length) * 100)}%\n`);

    if (failed > 0) {
      console.log('❌ Failed Tests:');
      this.testResults.filter(r => r.status === 'FAILED').forEach(test => {
        console.log(`   • ${test.test}: ${test.error}`);
      });
    } else {
      console.log('🎉 All tests passed!');
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new UnifiedSystemTester();
  tester.runAllTests().catch(console.error);
}

module.exports = UnifiedSystemTester; 