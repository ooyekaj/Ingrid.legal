const ScraperConfig = require('../config/ScraperConfig');

/**
 * Enhanced Content Analyzer for CCP/CRC Rules
 * Implements enterprise-level metadata extraction and analysis
 */
class ContentAnalyzer {
  constructor() {
    this.filingQuestions = ScraperConfig.FILING_QUESTIONS;
    this.contentPatterns = ScraperConfig.CONTENT_PATTERNS;
  }

  /**
   * Analyze content with enhanced metadata extraction
   */
  analyzeContent(text, ruleInfo) {
    const analysis = {
      section_number: ruleInfo.ruleNumber || "",
      section_title: ruleInfo.title || "",
      filing_relevance: ruleInfo.filingRelevance || {},
      
      // Enhanced metadata fields
      ...ScraperConfig.getEnhancedMetadataTemplate(),
      
      // Legacy fields (maintain backward compatibility)
      procedural_requirements: [],
      filing_procedures: [],
      service_requirements: [],
      deadlines_and_timing: [],
      format_specifications: [],
      cross_references: [],
      key_provisions: []
    };

    if (!text || text.length < 50) {
      return analysis;
    }

    // Enhanced filing question analysis
    this.analyzeFilingQuestions(text, analysis);

    // Enhanced cross-reference analysis
    this.analyzeEnhancedCrossReferences(text, analysis);

    // Enhanced content analysis
    this.analyzeEnhancedContent(text, analysis);

    // Relationship analysis
    this.analyzeRelationships(text, analysis);

    // Court applicability analysis
    this.analyzeCourtApplicability(text, analysis);

    // Rule status analysis
    this.analyzeRuleStatus(text, analysis);

    // Populate legacy fields for backward compatibility
    this.populateLegacyFields(analysis);

    return analysis;
  }

  /**
   * Enhanced filing question analysis
   */
  analyzeFilingQuestions(text, analysis) {
    const questions = analysis.filing_question_analysis;

    // WHEN - Timing Analysis
    questions.when_timing = this.analyzeWhenTiming(text);

    // HOW - Procedure Analysis  
    questions.how_procedure = this.analyzeHowProcedure(text);

    // WHAT - Document Analysis
    questions.what_documents = this.analyzeWhatDocuments(text);

    // WHERE - Venue Analysis
    questions.where_venue = this.analyzeWhereVenue(text);

    // WHO - Capacity Analysis
    questions.who_capacity = this.analyzeWhoCapacity(text);

    // FORMAT - Requirements Analysis
    questions.format_requirements = this.analyzeFormatRequirements(text);
  }

  /**
   * Analyze WHEN timing requirements
   */
  analyzeWhenTiming(text) {
    const timing = {
      answers_question: false,
      specific_deadlines: [],
      timing_type: null,
      mandatory: false,
      exceptions: []
    };

    const patterns = this.filingQuestions.WHEN.patterns;
    const keywords = this.filingQuestions.WHEN.keywords;

    // Check if text contains timing keywords
    const hasTimingKeywords = keywords.some(keyword => 
      text.toLowerCase().includes(keyword.toLowerCase())
    );

    if (hasTimingKeywords) {
      timing.answers_question = true;

      // Extract specific deadlines
      patterns.forEach(pattern => {
        const matches = text.match(pattern) || [];
        matches.forEach(match => {
          if (match.length > 3) {
            timing.specific_deadlines.push(match.trim());
          }
        });
      });

      // Determine timing type
      if (text.toLowerCase().includes('service')) {
        timing.timing_type = 'service_hours';
      } else if (text.toLowerCase().includes('deadline')) {
        timing.timing_type = 'deadline';
      } else if (text.toLowerCase().includes('filing')) {
        timing.timing_type = 'filing_window';
      }

      // Check if mandatory
      timing.mandatory = /(?:shall|must|required)/i.test(text);

      // Extract exceptions
      const exceptionPatterns = [
        /except\s+([^.]{10,100})/gi,
        /unless\s+([^.]{10,100})/gi,
        /provided\s+that\s+([^.]{10,100})/gi
      ];

      exceptionPatterns.forEach(pattern => {
        const matches = text.match(pattern) || [];
        matches.forEach(match => {
          timing.exceptions.push(match.trim());
        });
      });
    }

    return timing;
  }

  /**
   * Analyze HOW procedure requirements
   */
  analyzeHowProcedure(text) {
    const procedure = {
      answers_question: false,
      procedural_steps: [],
      mandatory_procedures: [],
      alternative_methods: []
    };

    const patterns = this.filingQuestions.HOW.patterns;
    const keywords = this.filingQuestions.HOW.keywords;

    const hasProcedureKeywords = keywords.some(keyword => 
      text.toLowerCase().includes(keyword.toLowerCase())
    );

    if (hasProcedureKeywords) {
      procedure.answers_question = true;

      // Extract procedural steps
      patterns.forEach(pattern => {
        const matches = text.match(pattern) || [];
        matches.forEach(match => {
          if (match.length > 10) {
            procedure.procedural_steps.push(match.trim());
          }
        });
      });

      // Extract mandatory procedures
      const mandatoryPattern = /(?:shall|must)\s+([^.]{10,100})/gi;
      const mandatoryMatches = text.match(mandatoryPattern) || [];
      mandatoryMatches.forEach(match => {
        procedure.mandatory_procedures.push(match.trim());
      });

      // Extract alternative methods
      const alternativePatterns = [
        /(?:may|alternatively|or)\s+([^.]{10,100})/gi,
        /(?:in\s+lieu\s+of|instead\s+of)\s+([^.]{10,100})/gi
      ];

      alternativePatterns.forEach(pattern => {
        const matches = text.match(pattern) || [];
        matches.forEach(match => {
          procedure.alternative_methods.push(match.trim());
        });
      });
    }

    return procedure;
  }

  /**
   * Analyze WHAT document requirements
   */
  analyzeWhatDocuments(text) {
    const documents = {
      answers_question: false,
      required_documents: [],
      document_types: [],
      attachments: []
    };

    const patterns = this.filingQuestions.WHAT.patterns;
    const keywords = this.filingQuestions.WHAT.keywords;

    const hasDocumentKeywords = keywords.some(keyword => 
      text.toLowerCase().includes(keyword.toLowerCase())
    );

    if (hasDocumentKeywords) {
      documents.answers_question = true;

      // Extract required documents
      patterns.forEach(pattern => {
        const matches = text.match(pattern) || [];
        matches.forEach(match => {
          if (match.length > 10) {
            documents.required_documents.push(match.trim());
          }
        });
      });

      // Extract document types
      const documentTypePatterns = [
        /(?:complaint|petition|motion|notice|summons|pleading)\s+([^.]{10,100})/gi,
        /(?:form|document)\s+([A-Z]{2,}-\d+)/gi
      ];

      documentTypePatterns.forEach(pattern => {
        const matches = text.match(pattern) || [];
        matches.forEach(match => {
          documents.document_types.push(match.trim());
        });
      });

      // Extract attachments
      const attachmentPatterns = [
        /(?:attachment|exhibit|schedule)\s+([^.]{10,100})/gi,
        /(?:accompanied\s+by|together\s+with)\s+([^.]{10,100})/gi
      ];

      attachmentPatterns.forEach(pattern => {
        const matches = text.match(pattern) || [];
        matches.forEach(match => {
          documents.attachments.push(match.trim());
        });
      });
    }

    return documents;
  }

  /**
   * Analyze WHERE venue requirements
   */
  analyzeWhereVenue(text) {
    const venue = {
      answers_question: false,
      venue_requirements: [],
      jurisdiction_rules: [],
      location_specifics: []
    };

    const patterns = this.filingQuestions.WHERE.patterns;
    const keywords = this.filingQuestions.WHERE.keywords;

    const hasVenueKeywords = keywords.some(keyword => 
      text.toLowerCase().includes(keyword.toLowerCase())
    );

    if (hasVenueKeywords) {
      venue.answers_question = true;

      // Extract venue requirements
      patterns.forEach(pattern => {
        const matches = text.match(pattern) || [];
        matches.forEach(match => {
          if (match.length > 10) {
            venue.venue_requirements.push(match.trim());
          }
        });
      });

      // Extract jurisdiction rules
      const jurisdictionPatterns = [
        /(?:jurisdiction|court)\s+(?:of|in\s+which)\s+([^.]{10,100})/gi,
        /(?:proper|appropriate)\s+court\s+([^.]{10,100})/gi
      ];

      jurisdictionPatterns.forEach(pattern => {
        const matches = text.match(pattern) || [];
        matches.forEach(match => {
          venue.jurisdiction_rules.push(match.trim());
        });
      });

      // Extract location specifics
      const locationPatterns = [
        /(?:county|district|division)\s+([^.]{10,100})/gi,
        /(?:filed\s+in|served\s+at)\s+([^.]{10,100})/gi
      ];

      locationPatterns.forEach(pattern => {
        const matches = text.match(pattern) || [];
        matches.forEach(match => {
          venue.location_specifics.push(match.trim());
        });
      });
    }

    return venue;
  }

  /**
   * Analyze WHO capacity requirements
   */
  analyzeWhoCapacity(text) {
    const capacity = {
      answers_question: false,
      authorized_persons: [],
      capacity_requirements: [],
      restrictions: []
    };

    const patterns = this.filingQuestions.WHO.patterns;
    const keywords = this.filingQuestions.WHO.keywords;

    const hasCapacityKeywords = keywords.some(keyword => 
      text.toLowerCase().includes(keyword.toLowerCase())
    );

    if (hasCapacityKeywords) {
      capacity.answers_question = true;

      // Extract authorized persons
      patterns.forEach(pattern => {
        const matches = text.match(pattern) || [];
        matches.forEach(match => {
          if (match.length > 10) {
            capacity.authorized_persons.push(match.trim());
          }
        });
      });

      // Extract capacity requirements
      const capacityPatterns = [
        /(?:person|individual)\s+(?:18|eighteen)\s+years?\s+(?:of\s+age|old)\s+([^.]{10,100})/gi,
        /(?:attorney|counsel)\s+(?:authorized|admitted)\s+([^.]{10,100})/gi
      ];

      capacityPatterns.forEach(pattern => {
        const matches = text.match(pattern) || [];
        matches.forEach(match => {
          capacity.capacity_requirements.push(match.trim());
        });
      });

      // Extract restrictions
      const restrictionPatterns = [
        /(?:not|cannot|prohibited|restricted)\s+([^.]{10,100})/gi,
        /(?:except|unless)\s+([^.]{10,100})/gi
      ];

      restrictionPatterns.forEach(pattern => {
        const matches = text.match(pattern) || [];
        matches.forEach(match => {
          capacity.restrictions.push(match.trim());
        });
      });
    }

    return capacity;
  }

  /**
   * Analyze FORMAT requirements
   */
  analyzeFormatRequirements(text) {
    const format = {
      answers_question: false,
      format_specs: [],
      signature_requirements: [],
      electronic_filing: []
    };

    const patterns = this.filingQuestions.FORMAT.patterns;
    const keywords = this.filingQuestions.FORMAT.keywords;

    const hasFormatKeywords = keywords.some(keyword => 
      text.toLowerCase().includes(keyword.toLowerCase())
    );

    if (hasFormatKeywords) {
      format.answers_question = true;

      // Extract format specifications
      patterns.forEach(pattern => {
        const matches = text.match(pattern) || [];
        matches.forEach(match => {
          if (match.length > 10) {
            format.format_specs.push(match.trim());
          }
        });
      });

      // Extract signature requirements
      const signaturePatterns = [
        /(?:signature|verification|oath)\s+(?:shall|must)\s+([^.]{10,100})/gi,
        /(?:signed|verified|sworn)\s+([^.]{10,100})/gi
      ];

      signaturePatterns.forEach(pattern => {
        const matches = text.match(pattern) || [];
        matches.forEach(match => {
          format.signature_requirements.push(match.trim());
        });
      });

      // Extract electronic filing requirements
      const electronicPatterns = [
        /(?:electronic|digital|online)\s+(?:filing|service)\s+([^.]{10,100})/gi,
        /(?:email|pdf|document\s+management)\s+([^.]{10,100})/gi
      ];

      electronicPatterns.forEach(pattern => {
        const matches = text.match(pattern) || [];
        matches.forEach(match => {
          format.electronic_filing.push(match.trim());
        });
      });
    }

    return format;
  }

  /**
   * Analyze enhanced cross-references
   */
  analyzeEnhancedCrossReferences(text, analysis) {
    const crossRefs = analysis.enhanced_cross_references;

    // CCP sections - FIXED pattern to handle lettered subsections like 12a, 12b, 12c
    const ccpPattern = /(?:Code\s+of\s+Civil\s+Procedure\s+)?[Ss]ection\s+(\d+[a-z]?(?:\.\d+)?)/gi;
    const ccpMatches = text.match(ccpPattern) || [];
    ccpMatches.forEach(match => {
      const sectionMatch = match.match(/(\d+[a-z]?(?:\.\d+)?)/);
      if (sectionMatch) {
        crossRefs.ccp_sections.push({
          section: sectionMatch[1],
          relationship_type: 'referenced_procedure',
          description: match.trim()
        });
      }
    });

    // CRC rules - FIXED pattern for lettered rules
    const crcPattern = /(?:California\s+Rules\s+of\s+Court\s+)?[Rr]ule\s+(\d+[a-z]?(?:\.\d+)?)/gi;
    const crcMatches = text.match(crcPattern) || [];
    crcMatches.forEach(match => {
      const ruleMatch = match.match(/(\d+[a-z]?(?:\.\d+)?)/);
      if (ruleMatch) {
        crossRefs.crc_rules.push({
          rule: ruleMatch[1],
          relationship_type: 'referenced_procedure',
          description: match.trim()
        });
      }
    });

    // Evidence Code - FIXED pattern for lettered sections
    const evidencePattern = /Evidence\s+Code\s+[Ss]ection\s+(\d+[a-z]?(?:\.\d+)?)/gi;
    const evidenceMatches = text.match(evidencePattern) || [];
    evidenceMatches.forEach(match => {
      const sectionMatch = match.match(/(\d+[a-z]?(?:\.\d+)?)/);
      if (sectionMatch) {
        crossRefs.evidence_code.push({
          section: sectionMatch[1],
          relationship_type: 'referenced_procedure',
          description: match.trim()
        });
      }
    });

    // Local Rules - FIXED pattern for lettered rules
    const localPattern = /Local\s+Rule\s+(\d+[a-z]?(?:\.\d+)?)/gi;
    const localMatches = text.match(localPattern) || [];
    localMatches.forEach(match => {
      const ruleMatch = match.match(/(\d+[a-z]?(?:\.\d+)?)/);
      if (ruleMatch) {
        crossRefs.local_rules.push({
          rule: ruleMatch[1],
          relationship_type: 'modified_by',
          description: match.trim()
        });
      }
    });

    // Federal Rules - FIXED pattern for lettered rules
    const federalPattern = /Federal\s+Rule\s+(\d+[a-z]?(?:\.\d+)?)/gi;
    const federalMatches = text.match(federalPattern) || [];
    federalMatches.forEach(match => {
      const ruleMatch = match.match(/(\d+[a-z]?(?:\.\d+)?)/);
      if (ruleMatch) {
        crossRefs.federal_rules.push({
          rule: ruleMatch[1],
          relationship_type: 'referenced_procedure',
          description: match.trim()
        });
      }
    });
  }

  /**
   * COMPREHENSIVE enhanced content patterns analysis with MASSIVELY EXPANDED legal language detection
   */
  analyzeEnhancedContent(text, analysis) {
    const content = analysis.enhanced_content_analysis;

    // TIMING REQUIREMENTS - COMPREHENSIVE LEGAL TIME COMPUTATION PATTERNS
    const comprehensiveTimingPatterns = [
      // Basic timing patterns
      /within\s+(\d+)\s+(calendar\s+days?|court\s+days?|business\s+days?|days?)/gi,
      /between\s+(\d+)\s*(?:a\.?m\.?|p\.?m\.?)\s+and\s+(\d+)\s*(?:a\.?m\.?|p\.?m\.?)/gi,
      /(?:8\s*a\.?m\.?|8:00\s*a\.?m\.?)\s+(?:to|and|-)\s+(?:8\s*p\.?m\.?|8:00\s*p\.?m\.?)/gi,
      /(?:9\s*a\.?m\.?|9:00\s*a\.?m\.?)\s+(?:to|and|-)\s+(?:5\s*p\.?m\.?|5:00\s*p\.?m\.?)/gi,
      
      // TIME COMPUTATION LANGUAGE - THE CRITICAL MISSING PATTERNS
      /(?:time|period)\s+(?:in\s+which|within\s+which|for)\s+([^.]{15,250})/gi,
      /(?:computed|calculated|determined|reckoned)\s+by\s+([^.]{15,250})/gi,
      /(?:excluding|except|omitting)\s+(?:the\s+)?(?:first|last)\s+([^.]{15,250})/gi,
      /(?:including|counting)\s+(?:the\s+)?(?:first|last)\s+([^.]{15,250})/gi,
      /(?:is\s+to\s+be\s+done|are\s+to\s+be\s+done|to\s+be\s+performed)\s+([^.]{15,250})/gi,
      /(?:provided\s+by\s+law|allowed\s+by\s+law|prescribed\s+by\s+law)\s+([^.]{15,250})/gi,
      
      // Holiday and exception patterns
      /(?:unless|except\s+when|if)\s+(?:the\s+)?(?:last\s+day|final\s+day)\s+([^.]{15,250})/gi,
      /(?:holiday|weekend|Saturday|Sunday)\s+([^.]{15,250})/gi,
      /(?:and\s+then\s+it\s+is|then\s+it\s+shall\s+be)\s+([^.]{15,250})/gi,
      /(?:next\s+court\s+day|following\s+court\s+day|next\s+business\s+day)\s+([^.]{15,250})/gi,
      
      // Time extension patterns
      /(?:may\s+be\s+extended|shall\s+be\s+extended|extended\s+by)\s+([^.]{15,250})/gi,
      /(?:extension\s+of\s+time|time\s+extension)\s+([^.]{15,250})/gi,
      /(?:expire|expires|expiration)\s+([^.]{15,250})/gi,
      
      // Advanced timing constructions
      /(?:commencing|beginning|starting)\s+(?:on|from|with)\s+([^.]{15,250})/gi,
      /(?:terminating|ending|concluding)\s+(?:on|at|with)\s+([^.]{15,250})/gi,
      /(?:period\s+of|term\s+of|duration\s+of)\s+(\d+)\s+([^.]{15,250})/gi,
      /(?:not\s+less\s+than|at\s+least)\s+(\d+)\s+([^.]{15,250})/gi,
      /(?:not\s+more\s+than|no\s+more\s+than)\s+(\d+)\s+([^.]{15,250})/gi
    ];

    comprehensiveTimingPatterns.forEach(pattern => {
      const matches = text.match(pattern) || [];
      matches.forEach(match => {
        if (match.trim().length > 10) {
          content.timing_requirements.push({
            requirement: match.trim().substring(0, 300),
            applies_to: this.extractTimingAppliesTo(match),
            mandatory: /(?:shall|must|required)/i.test(match),
            exceptions: this.extractTimingExceptions(match)
          });
        }
      });
    });

    // SERVICE REQUIREMENTS - COMPREHENSIVE SERVICE LANGUAGE PATTERNS
    const comprehensiveServicePatterns = [
      // Basic service patterns
      /personal\s+(?:service|delivery)\s+([^.]{10,200})/gi,
      /(?:leave\s+with|deliver\s+to)\s+([^.]{10,200})/gi,
      /(?:receptionist|person\s+in\s+charge)\s+([^.]{10,200})/gi,
      /(?:conspicuous\s+place)\s+([^.]{10,200})/gi,
      /(?:residence|mail)\s+([^.]{10,200})/gi,
      
      // SERVICE METHOD LANGUAGE - THE MISSING CRITICAL PATTERNS
      /(?:service|notice)\s+may\s+be\s+(?:made|served|effected)\s+([^.]{15,250})/gi,
      /(?:service|notice)\s+shall\s+be\s+(?:made|served|effected)\s+([^.]{15,250})/gi,
      /may\s+be\s+served\s+(?:by|upon|at)\s+([^.]{15,250})/gi,
      /shall\s+be\s+served\s+(?:by|upon|at)\s+([^.]{15,250})/gi,
      
      // Location-based service patterns
      /(?:at\s+the\s+office|office\s+of)\s+([^.]{15,250})/gi,
      /(?:at\s+the\s+residence|dwelling\s+house|usual\s+place\s+of\s+abode)\s+([^.]{15,250})/gi,
      /(?:leaving|by\s+leaving)\s+([^.]{15,250})/gi,
      /(?:delivered\s+to|delivery\s+to)\s+([^.]{15,250})/gi,
      
      // Person-based service patterns
      /(?:person\s+authorized|authorized\s+person)\s+([^.]{15,250})/gi,
      /(?:person\s+in\s+charge|person\s+having\s+charge)\s+([^.]{15,250})/gi,
      /(?:attorney\s+of\s+record|counsel\s+of\s+record)\s+([^.]{15,250})/gi,
      /(?:party|parties)\s+(?:shall|must)\s+([^.]{15,250})/gi,
      
      // Mail and electronic service patterns
      /(?:certified\s+mail|registered\s+mail|mail\s+service)\s+([^.]{15,250})/gi,
      /(?:mailing|by\s+mail|through\s+the\s+mail)\s+([^.]{15,250})/gi,
      /(?:postage\s+prepaid|return\s+receipt)\s+([^.]{15,250})/gi,
      /(?:electronic\s+service|email\s+service|digital\s+service)\s+([^.]{15,250})/gi,
      /(?:fax|facsimile|electronic\s+transmission)\s+([^.]{15,250})/gi,
      
      // Alternative service patterns
      /(?:substituted\s+service|alternative\s+service)\s+([^.]{15,250})/gi,
      /(?:posting|publication|conspicuous\s+place)\s+([^.]{15,250})/gi,
      /(?:affixing|attachment|posting)\s+([^.]{15,250})/gi,
      
      // Procedural obligation service patterns
      /(?:is\s+to\s+be|are\s+to\s+be|to\s+be)\s+(?:served|filed|delivered)\s+([^.]{15,250})/gi,
      /(?:provided\s+by\s+law|required\s+by\s+law|prescribed\s+by\s+law)\s+([^.]{15,250})/gi,
      /(?:in\s+the\s+manner|manner\s+prescribed|manner\s+provided)\s+([^.]{15,250})/gi
    ];

    comprehensiveServicePatterns.forEach((pattern, index) => {
      const matches = text.match(pattern) || [];
      matches.forEach(match => {
        if (match.trim().length > 12) {
          content.service_requirements.push({
            method: this.extractServiceMethodEnhanced(match, index),
            target: this.extractServiceTargetEnhanced(match),
            priority: this.determineServicePriorityEnhanced(match, index),
            requirements: [match.trim().substring(0, 250)]
          });
        }
      });
    });

    // PROCEDURAL REQUIREMENTS - COMPREHENSIVE LEGAL OBLIGATION PATTERNS
    const proceduralPatterns = [
      // Broad legal obligation language - THE MISSING CORE PATTERNS
      /(?:is\s+to\s+be|are\s+to\s+be|to\s+be)\s+([^.]{15,250})/gi,
      /(?:provided\s+by\s+law|required\s+by\s+law|prescribed\s+by\s+law)\s+([^.]{15,250})/gi,
      /(?:in\s+the\s+manner|manner\s+prescribed|manner\s+provided)\s+([^.]{15,250})/gi,
      /(?:unless|except\s+when|if)\s+([^.]{15,250})/gi,
      /(?:where|when|if)\s+([^.]{15,250})/gi,
      /(?:such|every|each)\s+([^.]{15,250})/gi,
      /(?:any\s+person|any\s+party)\s+(?:who|that)\s+([^.]{15,250})/gi,
      /(?:every\s+party|each\s+party)\s+([^.]{15,250})/gi,
      /(?:no\s+person|no\s+party)\s+([^.]{15,250})/gi
    ];

    // Add procedural requirements for legacy compatibility
    proceduralPatterns.forEach(pattern => {
      const matches = text.match(pattern) || [];
      matches.forEach(match => {
        if (match.trim().length > 10) {
          analysis.procedural_requirements.push(match.trim().substring(0, 200));
        }
      });
    });

    // MANDATORY VS PERMISSIVE - COMPREHENSIVE DETECTION WITH BROADER PATTERNS
    const mandatoryPatterns = [
      /(?:shall|must|required|obligated|duty)\s+([^.]{10,200})/gi,
      /(?:is\s+required|are\s+required)\s+([^.]{10,200})/gi,
      /(?:mandatory|compulsory|obligatory)\s+([^.]{10,200})/gi,
      /(?:it\s+is\s+the\s+duty|duty\s+of)\s+([^.]{10,200})/gi,
      /(?:bound\s+to|obliged\s+to)\s+([^.]{10,200})/gi
    ];

    mandatoryPatterns.forEach(pattern => {
      const matches = text.match(pattern) || [];
      matches.forEach(match => {
        if (match.trim().length > 8) {
          content.mandatory_vs_permissive.mandatory_elements.push(match.trim().substring(0, 250));
        }
      });
    });

    const permissivePatterns = [
      /(?:may|permitted|allowed|authorized|discretionary)\s+([^.]{10,200})/gi,
      /(?:is\s+permitted|are\s+permitted)\s+([^.]{10,200})/gi,
      /(?:optional|voluntary|elective)\s+([^.]{10,200})/gi,
      /(?:at\s+the\s+discretion|in\s+the\s+discretion)\s+([^.]{10,200})/gi,
      /(?:free\s+to|liberty\s+to)\s+([^.]{10,200})/gi
    ];

    permissivePatterns.forEach(pattern => {
      const matches = text.match(pattern) || [];
      matches.forEach(match => {
        if (match.trim().length > 8) {
          content.mandatory_vs_permissive.permissive_elements.push(match.trim().substring(0, 250));
        }
      });
    });

    const directoryPatterns = [
      /(?:directory|suggested|recommended|advisory)\s+([^.]{10,200})/gi,
      /(?:guidance|guideline|best\s+practice)\s+([^.]{10,200})/gi,
      /(?:should|ought\s+to)\s+([^.]{10,200})/gi
    ];

    directoryPatterns.forEach(pattern => {
      const matches = text.match(pattern) || [];
      matches.forEach(match => {
        if (match.trim().length > 8) {
          content.mandatory_vs_permissive.directory_elements.push(match.trim().substring(0, 250));
        }
      });
    });
  }

  /**
   * Analyze relationships between rules
   */
  analyzeRelationships(text, analysis) {
    const relationships = analysis.relationship_analysis;

    // Determine procedural category
    const sectionNumber = parseFloat(analysis.section_number.replace(/[a-z]/g, ''));
    if (sectionNumber >= 1000 && sectionNumber <= 1020) {
      relationships.procedural_category = ScraperConfig.PROCEDURAL_CATEGORIES.SERVICE_OF_PROCESS;
    } else if (sectionNumber >= 420 && sectionNumber <= 475) {
      relationships.procedural_category = ScraperConfig.PROCEDURAL_CATEGORIES.PLEADINGS;
    } else if (sectionNumber >= 2016 && sectionNumber <= 2033) {
      relationships.procedural_category = ScraperConfig.PROCEDURAL_CATEGORIES.DISCOVERY;
    }

    // Determine complexity level
    const complexityIndicators = {
      basic: ['simple', 'straightforward', 'basic'],
      intermediate: ['procedure', 'process', 'requirements'],
      advanced: ['complex', 'detailed', 'comprehensive'],
      expert: ['intricate', 'specialized', 'technical']
    };

    for (const [level, indicators] of Object.entries(complexityIndicators)) {
      if (indicators.some(indicator => text.toLowerCase().includes(indicator))) {
        relationships.complexity_level = level;
        break;
      }
    }

    // Extract dependencies - FIXED patterns for lettered subsections
    const dependencyPatterns = [
      /(?:pursuant\s+to|under|in\s+accordance\s+with)\s+(?:Section|Rule)\s+(\d+[a-z]?(?:\.\d+)?)/gi,
      /(?:subject\s+to|governed\s+by)\s+(?:Section|Rule)\s+(\d+[a-z]?(?:\.\d+)?)/gi,
      /(?:as\s+provided\s+by|provided\s+in)\s+(?:Section|Rule)\s+(\d+[a-z]?(?:\.\d+)?)/gi
    ];

    dependencyPatterns.forEach(pattern => {
      const matches = text.match(pattern) || [];
      matches.forEach(match => {
        const sectionMatch = match.match(/(\d+[a-z]?(?:\.\d+)?)/);
        if (sectionMatch) {
          relationships.depends_on.push(sectionMatch[1]);
        }
      });
    });
  }

  /**
   * Analyze court applicability
   */
  analyzeCourtApplicability(text, analysis) {
    const applicability = analysis.court_applicability;

    // Check for specific court mentions
    if (text.toLowerCase().includes('superior court')) {
      applicability.applies_to.push(ScraperConfig.COURT_TYPES.SUPERIOR_COURT);
    }
    if (text.toLowerCase().includes('appellate court')) {
      applicability.applies_to.push(ScraperConfig.COURT_TYPES.APPELLATE_COURT);
    }
    if (text.toLowerCase().includes('supreme court')) {
      applicability.applies_to.push(ScraperConfig.COURT_TYPES.SUPREME_COURT);
    }

    // Check for local variations
    if (text.toLowerCase().includes('local rule') || text.toLowerCase().includes('local variation')) {
      applicability.local_variations_allowed = true;
      applicability.statewide_uniform = false;
    }
  }

  /**
   * Analyze rule status and versioning
   */
  analyzeRuleStatus(text, analysis) {
    const status = analysis.rule_status;

    // Look for amendment history
    const amendmentPattern = /(?:amended|revised|modified)\s+(?:on\s+)?(\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2})/gi;
    const amendmentMatches = text.match(amendmentPattern) || [];
    amendmentMatches.forEach(match => {
      const dateMatch = match.match(/(\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2})/);
      if (dateMatch) {
        status.amendment_history.push(dateMatch[1]);
      }
    });

    // Look for effective dates
    const effectivePattern = /(?:effective|in\s+effect)\s+(?:on\s+)?(\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2})/gi;
    const effectiveMatches = text.match(effectivePattern) || [];
    if (effectiveMatches.length > 0) {
      const dateMatch = effectiveMatches[0].match(/(\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2})/);
      if (dateMatch) {
        status.effective_date = dateMatch[1];
      }
    }

    // Look for repeal/supersession
    if (text.toLowerCase().includes('repealed')) {
      status.status = ScraperConfig.RULE_STATUS.REPEALED;
    } else if (text.toLowerCase().includes('superseded')) {
      status.status = ScraperConfig.RULE_STATUS.SUPERSEDED;
    }

    // Look for historical notes
    const historyPattern = /(?:former|previous|prior)\s+(?:section|rule)\s+([^.]{10,100})/gi;
    const historyMatches = text.match(historyPattern) || [];
    if (historyMatches.length > 0) {
      status.historical_note = historyMatches[0].trim();
    }
  }

  /**
   * Populate legacy fields for backward compatibility (ENHANCED)
   */
  populateLegacyFields(analysis) {
    // Procedural requirements - Now enhanced with comprehensive legal language extraction
    // Combine the new comprehensive procedural requirements with existing filing question analysis
    const existingProcedural = [
      ...analysis.filing_question_analysis.how_procedure.procedural_steps,
      ...analysis.filing_question_analysis.how_procedure.mandatory_procedures
    ];
    
    // Merge with new comprehensive procedural requirements (removing duplicates)
    const allProcedural = [...new Set([
      ...existingProcedural,
      ...(analysis.procedural_requirements || [])
    ])];
    
    analysis.procedural_requirements = allProcedural;

    // Deadlines and timing - Enhanced with comprehensive timing analysis
    const existingTiming = analysis.filing_question_analysis.when_timing.specific_deadlines;
    const enhancedTiming = analysis.enhanced_content_analysis.timing_requirements.map(req => req.requirement);
    
    analysis.deadlines_and_timing = [...new Set([
      ...existingTiming,
      ...enhancedTiming
    ])];

    // Cross references - Enhanced cross-reference system
    analysis.cross_references = [
      ...analysis.enhanced_cross_references.ccp_sections.map(ref => ref.section),
      ...analysis.enhanced_cross_references.crc_rules.map(ref => ref.rule),
      ...analysis.enhanced_cross_references.evidence_code.map(ref => ref.section),
      ...analysis.enhanced_cross_references.local_rules.map(ref => ref.rule),
      ...analysis.enhanced_cross_references.federal_rules.map(ref => ref.rule)
    ];

    // Service requirements - Enhanced with comprehensive service method analysis
    analysis.service_requirements = analysis.enhanced_content_analysis.service_requirements.map(req => {
      let description = req.method;
      if (req.target && req.target !== 'general') {
        description += ` (${req.target})`;
      }
      if (req.priority === 1) {
        description += ' [MANDATORY]';
      } else if (req.priority === 2) {
        description += ' [PERMISSIVE]';
      }
      return description;
    });

    // Format specifications
    analysis.format_specifications = analysis.filing_question_analysis.format_requirements.format_specs;
    
    // Key provisions - Enhanced to include major procedural elements
    const keyProvisions = [
      ...analysis.filing_question_analysis.how_procedure.procedural_steps.slice(0, 3),
      ...analysis.enhanced_content_analysis.mandatory_vs_permissive.mandatory_elements.slice(0, 2)
    ].filter(provision => provision && provision.length > 20);
    
    analysis.key_provisions = keyProvisions.slice(0, 5);
  }

  /**
   * ENHANCED Helper methods for comprehensive legal language analysis
   */
  
  /**
   * Extract what timing requirements apply to (ENHANCED)
   */
  extractTimingAppliesTo(text) {
    const textLower = text.toLowerCase();
    if (textLower.includes('residence') || textLower.includes('dwelling')) {
      return 'party_at_residence';
    } else if (textLower.includes('attorney') || textLower.includes('counsel')) {
      return 'attorney';
    } else if (textLower.includes('office')) {
      return 'office_service';
    } else if (textLower.includes('party')) {
      return 'party';
    } else if (textLower.includes('court')) {
      return 'court';
    } else {
      return 'general';
    }
  }

  /**
   * Extract timing exceptions (ENHANCED)
   */
  extractTimingExceptions(text) {
    const exceptions = [];
    const exceptionPatterns = [
      /(?:except|unless|if)\s+([^.]{10,100})/gi,
      /(?:provided\s+that|except\s+when)\s+([^.]{10,100})/gi
    ];
    
    exceptionPatterns.forEach(pattern => {
      const matches = text.match(pattern) || [];
      exceptions.push(...matches.map(match => match.trim()).filter(match => match.length > 5));
    });
    
    return exceptions;
  }

  /**
   * Extract service method from text (ENHANCED)
   */
  extractServiceMethodEnhanced(text, patternIndex) {
    const textLower = text.toLowerCase();
    if (textLower.includes('personal') || patternIndex === 0) {
      return 'personal_delivery';
    } else if (textLower.includes('mail') || textLower.includes('certified')) {
      return 'mail_service';
    } else if (textLower.includes('electronic') || textLower.includes('email')) {
      return 'electronic_service';
    } else if (textLower.includes('office')) {
      return 'office_service';
    } else if (textLower.includes('residence') || textLower.includes('dwelling')) {
      return 'residential_service';
    } else if (textLower.includes('posting') || textLower.includes('conspicuous')) {
      return 'alternative_service';
    } else {
      return 'general_service';
    }
  }

  /**
   * Extract service target from text (ENHANCED)
   */
  extractServiceTargetEnhanced(text) {
    const textLower = text.toLowerCase();
    if (textLower.includes('attorney') || textLower.includes('counsel')) {
      return 'attorney';
    } else if (textLower.includes('party')) {
      return 'party';
    } else if (textLower.includes('person in charge') || textLower.includes('receptionist')) {
      return 'authorized_person';
    } else if (textLower.includes('court')) {
      return 'court';
    } else {
      return 'general';
    }
  }

  /**
   * Determine service priority (ENHANCED)
   */
  determineServicePriorityEnhanced(text, patternIndex) {
    const textLower = text.toLowerCase();
    if (textLower.includes('shall') || textLower.includes('must')) {
      return 1; // Mandatory/high priority
    } else if (textLower.includes('may')) {
      return 2; // Permissive/medium priority
    } else {
      return patternIndex + 1; // Based on pattern order
    }
  }

  /**
   * LEGACY Helper methods (for backward compatibility)
   */
  extractAppliesTo(text) {
    return this.extractTimingAppliesTo(text);
  }

  extractExceptions(text) {
    return this.extractTimingExceptions(text);
  }

  extractServiceMethod(text) {
    return this.extractServiceMethodEnhanced(text, 0);
  }

  extractServiceTarget(text) {
    return this.extractServiceTargetEnhanced(text);
  }

  determineServicePriority(text) {
    return this.determineServicePriorityEnhanced(text, 0);
  }
}

module.exports = ContentAnalyzer; 