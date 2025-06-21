// Mock section links from TOC - Enhanced with new critical sections
const mockTocLinks = [
  // 1. Service and Filing Rules (CCP 1000-1020)
  {
    ruleNumber: '1005',
    title: 'CCP Section 1005 - Motion Deadlines and Notice Requirements (16 court days notice, 9 days for opposition, 5 days for reply)',
    url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=1005',
    source: 'toc_pdf_hyperlink'
  },
  {
    ruleNumber: '1010',
    title: 'CCP Section 1010 - Service Methods and Requirements',
    url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=1010',
    source: 'toc_pdf_hyperlink'
  },
  {
    ruleNumber: '1010.6',
    title: 'CCP Section 1010.6 - Electronic Service Procedures',
    url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=1010.6',
    source: 'toc_pdf_hyperlink'
  },
  {
    ruleNumber: '1013',
    title: 'CCP Section 1013 - Time Extensions for Mail Service (+5 days in CA, +10 out of state, +2 court days for fax/overnight)',
    url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=1013',
    source: 'toc_pdf_hyperlink'
  },
  {
    ruleNumber: '1019.5',
    title: 'CCP Section 1019.5 - Notice of Court Orders and Decisions',
    url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=1019.5',
    source: 'toc_pdf_hyperlink'
  },
  
  // 2. Motion Practice and Format Requirements
  {
    ruleNumber: '473',
    title: 'CCP Section 473 - Relief from Default Judgments and Procedural Errors',
    url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=473',
    source: 'toc_pdf_hyperlink'
  },
  {
    ruleNumber: '128.7',
    title: 'CCP Section 128.7 - Sanctions for Frivolous Filings',
    url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=128.7',
    source: 'toc_pdf_hyperlink'
  },
  {
    ruleNumber: '170.6',
    title: 'CCP Section 170.6 - Peremptory Challenge to Judge',
    url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=170.6',
    source: 'toc_pdf_hyperlink'
  },
  {
    ruleNumber: '594',
    title: 'CCP Section 594 - Notice of Trial Requirements',
    url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=594',
    source: 'toc_pdf_hyperlink'
  },
  
  // 3. Case Management and Scheduling
  {
    ruleNumber: '583.210',
    title: 'CCP Section 583.210 - Dismissal for Delay in Prosecution (2-year rule)',
    url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=583.210',
    source: 'toc_pdf_hyperlink'
  },
  {
    ruleNumber: '12',
    title: 'CCP Section 12 - Time Computation Rules',
    url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=12',
    source: 'toc_pdf_hyperlink'
  },
  {
    ruleNumber: '2024.020',
    title: 'CCP Section 2024.020 - Discovery Cutoff Deadlines (30 days before trial)',
    url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=2024.020',
    source: 'toc_pdf_hyperlink'
  },
  
  // 4. Specific Motion Requirements
  {
    ruleNumber: '1287',
    title: 'CCP Section 1287 - Arbitration Petition Procedures',
    url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=1287',
    source: 'toc_pdf_hyperlink'
  },
  {
    ruleNumber: '1094.5',
    title: 'CCP Section 1094.5 - Administrative Mandate Procedures',
    url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=1094.5',
    source: 'toc_pdf_hyperlink'
  },
  
  // 5. Discovery Motion Deadlines
  {
    ruleNumber: '2030.300',
    title: 'CCP Section 2030.300 - Motion to Compel Interrogatory Responses (45-day deadline)',
    url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=2030.300',
    source: 'toc_pdf_hyperlink'
  },
  {
    ruleNumber: '2031.310',
    title: 'CCP Section 2031.310 - Motion to Compel Document Production',
    url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=2031.310',
    source: 'toc_pdf_hyperlink'
  },
  {
    ruleNumber: '2025.480',
    title: 'CCP Section 2025.480 - Motion to Compel Deposition Attendance',
    url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=2025.480',
    source: 'toc_pdf_hyperlink'
  },
  
  // 6. Ex Parte Procedures and TRO
  {
    ruleNumber: '527',
    title: 'CCP Section 527 - Temporary Restraining Orders',
    url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=527',
    source: 'toc_pdf_hyperlink'
  },
  
  // Legacy sections (still included)
  {
    ruleNumber: '437c',
    title: 'CCP Section 437c - Summary Judgment Motions',
    url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=437c',
    source: 'toc_pdf_hyperlink'
  },
  {
    ruleNumber: '1011',
    title: 'CCP Section 1011 - Personal Service Requirements',
    url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=1011',
    source: 'toc_pdf_hyperlink'
  },
  {
    ruleNumber: '2025.010',
    title: 'CCP Section 2025.010 - Deposition Procedures',
    url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=2025.010',
    source: 'toc_pdf_hyperlink'
  }
];

// Mock PDF content analysis
const mockPDFAnalysis = {
  rule_info: {
    ruleNumber: '437c',
    title: 'CCP Section 437c - Summary Judgment Motions',
    url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=437c',
    filingRelevance: { score: 8, isRelevant: true, source: 'pre_filtered' }
  },
  file_info: {
    file_path: './test/mock_pdfs/ccp_section_437c.pdf',
    file_name: 'ccp_section_437c.pdf',
    status: 'success'
  },
  metadata: {
    title: 'Code of Civil Procedure Section 437c',
    author: 'California Legislature',
    subject: 'Summary Judgment Motions',
    creator: 'Legal Publisher',
    producer: 'PDF Generator',
    creation_date: '2024-01-01',
    modification_date: '2024-01-15'
  },
  content: {
    full_text: `CCP Section 437c - Summary Judgment Motions

(a) A party may move for summary judgment in an action or proceeding if it is contended that the action has no merit or that there is no defense to the action or proceeding. The motion may be made at any time after 60 days have elapsed since the general appearance in the action or proceeding of each party against whom the motion is directed or at any earlier time after the party has appeared if the court, after hearing and for good cause shown, permits the motion to be made at an earlier time.

(b) The motion shall be supported by affidavits, or by declarations under penalty of perjury, stating the facts upon which the motion is based. The motion shall be served at least 75 days before the hearing date, and the opposition and reply shall be served within the time limits specified in subdivision (a) of Section 1005.

(c) The motion shall be heard no later than 30 days before the date of trial, unless the court for good cause orders otherwise. All papers opposing the motion shall be filed and served not later than 14 days before the hearing. All reply papers in support of the motion shall be filed and served not later than 5 days before the hearing.

Filing Requirements:
- Motion must be filed within 60 days of general appearance
- Supporting documents shall be served at least 75 days before hearing
- Opposition papers must be filed within 14 days before hearing
- Reply papers must be filed within 5 days before hearing

Service Requirements:
- All parties must be served with motion and supporting documents
- Service must comply with Code of Civil Procedure Section 1010 et seq.
- Proof of service must be filed with the court

See also: Section 1005 (Motion practice), Section 1010 (Service requirements)`,
    page_count: 5,
    pages: [
      {
        page: 1,
        text: 'CCP Section 437c - Summary Judgment Motions...'
      }
    ],
    character_count: 1847,
    word_count: 312
  },
  ccp_analysis: {
    section_number: '437c',
    section_title: 'CCP Section 437c - Summary Judgment Motions',
    filing_relevance: { score: 8, isRelevant: true, source: 'pre_filtered' },
    procedural_requirements: [
      'shall be supported by affidavits',
      'shall be served at least 75 days before the hearing date',
      'must be filed within 60 days of general appearance'
    ],
    filing_procedures: [
      'Motion must be filed within 60 days',
      'Supporting documents shall be served at least 75 days before hearing'
    ],
    service_requirements: [
      'All parties must be served with motion and supporting documents',
      'Service must comply with Code of Civil Procedure Section 1010'
    ],
    deadlines_and_timing: [
      'within 60 days of general appearance',
      'at least 75 days before the hearing date',
      'not later than 14 days before the hearing',
      'not later than 5 days before the hearing',
      'no later than 30 days before the date of trial'
    ],
    format_specifications: [
      'supported by affidavits',
      'declarations under penalty of perjury'
    ],
    cross_references: ['1005', '1010'],
    key_provisions: [
      'A party may move for summary judgment in an action or proceeding if it is contended that the action has no merit',
      'The motion may be made at any time after 60 days have elapsed since the general appearance'
    ]
  },
  extracted_at: '2024-01-15T10:30:00.000Z'
};

// Mock web scraped content
const mockWebScrapedContent = {
  source: 'web_scraping',
  title: 'Code of Civil Procedure Section 437c',
  url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=437c',
  content: `CCP Section 437c - Summary Judgment Motions

This section governs summary judgment motions in California civil proceedings. A party may move for summary judgment when contending that an action has no merit or there is no defense to the action.

Key Filing Requirements:
- Motion must be filed within 60 days of general appearance
- Motion shall be served at least 75 days before hearing
- Opposition papers must be filed within 14 days before hearing
- Reply papers must be filed within 5 days before hearing

The motion shall be supported by affidavits or declarations under penalty of perjury. All parties must be properly served according to the requirements of Code of Civil Procedure Section 1010.

Cross-references: See Section 1005 for motion practice requirements.`,
  timestamp: '2024-01-15T10:30:00.000Z',
  note: 'This content was scraped from the web page because PDF was not available'
};

// Mock sections for filtering tests - Enhanced with new critical sections
const mockMixedSections = [
  // Should be included - filing related (Enhanced sections)
  { ruleNumber: '1005', title: 'Motion Deadlines and Notice Requirements (16 court days notice, 9 days for opposition, 5 days for reply)' },
  { ruleNumber: '1010', title: 'Service Methods and Requirements' },
  { ruleNumber: '1010.6', title: 'Electronic Service Procedures' },
  { ruleNumber: '1013', title: 'Time Extensions for Mail Service (+5 days in CA, +10 out of state, +2 court days for fax/overnight)' },
  { ruleNumber: '1019.5', title: 'Notice of Court Orders and Decisions' },
  { ruleNumber: '473', title: 'Relief from Default Judgments and Procedural Errors' },
  { ruleNumber: '128.7', title: 'Sanctions for Frivolous Filings' },
  { ruleNumber: '170.6', title: 'Peremptory Challenge to Judge' },
  { ruleNumber: '594', title: 'Notice of Trial Requirements' },
  { ruleNumber: '583.210', title: 'Dismissal for Delay in Prosecution (2-year rule)' },
  { ruleNumber: '12', title: 'Time Computation Rules' },
  { ruleNumber: '2024.020', title: 'Discovery Cutoff Deadlines (30 days before trial)' },
  { ruleNumber: '1287', title: 'Arbitration Petition Procedures' },
  { ruleNumber: '1094.5', title: 'Administrative Mandate Procedures' },
  { ruleNumber: '2030.300', title: 'Motion to Compel Interrogatory Responses (45-day deadline)' },
  { ruleNumber: '2031.310', title: 'Motion to Compel Document Production' },
  { ruleNumber: '2025.480', title: 'Motion to Compel Deposition Attendance' },
  { ruleNumber: '527', title: 'Temporary Restraining Orders' },
  
  // Legacy sections (should be included)
  { ruleNumber: '437c', title: 'Summary Judgment Motions' },
  { ruleNumber: '412.10', title: 'Summons Service' },
  { ruleNumber: '425.10', title: 'Complaint Filing' },
  { ruleNumber: '2025.010', title: 'Deposition Procedures' },
  
  // Should be excluded - not filing related
  { ruleNumber: '100', title: 'General Provisions' },
  { ruleNumber: '200', title: 'Jurisdiction Over Persons' },
  { ruleNumber: '300', title: 'Venue' },
  { ruleNumber: '50', title: 'Court Hours' },
  
  // Edge cases
  { ruleNumber: '999', title: 'Filing Requirements Test' }, // Should be included by keyword
  { ruleNumber: '998', title: 'Service of Process Test' }, // Should be included by keyword
  { ruleNumber: '997', title: 'Contract Interpretation' }  // Should be excluded
];

// Mock Python script outputs
const mockPythonOutputs = {
  tocExtraction: {
    stdout: 'Processing TOC PDF...\nExtracted 25 unique section links\nTOC links saved to: ./test/temp/toc_links.json',
    stderr: '',
    exitCode: 0,
    resultData: mockTocLinks
  },
  pdfProcessing: {
    stdout: 'Processing 3 CCP PDF files...\nProcessing 1/3: CCP Section 437c\nSuccess: 5 pages, 312 words\nCCP analysis results saved to: ./test/temp/ccp_pymupdf_results.json',
    stderr: '',
    exitCode: 0,
    resultData: [mockPDFAnalysis]
  },
  errorScenario: {
    stdout: '',
    stderr: 'Error: Failed to parse PDF content',
    exitCode: 1,
    resultData: null
  }
};

// Mock file system data
const mockFileSystemData = {
  existingPDFs: [
    'ccp_section_437c_2024-01-15_0.pdf',
    'ccp_section_1005_2024-01-15_1.pdf',
    'ccp_section_1010_2024-01-15_2.pdf'
  ],
  recentPDFStats: {
    mtime: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
    size: 50000
  },
  oldPDFStats: {
    mtime: new Date(Date.now() - 1000 * 60 * 60 * 25), // 25 hours ago
    size: 45000
  }
};

// Error scenarios
const mockErrors = {
  networkError: new Error('Network request failed'),
  pdfParsingError: new Error('Failed to parse PDF content'),
  pythonScriptError: new Error('Python script execution failed'),
  fileSystemError: new Error('Permission denied'),
  playwrightError: new Error('Browser failed to launch')
};

// Expected output structures for regression testing
const expectedOutputStructure = {
  filtering_summary: {
    total_sections_found: expect.any(Number),
    filing_related_sections: expect.any(Number),
    successfully_downloaded: expect.any(Number),
    filtering_criteria: {
      primary_keywords: expect.any(Array),
      procedural_keywords: expect.any(Array),
      ccp_section_ranges: expect.any(Array),
      minimum_relevance_score: expect.any(Number)
    },
    processed_at: expect.any(String),
    processing_mode: expect.stringMatching(/^(fresh_download|existing_pdfs)$/)
  },
  extracted_documents: expect.any(Array)
};

const expectedDocumentStructure = {
  rule_info: {
    ruleNumber: expect.any(String),
    title: expect.any(String),
    url: expect.any(String)
  },
  file_info: {
    file_path: expect.any(String),
    file_name: expect.any(String),
    status: expect.stringMatching(/^(success|error)$/)
  },
  content: {
    full_text: expect.any(String),
    page_count: expect.any(Number),
    word_count: expect.any(Number)
  },
  ccp_analysis: {
    section_number: expect.any(String),
    procedural_requirements: expect.any(Array),
    deadlines_and_timing: expect.any(Array),
    cross_references: expect.any(Array)
  },
  extracted_at: expect.any(String)
};

module.exports = {
  mockTocLinks,
  mockPDFAnalysis,
  mockWebScrapedContent,
  mockMixedSections,
  mockPythonOutputs,
  mockFileSystemData,
  mockErrors,
  expectedOutputStructure,
  expectedDocumentStructure
}; 