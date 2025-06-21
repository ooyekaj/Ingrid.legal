#!/usr/bin/env python
# -*- coding: utf-8 -*-

import re
import json
from pypdf import PdfReader
import os
import urllib.parse

def extract_text_from_pdf(pdf_path: str) -> str:
    """
    Extracts all text content from a given PDF file.

    Args:
        pdf_path: The file path to the PDF.

    Returns:
        A single string containing all the text from the PDF.
        Returns an empty string if the file cannot be read.
    """
    if not os.path.exists(pdf_path):
        print(f"Error: File not found at {pdf_path}")
        return ""
        
    try:
        reader = PdfReader(pdf_path)
        full_text = []
        for page in reader.pages:
            full_text.append(page.extract_text())
        # Join with spaces to handle text broken across lines/pages better
        return " ".join(full_text)
    except Exception as e:
        print(f"An error occurred while reading the PDF '{pdf_path}': {e}")
        return ""

def clean_text(text: str) -> str:
    """
    Cleans up the extracted text by removing extra whitespace and joining lines.
    
    Args:
        text: The text to be cleaned.
        
    Returns:
        The cleaned text.
    """
    # Replace multiple newlines/spaces with a single space
    text = re.sub(r'\s+', ' ', text.strip())
    return text.strip()

def generate_highlight_link(base_url, text):
    """
    Generates a URL with a text fragment to highlight a specific text snippet on the page.

    Args:
        base_url: The base URL of the page without any fragment.
        text: The text to be highlighted on the page.

    Returns:
        The full URL with the text fragment.
    """
    words = text.split()
    if len(words) > 10:
        start_phrase = ' '.join(words[:5])
        end_phrase = ' '.join(words[-5:])
        fragment = f"{urllib.parse.quote(start_phrase)},{urllib.parse.quote(end_phrase)}"
    else:
        fragment = urllib.parse.quote(text)
    
    return f"{base_url}#:~:text={fragment}"

def extract_metadata(rule_text: str) -> dict:
    """
    Extracts various metadata attributes from the text of a single rule.

    Args:
        rule_text: The cleaned text of the rule.

    Returns:
        A dictionary of extracted metadata.
    """
    metadata = {}

    # 1. Word Count
    metadata['word_count'] = len(rule_text.split())

    # 2. Timeline Mentions
    timeline_pattern = r'\b(\d+\s*(?:day|hour|year)s?)\b|\b((?:five|ten|twenty)\s+days)\b'
    metadata['timeline_mentions'] = re.findall(timeline_pattern, rule_text, re.IGNORECASE)
    # Flatten the list of tuples from regex groups
    metadata['timeline_mentions'] = [item for tpl in metadata['timeline_mentions'] for item in tpl if item]


    # 3. Cross-References
    cross_ref_pattern = r'Section[s]?\s+[\d\.]+|Title\s+\d+|Chapter\s+\d+|Civil\s+Discovery\s+Act'
    metadata['cross_references'] = re.findall(cross_ref_pattern, rule_text, re.IGNORECASE)

    # 4. Rule Classification Tags
    tags = set()
    tag_keywords = {
        'motion': ['motion', 'move'],
        'deadline': ['days', 'date', 'period', 'time', 'within'],
        'service': ['served', 'service', 'delivery'],
        'evidence': ['affidavits', 'declarations', 'evidence', 'admissions', 'depositions'],
        'sanction': ['sanctions', 'bad faith'],
        'judgment': ['judgment'],
        'opposition': ['opposition'],
        'reply': ['reply']
    }
    for tag, keywords in tag_keywords.items():
        if any(re.search(r'\b' + keyword + r'\b', rule_text, re.IGNORECASE) for keyword in keywords):
            tags.add(tag)
    metadata['tags'] = sorted(list(tags))
    
    return metadata

def parse_rules_from_text(text: str, section_number: str) -> dict:
    """
    Parses the text of a law to extract rules, sub-rules, hyperlinks, and the effective date.

    Args:
        text: The full text of the law.
        section_number: The CCP section number (e.g., "437c").

    Returns:
        A dictionary containing the structured rules (with hyperlinks) and the effective date.
    """
    
    # --- 1. Extract dynamic subtitle (chapter heading) ---
    subtitle = "Chapter information not found"
    subtitle_match = re.search(r'(CHAPTER\s+\d+\s*\..*?\[\s*[\w\d\s-]+\s*\])', text, re.IGNORECASE)
    if subtitle_match:
        subtitle = clean_text(subtitle_match.group(1))

    # --- 2. Extract effective date and amendment info ---
    effective_date = "Not found"
    amendment_info = {}
    amendment_match = re.search(r'\(Amended\s+by\s+Stats\.\s+([\d]+),\s+Ch\.\s+([\d]+),\s+Sec\.\s+([\d]+)\.\s+\((AB\s+[\d]+)\)\)\s+Effective\s+([^)]+)', text, re.IGNORECASE)
    if amendment_match:
        amendment_info = {
            'year': amendment_match.group(1),
            'chapter': amendment_match.group(2),
            'section': amendment_match.group(3),
            'bill': amendment_match.group(4)
        }
        effective_date = amendment_match.group(5).strip().replace('.', '')


    # --- 3. Isolate the main content of the specified section ---
    content_start = re.search(rf"{section_number}\.", text)
    if not content_start:
        return {"error": f"Could not find the start of section {section_number} in the text."}
    
    main_content = text[content_start.start():]
    main_content = re.sub(r"\(Amended by Stats\.[\s\S]+", "", main_content)

    # --- 4. Split the content into rules ---
    rule_parts = re.split(r'(?=\(\s*[a-z]\s*\))', main_content)

    parsed_rules = []
    
    base_url = f"https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum={section_number}"
    
    for part in rule_parts:
        if not part.strip():
            continue

        part = part.strip()
        identifier_match = re.match(r'^(\(\s*[a-z]\s*\))', part)
        if not identifier_match:
            continue
        
        top_level_identifier = identifier_match.group(1).replace(' ', '')
        rule_id_base = f"{section_number}{top_level_identifier}"
        rule_text_content = part[identifier_match.end():].strip()
        
        sub_parts = re.split(r'(?=\(\s*\d+\s*\))', rule_text_content)
        has_sub_parts = len(sub_parts) > 1

        if not has_sub_parts:
            cleaned_rule_text = clean_text(rule_text_content)
            parsed_rules.append({
                "rule_id": rule_id_base,
                "text": cleaned_rule_text,
                "link": generate_highlight_link(base_url, cleaned_rule_text),
                "metadata": extract_metadata(cleaned_rule_text)
            })
        else:
            first_sub_text = sub_parts[0].strip()
            if first_sub_text:
                cleaned_first_sub_text = clean_text(first_sub_text)
                parsed_rules.append({
                    "rule_id": rule_id_base,
                    "text": cleaned_first_sub_text,
                    "link": generate_highlight_link(base_url, cleaned_first_sub_text),
                    "metadata": extract_metadata(cleaned_first_sub_text)
                })
            
            for sub_part in sub_parts[1:]:
                sub_identifier_match = re.match(r'^(\(\s*\d+\s*\))', sub_part)
                if not sub_identifier_match:
                    continue

                sub_rule_id = f"{rule_id_base}{sub_identifier_match.group(1).replace(' ', '')}"
                sub_rule_content = sub_part[sub_identifier_match.end():].strip()
                
                sub_sub_parts = re.split(r'(?=\(\s*[A-Z]\s*\))', sub_rule_content)
                if len(sub_sub_parts) <= 1:
                    cleaned_sub_rule_content = clean_text(sub_rule_content)
                    parsed_rules.append({
                        "rule_id": sub_rule_id,
                        "text": cleaned_sub_rule_content,
                        "link": generate_highlight_link(base_url, cleaned_sub_rule_content),
                        "metadata": extract_metadata(cleaned_sub_rule_content)
                    })
                else:
                    for sub_sub_part in sub_sub_parts:
                         if not sub_sub_part.strip(): continue
                         sub_sub_id_match = re.match(r'^(\(\s*[A-Z]\s*\))', sub_sub_part)
                         if not sub_sub_id_match: continue

                         sub_sub_rule_id = f"{sub_rule_id}{sub_sub_id_match.group(1).replace(' ', '')}"
                         sub_sub_content = sub_sub_part[sub_sub_id_match.end():].strip()
                         cleaned_sub_sub_content = clean_text(sub_sub_content)
                         parsed_rules.append({
                            "rule_id": sub_sub_rule_id,
                            "text": cleaned_sub_sub_content,
                            "link": generate_highlight_link(base_url, cleaned_sub_sub_content),
                            "metadata": extract_metadata(cleaned_sub_sub_content)
                         })

    return {
        "title": f"California Code of Civil Procedure Section {section_number}",
        "subtitle": subtitle,
        "effective_date": effective_date,
        "amendment_info": amendment_info,
        "rules": parsed_rules
    }

def process_file(pdf_path, output_dir):
    """Processes a single PDF file for rule extraction."""
    print("-" * 50)
    print(f"Processing file: {os.path.basename(pdf_path)}")

    # Automatically derive section number from filename
    basename = os.path.basename(pdf_path)
    match = re.search(r'(?:CCP_)?([a-zA-Z0-9\.]+)\.pdf', basename, re.IGNORECASE)
    
    if not match:
        print(f"  -> SKIPPING: Could not determine section number from filename '{basename}'.")
        return

    section_number = match.group(1)
    print(f"  -> Detected section number: {section_number}")

    output_json_path = os.path.join(output_dir, f'california_code_{section_number}_with_links.json')

    # Execution for one file
    pdf_text = extract_text_from_pdf(pdf_path)
    if not pdf_text:
        print("  -> SKIPPING: PDF text could not be extracted.")
        return

    structured_data = parse_rules_from_text(pdf_text, section_number)
    if "error" in structured_data:
        print(f"  -> SKIPPING: Error during parsing: {structured_data['error']}")
        return

    try:
        with open(output_json_path, 'w', encoding='utf-8') as f:
            json.dump(structured_data, f, indent=4)
        print(f"  -> SUCCESS: Saved output to '{output_json_path}'")
    except Exception as e:
        print(f"  -> FAILED: An error occurred while saving the JSON file: {e}")

def main():
    """
    Main function to batch process all PDF files in a given directory.
    """
    # --- User Input ---
    folder_path = input("Enter the path to the folder containing your CCP PDF files: ").strip()

    if not os.path.isdir(folder_path):
        print(f"Error: The provided path '{folder_path}' is not a valid directory.")
        return
        
    # --- Create an output directory ---
    output_directory = os.path.join(folder_path, "output")
    os.makedirs(output_directory, exist_ok=True)
    print(f"Output will be saved in: {output_directory}")

    # --- Batch Processing ---
    pdf_files = [f for f in os.listdir(folder_path) if f.lower().endswith('.pdf')]
    
    if not pdf_files:
        print("No PDF files found in the specified directory.")
        return

    total_files = len(pdf_files)
    print(f"Found {total_files} PDF file(s) to process.")

    for i, filename in enumerate(pdf_files):
        print(f"\n--- Processing file {i+1} of {total_files} ---")
        full_pdf_path = os.path.join(folder_path, filename)
        process_file(full_pdf_path, output_directory)

    print("\nBatch processing complete.")


if __name__ == '__main__':
    # Before running, ensure you have pypdf installed:
    # pip install pypdf
    main()
