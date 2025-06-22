#!/usr/bin/env node

/**
 * Initialize Cache Script
 * Scans existing PDFs and marks them as processed in the progress tracker
 * This dramatically speeds up subsequent runs by avoiding re-processing
 */

const fs = require('fs-extra');
const path = require('path');
const ProgressTracker = require('../src/utils/ProgressTracker');
const Logger = require('../src/utils/Logger');

async function initializeCache() {
  const logger = new Logger('InitializeCache');
  const progressTracker = new ProgressTracker();
  
  try {
    logger.info('🚀 Initializing cache with existing PDFs...');
    
    const pdfDir = './crc_pdfs';
    
    if (!await fs.pathExists(pdfDir)) {
      logger.warn('PDF directory does not exist:', pdfDir);
      return;
    }
    
    const pdfFiles = await fs.readdir(pdfDir);
    const crcPdfs = pdfFiles.filter(file => file.startsWith('crc_rule_') && file.endsWith('.pdf'));
    
    logger.info(`Found ${crcPdfs.length} existing PDF files`);
    
    let processed = 0;
    let errors = 0;
    
    for (const pdfFile of crcPdfs) {
      try {
        // Extract rule number from filename
        const match = pdfFile.match(/crc_rule_(.+)\.pdf$/);
        if (!match) {
          logger.warn(`Could not extract rule number from: ${pdfFile}`);
          continue;
        }
        
        const ruleNumber = match[1];
        const pdfPath = path.join(pdfDir, pdfFile);
        const stats = await fs.stat(pdfPath);
        
        // Check if file is valid (not empty/corrupted)
        if (stats.size < 1000) {
          logger.warn(`PDF file too small, skipping: ${pdfFile} (${stats.size} bytes)`);
          continue;
        }
        
        // Mark as processed in progress tracker
        progressTracker.markRuleProcessed(ruleNumber, 'pdf_download', {
          pdfPath: pdfPath,
          fileSize: stats.size,
          pages: 'unknown', // We don't parse here for speed
          initializedFromCache: true,
          processedAt: stats.mtime.toISOString()
        });
        
        processed++;
        
        if (processed % 25 === 0) {
          logger.info(`Processed ${processed}/${crcPdfs.length} PDFs...`);
        }
        
      } catch (error) {
        errors++;
        logger.error(`Error processing ${pdfFile}:`, error.message);
      }
    }
    
    // Save progress
    progressTracker.saveProgress();
    
    logger.info(`✅ Cache initialization complete!`);
    logger.info(`📊 Results: ${processed} processed, ${errors} errors`);
    logger.info(`⚡ Next scraper run will skip these ${processed} rules and focus on new ones`);
    
    // Show statistics
    const stats = progressTracker.getStatistics();
    logger.info(`📈 Cache Statistics:`, JSON.stringify(stats, null, 2));
    
  } catch (error) {
    logger.error('Failed to initialize cache:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  initializeCache().catch(error => {
    console.error('Cache initialization failed:', error);
    process.exit(1);
  });
}

module.exports = initializeCache; 