const axios = require('axios');
const cheerio = require('cheerio');
const { URL } = require('url');
const xml2js = require('xml2js');
const pLimit = require('p-limit');

/**
 * Safe URL resolution that validates the base URL and fixes common development URL issues
 */
function safeResolveURL(href, baseUrl) {
  try {
    // Ensure baseUrl is valid
    const base = new URL(baseUrl);
    
    // If href is already absolute and valid, return it
    if (href.startsWith('http://') || href.startsWith('https://')) {
      let absoluteUrl = new URL(href);
      
      // Comprehensive fix for development URLs in production sitemaps
      if (absoluteUrl.hostname.includes('.lndo.site') || 
          absoluteUrl.hostname.includes('.dev.') ||
          absoluteUrl.hostname.includes('.staging.') ||
          absoluteUrl.hostname.includes('.test.') ||
          absoluteUrl.hostname.includes('-dev.') ||
          absoluteUrl.hostname.includes('-staging.') ||
          absoluteUrl.hostname.includes('-test.')) {
        
        const originalUrl = href;
        
        // Extract county name and convert to proper courts.ca.gov URL
        let fixedUrl = href;
        
        // Handle .lndo.site pattern (most common)
        if (absoluteUrl.hostname.includes('.lndo.site')) {
          const countyMatch = absoluteUrl.hostname.match(/([^.]+)\.lndo\.site/);
          if (countyMatch) {
            const county = countyMatch[1];
            fixedUrl = href.replace(
              `http://${county}.lndo.site`, 
              `https://${county}.courts.ca.gov`
            );
          }
        }
        
        // Handle other development patterns
        else if (absoluteUrl.hostname.includes('.dev.') || absoluteUrl.hostname.includes('-dev.')) {
          fixedUrl = href.replace(/https?:\/\/[^.]*\.?dev\.?[^.]*\.courts\.ca\.gov/g, 
                                 `https://${base.hostname.split('.')[0]}.courts.ca.gov`);
        }
        
        // Handle staging patterns  
        else if (absoluteUrl.hostname.includes('.staging.') || absoluteUrl.hostname.includes('-staging.')) {
          fixedUrl = href.replace(/https?:\/\/[^.]*\.?staging\.?[^.]*\.courts\.ca\.gov/g, 
                                 `https://${base.hostname.split('.')[0]}.courts.ca.gov`);
        }
        
        // Handle test patterns
        else if (absoluteUrl.hostname.includes('.test.') || absoluteUrl.hostname.includes('-test.')) {
          fixedUrl = href.replace(/https?:\/\/[^.]*\.?test\.?[^.]*\.courts\.ca\.gov/g, 
                                 `https://${base.hostname.split('.')[0]}.courts.ca.gov`);
        }
        
        try {
          absoluteUrl = new URL(fixedUrl);
          console.log(`Fixed development URL: ${originalUrl} -> ${fixedUrl}`);
        } catch (e) {
          console.warn(`Failed to fix development URL: ${originalUrl}`);
          return null;
        }
      }
      
      // Only return if it's from the same domain or a courts.ca.gov domain
      if (absoluteUrl.hostname === base.hostname || 
          absoluteUrl.hostname.endsWith('.courts.ca.gov')) {
        return absoluteUrl.href;
      }
      return null; // Don't follow external domains
    }
    
    // Resolve relative URL
    const resolved = new URL(href, base.href);
    
    // Validate that resolved URL has correct hostname
    if (resolved.hostname !== base.hostname) {
      console.warn(`URL resolution changed hostname from ${base.hostname} to ${resolved.hostname} for href: ${href}`);
      // Force correct hostname
      resolved.hostname = base.hostname;
    }
    
    return resolved.href;
  } catch (error) {
    console.warn(`Failed to resolve URL ${href} with base ${baseUrl}:`, error.message);
    return null;
  }
}

class URLDiscovery {
  constructor(config = {}) {
    this.config = {
      timeout: 30000,
      maxConcurrent: 3,
      respectRobots: true,
      userAgent: 'Legal Research Tool - California County Rules Scraper',
      ...config
    };
    
    this.limit = pLimit(this.config.maxConcurrent);
    this.visitedUrls = new Set();
    this.discoveredDocuments = new Map();
  }

  /**
   * Main method to discover filing documents for a county
   */
  async discoverFilingDocuments(countyConfig) {
    console.log(`Starting document discovery for ${countyConfig.county}`);
    
    try {
      // Check robots.txt if required
      if (this.config.respectRobots) {
        await this.checkRobotsTxt(countyConfig.baseUrl);
      }

      const discoveryPromises = [
        this.limit(() => this.analyzeSitemap(countyConfig.baseUrl)),
        this.limit(() => this.crawlNavigation(countyConfig)),
        this.limit(() => this.searchForFilingContent(countyConfig)),
        this.limit(() => this.checkCommonPatterns(countyConfig))
      ];

      const results = await Promise.allSettled(discoveryPromises);
      
      // Combine all results
      const allUrls = [];
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && Array.isArray(result.value)) {
          allUrls.push(...result.value);
        } else if (result.status === 'rejected') {
          console.warn(`Discovery method ${index} failed:`, result.reason);
        }
      });

      return this.deduplicateAndClassify(allUrls, countyConfig);
      
    } catch (error) {
      console.error(`Error in document discovery for ${countyConfig.county}:`, error);
      return [];
    }
  }

  /**
   * Check robots.txt compliance
   */
  async checkRobotsTxt(baseUrl) {
    try {
      const robotsUrl = new URL('/robots.txt', baseUrl).href;
      const response = await axios.get(robotsUrl, {
        timeout: this.config.timeout,
        headers: { 'User-Agent': this.config.userAgent }
      });
      
      // For now, just log that we checked robots.txt
      console.log(`Checked robots.txt for ${baseUrl}`);
      this.robotsChecker = null;
      
    } catch (error) {
      console.warn('Could not fetch robots.txt, proceeding without restrictions');
    }
  }

  /**
   * Analyze sitemap for document URLs
   */
  async analyzeSitemap(baseUrl) {
    const sitemapUrls = [
      new URL('/sitemap.xml', baseUrl).href,
      new URL('/sitemap_index.xml', baseUrl).href,
      new URL('/sitemaps/sitemap.xml', baseUrl).href
    ];

    const documentUrls = [];

    for (const sitemapUrl of sitemapUrls) {
      try {
        const response = await axios.get(sitemapUrl, {
          timeout: this.config.timeout,
          headers: { 'User-Agent': this.config.userAgent }
        });

        const parser = new xml2js.Parser();
        const result = await parser.parseStringPromise(response.data);
        
        // Handle sitemap index
        if (result.sitemapindex) {
          for (const sitemap of result.sitemapindex.sitemap || []) {
            const urls = await this.processSitemap(sitemap.loc[0]);
            documentUrls.push(...urls);
          }
        }
        
        // Handle regular sitemap
        if (result.urlset) {
          const urls = this.extractRelevantUrls(result.urlset.url || []);
          documentUrls.push(...urls);
        }
        
        break; // Stop after first successful sitemap
        
      } catch (error) {
        continue; // Try next sitemap URL
      }
    }

    return this.filterFilingRelevantUrls(documentUrls);
  }

  /**
   * Process individual sitemap
   */
  async processSitemap(sitemapUrl) {
    try {
      const response = await axios.get(sitemapUrl, {
        timeout: this.config.timeout,
        headers: { 'User-Agent': this.config.userAgent }
      });

      const parser = new xml2js.Parser();
      const result = await parser.parseStringPromise(response.data);
      
      if (result.urlset) {
        return this.extractRelevantUrls(result.urlset.url || []);
      }
      
    } catch (error) {
      console.warn(`Error processing sitemap ${sitemapUrl}:`, error.message);
    }
    
    return [];
  }

  /**
   * Extract URLs that might contain legal documents with comprehensive development URL fixing
   */
  extractRelevantUrls(urlEntries) {
    const relevantUrls = [];
    const filingKeywords = [
      'rule', 'order', 'procedure', 'practice', 'filing',
      'case-management', 'scheduling', 'civil', 'form',
      'directive', 'local', 'standing', 'general', 'efiling',
      'e-filing', 'court-rules', 'judicial', 'department',
      'judge', 'guidelines', 'complex', 'self-help', 'fee'
    ];

    let fixedUrlCount = 0;

    for (const urlEntry of urlEntries) {
      let url = urlEntry.loc[0];
      let wasFixed = false;
      
      // Comprehensive fix for development URLs in sitemap (common issue with courts.ca.gov sites)
      if (url.includes('.lndo.site') || 
          url.includes('.dev.') ||
          url.includes('.staging.') ||
          url.includes('.test.') ||
          url.includes('-dev.') ||
          url.includes('-staging.') ||
          url.includes('-test.')) {
        
        const originalUrl = url;
        
        // Handle .lndo.site pattern (most common)
        if (url.includes('.lndo.site')) {
          url = url.replace(/http:\/\/([^.]+)\.lndo\.site/g, 'https://$1.courts.ca.gov');
          wasFixed = true;
        }
        
        // Handle other development patterns
        else if (url.includes('.dev.') || url.includes('-dev.')) {
          // Extract county from development URL and fix it
          const match = url.match(/https?:\/\/([^.]+)[\w.-]*\.courts\.ca\.gov/);
          if (match) {
            const county = match[1].replace(/-dev$/, '').replace(/\.dev$/, '');
            url = url.replace(/https?:\/\/[^.]*[\w.-]*\.courts\.ca\.gov/, `https://${county}.courts.ca.gov`);
            wasFixed = true;
          }
        }
        
        if (wasFixed) {
          console.log(`Fixed development URL from sitemap: ${originalUrl} -> ${url}`);
          fixedUrlCount++;
        }
      }
      
      const urlLower = url.toLowerCase();
      
      // Enhanced relevance checking with broader keyword matching
      const isRelevant = filingKeywords.some(keyword => urlLower.includes(keyword)) ||
                        url.match(/\/(rules?|orders?|procedures?|forms?|filing|efiling|e-filing|local|civil|departments?|judges?)\b/i) ||
                        url.match(/\.(pdf|doc|docx)$/i);
      
      if (isRelevant) {
        relevantUrls.push({
          url: url,
          lastmod: urlEntry.lastmod ? urlEntry.lastmod[0] : null,
          priority: urlEntry.priority ? parseFloat(urlEntry.priority[0]) : 0.5,
          source: 'sitemap',
          was_development_url: wasFixed
        });
      }
    }

    if (fixedUrlCount > 0) {
      console.log(`🔧 Fixed ${fixedUrlCount} development URLs in sitemap`);
    }

    return relevantUrls;
  }

  /**
   * Crawl website navigation to find document sections
   */
  async crawlNavigation(countyConfig) {
    const navigationUrls = [];
    
    try {
      const response = await axios.get(countyConfig.baseUrl, {
        timeout: this.config.timeout,
        headers: { 'User-Agent': this.config.userAgent }
      });

      const $ = cheerio.load(response.data);
      
      // Find navigation menus
      const navSelectors = [
        'nav a', '.navigation a', '.menu a', '.nav a',
        '.primary-nav a', '.main-nav a', 'header a'
      ];

      const filingNavKeywords = [
        'rules', 'orders', 'procedures', 'practice', 'civil',
        'case management', 'local rules', 'filing', 'forms'
      ];

      for (const selector of navSelectors) {
        $(selector).each((i, element) => {
          const href = $(element).attr('href');
          const text = $(element).text().toLowerCase().trim();
          
          if (href && filingNavKeywords.some(keyword => text.includes(keyword))) {
            const absoluteUrl = safeResolveURL(href, countyConfig.baseUrl);
            if (absoluteUrl) {
              navigationUrls.push({
                url: absoluteUrl,
                text: text,
                source: 'navigation',
                priority: 0.8
              });
            }
          }
        });
      }

      // Recursively explore discovered navigation pages
      const exploredUrls = [];
      for (const navUrl of navigationUrls.slice(0, 10)) { // Limit exploration
        const childUrls = await this.exploreNavigationPage(navUrl.url, countyConfig);
        exploredUrls.push(...childUrls);
      }

      return [...navigationUrls, ...exploredUrls];
      
    } catch (error) {
      console.error(`Error crawling navigation for ${countyConfig.county}:`, error.message);
      return [];
    }
  }

  /**
   * Explore individual navigation pages for documents
   */
  async exploreNavigationPage(pageUrl, countyConfig) {
    if (this.visitedUrls.has(pageUrl)) return [];
    this.visitedUrls.add(pageUrl);

    try {
      const response = await axios.get(pageUrl, {
        timeout: this.config.timeout,
        headers: { 'User-Agent': this.config.userAgent }
      });

      const $ = cheerio.load(response.data);
      const documentUrls = [];

      // Look for document links
      const documentSelectors = countyConfig.commonSelectors?.document_links || [
        'a[href*="rule"]', 'a[href*="order"]', 'a[href*="pdf"]',
        'a[href*="procedure"]', 'a[href*="practice"]'
      ];

      for (const selector of documentSelectors) {
        $(selector).each((i, element) => {
          const href = $(element).attr('href');
          const text = $(element).text().trim();
          
          if (href) {
            const absoluteUrl = safeResolveURL(href, pageUrl);
            if (absoluteUrl) {
              documentUrls.push({
                url: absoluteUrl,
                title: text,
                source: 'navigation_page',
                parent_page: pageUrl,
                priority: 0.7
              });
            }
          }
        });
      }

      return documentUrls;
      
    } catch (error) {
      console.warn(`Error exploring navigation page ${pageUrl}:`, error.message);
      return [];
    }
  }

  /**
   * Search for filing content using search functionality
   */
  async searchForFilingContent(countyConfig) {
    const searchUrls = [];
    const searchTerms = [
      'local rules', 'standing orders', 'case management',
      'filing procedures', 'civil procedures', 'court rules'
    ];

    try {
      // Try to find search functionality
      const response = await axios.get(countyConfig.baseUrl, {
        timeout: this.config.timeout,
        headers: { 'User-Agent': this.config.userAgent }
      });

      const $ = cheerio.load(response.data);
      
      // Look for search forms
      const searchForms = $('form[action*="search"], form input[name*="search"], form input[name*="query"]');
      
      if (searchForms.length > 0) {
        // Attempt to use search (this is a simplified approach)
        for (const term of searchTerms.slice(0, 3)) { // Limit searches
          const searchResults = await this.performSearch(countyConfig.baseUrl, term);
          searchUrls.push(...searchResults);
        }
      }

    } catch (error) {
      console.warn(`Search functionality not available for ${countyConfig.county}`);
    }

    return searchUrls;
  }

  /**
   * Perform search query (simplified implementation)
   */
  async performSearch(baseUrl, searchTerm) {
    // This is a simplified search implementation
    // In practice, each county's search would need specific handling
    const searchUrls = [];
    
    try {
      const searchUrl = new URL('/search', baseUrl).href;
      const params = new URLSearchParams({
        q: searchTerm,
        query: searchTerm,
        search: searchTerm
      });

      const response = await axios.get(`${searchUrl}?${params.toString()}`, {
        timeout: this.config.timeout,
        headers: { 'User-Agent': this.config.userAgent }
      });

      const $ = cheerio.load(response.data);
      
      // Extract search result links
      $('.search-result a, .result a, .search-item a').each((i, element) => {
        const href = $(element).attr('href');
        const text = $(element).text().trim();
        
        if (href) {
          const absoluteUrl = safeResolveURL(href, baseUrl);
          if (absoluteUrl) {
            searchUrls.push({
              url: absoluteUrl,
              title: text,
              source: 'search',
              search_term: searchTerm,
              priority: 0.6
            });
          }
        }
      });

    } catch (error) {
      // Search not available or failed
    }

    return searchUrls;
  }

  /**
   * Check common URL patterns for legal documents
   */
  async checkCommonPatterns(countyConfig) {
    const commonPaths = [
      '/rules', '/local-rules', '/court-rules',
      '/orders', '/standing-orders', '/general-orders',
      '/case-management', '/procedures', '/practice',
      '/forms', '/civil', '/divisions/civil',
      '/administrative', '/directives', '/notices',
      // Enhanced patterns for judge-specific information
      '/judges', '/judicial-officers', '/departments',
      '/motion-practice', '/tentative-rulings',
      '/individual-judge-rules', '/department-specific',
      '/judge-preferences', '/judicial-procedures',
      '/department-calendars', '/judge-calendars',
      '/ex-parte', '/emergency-orders', '/discovery-rules',
      '/alternative-dispute-resolution', '/mediation',
      '/arbitration', '/settlement-conferences',
      '/judge-biographies', '/judicial-assignments',
      '/court-calendar', '/hearing-schedules'
    ];

    const patternUrls = [];
    
    for (const path of commonPaths) {
              const testUrl = safeResolveURL(path, countyConfig.baseUrl);
      
      try {
                  if (testUrl) {
            const response = await axios.head(testUrl, {
              timeout: this.config.timeout,
              headers: { 'User-Agent': this.config.userAgent }
            });

            if (response.status === 200) {
              patternUrls.push({
                url: testUrl,
                source: 'common_pattern',
                pattern: path,
                priority: 0.9
              });

              // If the page exists, explore it for documents
              const pageDocuments = await this.explorePatternPage(testUrl, countyConfig);
              patternUrls.push(...pageDocuments);
            }
          }

      } catch (error) {
        // Path doesn't exist, continue
      }
    }

    return patternUrls;
  }

  /**
   * Explore pages found through common patterns
   */
  async explorePatternPage(pageUrl, countyConfig) {
    if (this.visitedUrls.has(pageUrl)) return [];
    this.visitedUrls.add(pageUrl);

    try {
      const response = await axios.get(pageUrl, {
        timeout: this.config.timeout,
        headers: { 'User-Agent': this.config.userAgent }
      });

      const $ = cheerio.load(response.data);
      const documentUrls = [];

      // Look for document links using county-specific selectors
      const allSelectors = [
        ...countyConfig.commonSelectors?.document_links || [],
        'a[href$=".pdf"]', 'a[href$=".doc"]', 'a[href$=".docx"]',
        'a[href*="rule"]', 'a[href*="order"]', 'a[href*="form"]'
      ];

      for (const selector of allSelectors) {
        $(selector).each((i, element) => {
          const href = $(element).attr('href');
          const text = $(element).text().trim();
          
          if (href && text) {
            const absoluteUrl = safeResolveURL(href, pageUrl);
            if (absoluteUrl) {
              documentUrls.push({
                url: absoluteUrl,
                title: text,
                source: 'pattern_page',
                parent_page: pageUrl,
                priority: 0.8
              });
            }
          }
        });
      }

      return documentUrls;
      
    } catch (error) {
      console.warn(`Error exploring pattern page ${pageUrl}:`, error.message);
      return [];
    }
  }

  /**
   * Filter URLs for filing relevance
   */
  filterFilingRelevantUrls(urls) {
    const filingKeywords = [
      'filing', 'deadline', 'service', 'motion', 'pleading',
      'case management', 'scheduling', 'rule', 'order',
      'procedure', 'practice', 'civil', 'form'
    ];

    return urls.filter(urlData => {
      const urlText = `${urlData.url} ${urlData.title || ''} ${urlData.text || ''}`.toLowerCase();
      return filingKeywords.some(keyword => urlText.includes(keyword));
    });
  }

  /**
   * Deduplicate and classify discovered URLs
   */
  deduplicateAndClassify(allUrls, countyConfig) {
    const urlMap = new Map();
    
    // Deduplicate based on URL
    for (const urlData of allUrls) {
      const url = urlData.url;
      
      if (!urlMap.has(url)) {
        urlMap.set(url, {
          ...urlData,
          county: countyConfig.county,
          discovered_at: new Date().toISOString(),
          classification: this.preliminaryClassification(urlData)
        });
      } else {
        // Merge sources and increase priority
        const existing = urlMap.get(url);
        existing.sources = Array.from(new Set([
          ...(existing.sources || [existing.source]),
          urlData.source
        ]));
        existing.priority = Math.max(existing.priority || 0, urlData.priority || 0);
      }
    }

    // Convert to array and sort by priority
    const deduplicatedUrls = Array.from(urlMap.values());
    return deduplicatedUrls.sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }

  /**
   * Preliminary classification of discovered URLs
   */
  preliminaryClassification(urlData) {
    const url = urlData.url.toLowerCase();
    const title = (urlData.title || '').toLowerCase();
    
    // Determine document format
    let format = 'HTML';
    if (url.includes('.pdf')) format = 'PDF';
    else if (url.includes('.doc')) format = 'WORD';
    else if (url.includes('.xls')) format = 'EXCEL';
    
    // Preliminary document type
    let type = 'UNKNOWN';
    if (url.includes('rule') || title.includes('rule')) type = 'LOCAL_RULE';
    else if (url.includes('order') || title.includes('order')) type = 'STANDING_ORDER';
    else if (url.includes('form') || title.includes('form')) type = 'FORM';
    else if (url.includes('procedure') || title.includes('procedure')) type = 'PRACTICE_GUIDE';
    
    return {
      format: format,
      preliminary_type: type,
      confidence: 0.3 // Low confidence for preliminary classification
    };
  }
}

module.exports = URLDiscovery; 