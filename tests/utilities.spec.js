import { test, expect } from '@playwright/test';
import { open } from './helpers.js';

test.describe('the in-page utilities', () => {
  test('all six mount without error', async ({ page }) => {
    const problems = [];
    await open(page, problems);
    await page.click('[data-view="utils"]');
    const ids = await page.evaluate(() => UTILS.map(u => u.id));
    expect(ids.length).toBe(6);
    for (const id of ids) {
      await page.click('[data-view="utils"]');
      await page.click(`[data-view="util:${id}"]`);
      await expect(page.locator('#utilmount')).not.toBeEmpty();
      // Some tools render an empty .err placeholder they fill in later, so
      // look for one that actually says something.
      const shouted = await page.evaluate(() =>
        [...document.querySelectorAll('#utilmount .err')].map(e => e.textContent.trim()).filter(Boolean));
      expect(shouted).toEqual([]);
    }
    expect(problems).toEqual([]);
  });

  test('the subnet calculator gets a /22 right', async ({ page }) => {
    const problems = [];
    await open(page, problems);
    await page.click('[data-view="utils"]');
    await page.click('[data-view="util:subnet"]');
    await page.fill('#sn-ip', '10.20.30.42/22');
    const out = page.locator('#utilmount');
    await expect(out).toContainText('10.20.28.0');      // network
    await expect(out).toContainText('255.255.252.0');   // mask
    await expect(out).toContainText('10.20.31.255');    // broadcast
    expect(problems).toEqual([]);
  });

  test('leaving a utility unbinds its window listeners', async ({ page }) => {
    const problems = [];
    await open(page, problems);
    // The diagram viewer binds a resize handler. Opening it repeatedly used to
    // stack one per visit, each holding a stale reference to a detached SVG.
    for (let i = 0; i < 4; i++) {
      await page.click('[data-view="utils"]');
      await page.click('[data-view="util:viewer"]');
    }
    await page.click('[data-view="utils"]');
    expect(await page.evaluate(() => utilListeners.length)).toBe(0);
    expect(problems).toEqual([]);
  });
});

test.describe('secret handover', () => {
  const SECRET = 'Temp password: Zx9!fq_Lm2@  — rotate after handover';

  async function openTool(page, problems) {
    await open(page, problems);
    await page.click('[data-view="utils"]');
    await page.click('[data-view="util:secret"]');
  }

  async function seal(page, text, pass) {
    await page.fill('#sn-text', text);
    await page.fill('#sn-pass', pass);
    await page.click('#sn-seal');
    await expect(page.locator('#sn-sealed')).toBeVisible({ timeout: 30000 });
    return page.textContent('#sn-blob');
  }

  test('round trips, and the plaintext never appears in the blob', async ({ page }) => {
    const problems = [];
    await openTool(page, problems);
    const blob = await seal(page, SECRET, 'harbour-quartz-willow-ember');

    expect(blob.startsWith('TKN1')).toBe(true);
    expect(blob).not.toContain('Zx9');
    expect(blob).not.toContain('Temp password');

    await page.fill('#sn-in', blob);
    await page.fill('#sn-pass2', 'harbour-quartz-willow-ember');
    await page.click('#sn-open');
    await expect(page.locator('#sn-opened')).toBeVisible({ timeout: 30000 });
    expect(await page.textContent('#sn-plain')).toBe(SECRET);
    expect(problems).toEqual([]);
  });

  test('the same secret seals differently every time', async ({ page }) => {
    const problems = [];
    await openTool(page, problems);
    const a = await seal(page, 'same text', 'harbour-quartz-willow-ember');
    await page.click('#sn-seal');
    await page.waitForTimeout(2500);
    const b = await page.textContent('#sn-blob');
    // Fresh salt and IV per seal. Identical output would leak that two
    // handovers carried the same secret.
    expect(a).not.toBe(b);
    expect(problems).toEqual([]);
  });

  test('a wrong passphrase is refused', async ({ page }) => {
    const problems = [];
    await openTool(page, problems);
    const blob = await seal(page, SECRET, 'harbour-quartz-willow-ember');
    await page.fill('#sn-in', blob);
    await page.fill('#sn-pass2', 'harbour-quartz-willow-amber');
    await page.click('#sn-open');
    await expect(page.locator('#sn-err2')).toContainText('did not open', { timeout: 30000 });
    await expect(page.locator('#sn-opened')).toBeHidden();
  });

  test('a tampered blob is refused rather than half-decrypted', async ({ page }) => {
    const problems = [];
    await openTool(page, problems);
    const blob = await seal(page, SECRET, 'harbour-quartz-willow-ember');
    const flipped = blob.slice(0, -6) + (blob.slice(-6, -5) === 'A' ? 'B' : 'A') + blob.slice(-5);
    await page.fill('#sn-in', flipped);
    await page.fill('#sn-pass2', 'harbour-quartz-willow-ember');
    await page.click('#sn-open');
    // AES-GCM authenticates, so this must fail outright.
    await expect(page.locator('#sn-err2')).not.toBeEmpty({ timeout: 30000 });
    await expect(page.locator('#sn-opened')).toBeHidden();
  });

  test('a weak passphrase is rejected before anything is sealed', async ({ page }) => {
    const problems = [];
    await openTool(page, problems);
    await page.fill('#sn-text', SECRET);
    await page.fill('#sn-pass', 'short');
    await page.click('#sn-seal');
    await expect(page.locator('#sn-err1')).toContainText('longer');
    await expect(page.locator('#sn-sealed')).toBeHidden();
  });

  test('the downloaded opener file decrypts on its own', async ({ page, context }) => {
    const problems = [];
    await openTool(page, problems);
    await seal(page, SECRET, 'harbour-quartz-willow-ember');

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('#sn-file'),
    ]);
    // Save with the .html extension. Chromium sniffs a file with no extension
    // as plain text and never runs the page.
    const file = test.info().outputPath('sealed-note.html');
    await download.saveAs(file);

    // Open it as a stranger would: a fresh page, nothing else loaded.
    const fresh = await context.newPage();
    const freshProblems = [];
    fresh.on('request', r => { if (!r.url().startsWith('file:')) freshProblems.push(r.url()); });
    await fresh.goto('file://' + file);
    await fresh.fill('#p', 'harbour-quartz-willow-ember');
    await fresh.click('#b');
    await expect(fresh.locator('#o pre')).toHaveText(SECRET, { timeout: 30000 });
    expect(freshProblems).toEqual([]);   // it must not phone home
  });
});
