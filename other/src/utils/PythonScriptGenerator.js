const path = require('path');

class PythonScriptGenerator {
  static generateTocExtractionScript(tocPdfPath, outputDir) {
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
    output_path = "${path.join(outputDir, 'toc_links.json').replace(/\\/g, '/')}"
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(links, f, indent=2, ensure_ascii=False)
    
    print(f"\\n💾 TOC links saved to: {output_path}")
    print(f"✅ Successfully extracted {len(links)} section links from TOC PDF")

if __name__ == "__main__":
    main()
`;
  }

  static generateEnhancedPyMuPDFScript(pdfPaths, ruleData, outputDir) {
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
    output_path = "${path.join(outputDir, 'ccp_pymupdf_results.json').replace(/\\/g, '/')}"
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
}

module.exports = PythonScriptGenerator; 