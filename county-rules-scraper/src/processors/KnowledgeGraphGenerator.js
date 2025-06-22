const fs = require('fs-extra');
const path = require('path');

/**
 * Knowledge Graph Generator for Legal Documents
 * Creates interconnected graphs showing relationships between:
 * - Legal rules and cross-references (compatible with CCP/CRC format)
 * - Judges and their departments
 * - Procedures and requirements
 * - Documents and their classifications
 */
class KnowledgeGraphGenerator {
  constructor(config = {}) {
    this.config = {
      outputFormat: ['cytoscape', 'd3', 'graphml'],
      includeMetadata: true,
      maxNodes: 1000,
      maxEdges: 2000,
      ...config
    };
    
    this.nodes = new Map();
    this.edges = new Map();
    this.nodeIdCounter = 1;
    this.edgeIdCounter = 1;
    
    // Categories compatible with CCP/CRC knowledge graphs
    this.legalCategories = {
      'filing_procedures': 'Filing Procedures',
      'motion_practice': 'Motion Practice', 
      'service_notice': 'Service & Notice',
      'electronic_filing': 'Electronic Filing',
      'court_procedures': 'Court Procedures',
      'discovery': 'Discovery',
      'case_management': 'Case Management',
      'judicial_orders': 'Judicial Orders',
      'local_rules': 'Local Rules',
      'complex_civil': 'Complex Civil',
      'general_civil': 'General Civil',
      'tentative_rulings': 'Tentative Rulings',
      'ex_parte': 'Ex Parte Procedures',
      'department_specific': 'Department Specific',
      'judge_specific': 'Judge Specific'
    };
  }

  /**
   * Generate knowledge graph from scraped documents
   */
  async generateKnowledgeGraph(documents, countyConfig) {
    console.log(`Generating knowledge graph for ${documents.length} documents...`);
    
    // Clear existing data
    this.nodes.clear();
    this.edges.clear();
    this.nodeIdCounter = 1;
    this.edgeIdCounter = 1;

    // Process documents to extract entities and relationships
    for (const doc of documents) {
      if (doc.classification && doc.content) {
        this.processDocument(doc, countyConfig);
      }
    }

    // Generate different graph formats
    const graphs = {};
    
    if (this.config.outputFormat.includes('cytoscape')) {
      graphs.cytoscape = this.generateCytoscapeGraph();
    }
    
    if (this.config.outputFormat.includes('d3')) {
      graphs.d3 = this.generateD3Graph();
    }
    
    if (this.config.outputFormat.includes('graphml')) {
      graphs.graphml = this.generateGraphMLGraph();
    }

    // Generate analysis report
    graphs.analysis = this.generateAnalysisReport(countyConfig);

    return graphs;
  }

  /**
   * Process individual document to extract nodes and edges
   */
  processDocument(doc, countyConfig) {
    // Determine document category based on content and classification
    const category = this.categorizeDocument(doc);
    const filingRelevance = this.calculateFilingRelevance(doc);
    const proceduralRequirements = this.extractProceduralRequirements(doc);
    
    // Create document node with CCP/CRC compatible structure
    const docNode = this.addNode({
      id: this.generateDocumentId(doc, countyConfig),
      type: 'county_rule',  // Compatible with CCP/CRC node types
      label: this.generateDocumentLabel(doc),
      title: this.generateDocumentTitle(doc),
      category: category,
      data: {
        county: countyConfig.county,
        url: doc.url,
        classification: doc.classification?.document_type,
        filing_relevance_score: filingRelevance,
        procedural_requirements: proceduralRequirements,
        cross_references: doc.classification?.cross_references?.length || 0,
        word_count: doc.metadata?.word_count || 0,
        format: doc.format,
        processed_at: doc.processed_at,
        // Additional county-specific fields
        judge_specific: doc.judge_specific_info ? true : false,
        department_specific: doc.judge_specific_info?.department?.length > 0,
        motion_practice_info: doc.judge_specific_info?.motion_practice?.length > 0,
        tentative_ruling_info: doc.judge_specific_info?.tentative_rulings?.length > 0,
        ex_parte_info: doc.judge_specific_info?.ex_parte_procedures?.length > 0
      }
    });

    // Process judge-specific information
    if (doc.judge_specific_info) {
      this.processJudgeInfo(doc.judge_specific_info, docNode, countyConfig);
    }

    // Process cross-references with CCP/CRC compatibility
    if (doc.classification?.cross_references && Array.isArray(doc.classification.cross_references)) {
      this.processCrossReferences(doc.classification.cross_references, docNode);
    }

    // Process filing questions
    if (doc.classification?.filing_questions && typeof doc.classification.filing_questions === 'object') {
      this.processFilingQuestions(doc.classification.filing_questions, docNode);
    }

    // Process compliance requirements
    if (doc.classification?.compliance_requirements && Array.isArray(doc.classification.compliance_requirements)) {
      this.processComplianceRequirements(doc.classification.compliance_requirements, docNode);
    }

    // Process key entities
    if (doc.classification?.key_entities && typeof doc.classification.key_entities === 'object') {
      this.processKeyEntities(doc.classification.key_entities, docNode);
    }
  }

  /**
   * Categorize document based on content analysis
   */
  categorizeDocument(doc) {
    const content = (doc.content || '').toLowerCase();
    const title = (doc.title || '').toLowerCase();
    const classification = doc.classification?.document_type || '';
    
    // Check for specific categories
    if (content.includes('e-filing') || content.includes('electronic filing') || title.includes('e-filing')) {
      return this.legalCategories.electronic_filing;
    }
    
    if (content.includes('motion') && (content.includes('practice') || content.includes('procedure'))) {
      return this.legalCategories.motion_practice;
    }
    
    if (content.includes('tentative ruling') || title.includes('tentative')) {
      return this.legalCategories.tentative_rulings;
    }
    
    if (content.includes('ex parte') || title.includes('ex parte')) {
      return this.legalCategories.ex_parte;
    }
    
    if (content.includes('complex civil') || title.includes('complex')) {
      return this.legalCategories.complex_civil;
    }
    
    if (content.includes('discovery') || title.includes('discovery')) {
      return this.legalCategories.discovery;
    }
    
    if (content.includes('service') || content.includes('notice')) {
      return this.legalCategories.service_notice;
    }
    
    if (content.includes('local rule') || title.includes('local rule')) {
      return this.legalCategories.local_rules;
    }
    
    if (content.includes('department') && content.includes('judge')) {
      return this.legalCategories.department_specific;
    }
    
    if (doc.judge_specific_info?.judge_name?.length > 0) {
      return this.legalCategories.judge_specific;
    }
    
    if (content.includes('filing') || title.includes('filing')) {
      return this.legalCategories.filing_procedures;
    }
    
    // Default to general civil procedures
    return this.legalCategories.general_civil;
  }

  /**
   * Calculate filing relevance score (0-10) compatible with CCP/CRC format
   */
  calculateFilingRelevance(doc) {
    let score = 0;
    const content = (doc.content || '').toLowerCase();
    const title = (doc.title || '').toLowerCase();
    
    // High relevance indicators
    if (content.includes('must file') || content.includes('required to file')) score += 3;
    if (content.includes('deadline') || content.includes('time limit')) score += 2;
    if (content.includes('e-filing') || content.includes('electronic filing')) score += 2;
    if (content.includes('motion') || content.includes('petition')) score += 2;
    if (title.includes('rule') || title.includes('procedure')) score += 1;
    
    // Judge/department specific adds relevance
    if (doc.judge_specific_info?.judge_name?.length > 0) score += 1;
    if (doc.judge_specific_info?.department?.length > 0) score += 1;
    
    return Math.min(score, 10);
  }

  /**
   * Extract procedural requirements count
   */
  extractProceduralRequirements(doc) {
    const content = (doc.content || '').toLowerCase();
    let count = 0;
    
    // Count requirement indicators
    count += (content.match(/must|required|shall/g) || []).length;
    count += (content.match(/deadline|due date|time limit/g) || []).length;
    count += (content.match(/format|formatting/g) || []).length;
    
    return Math.min(count, 20); // Cap at reasonable number
  }

  /**
   * Generate document ID compatible with CCP/CRC format
   */
  generateDocumentId(doc, countyConfig) {
    const county = countyConfig.county.toLowerCase().replace(/\s+/g, '_');
    const title = (doc.title || '').toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 30);
    
    // Try to extract rule number if present
    const ruleMatch = doc.title?.match(/rule\s+(\d+(?:\.\d+)?)/i) || 
                     doc.content?.match(/rule\s+(\d+(?:\.\d+)?)/i);
    
    if (ruleMatch) {
      return `${county}_rule_${ruleMatch[1]}`;
    }
    
    // Use URL-based ID or title-based ID
    if (doc.url) {
      const urlPart = doc.url.split('/').pop()?.replace(/[^a-z0-9]/g, '_').substring(0, 20) || 'doc';
      return `${county}_${urlPart}`;
    }
    
    return `${county}_${title || `doc_${this.nodeIdCounter}`}`;
  }

  /**
   * Generate document label compatible with CCP/CRC format
   */
  generateDocumentLabel(doc) {
    // Try to extract rule number
    const ruleMatch = doc.title?.match(/rule\s+(\d+(?:\.\d+)?)/i);
    if (ruleMatch) {
      return `Rule ${ruleMatch[1]}`;
    }
    
    // Use shortened title
    const title = doc.title || 'Document';
    return title.length > 30 ? title.substring(0, 27) + '...' : title;
  }

  /**
   * Generate document title with content preview
   */
  generateDocumentTitle(doc) {
    const title = doc.title || 'Untitled Document';
    const preview = doc.content ? 
      doc.content.substring(0, 200).replace(/\s+/g, ' ').trim() + '...' : 
      '';
    
    return `${title}${preview ? '\n' + preview : ''}`;
  }

  /**
   * Process judge-specific information
   */
  processJudgeInfo(judgeInfo, docNode, countyConfig) {
    // Process judge names
    if (judgeInfo.judge_name && Array.isArray(judgeInfo.judge_name) && judgeInfo.judge_name.length > 0) {
      for (const judgeName of judgeInfo.judge_name) {
        const judgeNode = this.addNode({
          id: `${countyConfig.county.toLowerCase().replace(/\s+/g, '_')}_judge_${this.sanitizeId(judgeName)}`,
          type: 'judge',
          label: `Judge ${judgeName}`,
          title: `Judge ${judgeName}\n${countyConfig.county} County Superior Court`,
          category: this.legalCategories.judge_specific,
          data: {
            county: countyConfig.county,
            name: judgeName,
            filing_relevance_score: 8, // Judges are highly relevant for filing procedures
            procedural_requirements: judgeInfo.procedures?.length || 0,
            cross_references: 0
          }
        });

        this.addEdge(docNode.id, judgeNode.id, 'MENTIONS_JUDGE', {
          relationship: 'mentions judge',
          weight: 3
        });
      }
    }

    // Process departments
    if (judgeInfo.department && Array.isArray(judgeInfo.department) && judgeInfo.department.length > 0) {
      for (const dept of judgeInfo.department) {
        const deptNode = this.addNode({
          id: `${countyConfig.county.toLowerCase().replace(/\s+/g, '_')}_dept_${this.sanitizeId(dept)}`,
          type: 'department',
          label: `Department ${dept}`,
          title: `Department ${dept}\n${countyConfig.county} County Superior Court`,
          category: this.legalCategories.department_specific,
          data: {
            county: countyConfig.county,
            department_number: dept,
            filing_relevance_score: 7,
            procedural_requirements: 0,
            cross_references: 0
          }
        });

        this.addEdge(docNode.id, deptNode.id, 'APPLIES_TO_DEPARTMENT', {
          relationship: 'applies to department',
          weight: 2
        });

        // Link judges to departments if both exist
        if (judgeInfo.judge_name && Array.isArray(judgeInfo.judge_name) && judgeInfo.judge_name.length > 0) {
          for (const judgeName of judgeInfo.judge_name) {
            const judgeNodeId = `${countyConfig.county.toLowerCase().replace(/\s+/g, '_')}_judge_${this.sanitizeId(judgeName)}`;
            if (this.nodes.has(judgeNodeId)) {
              this.addEdge(judgeNodeId, deptNode.id, 'PRESIDES_IN', {
                relationship: 'presides in department',
                weight: 4
              });
            }
          }
        }
      }
    }

    // Process procedures as requirement nodes
    if (judgeInfo.procedures && Array.isArray(judgeInfo.procedures) && judgeInfo.procedures.length > 0) {
      for (const procedure of judgeInfo.procedures) {
        const procNode = this.addNode({
          id: `proc_${this.nodeIdCounter}`,
          type: 'procedure',
          label: procedure.text.substring(0, 30) + '...',
          title: `Procedure Requirement\n${procedure.text}`,
          category: this.legalCategories.court_procedures,
          data: {
            full_text: procedure.text,
            procedure_type: procedure.type,
            county: countyConfig.county,
            filing_relevance_score: 6,
            procedural_requirements: 1,
            cross_references: 0
          }
        });

        this.addEdge(docNode.id, procNode.id, 'SPECIFIES_PROCEDURE', {
          relationship: 'specifies procedure',
          weight: 2
        });
      }
    }

    // Process standing orders as legal references
    if (judgeInfo.standing_orders && Array.isArray(judgeInfo.standing_orders) && judgeInfo.standing_orders.length > 0) {
      for (const order of judgeInfo.standing_orders) {
        const orderNode = this.addNode({
          id: `order_${this.nodeIdCounter}`,
          type: 'standing_order',
          label: order.text.substring(0, 30) + '...',
          title: `Standing Order\n${order.text}`,
          category: this.legalCategories.judicial_orders,
          data: {
            full_text: order.text,
            order_type: order.type,
            county: countyConfig.county,
            filing_relevance_score: 8,
            procedural_requirements: 2,
            cross_references: 0
          }
        });

        this.addEdge(docNode.id, orderNode.id, 'CONTAINS_ORDER', {
          relationship: 'contains order',
          weight: 2
        });
      }
    }
  }

  /**
   * Process cross-references with CCP/CRC compatibility
   */
  processCrossReferences(crossRefs, docNode) {
    for (const ref of crossRefs) {
      const refNode = this.addNode({
        id: `ref_${this.sanitizeId(ref.reference)}`,
        type: 'legal_reference',
        label: ref.reference.length > 30 ? ref.reference.substring(0, 27) + '...' : ref.reference,
        title: `Legal Reference\n${ref.reference}`,
        category: this.legalCategories.local_rules,
        data: {
          reference: ref.reference,
          reference_type: ref.type,
          context: ref.context,
          filing_relevance_score: 5,
          procedural_requirements: 0,
          cross_references: 1
        }
      });

      this.addEdge(docNode.id, refNode.id, 'REFERENCES', {
        relationship: 'references',
        confidence: ref.confidence,
        context: ref.context,
        weight: 2
      });
    }
  }

  /**
   * Process filing questions with CCP/CRC compatibility
   */
  processFilingQuestions(filingQuestions, docNode) {
    for (const [question, hasAnswer] of Object.entries(filingQuestions)) {
      if (hasAnswer) {
        const questionNode = this.addNode({
          id: `question_${this.sanitizeId(question)}`,
          type: 'filing_question',
          label: question.length > 30 ? question.substring(0, 27) + '...' : question,
          title: `Filing Question\n${question}`,
          category: this.legalCategories.filing_procedures,
          data: {
            question: question,
            has_answer: hasAnswer,
            filing_relevance_score: 7,
            procedural_requirements: 1,
            cross_references: 0
          }
        });

        this.addEdge(docNode.id, questionNode.id, 'ANSWERS_QUESTION', {
          relationship: 'answers filing question',
          weight: 2
        });
      }
    }
  }

  /**
   * Process compliance requirements with CCP/CRC compatibility
   */
  processComplianceRequirements(requirements, docNode) {
    for (const req of requirements) {
      const reqNode = this.addNode({
        id: `req_${this.nodeIdCounter}`,
        type: 'requirement',
        label: req.text.substring(0, 30) + '...',
        title: `Compliance Requirement\n${req.text}`,
        category: this.legalCategories.filing_procedures,
        data: {
          full_text: req.text,
          requirement_category: req.category,
          priority: req.priority,
          deadline: req.deadline,
          filing_relevance_score: 8,
          procedural_requirements: 2,
          cross_references: 0
        }
      });

      this.addEdge(docNode.id, reqNode.id, 'SPECIFIES_REQUIREMENT', {
        relationship: 'specifies requirement',
        priority: req.priority,
        weight: 3
      });
    }
  }

  /**
   * Process key entities with CCP/CRC compatibility
   */
  processKeyEntities(entities, docNode) {
    // Process court departments
    if (entities.court_departments && Array.isArray(entities.court_departments)) {
      for (const dept of entities.court_departments) {
        const deptNode = this.addNode({
          id: `entity_dept_${this.sanitizeId(dept)}`,
          type: 'court_department',
          label: dept.length > 30 ? dept.substring(0, 27) + '...' : dept,
          title: `Court Department\n${dept}`,
          category: this.legalCategories.department_specific,
          data: {
            name: dept,
            entity_type: 'court_department',
            filing_relevance_score: 6,
            procedural_requirements: 0,
            cross_references: 0
          }
        });

        this.addEdge(docNode.id, deptNode.id, 'MENTIONS_DEPARTMENT', {
          relationship: 'mentions department',
          weight: 1
        });
      }
    }

    // Process organizations
    if (entities.organizations && Array.isArray(entities.organizations)) {
      for (const org of entities.organizations.slice(0, 5)) { // Limit to avoid clutter
        const orgNode = this.addNode({
          id: `org_${this.sanitizeId(org)}`,
          type: 'organization',
          label: org.length > 30 ? org.substring(0, 27) + '...' : org,
          title: `Organization\n${org}`,
          category: this.legalCategories.general_civil,
          data: {
            name: org,
            entity_type: 'organization',
            filing_relevance_score: 3,
            procedural_requirements: 0,
            cross_references: 0
          }
        });

        this.addEdge(docNode.id, orgNode.id, 'MENTIONS_ORGANIZATION', {
          relationship: 'mentions organization',
          weight: 1
        });
      }
    }
  }

  /**
   * Add node to graph
   */
  addNode(nodeData) {
    if (!this.nodes.has(nodeData.id)) {
      this.nodes.set(nodeData.id, {
        ...nodeData,
        created_at: new Date().toISOString()
      });
      this.nodeIdCounter++;
    }
    return this.nodes.get(nodeData.id);
  }

  /**
   * Add edge to graph
   */
  addEdge(sourceId, targetId, relationship, metadata = {}) {
    const edgeId = `${sourceId}_${targetId}_${relationship}`;
    
    if (!this.edges.has(edgeId)) {
      this.edges.set(edgeId, {
        id: edgeId,
        source: sourceId,
        target: targetId,
        relationship: relationship,
        ...metadata,
        created_at: new Date().toISOString()
      });
      this.edgeIdCounter++;
    }
    
    return this.edges.get(edgeId);
  }

  /**
   * Generate Cytoscape.js format graph compatible with CCP/CRC
   */
  generateCytoscapeGraph() {
    const nodes = [];
    const edges = [];

    // Add nodes with CCP/CRC compatible structure
    for (const [id, node] of this.nodes) {
      nodes.push({
        data: {
          id: id,
          label: node.label,
          title: node.title || node.label,
          category: node.category || 'General',
          // Core CCP/CRC compatibility fields
          wordCount: node.data?.word_count || 0,
          filingRelevance: node.data?.filing_relevance_score || 0,
          proceduralRequirements: node.data?.procedural_requirements || 0,
          crossReferences: node.data?.cross_references || 0,
          // Node type and metadata
          type: node.type,
          county: node.data?.county,
          url: node.data?.url,
          // Additional fields from original data
          ...node.data
        }
      });
    }

    // Add edges with relationship data
    for (const [id, edge] of this.edges) {
      edges.push({
        data: {
          id: id,
          source: edge.source,
          target: edge.target,
          relationship: edge.relationship,
          weight: edge.weight || 1,
          confidence: edge.confidence,
          context: edge.context,
          priority: edge.priority
        }
      });
    }

    return {
      nodes: nodes,
      edges: edges,
      style: this.generateCytoscapeStyle(),
      layout: { 
        name: 'cose', 
        animate: false,
        nodeRepulsion: 4500,
        nodeOverlap: 10,
        idealEdgeLength: 50,
        edgeElasticity: 100,
        nestingFactor: 5,
        gravity: 250,
        numIter: 100,
        coolingFactor: 0.95,
        minTemp: 1.0
      }
    };
  }

  /**
   * Generate D3.js format graph
   */
  generateD3Graph() {
    const nodes = Array.from(this.nodes.values()).map(node => ({
      id: node.id,
      label: node.label,
      type: node.type,
      group: this.getNodeGroup(node.type),
      ...node.data
    }));

    const links = Array.from(this.edges.values()).map(edge => ({
      source: edge.source,
      target: edge.target,
      relationship: edge.relationship,
      value: this.getEdgeWeight(edge.relationship),
      ...edge
    }));

    return {
      nodes: nodes,
      links: links,
      metadata: {
        total_nodes: nodes.length,
        total_edges: links.length,
        node_types: this.getNodeTypeStats(),
        edge_types: this.getEdgeTypeStats()
      }
    };
  }

  /**
   * Generate GraphML format
   */
  generateGraphMLGraph() {
    let graphml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    graphml += '<graphml xmlns="http://graphml.graphdrawing.org/xmlns">\n';
    
    // Define keys
    graphml += '  <key id="label" for="node" attr.name="label" attr.type="string"/>\n';
    graphml += '  <key id="type" for="node" attr.name="type" attr.type="string"/>\n';
    graphml += '  <key id="relationship" for="edge" attr.name="relationship" attr.type="string"/>\n';
    
    graphml += '  <graph id="legal_knowledge_graph" edgedefault="directed">\n';
    
    // Add nodes
    for (const [id, node] of this.nodes) {
      graphml += `    <node id="${id}">\n`;
      graphml += `      <data key="label">${this.escapeXML(node.label)}</data>\n`;
      graphml += `      <data key="type">${node.type}</data>\n`;
      graphml += `    </node>\n`;
    }
    
    // Add edges
    for (const [id, edge] of this.edges) {
      graphml += `    <edge id="${id}" source="${edge.source}" target="${edge.target}">\n`;
      graphml += `      <data key="relationship">${this.escapeXML(edge.relationship)}</data>\n`;
      graphml += `    </edge>\n`;
    }
    
    graphml += '  </graph>\n';
    graphml += '</graphml>';
    
    return graphml;
  }

  /**
   * Generate analysis report
   */
  generateAnalysisReport(countyConfig) {
    const nodeTypes = this.getNodeTypeStats();
    const edgeTypes = this.getEdgeTypeStats();
    
    return {
      county: countyConfig.county,
      generated_at: new Date().toISOString(),
      graph_statistics: {
        total_nodes: this.nodes.size,
        total_edges: this.edges.size,
        node_types: nodeTypes,
        edge_types: edgeTypes
      },
      key_insights: this.generateKeyInsights(),
      recommendations: this.generateRecommendations(countyConfig)
    };
  }

  /**
   * Generate key insights from the graph
   */
  generateKeyInsights() {
    const insights = [];
    
    // Judge coverage
    const judgeNodes = Array.from(this.nodes.values()).filter(n => n.type === 'judge');
    if (judgeNodes.length > 0) {
      insights.push(`Found ${judgeNodes.length} judges with specific procedures or preferences`);
    }
    
    // Department coverage
    const deptNodes = Array.from(this.nodes.values()).filter(n => n.type === 'department');
    if (deptNodes.length > 0) {
      insights.push(`Identified ${deptNodes.length} court departments with specific rules`);
    }
    
    // Document coverage by category
    const categories = {};
    Array.from(this.nodes.values()).forEach(n => {
      if (n.category) {
        categories[n.category] = (categories[n.category] || 0) + 1;
      }
    });
    
    const topCategories = Object.entries(categories)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);
    
    if (topCategories.length > 0) {
      insights.push(`Top document categories: ${topCategories.map(([cat, count]) => `${cat} (${count})`).join(', ')}`);
    }
    
    // Cross-reference density
    const refEdges = Array.from(this.edges.values()).filter(e => e.relationship === 'references');
    if (refEdges.length > 0) {
      insights.push(`Documents contain ${refEdges.length} cross-references to other legal authorities`);
    }
    
    // Filing question coverage
    const questionNodes = Array.from(this.nodes.values()).filter(n => n.type === 'filing_question');
    if (questionNodes.length > 0) {
      insights.push(`Documents address ${questionNodes.length} common filing questions`);
    }
    
    // High relevance documents
    const highRelevanceDocs = Array.from(this.nodes.values()).filter(n => 
      n.data?.filing_relevance_score >= 7
    );
    if (highRelevanceDocs.length > 0) {
      insights.push(`${highRelevanceDocs.length} documents have high filing relevance (score ≥ 7)`);
    }
    
    return insights;
  }

  /**
   * Generate recommendations
   */
  generateRecommendations(countyConfig) {
    const recommendations = [];
    
    // Check for judge-specific information gaps
    const judgeNodes = Array.from(this.nodes.values()).filter(n => n.type === 'judge');
    const deptNodes = Array.from(this.nodes.values()).filter(n => n.type === 'department');
    
    if (judgeNodes.length < deptNodes.length) {
      recommendations.push({
        type: 'DATA_GAP',
        message: 'Some departments may be missing judge-specific information',
        priority: 'MEDIUM'
      });
    }
    
    // Check for cross-reference validation needs
    const refNodes = Array.from(this.nodes.values()).filter(n => n.type === 'legal_reference');
    if (refNodes.length > 10) {
      recommendations.push({
        type: 'VALIDATION',
        message: 'Consider validating cross-references for accuracy and current status',
        priority: 'HIGH'
      });
    }
    
    // Check for filing relevance coverage
    const lowRelevanceDocs = Array.from(this.nodes.values()).filter(n => 
      n.type === 'county_rule' && (n.data?.filing_relevance_score || 0) < 3
    );
    
    if (lowRelevanceDocs.length > this.nodes.size * 0.3) {
      recommendations.push({
        type: 'CONTENT_REVIEW',
        message: 'Many documents have low filing relevance - consider content review',
        priority: 'LOW'
      });
    }
    
    // Check for procedural requirements coverage
    const procReqDocs = Array.from(this.nodes.values()).filter(n => 
      n.type === 'county_rule' && (n.data?.procedural_requirements || 0) > 5
    );
    
    if (procReqDocs.length > 0) {
      recommendations.push({
        type: 'PROCESS_IMPROVEMENT',
        message: `${procReqDocs.length} documents contain many procedural requirements - consider creating summary guides`,
        priority: 'MEDIUM'
      });
    }
    
    return recommendations;
  }

  // Helper methods
  sanitizeId(str) {
    return str.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
  }

  escapeXML(str) {
    return str.replace(/[<>&'"]/g, function(c) {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case "'": return '&apos;';
        case '"': return '&quot;';
      }
    });
  }

  getNodeGroup(type) {
    const groups = {
      'county_rule': 1,
      'judge': 2,
      'department': 3,
      'legal_reference': 4,
      'filing_question': 5,
      'requirement': 6,
      'procedure': 7,
      'standing_order': 8,
      'court_department': 9,
      'organization': 10
    };
    return groups[type] || 0;
  }

  getEdgeWeight(relationship) {
    const weights = {
      'mentions judge': 3,
      'applies to department': 3,
      'presides in department': 4,
      'references': 2,
      'answers filing question': 2,
      'specifies requirement': 3,
      'specifies procedure': 2,
      'contains order': 2,
      'mentions department': 1,
      'mentions organization': 1
    };
    return weights[relationship] || 1;
  }

  getNodeTypeStats() {
    const stats = {};
    for (const node of this.nodes.values()) {
      stats[node.type] = (stats[node.type] || 0) + 1;
    }
    return stats;
  }

  getEdgeTypeStats() {
    const stats = {};
    for (const edge of this.edges.values()) {
      stats[edge.relationship] = (stats[edge.relationship] || 0) + 1;
    }
    return stats;
  }

  generateCytoscapeStyle() {
    return [
      {
        selector: 'node',
        style: {
          'background-color': '#666',
          'label': 'data(label)',
          'text-valign': 'center',
          'color': 'white',
          'text-outline-width': 2,
          'text-outline-color': '#666',
          'font-size': '12px',
          'width': 'mapData(filingRelevance, 0, 10, 30, 80)',
          'height': 'mapData(filingRelevance, 0, 10, 30, 80)'
        }
      },
      {
        selector: 'node[type="judge"]',
        style: {
          'background-color': '#e74c3c',
          'shape': 'round-rectangle'
        }
      },
      {
        selector: 'node[type="department"]',
        style: {
          'background-color': '#3498db',
          'shape': 'round-rectangle'
        }
      },
      {
        selector: 'node[type="county_rule"]',
        style: {
          'background-color': '#2ecc71',
          'shape': 'rectangle'
        }
      },
      {
        selector: 'node[type="legal_reference"]',
        style: {
          'background-color': '#f39c12',
          'shape': 'diamond'
        }
      },
      {
        selector: 'node[type="filing_question"]',
        style: {
          'background-color': '#9b59b6',
          'shape': 'ellipse'
        }
      },
      {
        selector: 'node[type="requirement"]',
        style: {
          'background-color': '#e67e22',
          'shape': 'octagon'
        }
      },
      {
        selector: 'node[type="procedure"]',
        style: {
          'background-color': '#1abc9c',
          'shape': 'pentagon'
        }
      },
      {
        selector: 'node[type="standing_order"]',
        style: {
          'background-color': '#34495e',
          'shape': 'hexagon'
        }
      },
      {
        selector: 'edge',
        style: {
          'width': 'mapData(weight, 1, 4, 1, 4)',
          'line-color': '#ccc',
          'target-arrow-color': '#ccc',
          'target-arrow-shape': 'triangle',
          'curve-style': 'bezier',
          'label': 'data(relationship)',
          'font-size': '8px',
          'text-rotation': 'autorotate',
          'text-background-color': 'white',
          'text-background-opacity': 0.8
        }
      }
    ];
  }

  /**
   * Save knowledge graph to files
   */
  async saveKnowledgeGraph(graphs, outputDir, countyName) {
    await fs.ensureDir(outputDir);
    
    const baseFilename = `${countyName.toLowerCase().replace(/\s+/g, '-')}_knowledge_graph`;
    
    // Save different formats
    if (graphs.cytoscape) {
      await fs.writeJson(
        path.join(outputDir, `${baseFilename}_cytoscape.json`),
        graphs.cytoscape,
        { spaces: 2 }
      );
    }
    
    if (graphs.d3) {
      await fs.writeJson(
        path.join(outputDir, `${baseFilename}_d3.json`),
        graphs.d3,
        { spaces: 2 }
      );
    }
    
    if (graphs.graphml) {
      await fs.writeFile(
        path.join(outputDir, `${baseFilename}.graphml`),
        graphs.graphml
      );
    }
    
    if (graphs.analysis) {
      await fs.writeJson(
        path.join(outputDir, `${baseFilename}_analysis.json`),
        graphs.analysis,
        { spaces: 2 }
      );
    }
    
    console.log(`Knowledge graph saved to ${outputDir}`);
    return outputDir;
  }
}

module.exports = KnowledgeGraphGenerator; 