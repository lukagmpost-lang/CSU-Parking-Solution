const { chromium } = require('playwright-core');
const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:3000/';

(async () => {
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
  });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    serviceWorkers: 'block',
  });
  const page = await context.newPage();

  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push('CONSOLE: ' + msg.text());
  });
  page.on('dialog', dialog => dialog.accept());

  const step = async (name, fn) => {
    try {
      await fn();
      console.log('PASS ' + name);
    } catch (e) {
      console.log('FAIL ' + name + ' -> ' + e.message.split('\n')[0]);
    }
  };

  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'domcontentloaded' });

  let bookingCode = '';

  await step('home renders facilities', async () => {
    await page.waitForSelector('[data-open-facility]', { timeout: 8000 });
    const n = await page.locator('[data-open-facility]').count();
    console.log('  facilities: ' + n);
    if (n < 5) throw new Error('only ' + n + ' reserve buttons');
  });

  await step('permits modal opens and closes', async () => {
    await page.locator('#permits-btn').click();
    await page.waitForSelector('[data-modal="permits"]', { timeout: 5000 });
    const title = (await page.locator('#permits-title').textContent()).trim();
    if (title !== 'Permits & Rates') throw new Error('wrong modal title: ' + title);
    await page.locator('[data-modal="permits"] [data-modal-close="permits"]').click();
    await page.waitForTimeout(300);
    if (await page.locator('[data-modal="permits"]').count()) throw new Error('modal did not close');
  });

  await step('map pin opens tooltip', async () => {
    await page.locator('[data-view="map"]').click();
    await page.waitForSelector('#map-container', { timeout: 5000 });
    const pins = await page.locator('.pin-marker').count();
    console.log('  pins: ' + pins);
    if (pins !== 12) throw new Error('expected 12 pins, got ' + pins);
    await page.locator('[data-pin-toggle="cg"]').click();
    await page.waitForTimeout(300);
    const expanded = await page.locator('[data-pin-toggle="cg"]').getAttribute('aria-expanded');
    if (expanded !== 'true') throw new Error('pin tooltip did not open');
    const reserveVisible = await page.locator('[data-pin="cg"] [data-open-facility="cg"]').isVisible();
    if (!reserveVisible) throw new Error('pin actions are not visible');
    await page.locator('#map-container').click({ position: { x: 8, y: 8 } });
    await page.waitForTimeout(200);
    await page.locator('[data-view="list"]').click();
    await page.waitForTimeout(300);
  });

  await step('open booking page', async () => {
    await page.locator('[data-open-facility]').first().click();
    await page.waitForSelector('[data-booking-page]', { timeout: 5000 });
    const h1 = (await page.locator('h1').first().textContent()).trim();
    console.log('  header: ' + h1);
    if (h1 !== 'Reserve Spot') throw new Error('wrong header: ' + h1);
  });

  await step('pricing + permit selection', async () => {
    await page.locator('#duration-buttons button[data-duration="8"]').click();
    const visitorPrice = (await page.locator('#price-display').textContent()).trim();
    console.log('  visitor 8h price: $' + visitorPrice);
    if (visitorPrice !== '24') throw new Error('expected daily cap 24, got ' + visitorPrice);

    await page.locator('#permit-buttons button[data-permit="Green"]').click();
    const permitPrice = (await page.locator('#price-display').textContent()).trim();
    const rate = (await page.locator('#rate-display').textContent()).trim();
    const note = (await page.locator('#permit-note').textContent()).trim();
    console.log('  green price: $' + permitPrice + ' / rate=' + rate);
    console.log('  note: ' + note);
    if (permitPrice !== '0') throw new Error('permit price should be 0');
    if (rate !== 'Prepaid') throw new Error('rate should be Prepaid');
    if (!note.includes('278')) throw new Error('missing semester permit price');
  });

  await step('selections survive 8 seconds', async () => {
    await page.locator('#permit-buttons button[data-permit="Visitor"]').click();
    await page.locator('#duration-buttons button[data-duration="8"]').click();
    await page.waitForTimeout(8000);
    const dur = await page.locator('#duration-buttons button[data-duration="8"]').getAttribute('class');
    const permit = await page.locator('#permit-buttons button[data-permit="Visitor"]').getAttribute('class');
    if (!dur.includes('border-csu-green')) throw new Error('duration reset');
    if (!permit.includes('border-csu-green')) throw new Error('permit reset');
  });

  await step('submit booking + QR renders', async () => {
    await page.locator('#vehicle-input').fill('TEST-123');
    await page.locator('#confirm-booking').click();
    await page.waitForSelector('[data-confirmation-page]', { timeout: 6000 });
    await page.waitForSelector('#qr-code svg', { timeout: 6000 });
    bookingCode = (await page.locator('.font-mono.text-3xl').first().textContent()).trim();
    const qrBox = await page.locator('#qr-code svg').boundingBox();
    console.log('  code=' + bookingCode + ' qr=' + Math.round(qrBox.width) + 'x' + Math.round(qrBox.height));
    if (!/^[A-Z0-9]{6}$/.test(bookingCode)) throw new Error('bad code: ' + bookingCode);
    if (qrBox.width < 100) throw new Error('QR too small');
    if ((await page.locator('text=Cancelled').count()) > 0) throw new Error('new booking cancelled');
  });

  await step('copy code', async () => {
    const before = errors.length;
    await page.locator('[data-action="copy-code"]').click();
    await page.waitForTimeout(400);
    const newErrors = errors.slice(before);
    if (newErrors.length) throw new Error(newErrors.join(' | '));
    const toast = await page.locator('text=Booking code copied').count();
    if (!toast) throw new Error('no copy toast');
  });

  await step('extend +1 hour', async () => {
    const before = (await page.locator('#time-remaining').textContent()).trim();
    await page.locator('[data-action="extend"][data-hours="1"]').click();
    await page.waitForTimeout(1000);
    const after = (await page.locator('#time-remaining').textContent()).trim();
    const duration = (await page.locator('text=9 hours').count());
    console.log('  before=' + before + ' after=' + after);
    if (before === after) throw new Error('time did not change');
    if (!duration) throw new Error('duration did not become 9 hours');
  });

  await step('lookup wrong code shows error', async () => {
    await page.locator('[data-action="confirmation-back"]').click();
    await page.waitForSelector('#reservation-lookup-btn', { timeout: 5000 });
    await page.locator('#reservation-lookup-btn').click();
    await page.waitForSelector('#code-input', { timeout: 5000 });
    await page.locator('#code-input').fill('ZZZZZZ');
    await page.locator('#lookup-submit').click();
    await page.waitForSelector('#lookup-error:not(.hidden)', { timeout: 3000 });
    const error = (await page.locator('#lookup-error').textContent()).trim();
    console.log('  error: ' + error);
    if (!error.includes('No reservation found')) throw new Error('wrong error');
  });

  await step('lookup valid code opens confirmation', async () => {
    await page.locator('#code-input').fill(bookingCode);
    await page.locator('#lookup-submit').click();
    await page.waitForSelector('#qr-code svg', { timeout: 6000 });
    const shown = (await page.locator('.font-mono.text-3xl').first().textContent()).trim();
    if (shown !== bookingCode) throw new Error('wrong code shown: ' + shown);
  });

  await step('cancel shows cancelled state and hides QR', async () => {
    await page.locator('[data-action="cancel-booking"]').click();
    await page.waitForTimeout(800);
    const cancelled = await page.locator('text=Cancelled').count();
    const qr = await page.locator('#qr-code').count();
    console.log('  cancelled=' + cancelled + ' qr=' + qr);
    if (!cancelled) throw new Error('no cancelled status');
    if (qr) throw new Error('QR still visible after cancel');
  });

  await step('report modal submits and closes', async () => {
    await page.locator('[data-action="done"]').click();
    await page.waitForSelector('[data-report]', { timeout: 5000 });
    await page.locator('[data-report]').first().click();
    await page.waitForSelector('[data-modal="report"]', { timeout: 5000 });
    await page.locator('[data-issue="lot_full"]').click();
    await page.locator('#submit-report').click();
    await page.waitForTimeout(1200);
    const open = await page.locator('[data-modal="report"]').count();
    if (open > 0) throw new Error('report modal did not close');
  });

  await step('saved spot creates and clears', async () => {
    await page.locator('#spot-saver-btn').click();
    await page.waitForSelector('[data-modal="spot-saver"]', { timeout: 5000 });
    await page.locator('#spot-saver-form input[name="spot"]').fill('12');
    await page.locator('#spot-saver-form input[name="floor"]').fill('3');
    await page.locator('#spot-saver-form button[type="submit"]').click();
    await page.waitForTimeout(800);
    const savedLabel = await page.locator('text=Saved:').count();
    if (!savedLabel) throw new Error('saved spot label missing');
    console.log('  saved label visible');
    await page.locator('#spot-saver-btn').click();
    await page.waitForSelector('#clear-spot', { timeout: 5000 });
    await page.locator('#clear-spot').click();
    await page.waitForTimeout(800);
    const cleared = await page.locator('text=Saved:').count();
    if (cleared) throw new Error('saved spot did not clear');
  });

  await step('search keeps focus', async () => {
    await page.locator('#search-input').fill('garage');
    await page.waitForTimeout(700);
    const focused = await page.evaluate(() => document.activeElement && document.activeElement.id);
    console.log('  focused: ' + focused);
    if (focused !== 'search-input') throw new Error('search lost focus');
    await page.locator('#search-input').fill('');
    await page.waitForTimeout(500);
  });

  console.log('\n--- ERRORS (' + errors.length + ') ---');
  errors.forEach(e => console.log(e));

  await browser.close();
})();
