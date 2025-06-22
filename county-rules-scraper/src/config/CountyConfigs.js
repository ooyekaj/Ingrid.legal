const fs = require('fs-extra');
const path = require('path');

class CountyConfigs {
  constructor() {
    this.configsPath = path.join(__dirname, '../../county_configs');
    this.baseConfig = this.getBaseConfig();
  }

  /**
   * Base configuration template for all counties
   */
  getBaseConfig() {
    return {
      // Common document discovery patterns
      commonPatterns: {
        rules: ['/rules', '/local-rules', '/court-rules'],
        orders: ['/orders', '/standing-orders', '/general-orders'],
        procedures: ['/procedures', '/practice', '/case-management'],
        forms: ['/forms', '/documents'],
        divisions: ['/civil', '/divisions/civil', '/departments']
      },
      
      // Common selectors for document links
      commonSelectors: {
        document_links: [
          'a[href*="rule"]',
          'a[href*="order"]', 
          'a[href*="pdf"]',
          'a[href*="procedure"]',
          'a[href*="practice"]'
        ],
        content_areas: [
          '.content',
          '.main-content',
          '.page-content',
          '.rule-content',
          '.order-content'
        ]
      },

      // Document format detection
      documentFormats: {
        pdf: {
          selectors: ['a[href$=".pdf"]', '.pdf-link', 'a[title*="PDF"]'],
          processing: 'pdf_extraction'
        },
        html: {
          selectors: ['.content', '.rule-text', '.order-text'],
          processing: 'html_parsing'
        },
        word: {
          selectors: ['a[href$=".docx"]', 'a[href$=".doc"]', '.word-doc'],
          processing: 'word_extraction'
        },
        excel: {
          selectors: ['a[href$=".xlsx"]', 'a[href$=".xls"]'],
          processing: 'excel_extraction'
        }
      },

      // Filing-specific content detection
      filingKeywords: [
        'filing', 'deadline', 'service', 'motion', 'pleading',
        'case management', 'scheduling', 'electronic filing',
        'proof of service', 'notice', 'hearing', 'calendar'
      ],

      // Default scraping parameters
      defaultScraping: {
        rate_limit: 2000,
        user_agent: 'Legal Research Tool - California County Rules Scraper',
        respect_robots: true,
        max_concurrent: 2,
        timeout: 30000,
        retries: 3
      }
    };
  }

  /**
   * Load specific county configuration
   */
  async loadCountyConfig(countyName) {
    const configFile = path.join(this.configsPath, `${countyName.toLowerCase().replace(/\s+/g, '-')}.json`);
    
    try {
      if (await fs.pathExists(configFile)) {
        const countyConfig = await fs.readJson(configFile);
        return this.mergeWithBase(countyConfig);
      } else {
        console.warn(`No specific configuration found for ${countyName}, using base config`);
        return this.createDefaultConfig(countyName);
      }
    } catch (error) {
      console.error(`Error loading config for ${countyName}:`, error);
      return this.createDefaultConfig(countyName);
    }
  }

  /**
   * Merge county-specific config with base configuration
   */
  mergeWithBase(countyConfig) {
    return {
      ...this.baseConfig,
      ...countyConfig,
      discoveryPatterns: {
        ...this.baseConfig.commonPatterns,
        ...countyConfig.discoveryPatterns
      },
      scraping_config: {
        ...this.baseConfig.defaultScraping,
        ...countyConfig.scraping_config
      }
    };
  }

  /**
   * Create default configuration for counties without specific configs
   */
  createDefaultConfig(countyName) {
    const baseUrl = this.guessCountyUrl(countyName);
    
    return {
      ...this.baseConfig,
      county: countyName,
      baseUrl: baseUrl,
      discoveryPatterns: this.baseConfig.commonPatterns,
      scraping_config: this.baseConfig.defaultScraping,
      filingAreas: {
        local_rules: {
          selectors: ['.rule-content', '.local-rule', '.court-rule'],
          url_patterns: ['/rules/', '/local-rules/']
        },
        standing_orders: {
          selectors: ['.order-content', '.standing-order'],
          url_patterns: ['/orders/', '/standing-orders/']
        },
        case_management: {
          selectors: ['.case-management', '.scheduling'],
          url_patterns: ['/case-management/', '/scheduling/']
        }
      }
    };
  }

  /**
   * Attempt to guess county court website URL
   */
  guessCountyUrl(countyName) {
    const cleanName = countyName.toLowerCase().replace(/\s+/g, '');
    const possibleUrls = [
      `https://${cleanName}.courts.ca.gov`,
      `https://www.${cleanName}courts.org`,
      `https://www.${cleanName}court.org`,
      `https://${cleanName}county.courts.ca.gov`
    ];
    
    return possibleUrls[0]; // Return first guess, validation happens during scraping
  }

  /**
   * Get all available county configurations
   */
  async getAllCountyConfigs() {
    const configs = {};
    
    try {
      const configFiles = await fs.readdir(this.configsPath);
      
      for (const file of configFiles) {
        if (file.endsWith('.json')) {
          const countyName = file.replace('.json', '').replace(/-/g, ' ');
          configs[countyName] = await this.loadCountyConfig(countyName);
        }
      }
    } catch (error) {
      console.error('Error loading county configurations:', error);
    }
    
    return configs;
  }

  /**
   * Save county configuration
   */
  async saveCountyConfig(countyName, config) {
    const configFile = path.join(this.configsPath, `${countyName.toLowerCase().replace(/\s+/g, '-')}.json`);
    
    try {
      await fs.ensureDir(this.configsPath);
      await fs.writeJson(configFile, config, { spaces: 2 });
      console.log(`Saved configuration for ${countyName}`);
    } catch (error) {
      console.error(`Error saving config for ${countyName}:`, error);
      throw error;
    }
  }

  /**
   * Get priority counties for processing
   */
  getPriorityCounties() {
    return [
      {
        name: 'Los Angeles',
        priority: 1,
        reason: 'Largest court system in California'
      },
      {
        name: 'San Francisco',
        priority: 2,
        reason: 'Tech-forward with detailed procedures'
      },
      {
        name: 'Santa Clara',
        priority: 3,
        reason: 'Silicon Valley - comprehensive digital presence'
      },
      {
        name: 'Orange',
        priority: 4,
        reason: 'High volume with good documentation'
      },
      {
        name: 'San Diego',
        priority: 5,
        reason: 'Major population center'
      },
      {
        name: 'Alameda',
        priority: 6,
        reason: 'Complex civil procedures'
      },
      {
        name: 'Sacramento',
        priority: 7,
        reason: 'State capital with government focus'
      },
      {
        name: 'Riverside',
        priority: 8,
        reason: 'Fast-growing region'
      },
      {
        name: 'Ventura',
        priority: 9,
        reason: 'Significant case volume'
      },
      {
        name: 'Contra Costa',
        priority: 10,
        reason: 'Bay Area procedures'
      }
    ];
  }
}

module.exports = CountyConfigs; 