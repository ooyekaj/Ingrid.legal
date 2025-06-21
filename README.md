# Ingrid Project - Reorganized Structure

A comprehensive legal document processing system focused on California CCP (Code of Civil Procedure) scraping and knowledge graph generation.

## 🏗️ Clean Project Structure

```
Ingrid/
├── ccp-scraper/                   # 🎯 Main CCP scraper project
│   ├── src/                       # Modular scraper components
│   │   ├── config/                # Configuration files
│   │   ├── scrapers/              # PDF downloaders, web scrapers, TOC extractors
│   │   ├── processors/            # Content processing logic
│   │   ├── filters/               # Section filtering and critical sections
│   │   └── utils/                 # Utilities, logging, file operations
│   ├── scripts/                   # Main execution scripts
│   ├── CCP/                       # Python PDF processing scripts
│   ├── test/                      # Test suites
│   ├── ccp_pdfs/                  # Downloaded PDF files
│   ├── ccp_results/               # Processing results
│   ├── hierarchial_scraper.js     # Legacy monolithic scraper
│   └── package.json               # Node.js dependencies
│
├── knowledge-graph/               # 🧠 Knowledge graph visualization
│   ├── ccp-knowledge-graph-react/ # React frontend application
│   └── ccp_knowledge_graph/       # Knowledge graph data and processing
│
└── other/                         # 📦 Everything else
    ├── gen.py                     # Pleading paper generator
    ├── OG/                        # Document generation utilities
    ├── Examples/                  # Example implementations
    ├── src/                       # Old/unused scrapers
    ├── scripts/                   # Miscellaneous scripts
    └── *.docx, *.md, *.txt        # Documentation and templates
```

## 🚀 Quick Start

### For CCP Scraping Work:
```bash
cd ccp-scraper
npm install
node scripts/main.js
```

### For Knowledge Graph Development:
```bash
cd knowledge-graph/ccp-knowledge-graph-react
npm install
npm start
```

### For Other Utilities:
```bash
cd other
python3 gen.py  # Generate pleading papers
```

## 📋 What's Where

### 🎯 CCP Scraper (`ccp-scraper/`)
**Core scraping functionality for California Code of Civil Procedure:**
- Modular Node.js scraper with clean separation of concerns
- Python PDF processing integration
- Multi-strategy downloading (PDF links, print buttons, web scraping)
- Critical sections filtering for filing requirements
- Comprehensive test suite

### 🧠 Knowledge Graph (`knowledge-graph/`)
**Visualization and graph processing:**
- React-based interactive frontend
- Knowledge graph data structures
- Relationship mapping between legal sections

### 📦 Other (`other/`)
**Miscellaneous utilities and examples:**
- Document generation tools
- Pleading paper templates
- Example implementations
- Legacy code and experiments

## 🔧 Development

### Primary Development (CCP Scraper)
```bash
cd ccp-scraper
npm test                    # Run tests
node hierarchial_scraper.js # Legacy scraper
node scripts/main.js       # New modular scraper
```

### Frontend Development (Knowledge Graph)
```bash
cd knowledge-graph/ccp-knowledge-graph-react
npm start                  # Development server
npm test                   # React tests
npm run build             # Production build
```

## 📁 Key Benefits of This Structure

✅ **Clear Separation**: CCP scraping, knowledge graph, and utilities are distinct
✅ **Easy Navigation**: Know exactly where to find what you need  
✅ **Development Focus**: Work on one component without distractions
✅ **Clean Dependencies**: Each section has its own package management
✅ **Scalable**: Easy to add new components without cluttering

## 🎯 For Updates and Development

**When working on CCP scraper updates:** → `ccp-scraper/`
**When working on knowledge graph:** → `knowledge-graph/`  
**When working on documents/utilities:** → `other/`

This structure makes it immediately clear what each directory contains and where to focus your development efforts. 