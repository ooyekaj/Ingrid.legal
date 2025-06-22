/**
 * CRC Scraper Configuration
 * Enterprise-level configuration for California Rules of Court scraping
 */

const config = {
  // Base URLs and endpoints
  baseUrl: 'https://courts.ca.gov',
  crcTocUrl: 'https://courts.ca.gov/cms/rules/index',
  
  // Rule URL patterns for different CRC titles
  ruleUrlPatterns: {
    title1: 'https://courts.ca.gov/cms/rules/index/one/rule1_{ruleNumber}',
    title2: 'https://courts.ca.gov/cms/rules/index/two/rule2_{ruleNumber}',
    title3: 'https://courts.ca.gov/cms/rules/index/three/rule3_{ruleNumber}',
    title4: 'https://courts.ca.gov/cms/rules/index/four/rule4_{ruleNumber}',
    title5: 'https://courts.ca.gov/cms/rules/index/five/rule5_{ruleNumber}',
    title8: 'https://courts.ca.gov/cms/rules/index/eight/rule8_{ruleNumber}',
    title10: 'https://courts.ca.gov/cms/rules/index/ten/rule10_{ruleNumber}'
  },

  // CRC-specific rule numbering patterns
  rulePatterns: [
    /(\d+\.\d+)/g,           // 2.108, 3.1350
    /(\d+\.\d+\.\d+)/g,      // 8.104.1
    /(\d+\.\d+[a-z])/g,      // 3.1113a
    /(\d+\.\d+\(\w+\))/g     // 3.1350(a)
  ],

  // Critical CRC rules for filing procedures
  criticalRules: {
    // Title 2 - Trial Court Rules (Core Filing)
    title2: {
      filing_procedures: ['2.100', '2.101', '2.102', '2.103', '2.104', '2.105', '2.106', '2.107', '2.108', '2.109', '2.110', '2.111', '2.112', '2.113', '2.114', '2.115', '2.116', '2.117', '2.118', '2.119'],
      document_format: ['2.108', '2.109'],
      time_computation: ['2.253', '2.254', '2.255'],
      electronic_filing: ['2.256', '2.257', '2.258', '2.259'],
      service_procedures: ['2.260', '2.261', '2.262', '2.263', '2.264']
    },
    
    // Title 3 - Civil Rules (Motion Practice)
    title3: {
      motion_practice: ['3.1100', '3.1103', '3.1110', '3.1112', '3.1113', '3.1114', '3.1115', '3.1116'],
      summary_judgment: ['3.1350', '3.1351', '3.1352', '3.1354'],
      demurrer_procedures: ['3.1320', '3.1322', '3.1324'],
      general_motions: ['3.1300', '3.1302', '3.1304', '3.1306', '3.1308'],
      discovery_motions: ['3.1345', '3.1346', '3.1347', '3.1348', '3.1349'],
      ex_parte_applications: ['3.1200', '3.1202', '3.1204', '3.1206']
    },

    // Title 8 - Appellate Rules
    title8: {
      appeal_filing: ['8.25', '8.26', '8.28', '8.30', '8.32', '8.34', '8.36', '8.40', '8.44', '8.50', '8.54', '8.60', '8.66', '8.70', '8.74'],
      appellate_briefs: ['8.200', '8.204', '8.208', '8.212', '8.216', '8.220', '8.224', '8.360'],
      record_preparation: ['8.120', '8.122', '8.124', '8.130', '8.134', '8.137', '8.140', '8.144', '8.147']
    }
  },

  // Filing question analysis configuration
  filingQuestions: {
    when: {
      keywords: ['deadline', 'timing', 'calendar days', 'court days', 'service', 'notice', 'within', 'before', 'after', 'no later than'],
      patterns: [
        /within\s+(\d+)\s+(calendar|court|business)\s+days/gi,
        /no\s+later\s+than\s+([^.]{10,50})/gi,
        /deadline\s+(?:is|shall\s+be)\s+([^.]{10,50})/gi,
        /by\s+(\d+:\d+\s+[ap]\.?m\.?)/gi,
        /before\s+(\d+:\d+\s+[ap]\.?m\.?)/gi,
        /at\s+least\s+(\d+)\s+days?\s+(?:before|prior\s+to)/gi
      ],
      timeExtensions: [
        /extension\s+of\s+time/gi,
        /good\s+cause\s+shown/gi,
        /excusable\s+neglect/gi,
        /stipulation\s+to\s+extend/gi
      ]
    },
    
    how: {
      keywords: ['procedure', 'method', 'filing', 'service', 'electronic', 'personal', 'mail', 'overnight'],
      patterns: [
        /(?:shall|must)\s+be\s+filed\s+([^.]{10,100})/gi,
        /filing\s+(?:shall|must)\s+([^.]{10,100})/gi,
        /served\s+(?:by|through)\s+([^.]{10,50})/gi,
        /electronic\s+filing\s+([^.]{10,100})/gi,
        /proof\s+of\s+service\s+([^.]{10,100})/gi,
        /meet\s+and\s+confer\s+([^.]{10,100})/gi
      ],
      serviceMethod: [
        /personal\s+service/gi,
        /electronic\s+service/gi,
        /mail\s+service/gi,
        /overnight\s+delivery/gi,
        /certified\s+mail/gi
      ]
    },
    
    what: {
      keywords: ['document', 'form', 'attachment', 'exhibit', 'declaration', 'memorandum', 'brief', 'motion'],
      patterns: [
        /(?:shall|must)\s+(?:contain|include)\s+([^.]{10,100})/gi,
        /accompanied\s+by\s+([^.]{10,100})/gi,
        /attach(?:ed|ment)\s+([^.]{10,100})/gi,
        /judicial\s+council\s+form\s+([A-Z0-9-]+)/gi,
        /declaration\s+(?:of|under)\s+([^.]{10,100})/gi,
        /separate\s+statement\s+([^.]{10,100})/gi
      ],
      requiredForms: [
        /form\s+([A-Z0-9-]+)/gi,
        /judicial\s+council\s+form/gi,
        /local\s+form/gi,
        /mandatory\s+form/gi
      ]
    },
    
    where: {
      keywords: ['venue', 'jurisdiction', 'court', 'location', 'county', 'district'],
      patterns: [
        /filed\s+in\s+([^.]{10,50})/gi,
        /proper\s+(?:court|venue)\s+([^.]{10,50})/gi,
        /jurisdiction\s+([^.]{10,50})/gi,
        /county\s+where\s+([^.]{10,50})/gi,
        /superior\s+court\s+of\s+([^.]{10,50})/gi
      ]
    },
    
    who: {
      keywords: ['party', 'attorney', 'guardian', 'capacity', 'authorized', 'standing'],
      patterns: [
        /(?:party|attorney|guardian)\s+(?:may|shall)\s+([^.]{10,100})/gi,
        /capacity\s+to\s+([^.]{10,50})/gi,
        /authorized\s+to\s+([^.]{10,50})/gi,
        /on\s+behalf\s+of\s+([^.]{10,50})/gi,
        /standing\s+to\s+([^.]{10,50})/gi
      ]
    },
    
    format: {
      keywords: ['format', 'caption', 'font', 'margins', 'signature', 'page', 'spacing'],
      patterns: [
        /(\d+)-point\s+font/gi,
        /(\d+(?:\.\d+)?)\s*(?:by|\×|\*)\s*(\d+(?:\.\d+)?)\s*inch/gi,
        /margin(?:s)?\s+(?:of\s+)?(\d+(?:\.\d+)?)\s*inch/gi,
        /double\s*[-\s]?spaced/gi,
        /page\s+limit\s+(?:of\s+)?(\d+)/gi,
        /caption\s+(?:shall|must)\s+([^.]{10,100})/gi,
        /line\s+spacing\s+([^.]{10,50})/gi
      ],
      documentStructure: [
        /table\s+of\s+contents/gi,
        /table\s+of\s+authorities/gi,
        /certificate\s+of\s+(?:compliance|service)/gi,
        /signature\s+(?:block|line)/gi,
        /two[-\s]column\s+format/gi
      ]
    }
  },

  // CRC-specific legal language patterns
  legalPatterns: {
    courtDirectives: [
      /the\s+court\s+(?:shall|must|may)\s+([^.]{10,100})/gi,
      /judge\s+(?:shall|must|may)\s+([^.]{10,100})/gi,
      /clerk\s+(?:shall|must)\s+([^.]{10,100})/gi,
      /judicial\s+officer\s+(?:shall|must|may)\s+([^.]{10,100})/gi
    ],
    
    partyObligations: [
      /(?:party|parties)\s+(?:shall|must)\s+([^.]{10,100})/gi,
      /moving\s+party\s+(?:shall|must)\s+([^.]{10,100})/gi,
      /opposing\s+party\s+(?:shall|must)\s+([^.]{10,100})/gi,
      /petitioner\s+(?:shall|must)\s+([^.]{10,100})/gi,
      /respondent\s+(?:shall|must)\s+([^.]{10,100})/gi
    ],
    
    conditionalRequirements: [
      /if\s+([^,]{10,50}),?\s+(?:then\s+)?([^.]{10,100})/gi,
      /unless\s+([^,]{10,50}),?\s*([^.]{10,100})/gi,
      /except\s+(?:when|if)\s+([^.]{10,100})/gi,
      /notwithstanding\s+([^.]{10,100})/gi,
      /provided\s+that\s+([^.]{10,100})/gi
    ],
    
    mandatoryVsPermissive: {
      mandatory: ['shall', 'must', 'will', 'is required', 'shall be', 'must be'],
      permissive: ['may', 'can', 'is authorized', 'is permitted', 'may be'],
      directory: ['should', 'is encouraged', 'is recommended', 'ought to']
    },

    crossReferences: {
      crcRules: /(?:rule|Rule)\s+(\d+\.\d+(?:\.\d+)?[a-z]?)/gi,
      ccpSections: /(?:Code\s+of\s+Civil\s+Procedure\s+)?[Ss]ection\s+(\d+(?:\.\d+)?[a-z]?)/gi,
      evidenceCode: /Evidence\s+Code\s+[Ss]ection\s+(\d+)/gi,
      localRules: /local\s+rule\s+([\w\d.-]+)/gi,
      federalRules: /Federal\s+Rule\s+(?:of\s+Civil\s+Procedure\s+)?(\d+)/gi
    }
  },

  // Website navigation configuration
  navigation: {
    titlePages: {
      'title-1': 'https://courts.ca.gov/cms/rules/index/one',
      'title-2': 'https://courts.ca.gov/cms/rules/index/two', 
      'title-3': 'https://courts.ca.gov/cms/rules/index/three',
      'title-4': 'https://courts.ca.gov/cms/rules/index/four',
      'title-5': 'https://courts.ca.gov/cms/rules/index/five',
      'title-8': 'https://courts.ca.gov/cms/rules/index/eight',
      'title-10': 'https://courts.ca.gov/cms/rules/index/ten'
    },

    selectors: {
      ruleLinks: ['a[href*="/rule"]', '.rule-link', 'a[href*="cms/rules"]'],
      pdfLinks: ['a[href*="pdf"]', 'button[onclick*="printPopup"]', '.print-button', '.pdf-download'],
      ruleContent: ['.rule-content', '.rule-text', '#rule-content', '.rule-body'],
      ruleTitle: ['h1', '.rule-title', '.rule-heading', 'h2.rule-title'],
      ruleNumber: ['.rule-number', '.rule-id', '[data-rule-number]']
    },

    waitForSelectors: [
      '.rule-content',
      '.rule-text', 
      '#rule-content'
    ],

    delays: {
      betweenRequests: 500,    // Optimized: reduced from 2000ms
      betweenPages: 200,       // Optimized: reduced from 1000ms  
      retryDelay: 2000,        // Optimized: reduced from 5000ms
      pageLoad: 1500           // Optimized: reduced from 3000ms
    },

    userAgent: 'Mozilla/5.0 (compatible; Legal Research Tool; +https://example.com/bot)'
  },

  // Error handling configuration
  errorHandling: {
    retryStrategy: {
      maxRetries: 3,
      backoffMultiplier: 2,
      initialDelay: 1000
    },

    failureRecovery: {
      pdfFailure: 'fallback_to_web_scraping',
      networkTimeout: 'retry_with_longer_timeout', 
      rateLimit: 'exponential_backoff',
      contentNotFound: 'log_and_continue',
      parseError: 'skip_and_log'
    },

    validation: {
      ruleNumberFormat: /^\d+\.\d+(?:\.\d+)?[a-z]?$/,
      minimumContentLength: 100,
      requiredFields: ['ruleNumber', 'title', 'content'],
      maxContentLength: 1000000
    }
  },

  // Knowledge graph configuration
  knowledgeGraph: {
    nodeTypes: [
      'crc_rule',
      'ccp_section',
      'procedural_concept', 
      'court_type',
      'document_type',
      'deadline_type',
      'service_method',
      'filing_procedure'
    ],

    relationshipTypes: [
      'references',
      'implements',
      'modifies',
      'requires',
      'enables',
      'conflicts_with',
      'supersedes',
      'applies_to',
      'depends_on',
      'cross_references'
    ],

    outputFormats: [
      'cytoscape_js',
      'graphml',
      'd3_json',
      'gephi_gexf',
      'neo4j_cypher'
    ]
  },

  // Output configuration
  output: {
    directories: {
      pdfs: './crc_pdfs',
      results: './crc_results', 
      knowledgeGraph: './crc_knowledge_graph',
      cache: './cache',
      logs: './logs'
    },

    formats: {
      json: true,
      csv: true,
      html: true,
      markdown: true
    },

    compression: {
      enabled: true,
      level: 6
    }
  },

  // Cache configuration
  cache: {
    enabled: true,
    ttl: 2 * 60 * 60 * 1000, // 2 hours instead of 24 hours
    maxSize: 1000, // max cached items
    strategy: 'lru' // least recently used
  },

  // Performance optimization
  performance: {
    // Reduce delays significantly
    delays: {
      betweenRequests: 500,    // Reduced from 2000ms to 500ms
      betweenPages: 200,       // Reduced from 1000ms to 200ms
      retryDelay: 2000,        // Reduced from 5000ms to 2000ms
      pageLoad: 1500           // Reduced from 3000ms to 1500ms
    },

    // Concurrent processing
    concurrency: {
      maxConcurrentPDFs: 3,    // Process 3 PDFs simultaneously
      maxConcurrentPages: 2,   // Process 2 pages simultaneously
      batchSize: 10            // Process rules in batches of 10
    },

    // Progress tracking
    progressTracking: {
      enabled: true,
      saveInterval: 10,        // Save progress every 10 rules
      resumeOnRestart: true,   // Resume from last saved progress
      cacheFile: './cache/progress.json'
    }
  }
};

module.exports = config; 