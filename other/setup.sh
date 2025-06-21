#!/bin/bash

# Ingrid Project Setup Script
# This script installs all dependencies needed to run the Ingrid project locally

echo "🚀 Setting up Ingrid Project..."
echo "================================="

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3 first."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Prerequisites check passed"
echo ""

# Install Python dependencies
echo "📦 Installing Python dependencies..."
python3 -m pip install -r requirements.txt
if [ $? -eq 0 ]; then
    echo "✅ Python dependencies installed successfully"
else
    echo "❌ Failed to install Python dependencies"
    exit 1
fi

echo ""

# Install Node.js dependencies for california-legal-scraper
echo "📦 Installing Node.js dependencies for california-legal-scraper..."
cd california-legal-scraper
npm install
if [ $? -eq 0 ]; then
    echo "✅ california-legal-scraper dependencies installed successfully"
else
    echo "❌ Failed to install california-legal-scraper dependencies"
    exit 1
fi

echo ""

# Install Node.js dependencies for React app
echo "📦 Installing Node.js dependencies for React app..."
cd ccp-knowledge-graph-react
npm install
if [ $? -eq 0 ]; then
    echo "✅ React app dependencies installed successfully"
else
    echo "❌ Failed to install React app dependencies"
    exit 1
fi

# Return to main directory
cd ../..

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "Available commands:"
echo "  📄 Run setup.sh to reinstall all dependencies"
echo "  🧪 Run python tests: cd california-legal-scraper && npm test"
echo "  🕸️  Run web scraper: cd california-legal-scraper && node hierarchial_scraper.js"
echo "  ⚛️  Start React app: cd california-legal-scraper/ccp-knowledge-graph-react && npm start"
echo "  📋 Run Python scripts: python3 gen.py, python3 CCP/extract_rules.py, etc."
echo ""
echo "📚 Documentation and examples are available in the respective directories." 