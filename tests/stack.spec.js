import { test, expect } from '@playwright/test';
import { open } from './helpers.js';

/**
 * The toolkit ships sections for a Google shop and a Microsoft shop. Whichever
 * is switched off has to vanish completely: no category, no guide, and no chip
 * in a shared guide pointing at a script that is no longer there.
 */
test.describe('the Google / Microsoft switch', () => {
  const counts = page => page.evaluate(() => ({
    scripts: activeScripts().length,
    guides: activeGuides().length,
    cats: activeCats().length,
  }));

  // What actually renders, not what the data says. The renderer drops chips
  // for hidden scripts, so checking the data alone would report false alarms.
  const deadChips = async page => {
    await page.click('[data-view="guides"]');
    return page.evaluate(() => {
      document.querySelectorAll('.guide').forEach(g => { g.open = true; });
      const live = new Set(activeScripts().map(s => s.id));
      return [...document.querySelectorAll('.chip')]
        .map(c => c.dataset.goto).filter(id => !live.has(id));
    });
  };

  for (const pick of ['google', 'microsoft', 'both']) {
    test(`"${pick}" leaves no dangling references`, async ({ page }) => {
      const problems = [];
      await open(page, problems);
      await page.click(`[data-stackset="${pick}"]`);

      const lit = await page.evaluate(() =>
        [...document.querySelectorAll('[data-stackset].on')].map(b => b.dataset.stackset));
      expect(lit).toEqual([pick]);

      const c = await counts(page);
      expect(c.scripts).toBeGreaterThan(100);
      expect(c.guides).toBeGreaterThan(10);

      expect(await deadChips(page)).toEqual([]);
      expect(problems).toEqual([]);
    });
  }

  test('Microsoft is hidden by default and appears when asked for', async ({ page }) => {
    const problems = [];
    await open(page, problems);
    await expect(page.locator('[data-view="ms365"]')).toHaveCount(0);
    await page.click('[data-stackset="both"]');
    await expect(page.locator('[data-view="ms365"]')).toHaveCount(1);
    expect(problems).toEqual([]);
  });

  test('the choice survives a reload', async ({ page }) => {
    const problems = [];
    await open(page, problems);
    await page.click('[data-stackset="microsoft"]');
    await page.reload();
    await page.waitForFunction(() => typeof SCRIPTS !== 'undefined');
    await expect(page.locator('[data-stackset="microsoft"]')).toHaveClass(/on/);
  });

  test('viewing a section that gets hidden falls back rather than blanking', async ({ page }) => {
    const problems = [];
    await open(page, problems);
    await page.click('[data-stackset="both"]');
    await page.click('[data-view="ms365"]');
    await page.click('[data-stackset="google"]');          // hides what we were reading
    await expect(page.locator('.hero h1')).toBeVisible();   // landed on the front page
    expect(problems).toEqual([]);
  });
});
