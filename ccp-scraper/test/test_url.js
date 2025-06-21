const { chromium } = require('playwright');

async function testURL() {
  const browser = await chromium.launch({ headless: false }); // Show browser
  const page = await browser.newPage();
  
  try {
    console.log('Testing URL...');
    
    await page.goto('https://leginfo.legislature.ca.gov/faces/codedisplayexpand.xhtml?tocCode=CCP', {
      waitUntil: 'domcontentloaded',
      timeout: 10000
    });
    
    console.log('✅ Page loaded!');
    console.log('Title:', await page.title());
    
    // Take screenshot
    await page.screenshot({ path: 'test_page.png' });
    console.log('📸 Screenshot saved as test_page.png');
    
    await browser.close();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await browser.close();
  }
}

testURL();