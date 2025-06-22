/**
 * CRC Table of Contents Extractor
 * Extracts rule links and metadata from CRC index pages
 */

const { chromium } = require('playwright');
const cheerio = require('cheerio');
const axios = require('axios');
const config = require('../config/ScraperConfig');
const Logger = require('../utils/Logger');

class TOCExtractor {
  constructor() {
    this.logger = new Logger('TOCExtractor');
    this.extractedRules = new Map();
    this.titleStructure = new Map();
  }

  /**
   * Extract all rule links from CRC title pages
   * @returns {Promise<Array>} Array of rule metadata
   */
  async extractAllRules() {
    try {
      this.logger.info('Starting CRC TOC extraction');
      
      const browser = await chromium.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const allRules = [];
      
      // Extract from each title page
      for (const [titleKey, titleUrl] of Object.entries(config.navigation.titlePages)) {
        try {
          this.logger.info(`Extracting rules from ${titleKey}: ${titleUrl}`);
          const titleRules = await this.extractTitleRules(titleUrl, titleKey, browser);
          allRules.push(...titleRules);
          
          // Rate limiting between title pages
          await this.delay(config.navigation.delays.betweenPages);
        } catch (error) {
          this.logger.error(`Failed to extract rules from ${titleKey}:`, error);
        }
      }

      await browser.close();
      
      // Filter for filing-related rules
      const filingRules = this.filterFilingRules(allRules);
      
      this.logger.info(`TOC extraction complete. Found ${allRules.length} total rules, ${filingRules.length} filing-related rules`);
      
      return filingRules;

    } catch (error) {
      this.logger.error('Error in TOC extraction:', error);
      throw error;
    }
  }

  /**
   * Extract rules from a specific title page
   */
  async extractTitleRules(titleUrl, titleKey, browser) {
    let page = null;
    
    try {
      page = await browser.newPage();
      
      // Navigate to title page
      await page.goto(titleUrl, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });

      // Wait for content to load
      await page.waitForTimeout(config.navigation.delays.pageLoad);

      // Extract page content
      const content = await page.content();
      const $ = cheerio.load(content);
      
      const rules = [];
      
      // Multiple strategies for finding rule links
      const linkSelectors = [
        'a[href*="/rule"]',
        'a[href*="cms/rules"]',
        '.rule-link',
        'a:contains("Rule ")',
        'a[title*="Rule "]'
      ];

      const foundLinks = new Set();
      
      for (const selector of linkSelectors) {
        $(selector).each((index, element) => {
          const link = $(element);
          const href = link.attr('href');
          const text = link.text().trim();
          
          if (href && !foundLinks.has(href)) {
            foundLinks.add(href);
            
            const ruleData = this.parseRuleLink(href, text, titleKey, $);
            if (ruleData) {
              rules.push(ruleData);
            }
          }
        });
      }

      // Also try to extract from structured navigation
      const structuredRules = this.extractStructuredNavigation($, titleKey);
      rules.push(...structuredRules);

      // Extract title structure for hierarchy building
      this.extractTitleStructure($, titleKey);

      return rules;

    } catch (error) {
      this.logger.error(`Error extracting from title page ${titleUrl}:`, error);
      return [];
    } finally {
      if (page) {
        await page.close();
      }
    }
  }

  /**
   * Parse individual rule link and extract metadata
   */
  parseRuleLink(href, text, titleKey, $) {
    try {
      // Extract rule number from href or text
      const ruleNumber = this.extractRuleNumber(href) || this.extractRuleNumber(text);
      if (!ruleNumber) {
        return null;
      }

      // Build full URL if relative
      const fullUrl = href.startsWith('http') ? href : `${config.baseUrl}${href}`;
      
      // Extract title from text or nearby elements
      const title = this.extractRuleTitle(text, $, href);
      
      // Determine rule category
      const category = this.categorizeRule(ruleNumber, title);
      
      return {
        ruleNumber,
        title,
        url: fullUrl,
        titleKey,
        category,
        extracted_at: new Date().toISOString(),
        priority: this.calculateRulePriority(ruleNumber, title)
      };

    } catch (error) {
      this.logger.error(`Error parsing rule link ${href}:`, error);
      return null;
    }
  }

  /**
   * Extract structured navigation (chapters, divisions, etc.)
   */
  extractStructuredNavigation($, titleKey) {
    const rules = [];
    
    // Look for hierarchical structure
    const structureSelectors = [
      '.chapter-rules a',
      '.division-rules a', 
      '.section-rules a',
      'ul.rule-list a',
      '.rule-tree a'
    ];

    structureSelectors.forEach(selector => {
      $(selector).each((index, element) => {
        const link = $(element);
        const href = link.attr('href');
        const text = link.text().trim();
        
        if (href && text) {
          const ruleData = this.parseRuleLink(href, text, titleKey, $);
          if (ruleData) {
            // Add hierarchical context
            const parent = link.closest('[data-chapter], [data-division], [data-section]');
            if (parent.length) {
              ruleData.hierarchy = {
                chapter: parent.attr('data-chapter'),
                division: parent.attr('data-division'),
                section: parent.attr('data-section')
              };
            }
            
            rules.push(ruleData);
          }
        }
      });
    });

    return rules;
  }

  /**
   * Extract title structure for building hierarchy
   */
  extractTitleStructure($, titleKey) {
    const structure = {
      title: titleKey,
      chapters: [],
      divisions: [],
      sections: []
    };

    // Extract chapters
    $('.chapter-heading, h2:contains("Chapter"), h3:contains("Chapter")').each((index, element) => {
      const heading = $(element);
      const text = heading.text().trim();
      const chapterMatch = text.match(/Chapter\s+(\d+)(?:[:\-\s]+(.+))?/i);
      
      if (chapterMatch) {
        structure.chapters.push({
          number: chapterMatch[1],
          name: chapterMatch[2] || '',
          rules: this.extractChapterRules(heading, $)
        });
      }
    });

    // Extract divisions
    $('.division-heading, h2:contains("Division"), h3:contains("Division")').each((index, element) => {
      const heading = $(element);
      const text = heading.text().trim();
      const divisionMatch = text.match(/Division\s+(\d+)(?:[:\-\s]+(.+))?/i);
      
      if (divisionMatch) {
        structure.divisions.push({
          number: divisionMatch[1],
          name: divisionMatch[2] || '',
          rules: this.extractDivisionRules(heading, $)
        });
      }
    });

    this.titleStructure.set(titleKey, structure);
  }

  /**
   * Extract chapter rules
   */
  extractChapterRules(chapterElement, $) {
    const rules = [];
    const nextElements = chapterElement.nextUntil('.chapter-heading, h2:contains("Chapter")');
    
    nextElements.find('a[href*="/rule"]').each((index, element) => {
      const link = $(element);
      const href = link.attr('href');
      const ruleNumber = this.extractRuleNumber(href);
      
      if (ruleNumber) {
        rules.push(ruleNumber);
      }
    });

    return rules;
  }

  /**
   * Extract division rules
   */
  extractDivisionRules(divisionElement, $) {
    const rules = [];
    const nextElements = divisionElement.nextUntil('.division-heading, h2:contains("Division")');
    
    nextElements.find('a[href*="/rule"]').each((index, element) => {
      const link = $(element);
      const href = link.attr('href');
      const ruleNumber = this.extractRuleNumber(href);
      
      if (ruleNumber) {
        rules.push(ruleNumber);
      }
    });

    return rules;
  }

  /**
   * Extract rule number from URL or text
   */
  extractRuleNumber(input) {
    if (!input) return null;
    
    const patterns = config.rulePatterns;
    
    for (const pattern of patterns) {
      const match = input.match(pattern);
      if (match) {
        return match[1] || match[0];
      }
    }

    // Additional specific patterns for CRC
    const crcPatterns = [
      /rule(\d+)_(\d+)(?:_(\d+))?([a-z])?/i,
      /(\d+)\.(\d+)(?:\.(\d+))?([a-z])?/,
      /Rule\s+(\d+\.\d+(?:\.\d+)?[a-z]?)/i
    ];

    for (const pattern of crcPatterns) {
      const match = input.match(pattern);
      if (match) {
        if (match[1] && match[2]) {
          let ruleNumber = `${match[1]}.${match[2]}`;
          if (match[3]) ruleNumber += `.${match[3]}`;
          if (match[4]) ruleNumber += match[4];
          return ruleNumber;
        } else if (match[1]) {
          return match[1];
        }
      }
    }

    return null;
  }

  /**
   * Extract rule title from various sources
   */
  extractRuleTitle(text, $, href) {
    // Try different strategies to get a clean title
    
    // Strategy 1: Clean the link text
    let title = text.replace(/^Rule\s+\d+\.\d+(?:\.\d+)?[a-z]?\.\s*/i, '').trim();
    
    // Strategy 2: Look for title attribute
    if (!title || title.length < 5) {
      const link = $(`a[href="${href}"]`);
      title = link.attr('title') || '';
    }

    // Strategy 3: Look for nearby heading or description
    if (!title || title.length < 5) {
      const link = $(`a[href="${href}"]`);
      const parent = link.parent();
      const siblings = parent.siblings();
      
      // Check for description in next sibling
      const nextText = siblings.first().text().trim();
      if (nextText && nextText.length > 5 && nextText.length < 200) {
        title = nextText;
      }
    }

    // Strategy 4: Extract from URL if it contains descriptive parts
    if (!title || title.length < 5) {
      const urlParts = href.split('/').pop().split('_');
      if (urlParts.length > 2) {
        title = urlParts.slice(2).join(' ').replace(/[-_]/g, ' ');
      }
    }

    return title || 'Unknown Title';
  }

  /**
   * Categorize rule based on number and title
   */
  categorizeRule(ruleNumber, title) {
    const titleNumber = ruleNumber.split('.')[0];
    const secondNumber = parseInt(ruleNumber.split('.')[1] || '0');
    
    // Use critical rules configuration to categorize
    const criticalRules = config.criticalRules;
    
    for (const [titleKey, categories] of Object.entries(criticalRules)) {
      if (titleKey === `title${titleNumber}`) {
        for (const [category, rules] of Object.entries(categories)) {
          if (rules.includes(ruleNumber)) {
            return category;
          }
        }
      }
    }

    // General categorization based on rule ranges
    if (titleNumber === '2') {
      if (secondNumber >= 100 && secondNumber <= 119) return 'filing_procedures';
      if (secondNumber >= 250 && secondNumber <= 269) return 'time_service';
      return 'trial_court_general';
    } else if (titleNumber === '3') {
      if (secondNumber >= 1100 && secondNumber <= 1400) return 'motion_practice';
      if (secondNumber >= 1200 && secondNumber <= 1299) return 'ex_parte';
      return 'civil_general';
    } else if (titleNumber === '8') {
      if (secondNumber >= 25 && secondNumber <= 99) return 'appeal_filing';
      if (secondNumber >= 200 && secondNumber <= 299) return 'appellate_briefs';
      return 'appellate_general';
    }

    return 'general';
  }

  /**
   * Calculate rule priority for processing order
   */
  calculateRulePriority(ruleNumber, title) {
    // Critical rules get highest priority
    const criticalRuleNumbers = Object.values(config.criticalRules)
      .flatMap(title => Object.values(title))
      .flat();
    
    if (criticalRuleNumbers.includes(ruleNumber)) {
      return 1; // Highest priority
    }

    // Filing-related keywords in title increase priority
    const filingKeywords = [
      'filing', 'service', 'motion', 'deadline', 'format', 'procedure',
      'document', 'pleading', 'brief', 'form', 'time', 'notice'
    ];
    
    const titleLower = title.toLowerCase();
    const keywordMatches = filingKeywords.filter(keyword => 
      titleLower.includes(keyword)).length;
    
    if (keywordMatches >= 3) return 2;
    if (keywordMatches >= 1) return 3;
    
    return 4; // Lower priority
  }

  /**
   * Filter rules to focus on filing-related content
   */
  filterFilingRules(allRules) {
    return allRules.filter(rule => {
      // Always include critical rules
      const criticalRuleNumbers = Object.values(config.criticalRules)
        .flatMap(title => Object.values(title))
        .flat();
      
      if (criticalRuleNumbers.includes(rule.ruleNumber)) {
        return true;
      }

      // Filter by category
      const filingCategories = [
        'filing_procedures', 'motion_practice', 'time_service',
        'document_format', 'ex_parte', 'appeal_filing', 'appellate_briefs'
      ];
      
      if (filingCategories.includes(rule.category)) {
        return true;
      }

      // Filter by title keywords
      const filingKeywords = [
        'filing', 'service', 'motion', 'deadline', 'format', 'procedure',
        'document', 'pleading', 'brief', 'form', 'time', 'notice',
        'electronic', 'proof', 'certificate', 'declaration'
      ];
      
      const titleLower = rule.title.toLowerCase();
      const hasFilingKeywords = filingKeywords.some(keyword => 
        titleLower.includes(keyword));
      
      return hasFilingKeywords;
    });
  }

  /**
   * Get extracted title structure
   */
  getTitleStructure() {
    return Object.fromEntries(this.titleStructure);
  }

  /**
   * Utility delay function
   */
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = TOCExtractor; 