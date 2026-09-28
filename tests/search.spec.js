import { test, expect } from '@playwright/test';
import { open } from './helpers.js';

/**
 * Search used to filter guides through the stack and scripts not at all, two
 * lines apart in the same function. On a Google-only estate that meant typing
 * a word into the box surfaced Entra and Exchange scripts the sidebar said
 * were not there - worst for a first-liner, who has no reason to doubt it.
 */
test.describe('search respects the Google / Microsoft switch', () => {
  const outOfStack = page => page.evaluate(() => {
    const live = new Set(activeScripts().map(s => s.id));
    return [...document.querySelectorAll('[data-copy]')]
      .map(b => b.dataset.copy).filter(id => !live.has(id));
  });

  test('a Microsoft script cannot be searched up in Google mode', async ({ page }) => {
    const problems = [];
    await open(page, problems);
    await page.click('[data-stackset="google"]');

    const ms = await page.evaluate(() => {
      const x = SCRIPTS.find(s => s.stack === 'microsoft');
      return { id: x.id, title: x.title };
    });

    await page.fill('#q', ms.title);
    await expect(page.locator('#main')).toContainText('Results for');
    expect(await outOfStack(page)).toEqual([]);
    await expect(page.locator(`[data-copy="${ms.id}"]`)).toHaveCount(0);
    expect(problems).toEqual([]);
  });

  test('the same script is findable once Microsoft is switched on', async ({ page }) => {
    const problems = [];
    await open(page, problems);
    await page.click('[data-stackset="both"]');

    const ms = await page.evaluate(() => {
      const x = SCRIPTS.find(s => s.stack === 'microsoft');
      return { id: x.id, title: x.title };
    });

    await page.fill('#q', ms.title);
    await expect(page.locator(`[data-copy="${ms.id}"]`)).toHaveCount(1);
    expect(problems).toEqual([]);
  });

  test('the result count matches what is actually listed', async ({ page }) => {
    const problems = [];
    await open(page, problems);
    await page.click('[data-stackset="google"]');
    await page.fill('#q', 'disk');

    const head = await page.locator('.head p').first().innerText();
    const claimed = parseInt(head.match(/(\d+) scripts/)[1], 10);
    const shown = await page.locator('[data-copy]').count();
    expect(shown).toBe(claimed);
    expect(problems).toEqual([]);
  });

  test('a search in either mode lists nothing out of stack', async ({ page }) => {
    const problems = [];
    await open(page, problems);
    for (const pick of ['google', 'microsoft']) {
      await page.click(`[data-stackset="${pick}"]`);
      for (const term of ['disk', 'password', 'network', 'mail', 'profile']) {
        await page.fill('#q', term);
        expect(await outOfStack(page), `${pick} / ${term}`).toEqual([]);
      }
    }
    expect(problems).toEqual([]);
  });
});
