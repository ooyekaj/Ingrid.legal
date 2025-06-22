const fs = require('fs');
const zlib = require('zlib');

class ConnectedUnifiedGraph {
    constructor() {
        this.elements = [];
        this.crcRelationships = [
            // Document formatting chain
            { source: '2.100', target: '2.101', type: 'prerequisite', weight: 8 },
            { source: '2.100', target: '2.102', type: 'prerequisite', weight: 8 },
            { source: '2.100', target: '2.110', type: 'prerequisite', weight: 6 },
            { source: '2.100', target: '2.111', type: 'prerequisite', weight: 6 },
            
            // Motion practice workflow
            { source: '3.1300', target: '3.1301', type: 'sequence', weight: 9 },
            { source: '3.1300', target: '3.1302', type: 'sequence', weight: 8 },
            { source: '3.1300', target: '3.1310', type: 'related', weight: 7 },
            { source: '3.1300', target: '3.1320', type: 'related', weight: 6 },
            
            // Summary judgment procedure
            { source: '3.1350', target: '3.1351', type: 'sequence', weight: 9 },
            { source: '3.1350', target: '3.1352', type: 'sequence', weight: 8 },
            { source: '3.1350', target: '3.1354', type: 'related', weight: 7 },
            
            // Discovery motions
            { source: '3.1345', target: '3.1346', type: 'sequence', weight: 8 },
            { source: '3.1345', target: '3.1347', type: 'related', weight: 7 },
            
            // Electronic filing chain
            { source: '2.250', target: '2.251', type: 'sequence', weight: 9 },
            { source: '2.251', target: '2.252', type: 'sequence', weight: 9 },
            { source: '2.252', target: '2.253', type: 'sequence', weight: 9 },
            { source: '2.253', target: '2.254', type: 'sequence', weight: 8 },
            { source: '2.254', target: '2.255', type: 'sequence', weight: 8 },
            { source: '2.255', target: '2.256', type: 'sequence', weight: 8 },
            { source: '2.256', target: '2.257', type: 'sequence', weight: 7 },
            { source: '2.257', target: '2.258', type: 'sequence', weight: 7 },
            { source: '2.258', target: '2.259', type: 'sequence', weight: 7 },
            
            // Appellate procedures
            { source: '8.200', target: '8.204', type: 'sequence', weight: 8 },
            { source: '8.204', target: '8.208', type: 'sequence', weight: 8 },
            { source: '8.208', target: '8.212', type: 'sequence', weight: 8 },
            { source: '8.212', target: '8.216', type: 'sequence', weight: 7 },
            
            // Time computation relationships
            { source: '1.10', target: '1.11', type: 'related', weight: 6 },
            { source: '1.10', target: '1.12', type: 'related', weight: 6 },
            
            // Case management
            { source: '3.720', target: '3.721', type: 'sequence', weight: 7 },
            { source: '3.720', target: '3.722', type: 'sequence', weight: 7 },
            { source: '3.720', target: '3.725', type: 'related', weight: 6 }
        ];
        
        this.ccpCrcCrossRefs = [
            // Summary judgment extensive cross-references
            { ccp: '437c', crc: '3.1350', type: 'format_requirement', weight: 10 },
            { ccp: '437c', crc: '3.1351', type: 'format_requirement', weight: 9 },
            { ccp: '437c', crc: '3.1352', type: 'format_requirement', weight: 8 },
            
            // Motion notice and timing
            { ccp: '1005', crc: '3.1300', type: 'filing_requirement', weight: 9 },
            { ccp: '1005', crc: '2.100', type: 'format_requirement', weight: 8 },
            { ccp: '1005', crc: '1.10', type: 'timing_requirement', weight: 8 },
            
            // Service requirements
            { ccp: '1010', crc: '2.251', type: 'electronic_service', weight: 8 },
            { ccp: '1011', crc: '2.251', type: 'electronic_service', weight: 8 },
            { ccp: '1013', crc: '1.10', type: 'timing_calculation', weight: 9 },
            
            // Demurrer procedures
            { ccp: '430.10', crc: '3.1320', type: 'format_requirement', weight: 8 },
            { ccp: '430.20', crc: '3.1320', type: 'format_requirement', weight: 8 },
            { ccp: '430.30', crc: '3.1300', type: 'filing_requirement', weight: 7 },
            { ccp: '430.40', crc: '3.1300', type: 'filing_requirement', weight: 7 },
            { ccp: '430.41', crc: '3.1300', type: 'filing_requirement', weight: 7 },
            
            // Motion to strike
            { ccp: '435', crc: '3.1322', type: 'format_requirement', weight: 7 },
            { ccp: '436', crc: '3.1322', type: 'format_requirement', weight: 7 },
            
            // Discovery motions
            { ccp: '2030.300', crc: '3.1345', type: 'format_requirement', weight: 8 },
            { ccp: '2031.310', crc: '3.1345', type: 'format_requirement', weight: 8 },
            { ccp: '2025.480', crc: '3.1345', type: 'format_requirement', weight: 7 },
            
            // Document production
            { ccp: '2031.010', crc: '2.100', type: 'format_requirement', weight: 6 },
            { ccp: '2031.310', crc: '2.100', type: 'format_requirement', weight: 6 },
            
            // Electronic filing
            { ccp: '1010.6', crc: '2.253', type: 'electronic_filing', weight: 9 },
            { ccp: '1010.6', crc: '2.254', type: 'electronic_filing', weight: 8 },
            { ccp: '1010.6', crc: '2.255', type: 'electronic_filing', weight: 8 },
            
            // Complaint requirements
            { ccp: '425.10', crc: '2.100', type: 'format_requirement', weight: 7 },
            { ccp: '425.11', crc: '2.100', type: 'format_requirement', weight: 7 },
            { ccp: '425.12', crc: '2.100', type: 'format_requirement', weight: 7 },
            { ccp: '425.13', crc: '2.100', type: 'format_requirement', weight: 7 },
            
            // Answer requirements
            { ccp: '431.30', crc: '2.100', type: 'format_requirement', weight: 6 },
            { ccp: '431.40', crc: '2.100', type: 'format_requirement', weight: 6 },
            
            // Judgment procedures
            { ccp: '664', crc: '3.1800', type: 'format_requirement', weight: 6 },
            { ccp: '664.5', crc: '3.1800', type: 'format_requirement', weight: 6 },
            
            // Mandamus procedures
            { ccp: '1094.5', crc: '8.485', type: 'appellate_procedure', weight: 7 },
            { ccp: '1094.6', crc: '8.485', type: 'appellate_procedure', weight: 7 }
        ];
    }

    async loadAndProcessData() {
        console.log('🚀 Creating Connected Unified Graph...\n');

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
                    title: element.data.title?.substring(0, 200) + '...',
                    source_system: 'CRC',
                    system_color: '#2E8B57',
                    ruleNumber: element.data.ruleNumber,
                    category: this.mapCRCCategory(element.data.ruleNumber),
                    type: 'crc_rule',
                    priority: element.data.priority || 4
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

        // Create CRC internal relationships
        console.log('6️⃣ Creating CRC relationships...');
        const crcEdges = this.createCRCRelationships(crcNodes);

        // Create CCP-CRC cross-references
        console.log('7️⃣ Creating CCP-CRC cross-references...');
        const crossRefEdges = this.createExtensiveCrossReferences(ccpNodes, crcNodes);
        
        // Combine all elements
        this.elements = [...ccpNodes, ...crcNodes, ...ccpEdges, ...crcEdges, ...crossRefEdges];
        
        console.log(`\n📊 Connected Graph Statistics:`);
        console.log(`   Total Elements: ${this.elements.length}`);
        console.log(`   - CCP Nodes: ${ccpNodes.length}`);
        console.log(`   - CRC Nodes: ${crcNodes.length}`);
        console.log(`   - CCP Edges: ${ccpEdges.length}`);
        console.log(`   - CRC Edges: ${crcEdges.length}`);
        console.log(`   - Cross-refs: ${crossRefEdges.length}`);

        return this.elements;
    }

    createCRCRelationships(crcNodes) {
        const crcNodeMap = new Map(crcNodes.map(n => [n.data.ruleNumber, n.data.id]));
        const edges = [];

        this.crcRelationships.forEach((rel, index) => {
            const sourceId = crcNodeMap.get(rel.source);
            const targetId = crcNodeMap.get(rel.target);

            if (sourceId && targetId) {
                edges.push({
                    data: {
                        id: `crc_rel_${index}`,
                        source: sourceId,
                        target: targetId,
                        type: rel.type,
                        weight: rel.weight,
                        color: '#228B22',
                        opacity: 0.7
                    }
                });
            }
        });

        console.log(`✅ Created ${edges.length} CRC relationships`);
        return edges;
    }

    createExtensiveCrossReferences(ccpNodes, crcNodes) {
        const ccpNodeMap = new Map(ccpNodes.map(n => [n.data.id.replace('ccp_', ''), n.data.id]));
        const crcNodeMap = new Map(crcNodes.map(n => [n.data.ruleNumber, n.data.id]));
        const edges = [];

        this.ccpCrcCrossRefs.forEach((ref, index) => {
            const sourceId = ccpNodeMap.get(ref.ccp);
            const targetId = crcNodeMap.get(ref.crc);

            if (sourceId && targetId) {
                edges.push({
                    data: {
                        id: `cross_ref_${index}`,
                        source: sourceId,
                        target: targetId,
                        type: ref.type,
                        weight: ref.weight,
                        color: '#DC143C',
                        opacity: 0.9,
                        crossReference: true
                    }
                });
            }
        });

        console.log(`✅ Created ${edges.length} cross-references`);
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
    <title>Connected Legal Knowledge Graph</title>
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
        <h3 style="margin: 0 0 10px 0; font-size: 16px;">🏛️ Connected Legal Graph</h3>
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
                <span>CRC Workflow</span>
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
        console.log('🚀 Initializing Connected Graph...');
        
        const elements = ${JSON.stringify(this.elements, null, 2)};
        
        const nodes = elements.filter(e => !e.data.source && !e.data.target);
        const edges = elements.filter(e => e.data.source && e.data.target);
        const crossRefs = edges.filter(e => e.data.crossReference);
        
        document.getElementById('element-count').textContent = elements.length;
        document.getElementById('node-count').textContent = nodes.length;
        document.getElementById('edge-count').textContent = edges.length;
        document.getElementById('cross-count').textContent = crossRefs.length;
        
        console.log('📊 Connected Graph Data:');
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
                            'width': 35,
                            'height': 35,
                            'font-size': 7,
                            'text-valign': 'center',
                            'text-halign': 'center',
                            'color': 'white',
                            'text-outline-width': 1,
                            'text-outline-color': '#000',
                            'border-width': 1,
                            'border-color': 'white'
                        }
                    },
                    {
                        selector: 'edge',
                        style: {
                            'width': 'mapData(weight, 1, 10, 1, 4)',
                            'line-color': 'data(color)',
                            'target-arrow-color': 'data(color)',
                            'target-arrow-shape': 'triangle',
                            'curve-style': 'bezier',
                            'opacity': 'data(opacity)'
                        }
                    },
                    {
                        selector: 'edge[crossReference]',
                        style: {
                            'line-style': 'dashed',
                            'width': 3,
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
                    animationDuration: 2000,
                    nodeRepulsion: function(node) { return 8192; },
                    nodeOverlap: 10,
                    idealEdgeLength: function(edge) { 
                        return edge.data('crossReference') ? 80 : 40; 
                    },
                    edgeElasticity: function(edge) { 
                        return edge.data('crossReference') ? 200 : 100; 
                    },
                    nestingFactor: 1.2,
                    gravity: 50,
                    numIter: 2000,
                    initialTemp: 1000,
                    coolingFactor: 0.99,
                    minTemp: 1.0
                }
            });
            
            console.log('✅ Connected Graph initialized!');
            console.log('- Rendered nodes:', cy.nodes().length);
            console.log('- Rendered edges:', cy.edges().length);
            
            document.getElementById('status').innerHTML = '<span style="color: green;">✅ CONNECTED!</span>';
            
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
                    animationDuration: 1000,
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

    async createConnectedGraph() {
        await this.loadAndProcessData();
        const html = this.generateHTML();
        
        fs.writeFileSync('./connected_unified_graph.html', html);
        console.log('\n🎉 Created connected_unified_graph.html');
        
        return './connected_unified_graph.html';
    }
}

async function main() {
    try {
        const builder = new ConnectedUnifiedGraph();
        const filePath = await builder.createConnectedGraph();
        
        console.log('\n🎯 CONNECTED GRAPH READY:');
        console.log(`   File: ${filePath}`);
        console.log('   Command: open connected_unified_graph.html');
        console.log('\n💡 Now with proper relationships and dependencies!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

if (require.main === module) {
    main();
}

module.exports = ConnectedUnifiedGraph; 