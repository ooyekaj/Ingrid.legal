const fs = require('fs');
const zlib = require('zlib');

class WorkingUnifiedGraph {
    constructor() {
        this.elements = [];
    }

    async loadAndProcessData() {
        console.log('🚀 Creating 100% Working Unified Graph...\n');

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

        // Process CRC nodes (fix double prefix issue)
        console.log('3️⃣ Processing CRC nodes...');
        const crcNodes = crcGraph.elements
            .filter(element => element.data && element.data.type === 'crc_rule')
            .map(element => ({
                data: {
                    id: `crc_${element.data.ruleNumber}`, // Use ruleNumber instead of id
                    label: `CRC ${element.data.ruleNumber}`,
                    title: element.data.title,
                    source_system: 'CRC',
                    system_color: '#2E8B57',
                    ruleNumber: element.data.ruleNumber,
                    category: this.mapCRCCategory(element.data.ruleNumber),
                    type: 'crc_rule'
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
                filingRelevance: node.data.filingRelevance
            }
        }));

        console.log(`✅ Processed ${crcNodes.length} CRC nodes, ${ccpNodes.length} CCP nodes`);

        // Process CCP edges with validation
        console.log('5️⃣ Processing edges...');
        const nodeIds = new Set([...crcNodes, ...ccpNodes].map(n => n.data.id));
        const validEdges = [];

        if (ccpGraph.edges) {
            ccpGraph.edges.forEach((edge, index) => {
                const sourceId = `ccp_${edge.data.source}`;
                const targetId = `ccp_${edge.data.target}`;

                if (nodeIds.has(sourceId) && nodeIds.has(targetId)) {
                    validEdges.push({
                        data: {
                            id: `edge_${index}`,
                            source: sourceId,
                            target: targetId,
                            type: edge.data.type || 'relationship',
                            weight: edge.data.weight || 3,
                            color: '#4169E1'
                        }
                    });
                }
            });
        }

        // Add cross-references
        console.log('6️⃣ Adding cross-references...');
        const crossRefs = this.createCrossReferences(ccpNodes, crcNodes);
        
        // Combine all elements
        this.elements = [...ccpNodes, ...crcNodes, ...validEdges, ...crossRefs];
        
        console.log(`\n📊 Final Statistics:`);
        console.log(`   Total Elements: ${this.elements.length}`);
        console.log(`   - CCP Nodes: ${ccpNodes.length}`);
        console.log(`   - CRC Nodes: ${crcNodes.length}`);
        console.log(`   - Edges: ${validEdges.length}`);
        console.log(`   - Cross-refs: ${crossRefs.length}`);

        return this.elements;
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

    createCrossReferences(ccpNodes, crcNodes) {
        const crossRefs = [];
        
        // Summary judgment cross-reference
        const ccpSummary = ccpNodes.find(n => n.data.id === 'ccp_437c');
        const crcSummary = crcNodes.find(n => n.data.ruleNumber === '3.1350');
        
        if (ccpSummary && crcSummary) {
            crossRefs.push({
                data: {
                    id: 'cross_ref_1',
                    source: ccpSummary.data.id,
                    target: crcSummary.data.id,
                    type: 'cross_reference',
                    weight: 8,
                    color: '#DC143C'
                }
            });
        }

        // Motion notice cross-reference
        const ccpNotice = ccpNodes.find(n => n.data.id === 'ccp_1005');
        const crcMotion = crcNodes.find(n => n.data.ruleNumber === '3.1300');
        
        if (ccpNotice && crcMotion) {
            crossRefs.push({
                data: {
                    id: 'cross_ref_2',
                    source: ccpNotice.data.id,
                    target: crcMotion.data.id,
                    type: 'cross_reference',
                    weight: 6,
                    color: '#DC143C'
                }
            });
        }

        console.log(`✅ Created ${crossRefs.length} cross-references`);
        return crossRefs;
    }

    generateHTML() {
        const html = `<!DOCTYPE html>
<html>
<head>
    <title>Working Unified Legal Knowledge Graph</title>
    <script src="https://unpkg.com/cytoscape@3.21.0/dist/cytoscape.min.js"></script>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 0; 
            background: #f5f5f5; 
        }
        #controls { 
            position: fixed; 
            top: 10px; 
            left: 10px; 
            z-index: 1000; 
            background: white; 
            padding: 15px; 
            border-radius: 8px; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
            max-width: 280px; 
        }
        #cy { 
            width: 100%; 
            height: 100vh; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
        }
        .filter-btn { 
            margin: 3px; 
            padding: 6px 10px; 
            border: none; 
            border-radius: 4px; 
            cursor: pointer; 
            font-size: 12px;
            font-weight: bold; 
        }
        .filter-btn.active { background: #4CAF50; color: white; }
        .filter-btn.inactive { background: #ddd; color: #666; }
        #legend { margin-top: 10px; padding-top: 10px; border-top: 1px solid #eee; }
        .legend-item { display: flex; align-items: center; margin: 3px 0; font-size: 12px; }
        .legend-color { width: 16px; height: 16px; border-radius: 50%; margin-right: 8px; }
        #stats { margin-top: 10px; padding-top: 10px; border-top: 1px solid #eee; font-size: 11px; color: #666; }
        #status { margin-top: 10px; padding: 5px; background: #f0f0f0; border-radius: 3px; font-size: 11px; }
    </style>
</head>
<body>
    <div id="controls">
        <h3 style="margin: 0 0 10px 0; font-size: 16px;">🏛️ Unified Legal Graph</h3>
        <div>
            <button class="filter-btn active" onclick="filterSystem('all')">All Systems</button><br>
            <button class="filter-btn inactive" onclick="filterSystem('CCP')">CCP Only</button>
            <button class="filter-btn inactive" onclick="filterSystem('CRC')">CRC Only</button>
        </div>
        
        <div id="legend">
            <div style="font-weight: bold; font-size: 12px; margin-bottom: 5px;">Legend</div>
            <div class="legend-item">
                <div class="legend-color" style="background: #4169E1;"></div>
                <span>CCP (Civil Procedure)</span>
            </div>
            <div class="legend-item">
                <div class="legend-color" style="background: #2E8B57;"></div>
                <span>CRC (Court Rules)</span>
            </div>
            <div class="legend-item">
                <div class="legend-color" style="background: #DC143C;"></div>
                <span>Cross-References</span>
            </div>
        </div>
        
        <div id="stats">
            <div>Elements: <span id="element-count">0</span></div>
            <div>Nodes: <span id="node-count">0</span></div>
            <div>Edges: <span id="edge-count">0</span></div>
        </div>
        
        <div id="status">Loading...</div>
    </div>

    <div id="cy"></div>

    <script>
        console.log('🚀 Initializing Working Unified Graph...');
        
        const elements = ${JSON.stringify(this.elements, null, 2)};
        
        // Update stats
        const nodes = elements.filter(e => !e.data.source && !e.data.target);
        const edges = elements.filter(e => e.data.source && e.data.target);
        
        document.getElementById('element-count').textContent = elements.length;
        document.getElementById('node-count').textContent = nodes.length;
        document.getElementById('edge-count').textContent = edges.length;
        
        console.log('📊 Data loaded:');
        console.log('- Elements:', elements.length);
        console.log('- Nodes:', nodes.length);
        console.log('- Edges:', edges.length);
        
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
                            'width': 40,
                            'height': 40,
                            'font-size': 8,
                            'text-valign': 'center',
                            'text-halign': 'center',
                            'color': 'white',
                            'text-outline-width': 1,
                            'text-outline-color': '#000',
                            'border-width': 2,
                            'border-color': 'white',
                            'text-wrap': 'wrap',
                            'text-max-width': 50
                        }
                    },
                    {
                        selector: 'node[source_system = "CCP"]',
                        style: {
                            'background-color': '#4169E1'
                        }
                    },
                    {
                        selector: 'node[source_system = "CRC"]',
                        style: {
                            'background-color': '#2E8B57'
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
                            'opacity': 0.6
                        }
                    },
                    {
                        selector: 'edge[type = "cross_reference"]',
                        style: {
                            'line-style': 'dashed',
                            'width': 3,
                            'line-color': '#DC143C',
                            'target-arrow-color': '#DC143C',
                            'opacity': 0.9
                        }
                    },
                    {
                        selector: 'node:selected',
                        style: {
                            'border-width': 4,
                            'border-color': '#FFD700'
                        }
                    }
                ],
                
                layout: {
                    name: 'cose',
                    animate: true,
                    animationDuration: 1000,
                    nodeRepulsion: function(node) { return 2048; },
                    nodeOverlap: 20,
                    idealEdgeLength: function(edge) { return 50; },
                    edgeElasticity: function(edge) { return 100; },
                    nestingFactor: 5,
                    gravity: 80,
                    numIter: 1000,
                    initialTemp: 200,
                    coolingFactor: 0.95,
                    minTemp: 1.0
                }
            });
            
            console.log('✅ Cytoscape initialized successfully!');
            console.log('- Rendered nodes:', cy.nodes().length);
            console.log('- Rendered edges:', cy.edges().length);
            
            document.getElementById('status').innerHTML = '<span style="color: green;">✅ SUCCESS!</span>';
            
            // Add click handlers for nodes
            cy.on('tap', 'node', function(evt) {
                const node = evt.target;
                console.log('Clicked node:', node.data());
            });
            
            // Filter function
            window.filterSystem = function(system) {
                // Update button states
                document.querySelectorAll('.filter-btn').forEach(btn => {
                    btn.classList.remove('active');
                    btn.classList.add('inactive');
                });
                event.target.classList.remove('inactive');
                event.target.classList.add('active');

                if (system === 'all') {
                    cy.elements().show();
                } else {
                    cy.elements().hide();
                    cy.nodes('[source_system = "' + system + '"]').show();
                    
                    // Show edges between visible nodes
                    const visibleNodes = cy.nodes(':visible');
                    visibleNodes.forEach(function(node) {
                        node.connectedEdges().forEach(function(edge) {
                            if (visibleNodes.contains(edge.source()) && visibleNodes.contains(edge.target())) {
                                edge.show();
                            }
                        });
                    });
                }
                
                // Re-layout visible elements
                cy.layout({
                    name: 'cose',
                    animate: true,
                    animationDuration: 500,
                    randomize: false
                }).run();
            };
            
        } catch (error) {
            console.error('❌ Cytoscape error:', error);
            document.getElementById('status').innerHTML = '<span style="color: red;">❌ ERROR: ' + error.message + '</span>';
        }
    </script>
</body>
</html>`;

        return html;
    }

    async createWorkingGraph() {
        await this.loadAndProcessData();
        const html = this.generateHTML();
        
        fs.writeFileSync('./working_unified_graph.html', html);
        console.log('\n🎉 Created working_unified_graph.html');
        
        return './working_unified_graph.html';
    }
}

// Execute
async function main() {
    try {
        const builder = new WorkingUnifiedGraph();
        const filePath = await builder.createWorkingGraph();
        
        console.log('\n🎯 READY TO VIEW:');
        console.log(`   File: ${filePath}`);
        console.log('   Command: open working_unified_graph.html');
        console.log('\n💡 This version should work 100%!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    }
}

if (require.main === module) {
    main();
}

module.exports = WorkingUnifiedGraph; 