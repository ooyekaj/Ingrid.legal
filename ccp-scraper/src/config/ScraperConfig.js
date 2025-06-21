/**
 * Enhanced Configuration for CCP/CRC Rule Extraction
 * Supports enterprise-level metadata tracking and rule analysis
 */

class ScraperConfig {
  // Default Options
  static DEFAULT_OPTIONS = {
    downloadDir: './ccp_pdfs',
    outputDir: './ccp_results',
    maxConcurrent: 3,
    delay: 2000,
    ruleAgeThreshold: 24 // hours
  };

  // URLs
  static URLS = {
    BASE_URL: 'https://leginfo.legislature.ca.gov',
    CCP_TOC_URL: 'https://leginfo.legislature.ca.gov/faces/codedisplayexpand.xhtml?tocCode=CCP',
    CRC_TOC_URL: 'https://leginfo.legislature.ca.gov/faces/codedisplayexpand.xhtml?tocCode=CRC'
  };

  // CSS Selectors
  static SELECTORS = {
    PDF_LINKS: 'a[href*="/pdfgen/"]',
    PRINT_BUTTON: 'input[type="button"][value*="Print"]',
    CONTENT_AREA: '.contentArea, .content, .main-content',
    SECTION_LINKS: 'a[href*="codesection"]'
  };

  // Enhanced Filing Question Analysis
  static FILING_QUESTIONS = {
    WHEN: {
      keywords: ['deadline', 'time', 'days', 'hours', 'before', 'after', 'within', 'by', 'no later than', 'due'],
      timing_types: ['deadline', 'service_hours', 'filing_window', 'response_time', 'notice_period'],
      patterns: [
        /within\s+(\d+)\s+(calendar\s+days?|court\s+days?|business\s+days?|days?)/gi,
        /(\d+)\s+(calendar\s+days?|court\s+days?|business\s+days?)\s+(?:before|after|from)/gi,
        /(?:no\s+later\s+than|not\s+later\s+than)\s+([^.]{5,50})/gi,
        /between\s+(\d+)\s*(?:a\.?m\.?|p\.?m\.?)\s+and\s+(\d+)\s*(?:a\.?m\.?|p\.?m\.?)/gi,
        /(?:deadline|due\s+date|time\s+limit)\s+(?:is|shall\s+be)\s+([^.]{5,50})/gi
      ]
    },
    HOW: {
      keywords: ['procedure', 'method', 'process', 'steps', 'manner', 'way', 'served', 'filed', 'delivered'],
      procedural_types: ['service_method', 'filing_procedure', 'notice_method', 'delivery_method'],
      patterns: [
        /shall\s+(?:be\s+)?(?:serve[d]?|file[d]?|deliver[ed]?)\s+([^.]{10,100})/gi,
        /must\s+(?:be\s+)?(?:serve[d]?|file[d]?|deliver[ed]?)\s+([^.]{10,100})/gi,
        /(?:method|manner|way)\s+of\s+(?:service|filing|notice)\s+([^.]{10,100})/gi,
        /(?:personal|electronic|mail)\s+service\s+([^.]{10,100})/gi
      ]
    },
    WHERE: {
      keywords: ['venue', 'court', 'county', 'jurisdiction', 'location', 'place', 'filed in', 'served at'],
      venue_types: ['court_jurisdiction', 'service_location', 'filing_location', 'residence_county'],
      patterns: [
        /(?:venue|jurisdiction)\s+(?:is|shall\s+be)\s+([^.]{10,100})/gi,
        /(?:county|court)\s+(?:of|in\s+which)\s+([^.]{10,100})/gi,
        /filed\s+in\s+([^.]{10,100})/gi,
        /(?:proper|appropriate)\s+court\s+([^.]{10,100})/gi
      ]
    },
    WHAT: {
      keywords: ['document', 'form', 'paper', 'pleading', 'notice', 'motion', 'petition', 'complaint'],
      document_types: ['required_document', 'form_requirement', 'attachment', 'exhibit'],
      patterns: [
        /(?:document|form|paper|pleading)\s+(?:shall|must)\s+(?:contain|include|state)\s+([^.]{10,100})/gi,
        /(?:motion|petition|complaint)\s+(?:shall|must)\s+([^.]{10,100})/gi,
        /(?:attachment|exhibit|schedule)\s+([^.]{10,100})/gi
      ]
    },
    WHO: {
      keywords: ['party', 'attorney', 'person', 'plaintiff', 'defendant', 'petitioner', 'respondent', 'capacity'],
      capacity_types: ['authorized_person', 'required_party', 'service_recipient', 'filing_party'],
      patterns: [
        /(?:party|attorney|person)\s+(?:authorized|permitted|required)\s+to\s+([^.]{10,100})/gi,
        /(?:plaintiff|defendant|petitioner|respondent)\s+(?:shall|must)\s+([^.]{10,100})/gi,
        /(?:person|individual)\s+(?:18|eighteen)\s+years?\s+(?:of\s+age|old)\s+([^.]{10,100})/gi
      ]
    },
    FORMAT: {
      keywords: ['format', 'form', 'size', 'font', 'margin', 'paper', 'electronic', 'signature', 'caption'],
      format_types: ['paper_format', 'electronic_format', 'signature_requirement', 'caption_requirement'],
      patterns: [
        /(?:format|form)\s+(?:shall|must)\s+be\s+([^.]{10,100})/gi,
        /(?:signature|verification)\s+(?:shall|must)\s+([^.]{10,100})/gi,
        /(?:caption|heading)\s+(?:shall|must)\s+([^.]{10,100})/gi,
        /(?:electronic|paper)\s+(?:filing|service)\s+([^.]{10,100})/gi
      ]
    }
  };

  // Enhanced Rule Status Types
  static RULE_STATUS = {
    ACTIVE: 'active',
    REPEALED: 'repealed',
    SUPERSEDED: 'superseded',
    AMENDED: 'amended',
    SUSPENDED: 'suspended'
  };

  // Court Applicability Types
  static COURT_TYPES = {
    SUPERIOR_COURT: 'superior_court',
    APPELLATE_COURT: 'appellate_court',
    SUPREME_COURT: 'supreme_court',
    FEDERAL_COURT: 'federal_court',
    ALL_COURTS: 'all_courts'
  };

  // Relationship Types for Cross-References
  static RELATIONSHIP_TYPES = {
    REFERENCED_PROCEDURE: 'referenced_procedure',
    DEPENDS_ON: 'depends_on',
    ENABLES: 'enables',
    SUPERSEDES: 'supersedes',
    MODIFIED_BY: 'modified_by',
    ALTERNATIVE_TO: 'alternative_to',
    PREREQUISITE_FOR: 'prerequisite_for',
    EXCEPTION_TO: 'exception_to'
  };

  // Procedural Categories
  static PROCEDURAL_CATEGORIES = {
    SERVICE_OF_PROCESS: 'service_of_process',
    PLEADINGS: 'pleadings',
    MOTIONS: 'motions',
    DISCOVERY: 'discovery',
    JUDGMENT: 'judgment',
    APPEALS: 'appeals',
    ENFORCEMENT: 'enforcement',
    CASE_MANAGEMENT: 'case_management'
  };

  // Complexity Levels
  static COMPLEXITY_LEVELS = {
    BASIC: 'basic',
    INTERMEDIATE: 'intermediate',
    ADVANCED: 'advanced',
    EXPERT: 'expert'
  };

  // Enhanced Content Analysis Patterns
  static CONTENT_PATTERNS = {
    TIMING_REQUIREMENTS: [
      /within\s+(\d+)\s+(calendar\s+days?|court\s+days?|business\s+days?|days?)/gi,
      /(\d+)\s+(calendar\s+days?|court\s+days?|business\s+days?)\s+(?:before|after|from)/gi,
      /between\s+(\d+)\s*(?:a\.?m\.?|p\.?m\.?)\s+and\s+(\d+)\s*(?:a\.?m\.?|p\.?m\.?)/gi,
      /(?:no\s+later\s+than|not\s+later\s+than)\s+([^.]{5,50})/gi,
      /(?:deadline|due\s+date|time\s+limit)\s+(?:is|shall\s+be)\s+([^.]{5,50})/gi
    ],
    SERVICE_METHODS: [
      /personal\s+(?:service|delivery)\s+([^.]{10,100})/gi,
      /electronic\s+service\s+([^.]{10,100})/gi,
      /mail\s+service\s+([^.]{10,100})/gi,
      /(?:substitute|alternative)\s+service\s+([^.]{10,100})/gi
    ],
    MANDATORY_VS_PERMISSIVE: [
      /(?:shall|must|required)\s+([^.]{10,100})/gi,
      /(?:may|permitted|allowed)\s+([^.]{10,100})/gi,
      /(?:directory|suggested|recommended)\s+([^.]{10,100})/gi
    ],
    CROSS_REFERENCES: [
      /(?:Section|Rule|Code)\s+(\d+[a-z]?(?:\.\d+)?)/gi,
      /Code\s+of\s+Civil\s+Procedure\s+[Ss]ection\s+(\d+[a-z]?(?:\.\d+)?)/gi,
      /California\s+Rules\s+of\s+Court\s+[Rr]ule\s+(\d+[a-z]?(?:\.\d+)?)/gi,
      /Evidence\s+Code\s+[Ss]ection\s+(\d+[a-z]?(?:\.\d+)?)/gi,
      /Local\s+Rule\s+(\d+[a-z]?(?:\.\d+)?)/gi,
      /Federal\s+Rule\s+(\d+[a-z]?(?:\.\d+)?)/gi
    ]
  };

  // Error Indicators
  static ERROR_INDICATORS = [
    'page not found',
    'error occurred',
    'session expired',
    'access denied',
    'temporarily unavailable'
  ];

  // Timeouts
  static TIMEOUTS = {
    PAGE_LOAD: 30000,
    DOWNLOAD: 120000,
    PROCESSING: 300000
  };

  // Post-judgment enforcement exclusions
  static POST_JUDGMENT_EXCLUSIONS = {
    ranges: [
      { start: 680, end: 724.120 },
      { start: 1174, end: 1174.3 }
    ],
    terms: [
      'garnishment', 'wage garnishment', 'earnings withholding',
      'bank levy', 'asset seizure', 'property execution',
      'judgment debtor examination', 'abstract of judgment',
      'writ of execution', 'keeper', 'till tap'
    ]
  };

  /**
   * Get enhanced metadata structure template
   */
  static getEnhancedMetadataTemplate() {
    return {
      rule_status: {
        effective_date: null,
        last_amended: null,
        status: ScraperConfig.RULE_STATUS.ACTIVE,
        amendment_history: [],
        historical_note: null
      },
      filing_question_analysis: {
        when_timing: {
          answers_question: false,
          specific_deadlines: [],
          timing_type: null,
          mandatory: false,
          exceptions: []
        },
        how_procedure: {
          answers_question: false,
          procedural_steps: [],
          mandatory_procedures: [],
          alternative_methods: []
        },
        what_documents: {
          answers_question: false,
          required_documents: [],
          document_types: [],
          attachments: []
        },
        where_venue: {
          answers_question: false,
          venue_requirements: [],
          jurisdiction_rules: [],
          location_specifics: []
        },
        who_capacity: {
          answers_question: false,
          authorized_persons: [],
          capacity_requirements: [],
          restrictions: []
        },
        format_requirements: {
          answers_question: false,
          format_specs: [],
          signature_requirements: [],
          electronic_filing: []
        }
      },
      enhanced_cross_references: {
        ccp_sections: [],
        crc_rules: [],
        evidence_code: [],
        local_rules: [],
        federal_rules: []
      },
      relationship_analysis: {
        depends_on: [],
        enables: [],
        supersedes: [],
        modified_by_local_rules: [],
        procedural_category: null,
        complexity_level: ScraperConfig.COMPLEXITY_LEVELS.INTERMEDIATE
      },
      court_applicability: {
        applies_to: [ScraperConfig.COURT_TYPES.SUPERIOR_COURT],
        excludes: [],
        local_variations_allowed: false,
        statewide_uniform: true
      },
      enhanced_content_analysis: {
        timing_requirements: [],
        service_requirements: [],
        mandatory_vs_permissive: {
          mandatory_elements: [],
          permissive_elements: [],
          directory_elements: []
        }
      }
    };
  }

  /**
   * Validate enhanced metadata structure
   */
  static validateMetadata(metadata) {
    const template = ScraperConfig.getEnhancedMetadataTemplate();
    const errors = [];

    // Check required top-level keys
    for (const key of Object.keys(template)) {
      if (!metadata.hasOwnProperty(key)) {
        errors.push(`Missing required field: ${key}`);
      }
    }

    // Validate rule status
    if (metadata.rule_status && metadata.rule_status.status) {
      const validStatuses = Object.values(ScraperConfig.RULE_STATUS);
      if (!validStatuses.includes(metadata.rule_status.status)) {
        errors.push(`Invalid rule status: ${metadata.rule_status.status}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }
}

module.exports = ScraperConfig; 