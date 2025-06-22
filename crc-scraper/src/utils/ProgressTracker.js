const fs = require('fs-extra');
const path = require('path');
const Logger = require('./Logger');

/**
 * Progress Tracker for CRC Scraper
 * Tracks processed rules to enable smart caching and resume functionality
 */
class ProgressTracker {
  constructor(cacheDir = './cache') {
    this.cacheDir = cacheDir;
    this.progressFile = path.join(cacheDir, 'progress.json');
    this.processedRulesFile = path.join(cacheDir, 'processed_rules.json');
    this.logger = new Logger('ProgressTracker');
    this.progress = this.loadProgress();
    this.processedRules = this.loadProcessedRules();
  }

  /**
   * Load existing progress from cache
   */
  loadProgress() {
    try {
      if (fs.existsSync(this.progressFile)) {
        const progress = fs.readJsonSync(this.progressFile);
        this.logger.info(`Loaded progress: ${progress.processed}/${progress.total} rules processed`);
        return progress;
      }
    } catch (error) {
      this.logger.warn('Failed to load progress file:', error.message);
    }
    
    return {
      startTime: new Date().toISOString(),
      processed: 0,
      total: 0,
      currentPhase: 'starting',
      lastProcessedRule: null,
      errors: [],
      statistics: {
        pdfDownloads: 0,
        contentExtractions: 0,
        knowledgeGraphNodes: 0
      }
    };
  }

  /**
   * Load list of processed rules
   */
  loadProcessedRules() {
    try {
      if (fs.existsSync(this.processedRulesFile)) {
        const processed = fs.readJsonSync(this.processedRulesFile);
        this.logger.info(`Found ${Object.keys(processed).length} previously processed rules`);
        return processed;
      }
    } catch (error) {
      this.logger.warn('Failed to load processed rules file:', error.message);
    }
    
    return {};
  }

  /**
   * Save current progress
   */
  saveProgress() {
    try {
      fs.ensureDirSync(this.cacheDir);
      fs.writeJsonSync(this.progressFile, this.progress, { spaces: 2 });
      fs.writeJsonSync(this.processedRulesFile, this.processedRules, { spaces: 2 });
    } catch (error) {
      this.logger.error('Failed to save progress:', error.message);
    }
  }

  /**
   * Initialize progress tracking for a new run
   */
  initializeRun(totalRules, phase = 'pdf_download') {
    this.progress.total = totalRules;
    this.progress.currentPhase = phase;
    this.progress.lastUpdate = new Date().toISOString();
    this.saveProgress();
    
    this.logger.info(`Starting ${phase} phase: ${totalRules} rules to process`);
  }

  /**
   * Check if a rule has already been processed successfully
   */
  isRuleProcessed(ruleNumber, phase = 'pdf_download') {
    const ruleKey = `${ruleNumber}_${phase}`;
    return this.processedRules[ruleKey] && this.processedRules[ruleKey].status === 'completed';
  }

  /**
   * Mark a rule as processed
   */
  markRuleProcessed(ruleNumber, phase = 'pdf_download', metadata = {}) {
    const ruleKey = `${ruleNumber}_${phase}`;
    this.processedRules[ruleKey] = {
      status: 'completed',
      processedAt: new Date().toISOString(),
      metadata: metadata
    };
    
    this.progress.processed++;
    this.progress.lastProcessedRule = ruleNumber;
    this.progress.lastUpdate = new Date().toISOString();
    
    // Update statistics based on phase
    if (phase === 'pdf_download') {
      this.progress.statistics.pdfDownloads++;
    } else if (phase === 'content_extraction') {
      this.progress.statistics.contentExtractions++;
    } else if (phase === 'knowledge_graph') {
      this.progress.statistics.knowledgeGraphNodes++;
    }
    
    // Save progress periodically
    if (this.progress.processed % 10 === 0) {
      this.saveProgress();
      this.logProgress();
    }
  }

  /**
   * Mark a rule as failed
   */
  markRuleFailed(ruleNumber, phase = 'pdf_download', error) {
    const ruleKey = `${ruleNumber}_${phase}`;
    this.processedRules[ruleKey] = {
      status: 'failed',
      processedAt: new Date().toISOString(),
      error: error.message || error
    };
    
    this.progress.errors.push({
      ruleNumber,
      phase,
      error: error.message || error,
      timestamp: new Date().toISOString()
    });
    
    this.progress.lastUpdate = new Date().toISOString();
  }

  /**
   * Get list of rules that need to be processed
   */
  getRulesNeedingProcessing(allRules, phase = 'pdf_download') {
    return allRules.filter(rule => !this.isRuleProcessed(rule.ruleNumber, phase));
  }

  /**
   * Get processing statistics
   */
  getStatistics() {
    const elapsed = Date.now() - new Date(this.progress.startTime).getTime();
    const rulesPerMinute = this.progress.processed / (elapsed / 60000);
    const estimatedRemainingTime = (this.progress.total - this.progress.processed) / rulesPerMinute;
    
    return {
      ...this.progress.statistics,
      processed: this.progress.processed,
      total: this.progress.total,
      percentage: ((this.progress.processed / this.progress.total) * 100).toFixed(1),
      elapsedTime: elapsed,
      rulesPerMinute: rulesPerMinute.toFixed(2),
      estimatedRemainingMinutes: estimatedRemainingTime.toFixed(1),
      errors: this.progress.errors.length,
      currentPhase: this.progress.currentPhase
    };
  }

  /**
   * Log current progress
   */
  logProgress() {
    const stats = this.getStatistics();
    this.logger.info(`Progress: ${stats.processed}/${stats.total} (${stats.percentage}%) | ` + 
                    `${stats.rulesPerMinute} rules/min | ` +
                    `ETA: ${stats.estimatedRemainingMinutes} min | ` +
                    `Errors: ${stats.errors}`);
  }

  /**
   * Check if all rules in a phase are completed
   */
  isPhaseCompleted(phase = 'pdf_download') {
    return this.progress.currentPhase !== phase && this.progress.processed >= this.progress.total;
  }

  /**
   * Get resume point for a phase
   */
  getResumePoint(allRules, phase = 'pdf_download') {
    const needsProcessing = this.getRulesNeedingProcessing(allRules, phase);
    const alreadyProcessed = allRules.length - needsProcessing.length;
    
    this.logger.info(`Resume point: ${alreadyProcessed} rules already processed, ${needsProcessing.length} remaining`);
    
    return {
      alreadyProcessed,
      needsProcessing,
      canResume: needsProcessing.length < allRules.length
    };
  }

  /**
   * Clean up old cache files
   */
  cleanup() {
    try {
      const cacheFiles = [this.progressFile, this.processedRulesFile];
      cacheFiles.forEach(file => {
        if (fs.existsSync(file)) {
          fs.removeSync(file);
          this.logger.info(`Cleaned up cache file: ${file}`);
        }
      });
    } catch (error) {
      this.logger.warn('Failed to cleanup cache files:', error.message);
    }
  }
}

module.exports = ProgressTracker; 