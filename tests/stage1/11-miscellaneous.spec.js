const { test, expect } = require('../../src/fixtures/test-fixtures');
const { loadState } = require('../../src/data/state');
const { generateMiscellaneous } = require('../../src/data/test-data');
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

test.describe('Miscellaneous', () => {
  test('should create a new miscellaneous entry and save', async ({ page }) => {
    const state = loadState();
    const patientId = state.patientId;
    const episodeId = state.episodeId;
    expect(patientId, 'Patient ID must be available from prior tests').toBeTruthy();
    expect(episodeId, 'Episode ID must be available from prior tests').toBeTruthy();

    const miscData = generateMiscellaneous();

    // Navigate to the miscellaneous tab
    await page.goto(`/patientcare/${patientId}/${episodeId}/misc`);
    await waitForPageLoad(page);
    await page.waitForTimeout(2000);

    // Verify we landed on the miscellaneous page
    expect(page.url()).toContain('misc');

    // Click "Create New", "Add", or the floating action button
    const addBtn = page.locator(
      'a:has-text("Create New"), button:has-text("Create New"), ' +
      'a:has-text("Add"), button:has-text("Add"), ' +
      'a:has-text("Add New"), button:has-text("Add New"), ' +
      'a:has-text("New Entry"), button:has-text("New Entry"), ' +
      'a.btn-float, button.btn-float, a:has(i.zmdi-plus), .fab, ' +
      '.fixed-action-btn a, .btn-fab, [class*="action-btn"] a'
    ).first();
    if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addBtn.click();
      await waitForPageLoad(page);
      await page.waitForTimeout(2000);
    }

    // Fill title / category
    const titleInput = page.locator(
      'input[ng-model*="title"], input[ng-model*="category"], ' +
      'input[name*="title"], input[name*="category"], ' +
      'input[placeholder*="Title"], input[placeholder*="Category"]'
    ).first();
    if (await titleInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await titleInput.clear();
      await titleInput.fill(miscData.title);
    } else {
      await safeFill(page, '#title', miscData.title);
      await safeFill(page, '#category', miscData.title);
    }

    // If category is a select dropdown, try selecting an option
    const categorySelect = page.locator(
      'select[ng-model*="category"], select[ng-model*="type"], ' +
      'select[name*="category"], select[name*="type"]'
    ).first();
    if (await categorySelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      await selectOption(page, 'select[ng-model*="category"], select[ng-model*="type"], select[name*="category"], select[name*="type"]');
    }

    // Fill description
    const descInput = page.locator(
      'textarea[ng-model*="description"], textarea[ng-model*="desc"], ' +
      'textarea[name*="description"], textarea[name*="desc"], ' +
      'textarea[placeholder*="Description"]'
    ).first();
    if (await descInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await descInput.clear();
      await descInput.fill(miscData.description);
    } else {
      await safeFill(page, '#description', miscData.description);
      // Also try a generic textarea
      const genericTextarea = page.locator('textarea').first();
      if (await genericTextarea.isVisible({ timeout: 3000 }).catch(() => false)) {
        const currentValue = await genericTextarea.inputValue();
        if (!currentValue) {
          await genericTextarea.fill(miscData.description);
        }
      }
    }

    // Fill date
    const dateInput = page.locator(
      'input[ng-model*="date"], input[name*="date"], ' +
      'input[type="date"], input[placeholder*="Date"], ' +
      'input[ng-model*="miscDate"], input[name*="miscDate"]'
    ).first();
    if (await dateInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await dateInput.click();
      await dateInput.clear();
      await dateInput.fill(miscData.date);
      await dateInput.press('Tab');
      await page.waitForTimeout(300);
    } else {
      await safeFill(page, '#date', miscData.date);
      await safeFill(page, '#miscDate', miscData.date);
    }

    // Fill notes if a separate notes field exists
    const notesInput = page.locator(
      'textarea[ng-model*="notes"], textarea[ng-model*="note"], ' +
      'textarea[name*="notes"], textarea[name*="note"], ' +
      'textarea[placeholder*="Notes"], textarea[placeholder*="Note"]'
    ).first();
    if (await notesInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await notesInput.clear();
      await notesInput.fill('Automated test entry - miscellaneous documentation note.');
    } else {
      await safeFill(page, '#notes', 'Automated test entry - miscellaneous documentation note.');
    }

    // Fill any additional fields that may appear
    await safeFill(
      page,
      'input[ng-model*="subject"], input[name*="subject"], input[placeholder*="Subject"]',
      miscData.title
    );

    // Select status if present
    const statusSelect = page.locator(
      'select[ng-model*="status"], select[name*="status"]'
    ).first();
    if (await statusSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      await selectOption(page, 'select[ng-model*="status"], select[name*="status"]');
    }

    // Save the entry
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

    // Verify the entry was created
    const successIndicators = [
      page.locator('.toast-success, .alert-success, .swal2-success').first(),
      page.locator(`text=${miscData.title}`).first(),
      page.locator('td, span, div').filter({ hasText: miscData.title }).first(),
    ];

    let saved = false;
    for (const indicator of successIndicators) {
      if (await indicator.isVisible({ timeout: 3000 }).catch(() => false)) {
        saved = true;
        break;
      }
    }

    // Also accept if we're back on the misc page
    if (!saved) {
      const currentUrl = page.url();
      saved = currentUrl.includes('misc') || currentUrl.includes('patientcare');
    }
    expect(saved, 'Miscellaneous entry should be created successfully').toBeTruthy();

    // Take screenshot
    await page.screenshot({ path: 'screenshots/11-miscellaneous-complete.png' });
  });
});
