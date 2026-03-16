const { test: setup } = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');
const dotenv = require('dotenv');

dotenv.config();

setup('authenticate', async ({ page }) => {
  setup.setTimeout(60000);

  const loginPage = new LoginPage(page);
  await loginPage.login(
    process.env.USERNAME || '',
    process.env.PASSWORD || ''
  );

  // Verify login was successful - wait for dashboard URL
  await page.waitForURL('**/dashboard/**', { timeout: 15000 }).catch(() => {});

  // Save auth state
  await page.context().storageState({ path: 'auth/session.json' });
});
