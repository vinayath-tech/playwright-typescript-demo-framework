import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '../tests/api-tests/',
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
    baseURL: 'https://restful-booker.herokuapp.com',
    extraHTTPHeaders: {
      'Content-Type': 'application/json'
    },
    trace: 'on-first-retry',
  },
  globalSetup: require.resolve('../lib/global-setup'),
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
