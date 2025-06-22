/**
 * File Utilities for CRC Scraper
 * Handles file operations, compression, and data serialization
 */

const fs = require('fs-extra');
const path = require('path');
const zlib = require('zlib');
const jsonStableStringify = require('json-stable-stringify');
const { table } = require('table');
const config = require('../config/ScraperConfig');
const Logger = require('./Logger');

class FileUtils {
  constructor() {
    this.logger = new Logger('FileUtils');
  }

  /**
   * Save data to JSON file with optional compression
   */
  async saveJSON(data, filePath, options = {}) {
    try {
      const {
        compress = config.output.compression.enabled,
        pretty = true,
        stable = true
      } = options;

      // Ensure directory exists
      await fs.ensureDir(path.dirname(filePath));

      // Serialize data
      const jsonString = stable 
        ? jsonStableStringify(data, { space: pretty ? 2 : 0 })
        : JSON.stringify(data, null, pretty ? 2 : 0);

      if (compress) {
        // Compress and save
        const compressed = zlib.gzipSync(jsonString);
        const compressedPath = `${filePath}.gz`;
        await fs.writeFile(compressedPath, compressed);
        this.logger.info(`Saved compressed JSON: ${compressedPath}`);
        return compressedPath;
      } else {
        // Save uncompressed
        await fs.writeFile(filePath, jsonString, 'utf8');
        this.logger.info(`Saved JSON: ${filePath}`);
        return filePath;
      }

    } catch (error) {
      this.logger.error(`Failed to save JSON to ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Load JSON data with automatic decompression
   */
  async loadJSON(filePath) {
    try {
      // Check if compressed version exists
      const compressedPath = `${filePath}.gz`;
      let actualPath = filePath;
      let isCompressed = false;

      if (await fs.pathExists(compressedPath)) {
        actualPath = compressedPath;
        isCompressed = true;
      } else if (!(await fs.pathExists(filePath))) {
        throw new Error(`File not found: ${filePath}`);
      }

      // Read file
      const buffer = await fs.readFile(actualPath);
      
      // Decompress if needed
      const content = isCompressed 
        ? zlib.gunzipSync(buffer).toString('utf8')
        : buffer.toString('utf8');

      // Parse JSON
      const data = JSON.parse(content);
      this.logger.debug(`Loaded JSON from ${actualPath}`);
      return data;

    } catch (error) {
      this.logger.error(`Failed to load JSON from ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Save data to CSV format
   */
  async saveCSV(data, filePath, options = {}) {
    try {
      const { headers, delimiter = ',' } = options;

      // Ensure directory exists
      await fs.ensureDir(path.dirname(filePath));

      let csvContent = '';

      if (Array.isArray(data) && data.length > 0) {
        // Extract headers from first object if not provided
        const csvHeaders = headers || Object.keys(data[0]);
        
        // Add header row
        csvContent += csvHeaders.map(h => this.escapeCSVField(h)).join(delimiter) + '\n';

        // Add data rows
        for (const row of data) {
          const values = csvHeaders.map(header => {
            const value = row[header];
            return this.escapeCSVField(value);
          });
          csvContent += values.join(delimiter) + '\n';
        }
      }

      await fs.writeFile(filePath, csvContent, 'utf8');
      this.logger.info(`Saved CSV: ${filePath}`);
      return filePath;

    } catch (error) {
      this.logger.error(`Failed to save CSV to ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Escape CSV field value
   */
  escapeCSVField(value) {
    if (value === null || value === undefined) {
      return '';
    }

    const stringValue = String(value);
    
    // If contains comma, newline, or quote, wrap in quotes and escape quotes
    if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }

    return stringValue;
  }

  /**
   * Save data to HTML format
   */
  async saveHTML(data, filePath, options = {}) {
    try {
      const { title = 'CRC Scraper Results', template } = options;

      // Ensure directory exists
      await fs.ensureDir(path.dirname(filePath));

      let htmlContent;

      if (template) {
        // Use custom template
        htmlContent = template.replace('{{DATA}}', JSON.stringify(data, null, 2));
      } else {
        // Generate basic HTML
        htmlContent = this.generateBasicHTML(data, title);
      }

      await fs.writeFile(filePath, htmlContent, 'utf8');
      this.logger.info(`Saved HTML: ${filePath}`);
      return filePath;

    } catch (error) {
      this.logger.error(`Failed to save HTML to ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Generate basic HTML for data visualization
   */
  generateBasicHTML(data, title) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #333; }
        .rule { border: 1px solid #ddd; margin: 10px 0; padding: 15px; }
        .rule-number { font-weight: bold; color: #0066cc; }
        .rule-title { font-size: 1.2em; margin: 5px 0; }
        .metadata { background: #f5f5f5; padding: 10px; margin: 10px 0; }
        .content { line-height: 1.6; }
        pre { background: #f8f8f8; padding: 10px; overflow-x: auto; }
    </style>
</head>
<body>
    <h1>${title}</h1>
    <div id="content">
        ${this.generateHTMLContent(data)}
    </div>
    <script>
        const data = ${JSON.stringify(data, null, 2)};
        console.log('Loaded data:', data);
    </script>
</body>
</html>`;
  }

  /**
   * Generate HTML content for data
   */
  generateHTMLContent(data) {
    if (Array.isArray(data)) {
      return data.map(item => this.generateItemHTML(item)).join('');
    } else if (typeof data === 'object') {
      return this.generateItemHTML(data);
    } else {
      return `<pre>${JSON.stringify(data, null, 2)}</pre>`;
    }
  }

  /**
   * Generate HTML for individual item
   */
  generateItemHTML(item) {
    if (item.ruleNumber) {
      // Rule format
      return `
        <div class="rule">
            <div class="rule-number">Rule ${item.ruleNumber}</div>
            <div class="rule-title">${item.title || 'Untitled'}</div>
            <div class="metadata">
                <strong>Category:</strong> ${item.category || 'Unknown'}<br>
                <strong>URL:</strong> <a href="${item.url}" target="_blank">${item.url}</a>
            </div>
            <div class="content">
                ${item.content ? item.content.substring(0, 500) + '...' : 'No content'}
            </div>
        </div>`;
    } else {
      // Generic object format
      return `<pre>${JSON.stringify(item, null, 2)}</pre>`;
    }
  }

  /**
   * Save data to Markdown format
   */
  async saveMarkdown(data, filePath, options = {}) {
    try {
      const { title = 'CRC Scraper Results' } = options;

      // Ensure directory exists
      await fs.ensureDir(path.dirname(filePath));

      const markdownContent = this.generateMarkdown(data, title);

      await fs.writeFile(filePath, markdownContent, 'utf8');
      this.logger.info(`Saved Markdown: ${filePath}`);
      return filePath;

    } catch (error) {
      this.logger.error(`Failed to save Markdown to ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Generate Markdown content
   */
  generateMarkdown(data, title) {
    let markdown = `# ${title}\n\n`;
    markdown += `Generated: ${new Date().toISOString()}\n\n`;

    if (Array.isArray(data)) {
      data.forEach(item => {
        markdown += this.generateItemMarkdown(item);
      });
    } else if (typeof data === 'object') {
      markdown += this.generateItemMarkdown(data);
    }

    return markdown;
  }

  /**
   * Generate Markdown for individual item
   */
  generateItemMarkdown(item) {
    if (item.ruleNumber) {
      let markdown = `## Rule ${item.ruleNumber}\n\n`;
      markdown += `**Title:** ${item.title || 'Untitled'}\n\n`;
      markdown += `**Category:** ${item.category || 'Unknown'}\n\n`;
      markdown += `**URL:** [${item.url}](${item.url})\n\n`;
      
      if (item.content) {
        markdown += `### Content\n\n${item.content.substring(0, 1000)}...\n\n`;
      }

      markdown += '---\n\n';
      return markdown;
    } else {
      return `\`\`\`json\n${JSON.stringify(item, null, 2)}\n\`\`\`\n\n`;
    }
  }

  /**
   * Create backup of existing file
   */
  async backupFile(filePath) {
    try {
      if (await fs.pathExists(filePath)) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = `${filePath}.backup.${timestamp}`;
        await fs.copy(filePath, backupPath);
        this.logger.info(`Created backup: ${backupPath}`);
        return backupPath;
      }
      return null;
    } catch (error) {
      this.logger.error(`Failed to create backup of ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Clean up old backup files
   */
  async cleanupBackups(directory, maxAge = 7 * 24 * 60 * 60 * 1000) {
    try {
      const files = await fs.readdir(directory);
      const cutoffTime = Date.now() - maxAge;
      let cleaned = 0;

      for (const file of files) {
        if (file.includes('.backup.')) {
          const filePath = path.join(directory, file);
          const stats = await fs.stat(filePath);
          
          if (stats.mtime.getTime() < cutoffTime) {
            await fs.remove(filePath);
            cleaned++;
          }
        }
      }

      if (cleaned > 0) {
        this.logger.info(`Cleaned up ${cleaned} old backup files in ${directory}`);
      }

    } catch (error) {
      this.logger.error(`Failed to cleanup backups in ${directory}:`, error);
    }
  }

  /**
   * Get file size in human readable format
   */
  async getFileSize(filePath) {
    try {
      const stats = await fs.stat(filePath);
      return this.formatBytes(stats.size);
    } catch (error) {
      return 'Unknown';
    }
  }

  /**
   * Format bytes to human readable format
   */
  formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  /**
   * Generate summary report
   */
  async generateSummaryReport(data, outputDir) {
    try {
      const timestamp = new Date().toISOString();
      const summary = {
        generated_at: timestamp,
        total_rules: data.length,
        categories: this.getCategorySummary(data),
        statistics: this.getStatisticsSummary(data),
        files_generated: []
      };

      // Save summary as JSON
      const summaryPath = path.join(outputDir, 'summary.json');
      await this.saveJSON(summary, summaryPath);
      summary.files_generated.push(summaryPath);

      // Generate detailed HTML report
      const htmlPath = path.join(outputDir, 'report.html');
      await this.saveHTML(data, htmlPath, { title: 'CRC Scraper Report' });
      summary.files_generated.push(htmlPath);

      // Generate CSV export
      const csvPath = path.join(outputDir, 'rules.csv');
      const flattenedData = data.map(rule => this.flattenRuleData(rule));
      await this.saveCSV(flattenedData, csvPath);
      summary.files_generated.push(csvPath);

      // Generate Markdown report
      const markdownPath = path.join(outputDir, 'report.md');
      await this.saveMarkdown(data, markdownPath);
      summary.files_generated.push(markdownPath);

      this.logger.info(`Generated summary report with ${summary.files_generated.length} files`);
      return summary;

    } catch (error) {
      this.logger.error('Failed to generate summary report:', error);
      throw error;
    }
  }

  /**
   * Get category summary
   */
  getCategorySummary(data) {
    const categories = {};
    data.forEach(rule => {
      const category = rule.category || 'unknown';
      categories[category] = (categories[category] || 0) + 1;
    });
    return categories;
  }

  /**
   * Get statistics summary
   */
  getStatisticsSummary(data) {
    const stats = {
      total_content_length: 0,
      average_content_length: 0,
      total_word_count: 0,
      average_word_count: 0,
      rules_with_filing_analysis: 0
    };

    data.forEach(rule => {
      if (rule.content) {
        stats.total_content_length += rule.content.length;
      }
      if (rule.metadata && rule.metadata.word_count) {
        stats.total_word_count += rule.metadata.word_count;
      }
      if (rule.filing_question_analysis) {
        stats.rules_with_filing_analysis++;
      }
    });

    if (data.length > 0) {
      stats.average_content_length = Math.round(stats.total_content_length / data.length);
      stats.average_word_count = Math.round(stats.total_word_count / data.length);
    }

    return stats;
  }

  /**
   * Flatten rule data for CSV export
   */
  flattenRuleData(rule) {
    const flattened = {
      rule_number: rule.ruleNumber,
      title: rule.title,
      category: rule.category,
      url: rule.url,
      content_length: rule.content ? rule.content.length : 0,
      word_count: rule.metadata ? rule.metadata.word_count : 0
    };

    // Add filing question analysis flags
    if (rule.filing_question_analysis) {
      Object.keys(rule.filing_question_analysis).forEach(question => {
        const analysis = rule.filing_question_analysis[question];
        flattened[`${question}_answered`] = analysis.answers_question || false;
        flattened[`${question}_confidence`] = analysis.confidence_score || 0;
      });
    }

    return flattened;
  }

  /**
   * Ensure output directories exist
   */
  async ensureOutputDirectories() {
    try {
      const directories = Object.values(config.output.directories);
      for (const dir of directories) {
        await fs.ensureDir(dir);
      }
      this.logger.info('Ensured all output directories exist');
    } catch (error) {
      this.logger.error('Failed to ensure output directories:', error);
      throw error;
    }
  }
}

module.exports = FileUtils; 