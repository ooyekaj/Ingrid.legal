const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const ScraperConfig = require('../config/ScraperConfig');
const PythonScriptGenerator = require('../utils/PythonScriptGenerator');
const FileUtils = require('../utils/FileUtils');
const Logger = require('../utils/Logger');

class TOCExtractor {
  constructor(outputDir) {
    this.outputDir = outputDir;
    this.tocPdfPath = null;
  }

  async downloadTocPDF(downloadDir) {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
      Logger.info(`Accessing TOC page: ${ScraperConfig.URLS.CCP_TOC_URL}`);
      
      await page.goto(ScraperConfig.URLS.CCP_TOC_URL, { 
        waitUntil: 'domcontentloaded',
        timeout: ScraperConfig.TIMEOUTS.PAGE_LOAD 
      });
      
      Logger.success('Page loaded successfully');
      await page.waitForTimeout(2000);
      
      // Look for print/PDF button or link
      const pdfPath = path.join(downloadDir, 'ccp_toc.pdf');
      
      // Strategy 1: Look for the specific print button
      Logger.info('Looking for print button...');
      
      const printSelectors = ScraperConfig.SELECTORS.PRINT_BUTTONS;
      
      let printButton = null;
      for (const selector of printSelectors) {
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
        Logger.info('Attempting to trigger print dialog...');
        
        try {
          // Set up download listener before clicking
          const downloadPromise = page.waitForDownload({ timeout: ScraperConfig.TIMEOUTS.DOWNLOAD }).catch(() => null);
          
          // Click the print button to trigger window.print()
          await printButton.click();
          
          // Wait a bit for the print dialog
          await page.waitForTimeout(2000);
          
          const download = await downloadPromise;
          if (download) {
            await download.saveAs(pdfPath);
            Logger.success(`Downloaded TOC PDF via print button to: ${pdfPath}`);
            await browser.close();
            return pdfPath;
          }
        } catch (error) {
          Logger.warning(`Print button click failed: ${error.message}`);
        }
      }
      
      // Strategy 2: Use browser's print-to-PDF functionality
      Logger.info('Using print-to-PDF fallback...');
      await page.pdf({
        path: pdfPath,
        format: 'A4',
        printBackground: true,
        margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' }
      });
      
      Logger.success(`Generated TOC PDF to: ${pdfPath}`);
      await browser.close();
      return pdfPath;
      
    } catch (error) {
      await browser.close();
      throw new Error(`Failed to download TOC PDF: ${error.message}`);
    }
  }

  async extractSectionLinksFromTocPDF(tocPdfPath) {
    Logger.debug(`extractSectionLinksFromTocPDF called with tocPdfPath = ${tocPdfPath}`);
    
    return new Promise((resolve, reject) => {
      const pythonScript = PythonScriptGenerator.generateTocExtractionScript(tocPdfPath, this.outputDir);
      const scriptPath = path.join(this.outputDir, 'extract_toc_links.py');
      
      fs.writeFile(scriptPath, pythonScript)
        .then(() => {
          Logger.info('Running TOC link extraction script...');
          
          const pythonProcess = spawn('python3', [scriptPath], {
            stdio: ['inherit', 'pipe', 'pipe']
          });
          
          let output = '';
          let error = '';
          
          pythonProcess.stdout.on('data', (data) => {
            const text = data.toString();
            output += text;
            console.log(text.trim());
          });
          
          pythonProcess.stderr.on('data', (data) => {
            const text = data.toString();
            error += text;
            console.error(text.trim());
          });
          
          pythonProcess.on('close', (code) => {
            if (code === 0) {
              try {
                const resultsPath = path.join(this.outputDir, 'toc_links.json');
                fs.readFile(resultsPath, 'utf8')
                  .then(data => resolve(JSON.parse(data)))
                  .catch(err => reject(new Error(`Failed to read TOC links: ${err.message}`)));
              } catch (parseError) {
                reject(new Error(`Failed to parse TOC links: ${parseError.message}`));
              }
            } else {
              reject(new Error(`TOC extraction script failed with code ${code}: ${error}`));
            }
          });
        })
        .catch(reject);
    });
  }
}

module.exports = TOCExtractor; 