import { test, expect } from '@playwright/test';
import { TOOLKIT, guardOffline } from './helpers.js';

/* A grid item defaults to min-width:auto, so a wide <pre> used to stretch the
   whole content column to main's 1080px max-width and drag the sticky top bar
   out with it. On a 360px phone that was 720px of sideways scroll on every
   script view. It was invisible on a laptop, which is exactly why it needs a
   test rather than an eye. */

const DEVICES = [
  ['Galaxy S8',  360,  740, true],
  ['iPhone SE',  375,  667, true],
  ['iPhone 14',  393,  852, true],
  ['Pixel 7',    412,  915, true],
  ['iPad mini',  768, 1024, false],
  ['iPad Pro',   834, 1194, false],
  ['iPad land', 1024,  768, false],
];

// The views that render the widest things: code blocks, a nowrap table, and a
// utility with two side-by-side panels.
const VIEWS = ['home', 'guides', 'network', 'all', 'utils', 'util:subnet', 'util:diff', 'runs', 'notes'];

for (const [name, width, height, isMobile] of DEVICES) {
  test(`${name} (${width}px) never scrolls sideways`, async ({ browser }) => {
    const problems = [];
    const page = await browser.newPage({
      viewport: { width, height }, deviceScaleFactor: 2, isMobile, hasTouch: true,
    });
    guardOffline(page, problems);
    await page.goto(TOOLKIT);
    await page.waitForFunction(() => typeof SCRIPTS !== 'undefined' && document.querySelector('.nav button'));

    for (const v of VIEWS) {
      await page.evaluate(x => { view = x; render(); if (x.startsWith('util:')) mountUtil(x.slice(5)); }, v);
      const overflow = await page.evaluate(() =>
        document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `${name} overflows on the "${v}" view`).toBeLessThanOrEqual(1);
    }
    expect(problems).toEqual([]);
    await page.close();
  });
}

test('touch devices get targets you can actually hit', async ({ browser }) => {
  const problems = [];
  const page = await browser.newPage({ viewport: { width: 393, height: 852 }, isMobile: true, hasTouch: true });
  guardOffline(page, problems);
  await page.goto(TOOLKIT);
  await page.waitForFunction(() => typeof SCRIPTS !== 'undefined' && document.querySelector('.nav button'));

  // Guards the media query itself: if the touch block ever moves back above the
  // utility CSS, later rules win and every one of these silently shrinks.
  expect(await page.evaluate(() => matchMedia('(pointer:coarse)').matches)).toBe(true);

  for (const v of ['all', 'utils', 'util:subnet', 'runs']) {
    await page.evaluate(x => { view = x; render(); if (x.startsWith('util:')) mountUtil(x.slice(5)); }, v);
    const small = await page.evaluate(() => {
      const out = [];
      document.querySelectorAll('main button, main summary, .topwrap button, .rail button').forEach(el => {
        const b = el.getBoundingClientRect();
        if (b.width > 0 && b.height > 0 && b.height < 38) {
          out.push((typeof el.className === 'string' && el.className ? '.' + el.className.split(' ')[0] : el.tagName)
            + ' ' + b.height.toFixed(1) + 'px');
        }
      });
      return [...new Set(out)];
    });
    expect(small, `targets under 38px on the "${v}" view`).toEqual([]);
  }
  expect(problems).toEqual([]);
  await page.close();
});

test('the command palette fits a small phone', async ({ browser }) => {
  const problems = [];
  const page = await browser.newPage({ viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true });
  guardOffline(page, problems);
  await page.goto(TOOLKIT);
  await page.waitForFunction(() => typeof SCRIPTS !== 'undefined' && document.querySelector('.nav button'));
  await page.keyboard.press('Control+k');
  await expect(page.locator('#palwrap')).toHaveClass(/on/);
  const overflow = await page.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  expect(problems).toEqual([]);
  await page.close();
});
