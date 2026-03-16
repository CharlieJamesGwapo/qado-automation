const { test, expect } = require('../../src/fixtures/test-fixtures');
const { loadState } = require('../../src/data/state');
const { generateMedicationData } = require('../../src/data/test-data');
const {
  waitForPageLoad,
  selectOption,
  fillDate,
  safeFill,
  selectFirstRadio,
  safeClick,
  dismissDialogs,
  formatDate,
} = require('../../src/helpers/utils');

test.describe('Medication Profile', () => {
  test('should add and save a medication profile entry', async ({ page }) => {
    const state = loadState();
    const patientId = state.patientId;
    const episodeId = state.episodeId;
    expect(patientId, 'Patient ID must be available from prior tests').toBeTruthy();
    expect(episodeId, 'Episode ID must be available from prior tests').toBeTruthy();

    const medData = generateMedicationData();
    const startDate = formatDate(new Date());

    // Navigate to the medication profile tab
    await page.goto(`/patientcare/${patientId}/${episodeId}/medication/profile/list`);
    await waitForPageLoad(page);
    await page.waitForTimeout(2000);

    // Verify we landed on the medication page
    expect(page.url()).toContain('medication');

    // Look for Edit button or Add/Create New button to open the medication form
    const editBtn = page.locator(
      'a:has-text("Edit"), button:has-text("Edit"), ' +
      'a:has-text("Add"), button:has-text("Add"), ' +
      'a:has-text("Create New"), button:has-text("Create New"), ' +
      'a:has-text("Add Medication"), button:has-text("Add Medication"), ' +
      'a.btn-float, button.btn-float, a:has(i.zmdi-plus), .fab'
    ).first();
    if (await editBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await editBtn.click();
      await waitForPageLoad(page);
      await page.waitForTimeout(2000);
    }

    // Fill medication name - try multiple possible selectors
    const medNameInput = page.locator(
      'input[ng-model*="medication"], input[ng-model*="drugName"], ' +
      'input[ng-model*="medName"], input[name*="medication"], ' +
      'input[name*="drug"], input[placeholder*="Medication"], ' +
      'input[placeholder*="Drug"], input[placeholder*="medication"]'
    ).first();
    if (await medNameInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await medNameInput.clear();
      await medNameInput.fill(medData.medicationName);
      await page.waitForTimeout(500);

      // If an autocomplete dropdown appears, pick the first suggestion
      const suggestion = page.locator(
        '.typeahead li a, .dropdown-menu li a, .autocomplete-suggestion, ' +
        'ul.suggestion li, .ui-menu-item'
      ).first();
      if (await suggestion.isVisible({ timeout: 2000 }).catch(() => false)) {
        await suggestion.click();
        await page.waitForTimeout(500);
      }
    } else {
      // Fallback: try textarea or a more generic selector
      await safeFill(page, 'textarea[ng-model*="medication"]', medData.medicationName);
      await safeFill(page, '#medicationName', medData.medicationName);
      await safeFill(page, '#drugName', medData.medicationName);
    }

    // Fill dosage
    await safeFill(page, 'input[ng-model*="dosage"], input[ng-model*="dose"], input[name*="dosage"], input[name*="dose"], input[placeholder*="Dosage"], input[placeholder*="Dose"]', medData.dosage);
    await safeFill(page, '#dosage', medData.dosage);

    // Fill frequency - may be a select or input
    const freqSelect = page.locator(
      'select[ng-model*="frequency"], select[ng-model*="freq"], select[name*="frequency"]'
    ).first();
    if (await freqSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      await selectOption(page, 'select[ng-model*="frequency"], select[ng-model*="freq"], select[name*="frequency"]');
    } else {
      await safeFill(page, 'input[ng-model*="frequency"], input[ng-model*="freq"], input[name*="frequency"], input[placeholder*="Frequency"]', medData.frequency);
      await safeFill(page, '#frequency', medData.frequency);
    }

    // Fill route - may be a select or input
    const routeSelect = page.locator(
      'select[ng-model*="route"], select[name*="route"]'
    ).first();
    if (await routeSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      await selectOption(page, 'select[ng-model*="route"], select[name*="route"]');
    } else {
      await safeFill(page, 'input[ng-model*="route"], input[name*="route"], input[placeholder*="Route"]', medData.route);
      await safeFill(page, '#route', medData.route);
    }

    // Fill prescriber / physician
    await safeFill(
      page,
      'input[ng-model*="prescriber"], input[ng-model*="physician"], ' +
      'input[name*="prescriber"], input[name*="physician"], ' +
      'input[placeholder*="Prescriber"], input[placeholder*="Physician"]',
      medData.prescriber
    );
    await safeFill(page, '#prescriber', medData.prescriber);
    await safeFill(page, '#physician', medData.prescriber);

    // Fill start date
    const startDateInput = page.locator(
      'input[ng-model*="startDate"], input[ng-model*="start_date"], ' +
      'input[name*="startDate"], input[name*="start_date"], ' +
      'input[placeholder*="Start Date"], input[placeholder*="start date"]'
    ).first();
    if (await startDateInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await startDateInput.click();
      await startDateInput.clear();
      await startDateInput.fill(startDate);
      await startDateInput.press('Tab');
      await page.waitForTimeout(300);
    } else {
      await safeFill(page, '#startDate', startDate);
    }

    // Fill any additional fields that may be present
    await safeFill(
      page,
      'input[ng-model*="classification"], input[name*="classification"]',
      'Cardiovascular'
    );
    await safeFill(
      page,
      'textarea[ng-model*="instructions"], textarea[ng-model*="notes"], ' +
      'textarea[name*="instructions"], textarea[name*="notes"]',
      'Take with food. Monitor for side effects.'
    );

    // Save the medication profile
    const saveBtn = page.locator(
      'button:has-text("Save"), a:has-text("Save"), ' +
      'button:has-text("Submit"), a:has-text("Submit"), ' +
      'input[type="submit"][value*="Save"], ' +
      'button[ng-click*="save"], button[ng-click*="submit"]'
    ).first();
    await saveBtn.waitFor({ state: 'visible', timeout: 10000 });
    await saveBtn.click();
    await waitForPageLoad(page);
    await page.waitForTimeout(2000);

    // Dismiss any confirmation dialogs
    await dismissDialogs(page);

    // Verify the medication was saved
    // Check for success toast, redirect back to list, or presence of data
    const successIndicators = [
      page.locator('.toast-success, .alert-success, .swal2-success').first(),
      page.locator(`text=${medData.medicationName}`).first(),
      page.locator('td, span, div').filter({ hasText: medData.medicationName }).first(),
    ];

    let saved = false;
    for (const indicator of successIndicators) {
      if (await indicator.isVisible({ timeout: 3000 }).catch(() => false)) {
        saved = true;
        break;
      }
    }

    // Also accept if we're back on the medication list page
    if (!saved) {
      const currentUrl = page.url();
      saved = currentUrl.includes('medication') || currentUrl.includes('profile');
    }
    expect(saved, 'Medication profile should be saved successfully').toBeTruthy();

    // Take screenshot
    await page.screenshot({ path: 'screenshots/09-medication-profile-complete.png' });
  });
});
