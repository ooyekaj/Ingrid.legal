/**
 * CRC Content Analyzer
 * Advanced content analysis for California Rules of Court
 * Implements comprehensive 6 filing question analysis
 */

const natural = require('natural');
const compromise = require('compromise');
const config = require('../config/ScraperConfig');
const Logger = require('../utils/Logger');

class ContentAnalyzer {
  constructor() {
    this.logger = new Logger('ContentAnalyzer');
    this.stemmer = natural.PorterStemmer;
    this.tokenizer = new natural.WordTokenizer();
    // Initialize sentiment analyzer with correct parameters
    this.sentiment = new natural.SentimentAnalyzer('English', 
      natural.PorterStemmer, 'afinn');
  }

  /**
   * Comprehensive analysis of CRC rule content
   * @param {string} content - Raw rule content
   * @param {string} ruleNumber - CRC rule number
   * @param {string} title - Rule title
   * @returns {object} Complete analysis results
   */
  async analyzeContent(content, ruleNumber, title) {
    try {
      this.logger.info(`Analyzing content for rule ${ruleNumber}`);

      const analysisResults = {
        rule_info: this.extractRuleInfo(content, ruleNumber, title),
        rule_hierarchy: this.determineRuleHierarchy(ruleNumber),
        filing_question_analysis: await this.analyzeFilingQuestions(content),
        enhanced_cross_references: this.extractCrossReferences(content),
        relationship_analysis: this.analyzeRelationships(content, ruleNumber),
        court_applicability: this.determineCourtApplicability(content),
        amendment_tracking: this.extractAmendmentInfo(content),
        procedural_analysis: this.analyzeProcedures(content),
        content_metrics: this.calculateContentMetrics(content),
        legal_language_analysis: this.analyzeLegalLanguage(content)
      };

      return analysisResults;
    } catch (error) {
      this.logger.error(`Error analyzing content for rule ${ruleNumber}:`, error);
      throw error;
    }
  }

  /**
   * Extract basic rule information
   */
  extractRuleInfo(content, ruleNumber, title) {
    const effectiveDate = this.extractDate(content, /effective\s+(\w+\s+\d+,\s+\d{4})/gi);
    const lastAmended = this.extractDate(content, /amended\s+(\w+\s+\d+,\s+\d{4})/gi);
    
    return {
      ruleNumber,
      title: title || this.extractTitle(content),
      url: this.generateRuleUrl(ruleNumber),
      effective_date: effectiveDate,
      last_amended: lastAmended,
      rule_status: this.determineRuleStatus(content),
      content_length: content.length,
      word_count: this.tokenizer.tokenize(content).length
    };
  }

  /**
   * Determine rule hierarchy based on rule number
   */
  determineRuleHierarchy(ruleNumber) {
    const parts = ruleNumber.split('.');
    const titleNumber = parts[0];
    
    const titleMap = {
      '1': { name: 'Rules Applicable to All Courts', division: 'General' },
      '2': { name: 'Trial Court Rules', division: 'Trial Court Administration' },
      '3': { name: 'Civil Rules', division: 'Civil Procedures' },
      '4': { name: 'Criminal Rules', division: 'Criminal Procedures' },
      '5': { name: 'Family and Juvenile Rules', division: 'Family Law' },
      '8': { name: 'Appellate Rules', division: 'Appeals' },
      '10': { name: 'Judicial Administration Rules', division: 'Administration' }
    };

    const title = titleMap[titleNumber] || { name: 'Unknown', division: 'Unknown' };

    return {
      title: `Title ${titleNumber}`,
      title_name: title.name,
      division: title.division,
      chapter: this.determineChapter(ruleNumber),
      section_category: this.determineSectionCategory(ruleNumber)
    };
  }

  /**
   * Determine chapter based on rule number
   */
  determineChapter(ruleNumber) {
    const titleNumber = ruleNumber.split('.')[0];
    const ruleSubNumber = parseFloat(ruleNumber);
    
    // Common chapter patterns for CRC rules
    if (titleNumber === '1') {
      if (ruleSubNumber < 1.50) return 'General Rules';
      return 'Other General Provisions';
    } else if (titleNumber === '2') {
      if (ruleSubNumber < 2.200) return 'Filing and Service';
      if (ruleSubNumber < 2.600) return 'Procedures';
      return 'Other Trial Court Rules';
    } else if (titleNumber === '3') {
      if (ruleSubNumber < 3.200) return 'Civil Rules';
      if (ruleSubNumber < 3.800) return 'Family Rules';
      return 'Other Civil Rules';
    } else if (titleNumber === '4') {
      return 'Criminal Rules';
    } else if (titleNumber === '5') {
      if (ruleSubNumber < 5.500) return 'Family and Juvenile Rules';
      return 'Other Special Rules';
    } else if (titleNumber === '8') {
      if (ruleSubNumber < 8.500) return 'Appellate Rules';
      return 'Other Appellate Procedures';
    } else if (titleNumber === '10') {
      return 'Judicial Administration Rules';
    }
    
    return 'Miscellaneous';
  }

  /**
   * Determine section category based on rule number
   */
  determineSectionCategory(ruleNumber) {
    const titleNumber = ruleNumber.split('.')[0];
    const ruleSubNumber = parseFloat(ruleNumber);
    
    // Categorize rules by their function
    if (titleNumber === '2') {
      if (ruleSubNumber >= 2.100 && ruleSubNumber < 2.200) return 'Filing Requirements';
      if (ruleSubNumber >= 2.200 && ruleSubNumber < 2.300) return 'Service of Process';
      if (ruleSubNumber >= 2.500 && ruleSubNumber < 2.600) return 'Discovery';
      return 'General Procedures';
    } else if (titleNumber === '3') {
      if (ruleSubNumber >= 3.1000) return 'Motion Practice';
      if (ruleSubNumber >= 3.500) return 'Alternative Dispute Resolution';
      return 'Civil Procedures';
    } else if (titleNumber === '5') {
      if (ruleSubNumber < 5.100) return 'Family Law Procedures';
      if (ruleSubNumber >= 5.500) return 'Juvenile Rules';
      return 'Family and Juvenile';
    } else if (titleNumber === '8') {
      if (ruleSubNumber < 8.200) return 'Appeal Procedures';
      if (ruleSubNumber >= 8.800) return 'Supreme Court Rules';
      return 'Appellate Practice';
    }
    
    return 'General';
  }

  /**
   * Comprehensive filing question analysis
   */
  async analyzeFilingQuestions(content) {
    const results = {};
    const questions = ['when', 'how', 'what', 'where', 'who', 'format'];

    for (const question of questions) {
      results[`${question}_timing`] = await this.analyzeSpecificQuestion(content, question);
    }

    return results;
  }

  /**
   * Analyze specific filing question
   */
  async analyzeSpecificQuestion(content, questionType) {
    const questionConfig = config.filingQuestions[questionType];
    if (!questionConfig) return { answers_question: false };

    const analysis = {
      answers_question: false,
      confidence_score: 0,
      extracted_content: [],
      patterns_matched: [],
      keywords_found: [],
      specific_requirements: []
    };

    // Check for keywords
    const keywordMatches = this.findKeywords(content, questionConfig.keywords);
    analysis.keywords_found = keywordMatches;

    // Apply patterns
    const patternMatches = this.applyPatterns(content, questionConfig.patterns);
    analysis.patterns_matched = patternMatches;
    analysis.extracted_content = patternMatches.map(match => match.text);

    // Determine if question is answered
    analysis.answers_question = keywordMatches.length > 0 || patternMatches.length > 0;
    analysis.confidence_score = this.calculateConfidenceScore(keywordMatches, patternMatches);

    // Question-specific analysis
    switch (questionType) {
      case 'when':
        analysis.specific_deadlines = this.extractDeadlines(content);
        analysis.timing_references = this.extractTimingReferences(content);
        analysis.extensions_allowed = this.checkExtensionPossibility(content);
        analysis.mandatory = this.checkMandatoryTiming(content);
        break;

      case 'how':
        analysis.procedural_steps = this.extractProceduralSteps(content);
        analysis.mandatory_procedures = this.extractMandatoryProcedures(content);
        analysis.service_methods = this.extractServiceMethods(content);
        break;

      case 'what':
        analysis.required_documents = this.extractRequiredDocuments(content);
        analysis.optional_documents = this.extractOptionalDocuments(content);
        analysis.required_forms = this.extractRequiredForms(content);
        analysis.prohibited_content = this.extractProhibitions(content);
        break;

      case 'where':
        analysis.venue_requirements = this.extractVenueRequirements(content);
        analysis.jurisdiction_rules = this.extractJurisdictionRules(content);
        break;

      case 'who':
        analysis.authorized_filers = this.extractAuthorizedFilers(content);
        analysis.capacity_requirements = this.extractCapacityRequirements(content);
        analysis.representation_rules = this.extractRepresentationRules(content);
        break;

      case 'format':
        analysis.format_specs = this.extractFormatSpecifications(content);
        analysis.font_requirements = this.extractFontRequirements(content);
        analysis.margin_requirements = this.extractMarginRequirements(content);
        analysis.references_format_rules = this.extractFormatRuleReferences(content);
        break;
    }

    return analysis;
  }

  /**
   * Extract cross-references to other legal authorities
   */
  extractCrossReferences(content) {
    const crossRefs = {
      crc_rules: [],
      ccp_sections: [],
      evidence_code: [],
      local_rules: [],
      federal_rules: [],
      other_authorities: []
    };

    // CRC rules
    const crcMatches = content.match(config.legalPatterns.crossReferences.crcRules);
    if (crcMatches) {
      crossRefs.crc_rules = crcMatches.map(match => ({
        rule: match.replace(/.*?(\d+\.\d+(?:\.\d+)?[a-z]?).*/, '$1'),
        relationship_type: this.determineRelationshipType(content, match),
        description: this.extractRelationshipDescription(content, match)
      }));
    }

    // CCP sections
    const ccpMatches = content.match(config.legalPatterns.crossReferences.ccpSections);
    if (ccpMatches) {
      crossRefs.ccp_sections = ccpMatches.map(match => ({
        section: match.replace(/.*?(\d+(?:\.\d+)?[a-z]?).*/, '$1'),
        relationship_type: 'implementing_statute',
        description: this.extractRelationshipDescription(content, match)
      }));
    }

    // Evidence Code
    const evidenceMatches = content.match(config.legalPatterns.crossReferences.evidenceCode);
    if (evidenceMatches) {
      crossRefs.evidence_code = evidenceMatches.map(match => ({
        section: match.replace(/.*?(\d+).*/, '$1'),
        relationship_type: 'evidence_rule',
        description: this.extractRelationshipDescription(content, match)
      }));
    }

    // Local rules
    const localMatches = content.match(config.legalPatterns.crossReferences.localRules);
    if (localMatches) {
      crossRefs.local_rules = localMatches.map(match => ({
        rule: match.replace(/.*?([\w\d.-]+).*/, '$1'),
        relationship_type: 'local_modification',
        description: this.extractRelationshipDescription(content, match)
      }));
    }

    // Federal rules
    const federalMatches = content.match(config.legalPatterns.crossReferences.federalRules);
    if (federalMatches) {
      crossRefs.federal_rules = federalMatches.map(match => ({
        rule: `FRCP ${match.replace(/.*?(\d+).*/, '$1')}`,
        relationship_type: 'analogous_federal_rule',
        description: this.extractRelationshipDescription(content, match)
      }));
    }

    return crossRefs;
  }

  /**
   * Analyze procedural relationships
   */
  analyzeRelationships(content, ruleNumber) {
    return {
      depends_on: this.findDependencies(content),
      enables: this.findEnabledProcedures(content),
      supersedes: this.findSupersededRules(content),
      modified_by_local_rules: this.findLocalModifications(content),
      procedural_category: this.categorizeRule(content, ruleNumber),
      complexity_level: this.assessComplexity(content),
      frequency_of_use: this.estimateUsageFrequency(content, ruleNumber)
    };
  }

  /**
   * Determine court applicability
   */
  determineCourtApplicability(content) {
    const applicability = {
      applies_to: [],
      excludes: [],
      statewide_uniform: true,
      local_variations_allowed: false,
      specialized_courts: {}
    };

    // Check for court type mentions
    const courtTypes = ['superior court', 'appellate court', 'supreme court', 'small claims', 'traffic'];
    courtTypes.forEach(court => {
      if (content.toLowerCase().includes(court)) {
        applicability.applies_to.push(court.replace(' ', '_'));
      }
    });

    // Check for exclusions
    const exclusionPatterns = [/does not apply to/gi, /except in/gi, /excluding/gi];
    exclusionPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        // Extract what's excluded
        const exclusions = this.extractExclusions(content, pattern);
        applicability.excludes.push(...exclusions);
      }
    });

    // Check for specialized courts
    const specializedCourts = ['family law', 'probate', 'criminal', 'juvenile', 'mental health'];
    specializedCourts.forEach(court => {
      applicability.specialized_courts[court.replace(' ', '_')] = 
        content.toLowerCase().includes(court);
    });

    return applicability;
  }

  /**
   * Extract amendment tracking information
   */
  extractAmendmentInfo(content) {
    return {
      current_version: this.extractVersion(content),
      amendment_history: this.extractAmendmentHistory(content),
      pending_amendments: this.extractPendingAmendments(content)
    };
  }

  /**
   * Analyze procedural content
   */
  analyzeProcedures(content) {
    return {
      mandatory_procedures: this.extractMandatoryProcedures(content),
      optional_procedures: this.extractOptionalProcedures(content),
      conditional_procedures: this.extractConditionalProcedures(content),
      sequential_steps: this.extractSequentialSteps(content),
      parallel_requirements: this.extractParallelRequirements(content)
    };
  }

  /**
   * Calculate content metrics
   */
  calculateContentMetrics(content) {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = this.tokenizer.tokenize(content);
    const complexity = this.calculateReadabilityScore(content);

    return {
      character_count: content.length,
      word_count: words.length,
      sentence_count: sentences.length,
      paragraph_count: content.split(/\n\s*\n/).length,
      average_sentence_length: words.length / sentences.length,
      readability_score: complexity,
      legal_term_density: this.calculateLegalTermDensity(content),
      citation_count: this.countCitations(content)
    };
  }

  /**
   * Analyze legal language patterns
   */
  analyzeLegalLanguage(content) {
    const analysis = {
      mandatory_language: [],
      permissive_language: [],
      conditional_language: [],
      temporal_language: [],
      procedural_language: []
    };

    // Apply legal pattern analysis
    const patterns = config.legalPatterns;
    
    // Mandatory vs permissive
    patterns.mandatoryVsPermissive.mandatory.forEach(term => {
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      const matches = content.match(regex);
      if (matches) {
        analysis.mandatory_language.push(...matches);
      }
    });

    patterns.mandatoryVsPermissive.permissive.forEach(term => {
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      const matches = content.match(regex);
      if (matches) {
        analysis.permissive_language.push(...matches);
      }
    });

    // Conditional requirements
    patterns.conditionalRequirements.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        analysis.conditional_language.push(...matches);
      }
    });

    return analysis;
  }

  // Utility methods for pattern matching and extraction

  findKeywords(content, keywords) {
    const found = [];
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = content.match(regex);
      if (matches) {
        found.push(...matches);
      }
    });
    return found;
  }

  applyPatterns(content, patterns) {
    const matches = [];
    patterns.forEach(pattern => {
      const results = content.match(pattern);
      if (results) {
        results.forEach(match => {
          matches.push({
            pattern: pattern.toString(),
            text: match,
            index: content.indexOf(match)
          });
        });
      }
    });
    return matches;
  }

  calculateConfidenceScore(keywordMatches, patternMatches) {
    const keywordWeight = 0.3;
    const patternWeight = 0.7;
    
    const keywordScore = Math.min(keywordMatches.length * 0.2, 1.0);
    const patternScore = Math.min(patternMatches.length * 0.4, 1.0);
    
    return (keywordScore * keywordWeight) + (patternScore * patternWeight);
  }

  // Specific extraction methods for different question types

  extractDeadlines(content) {
    const deadlinePatterns = [
      /within\s+(\d+)\s+(calendar|court|business)\s+days/gi,
      /(\d+)\s+days?\s+(?:before|after|prior\s+to)/gi,
      /no\s+later\s+than\s+([^.]{5,30})/gi
    ];

    const deadlines = [];
    deadlinePatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        deadlines.push(...matches);
      }
    });

    return deadlines;
  }

  extractTimingReferences(content) {
    const timingPatterns = [
      /calendar\s+days?/gi,
      /court\s+days?/gi,
      /business\s+days?/gi,
      /weekdays?/gi,
      /immediately/gi,
      /forthwith/gi,
      /promptly/gi
    ];

    const references = [];
    timingPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        references.push(...matches);
      }
    });

    return [...new Set(references)]; // Remove duplicates
  }

  extractProceduralSteps(content) {
    const stepPatterns = [
      /(?:shall|must)\s+([^.]{10,100})/gi,
      /(?:first|second|third|then|next|finally)\s+([^.]{10,100})/gi,
      /step\s+\d+[:\s]+([^.]{10,100})/gi
    ];

    const steps = [];
    stepPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        steps.push(...matches.map(match => match.trim()));
      }
    });

    return steps;
  }

  extractRequiredDocuments(content) {
    const docPatterns = [
      /(?:shall|must)\s+(?:include|contain|attach)\s+([^.]{10,100})/gi,
      /accompanied\s+by\s+([^.]{10,100})/gi,
      /required\s+(?:document|form|attachment)\s+([^.]{10,100})/gi
    ];

    const documents = [];
    docPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        documents.push(...matches.map(match => match.trim()));
      }
    });

    return documents;
  }

  extractRequiredForms(content) {
    const formPatterns = [
      /judicial\s+council\s+form\s+([A-Z0-9-]+)/gi,
      /form\s+([A-Z0-9-]+)/gi,
      /(?:use|file)\s+form\s+([A-Z0-9-]+)/gi
    ];

    const forms = [];
    formPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        forms.push(...matches.map(match => 
          match.replace(/.*?([A-Z0-9-]+).*/, '$1')));
      }
    });

    return [...new Set(forms)]; // Remove duplicates
  }

  // Additional utility methods...

  generateRuleUrl(ruleNumber) {
    const titleNumber = ruleNumber.split('.')[0];
    const titleMap = {
      '1': 'one', '2': 'two', '3': 'three', '4': 'four', 
      '5': 'five', '8': 'eight', '10': 'ten'
    };
    
    const titleName = titleMap[titleNumber] || titleNumber;
    return `https://courts.ca.gov/cms/rules/index/${titleName}/rule${titleNumber}_${ruleNumber.replace('.', '')}`;
  }

  extractTitle(content) {
    const titlePatterns = [
      /Rule\s+\d+\.\d+(?:\.\d+)?[a-z]?\.\s+([^.\n]+)/i,
      /^([^.\n]{10,100})/m
    ];

    for (const pattern of titlePatterns) {
      const match = content.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return 'Unknown Title';
  }

  extractDate(content, pattern) {
    const match = content.match(pattern);
    return match ? match[1] : null;
  }

  determineRuleStatus(content) {
    if (content.includes('repealed')) return 'repealed';
    if (content.includes('superseded')) return 'superseded';
    if (content.includes('amended')) return 'amended';
    return 'active';
  }

  // Additional methods for comprehensive analysis...
  // (Implementation continues with remaining utility methods)

  calculateReadabilityScore(content) {
    // Simplified Flesch-Kincaid implementation
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = this.tokenizer.tokenize(content);
    const syllables = words.reduce((count, word) => count + this.countSyllables(word), 0);

    if (sentences.length === 0 || words.length === 0) return 0;

    const avgSentenceLength = words.length / sentences.length;
    const avgSyllablesPerWord = syllables / words.length;

    return 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord);
  }

  countSyllables(word) {
    if (!word) return 0;
    word = word.toLowerCase();
    if (word.length <= 3) return 1;
    
    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
    word = word.replace(/^y/, '');
    const matches = word.match(/[aeiouy]{1,2}/g);
    return matches ? matches.length : 1;
  }

  calculateLegalTermDensity(content) {
    const legalTerms = [
      'shall', 'must', 'may', 'court', 'party', 'motion', 'order', 'judgment',
      'pleading', 'service', 'filing', 'jurisdiction', 'venue', 'discovery',
      'evidence', 'hearing', 'trial', 'appeal', 'rule', 'statute', 'code'
    ];

    const words = this.tokenizer.tokenize(content.toLowerCase());
    const legalTermCount = words.filter(word => legalTerms.includes(word)).length;

    return words.length > 0 ? legalTermCount / words.length : 0;
  }

  countCitations(content) {
    const citationPatterns = [
      /\d+\s+Cal\.\s*\d*\s*\d+/g,
      /\d+\s+Cal\.App\.\s*\d*\s*\d+/g,
      /rule\s+\d+\.\d+/gi,
      /section\s+\d+/gi,
      /§\s*\d+/g
    ];

    let count = 0;
    citationPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) count += matches.length;
    });

    return count;
  }
}

module.exports = ContentAnalyzer;