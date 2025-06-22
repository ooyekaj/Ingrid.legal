
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
                full_text += page_text + "\n"
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
        r'shall\s+(?:be\s+)?(?:file[d]?|serve[d]?)\s+([^.]{10,100})',
        r'must\s+(?:be\s+)?(?:file[d]?|serve[d]?)\s+([^.]{10,100})',
        r'(?:filing|service)\s+(?:shall|must)\s+([^.]{10,100})',
        r'(?:document|paper|pleading)\s+(?:shall|must)\s+([^.]{10,100})'
    ]
    
    for pattern in proc_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        for match in matches:
            if len(match.strip()) > 15:
                analysis["procedural_requirements"].append(match.strip()[:200])
    
    # Extract timing requirements
    timing_patterns = [
        r'within\s+(\d+)\s+(calendar\s+days?|court\s+days?|business\s+days?|days?)',
        r'(\d+)\s+(calendar\s+days?|court\s+days?|business\s+days?)\s+(?:before|after|from)',
        r'(?:no\s+later\s+than|not\s+later\s+than)\s+([^.]{5,50})',
        r'(?:deadline|due\s+date|time\s+limit)\s+(?:is|shall\s+be)\s+([^.]{5,50})'
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
        r'(?:Section|Rule|Code)\s+(\d+\.?\d*(?:\.\d+)?)',
        r'Code\s+of\s+Civil\s+Procedure\s+[Ss]ection\s+(\d+\.?\d*)',
        r'California\s+Rules\s+of\s+Court\s+[Rr]ule\s+(\d+\.?\d*)',
    ]
    
    for pattern in ref_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        for match in matches:
            if match not in analysis["cross_references"]:
                analysis["cross_references"].append(match)
    
    # Extract key provisions (paragraphs with filing-related content)
    paragraphs = text.split('\n\n')
    filing_terms = ['filing', 'service', 'pleading', 'summons', 'complaint', 'procedure', 'deadline', 'format']
    
    for para in paragraphs:
        para = para.strip()
        if len(para) > 50 and any(term in para.lower() for term in filing_terms):
            analysis["key_provisions"].append(para[:300])
            if len(analysis["key_provisions"]) >= 5:  # Limit to top 5
                break
    
    return analysis

def main():
    pdf_paths = ["ccp_pdfs/ccp_section_020_2025-06-20_0.pdf","ccp_pdfs/ccp_section_1002.7_2025-06-20_46.pdf","ccp_pdfs/ccp_section_1008_2025-06-20_47.pdf","ccp_pdfs/ccp_section_109_2025-06-20_3.pdf","ccp_pdfs/ccp_section_109_2025-06-20_4.pdf","ccp_pdfs/ccp_section_116.630_2025-06-20_5.pdf","ccp_pdfs/ccp_section_1250.250_2025-06-20_48.pdf","ccp_pdfs/ccp_section_150_2025-06-20_4.pdf","ccp_pdfs/ccp_section_150_2025-06-20_6.pdf","ccp_pdfs/ccp_section_161_2025-06-20_5.pdf","ccp_pdfs/ccp_section_161_2025-06-20_7.pdf","ccp_pdfs/ccp_section_2025.340_2025-06-20_49.pdf","ccp_pdfs/ccp_section_2031.320_2025-06-20_50.pdf","ccp_pdfs/ccp_section_2033.740_2025-06-20_51.pdf","ccp_pdfs/ccp_section_2034.010_2025-06-20_52.pdf","ccp_pdfs/ccp_section_2034.630_2025-06-20_53.pdf","ccp_pdfs/ccp_section_2035.060_2025-06-20_54.pdf","ccp_pdfs/ccp_section_30_2025-06-20_0.pdf","ccp_pdfs/ccp_section_30_2025-06-20_1.pdf","ccp_pdfs/ccp_section_340_2025-06-20_6.pdf","ccp_pdfs/ccp_section_340_2025-06-20_8.pdf","ccp_pdfs/ccp_section_405.8_2025-06-20_7.pdf","ccp_pdfs/ccp_section_405.8_2025-06-20_9.pdf","ccp_pdfs/ccp_section_410.10_2025-06-20_10.pdf","ccp_pdfs/ccp_section_410.10_2025-06-20_8.pdf","ccp_pdfs/ccp_section_410.42_2025-06-20_11.pdf","ccp_pdfs/ccp_section_410.42_2025-06-20_9.pdf","ccp_pdfs/ccp_section_410.70_2025-06-20_10.pdf","ccp_pdfs/ccp_section_410.70_2025-06-20_12.pdf","ccp_pdfs/ccp_section_411.35_2025-06-20_11.pdf","ccp_pdfs/ccp_section_411.35_2025-06-20_13.pdf","ccp_pdfs/ccp_section_412.30_2025-06-20_13.pdf","ccp_pdfs/ccp_section_412.30_2025-06-20_15.pdf","ccp_pdfs/ccp_section_412_2025-06-20_12.pdf","ccp_pdfs/ccp_section_412_2025-06-20_14.pdf","ccp_pdfs/ccp_section_413.40_2025-06-20_14.pdf","ccp_pdfs/ccp_section_413.40_2025-06-20_16.pdf","ccp_pdfs/ccp_section_414.10_2025-06-20_15.pdf","ccp_pdfs/ccp_section_414.10_2025-06-20_17.pdf","ccp_pdfs/ccp_section_415.95_2025-06-20_16.pdf","ccp_pdfs/ccp_section_415.95_2025-06-20_18.pdf","ccp_pdfs/ccp_section_416.90_2025-06-20_17.pdf","ccp_pdfs/ccp_section_416.90_2025-06-20_19.pdf","ccp_pdfs/ccp_section_417.40_2025-06-20_18.pdf","ccp_pdfs/ccp_section_417.40_2025-06-20_20.pdf","ccp_pdfs/ccp_section_418.11_2025-06-20_19.pdf","ccp_pdfs/ccp_section_418.11_2025-06-20_21.pdf","ccp_pdfs/ccp_section_420_2025-06-20_20.pdf","ccp_pdfs/ccp_section_420_2025-06-20_22.pdf","ccp_pdfs/ccp_section_421_2025-06-20_21.pdf","ccp_pdfs/ccp_section_421_2025-06-20_23.pdf","ccp_pdfs/ccp_section_422.40_2025-06-20_22.pdf","ccp_pdfs/ccp_section_422.40_2025-06-20_24.pdf","ccp_pdfs/ccp_section_425.55_2025-06-20_23.pdf","ccp_pdfs/ccp_section_425.55_2025-06-20_25.pdf","ccp_pdfs/ccp_section_426.70_2025-06-20_24.pdf","ccp_pdfs/ccp_section_426.70_2025-06-20_26.pdf","ccp_pdfs/ccp_section_427.10_2025-06-20_25.pdf","ccp_pdfs/ccp_section_427.10_2025-06-20_27.pdf","ccp_pdfs/ccp_section_428.80_2025-06-20_26.pdf","ccp_pdfs/ccp_section_428.80_2025-06-20_28.pdf","ccp_pdfs/ccp_section_429.30_2025-06-20_27.pdf","ccp_pdfs/ccp_section_429.30_2025-06-20_29.pdf","ccp_pdfs/ccp_section_430.90_2025-06-20_29.pdf","ccp_pdfs/ccp_section_430.90_2025-06-20_31.pdf","ccp_pdfs/ccp_section_430_2025-06-20_28.pdf","ccp_pdfs/ccp_section_430_2025-06-20_30.pdf","ccp_pdfs/ccp_section_431.70_2025-06-20_30.pdf","ccp_pdfs/ccp_section_431.70_2025-06-20_32.pdf","ccp_pdfs/ccp_section_432.10_2025-06-20_32.pdf","ccp_pdfs/ccp_section_432.10_2025-06-20_34.pdf","ccp_pdfs/ccp_section_432_2025-06-20_31.pdf","ccp_pdfs/ccp_section_432_2025-06-20_33.pdf","ccp_pdfs/ccp_section_437_2025-06-20_33.pdf","ccp_pdfs/ccp_section_437_2025-06-20_35.pdf","ccp_pdfs/ccp_section_437_2025-06-20_999.pdf","ccp_pdfs/ccp_section_439_2025-06-20_34.pdf","ccp_pdfs/ccp_section_439_2025-06-20_36.pdf","ccp_pdfs/ccp_section_440_2025-06-20_35.pdf","ccp_pdfs/ccp_section_440_2025-06-20_37.pdf","ccp_pdfs/ccp_section_446_2025-06-20_36.pdf","ccp_pdfs/ccp_section_446_2025-06-20_38.pdf","ccp_pdfs/ccp_section_450_2025-06-20_37.pdf","ccp_pdfs/ccp_section_465_2025-06-20_38.pdf","ccp_pdfs/ccp_section_470_2025-06-20_39.pdf","ccp_pdfs/ccp_section_475_2025-06-20_40.pdf","ccp_pdfs/ccp_section_583.161_2025-06-20_41.pdf","ccp_pdfs/ccp_section_703.150_2025-06-20_42.pdf","ccp_pdfs/ccp_section_706.109_2025-06-20_43.pdf","ccp_pdfs/ccp_section_762.090_2025-06-20_44.pdf","ccp_pdfs/ccp_section_80_2025-06-20_1.pdf","ccp_pdfs/ccp_section_80_2025-06-20_2.pdf","ccp_pdfs/ccp_section_834_2025-06-20_45.pdf","ccp_pdfs/ccp_section_95_2025-06-20_2.pdf","ccp_pdfs/ccp_section_95_2025-06-20_3.pdf"]
    rule_data = [{"ruleNumber":"020","title":"CCP Section 020","url":"https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=020","filename":"ccp_section_020_2025-06-20_0.pdf","source":"existing_pdf","filingRelevance":{"score":8,"isRelevant":True,"source":"pre_filtered"}},{"ruleNumber":"1002.7","title":"CCP Section 1002.7","url":"https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=1002.7","filename":"ccp_section_1002.7_2025-06-20_46.pdf","source":"existing_pdf","filingRelevance":{"score":8,"isRelevant":True,"source":"pre_filtered"}},{"ruleNumber":"1008","title":"CCP Section 1008","url":"https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=1008","filename":"ccp_section_1008_2025-06-20_47.pdf","source":"existing_pdf","filingRelevance":{"score":8,"isRelevant":True,"source":"pre_filtered"}},{"ruleNumber":"109","title":"CCP Section 109","url":"https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=109","filename":"ccp_section_109_2025-06-20_3.pdf","source":"existing_pdf","filingRelevance":{"score":8,"isRelevant":True,"source":"pre_filtered"}},{"ruleNumber":"109","title":"CCP Section 109","url":"https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=109","filename":"ccp_section_109_2025-06-20_4.pdf","source":"existing_pdf","filingRelevance":{"score":8,"isRelevant":True,"source":"pre_filtered"}},{"ruleNumber":"116.630","title":"CCP Section 116.630","url":"https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=116.630","filename":"ccp_section_116.630_2025-06-20_5.pdf","source":"existing_pdf","filingRelevance":{"score":8,"isRelevant":True,"source":"pre_filtered"}},{"ruleNumber":"1250.250","title":"CCP Section 1250.250","url":"https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=1250.250","filename":"ccp_section_1250.250_2025-06-20_48.pdf","source":"existing_pdf","filingRelevance":{"score":8,"isRelevant":True,"source":"pre_filtered"}},{"ruleNumber":"150","title":"CCP Section 150","url":"https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=150","filename":"ccp_section_150_2025-06-20_4.pdf","source":"existing_pdf","filingRelevance":{"score":8,"isRelevant":True,"source":"pre_filtered"}},{"ruleNumber":"150","title":"CCP Section 150","url":"https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=150","filename":"ccp_section_150_2025-06-20_6.pdf","source":"existing_pdf","filingRelevance":{"score":8,"isRelevant":True,"source":"pre_filtered"}},{"ruleNumber":"161","title":"CCP Section 161","url":"https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=161","filename":"ccp_section_161_2025-06-20_5.pdf","source":"existing_pdf","filingRelevance":{"score":8,"isRelevant":True,"source":"pre_filtered"}},{"ruleNumber":"161","title":"CCP Section 161","url":"https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=161","filename":"ccp_section_161_2025-06-20_7.pdf","source":"existing_pdf","filingRelevance":{"score":8,"isRelevant":True,"source":"pre_filtered"}},{"ruleNumber":"2025.340","title":"CCP Section 2025.340","url":"https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=2025.340","filename":"ccp_section_2025.340_2025-06-20_49.pdf","source":"existing_pdf","filingRelevance":{"score":8,"isRelevant":True,"source":"pre_filtered"}},{"ruleNumber":"2031.320","title":"CCP Section 2031.320","url":"https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=2031.320","filename":"ccp_section_2031.320_2025-06-20_50.pdf","source":"existing_pdf","filingRelevance":{"score":8,"isRelevant":True,"source":"pre_filtered"}},{"ruleNumber":"2033.740","title":"CCP Section 2033.740","url":"https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=2033.740","filename":"ccp_section_2033.740_2025-06-20_51.pdf","source":"existing_pdf","filingRelevance":{"score":8,"isRelevant":True,"source":"pre_filtered"}},{"ruleNumber":"2034.010","title":"CCP Section 2034.010","url":"https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=2034.010","filename":"ccp_section_2034.010_2025-06-20_52.pdf","source":"existing_pdf","filingRelevance":{"score":8,"isRelevant":True,"source":"pre_filtered"}},{"ruleNumber":"2034.630","title":"CCP Section 2034.630","url":"https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=2034.630","filename":"ccp_section_2034.630_2025-06-20_53.pdf","source":"existing_pdf","filingRelevance":{"score":8,"isRelevant":True,"source":"pre_filtered"}},{"ruleNumber":"2035.060","title":"CCP Section 2035.060","url":"https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=2035.060","filename":"ccp_section_2035.060_2025-06-20_54.pdf","source":"existing_pdf","filingRelevance":{"score":8,"isRelevant":True,"source":"pre_filtered"}},{"ruleNumber":"30","title":"CCP Section 30","url":"https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=30","filename":"ccp_section_30_2025-06-20_0.pdf","source":"existing_pdf","filingRelevance":{"score":8,"isRelevant":True,"source":"pre_filtered"}},{"ruleNumber":"30","title":"CCP Section 30","url":"https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=30","filename":"ccp_section_30_2025-06-20_1.pdf","source":"existing_pdf","filingRelevance":{"score":8,"isRelevant":True,"source":"pre_filtered"}},{"ruleNumber":"340","title":"CCP Section 340","url":"https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=340","filename":"ccp_section_340_2025-06-20_6.pdf","source":"existing_pdf","filingRelevance":{"score":8,"isRelevant":True,"source":"pre_filtered"}},{"ruleNumber":"340","title":"CCP Section 340","url":"https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=340","filename":"ccp_section_340_2025-06-20_8.pdf","source":"existing_pdf","filingRelevance":{"score":8,"isRelevant":True,"source":"pre_filtered"}},{"ruleNumber":"405.8","title":"CCP Section 405.8","url":"https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=405.8","filename":"ccp_section_405.8_2025-06-20_7.pdf","source":"existing_pdf","filingRelevance":{"score":8,"isRelevant":True,"source":"pre_filtered"}},{"ruleNumber":"405.8","title":"CCP Section 405.8","url":"https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=405.8","filename":"ccp_section_405.8_2025-06-20_9.pdf","source":"existing_pdf","filingRelevance":{"score":8,"isRelevant":True,"source":"pre_filtered"}},{"ruleNumber":"410.10","title":"CCP Section 410.10","url":"https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=410.10","filename":"ccp_section_410.10_2025-06-20_10.pdf","source":"existing_pdf","filingRelevance":{"score":8,"isRelevant":True,"source":"pre_filtered"}},{"ruleNumber":"410.10","title":"CCP Section 410.10","url":"https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=410.10","filename":"ccp_section_410.10_2025-06-20_8.pdf","source":"existing_pdf","filingRelevance":{"score":8,"isRelevant":True,"source":"pre_filtered"}},{"ruleNumber":"410.42","title":"CCP Section 410.42","url":"https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=410.42","filename":"ccp_section_410.42_2025-06-20_11.pdf","source":"existing_pdf","filingRelevance":{"score":8,"isRelevant":True,"source":"pre_filtered"}},{"ruleNumber":"410.42","title":"CCP Section 410.42","url":"https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=410.42","filename":"ccp_section_410.42_2025-06-20_9.pdf","source":"existing_pdf","filingRelevance":{"score":8,"isRelevant":True,"source":"pre_filtered"}},{"ruleNumber":"410.70","title":"CCP Section 410.70","url":"https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=410.70","filename":"ccp_section_410.70_2025-06-20_10.pdf","source":"existing_pdf","filingRelevance":{"score":8,"isRelevant":True,"source":"pre_filtered"}},{"ruleNumber":"410.70","title":"CCP Section 410.70","url":"https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=410.70","filename":"ccp_section_410.70_2025-06-20_12.pdf","source":"existing_pdf","filingRelevance":{"score":8,"isRelevant":True,"source":"pre_filtered"}},{"ruleNumber":"411.35","title":"CCP Section 411.35","url":"https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=411.35","filename":"ccp_section_411.35_2025-06-20_11.pdf","source":"existing_pdf","filingRelevance":{"score":8,"isRelevant":True,"source":"pre_filtered"}},{"ruleNumber":"411.35","title":"CCP Section 411.35","url":"https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=411.35","filename":"ccp_section_411.35_2025-06-20_13.pdf","source":"existing_pdf","filingRelevance":{"score":8,"isRelevant":True,"source":"pre_filtered"}},{"ruleNumber":"412.30","title":"CCP Section 412.30","url":"https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=412.30","filename":"ccp_section_412.30_2025-06-20_13.pdf","source":"existing_pdf","filingRelevance":{"score":8,"isRelevant":True,"source":"pre_filtered"}},{"ruleNumber":"412.30","title":"CCP Section 412.30","url":"https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=412.30","filename":"ccp_section_412.30_2025-06-20_15.pdf","source":"existing_pdf","filingRelevance":{"score":8,"isRelevant":True,"source":"pre_filtered"}},{"ruleNumber":"412","title":"CCP Section 412","url":"https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=412","filename":"ccp_section_412_2025-06-20_12.pdf","source":"existing_pdf","filingRelevance":{"score":8,"isRelevant":True,"source":"pre_filtered"}},{"ruleNumber":"412","title":"CCP Section 412","url":"https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=412","filename":"ccp_section_412_2025-06-20_14.pdf","source":"existing_pdf","filingRelevance":{"score":8,"isRelevant":True,"source":"pre_filtered"}},{"ruleNumber":"413.40","title":"CCP Section 413.40","url":"https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=413.40","filename":"ccp_section_413.40_2025-06-20_14.pdf","source":"existing_pdf","filingRelevance":{"score":8,"isRelevant":True,"source":"pre_filtered"}},{"ruleNumber":"413.40","title":"CCP Section 413.40","url":"https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=413.40","filename":"ccp_section_413.40_2025-06-20_16.pdf","source":"existing_pdf","filingRelevance":{"score":8,"isRelevant":True,"source":"pre_filtered"}},{"ruleNumber":"414.10","title":"CCP Section 414.10","url":"https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=414.10","filename":"ccp_section_414.10_2025-06-20_15.pdf","source":"existing_pdf","filingRelevance":{"score":8,"isRelevant":True,"source":"pre_filtered"}},{"ruleNumber":"414.10","title":"CCP Section 414.10","url":"https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=414.10","filename":"ccp_section_414.10_2025-06-20_17.pdf","source":"existing_pdf","filingRelevance":{"score":8,"isRelevant":True,"source":"pre_filtered"}},{"ruleNumber":"415.95","title":"CCP Section 415.95","url":"https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=415.95","filename":"ccp_section_415.95_2025-06-20_16.pdf","source":"existing_pdf","filingRelevance":{"score":8,"isRelevant":True,"source":"pre_filtered"}},{"ruleNumber":"415.95","title":"CCP Section 415.95","url":"https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=415.95","filename":"ccp_section_415.95_2025-06-20_18.pdf","source":"existing_pdf","filingRelevance":{"score":8,"isRelevant":True,"source":"pre_filtered"}},{"ruleNumber":"416.90","title":"CCP Section 416.90","url":"https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=416.90","filename":"ccp_section_416.90_2025-06-20_17.pdf","source":"existing_pdf","filingRelevance":{"score":8,"isRelevant":True,"source":"pre_filtered"}},{"ruleNumber":"416.90","title":"CCP Section 416.90","url":"https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=416.90","filename":"ccp_section_416.90_2025-06-20_19.pdf","source":"existing_pdf","filingRelevance":{"score":8,"isRelevant":True,"source":"pre_filtered"}},{"ruleNumber":"417.40","title":"CCP Section 417.40","url":"https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=417.40","filename":"ccp_section_417.40_2025-06-20_18.pdf","source":"existing_pdf","filingRelevance":{"score":8,"isRelevant":True,"source":"pre_filtered"}},{"ruleNumber":"417.40","title":"CCP Section 417.40","url":"https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=417.40","filename":"ccp_section_417.40_2025-06-20_20.pdf","source":"existing_pdf","filingRelevance":{"score":8,"isRelevant":True,"source":"pre_filtered"}},{"ruleNumber":"418.11","title":"CCP Section 418.11","url":"https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=418.11","filename":"ccp_section_418.11_2025-06-20_19.pdf","source":"existing_pdf","filingRelevance":{"score":8,"isRelevant":True,"source":"pre_filtered"}},{"ruleNumber":"418.11","title":"CCP Section 418.11","url":"https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=418.11","filename":"ccp_section_418.11_2025-06-20_21.pdf","source":"existing_pdf","filingRelevance":{"score":8,"isRelevant":True,"source":"pre_filtered"}},{"ruleNumber":"420","title":"CCP Section 420","url":"https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=420","filename":"ccp_section_420_2025-06-20_20.pdf","source":"existing_pdf","filingRelevance":{"score":8,"isRelevant":True,"source":"pre_filtered"}},{"ruleNumber":"420","title":"CCP Section 420","url":"https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=420","filename":"ccp_section_420_2025-06-20_22.pdf","source":"existing_pdf","filingRelevance":{"score":8,"isRelevant":True,"source":"pre_filtered"}},{"ruleNumber":"421","title":"CCP Section 421","url":"https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=421","filename":"ccp_section_421_2025-06-20_21.pdf","source":"existing_pdf","filingRelevance":{"score":8,"isRelevant":True,"source":"pre_filtered"}},{"ruleNumber":"421","title":"CCP Section 421","url":"https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=421","filename":"ccp_section_421_2025-06-20_23.pdf","source":"existing_pdf","filingRelevance":{"score":8,"isRelevant":True,"source":"pre_filtered"}},{"ruleNumber":"422.40","title":"CCP Section 422.40","url":"https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=422.40","filename":"ccp_section_422.40_2025-06-20_22.pdf","source":"existing_pdf","filingRelevance":{"score":8,"isRelevant":True,"source":"pre_filtered"}},{"ruleNumber":"422.40","title":"CCP Section 422.40","url":"https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=422.40","filename":"ccp_section_422.40_2025-06-20_24.pdf","source":"existing_pdf","filingRelevance":{"score":8,"isRelevant":True,"source":"pre_filtered"}},{"ruleNumber":"425.55","title":"CCP Section 425.55","url":"https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=425.55","filename":"ccp_section_425.55_2025-06-20_23.pdf","source":"existing_pdf","filingRelevance":{"score":8,"isRelevant":True,"source":"pre_filtered"}},{"ruleNumber":"425.55","title":"CCP Section 425.55","url":"https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=425.55","filename":"ccp_section_425.55_2025-06-20_25.pdf","source":"existing_pdf","filingRelevance":{"score":8,"isRelevant":True,"source":"pre_filtered"}},{"ruleNumber":"426.70","title":"CCP Section 426.70","url":"https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=426.70","filename":"ccp_section_426.70_2025-06-20_24.pdf","source":"existing_pdf","filingRelevance":{"score":8,"isRelevant":True,"source":"pre_filtered"}},{"ruleNumber":"426.70","title":"CCP Section 426.70","url":"https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=426.70","filename":"ccp_section_426.70_2025-06-20_26.pdf","source":"existing_pdf","filingRelevance":{"score":8,"isRelevant":True,"source":"pre_filtered"}},{"ruleNumber":"427.10","title":"CCP Section 427.10","url":"https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=427.10","filename":"ccp_section_427.10_2025-06-20_25.pdf","source":"existing_pdf","filingRelevance":{"score":8,"isRelevant":True,"source":"pre_filtered"}},{"ruleNumber":"427.10","title":"CCP Section 427.10","url":"https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=427.10","filename":"ccp_section_427.10_2025-06-20_27.pdf","source":"existing_pdf","filingRelevance":{"score":8,"isRelevant":True,"source":"pre_filtered"}},{"ruleNumber":"428.80","title":"CCP Section 428.80","url":"https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=428.80","filename":"ccp_section_428.80_2025-06-20_26.pdf","source":"existing_pdf","filingRelevance":{"score":8,"isRelevant":True,"source":"pre_filtered"}},{"ruleNumber":"428.80","title":"CCP Section 428.80","url":"https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=428.80","filename":"ccp_section_428.80_2025-06-20_28.pdf","source":"existing_pdf","filingRelevance":{"score":8,"isRelevant":True,"source":"pre_filtered"}},{"ruleNumber":"429.30","title":"CCP Section 429.30","url":"https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=429.30","filename":"ccp_section_429.30_2025-06-20_27.pdf","source":"existing_pdf","filingRelevance":{"score":8,"isRelevant":True,"source":"pre_filtered"}},{"ruleNumber":"429.30","title":"CCP Section 429.30","url":"https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=429.30","filename":"ccp_section_429.30_2025-06-20_29.pdf","source":"existing_pdf","filingRelevance":{"score":8,"isRelevant":True,"source":"pre_filtered"}},{"ruleNumber":"430.90","title":"CCP Section 430.90","url":"https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=430.90","filename":"ccp_section_430.90_2025-06-20_29.pdf","source":"existing_pdf","filingRelevance":{"score":8,"isRelevant":True,"source":"pre_filtered"}},{"ruleNumber":"430.90","title":"CCP Section 430.90","url":"https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=430.90","filename":"ccp_section_430.90_2025-06-20_31.pdf","source":"existing_pdf","filingRelevance":{"score":8,"isRelevant":True,"source":"pre_filtered"}},{"ruleNumber":"430","title":"CCP Section 430","url":"https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=430","filename":"ccp_section_430_2025-06-20_28.pdf","source":"existing_pdf","filingRelevance":{"score":8,"isRelevant":True,"source":"pre_filtered"}},{"ruleNumber":"430","title":"CCP Section 430","url":"https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=430","filename":"ccp_section_430_2025-06-20_30.pdf","source":"existing_pdf","filingRelevance":{"score":8,"isRelevant":True,"source":"pre_filtered"}},{"ruleNumber":"431.70","title":"CCP Section 431.70","url":"https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=431.70","filename":"ccp_section_431.70_2025-06-20_30.pdf","source":"existing_pdf","filingRelevance":{"score":8,"isRelevant":True,"source":"pre_filtered"}},{"ruleNumber":"431.70","title":"CCP Section 431.70","url":"https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=431.70","filename":"ccp_section_431.70_2025-06-20_32.pdf","source":"existing_pdf","filingRelevance":{"score":8,"isRelevant":True,"source":"pre_filtered"}},{"ruleNumber":"432.10","title":"CCP Section 432.10","url":"https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=432.10","filename":"ccp_section_432.10_2025-06-20_32.pdf","source":"existing_pdf","filingRelevance":{"score":8,"isRelevant":True,"source":"pre_filtered"}},{"ruleNumber":"432.10","title":"CCP Section 432.10","url":"https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=432.10","filename":"ccp_section_432.10_2025-06-20_34.pdf","source":"existing_pdf","filingRelevance":{"score":8,"isRelevant":True,"source":"pre_filtered"}},{"ruleNumber":"432","title":"CCP Section 432","url":"https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=432","filename":"ccp_section_432_2025-06-20_31.pdf","source":"existing_pdf","filingRelevance":{"score":8,"isRelevant":True,"source":"pre_filtered"}},{"ruleNumber":"432","title":"CCP Section 432","url":"https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=432","filename":"ccp_section_432_2025-06-20_33.pdf","source":"existing_pdf","filingRelevance":{"score":8,"isRelevant":True,"source":"pre_filtered"}},{"ruleNumber":"437","title":"CCP Section 437","url":"https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=437","filename":"ccp_section_437_2025-06-20_33.pdf","source":"existing_pdf","filingRelevance":{"score":8,"isRelevant":True,"source":"pre_filtered"}},{"ruleNumber":"437","title":"CCP Section 437","url":"https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=437","filename":"ccp_section_437_2025-06-20_35.pdf","source":"existing_pdf","filingRelevance":{"score":8,"isRelevant":True,"source":"pre_filtered"}},{"ruleNumber":"437","title":"CCP Section 437","url":"https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=437","filename":"ccp_section_437_2025-06-20_999.pdf","source":"existing_pdf","filingRelevance":{"score":8,"isRelevant":True,"source":"pre_filtered"}},{"ruleNumber":"439","title":"CCP Section 439","url":"https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=439","filename":"ccp_section_439_2025-06-20_34.pdf","source":"existing_pdf","filingRelevance":{"score":8,"isRelevant":True,"source":"pre_filtered"}},{"ruleNumber":"439","title":"CCP Section 439","url":"https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=439","filename":"ccp_section_439_2025-06-20_36.pdf","source":"existing_pdf","filingRelevance":{"score":8,"isRelevant":True,"source":"pre_filtered"}},{"ruleNumber":"440","title":"CCP Section 440","url":"https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=440","filename":"ccp_section_440_2025-06-20_35.pdf","source":"existing_pdf","filingRelevance":{"score":8,"isRelevant":True,"source":"pre_filtered"}},{"ruleNumber":"440","title":"CCP Section 440","url":"https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=440","filename":"ccp_section_440_2025-06-20_37.pdf","source":"existing_pdf","filingRelevance":{"score":8,"isRelevant":True,"source":"pre_filtered"}},{"ruleNumber":"446","title":"CCP Section 446","url":"https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=446","filename":"ccp_section_446_2025-06-20_36.pdf","source":"existing_pdf","filingRelevance":{"score":8,"isRelevant":True,"source":"pre_filtered"}},{"ruleNumber":"446","title":"CCP Section 446","url":"https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=446","filename":"ccp_section_446_2025-06-20_38.pdf","source":"existing_pdf","filingRelevance":{"score":8,"isRelevant":True,"source":"pre_filtered"}},{"ruleNumber":"450","title":"CCP Section 450","url":"https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=450","filename":"ccp_section_450_2025-06-20_37.pdf","source":"existing_pdf","filingRelevance":{"score":8,"isRelevant":True,"source":"pre_filtered"}},{"ruleNumber":"465","title":"CCP Section 465","url":"https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=465","filename":"ccp_section_465_2025-06-20_38.pdf","source":"existing_pdf","filingRelevance":{"score":8,"isRelevant":True,"source":"pre_filtered"}},{"ruleNumber":"470","title":"CCP Section 470","url":"https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=470","filename":"ccp_section_470_2025-06-20_39.pdf","source":"existing_pdf","filingRelevance":{"score":8,"isRelevant":True,"source":"pre_filtered"}},{"ruleNumber":"475","title":"CCP Section 475","url":"https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=475","filename":"ccp_section_475_2025-06-20_40.pdf","source":"existing_pdf","filingRelevance":{"score":8,"isRelevant":True,"source":"pre_filtered"}},{"ruleNumber":"583.161","title":"CCP Section 583.161","url":"https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=583.161","filename":"ccp_section_583.161_2025-06-20_41.pdf","source":"existing_pdf","filingRelevance":{"score":8,"isRelevant":True,"source":"pre_filtered"}},{"ruleNumber":"703.150","title":"CCP Section 703.150","url":"https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=703.150","filename":"ccp_section_703.150_2025-06-20_42.pdf","source":"existing_pdf","filingRelevance":{"score":8,"isRelevant":True,"source":"pre_filtered"}},{"ruleNumber":"706.109","title":"CCP Section 706.109","url":"https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=706.109","filename":"ccp_section_706.109_2025-06-20_43.pdf","source":"existing_pdf","filingRelevance":{"score":8,"isRelevant":True,"source":"pre_filtered"}},{"ruleNumber":"762.090","title":"CCP Section 762.090","url":"https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=762.090","filename":"ccp_section_762.090_2025-06-20_44.pdf","source":"existing_pdf","filingRelevance":{"score":8,"isRelevant":True,"source":"pre_filtered"}},{"ruleNumber":"80","title":"CCP Section 80","url":"https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=80","filename":"ccp_section_80_2025-06-20_1.pdf","source":"existing_pdf","filingRelevance":{"score":8,"isRelevant":True,"source":"pre_filtered"}},{"ruleNumber":"80","title":"CCP Section 80","url":"https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=80","filename":"ccp_section_80_2025-06-20_2.pdf","source":"existing_pdf","filingRelevance":{"score":8,"isRelevant":True,"source":"pre_filtered"}},{"ruleNumber":"834","title":"CCP Section 834","url":"https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=834","filename":"ccp_section_834_2025-06-20_45.pdf","source":"existing_pdf","filingRelevance":{"score":8,"isRelevant":True,"source":"pre_filtered"}},{"ruleNumber":"95","title":"CCP Section 95","url":"https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=95","filename":"ccp_section_95_2025-06-20_2.pdf","source":"existing_pdf","filingRelevance":{"score":8,"isRelevant":True,"source":"pre_filtered"}},{"ruleNumber":"95","title":"CCP Section 95","url":"https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=95","filename":"ccp_section_95_2025-06-20_3.pdf","source":"existing_pdf","filingRelevance":{"score":8,"isRelevant":True,"source":"pre_filtered"}}]
    
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
        
        print(f"\nProcessing {i}/{len(pdf_paths)}: CCP Section {section_num}")
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
    output_path = "ccp_results/ccp_pymupdf_results.json"
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    
    print(f"\n💾 CCP analysis results saved to: {output_path}")
    print(f"✅ Processed {len(results)} CCP section documents")
    
    # Generate summary
    successful = [r for r in results if r.get('file_info', {}).get('status') == 'success']
    total_procedures = sum(len(r.get('ccp_analysis', {}).get('procedural_requirements', [])) for r in successful)
    total_timing = sum(len(r.get('ccp_analysis', {}).get('deadlines_and_timing', [])) for r in successful)
    
    print(f"\n📊 CCP Analysis Summary:")
    print(f"   • Successful extractions: {len(successful)}/{len(results)} documents")
    print(f"   • Total procedural requirements: {total_procedures}")
    print(f"   • Total timing requirements: {total_timing}")

if __name__ == "__main__":
    main()
