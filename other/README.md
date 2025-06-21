# Ingrid Project - Complete Setup Guide

A comprehensive legal document processing and analysis system with multiple components for PDF parsing, web scraping, document generation, and React-based visualization.

## 🏗️ Project Structure

```
Ingrid/
├── california-legal-scraper/          # Main Node.js scraper project
│   ├── ccp-knowledge-graph-react/     # React frontend application
│   ├── hierarchial_scraper.js         # Main scraper script
│   └── package.json                   # Node.js dependencies
├── CCP/                               # Python PDF processing
│   ├── extract_rules.py               # PDF rule extraction
│   └── scrape_and_process.py          # Web scraping and processing
├── Examples/Example/                  # Example implementations
│   └── PDFParse.py                    # PDF parsing examples
├── OG/                                # Document generation utilities
│   ├── doc.py                         # Word document creation
│   ├── docgen.py                      # Pleading document generator
│   └── PDF_Edit.py                    # PDF form filling
├── gen.py                             # Main document generator
├── requirements.txt                   # Python dependencies
├── setup.sh                          # Automated setup script
└── README.md                          # This file
```

## 🚀 Quick Setup

### Prerequisites
- **Python 3.8+** (with pip)
- **Node.js 16+** (with npm)
- **macOS/Linux** (bash shell support)

### Automated Setup
```bash
# Clone or navigate to the project directory
cd /path/to/Ingrid

# Run the setup script
./setup.sh
```

### Manual Setup
If you prefer manual installation:

```bash
# Install Python dependencies
pip3 install -r requirements.txt

# Install Node.js dependencies for scraper
cd california-legal-scraper
npm install

# Install React app dependencies
cd ccp-knowledge-graph-react
npm install

# Return to main directory
cd ../..
```

## 🛠️ Dependencies

### Python Libraries
- **pypdf==4.0.1** - PDF text extraction
- **PyMuPDF==1.23.26** - Advanced PDF processing (fitz)
- **requests==2.31.0** - HTTP requests for web scraping
- **beautifulsoup4==4.12.2** - HTML parsing
- **python-docx==1.1.0** - Word document creation
- **pytest==7.4.4** - Testing framework

### Node.js Libraries
- **playwright==1.40.0** - Web automation and scraping
- **jest==29.7.0** - JavaScript testing framework
- **React ecosystem** - Frontend application (full list in package.json files)

## 📋 Usage Instructions

### 1. Python Scripts

#### Document Generation
```bash
# Generate pleading paper templates
python3 gen.py

# Create Word documents with formatting
python3 OG/doc.py
python3 OG/docgen.py

# Fill PDF forms
python3 OG/PDF_Edit.py
```

#### PDF Processing
```bash
# Extract rules from PDF files
python3 CCP/extract_rules.py

# Process and scrape legal documents
python3 CCP/scrape_and_process.py

# Parse PDF examples
python3 Examples/Example/PDFParse.py
```

### 2. Node.js/JavaScript

#### Web Scraping
```bash
cd california-legal-scraper

# Run the main scraper
node hierarchial_scraper.js

# Run tests
npm test

# Run specific test suites
npm run test:unit
npm run test:regression
```

#### React Application
```bash
cd california-legal-scraper/ccp-knowledge-graph-react

# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test
```

## 🔧 Configuration

### Python Path Configuration
All Python scripts are designed to run from their respective directories or the project root. The main dependencies are automatically installed via `requirements.txt`.

### Node.js Configuration
The project uses standard npm package management. All configurations are in the respective `package.json` files.

### Environment Variables
For scraping operations, you may need to configure:
- Browser automation settings (Playwright)
- API endpoints for legal document sources
- Output directory paths

## 🧪 Testing

### Python Tests
```bash
# Run Python tests (if pytest is configured)
python3 -m pytest

# Test specific modules
python3 -m pytest CCP/
```

### JavaScript Tests
```bash
# Run all Node.js tests
cd california-legal-scraper
npm test

# Run specific test categories
npm run test:unit      # Unit tests
npm run test:regression # Regression tests
npm run test:coverage  # With coverage report
```

### React Tests
```bash
cd california-legal-scraper/ccp-knowledge-graph-react
npm test
```

## 📁 Key Files and Functions

### Python Scripts
- `gen.py` - Main pleading paper generator
- `CCP/extract_rules.py` - PDF rule extraction with metadata
- `CCP/scrape_and_process.py` - Web scraping for legal documents
- `OG/PDF_Edit.py` - CM-010 form filling automation
- `Examples/Example/PDFParse.py` - PDF parsing examples

### JavaScript/Node.js
- `hierarchial_scraper.js` - Main web scraping engine
- `ccp_knowledge_graph.js` - Knowledge graph processing
- React app - Interactive legal document visualization

## 🐛 Troubleshooting

### Common Issues

1. **Python Import Errors**
   ```bash
   # Ensure all dependencies are installed
   pip3 install -r requirements.txt
   ```

2. **Node.js Module Errors**
   ```bash
   # Clear npm cache and reinstall
   npm cache clean --force
   npm install
   ```

3. **Path Issues**
   ```bash
   # Run scripts from the correct directory
   cd /path/to/Ingrid
   python3 gen.py
   ```

4. **PDF File Access**
   - Ensure PDF files are in the correct directories
   - Check file permissions
   - Verify file paths in scripts

### Security Vulnerabilities
If npm audit shows vulnerabilities:
```bash
cd california-legal-scraper/ccp-knowledge-graph-react
npm audit fix
# Or for breaking changes:
npm audit fix --force
```

## 📞 Support

For issues with specific components:
- **Python scripts**: Check dependency installation and file paths
- **Node.js scraper**: Verify Playwright browser installation
- **React app**: Check Node.js version compatibility
- **PDF processing**: Ensure PDF files are not corrupted or encrypted

## 🔄 Updates

To update all dependencies:
```bash
# Python dependencies
pip3 install --upgrade -r requirements.txt

# Node.js dependencies
cd california-legal-scraper && npm update
cd ccp-knowledge-graph-react && npm update
```

---

**Note**: This project includes multiple independent components. Each can be run separately based on your needs. The setup script installs all dependencies, but you can install only what you need for specific components. 