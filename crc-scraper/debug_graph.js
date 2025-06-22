const fs = require('fs');
const zlib = require('zlib');

// Debug CRC graph structure
console.log('🔍 Debugging Graph Data Structures...\n');

try {
    // Load CRC graph
    const crcPath = './crc_results/knowledge_graph/crc_knowledge_graph_cytoscape.json.gz';
    const compressedData = fs.readFileSync(crcPath);
    const decompressedData = zlib.gunzipSync(compressedData);
    const crcGraph = JSON.parse(decompressedData.toString());

    console.log('📊 CRC Graph Structure:');
    console.log('- Has elements:', !!crcGraph.elements);
    console.log('- Elements length:', crcGraph.elements?.length);
    if (crcGraph.elements && crcGraph.elements.length > 0) {
        console.log('- First element keys:', Object.keys(crcGraph.elements[0]));
        console.log('- First element structure:');
        console.log(JSON.stringify(crcGraph.elements[0], null, 2));
    }

    // Check if it's in Cytoscape format vs D3 format
    console.log('\n🔍 Format Analysis:');
    console.log('- Root keys:', Object.keys(crcGraph));
    
    // Load CCP graph for comparison
    let ccpPath = '../ccp-scraper/ccp_knowledge_graph/ccp_knowledge_graph_cytoscape.json';
    if (!fs.existsSync(ccpPath)) {
        ccpPath = '../knowledge-graph/ccp_knowledge_graph/ccp_knowledge_graph_cytoscape.json';
    }
    
    const ccpData = fs.readFileSync(ccpPath, 'utf8');
    const ccpGraph = JSON.parse(ccpData);
    
    console.log('\n📊 CCP Graph Structure:');
    console.log('- Has nodes:', !!ccpGraph.nodes);
    console.log('- Has edges:', !!ccpGraph.edges);
    console.log('- Nodes length:', ccpGraph.nodes?.length);
    console.log('- Edges length:', ccpGraph.edges?.length);
    if (ccpGraph.nodes && ccpGraph.nodes.length > 0) {
        console.log('- First node structure:');
        console.log(JSON.stringify(ccpGraph.nodes[0], null, 2));
    }

} catch (error) {
    console.error('❌ Error:', error.message);
} 