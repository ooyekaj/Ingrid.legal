import fitz  # PyMuPDF
import re
import json
from datetime import datetime

def parse_pdf_rules(pdf_path):
    """
    Parses a PDF of court rules to extract rules, sub-rules, and update dates,
    while ignoring header-only rule entries.

    Args:
        pdf_path (str): The file path to the PDF document.

    Returns:
        str: A JSON formatted string containing the structured data of the rules.
    """
    try:
        doc = fitz.open(pdf_path)
    except Exception as e:
        return f"Error opening PDF file: {e}"

    full_text = ""
    for page in doc:
        full_text += page.get_text()

    rule_chunks = re.split(r'\n(?=Rule \d+\.\d+\.)', full_text)

    all_rules_data = []
    date_pattern = re.compile(r'([A-Z][a-z]+\s+\d{1,2},\s+\d{4})')

    for chunk in rule_chunks:
        if not chunk.strip().startswith("Rule"):
            continue

        rule_lines = chunk.strip().split('\n')
        rule_header = rule_lines[0]
        
        rule_num_match = re.match(r'Rule ([\d\.]+)', rule_header)
        if not rule_num_match:
            continue

        rule_number = rule_num_match.group(1)
        rule_title = rule_header.replace(f'Rule {rule_number}.', '').strip()

        found_dates = date_pattern.findall(chunk)
        latest_date = None
        if found_dates:
            parsed_dates = [datetime.strptime(date_str, '%B %d, %Y') for date_str in found_dates]
            latest_date = max(parsed_dates).strftime('%Y-%m-%d')

        sub_rules = {}
        sub_rule_splits = re.split(r'^\s*(\([a-zA-Z0-9]+\))', chunk, flags=re.MULTILINE)
        
        rule_intro_text = sub_rule_splits[0].replace(rule_header, '').strip()

        if len(sub_rule_splits) > 1:
            for i in range(1, len(sub_rule_splits), 2):
                sub_rule_id = sub_rule_splits[i].strip('()')
                sub_rule_content = sub_rule_splits[i+1].strip()
                
                sub_rule_dates = date_pattern.findall(sub_rule_content)
                sub_rule_latest_date = None
                if sub_rule_dates:
                    sub_parsed_dates = [datetime.strptime(date_str, '%B %d, %Y') for date_str in sub_rule_dates]
                    sub_rule_latest_date = max(sub_parsed_dates).strftime('%Y-%m-%d')

                sub_rules[sub_rule_id] = {
                    "content": sub_rule_content,
                    "last_updated": sub_rule_latest_date
                }

        all_rules_data.append({
            "rule_number": rule_number,
            "title": rule_title,
            "last_updated": latest_date,
            "introduction": rule_intro_text,
            "sub_rules": sub_rules,
        })

    final_rules = []
    for rule in all_rules_data:
        has_intro_text = len(rule.get("introduction", "")) > 0
        has_sub_rules = len(rule.get("sub_rules", {})) > 0
        
        if has_intro_text or has_sub_rules:
            final_rules.append(rule)
            
    # Sort the final list by rule number to maintain document order
    def sort_key(r):
        parts = r['rule_number'].split('.')
        return [int(p) for p in parts if p]

    final_rules.sort(key=sort_key)

    return json.dumps(final_rules, indent=2)


if __name__ == '__main__':
    pdf_file_path = '/Users/honamyoo/Documents/Litigation/roc-title-2.pdf'
    
    import os
    if os.path.exists(pdf_file_path):
        structured_data_json = parse_pdf_rules(pdf_file_path)
        print(structured_data_json)
    else:
        pdf_file_path_short = 'roc-title-2.pdf'
        if os.path.exists(pdf_file_path_short):
             structured_data_json = parse_pdf_rules(pdf_file_path_short)
             print(structured_data_json)
        else:
             print(f"Error: Could not find the PDF file.")
             print(f"Attempted paths: '{pdf_file_path}' and '{pdf_file_path_short}'")