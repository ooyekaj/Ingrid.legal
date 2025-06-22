const fs = require('fs');
const zlib = require('zlib');

async function debugCCPEdges() {
    console.log('🔍 Debugging CCP Edge Processing...\n');

    // Load CCP graph  
    console.log('1️⃣ Loading CCP data...');
    let ccpPath = '../knowledge-graph/ccp_knowledge_graph/ccp_knowledge_graph_cytoscape.json';
    const ccpData = fs.readFileSync(ccpPath, 'utf8');
    const ccpGraph = JSON.parse(ccpData);

    console.log('CCP Graph loaded:');
    console.log(`- Nodes: ${ccpGraph.nodes.length}`);
    console.log(`- Edges: ${ccpGraph.edges.length}`);

    // Process CCP nodes like our script does
    const ccpNodes = ccpGraph.nodes.map(node => ({
        data: {
            id: `ccp_${node.data.id}`,
            label: node.data.label,
            title: node.data.title,
            source_system: 'CCP',
            system_color: '#4169E1',
            category: node.data.category,
            type: 'ccp_section'
        }
    }));

    console.log('\n2️⃣ CCP Nodes processed:');
    console.log(`- First 5 node IDs: ${ccpNodes.slice(0, 5).map(n => n.data.id).join(', ')}`);

    // Create node ID set
    const nodeIds = new Set(ccpNodes.map(n => n.data.id));
    console.log(`- Total unique node IDs: ${nodeIds.size}`);

    // Process edges
    console.log('\n3️⃣ Processing CCP edges...');
    const ccpEdges = [];
    let validEdges = 0;
    let invalidEdges = 0;

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
                validEdges++;
            } else {
                console.log(`❌ Invalid edge ${index}: ${sourceId} -> ${targetId}`);
                console.log(`   Source exists: ${nodeIds.has(sourceId)}, Target exists: ${nodeIds.has(targetId)}`);
                invalidEdges++;
                if (invalidEdges < 5) { // Only show first few
                    console.log(`   Original: ${edge.data.source} -> ${edge.data.target}`);
                }
            }
        });
    }

    console.log(`\n📊 Edge Processing Results:`);
    console.log(`- Valid edges: ${validEdges}`);
    console.log(`- Invalid edges: ${invalidEdges}`);
    console.log(`- Success rate: ${(validEdges / (validEdges + invalidEdges) * 100).toFixed(1)}%`);

    // Sample some edges
    console.log('\n4️⃣ Sample processed edges:');
    ccpEdges.slice(0, 3).forEach((edge, i) => {
        console.log(`${i + 1}. ${edge.data.source} -> ${edge.data.target} (${edge.data.type})`);
    });

    // Check for disconnected nodes
    const connectedNodes = new Set();
    ccpEdges.forEach(edge => {
        connectedNodes.add(edge.data.source);
        connectedNodes.add(edge.data.target);
    });

    const disconnectedNodes = ccpNodes.filter(node => !connectedNodes.has(node.data.id));
    console.log(`\n5️⃣ Connectivity Analysis:`);
    console.log(`- Connected nodes: ${connectedNodes.size}`);
    console.log(`- Disconnected nodes: ${disconnectedNodes.length}`);
    
    if (disconnectedNodes.length > 0) {
        console.log('- Disconnected node IDs:');
        disconnectedNodes.slice(0, 10).forEach(node => {
            console.log(`  • ${node.data.id} (${node.data.label})`);
        });
    }

    return {
        totalNodes: ccpNodes.length,
        totalEdges: ccpEdges.length,
        connectedNodes: connectedNodes.size,
        disconnectedNodes: disconnectedNodes.length
    };
}

debugCCPEdges().then(results => {
    console.log('\n🎯 Debug Summary:');
    console.log(`Total CCP nodes: ${results.totalNodes}`);
    console.log(`Total CCP edges: ${results.totalEdges}`);
    console.log(`Connected nodes: ${results.connectedNodes}`);
    console.log(`Disconnected nodes: ${results.disconnectedNodes}`);
    
    if (results.disconnectedNodes > 0) {
        console.log('\n⚠️  Some CCP nodes are indeed disconnected in the original graph!');
        console.log('This suggests the CCP knowledge graph itself has isolated components.');
    } else {
        console.log('\n✅ All CCP nodes should be connected - check visualization logic.');
    }
}).catch(console.error); 