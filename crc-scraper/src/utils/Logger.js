/**
 * Advanced Logger for CRC Scraper
 * Provides structured logging with multiple outputs and levels
 */

const winston = require('winston');
const fs = require('fs-extra');
const path = require('path');
const config = require('../config/ScraperConfig');

class Logger {
  constructor(component = 'CRCScraper') {
    this.component = component;
    this.initializeLogger();
  }

  /**
   * Initialize Winston logger with custom configuration
   */
  initializeLogger() {
    // Ensure logs directory exists
    const logsDir = config.output.directories.logs;
    fs.ensureDirSync(logsDir);

    // Define log format
    const logFormat = winston.format.combine(
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
      }),
      winston.format.errors({ stack: true }),
      winston.format.printf(({ level, message, timestamp, component, stack }) => {
        const componentStr = component || this.component;
        const baseMessage = `${timestamp} [${level.toUpperCase()}] [${componentStr}] ${message}`;
        return stack ? `${baseMessage}\n${stack}` : baseMessage;
      })
    );

    // Create transports
    const transports = [
      // Console transport with colors
      new winston.transports.Console({
        level: process.env.LOG_LEVEL || 'info',
        format: winston.format.combine(
          winston.format.colorize(),
          logFormat
        )
      }),

      // Main log file
      new winston.transports.File({
        filename: path.join(logsDir, 'crc-scraper.log'),
        level: 'debug',
        format: logFormat,
        maxsize: 10485760, // 10MB
        maxFiles: 5
      }),

      // Error log file
      new winston.transports.File({
        filename: path.join(logsDir, 'error.log'),
        level: 'error',
        format: logFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 3
      }),

      // Performance log file
      new winston.transports.File({
        filename: path.join(logsDir, 'performance.log'),
        level: 'info',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json()
        ),
        maxsize: 10485760, // 10MB
        maxFiles: 3
      })
    ];

    // Create logger instance
    this.winston = winston.createLogger({
      level: 'debug',
      format: logFormat,
      transports,
      exitOnError: false
    });

    // Add custom levels for scraping operations
    winston.addColors({
      extraction: 'cyan',
      analysis: 'magenta',
      download: 'yellow',
      validation: 'blue'
    });
  }

  /**
   * Debug level logging
   */
  debug(message, meta = {}) {
    this.winston.debug(message, { component: this.component, ...meta });
  }

  /**
   * Info level logging
   */
  info(message, meta = {}) {
    this.winston.info(message, { component: this.component, ...meta });
  }

  /**
   * Warning level logging
   */
  warn(message, meta = {}) {
    this.winston.warn(message, { component: this.component, ...meta });
  }

  /**
   * Error level logging
   */
  error(message, error = null, meta = {}) {
    const errorMeta = { component: this.component, ...meta };
    
    if (error instanceof Error) {
      errorMeta.stack = error.stack;
      errorMeta.errorMessage = error.message;
      this.winston.error(message, errorMeta);
    } else if (error) {
      errorMeta.error = error;
      this.winston.error(message, errorMeta);
    } else {
      this.winston.error(message, errorMeta);
    }
  }

  /**
   * Log extraction operations
   */
  extraction(message, meta = {}) {
    this.winston.log('extraction', message, { component: this.component, ...meta });
  }

  /**
   * Log analysis operations
   */
  analysis(message, meta = {}) {
    this.winston.log('analysis', message, { component: this.component, ...meta });
  }

  /**
   * Log download operations
   */
  download(message, meta = {}) {
    this.winston.log('download', message, { component: this.component, ...meta });
  }

  /**
   * Log validation operations
   */
  validation(message, meta = {}) {
    this.winston.log('validation', message, { component: this.component, ...meta });
  }

  /**
   * Log performance metrics
   */
  performance(operation, duration, meta = {}) {
    const perfData = {
      component: this.component,
      operation,
      duration_ms: duration,
      timestamp: new Date().toISOString(),
      ...meta
    };
    
    this.winston.info(`Performance: ${operation} completed in ${duration}ms`, perfData);
  }

  /**
   * Log statistics and metrics
   */
  stats(operation, stats, meta = {}) {
    const statsData = {
      component: this.component,
      operation,
      stats,
      timestamp: new Date().toISOString(),
      ...meta
    };
    
    this.winston.info(`Stats: ${operation}`, statsData);
  }

  /**
   * Create a timer for performance logging
   */
  timer(operation) {
    const startTime = Date.now();
    
    return {
      end: (meta = {}) => {
        const duration = Date.now() - startTime;
        this.performance(operation, duration, meta);
        return duration;
      }
    };
  }

  /**
   * Log with progress information
   */
  progress(current, total, operation, meta = {}) {
    const percentage = ((current / total) * 100).toFixed(1);
    const message = `Progress: ${operation} (${current}/${total} - ${percentage}%)`;
    
    this.info(message, {
      current,
      total,
      percentage: parseFloat(percentage),
      operation,
      ...meta
    });
  }

  /**
   * Log structured data
   */
  logData(level, message, data) {
    this.winston.log(level, message, {
      component: this.component,
      data: typeof data === 'object' ? JSON.stringify(data, null, 2) : data
    });
  }

  /**
   * Log HTTP requests and responses
   */
  http(method, url, statusCode, duration, meta = {}) {
    const httpData = {
      component: this.component,
      method,
      url,
      statusCode,
      duration_ms: duration,
      timestamp: new Date().toISOString(),
      ...meta
    };

    const level = statusCode >= 400 ? 'error' : statusCode >= 300 ? 'warn' : 'info';
    this.winston.log(level, `HTTP ${method} ${url} - ${statusCode} (${duration}ms)`, httpData);
  }

  /**
   * Log rule processing
   */
  ruleProcessing(ruleNumber, operation, status, meta = {}) {
    const ruleData = {
      component: this.component,
      ruleNumber,
      operation,
      status,
      timestamp: new Date().toISOString(),
      ...meta
    };

    const level = status === 'error' ? 'error' : status === 'warning' ? 'warn' : 'info';
    this.winston.log(level, `Rule ${ruleNumber}: ${operation} - ${status}`, ruleData);
  }

  /**
   * Log content analysis results
   */
  contentAnalysis(ruleNumber, analysisType, results, meta = {}) {
    const analysisData = {
      component: this.component,
      ruleNumber,
      analysisType,
      results,
      timestamp: new Date().toISOString(),
      ...meta
    };

    this.analysis(`Content analysis for rule ${ruleNumber}: ${analysisType}`, analysisData);
  }

  /**
   * Create child logger for specific operations
   */
  child(childComponent) {
    return new Logger(`${this.component}:${childComponent}`);
  }

  /**
   * Flush all transports
   */
  async flush() {
    return new Promise((resolve) => {
      this.winston.on('finish', resolve);
      this.winston.end();
    });
  }

  /**
   * Get log file paths
   */
  getLogFiles() {
    const logsDir = config.output.directories.logs;
    return {
      main: path.join(logsDir, 'crc-scraper.log'),
      error: path.join(logsDir, 'error.log'),
      performance: path.join(logsDir, 'performance.log')
    };
  }

  /**
   * Archive old logs
   */
  async archiveLogs() {
    try {
      const logsDir = config.output.directories.logs;
      const archiveDir = path.join(logsDir, 'archive');
      await fs.ensureDir(archiveDir);

      const logFiles = await fs.readdir(logsDir);
      const timestamp = new Date().toISOString().slice(0, 10);

      for (const file of logFiles) {
        if (file.endsWith('.log')) {
          const filePath = path.join(logsDir, file);
          const stats = await fs.stat(filePath);
          
          // Archive if older than 7 days
          const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
          if (stats.mtime.getTime() < sevenDaysAgo) {
            const archiveName = `${path.parse(file).name}-${timestamp}${path.parse(file).ext}`;
            const archivePath = path.join(archiveDir, archiveName);
            await fs.move(filePath, archivePath);
            this.info(`Archived log file: ${file} -> ${archiveName}`);
          }
        }
      }
    } catch (error) {
      this.error('Failed to archive logs:', error);
    }
  }
}

module.exports = Logger; 