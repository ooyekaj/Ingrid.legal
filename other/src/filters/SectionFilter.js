const ScraperConfig = require('../config/ScraperConfig');
const CriticalSections = require('./CriticalSections');
const Logger = require('../utils/Logger');

class SectionFilter {
  static filterFilingRelatedSections(allSectionLinks) {
    const filingRelatedSections = [];
    
    for (const section of allSectionLinks) {
      if (this.isFilingRelatedSection(section)) {
        filingRelatedSections.push(section);
      }
    }
    
    // Add critical sections that are often missing from TOC
    const criticalSubsections = CriticalSections.getAdditionalCriticalSubsections();
    
    // Check if these critical sections are already included
    for (const critical of criticalSubsections) {
      const exists = filingRelatedSections.some(section => section.ruleNumber === critical.ruleNumber);
      if (!exists) {
        Logger.info(`Adding critical missing section: ${critical.ruleNumber}`);
        filingRelatedSections.push(critical);
      }
    }
    
    return filingRelatedSections;
  }

  static isFilingRelatedSection(section) {
    // Handle malformed input
    if (!section || !section.ruleNumber) {
      return false;
    }
    
    // Handle lettered subsections (like 437c) by extracting the numeric part
    const ruleNumber = section.ruleNumber;
    const numericPart = parseFloat(ruleNumber.replace(/[a-z]/g, ''));
    
    // EXCLUSION CRITERIA - Remove sections that don't answer the 6 filing questions
    const exclusionRanges = ScraperConfig.EXCLUSION_RANGES;
    
    // Check if section should be excluded
    const shouldExclude = exclusionRanges.some(exclusion => 
      numericPart >= exclusion.range[0] && numericPart <= exclusion.range[1]
    );
    
    if (shouldExclude) {
      Logger.debug(`Section ${section.ruleNumber} excluded - not about document filing procedures`);
      return false;
    }
    
    // INCLUSION CRITERIA - Keep only sections that answer the 6 filing questions
    const documentFilingSections = this.getDocumentFilingSections();
    
    // Check if section answers any of the 6 filing questions
    const answersFilingQuestions = documentFilingSections.some(sectionRange => 
      numericPart >= sectionRange.range[0] && numericPart <= sectionRange.range[1]
    );
    
    if (answersFilingQuestions) {
      const matchingCategory = documentFilingSections.find(sectionRange => 
        numericPart >= sectionRange.range[0] && numericPart <= sectionRange.range[1]
      );
      Logger.success(`Section ${section.ruleNumber} answers filing question: ${matchingCategory.question} - ${matchingCategory.category}`);
      return true;
    }
    
    // Apply enhanced keyword-based filtering focused on the 6 questions
    return this.applyKeywordFiltering(section);
  }

  static getDocumentFilingSections() {
    return [
      // WHEN must documents be filed? (Deadlines/Timing)
      { range: [12, 12], category: 'Time Computation Rules - WHEN to file', question: 'WHEN' },
      { range: [12, 12.5], category: 'Calendar and Court Days - WHEN to file', question: 'WHEN' },
      { range: [1005, 1005], category: 'Motion Filing Deadlines - WHEN to file', question: 'WHEN' },
      { range: [1012, 1013], category: 'Service Timing Extensions - WHEN to file', question: 'WHEN' },
      { range: [430.30, 430.30], category: 'Demurrer Filing Deadlines - WHEN to file', question: 'WHEN' },
      { range: [2024.020, 2024.020], category: 'Discovery Cutoff Deadlines - WHEN to file', question: 'WHEN' },
      { range: [2025.480, 2025.480], category: 'Deposition Motion Deadlines - WHEN to file', question: 'WHEN' },
      { range: [2030.300, 2030.300], category: 'Interrogatory Motion Deadlines - WHEN to file', question: 'WHEN' },
      { range: [2031.310, 2031.310], category: 'Document Production Deadlines - WHEN to file', question: 'WHEN' },
      
      // HOW must documents be filed? (Format/Procedure)
      { range: [430.10, 430.41], category: 'Demurrer Procedures - HOW to file', question: 'HOW' },
      { range: [425.10, 425.13], category: 'Complaint Format - HOW to file', question: 'HOW' },
      { range: [431.30, 431.40], category: 'Answer Format - HOW to file', question: 'HOW' },
      { range: [435, 437], category: 'Motion to Strike Procedures - HOW to file', question: 'HOW' },
      { range: [437, 438], category: 'Summary Judgment Procedures - HOW to file', question: 'HOW' },
      { range: [1010, 1014], category: 'Service Procedures - HOW to serve/file', question: 'HOW' },
      { range: [1010.6, 1010.6], category: 'Electronic Filing Procedures - HOW to file', question: 'HOW' },
      { range: [472, 472], category: 'Amendment Procedures - HOW to amend', question: 'HOW' },
      { range: [1003, 1003], category: 'Ex Parte Application Procedures - HOW to file', question: 'HOW' },
      
      // WHERE must documents be filed? (Venue/Jurisdiction)
      { range: [392, 401], category: 'Venue Requirements - WHERE to file', question: 'WHERE' },
      { range: [410.10, 418.11], category: 'Jurisdiction for Filing - WHERE to file', question: 'WHERE' },
      { range: [411.10, 411.35], category: 'Proper Court for Filing - WHERE to file', question: 'WHERE' },
      
      // WHAT must be part of certain document filings? (Required components)
      { range: [425.10, 425.13], category: 'Complaint Required Contents - WHAT to include', question: 'WHAT' },
      { range: [426.10, 426.50], category: 'Cross-Complaint Requirements - WHAT to include', question: 'WHAT' },
      { range: [430.20, 430.20], category: 'Demurrer Required Contents - WHAT to include', question: 'WHAT' },
      { range: [437, 438], category: 'Summary Judgment Required Docs - WHAT to include', question: 'WHAT' },
      { range: [1014, 1014], category: 'Proof of Service Requirements - WHAT to include', question: 'WHAT' },
      { range: [2025.010, 2025.020], category: 'Deposition Notice Requirements - WHAT to include', question: 'WHAT' },
      { range: [2030.010, 2030.030], category: 'Interrogatory Requirements - WHAT to include', question: 'WHAT' },
      { range: [2031.010, 2031.030], category: 'Document Request Requirements - WHAT to include', question: 'WHAT' },
      
      // WHO can file documents? (Capacity/Authority)
      { range: [367, 367], category: 'Capacity to Sue - WHO can file', question: 'WHO' },
      { range: [372, 373], category: 'Attorney Authority - WHO can file', question: 'WHO' },
      { range: [425.12, 425.12], category: 'Verification Authority - WHO can verify', question: 'WHO' },
      
      // WHAT format must documents follow? (Formatting rules)
      { range: [425.11, 425.11], category: 'Caption Format - WHAT format', question: 'FORMAT' },
      { range: [128.7, 128.7], category: 'Document Format Standards - WHAT format', question: 'FORMAT' },
      
      // Additional critical filing procedure sections
      { range: [412.10, 412.30], category: 'Summons Filing - Critical filing document', question: 'HOW/WHAT' },
      { range: [473, 473], category: 'Relief from Filing Errors - Critical procedure', question: 'HOW' },
      { range: [664, 670], category: 'Judgment Filing Requirements - Critical filing', question: 'HOW/WHAT' },
      { range: [1086, 1086], category: 'Writ Filing Procedures - Critical filing', question: 'HOW/WHAT' },
      { range: [1094.5, 1094.6], category: 'Administrative Mandate Filing - Critical filing', question: 'HOW/WHAT' }
    ];
  }

  static applyKeywordFiltering(section) {
    const filingQuestionKeywords = ScraperConfig.FILING_QUESTION_KEYWORDS;
    const strictExclusionTerms = ScraperConfig.EXCLUSION_TERMS;

    const combinedText = (section.title || '').toLowerCase();
    
    // Check for strict exclusion terms
    if (strictExclusionTerms.some(term => combinedText.includes(term.toLowerCase()))) {
      Logger.debug(`Section ${section.ruleNumber} excluded - contains non-filing content`);
      return false;
    }

    // Calculate relevance score based on the 6 filing questions
    let relevanceScore = 0;
    const foundTerms = [];
    const questionsAnswered = [];

    // Check each question category (higher weight for exact matches)
    Object.entries(filingQuestionKeywords).forEach(([question, keywords]) => {
      keywords.forEach(keyword => {
        if (combinedText.includes(keyword.toLowerCase())) {
          relevanceScore += 4; // Higher weight for question-specific terms
          foundTerms.push(keyword);
          if (!questionsAnswered.includes(question)) {
            questionsAnswered.push(question);
          }
        }
      });
    });

    // Require higher threshold and must answer at least one of the 6 questions
    const isRelevant = relevanceScore >= ScraperConfig.FILE_CONSTRAINTS.MIN_RELEVANCE_SCORE && questionsAnswered.length > 0;

    if (isRelevant) {
      Logger.info(`Section ${section.ruleNumber} answers filing questions: ${questionsAnswered.join(', ')} - Score: ${relevanceScore}`);
    }

    return isRelevant;
  }
}

module.exports = SectionFilter; 