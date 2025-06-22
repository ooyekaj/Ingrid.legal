/**
 * Critical Sections Filter for CRC Scraper
 * Identifies and prioritizes critical filing-related CRC rules
 */

const config = require('../config/ScraperConfig');
const Logger = require('../utils/Logger');

class CriticalSections {
  constructor() {
    this.logger = new Logger('CriticalSections');
    this.criticalRuleMap = this.buildCriticalRuleMap();
    this.filingKeywords = this.buildFilingKeywords();
    this.urgencyLevels = this.buildUrgencyLevels();
  }

  /**
   * Build comprehensive critical rule mapping
   */
  buildCriticalRuleMap() {
    const criticalMap = new Map();

    // Ultra-critical rules (highest priority)
    const ultraCritical = [
      '2.108', // Document format requirements - FOUNDATIONAL
      '2.253', // Time computation - CRITICAL for deadlines
      '2.256', // Electronic filing - ESSENTIAL for modern practice
      '3.1350', // Summary judgment - HIGH IMPACT motions
      '3.1110', // Demurrer procedures - COMMON motion
      '3.1113', // Memorandum requirements - UNIVERSAL application
      '8.25', // Notice of appeal - APPELLATE deadlines critical
      '8.200' // Appellate brief requirements - COMPLEX formatting
    ];

    ultraCritical.forEach(rule => {
      criticalMap.set(rule, {
        priority: 1,
        urgency: 'ultra_critical',
        impact: 'high',
        frequency: 'very_high',
        complexity: 'high'
      });
    });

    // High-critical rules
    const highCritical = [
      '2.100', '2.101', '2.102', '2.103', '2.104', // Core filing procedures
      '2.260', '2.261', '2.262', // Service procedures
      '3.1300', '3.1302', '3.1304', // General motion requirements
      '3.1200', '3.1202', '3.1204', // Ex parte applications
      '8.30', '8.32', '8.34', // Appeal timing
      '8.204', '8.208', '8.212' // Appellate brief specifics
    ];

    highCritical.forEach(rule => {
      criticalMap.set(rule, {
        priority: 2,
        urgency: 'high_critical',
        impact: 'high',
        frequency: 'high',
        complexity: 'medium'
      });
    });

    // Medium-critical rules
    const mediumCritical = [
      '2.105', '2.106', '2.107', '2.109', '2.110', // Additional filing procedures
      '2.254', '2.255', '2.257', '2.258', '2.259', // Time and e-filing details
      '3.1114', '3.1115', '3.1116', // Motion practice details
      '3.1320', '3.1322', '3.1324', // Demurrer specifics
      '3.1345', '3.1346', '3.1347', '3.1348', '3.1349', // Discovery motions
      '8.40', '8.44', '8.50', '8.54', '8.60', '8.66', '8.70', '8.74' // Appeal procedures
    ];

    mediumCritical.forEach(rule => {
      criticalMap.set(rule, {
        priority: 3,
        urgency: 'medium_critical',
        impact: 'medium',
        frequency: 'medium',
        complexity: 'medium'
      });
    });

    return criticalMap;
  }

  /**
   * Build filing-related keywords with weights
   */
  buildFilingKeywords() {
    return {
      // Ultra-high priority keywords
      ultra_high: {
        deadline: 10,
        timing: 10,
        'calendar days': 10,
        'court days': 10,
        service: 9,
        filing: 9,
        format: 9,
        electronic: 8,
        motion: 8,
        brief: 8
      },

      // High priority keywords
      high: {
        procedure: 7,
        document: 7,
        pleading: 7,
        notice: 7,
        hearing: 6,
        opposition: 6,
        reply: 6,
        declaration: 6,
        exhibit: 6,
        attachment: 6
      },

      // Medium priority keywords
      medium: {
        form: 5,
        caption: 5,
        signature: 5,
        certificate: 5,
        proof: 5,
        venue: 4,
        jurisdiction: 4,
        party: 4,
        attorney: 4,
        court: 4
      },

      // Legal action keywords
      actions: {
        'summary judgment': 10,
        demurrer: 9,
        'ex parte': 8,
        discovery: 7,
        appeal: 9,
        'motion to dismiss': 8,
        'motion to compel': 7,
        'motion for sanctions': 6
      }
    };
  }

  /**
   * Build urgency level definitions
   */
  buildUrgencyLevels() {
    return {
      ultra_critical: {
        description: 'Rules that are foundational to all legal filings',
        impact: 'Affects virtually all court filings',
        consequences: 'Rejection of filings, missed deadlines, sanctions',
        examples: ['Document format', 'Time computation', 'Electronic filing']
      },

      high_critical: {
        description: 'Rules for common, high-impact procedures',
        impact: 'Affects frequent motions and procedures',
        consequences: 'Procedural errors, delayed proceedings',
        examples: ['Motion practice', 'Service requirements', 'Appeal timing']
      },

      medium_critical: {
        description: 'Important but specialized procedures',
        impact: 'Affects specific types of filings',
        consequences: 'Procedural defects in specific contexts',
        examples: ['Discovery motions', 'Specialized appeals', 'Local variations']
      },

      low_critical: {
        description: 'Supplementary or rarely used rules',
        impact: 'Limited to specific circumstances',
        consequences: 'Minor procedural issues',
        examples: ['Administrative rules', 'Specialized courts']
      }
    };
  }

  /**
   * Filter and rank rules by criticality
   */
  filterCriticalRules(rules) {
    try {
      this.logger.info(`Filtering ${rules.length} rules for criticality`);

      const categorizedRules = {
        ultra_critical: [],
        high_critical: [],
        medium_critical: [],
        low_critical: [],
        uncategorized: []
      };

      const analysis = {
        total_processed: 0,
        critical_rules_found: 0,
        filing_relevance_scores: {},
        keyword_matches: {},
        priority_distribution: {}
      };

      rules.forEach(rule => {
        analysis.total_processed++;
        
        const criticalityAssessment = this.assessRuleCriticality(rule);
        const category = criticalityAssessment.urgency || 'uncategorized';
        
        // Add assessment data to rule
        rule.criticality_assessment = criticalityAssessment;
        
        // Categorize rule
        if (categorizedRules[category]) {
          categorizedRules[category].push(rule);
          if (category !== 'uncategorized') {
            analysis.critical_rules_found++;
          }
        } else {
          categorizedRules.uncategorized.push(rule);
        }

        // Track analysis metrics
        analysis.filing_relevance_scores[rule.ruleNumber] = criticalityAssessment.filing_relevance_score;
        analysis.keyword_matches[rule.ruleNumber] = criticalityAssessment.keyword_matches;
        
        const priority = criticalityAssessment.priority || 4;
        analysis.priority_distribution[priority] = (analysis.priority_distribution[priority] || 0) + 1;
      });

      // Sort each category by priority score
      Object.keys(categorizedRules).forEach(category => {
        categorizedRules[category].sort((a, b) => {
          const scoreA = a.criticality_assessment?.overall_score || 0;
          const scoreB = b.criticality_assessment?.overall_score || 0;
          return scoreB - scoreA; // Descending order
        });
      });

      this.logger.info(`Critical rule filtering complete. Found ${analysis.critical_rules_found} critical rules out of ${analysis.total_processed} total`);

      return {
        categorized_rules: categorizedRules,
        analysis
      };

    } catch (error) {
      this.logger.error('Error filtering critical rules:', error);
      throw error;
    }
  }

  /**
   * Assess individual rule criticality
   */
  assessRuleCriticality(rule) {
    const assessment = {
      priority: 4, // Default to lowest priority
      urgency: 'low_critical',
      impact: 'low',
      frequency: 'low',
      complexity: 'low',
      filing_relevance_score: 0,
      keyword_matches: {},
      content_analysis: {},
      overall_score: 0
    };

    // Check if rule is in critical rule map
    if (this.criticalRuleMap.has(rule.ruleNumber)) {
      const criticalData = this.criticalRuleMap.get(rule.ruleNumber);
      Object.assign(assessment, criticalData);
      assessment.filing_relevance_score += 50; // Base score for known critical rules
    }

    // Analyze rule title for filing relevance
    const titleAnalysis = this.analyzeTitle(rule.title || '');
    assessment.keyword_matches.title = titleAnalysis.matches;
    assessment.filing_relevance_score += titleAnalysis.score;

    // Analyze rule content for filing relevance
    if (rule.content) {
      const contentAnalysis = this.analyzeContent(rule.content);
      assessment.keyword_matches.content = contentAnalysis.matches;
      assessment.filing_relevance_score += contentAnalysis.score;
      assessment.content_analysis = contentAnalysis.analysis;
    }

    // Category-based scoring
    const categoryScore = this.getCategoryScore(rule.category);
    assessment.filing_relevance_score += categoryScore;

    // Rule number pattern analysis
    const patternScore = this.analyzeRuleNumberPattern(rule.ruleNumber);
    assessment.filing_relevance_score += patternScore;

    // Adjust priority based on total score
    assessment.priority = this.calculatePriority(assessment.filing_relevance_score);
    assessment.urgency = this.calculateUrgency(assessment.filing_relevance_score);
    assessment.overall_score = assessment.filing_relevance_score;

    return assessment;
  }

  /**
   * Analyze title for filing relevance
   */
  analyzeTitle(title) {
    const analysis = {
      matches: {},
      score: 0
    };

    const titleLower = title.toLowerCase();
    
    // Check against keyword categories
    Object.entries(this.filingKeywords).forEach(([category, keywords]) => {
      Object.entries(keywords).forEach(([keyword, weight]) => {
        if (titleLower.includes(keyword.toLowerCase())) {
          analysis.matches[keyword] = weight;
          analysis.score += weight;
        }
      });
    });

    // Bonus for exact action matches
    Object.entries(this.filingKeywords.actions).forEach(([action, weight]) => {
      if (titleLower.includes(action.toLowerCase())) {
        analysis.matches[action] = weight + 5; // Bonus for actions
        analysis.score += weight + 5;
      }
    });

    return analysis;
  }

  /**
   * Analyze content for filing relevance
   */
  analyzeContent(content) {
    const analysis = {
      matches: {},
      score: 0,
      analysis: {
        mandatory_language_count: 0,
        deadline_mentions: 0,
        procedure_steps: 0,
        form_references: 0
      }
    };

    const contentLower = content.toLowerCase();

    // Keyword analysis (limited scoring to prevent content length bias)
    Object.entries(this.filingKeywords).forEach(([category, keywords]) => {
      Object.entries(keywords).forEach(([keyword, weight]) => {
        const matches = (contentLower.match(new RegExp(keyword.toLowerCase(), 'g')) || []).length;
        if (matches > 0) {
          // Cap the score contribution from content
          const cappedScore = Math.min(matches * weight * 0.1, weight);
          analysis.matches[keyword] = matches;
          analysis.score += cappedScore;
        }
      });
    });

    // Specific pattern analysis
    analysis.analysis.mandatory_language_count = (content.match(/\b(shall|must)\b/gi) || []).length;
    analysis.analysis.deadline_mentions = (content.match(/\b(deadline|within|days|time)\b/gi) || []).length;
    analysis.analysis.procedure_steps = (content.match(/\b(step|procedure|process|method)\b/gi) || []).length;
    analysis.analysis.form_references = (content.match(/\bform\s+[A-Z0-9-]+/gi) || []).length;

    // Bonus scoring for specific patterns
    analysis.score += analysis.analysis.mandatory_language_count * 0.1;
    analysis.score += analysis.analysis.deadline_mentions * 0.2;
    analysis.score += analysis.analysis.procedure_steps * 0.1;
    analysis.score += analysis.analysis.form_references * 0.3;

    return analysis;
  }

  /**
   * Get category-based score
   */
  getCategoryScore(category) {
    const categoryScores = {
      filing_procedures: 20,
      motion_practice: 18,
      document_format: 16,
      time_service: 15,
      electronic_filing: 14,
      ex_parte: 12,
      appeal_filing: 15,
      appellate_briefs: 13,
      discovery_motions: 10,
      general_motions: 8,
      trial_court_general: 5,
      civil_general: 5,
      appellate_general: 5,
      general: 2
    };

    return categoryScores[category] || 0;
  }

  /**
   * Analyze rule number pattern for filing relevance
   */
  analyzeRuleNumberPattern(ruleNumber) {
    const parts = ruleNumber.split('.');
    const titleNumber = parseInt(parts[0]);
    const sectionNumber = parseInt(parts[1] || '0');

    let score = 0;

    // Title-based scoring
    if (titleNumber === 2) {
      // Trial court rules - high filing relevance
      score += 10;
      if (sectionNumber >= 100 && sectionNumber <= 119) score += 10; // Core filing
      if (sectionNumber >= 250 && sectionNumber <= 269) score += 8;  // Time/service
    } else if (titleNumber === 3) {
      // Civil rules - medium-high filing relevance
      score += 8;
      if (sectionNumber >= 1100 && sectionNumber <= 1400) score += 8; // Motion practice
      if (sectionNumber >= 1200 && sectionNumber <= 1299) score += 6; // Ex parte
    } else if (titleNumber === 8) {
      // Appellate rules - medium filing relevance
      score += 6;
      if (sectionNumber >= 25 && sectionNumber <= 99) score += 6;   // Appeal filing
      if (sectionNumber >= 200 && sectionNumber <= 299) score += 5; // Briefs
    }

    return score;
  }

  /**
   * Calculate priority level based on score
   */
  calculatePriority(score) {
    if (score >= 60) return 1; // Ultra critical
    if (score >= 40) return 2; // High critical
    if (score >= 20) return 3; // Medium critical
    return 4; // Low critical
  }

  /**
   * Calculate urgency level based on score
   */
  calculateUrgency(score) {
    if (score >= 60) return 'ultra_critical';
    if (score >= 40) return 'high_critical';
    if (score >= 20) return 'medium_critical';
    return 'low_critical';
  }

  /**
   * Get processing order for rules
   */
  getProcessingOrder(categorizedRules) {
    const processingOrder = [];

    // Add rules in priority order
    ['ultra_critical', 'high_critical', 'medium_critical', 'low_critical', 'uncategorized'].forEach(category => {
      if (categorizedRules[category]) {
        processingOrder.push(...categorizedRules[category]);
      }
    });

    return processingOrder;
  }

  /**
   * Generate criticality report
   */
  generateCriticalityReport(analysisResults) {
    const report = {
      summary: {
        total_rules: analysisResults.analysis.total_processed,
        critical_rules: analysisResults.analysis.critical_rules_found,
        criticality_percentage: (analysisResults.analysis.critical_rules_found / analysisResults.analysis.total_processed * 100).toFixed(2)
      },
      distribution: {},
      top_critical_rules: [],
      urgency_definitions: this.urgencyLevels
    };

    // Distribution by category
    Object.entries(analysisResults.categorized_rules).forEach(([category, rules]) => {
      report.distribution[category] = {
        count: rules.length,
        percentage: (rules.length / analysisResults.analysis.total_rules * 100).toFixed(2)
      };
    });

    // Top 10 most critical rules
    const allRules = Object.values(analysisResults.categorized_rules).flat();
    report.top_critical_rules = allRules
      .sort((a, b) => (b.criticality_assessment?.overall_score || 0) - (a.criticality_assessment?.overall_score || 0))
      .slice(0, 10)
      .map(rule => ({
        ruleNumber: rule.ruleNumber,
        title: rule.title,
        score: rule.criticality_assessment?.overall_score || 0,
        urgency: rule.criticality_assessment?.urgency || 'unknown'
      }));

    return report;
  }
}

module.exports = CriticalSections; 