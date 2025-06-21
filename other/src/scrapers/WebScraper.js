const fs = require('fs').promises;
const ScraperConfig = require('../config/ScraperConfig');
const Logger = require('../utils/Logger');

class WebScraper {
  static async scrapeWebPageContent(page, filePath) {
    try {
      Logger.info('Scraping web page content as fallback...');
      
      // Wait for page to be fully loaded
      await page.waitForTimeout(2000);
      
      // Extract the main content from the page
      const content = await page.evaluate(() => {
        // Look for the main content area
        const contentSelectors = [
          '#displayCodeSection',
          '.main-content',
          '.content',
          '.law-content',
          '.section-content',
          'main',
          'article'
        ];
        
        let mainContent = '';
        
        for (const selector of contentSelectors) {
          const element = document.querySelector(selector);
          if (element) {
            // Remove navigation and non-content elements
            const clonedElement = element.cloneNode(true);
            
            // Remove unwanted elements
            const unwantedSelectors = [
              'nav', '.nav', '.navigation',
              'header', '.header',
              'footer', '.footer',
              '.breadcrumb', '.breadcrumbs',
              '.sidebar', '.side-nav',
              'script', 'style',
              '.search', '.search-box',
              '.print-button', '.pdf-button',
              '.social-media', '.share-buttons'
            ];
            
            unwantedSelectors.forEach(unwantedSelector => {
              const unwantedElements = clonedElement.querySelectorAll(unwantedSelector);
              unwantedElements.forEach(el => el.remove());
            });
            
            mainContent = clonedElement.innerText || clonedElement.textContent || '';
            if (mainContent.trim().length > 100) {
              break;
            }
          }
        }
        
        // If no specific content area found, get body text but filter out navigation
        if (!mainContent || mainContent.trim().length < 100) {
          const bodyText = document.body.innerText || document.body.textContent || '';
          
          // Filter out common navigation and error text
          const lines = bodyText.split('\n');
          const filteredLines = lines.filter(line => {
            const lowerLine = line.toLowerCase().trim();
            return lowerLine.length > 10 && 
                   !lowerLine.includes('search phrase') &&
                   !lowerLine.includes('bill information') &&
                   !lowerLine.includes('california law') &&
                   !lowerLine.includes('publications') &&
                   !lowerLine.includes('other resources') &&
                   !lowerLine.includes('my subscriptions') &&
                   !lowerLine.includes('my favorites') &&
                   !lowerLine.includes('add to my favorites') &&
                   !lowerLine.includes('cross-reference') &&
                   !lowerLine.includes('previous') &&
                   !lowerLine.includes('next') &&
                   !lowerLine.includes('home') &&
                   !lowerLine.includes('search') &&
                   !lowerLine.includes('highlight');
          });
          
          mainContent = filteredLines.join('\n');
        }
        
        return {
          title: document.title,
          url: window.location.href,
          content: mainContent.trim(),
          timestamp: new Date().toISOString()
        };
      });
      
      // Verify we got meaningful content
      if (!content.content || content.content.length < ScraperConfig.FILE_CONSTRAINTS.MIN_CONTENT_LENGTH) {
        Logger.error('Insufficient content extracted from web page');
        return false;
      }
      
      // Check if content contains error messages
      const lowerContent = content.content.toLowerCase();
      const errorIndicators = ScraperConfig.ERROR_INDICATORS;
      
      if (errorIndicators.some(indicator => lowerContent.includes(indicator))) {
        Logger.error('Web page contains error messages');
        return false;
      }
      
      // Create a "fake" PDF containing the web content for processing
      const webContentData = {
        source: 'web_scraping',
        title: content.title,
        url: content.url,
        content: content.content,
        timestamp: content.timestamp,
        note: 'This content was scraped from the web page because PDF was not available'
      };
      
      // Save as JSON file instead of PDF (we'll handle this in the processing script)
      const jsonPath = filePath.replace('.pdf', '.json');
      await fs.writeFile(jsonPath, JSON.stringify(webContentData, null, 2));
      
      Logger.success('Web content scraped and saved as JSON');
      Logger.info(`Content length: ${content.content.length} characters`);
      
      // Return the JSON path so the processing script knows to handle it differently
      return jsonPath;
      
    } catch (error) {
      Logger.error(`Web scraping error: ${error.message}`);
      return false;
    }
  }

  static filterNavigationText(lines) {
    const navigationTerms = [
      'search phrase',
      'bill information',
      'california law',
      'publications',
      'other resources',
      'my subscriptions',
      'my favorites',
      'add to my favorites',
      'cross-reference',
      'previous',
      'next',
      'home',
      'search',
      'highlight'
    ];

    return lines.filter(line => {
      const lowerLine = line.toLowerCase().trim();
      return lowerLine.length > 10 && 
             !navigationTerms.some(term => lowerLine.includes(term));
    });
  }

  static extractMainContent(page, selectors) {
    return page.evaluate((selectorList) => {
      for (const selector of selectorList) {
        const element = document.querySelector(selector);
        if (element) {
          // Clone and clean the element
          const clonedElement = element.cloneNode(true);
          
          // Remove unwanted elements
          const unwantedSelectors = [
            'nav', '.nav', '.navigation',
            'header', '.header',
            'footer', '.footer',
            '.breadcrumb', '.breadcrumbs',
            '.sidebar', '.side-nav',
            'script', 'style',
            '.search', '.search-box',
            '.print-button', '.pdf-button',
            '.social-media', '.share-buttons'
          ];
          
          unwantedSelectors.forEach(unwantedSelector => {
            const unwantedElements = clonedElement.querySelectorAll(unwantedSelector);
            unwantedElements.forEach(el => el.remove());
          });
          
          const content = clonedElement.innerText || clonedElement.textContent || '';
          if (content.trim().length > 100) {
            return content.trim();
          }
        }
      }
      return null;
    }, selectors);
  }
}

module.exports = WebScraper; 