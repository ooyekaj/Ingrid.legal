class DocumentTypes {
  constructor() {
    this.documentTypes = this.getDocumentTypes();
    this.filingRelevanceCriteria = this.getFilingRelevanceCriteria();
    this.proceduralAreas = this.getProceduralAreas();
  }

  /**
   * Define all document types with classification criteria
   */
  getDocumentTypes() {
    return {
      LOCAL_RULE: {
        name: 'Local Rule',
        patterns: [
          'local rule',
          'court rule',
          'standing rule',
          'rule \\d+',
          'local court rule',
          'superior court rule'
        ],
        url_patterns: [
          '/rule',
          '/local-rule',
          '/court-rule'
        ],
        filing_relevance: 'HIGH',
        authority_level: 'LOCAL',
        typical_content: [
          'procedures',
          'deadlines',
          'format requirements',
          'filing requirements'
        ]
      },

      STANDING_ORDER: {
        name: 'Standing Order',
        patterns: [
          'standing order',
          'general order',
          'administrative order',
          'presiding judge.*order',
          'court.*order'
        ],
        url_patterns: [
          '/order',
          '/standing-order',
          '/general-order',
          '/administrative-order'
        ],
        filing_relevance: 'HIGH',
        authority_level: 'JUDICIAL',
        typical_content: [
          'case management',
          'scheduling',
          'procedure modifications',
          'administrative changes'
        ]
      },

      CASE_MANAGEMENT_ORDER: {
        name: 'Case Management Order',
        patterns: [
          'case management.*order',
          'scheduling.*order',
          'cmco',
          'case management conference',
          'trial setting.*order'
        ],
        url_patterns: [
          '/case-management',
          '/scheduling',
          '/cmco',
          '/trial-setting'
        ],
        filing_relevance: 'VERY_HIGH',
        authority_level: 'JUDICIAL',
        typical_content: [
          'discovery deadlines',
          'motion cutoff dates',
          'trial dates',
          'conference requirements'
        ]
      },

      JUDICIAL_DIRECTIVE: {
        name: 'Judicial Directive',
        patterns: [
          'judicial directive',
          'presiding judge.*directive',
          'administrative directive',
          'court directive',
          'judge.*directive'
        ],
        url_patterns: [
          '/directive',
          '/judicial-directive',
          '/administrative-directive'
        ],
        filing_relevance: 'HIGH',
        authority_level: 'JUDICIAL',
        typical_content: [
          'policy changes',
          'procedure updates',
          'administrative requirements',
          'court operations'
        ]
      },

      PRACTICE_GUIDE: {
        name: 'Practice Guide',
        patterns: [
          'practice guide',
          'procedures?',
          'guidelines?',
          'handbook',
          'manual',
          'how to'
        ],
        url_patterns: [
          '/practice',
          '/procedures',
          '/guide',
          '/handbook',
          '/manual'
        ],
        filing_relevance: 'MEDIUM',
        authority_level: 'INFORMATIONAL',
        typical_content: [
          'step-by-step procedures',
          'best practices',
          'examples',
          'explanations'
        ]
      },

      FORM: {
        name: 'Court Form',
        patterns: [
          'form',
          'pleading.*template',
          'document.*template',
          'sample.*pleading'
        ],
        url_patterns: [
          '/form',
          '/template',
          '/sample'
        ],
        filing_relevance: 'VERY_HIGH',
        authority_level: 'OFFICIAL',
        typical_content: [
          'required formats',
          'mandatory forms',
          'templates',
          'samples'
        ]
      },

      NOTICE: {
        name: 'Court Notice',
        patterns: [
          'notice',
          'announcement',
          'bulletin',
          'advisory'
        ],
        url_patterns: [
          '/notice',
          '/announcement',
          '/bulletin',
          '/advisory'
        ],
        filing_relevance: 'MEDIUM',
        authority_level: 'ADMINISTRATIVE',
        typical_content: [
          'procedure changes',
          'deadline notifications',
          'court closure',
          'system updates'
        ]
      },

      EMERGENCY_ORDER: {
        name: 'Emergency Order',
        patterns: [
          'emergency.*order',
          'covid.*order',
          'pandemic.*order',
          'temporary.*order',
          'urgent.*order'
        ],
        url_patterns: [
          '/emergency',
          '/covid',
          '/pandemic',
          '/temporary'
        ],
        filing_relevance: 'VERY_HIGH',
        authority_level: 'JUDICIAL',
        typical_content: [
          'temporary procedures',
          'modified deadlines',
          'special requirements',
          'emergency protocols'
        ]
      }
    };
  }

  /**
   * Define filing relevance criteria and scoring
   */
  getFilingRelevanceCriteria() {
    return {
      VERY_HIGH: {
        score: 90,
        keywords: [
          'filing deadline',
          'must file',
          'shall file',
          'required format',
          'mandatory',
          'electronic filing',
          'proof of service',
          'case management statement',
          'motion practice',
          'pleading requirements'
        ]
      },
      HIGH: {
        score: 70,
        keywords: [
          'filing',
          'deadline',
          'service',
          'motion',
          'pleading',
          'case management',
          'scheduling',
          'hearing',
          'notice',
          'discovery'
        ]
      },
      MEDIUM: {
        score: 50,
        keywords: [
          'procedure',
          'practice',
          'guideline',
          'court',
          'rule',
          'order',
          'administrative',
          'policy'
        ]
      },
      LOW: {
        score: 30,
        keywords: [
          'information',
          'contact',
          'directory',
          'hours',
          'location',
          'staff'
        ]
      },
      NONE: {
        score: 0,
        keywords: []
      }
    };
  }

  /**
   * Define procedural areas for categorization
   */
  getProceduralAreas() {
    return {
      CIVIL_PROCEDURE: {
        name: 'Civil Procedure',
        keywords: [
          'civil',
          'complaint',
          'answer',
          'motion',
          'discovery',
          'trial',
          'judgment'
        ]
      },
      CASE_MANAGEMENT: {
        name: 'Case Management',
        keywords: [
          'case management',
          'scheduling',
          'conference',
          'status',
          'calendar',
          'assignment'
        ]
      },
      ELECTRONIC_FILING: {
        name: 'Electronic Filing',
        keywords: [
          'electronic filing',
          'e-filing',
          'efiling',
          'digital',
          'online filing',
          'electronic service'
        ]
      },
      MOTION_PRACTICE: {
        name: 'Motion Practice',
        keywords: [
          'motion',
          'hearing',
          'calendar',
          'tentative',
          'opposition',
          'reply'
        ]
      },
      DISCOVERY: {
        name: 'Discovery',
        keywords: [
          'discovery',
          'deposition',
          'interrogatory',
          'document request',
          'admission'
        ]
      },
      TRIAL_PROCEDURE: {
        name: 'Trial Procedure',
        keywords: [
          'trial',
          'jury',
          'evidence',
          'witness',
          'exhibit',
          'verdict'
        ]
      },
      ADMINISTRATIVE: {
        name: 'Administrative',
        keywords: [
          'administrative',
          'court hours',
          'contact',
          'fee',
          'payment',
          'clerk'
        ]
      }
    };
  }

  /**
   * Classify document based on URL, title, and content
   */
  classifyDocument(url, title, content) {
    const classification = {
      document_type: this.identifyDocumentType(url, title, content),
      filing_relevance: this.assessFilingRelevance(content),
      procedural_area: this.identifyProceduralArea(content),
      authority_level: null,
      confidence_score: 0
    };

    // Get authority level from document type
    if (classification.document_type !== 'UNKNOWN') {
      const docType = this.documentTypes[classification.document_type];
      classification.authority_level = docType.authority_level;
    }

    // Calculate confidence score
    classification.confidence_score = this.calculateConfidence(
      url, title, content, classification
    );

    return classification;
  }

  /**
   * Identify document type based on patterns
   */
  identifyDocumentType(url, title, content) {
    const combinedText = `${url} ${title} ${content}`.toLowerCase();
    let bestMatch = 'UNKNOWN';
    let highestScore = 0;

    for (const [typeKey, typeConfig] of Object.entries(this.documentTypes)) {
      let score = 0;

      // Check URL patterns
      for (const pattern of typeConfig.url_patterns) {
        if (url.toLowerCase().includes(pattern)) {
          score += 20;
        }
      }

      // Check text patterns
      for (const pattern of typeConfig.patterns) {
        const regex = new RegExp(pattern, 'gi');
        const matches = combinedText.match(regex);
        if (matches) {
          score += matches.length * 10;
        }
      }

      // Check typical content
      for (const content_type of typeConfig.typical_content) {
        if (combinedText.includes(content_type)) {
          score += 5;
        }
      }

      if (score > highestScore) {
        highestScore = score;
        bestMatch = typeKey;
      }
    }

    return bestMatch;
  }

  /**
   * Assess filing relevance of content
   */
  assessFilingRelevance(content) {
    const lowerContent = content.toLowerCase();
    let bestRelevance = 'NONE';
    let highestScore = 0;

    for (const [level, criteria] of Object.entries(this.filingRelevanceCriteria)) {
      let score = 0;
      
      for (const keyword of criteria.keywords) {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        const matches = lowerContent.match(regex);
        if (matches) {
          score += matches.length;
        }
      }

      if (score > highestScore) {
        highestScore = score;
        bestRelevance = level;
      }
    }

    return bestRelevance;
  }

  /**
   * Identify primary procedural area
   */
  identifyProceduralArea(content) {
    const lowerContent = content.toLowerCase();
    let bestArea = 'ADMINISTRATIVE';
    let highestScore = 0;

    for (const [areaKey, areaConfig] of Object.entries(this.proceduralAreas)) {
      let score = 0;
      
      for (const keyword of areaConfig.keywords) {
        if (lowerContent.includes(keyword)) {
          score += 1;
        }
      }

      if (score > highestScore) {
        highestScore = score;
        bestArea = areaKey;
      }
    }

    return bestArea;
  }

  /**
   * Calculate confidence score for classification
   */
  calculateConfidence(url, title, content, classification) {
    let confidence = 0;

    // Base confidence from document type identification
    if (classification.document_type !== 'UNKNOWN') {
      confidence += 40;
    }

    // Boost for filing relevance
    const relevanceBoost = {
      'VERY_HIGH': 30,
      'HIGH': 20,
      'MEDIUM': 10,
      'LOW': 5,
      'NONE': 0
    };
    confidence += relevanceBoost[classification.filing_relevance] || 0;

    // Boost for clear procedural area
    if (classification.procedural_area !== 'ADMINISTRATIVE') {
      confidence += 15;
    }

    // Boost for official-looking URLs
    if (url.includes('.courts.ca.gov') || url.includes('court')) {
      confidence += 15;
    }

    return Math.min(confidence, 100);
  }
}

module.exports = DocumentTypes; 