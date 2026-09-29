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
    expect(s.code).toContain('shutdown /r /o');
    expect(problems).toEqual([]);
  });

  /**
   * systemreset.exe was removed from System32 in Windows 11 24H2. Calling it by
   * bare name on anything current fails with "is not recognized as the name of
   * a cmdlet", which reads like a typo and sends you looking in the wrong
   * place. Nothing here may assume a System32 binary exists.
   */
  test('no bare systemreset call - the binary is gone on 24H2 and later', async ({ page }) => {
    const problems = [];
    await open(page, problems);
    const s = await get(page, 'reset-attended');

    const bare = s.code.split('\n').filter(l => {
      const code = l.replace(/'[^']*'/g, '');          // ignore anything quoted
      return /(^|[;{]\s*)systemreset\b/i.test(code.trim());
    });
    expect(bare, 'systemreset called by bare name').toEqual([]);

    // It has to look before it leaps, and offer a route that works either way.
    expect(s.code).toContain("Test-Path $legacy");
    expect(s.code).toContain('ms-settings:recovery');
    expect(problems).toEqual([]);
  });

  test('the undocumented entry point is labelled as undocumented', async ({ page }) => {
    const problems = [];
    await open(page, problems);
    const s = await get(page, 'reset-attended');
    expect(s.code).toContain('SystemSettingsAdminFlows.exe');
    expect(s.code + s.desc).toMatch(/undocumented/i);
    expect(problems).toEqual([]);
  });

  // Same error text, completely different cause. Ruling it out in the script
  // stops the next person chasing a missing binary that is actually there.
  test('a 32-bit PowerShell is caught and named', async ({ page }) => {
    const problems = [];
    await open(page, problems);
    const s = await get(page, 'reset-attended');
    expect(s.code).toContain('Is64BitProcess');
    expect(s.code).toContain('SysWOW64');
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

/**
 * Report-only as of 1.11.0. It shipped able to wipe, with a call that never
 * worked and a confirmation that did not stop a live laptop being confirmed.
 * What it knows was worth keeping; what it could do was not.
 */
test.describe('the wipe script cannot wipe', () => {
  const get = (page, id) => page.evaluate(i => SCRIPTS.find(s => s.id === i), id);

  test('it invokes nothing and registers nothing', async ({ page }) => {
    const problems = [];
    await open(page, problems);
    const s = await get(page, 'reset-unattended');

    const acts = s.code.split('\n').filter(l => {
      const bare = l.replace(/'[^']*'/g, '');
      return /Invoke-CimMethod|\$session\.InvokeMethod|Register-ScheduledTask|Start-ScheduledTask|Set-Content/.test(bare);
    });
    expect(acts, 'still able to act').toEqual([]);
    expect(s.badges).not.toContain('risk');
    expect(s.badges).not.toContain('changes');
    expect(problems).toEqual([]);
  });

  test('it still documents what it will not do', async ({ page }) => {
    const problems = [];
    await open(page, problems);
    const s = await get(page, 'reset-unattended');
    for (const m of ['doWipeMethod',
                     'doWipePersistUserDataMethod',
                     'doWipePersistProvisionedDataMethod',
                     'doWipeProtectedMethod']) {
      expect(s.code, m).toContain(m);
    }
    // The two that cost a day: the keyed lookup and the SYSTEM principal.
    expect(s.code).toContain("ParentID='./Vendor/MSFT' and InstanceID='RemoteWipe'");
    expect(s.code).toContain('S-1-5-18');
    expect(s.code).toContain('CimSession');
    expect(problems).toEqual([]);
  });

  test('it says whether the machine is still in service', async ({ page }) => {
    const problems = [];
    await open(page, problems);
    const s = await get(page, 'reset-unattended');
    expect(s.code).toContain('IN SERVICE');
    expect(s.code).toContain('$cs.UserName');
    expect(problems).toEqual([]);
  });
});
