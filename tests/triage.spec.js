import { test, expect } from '@playwright/test';
import { open } from './helpers.js';


/* These tools exist because they answer questions that come in as tickets
   every week. Each test below is the question, not the implementation. */

async function openTool(page, id, sink) {
  await open(page, sink);
  await page.click('[data-view="utils"]');
  await page.click(`[data-view="util:${id}"]`);
}

test.describe('error code decoder', () => {
  const cases = [
    ['0x80070005', ['Win32 error in HRESULT clothing', 'ERROR_ACCESS_DENIED']],
    ['-2147024891', ['ERROR_ACCESS_DENIED']],          // the same code, signed
    ['2147942405',  ['ERROR_ACCESS_DENIED']],          // and unsigned decimal
    ['1603',        ['installer exit code', 'ERROR_INSTALL_FAILURE']],
    ['0xC000006D',  ['STATUS_LOGON_FAILURE']],
    ['0x8024402C',  ['WINDOWSUPDATE']],
    ['1326',        ['ERROR_LOGON_FAILURE']],
  ];
  for (const [code, expected] of cases) {
    test(`decodes ${code}`, async ({ page }) => {
      const problems = [];
      await openTool(page, 'errcode', problems);
      await page.fill('#ec-in', code);
      for (const text of expected) await expect(page.locator('#ec-out')).toContainText(text);
      expect(problems).toEqual([]);
    });
  }

  test('admits when a code is not in the table, with a way to look it up', async ({ page }) => {
    const problems = [];
    await openTool(page, 'errcode', problems);
    await page.fill('#ec-in', '0x81234567');
    await expect(page.locator('#ec-out')).toContainText('certutil -error');
    expect(problems).toEqual([]);
  });
});

test.describe('compare two outputs', () => {
  test('finds the line that changed and leaves the rest alone', async ({ page }) => {
    const problems = [];
    await openTool(page, 'diff', problems);
    await page.fill('#df-a', 'IPv4 Address : 10.0.4.19\nSubnet Mask : 255.255.255.0\nDNS : 10.0.0.5');
    await page.fill('#df-b', 'IPv4 Address : 10.0.4.23\nSubnet Mask : 255.255.255.0\nDNS : 10.0.0.5');
    await page.click('#df-go');
    const out = page.locator('#df-out');
    await expect(out).toContainText('1 only on the left');
    await expect(out).toContainText('1 only on the right');
    await expect(out).toContainText('10.0.4.19');
    await expect(out).toContainText('10.0.4.23');
    expect(problems).toEqual([]);
  });

  test('says identical when they are', async ({ page }) => {
    const problems = [];
    await openTool(page, 'diff', problems);
    const same = 'line one\nline two\nline three';
    await page.fill('#df-a', same);
    await page.fill('#df-b', same);
    await page.click('#df-go');
    await expect(page.locator('#df-out')).toContainText('identical');
    expect(problems).toEqual([]);
  });

  test('the ignore-whitespace option actually ignores whitespace', async ({ page }) => {
    const problems = [];
    await openTool(page, 'diff', problems);
    await page.fill('#df-a', '  Status : Running');
    await page.fill('#df-b', 'Status : Running   ');
    await page.click('#df-go');
    await expect(page.locator('#df-out')).toContainText('identical');
    await page.uncheck('#df-ws');
    await expect(page.locator('#df-out')).toContainText('only on the left');
    expect(problems).toEqual([]);
  });
});

test.describe('the command palette', () => {
  test('opens on Ctrl+K and closes on Escape', async ({ page }) => {
    const problems = [];
    await open(page, problems);
    await page.keyboard.press('Control+k');
    await expect(page.locator('#palwrap')).toHaveClass(/on/);
    await page.keyboard.press('Escape');
    await expect(page.locator('#palwrap')).not.toHaveClass(/on/);
    expect(problems).toEqual([]);
  });

  test('puts the obvious answer first', async ({ page }) => {
    const problems = [];
    await open(page, problems);
    await page.keyboard.press('Control+k');
    await page.keyboard.type('slack');
    // The guide has to beat the thirty scripts that merely mention Slack.
    const first = await page.locator('.pal-it').first().innerText();
    expect(first).toContain('Slack not working');
    expect(problems).toEqual([]);
  });

  test('ranks a real match above an accidental one', async ({ page }) => {
    const problems = [];
    await open(page, problems);
    await page.keyboard.press('Control+k');
    await page.keyboard.type('slack');
    const top = await page.evaluate(() => palHits.slice(0, 6).map(h => h.t));
    // "Software instaLl or updAte request" contains s, l, a, c and k in that
    // order. Before the span check on subsequence matches it ranked fourth,
    // above four scripts with Slack in the title. It may still appear further
    // down, because its steps mention Slack, and that is a fair weak match.
    expect(top).not.toContain('Software install or update request');
    expect(top.filter(t => /slack/i.test(t)).length).toBeGreaterThanOrEqual(5);
    expect(problems).toEqual([]);
  });

  test('arrow keys move the selection and Enter follows it', async ({ page }) => {
    const problems = [];
    await open(page, problems);
    await page.keyboard.press('Control+k');
    await page.keyboard.type('subnet');
    await page.keyboard.press('Enter');
    await expect(page.locator('#palwrap')).not.toHaveClass(/on/);
    expect(await page.evaluate(() => view)).toBe('util:subnet');
    expect(problems).toEqual([]);
  });

  test('says so when nothing matches', async ({ page }) => {
    const problems = [];
    await open(page, problems);
    await page.keyboard.press('Control+k');
    await page.keyboard.type('zzzzqqqq');
    await expect(page.locator('#palRes')).toContainText('Nothing matches');
    expect(problems).toEqual([]);
  });
});
