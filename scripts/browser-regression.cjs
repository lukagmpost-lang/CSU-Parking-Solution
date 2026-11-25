const assert = require('node:assert/strict');
const { chromium } = require('playwright-core');

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:3000/';
const CHROME_PATH = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

async function closeModalWithEscape(page, modalName) {
  await page.keyboard.press('Escape');
  await page.locator(`[data-modal="${modalName}"]`).waitFor({ state: 'detached' });
}

async function returnHome(page) {
  const back = page.locator('[data-action="confirmation-back"]');
  if (await back.count()) await back.click();
  await page.locator('#reservation-lookup-btn').waitFor();
}

async function main() {
  const browser = await chromium.launch({ executablePath: CHROME_PATH, headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    serviceWorkers: 'block',
  });
  const page = await context.newPage();
  const runtimeErrors = [];

  page.on('pageerror', error => runtimeErrors.push(error.message));
  page.on('dialog', dialog => dialog.accept());

  try {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.querySelectorAll('[data-open-facility]:not([disabled])').length > 0);

    await page.locator('[data-open-facility="cg"]').click();
    await page.locator('[data-duration="8"]').click();
    await page.locator('#confirm-booking').click();
    await page.locator('#qr-code svg').waitFor();
    const bookingCode = (await page.locator('.font-mono.text-3xl').textContent()).trim();
    assert.match(bookingCode, /^[A-Z2-9]{6}$/);
    assert.match(await page.locator('[data-action="extend"][data-hours="1"]').textContent(), /\(\$0\)/);

    await returnHome(page);
    await page.locator('#reservation-lookup-btn').click();
    await page.locator('#code-input').fill('ZZZZZZ');
    await page.locator('#view-saved-booking').click();
    await page.locator('[data-confirmation-page]').waitFor();
    assert.equal((await page.locator('.font-mono.text-3xl').textContent()).trim(), bookingCode);
    assert.equal(await page.locator('[data-modal="reservation-lookup"]').count(), 0);
    console.log('PASS capped extension quote and saved-reservation View');

    await returnHome(page);
    await page.evaluate(code => {
      const bookings = JSON.parse(localStorage.getItem('csu-parking-bookings'));
      const booking = bookings.find(item => item.code === code);
      booking.expiresAt = Date.now() + 1200;
      booking.createdAt = Date.now() - booking.durationHours * 60 * 60 * 1000 + 1200;
      localStorage.setItem('csu-parking-bookings', JSON.stringify(bookings));
    }, bookingCode);
    await page.locator('#reservation-lookup-btn').click();
    await page.locator('#code-input').fill(bookingCode);
    await page.locator('#lookup-submit').click();
    await page.getByText('This reservation has expired.').waitFor({ timeout: 5000 });
    assert.equal(await page.locator('#qr-code').count(), 0);
    assert.equal(await page.locator('[data-action="extend"]').count(), 0);
    assert.equal((await page.locator('.status-badge').textContent()).trim(), 'Expired');

    await page.locator('[data-action="rebook"]').click();
    await page.locator('[data-booking-page]').waitFor();
    assert.match(await page.locator('h1 + p, header p').first().textContent(), /Central Garage/);
    await page.locator('[data-duration="24"]').click();
    await page.locator('#confirm-booking').click();
    await page.locator('[data-confirmation-page]').waitFor();
    assert.equal(await page.locator('[data-action="extend"]:not([disabled])').count(), 0);
    await page.getByText('The 24-hour reservation limit has been reached.').waitFor();
    console.log('PASS automatic expiration, rebooking, and 24-hour extension limit');

    await returnHome(page);
    await page.locator('#permits-btn').focus();
    await page.locator('#permits-btn').click();
    await page.locator('[data-modal="permits"]').waitFor();
    await page.waitForTimeout(50);
    assert.equal(await page.locator('main').evaluate(element => element.inert), true);
    assert.equal(await page.locator('.filter-bar').evaluate(element => element.inert), true);
    assert.equal(await page.locator('body').evaluate(element => element.classList.contains('modal-open')), true);
    assert.equal(await page.evaluate(() => document.activeElement.dataset.modalClose), 'permits');
    await page.keyboard.press('Shift+Tab');
    assert.equal(await page.evaluate(() => document.activeElement.textContent.trim()), 'Visitor & Event Parking');
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement.dataset.modalClose), 'permits');
    await closeModalWithEscape(page, 'permits');
    await page.waitForTimeout(20);
    assert.equal(await page.evaluate(() => document.activeElement.id), 'permits-btn');
    assert.equal(await page.locator('main').evaluate(element => element.inert), false);

    await page.locator('#reservation-lookup-btn').click();
    await page.waitForTimeout(100);
    assert.equal(await page.evaluate(() => document.activeElement.id), 'code-input');
    await closeModalWithEscape(page, 'reservation-lookup');
    await page.waitForTimeout(20);
    assert.equal(await page.evaluate(() => document.activeElement.id), 'reservation-lookup-btn');
    console.log('PASS modal focus trap, Escape, focus restoration, and background isolation');

    await page.goto(new URL('?report=true', BASE_URL).href, { waitUntil: 'domcontentloaded' });
    await page.locator('[data-modal="report"]').waitFor();
    await page.locator('#report-facility').waitFor();
    assert.equal(new URL(page.url()).search, '');
    await closeModalWithEscape(page, 'report');

    await page.goto(new URL('?save-spot=true', BASE_URL).href, { waitUntil: 'domcontentloaded' });
    await page.locator('[data-modal="spot-saver"]').waitFor();
    assert.equal(new URL(page.url()).search, '');
    await page.locator('.toggle-switch').click();
    assert.equal(await page.locator('#timer-toggle').isChecked(), true);
    await page.locator('#duration-input').fill('');
    await page.locator('#spot-saver-form button[type="submit"]').click();
    await page.locator('#spot-saver-error:not(.hidden)').waitFor();
    assert.match(await page.locator('#spot-saver-error').textContent(), /15 and 720 minutes/);
    console.log('PASS PWA shortcuts and inline timer validation');

    await page.locator('#duration-input').fill('120');
    await page.locator('input[name="spot"]').fill('12');
    await page.locator('input[name="notes"]').fill('Original note');
    await page.locator('#spot-saver-form button[type="submit"]').click();
    await page.locator('[data-modal="spot-saver"]').waitFor({ state: 'detached' });
    const originalExpiry = await page.evaluate(() => JSON.parse(localStorage.getItem('csu-parking-saved-spot')).timer.expiresAt);
    assert.match(await page.locator('p[title*="Central Garage"]').textContent(), /left/);

    await page.waitForTimeout(1100);
    await page.locator('#spot-saver-btn').click();
    await page.locator('input[name="notes"]').fill('Edited note');
    await page.locator('#spot-saver-form button[type="submit"]').click();
    await page.locator('[data-modal="spot-saver"]').waitFor({ state: 'detached' });
    const editedExpiry = await page.evaluate(() => JSON.parse(localStorage.getItem('csu-parking-saved-spot')).timer.expiresAt);
    assert.equal(editedExpiry, originalExpiry);
    await page.locator('#spot-saver-btn').click();
    await page.locator('#clear-spot').click();
    await page.locator('[data-modal="spot-saver"]').waitFor({ state: 'detached' });
    console.log('PASS saved-spot countdown display, edit preservation, and clearing');

    await page.locator('#open-only-toggle').check();
    await page.locator('[data-report="cg"]').click();
    await page.locator('[data-issue="lot_full"]').click();
    await page.evaluate(() => {
      window.__originalStorageSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key, value) {
        if (key === 'csu-parking-reports') throw new Error('Storage denied');
        return window.__originalStorageSetItem.call(this, key, value);
      };
    });
    await page.locator('#submit-report').click();
    await page.locator('#report-error:not(.hidden)').waitFor();
    assert.match(await page.locator('#report-error').textContent(), /could not save your report/);
    assert.equal(await page.locator('#submit-report').isEnabled(), true);
    await page.evaluate(() => {
      Storage.prototype.setItem = window.__originalStorageSetItem;
      delete window.__originalStorageSetItem;
    });
    await closeModalWithEscape(page, 'report');

    await page.locator('[data-report="cg"]').click();
    await page.locator('[data-issue="event_closure"]').click();
    await page.locator('#submit-report').click();
    await page.locator('[data-modal="report"]').waitFor({ state: 'detached' });
    await page.waitForFunction(() => !document.querySelector('[data-facility="cg"]'));
    await page.locator('#open-only-toggle').uncheck();
    await page.locator('[data-facility="cg"]').waitFor();
    assert.match(await page.locator('[data-facility="cg"]').textContent(), /Active event closure report/);
    assert.equal(await page.locator('[data-open-facility="cg"]').isDisabled(), true);
    console.log('PASS report storage recovery, closure booking rules, and live Open-only filtering');

    await page.evaluate(() => {
      const now = Date.now();
      const reports = [
        { id: 'full-1', facilityId: 'lot21', issueType: 'lot_full', note: '', timestamp: now - 1000, expiresAt: now + 60 * 60 * 1000 },
        { id: 'full-2', facilityId: 'lot21', issueType: 'lot_full', note: '', timestamp: now - 2000, expiresAt: now + 60 * 60 * 1000 },
        { id: 'closure', facilityId: 'lot22', issueType: 'event_closure', note: '', timestamp: now, expiresAt: now + 60 * 60 * 1000 },
      ];
      localStorage.setItem('csu-parking-reports', JSON.stringify(reports));
      localStorage.removeItem('csu-parking-report-cooldown');
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.locator('[data-facility="lot21"]').waitFor();
    assert.match(await page.locator('[data-facility="lot21"]').textContent(), /2 recent user reports/);
    assert.equal(await page.locator('[data-open-facility="lot21"]').isDisabled(), true);
    assert.match(await page.locator('[data-facility="lot22"]').textContent(), /Active event closure report/);
    assert.equal(await page.locator('[data-open-facility="lot22"]').isDisabled(), true);

    await page.evaluate(() => {
      const reports = JSON.parse(localStorage.getItem('csu-parking-reports'));
      reports.forEach(report => { report.expiresAt = Date.now() - 1; });
      localStorage.setItem('csu-parking-reports', JSON.stringify(reports));
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.locator('[data-facility="lot21"]').waitFor();
    assert.doesNotMatch(await page.locator('[data-facility="lot21"]').textContent(), /2 recent user reports/);
    assert.doesNotMatch(await page.locator('[data-facility="lot22"]').textContent(), /Active event closure report/);
    assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('csu-parking-reports'))), []);
    console.log('PASS report-derived status after reload and reconciliation after expiry');

    for (const width of [320, 390, 768]) {
      await page.setViewportSize({ width, height: 844 });
      const dimensions = await page.evaluate(() => ({
        viewport: window.innerWidth,
        content: document.documentElement.scrollWidth,
      }));
      assert.ok(dimensions.content <= dimensions.viewport, `Home overflows at ${width}px: ${JSON.stringify(dimensions)}`);
    }
    await page.setViewportSize({ width: 320, height: 844 });
    await page.locator('#permits-btn').click();
    await page.locator('[data-modal="permits"]').waitFor();
    const modalDimensions = await page.evaluate(() => ({
      viewport: window.innerWidth,
      content: document.documentElement.scrollWidth,
    }));
    assert.ok(modalDimensions.content <= modalDimensions.viewport, `Modal overflows at 320px: ${JSON.stringify(modalDimensions)}`);
    await closeModalWithEscape(page, 'permits');
    console.log('PASS home and modal layouts at 320px, 390px, and 768px');

    assert.deepEqual(runtimeErrors, []);
    console.log('PASS no uncaught browser errors');
  } finally {
    await browser.close();
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
