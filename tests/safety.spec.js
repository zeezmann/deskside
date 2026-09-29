import { test, expect } from '@playwright/test';
import { open } from './helpers.js';

/**
 * Forgetting to change a fill-in is the normal case, not the careless one - you
 * are stood at somebody else's desk with them watching. So the question for
 * every default is not "is it a sensible example" but "what happens if this one
 * is still here when the script runs".
 *
 * SERVICE used to default to nginx. Every other default fails: PC-NAME does not
 * resolve, 203.0.113.10 is not routable. nginx is real, extremely common, and
 * the restart script would have found it.
 */
test.describe('a forgotten fill-in fails rather than acts', () => {
  test('no default names something that exists on a real machine', async ({ page }) => {
    const problems = [];
    await open(page, problems);
    const d = await page.evaluate(() => DEFAULTS);

    expect(d.SERVICE).toBe('SERVICE-NAME');   // was nginx
    expect(d.USER).toBe('USER-NAME');         // was jsmith
    expect(d.COMPUTER).toBe('PC-NAME');
    expect(d.IP).toBe('203.0.113.10');        // RFC 5737, not routable

    const real = ['nginx', 'apache2', 'httpd', 'sshd', 'mysql', 'postgresql',
                  'docker', 'jsmith', 'jdoe', 'administrator', 'root'];
    for (const [k, v] of Object.entries(d)) {
      expect(real, `${k} defaults to a real-world name`).not.toContain(String(v).toLowerCase());
    }
    expect(problems).toEqual([]);
  });

  // The destructive ones are the whole point of the rule above.
  test('every script that changes something has a default that would miss', async ({ page }) => {
    const problems = [];
    await open(page, problems);
    const risky = await page.evaluate(() => {
      const out = [];
      SCRIPTS.filter(s => s.badges && (s.badges.includes('risk') || s.badges.includes('changes')))
        .forEach(s => {
          (s.code.match(/\{\{(\w+)\}\}/g) || []).forEach(m => {
            const k = m.slice(2, -2);
            out.push({ id: s.id, key: k, value: DEFAULTS[k] });
          });
        });
      return out;
    });
    expect(risky.length).toBeGreaterThan(5);
    for (const r of risky) {
      expect(String(r.value), `${r.id} uses ${r.key}`).not.toMatch(/^(nginx|jsmith|root|administrator)$/i);
    }
    expect(problems).toEqual([]);
  });
});

/**
 * Six Linux titles carry a fill-in. They used to render the braces literally,
 * because the card escaped the raw title instead of substituting it. Showing
 * the value in the heading is also the last chance to notice the box was never
 * changed, so this is a safety fix as much as a cosmetic one.
 */
test.describe('titles show the value, not the placeholder', () => {
  test('no card heading anywhere renders raw braces', async ({ page }) => {
    const problems = [];
    await open(page, problems);
    await page.click('[data-stackset="both"]');
    await page.click('[data-view="all"]');
    const braces = await page.evaluate(() =>
      [...document.querySelectorAll('.card h3')].map(h => h.textContent).filter(t => t.includes('{{')));
    expect(braces).toEqual([]);
    expect(problems).toEqual([]);
  });

  test('the heading follows the fill-in box', async ({ page }) => {
    const problems = [];
    await open(page, problems);
    await page.click('[data-view="linux"]');
    await expect(page.locator('#s-lx-service-restart h3')).toHaveText('Restart SERVICE-NAME');

    await page.evaluate(() => { vars.SERVICE = 'cups'; render(); });
    await expect(page.locator('#s-lx-service-restart h3')).toHaveText('Restart cups');
    expect(problems).toEqual([]);
  });

  // A value with an apostrophe is doubled inside code, because that is how a
  // single-quoted string escapes one. A heading is read, not executed.
  test('an apostrophe is doubled in the code and left alone in the title', async ({ page }) => {
    const problems = [];
    await open(page, problems);
    await page.click('[data-view="linux"]');
    await page.evaluate(() => { vars.SERVICE = "o'brien"; render(); });
    await expect(page.locator('#s-lx-service-restart h3')).toHaveText("Restart o'brien");
    const code = await page.locator('#s-lx-service-restart pre').innerText();
    expect(code).toContain("o''brien");
    expect(problems).toEqual([]);
  });
});

/**
 * The browser this runs in is usually the customer's, because you opened the
 * site on the machine you are fixing. Notes naming a person and a machine then
 * sit in their Chrome profile for whoever opens the site next.
 */
test.describe('leaving nothing behind on somebody else"s machine', () => {
  test('the notes page says whose browser this actually is', async ({ page }) => {
    const problems = [];
    await open(page, problems);
    await page.click('[data-view="notes"]');
    const panel = page.locator('.warn-panel');
    await expect(panel).toContainText('whichever browser you are sat in front of');
    // The old wording - "saved in this browser only, so it is yours" - was a
    // reassurance that is false in the one workflow this page exists for.
    await expect(page.locator('#main')).not.toContainText('so it is yours');
    expect(problems).toEqual([]);
  });

  test('the wipe clears everything this site stored and nothing else', async ({ page }) => {
    const problems = [];
    await open(page, problems);

    await page.evaluate(() => localStorage.setItem('someone_elses_key', 'keep me'));
    await page.click('[data-stackset="microsoft"]');
    await page.click('[data-view="notes"]');
    await page.fill('#notes', 'Machine: PC-14  User: a.jimoh\nReset their password.');
    await page.waitForFunction(() => (localStorage.getItem('ittk_notes') || '').includes('a.jimoh'));

    const before = await page.evaluate(() =>
      Object.keys(localStorage).filter(k => k.startsWith('ittk_')).length);
    expect(before).toBeGreaterThan(1);

    page.once('dialog', d => d.accept());
    await page.click('#nWipe');
    await page.waitForFunction(() => typeof SCRIPTS !== 'undefined' && document.querySelector('.nav button'));

    const after = await page.evaluate(() => ({
      ours: Object.keys(localStorage).filter(k => k.startsWith('ittk_')),
      theirs: localStorage.getItem('someone_elses_key'),
    }));
    expect(after.ours).toEqual([]);
    expect(after.theirs).toBe('keep me');
    expect(problems).toEqual([]);
  });

  test('cancelling the wipe keeps the notes', async ({ page }) => {
    const problems = [];
    await open(page, problems);
    await page.click('[data-view="notes"]');
    await page.fill('#notes', 'still here');
    await page.waitForFunction(() => (localStorage.getItem('ittk_notes') || '').includes('still here'));

    page.once('dialog', d => d.dismiss());
    await page.click('#nWipe');
    await expect(page.locator('#notes')).toHaveValue('still here');
    expect(problems).toEqual([]);
  });
});
