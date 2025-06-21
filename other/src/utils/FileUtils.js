const fs = require('fs').promises;
const path = require('path');
const Logger = require('./Logger');

class FileUtils {
  static async ensureDirectoryExists(dirPath) {
    try {
      await fs.mkdir(dirPath, { recursive: true });
      return true;
    } catch (error) {
      Logger.error(`Failed to create directory ${dirPath}: ${error.message}`);
      return false;
    }
  }

  static async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  static async getFileStats(filePath) {
    try {
      return await fs.stat(filePath);
    } catch (error) {
      Logger.error(`Failed to get file stats for ${filePath}: ${error.message}`);
      return null;
    }
  }

  static async readJsonFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      Logger.error(`Failed to read JSON file ${filePath}: ${error.message}`);
      return null;
    }
  }

  static async writeJsonFile(filePath, data) {
    try {
      await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
      return true;
    } catch (error) {
      Logger.error(`Failed to write JSON file ${filePath}: ${error.message}`);
      return false;
    }
  }

  static async getFilesInDirectory(dirPath, extension = null) {
    try {
      const files = await fs.readdir(dirPath);
      
      if (extension) {
        return files.filter(file => file.endsWith(extension));
      }
      
      return files;
    } catch (error) {
      Logger.error(`Failed to read directory ${dirPath}: ${error.message}`);
      return [];
    }
  }

  static async getFileAge(filePath) {
    try {
      const stats = await fs.stat(filePath);
      const ageInMs = Date.now() - stats.mtime.getTime();
      const ageInHours = ageInMs / (1000 * 60 * 60);
      return ageInHours;
    } catch (error) {
      Logger.error(`Failed to get file age for ${filePath}: ${error.message}`);
      return Infinity;
    }
  }

  static async deleteFile(filePath) {
    try {
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      Logger.error(`Failed to delete file ${filePath}: ${error.message}`);
      return false;
    }
  }

  static generateRuleFilename(section, index) {
    const sectionNum = section.ruleNumber.replace(/[^0-9.]/g, '');
    const timestamp = new Date().toISOString().slice(0, 10);
    return `ccp_section_${sectionNum}_${timestamp}_${index}.pdf`;
  }

  static async verifyPDFContent(filePath) {
    try {
      // Check if file exists and has reasonable size
      const stats = await fs.stat(filePath);
      if (stats.size < 1000) { // Less than 1KB is likely not a real PDF
        return false;
      }

      // Read first few bytes to check PDF header
      const fileHandle = await fs.open(filePath, 'r');
      const buffer = Buffer.alloc(10);
      await fileHandle.read(buffer, 0, 10, 0);
      await fileHandle.close();
      
      const header = buffer.toString('ascii', 0, 4);
      if (header !== '%PDF') {
        return false;
      }

      // Quick content check using PyMuPDF to see if it contains error messages
      return new Promise((resolve) => {
        const { spawn } = require('child_process');
        const pythonScript = `
import fitz
import sys
import os

try:
    doc = fitz.open("${filePath}")
    if len(doc) == 0:
        print("INVALID")
        sys.exit(1)
    
    # Get first page text
    page_text = doc[0].get_text().lower()
    doc.close()
    
    # Check for error indicators
    error_indicators = [
        "required pdf file not available",
        "please try again sometime later",
        "code: select code",
        "search phrase:",
        "bill information",
        "california law",
        "publications",
        "other resources"
    ]
    
    if any(indicator in page_text for indicator in error_indicators):
        print("ERROR_PAGE")
    else:
        print("VALID")
        
except Exception as e:
    print("INVALID")
`;
        
        const pythonProcess = spawn('python3', ['-c', pythonScript]);
        let output = '';
        
        pythonProcess.stdout.on('data', (data) => {
          output += data.toString().trim();
        });
        
        pythonProcess.on('close', (code) => {
          resolve(output === 'VALID');
        });
        
        // Timeout after 5 seconds
        setTimeout(() => {
          pythonProcess.kill();
          resolve(false);
        }, 5000);
      });
      
    } catch (error) {
      Logger.warning(`PDF verification error: ${error.message}`);
      return false;
    }
  }

  static async shouldDownloadPDFs(downloadDir) {
    try {
      // Check if download directory exists and has CCP section PDFs
      const files = await this.getFilesInDirectory(downloadDir);
      const ccpSectionPdfFiles = files.filter(file => file.endsWith('.pdf') && file.startsWith('ccp_section_'));
      
      if (ccpSectionPdfFiles.length === 0) {
        Logger.info('No existing CCP section PDFs found. Will download fresh copies.');
        return true;
      }
      
      // Check the age of the newest CCP section PDF file
      let newestTime = 0;
      for (const file of ccpSectionPdfFiles) {
        const filePath = path.join(downloadDir, file);
        const stats = await fs.stat(filePath);
        if (stats.mtime.getTime() > newestTime) {
          newestTime = stats.mtime.getTime();
        }
      }
      
      const hoursOld = (Date.now() - newestTime) / (1000 * 60 * 60);
      Logger.info(`Newest CCP section PDF is ${hoursOld.toFixed(1)} hours old`);
      
      if (hoursOld > 24) {
        Logger.info('CCP section PDFs are older than 24 hours. Will download fresh copies.');
        return true;
      } else {
        Logger.info('CCP section PDFs are recent. Will use existing files.');
        return false;
      }
      
    } catch (error) {
      Logger.warning('Error checking PDF age. Will download fresh copies.');
      return true;
    }
  }
}

module.exports = FileUtils; 