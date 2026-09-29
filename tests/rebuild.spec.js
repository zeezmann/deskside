import { test, expect } from '@playwright/test';
import { open } from './helpers.js';

/**
 * Everything in this section either destroys a machine or decides whether
 * destroying it will work. The rule the rest of the toolkit follows - a paste
 * must not be an action - matters most here, so it is asserted rather than
 * trusted.
 */
test.describe('rebuild and recovery', () => {
  const get = (page, id) => page.evaluate(i => SCRIPTS.find(s => s.id === i), id);

  test('nothing destructive runs just because it was pasted', async ({ page }) => {
    const problems = [];
    await open(page, problems);
    const bad = await page.evaluate(() => {
      const out = [];
      SCRIPTS.filter(s => s.cat === 'rebuild' && s.badges.includes('risk')).forEach(s => {
        // The convention: define a function, invoke it on the last line. A
        // Read-Host in a pasted block otherwise eats the rest of the paste as
        // its own answers, which is how you confirm something you never read.
        if (!/^function\s+[\w-]+/m.test(s.code)) out.push(s.id + ': not wrapped in a function');
        const last = s.code.trim().split('\n').pop().trim();
        if (!/^[A-Z][\w]*-[\w]+/.test(last)) out.push(s.id + ': last line is not the invocation');
      });
      return out;
    });
    expect(bad).toEqual([]);
    expect(problems).toEqual([]);
  });

  test('the unattended wipe reports and does nothing until told twice', async ({ page }) => {
    const problems = [];
    await open(page, problems);
    const s = await get(page, 'reset-unattended');

    // Default mode is Report, and the last line runs it with no arguments.
    expect(s.code).toMatch(/\[string\]\s*\$Mode\s*=\s*'Report'/);
    expect(s.code.trim().split('\n').pop().trim()).toBe('Start-DeviceWipe');

    // Two separate gates: the machine named back, then a typed word.
    expect(s.code).toContain('$ConfirmName -ne $env:COMPUTERNAME');
    expect(s.code).toContain("Read-Host 'Type WIPE to go ahead'");
    expect(problems).toEqual([]);
  });

  // Getting one of these wrong wipes a machine in a way the caller did not ask
  // for, and they differ only by a few characters in the middle.
  test('the wipe method names are exactly the documented four', async ({ page }) => {
    const problems = [];
    await open(page, problems);
    const s = await get(page, 'reset-unattended');
    for (const m of ['doWipeMethod',
                     'doWipePersistUserDataMethod',
                     'doWipePersistProvisionedDataMethod',
                     'doWipeProtectedMethod']) {
      expect(s.code, m).toContain(m);
    }
    expect(s.code).toContain('root\\cimv2\\mdm\\dmmap');
    // It cannot work as a mere admin, so it must not pretend to.
    expect(s.code).toContain('S-1-5-18');
    expect(problems).toEqual([]);
  });

  // Unquoted, PowerShell reads {current} as a script block and bcdedit never
  // sees the argument - it fails quietly and you lose twenty minutes.
  test('bcdedit gets {current} quoted every time', async ({ page }) => {
    const problems = [];
    await open(page, problems);
    const s = await get(page, 'boot-safe');
    const unquoted = s.code.split('\n').filter(l => /bcdedit/.test(l) && /[^"]\{current\}/.test(l));
    expect(unquoted).toEqual([]);
    // And the way back out has to be in there, or you have built a machine
    // that boots into Safe Mode forever.
    expect(s.code).toContain('bcdedit /deletevalue "{current}" safeboot');
    expect(problems).toEqual([]);
  });

  test('anything that reboots into recovery suspends BitLocker first', async ({ page }) => {
    const problems = [];
    await open(page, problems);
    for (const id of ['boot-advanced', 'boot-safe']) {
      const s = await get(page, id);
      expect(s.code, id).toContain('Suspend-BitLocker');
      expect(s.code, id).toContain('-RebootCount 1');
    }
    expect(problems).toEqual([]);
  });

  test('the attended reset checks WinRE before offering anything', async ({ page }) => {
    const problems = [];
    await open(page, problems);
    const s = await get(page, 'reset-attended');
    expect(s.code).toContain('reagentc /info');
    expect(s.code).toContain('systemreset');
    expect(s.code).toContain('shutdown /r /o');
    expect(problems).toEqual([]);
  });

  test('sysprep reports by default and names the log when it fails', async ({ page }) => {
    const problems = [];
    await open(page, problems);
    const s = await get(page, 'sysprep-handover');
    expect(s.code).toContain('if (-not $Run)');
    expect(s.code).toContain('Sysprep\\Panther\\setupact.log');
    expect(s.code).toContain('/generalize /oobe /shutdown');
    expect(problems).toEqual([]);
  });

  test('the section is reachable and renders', async ({ page }) => {
    const problems = [];
    await open(page, problems);
    await page.click('[data-view="rebuild"]');
    await expect(page.locator('.card h3')).toHaveCount(7);
    await expect(page.locator('#s-reset-unattended')).toBeVisible();
    expect(problems).toEqual([]);
  });
});
