const fs = require('fs').promises;
const path = require('path');

class CCPKnowledgeGraph {
  constructor(options = {}) {
    this.inputFile = options.inputFile || './ccp_results/ccp_filing_rules_extraction_results.json';
    this.outputDir = options.outputDir || './ccp_knowledge_graph';
    this.nodes = new Map();
    this.edges = [];
    this.categories = new Map();
  }

  async initialize() {
    await fs.mkdir(this.outputDir, { recursive: true });
    console.log(`📁 Knowledge graph output directory: ${this.outputDir}`);
  }

  async generateKnowledgeGraph() {
    console.log('🧠 Generating CCP Knowledge Graph...');
    console.log('='.repeat(60));

    try {
      // Load the extraction results
      const data = await this.loadExtractionResults();
      
      // Extract nodes and relationships
      await this.extractNodes(data);
      await this.extractRelationships(data);
      
      // Analyze interdependencies
      const analysis = await this.analyzeInterdependencies();
      
      // Generate different graph formats
      await this.generateGraphML();
      await this.generateCytoscape();
      await this.generateD3();
      await this.generateMermaid();
      
      // Generate analysis reports
      await this.generateAnalysisReport(analysis);
      await this.generateInteractiveHTML();
      
      console.log('\n🎉 Knowledge graph generation completed!');
      console.log(`📊 Generated ${this.nodes.size} nodes and ${this.edges.length} relationships`);
      
      return analysis;
      
    } catch (error) {
      console.error('❌ Error generating knowledge graph:', error);
      throw error;
    }
  }

  async loadExtractionResults() {
    console.log(`📖 Loading extraction results from: ${this.inputFile}`);
    
    const data = JSON.parse(await fs.readFile(this.inputFile, 'utf8'));
    
    if (!data.extracted_documents || !Array.isArray(data.extracted_documents)) {
      throw new Error('Invalid extraction results format');
    }
    
    console.log(`✅ Loaded ${data.extracted_documents.length} extracted documents`);
    return data;
  }

  async extractNodes(data) {
    console.log('\n🔍 Extracting nodes from CCP sections...');
    
    for (const doc of data.extracted_documents) {
      if (doc.file_info?.status !== 'success') continue;
      
      const ruleInfo = doc.rule_info || {};
      const analysis = doc.ccp_analysis || {};
      const content = doc.content || {};
      
      const sectionNumber = ruleInfo.ruleNumber || 'Unknown';
      const sectionTitle = ruleInfo.title || 'Unknown Title';
      
      // Determine category based on section number and content
      const category = this.categorizeSection(sectionNumber, sectionTitle, analysis);
      
      // Create node
      const node = {
        id: sectionNumber,
        label: `CCP ${sectionNumber}`,
        title: sectionTitle,
        category: category,
        type: 'ccp_section',
        properties: {
          wordCount: content.word_count || 0,
          pageCount: content.page_count || 0,
          proceduralRequirements: analysis.procedural_requirements?.length || 0,
          deadlinesAndTiming: analysis.deadlines_and_timing?.length || 0,
          crossReferences: analysis.cross_references?.length || 0,
          keyProvisions: analysis.key_provisions?.length || 0,
          filingRelevance: ruleInfo.filingRelevance?.score || 0,
          url: ruleInfo.url || '',
          source: ruleInfo.source || ''
        },
        content: {
          proceduralRequirements: analysis.procedural_requirements || [],
          deadlinesAndTiming: analysis.deadlines_and_timing || [],
          crossReferences: analysis.cross_references || [],
          keyProvisions: analysis.key_provisions || []
        }
      };
      
      this.nodes.set(sectionNumber, node);
      
      // Track categories
      if (!this.categories.has(category)) {
        this.categories.set(category, []);
      }
      this.categories.get(category).push(sectionNumber);
    }
    
    console.log(`✅ Extracted ${this.nodes.size} section nodes`);
    console.log(`📊 Categories: ${Array.from(this.categories.keys()).join(', ')}`);
  }

  categorizeSection(sectionNumber, title, analysis) {
    const num = parseFloat(sectionNumber.replace(/[a-z]/g, ''));
    const titleLower = title.toLowerCase();
    
    // Categorize based on section ranges and content
    if (num >= 36 && num <= 44) return 'Case Management';
    if (num >= 410 && num <= 418) return 'Jurisdiction & Service';
    if (num >= 420 && num <= 475) return 'Pleadings';
    if (num >= 437 && num <= 439) return 'Summary Judgment';
    if (num >= 583 && num <= 583.5) return 'Dismissal Procedures';
    if (num >= 664 && num <= 670) return 'Judgment Entry';
    if (num >= 683 && num <= 724) return 'Judgment Enforcement';
    if (num >= 901 && num <= 996) return 'Writs';
    if (num >= 1000 && num <= 1020) return 'Service & Notice';
    if (num >= 1032 && num <= 1038) return 'Costs & Fees';
    if (num >= 1085 && num <= 1097) return 'Mandates';
    if (num >= 2016 && num <= 2017) return 'Discovery Scope';
    if (num >= 2023 && num <= 2023.1) return 'Discovery Sanctions';
    if (num >= 2025 && num <= 2025.9) return 'Depositions';
    if (num >= 2030 && num <= 2030.1) return 'Interrogatories';
    if (num >= 2031 && num <= 2031.5) return 'Document Production';
    if (num >= 2032 && num <= 2032.9) return 'Physical Examinations';
    if (num >= 2033 && num <= 2033.8) return 'Requests for Admission';
    
    // Content-based categorization
    if (titleLower.includes('filing') || titleLower.includes('service')) return 'Filing & Service';
    if (titleLower.includes('motion') || titleLower.includes('ex parte')) return 'Motion Practice';
    if (titleLower.includes('discovery')) return 'Discovery';
    if (titleLower.includes('judgment')) return 'Judgment Procedures';
    if (titleLower.includes('deadline') || titleLower.includes('time')) return 'Timing Rules';
    
    return 'General Procedures';
  }

  async extractRelationships(data) {
    console.log('\n🔗 Extracting relationships between sections...');
    
    const relationshipTypes = {
      'cross_reference': { weight: 3, label: 'References' },
      'procedural_dependency': { weight: 5, label: 'Procedural Dependency' },
      'timing_relationship': { weight: 4, label: 'Timing Relationship' },
      'category_similarity': { weight: 2, label: 'Category Similarity' },
      'content_similarity': { weight: 1, label: 'Content Similarity' }
    };
    
    const nodes = Array.from(this.nodes.values());
    
    for (let i = 0; i < nodes.length; i++) {
      const sourceNode = nodes[i];
      
      // Extract cross-references
      for (const crossRef of sourceNode.content.crossReferences) {
        const targetNode = this.nodes.get(crossRef);
        if (targetNode && targetNode.id !== sourceNode.id) {
          this.addEdge(sourceNode.id, targetNode.id, 'cross_reference', {
            description: `Section ${sourceNode.id} references Section ${targetNode.id}`
          });
        }
      }
      
      // Check for procedural dependencies in content
      for (const requirement of sourceNode.content.proceduralRequirements) {
        const referencedSections = this.extractSectionReferences(requirement);
        for (const refSection of referencedSections) {
          const targetNode = this.nodes.get(refSection);
          if (targetNode && targetNode.id !== sourceNode.id) {
            this.addEdge(sourceNode.id, targetNode.id, 'procedural_dependency', {
              description: `Procedural dependency: "${requirement.substring(0, 100)}..."`
            });
          }
        }
      }
      
      // Check for timing relationships
      for (const timing of sourceNode.content.deadlinesAndTiming) {
        const referencedSections = this.extractSectionReferences(timing);
        for (const refSection of referencedSections) {
          const targetNode = this.nodes.get(refSection);
          if (targetNode && targetNode.id !== sourceNode.id) {
            this.addEdge(sourceNode.id, targetNode.id, 'timing_relationship', {
              description: `Timing relationship: "${timing.substring(0, 100)}..."`
            });
          }
        }
      }
      
      // Category-based relationships (only for closely related categories)
      for (let j = i + 1; j < nodes.length; j++) {
        const targetNode = nodes[j];
        
        if (sourceNode.category === targetNode.category) {
          this.addEdge(sourceNode.id, targetNode.id, 'category_similarity', {
            description: `Both sections belong to category: ${sourceNode.category}`
          });
        }
      }
    }
    
    console.log(`✅ Extracted ${this.edges.length} relationships`);
    
    // Log relationship type distribution
    const typeCount = {};
    this.edges.forEach(edge => {
      typeCount[edge.type] = (typeCount[edge.type] || 0) + 1;
    });
    
    console.log('📊 Relationship types:');
    Object.entries(typeCount).forEach(([type, count]) => {
      console.log(`   ${type}: ${count} relationships`);
    });
  }

  addEdge(source, target, type, properties = {}) {
    // Avoid duplicate edges
    const existingEdge = this.edges.find(e => 
      e.source === source && e.target === target && e.type === type
    );
    
    if (!existingEdge) {
      this.edges.push({
        source,
        target,
        type,
        weight: this.getRelationshipWeight(type),
        label: this.getRelationshipLabel(type),
        ...properties
      });
    }
  }

  getRelationshipWeight(type) {
    const weights = {
      'cross_reference': 3,
      'procedural_dependency': 5,
      'timing_relationship': 4,
      'category_similarity': 2,
      'content_similarity': 1
    };
    return weights[type] || 1;
  }

  getRelationshipLabel(type) {
    const labels = {
      'cross_reference': 'References',
      'procedural_dependency': 'Depends On',
      'timing_relationship': 'Timing Relation',
      'category_similarity': 'Similar Category',
      'content_similarity': 'Similar Content'
    };
    return labels[type] || type;
  }

  extractSectionReferences(text) {
    const references = [];
    const patterns = [
      /(?:Section|Rule|CCP)\s+(\d+(?:\.\d+)?[a-z]?)/gi,
      /(\d+(?:\.\d+)?[a-z]?)\s*(?:of\s+(?:this\s+)?(?:Code|Chapter|Title))/gi,
      /Code\s+of\s+Civil\s+Procedure\s+[Ss]ection\s+(\d+(?:\.\d+)?[a-z]?)/gi
    ];
    
    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const sectionNum = match[1];
        if (this.nodes.has(sectionNum)) {
          references.push(sectionNum);
        }
      }
    });
    
    return [...new Set(references)]; // Remove duplicates
  }

  async analyzeInterdependencies() {
    console.log('\n📊 Analyzing interdependencies...');
    
    const analysis = {
      totalNodes: this.nodes.size,
      totalEdges: this.edges.length,
      categories: {},
      centralNodes: [],
      clusters: [],
      networkMetrics: {}
    };
    
    // Category analysis
    for (const [category, sections] of this.categories) {
      const categoryEdges = this.edges.filter(edge => 
        this.nodes.get(edge.source)?.category === category ||
        this.nodes.get(edge.target)?.category === category
      );
      
      analysis.categories[category] = {
        nodeCount: sections.length,
        internalEdges: categoryEdges.filter(edge => 
          this.nodes.get(edge.source)?.category === category &&
          this.nodes.get(edge.target)?.category === category
        ).length,
        externalEdges: categoryEdges.filter(edge => 
          this.nodes.get(edge.source)?.category !== this.nodes.get(edge.target)?.category
        ).length,
        sections: sections
      };
    }
    
    // Calculate centrality (degree centrality)
    const nodeDegrees = new Map();
    this.edges.forEach(edge => {
      nodeDegrees.set(edge.source, (nodeDegrees.get(edge.source) || 0) + 1);
      nodeDegrees.set(edge.target, (nodeDegrees.get(edge.target) || 0) + 1);
    });
    
    // Find most central nodes
    analysis.centralNodes = Array.from(nodeDegrees.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([nodeId, degree]) => ({
        section: nodeId,
        degree,
        title: this.nodes.get(nodeId)?.title || 'Unknown',
        category: this.nodes.get(nodeId)?.category || 'Unknown'
      }));
    
    // Network density
    const maxPossibleEdges = (this.nodes.size * (this.nodes.size - 1)) / 2;
    analysis.networkMetrics.density = this.edges.length / maxPossibleEdges;
    analysis.networkMetrics.averageDegree = (this.edges.length * 2) / this.nodes.size;
    
    console.log(`✅ Analysis completed`);
    console.log(`📊 Network density: ${(analysis.networkMetrics.density * 100).toFixed(2)}%`);
    console.log(`📊 Average degree: ${analysis.networkMetrics.averageDegree.toFixed(2)}`);
    
    return analysis;
  }

  async generateGraphML() {
    console.log('\n💾 Generating GraphML format...');
    
    let graphml = `<?xml version="1.0" encoding="UTF-8"?>
<graphml xmlns="http://graphml.graphdrawing.org/xmlns"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://graphml.graphdrawing.org/xmlns
         http://graphml.graphdrawing.org/xmlns/1.0/graphml.xsd">
  
  <!-- Node attributes -->
  <key id="label" for="node" attr.name="label" attr.type="string"/>
  <key id="title" for="node" attr.name="title" attr.type="string"/>
  <key id="category" for="node" attr.name="category" attr.type="string"/>
  <key id="wordCount" for="node" attr.name="wordCount" attr.type="int"/>
  <key id="filingRelevance" for="node" attr.name="filingRelevance" attr.type="double"/>
  
  <!-- Edge attributes -->
  <key id="type" for="edge" attr.name="type" attr.type="string"/>
  <key id="weight" for="edge" attr.name="weight" attr.type="double"/>
  <key id="description" for="edge" attr.name="description" attr.type="string"/>
  
  <graph id="CCP_Knowledge_Graph" edgedefault="undirected">
`;
    
    // Add nodes
    for (const node of this.nodes.values()) {
      graphml += `    <node id="${node.id}">
      <data key="label">${this.escapeXML(node.label)}</data>
      <data key="title">${this.escapeXML(node.title)}</data>
      <data key="category">${this.escapeXML(node.category)}</data>
      <data key="wordCount">${node.properties.wordCount}</data>
      <data key="filingRelevance">${node.properties.filingRelevance}</data>
    </node>
`;
    }
    
    // Add edges
    for (let i = 0; i < this.edges.length; i++) {
      const edge = this.edges[i];
      graphml += `    <edge id="e${i}" source="${edge.source}" target="${edge.target}">
      <data key="type">${edge.type}</data>
      <data key="weight">${edge.weight}</data>
      <data key="description">${this.escapeXML(edge.description || '')}</data>
    </edge>
`;
    }
    
    graphml += `  </graph>
</graphml>`;
    
    await fs.writeFile(path.join(this.outputDir, 'ccp_knowledge_graph.graphml'), graphml);
    console.log('✅ GraphML file generated');
  }

  async generateCytoscape() {
    console.log('\n💾 Generating Cytoscape.js format...');
    
    const cytoscapeData = {
      nodes: Array.from(this.nodes.values()).map(node => ({
        data: {
          id: node.id,
          label: node.label,
          title: node.title,
          category: node.category,
          wordCount: node.properties.wordCount,
          filingRelevance: node.properties.filingRelevance,
          proceduralRequirements: node.properties.proceduralRequirements,
          crossReferences: node.properties.crossReferences
        }
      })),
      edges: this.edges.map((edge, index) => ({
        data: {
          id: `e${index}`,
          source: edge.source,
          target: edge.target,
          type: edge.type,
          weight: edge.weight,
          label: edge.label,
          description: edge.description || ''
        }
      }))
    };
    
    await fs.writeFile(
      path.join(this.outputDir, 'ccp_knowledge_graph_cytoscape.json'),
      JSON.stringify(cytoscapeData, null, 2)
    );
    console.log('✅ Cytoscape.js file generated');
  }

  async generateD3() {
    console.log('\n💾 Generating D3.js format...');
    
    const d3Data = {
      nodes: Array.from(this.nodes.values()).map(node => ({
        id: node.id,
        label: node.label,
        title: node.title,
        category: node.category,
        group: this.getCategoryIndex(node.category),
        size: Math.max(5, node.properties.wordCount / 100),
        filingRelevance: node.properties.filingRelevance,
        properties: node.properties
      })),
      links: this.edges.map(edge => ({
        source: edge.source,
        target: edge.target,
        type: edge.type,
        weight: edge.weight,
        label: edge.label,
        description: edge.description || ''
      }))
    };
    
    await fs.writeFile(
      path.join(this.outputDir, 'ccp_knowledge_graph_d3.json'),
      JSON.stringify(d3Data, null, 2)
    );
    console.log('✅ D3.js file generated');
  }

  async generateMermaid() {
    console.log('\n💾 Generating Mermaid diagram...');
    
    let mermaid = 'graph TD\n';
    
    // Add nodes with categories as colors
    const categoryColors = {
      'Jurisdiction & Service': 'fill:#ff9999',
      'Pleadings': 'fill:#99ff99',
      'Summary Judgment': 'fill:#9999ff',
      'Service & Notice': 'fill:#ffff99',
      'Discovery': 'fill:#ff99ff',
      'Motion Practice': 'fill:#99ffff',
      'Case Management': 'fill:#ffcc99',
      'Judgment Procedures': 'fill:#ccff99'
    };
    
    // Add key relationships only (to avoid cluttered diagram)
    const importantEdges = this.edges
      .filter(edge => edge.type === 'cross_reference' || edge.type === 'procedural_dependency')
      .slice(0, 50); // Limit for readability
    
    for (const edge of importantEdges) {
      const sourceLabel = edge.source.replace(/\./g, '_');
      const targetLabel = edge.target.replace(/\./g, '_');
      mermaid += `    ${sourceLabel}["CCP ${edge.source}"] --> ${targetLabel}["CCP ${edge.target}"]\n`;
    }
    
    // Add styling
    mermaid += '\n';
    for (const [category, color] of Object.entries(categoryColors)) {
      const sections = this.categories.get(category) || [];
      for (const section of sections.slice(0, 10)) { // Limit for performance
        const sectionLabel = section.replace(/\./g, '_');
        mermaid += `    classDef ${category.replace(/\s+/g, '')} ${color}\n`;
        mermaid += `    class ${sectionLabel} ${category.replace(/\s+/g, '')}\n`;
      }
    }
    
    await fs.writeFile(path.join(this.outputDir, 'ccp_knowledge_graph.mermaid'), mermaid);
    console.log('✅ Mermaid diagram generated');
  }

  getCategoryIndex(category) {
    const categories = Array.from(this.categories.keys());
    return categories.indexOf(category) + 1;
  }

  escapeXML(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  async generateAnalysisReport(analysis) {
    console.log('\n📋 Generating analysis report...');
    
    let report = `# CCP Knowledge Graph Analysis Report
Generated: ${new Date().toISOString()}

## Network Overview
- **Total Sections**: ${analysis.totalNodes}
- **Total Relationships**: ${analysis.totalEdges}
- **Network Density**: ${(analysis.networkMetrics.density * 100).toFixed(2)}%
- **Average Connections per Section**: ${analysis.networkMetrics.averageDegree.toFixed(2)}

## Most Connected Sections (Central Nodes)
`;

    analysis.centralNodes.forEach((node, index) => {
      report += `${index + 1}. **CCP ${node.section}** (${node.degree} connections)
   - Title: ${node.title}
   - Category: ${node.category}

`;
    });

    report += `## Category Analysis
`;

    for (const [category, data] of Object.entries(analysis.categories)) {
      const connectivity = data.internalEdges + data.externalEdges;
      const internalRatio = data.internalEdges / (connectivity || 1) * 100;
      
      report += `### ${category}
- **Sections**: ${data.nodeCount}
- **Internal Connections**: ${data.internalEdges}
- **External Connections**: ${data.externalEdges}
- **Internal Connectivity**: ${internalRatio.toFixed(1)}%
- **Key Sections**: ${data.sections.slice(0, 5).join(', ')}${data.sections.length > 5 ? '...' : ''}

`;
    }

    report += `## Key Insights

### Highly Interconnected Areas
The sections with the most connections likely represent core procedural requirements that other rules depend on.

### Category Cohesion
Categories with high internal connectivity suggest well-defined procedural areas, while those with high external connectivity indicate cross-cutting requirements.

### Network Structure
- **Dense areas** indicate tightly coupled procedural requirements
- **Bridge sections** connect different procedural areas
- **Isolated sections** may represent specialized or standalone procedures

## Files Generated
- \`ccp_knowledge_graph.graphml\` - For Gephi, yEd, or other graph analysis tools
- \`ccp_knowledge_graph_cytoscape.json\` - For Cytoscape.js web visualization
- \`ccp_knowledge_graph_d3.json\` - For D3.js custom visualizations
- \`ccp_knowledge_graph.mermaid\` - For Mermaid diagram rendering
- \`ccp_knowledge_graph.html\` - Interactive web visualization
`;

    await fs.writeFile(path.join(this.outputDir, 'analysis_report.md'), report);
    console.log('✅ Analysis report generated');
  }

  async generateInteractiveHTML() {
    console.log('\n🌐 Generating interactive HTML visualization...');
    
    const html = `<!DOCTYPE html>
<html>
<head>
    <title>CCP Knowledge Graph</title>
    <script src="https://unpkg.com/cytoscape@3.21.0/dist/cytoscape.min.js"></script>
    <script src="https://unpkg.com/cytoscape-cose-bilkent@4.1.0/cytoscape-cose-bilkent.js"></script>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
        #cy { width: 100%; height: 600px; border: 1px solid #ccc; }
        .controls { margin: 20px 0; }
        .info-panel { margin-top: 20px; padding: 15px; background: #f5f5f5; border-radius: 5px; }
        .category-legend { display: flex; flex-wrap: wrap; gap: 10px; margin: 10px 0; }
        .category-item { padding: 5px 10px; border-radius: 3px; font-size: 12px; }
    </style>
</head>
<body>
    <h1>CCP Knowledge Graph - Rule Interdependencies</h1>
    
    <div class="controls">
        <label>Layout: 
            <select id="layout-select">
                <option value="cose-bilkent">Force-directed (recommended)</option>
                <option value="circle">Circle</option>
                <option value="grid">Grid</option>
                <option value="breadthfirst">Hierarchical</option>
            </select>
        </label>
        <label style="margin-left: 20px;">Filter by category: 
            <select id="category-filter">
                <option value="">All categories</option>
            </select>
        </label>
        <button onclick="resetView()" style="margin-left: 20px;">Reset View</button>
    </div>
    
    <div class="category-legend" id="legend"></div>
    
    <div id="cy"></div>
    
    <div class="info-panel">
        <h3>Instructions:</h3>
        <ul>
            <li><strong>Click</strong> on a node to see section details</li>
            <li><strong>Hover</strong> over edges to see relationship types</li>
            <li><strong>Drag</strong> to pan, <strong>scroll</strong> to zoom</li>
            <li><strong>Filter</strong> by category to focus on specific areas</li>
        </ul>
        <div id="node-info"></div>
    </div>

    <script>
        // Load the graph data
        fetch('./ccp_knowledge_graph_cytoscape.json')
            .then(response => response.json())
            .then(data => initializeGraph(data))
            .catch(error => {
                console.error('Error loading graph data:', error);
                document.getElementById('cy').innerHTML = '<p>Error loading graph data. Make sure ccp_knowledge_graph_cytoscape.json is in the same directory.</p>';
            });

        let cy;
        let originalData;

        function initializeGraph(data) {
            originalData = data;
            
            // Set up category colors
            const categories = [...new Set(data.nodes.map(n => n.data.category))];
            const colors = ['#ff9999', '#99ff99', '#9999ff', '#ffff99', '#ff99ff', '#99ffff', '#ffcc99', '#ccff99', '#ff6666', '#66ff66'];
            
            // Populate category filter
            const categoryFilter = document.getElementById('category-filter');
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                categoryFilter.appendChild(option);
            });
            
            // Create legend
            const legend = document.getElementById('legend');
            categories.forEach((category, index) => {
                const item = document.createElement('div');
                item.className = 'category-item';
                item.style.backgroundColor = colors[index % colors.length];
                item.textContent = category;
                legend.appendChild(item);
            });

            cy = cytoscape({
                container: document.getElementById('cy'),
                elements: data,
                style: [
                    {
                        selector: 'node',
                        style: {
                            'background-color': function(ele) {
                                const categoryIndex = categories.indexOf(ele.data('category'));
                                return colors[categoryIndex % colors.length];
                            },
                            'label': 'data(id)',
                            'width': function(ele) { return Math.max(20, ele.data('wordCount') / 50); },
                            'height': function(ele) { return Math.max(20, ele.data('wordCount') / 50); },
                            'font-size': '10px',
                            'text-valign': 'center',
                            'text-halign': 'center'
                        }
                    },
                    {
                        selector: 'edge',
                        style: {
                            'width': 'data(weight)',
                            'line-color': function(ele) {
                                const type = ele.data('type');
                                if (type === 'cross_reference') return '#666';
                                if (type === 'procedural_dependency') return '#ff6b6b';
                                if (type === 'timing_relationship') return '#4ecdc4';
                                return '#ccc';
                            },
                            'target-arrow-color': '#666',
                            'target-arrow-shape': 'triangle',
                            'curve-style': 'bezier'
                        }
                    }
                ],
                layout: {
                    name: 'cose-bilkent',
                    animate: true,
                    animationDuration: 1000
                }
            });

            // Event handlers
            cy.on('tap', 'node', function(evt) {
                const node = evt.target;
                const info = document.getElementById('node-info');
                info.innerHTML = \`
                    <h4>CCP Section \${node.data('id')}</h4>
                    <p><strong>Title:</strong> \${node.data('title')}</p>
                    <p><strong>Category:</strong> \${node.data('category')}</p>
                    <p><strong>Word Count:</strong> \${node.data('wordCount')}</p>
                    <p><strong>Filing Relevance:</strong> \${node.data('filingRelevance')}</p>
                    <p><strong>Procedural Requirements:</strong> \${node.data('proceduralRequirements')}</p>
                    <p><strong>Cross References:</strong> \${node.data('crossReferences')}</p>
                \`;
            });

            // Layout change handler
            document.getElementById('layout-select').addEventListener('change', function(e) {
                cy.layout({name: e.target.value, animate: true}).run();
            });

            // Category filter handler
            document.getElementById('category-filter').addEventListener('change', function(e) {
                const selectedCategory = e.target.value;
                if (selectedCategory) {
                    const filteredNodes = originalData.nodes.filter(n => n.data.category === selectedCategory);
                    const nodeIds = new Set(filteredNodes.map(n => n.data.id));
                    const filteredEdges = originalData.edges.filter(e => 
                        nodeIds.has(e.data.source) && nodeIds.has(e.data.target)
                    );
                    cy.elements().remove();
                    cy.add([...filteredNodes, ...filteredEdges]);
                } else {
                    cy.elements().remove();
                    cy.add(originalData);
                }
                cy.layout({name: 'cose-bilkent', animate: true}).run();
            });
        }

        function resetView() {
            if (cy) {
                cy.fit();
                cy.center();
            }
        }
    </script>
</body>
</html>`;

    await fs.writeFile(path.join(this.outputDir, 'ccp_knowledge_graph.html'), html);
    console.log('✅ Interactive HTML visualization generated');
  }
}

// Usage example
async function main() {
  const knowledgeGraph = new CCPKnowledgeGraph({
    inputFile: './ccp_results/ccp_filing_rules_extraction_results.json',
    outputDir: './ccp_knowledge_graph'
  });

  try {
    await knowledgeGraph.initialize();
    const analysis = await knowledgeGraph.generateKnowledgeGraph();
    
    console.log('\n🎉 Knowledge graph generation completed successfully!');
    console.log('\n📊 Quick Stats:');
    console.log(`   • ${analysis.totalNodes} CCP sections analyzed`);
    console.log(`   • ${analysis.totalEdges} relationships discovered`);
    console.log(`   • ${Object.keys(analysis.categories).length} categories identified`);
    console.log(`   • Top connected section: CCP ${analysis.centralNodes[0]?.section} (${analysis.centralNodes[0]?.degree} connections)`);
    
    console.log('\n📁 Generated files:');
    console.log('   • ccp_knowledge_graph.html - Interactive web visualization');
    console.log('   • ccp_knowledge_graph.graphml - For Gephi/yEd analysis');
    console.log('   • ccp_knowledge_graph_cytoscape.json - For web development');
    console.log('   • ccp_knowledge_graph_d3.json - For D3.js visualizations');
    console.log('   • analysis_report.md - Detailed analysis report');
    
  } catch (error) {
    console.error('❌ Knowledge graph generation failed:', error);
  }
}

// Export for use as module
module.exports = { CCPKnowledgeGraph };

// Run if executed directly
if (require.main === module) {
  main();
} 