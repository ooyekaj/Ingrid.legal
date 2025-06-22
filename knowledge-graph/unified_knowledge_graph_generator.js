const fs = require('fs-extra');
const path = require('path');

/**
 * Unified Knowledge Graph Generator
 * Connects CCP, CRC, and County Rules for comprehensive filing requirement queries
 * 
 * Example query: "California, Santa Clara County, Complex Civil Litigation, Judge Charles F. Adams, Motion for summary judgment"
 */
class UnifiedKnowledgeGraphGenerator {
  constructor() {
    this.nodes = new Map();
    this.edges = new Map();
    this.nodeIdCounter = 1;
    this.edgeIdCounter = 1;
    
    // Unified categories across all knowledge graphs
    this.categories = {
      'service_notice': 'Service & Notice',
      'motion_practice': 'Motion Practice',
      'discovery': 'Discovery',
      'filing_procedures': 'Filing Procedures',
      'electronic_filing': 'Electronic Filing',
      'court_procedures': 'Court Procedures',
      'case_management': 'Case Management',
      'complex_civil': 'Complex Civil',
      'general_civil': 'General Civil',
      'local_rules': 'Local Rules',
      'judge_specific': 'Judge Specific',
      'department_specific': 'Department Specific',
      'tentative_rulings': 'Tentative Rulings',
      'ex_parte': 'Ex Parte Procedures'
    };

    // Filing requirement hierarchy for query matching
    this.filingHierarchy = {
      'motion_for_summary_judgment': {
        ccp_rules: ['437c', '439', '1005'],
        crc_rules: ['3.1350', '3.1351', '3.1300'],
        county_specific: ['tentative_ruling_procedures', 'judge_preferences', 'department_rules']
      },
      'complex_civil_litigation': {
        ccp_rules: ['128.7', '2024.020'],
        crc_rules: ['3.400', '3.401', '3.402'],
        county_specific: ['complex_civil_departments', 'specialized_judges']
      },
      'electronic_filing': {
        ccp_rules: ['1010.6'],
        crc_rules: ['2.253', '2.256', '2.259'],
        county_specific: ['local_efiling_rules', 'technical_requirements']
      }
    };
  }

  /**
   * Generate unified knowledge graph from all sources
   */
  async generateUnifiedGraph(ccpGraphPath, crcGraphPath, countyGraphsPath) {
    console.log('Loading knowledge graphs from all sources...');
    
    // Load existing knowledge graphs
    const ccpGraph = await this.loadKnowledgeGraph(ccpGraphPath);
    const crcGraph = await this.loadKnowledgeGraph(crcGraphPath);
    const countyGraphs = await this.loadCountyGraphs(countyGraphsPath);

    // Clear existing data
    this.nodes.clear();
    this.edges.clear();
    this.nodeIdCounter = 1;
    this.edgeIdCounter = 1;

    // Process each knowledge graph
    this.processCCPGraph(ccpGraph);
    this.processCRCGraph(crcGraph);
    this.processCountyGraphs(countyGraphs);

    // Create cross-references between different rule systems
    this.createCrossSystemConnections();

    // Generate different output formats
    const unifiedGraph = {
      cytoscape: this.generateCytoscapeGraph(),
      d3: this.generateD3Graph(),
      graphml: this.generateGraphMLGraph(),
      query_index: this.generateQueryIndex(),
      filing_requirements_map: this.generateFilingRequirementsMap()
    };

    return unifiedGraph;
  }

  /**
   * Answer filing requirement queries
   */
  async answerFilingQuery(query) {
    // Parse query components
    const queryComponents = this.parseQuery(query);
    
    // Find relevant rules
    const relevantRules = this.findRelevantRules(queryComponents);
    
    // Generate comprehensive answer
    const answer = this.generateFilingRequirementAnswer(queryComponents, relevantRules);
    
    return answer;
  }

  /**
   * Parse query into components (location, court type, judge, motion type, etc.)
   */
  parseQuery(query) {
    const components = {
      state: null,
      county: null,
      court_type: null,
      judge: null,
      motion_type: null,
      case_type: null,
      department: null
    };

    const queryLower = query.toLowerCase();

    // Extract state
    if (queryLower.includes('california')) {
      components.state = 'California';
    }

    // Extract county
    const countyMatch = queryLower.match(/(\w+\s*\w*)\s+county/);
    if (countyMatch) {
      components.county = countyMatch[1].trim();
    }

    // Extract judge
    const judgeMatch = queryLower.match(/judge\s+([a-z.\s]+)/);
    if (judgeMatch) {
      components.judge = judgeMatch[1].trim();
    }

    // Extract motion type
    if (queryLower.includes('motion for summary judgment')) {
      components.motion_type = 'motion_for_summary_judgment';
    } else if (queryLower.includes('ex parte')) {
      components.motion_type = 'ex_parte_motion';
    } else if (queryLower.includes('discovery')) {
      components.motion_type = 'discovery_motion';
    }

    // Extract case type
    if (queryLower.includes('complex civil')) {
      components.case_type = 'complex_civil';
    } else if (queryLower.includes('general civil')) {
      components.case_type = 'general_civil';
    }

    return components;
  }

  /**
   * Find relevant rules based on query components
   */
  findRelevantRules(components) {
    const relevantRules = {
      ccp: [],
      crc: [],
      county: []
    };

    // Get filing hierarchy rules
    if (components.motion_type && this.filingHierarchy[components.motion_type]) {
      const hierarchy = this.filingHierarchy[components.motion_type];
      
      // Find CCP rules
      for (const ccpRule of hierarchy.ccp_rules) {
        const node = Array.from(this.nodes.values()).find(n => 
          n.type === 'ccp_rule' && n.id.includes(ccpRule)
        );
        if (node) relevantRules.ccp.push(node);
      }

      // Find CRC rules
      for (const crcRule of hierarchy.crc_rules) {
        const node = Array.from(this.nodes.values()).find(n => 
          n.type === 'crc_rule' && n.id.includes(crcRule)
        );
        if (node) relevantRules.crc.push(node);
      }
    }

    // Find county-specific rules
    if (components.county) {
      const countyNodes = Array.from(this.nodes.values()).filter(n => 
        n.type === 'county_rule' && n.county && 
        n.county.toLowerCase().includes(components.county.toLowerCase())
      );
      relevantRules.county = countyNodes;
    }

    // Find judge-specific rules
    if (components.judge) {
      const judgeNodes = Array.from(this.nodes.values()).filter(n => 
        n.type === 'judge' && n.judge_name && 
        n.judge_name.toLowerCase().includes(components.judge.toLowerCase())
      );
      relevantRules.county.push(...judgeNodes);
    }

    return relevantRules;
  }

  /**
   * Generate comprehensive filing requirement answer
   */
  generateFilingRequirementAnswer(components, relevantRules) {
    const answer = {
      query_summary: this.formatQuerySummary(components),
      applicable_rules: {
        ccp: relevantRules.ccp.map(r => ({
          rule: r.label,
          title: r.title,
          category: r.category,
          filing_relevance: r.filing_relevance_score || r.filingRelevance,
          procedural_requirements: r.procedural_requirements || r.proceduralRequirements
        })),
        crc: relevantRules.crc.map(r => ({
          rule: r.label,
          title: r.title,
          category: r.category,
          filing_relevance: r.filing_relevance_score || r.filingRelevance,
          procedural_requirements: r.procedural_requirements || r.proceduralRequirements
        })),
        county: relevantRules.county.map(r => ({
          rule: r.label,
          title: r.title,
          category: r.category,
          county: r.county,
          judge: r.judge_name,
          department: r.department_number,
          filing_relevance: r.filing_relevance_score || r.filingRelevance,
          procedural_requirements: r.procedural_requirements || r.proceduralRequirements
        }))
      },
      filing_requirements: this.generateFilingRequirements(components, relevantRules),
      procedural_steps: this.generateProceduralSteps(components, relevantRules),
      deadlines: this.extractDeadlines(relevantRules),
      forms_required: this.extractFormsRequired(relevantRules),
      local_variations: this.extractLocalVariations(components, relevantRules)
    };

    return answer;
  }

  /**
   * Load knowledge graph from file
   */
  async loadKnowledgeGraph(filePath) {
    try {
      if (filePath.endsWith('.gz')) {
        // Handle gzipped files
        const { execSync } = require('child_process');
        const content = execSync(`gunzip -c "${filePath}"`).toString();
        return JSON.parse(content);
      } else {
        const content = await fs.readFile(filePath, 'utf8');
        return JSON.parse(content);
      }
    } catch (error) {
      console.error(`Error loading knowledge graph from ${filePath}:`, error);
      return { nodes: [], edges: [] };
    }
  }

  /**
   * Load county graphs from directory
   */
  async loadCountyGraphs(directoryPath) {
    const countyGraphs = {};
    try {
      const files = await fs.readdir(directoryPath);
      for (const file of files) {
        if (file.endsWith('_cytoscape.json')) {
          const countyName = file.split('_')[0];
          const filePath = path.join(directoryPath, file);
          countyGraphs[countyName] = await this.loadKnowledgeGraph(filePath);
        }
      }
    } catch (error) {
      console.error(`Error loading county graphs from ${directoryPath}:`, error);
    }
    return countyGraphs;
  }

  /**
   * Process CCP knowledge graph
   */
  processCCPGraph(graph) {
    if (!graph.nodes) return;
    
    for (const nodeData of graph.nodes) {
      const node = nodeData.data || nodeData;
      this.addNode({
        ...node,
        type: 'ccp_rule',
        source: 'ccp'
      });
    }
  }

  /**
   * Process CRC knowledge graph
   */
  processCRCGraph(graph) {
    if (!graph.elements) return;
    
    for (const element of graph.elements) {
      if (element.data) {
        this.addNode({
          ...element.data,
          type: 'crc_rule',
          source: 'crc'
        });
      }
    }
  }

  /**
   * Process county knowledge graphs
   */
  processCountyGraphs(countyGraphs) {
    for (const [countyName, graph] of Object.entries(countyGraphs)) {
      if (!graph.nodes) continue;
      
      for (const nodeData of graph.nodes) {
        const node = nodeData.data || nodeData;
        this.addNode({
          ...node,
          source: 'county',
          county: countyName
        });
      }
    }
  }

  /**
   * Create cross-system connections
   */
  createCrossSystemConnections() {
    // Connect related CCP and CRC rules
    this.connectCCPToCRC();
    
    // Connect state rules to county implementations
    this.connectStatesToCounties();
    
    // Connect judges to applicable rules
    this.connectJudgesToRules();
  }

  connectCCPToCRC() {
    // Example: CCP 437c relates to CRC 3.1350 (summary judgment)
    const connections = [
      { ccp: '437c', crc: '3.1350', relationship: 'implements' },
      { ccp: '1005', crc: '3.1300', relationship: 'implements' },
      { ccp: '1010.6', crc: '2.256', relationship: 'implements' }
    ];

    for (const conn of connections) {
      const ccpNode = Array.from(this.nodes.values()).find(n => 
        n.type === 'ccp_rule' && n.id.includes(conn.ccp)
      );
      const crcNode = Array.from(this.nodes.values()).find(n => 
        n.type === 'crc_rule' && n.id.includes(conn.crc)
      );
      
      if (ccpNode && crcNode) {
        this.addEdge(ccpNode.id, crcNode.id, conn.relationship, {
          type: 'cross_system_connection',
          description: `CRC rule implements CCP statute`
        });
      }
    }
  }

  connectStatesToCounties() {
    // Connect state-level rules to county implementations
    const stateNodes = Array.from(this.nodes.values()).filter(n => 
      n.type === 'ccp_rule' || n.type === 'crc_rule'
    );
    
    const countyNodes = Array.from(this.nodes.values()).filter(n => 
      n.source === 'county'
    );

    for (const stateNode of stateNodes) {
      for (const countyNode of countyNodes) {
        if (this.categoriesMatch(stateNode.category, countyNode.category)) {
          this.addEdge(stateNode.id, countyNode.id, 'applies_to_county', {
            type: 'jurisdiction_connection',
            description: `State rule applies in county jurisdiction`
          });
        }
      }
    }
  }

  connectJudgesToRules() {
    const judgeNodes = Array.from(this.nodes.values()).filter(n => 
      n.type === 'judge'
    );
    
    const ruleNodes = Array.from(this.nodes.values()).filter(n => 
      n.type === 'county_rule'
    );

    for (const judgeNode of judgeNodes) {
      for (const ruleNode of ruleNodes) {
        if (ruleNode.judge_specific && 
            ruleNode.judge_name && 
            judgeNode.judge_name &&
            ruleNode.judge_name.toLowerCase().includes(judgeNode.judge_name.toLowerCase())) {
          this.addEdge(judgeNode.id, ruleNode.id, 'has_specific_rule', {
            type: 'judge_rule_connection',
            description: `Judge has specific procedures for this rule`
          });
        }
      }
    }
  }

  categoriesMatch(category1, category2) {
    if (!category1 || !category2) return false;
    
    const normalizedCat1 = category1.toLowerCase().replace(/[^a-z]/g, '');
    const normalizedCat2 = category2.toLowerCase().replace(/[^a-z]/g, '');
    
    return normalizedCat1 === normalizedCat2 || 
           normalizedCat1.includes(normalizedCat2) || 
           normalizedCat2.includes(normalizedCat1);
  }

  addNode(nodeData) {
    const id = nodeData.id || `node_${this.nodeIdCounter++}`;
    this.nodes.set(id, { ...nodeData, id });
    return id;
  }

  addEdge(sourceId, targetId, relationship, metadata = {}) {
    const edgeId = `edge_${this.edgeIdCounter++}`;
    this.edges.set(edgeId, {
      id: edgeId,
      source: sourceId,
      target: targetId,
      relationship,
      ...metadata
    });
    return edgeId;
  }

  generateCytoscapeGraph() {
    return {
      nodes: Array.from(this.nodes.values()).map(node => ({ data: node })),
      edges: Array.from(this.edges.values()).map(edge => ({ data: edge }))
    };
  }

  generateD3Graph() {
    return {
      nodes: Array.from(this.nodes.values()),
      links: Array.from(this.edges.values()).map(edge => ({
        source: edge.source,
        target: edge.target,
        relationship: edge.relationship
      }))
    };
  }

  generateGraphMLGraph() {
    // GraphML implementation
    const nodes = Array.from(this.nodes.values());
    const edges = Array.from(this.edges.values());
    
    let graphml = `<?xml version="1.0" encoding="UTF-8"?>
<graphml xmlns="http://graphml.graphdrawing.org/xmlns">
  <key id="label" for="node" attr.name="label" attr.type="string"/>
  <key id="type" for="node" attr.name="type" attr.type="string"/>
  <key id="relationship" for="edge" attr.name="relationship" attr.type="string"/>
  <graph id="unified_knowledge_graph" edgedefault="directed">`;

    for (const node of nodes) {
      graphml += `
    <node id="${node.id}">
      <data key="label">${this.escapeXML(node.label || node.id)}</data>
      <data key="type">${this.escapeXML(node.type || 'unknown')}</data>
    </node>`;
    }

    for (const edge of edges) {
      graphml += `
    <edge source="${edge.source}" target="${edge.target}">
      <data key="relationship">${this.escapeXML(edge.relationship)}</data>
    </edge>`;
    }

    graphml += `
  </graph>
</graphml>`;

    return graphml;
  }

  generateQueryIndex() {
    const index = {};
    
    for (const node of this.nodes.values()) {
      // Index by category
      if (node.category) {
        if (!index[node.category]) index[node.category] = [];
        index[node.category].push(node.id);
      }
      
      // Index by type
      if (node.type) {
        if (!index[node.type]) index[node.type] = [];
        index[node.type].push(node.id);
      }
      
      // Index by county
      if (node.county) {
        const countyKey = `county_${node.county.toLowerCase()}`;
        if (!index[countyKey]) index[countyKey] = [];
        index[countyKey].push(node.id);
      }
      
      // Index by judge
      if (node.judge_name) {
        const judgeKey = `judge_${node.judge_name.toLowerCase().replace(/\s+/g, '_')}`;
        if (!index[judgeKey]) index[judgeKey] = [];
        index[judgeKey].push(node.id);
      }
    }
    
    return index;
  }

  generateFilingRequirementsMap() {
    const map = {};
    
    for (const [motionType, hierarchy] of Object.entries(this.filingHierarchy)) {
      map[motionType] = {
        description: motionType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        required_rules: hierarchy,
        applicable_nodes: []
      };
      
      // Find all applicable nodes
      for (const ccpRule of hierarchy.ccp_rules) {
        const nodes = Array.from(this.nodes.values()).filter(n => 
          n.type === 'ccp_rule' && n.id.includes(ccpRule)
        );
        map[motionType].applicable_nodes.push(...nodes.map(n => n.id));
      }
      
      for (const crcRule of hierarchy.crc_rules) {
        const nodes = Array.from(this.nodes.values()).filter(n => 
          n.type === 'crc_rule' && n.id.includes(crcRule)
        );
        map[motionType].applicable_nodes.push(...nodes.map(n => n.id));
      }
    }
    
    return map;
  }

  formatQuerySummary(components) {
    const parts = [];
    if (components.state) parts.push(components.state);
    if (components.county) {
      // Ensure proper capitalization for county name
      const countyName = components.county.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
      parts.push(`${countyName} County`);
    }
    if (components.case_type) parts.push(components.case_type.replace(/_/g, ' '));
    if (components.judge) {
      // Ensure proper capitalization for judge name
      const judgeName = components.judge.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
      parts.push(`Judge ${judgeName}`);
    }
    if (components.motion_type) parts.push(components.motion_type.replace(/_/g, ' '));
    
    return parts.join(', ');
  }

  generateFilingRequirements(components, relevantRules) {
    const requirements = [];
    
    // Extract requirements from relevant rules
    for (const ruleSet of Object.values(relevantRules)) {
      for (const rule of ruleSet) {
        if (rule.procedural_requirements > 0) {
          requirements.push({
            rule: rule.label,
            source: rule.source || 'unknown',
            requirement_count: rule.procedural_requirements,
            filing_relevance: rule.filing_relevance_score || rule.filingRelevance
          });
        }
      }
    }
    
    return requirements.sort((a, b) => (b.filing_relevance || 0) - (a.filing_relevance || 0));
  }

  generateProceduralSteps(components, relevantRules) {
    const steps = [];
    
    if (components.motion_type === 'motion_for_summary_judgment') {
      steps.push(
        '📄 REQUIRED DOCUMENTS:',
        '  • Notice of Motion (specify grounds, hearing date 81+ days out)',
        '  • Separate Statement of Undisputed Material Facts (two-column format)',
        '  • Memorandum of Points and Authorities (max 20 pages)',
        '  • Supporting Evidence (declarations, exhibits, discovery)',
        '  • Request for Judicial Notice (if applicable)',
        '  • Proof of Service',
        '',
        '⏰ CRITICAL DEADLINES:',
        '  • Day 0: Serve motion and supporting papers (81 days before hearing)',
        '  • Day 61: Opposition papers due (20 days before hearing)',
        '  • Day 70: Reply papers due (11 days before hearing)',
        '  • Day 80: Check tentative ruling (if court publishes)',
        '  • Day 81: Hearing date (appear if tentative contested)',
        '',
        '📝 FORMATTING REQUIREMENTS:',
        '  • Double-spaced text (CRC 2.104)',
        '  • 12-point Times New Roman font',
        '  • One-inch margins, line numbers on left',
        '  • Page numbers at bottom center',
        '  • Electronic filing in PDF format (if available)',
        '',
        '✅ PROCEDURAL STEPS:',
        '  1. Prepare all required documents with proper formatting',
        '  2. Serve motion and supporting papers at least 81 days before hearing',
        '  3. File motion papers with court and pay filing fees',
        '  4. Monitor for opposition papers (due 20 days before hearing)',
        '  5. Prepare and file reply papers (due 11 days before hearing)',
        '  6. Check for tentative ruling if required by local rules',
        '  7. Attend hearing if tentative ruling is contested'
      );
    }
    
    return steps;
  }

  extractDeadlines(relevantRules) {
    const deadlines = [];
    
    // Extract common deadlines from rule content
    for (const ruleSet of Object.values(relevantRules)) {
      for (const rule of ruleSet) {
        if (rule.title && rule.title.includes('Summary Judgment')) {
          deadlines.push('81 days notice required for motion and supporting papers (CCP 437c as amended)');
          deadlines.push('Opposition papers due 20 days before hearing');
          deadlines.push('Reply papers due 11 days before hearing');
        }
        if (rule.title && rule.title.includes('16 court days')) {
          deadlines.push('16 court days for opposition');
        }
      }
    }
    
    return [...new Set(deadlines)]; // Remove duplicates
  }

  extractFormsRequired(relevantRules) {
    const forms = [];
    
    // Extract forms from rule content
    for (const ruleSet of Object.values(relevantRules)) {
      for (const rule of ruleSet) {
        if (rule.classification === 'FORM') {
          forms.push(rule.label);
        }
      }
    }
    
    return forms;
  }

  extractLocalVariations(components, relevantRules) {
    const variations = [];
    
    // Extract county-specific variations
    if (relevantRules.county) {
      for (const rule of relevantRules.county) {
        if (rule.judge_specific) {
          variations.push(`Judge-specific procedures: ${rule.label}`);
        }
        if (rule.department_specific) {
          variations.push(`Department-specific rules: ${rule.label}`);
        }
      }
    }
    
    return variations;
  }

  escapeXML(str) {
    if (!str) return '';
    return str.toString()
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Save unified knowledge graph
   */
  async saveUnifiedGraph(graph, outputDir) {
    await fs.ensureDir(outputDir);
    
    // Save different formats
    await fs.writeFile(
      path.join(outputDir, 'unified_knowledge_graph_cytoscape.json'),
      JSON.stringify(graph.cytoscape, null, 2)
    );
    
    await fs.writeFile(
      path.join(outputDir, 'unified_knowledge_graph_d3.json'),
      JSON.stringify(graph.d3, null, 2)
    );
    
    await fs.writeFile(
      path.join(outputDir, 'unified_knowledge_graph.graphml'),
      graph.graphml
    );
    
    await fs.writeFile(
      path.join(outputDir, 'query_index.json'),
      JSON.stringify(graph.query_index, null, 2)
    );
    
    await fs.writeFile(
      path.join(outputDir, 'filing_requirements_map.json'),
      JSON.stringify(graph.filing_requirements_map, null, 2)
    );
    
    console.log(`Unified knowledge graph saved to ${outputDir}`);
  }
}

module.exports = UnifiedKnowledgeGraphGenerator; 