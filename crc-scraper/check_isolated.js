const fs = require('fs');

// Use the same path logic as our main script
let ccpPath = '../ccp-scraper/ccp_knowledge_graph/ccp_knowledge_graph_cytoscape.json';
if (!fs.existsSync(ccpPath)) {
    ccpPath = '../knowledge-graph/ccp_knowledge_graph/ccp_knowledge_graph_cytoscape.json';
}

console.log('🔍 Checking file:', ccpPath);

const ccpData = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

console.log('Nodes:', ccpData.nodes.length);
console.log('Edges:', ccpData.edges.length);

// Find disconnected nodes
const connectedNodes = new Set();
ccpData.edges.forEach(edge => {
    connectedNodes.add(edge.data.source);
    connectedNodes.add(edge.data.target);
});

const disconnectedNodes = ccpData.nodes.filter(node => !connectedNodes.has(node.data.id));

console.log('\n🔍 Disconnected CCP nodes:', disconnectedNodes.length);
disconnectedNodes.forEach(node => {
    console.log(`  • ${node.data.id} (${node.data.label})`);
});

// Check specific nodes
const node36 = ccpData.nodes.find(n => n.data.id === '36');
const node483 = ccpData.nodes.find(n => n.data.id === '483.020');

console.log('\n🎯 Specific check:');
console.log('CCP 36 exists:', !!node36);
console.log('CCP 483.020 exists:', !!node483);

if (node36) {
    const connected = connectedNodes.has('36');
    console.log('CCP 36 is connected:', connected);
}

if (node483) {
    const connected = connectedNodes.has('483.020');
    console.log('CCP 483.020 is connected:', connected);
} 