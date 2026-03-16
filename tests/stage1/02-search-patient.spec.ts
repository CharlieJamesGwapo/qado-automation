import { test, expect } from '../../src/fixtures/test-fixtures';
import { loadState, saveState } from '../../src/data/state';

test.describe('Search Patient', () => {
  test('should search and open patient dashboard', async ({ page, patientManagerPage }) => {
    const state = loadState();
    const patientLastName = state.patientLastName || 'LENI';

    // Navigate to Patient Manager
    await patientManagerPage.goto();

    // Search for the patient
    await patientManagerPage.searchPatient(patientLastName);

    // Verify patient appears in results
    await page.waitForTimeout(2000);
    const patientRow = page.locator(`tbody tr`).filter({ hasText: patientLastName }).first();
    await expect(patientRow).toBeVisible({ timeout: 10000 });

    // Open the patient dashboard
    const patientLink = patientRow.locator('a').first();
    await patientLink.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Verify we're on the patient dashboard
    expect(page.url()).toContain('patientcare');

    // Save patient and episode IDs
    const ids = await patientManagerPage.getPatientInfoFromUrl();
    if (ids.patientId) {
      saveState({
        patientId: ids.patientId,
        episodeId: ids.episodeId,
      });
    }

    await page.screenshot({ path: 'screenshots/02-search-patient-complete.png' });
  });
});
