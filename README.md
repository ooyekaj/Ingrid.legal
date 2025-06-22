# Ingrid.legal - Legal Document Processing System

A comprehensive legal document processing system focused on California legal rules scraping and knowledge graph generation.

**CCP --> scrape_and_process.py**  
**CRC --> CRC_extract.py**

## 🏗️ Project Structure

```
Ingrid/
├── ccp-scraper/                   # 🎯 CCP (Code of Civil Procedure) scraper
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
│   └── package.json               # Node.js dependencies
│
├── crc-scraper/                   # 🏛️ CRC (California Rules of Court) scraper
│   ├── src/                       # CRC-specific scraping logic
│   ├── crc_results/               # CRC processing results
│   └── package.json               # Dependencies
│
├── county-rules-scraper/          # 🏛️ County-specific rules scraper
│   ├── src/                       # County rules scraping logic
│   ├── county_configs/            # Configuration for different counties
│   ├── results/                   # County scraping results
│   └── package.json               # Dependencies
│
├── knowledge-graph/               # 🧠 Knowledge graph visualization
│   ├── ccp-knowledge-graph-react/ # React frontend application
│   ├── ccp_knowledge_graph/       # Knowledge graph data and processing
│   └── unified_knowledge_graph_output/ # Combined graph outputs
│
└── other/                         # 📦 Utilities and examples
    ├── gen.py                     # Pleading paper generator
    ├── OG/                        # Document generation utilities
    └── Examples/                  # Example implementations
```

## 🚀 Quick Start

### Next.js Frontend Development:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### For CCP Scraping Work:
```bash
cd ccp-scraper
npm install
node scripts/main.js
```

### For CRC Scraping Work:
```bash
cd crc-scraper
npm install
node scripts/main.js
```

### For County Rules Scraping:
```bash
cd county-rules-scraper
npm install
node scripts/main.js
```

### For Knowledge Graph Development:
```bash
cd knowledge-graph/ccp-knowledge-graph-react
npm install
npm start
```

## 🔧 Features

- **Multi-source Legal Document Scraping**: CCP, CRC, and County rules
- **Knowledge Graph Generation**: Interactive visualization of legal relationships
- **Next.js Frontend**: Modern web interface for legal document search
- **PDF Processing**: Automated download and content extraction
- **Critical Sections Filtering**: Focus on filing requirements and key rules
- **Comprehensive Testing**: Test suites for reliable scraping

## 📋 Components

### 🎯 CCP Scraper (`ccp-scraper/`)
California Code of Civil Procedure scraping and processing

### 🏛️ CRC Scraper (`crc-scraper/`)
California Rules of Court scraping and analysis

### 🏛️ County Rules Scraper (`county-rules-scraper/`)
County-specific court rules and local procedures

### 🧠 Knowledge Graph (`knowledge-graph/`)
Interactive visualization of legal document relationships

### 🌐 Next.js Frontend
Modern web application for legal document search and analysis

## 🔧 Development

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## 📁 Key Benefits

✅ **Comprehensive Coverage**: Multiple California legal document sources  
✅ **Interactive Visualization**: Knowledge graphs for legal relationships  
✅ **Modern Frontend**: Next.js-based web application  
✅ **Modular Architecture**: Clean separation of scraping components  
✅ **Automated Processing**: PDF download and content extraction  
✅ **Development Ready**: Full test suites and development tools
