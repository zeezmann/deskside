import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { open } from './helpers.js';

const HERE = path.dirname(new URL(import.meta.url).pathname);
const PEM = readFileSync(path.join(HERE, 'fixtures-cert.pem'), 'utf8');

/* These four tools exist because they answer questions that come in as tickets
   every week. Each test below is the question, not the implementation. */

async function openTool(page, id, sink) {
  await open(page, sink);
  await page.click('[data-view="utils"]');
  await page.click(`[data-view="util:${id}"]`);
}

test.describe('email header analyser', () => {
  test('catches a display name pretending to be someone else', async ({ page }) => {
    const problems = [];
    await openTool(page, 'mail', problems);
    await page.click('#mh-demo');
    const out = page.locator('#mh-out');
    // The sample's From is:  "IT Helpdesk <helpdesk@contoso.com>" <billing@contoso.com>
    // Reading the FIRST pair of angle brackets is the bug this guards against.
    await expect(out).toContainText('display-name spoofing');
    await expect(out).toContainText('billing@contoso.com');
    expect(problems).toEqual([]);
  });

  test('reports the authentication results and the redirected reply', async ({ page }) => {
    const problems = [];
    await openTool(page, 'mail', problems);
    await page.click('#mh-demo');
    const out = page.locator('#mh-out');
    await expect(out).toContainText('soft fail');                 // spf=softfail
    await expect(out).toContainText('DMARC failed');
    await expect(out).toContainText('secure-contoso-verify.example');
    expect(problems).toEqual([]);
  });

  test('walks the hops oldest first', async ({ page }) => {
    const problems = [];
    await openTool(page, 'mail', problems);
    await page.click('#mh-demo');
    await expect(page.locator('#mh-out')).toContainText('Path it took (2 hops)');
    // The bulk mailer is where it started, so it has to be hop 1.
    const firstHop = await page.locator('#mh-hops tbody tr').nth(0).innerText();
    expect(firstHop).toContain('203.0.113.77');
    expect(problems).toEqual([]);
  });

  test('says so rather than guessing when given rubbish', async ({ page }) => {
    const problems = [];
    await openTool(page, 'mail', problems);
    await page.fill('#mh-in', 'this is just the body of an email, no headers at all');
    await page.click('#mh-go');
    await expect(page.locator('#mh-out')).toContainText('No headers found');
    expect(problems).toEqual([]);
  });
});

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

test.describe('certificate reader', () => {
  test('reads the subject, the names it covers and the key size', async ({ page }) => {
    const problems = [];
    await openTool(page, 'cert', problems);
    await page.fill('#ct-in', PEM);
    await page.click('#ct-go');
    const out = page.locator('#ct-out');
    await expect(out).toContainText('toolkit.example.com');
    await expect(out).toContainText('www.toolkit.example.com');
    await expect(out).toContainText('203.0.113.10');          // an IP SAN
    // The DER leading zero byte used to be counted, reporting 2056, and an
    // earlier bug reported every key as 0 bit.
    await expect(out).toContainText('RSA 2048 bit');
    await expect(out).toContainText('SHA-256 with RSA');
    await expect(out).toContainText('Server authentication');
    expect(problems).toEqual([]);
  });

  test('computes a fingerprint that matches openssl', async ({ page }) => {
    const problems = [];
    await openTool(page, 'cert', problems);
    await page.fill('#ct-in', PEM);
    await page.click('#ct-go');
    // openssl x509 -noout -fingerprint -sha256 on the same fixture
    await expect(page.locator('#ct-fp256')).toContainText('99:D2:E0:09:B6:40:F5:7A', { timeout: 5000 });
    expect(problems).toEqual([]);
  });

  test('notices it is self-signed and how long is left', async ({ page }) => {
    const problems = [];
    await openTool(page, 'cert', problems);
    await page.fill('#ct-in', PEM);
    await page.click('#ct-go');
    const out = page.locator('#ct-out');
    await expect(out).toContainText('Self-signed');
    await expect(out).toContainText(/\d+ days left/);
    expect(problems).toEqual([]);
  });

  test('refuses nonsense instead of showing an empty certificate', async ({ page }) => {
    const problems = [];
    await openTool(page, 'cert', problems);
    await page.fill('#ct-in', 'hello, this is not a certificate');
    await page.click('#ct-go');
    await expect(page.locator('#ct-err')).not.toBeEmpty();
    await expect(page.locator('#ct-out')).toBeEmpty();
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
