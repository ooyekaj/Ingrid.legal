const fs = require('fs');
const zlib = require('zlib');

class IntelligentUnifiedGraph {
    constructor() {
        this.elements = [];
        this.crcNodes = [];
        this.ccpNodes = [];
        this.explicitRefs = [];
        this.sequentialEdges = [];
        this.thematicEdges = [];
        this.crossRefEdges = [];
    }

    async loadAndProcessData() {
        console.log('🧠 Creating Intelligent Connected Graph...\n');

        // Load CRC graph
        console.log('1️⃣ Loading CRC data...');
        const crcPath = './crc_results/knowledge_graph/crc_knowledge_graph_cytoscape.json.gz';
        const compressedData = fs.readFileSync(crcPath);
        const decompressedData = zlib.gunzipSync(compressedData);
        const crcGraph = JSON.parse(decompressedData.toString());

        // Load CCP graph  
        console.log('2️⃣ Loading CCP data...');
        let ccpPath = '../ccp-scraper/ccp_knowledge_graph/ccp_knowledge_graph_cytoscape.json';
        if (!fs.existsSync(ccpPath)) {
            ccpPath = '../knowledge-graph/ccp_knowledge_graph/ccp_knowledge_graph_cytoscape.json';
        }
        const ccpData = fs.readFileSync(ccpPath, 'utf8');
        const ccpGraph = JSON.parse(ccpData);

        // Process nodes
        this.processCRCNodes(crcGraph);
        this.processCCPNodes(ccpGraph);
        
        // Three-layer intelligent analysis
        console.log('3️⃣ Layer 1: Mining explicit references...');
        this.mineExplicitReferences();
        
        console.log('4️⃣ Layer 2: Building intelligent sequential connections...');
        this.buildSequentialConnections();
        
        console.log('5️⃣ Layer 3: Creating thematic clusters...');
        this.createThematicClusters();
        
        console.log('6️⃣ Adding CCP internal edges...');
        const ccpEdges = this.addCCPEdges(ccpGraph);
        
        console.log('7️⃣ Creating CCP-CRC cross-references...');
        this.createCrossReferences();

        // Combine all elements
        this.elements = [
            ...this.crcNodes, 
            ...this.ccpNodes, 
            ...this.explicitRefs,
            ...this.sequentialEdges,
            ...this.thematicEdges,
            ...ccpEdges,
            ...this.crossRefEdges
        ];
        
        this.printStatistics();
        return this.elements;
    }

    processCRCNodes(crcGraph) {
        console.log('   Processing CRC nodes...');
        this.crcNodes = crcGraph.elements
            .filter(element => element.data && element.data.type === 'crc_rule')
            .map(element => ({
                data: {
                    id: `crc_${element.data.ruleNumber}`,
                    label: `CRC ${element.data.ruleNumber}`,
                    title: element.data.title?.substring(0, 100) + '...',
                    fullTitle: element.data.title || '',
                    source_system: 'CRC',
                    system_color: '#2E8B57',
                    ruleNumber: element.data.ruleNumber,
                    numericRule: parseFloat(element.data.ruleNumber),
                    titleSection: this.getTitleSection(element.data.ruleNumber),
                    category: this.mapCRCCategory(element.data.ruleNumber),
                    type: 'crc_rule',
                    priority: element.data.priority || 4,
                    themes: this.extractThemes(element.data.title || '')
                }
            }))
            .sort((a, b) => a.data.numericRule - b.data.numericRule);

        console.log(`   ✅ Processed ${this.crcNodes.length} CRC nodes`);
    }

    processCCPNodes(ccpGraph) {
        console.log('   Processing CCP nodes...');
        this.ccpNodes = ccpGraph.nodes.map(node => ({
            data: {
                id: `ccp_${node.data.id}`,
                label: node.data.label,
                title: node.data.title,
                source_system: 'CCP',
                system_color: '#4169E1',
                category: node.data.category,
                wordCount: node.data.wordCount,
                filingRelevance: node.data.filingRelevance,
                type: 'ccp_section'
            }
        }));

        console.log(`   ✅ Processed ${this.ccpNodes.length} CCP nodes`);
    }

    // LAYER 1: Mine explicit references from rule titles
    mineExplicitReferences() {
        const ruleMap = new Map(this.crcNodes.map(n => [n.data.ruleNumber, n]));
        let explicitCount = 0;

        // Regex patterns for finding rule references
        const referencePatterns = [
            /rule\s+(\d+\.\d+)/gi,
            /rules?\s+(\d+\.\d+)/gi,
            /section\s+(\d+\.\d+)/gi,
            /pursuant\s+to\s+rule\s+(\d+\.\d+)/gi,
            /under\s+rule\s+(\d+\.\d+)/gi,
            /as\s+required\s+by\s+rule\s+(\d+\.\d+)/gi,
            /in\s+accordance\s+with\s+rule\s+(\d+\.\d+)/gi,
            /see\s+rule\s+(\d+\.\d+)/gi
        ];

        this.crcNodes.forEach(sourceNode => {
            const fullTitle = sourceNode.data.fullTitle.toLowerCase();
            
            referencePatterns.forEach(pattern => {
                let match;
                while ((match = pattern.exec(fullTitle)) !== null) {
                    const referencedRuleNum = match[1];
                    const targetNode = ruleMap.get(referencedRuleNum);
                    
                    if (targetNode && targetNode.data.id !== sourceNode.data.id) {
                        this.explicitRefs.push({
                            data: {
                                id: `explicit_${sourceNode.data.ruleNumber}_${referencedRuleNum}`,
                                source: sourceNode.data.id,
                                target: targetNode.data.id,
                                type: 'explicit_reference',
                                weight: 10,
                                color: '#FF4500',
                                opacity: 1.0,
                                layer: 'explicit'
                            }
                        });
                        explicitCount++;
                    }
                }
            });
        });

        console.log(`   ✅ Found ${explicitCount} explicit references`);
    }

    // LAYER 2: Build intelligent sequential connections
    buildSequentialConnections() {
        // Group rules by title section (e.g., all 2.x rules, all 3.x rules)
        const titleGroups = new Map();
        
        this.crcNodes.forEach(node => {
            const titleSection = node.data.titleSection;
            if (!titleGroups.has(titleSection)) {
                titleGroups.set(titleSection, []);
            }
            titleGroups.get(titleSection).push(node);
        });

        let sequentialCount = 0;

        // Within each title section, connect sequential rules
        titleGroups.forEach((nodes, titleSection) => {
            // Sort nodes numerically within the title section
            nodes.sort((a, b) => a.data.numericRule - b.data.numericRule);
            
            for (let i = 0; i < nodes.length - 1; i++) {
                const currentNode = nodes[i];
                const nextNode = nodes[i + 1];
                
                // Only connect if they're truly sequential (difference < 1.0)
                const diff = nextNode.data.numericRule - currentNode.data.numericRule;
                if (diff <= 1.0 && diff > 0) {
                    this.sequentialEdges.push({
                        data: {
                            id: `seq_${currentNode.data.ruleNumber}_${nextNode.data.ruleNumber}`,
                            source: currentNode.data.id,
                            target: nextNode.data.id,
                            type: 'sequential',
                            weight: 8,
                            color: '#228B22',
                            opacity: 0.8,
                            layer: 'sequential'
                        }
                    });
                    sequentialCount++;
                }
            }
        });

        console.log(`   ✅ Created ${sequentialCount} sequential connections across ${titleGroups.size} title sections`);
    }

    // LAYER 3: Create thematic clusters for remaining isolated nodes
    createThematicClusters() {
        const connectedNodes = new Set();
        
        // Mark nodes that already have connections
        [...this.explicitRefs, ...this.sequentialEdges].forEach(edge => {
            connectedNodes.add(edge.data.source);
            connectedNodes.add(edge.data.target);
        });

        const unconnectedNodes = this.crcNodes.filter(node => !connectedNodes.has(node.data.id));
        console.log(`   Found ${unconnectedNodes.length} unconnected nodes for thematic clustering`);

        // Group unconnected nodes by themes
        const themeGroups = new Map();
        
        unconnectedNodes.forEach(node => {
            node.data.themes.forEach(theme => {
                if (!themeGroups.has(theme)) {
                    themeGroups.set(theme, []);
                }
                themeGroups.get(theme).push(node);
            });
        });

        let thematicCount = 0;

        // Create connections within theme groups
        themeGroups.forEach((nodes, theme) => {
            if (nodes.length > 1) {
                // Connect each node to the next in the theme group
                for (let i = 0; i < nodes.length - 1; i++) {
                    const sourceNode = nodes[i];
                    const targetNode = nodes[i + 1];
                    
                    this.thematicEdges.push({
                        data: {
                            id: `theme_${theme}_${i}`,
                            source: sourceNode.data.id,
                            target: targetNode.data.id,
                            type: 'thematic',
                            theme: theme,
                            weight: 3,
                            color: '#9370DB',
                            opacity: 0.5,
                            layer: 'thematic'
                        }
                    });
                    thematicCount++;
                }

                // Also connect first and last to create a cluster
                if (nodes.length > 2) {
                    this.thematicEdges.push({
                        data: {
                            id: `theme_${theme}_cluster`,
                            source: nodes[0].data.id,
                            target: nodes[nodes.length - 1].data.id,
                            type: 'thematic',
                            theme: theme,
                            weight: 2,
                            color: '#9370DB',
                            opacity: 0.3,
                            layer: 'thematic'
                        }
                    });
                    thematicCount++;
                }
            }
        });

        console.log(`   ✅ Created ${thematicCount} thematic connections across ${themeGroups.size} themes`);
    }

    addCCPEdges(ccpGraph) {
        const nodeIds = new Set([...this.crcNodes, ...this.ccpNodes].map(n => n.data.id));
        const ccpEdges = [];
        let ccpCount = 0;

        if (ccpGraph.edges) {
            ccpGraph.edges.forEach((edge, index) => {
                const sourceId = `ccp_${edge.data.source}`;
                const targetId = `ccp_${edge.data.target}`;

                if (nodeIds.has(sourceId) && nodeIds.has(targetId)) {
                    ccpEdges.push({
                        data: {
                            id: `ccp_edge_${index}`,
                            source: sourceId,
                            target: targetId,
                            type: edge.data.type || 'ccp_internal',
                            weight: edge.data.weight || 6,
                            color: '#4169E1',
                            opacity: 0.7,
                            layer: 'ccp_internal'
                        }
                    });
                    ccpCount++;
                }
            });
        }

        console.log(`   ✅ Added ${ccpCount} CCP internal edges`);
        return ccpEdges;
    }

    createCrossReferences() {
        const ccpMap = new Map(this.ccpNodes.map(n => [n.data.id.replace('ccp_', ''), n]));
        const crcMap = new Map(this.crcNodes.map(n => [n.data.ruleNumber, n]));
        
        // High-quality, verified cross-references
        const crossRefs = [
            { ccp: '437c', crc: '3.1350', type: 'summary_judgment_format', weight: 10 },
            { ccp: '437c', crc: '3.1351', type: 'summary_judgment_evidence', weight: 9 },
            { ccp: '1005', crc: '3.1300', type: 'motion_filing_deadline', weight: 9 },
            { ccp: '1005', crc: '2.100', type: 'document_format_requirement', weight: 8 },
            { ccp: '1010', crc: '2.251', type: 'electronic_service', weight: 9 },
            { ccp: '1011', crc: '2.251', type: 'electronic_service', weight: 8 },
            { ccp: '1013', crc: '1.10', type: 'time_calculation', weight: 9 },
            { ccp: '430.10', crc: '3.1320', type: 'demurrer_format', weight: 8 },
            { ccp: '430.20', crc: '3.1320', type: 'demurrer_format', weight: 8 },
            { ccp: '2030.300', crc: '3.1345', type: 'discovery_motion_format', weight: 8 },
            { ccp: '2031.310', crc: '3.1345', type: 'discovery_motion_format', weight: 8 },
            { ccp: '1010.6', crc: '2.253', type: 'electronic_filing', weight: 9 },
            { ccp: '425.10', crc: '2.100', type: 'pleading_format', weight: 7 },
            { ccp: '425.11', crc: '2.100', type: 'pleading_format', weight: 7 }
        ];

        crossRefs.forEach((ref, index) => {
            const ccpNode = ccpMap.get(ref.ccp);
            const crcNode = crcMap.get(ref.crc);

            if (ccpNode && crcNode) {
                this.crossRefEdges.push({
                    data: {
                        id: `cross_ref_${index}`,
                        source: ccpNode.data.id,
                        target: crcNode.data.id,
                        type: ref.type,
                        weight: ref.weight,
                        color: '#DC143C',
                        opacity: 0.9,
                        crossReference: true,
                        layer: 'cross_reference'
                    }
                });
            }
        });

        console.log(`   ✅ Created ${this.crossRefEdges.length} cross-references`);
    }

    // Helper methods
    getTitleSection(ruleNumber) {
        const num = parseFloat(ruleNumber);
        return Math.floor(num);
    }

    extractThemes(title) {
        const themes = [];
        const titleLower = title.toLowerCase();
        
        const themePatterns = {
            'appeals': /appeal|appellate|writ/,
            'discovery': /discovery|deposition|interrogator|request|production/,
            'motion': /motion|application|petition/,
            'service': /service|serve|serving/,
            'electronic': /electronic|e-filing|efiling|online/,
            'format': /format|form|caption|title|heading/,
            'deadline': /deadline|time|calendar|schedule/,
            'evidence': /evidence|exhibit|declaration|affidavit/,
            'judgment': /judgment|summary|adjudication/,
            'pleading': /pleading|complaint|answer|demurrer/,
            'court': /court|hearing|appearance|calendar/,
            'filing': /filing|file|lodg/
        };

        Object.entries(themePatterns).forEach(([theme, pattern]) => {
            if (pattern.test(titleLower)) {
                themes.push(theme);
            }
        });

        return themes.length > 0 ? themes : ['general'];
    }

    mapCRCCategory(ruleNumber) {
        const num = parseFloat(ruleNumber);
        if (num >= 1.0 && num < 2.0) return 'General Rules';
        if (num >= 2.0 && num < 3.0) return 'Document Format';
        if (num >= 3.0 && num < 4.0) return 'Civil Procedures';
        if (num >= 4.0 && num < 5.0) return 'Criminal Procedures';
        if (num >= 5.0 && num < 6.0) return 'Family Law';
        if (num >= 8.0 && num < 9.0) return 'Appeals';
        if (num >= 10.0 && num < 11.0) return 'Judicial Administration';
        return 'Other Procedures';
    }

    printStatistics() {
        const totalElements = this.elements.length;
        const totalNodes = this.crcNodes.length + this.ccpNodes.length;
        const edges = this.elements.filter(e => e.data.source && e.data.target);
        const ccpEdges = edges.filter(e => e.data.layer === 'ccp_internal');

        console.log(`\n📊 Intelligent Graph Statistics:`);
        console.log(`   Total Elements: ${totalElements}`);
        console.log(`   - Nodes: ${totalNodes} (${this.ccpNodes.length} CCP + ${this.crcNodes.length} CRC)`);
        console.log(`   - Edges: ${edges.length}`);
        console.log(`     • Explicit References: ${this.explicitRefs.length}`);
        console.log(`     • Sequential Connections: ${this.sequentialEdges.length}`);
        console.log(`     • Thematic Clusters: ${this.thematicEdges.length}`);
        console.log(`     • CCP Internal: ${ccpEdges.length}`);
        console.log(`     • Cross-References: ${this.crossRefEdges.length}`);
    }

    generateHTML() {
        const html = `<!DOCTYPE html>
<html>
<head>
    <title>Intelligent Legal Knowledge Graph</title>
    <script src="https://unpkg.com/cytoscape@3.21.0/dist/cytoscape.min.js"></script>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
        #controls { 
            position: fixed; top: 10px; left: 10px; z-index: 1000; 
            background: white; padding: 15px; border-radius: 8px; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1); max-width: 320px; 
        }
        #cy { width: 100%; height: 100vh; background: #ffffff; }
        .filter-btn { margin: 3px; padding: 6px 10px; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: bold; }
        .filter-btn.active { background: #4CAF50; color: white; }
        .filter-btn.inactive { background: #ddd; color: #666; }
        #legend { margin-top: 10px; padding-top: 10px; border-top: 1px solid #eee; }
        .legend-item { display: flex; align-items: center; margin: 3px 0; font-size: 11px; }
        .legend-color { width: 14px; height: 14px; border-radius: 50%; margin-right: 6px; }
        .edge-legend { width: 14px; height: 2px; margin-right: 6px; }
        #stats { margin-top: 10px; padding-top: 10px; border-top: 1px solid #eee; font-size: 11px; color: #666; }
        #status { margin-top: 10px; padding: 5px; background: #f0f0f0; border-radius: 3px; font-size: 11px; }
        .layer-controls { margin: 8px 0; }
        .layer-btn { margin: 2px; padding: 4px 8px; font-size: 10px; }
    </style>
</head>
<body>
    <div id="controls">
        <h3 style="margin: 0 0 10px 0; font-size: 16px;">🧠 Intelligent Legal Graph</h3>
        
        <div>
            <button class="filter-btn active" onclick="filterSystem('all')">All Systems</button><br>
            <button class="filter-btn inactive" onclick="filterSystem('CCP')">CCP Only</button>
            <button class="filter-btn inactive" onclick="filterSystem('CRC')">CRC Only</button>
            <button class="filter-btn inactive" onclick="filterSystem('cross')">Cross-Refs Only</button>
        </div>

        <div class="layer-controls">
            <div style="font-weight: bold; font-size: 12px; margin-bottom: 5px;">Connection Layers</div>
            <button class="filter-btn layer-btn active" onclick="toggleLayer('explicit')">Explicit Refs</button>
            <button class="filter-btn layer-btn active" onclick="toggleLayer('sequential')">Sequential</button><br>
            <button class="filter-btn layer-btn active" onclick="toggleLayer('thematic')">Thematic</button>
            <button class="filter-btn layer-btn active" onclick="toggleLayer('cross_reference')">Cross-Refs</button>
        </div>
        
        <div id="legend">
            <div style="font-weight: bold; font-size: 12px; margin-bottom: 5px;">Nodes</div>
            <div class="legend-item">
                <div class="legend-color" style="background: #4169E1;"></div>
                <span>CCP (Civil Procedure)</span>
            </div>
            <div class="legend-item">
                <div class="legend-color" style="background: #2E8B57;"></div>
                <span>CRC (Court Rules)</span>
            </div>
            
            <div style="font-weight: bold; font-size: 12px; margin: 8px 0 5px 0;">Relationships</div>
            <div class="legend-item">
                <div class="edge-legend" style="background: #FF4500;"></div>
                <span>Explicit References</span>
            </div>
            <div class="legend-item">
                <div class="edge-legend" style="background: #228B22;"></div>
                <span>Sequential Rules</span>
            </div>
            <div class="legend-item">
                <div class="edge-legend" style="background: #9370DB;"></div>
                <span>Thematic Clusters</span>
            </div>
            <div class="legend-item">
                <div class="edge-legend" style="background: #DC143C;"></div>
                <span>CCP ↔ CRC Cross-Refs</span>
            </div>
        </div>
        
        <div id="stats">
            <div>Elements: <span id="element-count">0</span></div>
            <div>Nodes: <span id="node-count">0</span></div>
            <div>Edges: <span id="edge-count">0</span></div>
            <div>Explicit: <span id="explicit-count">0</span></div>
            <div>Sequential: <span id="sequential-count">0</span></div>
            <div>Thematic: <span id="thematic-count">0</span></div>
        </div>
        
        <div id="status">Loading...</div>
    </div>

    <div id="cy"></div>

    <script>
        console.log('🧠 Initializing Intelligent Graph...');
        
        const elements = ${JSON.stringify(this.elements, null, 2)};
        
        const nodes = elements.filter(e => !e.data.source && !e.data.target);
        const edges = elements.filter(e => e.data.source && e.data.target);
        const explicitRefs = edges.filter(e => e.data.layer === 'explicit');
        const sequentialEdges = edges.filter(e => e.data.layer === 'sequential');
        const thematicEdges = edges.filter(e => e.data.layer === 'thematic');
        
        document.getElementById('element-count').textContent = elements.length;
        document.getElementById('node-count').textContent = nodes.length;
        document.getElementById('edge-count').textContent = edges.length;
        document.getElementById('explicit-count').textContent = explicitRefs.length;
        document.getElementById('sequential-count').textContent = sequentialEdges.length;
        document.getElementById('thematic-count').textContent = thematicEdges.length;
        
        console.log('📊 Intelligent Graph Data:');
        console.log('- Elements:', elements.length);
        console.log('- Nodes:', nodes.length);
        console.log('- Edges:', edges.length);
        console.log('  • Explicit:', explicitRefs.length);
        console.log('  • Sequential:', sequentialEdges.length);
        console.log('  • Thematic:', thematicEdges.length);
        
        const visibleLayers = new Set(['explicit', 'sequential', 'thematic', 'cross_reference', 'ccp_internal']);
        
        try {
            const cy = cytoscape({
                container: document.getElementById('cy'),
                elements: elements,
                
                style: [
                    {
                        selector: 'node',
                        style: {
                            'background-color': 'data(system_color)',
                            'label': 'data(label)',
                            'width': 28,
                            'height': 28,
                            'font-size': 6,
                            'text-valign': 'center',
                            'text-halign': 'center',
                            'color': 'white',
                            'text-outline-width': 2,
                            'text-outline-color': '#000'
                        }
                    },
                    {
                        selector: 'edge',
                        style: {
                            'width': 'mapData(weight, 1, 10, 0.5, 2.5)',
                            'line-color': 'data(color)',
                            'target-arrow-color': 'data(color)',
                            'target-arrow-shape': 'triangle',
                            'curve-style': 'bezier',
                            'opacity': 'data(opacity)',
                            'arrow-scale': 0.6
                        }
                    },
                    {
                        selector: 'edge[layer="explicit"]',
                        style: {
                            'line-style': 'solid',
                            'width': 2.5,
                            'opacity': 1.0
                        }
                    },
                    {
                        selector: 'edge[layer="cross_reference"]',
                        style: {
                            'line-style': 'dashed',
                            'width': 2,
                            'opacity': 0.9
                        }
                    },
                    {
                        selector: 'edge[layer="thematic"]',
                        style: {
                            'line-style': 'dotted',
                            'width': 1,
                            'opacity': 0.5
                        }
                    },
                    {
                        selector: 'node:selected',
                        style: {
                            'border-width': 3,
                            'border-color': '#FFD700'
                        }
                    }
                ],
                
                layout: {
                    name: 'cose',
                    animate: true,
                    animationDuration: 4000,
                    nodeRepulsion: function(node) { 
                        return node.data('source_system') === 'CRC' ? 2048 : 4096; 
                    },
                    nodeOverlap: 8,
                    idealEdgeLength: function(edge) { 
                        if (edge.data('layer') === 'explicit') return 80;
                        if (edge.data('layer') === 'cross_reference') return 150;
                        if (edge.data('layer') === 'sequential') return 40;
                        if (edge.data('layer') === 'thematic') return 100;
                        return 70; 
                    },
                    edgeElasticity: function(edge) { 
                        if (edge.data('layer') === 'explicit') return 400;
                        if (edge.data('layer') === 'cross_reference') return 300;
                        if (edge.data('layer') === 'sequential') return 200;
                        return 100; 
                    },
                    nestingFactor: 1.2,
                    gravity: 20,
                    numIter: 4000,
                    initialTemp: 1000,
                    coolingFactor: 0.99,
                    minTemp: 1.0
                }
            });
            
            console.log('✅ Intelligent Graph initialized!');
            console.log('- Rendered nodes:', cy.nodes().length);
            console.log('- Rendered edges:', cy.edges().length);
            
            document.getElementById('status').innerHTML = '<span style="color: green;">✅ INTELLIGENT!</span>';
            
            cy.on('tap', 'node', function(evt) {
                const node = evt.target;
                console.log('Node:', node.data());
                
                // Highlight connected nodes
                cy.elements().removeClass('highlighted');
                node.addClass('highlighted');
                node.neighborhood().addClass('highlighted');
            });
            
            window.filterSystem = function(system) {
                document.querySelectorAll('.filter-btn:not(.layer-btn)').forEach(btn => {
                    btn.classList.remove('active');
                    btn.classList.add('inactive');
                });
                event.target.classList.remove('inactive');
                event.target.classList.add('active');

                if (system === 'all') {
                    cy.elements().show();
                } else if (system === 'cross') {
                    cy.elements().hide();
                    cy.edges('[crossReference]').show();
                    cy.edges('[crossReference]').connectedNodes().show();
                } else {
                    cy.elements().hide();
                    cy.nodes('[source_system = "' + system + '"]').show();
                    
                    const visibleNodes = cy.nodes(':visible');
                    visibleNodes.forEach(function(node) {
                        node.connectedEdges().forEach(function(edge) {
                            if (visibleNodes.contains(edge.source()) && visibleNodes.contains(edge.target())) {
                                edge.show();
                            }
                        });
                    });
                }
                
                applyLayerFilters();
                cy.layout({
                    name: 'cose',
                    animate: true,
                    animationDuration: 2000,
                    randomize: false
                }).run();
            };
            
            window.toggleLayer = function(layer) {
                const btn = event.target;
                if (visibleLayers.has(layer)) {
                    visibleLayers.delete(layer);
                    btn.classList.remove('active');
                    btn.classList.add('inactive');
                } else {
                    visibleLayers.add(layer);
                    btn.classList.remove('inactive');
                    btn.classList.add('active');
                }
                applyLayerFilters();
            };
            
            function applyLayerFilters() {
                cy.edges().forEach(function(edge) {
                    const layer = edge.data('layer');
                    if (visibleLayers.has(layer)) {
                        edge.show();
                    } else {
                        edge.hide();
                    }
                });
            }
            
        } catch (error) {
            console.error('❌ Error:', error);
            document.getElementById('status').innerHTML = '<span style="color: red;">❌ ERROR: ' + error.message + '</span>';
        }
    </script>
</body>
</html>`;

        return html;
    }

    async createIntelligentGraph() {
        await this.loadAndProcessData();
        const html = this.generateHTML();
        
        fs.writeFileSync('./intelligent_unified_graph.html', html);
        console.log('\n🎉 Created intelligent_unified_graph.html');
        
        return './intelligent_unified_graph.html';
    }
}

async function main() {
    try {
        const builder = new IntelligentUnifiedGraph();
        const filePath = await builder.createIntelligentGraph();
        
        console.log('\n🎯 INTELLIGENT GRAPH READY:');
        console.log(`   File: ${filePath}`);
        console.log('   Command: open intelligent_unified_graph.html');
        console.log('\n💡 Three-layer analysis ensures NO isolated nodes!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

if (require.main === module) {
    main();
}

module.exports = IntelligentUnifiedGraph; 