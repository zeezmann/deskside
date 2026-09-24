// @ts-check
import { defineConfig, devices } from '@playwright/test';

/**
 * The toolkit is a single file that has to work with no server, no network and
 * no build step, so the tests open it over file:// exactly as an engineer
 * would off a shared drive. Anything that only works when it is served is a
 * bug, not a test environment problem.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    trace: 'on-first-retry',
    // Deliberately no baseURL. Tests navigate to the file directly.
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // CI installs its own browser and needs none of this. The escape hatch
        // is for locked-down or air-gapped machines where Chromium is already
        // on disk and downloading another copy is not an option:
        //   PW_CHROMIUM=/path/to/chrome npm test
        ...(process.env.PW_CHROMIUM
          ? { launchOptions: { executablePath: process.env.PW_CHROMIUM } }
          : {}),
      },
    },
  ],
});
