const DocumentTypes = require('../config/DocumentTypes');
const natural = require('natural');
const compromise = require('compromise');

class DocumentClassifier {
  constructor() {
    this.documentTypes = new DocumentTypes();
    this.stemmer = natural.PorterStemmer;
    this.analyzer = natural.SentimentAnalyzer;
    this.tokenizer = new natural.WordTokenizer();
  }

  /**
   * Main classification method
   */
  classifyDocument(url, title, content) {
    const baseClassification = this.documentTypes.classifyDocument(url, title, content);
    
    // Enhance with additional analysis
    const enhancedClassification = {
      ...baseClassification,
      filing_questions: this.mapToFilingQuestions(content),
      effective_scope: this.determineScope(content),
      urgency_level: this.assessUrgency(content),
      complexity_score: this.assessComplexity(content),
      practitioner_impact: this.assessPractitionerImpact(content),
      compliance_requirements: this.extractComplianceRequirements(content),
      cross_references: this.extractCrossReferences(content),
      key_entities: this.extractKeyEntities(content),
      action_items: this.extractActionItems(content)
    };

    return enhancedClassification;
  }

  /**
   * Map content to common filing questions practitioners have
   */
  mapToFilingQuestions(content) {
    const filingQuestions = {
      'When must I file?': this.hasDeadlineInfo(content),
      'How should I serve documents?': this.hasServiceInfo(content),
      'What format is required?': this.hasFormatRequirements(content),
      'Is electronic filing required?': this.hasEFilingInfo(content),
      'What are the local requirements?': this.hasLocalRequirements(content),
      'Are there case management requirements?': this.hasCaseManagementInfo(content),
      'What documents must I file?': this.hasDocumentRequirements(content),
      'Are there fee requirements?': this.hasFeeInfo(content),
      'What are the scheduling requirements?': this.hasSchedulingInfo(content),
      'Are there emergency procedures?': this.hasEmergencyProcedures(content),
      'What are the tentative ruling procedures?': this.hasTentativeRulingInfo(content),
      'What are the motion practice procedures?': this.hasMotionPracticeInfo(content),
      'What are the calendar and scheduling procedures?': this.hasCalendarInfo(content),
      'What are the department assignments?': this.hasDepartmentInfo(content),
      'What are the ex parte procedures?': this.hasExParteInfo(content),
      'What are the discovery procedures?': this.hasDiscoveryInfo(content),
      'What are the ADR requirements?': this.hasADRInfo(content),
      'What are the contact procedures?': this.hasContactInfo(content)
    };

    // Filter to only questions that are addressed
    const relevantQuestions = {};
    for (const [question, isAddressed] of Object.entries(filingQuestions)) {
      if (isAddressed) {
        relevantQuestions[question] = {
          addressed: true,
          confidence: this.calculateQuestionConfidence(content, question)
        };
      }
    }

    return relevantQuestions;
  }

  /**
   * Determine the effective scope of the document
   */
  determineScope(content) {
    const scopeIndicators = {
      'ALL_CASES': [
        'all civil cases', 'all cases', 'every case', 'all proceedings',
        'general application', 'court-wide', 'all departments'
      ],
      'SPECIFIC_CASE_TYPES': [
        'complex litigation', 'personal injury', 'contract disputes',
        'family law', 'probate', 'unlawful detainer', 'civil harassment'
      ],
      'SPECIFIC_DEPARTMENTS': [
        'department', 'courtroom', 'specific judge', 'assigned to'
      ],
      'EMERGENCY_ONLY': [
        'emergency', 'urgent', 'ex parte', 'immediate relief',
        'temporary restraining order', 'preliminary injunction'
      ],
      'TEMPORARY': [
        'temporary', 'during covid', 'pandemic', 'until further notice',
        'expires on', 'effective until'
      ]
    };

    let bestScope = 'ALL_CASES';
    let highestScore = 0;

    const lowerContent = content.toLowerCase();
    
    for (const [scope, indicators] of Object.entries(scopeIndicators)) {
      let score = 0;
      for (const indicator of indicators) {
        if (lowerContent.includes(indicator)) {
          score += 1;
        }
      }
      
      if (score > highestScore) {
        highestScore = score;
        bestScope = scope;
      }
    }

    return {
      scope: bestScope,
      confidence: Math.min(highestScore * 20, 100),
      indicators_found: highestScore
    };
  }

  /**
   * Assess urgency level of the document
   */
  assessUrgency(content) {
    const urgencyKeywords = {
      'CRITICAL': [
        'immediately', 'urgent', 'emergency', 'critical', 'asap',
        'without delay', 'forthwith', 'instant', 'expedited'
      ],
      'HIGH': [
        'priority', 'important', 'significant', 'major', 'substantial',
        'material change', 'new requirement', 'mandatory'
      ],
      'MEDIUM': [
        'should', 'recommended', 'advisable', 'preferred', 'suggested',
        'guideline', 'best practice'
      ],
      'LOW': [
        'optional', 'may', 'could', 'informational', 'reference',
        'background', 'historical'
      ]
    };

    const lowerContent = content.toLowerCase();
    let urgencyScore = { 'CRITICAL': 0, 'HIGH': 0, 'MEDIUM': 0, 'LOW': 0 };

    for (const [level, keywords] of Object.entries(urgencyKeywords)) {
      for (const keyword of keywords) {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        const matches = lowerContent.match(regex);
        if (matches) {
          urgencyScore[level] += matches.length;
        }
      }
    }

    // Determine highest scoring urgency level
    let maxScore = 0;
    let urgencyLevel = 'LOW';
    
    for (const [level, score] of Object.entries(urgencyScore)) {
      if (score > maxScore) {
        maxScore = score;
        urgencyLevel = level;
      }
    }

    return {
      level: urgencyLevel,
      score: maxScore,
      breakdown: urgencyScore
    };
  }

  /**
   * Assess complexity of the document
   */
  assessComplexity(content) {
    let complexityScore = 0;
    
    // Length factor
    const wordCount = content.split(/\s+/).length;
    if (wordCount > 5000) complexityScore += 20;
    else if (wordCount > 2000) complexityScore += 15;
    else if (wordCount > 1000) complexityScore += 10;
    else if (wordCount > 500) complexityScore += 5;

    // Legal terminology density
    const legalTerms = [
      'whereas', 'heretofore', 'pursuant', 'notwithstanding', 'stipulation',
      'affidavit', 'deposition', 'interrogatory', 'subpoena', 'injunction',
      'plaintiff', 'defendant', 'appellate', 'jurisdiction', 'venue'
    ];
    
    const lowerContent = content.toLowerCase();
    let legalTermCount = 0;
    
    for (const term of legalTerms) {
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      const matches = lowerContent.match(regex);
      if (matches) legalTermCount += matches.length;
    }
    
    const legalDensity = (legalTermCount / wordCount) * 1000;
    if (legalDensity > 20) complexityScore += 25;
    else if (legalDensity > 10) complexityScore += 15;
    else if (legalDensity > 5) complexityScore += 10;

    // Number of cross-references
    const references = this.extractCrossReferences(content);
    const totalReferences = Object.values(references).reduce((sum, arr) => sum + arr.length, 0);
    if (totalReferences > 20) complexityScore += 20;
    else if (totalReferences > 10) complexityScore += 15;
    else if (totalReferences > 5) complexityScore += 10;

    // Sentence complexity (average sentence length)
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength = wordCount / sentences.length;
    if (avgSentenceLength > 30) complexityScore += 15;
    else if (avgSentenceLength > 20) complexityScore += 10;
    else if (avgSentenceLength > 15) complexityScore += 5;

    let complexityLevel = 'LOW';
    if (complexityScore >= 60) complexityLevel = 'VERY_HIGH';
    else if (complexityScore >= 40) complexityLevel = 'HIGH';
    else if (complexityScore >= 25) complexityLevel = 'MEDIUM';

    return {
      level: complexityLevel,
      score: Math.min(complexityScore, 100),
      factors: {
        word_count: wordCount,
        legal_density: legalDensity.toFixed(2),
        cross_references: totalReferences,
        avg_sentence_length: avgSentenceLength.toFixed(1)
      }
    };
  }

  /**
   * Assess impact on practitioners
   */
  assessPractitionerImpact(content) {
    const impactFactors = {
      'PROCEDURAL_CHANGE': [
        'new procedure', 'changed procedure', 'modified process',
        'updated requirement', 'revised rule', 'amended'
      ],
      'DEADLINE_CHANGE': [
        'new deadline', 'changed deadline', 'extended deadline',
        'shortened time', 'modified schedule'
      ],
      'FILING_REQUIREMENT': [
        'must file', 'required to file', 'mandatory filing',
        'additional document', 'new form required'
      ],
      'TECHNOLOGY_CHANGE': [
        'electronic filing', 'e-filing', 'online system',
        'new software', 'technical requirement'
      ],
      'FEE_CHANGE': [
        'fee', 'cost', 'payment', 'charge', 'expense'
      ]
    };

    const lowerContent = content.toLowerCase();
    const impactAreas = {};
    let totalImpact = 0;

    for (const [area, indicators] of Object.entries(impactFactors)) {
      let areaScore = 0;
      for (const indicator of indicators) {
        if (lowerContent.includes(indicator)) {
          areaScore += 1;
        }
      }
      
      if (areaScore > 0) {
        impactAreas[area] = areaScore;
        totalImpact += areaScore;
      }
    }

    let impactLevel = 'LOW';
    if (totalImpact >= 10) impactLevel = 'VERY_HIGH';
    else if (totalImpact >= 6) impactLevel = 'HIGH';
    else if (totalImpact >= 3) impactLevel = 'MEDIUM';

    return {
      level: impactLevel,
      score: totalImpact,
      affected_areas: impactAreas,
      requires_attention: totalImpact >= 3
    };
  }

  /**
   * Extract compliance requirements
   */
  extractComplianceRequirements(content) {
    const requirements = [];
    
    // Pattern for "must" requirements
    const mustPattern = /[^.]*must[^.]*\./gi;
    const mustMatches = content.match(mustPattern) || [];
    
    // Pattern for "shall" requirements
    const shallPattern = /[^.]*shall[^.]*\./gi;
    const shallMatches = content.match(shallPattern) || [];
    
    // Pattern for "required" statements
    const requiredPattern = /[^.]*required[^.]*\./gi;
    const requiredMatches = content.match(requiredPattern) || [];

    // Combine and clean up requirements
    const allRequirements = [...mustMatches, ...shallMatches, ...requiredMatches];
    
    for (const req of allRequirements.slice(0, 10)) { // Limit to first 10
      const cleaned = req.trim().replace(/\s+/g, ' ');
      if (cleaned.length > 20 && cleaned.length < 200) {
        requirements.push({
          text: cleaned,
          type: this.categorizeRequirement(cleaned),
          priority: this.assessRequirementPriority(cleaned)
        });
      }
    }

    return requirements;
  }

  /**
   * Extract cross-references to other legal documents
   */
  extractCrossReferences(content) {
    const references = {
      ccp_sections: [],
      crc_rules: [],
      local_rules: [],
      case_citations: [],
      statutes: [],
      other_orders: []
    };

    // California Code of Civil Procedure
    const ccpMatches = content.match(/(?:CCP|Code\s+of\s+Civil\s+Procedure)\s*§?\s*\d+(?:\.\d+)?(?:\([a-z]\))?/gi) || [];
    references.ccp_sections = [...new Set(ccpMatches)];

    // California Rules of Court
    const crcMatches = content.match(/(?:CRC|Cal\.\s*Rules?\s+of\s+Court)\s*\d+(?:\.\d+)?/gi) || [];
    references.crc_rules = [...new Set(crcMatches)];

    // Local Rules
    const localMatches = content.match(/Local\s+Rule\s+\d+(?:\.\d+)?/gi) || [];
    references.local_rules = [...new Set(localMatches)];

    // Case citations
    const caseMatches = content.match(/\b[A-Z][a-z]+\s+v\.\s+[A-Z][a-z]+(?:\s+\(\d{4}\))?/g) || [];
    references.case_citations = [...new Set(caseMatches)];

    // Statutes
    const statuteMatches = content.match(/\b\d+\s+U\.?S\.?C\.?\s*§?\s*\d+/gi) || [];
    references.statutes = [...new Set(statuteMatches)];

    // Other orders/rules
    const orderMatches = content.match(/(?:Order|Rule|General\s+Order)\s+\d+[\w-]*/gi) || [];
    references.other_orders = [...new Set(orderMatches)];

    return references;
  }

  /**
   * Extract key entities (people, places, organizations)
   */
  extractKeyEntities(content) {
    const doc = compromise(content);
    
    const entities = {
      people: [],
      places: [],
      organizations: [],
      judges: [],
      court_departments: []
    };

    // Extract people
    const people = doc.people().out('array');
    entities.people = [...new Set(people)].slice(0, 10);

    // Extract places
    const places = doc.places().out('array');
    entities.places = [...new Set(places)].slice(0, 10);

    // Extract organizations
    const orgs = doc.organizations().out('array');
    entities.organizations = [...new Set(orgs)].slice(0, 10);

    // Extract judges (pattern-based)
    const judgeMatches = content.match(/(?:Judge|Justice|Hon\.)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?/g) || [];
    entities.judges = [...new Set(judgeMatches)].slice(0, 5);

    // Extract court departments
    const deptMatches = content.match(/Department\s+\w+/gi) || [];
    entities.court_departments = [...new Set(deptMatches)].slice(0, 5);

    return entities;
  }

  /**
   * Extract actionable items for practitioners
   */
  extractActionItems(content) {
    const actionItems = [];
    
    // Look for imperative sentences
    const actionPatterns = [
      /[^.]*(?:must|shall|should|need to|required to)[^.]*\./gi,
      /[^.]*(?:file|serve|submit|provide|include)[^.]*\./gi,
      /[^.]*(?:deadline|due|within|before)[^.]*\./gi
    ];

    for (const pattern of actionPatterns) {
      const matches = content.match(pattern) || [];
      for (const match of matches.slice(0, 5)) { // Limit matches per pattern
        const cleaned = match.trim().replace(/\s+/g, ' ');
        if (cleaned.length > 30 && cleaned.length < 150) {
          actionItems.push({
            text: cleaned,
            category: this.categorizeAction(cleaned),
            urgency: this.assessActionUrgency(cleaned)
          });
        }
      }
    }

    return actionItems.slice(0, 10); // Limit total action items
  }

  // Helper methods for specific content analysis

  hasDeadlineInfo(content) {
    return /\b\d+\s*days?\b|\bdeadline\b|\bdue\s+(?:date|by)\b|\bwithin\s+\d+|\bbefore\s+\d+/i.test(content);
  }

  hasServiceInfo(content) {
    return /\bservice\b|\bserve\b|\bproof\s+of\s+service\b|\bmail\b|\bemail\b|\belectronic\s+service\b/i.test(content);
  }

  hasFormatRequirements(content) {
    return /\bformat\b|\bfont\b|\bmargin\b|\bline\s+spacing\b|\bpage\s+limit\b|\bdouble\s+spaced\b/i.test(content);
  }

  hasEFilingInfo(content) {
    return /\belectronic\s+filing\b|\be-filing\b|\befiling\b|\bonline\s+filing\b|\bdigital\b/i.test(content);
  }

  hasLocalRequirements(content) {
    return /\blocal\s+rule\b|\blocal\s+requirement\b|\bthis\s+court\b|\bthis\s+county\b/i.test(content);
  }

  hasCaseManagementInfo(content) {
    return /\bcase\s+management\b|\bscheduling\b|\bconference\b|\bstatus\s+review\b/i.test(content);
  }

  hasDocumentRequirements(content) {
    return /\bmust\s+file\b|\brequired\s+document\b|\bform\s+\w+\b|\battach\b|\binclude\b/i.test(content);
  }

  hasFeeInfo(content) {
    return /\bfee\b|\bcost\b|\bpayment\b|\bcharge\b|\b\$\d+\b/i.test(content);
  }

  hasSchedulingInfo(content) {
    return /\bschedule\b|\bcalendar\b|\bhearing\s+date\b|\btrial\s+date\b|\bappearance\b/i.test(content);
  }

  hasEmergencyProcedures(content) {
    return /\bemergency\b|\bex\s+parte\b|\bimmediate\s+relief\b|\burgent\b|\btemporary\s+restraining\b/i.test(content);
  }

  calculateQuestionConfidence(content, question) {
    // Simple confidence calculation based on keyword density
    const questionWords = question.toLowerCase().split(/\s+/);
    const contentLower = content.toLowerCase();
    
    let matches = 0;
    for (const word of questionWords) {
      if (word.length > 3 && contentLower.includes(word)) {
        matches++;
      }
    }
    
    return Math.min((matches / questionWords.length) * 100, 100);
  }

  categorizeRequirement(requirement) {
    const reqLower = requirement.toLowerCase();
    
    if (reqLower.includes('file') || reqLower.includes('filing')) return 'FILING';
    if (reqLower.includes('serve') || reqLower.includes('service')) return 'SERVICE';
    if (reqLower.includes('deadline') || reqLower.includes('within')) return 'DEADLINE';
    if (reqLower.includes('format') || reqLower.includes('form')) return 'FORMAT';
    if (reqLower.includes('fee') || reqLower.includes('payment')) return 'FEE';
    
    return 'GENERAL';
  }

  assessRequirementPriority(requirement) {
    const reqLower = requirement.toLowerCase();
    
    if (reqLower.includes('must') || reqLower.includes('mandatory')) return 'HIGH';
    if (reqLower.includes('shall') || reqLower.includes('required')) return 'HIGH';
    if (reqLower.includes('should') || reqLower.includes('recommended')) return 'MEDIUM';
    if (reqLower.includes('may') || reqLower.includes('optional')) return 'LOW';
    
    return 'MEDIUM';
  }

  categorizeAction(action) {
    const actionLower = action.toLowerCase();
    
    if (actionLower.includes('file')) return 'FILING';
    if (actionLower.includes('serve')) return 'SERVICE';
    if (actionLower.includes('appear') || actionLower.includes('attend')) return 'APPEARANCE';
    if (actionLower.includes('pay') || actionLower.includes('fee')) return 'PAYMENT';
    if (actionLower.includes('submit') || actionLower.includes('provide')) return 'SUBMISSION';
    
    return 'GENERAL';
  }

  assessActionUrgency(action) {
    const actionLower = action.toLowerCase();
    
    if (actionLower.includes('immediately') || actionLower.includes('urgent')) return 'CRITICAL';
    if (actionLower.includes('must') || actionLower.includes('deadline')) return 'HIGH';
    if (actionLower.includes('should') || actionLower.includes('recommended')) return 'MEDIUM';
    
    return 'LOW';
  }

  hasTentativeRulingInfo(content) {
    return /tentative ruling|tentative decision|tentative order|contest.*tentative|oral argument.*tentative/i.test(content);
  }
  hasMotionPracticeInfo(content) {
    return /motion practice|law and motion|file.*motion|oppose.*motion|reply.*motion|hearing.*motion/i.test(content);
  }
  hasCalendarInfo(content) {
    return /calendar|hearing date|available dates|reserve.*hearing|schedule.*hearing|court calendar/i.test(content);
  }
  hasDepartmentInfo(content) {
    return /department\s+\d+|dept\.\s*\d+|assigned to judge|department assignment|courtroom/i.test(content);
  }
  hasExParteInfo(content) {
    return /ex parte|emergency motion|immediate relief|ex parte application|ex parte hearing/i.test(content);
  }
  hasDiscoveryInfo(content) {
    return /discovery motion|discovery deadline|facilitator program|discovery cutoff|discovery conference/i.test(content);
  }
  hasADRInfo(content) {
    return /alternative dispute|adr program|mediation|settlement conference|neutral evaluation|judicial arbitration/i.test(content);
  }
  hasContactInfo(content) {
    return /contact (the )?court|phone number|email address|department contact|clerk's office|support/i.test(content);
  }

  /**
   * Extract judge-specific information from content
   */
  extractJudgeSpecificInfo(content) {
    return {
      judge_name: this.extractJudgeName(content),
      department: this.extractDepartment(content),
      preferences: this.extractJudgePreferences(content),
      procedures: this.extractJudgeProcedures(content),
      contact_info: this.extractJudgeContact(content),
      standing_orders: this.extractJudgeStandingOrders(content),
      calendar_info: this.extractCalendarInfo(content),
      tentative_rulings: this.extractTentativeRulingInfo(content),
      motion_practice: this.extractMotionPracticeInfo(content),
      ex_parte_procedures: this.extractExParteInfo(content)
    };
  }

  /**
   * Extract judge names from content
   */
  extractJudgeName(content) {
    const judgePatterns = [
      /(?:Judge|Justice|Hon\.?)\s+([A-Z][a-z]+(?:\s+[A-Z]\.?\s*)?[A-Z][a-z]+)/g,
      /Department\s+\d+\s*[-–]\s*([A-Z][a-z]+(?:\s+[A-Z]\.?\s*)?[A-Z][a-z]+)/g,
      /Presiding\s+Judge\s+([A-Z][a-z]+(?:\s+[A-Z]\.?\s*)?[A-Z][a-z]+)/g,
      /Hon\.\s+([A-Z][a-z]+(?:\s+[A-Z]\.?\s*)?[A-Z][a-z]+)/g,
      /Judge\s+([A-Z][a-z]+(?:\s+[A-Z]\.?\s*)?[A-Z][a-z]+)/g,
      /([A-Z][a-z]+\s+[A-Z][a-z]+)\s+presides/gi
    ];

    const judges = [];
    for (const pattern of judgePatterns) {
      const matches = [...content.matchAll(pattern)];
      for (const match of matches) {
        if (match[1] && match[1].length > 3) {
          judges.push(match[1].trim());
        }
      }
    }

    return [...new Set(judges)];
  }

  /**
   * Extract department information
   */
  extractDepartment(content) {
    const deptPatterns = [
      /Department\s+(\d+[A-Z]?)/gi,
      /Dept\.?\s+(\d+[A-Z]?)/gi,
      /Courtroom\s+(\d+[A-Z]?)/gi,
      /Division\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi
    ];

    const departments = [];
    for (const pattern of deptPatterns) {
      const matches = [...content.matchAll(pattern)];
      for (const match of matches) {
        if (match[1] && (/^\d+[A-Z]?$/.test(match[1]) || /^[A-Z][a-z]+/.test(match[1]))) {
          departments.push(match[1].trim());
        }
      }
    }

    return [...new Set(departments)];
  }

  /**
   * Extract judge preferences and requirements
   */
  extractJudgePreferences(content) {
    const preferences = [];
    
    // Look for specific preference indicators
    const preferencePatterns = [
      /Judge\s+\w+\s+(?:requires|prefers|expects)[^.]*\./gi,
      /This\s+court\s+(?:requires|prefers|expects)[^.]*\./gi,
      /Department\s+\d+\s+(?:requires|prefers|expects)[^.]*\./gi,
      /(?:Please note|Important|Note):\s*[^.]*\./gi
    ];

    for (const pattern of preferencePatterns) {
      const matches = content.match(pattern) || [];
      for (const match of matches.slice(0, 5)) {
        preferences.push({
          text: match.trim(),
          type: this.categorizePreference(match)
        });
      }
    }

    return preferences;
  }

  /**
   * Extract judge-specific procedures
   */
  extractJudgeProcedures(content) {
    const procedures = [];
    
    const procedurePatterns = [
      /(?:Motion practice|Law and motion)[^.]*\./gi,
      /(?:Tentative ruling|Tentative decision)[^.]*\./gi,
      /(?:Ex parte|Emergency)[^.]*\./gi,
      /(?:Discovery|Case management)[^.]*\./gi,
      /(?:Settlement conference|ADR)[^.]*\./gi
    ];

    for (const pattern of procedurePatterns) {
      const matches = content.match(pattern) || [];
      for (const match of matches.slice(0, 3)) {
        procedures.push({
          text: match.trim(),
          category: this.categorizeProcedure(match)
        });
      }
    }

    return procedures;
  }

  /**
   * Extract judge contact information
   */
  extractJudgeContact(content) {
    const contact = {};
    
    // Phone numbers
    const phoneMatches = content.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g) || [];
    if (phoneMatches.length > 0) {
      contact.phones = [...new Set(phoneMatches)].slice(0, 3);
    }

    // Email addresses
    const emailMatches = content.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
    if (emailMatches.length > 0) {
      contact.emails = [...new Set(emailMatches)].slice(0, 3);
    }

    // Department-specific contact
    const deptContactMatches = content.match(/Department\s+\d+[^.]*(?:phone|contact|call)[^.]*/gi) || [];
    if (deptContactMatches.length > 0) {
      contact.department_contact = deptContactMatches.slice(0, 2);
    }

    return contact;
  }

  /**
   * Extract judge-specific standing orders
   */
  extractJudgeStandingOrders(content) {
    const orders = [];
    
    const orderPatterns = [
      /Standing Order[^.]*\./gi,
      /General Order[^.]*\./gi,
      /Administrative Order[^.]*\./gi,
      /(?:This court orders|It is ordered)[^.]*\./gi
    ];

    for (const pattern of orderPatterns) {
      const matches = content.match(pattern) || [];
      for (const match of matches.slice(0, 5)) {
        orders.push({
          text: match.trim(),
          type: this.categorizeOrder(match)
        });
      }
    }

    return orders;
  }

  /**
   * Extract calendar and scheduling information
   */
  extractCalendarInfo(content) {
    const calendar = {};
    
    // Hearing days/times
    const scheduleMatches = content.match(/(?:Monday|Tuesday|Wednesday|Thursday|Friday)[^.]*(?:AM|PM|a\.m\.|p\.m\.)[^.]*/gi) || [];
    if (scheduleMatches.length > 0) {
      calendar.hearing_schedule = scheduleMatches.slice(0, 5);
    }

    // Department hours
    const hoursMatches = content.match(/\d{1,2}:\d{2}\s*(?:AM|PM|a\.m\.|p\.m\.)[^.]*/gi) || [];
    if (hoursMatches.length > 0) {
      calendar.hours = [...new Set(hoursMatches)].slice(0, 3);
    }

    // Calendar deadlines
    const deadlineMatches = content.match(/(?:by|before|no later than)\s+\d{1,2}:\d{2}[^.]*/gi) || [];
    if (deadlineMatches.length > 0) {
      calendar.deadlines = deadlineMatches.slice(0, 3);
    }

    return calendar;
  }

  /**
   * Extract tentative ruling information
   */
  extractTentativeRulingInfo(content) {
    const tentative = {};
    
    // Tentative ruling procedures
    const tentativeMatches = content.match(/tentative ruling[^.]*\./gi) || [];
    if (tentativeMatches.length > 0) {
      tentative.procedures = tentativeMatches.slice(0, 3);
    }

    // Contest deadlines
    const contestMatches = content.match(/contest[^.]*(?:by|before)[^.]*/gi) || [];
    if (contestMatches.length > 0) {
      tentative.contest_procedures = contestMatches.slice(0, 2);
    }

    return tentative;
  }

  /**
   * Extract motion practice information
   */
  extractMotionPracticeInfo(content) {
    const motions = {};
    
    // Motion deadlines
    const deadlineMatches = content.match(/motion[^.]*(?:deadline|due|filed)[^.]*/gi) || [];
    if (deadlineMatches.length > 0) {
      motions.deadlines = deadlineMatches.slice(0, 3);
    }

    // Motion requirements
    const requirementMatches = content.match(/motion[^.]*(?:must|shall|required)[^.]*/gi) || [];
    if (requirementMatches.length > 0) {
      motions.requirements = requirementMatches.slice(0, 3);
    }

    return motions;
  }

  /**
   * Extract ex parte information
   */
  extractExParteInfo(content) {
    const exParte = {};
    
    // Ex parte procedures
    const procedureMatches = content.match(/ex parte[^.]*\./gi) || [];
    if (procedureMatches.length > 0) {
      exParte.procedures = procedureMatches.slice(0, 3);
    }

    // Emergency procedures
    const emergencyMatches = content.match(/emergency[^.]*\./gi) || [];
    if (emergencyMatches.length > 0) {
      exParte.emergency_procedures = emergencyMatches.slice(0, 2);
    }

    return exParte;
  }

  // Helper methods for categorization
  categorizePreference(text) {
    const textLower = text.toLowerCase();
    if (textLower.includes('format') || textLower.includes('font')) return 'FORMAT';
    if (textLower.includes('filing') || textLower.includes('deadline')) return 'FILING';
    if (textLower.includes('motion') || textLower.includes('hearing')) return 'MOTION_PRACTICE';
    if (textLower.includes('service')) return 'SERVICE';
    return 'GENERAL';
  }

  categorizeProcedure(text) {
    const textLower = text.toLowerCase();
    if (textLower.includes('motion')) return 'MOTION_PRACTICE';
    if (textLower.includes('tentative')) return 'TENTATIVE_RULING';
    if (textLower.includes('ex parte')) return 'EX_PARTE';
    if (textLower.includes('discovery')) return 'DISCOVERY';
    if (textLower.includes('settlement')) return 'ADR';
    return 'GENERAL';
  }

  categorizeOrder(text) {
    const textLower = text.toLowerCase();
    if (textLower.includes('standing')) return 'STANDING_ORDER';
    if (textLower.includes('general')) return 'GENERAL_ORDER';
    if (textLower.includes('administrative')) return 'ADMINISTRATIVE_ORDER';
    return 'OTHER';
  }
}

module.exports = DocumentClassifier; 