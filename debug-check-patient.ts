import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    storageState: 'auth/session.json',
    viewport: { width: 1920, height: 1080 },
  });
  const page = await context.newPage();

  // Go to Patient Manager - All Status
  await page.goto('https://qado.medisource.com/patients/admitted', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  // Click "All Status"
  await page.locator('text=All Status').first().click();
  await page.waitForTimeout(2000);

  // Search for the patient
  await page.locator('input[placeholder="Search Patients"]').fill('Howell');
  await page.waitForTimeout(3000);

  await page.screenshot({ path: 'screenshots/debug-search-all-status.png' });

  // Also try Pre-Admission tab
  await page.locator('text=Pre-Admission').first().click();
  await page.waitForTimeout(2000);
  await page.locator('input[placeholder="Search Patients"]').clear();
  await page.locator('input[placeholder="Search Patients"]').fill('Howell');
  await page.waitForTimeout(3000);

  await page.screenshot({ path: 'screenshots/debug-search-preadmit.png' });

  // Count patients
  const count = await page.evaluate(() => {
    const showing = document.querySelector('[class*="showing"], .dataTables_info, *:has-text("Showing")');
    return showing ? (showing as HTMLElement).innerText : 'not found';
  });
  console.log('Patient count text:', count);

  const rows = await page.locator('tbody tr').count();
  console.log('Table rows:', rows);

  const firstRowText = await page.locator('tbody tr').first().textContent();
  console.log('First row:', firstRowText?.trim().substring(0, 100));

  await browser.close();
})();
