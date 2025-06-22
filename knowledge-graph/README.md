# Unified Knowledge Graph System

A comprehensive system that connects California Code of Civil Procedure (CCP), California Rules of Court (CRC), and county-specific rules to provide unified filing requirement answers.

## Overview

This system solves the problem of fragmented legal information by creating a unified knowledge graph that can answer complex queries like:

> "What are the filing requirements for a motion for summary judgment in Santa Clara County for Judge Charles F. Adams in complex civil litigation?"

## Features

### 🔗 **Unified Knowledge Graph**
- Connects CCP statutes, CRC rules, and county-specific procedures
- Creates cross-references between related rules across different jurisdictions
- Maintains hierarchical relationships: State → Court → County → Judge

### 🎯 **Smart Query Processing**
- Natural language query parsing
- Automatic extraction of jurisdiction, case type, judge, and motion details
- Contextual rule matching based on query components

### 📊 **Multiple Output Formats**
- **Cytoscape**: Interactive graph visualization
- **D3**: Web-based graph rendering
- **GraphML**: Standard graph exchange format
- **JSON**: Structured data for applications

### ⚖️ **Comprehensive Answers**
- Applicable rules from all relevant jurisdictions
- Procedural step-by-step instructions
- Key deadlines and filing requirements
- Local variations and judge-specific procedures

## Installation

```bash
cd knowledge-graph
npm install
```

## Quick Start

### 1. Run the Demo

```bash
npm run demo
```

This will:
- Load existing CCP, CRC, and county knowledge graphs
- Create a unified graph with cross-system connections
- Demonstrate various filing requirement queries
- Generate a comprehensive filing guide

### 2. Run Tests

```bash
npm test
```

Verifies all system components work correctly.

## Usage Examples

### Basic Query

```javascript
const UnifiedKnowledgeGraphGenerator = require('./unified_knowledge_graph_generator');

const generator = new UnifiedKnowledgeGraphGenerator();

// Generate unified graph
const unifiedGraph = await generator.generateUnifiedGraph(
  './ccp_knowledge_graph/ccp_knowledge_graph_cytoscape.json',
  './crc-scraper/crc_results/knowledge_graph/crc_knowledge_graph_cytoscape.json.gz',
  './county-rules-scraper/results/knowledge_graphs'
);

// Answer a query
const answer = await generator.answerFilingQuery(
  "California, Santa Clara County, Complex Civil Litigation, Judge Charles F. Adams, Motion for summary judgment"
);

console.log(answer);
```

### Sample Answer Structure

```json
{
  "query_summary": "California, Santa Clara County, complex civil, Judge charles f. adams, motion for summary judgment",
  "applicable_rules": {
    "ccp": [
      {
        "rule": "CCP 437c",
        "title": "Summary Judgment Procedures",
        "category": "Motion Practice",
        "filing_relevance": 9,
        "procedural_requirements": 5
      }
    ],
    "crc": [
      {
        "rule": "Rule 3.1350",
        "title": "Motion for summary judgment or summary adjudication",
        "category": "Motion Practice",
        "filing_relevance": 9,
        "procedural_requirements": 4
      }
    ],
    "county": [
      {
        "rule": "Judge Adams Complex Civil Procedures",
        "county": "Santa Clara",
        "judge": "Charles F. Adams",
        "department": "Complex Civil",
        "filing_relevance": 8
      }
    ]
  },
  "filing_requirements": [
    {
      "rule": "CCP 437c",
      "source": "ccp",
      "requirement_count": 5,
      "filing_relevance": 9
    }
  ],
  "procedural_steps": [
    "Prepare motion papers (notice, separate statement, memorandum, evidence)",
    "Serve opposing parties at least 28 days before hearing (CCP 437c)",
    "File motion papers with court",
    "Check for tentative ruling if required by local rules",
    "Attend hearing if tentative ruling contested"
  ],
  "deadlines": [
    "28 days notice required",
    "16 court days for opposition"
  ],
  "local_variations": [
    "Judge-specific procedures: Judge Adams Complex Civil Procedures"
  ]
}
```

## Architecture

### Knowledge Graph Integration

```
CCP Rules (Statutes)
    ↓ implements
CRC Rules (Court Rules)
    ↓ applies_to_county  
County Rules (Local Rules)
    ↓ has_specific_rule
Judge Preferences
```

### Query Processing Flow

1. **Parse Query** → Extract components (state, county, judge, motion type)
2. **Find Relevant Rules** → Match against filing hierarchy
3. **Cross-Reference** → Connect related rules across systems
4. **Generate Answer** → Compile comprehensive response

### Filing Rule Hierarchy

The system understands relationships like:
- CCP 437c → CRC 3.1350 → County Summary Judgment Procedures
- CCP 1010.6 → CRC 2.256 → County E-Filing Requirements
- CCP 1005 → CRC 3.1300 → County Motion Practice Rules

## Supported Query Types

### Motion Types
- Motion for Summary Judgment
- Discovery Motions
- Ex Parte Motions
- Case Management Motions

### Case Types
- Complex Civil Litigation
- General Civil Cases
- Electronic Filing Cases

### Jurisdictional Levels
- **State**: California CCP and CRC rules
- **County**: Local court rules and procedures
- **Judge**: Individual judge preferences and practices
- **Department**: Specialized department procedures

## File Structure

```
knowledge-graph/
├── unified_knowledge_graph_generator.js  # Main generator class
├── demo_unified_query.js                 # Demonstration script
├── test_unified_system.js               # Test suite
├── package.json                         # Dependencies
├── README.md                           # This file
└── unified_knowledge_graph_output/     # Generated output
    ├── unified_knowledge_graph_cytoscape.json
    ├── unified_knowledge_graph_d3.json
    ├── unified_knowledge_graph.graphml
    ├── query_index.json
    └── filing_requirements_map.json
```

## Integration with Existing Systems

### CCP Knowledge Graph
- Located in `./ccp_knowledge_graph/`
- Contains California Code of Civil Procedure rules
- Structured with filing relevance and procedural requirements

### CRC Knowledge Graph
- Located in `./crc-scraper/crc_results/knowledge_graph/`
- Contains California Rules of Court
- Compressed format with detailed rule relationships

### County Knowledge Graphs
- Located in `./county-rules-scraper/results/knowledge_graphs/`
- Contains county-specific rules and judge information
- Includes department assignments and local procedures

## Benefits

### For Legal Practitioners
- **Comprehensive Coverage**: Never miss applicable rules
- **Hierarchical Clarity**: Understand rule relationships
- **Local Variations**: Account for county and judge specifics
- **Time Savings**: Get instant comprehensive answers

### For Legal Technology
- **Standardized API**: Consistent query interface
- **Multiple Formats**: Integration with various systems
- **Extensible**: Easy to add new counties and rules
- **Accurate**: Cross-validated against multiple sources

## Future Enhancements

- [ ] **Real-time Updates**: Sync with court websites for rule changes
- [ ] **Additional Counties**: Expand beyond Santa Clara County
- [ ] **Federal Rules**: Include federal court procedures
- [ ] **Natural Language AI**: Enhanced query understanding
- [ ] **Web Interface**: Browser-based query system
- [ ] **Mobile App**: Smartphone access for attorneys

## Contributing

1. **Add County Rules**: Use the county-rules-scraper to add new counties
2. **Update Cross-References**: Enhance rule relationships in the generator
3. **Expand Query Types**: Add support for new motion and case types
4. **Improve Parsing**: Enhance natural language understanding

## License

MIT License - See LICENSE file for details

## Support

For questions or issues:
- Review the test cases in `test_unified_system.js`
- Run the demo with `npm run demo`
- Check the generated output files for data format examples

---

*This system represents a significant advancement in legal technology by providing unified access to fragmented legal information across multiple jurisdictional levels.* 