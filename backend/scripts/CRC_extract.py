import os
import re
import json
from datetime import datetime
import fitz  # PyMuPDF

def extract_rules_from_text(text):
    """
    Extract rules from California Rules of Court text.
    Rules are identified by "Rule X.Y" pattern at the beginning of a line.
    """
    rules = []
    
    # Split text into lines for easier processing
    lines = text.split('\n')
    
    # Regular expression to match rule patterns
    rule_pattern = re.compile(r'^Rule (\d+\.\d+)\. (.+?)$')
    
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        
        # Check if line starts with "Rule" and matches our pattern
        match = rule_pattern.match(line)
        if match:
            rule_id = match.group(1)
            title = match.group(2)
            
            # Initialize rule text
            rule_text = []
            
            # Move to next line
            i += 1
            
            # Collect text until we hit the next rule or certain markers
            while i < len(lines):
                next_line = lines[i].strip()
                
                # Stop if we encounter another rule
                if next_line.startswith('Rule ') and rule_pattern.match(next_line):
                    break
                
                # Stop if we encounter certain section markers
                if (next_line.startswith('Chapter ') or 
                    next_line.startswith('Division ') or 
                    next_line.startswith('Title ') or
                    next_line.startswith('Article ') or
                    next_line == '' and i + 1 < len(lines) and lines[i + 1].strip().startswith('Rule ')):
                    break
                
                # Add non-empty lines to rule text
                if next_line:
                    rule_text.append(next_line)
                
                i += 1
            
            # Join the rule text
            full_text = ' '.join(rule_text)
            
            # Extract last_updated date
            last_updated = extract_last_updated(full_text)
            
            # Clean up the text (remove the last_updated line if it exists)
            clean_text = clean_rule_text(full_text)
            
            # Create rule object
            rule_obj = {
                "rule_id": rule_id,
                "title": title,
                "text": clean_text,
                "metadata": {},
                "last_updated": last_updated
            }
            
            rules.append(rule_obj)
        else:
            i += 1
    
    return rules

def extract_last_updated(text):
    """
    Extract the last updated date from rule text.
    Returns the first date found in format YYYY-MM-DD.
    """
    # Common date patterns in the document
    date_patterns = [
        r'effective (\w+ \d+, \d{4})',
        r'amended effective (\w+ \d+, \d{4})',
        r'adopted effective (\w+ \d+, \d{4})',
        r'renumbered effective (\w+ \d+, \d{4})'
    ]
    
    for pattern in date_patterns:
        matches = re.findall(pattern, text)
        if matches:
            # Take the first date found
            date_str = matches[0]
            try:
                # Parse the date
                date_obj = datetime.strptime(date_str, "%B %d, %Y")
                return date_obj.strftime("%Y-%m-%d")
            except:
                try:
                    date_obj = datetime.strptime(date_str, "%b %d, %Y")
                    return date_obj.strftime("%Y-%m-%d")
                except:
                    pass
    
    # If no date found, return a default
    return "2007-01-01"

def clean_rule_text(text):
    """
    Clean the rule text by removing dates and metadata lines.
    """
    # Remove lines that are purely about amendments/dates
    lines = text.split('. ')
    cleaned_lines = []
    
    for line in lines:
        # Skip lines that are purely about rule history
        if not (line.strip().startswith('Rule ') and 'effective' in line and 'adopted' in line):
            # Also skip if it's just a date/amendment line
            if not re.match(r'^(Rule \d+\.\d+ )?(amended|adopted|renumbered|repealed).* effective', line.strip()):
                cleaned_lines.append(line)
    
    # Rejoin and clean up
    cleaned_text = '. '.join(cleaned_lines).strip()
    
    # Remove trailing metadata that might remain
    if cleaned_text.endswith('.'):
        cleaned_text = cleaned_text[:-1]
    
    return cleaned_text

def extract_text_from_pdf(pdf_path):
    try:
        doc = fitz.open(pdf_path)
        text = ""
        for page in doc:
            text += page.get_text()
        return text
    except Exception as e:
        print(f"[ERROR] Could not extract text from {pdf_path}: {e}")
        return None

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    pdf_dir = os.path.join(script_dir, "PDF")
    output_dir = os.path.join(script_dir, "extracted_rules")
    os.makedirs(output_dir, exist_ok=True)
    if not os.path.isdir(pdf_dir):
        print(f"[ERROR] PDF directory not found: {pdf_dir}")
        return
    pdf_files = [f for f in os.listdir(pdf_dir) if f.lower().endswith('.pdf')]
    if not pdf_files:
        print(f"[ERROR] No PDF files found in {pdf_dir}")
        return
    for pdf_file in pdf_files:
        pdf_path = os.path.join(pdf_dir, pdf_file)
        print(f"[INFO] Processing {pdf_file} ...")
        text = extract_text_from_pdf(pdf_path)
        if not text or len(text.strip()) < 50:
            print(f"[WARNING] No extractable text found in {pdf_file}. Skipping.")
            continue
        rules = extract_rules_from_text(text)
        if not rules:
            print(f"[WARNING] No rules extracted from {pdf_file}.")
            continue
        base_name = os.path.splitext(pdf_file)[0]
        output_path = os.path.join(output_dir, f"{base_name}.json")
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(rules, f, indent=2, ensure_ascii=False)
        print(f"[INFO] Extracted {len(rules)} rules from {pdf_file} -> {output_path}")
    print("\nProcessing complete.")

if __name__ == "__main__":
    main()