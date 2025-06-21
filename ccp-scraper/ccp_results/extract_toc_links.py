
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
                        section_match = re.search(r'sectionNum=([\d\.a-z]+)', uri)
                        if section_match:
                            section_num = section_match.group(1)
                            
                            # Get the text content around this link for context
                            rect = link['from']
                            # Get text in the vicinity of the link
                            text_area = page.get_text("text", clip=rect)
                            
                            # Try to find the section title in the surrounding text
                            lines = page_text.split('\n')
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
                r'(\d+[a-z]?\.\d+[a-z]?)\s+[A-Z][^\n]{10,}',  # "415.10 SOME TITLE" or "437c.10 TITLE"
                r'(\d+[a-z]?)\s+[A-Z][^\n]{10,}',               # "415 SOME TITLE" or "437c TITLE"
                r'Section\s+(\d+[a-z]?\.?\d*[a-z]?)\s+[A-Z][^\n]{10,}',  # "Section 415.10 SOME TITLE" or "Section 437c TITLE"
                r'(\d+[a-z])\.\s+[A-Z][^\n]{10,}',             # "437c. SOME TITLE"
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
        
        print(f"\nExtracted {len(final_links)} unique section links")
        
        # Show sample of extracted links
        print("\nSample sections found:")
        for i, link in enumerate(final_links[:10]):
            print(f"  {i+1}. Section {link['ruleNumber']}: {link['title'][:60]}...")
        
        if len(final_links) > 10:
            print(f"  ... and {len(final_links) - 10} more sections")
        
        return final_links
        
    except Exception as e:
        print(f"Error extracting TOC links: {e}")
        return []

def main():
    pdf_path = "ccp_pdfs/ccp_toc.pdf"
    
    if not os.path.exists(pdf_path):
        print(f"Error: TOC PDF not found at {pdf_path}")
        return
    
    links = extract_toc_links(pdf_path)
    
    # Save results
    output_path = "ccp_results/toc_links.json"
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(links, f, indent=2, ensure_ascii=False)
    
    print(f"\n💾 TOC links saved to: {output_path}")
    print(f"✅ Successfully extracted {len(links)} section links from TOC PDF")

if __name__ == "__main__":
    main()
