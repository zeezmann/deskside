import { test, expect } from '@playwright/test';
import { open } from './helpers.js';

async function openTool(page, id, sink) {
  await open(page, sink);
  await page.click('[data-view="utils"]');
  await page.click(`[data-view="util:${id}"]`);
}

test.describe('which Windows is this', () => {
  test('identifies a build and how long it has left', async ({ page }) => {
    const problems = [];
    await openTool(page, 'winver', problems);
    await page.fill('#wv-in', '10.0.26100.2314');
    const out = page.locator('#wv-out');
    await expect(out).toContainText('Windows 11 24H2');
    await expect(out).toContainText('Enterprise / Education');
    expect(problems).toEqual([]);
  });

  test('warns about a build number three products share', async ({ page }) => {
    const problems = [];
    await openTool(page, 'winver', problems);
    await page.fill('#wv-in', '17763.6414');
    const out = page.locator('#wv-out');
    // 17763 is 1809, LTSC 2019 and Server 2019 at once, with wildly different
    // support dates. Reporting only the first would be actively misleading.
    await expect(out).toContainText('Windows 10 1809');
    await expect(out).toContainText('Windows 10 LTSC 2019');
    await expect(out).toContainText('Windows Server 2019');
    expect(problems).toEqual([]);
  });

  test('shows how old its own data is', async ({ page }) => {
    const problems = [];
    await openTool(page, 'winver', problems);
    // The whole point: the table goes stale, so it has to say when it was made.
    await expect(page.locator('#wv-asof')).toContainText('compiled on');
    await expect(page.locator('#wv-asof')).toContainText('learn.microsoft.com');
    expect(problems).toEqual([]);
  });

  test('admits a build it does not know', async ({ page }) => {
    const problems = [];
    await openTool(page, 'winver', problems);
    await page.fill('#wv-in', '99999');
    await expect(page.locator('#wv-out')).toContainText('not in the table');
    expect(problems).toEqual([]);
  });
});

test.describe('paste cleaner', () => {
  test('names what is hiding in the text', async ({ page }) => {
    const problems = [];
    await openTool(page, 'clean', problems);
    await page.click('#cl-demo');
    const out = page.locator('#cl-out');
    await expect(out).toContainText('non-breaking space');
    await expect(out).toContainText('zero-width space');
    await expect(out).toContainText('em dash');
    await expect(out).toContainText('U+00A0');
    expect(problems).toEqual([]);
  });

  test('hands back text that is actually clean', async ({ page }) => {
    const problems = [];
    await openTool(page, 'clean', problems);
    await page.click('#cl-demo');
    const cleaned = await page.locator('#cl-res').innerText();
    expect(cleaned).not.toMatch(/[\u00A0\u200B\u2013\u2014\u2018\u2019\u201C\u201D\u2026]/);
    expect(cleaned).toContain('"administrator"');
    expect(problems).toEqual([]);
  });

  test('says plainly when there is nothing wrong with the characters', async ({ page }) => {
    const problems = [];
    await openTool(page, 'clean', problems);
    await page.fill('#cl-in', 'plain ascii text, nothing odd here');
    await page.click('#cl-go');
    await expect(page.locator('#cl-out')).toContainText('Every character is plain ASCII');
    expect(problems).toEqual([]);
  });
});
