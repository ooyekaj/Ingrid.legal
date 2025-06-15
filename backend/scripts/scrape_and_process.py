#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import re
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse, parse_qs
import json
import time

# --- Helper functions ---

def clean_text(text: str) -> str:
    """Cleans up extracted text."""
    # Also replaces the non-breaking space character with a regular space
    return re.sub(r'\s+', ' ', text.strip()).replace(u'\xa0', ' ')

def extract_metadata_for_rule(rule_text: str) -> dict:
    """Extracts metadata attributes from a single rule's text."""
    metadata = {}
    tags = set()
    tag_keywords = {
        'motion': ['motion', 'move'], 'deadline': ['days', 'date', 'period', 'time', 'within'],
        'service': ['served', 'service', 'delivery'], 'evidence': ['affidavits', 'declarations', 'evidence'],
        'sanction': ['sanctions', 'bad faith'], 'judgment': ['judgment'], 'opposition': ['opposition'], 'reply': ['reply']
    }
    for tag, keywords in tag_keywords.items():
        if any(re.search(r'\b' + kw + r'\b', rule_text, re.IGNORECASE) for kw in keywords):
            tags.add(tag)
    metadata['tags'] = sorted(list(tags))
    return metadata

# --- Main Scraper Script ---

def get_links_to_process(start_url, toc_start_marker, toc_end_marker, session):
    """Crawls the website to find all pages that might contain law text within the specified range."""
    print("Starting crawl to find all potential content links...")
    content_pages = set()
    queue = []
    visited = set()

    try:
        response = session.get(start_url)
        response.raise_for_status()
        soup = BeautifulSoup(response.content, 'html.parser')
        
        all_toc_links = soup.find_all('a', href=True)
        
        start_index, end_index = -1, -1
        for i, link in enumerate(all_toc_links):
            link_text = " ".join(link.get_text(strip=True).split())
            if start_index == -1 and toc_start_marker in link_text:
                start_index = i
            if start_index != -1 and toc_end_marker in link_text:
                end_index = i
                break
        
        if start_index != -1 and end_index != -1:
            for i in range(start_index, end_index + 1):
                href = all_toc_links[i].get('href')
                if href:
                    full_url = urljoin(start_url, href.split('#')[0])
                    if full_url not in visited:
                        queue.append(full_url)
                        visited.add(full_url)
            print(f"Found {len(queue)} initial Table of Contents links to crawl.")
        else:
            print("Error: Could not find start or end markers on the page.")
            return []
    except requests.exceptions.RequestException as e:
        print(f"Error accessing start page {start_url}: {e}")
        return []

    crawl_queue = list(queue)
    for url in queue:
        if 'codes_displayText.xhtml' in url or 'codes_displaySection.xhtml' in url:
            content_pages.add(url)

    while crawl_queue:
        url = crawl_queue.pop(0)
        print(f"  Crawling page: {url}")
        
        try:
            time.sleep(0.1) 
            response = session.get(url)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'html.parser')

            for link in soup.find_all('a', href=True):
                href = link.get('href', '').split('#')[0]
                if not href or 'goUp=Y' in href or 'mailto:' in href:
                    continue

                full_url = urljoin(url, href)
                is_ccp_link = 'tocCode=CCP' in full_url or 'lawCode=CCP' in full_url
                if 'leginfo.legislature.ca.gov' in full_url and is_ccp_link and full_url not in visited:
                    print(f"    -> Found new CCP link: {full_url}")
                    visited.add(full_url)
                    crawl_queue.append(full_url)
                    if 'codes_displayText.xhtml' in full_url or 'codes_displaySection.xhtml' in full_url:
                        content_pages.add(full_url)
        except requests.exceptions.RequestException as e:
            print(f"    Could not crawl {url}: {e}")
            
    print(f"Crawl complete. Found {len(content_pages)} unique content pages to analyze.")
    return list(content_pages)

def process_page(url, session, output_dir):
    """
    Fetches a page, identifies all law sections and their hierarchical context,
    and saves each individual section to its own JSON file.
    """
    try:
        print(f"Analyzing page: {url}")
        time.sleep(0.1)
        response = session.get(url)
        response.raise_for_status()
        soup = BeautifulSoup(response.content, 'html.parser')

        content_div = soup.find('div', id='content_main') or soup.find('div', id='sectionText') or soup.body
        
        for br in soup.find_all("br"): br.replace_with("\n")
        page_text = content_div.get_text().replace(u'\xa0', ' ')

        heading_regex = r'^\s*(PART|TITLE|CHAPTER|ARTICLE)\s+[\w\d\.]+\.?\s+.*?\[.*?\]'
        heading_matches = list(re.finditer(heading_regex, page_text, re.MULTILINE))

        section_regex = r'\b(\d{1,4}(?:\.\d{1,4}[a-z]?)?)\.'
        section_matches = list(re.finditer(section_regex, page_text))
        
        # --- NEW LOGIC: Handle both multi-section and single-section pages ---
        
        if section_matches:
            # This is a page with multiple sections visible in the text
            print(f"  -> Found {len(heading_matches)} headings and {len(section_matches)} section references in text.")

            for i, section_match in enumerate(section_matches):
                section_number = section_match.group(1)
                # Simple check to avoid creating files from out-of-context year numbers
                if len(section_number) < 3: continue
                
                output_filename = os.path.join(output_dir, f'{section_number}.json')

                start_index = section_match.start()
                end_index = section_matches[i + 1].start() if i + 1 < len(section_matches) else None
                section_text_chunk = page_text[start_index:end_index]
                
                # Further check to ensure this isn't a stray reference
                if len(section_text_chunk) < 50: # Arbitrary short length
                    continue

                # ... (rest of the multi-section parsing logic remains the same)
                parent_heading_text = f"SECTION {section_number}"
                breadcrumb_path = []
                for h in heading_matches:
                    if h.start() < start_index:
                        parent_heading_text = clean_text(h.group(0))
                        breadcrumb_path.append(parent_heading_text)
                    else:
                        break
                
                rule_parts = re.split(r'(?=\(\s*[a-z]\s*\))', section_text_chunk)
                main_rule_text = clean_text(rule_parts[0])
                subsections = {m.group(2): clean_text(part[m.end():]) for part in rule_parts[1:] if part.strip() and (m := re.match(r'^(\(\s*([a-z])\s*\))', part))}
                
                update_match = re.search(r'\((?:Amended|Added|Repealed).*?(\d{4})\.\)', section_text_chunk)
                last_updated = update_match.group(1) if update_match else "N/A"

                rule_data = {"rule_id": section_number, "text": main_rule_text, "metadata": {"tags": extract_metadata_for_rule(section_text_chunk)['tags'], "subsections": subsections}, "last_updated": last_updated}
                final_json = {"title": parent_heading_text, "path": breadcrumb_path, "source_url": url, "rule": rule_data}

                with open(output_filename, 'w', encoding='utf-8') as f:
                    json.dump(final_json, f, indent=4)
                print(f"  -> SUCCESS (Text Match): Saved Section {section_number} to {output_filename}")

        else:
            # FALLBACK LOGIC: This may be a single-section page (like 437c)
            # Check the URL for a section number instead.
            parsed_url = urlparse(url)
            query_params = parse_qs(parsed_url.query)
            section_num_from_url = query_params.get('sectionNum', [None])[0]

            if section_num_from_url:
                section_number = section_num_from_url
                print(f"  -> No sections in text, but found section '{section_number}' in URL.")
                output_filename = os.path.join(output_dir, f'{section_number}.json')
                
                # The whole page text is the section chunk
                section_text_chunk = page_text
                
                parent_heading_text = f"SECTION {section_number}"
                breadcrumb_path = [clean_text(h.group(0)) for h in heading_matches]
                if breadcrumb_path:
                    parent_heading_text = breadcrumb_path[-1]

                rule_parts = re.split(r'(?=\(\s*[a-z]\s*\))', section_text_chunk)
                main_rule_text = clean_text(rule_parts[0] if rule_parts else "")
                subsections = {m.group(2): clean_text(part[m.end():]) for part in rule_parts[1:] if part.strip() and (m := re.match(r'^(\(\s*([a-z])\s*\))', part))}

                update_match = re.search(r'\((?:Amended|Added|Repealed).*?(\d{4})\.\)', section_text_chunk)
                last_updated = update_match.group(1) if update_match else "N/A"

                rule_data = {"rule_id": section_number, "text": main_rule_text, "metadata": {"tags": extract_metadata_for_rule(section_text_chunk)['tags'], "subsections": subsections}, "last_updated": last_updated}
                final_json = {"title": parent_heading_text, "path": breadcrumb_path, "source_url": url, "rule": rule_data}

                with open(output_filename, 'w', encoding='utf-8') as f:
                    json.dump(final_json, f, indent=4)
                print(f"  -> SUCCESS (URL Match): Saved Section {section_number} to {output_filename}")
            else:
                print("  -> No section numbers found in text or URL. Likely a TOC. Skipping.")


    except requests.exceptions.RequestException as e:
        print(f"  -> FAILED to process page {url}: {e}")
    except Exception as e:
        print(f"  -> FAILED during extraction for {url}: {e}")

def main():
    """Main function to drive the scraping and processing workflow."""
    start_url = "https://leginfo.legislature.ca.gov/faces/codedisplayexpand.xhtml?tocCode=CCP"
    toc_start_marker = "PART 1. OF COURTS OF JUSTICE"
    toc_end_marker = "TITLE 7. UNIFORM FEDERAL LIEN REGISTRATION ACT"
    output_json_dir = "output_json"
    if not os.path.exists(output_json_dir):
        os.makedirs(output_json_dir)

    with requests.Session() as session:
        session.headers.update({'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'})
        pages_to_process = get_links_to_process(start_url, toc_start_marker, toc_end_marker, session)

        if not pages_to_process:
            print("No pages found to process. Exiting.")
            return

        print(f"\nAnalyzing {len(pages_to_process)} pages for law sections...")
        for i, url in enumerate(sorted(list(set(pages_to_process)))):
            print(f"\n--- Analyzing Page {i+1} of {len(pages_to_process)} ---")
            process_page(url, session, output_json_dir)

    print(f"\nBatch processing complete. JSON files are saved in the '{output_json_dir}' directory.")

if __name__ == '__main__':
    # Ensure you have the required libraries installed:
    # pip install requests beautifulsoup4
    main()
