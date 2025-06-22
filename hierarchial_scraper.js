const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');

class HierarchicalPDFScraper {
  constructor(options = {}) {
    this.downloadDir = options.downloadDir || './downloaded_pdfs';
    this.outputDir = options.outputDir || './extracted_content';
    this.maxConcurrent = options.maxConcurrent || 3;
    this.delay = options.delay || 2000;
    this.baseUrl = 'https://leginfo.legislature.ca.gov';
    this.ccpTocUrl = 'https://leginfo.legislature.ca.gov/faces/codedisplayexpand.xhtml?tocCode=CCP';
    this.tocPdfPath = null;
  }

  async initialize() {
    await fs.mkdir(this.downloadDir, { recursive: true });
    await fs.mkdir(this.outputDir, { recursive: true });
    
    console.log(`📁 Download directory: ${this.downloadDir}`);
    console.log(`📁 Output directory: ${this.outputDir}`);
  }

    async scrapeHierarchicalPDFs() {
    await this.initialize();
    
    try {
      // Check if we need to download PDFs or just parse existing ones
      const shouldDownload = await this.shouldDownloadPDFs();
      let extractedData;
      
      if (shouldDownload) {
        console.log('\n🔍 Step 1: Downloading CCP Table of Contents PDF...');
        
        // Step 1: Download the main TOC PDF
        this.tocPdfPath = await this.downloadTocPDF();
        if (!this.tocPdfPath) {
          throw new Error('Failed to download Table of Contents PDF');
        }
        
        console.log('\n🔍 Step 2: Extracting section links from TOC PDF...');
        
        // Step 2: Extract all section links from the TOC PDF
        const allSectionLinks = await this.extractSectionLinksFromTocPDF(this.tocPdfPath);
        console.log(`✅ Extracted ${allSectionLinks.length} section links from TOC PDF`);
        
        console.log('\n🔍 Step 3: Filtering for filing-related sections...');
        
        // Step 3: Filter for filing-related sections
        const filingRelatedLinks = this.filterFilingRelatedSections(allSectionLinks);
        console.log(`✅ Filtered to ${filingRelatedLinks.length} filing-related sections`);
        
        console.log('\n🔍 Step 4: Downloading individual rule PDFs...');
        
        // Step 4: Download PDFs for filing-related sections
        const downloadedFiles = [];
        const allRuleData = [];
        
        for (let i = 0; i < filingRelatedLinks.length; i++) {
          const section = filingRelatedLinks[i];
          console.log(`\n  📋 Processing section ${i + 1}/${filingRelatedLinks.length}: ${section.ruleNumber} - ${section.title}`);
          
          try {
            const result = await this.downloadIndividualRulePDF(section, i);
                if (result) {
              downloadedFiles.push(result.filePath);
                  allRuleData.push(result.ruleData);
              console.log(`    ✅ Downloaded content for section ${section.ruleNumber}`);
                }
                
            // Add delay between downloads
            if (i < filingRelatedLinks.length - 1) {
                await this.sleep(this.delay);
            }
            
          } catch (error) {
            console.error(`    ❌ Error processing section ${section.ruleNumber}:`, error.message);
            continue;
          }
        }
        
        console.log(`\n🔍 Step 5: Processing ${downloadedFiles.length} downloaded files with enhanced processor...`);
        
        if (downloadedFiles.length === 0) {
          console.log('⚠️  No files downloaded to process');
          return [];
        }
        
        extractedData = await this.processFilesWithEnhancedProcessor(downloadedFiles, allRuleData);
      } else {
        console.log('\n📋 PDFs are recent (< 24 hours old). Skipping download and processing existing PDFs...');
        
        // Get existing PDFs and their metadata
        const existingPDFData = await this.getExistingPDFData();
        console.log(`\n🔍 Processing ${existingPDFData.pdfPaths.length} existing PDFs with PyMuPDF...`);
        
        if (existingPDFData.pdfPaths.length === 0) {
          console.log('⚠️  No existing PDFs found. Running full download...');
          return await this.scrapeHierarchicalPDFs(); // Recursive call to download
        }
        
        extractedData = await this.processFilesWithEnhancedProcessor(existingPDFData.pdfPaths, existingPDFData.ruleData);
      }
      
      // Step 6: Save comprehensive results
      const filteringSummary = {
        total_sections_found: shouldDownload ? (typeof allSectionLinks !== 'undefined' ? allSectionLinks.length : 'N/A') : 'N/A (used existing PDFs)',
        filing_related_sections: shouldDownload ? (typeof filingRelatedLinks !== 'undefined' ? filingRelatedLinks.length : 'N/A') : extractedData.length,
        successfully_downloaded: shouldDownload ? (typeof downloadedPDFs !== 'undefined' ? downloadedPDFs.length : 'N/A') : 'N/A (used existing PDFs)',
        filtering_criteria: {
          primary_keywords: ['filing', 'service', 'document filing', 'court filing', 'summons', 'pleading', 'discovery', 'motion', 'notice'],
          procedural_keywords: ['procedure', 'deadline', 'calendar days', 'format', 'extension', 'sanctions', 'ex parte'],
          ccp_section_ranges: [
            '36-44: Calendar Preferences and Trial Setting',
            '410.10-418.11: Jurisdiction and Service of Process',
            '411.10-411.35: Commencing Civil Actions',
            '412.10-412.30: Summons',
            '413.10-417.40: Service of Summons',
            '420-475: Pleadings in Civil Actions',
            '425.10-429.30: Pleadings Demanding Relief',
            '437-439: Summary Judgments and Motions',
            '583.110-583.430: Dismissal for Delay in Prosecution',
            '664-670: Entry of Judgment',
            '683-724: Enforcement of Judgments',
            '901-996: Writ Procedures',
            '1000-1020: Service and Notice Rules',
            '1032-1038: Costs and Attorney Fees',
            '1085-1097: Mandate Procedures',
            '2016.010-2016.090: Discovery Act General Provisions',
            '2017.010-2017.090: Scope of Discovery',
            '2023.010-2023.050: Discovery Sanctions',
            '2025.010-2025.990: Deposition Procedures',
            '2030.010-2030.090: Interrogatory Procedures',
            '2031.010-2031.320: Document Production',
            '2032.010-2032.990: Physical Examination Procedures',
            '2033.010-2033.740: Requests for Admission'
          ],
          minimum_relevance_score: 4
        },
        processed_at: new Date().toISOString(),
        processing_mode: shouldDownload ? 'fresh_download' : 'existing_pdfs'
      };
      
      const comprehensiveResults = {
        filtering_summary: filteringSummary,
        extracted_documents: extractedData
      };
      
      const resultsPath = path.join(this.outputDir, 'ccp_filing_rules_extraction_results.json');
      await fs.writeFile(resultsPath, JSON.stringify(comprehensiveResults, null, 2));
      console.log(`\n💾 CCP filing-focused results saved to: ${resultsPath}`);
      
      return comprehensiveResults;
      
    } catch (error) {
      console.error('Error in hierarchical scraping process:', error);
      throw error;
    }
  }

  async downloadTocPDF() {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
      console.log(`    🔗 Accessing TOC page: ${this.ccpTocUrl}`);
      
      await page.goto(this.ccpTocUrl, { 
        waitUntil: 'domcontentloaded',
        timeout: 15000 
      });
      
      console.log(`    ✅ Page loaded successfully`);
      await page.waitForTimeout(2000);
      
      // Look for print/PDF button or link
      const pdfPath = path.join(this.downloadDir, 'ccp_toc.pdf');
      
      // Strategy 1: Look for the specific print button based on your HTML code
      console.log(`    🔍 Looking for print button...`);
      
      // Try multiple selectors for the print button
      const printSelectors = [
        '#codes_print a',  // Based on your HTML: <div id="codes_print">
        'a[title*="Print"]',
        'a[onclick*="window.print"]',
        'img[alt="print page"]',  // The print icon
        'button:has-text("print"), a:has-text("print"), button:has-text("PDF"), a:has-text("PDF")',
        '[title*="print"], [title*="PDF"]'
      ];
      
      let printButton = null;
      for (const selector of printSelectors) {
        try {
          const buttons = await page.$$(selector);
          if (buttons.length > 0) {
            printButton = buttons[0];
            console.log(`    🖨️  Found print button with selector: ${selector}`);
            break;
          }
        } catch (error) {
          // Continue to next selector
        }
      }
      
      if (printButton) {
        console.log(`    🖨️  Attempting to trigger print dialog...`);
        
        try {
          // Set up download listener before clicking
          const downloadPromise = page.waitForDownload({ timeout: 30000 }).catch(() => null);
          
          // Click the print button to trigger window.print()
          await printButton.click();
          
          // Wait a bit for the print dialog
          await page.waitForTimeout(2000);
          
          const download = await downloadPromise;
          if (download) {
            await download.saveAs(pdfPath);
            console.log(`    ✅ Downloaded TOC PDF via print button to: ${pdfPath}`);
            await browser.close();
            return pdfPath;
          }
        } catch (error) {
          console.log(`    ⚠️  Print button click failed: ${error.message}`);
        }
      }
      
      // Strategy 2: Use browser's print-to-PDF functionality
      console.log(`    📄 Using print-to-PDF fallback...`);
      await page.pdf({
        path: pdfPath,
        format: 'A4',
        printBackground: true,
        margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' }
      });
      
      console.log(`    ✅ Generated TOC PDF to: ${pdfPath}`);
      await browser.close();
      return pdfPath;
      
    } catch (error) {
      await browser.close();
      throw new Error(`Failed to download TOC PDF: ${error.message}`);
    }
  }

  async extractSectionLinksFromTocPDF(tocPdfPath) {
    console.log(`DEBUG: extractSectionLinksFromTocPDF called with tocPdfPath = ${tocPdfPath}`);
    return new Promise((resolve, reject) => {
      const pythonScript = this.generateTocExtractionScript(tocPdfPath);
      const scriptPath = path.join(this.outputDir, 'extract_toc_links.py');
      
      fs.writeFile(scriptPath, pythonScript)
        .then(() => {
          console.log('🐍 Running TOC link extraction script...');
          
          const pythonProcess = spawn('python3', [scriptPath], {
            stdio: ['inherit', 'pipe', 'pipe']
          });
          
          let output = '';
          let error = '';
          
          pythonProcess.stdout.on('data', (data) => {
            const text = data.toString();
            output += text;
            console.log(text.trim());
          });
          
          pythonProcess.stderr.on('data', (data) => {
            const text = data.toString();
            error += text;
            console.error(text.trim());
          });
          
          pythonProcess.on('close', (code) => {
            if (code === 0) {
              try {
                const resultsPath = path.join(this.outputDir, 'toc_links.json');
                fs.readFile(resultsPath, 'utf8')
                  .then(data => resolve(JSON.parse(data)))
                  .catch(err => reject(new Error(`Failed to read TOC links: ${err.message}`)));
              } catch (parseError) {
                reject(new Error(`Failed to parse TOC links: ${parseError.message}`));
              }
            } else {
              reject(new Error(`TOC extraction script failed with code ${code}: ${error}`));
            }
          });
        })
        .catch(reject);
    });
  }

  generateTocExtractionScript(tocPdfPath) {
    return `
import fitz
import json
import os
import re
from urllib.parse import urljoin

def extract_toc_links(pdf_path):
    """Extract section links from the CCP Table of Contents PDF"""
    try:
        doc = fitz.open(pdf_path)
        links = []
        
        print(f"Processing TOC PDF: {pdf_path}")
        print(f"Total pages: {len(doc)}")
        
        for page_num in range(len(doc)):
            page = doc[page_num]
            page_text = page.get_text()
            
            # Extract hyperlinks from the page
            page_links = page.get_links()
            
            for link in page_links:
                if link.get('uri'):
                    uri = link['uri']
                    # Look for CCP section links
                    if 'codes_displaySection' in uri and 'CCP' in uri:
                        # Extract section number from URI (including lettered subsections)
                        section_match = re.search(r'sectionNum=([\\d\\.a-z]+)', uri)
                        if section_match:
                            section_num = section_match.group(1)
                            
                            # Get the text content around this link for context
                            rect = link['from']
                            # Get text in the vicinity of the link
                            text_area = page.get_text("text", clip=rect)
                            
                            # Try to find the section title in the surrounding text
                            lines = page_text.split('\\n')
                            section_title = f"CCP Section {section_num}"
                            
                            # Look for lines containing the section number
                            for line in lines:
                                if section_num in line and len(line.strip()) > len(section_num):
                                    # This line likely contains the section title
                                    clean_line = line.strip()
                                    if clean_line and not clean_line.isdigit():
                                        section_title = clean_line[:200]  # Limit length
                                        break
                            
                            links.append({
                                'ruleNumber': section_num,
                                'title': section_title,
                                'url': uri if uri.startswith('http') else f"https://leginfo.legislature.ca.gov{uri}",
                                'page': page_num + 1,
                                'source': 'toc_pdf_hyperlink'
                            })
            
            # Also extract section numbers from text patterns
            # Look for section number patterns in the text (including lettered subsections)
            section_patterns = [
                r'(\\d+[a-z]?\\.\\d+[a-z]?)\\s+[A-Z][^\\n]{10,}',  # "415.10 SOME TITLE" or "437c.10 TITLE"
                r'(\\d+[a-z]?)\\s+[A-Z][^\\n]{10,}',               # "415 SOME TITLE" or "437c TITLE"
                r'Section\\s+(\\d+[a-z]?\\.?\\d*[a-z]?)\\s+[A-Z][^\\n]{10,}',  # "Section 415.10 SOME TITLE" or "Section 437c TITLE"
                r'(\\d+[a-z])\\.\\s+[A-Z][^\\n]{10,}',             # "437c. SOME TITLE"
            ]
            
            for pattern in section_patterns:
                matches = re.finditer(pattern, page_text, re.MULTILINE)
                for match in matches:
                    section_num = match.group(1)
                    full_match = match.group(0).strip()
                    
                    # Check if we already have this section from hyperlinks
                    existing = any(link['ruleNumber'] == section_num for link in links)
                    if not existing:
                        # Generate the URL for this section
                        section_url = f"https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum={section_num}"
                        
                        links.append({
                            'ruleNumber': section_num,
                            'title': full_match[:200],  # Limit title length
                            'url': section_url,
                            'page': page_num + 1,
                            'source': 'toc_pdf_text_pattern'
                        })
        
        doc.close()
        
        # Remove duplicates and sort
        unique_links = {}
        for link in links:
            key = link['ruleNumber']
            if key not in unique_links:
                unique_links[key] = link
        
        final_links = list(unique_links.values())
        
        # Sort by section number
        def sort_key(link):
            try:
                return float(link['ruleNumber'])
            except:
                return 0
        
        final_links.sort(key=sort_key)
        
        print(f"\\nExtracted {len(final_links)} unique section links")
        
        # Show sample of extracted links
        print("\\nSample sections found:")
        for i, link in enumerate(final_links[:10]):
            print(f"  {i+1}. Section {link['ruleNumber']}: {link['title'][:60]}...")
        
        if len(final_links) > 10:
            print(f"  ... and {len(final_links) - 10} more sections")
        
        return final_links
        
    except Exception as e:
        print(f"Error extracting TOC links: {e}")
        return []

def main():
    pdf_path = "${tocPdfPath}"
    
    if not os.path.exists(pdf_path):
        print(f"Error: TOC PDF not found at {pdf_path}")
        return
    
    links = extract_toc_links(pdf_path)
    
    # Save results
    output_path = "${path.join(this.outputDir, 'toc_links.json').replace(/\\/g, '/')}"
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(links, f, indent=2, ensure_ascii=False)
    
    print(f"\\n💾 TOC links saved to: {output_path}")
    print(f"✅ Successfully extracted {len(links)} section links from TOC PDF")

if __name__ == "__main__":
    main()
`;
  }

  filterFilingRelatedSections(allSectionLinks) {
    const filingRelatedSections = [];
    
    for (const section of allSectionLinks) {
      if (this.isFilingRelatedSection(section)) {
        filingRelatedSections.push(section);
      }
    }
    
    // Add critical sections that are often missing from TOC
    const criticalSubsections = [
      // Summary Judgment Rules
      {
        ruleNumber: '437c',
        title: 'CCP Section 437c - Summary Judgment Motions',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=437c',
        source: 'manual_critical_addition'
      },
      {
        ruleNumber: '438',
        title: 'CCP Section 438 - Summary Judgment Procedure',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=438',
        source: 'manual_critical_addition'
      },
      
      // Service and Notice Rules
      {
        ruleNumber: '1005',
        title: 'CCP Section 1005 - Motion Filing and Hearing Deadlines',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=1005',
        source: 'manual_critical_addition'
      },
      {
        ruleNumber: '1010',
        title: 'CCP Section 1010 - Written Notice Requirements for Motions',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=1010',
        source: 'manual_critical_addition'
      },
      {
        ruleNumber: '1010.6',
        title: 'CCP Section 1010.6 - Electronic Filing and Service Rules',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=1010.6',
        source: 'manual_critical_addition'
      },
      {
        ruleNumber: '1011',
        title: 'CCP Section 1011 - Personal Service Requirements',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=1011',
        source: 'manual_critical_addition'
      },
      {
        ruleNumber: '1012',
        title: 'CCP Section 1012 - Service by Mail Extensions',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=1012',
        source: 'manual_critical_addition'
      },
      {
        ruleNumber: '1013',
        title: 'CCP Section 1013 - Service by Mail, Fax, Express Mail Timing Rules',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=1013',
        source: 'manual_critical_addition'
      },
      
      // Filing Requirements
      {
        ruleNumber: '1014',
        title: 'CCP Section 1014 - Proof of Service Requirements',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=1014',
        source: 'manual_critical_addition'
      },
      
      // Motion Practice
      {
        ruleNumber: '1003',
        title: 'CCP Section 1003 - Ex Parte Applications',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=1003',
        source: 'manual_critical_addition'
      },
      {
        ruleNumber: '1006',
        title: 'CCP Section 1006 - Extensions of Time',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=1006',
        source: 'manual_critical_addition'
      },
      
      // Discovery Rules
      {
        ruleNumber: '2016.010',
        title: 'CCP Section 2016.010 - Discovery Act General Provisions',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=2016.010',
        source: 'manual_critical_addition'
      },
      {
        ruleNumber: '2023.010',
        title: 'CCP Section 2023.010 - Discovery Sanctions',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=2023.010',
        source: 'manual_critical_addition'
      },
      {
        ruleNumber: '2025.010',
        title: 'CCP Section 2025.010 - Deposition Procedures',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=2025.010',
        source: 'manual_critical_addition'
      },
      {
        ruleNumber: '2030.010',
        title: 'CCP Section 2030.010 - Interrogatory Procedures',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=2030.010',
        source: 'manual_critical_addition'
      },
      {
        ruleNumber: '2031.010',
        title: 'CCP Section 2031.010 - Document Production',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=2031.010',
        source: 'manual_critical_addition'
      },
      {
        ruleNumber: '2033.010',
        title: 'CCP Section 2033.010 - Requests for Admission',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=2033.010',
        source: 'manual_critical_addition'
      }
    ];
    
    // Check if these critical sections are already included
    for (const critical of criticalSubsections) {
      const exists = filingRelatedSections.some(section => section.ruleNumber === critical.ruleNumber);
      if (!exists) {
        console.log(`      🔥 Adding critical missing section: ${critical.ruleNumber}`);
        filingRelatedSections.push(critical);
      }
    }
    
    return filingRelatedSections;
  }

  isFilingRelatedSection(section) {
    // Handle lettered subsections (like 437c) by extracting the numeric part
    const ruleNumber = section.ruleNumber;
    const numericPart = parseFloat(ruleNumber.replace(/[a-z]/g, ''));
    
    // CCP-specific section number ranges that are typically filing-related
    const ccpFilingSections = [
      // Original ranges
      { range: [410.10, 418.11], category: 'Jurisdiction and Service of Process' },
      { range: [411.10, 411.35], category: 'Commencing Civil Actions' },
      { range: [412.10, 412.30], category: 'Summons' },
      { range: [413.10, 417.40], category: 'Service of Summons' },
      { range: [420, 475], category: 'Pleadings in Civil Actions' },
      { range: [425.10, 429.30], category: 'Pleadings Demanding Relief' },
      { range: [437, 439], category: 'Summary Judgments and Motions' },
      
      // Major Missing Filing and Procedural Sections
      // 1. Service and Notice Rules
      { range: [1000, 1020], category: 'Service and Notice Rules' },
      { range: [1005, 1005], category: 'Motion Filing and Hearing Deadlines' },
      { range: [1010, 1010.6], category: 'Written Notice and Electronic Filing' },
      { range: [1011, 1015], category: 'Personal Service and Extensions' },
      
      // 2. Filing and Format Requirements  
      { range: [1000, 1002], category: 'General Filing Requirements' },
      { range: [1014, 1014], category: 'Proof of Service Requirements' },
      
      // 3. Discovery Filing Rules
      { range: [2016.010, 2016.090], category: 'Discovery Act General Provisions' },
      { range: [2017.010, 2017.090], category: 'Scope of Discovery' },
      { range: [2023.010, 2023.050], category: 'Discovery Sanctions' },
      { range: [2025.010, 2025.990], category: 'Deposition Procedures and Filing' },
      { range: [2030.010, 2030.090], category: 'Interrogatory Procedures' },
      { range: [2031.010, 2031.320], category: 'Document Production' },
      { range: [2032.010, 2032.990], category: 'Physical Examination Procedures' },
      { range: [2033.010, 2033.740], category: 'Requests for Admission' },
      
      // 4. Motion Practice Rules
      { range: [1003, 1003], category: 'Ex Parte Applications' },
      { range: [1006, 1007], category: 'Extensions and Time Calculations' },
      
      // 5. Case Management and Scheduling
      { range: [583.110, 583.430], category: 'Dismissal for Delay in Prosecution' },
      { range: [36, 44], category: 'Calendar Preferences and Trial Setting' },
      
      // 6. Judgment and Post-Judgment Procedures
      { range: [664, 670], category: 'Entry of Judgment' },
      { range: [683, 724], category: 'Enforcement of Judgments' },
      { range: [1032, 1038], category: 'Costs and Attorney Fees' },
      
      // 7. Appeals and Writs
      { range: [901, 996], category: 'Writ Procedures' },
      { range: [1085, 1097], category: 'Mandate Procedures' }
    ];
    
    // Check if section is in a known filing-related range
    const inFilingRange = ccpFilingSections.some(sectionRange => 
      numericPart >= sectionRange.range[0] && numericPart <= sectionRange.range[1]
    );
    
    if (inFilingRange) {
      console.log(`      ✅ Section ${section.ruleNumber} is in a known filing-related range`);
      return true;
    }
    
    // Apply keyword-based filtering
    const filingKeywords = {
      primary: [
        'filing', 'file', 'filed', 'files',
        'document filing', 'court filing', 'electronic filing', 'e-filing',
        'filing fee', 'filing deadline', 'filing requirement',
        'service', 'serve', 'served', 'serving',
        'service of process', 'service requirement',
        'summons', 'complaint', 'pleading', 'pleadings',
        'summary judgment', 'motion', 'motions', 'separate statement',
        'notice', 'opposition', 'reply', 'meet and confer',
        
        // Additional filing-related terms
        'discovery', 'deposition', 'interrogatory', 'interrogatories',
        'document production', 'request for admission', 'physical examination',
        'sanctions', 'ex parte', 'extension', 'time calculation',
        'proof of service', 'personal service', 'mail service',
        'judgment', 'enforcement', 'costs', 'attorney fees',
        'writ', 'mandate', 'calendar', 'trial setting',
        'dismissal', 'delay', 'prosecution'
      ],
      procedural: [
        'procedure', 'procedural', 'process',
        'deadline', 'time limit', 'calendar days', 'court days',
        'business days', 'within', 'before', 'after',
        'format', 'formatting', 'form', 'forms',
        'paper', 'papers', 'document', 'documents',
        'motion', 'motions', 'brief', 'briefs', 'memorandum'
      ],
      administrative: [
        'clerk', 'court clerk', 'filing office',
        'docket', 'docketing', 'case number',
        'caption', 'header', 'footer',
        'page numbering', 'pagination',
        'font', 'font size', 'margins', 'spacing'
      ]
    };

    const exclusionTerms = [
      'criminal', 'felony', 'misdemeanor', 'sentencing', 'punishment',
      'evidence rules', 'trial procedure', 'jury selection',
      'substantive law', 'tort', 'contract', 'damages calculation'
    ];

    const combinedText = (section.title || '').toLowerCase();
    
    // Check for exclusion terms
    if (exclusionTerms.some(term => combinedText.includes(term.toLowerCase()))) {
      return false;
    }

    // Calculate relevance score
    let relevanceScore = 0;
    const foundTerms = [];

    // Primary terms (3 points each)
    filingKeywords.primary.forEach(term => {
      if (combinedText.includes(term.toLowerCase())) {
        relevanceScore += 3;
        foundTerms.push(term);
      }
    });

    // Procedural terms (2 points each)
    filingKeywords.procedural.forEach(term => {
      if (combinedText.includes(term.toLowerCase())) {
        relevanceScore += 2;
        foundTerms.push(term);
      }
    });

    // Administrative terms (2 points each)
    filingKeywords.administrative.forEach(term => {
      if (combinedText.includes(term.toLowerCase())) {
        relevanceScore += 2;
        foundTerms.push(term);
      }
    });

    const isRelevant = relevanceScore >= 4;

    if (isRelevant) {
      console.log(`      📋 Section ${section.ruleNumber} matches keywords - Score: ${relevanceScore}`);
    }

    return isRelevant;
  }

  async downloadIndividualRulePDF(section, index) {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
      console.log(`      🔗 Visiting section page: ${section.url}`);
      
      await page.goto(section.url, { 
        waitUntil: 'domcontentloaded',
        timeout: 15000 
      });
      
      await page.waitForTimeout(1000);
      
      const filename = this.generateRuleFilename(section, index);
      const filePath = path.join(this.downloadDir, filename);
      
      // Try to find and trigger PDF download
      const downloadSuccess = await this.downloadPDF(page, section.url, filePath);
      
      await browser.close();
      
      if (downloadSuccess) {
        return {
          filePath: typeof downloadSuccess === 'string' ? downloadSuccess : filePath, // Handle JSON files from web scraping
          ruleData: {
            ruleNumber: section.ruleNumber,
            title: section.title,
            url: section.url,
            filename: filename,
            source: section.source,
            filingRelevance: { score: 8, isRelevant: true, source: 'pre_filtered' },
            contentType: typeof downloadSuccess === 'string' && downloadSuccess.endsWith('.json') ? 'web_scraped' : 'pdf'
          }
        };
      }
      
      return null;
      
    } catch (error) {
      await browser.close();
      throw error;
    }
  }

    async downloadPDF(page, pdfUrl, filePath) {
    try {
      console.log(`        🔍 Looking for PDF download options...`);
      
      // Strategy 1: Look for the specific PDF link from the CCP section pages
      const pdfLinkSelectors = [
        '#displayCodeSection\\:pdf_link',  // Specific PDF link ID from the HTML
        'a[id*="pdf_link"]',               // More general PDF link selector
        'a:has-text("PDF")',               // Generic PDF link text
      ];
      
      let pdfLink = null;
      for (const selector of pdfLinkSelectors) {
        try {
          const links = await page.$$(selector);
          if (links.length > 0) {
            pdfLink = links[0];
            console.log(`        🔗 Found PDF link with selector: ${selector}`);
            break;
          }
        } catch (error) {
          // Continue to next selector
        }
      }
      
      if (pdfLink) {
        console.log(`        🔘 Attempting to click PDF link...`);
        
        try {
          // Set up download event listener (updated Playwright API)
          const downloadPromise = page.waitForEvent('download', { timeout: 15000 }).catch(() => null);
          
          // Click the PDF link
          await pdfLink.click();
          
          // Wait for download
          const download = await downloadPromise;
          if (download) {
            await download.saveAs(filePath);
            
            // Verify the downloaded file is a valid PDF, not an error page
            const isValidPDF = await this.verifyPDFContent(filePath);
            if (isValidPDF) {
              console.log(`        ✅ PDF downloaded via PDF link`);
              return true;
            } else {
              console.log(`        ⚠️  Downloaded file is not a valid PDF (likely error page)`);
              // Delete the invalid file
              await fs.unlink(filePath).catch(() => {});
            }
          }
        } catch (error) {
          console.log(`        ⚠️  PDF link click failed: ${error.message}`);
        }
      }
      
      // Strategy 2: Look for print button with printPopup() function
      const printButtonSelectors = [
        'button[onclick*="printPopup"]',     // Specific print button from HTML
        'button:has-text("print")',         // Generic print button
        'a:has-text("print")',              // Print link
      ];
      
      let printButton = null;
      for (const selector of printButtonSelectors) {
        try {
          const buttons = await page.$$(selector);
          if (buttons.length > 0) {
            printButton = buttons[0];
            console.log(`        🖨️  Found print button with selector: ${selector}`);
            break;
          }
        } catch (error) {
          // Continue to next selector
        }
      }
      
      if (printButton) {
        console.log(`        🖨️  Attempting to click print button...`);
        
        try {
          // Set up download event listener for print
          const downloadPromise = page.waitForEvent('download', { timeout: 15000 }).catch(() => null);
          
          // Click the print button
          await printButton.click();
          
          // Wait a bit for print dialog
          await page.waitForTimeout(2000);
        
        const download = await downloadPromise;
        if (download) {
          await download.saveAs(filePath);
          
          // Verify the downloaded file is a valid PDF
          const isValidPDF = await this.verifyPDFContent(filePath);
          if (isValidPDF) {
            console.log(`        ✅ PDF downloaded via print button`);
            return true;
          } else {
            console.log(`        ⚠️  Downloaded file is not a valid PDF (likely error page)`);
            // Delete the invalid file
            await fs.unlink(filePath).catch(() => {});
          }
          }
        } catch (error) {
          console.log(`        ⚠️  Print button click failed: ${error.message}`);
        }
      }
      
      // Strategy 3: Handle JSF form submission for PDF generation
      console.log(`        📋 Attempting JSF form submission for PDF...`);
      try {
        // Look for the form and try to submit it with PDF parameters
        const form = await page.$('#displayCodeSection');
        if (form) {
          // Try to trigger PDF generation via JavaScript
          const result = await page.evaluate(() => {
            // Check if there's a PDF link we can trigger programmatically
            const pdfLink = document.querySelector('#displayCodeSection\\:pdf_link');
            if (pdfLink && pdfLink.onclick) {
              pdfLink.click();
              return true;
            }
      return false;
          });
          
          if (result) {
            console.log(`        🔄 Triggered JSF PDF generation`);
            
            // Wait for potential download
            const downloadPromise = page.waitForEvent('download', { timeout: 10000 }).catch(() => null);
            const download = await downloadPromise;
            
            if (download) {
              await download.saveAs(filePath);
              
              // Verify the downloaded file is a valid PDF
              const isValidPDF = await this.verifyPDFContent(filePath);
              if (isValidPDF) {
                console.log(`        ✅ PDF downloaded via JSF form`);
                return true;
              } else {
                console.log(`        ⚠️  Downloaded file is not a valid PDF (likely error page)`);
                // Delete the invalid file
                await fs.unlink(filePath).catch(() => {});
              }
            }
          }
        }
    } catch (error) {
        console.log(`        ⚠️  JSF form submission failed: ${error.message}`);
      }
      
      // Strategy 4: Fallback - Print page as PDF using browser functionality
      console.log(`        📄 Using browser print-to-PDF fallback...`);
      await page.pdf({
        path: filePath,
        format: 'A4',
        printBackground: true,
        margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' }
      });
      
      const exists = await this.fileExists(filePath);
      if (exists) {
        // Verify the PDF contains actual legal content, not error messages
        const isValidPDF = await this.verifyPDFContent(filePath);
        if (isValidPDF) {
          console.log(`        ✅ PDF generated via browser print`);
          return true;
        } else {
          console.log(`        ⚠️  Generated PDF contains error content, falling back to web scraping`);
          // Delete the invalid PDF
          await fs.unlink(filePath).catch(() => {});
          
          // Strategy 5: Scrape the web page content directly
          return await this.scrapeWebPageContent(page, filePath);
        }
      }
      
      // If all PDF strategies failed, scrape the web page
      console.log(`        🌐 All PDF strategies failed, scraping web page content...`);
      return await this.scrapeWebPageContent(page, filePath);
      
    } catch (error) {
      console.error(`        ❌ PDF download error: ${error.message}`);
      // Try web scraping as final fallback
      try {
        return await this.scrapeWebPageContent(page, filePath);
      } catch (scrapeError) {
        console.error(`        ❌ Web scraping fallback failed: ${scrapeError.message}`);
        return false;
      }
    }
  }

  async processFilesWithEnhancedProcessor(filePaths, ruleData) {
    // Separate PDFs and JSON files
    const pdfPaths = filePaths.filter(path => path.endsWith('.pdf'));
    const jsonPaths = filePaths.filter(path => path.endsWith('.json'));
    
    console.log(`📊 Processing ${pdfPaths.length} PDFs and ${jsonPaths.length} web-scraped JSON files...`);
    
    const results = [];
    
    // Process PDFs with PyMuPDF
    if (pdfPaths.length > 0) {
      const pdfResults = await this.processPDFsWithPyMuPDF(pdfPaths, ruleData.filter(r => r.contentType !== 'web_scraped'));
      results.push(...pdfResults);
    }
    
    // Process JSON files directly
    if (jsonPaths.length > 0) {
      const jsonResults = await this.processWebScrapedJSON(jsonPaths, ruleData.filter(r => r.contentType === 'web_scraped'));
      results.push(...jsonResults);
    }
    
    return results;
  }

  async processPDFsWithPyMuPDF(pdfPaths, ruleData) {
    return new Promise((resolve, reject) => {
      const pythonScript = this.generateEnhancedPyMuPDFScript(pdfPaths, ruleData);
      const scriptPath = path.join(this.outputDir, 'process_ccp_pdfs.py');
      
      fs.writeFile(scriptPath, pythonScript)
        .then(() => {
          console.log('🐍 Running enhanced PyMuPDF processing script...');
          
          const pythonProcess = spawn('python3', [scriptPath], {
            stdio: ['inherit', 'pipe', 'pipe']
          });
          
          let output = '';
          let error = '';
          
          pythonProcess.stdout.on('data', (data) => {
            const text = data.toString();
            output += text;
            console.log(text.trim());
          });
          
          pythonProcess.stderr.on('data', (data) => {
            const text = data.toString();
            error += text;
            console.error(text.trim());
          });
          
          pythonProcess.on('close', (code) => {
            if (code === 0) {
              try {
                const resultsPath = path.join(this.outputDir, 'ccp_pymupdf_results.json');
                fs.readFile(resultsPath, 'utf8')
                  .then(data => resolve(JSON.parse(data)))
                  .catch(err => reject(new Error(`Failed to read results: ${err.message}`)));
              } catch (parseError) {
                reject(new Error(`Failed to parse results: ${parseError.message}`));
              }
            } else {
              reject(new Error(`Python script failed with code ${code}: ${error}`));
            }
          });
        })
        .catch(reject);
    });
  }

  generateEnhancedPyMuPDFScript(pdfPaths, ruleData) {
    // Convert JavaScript boolean values to Python boolean values
    const pythonCompatibleRuleData = JSON.stringify(ruleData)
      .replace(/\btrue\b/g, 'True')
      .replace(/\bfalse\b/g, 'False')
      .replace(/\bnull\b/g, 'None');
    
    return `
import fitz
import json
import os
import sys
import re
from datetime import datetime

def extract_ccp_content(pdf_path, rule_info):
    """Extract content from a CCP PDF with rule-specific parsing"""
    try:
        # Check if file exists and has content
        if not os.path.exists(pdf_path):
            raise Exception(f"File not found: {pdf_path}")
        
        file_size = os.path.getsize(pdf_path)
        if file_size < 100:  # Less than 100 bytes is likely empty/corrupted
            raise Exception(f"File appears to be empty or corrupted (size: {file_size} bytes)")
        
        doc = fitz.open(pdf_path)
        
        # Check if document opened successfully
        if doc.is_closed:
            raise Exception("Document failed to open properly")
        
        if len(doc) == 0:
            doc.close()
            raise Exception("Document has no pages")
        
        # Extract metadata
        metadata = doc.metadata
        
        # Extract text content
        full_text = ""
        pages_content = []
        
        for page_num in range(len(doc)):
            try:
                page = doc[page_num]
                page_text = page.get_text()
                pages_content.append({
                    "page": page_num + 1,
                    "text": page_text.strip()
                })
                full_text += page_text + "\\n"
            except Exception as page_error:
                print(f"Warning: Error reading page {page_num + 1}: {page_error}")
                pages_content.append({
                    "page": page_num + 1,
                    "text": f"[Error reading page: {page_error}]"
                })
        
        # CCP-specific content analysis
        ccp_analysis = analyze_ccp_content(full_text, rule_info)
        
        # Store page count before closing document
        page_count = len(doc)
        doc.close()
        
        return {
            "rule_info": rule_info,
            "file_info": {
                "file_path": pdf_path,
                "file_name": os.path.basename(pdf_path),
                "status": "success"
            },
            "metadata": {
                "title": metadata.get("title", ""),
                "author": metadata.get("author", ""),
                "subject": metadata.get("subject", ""),
                "creator": metadata.get("creator", ""),
                "producer": metadata.get("producer", ""),
                "creation_date": metadata.get("creationDate", ""),
                "modification_date": metadata.get("modDate", "")
            },
            "content": {
                "full_text": full_text.strip(),
                "page_count": page_count,
                "pages": pages_content,
                "character_count": len(full_text.strip()),
                "word_count": len(full_text.strip().split())
            },
            "ccp_analysis": ccp_analysis,
            "extracted_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        return {
            "rule_info": rule_info,
            "file_info": {
                "file_path": pdf_path,
                "file_name": os.path.basename(pdf_path),
                "status": "error",
                "error": str(e)
            },
            "extracted_at": datetime.now().isoformat()
        }

def analyze_ccp_content(text, rule_info):
    """Analyze CCP content specifically for filing and procedural patterns"""
    analysis = {
        "section_number": rule_info.get("ruleNumber", ""),
        "section_title": rule_info.get("title", ""),
        "filing_relevance": rule_info.get("filingRelevance", {}),
        "procedural_requirements": [],
        "filing_procedures": [],
        "service_requirements": [],
        "deadlines_and_timing": [],
        "format_specifications": [],
        "cross_references": [],
        "key_provisions": []
    }
    
    # Extract procedural requirements
    proc_patterns = [
        r'shall\\s+(?:be\\s+)?(?:file[d]?|serve[d]?)\\s+([^.]{10,100})',
        r'must\\s+(?:be\\s+)?(?:file[d]?|serve[d]?)\\s+([^.]{10,100})',
        r'(?:filing|service)\\s+(?:shall|must)\\s+([^.]{10,100})',
        r'(?:document|paper|pleading)\\s+(?:shall|must)\\s+([^.]{10,100})'
    ]
    
    for pattern in proc_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        for match in matches:
            if len(match.strip()) > 15:
                analysis["procedural_requirements"].append(match.strip()[:200])
    
    # Extract timing requirements
    timing_patterns = [
        r'within\\s+(\\d+)\\s+(calendar\\s+days?|court\\s+days?|business\\s+days?|days?)',
        r'(\\d+)\\s+(calendar\\s+days?|court\\s+days?|business\\s+days?)\\s+(?:before|after|from)',
        r'(?:no\\s+later\\s+than|not\\s+later\\s+than)\\s+([^.]{5,50})',
        r'(?:deadline|due\\s+date|time\\s+limit)\\s+(?:is|shall\\s+be)\\s+([^.]{5,50})'
    ]
    
    for pattern in timing_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        for match in matches:
            if isinstance(match, tuple):
                timing_text = ' '.join(match)
            else:
                timing_text = match
            if len(timing_text.strip()) > 3:
                analysis["deadlines_and_timing"].append(timing_text.strip()[:150])
    
    # Extract cross-references
    ref_patterns = [
        r'(?:Section|Rule|Code)\\s+(\\d+\\.?\\d*(?:\\.\\d+)?)',
        r'Code\\s+of\\s+Civil\\s+Procedure\\s+[Ss]ection\\s+(\\d+\\.?\\d*)',
        r'California\\s+Rules\\s+of\\s+Court\\s+[Rr]ule\\s+(\\d+\\.?\\d*)',
    ]
    
    for pattern in ref_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        for match in matches:
            if match not in analysis["cross_references"]:
                analysis["cross_references"].append(match)
    
    # Extract key provisions (paragraphs with filing-related content)
    paragraphs = text.split('\\n\\n')
    filing_terms = ['filing', 'service', 'pleading', 'summons', 'complaint', 'procedure', 'deadline', 'format']
    
    for para in paragraphs:
        para = para.strip()
        if len(para) > 50 and any(term in para.lower() for term in filing_terms):
            analysis["key_provisions"].append(para[:300])
            if len(analysis["key_provisions"]) >= 5:  # Limit to top 5
                break
    
    return analysis

def main():
    pdf_paths = ${JSON.stringify(pdfPaths)}
    rule_data = ${pythonCompatibleRuleData}
    
    # Create mapping of PDF paths to rule data
    path_to_rule = {}
    for i, pdf_path in enumerate(pdf_paths):
        if i < len(rule_data):
            path_to_rule[pdf_path] = rule_data[i]
        else:
            path_to_rule[pdf_path] = {"ruleNumber": "Unknown", "title": "Unknown"}
    
    results = []
    
    print(f"Processing {len(pdf_paths)} CCP PDF files...")
    
    for i, pdf_path in enumerate(pdf_paths, 1):
        rule_info = path_to_rule.get(pdf_path, {})
        section_num = rule_info.get("ruleNumber", "Unknown")
        
        print(f"\\nProcessing {i}/{len(pdf_paths)}: CCP Section {section_num}")
        print(f"File: {os.path.basename(pdf_path)}")
        
        if not os.path.exists(pdf_path):
            print(f"❌ File not found: {pdf_path}")
            results.append({
                "rule_info": rule_info,
                "file_info": {
                    "file_path": pdf_path,
                    "status": "error",
                    "error": "File not found"
                }
            })
            continue
        
        result = extract_ccp_content(pdf_path, rule_info)
        results.append(result)
        
        if result["file_info"]["status"] == "success":
            content = result["content"]
            analysis = result["ccp_analysis"]
            print(f"✅ Success: {content['page_count']} pages, {content['word_count']} words")
            print(f"   📋 Procedural requirements: {len(analysis['procedural_requirements'])}")
            print(f"   ⏰ Timing requirements: {len(analysis['deadlines_and_timing'])}")
            print(f"   🔗 Cross-references: {len(analysis['cross_references'])}")
            print(f"   📄 Key provisions: {len(analysis['key_provisions'])}")
        else:
            print(f"❌ Error: {result['file_info'].get('error', 'Unknown error')}")
    
    # Save results
    output_path = "${path.join(this.outputDir, 'ccp_pymupdf_results.json').replace(/\\/g, '/')}"
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    
    print(f"\\n💾 CCP analysis results saved to: {output_path}")
    print(f"✅ Processed {len(results)} CCP section documents")
    
    # Generate summary
    successful = [r for r in results if r.get('file_info', {}).get('status') == 'success']
    total_procedures = sum(len(r.get('ccp_analysis', {}).get('procedural_requirements', [])) for r in successful)
    total_timing = sum(len(r.get('ccp_analysis', {}).get('deadlines_and_timing', [])) for r in successful)
    
    print(f"\\n📊 CCP Analysis Summary:")
    print(f"   • Successful extractions: {len(successful)}/{len(results)} documents")
    print(f"   • Total procedural requirements: {total_procedures}")
    print(f"   • Total timing requirements: {total_timing}")

if __name__ == "__main__":
    main()
`;
  }

  generateRuleFilename(section, index) {
    const sectionNum = section.ruleNumber.replace(/[^0-9.]/g, '');
    const timestamp = new Date().toISOString().slice(0, 10);
    return `ccp_section_${sectionNum}_${timestamp}_${index}.pdf`;
  }

  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async verifyPDFContent(filePath) {
    try {
      // Check if file exists and has reasonable size
      const stats = await fs.stat(filePath);
      if (stats.size < 1000) { // Less than 1KB is likely not a real PDF
        return false;
      }

      // Read first few bytes to check PDF header
      const fileHandle = await fs.open(filePath, 'r');
      const buffer = Buffer.alloc(10);
      await fileHandle.read(buffer, 0, 10, 0);
      await fileHandle.close();
      
      const header = buffer.toString('ascii', 0, 4);
      if (header !== '%PDF') {
        return false;
      }

      // Quick content check using PyMuPDF to see if it contains error messages
      return new Promise((resolve) => {
        const { spawn } = require('child_process');
        const pythonScript = `
import fitz
import sys
import os

try:
    doc = fitz.open("${filePath}")
    if len(doc) == 0:
        print("INVALID")
        sys.exit(1)
    
    # Get first page text
    page_text = doc[0].get_text().lower()
    doc.close()
    
    # Check for error indicators
    error_indicators = [
        "required pdf file not available",
        "please try again sometime later",
        "code: select code",
        "search phrase:",
        "bill information",
        "california law",
        "publications",
        "other resources"
    ]
    
    if any(indicator in page_text for indicator in error_indicators):
        print("ERROR_PAGE")
    else:
        print("VALID")
        
except Exception as e:
    print("INVALID")
`;
        
        const pythonProcess = spawn('python3', ['-c', pythonScript]);
        let output = '';
        
        pythonProcess.stdout.on('data', (data) => {
          output += data.toString().trim();
        });
        
        pythonProcess.on('close', (code) => {
          resolve(output === 'VALID');
        });
        
        // Timeout after 5 seconds
        setTimeout(() => {
          pythonProcess.kill();
          resolve(false);
        }, 5000);
      });
      
    } catch (error) {
      console.log(`        ⚠️  PDF verification error: ${error.message}`);
      return false;
    }
  }

  async scrapeWebPageContent(page, filePath) {
    try {
      console.log(`        🌐 Scraping web page content as fallback...`);
      
      // Wait for page to be fully loaded
      await page.waitForTimeout(2000);
      
      // Extract the main content from the page
      const content = await page.evaluate(() => {
        // Look for the main content area
        const contentSelectors = [
          '#displayCodeSection',
          '.main-content',
          '.content',
          '.law-content',
          '.section-content',
          'main',
          'article'
        ];
        
        let mainContent = '';
        
        for (const selector of contentSelectors) {
          const element = document.querySelector(selector);
          if (element) {
            // Remove navigation and non-content elements
            const clonedElement = element.cloneNode(true);
            
            // Remove unwanted elements
            const unwantedSelectors = [
              'nav', '.nav', '.navigation',
              'header', '.header',
              'footer', '.footer',
              '.breadcrumb', '.breadcrumbs',
              '.sidebar', '.side-nav',
              'script', 'style',
              '.search', '.search-box',
              '.print-button', '.pdf-button',
              '.social-media', '.share-buttons'
            ];
            
            unwantedSelectors.forEach(unwantedSelector => {
              const unwantedElements = clonedElement.querySelectorAll(unwantedSelector);
              unwantedElements.forEach(el => el.remove());
            });
            
            mainContent = clonedElement.innerText || clonedElement.textContent || '';
            if (mainContent.trim().length > 100) {
              break;
            }
          }
        }
        
        // If no specific content area found, get body text but filter out navigation
        if (!mainContent || mainContent.trim().length < 100) {
          const bodyText = document.body.innerText || document.body.textContent || '';
          
          // Filter out common navigation and error text
          const lines = bodyText.split('\n');
          const filteredLines = lines.filter(line => {
            const lowerLine = line.toLowerCase().trim();
            return lowerLine.length > 10 && 
                   !lowerLine.includes('search phrase') &&
                   !lowerLine.includes('bill information') &&
                   !lowerLine.includes('california law') &&
                   !lowerLine.includes('publications') &&
                   !lowerLine.includes('other resources') &&
                   !lowerLine.includes('my subscriptions') &&
                   !lowerLine.includes('my favorites') &&
                   !lowerLine.includes('add to my favorites') &&
                   !lowerLine.includes('cross-reference') &&
                   !lowerLine.includes('previous') &&
                   !lowerLine.includes('next') &&
                   !lowerLine.includes('home') &&
                   !lowerLine.includes('search') &&
                   !lowerLine.includes('highlight');
          });
          
          mainContent = filteredLines.join('\n');
        }
        
        return {
          title: document.title,
          url: window.location.href,
          content: mainContent.trim(),
          timestamp: new Date().toISOString()
        };
      });
      
      // Verify we got meaningful content
      if (!content.content || content.content.length < 50) {
        console.log(`        ❌ Insufficient content extracted from web page`);
        return false;
      }
      
      // Check if content contains error messages
      const lowerContent = content.content.toLowerCase();
      const errorIndicators = [
        'required pdf file not available',
        'please try again sometime later',
        'code: select code'
      ];
      
      if (errorIndicators.some(indicator => lowerContent.includes(indicator))) {
        console.log(`        ❌ Web page contains error messages`);
        return false;
      }
      
      // Create a "fake" PDF containing the web content for processing
      const webContentData = {
        source: 'web_scraping',
        title: content.title,
        url: content.url,
        content: content.content,
        timestamp: content.timestamp,
        note: 'This content was scraped from the web page because PDF was not available'
      };
      
      // Save as JSON file instead of PDF (we'll handle this in the processing script)
      const jsonPath = filePath.replace('.pdf', '.json');
      await fs.writeFile(jsonPath, JSON.stringify(webContentData, null, 2));
      
      console.log(`        ✅ Web content scraped and saved as JSON`);
      console.log(`        📄 Content length: ${content.content.length} characters`);
      
      // Return the JSON path so the processing script knows to handle it differently
      return jsonPath;
      
    } catch (error) {
      console.error(`        ❌ Web scraping error: ${error.message}`);
      return false;
    }
  }

  async shouldDownloadPDFs() {
    try {
      // Check if download directory exists and has PDFs
      const files = await fs.readdir(this.downloadDir).catch(() => []);
      const pdfFiles = files.filter(file => file.endsWith('.pdf'));
      
      if (pdfFiles.length === 0) {
        console.log('📥 No existing PDFs found. Will download fresh copies.');
        return true;
      }
      
      // Check the age of the newest PDF file
      let newestTime = 0;
      for (const file of pdfFiles) {
        const filePath = path.join(this.downloadDir, file);
        const stats = await fs.stat(filePath);
        if (stats.mtime.getTime() > newestTime) {
          newestTime = stats.mtime.getTime();
        }
      }
      
      const hoursOld = (Date.now() - newestTime) / (1000 * 60 * 60);
      console.log(`📅 Newest PDF is ${hoursOld.toFixed(1)} hours old`);
      
      if (hoursOld > 24) {
        console.log('🔄 PDFs are older than 24 hours. Will download fresh copies.');
        return true;
      } else {
        console.log('✨ PDFs are recent. Will use existing files.');
        return false;
      }
      
    } catch (error) {
      console.log('⚠️  Error checking PDF age. Will download fresh copies.');
      return true;
    }
  }

  async getExistingPDFData() {
    try {
      const files = await fs.readdir(this.downloadDir);
      const pdfFiles = files.filter(file => file.endsWith('.pdf') && file.startsWith('ccp_section_'));
      
      const pdfPaths = pdfFiles.map(file => path.join(this.downloadDir, file));
      const ruleData = [];
      
      // Extract rule information from filenames
      for (const file of pdfFiles) {
        // Expected format: ccp_section_XXX_YYYY-MM-DD_N.pdf
        const match = file.match(/ccp_section_([0-9.]+)_(\d{4}-\d{2}-\d{2})_(\d+)\.pdf/);
        if (match) {
          const [, sectionNum, date, index] = match;
          ruleData.push({
            ruleNumber: sectionNum,
            title: `CCP Section ${sectionNum}`,
            url: `https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=${sectionNum}`,
            filename: file,
            source: 'existing_pdf',
            filingRelevance: { score: 8, isRelevant: true, source: 'pre_filtered' }
          });
        }
      }
      
      console.log(`📁 Found ${pdfFiles.length} existing PDF files`);
      
      return {
        pdfPaths,
        ruleData
      };
      
    } catch (error) {
      console.error('Error getting existing PDF data:', error);
      return { pdfPaths: [], ruleData: [] };
    }
  }

  async processWebScrapedJSON(jsonPaths, ruleData) {
    const results = [];
    
    console.log(`🌐 Processing ${jsonPaths.length} web-scraped JSON files...`);
    
    for (let i = 0; i < jsonPaths.length; i++) {
      const jsonPath = jsonPaths[i];
      const ruleInfo = ruleData[i] || {};
      
      try {
        console.log(`\n📄 Processing ${i + 1}/${jsonPaths.length}: ${path.basename(jsonPath)}`);
        
        // Read the JSON file
        const jsonContent = await fs.readFile(jsonPath, 'utf8');
        const webData = JSON.parse(jsonContent);
        
        // Analyze the web content
        const analysis = this.analyzeWebScrapedContent(webData.content, ruleInfo);
        
        const result = {
          rule_info: ruleInfo,
          file_info: {
            file_path: jsonPath,
            file_name: path.basename(jsonPath),
            status: "success",
            content_type: "web_scraped"
          },
          metadata: {
            title: webData.title || "",
            url: webData.url || "",
            scraped_at: webData.timestamp || "",
            source: "web_scraping_fallback",
            note: webData.note || ""
          },
          content: {
            full_text: webData.content,
            page_count: 1, // Web pages are considered single "page"
            pages: [{
              page: 1,
              text: webData.content
            }],
            character_count: webData.content.length,
            word_count: webData.content.split(/\s+/).length
          },
          ccp_analysis: analysis,
          extracted_at: new Date().toISOString()
        };
        
        results.push(result);
        
        console.log(`✅ Success: ${result.content.word_count} words extracted`);
        console.log(`   📋 Procedural requirements: ${analysis.procedural_requirements.length}`);
        console.log(`   ⏰ Timing requirements: ${analysis.deadlines_and_timing.length}`);
        console.log(`   🔗 Cross-references: ${analysis.cross_references.length}`);
        
      } catch (error) {
        console.error(`❌ Error processing ${jsonPath}: ${error.message}`);
        
        results.push({
          rule_info: ruleInfo,
          file_info: {
            file_path: jsonPath,
            file_name: path.basename(jsonPath),
            status: "error",
            error: error.message,
            content_type: "web_scraped"
          },
          extracted_at: new Date().toISOString()
        });
      }
    }
    
    return results;
  }

  analyzeWebScrapedContent(text, ruleInfo) {
    // Similar analysis to PDF content but adapted for web-scraped text
    const analysis = {
      section_number: ruleInfo.ruleNumber || "",
      section_title: ruleInfo.title || "",
      filing_relevance: ruleInfo.filingRelevance || {},
      procedural_requirements: [],
      filing_procedures: [],
      service_requirements: [],
      deadlines_and_timing: [],
      format_specifications: [],
      cross_references: [],
      key_provisions: []
    };
    
    if (!text || text.length < 50) {
      return analysis;
    }
    
    // Extract procedural requirements
    const procPatterns = [
      /shall\s+(?:be\s+)?(?:file[d]?|serve[d]?)\s+([^.]{10,100})/gi,
      /must\s+(?:be\s+)?(?:file[d]?|serve[d]?)\s+([^.]{10,100})/gi,
      /(?:filing|service)\s+(?:shall|must)\s+([^.]{10,100})/gi,
      /(?:document|paper|pleading)\s+(?:shall|must)\s+([^.]{10,100})/gi
    ];
    
    procPatterns.forEach(pattern => {
      const matches = text.match(pattern) || [];
      matches.forEach(match => {
        if (match.length > 15) {
          analysis.procedural_requirements.push(match.substring(0, 200));
        }
      });
    });
    
    // Extract timing requirements
    const timingPatterns = [
      /within\s+(\d+)\s+(calendar\s+days?|court\s+days?|business\s+days?|days?)/gi,
      /(\d+)\s+(calendar\s+days?|court\s+days?|business\s+days?)\s+(?:before|after|from)/gi,
      /(?:no\s+later\s+than|not\s+later\s+than)\s+([^.]{5,50})/gi,
      /(?:deadline|due\s+date|time\s+limit)\s+(?:is|shall\s+be)\s+([^.]{5,50})/gi
    ];
    
    timingPatterns.forEach(pattern => {
      const matches = text.match(pattern) || [];
      matches.forEach(match => {
        if (match.length > 3) {
          analysis.deadlines_and_timing.push(match.substring(0, 150));
        }
      });
    });
    
    // Extract cross-references
    const refPatterns = [
      /(?:Section|Rule|Code)\s+(\d+\.?\d*(?:\.\d+)?)/gi,
      /Code\s+of\s+Civil\s+Procedure\s+[Ss]ection\s+(\d+\.?\d*)/gi,
      /California\s+Rules\s+of\s+Court\s+[Rr]ule\s+(\d+\.?\d*)/gi,
    ];
    
    refPatterns.forEach(pattern => {
      const matches = text.match(pattern) || [];
      matches.forEach(match => {
        const sectionMatch = match.match(/(\d+\.?\d*(?:\.\d+)?)/);
        if (sectionMatch && !analysis.cross_references.includes(sectionMatch[1])) {
          analysis.cross_references.push(sectionMatch[1]);
        }
      });
    });
    
    // Extract key provisions (paragraphs with filing-related content)
    const paragraphs = text.split(/\n\s*\n/);
    const filingTerms = ['filing', 'service', 'pleading', 'summons', 'complaint', 'procedure', 'deadline', 'format'];
    
    paragraphs.forEach(para => {
      para = para.trim();
      if (para.length > 50 && filingTerms.some(term => para.toLowerCase().includes(term))) {
        analysis.key_provisions.push(para.substring(0, 300));
        if (analysis.key_provisions.length >= 5) { // Limit to top 5
          return;
        }
      }
    });
    
    return analysis;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Usage example for the new PDF-first approach
async function main() {
  const scraper = new HierarchicalPDFScraper({
    downloadDir: './ccp_pdfs',
    outputDir: './ccp_results',
    delay: 2000,
    maxConcurrent: 2
  });

  try {
    console.log('🚀 Starting CCP PDF-first scraping...');
    const results = await scraper.scrapeHierarchicalPDFs();
    
    console.log('\n🎉 CCP scraping completed successfully!');
    console.log(`📊 Total documents processed: ${results.extracted_documents?.length || 0}`);
    
    const successful = results.extracted_documents?.filter(d => d.file_info?.status === 'success') || [];
    console.log(`✅ Successful extractions: ${successful.length}`);
    
  } catch (error) {
    console.error('❌ CCP scraping failed:', error);
  }
}

// Export for use as module
module.exports = { HierarchicalPDFScraper };

// Run if executed directly
if (require.main === module) {
  main();
}