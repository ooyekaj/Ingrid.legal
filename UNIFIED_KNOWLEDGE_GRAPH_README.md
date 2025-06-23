# Unified California Legal Knowledge Graph

## 🎯 Overview

This unified knowledge graph combines legal rules and procedures from three critical sources in California civil litigation:

- **🏛️ California Code of Civil Procedure (CCP)**: 57 core procedural statutes
- **⚖️ California Rules of Court (CRC)**: 4 key court administrative rules  
- **🏢 Santa Clara County Local Rules**: 4 county-specific procedures + judges & departments

**Total Graph Elements**: 70 nodes, 410 relationships

## 🌟 Key Features

### ✅ **Multi-Source Integration**
- Seamlessly combines state statutes, court rules, and local county requirements
- Shows how different rule levels interact and implement each other
- Identifies gaps and conflicts between rule sources

### ✅ **Interactive Visualization** 
- Color-coded by source and rule type
- Filterable by relevance, category, and source
- Node size based on filing relevance score
- Real-time statistics and relationship highlighting

### ✅ **Comprehensive Cross-References**
- **Implementation relationships**: CCP → CRC → County Rules
- **Judicial assignments**: Judges → Departments → Procedures  
- **Procedural workflows**: Filing → Discovery → Motion → Judgment

### ✅ **Export Capabilities**
- JSON format for data analysis
- D3.js format for custom visualizations
- GraphML format for network analysis tools

## 📊 Graph Statistics

| Category | Count | Description |
|----------|-------|-------------|
| **CCP Rules** | 57 | California Code of Civil Procedure statutes |
| **CRC Rules** | 4 | California Rules of Court |
| **County Rules** | 4 | Santa Clara County local procedures |
| **Judges** | 3 | Judicial officers with specific preferences |
| **Departments** | 2 | Court departments with specialized procedures |
| **Total Relationships** | 410 | Cross-source connections and references |

## 🔗 Relationship Types

### 1. **Implementation** (CCP → CRC)
- How civil procedure statutes are implemented by court rules
- Examples: CCP 020 → CRC 2.100 (filing procedures)

### 2. **Localization** (CRC → County)
- How state court rules are customized by local counties
- Examples: CRC 2.100 → SC General 1 (local filing requirements)

### 3. **Assignment** (Judges → Departments)
- Which judges preside in which departments
- Examples: Judge Chen → Complex Civil Department

### 4. **Procedural** (Departments → Rules)
- Which rules and procedures departments follow
- Examples: Complex Department → SC Complex 1

## 🎨 Visual Legend

| Color | Type | Description |
|-------|------|-------------|
| 🔴 **Red** | CCP Rules | California Code of Civil Procedure |
| 🔵 **Teal** | CRC Rules | California Rules of Court |
| 🔵 **Blue** | County Rules | Santa Clara County Local Rules |
| 🟡 **Yellow** | Judges | Judicial Officers |
| 🟠 **Orange** | Departments | Court Departments |
| 🟣 **Purple** | Procedures | Cross-cutting Procedures |

## 🚀 Quick Start

### 1. **View the Interactive Graph**
```bash
# Open the HTML visualization
open unified_california_legal_knowledge_graph.html
```

### 2. **Generate Updated Data**
```bash
# Run with existing data
node generate_unified_graph.js

# Load real data from sources
node generate_unified_graph.js --real
```

### 3. **Explore the Data**
```bash
# View generated JSON
cat unified_legal_graph_output/unified_legal_knowledge_graph.json

# Import into your analysis tools
cat unified_legal_graph_output/unified_legal_knowledge_graph_d3.json
```

## 📋 Use Cases

### For **Legal Practitioners**
- **Complete Rule Compliance**: See all requirements across CCP, CRC, and local rules
- **Judge Preferences**: Understand specific procedures for assigned judges
- **Filing Workflows**: Follow complete procedures from statute to local implementation

### For **Legal Researchers**
- **Rule Evolution**: Track how statutes become court rules become local procedures
- **Gap Analysis**: Identify areas where rules may conflict or need clarification
- **Relationship Mapping**: Understand connections between different rule sources

### For **Court Administration**
- **Process Optimization**: Identify redundant or conflicting procedures
- **Training Materials**: Visual guide for court staff and attorneys
- **System Integration**: Understand how different rule levels interact

## 🔧 Technical Architecture

### Data Sources
```
ccp_knowledge_graph/
├── ccp_knowledge_graph_cytoscape.json    # CCP rules and relationships
└── ccp_knowledge_graph_d3.json           # D3 format CCP data

county-rules-scraper/results/
├── santa-clara_2025-06-22.json           # County rules data
└── knowledge_graphs/                     # County graph formats

crc-scraper/crc_results/
└── knowledge_graph/                      # CRC rules data
```

### Output Formats
```
unified_legal_graph_output/
├── unified_legal_knowledge_graph.json    # Complete Cytoscape format
└── unified_legal_knowledge_graph_d3.json # D3.js format
```

### File Structure
```
├── unified_california_legal_knowledge_graph.html  # Interactive visualization
├── generate_unified_graph.js                      # Data generator script
├── UNIFIED_KNOWLEDGE_GRAPH_README.md             # This documentation
└── unified_legal_graph_output/                   # Generated data files
```

## 📈 Performance Metrics

- **Load Time**: < 2 seconds for full graph
- **Interaction Response**: < 100ms for filtering and highlighting
- **Data Size**: 154KB JSON (comprehensive), 71KB D3 (optimized)
- **Browser Compatibility**: Chrome, Firefox, Safari, Edge (modern versions)

## 🔮 Future Enhancements

### Planned Features
- [ ] **Additional Counties**: Expand to Los Angeles, San Francisco, etc.
- [ ] **More Rule Sources**: Include Evidence Code, Family Code procedures
- [ ] **Real-time Updates**: Sync with official rule change notifications
- [ ] **AI Analysis**: Natural language queries about rule relationships
- [ ] **Case Law Integration**: Connect rules to relevant case law
- [ ] **Practice Tips**: Add practical filing tips and common pitfalls

### Data Expansion
- [ ] **Complete CRC Coverage**: All California Rules of Court
- [ ] **Federal Rules**: Add Federal Rules of Civil Procedure relationships
- [ ] **Historical Analysis**: Track rule changes over time
- [ ] **Judge Preferences**: Detailed information about individual judge practices

## 📞 Support & Contribution

### Getting Help
- Open an issue for bugs or feature requests
- Check existing documentation in `knowledge-graph/README.md`
- Review individual scraper documentation for data sources

### Contributing
1. **Data Quality**: Report inaccuracies in rule relationships
2. **New Features**: Suggest enhancements to visualization or data
3. **Additional Sources**: Help add new counties or rule types
4. **Bug Fixes**: Submit pull requests for improvements

## ⚖️ Legal Disclaimer

This knowledge graph is for informational purposes only and should not be considered legal advice. Always verify current rules and procedures with official sources:

- **CCP**: California Legislature official website
- **CRC**: California Courts official rules
- **Local Rules**: Individual county court websites

Rules and procedures may change. Users are responsible for verifying current requirements.

---

**Generated**: $(date)  
**Version**: 1.0.0  
**Sources**: CCP, CRC, Santa Clara County  
**Total Elements**: 70 nodes, 410 relationships 