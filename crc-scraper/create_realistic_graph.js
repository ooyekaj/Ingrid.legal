const fs = require('fs');
const zlib = require('zlib');

class RealisticUnifiedGraph {
    constructor() {
        this.elements = [];
    }

    async loadAndProcessData() {
        console.log('🚀 Creating Realistic Connected Graph...\n');

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

        // Process CRC nodes
        console.log('3️⃣ Processing CRC nodes...');
        const crcNodes = crcGraph.elements
            .filter(element => element.data && element.data.type === 'crc_rule')
            .map(element => ({
                data: {
                    id: `crc_${element.data.ruleNumber}`,
                    label: `CRC ${element.data.ruleNumber}`,
                    title: element.data.title?.substring(0, 150) + '...',
                    source_system: 'CRC',
                    system_color: '#2E8B57',
                    ruleNumber: element.data.ruleNumber,
                    category: this.mapCRCCategory(element.data.ruleNumber),
                    type: 'crc_rule',
                    priority: element.data.priority || 4,
                    fullTitle: element.data.title
                }
            }));

        // Process CCP nodes
        console.log('4️⃣ Processing CCP nodes...');
        const ccpNodes = ccpGraph.nodes.map(node => ({
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

        console.log(`✅ Processed ${crcNodes.length} CRC nodes, ${ccpNodes.length} CCP nodes`);

        // Process existing CCP edges
        console.log('5️⃣ Processing CCP edges...');
        const nodeIds = new Set([...crcNodes, ...ccpNodes].map(n => n.data.id));
        const ccpEdges = [];

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
                            type: edge.data.type || 'relationship',
                            weight: edge.data.weight || 3,
                            color: '#4169E1',
                            opacity: 0.6
                        }
                    });
                }
            });
        }

        // Create realistic CRC relationships based on content analysis
        console.log('6️⃣ Analyzing CRC content for relationships...');
        const crcEdges = this.analyzeRealCRCRelationships(crcNodes);

        // Create extensive CCP-CRC cross-references
        console.log('7️⃣ Creating realistic CCP-CRC cross-references...');
        const crossRefEdges = this.createRealisticCrossReferences(ccpNodes, crcNodes);
        
        // Combine all elements
        this.elements = [...ccpNodes, ...crcNodes, ...ccpEdges, ...crcEdges, ...crossRefEdges];
        
        console.log(`\n📊 Realistic Graph Statistics:`);
        console.log(`   Total Elements: ${this.elements.length}`);
        console.log(`   - CCP Nodes: ${ccpNodes.length}`);
        console.log(`   - CRC Nodes: ${crcNodes.length}`);
        console.log(`   - CCP Edges: ${ccpEdges.length}`);
        console.log(`   - CRC Edges: ${crcEdges.length}`);
        console.log(`   - Cross-refs: ${crossRefEdges.length}`);

        return this.elements;
    }

    analyzeRealCRCRelationships(crcNodes) {
        const edges = [];
        const ruleMap = new Map(crcNodes.map(n => [n.data.ruleNumber, n]));
        
        // Create relationships based on rule number proximity and content analysis
        crcNodes.forEach(node => {
            const ruleNum = parseFloat(node.data.ruleNumber);
            const baseRule = Math.floor(ruleNum);
            const title = node.data.fullTitle?.toLowerCase() || '';
            
            // Sequential rule relationships (e.g., 2.100 -> 2.101)
            const nextRule = ruleNum + 0.1;
            const nextRuleStr = nextRule.toFixed(1);
            const nextNode = ruleMap.get(nextRuleStr);
            
            if (nextNode && Math.abs(nextRule - ruleNum) < 0.15) {
                edges.push({
                    data: {
                        id: `crc_seq_${node.data.ruleNumber}_${nextRuleStr}`,
                        source: node.data.id,
                        target: nextNode.data.id,
                        type: 'sequential',
                        weight: 7,
                        color: '#228B22',
                        opacity: 0.8
                    }
                });
            }
            
            // Content-based relationships
            if (title.includes('motion') || title.includes('Motion')) {
                // Connect motion-related rules
                crcNodes.forEach(otherNode => {
                    if (otherNode.data.id !== node.data.id && 
                        (otherNode.data.fullTitle?.toLowerCase().includes('motion') ||
                         otherNode.data.fullTitle?.toLowerCase().includes('Motion'))) {
                        
                        const otherRuleNum = parseFloat(otherNode.data.ruleNumber);
                        if (Math.abs(otherRuleNum - ruleNum) < 1.0 && Math.abs(otherRuleNum - ruleNum) > 0.1) {
                            edges.push({
                                data: {
                                    id: `crc_motion_${node.data.ruleNumber}_${otherNode.data.ruleNumber}`,
                                    source: node.data.id,
                                    target: otherNode.data.id,
                                    type: 'motion_related',
                                    weight: 5,
                                    color: '#32CD32',
                                    opacity: 0.6
                                }
                            });
                        }
                    }
                });
            }
            
            // Electronic filing chain
            if (title.includes('electronic') || title.includes('Electronic')) {
                crcNodes.forEach(otherNode => {
                    if (otherNode.data.id !== node.data.id && 
                        (otherNode.data.fullTitle?.toLowerCase().includes('electronic') ||
                         otherNode.data.fullTitle?.toLowerCase().includes('Electronic'))) {
                        
                        const otherRuleNum = parseFloat(otherNode.data.ruleNumber);
                        if (Math.abs(otherRuleNum - ruleNum) < 0.5) {
                            edges.push({
                                data: {
                                    id: `crc_electronic_${node.data.ruleNumber}_${otherNode.data.ruleNumber}`,
                                    source: node.data.id,
                                    target: otherNode.data.id,
                                    type: 'electronic_filing',
                                    weight: 6,
                                    color: '#00CED1',
                                    opacity: 0.7
                                }
                            });
                        }
                    }
                });
            }
        });

        // Remove duplicate edges
        const uniqueEdges = edges.filter((edge, index, self) => 
            index === self.findIndex(e => e.data.source === edge.data.source && e.data.target === edge.data.target)
        );

        console.log(`✅ Created ${uniqueEdges.length} realistic CRC relationships`);
        return uniqueEdges;
    }

    createRealisticCrossReferences(ccpNodes, crcNodes) {
        const edges = [];
        const ccpMap = new Map(ccpNodes.map(n => [n.data.id.replace('ccp_', ''), n]));
        const crcMap = new Map(crcNodes.map(n => [n.data.ruleNumber, n]));
        
        // Extensive realistic cross-references
        const crossRefs = [
            // Summary judgment
            { ccp: '437c', crc: '3.1350', type: 'format_requirement', weight: 10 },
            { ccp: '437c', crc: '3.1351', type: 'format_requirement', weight: 9 },
            
            // Motion practice
            { ccp: '1005', crc: '3.1300', type: 'filing_deadline', weight: 9 },
            { ccp: '1005', crc: '2.100', type: 'document_format', weight: 8 },
            
            // Service requirements
            { ccp: '1010', crc: '2.251', type: 'electronic_service', weight: 8 },
            { ccp: '1011', crc: '2.251', type: 'electronic_service', weight: 8 },
            { ccp: '1013', crc: '1.10', type: 'time_calculation', weight: 9 },
            
            // Demurrer procedures
            { ccp: '430.10', crc: '3.1320', type: 'motion_format', weight: 8 },
            { ccp: '430.20', crc: '3.1320', type: 'motion_format', weight: 8 },
            { ccp: '430.30', crc: '3.1300', type: 'filing_deadline', weight: 7 },
            
            // Discovery
            { ccp: '2030.300', crc: '3.1345', type: 'discovery_format', weight: 8 },
            { ccp: '2031.310', crc: '3.1345', type: 'discovery_format', weight: 8 },
            
            // Electronic filing
            { ccp: '1010.6', crc: '2.253', type: 'electronic_filing', weight: 9 },
            { ccp: '1010.6', crc: '2.254', type: 'electronic_filing', weight: 8 },
            
            // Document requirements
            { ccp: '425.10', crc: '2.100', type: 'document_format', weight: 7 },
            { ccp: '425.11', crc: '2.100', type: 'document_format', weight: 7 }
        ];

        crossRefs.forEach((ref, index) => {
            const ccpNode = ccpMap.get(ref.ccp);
            const crcNode = crcMap.get(ref.crc);

            if (ccpNode && crcNode) {
                edges.push({
                    data: {
                        id: `cross_ref_${index}`,
                        source: ccpNode.data.id,
                        target: crcNode.data.id,
                        type: ref.type,
                        weight: ref.weight,
                        color: '#DC143C',
                        opacity: 0.9,
                        crossReference: true
                    }
                });
            }
        });

        console.log(`✅ Created ${edges.length} realistic cross-references`);
        return edges;
    }

    mapCRCCategory(ruleNumber) {
        const num = parseFloat(ruleNumber);
        if (num >= 2.100 && num < 2.300) return 'Document Format';
        if (num >= 3.1300 && num < 3.1400) return 'Motion Practice';
        if (num >= 3.1350 && num < 3.1360) return 'Summary Judgment';
        if (num >= 8.0 && num < 9.0) return 'Appeals';
        if (num >= 1.0 && num < 2.0) return 'General Rules';
        return 'Court Procedures';
    }

    generateHTML() {
        const html = `<!DOCTYPE html>
<html>
<head>
    <title>Realistic Legal Knowledge Graph</title>
    <script src="https://unpkg.com/cytoscape@3.21.0/dist/cytoscape.min.js"></script>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
        #controls { 
            position: fixed; top: 10px; left: 10px; z-index: 1000; 
            background: white; padding: 15px; border-radius: 8px; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1); max-width: 300px; 
        }
        #cy { width: 100%; height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
        .filter-btn { margin: 3px; padding: 6px 10px; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: bold; }
        .filter-btn.active { background: #4CAF50; color: white; }
        .filter-btn.inactive { background: #ddd; color: #666; }
        #legend { margin-top: 10px; padding-top: 10px; border-top: 1px solid #eee; }
        .legend-item { display: flex; align-items: center; margin: 3px 0; font-size: 12px; }
        .legend-color { width: 16px; height: 16px; border-radius: 50%; margin-right: 8px; }
        #stats { margin-top: 10px; padding-top: 10px; border-top: 1px solid #eee; font-size: 11px; color: #666; }
        #status { margin-top: 10px; padding: 5px; background: #f0f0f0; border-radius: 3px; font-size: 11px; }
        .edge-legend { width: 16px; height: 2px; margin-right: 8px; }
    </style>
</head>
<body>
    <div id="controls">
        <h3 style="margin: 0 0 10px 0; font-size: 16px;">🏛️ Realistic Legal Graph</h3>
        <div>
            <button class="filter-btn active" onclick="filterSystem('all')">All Systems</button><br>
            <button class="filter-btn inactive" onclick="filterSystem('CCP')">CCP Only</button>
            <button class="filter-btn inactive" onclick="filterSystem('CRC')">CRC Only</button>
            <button class="filter-btn inactive" onclick="filterSystem('cross')">Cross-Refs Only</button>
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
                <div class="edge-legend" style="background: #4169E1;"></div>
                <span>CCP Internal</span>
            </div>
            <div class="legend-item">
                <div class="edge-legend" style="background: #228B22;"></div>
                <span>CRC Sequential</span>
            </div>
            <div class="legend-item">
                <div class="edge-legend" style="background: #32CD32;"></div>
                <span>CRC Thematic</span>
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
            <div>Cross-refs: <span id="cross-count">0</span></div>
        </div>
        
        <div id="status">Loading...</div>
    </div>

    <div id="cy"></div>

    <script>
        console.log('🚀 Initializing Realistic Graph...');
        
        const elements = ${JSON.stringify(this.elements, null, 2)};
        
        const nodes = elements.filter(e => !e.data.source && !e.data.target);
        const edges = elements.filter(e => e.data.source && e.data.target);
        const crossRefs = edges.filter(e => e.data.crossReference);
        
        document.getElementById('element-count').textContent = elements.length;
        document.getElementById('node-count').textContent = nodes.length;
        document.getElementById('edge-count').textContent = edges.length;
        document.getElementById('cross-count').textContent = crossRefs.length;
        
        console.log('📊 Realistic Graph Data:');
        console.log('- Elements:', elements.length);
        console.log('- Nodes:', nodes.length);
        console.log('- Edges:', edges.length);
        console.log('- Cross-references:', crossRefs.length);
        
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
                            'width': 30,
                            'height': 30,
                            'font-size': 6,
                            'text-valign': 'center',
                            'text-halign': 'center',
                            'color': 'white',
                            'text-outline-width': 1,
                            'text-outline-color': '#000'
                        }
                    },
                    {
                        selector: 'edge',
                        style: {
                            'width': 'mapData(weight, 1, 10, 1, 3)',
                            'line-color': 'data(color)',
                            'target-arrow-color': 'data(color)',
                            'target-arrow-shape': 'triangle',
                            'curve-style': 'bezier',
                            'opacity': 'data(opacity)',
                            'arrow-scale': 0.8
                        }
                    },
                    {
                        selector: 'edge[crossReference]',
                        style: {
                            'line-style': 'dashed',
                            'width': 2,
                            'opacity': 0.9
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
                    animationDuration: 3000,
                    nodeRepulsion: function(node) { 
                        return node.data('source_system') === 'CRC' ? 4096 : 8192; 
                    },
                    nodeOverlap: 5,
                    idealEdgeLength: function(edge) { 
                        if (edge.data('crossReference')) return 120;
                        if (edge.data('type') === 'sequential') return 30;
                        return 60; 
                    },
                    edgeElasticity: function(edge) { 
                        if (edge.data('crossReference')) return 300;
                        return 100; 
                    },
                    nestingFactor: 1.2,
                    gravity: 30,
                    numIter: 3000,
                    initialTemp: 1000,
                    coolingFactor: 0.99,
                    minTemp: 1.0
                }
            });
            
            console.log('✅ Realistic Graph initialized!');
            console.log('- Rendered nodes:', cy.nodes().length);
            console.log('- Rendered edges:', cy.edges().length);
            
            document.getElementById('status').innerHTML = '<span style="color: green;">✅ REALISTIC!</span>';
            
            cy.on('tap', 'node', function(evt) {
                const node = evt.target;
                console.log('Node:', node.data());
                
                // Highlight connected nodes
                cy.elements().removeClass('highlighted');
                node.addClass('highlighted');
                node.neighborhood().addClass('highlighted');
            });
            
            window.filterSystem = function(system) {
                document.querySelectorAll('.filter-btn').forEach(btn => {
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
                
                cy.layout({
                    name: 'cose',
                    animate: true,
                    animationDuration: 1500,
                    randomize: false
                }).run();
            };
            
        } catch (error) {
            console.error('❌ Error:', error);
            document.getElementById('status').innerHTML = '<span style="color: red;">❌ ERROR: ' + error.message + '</span>';
        }
    </script>
</body>
</html>`;

        return html;
    }

    async createRealisticGraph() {
        await this.loadAndProcessData();
        const html = this.generateHTML();
        
        fs.writeFileSync('./realistic_unified_graph.html', html);
        console.log('\n🎉 Created realistic_unified_graph.html');
        
        return './realistic_unified_graph.html';
    }
}

async function main() {
    try {
        const builder = new RealisticUnifiedGraph();
        const filePath = await builder.createRealisticGraph();
        
        console.log('\n🎯 REALISTIC GRAPH READY:');
        console.log(`   File: ${filePath}`);
        console.log('   Command: open realistic_unified_graph.html');
        console.log('\n💡 Now with REAL content-based relationships!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

if (require.main === module) {
    main();
}

module.exports = RealisticUnifiedGraph; 