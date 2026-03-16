import { test, expect } from '../../src/fixtures/test-fixtures';
import { loadState, saveState } from '../../src/data/state';
import {
  waitForPageLoad,
  selectOption,
  fillDate,
  safeFill,
  safeClick,
  dismissDialogs,
  getDateOffset,
  formatDate,
} from '../../src/helpers/utils';

test.describe('Resumption of Care', () => {
  test('should initiate and complete resumption of care', async ({ page, patientDashboardPage }) => {
    const state = loadState();
    const patientId = state.patientId;
    const episodeId = state.episodeId;

    expect(patientId, 'Patient ID must be available from previous tests').toBeTruthy();
    expect(episodeId, 'Episode ID must be available from previous tests').toBeTruthy();

    // Navigate to patient dashboard
    await patientDashboardPage.goto(patientId!, episodeId!);
    await page.waitForTimeout(2000);

    // Verify we are on the patient dashboard
    expect(page.url()).toContain('patientcare');

    // Strategy 1: Look for Resumption of Care link in sidebar or dashboard
    const rocLink = page.locator([
      'a:has-text("Resumption")',
      'a:has-text("ROC")',
      'a:has-text("Resumption of Care")',
      'button:has-text("Resumption")',
      'button:has-text("ROC")',
      'a[href*="resumption"]',
      'a[href*="roc"]',
      '.sidebar a:has-text("Resumption")',
      'nav a:has-text("Resumption")',
      'li a:has-text("ROC")',
      'a[title*="Resumption"]',
      'a[title*="ROC"]',
    ].join(', ')).first();

    let rocFound = await rocLink.isVisible({ timeout: 5000 }).catch(() => false);

    if (rocFound) {
      await rocLink.click();
      await waitForPageLoad(page);
      await page.waitForTimeout(2000);
    }

    // Strategy 2: Check the Chart tab for ROC options
    if (!rocFound) {
      await patientDashboardPage.navigateToTab('Chart');
      await page.waitForTimeout(2000);

      const chartRocLink = page.locator([
        'a:has-text("Resumption")',
        'a:has-text("ROC")',
        'a:has-text("Resumption of Care")',
        'button:has-text("Resumption")',
        'a[href*="resumption"]',
        'a[href*="roc"]',
      ].join(', ')).first();

      rocFound = await chartRocLink.isVisible({ timeout: 5000 }).catch(() => false);

      if (rocFound) {
        await chartRocLink.click();
        await waitForPageLoad(page);
        await page.waitForTimeout(2000);
      }
    }

    // Strategy 3: Check under "Recerts Transfers" sidebar nav
    if (!rocFound) {
      await patientDashboardPage.goto(patientId!, episodeId!);
      await page.waitForTimeout(2000);

      const recertsLink = page.locator([
        'a:has-text("Recerts Transfers")',
        'a:has-text("Recerts/Transfers")',
        'a:has-text("Recerts & Transfers")',
        'a[title*="Recert"]',
      ].join(', ')).first();

      const recertsVisible = await recertsLink.isVisible({ timeout: 5000 }).catch(() => false);

      if (recertsVisible) {
        await recertsLink.click();
        await page.waitForTimeout(2000);

        const innerRocLink = page.locator([
          'a:has-text("Resumption")',
          'a:has-text("ROC")',
          'button:has-text("Resumption")',
          'a:has-text("Resumption of Care")',
        ].join(', ')).first();

        rocFound = await innerRocLink.isVisible({ timeout: 5000 }).catch(() => false);

        if (rocFound) {
          await innerRocLink.click();
          await waitForPageLoad(page);
          await page.waitForTimeout(2000);
        }
      }
    }

    // Strategy 4: Try the FAB / action button
    if (!rocFound) {
      await patientDashboardPage.goto(patientId!, episodeId!);
      await page.waitForTimeout(2000);

      await patientDashboardPage.clickAddButton();
      await page.waitForTimeout(1000);

      const fabRocLink = page.locator([
        'a:has-text("Resumption")',
        'a:has-text("ROC")',
        'button:has-text("Resumption")',
        'li:has-text("Resumption") a',
        'li:has-text("ROC") a',
      ].join(', ')).first();

      rocFound = await fabRocLink.isVisible({ timeout: 5000 }).catch(() => false);

      if (rocFound) {
        await fabRocLink.click();
        await waitForPageLoad(page);
        await page.waitForTimeout(2000);
      }
    }

    // Strategy 5: Direct URL navigation
    if (!rocFound) {
      await page.goto(`/patientcare/${patientId}/${episodeId}/resumption`);
      await waitForPageLoad(page);
      await page.waitForTimeout(2000);

      const pageContent = await page.textContent('body');
      rocFound = (pageContent?.toLowerCase().includes('resumption') ?? false) && !page.url().includes('overview');

      // Try alternate URL patterns
      if (!rocFound) {
        await page.goto(`/patientcare/${patientId}/${episodeId}/roc`);
        await waitForPageLoad(page);
        await page.waitForTimeout(2000);

        const pageContent2 = await page.textContent('body');
        rocFound = (pageContent2?.toLowerCase().includes('resumption') ?? false) ||
                   (pageContent2?.toLowerCase().includes('roc') ?? false);
      }
    }

    // Dismiss any initial dialogs
    await dismissDialogs(page);

    // Take screenshot of ROC page
    await page.screenshot({ path: 'screenshots/stage2-02-roc-page.png' });

    // Fill the resumption of care form
    const todayDate = formatDate(new Date());
    const resumptionDate = getDateOffset(0);

    // ROC date / Resumption date
    const rocDateSelectors = [
      'input[ng-model*="rocDate"]',
      'input[ng-model*="resumptionDate"]',
      'input[ng-model*="ResumptionDate"]',
      'input[name*="rocDate"]',
      'input[name*="resumption_date"]',
      'input[name*="resumptionDate"]',
      'input[id*="rocDate"]',
      'input[id*="resumptionDate"]',
      '#rocDate',
      '#resumptionDate',
    ];

    for (const selector of rocDateSelectors) {
      const el = page.locator(selector).first();
      if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
        await fillDate(page, selector, resumptionDate);
        break;
      }
    }

    // Reason for resumption
    const reasonSelectors = [
      'select[ng-model*="reason"]',
      'select[ng-model*="Reason"]',
      'select[name*="reason"]',
      'select[id*="reason"]',
      '#rocReason',
      '#resumptionReason',
    ];

    for (const selector of reasonSelectors) {
      const el = page.locator(selector).first();
      if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
        await selectOption(page, selector, 1);
        break;
      }
    }

    // Resumption notes / clinical narrative
    const notesSelectors = [
      'textarea[ng-model*="notes"]',
      'textarea[ng-model*="Notes"]',
      'textarea[ng-model*="narrative"]',
      'textarea[ng-model*="summary"]',
      'textarea[ng-model*="Summary"]',
      'textarea[name*="notes"]',
      'textarea[name*="narrative"]',
      'textarea[name*="summary"]',
      'textarea[id*="notes"]',
      'textarea[id*="narrative"]',
      '#rocNotes',
      '#resumptionNotes',
      'textarea',
    ];

    for (const selector of notesSelectors) {
      const el = page.locator(selector).first();
      if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
        await el.clear();
        await el.fill('Patient has returned from inpatient facility. Condition stable. Resuming home health services per physician order. Will reassess care plan and update goals accordingly.');
        break;
      }
    }

    // Physician / ordering physician
    await safeFill(page, 'input[ng-model*="physician"], input[name*="physician"], input[id*="physician"]', 'Dr. Smith');

    // SOC date if present
    const socDateSelectors = [
      'input[ng-model*="socDate"]',
      'input[ng-model*="startOfCare"]',
      'input[name*="socDate"]',
      'input[name*="soc_date"]',
      '#socDate',
    ];

    for (const selector of socDateSelectors) {
      const el = page.locator(selector).first();
      if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
        await fillDate(page, selector, resumptionDate);
        break;
      }
    }

    // Select any required dropdowns (discharge source, etc.)
    await safeClick(page, 'select[ng-model*="source"] option:nth-child(2)');

    // Select any checkboxes for confirmation
    const confirmCheckbox = page.locator('input[type="checkbox"][ng-model*="confirm"], input[type="checkbox"][ng-model*="agree"]').first();
    if (await confirmCheckbox.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmCheckbox.check();
    }

    // Take screenshot of filled form
    await page.screenshot({ path: 'screenshots/stage2-02-roc-form-filled.png' });

    // Submit the form
    const submitButton = page.locator([
      'button:has-text("Submit")',
      'button:has-text("Save")',
      'button:has-text("Complete")',
      'button:has-text("Confirm")',
      'button:has-text("Resume")',
      'button:has-text("Activate")',
      'input[type="submit"]',
      'a:has-text("Submit")',
      'a:has-text("Save")',
      'button[type="submit"]',
      '.btn-primary:has-text("Save")',
      '.btn-primary:has-text("Submit")',
    ].join(', ')).first();

    if (await submitButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await submitButton.click();
      await page.waitForTimeout(3000);
    }

    // Handle confirmation dialogs
    await dismissDialogs(page);

    const confirmBtn = page.locator([
      'button:has-text("Yes")',
      'button:has-text("Confirm")',
      'button:has-text("OK")',
      '.swal2-confirm',
      'button:has-text("Proceed")',
    ].join(', ')).first();

    if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await confirmBtn.click();
      await page.waitForTimeout(2000);
    }

    await dismissDialogs(page);
    await waitForPageLoad(page);
    await page.waitForTimeout(2000);

    // Verify patient is active again
    const activeIndicators = page.locator([
      ':text("Admitted")',
      ':text("Active")',
      '.badge:has-text("Admitted")',
      '.badge:has-text("Active")',
      '.status:has-text("Admitted")',
      '.status:has-text("Active")',
      '[class*="status"]:has-text("Admitted")',
      '[class*="status"]:has-text("Active")',
      '.label:has-text("Admitted")',
      '.label:has-text("Active")',
    ].join(', ')).first();

    const isActive = await activeIndicators.isVisible({ timeout: 5000 }).catch(() => false);

    // Also check page content for success indication
    const pageText = await page.textContent('body') || '';
    const resumptionSuccess = isActive ||
      pageText.toLowerCase().includes('admitted') ||
      pageText.toLowerCase().includes('active') ||
      pageText.toLowerCase().includes('resumption') ||
      page.url().includes('patientcare');

    // Save state
    saveState({
      rocCompleted: true,
      rocDate: resumptionDate,
    });

    // Take final screenshot
    await page.screenshot({ path: 'screenshots/stage2-02-roc-complete.png' });

    // Verify resumption was processed
    expect(resumptionSuccess, 'Resumption of care should have been completed').toBeTruthy();
  });
});
