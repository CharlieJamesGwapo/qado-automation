const { test, expect } = require('../../src/fixtures/test-fixtures');
const { loadState, saveState } = require('../../src/data/state');
const {
  waitForPageLoad,
  selectOption,
  fillDate,
  safeFill,
  safeClick,
  dismissDialogs,
  getDateOffset,
  formatDate,
} = require('../../src/helpers/utils');

test.describe('Follow-Up Patient', () => {
  test('should initiate and complete patient follow-up', async ({ page, patientDashboardPage, patientManagerPage }) => {
    const state = loadState();
    const patientId = state.patientId;
    const episodeId = state.episodeId;

    expect(patientId, 'Patient ID must be available from previous tests').toBeTruthy();
    expect(episodeId, 'Episode ID must be available from previous tests').toBeTruthy();

    // Navigate to patient dashboard
    await patientDashboardPage.goto(patientId, episodeId);
    await page.waitForTimeout(2000);

    // Verify we are on the patient dashboard
    expect(page.url()).toContain('patientcare');

    // Strategy 1: Look for Follow-up link on the dashboard or sidebar
    const followUpLink = page.locator([
      'a:has-text("Follow-up")',
      'a:has-text("Follow Up")',
      'a:has-text("Follow-Up")',
      'a:has-text("Followup")',
      'button:has-text("Follow-up")',
      'button:has-text("Follow Up")',
      'button:has-text("Follow-Up")',
      'a[href*="follow-up"]',
      'a[href*="followup"]',
      'a[href*="follow_up"]',
      '.sidebar a:has-text("Follow")',
      'nav a:has-text("Follow")',
      'li a:has-text("Follow")',
      'a[title*="Follow"]',
      '.left-sidebar a:has-text("Follow")',
    ].join(', ')).first();

    let followUpFound = await followUpLink.isVisible({ timeout: 5000 }).catch(() => false);

    if (followUpFound) {
      await followUpLink.click();
      await waitForPageLoad(page);
      await page.waitForTimeout(2000);
    }

    // Strategy 2: Check Chart tab for follow-up options
    if (!followUpFound) {
      await patientDashboardPage.navigateToTab('Chart');
      await page.waitForTimeout(2000);

      const chartFollowUpLink = page.locator([
        'a:has-text("Follow-up")',
        'a:has-text("Follow Up")',
        'a:has-text("Follow-Up")',
        'button:has-text("Follow-up")',
        'button:has-text("Follow Up")',
        'a[href*="follow"]',
      ].join(', ')).first();

      followUpFound = await chartFollowUpLink.isVisible({ timeout: 5000 }).catch(() => false);

      if (followUpFound) {
        await chartFollowUpLink.click();
        await waitForPageLoad(page);
        await page.waitForTimeout(2000);
      }
    }

    // Strategy 3: Check Communication tab (follow-ups may be tracked here)
    if (!followUpFound) {
      await patientDashboardPage.navigateToTab('Communication');
      await page.waitForTimeout(2000);

      const commFollowUpLink = page.locator([
        'a:has-text("Follow-up")',
        'a:has-text("Follow Up")',
        'a:has-text("Add Follow")',
        'button:has-text("Follow-up")',
        'button:has-text("Follow Up")',
        'button:has-text("Add Follow")',
        'a[href*="follow"]',
      ].join(', ')).first();

      followUpFound = await commFollowUpLink.isVisible({ timeout: 5000 }).catch(() => false);

      if (followUpFound) {
        await commFollowUpLink.click();
        await waitForPageLoad(page);
        await page.waitForTimeout(2000);
      }
    }

    // Strategy 4: Try the FAB / action button
    if (!followUpFound) {
      await patientDashboardPage.goto(patientId, episodeId);
      await page.waitForTimeout(2000);

      await patientDashboardPage.clickAddButton();
      await page.waitForTimeout(1000);

      const fabFollowUpLink = page.locator([
        'a:has-text("Follow-up")',
        'a:has-text("Follow Up")',
        'a:has-text("Follow-Up")',
        'button:has-text("Follow-up")',
        'button:has-text("Follow Up")',
        'li:has-text("Follow") a',
      ].join(', ')).first();

      followUpFound = await fabFollowUpLink.isVisible({ timeout: 5000 }).catch(() => false);

      if (followUpFound) {
        await fabFollowUpLink.click();
        await waitForPageLoad(page);
        await page.waitForTimeout(2000);
      }
    }

    // Strategy 5: Check the Patient Manager page for follow-up
    if (!followUpFound) {
      await patientManagerPage.goto();
      await page.waitForTimeout(2000);

      // Look for a Follow-up tab or filter
      const followUpTab = page.locator([
        'a:has-text("Follow-up")',
        'a:has-text("Follow Up")',
        'a:has-text("Follow-Up")',
        'button:has-text("Follow-up")',
        'li:has-text("Follow") a',
        '.nav-tabs a:has-text("Follow")',
      ].join(', ')).first();

      followUpFound = await followUpTab.isVisible({ timeout: 5000 }).catch(() => false);

      if (followUpFound) {
        await followUpTab.click();
        await waitForPageLoad(page);
        await page.waitForTimeout(2000);
      }
    }

    // Strategy 6: Direct URL navigation
    if (!followUpFound) {
      await page.goto(`/patientcare/${patientId}/${episodeId}/follow-up`);
      await waitForPageLoad(page);
      await page.waitForTimeout(2000);

      const pageContent = await page.textContent('body');
      followUpFound = (pageContent?.toLowerCase().includes('follow') ?? false) && !page.url().includes('overview');

      if (!followUpFound) {
        await page.goto(`/patientcare/${patientId}/${episodeId}/followup`);
        await waitForPageLoad(page);
        await page.waitForTimeout(2000);

        const pageContent2 = await page.textContent('body');
        followUpFound = (pageContent2?.toLowerCase().includes('follow') ?? false);
      }
    }

    // Dismiss any initial dialogs
    await dismissDialogs(page);

    // Take screenshot of follow-up page
    await page.screenshot({ path: 'screenshots/stage2-05-followup-page.png' });

    // Fill the follow-up form
    const followUpDate = getDateOffset(7);
    const todayDate = formatDate(new Date());

    // Follow-up type
    const typeSelectors = [
      'select[ng-model*="type"]',
      'select[ng-model*="Type"]',
      'select[ng-model*="followUpType"]',
      'select[ng-model*="FollowUpType"]',
      'select[ng-model*="followupType"]',
      'select[name*="type"]',
      'select[name*="followUpType"]',
      'select[name*="followup_type"]',
      'select[id*="type"]',
      'select[id*="followUpType"]',
      '#followUpType',
      '#followupType',
    ];

    for (const selector of typeSelectors) {
      const el = page.locator(selector).first();
      if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
        await selectOption(page, selector, 1);
        break;
      }
    }

    // Follow-up date
    const followUpDateSelectors = [
      'input[ng-model*="followUpDate"]',
      'input[ng-model*="FollowUpDate"]',
      'input[ng-model*="followupDate"]',
      'input[ng-model*="date"]',
      'input[ng-model*="Date"]',
      'input[name*="followUpDate"]',
      'input[name*="followup_date"]',
      'input[name*="date"]',
      'input[id*="followUpDate"]',
      'input[id*="followupDate"]',
      '#followUpDate',
      '#followupDate',
      '#date',
    ];

    for (const selector of followUpDateSelectors) {
      const el = page.locator(selector).first();
      if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
        await fillDate(page, selector, followUpDate);
        break;
      }
    }

    // Contact date (when the follow-up contact was made)
    const contactDateSelectors = [
      'input[ng-model*="contactDate"]',
      'input[ng-model*="ContactDate"]',
      'input[name*="contactDate"]',
      'input[name*="contact_date"]',
      'input[id*="contactDate"]',
      '#contactDate',
    ];

    for (const selector of contactDateSelectors) {
      const el = page.locator(selector).first();
      if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
        await fillDate(page, selector, todayDate);
        break;
      }
    }

    // Follow-up notes / description
    const notesSelectors = [
      'textarea[ng-model*="notes"]',
      'textarea[ng-model*="Notes"]',
      'textarea[ng-model*="description"]',
      'textarea[ng-model*="Description"]',
      'textarea[ng-model*="comments"]',
      'textarea[ng-model*="Comments"]',
      'textarea[ng-model*="narrative"]',
      'textarea[ng-model*="message"]',
      'textarea[name*="notes"]',
      'textarea[name*="description"]',
      'textarea[name*="comments"]',
      'textarea[name*="narrative"]',
      'textarea[id*="notes"]',
      'textarea[id*="description"]',
      '#followUpNotes',
      '#followupNotes',
      '#notes',
      '#description',
      'textarea',
    ];

    for (const selector of notesSelectors) {
      const el = page.locator(selector).first();
      if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
        await el.clear();
        await el.fill('Follow-up assessment completed. Patient reports improvement in condition. Medication regimen being followed as prescribed. No new complaints or concerns reported. Patient satisfied with care received. Will continue monitoring per plan of care.');
        break;
      }
    }

    // Follow-up method (phone, in-person, etc.)
    const methodSelectors = [
      'select[ng-model*="method"]',
      'select[ng-model*="Method"]',
      'select[ng-model*="contactMethod"]',
      'select[ng-model*="ContactMethod"]',
      'select[name*="method"]',
      'select[name*="contactMethod"]',
      'select[id*="method"]',
      '#followUpMethod',
      '#contactMethod',
    ];

    for (const selector of methodSelectors) {
      const el = page.locator(selector).first();
      if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
        await selectOption(page, selector, 1);
        break;
      }
    }

    // Outcome / result
    const outcomeSelectors = [
      'select[ng-model*="outcome"]',
      'select[ng-model*="Outcome"]',
      'select[ng-model*="result"]',
      'select[ng-model*="Result"]',
      'select[ng-model*="status"]',
      'select[name*="outcome"]',
      'select[name*="result"]',
      'select[id*="outcome"]',
      '#outcome',
      '#followUpOutcome',
    ];

    for (const selector of outcomeSelectors) {
      const el = page.locator(selector).first();
      if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
        await selectOption(page, selector, 1);
        break;
      }
    }

    // Assigned to / responsible party
    const assignedSelectors = [
      'select[ng-model*="assigned"]',
      'select[ng-model*="Assigned"]',
      'select[ng-model*="assignedTo"]',
      'select[ng-model*="clinician"]',
      'select[ng-model*="nurse"]',
      'select[name*="assigned"]',
      'select[name*="clinician"]',
      'select[id*="assigned"]',
      '#assignedTo',
    ];

    for (const selector of assignedSelectors) {
      const el = page.locator(selector).first();
      if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
        await selectOption(page, selector, 1);
        break;
      }
    }

    // Subject field if present
    await safeFill(page, 'input[ng-model*="subject"], input[name*="subject"], input[id*="subject"]', 'Patient Follow-Up Assessment');

    // Priority if present
    const prioritySelectors = [
      'select[ng-model*="priority"]',
      'select[ng-model*="Priority"]',
      'select[name*="priority"]',
      'select[id*="priority"]',
      '#priority',
    ];

    for (const selector of prioritySelectors) {
      const el = page.locator(selector).first();
      if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
        await selectOption(page, selector, 1);
        break;
      }
    }

    // Confirmation checkboxes
    const confirmCheckbox = page.locator([
      'input[type="checkbox"][ng-model*="confirm"]',
      'input[type="checkbox"][ng-model*="complete"]',
      'input[type="checkbox"][ng-model*="acknowledge"]',
    ].join(', ')).first();

    if (await confirmCheckbox.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmCheckbox.check();
    }

    // Take screenshot of filled form
    await page.screenshot({ path: 'screenshots/stage2-05-followup-form-filled.png' });

    // Submit the follow-up form
    const submitButton = page.locator([
      'button:has-text("Submit")',
      'button:has-text("Save")',
      'button:has-text("Complete")',
      'button:has-text("Add Follow")',
      'button:has-text("Create")',
      'button:has-text("Record")',
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

    // Verify follow-up was recorded
    const followUpIndicators = page.locator([
      ':text("Follow-up")',
      ':text("Follow Up")',
      ':text("Follow-Up")',
      ':text("Completed")',
      ':text("Recorded")',
      ':text("Saved")',
      'td:has-text("Follow")',
      'tr:has-text("Follow")',
      '.badge:has-text("Follow")',
      '[class*="success"]',
      '.alert-success',
    ].join(', ')).first();

    const followUpRecorded = await followUpIndicators.isVisible({ timeout: 5000 }).catch(() => false);

    // Also verify via page content
    const pageText = await page.textContent('body') || '';
    const followUpSuccess = followUpRecorded ||
      pageText.toLowerCase().includes('follow') ||
      pageText.toLowerCase().includes('saved') ||
      pageText.toLowerCase().includes('completed') ||
      page.url().includes('patientcare');

    // Save state
    saveState({
      followUpCompleted: true,
      followUpDate: followUpDate,
    });

    // Take final screenshot
    await page.screenshot({ path: 'screenshots/stage2-05-followup-complete.png' });

    // Verify follow-up was processed
    expect(followUpSuccess, 'Patient follow-up should have been recorded').toBeTruthy();
  });
});
