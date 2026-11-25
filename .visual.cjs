const { chromium } = require('playwright-core');

(async () => {
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
  });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, serviceWorkers: 'block' });
  const page = await context.newPage();
  const bad = [];

  page.on('response', res => {
    if (res.status() >= 400) bad.push(res.status() + ' ' + res.url());
  });
  page.on('pageerror', e => console.log('PAGEERROR ' + e.message));

  await page.goto('http://127.0.0.1:3000/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-open-facility]');
  await page.waitForTimeout(1200);

  await page.screenshot({ path: '/tmp/csu-home.png', fullPage: false });

  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  console.log('HOME overflow: ' + JSON.stringify(overflow));

  const firstCard = page.locator('[data-facility="cg"]');
  if (await firstCard.count()) {
    await firstCard.screenshot({ path: '/tmp/csu-card.png' });
  }

  const lotCard = page.locator('[data-facility="lot21"]');
  if (await lotCard.count()) {
    await lotCard.screenshot({ path: '/tmp/csu-lot-card.png' });
  }

  await page.locator('[data-open-facility]').first().click();
  await page.waitForSelector('[data-booking-page]');
  await page.waitForTimeout(400);
  await page.screenshot({ path: '/tmp/csu-booking.png', fullPage: true });

  await page.locator('#confirm-booking').click();
  await page.waitForSelector('#qr-code svg', { timeout: 6000 });
  await page.waitForTimeout(600);
  await page.screenshot({ path: '/tmp/csu-confirmation.png', fullPage: true });

  await page.locator('[data-action="confirmation-back"]').click();
  await page.waitForSelector('[data-report]');
  await page.locator('[data-report]').first().click();
  await page.waitForSelector('[data-modal="report"]');
  await page.waitForTimeout(400);
  await page.screenshot({ path: '/tmp/csu-report.png' });
  await page.locator('[data-modal="report"] [data-modal-close]').first().click();

  await page.locator('#spot-saver-btn').click();
  await page.waitForSelector('[data-modal="spot-saver"]');
  await page.waitForTimeout(400);
  await page.screenshot({ path: '/tmp/csu-spot.png' });
  await page.locator('[data-modal="spot-saver"] [data-modal-close]').first().click();

  await page.locator('[data-view="map"]').click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: '/tmp/csu-map.png' });
  await page.locator('[data-pin-toggle="cg"]').click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: '/tmp/csu-map-pin.png' });

  await page.locator('#permits-btn').click();
  await page.waitForSelector('[data-modal="permits"]');
  await page.waitForTimeout(400);
  await page.screenshot({ path: '/tmp/csu-permits.png' });

  const desktopContext = await browser.newContext({ viewport: { width: 1100, height: 900 }, deviceScaleFactor: 1, serviceWorkers: 'block' });
  const desktopPage = await desktopContext.newPage();
  await desktopPage.goto('http://127.0.0.1:3000/', { waitUntil: 'domcontentloaded' });
  await desktopPage.waitForSelector('[data-open-facility]');
  await desktopPage.waitForTimeout(800);
  await desktopPage.screenshot({ path: '/tmp/csu-desktop.png' });
  await desktopContext.close();

  console.log('BAD RESPONSES: ' + JSON.stringify(bad, null, 2));
  await browser.close();
})();
