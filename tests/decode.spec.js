import { test, expect } from '@playwright/test';
import { open } from './helpers.js';

async function openTool(page, id, sink) {
  await open(page, sink);
  await page.click('[data-view="utils"]');
  await page.click(`[data-view="util:${id}"]`);
}

test.describe('decode an encoded command', () => {
  test('recognises a PowerShell -EncodedCommand and reads it', async ({ page }) => {
    const problems = [];
    await openTool(page, 'decode', problems);
    await page.click('#dc-demo');
    const out = page.locator('#dc-out');
    // UTF-16LE is what makes it a PowerShell payload rather than plain base64.
    await expect(out).toContainText('UTF-16LE');
    await expect(out).toContainText('DownloadString');
    expect(problems).toEqual([]);
  });

  test('flags the patterns that matter and explains why', async ({ page }) => {
    const problems = [];
    await openTool(page, 'decode', problems);
    await page.click('#dc-demo');
    const out = page.locator('#dc-out');
    await expect(out).toContainText('Invoke-Expression');
    await expect(out).toContainText('Downloads something');
    // The wrapper switches are as telling as the payload.
    await expect(out).toContainText('hidden');
    expect(problems).toEqual([]);
  });

  test('handles ordinary base64 without pretending it is PowerShell', async ({ page }) => {
    const problems = [];
    await openTool(page, 'decode', problems);
    await page.fill('#dc-in', 'aGVsbG8gZnJvbSB0aGUgc2VydmljZSBkZXNr');
    await page.click('#dc-go');
    const out = page.locator('#dc-out');
    await expect(out).toContainText('hello from the service desk');
    await expect(out).toContainText('UTF-8');
    expect(problems).toEqual([]);
  });

  test('round-trips: encode then decode gets the same text back', async ({ page }) => {
    const problems = [];
    await openTool(page, 'decode', problems);
    await page.fill('#dc-in', 'Get-Service spooler');
    await page.click('#dc-enc');
    const encoded = await page.locator('#dc-out .mono').first().innerText();
    await page.fill('#dc-in', encoded);
    await page.click('#dc-go');
    await expect(page.locator('#dc-out')).toContainText('Get-Service spooler');
    expect(problems).toEqual([]);
  });

  test('says so rather than inventing a decoding', async ({ page }) => {
    const problems = [];
    await openTool(page, 'decode', problems);
    await page.fill('#dc-in', '!!! not encoded anything !!!');
    await page.click('#dc-go');
    await expect(page.locator('#dc-err')).not.toBeEmpty();
    expect(problems).toEqual([]);
  });
});

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

test.describe('path and filename checker', () => {
  test('catches the four classics', async ({ page }) => {
    const problems = [];
    await openTool(page, 'paths', problems);
    await page.click('#pc-demo');
    const out = page.locator('#pc-out');
    await expect(out).toContainText('Classic Windows APIs stop at 260');
    await expect(out).toContainText('reserved device name');      // CON.txt
    await expect(out).toContainText('Windows will not allow');    // the colon
    await expect(out).toContainText('non-breaking space');        // invisible
    await expect(out).toContainText('ends in a space');           // "Handover notes "
    expect(problems).toEqual([]);
  });

  test('leaves an ordinary path alone', async ({ page }) => {
    const problems = [];
    await openTool(page, 'paths', problems);
    await page.fill('#pc-in', 'C:\\Users\\jsmith\\Desktop\\notes.txt');
    await page.click('#pc-go');
    await expect(page.locator('#pc-out')).toContainText('all 1 look fine');
    expect(problems).toEqual([]);
  });

  test('offers a name that would actually work', async ({ page }) => {
    const problems = [];
    await openTool(page, 'paths', problems);
    await page.fill('#pc-in', 'C:\\Share\\Q3 Report: FINAL .xlsx');
    await page.click('#pc-go');
    const out = page.locator('#pc-out');
    await expect(out).toContainText('Suggested');
    // The drive letter's colon must survive; the illegal one must not.
    await expect(out).toContainText('C:\\Share\\Q3 Report- FINAL.xlsx');
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
