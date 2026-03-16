const { defineConfig } = require('@playwright/test');
const dotenv = require('dotenv');

dotenv.config();

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [
    ['html', { open: 'never' }],
    ['list']
  ],
  use: {
    baseURL: process.env.BASE_URL || 'https://qado.medisource.com',
    storageState: 'auth/session.json',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    headless: process.env.HEADLESS === 'true',
    viewport: { width: 1920, height: 1080 },
    actionTimeout: 30000,
    navigationTimeout: 60000,
  },
  projects: [
    {
      name: 'auth-setup',
      testDir: './src/fixtures',
      testMatch: /auth\.setup\.js/,
      use: { storageState: undefined },
    },
    {
      name: 'stage1',
      testDir: './tests/stage1',
      dependencies: ['auth-setup'],
    },
    {
      name: 'stage2',
      testDir: './tests/stage2',
      dependencies: ['auth-setup'],
    },
  ],
});
