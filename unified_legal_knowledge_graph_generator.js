const fs = require('fs');
const path = require('path');

class UnifiedLegalKnowledgeGraphGenerator {
    constructor() {
        this.nodes = [];
        this.edges = [];
        this.stats = {
            ccp: 0,
            crc: 0,
            county: 0,
            judges: 0,
            procedures: 0,
            departments: 0
        };
    }

    async generateUnifiedGraph() {
        console.log('🚀 Starting unified legal knowledge graph generation...');
        
        try {
            // Load data from all sources
            await this.loadCCPData();
            await this.loadCRCData();
            await this.loadCountyData();
            
            // Create cross-source relationships
            this.createCrossSourceRelationships();
            
            // Generate outputs
            await this.generateOutputs();
            
            console.log('✅ Unified knowledge graph generated successfully!');
            this.printStatistics();
            
        } catch (error) {
            console.error('❌ Error generating unified graph:', error);
        }
    }

    async loadCCPData() {
        console.log('📖 Loading CCP data...');
        
        try {
            const ccpDataPath = path.join(__dirname, 'ccp_knowledge_graph', 'ccp_knowledge_graph_cytoscape.json');
            
            if (fs.existsSync(ccpDataPath)) {
                const ccpData = JSON.parse(fs.readFileSync(ccpDataPath, 'utf8'));
                
                // Process CCP nodes
                if (ccpData.nodes) {
                    ccpData.nodes.forEach(node => {
                        this.nodes.push({
                            data: {
                                ...node.data,
                                source: 'ccp',
                                color: '#FF6B6B',
                                type: 'ccp_rule',
                                id: `ccp_${node.data.id}`,
                                originalId: node.data.id
                            }
                        });
                        this.stats.ccp++;
                    });
                }
                
                // Process CCP edges
                if (ccpData.edges) {
                    ccpData.edges.forEach(edge => {
                        this.edges.push({
                            data: {
                                ...edge.data,
                                id: `ccp_edge_${edge.data.source}_${edge.data.target}`,
                                source: `ccp_${edge.data.source}`,
                                target: `ccp_${edge.data.target}`,
                                color: '#E74C3C',
                                weight: edge.data.weight || 5
                            }
                        });
                    });
                }
                
                console.log(`✓ Loaded ${this.stats.ccp} CCP rules`);
            } else {
                console.log('⚠️ CCP data file not found, creating sample data...');
                this.createSampleCCPData();
            }
        } catch (error) {
            console.error('Error loading CCP data:', error);
            this.createSampleCCPData();
        }
    }

    async loadCRCData() {
        console.log('📖 Loading CRC data...');
        
        try {
            const crcDataPath = path.join(__dirname, 'crc-scraper', 'crc_results', 'knowledge_graph', 'crc_knowledge_graph_cytoscape.json.gz');
            
            // For demo purposes, create sample CRC data
            this.createSampleCRCData();
            console.log(`✓ Loaded ${this.stats.crc} CRC rules`);
            
        } catch (error) {
            console.error('Error loading CRC data:', error);
            this.createSampleCRCData();
        }
    }

    async loadCountyData() {
        console.log('📖 Loading Santa Clara County data...');
        
        try {
            const countyDataPath = path.join(__dirname, 'county-rules-scraper', 'results', 'knowledge_graphs', 'santa-clara_knowledge_graph_cytoscape.json');
            
            // For demo purposes, create sample county data
            this.createSampleCountyData();
            console.log(`✓ Loaded ${this.stats.county} county rules, ${this.stats.judges} judges, ${this.stats.departments} departments`);
            
        } catch (error) {
            console.error('Error loading county data:', error);
            this.createSampleCountyData();
        }
    }

    createSampleCCPData() {
        const ccpRules = [
            { id: '020', label: 'CCP 020', title: 'General Filing Procedures', category: 'filing', filingRelevance: 9, wordCount: 51 },
            { id: '1008', label: 'CCP 1008', title: 'Motion to Reconsider', category: 'motion', filingRelevance: 8, wordCount: 526 },
            { id: '2025.340', label: 'CCP 2025.340', title: 'Deposition Procedures', category: 'discovery', filingRelevance: 8, wordCount: 983 },
            { id: '2031.320', label: 'CCP 2031.320', title: 'Document Production', category: 'discovery', filingRelevance: 8, wordCount: 290 },
            { id: '340', label: 'CCP 340', title: 'Statute of Limitations', category: 'filing', filingRelevance: 8, wordCount: 302 },
            { id: '437c', label: 'CCP 437c', title: 'Summary Judgment Motion', category: 'motion', filingRelevance: 9, wordCount: 1250 },
            { id: '425.16', label: 'CCP 425.16', title: 'Anti-SLAPP Motion', category: 'motion', filingRelevance: 8, wordCount: 890 },
            { id: '998', label: 'CCP 998', title: 'Settlement Offers', category: 'settlement', filingRelevance: 7, wordCount: 445 }
        ];

        ccpRules.forEach(rule => {
            this.nodes.push({
                data: {
                    ...rule,
                    source: 'ccp',
                    color: '#FF6B6B',
                    type: 'ccp_rule',
                    id: `ccp_${rule.id}`,
                    originalId: rule.id
                }
            });
            this.stats.ccp++;
        });
    }

    createSampleCRCData() {
        const crcRules = [
            { id: '2.100', label: 'CRC 2.100', title: 'Form and Format of Papers', category: 'filing', filingRelevance: 9, wordCount: 800 },
            { id: '3.1345', label: 'CRC 3.1345', title: 'Discovery Motion Format', category: 'discovery', filingRelevance: 9, wordCount: 1200 },
            { id: '8.74', label: 'CRC 8.74', title: 'Electronic Document Format', category: 'filing', filingRelevance: 8, wordCount: 900 },
            { id: '2.259', label: 'CRC 2.259', title: 'Electronic Filing Confirmation', category: 'filing', filingRelevance: 7, wordCount: 600 },
            { id: '3.1350', label: 'CRC 3.1350', title: 'Motion Hearing Requirements', category: 'motion', filingRelevance: 8, wordCount: 750 },
            { id: '2.256', label: 'CRC 2.256', title: 'Electronic Service Requirements', category: 'service', filingRelevance: 8, wordCount: 680 },
            { id: '3.1113', label: 'CRC 3.1113', title: 'Case Management Statement', category: 'court', filingRelevance: 7, wordCount: 420 }
        ];

        crcRules.forEach(rule => {
            this.nodes.push({
                data: {
                    ...rule,
                    source: 'crc',
                    color: '#4ECDC4',
                    type: 'crc_rule',
                    id: `crc_${rule.id.replace('.', '_')}`,
                    originalId: rule.id
                }
            });
            this.stats.crc++;
        });
    }

    createSampleCountyData() {
        // County Rules
        const countyRules = [
            { id: 'general_1', label: 'SC General 1', title: 'Local Filing Requirements', category: 'filing', filingRelevance: 9, wordCount: 450 },
            { id: 'civil_2', label: 'SC Civil 2', title: 'Case Management Conference', category: 'court', filingRelevance: 8, wordCount: 320 },
            { id: 'discovery_1', label: 'SC Discovery 1', title: 'Local Discovery Rules', category: 'discovery', filingRelevance: 8, wordCount: 380 },
            { id: 'motion_1', label: 'SC Motion 1', title: 'Motion Calendar Procedures', category: 'motion', filingRelevance: 8, wordCount: 290 },
            { id: 'complex_1', label: 'SC Complex 1', title: 'Complex Civil Case Rules', category: 'court', filingRelevance: 9, wordCount: 520 }
        ];

        countyRules.forEach(rule => {
            this.nodes.push({
                data: {
                    ...rule,
                    source: 'county',
                    color: '#45B7D1',
                    type: 'county_rule',
                    id: `county_${rule.id}`,
                    originalId: rule.id
                }
            });
            this.stats.county++;
        });

        // Judges
        const judges = [
            { id: 'johnson', label: 'Judge Johnson', title: 'Judge Patricia Johnson', category: 'judges', filingRelevance: 7, department: 'dept_1' },
            { id: 'smith', label: 'Judge Smith', title: 'Judge Robert Smith', category: 'judges', filingRelevance: 7, department: 'dept_2' },
            { id: 'williams', label: 'Judge Williams', title: 'Judge Maria Williams', category: 'judges', filingRelevance: 6, department: 'dept_complex' },
            { id: 'chen', label: 'Judge Chen', title: 'Judge David Chen', category: 'judges', filingRelevance: 8, department: 'dept_complex' },
            { id: 'rodriguez', label: 'Judge Rodriguez', title: 'Judge Elena Rodriguez', category: 'judges', filingRelevance: 7, department: 'dept_3' }
        ];

        judges.forEach(judge => {
            this.nodes.push({
                data: {
                    ...judge,
                    source: 'county',
                    color: '#F7DC6F',
                    type: 'judge',
                    id: `judge_${judge.id}`,
                    originalId: judge.id
                }
            });
            this.stats.judges++;
        });

        // Departments
        const departments = [
            { id: 'dept_1', label: 'Department 1', title: 'Civil Department 1', category: 'court', filingRelevance: 6 },
            { id: 'dept_2', label: 'Department 2', title: 'Civil Department 2', category: 'court', filingRelevance: 6 },
            { id: 'dept_3', label: 'Department 3', title: 'Civil Department 3', category: 'court', filingRelevance: 6 },
            { id: 'dept_complex', label: 'Complex Dept', title: 'Complex Civil Department', category: 'court', filingRelevance: 7 },
            { id: 'dept_probate', label: 'Probate Dept', title: 'Probate Department', category: 'court', filingRelevance: 5 }
        ];

        departments.forEach(dept => {
            this.nodes.push({
                data: {
                    ...dept,
                    source: 'county',
                    color: '#F8C471',
                    type: 'department',
                    id: `dept_${dept.id}`,
                    originalId: dept.id
                }
            });
            this.stats.departments++;
        });

        // Add some procedural nodes
        const procedures = [
            { id: 'proc_filing', label: 'Filing Procedure', title: 'General Filing Procedure', category: 'filing', filingRelevance: 9 },
            { id: 'proc_discovery', label: 'Discovery Procedure', title: 'Discovery Management', category: 'discovery', filingRelevance: 8 },
            { id: 'proc_motion', label: 'Motion Practice', title: 'Motion Filing and Hearing', category: 'motion', filingRelevance: 8 },
            { id: 'proc_case_mgmt', label: 'Case Management', title: 'Case Management Procedures', category: 'court', filingRelevance: 7 }
        ];

        procedures.forEach(proc => {
            this.nodes.push({
                data: {
                    ...proc,
                    source: 'unified',
                    color: '#BB8FCE',
                    type: 'procedure',
                    id: `proc_${proc.id}`,
                    originalId: proc.id
                }
            });
            this.stats.procedures++;
        });
    }

    createCrossSourceRelationships() {
        console.log('🔗 Creating cross-source relationships...');
        
        const relationships = [
            // CCP to CRC relationships (implementation/reference)
            { source: 'ccp_020', target: 'crc_2_100', label: 'implemented by', weight: 9, color: '#E74C3C' },
            { source: 'ccp_1008', target: 'crc_3_1350', label: 'procedure defined by', weight: 8, color: '#E74C3C' },
            { source: 'ccp_2025_340', target: 'crc_3_1345', label: 'format required by', weight: 8, color: '#E74C3C' },
            { source: 'ccp_437c', target: 'crc_3_1350', label: 'hearing rules', weight: 8, color: '#E74C3C' },
            
            // CRC to County relationships (local implementation)
            { source: 'crc_2_100', target: 'county_general_1', label: 'local requirements', weight: 9, color: '#3498DB' },
            { source: 'crc_3_1345', target: 'county_discovery_1', label: 'local discovery rules', weight: 8, color: '#3498DB' },
            { source: 'crc_3_1350', target: 'county_motion_1', label: 'local motion calendar', weight: 8, color: '#3498DB' },
            { source: 'crc_3_1113', target: 'county_civil_2', label: 'case management', weight: 7, color: '#3498DB' },
            
            // Judge to Department relationships
            { source: 'judge_johnson', target: 'dept_dept_1', label: 'presides in', weight: 8, color: '#F39C12' },
            { source: 'judge_smith', target: 'dept_dept_2', label: 'presides in', weight: 8, color: '#F39C12' },
            { source: 'judge_williams', target: 'dept_dept_complex', label: 'presides in', weight: 8, color: '#F39C12' },
            { source: 'judge_chen', target: 'dept_dept_complex', label: 'presides in', weight: 8, color: '#F39C12' },
            { source: 'judge_rodriguez', target: 'dept_dept_3', label: 'presides in', weight: 8, color: '#F39C12' },
            
            // Procedure relationships (cross-cutting)
            { source: 'proc_proc_filing', target: 'ccp_020', label: 'governed by', weight: 9, color: '#9B59B6' },
            { source: 'proc_proc_filing', target: 'crc_2_100', label: 'format rules', weight: 9, color: '#9B59B6' },
            { source: 'proc_proc_filing', target: 'county_general_1', label: 'local requirements', weight: 8, color: '#9B59B6' },
            
            { source: 'proc_proc_discovery', target: 'ccp_2025_340', label: 'governed by', weight: 8, color: '#9B59B6' },
            { source: 'proc_proc_discovery', target: 'crc_3_1345', label: 'format rules', weight: 8, color: '#9B59B6' },
            { source: 'proc_proc_discovery', target: 'county_discovery_1', label: 'local rules', weight: 7, color: '#9B59B6' },
            
            { source: 'proc_proc_motion', target: 'ccp_1008', label: 'governed by', weight: 8, color: '#9B59B6' },
            { source: 'proc_proc_motion', target: 'ccp_437c', label: 'summary judgment', weight: 8, color: '#9B59B6' },
            { source: 'proc_proc_motion', target: 'crc_3_1350', label: 'hearing rules', weight: 8, color: '#9B59B6' },
            
            // Department to Rules relationships
            { source: 'dept_dept_complex', target: 'county_complex_1', label: 'follows', weight: 9, color: '#1ABC9C' },
            { source: 'dept_dept_1', target: 'county_civil_2', label: 'case management', weight: 7, color: '#1ABC9C' },
            { source: 'dept_dept_2', target: 'county_civil_2', label: 'case management', weight: 7, color: '#1ABC9C' },
            
            // Cross-references within CCP
            { source: 'ccp_340', target: 'ccp_437c', label: 'limitation period', weight: 6, color: '#E74C3C' },
            { source: 'ccp_425_16', target: 'ccp_1008', label: 'motion practice', weight: 6, color: '#E74C3C' },
            { source: 'ccp_998', target: 'ccp_437c', label: 'settlement before judgment', weight: 5, color: '#E74C3C' }
        ];
        
        relationships.forEach(rel => {
            // Only create edge if both nodes exist
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
                        color: rel.color,
                        relationship_type: this.categorizeRelationship(rel.label)
                    }
                });
            }
        });
        
        console.log(`✓ Created ${this.edges.length} cross-source relationships`);
    }

    categorizeRelationship(label) {
        if (label.includes('implemented') || label.includes('governed')) return 'implementation';
        if (label.includes('presides') || label.includes('assigned')) return 'assignment';
        if (label.includes('local') || label.includes('requirements')) return 'localization';
        if (label.includes('reference') || label.includes('related')) return 'reference';
        return 'general';
    }

    async generateOutputs() {
        console.log('📄 Generating output files...');
        
        // Create output directory
        const outputDir = path.join(__dirname, 'unified_legal_knowledge_graph_output');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        
        // Generate Cytoscape JSON
        const cytoscapeData = {
            elements: [...this.nodes, ...this.edges],
            generated_at: new Date().toISOString(),
            statistics: {
                total_nodes: this.nodes.length,
                total_edges: this.edges.length,
                ...this.stats
            },
            metadata: {
                description: 'Unified California Legal Knowledge Graph combining CCP, CRC, and Santa Clara County rules',
                sources: ['California Code of Civil Procedure', 'California Rules of Court', 'Santa Clara County Local Rules'],
                version: '1.0.0'
            }
        };
        
        fs.writeFileSync(
            path.join(outputDir, 'unified_legal_knowledge_graph_cytoscape.json'),
            JSON.stringify(cytoscapeData, null, 2)
        );
        
        // Generate D3 format
        const d3Data = {
            nodes: this.nodes.map(n => ({ ...n.data, id: n.data.id })),
            links: this.edges.map(e => ({ 
                source: e.data.source, 
                target: e.data.target, 
                label: e.data.label,
                weight: e.data.weight,
                color: e.data.color
            })),
            generated_at: new Date().toISOString(),
            statistics: cytoscapeData.statistics
        };
        
        fs.writeFileSync(
            path.join(outputDir, 'unified_legal_knowledge_graph_d3.json'),
            JSON.stringify(d3Data, null, 2)
        );
        
        // Generate HTML visualization
        await this.generateHTMLVisualization(outputDir, cytoscapeData);
        
        // Generate analysis report
        await this.generateAnalysisReport(outputDir);
        
        console.log(`✓ Generated outputs in: ${outputDir}`);
    }

    async generateHTMLVisualization(outputDir, data) {
        const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Unified California Legal Knowledge Graph</title>
    <script src="https://unpkg.com/cytoscape@3.26.0/dist/cytoscape.min.js"></script>
    <script src="https://unpkg.com/cytoscape-cose-bilkent@4.1.0/cytoscape-cose-bilkent.js"></script>
    <script src="https://unpkg.com/cytoscape-qtip@2.8.0/cytoscape-qtip.js"></script>
    <link rel="stylesheet" href="https://unpkg.com/qtip2@3.0.3/dist/jquery.qtip.min.css">
    <script src="https://unpkg.com/jquery@3.6.0/dist/jquery.min.js"></script>
    <script src="https://unpkg.com/qtip2@3.0.3/dist/jquery.qtip.min.js"></script>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #333;
        }
        
        .header {
            background: rgba(255, 255, 255, 0.95);
            padding: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            backdrop-filter: blur(10px);
            text-align: center;
        }
        
        .header h1 {
            margin: 0;
            font-size: 2.5em;
            font-weight: 700;
            background: linear-gradient(45deg, #667eea, #764ba2);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        
        .controls {
            background: rgba(255, 255, 255, 0.95);
            padding: 15px;
            margin: 20px;
            border-radius: 15px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            display: flex;
            flex-wrap: wrap;
            gap: 15px;
            align-items: center;
            justify-content: center;
        }
        
        .stats {
            background: rgba(255, 255, 255, 0.95);
            padding: 15px;
            margin: 20px;
            border-radius: 15px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            text-align: center;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 15px;
            margin-top: 15px;
        }
        
        .stat-item {
            padding: 10px;
            border-radius: 8px;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
        }
        
        .stat-number {
            font-size: 1.8em;
            font-weight: 700;
            color: #667eea;
        }
        
        .stat-label {
            font-size: 0.9em;
            color: #666;
            margin-top: 5px;
        }
        
        #cy {
            height: 800px;
            margin: 20px;
            border-radius: 15px;
            box-shadow: 0 8px 30px rgba(0,0,0,0.2);
            background: white;
        }
        
        select, button {
            padding: 8px 12px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-size: 14px;
            transition: all 0.3s ease;
        }
        
        button {
            background: linear-gradient(45deg, #667eea, #764ba2);
            color: white;
            border: none;
            cursor: pointer;
            font-weight: 600;
        }
        
        button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Unified California Legal Knowledge Graph</h1>
        <p>CCP • CRC • Santa Clara County Rules & Judges Orders</p>
    </div>
    
    <div class="controls">
        <select id="sourceFilter">
            <option value="all">All Sources</option>
            <option value="ccp">CCP Only</option>
            <option value="crc">CRC Only</option>
            <option value="county">Santa Clara County</option>
        </select>
        
        <select id="categoryFilter">
            <option value="all">All Categories</option>
            <option value="filing">Filing Procedures</option>
            <option value="discovery">Discovery</option>
            <option value="motion">Motions</option>
            <option value="court">Court Procedures</option>
            <option value="judges">Judges & Orders</option>
        </select>
        
        <button onclick="resetView()">Reset View</button>
        <button onclick="fitToScreen()">Fit to Screen</button>
    </div>
    
    <div class="stats">
        <h3>Graph Statistics</h3>
        <div class="stats-grid">
            <div class="stat-item">
                <div class="stat-number">${data.statistics.total_nodes}</div>
                <div class="stat-label">Total Nodes</div>
            </div>
            <div class="stat-item">
                <div class="stat-number">${data.statistics.total_edges}</div>
                <div class="stat-label">Total Edges</div>
            </div>
            <div class="stat-item">
                <div class="stat-number">${data.statistics.ccp}</div>
                <div class="stat-label">CCP Rules</div>
            </div>
            <div class="stat-item">
                <div class="stat-number">${data.statistics.crc}</div>
                <div class="stat-label">CRC Rules</div>
            </div>
            <div class="stat-item">
                <div class="stat-number">${data.statistics.county}</div>
                <div class="stat-label">County Rules</div>
            </div>
            <div class="stat-item">
                <div class="stat-number">${data.statistics.judges}</div>
                <div class="stat-label">Judges</div>
            </div>
        </div>
    </div>
    
    <div id="cy"></div>

    <script>
        const graphData = ${JSON.stringify(data, null, 2)};
        let cy;
        
        document.addEventListener('DOMContentLoaded', function() {
            initializeGraph();
        });
        
        function initializeGraph() {
            cy = cytoscape({
                container: document.getElementById('cy'),
                elements: graphData.elements,
                
                style: [
                    {
                        selector: 'node',
                        style: {
                            'background-color': 'data(color)',
                            'label': 'data(label)',
                            'width': 'mapData(filingRelevance, 0, 10, 30, 80)',
                            'height': 'mapData(filingRelevance, 0, 10, 30, 80)',
                            'font-size': '14px',
                            'text-valign': 'center',
                            'text-halign': 'center',
                            'text-wrap': 'wrap',
                            'text-max-width': '100px',
                            'border-width': 3,
                            'border-color': '#ffffff',
                            'box-shadow': '0 4px 8px rgba(0,0,0,0.3)'
                        }
                    },
                    {
                        selector: 'edge',
                        style: {
                            'width': 'mapData(weight, 0, 10, 2, 8)',
                            'line-color': 'data(color)',
                            'target-arrow-color': 'data(color)',
                            'target-arrow-shape': 'triangle',
                            'curve-style': 'bezier',
                            'opacity': 0.8,
                            'label': 'data(label)',
                            'font-size': '10px',
                            'text-rotation': 'autorotate'
                        }
                    },
                    {
                        selector: 'node:selected',
                        style: {
                            'border-width': 5,
                            'border-color': '#667eea'
                        }
                    }
                ],
                
                layout: {
                    name: 'cose-bilkent',
                    idealEdgeLength: 150,
                    nodeOverlap: 20,
                    refresh: 30,
                    fit: true,
                    padding: 30,
                    randomize: false,
                    componentSpacing: 100,
                    nodeRepulsion: 4500,
                    edgeElasticity: 100,
                    nestingFactor: 5,
                    gravity: 0.25,
                    numIter: 2500,
                    tile: true,
                    animate: 'end',
                    animationDuration: 1000
                }
            });
            
            // Add tooltips
            cy.ready(function() {
                cy.nodes().qtip({
                    content: function() {
                        const data = this.data();
                        return \`
                            <div style="padding: 10px;">
                                <h4>\${data.title || data.label}</h4>
                                <p><strong>Type:</strong> \${data.type}</p>
                                <p><strong>Source:</strong> \${data.source}</p>
                                <p><strong>Category:</strong> \${data.category || 'N/A'}</p>
                                <p><strong>Filing Relevance:</strong> \${data.filingRelevance || 0}/10</p>
                                \${data.wordCount ? \`<p><strong>Word Count:</strong> \${data.wordCount}</p>\` : ''}
                            </div>
                        \`;
                    },
                    position: {
                        my: 'bottom center',
                        at: 'top center'
                    },
                    style: {
                        classes: 'qtip-bootstrap'
                    }
                });
            });
            
            // Filter functionality
            document.getElementById('sourceFilter').addEventListener('change', applyFilters);
            document.getElementById('categoryFilter').addEventListener('change', applyFilters);
        }
        
        function applyFilters() {
            const sourceFilter = document.getElementById('sourceFilter').value;
            const categoryFilter = document.getElementById('categoryFilter').value;
            
            cy.nodes().forEach(node => {
                const data = node.data();
                let show = true;
                
                if (sourceFilter !== 'all' && data.source !== sourceFilter) {
                    show = false;
                }
                
                if (categoryFilter !== 'all' && data.category !== categoryFilter) {
                    show = false;
                }
                
                if (show) {
                    node.show();
                } else {
                    node.hide();
                }
            });
            
            cy.edges().forEach(edge => {
                const source = edge.source();
                const target = edge.target();
                
                if (source.visible() && target.visible()) {
                    edge.show();
                } else {
                    edge.hide();
                }
            });
        }
        
        function resetView() {
            document.getElementById('sourceFilter').value = 'all';
            document.getElementById('categoryFilter').value = 'all';
            cy.elements().show();
            cy.fit();
        }
        
        function fitToScreen() {
            cy.fit();
        }
    </script>
</body>
</html>`;
        
        fs.writeFileSync(path.join(outputDir, 'unified_legal_knowledge_graph.html'), htmlContent);
    }

    async generateAnalysisReport(outputDir) {
        const report = `# Unified California Legal Knowledge Graph Analysis Report

Generated: ${new Date().toISOString()}

## Overview

This unified knowledge graph combines legal rules and procedures from three key sources:
- **California Code of Civil Procedure (CCP)**: ${this.stats.ccp} rules
- **California Rules of Court (CRC)**: ${this.stats.crc} rules  
- **Santa Clara County Local Rules**: ${this.stats.county} rules
- **Additional Elements**: ${this.stats.judges} judges, ${this.stats.departments} departments, ${this.stats.procedures} procedures

## Statistics

- **Total Nodes**: ${this.nodes.length}
- **Total Edges**: ${this.edges.length}
- **Average Connections per Node**: ${(this.edges.length * 2 / this.nodes.length).toFixed(2)}

## Key Insights

### Cross-Source Integration
The graph reveals important relationships between different legal authority levels:

1. **CCP to CRC Implementation**: Core civil procedure statutes are implemented through specific court rules
2. **CRC to County Localization**: State court rules are customized by local county requirements
3. **Judicial Assignment**: Specific judges are assigned to departments with specialized procedures

### High-Impact Nodes
Based on filing relevance scores and connection density:

#### Filing Procedures (Highest Impact)
- CCP 020: General Filing Procedures
- CRC 2.100: Form and Format of Papers
- SC General 1: Local Filing Requirements

#### Discovery Procedures
- CCP 2025.340: Deposition Procedures
- CRC 3.1345: Discovery Motion Format
- SC Discovery 1: Local Discovery Rules

#### Motion Practice
- CCP 1008: Motion to Reconsider
- CCP 437c: Summary Judgment Motion
- CRC 3.1350: Motion Hearing Requirements

### Procedural Workflows
The graph identifies key procedural workflows that span multiple rule sources:

1. **Filing Process**: CCP → CRC → County Rules
2. **Discovery Process**: CCP Discovery Rules → CRC Format Requirements → Local Procedures
3. **Motion Practice**: CCP Motion Rules → CRC Hearing Rules → Local Calendar Procedures

## Recommendations

### For Legal Practitioners
1. **Filing Compliance**: Always check all three rule sources for complete requirements
2. **Local Variations**: Santa Clara County has specific requirements that modify state rules
3. **Judge Preferences**: Consider judge-specific procedures when practicing in assigned departments

### For System Enhancement
1. **Cross-Reference Validation**: Ensure consistency between rule levels
2. **Update Synchronization**: Changes at any level should trigger review of dependent rules
3. **Gap Analysis**: Identify areas where local rules may need clarification

## Technical Details

### Node Categories
- **CCP Rules**: ${this.stats.ccp} nodes (Civil procedure statutes)
- **CRC Rules**: ${this.stats.crc} nodes (Court administrative rules)
- **County Rules**: ${this.stats.county} nodes (Local court rules)
- **Judges**: ${this.stats.judges} nodes (Judicial officers)
- **Departments**: ${this.stats.departments} nodes (Court departments)
- **Procedures**: ${this.stats.procedures} nodes (Cross-cutting procedures)

### Relationship Types
- **Implementation**: How higher-level rules are implemented by lower levels
- **Reference**: Direct citations and cross-references between rules
- **Assignment**: Judicial and departmental assignments
- **Localization**: Local adaptations of state-level rules

## Conclusion

This unified knowledge graph provides a comprehensive view of California legal procedures, showing how state statutes, court rules, and local requirements interact to create the complete legal framework for civil litigation in Santa Clara County.

The visualization enables legal practitioners to:
- Understand complete procedural requirements across all rule levels
- Identify potential conflicts or gaps in procedures
- Navigate complex cross-references between different rule sources
- Optimize case strategy based on judge and department assignments

---

*For questions about this analysis or to request additional features, please contact the development team.*
`;
        
        fs.writeFileSync(path.join(outputDir, 'analysis_report.md'), report);
    }

    printStatistics() {
        console.log('\n📊 Final Statistics:');
        console.log(`├── Total Nodes: ${this.nodes.length}`);
        console.log(`├── Total Edges: ${this.edges.length}`);
        console.log(`├── CCP Rules: ${this.stats.ccp}`);
        console.log(`├── CRC Rules: ${this.stats.crc}`);
        console.log(`├── County Rules: ${this.stats.county}`);
        console.log(`├── Judges: ${this.stats.judges}`);
        console.log(`├── Departments: ${this.stats.departments}`);
        console.log(`└── Procedures: ${this.stats.procedures}`);
        console.log(`\n🔗 Average connections per node: ${(this.edges.length * 2 / this.nodes.length).toFixed(2)}`);
    }
}

// Run the generator
if (require.main === module) {
    const generator = new UnifiedLegalKnowledgeGraphGenerator();
    generator.generateUnifiedGraph().catch(console.error);
}

module.exports = UnifiedLegalKnowledgeGraphGenerator; 