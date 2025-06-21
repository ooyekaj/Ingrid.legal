class ScraperConfig {
  static get DEFAULT_OPTIONS() {
    return {
      downloadDir: './ccp_pdfs',
      outputDir: './ccp_results',
      maxConcurrent: 3,
      delay: 2000
    };
  }

  static get URLS() {
    return {
      BASE_URL: 'https://leginfo.legislature.ca.gov',
      CCP_TOC_URL: 'https://leginfo.legislature.ca.gov/faces/codedisplayexpand.xhtml?tocCode=CCP'
    };
  }

  static get SELECTORS() {
    return {
      PDF_LINKS: [
        '#displayCodeSection\\:pdf_link',
        'a[id*="pdf_link"]',
        'a:has-text("PDF")'
      ],
      PRINT_BUTTONS: [
        '#codes_print a',
        'a[title*="Print"]',
        'a[onclick*="window.print"]',
        'img[alt="print page"]',
        'button:has-text("print"), a:has-text("print"), button:has-text("PDF"), a:has-text("PDF")',
        '[title*="print"], [title*="PDF"]'
      ],
      PRINT_POPUP_BUTTONS: [
        'button[onclick*="printPopup"]',
        'button:has-text("print")',
        'a:has-text("print")'
      ],
      CONTENT_AREAS: [
        '#displayCodeSection',
        '.main-content',
        '.content',
        '.law-content',
        '.section-content',
        'main',
        'article'
      ],
      UNWANTED_ELEMENTS: [
        'nav', '.nav', '.navigation',
        'header', '.header',
        'footer', '.footer',
        '.breadcrumb', '.breadcrumbs',
        '.sidebar', '.side-nav',
        'script', 'style',
        '.search', '.search-box',
        '.print-button', '.pdf-button',
        '.social-media', '.share-buttons'
      ]
    };
  }

  static get FILING_QUESTION_KEYWORDS() {
    return {
      when: [
        'deadline', 'within', 'days', 'time limit', 'before', 'after',
        'calendar days', 'court days', 'business days',
        'filing deadline', 'service deadline', 'notice deadline',
        'cutoff', 'time computation', 'extension', 'late filing'
      ],
      how: [
        'procedure', 'method', 'process', 'steps', 'requirements',
        'filing procedure', 'service procedure', 'electronic filing',
        'mail service', 'personal service', 'proof of service',
        'meet and confer', 'notice requirements', 'application procedure'
      ],
      where: [
        'venue', 'jurisdiction', 'proper court', 'county', 'district',
        'where to file', 'court location', 'filing location',
        'transfer', 'forum', 'proper forum'
      ],
      what: [
        'shall contain', 'must contain', 'shall include', 'must include',
        'required contents', 'required elements', 'separate statement',
        'points and authorities', 'supporting declaration', 'exhibits',
        'notice of motion', 'memorandum', 'brief', 'attachment'
      ],
      who: [
        'capacity', 'authority', 'standing', 'who may file',
        'attorney', 'party', 'representative', 'agent',
        'verification', 'sworn', 'under penalty of perjury'
      ],
      format: [
        'format', 'formatting', 'caption', 'title', 'heading',
        'font', 'margins', 'spacing', 'numbering', 'page limits',
        'document format', 'pleading format', 'form', 'template',
        'typed', 'written', 'legible', 'paper size'
      ]
    };
  }

  static get EXCLUSION_TERMS() {
    return [
      // POST-JUDGMENT ENFORCEMENT TERMS
      'property exemption', 'homestead exemption', 'wage exemption', 'personal property exemption',
      'exempt property', 'exempt assets', 'exemption from execution',
      'wage garnishment', 'earnings withholding', 'garnishment procedure',
      'writ of execution', 'execution procedures', 'levy', 'seizure',
      'judgment debtor examination', 'debtor examination', 'asset examination',
      'third-party claim', 'claim of exemption', 'claim procedures',
      'real property sale', 'execution sale', 'property auction',
      'distribution of proceeds', 'sale proceeds', 'sheriff sale',
      'lien on real property', 'real property lien', 'property liens',
      'attachment of property', 'property attachment', 'asset seizure',
      
      // Substantive legal outcomes
      'damages', 'liability', 'breach', 'tort', 'contract',
      'negligence', 'fraud', 'defamation',
      
      // Trial procedures and outcomes
      'jury verdict', 'trial outcome', 'evidence rules',
      'witness examination', 'closing arguments', 'trial testimony',
      
      // Criminal law
      'criminal', 'felony', 'misdemeanor', 'sentence', 'punishment'
    ];
  }

  static get ERROR_INDICATORS() {
    return [
      'required pdf file not available',
      'please try again sometime later',
      'code: select code',
      'search phrase:',
      'bill information',
      'california law',
      'publications',
      'other resources'
    ];
  }

  static get EXCLUSION_RANGES() {
    return [
      // Judgment enforcement and collection procedures
      { range: [680, 699.5], reason: 'Post-judgment enforcement procedures - not document filing during litigation' },
      
      // Property exemptions
      { range: [699.5, 699.799], reason: 'Property exemptions - not filing procedures during litigation' },
      
      // Execution, levy, and asset seizure procedures
      { range: [700, 724.999], reason: 'Post-judgment execution and levy procedures - not filing procedures during litigation' },
      
      // Extended judgment enforcement procedures
      { range: [726, 799], reason: 'Post-judgment asset seizure procedures - not document filing during litigation' },
      
      // Substantive legal rights and outcomes
      { range: [340, 366], reason: 'Limitation periods - substantive law, not filing procedures' },
      { range: [377, 391], reason: 'Statute of limitations - substantive law, not filing procedures' },
      { range: [631, 663], reason: 'Trial procedures and outcomes - not document filing procedures' },
      { range: [1000.1, 1000.5], reason: 'Evidence presentation - not document filing procedures' },
      
      // Jury and trial procedures
      { range: [190, 237], reason: 'Jury selection and trial - not document filing procedures' },
      { range: [607, 630], reason: 'Trial management - not document filing procedures' }
    ];
  }

  static get TIMEOUTS() {
    return {
      PAGE_LOAD: 15000,
      DOWNLOAD: 30000,
      PDF_VERIFICATION: 5000
    };
  }

  static get FILE_CONSTRAINTS() {
    return {
      MIN_PDF_SIZE: 1000, // bytes
      MIN_CONTENT_LENGTH: 50, // characters
      MIN_RELEVANCE_SCORE: 8
    };
  }
}

module.exports = ScraperConfig; 