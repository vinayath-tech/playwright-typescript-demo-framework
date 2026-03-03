import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '../tests/ui-tests/specs',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [
    ['list'],
    ['html'],
    ['../lib/agents/flakiness-analyzer/index.ts'],
  ],
  use: {
    baseURL: 'https://www.saucedemo.com/',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  globalSetup: require.resolve('../lib/global-setup'),
  projects: [
    {
        name: 'setup',
        testMatch: /.*auth\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/userAuth.json'
      },
      dependencies: ['setup']
   }
  ],
});
