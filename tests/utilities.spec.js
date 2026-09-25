import { test, expect } from '@playwright/test';
import { open } from './helpers.js';

test.describe('the in-page utilities', () => {
  test('all nine mount without error', async ({ page }) => {
    const problems = [];
    await open(page, problems);
    await page.click('[data-view="utils"]');
    const ids = await page.evaluate(() => UTILS.map(u => u.id));
    expect(ids.length).toBe(9);
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
