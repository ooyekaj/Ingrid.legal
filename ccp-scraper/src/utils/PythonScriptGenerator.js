const ScraperConfig = require('../config/ScraperConfig');

/**
 * Enhanced Python Script Generator for CCP/CRC Content Analysis
 * Generates Python scripts with improved pattern matching and metadata extraction
 */
class PythonScriptGenerator {
  
  /**
   * Generate enhanced PyMuPDF script with improved content analysis
   */
  static generateEnhancedPyMuPDFScript(pdfPaths, ruleData) {
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
    """Extract content from a CCP PDF with enhanced rule-specific parsing"""
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
        
        # Enhanced CCP-specific content analysis
        ccp_analysis = analyze_enhanced_ccp_content(full_text, rule_info)
        
        # Store page count before closing document
        page_count = len(doc)
        doc.close()
        
        # CRITICAL FIX: Update rule_info with the correct section number
        corrected_rule_info = rule_info.copy()
        corrected_rule_info["ruleNumber"] = ccp_analysis["section_number"]
        corrected_rule_info["title"] = ccp_analysis["section_title"]
        
        return {
            "rule_info": corrected_rule_info,
            "file_info": {
                "file_path": pdf_path,
                "file_name": os.path.basename(pdf_path),
                "status": "success",
                "content_type": "pdf"
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
        # CRITICAL FIX: Try to extract section from filename even on error
        try:
            fallback_section = extract_section_number_from_content("", rule_info)
            corrected_rule_info = rule_info.copy()
            corrected_rule_info["ruleNumber"] = fallback_section
            corrected_rule_info["title"] = f"CCP Section {fallback_section}"
        except:
            corrected_rule_info = rule_info
            
        return {
            "rule_info": corrected_rule_info,
            "file_info": {
                "file_path": pdf_path,
                "file_name": os.path.basename(pdf_path),
                "status": "error",
                "error": str(e),
                "content_type": "pdf"
            },
            "extracted_at": datetime.now().isoformat()
        }

def extract_section_number_from_content(text, rule_info):
    """CRITICAL FIX: Extract actual section number from PDF content with comprehensive regex patterns"""
    
    # COMPREHENSIVE section number patterns that handle ALL CCP section formats
    section_patterns = [
        # Pattern 1: "Section 12a" or "Section 12c" (lettered subsections)
        r'Section\\s+(\\d+[a-z])\\b',
        # Pattern 2: "Section 12.5" or "Section 1010.6" (decimal subsections) 
        r'Section\\s+(\\d+\\.\\d+)\\b',
        # Pattern 3: "Section 437c" (number+letter without space)
        r'Section\\s+(\\d+[a-z]?)\\b',
        # Pattern 4: Basic "Section 12" or "Section 437"
        r'Section\\s+(\\d+)\\b',
        # Pattern 5: Complex numbering like "2024.020"
        r'Section\\s+(\\d+\\.\\d+)\\b'
    ]
    
    # Try each pattern in order of specificity (most specific first)
    for pattern in section_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        if matches:
            # Return the first match found
            extracted_section = matches[0].strip()
            print(f"  📍 Extracted section number: '{extracted_section}' using pattern: {pattern}")
            return extracted_section
    
    # Fallback: Try to extract from filename if content extraction fails
    filename = rule_info.get("filename", "")
    if filename:
        # Pattern: "ccp_section_12a_2025-06-20_220.pdf"
        filename_pattern = r'ccp_section_([\\d]+[a-z]?(?:\\.\\d+)?)'
        filename_match = re.search(filename_pattern, filename, re.IGNORECASE)
        if filename_match:
            extracted_section = filename_match.group(1)
            print(f"  📍 Extracted section number from filename: '{extracted_section}'")
            return extracted_section
    
    # Final fallback: Use rule_info but warn about potential inaccuracy
    fallback_section = rule_info.get("ruleNumber", "Unknown")
    print(f"  ⚠️  WARNING: Using fallback section number '{fallback_section}' - may be inaccurate")
    return fallback_section

def analyze_enhanced_ccp_content(text, rule_info):
    """Enhanced CCP content analysis with comprehensive metadata extraction"""
    
    # CRITICAL FIX: Extract actual section number from PDF content, not just rule_info
    actual_section_number = extract_section_number_from_content(text, rule_info)
    actual_section_title = f"CCP Section {actual_section_number}"
    
    # Base analysis structure with enhanced metadata
    analysis = {
        "section_number": actual_section_number,
        "section_title": actual_section_title,
        "filing_relevance": rule_info.get("filingRelevance", {}),
        
        # Enhanced metadata fields
        "rule_status": {
            "effective_date": None,
            "last_amended": None,
            "status": "active",
            "amendment_history": [],
            "historical_note": None
        },
        "filing_question_analysis": {
            "when_timing": {
                "answers_question": False,
                "specific_deadlines": [],
                "timing_type": None,
                "mandatory": False,
                "exceptions": []
            },
            "how_procedure": {
                "answers_question": False,
                "procedural_steps": [],
                "mandatory_procedures": [],
                "alternative_methods": []
            },
            "what_documents": {
                "answers_question": False,
                "required_documents": [],
                "document_types": [],
                "attachments": []
            },
            "where_venue": {
                "answers_question": False,
                "venue_requirements": [],
                "jurisdiction_rules": [],
                "location_specifics": []
            },
            "who_capacity": {
                "answers_question": False,
                "authorized_persons": [],
                "capacity_requirements": [],
                "restrictions": []
            },
            "format_requirements": {
                "answers_question": False,
                "format_specs": [],
                "signature_requirements": [],
                "electronic_filing": []
            }
        },
        "enhanced_cross_references": {
            "ccp_sections": [],
            "crc_rules": [],
            "evidence_code": [],
            "local_rules": [],
            "federal_rules": []
        },
        "relationship_analysis": {
            "depends_on": [],
            "enables": [],
            "supersedes": [],
            "modified_by_local_rules": [],
            "procedural_category": None,
            "complexity_level": "intermediate"
        },
        "court_applicability": {
            "applies_to": ["superior_court"],
            "excludes": [],
            "local_variations_allowed": False,
            "statewide_uniform": True
        },
        "enhanced_content_analysis": {
            "timing_requirements": [],
            "service_requirements": [],
            "mandatory_vs_permissive": {
                "mandatory_elements": [],
                "permissive_elements": [],
                "directory_elements": []
            }
        },
        
        # Legacy fields for backward compatibility
        "procedural_requirements": [],
        "filing_procedures": [],
        "service_requirements": [],
        "deadlines_and_timing": [],
        "format_specifications": [],
        "cross_references": [],
        "key_provisions": []
    }
    
    if not text or len(text.strip()) < 50:
        return analysis
    
    # Store original text for direct pattern matching in legacy fields
    analysis['_original_text'] = text
    
    # Enhanced filing question analysis
    analyze_filing_questions(text, analysis)
    
    # Enhanced cross-reference analysis
    analyze_enhanced_cross_references(text, analysis)
    
    # Enhanced content analysis
    analyze_enhanced_content_patterns(text, analysis)
    
    # Rule status and versioning analysis
    analyze_rule_status(text, analysis)
    
    # Court applicability analysis
    analyze_court_applicability(text, analysis)
    
    # Relationship analysis
    analyze_relationships(text, analysis)
    
    # Populate legacy fields for backward compatibility
    populate_legacy_fields(analysis)
    
    # CRITICAL DEBUG: Add validation and debug info
    print(f"  📊 Analysis for {analysis['section_number']}:")
    print(f"     📋 Procedural requirements: {len(analysis['procedural_requirements'])}")
    print(f"     ⏰ Deadlines/timing: {len(analysis['deadlines_and_timing'])}")
    print(f"     📧 Service requirements: {len(analysis['service_requirements'])}")
    print(f"     🔗 Cross-references: {len(analysis['cross_references'])}")
    
    # Validate for obvious content that should be captured
    text_lower = text.lower()
    if "holiday" in text_lower and len(analysis['deadlines_and_timing']) == 0:
        print(f"  ⚠️  WARNING: Text contains 'holiday' but no timing requirements extracted!")
    if ("shall" in text_lower or "must" in text_lower) and len(analysis['procedural_requirements']) == 0:
        print(f"  ⚠️  WARNING: Text contains mandatory language but no procedural requirements extracted!")
    
    return analysis

def analyze_filing_questions(text, analysis):
    """Analyze the six filing questions with COMPREHENSIVE pattern matching"""
    
    # WHEN - Timing Analysis with COMPREHENSIVE TIME COMPUTATION PATTERNS
    when_keywords = ['deadline', 'time', 'days', 'hours', 'before', 'after', 'within', 'by', 'no later than', 'due', 
                     'computed', 'computing', 'calculation', 'excluding', 'including', 'holiday', 'weekend', 
                     'extension', 'expire', 'expiration', 'period', 'term']
    if any(keyword.lower() in text.lower() for keyword in when_keywords):
        analysis["filing_question_analysis"]["when_timing"]["answers_question"] = True
        
        # MASSIVELY EXPANDED timing patterns to catch all legal time computation language
        timing_patterns = [
            # Basic deadline patterns
            r'within\\s+(\\d+)\\s+(calendar\\s+days?|court\\s+days?|business\\s+days?|days?)',
            r'(\\d+)\\s+(calendar\\s+days?|court\\s+days?|business\\s+days?)\\s+(?:before|after|from)',
            r'(?:no\\s+later\\s+than|not\\s+later\\s+than)\\s+([^.]{5,50})',
            r'between\\s+(\\d+)\\s*(?:a\\.?m\\.?|p\\.?m\\.?)\\s+and\\s+(\\d+)\\s*(?:a\\.?m\\.?|p\\.?m\\.?)',
            r'(?:8\\s*a\\.?m\\.?|8:00\\s*a\\.?m\\.?)\\s+(?:to|and|-)\\s+(?:8\\s*p\\.?m\\.?|8:00\\s*p\\.?m\\.?)',
            r'(?:9\\s*a\\.?m\\.?|9:00\\s*a\\.?m\\.?)\\s+(?:to|and|-)\\s+(?:5\\s*p\\.?m\\.?|5:00\\s*p\\.?m\\.?)',
            r'(?:deadline|due\\s+date|time\\s+limit)\\s+(?:is|shall\\s+be)\\s+([^.]{5,50})',
            
            # TIME COMPUTATION LANGUAGE - THE MISSING PATTERNS
            r'(?:time|period)\\s+(?:in\\s+which|within\\s+which|for)\\s+([^.]{10,150})',
            r'(?:computed|calculated|determined|reckoned)\\s+by\\s+([^.]{10,150})',
            r'(?:excluding|except|omitting)\\s+(?:the\\s+)?(?:first|last)\\s+([^.]{10,150})',
            r'(?:including|counting)\\s+(?:the\\s+)?(?:first|last)\\s+([^.]{10,150})',
            r'(?:time|period)\\s+(?:provided\\s+by\\s+law|allowed\\s+by\\s+law|prescribed\\s+by\\s+law)\\s+([^.]{10,150})',
            r'(?:is\\s+to\\s+be\\s+done|are\\s+to\\s+be\\s+done|to\\s+be\\s+performed)\\s+([^.]{10,150})',
            
            # Holiday and weekend exceptions
            r'(?:unless|except\\s+when|if)\\s+(?:the\\s+)?(?:last\\s+day|final\\s+day)\\s+([^.]{10,150})',
            r'(?:holiday|weekend|Saturday|Sunday)\\s+([^.]{10,150})',
            r'(?:and\\s+then\\s+it\\s+is|then\\s+it\\s+shall\\s+be)\\s+([^.]{10,150})',
            r'(?:next\\s+court\\s+day|following\\s+court\\s+day|next\\s+business\\s+day)\\s+([^.]{10,150})',
            
            # Extension and modification patterns
            r'(?:may\\s+be\\s+extended|shall\\s+be\\s+extended|extended\\s+by)\\s+([^.]{10,150})',
            r'(?:extension\\s+of\\s+time|time\\s+extension)\\s+([^.]{10,150})',
            r'(?:expire|expires|expiration)\\s+([^.]{10,150})',
            
            # Advanced timing constructions
            r'(?:commencing|beginning|starting)\\s+(?:on|from|with)\\s+([^.]{10,150})',
            r'(?:terminating|ending|concluding)\\s+(?:on|at|with)\\s+([^.]{10,150})',
            r'(?:period\\s+of|term\\s+of|duration\\s+of)\\s+(\\d+)\\s+([^.]{10,150})',
            r'(?:not\\s+less\\s+than|at\\s+least)\\s+(\\d+)\\s+([^.]{10,150})',
            r'(?:not\\s+more\\s+than|no\\s+more\\s+than)\\s+(\\d+)\\s+([^.]{10,150})'
        ]
        
        for pattern in timing_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                if isinstance(match, tuple):
                    timing_text = ' '.join(str(m) for m in match if m)
                else:
                    timing_text = str(match)
                if len(timing_text.strip()) > 3:
                    analysis["filing_question_analysis"]["when_timing"]["specific_deadlines"].append(timing_text.strip()[:150])
        
        # Determine timing type
        if 'service' in text.lower():
            analysis["filing_question_analysis"]["when_timing"]["timing_type"] = 'service_hours'
        elif 'deadline' in text.lower():
            analysis["filing_question_analysis"]["when_timing"]["timing_type"] = 'deadline'
        elif 'filing' in text.lower():
            analysis["filing_question_analysis"]["when_timing"]["timing_type"] = 'filing_window'
        
        # Check if mandatory
        analysis["filing_question_analysis"]["when_timing"]["mandatory"] = bool(re.search(r'(?:shall|must|required)', text, re.IGNORECASE))
        
        # Extract exceptions
        exception_patterns = [r'except\\s+([^.]{10,100})', r'unless\\s+([^.]{10,100})', r'provided\\s+that\\s+([^.]{10,100})']
        for pattern in exception_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                analysis["filing_question_analysis"]["when_timing"]["exceptions"].append(match.strip())
    
    # HOW - COMPREHENSIVE Procedure Analysis with SERVICE LANGUAGE DETECTION
    how_keywords = ['procedure', 'method', 'process', 'steps', 'manner', 'way', 'served', 'filed', 'delivered',
                    'service', 'notice', 'mail', 'personal', 'electronic', 'leave', 'deliver', 'receptionist',
                    'office', 'residence', 'dwelling', 'mailing', 'conspicuous', 'posted', 'affixed', 'attachment']
    if any(keyword.lower() in text.lower() for keyword in how_keywords):
        analysis["filing_question_analysis"]["how_procedure"]["answers_question"] = True
        
        # MASSIVELY EXPANDED procedure patterns to catch ALL SERVICE LANGUAGE
        procedure_patterns = [
            # Basic mandatory service patterns
            r'shall\\s+(?:be\\s+)?(?:serve[d]?|file[d]?|deliver[ed]?)\\s+([^.]{10,150})',
            r'must\\s+(?:be\\s+)?(?:serve[d]?|file[d]?|deliver[ed]?)\\s+([^.]{10,150})',
            r'(?:method|manner|way)\\s+of\\s+(?:service|filing|notice)\\s+([^.]{10,150})',
            r'(?:personal|electronic|mail)\\s+service\\s+([^.]{10,150})',
            r'(?:leave\\s+with|deliver\\s+to)\\s+([^.]{10,150})',
            r'(?:receptionist|person\\s+in\\s+charge)\\s+([^.]{10,150})',
            r'(?:conspicuous\\s+place|residence|mail)\\s+([^.]{10,150})',
            
            # SERVICE METHOD PATTERNS - THE MISSING LANGUAGE
            r'(?:service|notice)\\s+may\\s+be\\s+(?:made|served|effected)\\s+([^.]{10,150})',
            r'(?:service|notice)\\s+shall\\s+be\\s+(?:made|served|effected)\\s+([^.]{10,150})',
            r'may\\s+be\\s+served\\s+(?:by|upon|at)\\s+([^.]{10,150})',
            r'shall\\s+be\\s+served\\s+(?:by|upon|at)\\s+([^.]{10,150})',
            
            # Location-based service patterns
            r'(?:at\\s+the\\s+office|office\\s+of)\\s+([^.]{10,150})',
            r'(?:at\\s+the\\s+residence|dwelling\\s+house|usual\\s+place\\s+of\\s+abode)\\s+([^.]{10,150})',
            r'(?:leaving|by\\s+leaving)\\s+([^.]{10,150})',
            r'(?:delivered\\s+to|delivery\\s+to)\\s+([^.]{10,150})',
            
            # Person-based service patterns
            r'(?:person\\s+authorized|authorized\\s+person)\\s+([^.]{10,150})',
            r'(?:person\\s+in\\s+charge|person\\s+having\\s+charge)\\s+([^.]{10,150})',
            r'(?:attorney\\s+of\\s+record|counsel\\s+of\\s+record)\\s+([^.]{10,150})',
            r'(?:party|parties)\\s+(?:shall|must)\\s+([^.]{10,150})',
            
            # Mail service patterns
            r'(?:certified\\s+mail|registered\\s+mail|mail\\s+service)\\s+([^.]{10,150})',
            r'(?:mailing|by\\s+mail|through\\s+the\\s+mail)\\s+([^.]{10,150})',
            r'(?:postage\\s+prepaid|return\\s+receipt)\\s+([^.]{10,150})',
            
            # Electronic service patterns
            r'(?:electronic\\s+service|email\\s+service|digital\\s+service)\\s+([^.]{10,150})',
            r'(?:fax|facsimile|electronic\\s+transmission)\\s+([^.]{10,150})',
            
            # Alternative service patterns
            r'(?:substituted\\s+service|alternative\\s+service)\\s+([^.]{10,150})',
            r'(?:posting|publication|conspicuous\\s+place)\\s+([^.]{10,150})',
            r'(?:affixing|attachment|posting)\\s+([^.]{10,150})',
            
            # Procedural obligation patterns
            r'(?:is\\s+to\\s+be|are\\s+to\\s+be|to\\s+be)\\s+(?:served|filed|delivered)\\s+([^.]{10,150})',
            r'(?:provided\\s+by\\s+law|required\\s+by\\s+law|prescribed\\s+by\\s+law)\\s+([^.]{10,150})',
            r'(?:in\\s+the\\s+manner|manner\\s+prescribed|manner\\s+provided)\\s+([^.]{10,150})'
        ]
        
        for pattern in procedure_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                if len(match.strip()) > 10:
                    analysis["filing_question_analysis"]["how_procedure"]["procedural_steps"].append(match.strip()[:200])
        
        # Extract mandatory procedures
        mandatory_pattern = r'(?:shall|must)\\s+([^.]{10,100})'
        mandatory_matches = re.findall(mandatory_pattern, text, re.IGNORECASE)
        for match in mandatory_matches:
            analysis["filing_question_analysis"]["how_procedure"]["mandatory_procedures"].append(match.strip())
        
        # Extract alternative methods
        alternative_patterns = [
            r'(?:may|alternatively|or)\\s+([^.]{10,100})',
            r'(?:in\\s+lieu\\s+of|instead\\s+of)\\s+([^.]{10,100})'
        ]
        for pattern in alternative_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                analysis["filing_question_analysis"]["how_procedure"]["alternative_methods"].append(match.strip())
    
    # WHO - Capacity Analysis
    who_keywords = ['party', 'attorney', 'person', 'plaintiff', 'defendant', 'petitioner', 'respondent', 'capacity']
    if any(keyword.lower() in text.lower() for keyword in who_keywords):
        analysis["filing_question_analysis"]["who_capacity"]["answers_question"] = True
        
        # Extract authorized persons
        capacity_patterns = [
            r'(?:party|attorney|person)\\s+(?:authorized|permitted|required)\\s+to\\s+([^.]{10,100})',
            r'(?:plaintiff|defendant|petitioner|respondent)\\s+(?:shall|must)\\s+([^.]{10,100})',
            r'(?:person|individual)\\s+(?:18|eighteen)\\s+years?\\s+(?:of\\s+age|old)\\s+([^.]{10,100})',
            r'(?:parties|attorneys|persons\\s+18)\\s+([^.]{10,100})',
            r'(?:at\\s+residence)\\s+([^.]{10,100})'
        ]
        
        for pattern in capacity_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                if len(match.strip()) > 10:
                    analysis["filing_question_analysis"]["who_capacity"]["authorized_persons"].append(match.strip()[:200])
    
    # FORMAT - Requirements Analysis
    format_keywords = ['format', 'form', 'size', 'font', 'margin', 'paper', 'electronic', 'signature', 'caption']
    if any(keyword.lower() in text.lower() for keyword in format_keywords):
        analysis["filing_question_analysis"]["format_requirements"]["answers_question"] = True
        
        # Extract format specifications
        format_patterns = [
            r'(?:format|form)\\s+(?:shall|must)\\s+be\\s+([^.]{10,100})',
            r'(?:signature|verification)\\s+(?:shall|must)\\s+([^.]{10,100})',
            r'(?:caption|heading)\\s+(?:shall|must)\\s+([^.]{10,100})',
            r'(?:electronic|paper)\\s+(?:filing|service)\\s+([^.]{10,100})',
            r'(?:sealed\\s+envelope|clearly\\s+labeled)\\s+([^.]{10,100})'
        ]
        
        for pattern in format_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                if len(match.strip()) > 10:
                    analysis["filing_question_analysis"]["format_requirements"]["format_specs"].append(match.strip()[:200])

def analyze_enhanced_cross_references(text, analysis):
    """Analyze enhanced cross-references with relationship types - FIXED for lettered subsections"""
    
    # CCP sections - FIXED pattern to handle lettered subsections like 12a, 12b, 12c
    ccp_pattern = r'(?:Code\\s+of\\s+Civil\\s+Procedure\\s+)?[Ss]ection\\s+(\\d+[a-z]?(?:\\.\\d+)?)'
    ccp_matches = re.findall(ccp_pattern, text, re.IGNORECASE)
    for section in ccp_matches:
        analysis["enhanced_cross_references"]["ccp_sections"].append({
            "section": section,
            "relationship_type": "referenced_procedure",
            "description": f"References CCP Section {section}"
        })
    
    # CRC rules - FIXED pattern for lettered rules
    crc_pattern = r'(?:California\\s+Rules\\s+of\\s+Court\\s+)?[Rr]ule\\s+(\\d+[a-z]?(?:\\.\\d+)?)'
    crc_matches = re.findall(crc_pattern, text, re.IGNORECASE)
    for rule in crc_matches:
        analysis["enhanced_cross_references"]["crc_rules"].append({
            "rule": rule,
            "relationship_type": "referenced_procedure",
            "description": f"References CRC Rule {rule}"
        })
    
    # Evidence Code - FIXED pattern for lettered sections
    evidence_pattern = r'Evidence\\s+Code\\s+[Ss]ection\\s+(\\d+[a-z]?(?:\\.\\d+)?)'
    evidence_matches = re.findall(evidence_pattern, text, re.IGNORECASE)
    for section in evidence_matches:
        analysis["enhanced_cross_references"]["evidence_code"].append({
            "section": section,
            "relationship_type": "referenced_procedure",
            "description": f"References Evidence Code Section {section}"
        })

def analyze_enhanced_content_patterns(text, analysis):
    """COMPREHENSIVE content analysis with MASSIVELY EXPANDED legal language patterns"""
    
    # TIMING REQUIREMENTS - COMPREHENSIVE LEGAL TIME COMPUTATION PATTERNS
    timing_patterns = [
        # Basic timing patterns (existing)
        r'within\\s+(\\d+)\\s+(calendar\\s+days?|court\\s+days?|business\\s+days?|days?)',
        r'between\\s+(\\d+)\\s*(?:a\\.?m\\.?|p\\.?m\\.?)\\s+and\\s+(\\d+)\\s*(?:a\\.?m\\.?|p\\.?m\\.?)',
        r'(?:8\\s*a\\.?m\\.?|8:00\\s*a\\.?m\\.?)\\s+(?:to|and|-)\\s+(?:8\\s*p\\.?m\\.?|8:00\\s*p\\.?m\\.?)',
        r'(?:9\\s*a\\.?m\\.?|9:00\\s*a\\.?m\\.?)\\s+(?:to|and|-)\\s+(?:5\\s*p\\.?m\\.?|5:00\\s*p\\.?m\\.?)',
        
        # TIME COMPUTATION LANGUAGE - THE CRITICAL MISSING PATTERNS
        r'(?:time|period)\\s+(?:in\\s+which|within\\s+which|for)\\s+([^.]{15,250})',
        r'(?:computed|calculated|determined|reckoned)\\s+by\\s+([^.]{15,250})',
        r'(?:excluding|except|omitting)\\s+(?:the\\s+)?(?:first|last)\\s+([^.]{15,250})',
        r'(?:including|counting)\\s+(?:the\\s+)?(?:first|last)\\s+([^.]{15,250})',
        r'(?:is\\s+to\\s+be\\s+done|are\\s+to\\s+be\\s+done|to\\s+be\\s+performed)\\s+([^.]{15,250})',
        r'(?:provided\\s+by\\s+law|allowed\\s+by\\s+law|prescribed\\s+by\\s+law)\\s+([^.]{15,250})',
        
        # Holiday and exception patterns
        r'(?:unless|except\\s+when|if)\\s+(?:the\\s+)?(?:last\\s+day|final\\s+day)\\s+([^.]{15,250})',
        r'(?:holiday|weekend|Saturday|Sunday)\\s+([^.]{15,250})',
        r'(?:and\\s+then\\s+it\\s+is|then\\s+it\\s+shall\\s+be)\\s+([^.]{15,250})',
        r'(?:next\\s+court\\s+day|following\\s+court\\s+day|next\\s+business\\s+day)\\s+([^.]{15,250})',
        
        # Time extension and modification patterns
        r'(?:may\\s+be\\s+extended|shall\\s+be\\s+extended|extended\\s+by)\\s+([^.]{15,250})',
        r'(?:extension\\s+of\\s+time|time\\s+extension)\\s+([^.]{15,250})',
        r'(?:expire|expires|expiration)\\s+([^.]{15,250})',
        
        # Advanced timing constructions
        r'(?:commencing|beginning|starting)\\s+(?:on|from|with)\\s+([^.]{15,250})',
        r'(?:terminating|ending|concluding)\\s+(?:on|at|with)\\s+([^.]{15,250})',
        r'(?:period\\s+of|term\\s+of|duration\\s+of)\\s+(\\d+)\\s+([^.]{15,250})',
        r'(?:not\\s+less\\s+than|at\\s+least)\\s+(\\d+)\\s+([^.]{15,250})',
        r'(?:not\\s+more\\s+than|no\\s+more\\s+than)\\s+(\\d+)\\s+([^.]{15,250})'
    ]
    
    for pattern in timing_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        for match in matches:
            if isinstance(match, tuple):
                timing_text = ' '.join(str(m) for m in match if m)
            else:
                timing_text = str(match)
            
            if len(timing_text.strip()) > 8:  # More substantial content
                requirement = {
                    "requirement": timing_text.strip()[:300],
                    "applies_to": extract_timing_applies_to(timing_text),
                    "mandatory": bool(re.search(r'(?:shall|must|required)', timing_text, re.IGNORECASE)),
                    "exceptions": extract_timing_exceptions(timing_text)
                }
                analysis["enhanced_content_analysis"]["timing_requirements"].append(requirement)
    
    # SERVICE REQUIREMENTS - COMPREHENSIVE SERVICE LANGUAGE PATTERNS
    service_patterns = [
        # Basic service patterns (existing)
        r'personal\\s+(?:service|delivery)\\s+([^.]{10,200})',
        r'(?:leave\\s+with|deliver\\s+to)\\s+([^.]{10,200})',
        r'(?:receptionist|person\\s+in\\s+charge)\\s+([^.]{10,200})',
        r'(?:conspicuous\\s+place)\\s+([^.]{10,200})',
        r'(?:residence|mail)\\s+([^.]{10,200})',
        
        # SERVICE METHOD LANGUAGE - THE MISSING CRITICAL PATTERNS
        r'(?:service|notice)\\s+may\\s+be\\s+(?:made|served|effected)\\s+([^.]{15,250})',
        r'(?:service|notice)\\s+shall\\s+be\\s+(?:made|served|effected)\\s+([^.]{15,250})',
        r'may\\s+be\\s+served\\s+(?:by|upon|at)\\s+([^.]{15,250})',
        r'shall\\s+be\\s+served\\s+(?:by|upon|at)\\s+([^.]{15,250})',
        
        # Location-based service patterns
        r'(?:at\\s+the\\s+office|office\\s+of)\\s+([^.]{15,250})',
        r'(?:at\\s+the\\s+residence|dwelling\\s+house|usual\\s+place\\s+of\\s+abode)\\s+([^.]{15,250})',
        r'(?:leaving|by\\s+leaving)\\s+([^.]{15,250})',
        r'(?:delivered\\s+to|delivery\\s+to)\\s+([^.]{15,250})',
        
        # Person-based service patterns
        r'(?:person\\s+authorized|authorized\\s+person)\\s+([^.]{15,250})',
        r'(?:person\\s+in\\s+charge|person\\s+having\\s+charge)\\s+([^.]{15,250})',
        r'(?:attorney\\s+of\\s+record|counsel\\s+of\\s+record)\\s+([^.]{15,250})',
        r'(?:party|parties)\\s+(?:shall|must)\\s+([^.]{15,250})',
        
        # Mail and electronic service patterns
        r'(?:certified\\s+mail|registered\\s+mail|mail\\s+service)\\s+([^.]{15,250})',
        r'(?:mailing|by\\s+mail|through\\s+the\\s+mail)\\s+([^.]{15,250})',
        r'(?:postage\\s+prepaid|return\\s+receipt)\\s+([^.]{15,250})',
        r'(?:electronic\\s+service|email\\s+service|digital\\s+service)\\s+([^.]{15,250})',
        r'(?:fax|facsimile|electronic\\s+transmission)\\s+([^.]{15,250})',
        
        # Alternative service patterns
        r'(?:substituted\\s+service|alternative\\s+service)\\s+([^.]{15,250})',
        r'(?:posting|publication|conspicuous\\s+place)\\s+([^.]{15,250})',
        r'(?:affixing|attachment|posting)\\s+([^.]{15,250})',
        
        # Procedural obligation service patterns
        r'(?:is\\s+to\\s+be|are\\s+to\\s+be|to\\s+be)\\s+(?:served|filed|delivered)\\s+([^.]{15,250})',
        r'(?:provided\\s+by\\s+law|required\\s+by\\s+law|prescribed\\s+by\\s+law)\\s+([^.]{15,250})',
        r'(?:in\\s+the\\s+manner|manner\\s+prescribed|manner\\s+provided)\\s+([^.]{15,250})'
    ]
    
    for i, pattern in enumerate(service_patterns):
        matches = re.findall(pattern, text, re.IGNORECASE)
        for match in matches:
            if len(match.strip()) > 12:  # More substantial content
                method = extract_service_method_enhanced(match, i)
                service_req = {
                    "method": method,
                    "target": extract_service_target_enhanced(match),
                    "priority": determine_service_priority_enhanced(match, i),
                    "requirements": [match.strip()[:250]] if match.strip() else []
                }
                analysis["enhanced_content_analysis"]["service_requirements"].append(service_req)
    
    # PROCEDURAL REQUIREMENTS - COMPREHENSIVE LEGAL OBLIGATION PATTERNS
    procedural_patterns = [
        # Broad legal obligation language - THE MISSING CORE PATTERNS
        r'(?:is\\s+to\\s+be|are\\s+to\\s+be|to\\s+be)\\s+([^.]{15,250})',
        r'(?:provided\\s+by\\s+law|required\\s+by\\s+law|prescribed\\s+by\\s+law)\\s+([^.]{15,250})',
        r'(?:in\\s+the\\s+manner|manner\\s+prescribed|manner\\s+provided)\\s+([^.]{15,250})',
        r'(?:unless|except\\s+when|if)\\s+([^.]{15,250})',
        r'(?:where|when|if)\\s+([^.]{15,250})',
        r'(?:such|every|each)\\s+([^.]{15,250})',
        r'(?:any\\s+person|any\\s+party)\\s+(?:who|that)\\s+([^.]{15,250})',
        r'(?:every\\s+party|each\\s+party)\\s+([^.]{15,250})',
        r'(?:no\\s+person|no\\s+party)\\s+([^.]{15,250})'
    ]
    
    # Add procedural requirements to the enhanced analysis
    for pattern in procedural_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        for match in matches:
            if len(match.strip()) > 10:
                # Add to procedural requirements for legacy compatibility
                analysis["procedural_requirements"].append(match.strip()[:200])
    
    # MANDATORY VS PERMISSIVE - COMPREHENSIVE DETECTION WITH BROADER PATTERNS
    mandatory_patterns = [
        r'(?:shall|must|required|obligated|duty)\\s+([^.]{10,200})',
        r'(?:is\\s+required|are\\s+required)\\s+([^.]{10,200})',
        r'(?:mandatory|compulsory|obligatory)\\s+([^.]{10,200})',
        r'(?:it\\s+is\\s+the\\s+duty|duty\\s+of)\\s+([^.]{10,200})',
        r'(?:bound\\s+to|obliged\\s+to)\\s+([^.]{10,200})'
    ]
    
    for pattern in mandatory_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        for match in matches:
            if len(match.strip()) > 8:
                analysis["enhanced_content_analysis"]["mandatory_vs_permissive"]["mandatory_elements"].append(match.strip()[:250])
    
    permissive_patterns = [
        r'(?:may|permitted|allowed|authorized|discretionary)\\s+([^.]{10,200})',
        r'(?:is\\s+permitted|are\\s+permitted)\\s+([^.]{10,200})',
        r'(?:optional|voluntary|elective)\\s+([^.]{10,200})',
        r'(?:at\\s+the\\s+discretion|in\\s+the\\s+discretion)\\s+([^.]{10,200})',
        r'(?:free\\s+to|liberty\\s+to)\\s+([^.]{10,200})'
    ]
    
    for pattern in permissive_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        for match in matches:
            if len(match.strip()) > 8:
                analysis["enhanced_content_analysis"]["mandatory_vs_permissive"]["permissive_elements"].append(match.strip()[:250])
    
    directory_patterns = [
        r'(?:directory|suggested|recommended|advisory)\\s+([^.]{10,200})',
        r'(?:guidance|guideline|best\\s+practice)\\s+([^.]{10,200})',
        r'(?:should|ought\\s+to)\\s+([^.]{10,200})'
    ]
    
    for pattern in directory_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        for match in matches:
            if len(match.strip()) > 8:
                analysis["enhanced_content_analysis"]["mandatory_vs_permissive"]["directory_elements"].append(match.strip()[:250])

# Helper functions for enhanced service analysis
def extract_timing_applies_to(text):
    """Extract what timing requirements apply to"""
    text_lower = text.lower()
    if "residence" in text_lower or "dwelling" in text_lower:
        return "party_at_residence"
    elif "attorney" in text_lower or "counsel" in text_lower:
        return "attorney"
    elif "office" in text_lower:
        return "office_service"
    else:
        return "general"

def extract_timing_exceptions(text):
    """Extract timing exceptions"""
    exceptions = []
    exception_patterns = [
        r'(?:except|unless|if)\\s+([^.]{10,100})',
        r'(?:provided\\s+that|except\\s+when)\\s+([^.]{10,100})'
    ]
    for pattern in exception_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        exceptions.extend([match.strip() for match in matches if len(match.strip()) > 5])
    return exceptions

def extract_service_method_enhanced(text, pattern_index):
    """Extract enhanced service method"""
    text_lower = text.lower()
    if "personal" in text_lower or pattern_index == 0:
        return "personal_delivery"
    elif "mail" in text_lower or "certified" in text_lower:
        return "mail_service"
    elif "electronic" in text_lower or "email" in text_lower:
        return "electronic_service"
    elif "office" in text_lower:
        return "office_service"
    elif "residence" in text_lower or "dwelling" in text_lower:
        return "residential_service"
    elif "posting" in text_lower or "conspicuous" in text_lower:
        return "alternative_service"
    else:
        return "general_service"

def extract_service_target_enhanced(text):
    """Extract enhanced service target"""
    text_lower = text.lower()
    if "attorney" in text_lower or "counsel" in text_lower:
        return "attorney"
    elif "party" in text_lower:
        return "party"
    elif "person in charge" in text_lower or "receptionist" in text_lower:
        return "authorized_person"
    else:
        return "general"

def determine_service_priority_enhanced(text, pattern_index):
    """Determine enhanced service priority"""
    text_lower = text.lower()
    if "shall" in text_lower or "must" in text_lower:
        return 1  # Mandatory/high priority
    elif "may" in text_lower:
        return 2  # Permissive/medium priority
    else:
        return pattern_index + 1  # Based on pattern order

def analyze_rule_status(text, analysis):
    """Analyze rule status and versioning information"""
    
    # Amendment history
    amendment_pattern = r'(?:amended|revised|modified)\\s+(?:on\\s+)?(\\d{1,2}/\\d{1,2}/\\d{4}|\\d{4}-\\d{2}-\\d{2})'
    amendment_matches = re.findall(amendment_pattern, text, re.IGNORECASE)
    for date in amendment_matches:
        analysis["rule_status"]["amendment_history"].append(date)
    
    # Effective dates
    effective_pattern = r'(?:effective|in\\s+effect)\\s+(?:on\\s+)?(\\d{1,2}/\\d{1,2}/\\d{4}|\\d{4}-\\d{2}-\\d{2})'
    effective_matches = re.findall(effective_pattern, text, re.IGNORECASE)
    if effective_matches:
        analysis["rule_status"]["effective_date"] = effective_matches[0]
    
    # Status determination
    if 'repealed' in text.lower():
        analysis["rule_status"]["status"] = 'repealed'
    elif 'superseded' in text.lower():
        analysis["rule_status"]["status"] = 'superseded'
    
    # Historical notes
    history_pattern = r'(?:former|previous|prior)\\s+(?:section|rule)\\s+([^.]{10,100})'
    history_matches = re.findall(history_pattern, text, re.IGNORECASE)
    if history_matches:
        analysis["rule_status"]["historical_note"] = history_matches[0].strip()

def analyze_court_applicability(text, analysis):
    """Analyze court applicability and jurisdiction"""
    
    # Check for specific court mentions
    if 'superior court' in text.lower():
        analysis["court_applicability"]["applies_to"].append("superior_court")
    if 'appellate court' in text.lower():
        analysis["court_applicability"]["applies_to"].append("appellate_court")
    if 'supreme court' in text.lower():
        analysis["court_applicability"]["applies_to"].append("supreme_court")
    
    # Remove duplicates
    analysis["court_applicability"]["applies_to"] = list(set(analysis["court_applicability"]["applies_to"]))
    
    # Check for local variations
    if 'local rule' in text.lower() or 'local variation' in text.lower():
        analysis["court_applicability"]["local_variations_allowed"] = True
        analysis["court_applicability"]["statewide_uniform"] = False

def analyze_relationships(text, analysis):
    """Analyze relationships and dependencies between rules"""
    
    # Determine procedural category based on section number
    section_num = analysis.get("section_number", "")
    if section_num:
        try:
            num = float(re.sub(r'[a-z]', '', section_num))
            if 1000 <= num <= 1020:
                analysis["relationship_analysis"]["procedural_category"] = "service_of_process"
            elif 420 <= num <= 475:
                analysis["relationship_analysis"]["procedural_category"] = "pleadings"
            elif 2016 <= num <= 2033:
                analysis["relationship_analysis"]["procedural_category"] = "discovery"
        except ValueError:
            pass
    
    # Extract dependencies - FIXED patterns for lettered subsections
    dependency_patterns = [
        r'(?:pursuant\\s+to|under|in\\s+accordance\\s+with)\\s+(?:Section|Rule)\\s+(\\d+[a-z]?(?:\\.\\d+)?)',
        r'(?:subject\\s+to|governed\\s+by)\\s+(?:Section|Rule)\\s+(\\d+[a-z]?(?:\\.\\d+)?)',
        r'(?:as\\s+provided\\s+by|provided\\s+in)\\s+(?:Section|Rule)\\s+(\\d+[a-z]?(?:\\.\\d+)?)'
    ]
    
    for pattern in dependency_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        for match in matches:
            analysis["relationship_analysis"]["depends_on"].append(match)

def populate_legacy_fields(analysis):
    """Populate legacy fields for backward compatibility with DIRECT pattern matching"""
    
    # Get the original text for direct extraction
    text = analysis.get('_original_text', '')
    
    # DIRECT PROCEDURAL REQUIREMENTS EXTRACTION
    procedural_patterns = [
        r'([^.]{20,200}(?:shall|must|required|obligated)[^.]{10,200}\.)',
        r'([^.]{20,200}(?:provided by law|required by law|prescribed by law)[^.]{10,200}\.)',
        r'([^.]{20,200}(?:computed by|calculated by|determined by)[^.]{10,200}\.)',
        r'([^.]{20,200}(?:unless|except when|if)[^.]{10,200}\.)'
    ]
    
    direct_procedural = []
    for pattern in procedural_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        for match in matches:
            cleaned = re.sub(r'\\s+', ' ', match.strip())
            if len(cleaned) > 30 and cleaned not in direct_procedural:
                direct_procedural.append(cleaned)
    
    # DIRECT TIMING/DEADLINE EXTRACTION  
    timing_patterns = [
        r'([^.]{20,200}(?:time|period|deadline|days?|holiday|extended)[^.]{10,200}\.)',
        r'([^.]{20,200}(?:computed by excluding|including the last|within.*days?)[^.]{10,200}\.)',
        r'([^.]{20,200}(?:before.*date|after.*date|no later than)[^.]{10,200}\.)'
    ]
    
    direct_timing = []
    for pattern in timing_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        for match in matches:
            cleaned = re.sub(r'\\s+', ' ', match.strip())
            if len(cleaned) > 30 and cleaned not in direct_timing:
                direct_timing.append(cleaned)
    
    # DIRECT CROSS-REFERENCE EXTRACTION
    ref_patterns = [
        r'Section\\s+(\\d+[a-z]?(?:\\.\\d+)?)',
        r'Rule\\s+(\\d+[a-z]?(?:\\.\\d+)?)',
        r'Code\\s+(\\d+[a-z]?(?:\\.\\d+)?)'
    ]
    
    direct_refs = []
    for pattern in ref_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        for match in matches:
            if match not in direct_refs:
                direct_refs.append(match)
    
    # DIRECT SERVICE REQUIREMENTS EXTRACTION
    service_patterns = [
        r'([^.]{20,200}(?:service|served|deliver|leave with)[^.]{10,200}\.)',
        r'([^.]{20,200}(?:mail|electronic|personal)[^.]{10,200}service[^.]{10,200}\.)'
    ]
    
    direct_service = []
    for pattern in service_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        for match in matches:
            cleaned = re.sub(r'\\s+', ' ', match.strip())
            if len(cleaned) > 30 and cleaned not in direct_service:
                direct_service.append(cleaned)
    
    # Combine enhanced analysis with direct extraction
    enhanced_procedural = (
        analysis["filing_question_analysis"]["how_procedure"]["procedural_steps"] + 
        analysis["filing_question_analysis"]["how_procedure"]["mandatory_procedures"]
    )
    
    enhanced_timing = analysis["filing_question_analysis"]["when_timing"]["specific_deadlines"]
    
    enhanced_refs = (
        [ref["section"] for ref in analysis["enhanced_cross_references"]["ccp_sections"]] +
        [ref["rule"] for ref in analysis["enhanced_cross_references"]["crc_rules"]]
    )
    
    enhanced_service = [
        f"{req['method']} ({req.get('target', 'general')})" 
        for req in analysis["enhanced_content_analysis"]["service_requirements"]
    ]
    
    # Populate legacy fields with combined results (direct + enhanced)
    analysis["procedural_requirements"] = list(set(enhanced_procedural + direct_procedural))
    analysis["deadlines_and_timing"] = list(set(enhanced_timing + direct_timing))
    analysis["cross_references"] = list(set(enhanced_refs + direct_refs))
    analysis["service_requirements"] = list(set(enhanced_service + direct_service))
    analysis["format_specifications"] = analysis["filing_question_analysis"]["format_requirements"]["format_specs"]
    
    # Key provisions (extract important paragraphs)
    key_provisions = analysis["filing_question_analysis"]["how_procedure"]["procedural_steps"][:3]
    if not key_provisions and text:
        # Extract first few meaningful sentences as key provisions
        sentences = re.split(r'(?<!\\w\\.\\w.)(?<![A-Z][a-z]\\.)(?<=\\.|\\!)\\s', text)
        meaningful_sentences = [s.strip() for s in sentences if len(s.strip()) > 50 and '\\n' not in s]
        key_provisions = meaningful_sentences[:3]
    
    analysis["key_provisions"] = key_provisions

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
    processed_sections = set()  # CRITICAL: Prevent duplicates
    
    print(f"Processing {len(pdf_paths)} CCP PDF files with enhanced analysis...")
    
    for i, pdf_path in enumerate(pdf_paths, 1):
        rule_info = path_to_rule.get(pdf_path, {})
        section_num = rule_info.get("ruleNumber", "Unknown")
        
        print(f"\\nProcessing {i}/{len(pdf_paths)}: CCP Section {section_num}")
        print(f"File: {os.path.basename(pdf_path)}")
        
        try:
            result = extract_ccp_content(pdf_path, rule_info)
            
            # CRITICAL: Check for duplicates before adding
            extracted_section = result.get("rule_info", {}).get("ruleNumber", "Unknown")
            content_hash = hash(result.get("content", {}).get("full_text", "")[:200])  # Hash first 200 chars
            duplicate_key = f"{extracted_section}_{content_hash}"
            
            if duplicate_key in processed_sections:
                print(f"  ⚠️  DUPLICATE DETECTED: Skipping duplicate of section {extracted_section}")
                continue
            else:
                processed_sections.add(duplicate_key)
                results.append(result)
            
            if result["file_info"]["status"] == "success":
                analysis = result["ccp_analysis"]
                print(f"  ✅ Success: {result['content']['word_count']} words extracted")
                print(f"     📋 Procedural requirements: {len(analysis['procedural_requirements'])}")
                print(f"     ⏰ Timing requirements: {len(analysis['enhanced_content_analysis']['timing_requirements'])}")
                print(f"     🔗 Cross-references: {len(analysis['cross_references'])}")
                print(f"     📊 Filing questions answered: {sum(1 for q in analysis['filing_question_analysis'].values() if q.get('answers_question', False))}/6")
            else:
                print(f"  ❌ Error: {result['file_info']['error']}")
                
        except Exception as e:
            print(f"  ❌ Unexpected error: {e}")
            results.append({
                "rule_info": rule_info,
                "file_info": {
                    "file_path": pdf_path,
                    "file_name": os.path.basename(pdf_path),
                    "status": "error",
                    "error": str(e),
                    "content_type": "pdf"
                },
                "extracted_at": datetime.now().isoformat()
            })
    
    # Save results
    output_file = "enhanced_ccp_extraction_results.json"
    
    final_results = {
        "extraction_summary": {
            "total_files": len(pdf_paths),
            "successful_extractions": len([r for r in results if r["file_info"]["status"] == "success"]),
            "failed_extractions": len([r for r in results if r["file_info"]["status"] == "error"]),
            "processed_at": datetime.now().isoformat(),
            "enhanced_analysis": True
        },
        "extracted_documents": results
    }
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(final_results, f, indent=2, ensure_ascii=False)
    
    print(f"\\n🎉 Enhanced extraction completed!")
    print(f"📁 Results saved to: {output_file}")
    print(f"📊 Success rate: {final_results['extraction_summary']['successful_extractions']}/{final_results['extraction_summary']['total_files']}")

if __name__ == "__main__":
    main()
`;
  }

  /**
   * Generate TOC extraction script (unchanged for compatibility)
   */
  static generateTocExtractionScript(tocPdfPath) {
    return `
import fitz
import json
import re

def extract_toc_links(pdf_path):
    """Extract section links from CCP Table of Contents PDF"""
    try:
        doc = fitz.open(pdf_path)
        
        if len(doc) == 0:
            doc.close()
            raise Exception("PDF has no pages")
        
        section_links = []
        
        for page_num in range(len(doc)):
            page = doc[page_num]
            text = page.get_text()
            
            # Extract section patterns
            patterns = [
                r'(\\d+\\.?\\d*(?:\\.\\d+)?)\\s+([^\\n]+?)\\s+\\.{2,}\\s*(\\d+)',
                r'(\\d+\\.?\\d*(?:\\.\\d+)?)\\s+([^\\n]+?)\\s+(\\d+)\\s*$'
            ]
            
            for pattern in patterns:
                matches = re.findall(pattern, text, re.MULTILINE)
                for match in matches:
                    section_num = match[0].strip()
                    title = match[1].strip()
                    page_ref = match[2].strip()
                    
                    if section_num and title:
                        section_links.append({
                            "ruleNumber": section_num,
                            "title": title,
                            "pageReference": page_ref,
                            "url": f"https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum={section_num}&lawCode=CCP"
                        })
        
        doc.close()
        
        # Remove duplicates and sort
        unique_links = []
        seen = set()
        for link in section_links:
            key = link["ruleNumber"]
            if key not in seen:
                seen.add(key)
                unique_links.append(link)
        
        unique_links.sort(key=lambda x: float(re.sub(r'[a-z]', '', x["ruleNumber"])))
        
        return {
            "extraction_summary": {
                "total_sections": len(unique_links),
                "extraction_method": "TOC_PDF",
                "extracted_at": "$(date -Iseconds)"
            },
            "sections": unique_links
        }
        
    except Exception as e:
        return {
            "extraction_summary": {
                "total_sections": 0,
                "extraction_method": "TOC_PDF",
                "error": str(e),
                "extracted_at": "$(date -Iseconds)"
            },
            "sections": []
        }

# Main execution
result = extract_toc_links("${tocPdfPath}")
print(json.dumps(result, indent=2))
`;
  }
}

module.exports = PythonScriptGenerator; 