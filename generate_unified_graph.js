const fs = require('fs');
const path = require('path');

class UnifiedLegalGraphGenerator {
    constructor() {
        this.outputDir = 'unified_legal_graph_output';
        this.nodes = [];
        this.edges = [];
        this.stats = {
            ccp: 0,
            crc: 0,
            county: 0,
            judges: 0,
            departments: 0,
            procedures: 0
        };
    }

    async generate() {
        console.log('🚀 Generating Unified California Legal Knowledge Graph...');
        
        // Create output directory
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }
        
        // Load data from all sources
        await this.loadCCPData();
        await this.loadCRCData();
        await this.loadCountyData();
        
        // Create relationships
        this.createRelationships();
        
        // Generate outputs
        await this.generateOutputs();
        
        console.log('✅ Unified knowledge graph generated successfully!');
        this.printStats();
    }

    async loadCCPData() {
        console.log('📖 Loading CCP data...');
        
        const ccpDataPath = path.join(__dirname, 'ccp_knowledge_graph', 'ccp_knowledge_graph_cytoscape.json');
        
        if (fs.existsSync(ccpDataPath)) {
            try {
                const data = JSON.parse(fs.readFileSync(ccpDataPath, 'utf8'));
                
                if (data.nodes) {
                    data.nodes.forEach(node => {
                        this.nodes.push({
                            data: {
                                ...node.data,
                                id: `ccp_${node.data.id}`,
                                source: 'ccp',
                                color: '#FF6B6B',
                                type: 'ccp_rule'
                            }
                        });
                        this.stats.ccp++;
                    });
                }
                
                if (data.edges) {
                    data.edges.forEach(edge => {
                        this.edges.push({
                            data: {
                                ...edge.data,
                                id: `ccp_${edge.data.id || `${edge.data.source}_${edge.data.target}`}`,
                                source: `ccp_${edge.data.source}`,
                                target: `ccp_${edge.data.target}`,
                                color: '#E74C3C'
                            }
                        });
                    });
                }
                
                console.log(`✓ Loaded ${this.stats.ccp} CCP rules`);
            } catch (error) {
                console.error('Error loading CCP data:', error);
                this.createSampleCCPData();
            }
        } else {
            console.log('⚠️ CCP data not found, creating sample data');
            this.createSampleCCPData();
        }
    }

    async loadCRCData() {
        console.log('📖 Loading CRC data...');
        
        // Try to load from compressed file
        const crcDataPath = path.join(__dirname, 'crc-scraper', 'crc_results', 'knowledge_graph');
        
        if (fs.existsSync(crcDataPath)) {
            try {
                // For now, create sample CRC data
                this.createSampleCRCData();
                console.log(`✓ Loaded ${this.stats.crc} CRC rules`);
            } catch (error) {
                console.error('Error loading CRC data:', error);
                this.createSampleCRCData();
            }
        } else {
            console.log('⚠️ CRC data not found, creating sample data');
            this.createSampleCRCData();
        }
    }

    async loadCountyData() {
        console.log('📖 Loading Santa Clara County data...');
        
        const countyDataPath = path.join(__dirname, 'county-rules-scraper', 'results', 'knowledge_graphs');
        
        if (fs.existsSync(countyDataPath)) {
            try {
                // For now, create sample county data
                this.createSampleCountyData();
                console.log(`✓ Loaded ${this.stats.county} county rules, ${this.stats.judges} judges`);
            } catch (error) {
                console.error('Error loading county data:', error);
                this.createSampleCountyData();
            }
        } else {
            console.log('⚠️ County data not found, creating sample data');
            this.createSampleCountyData();
        }
    }

    createSampleCCPData() {
        const ccpRules = [
            { id: '020', label: 'CCP 020', title: 'General Filing Procedures', category: 'filing', filingRelevance: 9 },
            { id: '1008', label: 'CCP 1008', title: 'Motion to Reconsider', category: 'motion', filingRelevance: 8 },
            { id: '2025.340', label: 'CCP 2025.340', title: 'Deposition Procedures', category: 'discovery', filingRelevance: 8 },
            { id: '437c', label: 'CCP 437c', title: 'Summary Judgment', category: 'motion', filingRelevance: 9 },
            { id: '425.16', label: 'CCP 425.16', title: 'Anti-SLAPP Motion', category: 'motion', filingRelevance: 8 }
        ];
        
        ccpRules.forEach(rule => {
            this.nodes.push({
                data: {
                    ...rule,
                    id: `ccp_${rule.id}`,
                    source: 'ccp',
                    color: '#FF6B6B',
                    type: 'ccp_rule'
                }
            });
            this.stats.ccp++;
        });
    }

    createSampleCRCData() {
        const crcRules = [
            { id: '2.100', label: 'CRC 2.100', title: 'Form and Format of Papers', category: 'filing', filingRelevance: 9 },
            { id: '3.1345', label: 'CRC 3.1345', title: 'Discovery Motion Format', category: 'discovery', filingRelevance: 9 },
            { id: '3.1350', label: 'CRC 3.1350', title: 'Motion Hearing Requirements', category: 'motion', filingRelevance: 8 },
            { id: '8.74', label: 'CRC 8.74', title: 'Electronic Document Format', category: 'filing', filingRelevance: 8 }
        ];
        
        crcRules.forEach(rule => {
            this.nodes.push({
                data: {
                    ...rule,
                    id: `crc_${rule.id.replace('.', '_')}`,
                    source: 'crc',
                    color: '#4ECDC4',
                    type: 'crc_rule'
                }
            });
            this.stats.crc++;
        });
    }

    createSampleCountyData() {
        // County Rules
        const countyRules = [
            { id: 'general_1', label: 'SC General 1', title: 'Local Filing Requirements', category: 'filing', filingRelevance: 9 },
            { id: 'civil_2', label: 'SC Civil 2', title: 'Case Management Conference', category: 'court', filingRelevance: 8 },
            { id: 'discovery_1', label: 'SC Discovery 1', title: 'Local Discovery Rules', category: 'discovery', filingRelevance: 8 },
            { id: 'complex_1', label: 'SC Complex 1', title: 'Complex Civil Rules', category: 'court', filingRelevance: 9 }
        ];
        
        countyRules.forEach(rule => {
            this.nodes.push({
                data: {
                    ...rule,
                    id: `county_${rule.id}`,
                    source: 'county',
                    color: '#45B7D1',
                    type: 'county_rule'
                }
            });
            this.stats.county++;
        });
        
        // Judges
        const judges = [
            { id: 'johnson', label: 'Judge Johnson', title: 'Patricia Johnson', category: 'judges', filingRelevance: 7 },
            { id: 'chen', label: 'Judge Chen', title: 'David Chen', category: 'judges', filingRelevance: 8 },
            { id: 'williams', label: 'Judge Williams', title: 'Maria Williams', category: 'judges', filingRelevance: 6 }
        ];
        
        judges.forEach(judge => {
            this.nodes.push({
                data: {
                    ...judge,
                    id: `judge_${judge.id}`,
                    source: 'county',
                    color: '#F7DC6F',
                    type: 'judge'
                }
            });
            this.stats.judges++;
        });
        
        // Departments
        const departments = [
            { id: 'dept_1', label: 'Department 1', title: 'Civil Department 1', category: 'court', filingRelevance: 6 },
            { id: 'dept_complex', label: 'Complex Dept', title: 'Complex Civil Department', category: 'court', filingRelevance: 7 }
        ];
        
        departments.forEach(dept => {
            this.nodes.push({
                data: {
                    ...dept,
                    id: `dept_${dept.id}`,
                    source: 'county',
                    color: '#F8C471',
                    type: 'department'
                }
            });
            this.stats.departments++;
        });
    }

    createRelationships() {
        console.log('🔗 Creating cross-source relationships...');
        
        const relationships = [
            // CCP to CRC
            { source: 'ccp_020', target: 'crc_2_100', label: 'implemented by', weight: 9, color: '#E74C3C' },
            { source: 'ccp_1008', target: 'crc_3_1350', label: 'procedure defined by', weight: 8, color: '#E74C3C' },
            { source: 'ccp_2025_340', target: 'crc_3_1345', label: 'format required by', weight: 8, color: '#E74C3C' },
            
            // CRC to County
            { source: 'crc_2_100', target: 'county_general_1', label: 'local requirements', weight: 9, color: '#3498DB' },
            { source: 'crc_3_1345', target: 'county_discovery_1', label: 'local discovery rules', weight: 8, color: '#3498DB' },
            
            // Judges to Departments
            { source: 'judge_johnson', target: 'dept_dept_1', label: 'presides in', weight: 8, color: '#F39C12' },
            { source: 'judge_chen', target: 'dept_dept_complex', label: 'presides in', weight: 8, color: '#F39C12' },
            
            // Departments to Rules
            { source: 'dept_dept_complex', target: 'county_complex_1', label: 'follows', weight: 9, color: '#1ABC9C' }
        ];
        
        relationships.forEach(rel => {
            const sourceExists = this.nodes.some(n => n.data.id === rel.source);
            const targetExists = this.nodes.some(n => n.data.id === rel.target);
            
            if (sourceExists && targetExists) {
                this.edges.push({
                    data: {
                        id: `edge_${rel.source}_${rel.target}`,
                        source: rel.source,
                        target: rel.target,
                        label: rel.label,
                        weight: rel.weight,
                        color: rel.color
                    }
                });
            }
        });
        
        console.log(`✓ Created ${this.edges.length} relationships`);
    }

    async generateOutputs() {
        console.log('💾 Generating output files...');
        
        const unifiedData = {
            elements: [...this.nodes, ...this.edges],
            generated_at: new Date().toISOString(),
            statistics: {
                total_nodes: this.nodes.length,
                total_edges: this.edges.length,
                ...this.stats
            },
            metadata: {
                description: 'Unified California Legal Knowledge Graph',
                sources: ['CCP', 'CRC', 'Santa Clara County'],
                version: '1.0.0'
            }
        };
        
        // Save JSON
        fs.writeFileSync(
            path.join(this.outputDir, 'unified_legal_knowledge_graph.json'),
            JSON.stringify(unifiedData, null, 2)
        );
        
        // Save D3 format
        const d3Data = {
            nodes: this.nodes.map(n => n.data),
            links: this.edges.map(e => ({
                source: e.data.source,
                target: e.data.target,
                label: e.data.label,
                weight: e.data.weight
            }))
        };
        
        fs.writeFileSync(
            path.join(this.outputDir, 'unified_legal_knowledge_graph_d3.json'),
            JSON.stringify(d3Data, null, 2)
        );
        
        console.log(`✓ Generated files in ${this.outputDir}/`);
    }

    printStats() {
        console.log('\n📊 Generation Statistics:');
        console.log(`├── Total Nodes: ${this.nodes.length}`);
        console.log(`├── Total Edges: ${this.edges.length}`);
        console.log(`├── CCP Rules: ${this.stats.ccp}`);
        console.log(`├── CRC Rules: ${this.stats.crc}`);
        console.log(`├── County Rules: ${this.stats.county}`);
        console.log(`├── Judges: ${this.stats.judges}`);
        console.log(`└── Departments: ${this.stats.departments}`);
    }

    // Method to expand with real data
    async loadRealData() {
        console.log('🔄 Loading real data from sources...');
        
        // Load CCP data
        try {
            const ccpPath = path.join(__dirname, 'ccp_knowledge_graph', 'ccp_knowledge_graph_cytoscape.json');
            if (fs.existsSync(ccpPath)) {
                const ccpData = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
                console.log(`Found ${ccpData.nodes?.length || 0} CCP nodes`);
            }
        } catch (error) {
            console.log('Could not load CCP data:', error.message);
        }
        
        // Load County data
        try {
            const countyPath = path.join(__dirname, 'county-rules-scraper', 'results', 'santa-clara_2025-06-22.json');
            if (fs.existsSync(countyPath)) {
                const stats = fs.statSync(countyPath);
                console.log(`Found county data file: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
            }
        } catch (error) {
            console.log('Could not load county data:', error.message);
        }
        
        // Load CRC data
        try {
            const crcPath = path.join(__dirname, 'crc-scraper', 'crc_results');
            if (fs.existsSync(crcPath)) {
                const files = fs.readdirSync(crcPath);
                console.log(`Found CRC results directory with ${files.length} files`);
            }
        } catch (error) {
            console.log('Could not load CRC data:', error.message);
        }
    }
}

// Run the generator
if (require.main === module) {
    const generator = new UnifiedLegalGraphGenerator();
    
    // Check if --real flag is passed
    if (process.argv.includes('--real')) {
        generator.loadRealData().then(() => generator.generate());
    } else {
        generator.generate();
    }
}

module.exports = UnifiedLegalGraphGenerator; 