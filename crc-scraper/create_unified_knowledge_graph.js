const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

class UnifiedKnowledgeGraphBuilder {
    constructor() {
        this.unifiedGraph = {
            nodes: [],
            edges: []
        };
    }

    // Load and decompress CRC knowledge graph
    async loadCRCGraph() {
        try {
            const crcPath = './crc_results/knowledge_graph/crc_knowledge_graph_cytoscape.json.gz';
            const compressedData = fs.readFileSync(crcPath);
            const decompressedData = zlib.gunzipSync(compressedData);
            const crcGraph = JSON.parse(decompressedData.toString());
            
            console.log(`✅ Loaded CRC graph: ${crcGraph.elements?.length || 'unknown'} elements`);
            return crcGraph;
        } catch (error) {
            console.error('❌ Error loading CRC graph:', error.message);
            return null;
        }
    }

    // Load CCP knowledge graph
    async loadCCPGraph() {
        try {
            // Try the ccp-scraper version first (more comprehensive)
            let ccpPath = '../ccp-scraper/ccp_knowledge_graph/ccp_knowledge_graph_cytoscape.json';
            if (!fs.existsSync(ccpPath)) {
                // Fallback to knowledge-graph version
                ccpPath = '../knowledge-graph/ccp_knowledge_graph/ccp_knowledge_graph_cytoscape.json';
            }
            
            const ccpData = fs.readFileSync(ccpPath, 'utf8');
            const ccpGraph = JSON.parse(ccpData);
            
            console.log(`✅ Loaded CCP graph: ${ccpGraph.nodes?.length || 0} nodes, ${ccpGraph.edges?.length || 0} edges`);
            return ccpGraph;
        } catch (error) {
            console.error('❌ Error loading CCP graph:', error.message);
            return null;
        }
    }

    // Process CRC nodes with enhanced metadata
    processCRCNodes(crcGraph) {
        if (!crcGraph.elements) return [];

        return crcGraph.elements
            .filter(element => element.data && element.data.type === 'crc_rule')
            .map(element => ({
                data: {
                    ...element.data,
                    source_system: 'CRC',
                    system_color: '#2E8B57', // Sea Green for CRC
                    category: this.mapCRCCategory(element.data.ruleNumber),
                    displayLabel: `CRC ${element.data.ruleNumber}`,
                    unified_id: `crc_${element.data.id}`,
                    original_id: element.data.id
                }
            }));
    }

    // Process CCP nodes with enhanced metadata
    processCCPNodes(ccpGraph) {
        if (!ccpGraph.nodes) return [];

        return ccpGraph.nodes.map(node => ({
            data: {
                ...node.data,
                source_system: 'CCP',
                system_color: '#4169E1', // Royal Blue for CCP
                displayLabel: node.data.label,
                unified_id: `ccp_${node.data.id}`,
                original_id: node.data.id
            }
        }));
    }

    // Map CRC rule numbers to meaningful categories
    mapCRCCategory(ruleNumber) {
        const ruleNum = parseFloat(ruleNumber);
        
        if (ruleNum >= 2.100 && ruleNum < 2.300) return 'Document Format & Filing';
        if (ruleNum >= 3.1300 && ruleNum < 3.1400) return 'Motion Practice Format';
        if (ruleNum >= 3.1350 && ruleNum < 3.1360) return 'Summary Judgment Format';
        if (ruleNum >= 8.0 && ruleNum < 9.0) return 'Appellate Procedures';
        if (ruleNum >= 1.0 && ruleNum < 2.0) return 'General Court Rules';
        if (ruleNum >= 10.0) return 'Electronic Filing';
        
        return 'Court Procedures';
    }

    // Create cross-reference edges between CCP and CRC
    createCrossReferences(ccpNodes, crcNodes) {
        const crossRefs = [];
        let edgeId = 1;

        // Summary Judgment cross-references
        const ccpSummaryJudgment = ccpNodes.find(n => n.data.original_id === '437c');
        const crcSummaryJudgment = crcNodes.find(n => n.data.ruleNumber === '3.1350');
        
        if (ccpSummaryJudgment && crcSummaryJudgment) {
            crossRefs.push({
                data: {
                    id: `cross_ref_${edgeId++}`,
                    source: ccpSummaryJudgment.data.unified_id,
                    target: crcSummaryJudgment.data.unified_id,
                    type: 'cross_reference',
                    weight: 10,
                    label: 'Formatting Requirements',
                    description: 'CCP 437c motion must comply with CRC 3.1350 format requirements',
                    edge_color: '#DC143C'
                }
            });
        }

        // Motion practice cross-references
        const ccpMotionNotice = ccpNodes.find(n => n.data.original_id === '1005');
        const crcMotionFormat = crcNodes.find(n => n.data.ruleNumber === '3.1300');
        
        if (ccpMotionNotice && crcMotionFormat) {
            crossRefs.push({
                data: {
                    id: `cross_ref_${edgeId++}`,
                    source: ccpMotionNotice.data.unified_id,
                    target: crcMotionFormat.data.unified_id,
                    type: 'cross_reference',
                    weight: 8,
                    label: 'Filing Requirements',
                    description: 'CCP 1005 notice requirements must follow CRC 3.1300 format',
                    edge_color: '#DC143C'
                }
            });
        }

        console.log(`✅ Created ${crossRefs.length} cross-reference relationships`);
        return crossRefs;
    }

    // Process existing edges with unified IDs
    processEdges(ccpGraph, ccpNodes) {
        const edges = [];
        const nodeIdSet = new Set(ccpNodes.map(n => n.data.unified_id));

        // Process CCP edges
        if (ccpGraph.edges) {
            ccpGraph.edges.forEach(edge => {
                const sourceId = `ccp_${edge.data.source}`;
                const targetId = `ccp_${edge.data.target}`;
                
                // Only add edge if both nodes exist
                if (nodeIdSet.has(sourceId) && nodeIdSet.has(targetId)) {
                    edges.push({
                        data: {
                            ...edge.data,
                            id: `ccp_${edge.data.id}`,
                            source: sourceId,
                            target: targetId,
                            edge_color: '#4169E1',
                            weight: edge.data.weight || 3
                        }
                    });
                } else {
                    console.log(`⚠️ Skipping edge ${edge.data.id}: missing node (${sourceId} -> ${targetId})`);
                }
            });
        }

        console.log(`✅ Processed ${edges.length} existing edges`);
        return edges;
    }

    // Build the unified graph
    async buildUnifiedGraph() {
        console.log('🚀 Building Unified CRC + CCP Knowledge Graph...\n');

        const [crcGraph, ccpGraph] = await Promise.all([
            this.loadCRCGraph(),
            this.loadCCPGraph()
        ]);

        if (!crcGraph || !ccpGraph) {
            throw new Error('Failed to load required knowledge graphs');
        }

        const crcNodes = this.processCRCNodes(crcGraph);
        const ccpNodes = this.processCCPNodes(ccpGraph);
        
        console.log(`📊 Processed ${crcNodes.length} CRC nodes and ${ccpNodes.length} CCP nodes`);

        this.unifiedGraph.nodes = [...ccpNodes, ...crcNodes];
        
        const existingEdges = this.processEdges(ccpGraph, ccpNodes);
        const crossRefEdges = this.createCrossReferences(ccpNodes, crcNodes);

        this.unifiedGraph.edges = [...existingEdges, ...crossRefEdges];

        console.log(`\n📈 Unified Graph Statistics:`);
        console.log(`   Total Nodes: ${this.unifiedGraph.nodes.length}`);
        console.log(`   Total Edges: ${this.unifiedGraph.edges.length}`);

        return this.unifiedGraph;
    }

    // Generate HTML visualization
    generateVisualization(outputPath = './unified_knowledge_graph.html') {
        // Convert to Cytoscape elements format
        const elements = [
            ...this.unifiedGraph.nodes,
            ...this.unifiedGraph.edges
        ];

        const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <title>Unified CRC + CCP Knowledge Graph</title>
    <script src="https://unpkg.com/cytoscape@3.21.0/dist/cytoscape.min.js"></script>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
        #controls { position: fixed; top: 10px; left: 10px; z-index: 1000; background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); max-width: 300px; }
        #cy { width: 100%; height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
        .filter-btn { margin: 5px; padding: 8px 12px; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; }
        .filter-btn.active { background: #4CAF50; color: white; }
        .filter-btn.inactive { background: #ddd; color: #666; }
        #legend { margin-top: 15px; padding-top: 15px; border-top: 1px solid #eee; }
        .legend-item { display: flex; align-items: center; margin: 5px 0; }
        .legend-color { width: 20px; height: 20px; border-radius: 50%; margin-right: 10px; }
        #stats { margin-top: 15px; padding-top: 15px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div id="controls">
        <h3>🏛️ Unified Legal Knowledge Graph</h3>
        <div>
            <button class="filter-btn active" onclick="filterSystem('all')">All Systems</button>
            <button class="filter-btn inactive" onclick="filterSystem('CCP')">CCP Only</button>
            <button class="filter-btn inactive" onclick="filterSystem('CRC')">CRC Only</button>
        </div>
        
        <div id="legend">
            <h4>Legend</h4>
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
            <div>Total Nodes: ${this.unifiedGraph.nodes.length}</div>
            <div>Total Edges: ${this.unifiedGraph.edges.length}</div>
            <div>CCP: ${this.unifiedGraph.nodes.filter(n => n.data.source_system === 'CCP').length}</div>
            <div>CRC: ${this.unifiedGraph.nodes.filter(n => n.data.source_system === 'CRC').length}</div>
        </div>
    </div>

    <div id="cy"></div>

    <script>
        const elements = ${JSON.stringify(elements, null, 2)};
        
        console.log('📊 Loading graph with', elements.length, 'elements');
        const nodes = elements.filter(e => !e.data.source && !e.data.target);
        const edges = elements.filter(e => e.data.source && e.data.target);
        console.log('- Nodes:', nodes.length);
        console.log('- Edges:', edges.length);
        
        // Validate edges have valid source/target
        const nodeIds = new Set(nodes.map(n => n.data.unified_id || n.data.id));
        const invalidEdges = edges.filter(e => !nodeIds.has(e.data.source) || !nodeIds.has(e.data.target));
        if (invalidEdges.length > 0) {
            console.warn('⚠️ Found', invalidEdges.length, 'invalid edges');
            invalidEdges.slice(0, 5).forEach(e => 
                console.warn('Invalid edge:', e.data.id, e.data.source, '->', e.data.target)
            );
        }
        
        const cy = cytoscape({
            container: document.getElementById('cy'),
            elements: elements,
            
            style: [
                {
                    selector: 'node',
                    style: {
                        'background-color': 'data(system_color)',
                        'label': 'data(displayLabel)',
                        'width': '50px',
                        'height': '50px',
                        'font-size': '8px',
                        'text-valign': 'center',
                        'text-halign': 'center',
                        'color': 'white',
                        'text-outline-width': 1,
                        'text-outline-color': '#000',
                        'border-width': 2,
                        'border-color': 'white',
                        'text-wrap': 'wrap',
                        'text-max-width': '60px'
                    }
                },
                {
                    selector: 'edge',
                    style: {
                        'width': 'mapData(weight, 1, 10, 1, 6)',
                        'line-color': 'data(edge_color)',
                        'target-arrow-color': 'data(edge_color)',
                        'target-arrow-shape': 'triangle',
                        'curve-style': 'bezier',
                        'opacity': 0.7
                    }
                },
                {
                    selector: 'edge[type="cross_reference"]',
                    style: {
                        'line-style': 'dashed',
                        'width': 4,
                        'opacity': 0.9
                    }
                }
            ],
            
            layout: {
                name: 'cose',
                animate: true,
                animationDuration: 1000,
                nodeRepulsion: function(node) { return 2048; },
                nodeOverlap: 20,
                idealEdgeLength: function(edge) { return 32; },
                edgeElasticity: function(edge) { return 32; },
                nestingFactor: 5,
                gravity: 80,
                numIter: 1000,
                initialTemp: 200,
                coolingFactor: 0.95,
                minTemp: 1.0
            }
        });

        function filterSystem(system) {
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
                cy.nodes(\`[source_system = "\${system}"]\`).show();
                
                const visibleNodes = cy.nodes(':visible');
                visibleNodes.forEach(node => {
                    node.connectedEdges().forEach(edge => {
                        if (visibleNodes.contains(edge.source()) && visibleNodes.contains(edge.target())) {
                            edge.show();
                        }
                    });
                });
            }
            
            cy.layout({
                name: 'cose',
                animate: true,
                animationDuration: 500,
                randomize: false
            }).run();
        }

        console.log('🎉 Unified Knowledge Graph loaded successfully!');
    </script>
</body>
</html>`;

        fs.writeFileSync(outputPath, htmlContent);
        console.log(`\n🎨 Generated visualization: ${outputPath}`);
        return outputPath;
    }
}

// Main execution
async function main() {
    try {
        const builder = new UnifiedKnowledgeGraphBuilder();
        await builder.buildUnifiedGraph();
        const htmlPath = builder.generateVisualization();
        
        console.log(`\n🎉 SUCCESS! Unified Knowledge Graph created:`);
        console.log(`   📊 View: open ${htmlPath}`);
        console.log(`\n💡 Features:`);
        console.log(`   🔵 Blue nodes: CCP (substantive law)`);
        console.log(`   🟢 Green nodes: CRC (procedural rules)`);
        console.log(`   🔴 Red dashed edges: Cross-references`);
        console.log(`   🎛️ Filter buttons: View individual systems`);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

if (require.main === module) {
    main();
}

module.exports = UnifiedKnowledgeGraphBuilder; 