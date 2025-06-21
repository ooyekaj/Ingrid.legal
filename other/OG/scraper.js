const { chromium } = require('playwright');
const fs = require('fs').promises;

async function scrapeCaliforniaCourtRules() {
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  });
  
  const page = await context.newPage();
  
  // Array to store all scraped rules
  const scrapedRules = [];
  
  try {
    console.log('Starting scrape of California Courts Rules...');
    
    // Navigate to the main page
    await page.goto('https://courts.ca.gov/cms/rules/index/three', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    console.log('Main page loaded, searching for Division 3 rules...');
    
    // Define the rules we want to scrape based on the structure you provided
    const targetRules = [
      // Division 3. Filing and Service
      // Chapter 1. Filing
      { ruleNumber: '3.100', title: 'Payment of filing fees by credit or debit card' },
      
      // Chapter 2. Time for Service  
      { ruleNumber: '3.110', title: 'Time for service of complaint, cross-complaint, and response' },
      
      // Chapter 3. Papers to Be Served
      { ruleNumber: '3.220', title: 'Case cover sheet' },
      { ruleNumber: '3.221', title: 'Information about alternative dispute resolution' },
      { ruleNumber: '3.222', title: 'Papers to be served on cross-defendants' },
      
      // Chapter 4. Miscellaneous
      { ruleNumber: '3.250', title: 'Limitations on the filing of papers' },
      { ruleNumber: '3.252', title: 'Service of papers on the clerk when a party\'s address is unknown' },
      { ruleNumber: '3.254', title: 'List of parties' }
    ];
    
    console.log(`Attempting to scrape ${targetRules.length} rules...`);
    
    for (const rule of targetRules) {
      try {
        console.log(`\nProcessing Rule ${rule.ruleNumber}: ${rule.title}`);
        
        // Construct the URL for the specific rule
        const ruleUrl = `https://courts.ca.gov/cms/rules/index/three/rule${rule.ruleNumber.replace('.', '_')}`;
        console.log(`Navigating to: ${ruleUrl}`);
        
        // Navigate to the rule page
        const response = await page.goto(ruleUrl, { 
          waitUntil: 'networkidle',
          timeout: 15000 
        });
        
        if (response && response.status() === 404) {
          console.log(`Rule ${rule.ruleNumber} page not found (404), skipping...`);
          continue;
        }
        
        // Wait for content to load
        await page.waitForTimeout(2000);
        
        // Extract rule content
        const ruleData = await extractRuleContent(page, rule.ruleNumber, rule.title);
        
        if (ruleData) {
          scrapedRules.push(ruleData);
          console.log(`✓ Successfully scraped Rule ${rule.ruleNumber}`);
        } else {
          console.log(`✗ Failed to extract content for Rule ${rule.ruleNumber}`);
        }
        
        // Add delay between requests to be respectful
        await page.waitForTimeout(1000 + Math.random() * 1000);
        
      } catch (error) {
        console.log(`Error processing Rule ${rule.ruleNumber}: ${error.message}`);
        continue;
      }
    }
    
  } catch (error) {
    console.error('Error during scraping:', error);
  } finally {
    await browser.close();
  }
  
  // Save results to JSON file
  if (scrapedRules.length > 0) {
    const jsonOutput = JSON.stringify(scrapedRules, null, 2);
    await fs.writeFile('california_court_rules.json', jsonOutput, 'utf8');
    console.log(`\n✓ Scraping complete! Saved ${scrapedRules.length} rules to california_court_rules.json`);
  } else {
    console.log('\n✗ No rules were successfully scraped.');
  }
  
  return scrapedRules;
}

async function extractRuleContent(page, ruleNumber, expectedTitle) {
  try {
    // Extract the main content
    const content = await page.evaluate(() => {
      // Look for the main content area
      const contentSelectors = [
        'main',
        '.main-content', 
        '.content',
        '#content',
        '.rule-content',
        '[role="main"]'
      ];
      
      let contentElement = null;
      for (const selector of contentSelectors) {
        contentElement = document.querySelector(selector);
        if (contentElement) break;
      }
      
      if (!contentElement) {
        contentElement = document.body;
      }
      
      // Get all text content
      const textContent = contentElement.innerText || contentElement.textContent || '';
      
      // Try to extract structured information
      const result = {
        fullText: textContent,
        paragraphs: []
      };
      
      // Get paragraphs
      const paragraphs = contentElement.querySelectorAll('p, div.rule-text, .rule-content p');
      paragraphs.forEach(p => {
        const text = p.innerText || p.textContent;
        if (text && text.trim().length > 10) {
          result.paragraphs.push(text.trim());
        }
      });
      
      return result;
    });
    
    if (!content || !content.fullText) {
      console.log(`No content found for rule ${ruleNumber}`);
      return null;
    }
    
    // Extract metadata and parse content
    const ruleText = content.fullText;
    
    // Extract last updated date
    const lastUpdatedMatch = ruleText.match(/(?:last )?(?:amended|effective|adopted).*?(\d{1,2}\/\d{1,2}\/\d{4}|\w+ \d{1,2}, \d{4}|January \d{1,2}, \d{4}|effective \d{4})/i);
    const lastUpdated = lastUpdatedMatch ? lastUpdatedMatch[1] : 'Not specified';
    
    // Extract main rule text (try to get the substantive content)
    let mainText = '';
    if (content.paragraphs && content.paragraphs.length > 0) {
      // Find the paragraph that seems to contain the main rule text
      mainText = content.paragraphs.find(p => 
        p.length > 50 && 
        !p.toLowerCase().includes('skip to') &&
        !p.toLowerCase().includes('judicial branch') &&
        !p.toLowerCase().includes('california courts')
      ) || content.paragraphs[0] || '';
    }
    
    if (!mainText) {
      // Fallback: extract from full text
      const lines = ruleText.split('\n').filter(line => line.trim().length > 20);
      mainText = lines.find(line => 
        !line.toLowerCase().includes('skip to') &&
        !line.toLowerCase().includes('judicial branch') &&
        !line.toLowerCase().includes('california courts') &&
        line.length > 50
      ) || '';
    }
    
    // Extract references to other rules/codes
    const subRuleMatches = ruleText.match(/(?:rule|section|code|government code|civil code)\s+\d+\.?\d*/gi);
    const subRules = subRuleMatches ? [...new Set(subRuleMatches)].join(', ') : '';
    
    // Generate metadata keywords
    const keywords = extractKeywords(ruleText, expectedTitle);
    
    // Clean up the main text
    mainText = mainText.replace(/\s+/g, ' ').trim();
    
    const ruleData = {
      rule: `Rule ${ruleNumber}`,
      title: expectedTitle,
      text: mainText,
      last_updated: lastUpdated,
      metadata: keywords,
      sub_rule: subRules,
      full_content: ruleText.substring(0, 1000) + (ruleText.length > 1000 ? '...' : ''), // Store first 1000 chars for reference
      scraped_at: new Date().toISOString()
    };
    
    return ruleData;
    
  } catch (error) {
    console.error(`Error extracting content for rule ${ruleNumber}:`, error);
    return null;
  }
}

function extractKeywords(text, title) {
  const commonLegalTerms = [
    'filing', 'service', 'court', 'fees', 'payment', 'credit', 'debit', 'card',
    'complaint', 'cross-complaint', 'response', 'time', 'deadline', 'papers',
    'cover sheet', 'alternative dispute resolution', 'cross-defendants',
    'limitations', 'clerk', 'address', 'parties', 'notice', 'motion'
  ];
  
  const textLower = (text + ' ' + title).toLowerCase();
  const foundTerms = commonLegalTerms.filter(term => 
    textLower.includes(term.toLowerCase())
  );
  
  return foundTerms.slice(0, 5).join(', '); // Limit to 5 keywords
}

// Export the function for use
module.exports = { scrapeCaliforniaCourtRules };

// Run the scraper if this file is executed directly
if (require.main === module) {
  scrapeCaliforniaCourtRules()
    .then(() => {
      console.log('Scraping completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('Scraping failed:', error);
      process.exit(1);
    });
}