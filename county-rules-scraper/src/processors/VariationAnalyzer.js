class VariationAnalyzer {
  constructor() {
    this.comparisonAreas = this.getComparisonAreas();
  }

  /**
   * Main method to analyze variations between counties
   */
  analyzeCountyVariations(allCountyData) {
    const analysis = {
      electronic_filing_differences: this.compareEFilingRules(allCountyData),
      motion_practice_variations: this.compareMotionPractice(allCountyData),
      case_management_differences: this.compareCaseManagement(allCountyData),
      local_form_requirements: this.compareFormRequirements(allCountyData),
      judicial_assignment_rules: this.compareAssignmentRules(allCountyData),
      emergency_procedures: this.compareEmergencyProcedures(allCountyData),
      deadline_variations: this.compareDeadlines(allCountyData),
      service_requirements: this.compareServiceRequirements(allCountyData),
      technology_requirements: this.compareTechnologyRequirements(allCountyData)
    };

    // Generate summary insights
    analysis.summary = this.generateVariationSummary(analysis);
    analysis.practitioner_impact = this.assessPractitionerImpact(analysis);
    analysis.standardization_opportunities = this.identifyStandardizationOpportunities(analysis);

    return analysis;
  }

  /**
   * Get areas for comparison
   */
  getComparisonAreas() {
    return {
      electronic_filing: {
        keywords: ['electronic filing', 'e-filing', 'efiling', 'online filing'],
        aspects: ['mandatory', 'optional', 'format requirements', 'size limits', 'technical requirements']
      },
      motion_practice: {
        keywords: ['motion', 'hearing', 'law and motion', 'calendar'],
        aspects: ['scheduling', 'notice requirements', 'tentative rulings', 'opposition deadlines']
      },
      case_management: {
        keywords: ['case management', 'scheduling', 'conference', 'status review'],
        aspects: ['mandatory conferences', 'scheduling procedures', 'statement requirements']
      },
      service_requirements: {
        keywords: ['service', 'proof of service', 'electronic service'],
        aspects: ['acceptable methods', 'deadlines', 'proof requirements']
      },
      deadlines: {
        keywords: ['deadline', 'time limit', 'days', 'within'],
        aspects: ['filing deadlines', 'service deadlines', 'response times']
      }
    };
  }

  /**
   * Compare electronic filing rules across counties
   */
  compareEFilingRules(allCountyData) {
    const variations = {};
    const summary = {
      mandatory_counties: [],
      optional_counties: [],
      no_info_counties: [],
      common_requirements: new Set(),
      unique_requirements: {}
    };

    for (const [county, data] of Object.entries(allCountyData)) {
      const efilingInfo = this.extractEFilingInfo(data);
      variations[county] = efilingInfo;

      // Categorize counties
      if (efilingInfo.mandatory) {
        summary.mandatory_counties.push(county);
      } else if (efilingInfo.available) {
        summary.optional_counties.push(county);
      } else {
        summary.no_info_counties.push(county);
      }

      // Collect requirements
      efilingInfo.requirements.forEach(req => summary.common_requirements.add(req));
      
      if (efilingInfo.unique_features.length > 0) {
        summary.unique_requirements[county] = efilingInfo.unique_features;
      }
    }

    return {
      by_county: variations,
      summary: {
        ...summary,
        common_requirements: Array.from(summary.common_requirements)
      },
      standardization_score: this.calculateStandardizationScore(variations, 'efiling')
    };
  }

  /**
   * Compare motion practice across counties
   */
  compareMotionPractice(allCountyData) {
    const variations = {};
    const summary = {
      tentative_ruling_counties: [],
      hearing_required_counties: [],
      scheduling_variations: {},
      notice_requirements: {}
    };

    for (const [county, data] of Object.entries(allCountyData)) {
      const motionInfo = this.extractMotionPracticeInfo(data);
      variations[county] = motionInfo;

      // Categorize practices
      if (motionInfo.has_tentative_rulings) {
        summary.tentative_ruling_counties.push(county);
      }
      if (motionInfo.hearing_required) {
        summary.hearing_required_counties.push(county);
      }

      // Collect scheduling variations
      if (motionInfo.scheduling_info) {
        summary.scheduling_variations[county] = motionInfo.scheduling_info;
      }

      // Collect notice requirements
      if (motionInfo.notice_requirements) {
        summary.notice_requirements[county] = motionInfo.notice_requirements;
      }
    }

    return {
      by_county: variations,
      summary: summary,
      standardization_score: this.calculateStandardizationScore(variations, 'motion_practice')
    };
  }

  /**
   * Compare case management procedures
   */
  compareCaseManagement(allCountyData) {
    const variations = {};
    const summary = {
      mandatory_conferences: {},
      scheduling_procedures: {},
      statement_requirements: {},
      timeline_variations: {}
    };

    for (const [county, data] of Object.entries(allCountyData)) {
      const caseManagementInfo = this.extractCaseManagementInfo(data);
      variations[county] = caseManagementInfo;

      // Collect mandatory conferences
      if (caseManagementInfo.mandatory_conferences) {
        summary.mandatory_conferences[county] = caseManagementInfo.mandatory_conferences;
      }

      // Collect scheduling procedures
      if (caseManagementInfo.scheduling_procedures) {
        summary.scheduling_procedures[county] = caseManagementInfo.scheduling_procedures;
      }

      // Collect statement requirements
      if (caseManagementInfo.statement_requirements) {
        summary.statement_requirements[county] = caseManagementInfo.statement_requirements;
      }
    }

    return {
      by_county: variations,
      summary: summary,
      standardization_score: this.calculateStandardizationScore(variations, 'case_management')
    };
  }

  /**
   * Compare form requirements
   */
  compareFormRequirements(allCountyData) {
    const variations = {};
    const summary = {
      mandatory_local_forms: {},
      optional_forms: {},
      format_requirements: {},
      common_forms: new Set()
    };

    for (const [county, data] of Object.entries(allCountyData)) {
      const formInfo = this.extractFormRequirements(data);
      variations[county] = formInfo;

      // Collect form information
      formInfo.mandatory_forms.forEach(form => summary.common_forms.add(form));
      
      if (formInfo.mandatory_forms.length > 0) {
        summary.mandatory_local_forms[county] = formInfo.mandatory_forms;
      }
      
      if (formInfo.format_requirements) {
        summary.format_requirements[county] = formInfo.format_requirements;
      }
    }

    return {
      by_county: variations,
      summary: {
        ...summary,
        common_forms: Array.from(summary.common_forms)
      },
      standardization_score: this.calculateStandardizationScore(variations, 'forms')
    };
  }

  /**
   * Compare judicial assignment rules
   */
  compareAssignmentRules(allCountyData) {
    const variations = {};
    
    for (const [county, data] of Object.entries(allCountyData)) {
      variations[county] = this.extractAssignmentRules(data);
    }

    return {
      by_county: variations,
      standardization_score: this.calculateStandardizationScore(variations, 'assignment')
    };
  }

  /**
   * Compare emergency procedures
   */
  compareEmergencyProcedures(allCountyData) {
    const variations = {};
    const summary = {
      ex_parte_procedures: {},
      emergency_contacts: {},
      after_hours_procedures: {},
      shortened_time_requirements: {}
    };

    for (const [county, data] of Object.entries(allCountyData)) {
      const emergencyInfo = this.extractEmergencyProcedures(data);
      variations[county] = emergencyInfo;

      if (emergencyInfo.ex_parte_procedures) {
        summary.ex_parte_procedures[county] = emergencyInfo.ex_parte_procedures;
      }
      
      if (emergencyInfo.emergency_contacts) {
        summary.emergency_contacts[county] = emergencyInfo.emergency_contacts;
      }
    }

    return {
      by_county: variations,
      summary: summary,
      standardization_score: this.calculateStandardizationScore(variations, 'emergency')
    };
  }

  /**
   * Compare deadline requirements
   */
  compareDeadlines(allCountyData) {
    const variations = {};
    const deadlineTypes = {};

    for (const [county, data] of Object.entities(allCountyData)) {
      const deadlineInfo = this.extractDeadlineInfo(data);
      variations[county] = deadlineInfo;

      // Categorize deadlines by type
      for (const [type, deadline] of Object.entries(deadlineInfo)) {
        if (!deadlineTypes[type]) deadlineTypes[type] = {};
        deadlineTypes[type][county] = deadline;
      }
    }

    return {
      by_county: variations,
      by_deadline_type: deadlineTypes,
      standardization_score: this.calculateStandardizationScore(variations, 'deadlines')
    };
  }

  /**
   * Compare service requirements
   */
  compareServiceRequirements(allCountyData) {
    const variations = {};
    
    for (const [county, data] of Object.entries(allCountyData)) {
      variations[county] = this.extractServiceRequirements(data);
    }

    return {
      by_county: variations,
      standardization_score: this.calculateStandardizationScore(variations, 'service')
    };
  }

  /**
   * Compare technology requirements
   */
  compareTechnologyRequirements(allCountyData) {
    const variations = {};
    
    for (const [county, data] of Object.entries(allCountyData)) {
      variations[county] = this.extractTechnologyRequirements(data);
    }

    return {
      by_county: variations,
      standardization_score: this.calculateStandardizationScore(variations, 'technology')
    };
  }

  // Extraction methods for specific information types

  extractEFilingInfo(countyData) {
    const documents = countyData.documents || [];
    const efilingInfo = {
      mandatory: false,
      available: false,
      requirements: [],
      unique_features: [],
      technical_requirements: []
    };

    for (const doc of documents) {
      const content = (doc.content || '').toLowerCase();
      
      if (content.includes('electronic filing') || content.includes('e-filing')) {
        efilingInfo.available = true;
        
        if (content.includes('mandatory') || content.includes('required')) {
          efilingInfo.mandatory = true;
        }
        
        // Extract requirements
        const requirements = this.extractRequirementsFromContent(content, 'filing');
        efilingInfo.requirements.push(...requirements);
      }
    }

    return efilingInfo;
  }

  extractMotionPracticeInfo(countyData) {
    const documents = countyData.documents || [];
    const motionInfo = {
      has_tentative_rulings: false,
      hearing_required: false,
      scheduling_info: null,
      notice_requirements: null
    };

    for (const doc of documents) {
      const content = (doc.content || '').toLowerCase();
      
      if (content.includes('motion') || content.includes('hearing')) {
        if (content.includes('tentative')) {
          motionInfo.has_tentative_rulings = true;
        }
        
        if (content.includes('hearing required') || content.includes('appearance required')) {
          motionInfo.hearing_required = true;
        }
        
        // Extract scheduling information
        const schedulingMatch = content.match(/motion.*schedule.*?([^.]{50,150})/i);
        if (schedulingMatch) {
          motionInfo.scheduling_info = schedulingMatch[1].trim();
        }
      }
    }

    return motionInfo;
  }

  extractCaseManagementInfo(countyData) {
    const documents = countyData.documents || [];
    const caseManagementInfo = {
      mandatory_conferences: [],
      scheduling_procedures: null,
      statement_requirements: []
    };

    for (const doc of documents) {
      const content = (doc.content || '').toLowerCase();
      
      if (content.includes('case management')) {
        // Extract mandatory conferences
        const conferenceMatches = content.match(/mandatory.*conference/gi) || [];
        caseManagementInfo.mandatory_conferences.push(...conferenceMatches);
        
        // Extract statement requirements
        const statementMatches = content.match(/statement.*required/gi) || [];
        caseManagementInfo.statement_requirements.push(...statementMatches);
      }
    }

    return caseManagementInfo;
  }

  extractFormRequirements(countyData) {
    const documents = countyData.documents || [];
    const formInfo = {
      mandatory_forms: [],
      optional_forms: [],
      format_requirements: null
    };

    for (const doc of documents) {
      if (doc.classification?.document_type === 'FORM') {
        if (doc.content.toLowerCase().includes('mandatory') || 
            doc.content.toLowerCase().includes('required')) {
          formInfo.mandatory_forms.push(doc.title);
        } else {
          formInfo.optional_forms.push(doc.title);
        }
      }
    }

    return formInfo;
  }

  extractAssignmentRules(countyData) {
    // Implementation for judicial assignment rules extraction
    return {
      assignment_method: 'unknown',
      reassignment_rules: [],
      department_specific_rules: []
    };
  }

  extractEmergencyProcedures(countyData) {
    const documents = countyData.documents || [];
    const emergencyInfo = {
      ex_parte_procedures: null,
      emergency_contacts: [],
      after_hours_procedures: null
    };

    for (const doc of documents) {
      const content = (doc.content || '').toLowerCase();
      
      if (content.includes('emergency') || content.includes('ex parte')) {
        const emergencyMatch = content.match(/emergency.*procedure.*?([^.]{50,200})/i);
        if (emergencyMatch) {
          emergencyInfo.ex_parte_procedures = emergencyMatch[1].trim();
        }
      }
    }

    return emergencyInfo;
  }

  extractDeadlineInfo(countyData) {
    const documents = countyData.documents || [];
    const deadlines = {};

    for (const doc of documents) {
      const content = doc.content || '';
      
      // Extract various deadline types
      const deadlineMatches = content.match(/(\w+)\s+(?:deadline|due)\s+(?:is|of)?\s*(\d+\s+days?)/gi) || [];
      
      for (const match of deadlineMatches) {
        const [full, type, deadline] = match.match(/(\w+)\s+(?:deadline|due)\s+(?:is|of)?\s*(\d+\s+days?)/i);
        deadlines[type.toLowerCase()] = deadline;
      }
    }

    return deadlines;
  }

  extractServiceRequirements(countyData) {
    return {
      electronic_service: 'unknown',
      proof_requirements: [],
      acceptable_methods: []
    };
  }

  extractTechnologyRequirements(countyData) {
    return {
      efiling_system: 'unknown',
      browser_requirements: [],
      file_format_requirements: []
    };
  }

  // Analysis helper methods

  extractRequirementsFromContent(content, type) {
    const patterns = {
      filing: [/must.*file/gi, /required.*format/gi, /mandatory.*submission/gi]
    };
    
    const requirements = [];
    const typePatterns = patterns[type] || [];
    
    for (const pattern of typePatterns) {
      const matches = content.match(pattern) || [];
      requirements.push(...matches);
    }
    
    return requirements.slice(0, 5); // Limit results
  }

  calculateStandardizationScore(variations, area) {
    const counties = Object.keys(variations);
    if (counties.length < 2) return 100;

    // Simple standardization score based on similarity
    let similarityScore = 0;
    let comparisons = 0;

    for (let i = 0; i < counties.length - 1; i++) {
      for (let j = i + 1; j < counties.length; j++) {
        const similarity = this.calculateSimilarity(
          variations[counties[i]], 
          variations[counties[j]], 
          area
        );
        similarityScore += similarity;
        comparisons++;
      }
    }

    return comparisons > 0 ? Math.round(similarityScore / comparisons) : 0;
  }

  calculateSimilarity(county1Data, county2Data, area) {
    // Simplified similarity calculation
    // In practice, this would be more sophisticated
    const keys1 = Object.keys(county1Data);
    const keys2 = Object.keys(county2Data);
    
    const commonKeys = keys1.filter(key => keys2.includes(key));
    const allKeys = new Set([...keys1, ...keys2]);
    
    return (commonKeys.length / allKeys.size) * 100;
  }

  generateVariationSummary(analysis) {
    const summary = {
      most_standardized: [],
      least_standardized: [],
      key_differences: [],
      improvement_opportunities: []
    };

    // Find most and least standardized areas
    const standardizationScores = {};
    for (const [area, data] of Object.entries(analysis)) {
      if (data.standardization_score !== undefined) {
        standardizationScores[area] = data.standardization_score;
      }
    }

    const sortedAreas = Object.entries(standardizationScores)
      .sort((a, b) => b[1] - a[1]);

    summary.most_standardized = sortedAreas.slice(0, 3).map(([area, score]) => ({
      area: area,
      score: score
    }));

    summary.least_standardized = sortedAreas.slice(-3).map(([area, score]) => ({
      area: area,
      score: score
    }));

    return summary;
  }

  assessPractitionerImpact(analysis) {
    return {
      high_impact_differences: this.identifyHighImpactDifferences(analysis),
      practice_considerations: this.generatePracticeConsiderations(analysis),
      multi_county_challenges: this.identifyMultiCountyChallenges(analysis)
    };
  }

  identifyHighImpactDifferences(analysis) {
    const highImpact = [];

    // Electronic filing differences have high impact
    if (analysis.electronic_filing_differences.standardization_score < 70) {
      highImpact.push({
        area: 'Electronic Filing',
        impact: 'HIGH',
        reason: 'Significant variations in e-filing requirements across counties'
      });
    }

    // Motion practice variations
    if (analysis.motion_practice_variations.standardization_score < 60) {
      highImpact.push({
        area: 'Motion Practice',
        impact: 'HIGH',
        reason: 'Inconsistent motion practice procedures require county-specific preparation'
      });
    }

    return highImpact;
  }

  generatePracticeConsiderations(analysis) {
    return [
      'Review county-specific e-filing requirements before filing',
      'Verify motion practice procedures for each county',
      'Confirm case management conference requirements',
      'Check local form requirements',
      'Understand emergency procedure variations'
    ];
  }

  identifyMultiCountyChallenges(analysis) {
    return [
      'Inconsistent electronic filing systems',
      'Varying motion calendar procedures',
      'Different case management requirements',
      'County-specific local forms',
      'Disparate emergency procedures'
    ];
  }

  identifyStandardizationOpportunities(analysis) {
    const opportunities = [];

    for (const [area, data] of Object.entries(analysis)) {
      if (data.standardization_score !== undefined && data.standardization_score < 70) {
        opportunities.push({
          area: area,
          current_score: data.standardization_score,
          potential_impact: this.assessStandardizationImpact(area),
          recommendations: this.getStandardizationRecommendations(area)
        });
      }
    }

    return opportunities.sort((a, b) => a.current_score - b.current_score);
  }

  assessStandardizationImpact(area) {
    const impactMap = {
      'electronic_filing_differences': 'HIGH',
      'motion_practice_variations': 'HIGH',
      'case_management_differences': 'MEDIUM',
      'emergency_procedures': 'MEDIUM',
      'service_requirements': 'LOW'
    };

    return impactMap[area] || 'LOW';
  }

  getStandardizationRecommendations(area) {
    const recommendationMap = {
      'electronic_filing_differences': [
        'Standardize e-filing format requirements',
        'Implement consistent file size limits',
        'Unify technical requirements across counties'
      ],
      'motion_practice_variations': [
        'Standardize notice requirements',
        'Implement consistent tentative ruling procedures',
        'Unify hearing scheduling processes'
      ],
      'case_management_differences': [
        'Standardize case management conference requirements',
        'Implement consistent scheduling procedures',
        'Unify statement requirements'
      ]
    };

    return recommendationMap[area] || ['Analyze specific variations', 'Develop standardization plan'];
  }
}

module.exports = VariationAnalyzer; 