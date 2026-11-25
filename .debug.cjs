const { chromium } = require('playwright-core');

(async () => {
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
  });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
  const page = await context.newPage();
  page.on('pageerror', e => console.log('PAGEERROR: ' + e.stack));
  page.on('console', msg => console.log('CONSOLE[' + msg.type() + ']: ' + msg.text()));

  await page.goto('http://127.0.0.1:3000/', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-open-facility]');
  await page.evaluate(() => localStorage.clear());

  console.log('\nBEFORE CLICK:');
  console.log('  booking pages:', await page.locator('[data-booking-page]').count());
  console.log('  reserve btn outer:', (await page.locator('[data-open-facility]').first().evaluate(el => el.outerHTML)).slice(0, 220));
  console.log('  onclick present?', await page.locator('[data-open-facility]').first().evaluate(el => !!el.onclick));

  console.log('\nCLICKING...');
  await page.locator('[data-open-facility]').first().click();
  await page.waitForTimeout(1500);
  console.log('  booking pages after:', await page.locator('[data-booking-page]').count());
  console.log('  h1s:', await page.locator('h1').allTextContents());
  console.log('  body text head:', (await page.locator('body').innerText()).slice(0, 200).replace(/\n/g, ' | '));

  await browser.close();
})();
