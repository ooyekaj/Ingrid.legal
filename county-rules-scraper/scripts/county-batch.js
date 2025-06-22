#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const { program } = require('commander');

const CountyConfigs = require('../src/config/CountyConfigs');
const CountyScraperMain = require('./main');
const VariationAnalyzer = require('../src/processors/VariationAnalyzer');

class CountyBatchProcessor {
  constructor() {
    this.countyConfigs = new CountyConfigs();
    this.scraper = new CountyScraperMain();
    this.variationAnalyzer = new VariationAnalyzer();
    this.outputDir = path.join(process.cwd(), 'results');
    this.batchResults = [];
  }

  async processAllCounties(options = {}) {
    console.log('\n🏛️  California County Rules Batch Scraper');
    console.log('📅 Started at:', new Date().toLocaleString());
    
    const counties = this.getPriorityCounties(options);
    console.log(`📋 Processing ${counties.length} counties...`);

    // Initialize
    await this.scraper.initialize();
    
    const startTime = Date.now();
    let successCount = 0;
    let failureCount = 0;

    for (let i = 0; i < counties.length; i++) {
      const county = counties[i];
      console.log(`\n📍 [${i + 1}/${counties.length}] Processing ${county.name}...`);
      
      try {
        const result = await this.processCounty(county, options);
        this.batchResults.push(result);
        
        if (result.success) {
          successCount++;
          console.log(`✅ ${county.name} completed successfully`);
        } else {
          failureCount++;
          console.log(`❌ ${county.name} failed: ${result.error}`);
        }

        // Respectful delay between counties
        if (i < counties.length - 1) {
          const delay = options.delay || 10000; // 10 seconds default
          console.log(`⏳ Waiting ${delay/1000}s before next county...`);
          await this.sleep(delay);
        }

      } catch (error) {
        console.error(`💥 Error processing ${county.name}:`, error);
        failureCount++;
        this.batchResults.push({
          county: county.name,
          error: error.message,
          success: false
        });
      }
    }

    const totalTime = (Date.now() - startTime) / 1000;
    
    // Generate batch analysis
    await this.generateBatchAnalysis(options);
    
    // Final summary
    console.log(`\n📊 Batch Processing Complete!`);
    console.log(`⏱️  Total Time: ${totalTime.toFixed(1)} seconds`);
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${failureCount}`);
    console.log(`📈 Success Rate: ${((successCount / counties.length) * 100).toFixed(1)}%`);
    
    return this.batchResults;
  }

  async processCounty(county, options) {
    try {
      const result = await this.scraper.scrapeCounty(county.name, {
        analyzeOrders: options.analyzeOrders,
        analyzeCrossReferences: options.analyzeCrossReferences
      });
      
      return {
        ...result,
        priority: county.priority,
        reason: county.reason,
        processed_at: new Date().toISOString()
      };
      
    } catch (error) {
      return {
        county: county.name,
        priority: county.priority,
        error: error.message,
        success: false,
        processed_at: new Date().toISOString()
      };
    }
  }

  getPriorityCounties(options) {
    let counties = this.countyConfigs.getPriorityCounties();
    
    // Filter by specific counties if provided
    if (options.counties && options.counties.length > 0) {
      const selectedCounties = options.counties.map(c => c.toLowerCase());
      counties = counties.filter(county => 
        selectedCounties.includes(county.name.toLowerCase())
      );
    }
    
    // Limit count if specified
    if (options.limit && options.limit > 0) {
      counties = counties.slice(0, options.limit);
    }
    
    return counties;
  }

  async generateBatchAnalysis(options) {
    console.log('\n🔍 Generating batch analysis...');
    
    const analysis = {
      batch_summary: this.createBatchSummary(),
      county_comparisons: await this.compareCounties(),
      variation_analysis: await this.analyzeVariations(),
      aggregated_insights: this.generateAggregatedInsights(),
      recommendations: this.generateRecommendations()
    };

    // Save batch analysis
    const timestamp = new Date().toISOString().split('T')[0];
    const analysisFile = path.join(this.outputDir, `batch_analysis_${timestamp}.json`);
    
    await fs.writeJson(analysisFile, {
      batch_results: this.batchResults,
      analysis: analysis,
      generated_at: new Date().toISOString()
    }, { spaces: 2 });

    // Generate comparative report
    await this.generateComparativeReport(analysis, analysisFile);
    
    console.log(`💾 Batch analysis saved: ${analysisFile}`);
  }

  createBatchSummary() {
    const successful = this.batchResults.filter(r => r.success);
    const failed = this.batchResults.filter(r => !r.success);
    
    return {
      total_counties: this.batchResults.length,
      successful_counties: successful.length,
      failed_counties: failed.length,
      success_rate: `${((successful.length / this.batchResults.length) * 100).toFixed(1)}%`,
      total_documents: successful.reduce((sum, r) => sum + (r.documents || 0), 0),
      average_documents_per_county: successful.length > 0 ? 
        Math.round(successful.reduce((sum, r) => sum + (r.documents || 0), 0) / successful.length) : 0,
      failed_counties_list: failed.map(f => ({ county: f.county, reason: f.error }))
    };
  }

  async compareCounties() {
    const successful = this.batchResults.filter(r => r.success);
    const comparisons = {};
    
    for (const result of successful) {
      try {
        // Load detailed results for comparison
        const resultFile = result.outputFile;
        if (resultFile && await fs.pathExists(resultFile)) {
          const data = await fs.readJson(resultFile);
          
          comparisons[result.county] = {
            document_count: data.scraping_results.documents.length,
            success_rate: data.scraping_results.stats.success_rate,
            high_priority_count: data.analysis.high_priority_docs.length,
            electronic_filing_docs: data.analysis.filing_procedures.electronic_filing.length,
            case_management_docs: data.analysis.filing_procedures.case_management.length,
            compliance_requirements: data.analysis.compliance_requirements.length,
            average_confidence: data.analysis.document_analysis.average_confidence
          };
        }
      } catch (error) {
        console.warn(`Could not load detailed data for ${result.county}`);
      }
    }
    
    return comparisons;
  }

  async analyzeVariations() {
    // This would integrate with the VariationAnalyzer
    const successful = this.batchResults.filter(r => r.success);
    
    const variations = {
      electronic_filing_differences: {},
      motion_practice_variations: {},
      case_management_differences: {},
      local_form_requirements: {},
      emergency_procedures: {}
    };

    // Basic variation analysis based on available data
    for (const result of successful) {
      variations.electronic_filing_differences[result.county] = {
        has_efiling_requirements: result.documents > 0 // Simplified
      };
    }

    return variations;
  }

  generateAggregatedInsights() {
    const successful = this.batchResults.filter(r => r.success);
    
    return {
      most_productive_counties: successful
        .sort((a, b) => (b.documents || 0) - (a.documents || 0))
        .slice(0, 5)
        .map(r => ({ county: r.county, documents: r.documents })),
      
      counties_needing_attention: this.batchResults
        .filter(r => !r.success)
        .map(r => ({ county: r.county, issue: r.error })),
      
      processing_efficiency: {
        fastest_counties: successful
          .filter(r => r.processing_time)
          .sort((a, b) => a.processing_time - b.processing_time)
          .slice(0, 3)
          .map(r => ({ county: r.county, time: r.processing_time })),
        
        slowest_counties: successful
          .filter(r => r.processing_time)
          .sort((a, b) => b.processing_time - a.processing_time)
          .slice(0, 3)
          .map(r => ({ county: r.county, time: r.processing_time }))
      }
    };
  }

  generateRecommendations() {
    const successful = this.batchResults.filter(r => r.success);
    const failed = this.batchResults.filter(r => !r.success);
    
    const recommendations = [];
    
    // Success rate recommendations
    if (failed.length > 0) {
      recommendations.push({
        type: 'TECHNICAL',
        priority: 'HIGH',
        title: 'Address Failed Counties',
        description: `${failed.length} counties failed to process. Review configurations and website accessibility.`,
        counties: failed.map(f => f.county),
        action: 'Update county configurations and retry failed counties'
      });
    }
    
    // Low document count recommendations
    const lowCountCounties = successful.filter(r => (r.documents || 0) < 10);
    if (lowCountCounties.length > 0) {
      recommendations.push({
        type: 'CONFIGURATION',
        priority: 'MEDIUM',
        title: 'Optimize Low-Yield Counties',
        description: 'Some counties returned fewer documents than expected.',
        counties: lowCountCounties.map(c => c.county),
        action: 'Review and enhance discovery patterns for these counties'
      });
    }
    
    // Processing efficiency recommendations
    recommendations.push({
      type: 'PERFORMANCE',
      priority: 'LOW',
      title: 'Batch Processing Optimization',
      description: 'Consider parallel processing for improved efficiency',
      action: 'Implement county-specific rate limiting and parallel processing'
    });

    return recommendations;
  }

  async generateComparativeReport(analysis, analysisFile) {
    const reportFile = analysisFile.replace('.json', '_report.md');
    
    const report = `
# California Counties Court Rules Comparative Analysis

**Generated:** ${new Date().toLocaleString()}  
**Counties Processed:** ${analysis.batch_summary.total_counties}  
**Success Rate:** ${analysis.batch_summary.success_rate}  
**Total Documents:** ${analysis.batch_summary.total_documents}  

## Executive Summary

This comparative analysis examines court rules and procedures across ${analysis.batch_summary.successful_counties} California counties, identifying variations in filing procedures, electronic filing requirements, and local practice differences.

## Processing Summary

- **Successfully Processed:** ${analysis.batch_summary.successful_counties} counties
- **Failed to Process:** ${analysis.batch_summary.failed_counties} counties
- **Average Documents per County:** ${analysis.batch_summary.average_documents_per_county}

### Failed Counties
${analysis.batch_summary.failed_counties_list.map(f => 
  `- **${f.county}**: ${f.reason}`
).join('\n')}

## Most Productive Counties

${analysis.aggregated_insights.most_productive_counties.map((county, index) => 
  `${index + 1}. **${county.county}** - ${county.documents} documents`
).join('\n')}

## County Comparisons

${Object.entries(analysis.county_comparisons).map(([county, data]) => 
  `### ${county}
- Documents Found: ${data.document_count}
- Success Rate: ${data.success_rate}
- High Priority Documents: ${data.high_priority_count}
- Electronic Filing Documents: ${data.electronic_filing_docs}
- Compliance Requirements: ${data.compliance_requirements}
- Average Confidence: ${data.average_confidence}%`
).join('\n\n')}

## Recommendations

${analysis.recommendations.map((rec, index) => 
  `### ${index + 1}. ${rec.title} (${rec.priority} Priority)
**Type:** ${rec.type}  
**Description:** ${rec.description}  
**Action:** ${rec.action}  
${rec.counties ? `**Affected Counties:** ${rec.counties.join(', ')}` : ''}`
).join('\n\n')}

## Next Steps

1. **Address Failed Counties**: Update configurations for counties that failed to process
2. **Enhance Low-Yield Counties**: Improve discovery patterns for counties with few documents
3. **Implement Variation Analysis**: Develop detailed comparison of procedural differences
4. **Create Practitioner Guides**: Generate county-specific guidance based on findings
5. **Schedule Regular Updates**: Establish automated re-scraping schedule

---

*This report was automatically generated by the California County Rules Batch Processor.*
    `.trim();

    await fs.writeFile(reportFile, report);
    console.log(`📋 Comparative report generated: ${reportFile}`);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// CLI Setup
program
  .name('batch-scraper')
  .description('California County Court Rules Batch Scraper')
  .version('1.0.0');

program
  .command('process')
  .description('Process multiple counties in batch')
  .option('-c, --counties <names...>', 'Specific counties to process (space-separated)')
  .option('-l, --limit <number>', 'Limit number of counties to process', parseInt)
  .option('-d, --delay <ms>', 'Delay between counties in milliseconds', parseInt, 10000)
  .option('-o, --analyze-orders', 'Perform detailed order analysis')
  .option('-x, --analyze-cross-references', 'Analyze cross-references between documents')
  .action(async (options) => {
    const processor = new CountyBatchProcessor();
    
    try {
      await processor.processAllCounties(options);
      console.log('\n🎉 Batch processing completed successfully!');
    } catch (error) {
      console.error('\n💥 Batch processing failed:', error);
      process.exit(1);
    }
  });

program
  .command('priority')
  .description('Show priority counties list')
  .action(() => {
    const processor = new CountyBatchProcessor();
    const counties = processor.getPriorityCounties();
    
    console.log('\n🏛️  Priority Counties for Processing:');
    counties.forEach(county => {
      console.log(`${county.priority}. ${county.name} - ${county.reason}`);
    });
  });

// Run if called directly
if (require.main === module) {
  program.parse();
}

module.exports = CountyBatchProcessor; 