import { test, expect } from '../../src/fixtures/test-fixtures';
import { generatePatientData } from '../../src/data/test-data';
import { saveState } from '../../src/data/state';

test.describe('Add Patient', () => {
  test('should complete pre-admission form and save patient', async ({ page, addPatientPage }) => {
    const patientData = generatePatientData();

    // Save patient name for later tests
    saveState({
      patientName: `${patientData.lastName}, ${patientData.firstName}`,
      patientLastName: patientData.lastName,
      patientFirstName: patientData.firstName,
    });

    // Navigate to Add Patient
    await addPatientPage.goto();

    // Skip eligibility check if it appears
    await addPatientPage.skipEligibilityCheck();

    // Fill the entire pre-admission form
    await addPatientPage.fillPreAdmissionForm(patientData);

    // Save the form
    await addPatientPage.save();

    // Verify we're redirected to the patient dashboard or patient care page
    await page.waitForTimeout(3000);
    const currentUrl = page.url();
    const isSuccess = currentUrl.includes('patientcare') || currentUrl.includes('patient');
    expect(isSuccess).toBeTruthy();

    // Extract patient and episode IDs from URL if available
    const ids = await addPatientPage.getPatientInfoFromUrl();
    if (ids.patientId) {
      saveState({
        patientId: ids.patientId,
        episodeId: ids.episodeId,
      });
    }

    // Take screenshot for verification
    await page.screenshot({ path: 'screenshots/01-add-patient-complete.png' });
  });
});
