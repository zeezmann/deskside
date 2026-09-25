import { test, expect } from '@playwright/test';
import { open } from './helpers.js';

test.describe('the toolkit itself', () => {
  test('loads offline with nothing external', async ({ page }) => {
    const problems = [];
    await open(page, problems);
    await expect(page.locator('.hero h1')).toHaveText('What are you fixing?');
    expect(problems).toEqual([]);
  });

  test('every script is reachable from a guide', async ({ page }) => {
    const problems = [];
    await open(page, problems);
    // A script nobody can route to is a script nobody finds. Search is not a
    // route in; it only helps people who already know what they are after.
    const orphans = await page.evaluate(() => {
      const linked = new Set();
      GUIDES.forEach(g => g.steps.forEach(st =>
        (st.match(/\[\[([\w-]+)\]\]/g) || []).forEach(m => linked.add(m.slice(2, -2)))));
      return SCRIPTS.filter(s => !linked.has(s.id)).map(s => s.id);
    });
    expect(orphans).toEqual([]);
  });

  test('no guide points at a script that does not exist', async ({ page }) => {
    const problems = [];
    await open(page, problems);
    const dead = await page.evaluate(() => {
      const ids = new Set(SCRIPTS.map(s => s.id));
      return GUIDES.flatMap(g => g.steps.flatMap(st =>
        (st.match(/\[\[([\w-]+)\]\]/g) || []).map(m => m.slice(2, -2)).filter(i => !ids.has(i))));
    });
    expect(dead).toEqual([]);
  });

  test('script ids are unique and badges are all defined', async ({ page }) => {
    const problems = [];
    await open(page, problems);
    const bad = await page.evaluate(() => {
      const seen = new Set(), dupes = [], badBadges = [];
      SCRIPTS.forEach(s => {
        if (seen.has(s.id)) dupes.push(s.id);
        seen.add(s.id);
        s.badges.forEach(b => { if (!(b in BADGE)) badBadges.push(s.id + ':' + b); });
      });
      return { dupes, badBadges };
    });
    expect(bad.dupes).toEqual([]);
    expect(bad.badBadges).toEqual([]);
  });

  test('every fill-in placeholder has a box behind it', async ({ page }) => {
    const problems = [];
    await open(page, problems);
    const unknown = await page.evaluate(() => {
      const known = new Set(Object.keys(DEFAULTS));
      return SCRIPTS.flatMap(s => (s.code.match(/\{\{(\w+)\}\}/g) || [])
        .map(m => m.slice(2, -2)).filter(k => !known.has(k)).map(k => s.id + ':' + k));
    });
    expect(unknown).toEqual([]);
  });

  test('a fill-in with an apostrophe still produces valid code', async ({ page }) => {
    const problems = [];
    await open(page, problems);
    // A single quote inside a single-quoted PowerShell string ends it early.
    // Doubling it is the escape, and getting this wrong ships broken commands.
    await page.click('[data-view="info"]');
    await page.fill('#v_APP', "O'Reilly Tool");
    await expect(page.locator('#s-find-app pre')).toContainText("'O''Reilly Tool'");
    expect(problems).toEqual([]);
  });

  test('every view renders', async ({ page }) => {
    const problems = [];
    await open(page, problems);
    const views = await page.evaluate(() =>
      [...document.querySelectorAll('.nav button[data-view]')].map(b => b.dataset.view));
    for (const v of views) {
      await page.click(`[data-view="${v}"]`);
      await expect(page.locator('main')).not.toBeEmpty();
    }
    expect(problems).toEqual([]);
  });

  test('favourites, notes and theme survive a reload', async ({ page }) => {
    const problems = [];
    await open(page, problems);
    await page.click('[data-view="perf"]');
    await page.click('#s-disk-space .star');
    await page.click('[data-view="notes"]');
    await page.fill('#notes', 'Checked disk, 4% free.');
    await page.click('#themeBtn');
    await page.reload();
    await page.waitForFunction(() => typeof SCRIPTS !== 'undefined');
    const after = await page.evaluate(() => ({
      favs: JSON.parse(localStorage.getItem('ittk_favs') || '[]'),
      notes: JSON.parse(localStorage.getItem('ittk_notes') || '""'),
      theme: document.documentElement.getAttribute('data-theme'),
    }));
    expect(after.favs).toContain('disk-space');
    expect(after.notes).toBe('Checked disk, 4% free.');
    expect(after.theme).toBeTruthy();
  });

  test('the fill-in bar only appears where it applies', async ({ page }) => {
    const problems = [];
    await open(page, problems);
    const boxes = async () => page.evaluate(() =>
      [...document.querySelectorAll('[data-fill]')].filter(b => !b.hidden).map(b => b.dataset.fill));

    for (const empty of ['home', 'guides', 'utils', 'notes', 'runs']) {
      await page.click(`[data-view="${empty}"]`);
      await expect(page.locator('.fills')).toBeHidden();
    }
    await page.click('[data-view="network"]');
    expect((await boxes()).sort()).toEqual(['COMPUTER', 'IP']);
    await page.click('[data-view="print"]');
    await expect(page.locator('.fills')).toBeHidden();
    expect(problems).toEqual([]);
  });

  test('is usable on a phone with no sideways scroll', async ({ page }) => {
    const problems = [];
    await page.setViewportSize({ width: 390, height: 844 });
    await open(page, problems);
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    expect(problems).toEqual([]);
  });

  test('emphasis in a guide step renders, and a script id still becomes a chip', async ({ page }) => {
    const problems = [];
    await open(page, problems);
    await page.click('[data-view="guides"]');
    // Steps used to be escaped while descriptions were not, so a <b> in a step
    // appeared as the literal characters on the page.
    const body = await page.locator('main').innerText();
    expect(body).not.toContain('<b>');
    expect(body).not.toContain('</b>');
    expect(body).not.toContain('&rsquo;');
    expect(body).not.toContain('<span class="mono">');
    // The chip substitution has to survive the change.
    expect(await page.locator('.steps .chip').count()).toBeGreaterThan(20);
    expect(problems).toEqual([]);
  });
});
