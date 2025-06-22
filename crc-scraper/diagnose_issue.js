const fs = require('fs');
const zlib = require('zlib');

console.log('🔍 COMPREHENSIVE GRAPH DIAGNOSIS\n');

try {
    // Load CRC graph
    console.log('1️⃣ Loading CRC Graph...');
    const crcPath = './crc_results/knowledge_graph/crc_knowledge_graph_cytoscape.json.gz';
    const compressedData = fs.readFileSync(crcPath);
    const decompressedData = zlib.gunzipSync(compressedData);
    const crcGraph = JSON.parse(decompressedData.toString());
    
    console.log('✅ CRC Graph loaded');
    console.log(`   - Elements: ${crcGraph.elements?.length}`);
    console.log(`   - First element type: ${crcGraph.elements?.[0]?.data?.type}`);
    
    // Load CCP graph
    console.log('\n2️⃣ Loading CCP Graph...');
    let ccpPath = '../ccp-scraper/ccp_knowledge_graph/ccp_knowledge_graph_cytoscape.json';
    if (!fs.existsSync(ccpPath)) {
        ccpPath = '../knowledge-graph/ccp_knowledge_graph/ccp_knowledge_graph_cytoscape.json';
    }
    
    const ccpData = fs.readFileSync(ccpPath, 'utf8');
    const ccpGraph = JSON.parse(ccpData);
    
    console.log('✅ CCP Graph loaded');
    console.log(`   - Nodes: ${ccpGraph.nodes?.length}`);
    console.log(`   - Edges: ${ccpGraph.edges?.length}`);
    
    // Process nodes exactly like the main script
    console.log('\n3️⃣ Processing Nodes...');
    
    // CRC nodes
    const crcNodes = crcGraph.elements
        .filter(element => element.data && element.data.type === 'crc_rule')
        .map(element => ({
            data: {
                ...element.data,
                source_system: 'CRC',
                system_color: '#2E8B57',
                displayLabel: `CRC ${element.data.ruleNumber}`,
                unified_id: `crc_${element.data.id}`,
                original_id: element.data.id
            }
        }));
    
    // CCP nodes
    const ccpNodes = ccpGraph.nodes.map(node => ({
        data: {
            ...node.data,
            source_system: 'CCP',
            system_color: '#4169E1',
            displayLabel: node.data.label,
            unified_id: `ccp_${node.data.id}`,
            original_id: node.data.id
        }
    }));
    
    console.log(`✅ Processed ${crcNodes.length} CRC nodes, ${ccpNodes.length} CCP nodes`);
    
    // Check for ID conflicts
    console.log('\n4️⃣ Checking for ID conflicts...');
    const allNodeIds = [...crcNodes, ...ccpNodes].map(n => n.data.unified_id);
    const uniqueIds = new Set(allNodeIds);
    if (allNodeIds.length !== uniqueIds.size) {
        console.log('❌ ID CONFLICTS FOUND!');
        const duplicates = allNodeIds.filter((id, index) => allNodeIds.indexOf(id) !== index);
        console.log('Duplicate IDs:', [...new Set(duplicates)]);
    } else {
        console.log('✅ No ID conflicts');
    }
    
    // Process edges
    console.log('\n5️⃣ Processing Edges...');
    const nodeIdSet = new Set([...ccpNodes, ...crcNodes].map(n => n.data.unified_id));
    const validEdges = [];
    const invalidEdges = [];
    
    if (ccpGraph.edges) {
        ccpGraph.edges.forEach(edge => {
            const sourceId = `ccp_${edge.data.source}`;
            const targetId = `ccp_${edge.data.target}`;
            
            if (nodeIdSet.has(sourceId) && nodeIdSet.has(targetId)) {
                validEdges.push({
                    data: {
                        id: `ccp_${edge.data.id}`,
                        source: sourceId,
                        target: targetId,
                        edge_color: '#4169E1',
                        weight: edge.data.weight || 3
                    }
                });
            } else {
                invalidEdges.push({
                    id: edge.data.id,
                    source: edge.data.source,
                    target: edge.data.target,
                    sourceExists: nodeIdSet.has(sourceId),
                    targetExists: nodeIdSet.has(targetId)
                });
            }
        });
    }
    
    console.log(`✅ Valid edges: ${validEdges.length}`);
    console.log(`❌ Invalid edges: ${invalidEdges.length}`);
    
    if (invalidEdges.length > 0) {
        console.log('\n📋 Sample invalid edges:');
        invalidEdges.slice(0, 10).forEach(e => {
            console.log(`   ${e.id}: ${e.source} -> ${e.target} (source exists: ${e.sourceExists}, target exists: ${e.targetExists})`);
        });
    }
    
    // Create test elements array
    console.log('\n6️⃣ Creating Elements Array...');
    const allNodes = [...ccpNodes, ...crcNodes];
    const elements = [...allNodes, ...validEdges];
    
    console.log(`✅ Total elements: ${elements.length}`);
    console.log(`   - Nodes: ${allNodes.length}`);
    console.log(`   - Edges: ${validEdges.length}`);
    
    // Sample elements for inspection
    console.log('\n7️⃣ Sample Elements:');
    console.log('First CCP node:');
    console.log(JSON.stringify(ccpNodes[0], null, 2));
    console.log('\nFirst CRC node:');
    console.log(JSON.stringify(crcNodes[0], null, 2));
    console.log('\nFirst edge:');
    console.log(JSON.stringify(validEdges[0], null, 2));
    
    // Create minimal test HTML
    console.log('\n8️⃣ Creating minimal test visualization...');
    const minimalHtml = `<!DOCTYPE html>
<html>
<head>
    <title>Minimal Test Graph</title>
    <script src="https://unpkg.com/cytoscape@3.21.0/dist/cytoscape.min.js"></script>
    <style>
        #cy { width: 100%; height: 100vh; background: #f0f0f0; }
        #debug { position: fixed; top: 10px; right: 10px; background: white; padding: 10px; }
    </style>
</head>
<body>
    <div id="debug">
        <div>Elements: <span id="element-count">0</span></div>
        <div>Nodes: <span id="node-count">0</span></div>
        <div>Edges: <span id="edge-count">0</span></div>
        <div>Status: <span id="status">Loading...</span></div>
    </div>
    <div id="cy"></div>
    
    <script>
        console.log('🚀 Starting minimal test...');
        
        const elements = ${JSON.stringify(elements.slice(0, 50), null, 2)}; // First 50 elements only
        
        document.getElementById('element-count').textContent = elements.length;
        document.getElementById('node-count').textContent = elements.filter(e => !e.data.source).length;
        document.getElementById('edge-count').textContent = elements.filter(e => e.data.source).length;
        
        console.log('Elements to render:', elements.length);
        
        try {
            const cy = cytoscape({
                container: document.getElementById('cy'),
                elements: elements,
                
                style: [
                    {
                        selector: 'node',
                        style: {
                            'background-color': 'data(system_color)',
                            'label': 'data(displayLabel)',
                            'width': 30,
                            'height': 30,
                            'font-size': 10,
                            'color': 'white'
                        }
                    },
                    {
                        selector: 'edge',
                        style: {
                            'width': 2,
                            'line-color': 'data(edge_color)',
                            'target-arrow-color': 'data(edge_color)',
                            'target-arrow-shape': 'triangle'
                        }
                    }
                ],
                
                layout: {
                    name: 'grid',
                    rows: 10,
                    cols: 10
                }
            });
            
            console.log('✅ Cytoscape initialized successfully');
            console.log('Nodes rendered:', cy.nodes().length);
            console.log('Edges rendered:', cy.edges().length);
            
            document.getElementById('status').textContent = 'SUCCESS!';
            document.getElementById('status').style.color = 'green';
            
        } catch (error) {
            console.error('❌ Cytoscape error:', error);
            document.getElementById('status').textContent = 'ERROR: ' + error.message;
            document.getElementById('status').style.color = 'red';
        }
    </script>
</body>
</html>`;
    
    fs.writeFileSync('./minimal_test_graph.html', minimalHtml);
    console.log('✅ Created minimal_test_graph.html');
    
    // Summary
    console.log('\n📊 DIAGNOSIS SUMMARY:');
    console.log(`✅ CRC Nodes: ${crcNodes.length}`);
    console.log(`✅ CCP Nodes: ${ccpNodes.length}`);
    console.log(`✅ Valid Edges: ${validEdges.length}`);
    console.log(`❌ Invalid Edges: ${invalidEdges.length}`);
    console.log(`✅ Total Elements: ${elements.length}`);
    
    if (invalidEdges.length > 0) {
        console.log('\n⚠️ ISSUES TO FIX:');
        console.log('- Some edges reference non-existent nodes');
        console.log('- This will cause Cytoscape rendering errors');
    }
    
    console.log('\n🧪 TEST: Open minimal_test_graph.html to see if basic rendering works');
    
} catch (error) {
    console.error('❌ DIAGNOSIS ERROR:', error.message);
    console.error(error.stack);
} 