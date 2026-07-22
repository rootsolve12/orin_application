const { By } = require('selenium-webdriver');
const DriverFactory = require('./utils/driverFactory');
const config = require('./config/framework.config');

async function check() {
  console.log('Starting Mobile Layout Diagnostic (390px Viewport) with Login...');
  const driver = await DriverFactory.create('chrome', true);
  try {
    // 1. Log in first
    console.log('Navigating to login page...');
    await driver.get(`${config.baseUrl}/login`);
    await driver.sleep(2000);
    
    console.log('Entering credentials...');
    await driver.findElement(By.css('input[type="email"]')).sendKeys('testuser@srmist.edu.in');
    await driver.findElement(By.css('input[type="password"]')).sendKeys('Test@1234');
    
    console.log('Clicking Sign In...');
    await driver.findElement(By.css('button[type="submit"]')).click();
    await driver.sleep(5000); // Wait for auth and home load
    
    const routes = [
      '/',
      '/explore',
      '/profile',
      '/communities',
      '/team',
      '/my-events',
      '/organizer',
      '/organizer/create',
      '/support',
      '/settings',
      '/certificates',
      '/portfolio',
      '/onboarding',
      '/privacy-policy',
      '/terms-of-service'
    ];
    
    for (const r of routes) {
      const url = `${config.baseUrl}${r}`;
      console.log(`Navigating to route: ${r}`);
      await driver.get(url);
      await driver.sleep(3000); // Wait for page API data and layout paint
      
      const currentUrl = await driver.getCurrentUrl();
      console.log(`  - Actual URL: ${currentUrl}`);
      
      // Get browser console logs
      const logs = await driver.manage().logs().get('browser');
      if (logs && logs.length > 0) {
        console.log('  - Console Logs:');
        logs.forEach(log => {
          console.log(`    [${log.level.name}] ${log.message}`);
        });
      }
      
      if (currentUrl.includes('/login') && r !== '/login') {
        console.log(`  - Warning: Redirected to /login. Skip check.`);
        continue;
      }
      
      const scrollWidth = await driver.executeScript('return document.documentElement.scrollWidth;');
      const clientWidth = await driver.executeScript('return document.documentElement.clientWidth;');
      const bodyScrollWidth = await driver.executeScript('return document.body.scrollWidth;');
      
      const overflow = Math.max(0, scrollWidth - clientWidth);
      const bodyOverflow = Math.max(0, bodyScrollWidth - clientWidth);
      
      console.log(`  - Document: clientWidth=${clientWidth}, scrollWidth=${scrollWidth}, overflow=${overflow}`);
      console.log(`  - Body: scrollWidth=${bodyScrollWidth}, overflow=${bodyOverflow}`);
    }
  } catch (err) {
    console.error('Error during diagnostic:', err);
  } finally {
    await driver.quit();
    console.log('Diagnostic finished.');
  }
}
check();
