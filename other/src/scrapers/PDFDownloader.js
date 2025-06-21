const { chromium } = require('playwright');
const path = require('path');
const ScraperConfig = require('../config/ScraperConfig');
const FileUtils = require('../utils/FileUtils');
const WebScraper = require('./WebScraper');
const Logger = require('../utils/Logger');

class PDFDownloader {
  constructor(downloadDir) {
    this.downloadDir = downloadDir;
  }

  async downloadIndividualRulePDF(section, index) {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
      Logger.info(`Visiting section page: ${section.url}`);
      
      await page.goto(section.url, { 
        waitUntil: 'domcontentloaded',
        timeout: ScraperConfig.TIMEOUTS.PAGE_LOAD 
      });
      
      await page.waitForTimeout(1000);
      
      const filename = FileUtils.generateRuleFilename(section, index);
      const filePath = path.join(this.downloadDir, filename);
      
      // Try to find and trigger PDF download
      const downloadSuccess = await this.downloadPDF(page, section.url, filePath);
      
      await browser.close();
      
      if (downloadSuccess) {
        return {
          filePath: typeof downloadSuccess === 'string' ? downloadSuccess : filePath, // Handle JSON files from web scraping
          ruleData: {
            ruleNumber: section.ruleNumber,
            title: section.title,
            url: section.url,
            filename: filename,
            source: section.source,
            filingRelevance: { score: 8, isRelevant: true, source: 'pre_filtered' },
            contentType: typeof downloadSuccess === 'string' && downloadSuccess.endsWith('.json') ? 'web_scraped' : 'pdf'
          }
        };
      }
      
      return null;
      
    } catch (error) {
      await browser.close();
      throw error;
    }
  }

  async downloadPDF(page, pdfUrl, filePath) {
    try {
      Logger.info('Looking for PDF download options...');
      
      // Strategy 1: Look for the specific PDF link from the CCP section pages
      const pdfLinkSelectors = ScraperConfig.SELECTORS.PDF_LINKS;
      
      let pdfLink = null;
      for (const selector of pdfLinkSelectors) {
        try {
          const links = await page.$$(selector);
          if (links.length > 0) {
            pdfLink = links[0];
            Logger.success(`Found PDF link with selector: ${selector}`);
            break;
          }
        } catch (error) {
          // Continue to next selector
        }
      }
      
      if (pdfLink) {
        Logger.info('Attempting to click PDF link...');
        
        try {
          // Set up download event listener (updated Playwright API)
          const downloadPromise = page.waitForEvent('download', { timeout: ScraperConfig.TIMEOUTS.DOWNLOAD }).catch(() => null);
          
          // Click the PDF link
          await pdfLink.click();
          
          // Wait for download
          const download = await downloadPromise;
          if (download) {
            await download.saveAs(filePath);
            
            // Verify the downloaded file is a valid PDF, not an error page
            const isValidPDF = await FileUtils.verifyPDFContent(filePath);
            if (isValidPDF) {
              Logger.success('PDF downloaded via PDF link');
              return true;
            } else {
              Logger.warning('Downloaded file is not a valid PDF (likely error page)');
              // Delete the invalid file
              await FileUtils.deleteFile(filePath);
            }
          }
        } catch (error) {
          Logger.warning(`PDF link click failed: ${error.message}`);
        }
      }
      
      // Strategy 2: Look for print button with printPopup() function
      const printButtonSelectors = ScraperConfig.SELECTORS.PRINT_POPUP_BUTTONS;
      
      let printButton = null;
      for (const selector of printButtonSelectors) {
        try {
          const buttons = await page.$$(selector);
          if (buttons.length > 0) {
            printButton = buttons[0];
            Logger.success(`Found print button with selector: ${selector}`);
            break;
          }
        } catch (error) {
          // Continue to next selector
        }
      }
      
      if (printButton) {
        Logger.info('Attempting to click print button...');
        
        try {
          // Set up download event listener for print
          const downloadPromise = page.waitForEvent('download', { timeout: ScraperConfig.TIMEOUTS.DOWNLOAD }).catch(() => null);
          
          // Click the print button
          await printButton.click();
          
          // Wait a bit for print dialog
          await page.waitForTimeout(2000);
        
          const download = await downloadPromise;
          if (download) {
            await download.saveAs(filePath);
            
            // Verify the downloaded file is a valid PDF
            const isValidPDF = await FileUtils.verifyPDFContent(filePath);
            if (isValidPDF) {
              Logger.success('PDF downloaded via print button');
              return true;
            } else {
              Logger.warning('Downloaded file is not a valid PDF (likely error page)');
              // Delete the invalid file
              await FileUtils.deleteFile(filePath);
            }
          }
        } catch (error) {
          Logger.warning(`Print button click failed: ${error.message}`);
        }
      }
      
      // Strategy 3: Handle JSF form submission for PDF generation
      Logger.info('Attempting JSF form submission for PDF...');
      try {
        // Look for the form and try to submit it with PDF parameters
        const form = await page.$('#displayCodeSection');
        if (form) {
          // Try to trigger PDF generation via JavaScript
          const result = await page.evaluate(() => {
            // Check if there's a PDF link we can trigger programmatically
            const pdfLink = document.querySelector('#displayCodeSection\\:pdf_link');
            if (pdfLink && pdfLink.onclick) {
              pdfLink.click();
              return true;
            }
            return false;
          });
          
          if (result) {
            Logger.info('Triggered JSF PDF generation');
            
            // Wait for potential download
            const downloadPromise = page.waitForEvent('download', { timeout: 10000 }).catch(() => null);
            const download = await downloadPromise;
            
            if (download) {
              await download.saveAs(filePath);
              
              // Verify the downloaded file is a valid PDF
              const isValidPDF = await FileUtils.verifyPDFContent(filePath);
              if (isValidPDF) {
                Logger.success('PDF downloaded via JSF form');
                return true;
              } else {
                Logger.warning('Downloaded file is not a valid PDF (likely error page)');
                // Delete the invalid file
                await FileUtils.deleteFile(filePath);
              }
            }
          }
        }
      } catch (error) {
        Logger.warning(`JSF form submission failed: ${error.message}`);
      }
      
      // Strategy 4: Fallback - Print page as PDF using browser functionality
      Logger.info('Using browser print-to-PDF fallback...');
      await page.pdf({
        path: filePath,
        format: 'A4',
        printBackground: true,
        margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' }
      });
      
      const exists = await FileUtils.fileExists(filePath);
      if (exists) {
        // Verify the PDF contains actual legal content, not error messages
        const isValidPDF = await FileUtils.verifyPDFContent(filePath);
        if (isValidPDF) {
          Logger.success('PDF generated via browser print');
          return true;
        } else {
          Logger.warning('Generated PDF contains error content, falling back to web scraping');
          // Delete the invalid PDF
          await FileUtils.deleteFile(filePath);
          
          // Strategy 5: Scrape the web page content directly
          return await WebScraper.scrapeWebPageContent(page, filePath);
        }
      }
      
      // If all PDF strategies failed, scrape the web page
      Logger.info('All PDF strategies failed, scraping web page content...');
      return await WebScraper.scrapeWebPageContent(page, filePath);
      
    } catch (error) {
      Logger.error(`PDF download error: ${error.message}`);
      // Try web scraping as final fallback
      try {
        return await WebScraper.scrapeWebPageContent(page, filePath);
      } catch (scrapeError) {
        Logger.error(`Web scraping fallback failed: ${scrapeError.message}`);
        return false;
      }
    }
  }
}

module.exports = PDFDownloader; 