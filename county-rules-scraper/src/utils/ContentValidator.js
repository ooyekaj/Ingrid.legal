class ContentValidator {
  constructor() {
    this.minimumContentLength = 100;
    this.maximumContentLength = 1000000; // 1MB of text
    this.requiredLegalIndicators = [
      'court', 'rule', 'order', 'procedure', 'filing', 'case', 'legal'
    ];
    this.spamIndicators = [
      'click here', 'buy now', 'advertisement', 'sponsored', 'casino', 'viagra'
    ];
  }

  /**
   * Validate scraped content for quality and relevance
   */
  validateContent(content, metadata = {}) {
    const validation = {
      isValid: true,
      score: 0,
      issues: [],
      warnings: [],
      quality_metrics: {}
    };

    // Basic content checks
    this.validateBasicContent(content, validation);
    
    // Legal relevance checks
    this.validateLegalRelevance(content, validation);
    
    // Content quality checks
    this.validateContentQuality(content, validation);
    
    // Metadata validation
    this.validateMetadata(metadata, validation);
    
    // Calculate final score
    validation.score = this.calculateValidationScore(validation);
    validation.isValid = validation.score >= 60 && validation.issues.length === 0;

    return validation;
  }

  /**
   * Validate basic content requirements
   */
  validateBasicContent(content, validation) {
    if (!content || typeof content !== 'string') {
      validation.issues.push('Content is empty or not a string');
      return;
    }

    const contentLength = content.length;
    validation.quality_metrics.content_length = contentLength;

    // Check minimum length
    if (contentLength < this.minimumContentLength) {
      validation.issues.push(`Content too short (${contentLength} chars, minimum ${this.minimumContentLength})`);
    }

    // Check maximum length
    if (contentLength > this.maximumContentLength) {
      validation.warnings.push(`Content very long (${contentLength} chars, maximum recommended ${this.maximumContentLength})`);
    }

    // Check for basic text structure
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    validation.quality_metrics.sentence_count = sentences.length;

    if (sentences.length < 3) {
      validation.warnings.push('Content has very few sentences, may not be substantial');
    }

    // Check for repeated content
    const duplicateRatio = this.calculateDuplicateRatio(content);
    validation.quality_metrics.duplicate_ratio = duplicateRatio;

    if (duplicateRatio > 0.5) {
      validation.issues.push('Content contains excessive repetition');
    }
  }

  /**
   * Validate legal relevance of content
   */
  validateLegalRelevance(content, validation) {
    const lowerContent = content.toLowerCase();
    let legalIndicatorCount = 0;
    let spamIndicatorCount = 0;

    // Check for legal indicators
    for (const indicator of this.requiredLegalIndicators) {
      if (lowerContent.includes(indicator)) {
        legalIndicatorCount++;
      }
    }

    validation.quality_metrics.legal_indicator_count = legalIndicatorCount;

    if (legalIndicatorCount === 0) {
      validation.issues.push('Content contains no legal indicators');
    } else if (legalIndicatorCount < 2) {
      validation.warnings.push('Content has few legal indicators, relevance uncertain');
    }

    // Check for spam indicators
    for (const spamIndicator of this.spamIndicators) {
      if (lowerContent.includes(spamIndicator)) {
        spamIndicatorCount++;
      }
    }

    validation.quality_metrics.spam_indicator_count = spamIndicatorCount;

    if (spamIndicatorCount > 0) {
      validation.issues.push(`Content contains ${spamIndicatorCount} spam indicators`);
    }

    // Check for filing-specific content
    const filingKeywords = [
      'filing', 'deadline', 'service', 'motion', 'pleading',
      'case management', 'electronic filing', 'proof of service'
    ];

    let filingKeywordCount = 0;
    for (const keyword of filingKeywords) {
      if (lowerContent.includes(keyword)) {
        filingKeywordCount++;
      }
    }

    validation.quality_metrics.filing_keyword_count = filingKeywordCount;

    if (filingKeywordCount >= 3) {
      validation.score += 20; // Bonus for filing relevance
    }
  }

  /**
   * Validate content quality metrics
   */
  validateContentQuality(content, validation) {
    // Check language quality
    const languageScore = this.assessLanguageQuality(content);
    validation.quality_metrics.language_score = languageScore;

    if (languageScore < 50) {
      validation.warnings.push('Content may have language quality issues');
    }

    // Check for proper formatting
    const formattingScore = this.assessFormatting(content);
    validation.quality_metrics.formatting_score = formattingScore;

    if (formattingScore < 40) {
      validation.warnings.push('Content appears poorly formatted');
    }

    // Check for complete sentences
    const completenessScore = this.assessCompleteness(content);
    validation.quality_metrics.completeness_score = completenessScore;

    if (completenessScore < 60) {
      validation.warnings.push('Content may be incomplete or fragmented');
    }

    // Check for HTML artifacts
    const htmlArtifacts = this.detectHTMLArtifacts(content);
    validation.quality_metrics.html_artifacts = htmlArtifacts;

    if (htmlArtifacts > 10) {
      validation.warnings.push('Content contains HTML artifacts that may affect readability');
    }
  }

  /**
   * Validate metadata quality
   */
  validateMetadata(metadata, validation) {
    if (!metadata || typeof metadata !== 'object') {
      validation.warnings.push('No metadata provided');
      return;
    }

    // Check for basic metadata fields
    const requiredFields = ['title', 'url'];
    const missingFields = requiredFields.filter(field => !metadata[field]);

    if (missingFields.length > 0) {
      validation.warnings.push(`Missing metadata fields: ${missingFields.join(', ')}`);
    }

    // Validate URL format
    if (metadata.url && !this.isValidURL(metadata.url)) {
      validation.issues.push('Invalid URL format in metadata');
    }

    // Check title quality
    if (metadata.title) {
      if (metadata.title.length < 10) {
        validation.warnings.push('Title is very short');
      }
      if (metadata.title.length > 200) {
        validation.warnings.push('Title is very long');
      }
    }
  }

  /**
   * Calculate duplicate content ratio
   */
  calculateDuplicateRatio(content) {
    const lines = content.split('\n').filter(line => line.trim().length > 0);
    if (lines.length < 2) return 0;

    const lineCount = {};
    let duplicateLines = 0;

    for (const line of lines) {
      const normalizedLine = line.trim().toLowerCase();
      lineCount[normalizedLine] = (lineCount[normalizedLine] || 0) + 1;
    }

    for (const count of Object.values(lineCount)) {
      if (count > 1) {
        duplicateLines += count - 1;
      }
    }

    return duplicateLines / lines.length;
  }

  /**
   * Assess language quality
   */
  assessLanguageQuality(content) {
    let score = 100;

    // Check for excessive uppercase
    const uppercaseRatio = (content.match(/[A-Z]/g) || []).length / content.length;
    if (uppercaseRatio > 0.3) score -= 20;

    // Check for proper sentence structure
    const sentences = content.split(/[.!?]+/);
    const avgSentenceLength = content.length / sentences.length;
    
    if (avgSentenceLength < 10) score -= 10; // Too short
    if (avgSentenceLength > 200) score -= 10; // Too long

    // Check for common grammar indicators
    const grammarIndicators = ['.', ',', ';', ':', '?', '!'];
    let grammarCount = 0;
    for (const indicator of grammarIndicators) {
      grammarCount += (content.match(new RegExp(`\\${indicator}`, 'g')) || []).length;
    }

    const grammarRatio = grammarCount / content.length * 100;
    if (grammarRatio < 2) score -= 15; // Too few punctuation marks

    return Math.max(0, score);
  }

  /**
   * Assess content formatting
   */
  assessFormatting(content) {
    let score = 100;

    // Check for paragraph structure
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    if (paragraphs.length === 1 && content.length > 1000) {
      score -= 20; // Long content without paragraphs
    }

    // Check for excessive whitespace
    const whitespaceRatio = (content.match(/\s/g) || []).length / content.length;
    if (whitespaceRatio > 0.4) score -= 15;

    // Check for proper capitalization
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    let properlyCapitalized = 0;
    
    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      if (trimmed.length > 0 && /^[A-Z]/.test(trimmed)) {
        properlyCapitalized++;
      }
    }

    const capitalizationRatio = properlyCapitalized / sentences.length;
    if (capitalizationRatio < 0.7) score -= 10;

    return Math.max(0, score);
  }

  /**
   * Assess content completeness
   */
  assessCompleteness(content) {
    let score = 100;

    // Check for incomplete sentences
    const sentences = content.split(/[.!?]+/);
    let incompleteSentences = 0;

    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      if (trimmed.length > 0 && trimmed.length < 10) {
        incompleteSentences++;
      }
    }

    const incompleteRatio = incompleteSentences / sentences.length;
    if (incompleteRatio > 0.3) score -= 25;

    // Check for abrupt endings
    if (!content.trim().match(/[.!?]$/)) {
      score -= 10;
    }

    // Check for proper document structure
    if (content.length > 500 && !content.includes('\n')) {
      score -= 15; // No line breaks in long content
    }

    return Math.max(0, score);
  }

  /**
   * Detect HTML artifacts in content
   */
  detectHTMLArtifacts(content) {
    const htmlPatterns = [
      /<[^>]+>/g,           // HTML tags
      /&\w+;/g,             // HTML entities
      /\[\[.*?\]\]/g,       // Wiki-style links
      /\{\{.*?\}\}/g,       // Template markup
      /javascript:/gi,      // JavaScript URLs
      /onclick=/gi,         // Event handlers
      /style=/gi            // Inline styles
    ];

    let artifactCount = 0;
    for (const pattern of htmlPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        artifactCount += matches.length;
      }
    }

    return artifactCount;
  }

  /**
   * Validate URL format
   */
  isValidURL(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }

  /**
   * Calculate overall validation score
   */
  calculateValidationScore(validation) {
    let score = 50; // Base score

    // Quality metrics bonuses/penalties
    const metrics = validation.quality_metrics;

    // Content length bonus
    if (metrics.content_length >= 500 && metrics.content_length <= 50000) {
      score += 10;
    }

    // Legal relevance bonus
    if (metrics.legal_indicator_count >= 3) {
      score += 15;
    }

    // Filing relevance bonus
    if (metrics.filing_keyword_count >= 2) {
      score += 10;
    }

    // Language quality bonus
    if (metrics.language_score >= 80) {
      score += 10;
    }

    // Penalties for issues
    score -= validation.issues.length * 20;
    score -= validation.warnings.length * 5;

    // Duplicate content penalty
    if (metrics.duplicate_ratio > 0.3) {
      score -= 15;
    }

    // HTML artifacts penalty
    if (metrics.html_artifacts > 5) {
      score -= 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Get validation summary for reporting
   */
  getValidationSummary(validationResults) {
    return {
      total_validated: validationResults.length,
      valid_count: validationResults.filter(v => v.isValid).length,
      invalid_count: validationResults.filter(v => !v.isValid).length,
      average_score: validationResults.reduce((sum, v) => sum + v.score, 0) / validationResults.length,
      common_issues: this.getCommonIssues(validationResults),
      quality_distribution: this.getQualityDistribution(validationResults)
    };
  }

  /**
   * Get most common validation issues
   */
  getCommonIssues(validationResults) {
    const issueCount = {};
    
    for (const result of validationResults) {
      for (const issue of result.issues) {
        issueCount[issue] = (issueCount[issue] || 0) + 1;
      }
    }

    return Object.entries(issueCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([issue, count]) => ({ issue, count }));
  }

  /**
   * Get quality score distribution
   */
  getQualityDistribution(validationResults) {
    const distribution = {
      'excellent': 0,    // 90-100
      'good': 0,         // 75-89
      'fair': 0,         // 60-74
      'poor': 0,         // 40-59
      'very_poor': 0     // 0-39
    };

    for (const result of validationResults) {
      const score = result.score;
      if (score >= 90) distribution.excellent++;
      else if (score >= 75) distribution.good++;
      else if (score >= 60) distribution.fair++;
      else if (score >= 40) distribution.poor++;
      else distribution.very_poor++;
    }

    return distribution;
  }
}

module.exports = ContentValidator; 