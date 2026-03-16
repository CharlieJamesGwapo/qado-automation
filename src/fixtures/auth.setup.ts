import { test as setup } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import dotenv from 'dotenv';

dotenv.config();

setup('authenticate', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.login(
    process.env.USERNAME || '',
    process.env.PASSWORD || ''
  );

  // Verify login was successful
  await page.waitForURL('**/dashboard/**');

  // Save auth state
  await page.context().storageState({ path: 'auth/session.json' });
});
