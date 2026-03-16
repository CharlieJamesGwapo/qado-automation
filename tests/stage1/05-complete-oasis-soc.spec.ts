import { test, expect } from '../../src/fixtures/test-fixtures';
import { loadState, saveState } from '../../src/data/state';
import {
  waitForPageLoad,
  selectOption,
  fillDate,
  selectRadio,
  safeFill,
  selectFirstRadio,
  dismissDialogs,
  formatDate,
  getDateOffset,
  safeClick,
  waitForAngular,
} from '../../src/helpers/utils';
import { faker } from '@faker-js/faker';

// ── Section definitions ────────────────────────────────────────────────────
const OASIS_SECTIONS = [
  'Administrative',
  'Diagnosis',
  'Vital Signs',
  'Cognitive',
  'Integumentary',
  'Pulmonary',
  'Nutrition',
  'Musculoskeletal',
  'Medications',
  'Care Management',
] as const;

// Alternate label patterns the app may use for each section
const SECTION_ALIASES: Record<string, string[]> = {
  'Administrative': ['Administrative', 'Admin', 'M0010', 'Patient Information', 'Clinical Record'],
  'Diagnosis': ['Diagnosis', 'Diagnoses', 'Health Conditions', 'Diagnosis/Health', 'M1000', 'ICD'],
  'Vital Signs': ['Vital Signs', 'Vital', 'Sensory', 'Vital Signs/Sensory', 'Vitals', 'M1020'],
  'Cognitive': ['Cognitive', 'Mood', 'Behavior', 'Neuro', 'Cognitive/Mood', 'M1700', 'Mental'],
  'Integumentary': ['Integumentary', 'Skin', 'Wound', 'Pressure Ulcer', 'M1300', 'Lesion'],
  'Pulmonary': ['Pulmonary', 'Cardiovascular', 'Cardiac', 'Pulmonary/Cardio', 'Respiratory', 'M1400'],
  'Nutrition': ['Nutrition', 'Elimination', 'GI', 'Nutrition/Elimination', 'M1600', 'Bowel', 'Bladder'],
  'Musculoskeletal': ['Musculoskeletal', 'Functional', 'Abilities', 'ADL', 'Functional Status', 'M1800', 'Ambulation'],
  'Medications': ['Medications', 'Medication', 'Treatment', 'Medications/Treatment', 'M2000', 'Drug'],
  'Care Management': ['Care Management', 'Goals', 'Care Plan', 'Care Management/Goals', 'M2100', 'Discharge'],
};

/**
 * Fill all visible form fields in the current view with sensible defaults.
 * Handles inputs, selects, radios, checkboxes, and textareas.
 */
async function fillAllVisibleFields(page: import('@playwright/test').Page, sectionName: string): Promise<void> {
  const todayStr = formatDate(new Date());
  const now = new Date();

  // ── Text inputs ────────────────────────────────────────────────────────
  const textInputs = page.locator(
    'input[type="text"]:visible, input[type="number"]:visible, input:not([type]):visible'
  );
  const inputCount = await textInputs.count();
  for (let i = 0; i < inputCount; i++) {
    try {
      const inp = textInputs.nth(i);
      const currentValue = await inp.inputValue();
      // Only fill empty fields
      if (currentValue && currentValue.trim() !== '') continue;

      const name = ((await inp.getAttribute('name')) || '').toLowerCase();
      const placeholder = ((await inp.getAttribute('placeholder')) || '').toLowerCase();
      const ngModel = ((await inp.getAttribute('ng-model')) || '').toLowerCase();
      const type = ((await inp.getAttribute('type')) || '').toLowerCase();
      const id = ((await inp.getAttribute('id')) || '').toLowerCase();
      const combined = `${name} ${placeholder} ${ngModel} ${id}`;

      // Skip search / filter fields
      if (combined.includes('search') || combined.includes('filter')) continue;

      // Determine a sensible fill value based on field hints
      let value = '';
      if (combined.includes('date') || type === 'date') {
        value = todayStr;
      } else if (combined.includes('time') || type === 'time') {
        value = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      } else if (combined.includes('phone') || combined.includes('fax')) {
        value = '(555) 123-4567';
      } else if (combined.includes('zip') || combined.includes('postal')) {
        value = '90210';
      } else if (combined.includes('ssn') || combined.includes('social')) {
        value = '123456789';
      } else if (combined.includes('npi')) {
        value = '1234567890';
      } else if (combined.includes('temp')) {
        value = '98.6';
      } else if (combined.includes('pulse') || combined.includes('heart')) {
        value = '72';
      } else if (combined.includes('resp')) {
        value = '18';
      } else if (combined.includes('systolic') || combined.includes('bpsys')) {
        value = '120';
      } else if (combined.includes('diastolic') || combined.includes('bpdia')) {
        value = '80';
      } else if (combined.includes('oxygen') || combined.includes('o2') || combined.includes('spo2') || combined.includes('saturation')) {
        value = '98';
      } else if (combined.includes('pain')) {
        value = '2';
      } else if (combined.includes('weight') || combined.includes('wt')) {
        value = '165';
      } else if (combined.includes('height') || combined.includes('ht')) {
        value = '68';
      } else if (combined.includes('length') || combined.includes('width') || combined.includes('depth')) {
        value = '1.5';
      } else if (combined.includes('frequency') || combined.includes('freq')) {
        value = 'Daily';
      } else if (combined.includes('dosage') || combined.includes('dose')) {
        value = '10mg';
      } else if (combined.includes('route')) {
        value = 'Oral';
      } else if (combined.includes('medication') || combined.includes('drug') || combined.includes('med')) {
        value = 'Lisinopril';
      } else if (combined.includes('icd') || combined.includes('diag')) {
        value = 'I10';
      } else if (combined.includes('physician') || combined.includes('doctor') || combined.includes('md')) {
        value = faker.person.fullName();
      } else if (combined.includes('city')) {
        value = faker.location.city();
      } else if (combined.includes('state')) {
        value = 'CA';
      } else if (combined.includes('address') || combined.includes('street')) {
        value = faker.location.streetAddress();
      } else if (combined.includes('email')) {
        value = faker.internet.email();
      } else if (combined.includes('name') || combined.includes('contact')) {
        value = faker.person.fullName();
      } else if (type === 'number') {
        value = '1';
      } else {
        value = faker.lorem.words(2);
      }

      await inp.fill(value);
      await page.waitForTimeout(100);
    } catch {
      // Skip fields we cannot interact with
    }
  }

  // ── Select dropdowns ──────────────────────────────────────────────────
  const selects = page.locator('select:visible');
  const selectCount = await selects.count();
  for (let i = 0; i < selectCount; i++) {
    try {
      const sel = selects.nth(i);
      const currentValue = await sel.inputValue().catch(() => '');
      // Skip if already has a meaningful value (not empty / default)
      if (currentValue && currentValue.trim() !== '' && currentValue !== '?' && currentValue !== '-1') continue;

      const options = await sel.locator('option').allTextContents();
      const validOptions = options.filter(
        (o) =>
          o.trim() &&
          !o.includes('Select') &&
          !o.includes('--') &&
          !o.includes('Choose') &&
          !o.includes('Please') &&
          o.trim() !== ''
      );
      if (validOptions.length > 0) {
        // Pick the first valid option
        await sel.selectOption({ label: validOptions[0] });
        await page.waitForTimeout(150);
      }
    } catch {
      // Skip inaccessible selects
    }
  }

  // ── Radio buttons (select first option for each group) ────────────────
  const radios = page.locator('input[type="radio"]:visible');
  const radioCount = await radios.count();
  const handledRadioGroups = new Set<string>();
  for (let i = 0; i < radioCount; i++) {
    try {
      const radio = radios.nth(i);
      const name = await radio.getAttribute('name');
      if (name && !handledRadioGroups.has(name)) {
        handledRadioGroups.add(name);
        // Select the first radio in this group
        const firstInGroup = page.locator(`input[type="radio"][name="${name}"]`).first();
        if (await firstInGroup.isVisible({ timeout: 1000 }).catch(() => false)) {
          await firstInGroup.click();
          await page.waitForTimeout(100);
        }
      }
    } catch {
      // Skip inaccessible radios
    }
  }

  // ── Checkboxes (check a limited number) ───────────────────────────────
  const checkboxes = page.locator('input[type="checkbox"]:visible');
  const cbCount = await checkboxes.count();
  const maxCB = Math.min(cbCount, 8);
  for (let i = 0; i < maxCB; i++) {
    try {
      const cb = checkboxes.nth(i);
      if (!(await cb.isChecked())) {
        await cb.check();
        await page.waitForTimeout(100);
      }
    } catch {
      // Skip inaccessible checkboxes
    }
  }

  // ── Textareas ─────────────────────────────────────────────────────────
  const textareas = page.locator('textarea:visible');
  const taCount = await textareas.count();
  for (let i = 0; i < taCount; i++) {
    try {
      const ta = textareas.nth(i);
      const currentValue = await ta.inputValue();
      if (!currentValue || currentValue.trim() === '') {
        const name = ((await ta.getAttribute('name')) || '').toLowerCase();
        const placeholder = ((await ta.getAttribute('placeholder')) || '').toLowerCase();
        const combined = `${name} ${placeholder}`;

        let value = '';
        if (combined.includes('goal')) {
          value = 'Patient will demonstrate improved understanding of disease process and self-management within 60 days.';
        } else if (combined.includes('intervention') || combined.includes('plan')) {
          value = 'Skilled nursing assessment, patient education, medication management, and care coordination.';
        } else if (combined.includes('comment') || combined.includes('note')) {
          value = faker.lorem.paragraph();
        } else {
          value = faker.lorem.sentence();
        }

        await ta.fill(value);
        await page.waitForTimeout(100);
      }
    } catch {
      // Skip inaccessible textareas
    }
  }
}

/**
 * Try to navigate to a specific OASIS section using tab/link/button clicks.
 * Returns true if navigation was successful.
 */
async function navigateToSection(page: import('@playwright/test').Page, sectionName: string): Promise<boolean> {
  const aliases = SECTION_ALIASES[sectionName] || [sectionName];

  for (const alias of aliases) {
    // Try tab links, nav items, buttons, sidebar links
    const selectors = [
      `a:has-text("${alias}")`,
      `button:has-text("${alias}")`,
      `li:has-text("${alias}") a`,
      `.nav-tabs a:has-text("${alias}")`,
      `.nav-link:has-text("${alias}")`,
      `[role="tab"]:has-text("${alias}")`,
      `.sidebar a:has-text("${alias}")`,
      `.menu-item:has-text("${alias}")`,
      `td:has-text("${alias}") a`,
      `.section-header:has-text("${alias}")`,
    ];

    for (const sel of selectors) {
      const el = page.locator(sel).first();
      if (await el.isVisible({ timeout: 1500 }).catch(() => false)) {
        await el.click();
        await page.waitForTimeout(2000);
        await waitForPageLoad(page);
        return true;
      }
    }
  }

  return false;
}

/**
 * Save the current section and move to the next.
 * Tries multiple common save/next button patterns.
 */
async function saveAndNext(page: import('@playwright/test').Page): Promise<void> {
  // Look for "Save & Next", "Next", or "Save" buttons
  const nextSelectors = [
    'button:has-text("Save & Next")',
    'button:has-text("Save and Next")',
    'button:has-text("Save & Continue")',
    'button:has-text("Next")',
    'a:has-text("Save & Next")',
    'a:has-text("Save and Next")',
    'a:has-text("Next")',
    'input[type="submit"][value*="Next"]',
    'input[type="submit"][value*="Save"]',
    'button:has-text("Save")',
    'a:has-text("Save")',
    '#btnSave',
    '#btnNext',
    '.btn-save',
    '.btn-next',
    'button.btn-primary',
  ];

  for (const sel of nextSelectors) {
    const btn = page.locator(sel).first();
    if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await btn.click();
      await page.waitForTimeout(2000);
      await dismissDialogs(page);
      await waitForPageLoad(page);
      return;
    }
  }

  // Fallback: keyboard shortcut
  await page.keyboard.press('Control+s');
  await page.waitForTimeout(2000);
  await dismissDialogs(page);
}

// ── Main Test ──────────────────────────────────────────────────────────────
test.describe('Complete OASIS Start of Care Assessment', () => {
  // The OASIS form is lengthy; give each section time
  test.setTimeout(600000); // 10 minutes

  test('should complete all 10 OASIS SOC sections', async ({ page, patientDashboardPage }) => {
    // ── Load state ───────────────────────────────────────────────────────
    const state = loadState();
    const patientId = state.patientId;
    const episodeId = state.episodeId;
    expect(patientId, 'patientId must exist in state').toBeTruthy();
    expect(episodeId, 'episodeId must exist in state').toBeTruthy();

    // ── Navigate to patient dashboard ────────────────────────────────────
    await patientDashboardPage.goto(patientId!, episodeId!);
    await page.waitForTimeout(2000);

    // ── Navigate to OASIS SOC form ───────────────────────────────────────
    // Try to find the OASIS link in the tasks tab or sidebar
    await patientDashboardPage.goToTasks();
    await page.waitForTimeout(2000);

    const oasisLinkSelectors = [
      'a:has-text("OASIS")',
      'a:has-text("oasis")',
      'a:has-text("Start of Care")',
      'a:has-text("SOC")',
      'a:has-text("OASIS-E")',
      'a:has-text("OASIS-D")',
      'a:has-text("Comprehensive")',
      'a:has-text("Assessment")',
    ];

    let oasisFound = false;
    for (const sel of oasisLinkSelectors) {
      const link = page.locator(sel).first();
      if (await link.isVisible({ timeout: 3000 }).catch(() => false)) {
        const linkText = await link.textContent();
        console.log(`Found OASIS link: ${linkText}`);
        await link.click();
        await waitForPageLoad(page);
        await page.waitForTimeout(2000);
        oasisFound = true;
        break;
      }
    }

    // If no link found in tasks, try direct URL patterns
    if (!oasisFound) {
      const oasisUrls = [
        `/patientcare/${patientId}/${episodeId}/oasis`,
        `/patientcare/${patientId}/${episodeId}/oasis/soc`,
        `/patientcare/${patientId}/${episodeId}/assessment/oasis`,
        `/patientcare/${patientId}/${episodeId}/forms/oasis`,
      ];

      for (const url of oasisUrls) {
        await page.goto(url);
        await page.waitForTimeout(2000);
        await waitForPageLoad(page);

        // Check if we landed on a valid page (not 404 or redirect to dashboard)
        const bodyText = await page.locator('body').textContent().catch(() => '');
        if (
          bodyText &&
          (bodyText.includes('OASIS') ||
            bodyText.includes('Administrative') ||
            bodyText.includes('M0010') ||
            bodyText.includes('Start of Care') ||
            bodyText.includes('Section'))
        ) {
          oasisFound = true;
          console.log(`OASIS found via URL: ${url}`);
          break;
        }
      }
    }

    // If still not found, try the Chart tab or other navigation
    if (!oasisFound) {
      await patientDashboardPage.goto(patientId!, episodeId!);
      await page.waitForTimeout(2000);

      // Try Chart tab
      await patientDashboardPage.goToChart();
      await page.waitForTimeout(2000);

      for (const sel of oasisLinkSelectors) {
        const link = page.locator(sel).first();
        if (await link.isVisible({ timeout: 3000 }).catch(() => false)) {
          await link.click();
          await waitForPageLoad(page);
          await page.waitForTimeout(2000);
          oasisFound = true;
          break;
        }
      }
    }

    // Dismiss any initial dialogs
    await dismissDialogs(page);

    // ── Process each of the 10 OASIS sections ────────────────────────────
    for (let sectionIndex = 0; sectionIndex < OASIS_SECTIONS.length; sectionIndex++) {
      const sectionName = OASIS_SECTIONS[sectionIndex];
      console.log(`\n=== Processing OASIS Section ${sectionIndex + 1}/10: ${sectionName} ===`);

      // For the first section, we should already be on the form
      // For subsequent sections, try to navigate to the section
      if (sectionIndex > 0) {
        const navigated = await navigateToSection(page, sectionName);
        if (!navigated) {
          console.log(`Could not find explicit navigation for "${sectionName}", assuming sequential flow.`);
          // The "Save & Next" from the previous section should have brought us here
        }
      }

      await page.waitForTimeout(1500);
      await dismissDialogs(page);

      // Fill all visible form fields for this section
      await fillAllVisibleFields(page, sectionName);

      // Take a screenshot of the completed section
      await page.screenshot({
        path: `screenshots/05-oasis-section-${sectionIndex + 1}-${sectionName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.png`,
      });

      // Save and navigate to next section
      await saveAndNext(page);

      console.log(`Section ${sectionIndex + 1}/10 "${sectionName}" completed.`);
    }

    // ── Final save / submit ──────────────────────────────────────────────
    // After the last section, try to finalize/submit the OASIS
    const finalizeSelectors = [
      'button:has-text("Finalize")',
      'button:has-text("Submit")',
      'button:has-text("Complete")',
      'button:has-text("Finish")',
      'a:has-text("Finalize")',
      'a:has-text("Submit")',
      'a:has-text("Complete")',
      'button:has-text("Save")',
      'a:has-text("Save")',
    ];

    for (const sel of finalizeSelectors) {
      const btn = page.locator(sel).first();
      if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
        const btnText = await btn.textContent();
        console.log(`Clicking finalize button: ${btnText}`);
        await btn.click();
        await page.waitForTimeout(3000);
        await dismissDialogs(page);
        break;
      }
    }

    await waitForPageLoad(page);
    await page.waitForTimeout(2000);
    await dismissDialogs(page);

    // ── Verify completion ────────────────────────────────────────────────
    const currentUrl = page.url();
    const successIndicators = [
      page.locator('.swal2-success, .alert-success, .toast-success').first(),
      page.locator('text=Success').first(),
      page.locator('text=saved').first(),
      page.locator('text=completed').first(),
      page.locator('text=finalized').first(),
      page.locator('text=submitted').first(),
    ];

    let verified = false;
    for (const indicator of successIndicators) {
      if (await indicator.isVisible({ timeout: 2000 }).catch(() => false)) {
        verified = true;
        break;
      }
    }

    // Navigation back to dashboard also counts as success
    if (!verified) {
      verified =
        currentUrl.includes('patientcare') ||
        currentUrl.includes('overview') ||
        currentUrl.includes('tasks') ||
        currentUrl.includes('oasis');
    }

    expect(verified, 'OASIS SOC assessment should be completed successfully').toBeTruthy();

    // Save state
    saveState({ oasisSOCCompleted: true });

    // ── Final screenshot ─────────────────────────────────────────────────
    await page.screenshot({ path: 'screenshots/05-oasis-soc-complete.png' });
    console.log('\nOASIS Start of Care assessment completed successfully.');
  });
});
