const { HierarchicalPDFScraper } = require('./hierarchial_scraper.js');

async function testCCPScraper() {
  console.log('🧪 Testing CCP PDF-First Scraper...\n');
  
  const scraper = new HierarchicalPDFScraper({
    downloadDir: './test_pdfs',
    outputDir: './test_results',
    delay: 2000,
    maxConcurrent: 1
  });

  try {
    console.log('📋 Testing TOC PDF download...');
    
    // Test the new PDF-first approach
    await scraper.initialize();
    
        // Test Step 1: Download TOC PDF
    console.log('\n🔍 Step 1: Testing TOC PDF download...'); 
    const tocPdfPath = await scraper.downloadTocPDF();
    
    console.log(`DEBUG: tocPdfPath = ${tocPdfPath}`);
    console.log(`DEBUG: typeof tocPdfPath = ${typeof tocPdfPath}`);
    
    if (tocPdfPath) {
      console.log(`✅ TOC PDF downloaded successfully: ${tocPdfPath}`);
      
      // Test Step 2: Extract section links from TOC PDF
      console.log('\n🔍 Step 2: Testing section link extraction...');
      try {
        const allSectionLinks = await scraper.extractSectionLinksFromTocPDF(tocPdfPath);
        console.log(`✅ Extracted ${allSectionLinks.length} section links from TOC PDF`);
        
        if (allSectionLinks.length > 0) {
          console.log('\n📄 Sample sections found:');
          allSectionLinks.slice(0, 10).forEach((section, index) => {
            console.log(`  ${index + 1}. Section ${section.ruleNumber}: ${section.title.substring(0, 60)}...`);
            console.log(`     URL: ${section.url}`);
            console.log(`     Source: ${section.source}`);
            console.log('');
          });
          
          // Test Step 3: Filter for filing-related sections
          console.log('\n🔍 Step 3: Testing filing-related filtering...');
          const filingRelatedLinks = scraper.filterFilingRelatedSections(allSectionLinks);
          console.log(`✅ Filtered to ${filingRelatedLinks.length} filing-related sections`);
          
          if (filingRelatedLinks.length > 0) {
            console.log('\n📋 Filing-related sections:');
            filingRelatedLinks.slice(0, 5).forEach((section, index) => {
              console.log(`  ${index + 1}. Section ${section.ruleNumber}: ${section.title.substring(0, 60)}...`);
            });
            
            // Test one individual section download
            console.log('\n🔍 Step 4: Testing individual section PDF download...');
            try {
              const testSection = filingRelatedLinks[0];
              const result = await scraper.downloadIndividualRulePDF(testSection, 0);
              
              if (result) {
                console.log(`✅ Successfully downloaded PDF for section ${testSection.ruleNumber}`);
                console.log(`   File: ${result.pdfPath}`);
                console.log(`   Rule data: ${JSON.stringify(result.ruleData, null, 2)}`);
              } else {
                console.log(`⚠️  Failed to download PDF for section ${testSection.ruleNumber}`);
              }
              
            } catch (error) {
              console.log(`❌ Error testing individual download: ${error.message}`);
            }
          }
        }
        
      } catch (error) {
        console.log(`❌ Error extracting section links: ${error.message}`);
      }
      
    } else {
      console.log('❌ Failed to download TOC PDF');
    }
    
    console.log('\n🎉 CCP PDF-First Scraper test completed!');
    
  } catch (error) {
    console.error('❌ CCP PDF-First Scraper test failed:', error);
  }
}

// Run the test
if (require.main === module) {
  testCCPScraper();
}

module.exports = { testCCPScraper }; 