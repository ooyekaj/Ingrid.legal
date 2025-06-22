# California County Rules Scraper

A comprehensive multi-county legal document scraper for California county court rules, standing orders, and judicial directives. This system handles diverse website structures and document types across California's 58 counties.

## Features

- **Universal Document Discovery**: Automatically discovers legal documents across different county website structures
- **Multi-Format Processing**: Handles PDF, HTML, Word, and Excel documents
- **Intelligent Classification**: AI-powered document classification with filing relevance scoring
- **County-Specific Configurations**: Flexible configuration system for each county's unique structure
- **Batch Processing**: Efficient processing of multiple counties with respectful rate limiting
- **Variation Analysis**: Analyzes differences in procedures between counties
- **Filing Relevance Filtering**: Focuses on documents relevant to legal filing procedures

## Quick Start

```bash
# Install dependencies
npm install

# Run single county scraper
npm start

# Run batch processing for multiple counties
npm run batch

# Development mode with auto-restart
npm run dev
```

## Project Structure

```
county-rules-scraper/
├── src/
│   ├── config/           # County configurations and document types
│   ├── scrapers/         # Web scraping and document discovery
│   ├── processors/       # Content analysis and processing
│   ├── extractors/       # Document format extractors
│   └── utils/           # Utility functions
├── county_configs/       # JSON configurations for each county
├── scraped_documents/    # Downloaded documents organized by county
└── results/             # Analysis results and databases
```

## Configuration

Each county has a dedicated configuration file in `county_configs/` that defines:
- Base URLs and discovery patterns
- Document format handling
- Filing-specific content areas
- Rate limiting and scraping parameters

## Output

The scraper generates:
- **County Rules Database**: Comprehensive metadata for all discovered documents
- **Filing Procedures Matrix**: Comparison of procedures across counties
- **Variation Analysis**: Identification of county-specific vs. statewide rules
- **Practitioner Guides**: Actionable summaries for multi-county practice

## Supported Counties

Priority counties include:
- Los Angeles (largest system)
- San Francisco (tech-forward)
- Santa Clara (detailed procedures)
- Orange (high volume)
- San Diego (major population)
- Alameda (complex civil)
- Sacramento (state capital)
- Riverside (fast-growing)

## Legal Compliance

- Respects robots.txt files
- Implements respectful rate limiting
- Uses appropriate user agent strings
- Focuses on publicly available documents

## License

MIT License - See LICENSE file for details 