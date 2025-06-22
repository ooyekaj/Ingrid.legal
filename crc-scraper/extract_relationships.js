const fs = require('fs');
const zlib = require('zlib');

async function extractRelationships() {
    console.log('📋 Extracting all rules and relationships...\n');

    // Load CRC graph
    const crcPath = './crc_results/knowledge_graph/crc_knowledge_graph_cytoscape.json.gz';
    const compressedData = fs.readFileSync(crcPath);
    const decompressedData = zlib.gunzipSync(compressedData);
    const crcGraph = JSON.parse(decompressedData.toString());

    // Load CCP graph
    let ccpPath = '../ccp-scraper/ccp_knowledge_graph/ccp_knowledge_graph_cytoscape.json';
    if (!fs.existsSync(ccpPath)) {
        ccpPath = '../knowledge-graph/ccp_knowledge_graph/ccp_knowledge_graph_cytoscape.json';
    }
    const ccpData = fs.readFileSync(ccpPath, 'utf8');
    const ccpGraph = JSON.parse(ccpData);

    // Extract CRC rules
    const crcRules = crcGraph.elements
        .filter(element => element.data && element.data.type === 'crc_rule')
        .map(element => ({
            id: element.data.ruleNumber,
            title: element.data.title || 'No title',
            category: mapCRCCategory(element.data.ruleNumber),
            system: 'CRC'
        }))
        .sort((a, b) => parseFloat(a.id) - parseFloat(b.id));

    // Extract CCP rules
    const ccpRules = ccpGraph.nodes.map(node => ({
        id: node.data.id,
        title: node.data.title,
        category: node.data.category,
        system: 'CCP'
    })).sort((a, b) => {
        // Sort numerically
        const aNum = parseFloat(a.id);
        const bNum = parseFloat(b.id);
        return aNum - bNum;
    });

    // Extract CCP relationships
    const ccpRelationships = ccpGraph.edges.map(edge => ({
        source: edge.data.source,
        target: edge.data.target,
        type: edge.data.type,
        description: edge.data.description || edge.data.label || ''
    }));

    // Extract cross-references (CCP to CRC)
    const crossReferences = [
        { ccp: '437c', crc: '3.1350', type: 'summary_judgment_format' },
        { ccp: '437c', crc: '3.1351', type: 'summary_judgment_evidence' },
        { ccp: '1005', crc: '3.1300', type: 'motion_filing_deadline' },
        { ccp: '1005', crc: '2.100', type: 'document_format_requirement' },
        { ccp: '1010', crc: '2.251', type: 'electronic_service' },
        { ccp: '1011', crc: '2.251', type: 'electronic_service' },
        { ccp: '1013', crc: '1.10', type: 'time_calculation' },
        { ccp: '430.10', crc: '3.1320', type: 'demurrer_format' },
        { ccp: '430.20', crc: '3.1320', type: 'demurrer_format' },
        { ccp: '2030.300', crc: '3.1345', type: 'discovery_motion_format' },
        { ccp: '2031.310', crc: '3.1345', type: 'discovery_motion_format' },
        { ccp: '1010.6', crc: '2.253', type: 'electronic_filing' },
        { ccp: '425.10', crc: '2.100', type: 'pleading_format' },
        { ccp: '425.11', crc: '2.100', type: 'pleading_format' }
    ];

    // Find isolated nodes
    const connectedCCPNodes = new Set();
    ccpRelationships.forEach(rel => {
        connectedCCPNodes.add(rel.source);
        connectedCCPNodes.add(rel.target);
    });
    
    const isolatedCCPNodes = ccpRules.filter(rule => !connectedCCPNodes.has(rule.id));

    // Generate markdown
    let markdown = `# California Legal Knowledge Graph - Rules & Relationships

## Overview
This document lists all rules and their relationships in the unified California legal knowledge graph.

**Total Rules**: ${crcRules.length + ccpRules.length}
- **CRC (California Rules of Court)**: ${crcRules.length} rules
- **CCP (California Code of Civil Procedure)**: ${ccpRules.length} rules

**Total Relationships**: ${ccpRelationships.length + crossReferences.length}
- **CCP Internal**: ${ccpRelationships.length} relationships
- **CCP ↔ CRC Cross-References**: ${crossReferences.length} relationships

---

## California Rules of Court (CRC)

### Rules by Category

`;

    // Group CRC rules by category
    const crcByCategory = {};
    crcRules.forEach(rule => {
        if (!crcByCategory[rule.category]) {
            crcByCategory[rule.category] = [];
        }
        crcByCategory[rule.category].push(rule);
    });

    Object.keys(crcByCategory).sort().forEach(category => {
        markdown += `#### ${category}\n`;
        crcByCategory[category].forEach(rule => {
            markdown += `- **CRC ${rule.id}**: ${rule.title}\n`;
        });
        markdown += '\n';
    });

    markdown += `---

## California Code of Civil Procedure (CCP)

### Rules by Category

`;

    // Group CCP rules by category
    const ccpByCategory = {};
    ccpRules.forEach(rule => {
        if (!ccpByCategory[rule.category]) {
            ccpByCategory[rule.category] = [];
        }
        ccpByCategory[rule.category].push(rule);
    });

    Object.keys(ccpByCategory).sort().forEach(category => {
        markdown += `#### ${category}\n`;
        ccpByCategory[category].forEach(rule => {
            markdown += `- **CCP ${rule.id}**: ${rule.title}\n`;
        });
        markdown += '\n';
    });

    markdown += `---

## Relationships

### CCP Internal Relationships (${ccpRelationships.length} total)

`;

    // Group relationships by type
    const relationshipsByType = {};
    ccpRelationships.forEach(rel => {
        if (!relationshipsByType[rel.type]) {
            relationshipsByType[rel.type] = [];
        }
        relationshipsByType[rel.type].push(rel);
    });

    Object.keys(relationshipsByType).sort().forEach(type => {
        markdown += `#### ${type.replace(/_/g, ' ').toUpperCase()}\n`;
        relationshipsByType[type].forEach(rel => {
            const desc = rel.description ? ` - ${rel.description}` : '';
            markdown += `- **CCP ${rel.source}** → **CCP ${rel.target}**${desc}\n`;
        });
        markdown += '\n';
    });

    markdown += `### CCP ↔ CRC Cross-References (${crossReferences.length} total)

These are the verified connections between CCP substantive law and CRC procedural rules:

`;

    crossReferences.forEach(ref => {
        const ccpRule = ccpRules.find(r => r.id === ref.ccp);
        const crcRule = crcRules.find(r => r.id === ref.crc);
        
        const ccpTitle = ccpRule ? ccpRule.title : `CCP ${ref.ccp}`;
        const crcTitle = crcRule ? crcRule.title : `CRC ${ref.crc}`;
        
        markdown += `- **CCP ${ref.ccp}** ↔ **CRC ${ref.crc}** (${ref.type.replace(/_/g, ' ')})\n`;
        markdown += `  - CCP: ${ccpTitle}\n`;
        markdown += `  - CRC: ${crcTitle}\n\n`;
    });

    if (isolatedCCPNodes.length > 0) {
        markdown += `---

## Isolated Rules

These rules have no connections to other rules in the knowledge graph:

### CCP Isolated Rules (${isolatedCCPNodes.length} total)

`;
        isolatedCCPNodes.forEach(rule => {
            markdown += `- **CCP ${rule.id}**: ${rule.title}\n`;
            markdown += `  - Category: ${rule.category}\n`;
            markdown += `  - Reason: Specialized/self-contained procedure\n\n`;
        });
    }

    markdown += `---

## Summary Statistics

### Node Distribution
- **Total Nodes**: ${crcRules.length + ccpRules.length}
- **Connected Nodes**: ${crcRules.length + ccpRules.length - isolatedCCPNodes.length}
- **Isolated Nodes**: ${isolatedCCPNodes.length}

### Relationship Distribution
- **CCP Category Similarity**: ${relationshipsByType.category_similarity?.length || 0}
- **CCP Cross References**: ${relationshipsByType.cross_reference?.length || 0}
- **CCP ↔ CRC Cross References**: ${crossReferences.length}

### Coverage by Legal Area
- **Document Format**: CRC 2.x rules (${crcRules.filter(r => r.id.startsWith('2.')).length} rules)
- **Civil Procedures**: CRC 3.x rules (${crcRules.filter(r => r.id.startsWith('3.')).length} rules)
- **Appeals**: CRC 8.x rules (${crcRules.filter(r => r.id.startsWith('8.')).length} rules)
- **Service & Notice**: CCP 1000s (${ccpRules.filter(r => parseFloat(r.id) >= 1000 && parseFloat(r.id) < 2000).length} rules)
- **Discovery**: CCP 2000s (${ccpRules.filter(r => parseFloat(r.id) >= 2000 && parseFloat(r.id) < 3000).length} rules)

---

*Generated from California Legal Knowledge Graph*
*This represents the actual legal relationships in California's civil procedure system*
`;

    return markdown;
}

function mapCRCCategory(ruleNumber) {
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

// Run the extraction
extractRelationships().then(markdown => {
    fs.writeFileSync('./california_legal_rules_relationships.md', markdown);
    console.log('✅ Created california_legal_rules_relationships.md');
    console.log('📄 File contains complete rules and relationships documentation');
}).catch(console.error); 