const { test, expect } = require('../../src/fixtures/test-fixtures');
const { generatePatientData } = require('../../src/data/test-data');
const { saveState } = require('../../src/data/state');

test.describe('Add Patient', () => {
  test('should complete pre-admission form and save patient', async ({ page, addPatientPage }) => {
    test.setTimeout(180000);
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

    // Check for the URL after save (may redirect to patientcare)
    const currentUrl = page.url();
    if (currentUrl.includes('patientcare')) {
      const match = currentUrl.match(/patientcare\/([^/]+)\/([^/]+)/);
      if (match) {
        saveState({ patientId: match[1], episodeId: match[2] });
      }
    }

    // Take screenshot for verification
    await page.screenshot({ path: 'screenshots/01-add-patient-complete.png', fullPage: true });

    // Log for debugging
    console.log('URL after save:', currentUrl);
    console.log('Patient:', patientData.lastName, patientData.firstName);
  });
});
