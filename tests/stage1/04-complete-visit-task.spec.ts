import { test, expect } from '../../src/fixtures/test-fixtures';
import { loadState, saveState } from '../../src/data/state';
import { generateVisitData } from '../../src/data/test-data';
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

test.describe('Complete Visit Task', () => {
  test('should open a scheduled visit task, fill the form, and complete it', async ({ page, patientDashboardPage }) => {
    // ── Load state from prior tests ──────────────────────────────────────
    const state = loadState();
    const patientId = state.patientId;
    const episodeId = state.episodeId;
    expect(patientId, 'patientId must exist in state').toBeTruthy();
    expect(episodeId, 'episodeId must exist in state').toBeTruthy();

    // ── Navigate to patient dashboard ────────────────────────────────────
    await patientDashboardPage.goto(patientId!, episodeId!);
    await page.waitForTimeout(2000);

    // ── Go to the Tasks tab ──────────────────────────────────────────────
    await patientDashboardPage.goToTasks();
    await page.waitForTimeout(2000);

    // ── Find the first scheduled visit task (RN / SN / PT / OT / ST / HHA / MSW) ──
    const visitLinkSelector = [
      'a:has-text("RN")',
      'a:has-text("SN")',
      'a:has-text("PT")',
      'a:has-text("OT")',
      'a:has-text("ST")',
      'a:has-text("HHA")',
      'a:has-text("MSW")',
      'a:has-text("Visit")',
      'a:has-text("Skilled")',
    ].join(', ');

    const visitLink = page.locator(visitLinkSelector).first();
    await visitLink.waitFor({ state: 'visible', timeout: 15000 });
    const taskText = await visitLink.textContent();
    console.log(`Opening visit task: ${taskText}`);
    await visitLink.click();
    await waitForPageLoad(page);
    await page.waitForTimeout(2000);

    // Dismiss any dialogs that may appear on task open
    await dismissDialogs(page);

    // ── Generate visit data ──────────────────────────────────────────────
    const visitData = generateVisitData();
    const todayStr = formatDate(new Date());
    const now = new Date();
    const timeInStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const timeOutDate = new Date(now.getTime() + 60 * 60 * 1000); // +1 hour
    const timeOutStr = `${String(timeOutDate.getHours()).padStart(2, '0')}:${String(timeOutDate.getMinutes()).padStart(2, '0')}`;

    // ── Fill Visit Date / Time ───────────────────────────────────────────
    // Try common selectors for the visit date field
    const dateSelectors = [
      'input[name="visitDate"]',
      'input[ng-model*="visitDate"]',
      'input[ng-model*="VisitDate"]',
      'input[ng-model*="visit_date"]',
      'input[placeholder*="Visit Date"]',
      'input[placeholder*="visit date"]',
      '#visitDate',
      '#txtVisitDate',
      'input[name="visitdate"]',
    ];
    for (const sel of dateSelectors) {
      const el = page.locator(sel).first();
      if (await el.isVisible({ timeout: 1500 }).catch(() => false)) {
        await el.click();
        await el.clear();
        await el.fill(todayStr);
        await el.press('Tab');
        break;
      }
    }

    // Visit time
    await safeFill(page, 'input[name="visitTime"]', timeInStr);
    await safeFill(page, 'input[ng-model*="visitTime"]', timeInStr);
    await safeFill(page, '#visitTime', timeInStr);

    // ── Fill Time In / Time Out ──────────────────────────────────────────
    const timeInSelectors = [
      'input[name="timeIn"]',
      'input[ng-model*="timeIn"]',
      'input[ng-model*="TimeIn"]',
      'input[ng-model*="time_in"]',
      'input[placeholder*="Time In"]',
      '#timeIn',
      '#txtTimeIn',
      'input[name="timein"]',
    ];
    for (const sel of timeInSelectors) {
      const el = page.locator(sel).first();
      if (await el.isVisible({ timeout: 1500 }).catch(() => false)) {
        await el.clear();
        await el.fill(timeInStr);
        await el.press('Tab');
        break;
      }
    }

    const timeOutSelectors = [
      'input[name="timeOut"]',
      'input[ng-model*="timeOut"]',
      'input[ng-model*="TimeOut"]',
      'input[ng-model*="time_out"]',
      'input[placeholder*="Time Out"]',
      '#timeOut',
      '#txtTimeOut',
      'input[name="timeout"]',
    ];
    for (const sel of timeOutSelectors) {
      const el = page.locator(sel).first();
      if (await el.isVisible({ timeout: 1500 }).catch(() => false)) {
        await el.clear();
        await el.fill(timeOutStr);
        await el.press('Tab');
        break;
      }
    }

    // ── Fill Vital Signs ─────────────────────────────────────────────────
    const vitals = {
      temperature: faker.number.float({ min: 97.0, max: 99.5, fractionDigits: 1 }).toString(),
      pulse: faker.number.int({ min: 60, max: 100 }).toString(),
      respiration: faker.number.int({ min: 14, max: 22 }).toString(),
      bpSystolic: faker.number.int({ min: 110, max: 140 }).toString(),
      bpDiastolic: faker.number.int({ min: 60, max: 90 }).toString(),
      oxygenSaturation: faker.number.int({ min: 94, max: 100 }).toString(),
      painLevel: faker.number.int({ min: 0, max: 5 }).toString(),
      weight: faker.number.float({ min: 120, max: 220, fractionDigits: 1 }).toString(),
    };

    // Temperature
    const tempSelectors = ['input[name*="temp"]', 'input[ng-model*="temp"]', 'input[ng-model*="Temp"]', '#temperature', '#temp', 'input[placeholder*="Temp"]'];
    for (const sel of tempSelectors) {
      await safeFill(page, sel, vitals.temperature);
    }

    // Pulse
    const pulseSelectors = ['input[name*="pulse"]', 'input[ng-model*="pulse"]', 'input[ng-model*="Pulse"]', '#pulse', 'input[placeholder*="Pulse"]', 'input[name*="heartRate"]', 'input[ng-model*="heartRate"]'];
    for (const sel of pulseSelectors) {
      await safeFill(page, sel, vitals.pulse);
    }

    // Respiration
    const respSelectors = ['input[name*="resp"]', 'input[ng-model*="resp"]', 'input[ng-model*="Resp"]', '#respiration', 'input[placeholder*="Resp"]'];
    for (const sel of respSelectors) {
      await safeFill(page, sel, vitals.respiration);
    }

    // Blood Pressure Systolic
    const bpSysSelectors = ['input[name*="systolic"]', 'input[name*="bpSys"]', 'input[ng-model*="systolic"]', 'input[ng-model*="Systolic"]', '#systolic', '#bpSystolic', 'input[placeholder*="Sys"]'];
    for (const sel of bpSysSelectors) {
      await safeFill(page, sel, vitals.bpSystolic);
    }

    // Blood Pressure Diastolic
    const bpDiaSelectors = ['input[name*="diastolic"]', 'input[name*="bpDia"]', 'input[ng-model*="diastolic"]', 'input[ng-model*="Diastolic"]', '#diastolic', '#bpDiastolic', 'input[placeholder*="Dia"]'];
    for (const sel of bpDiaSelectors) {
      await safeFill(page, sel, vitals.bpDiastolic);
    }

    // Oxygen Saturation
    const o2Selectors = ['input[name*="oxygen"]', 'input[name*="o2"]', 'input[name*="spo2"]', 'input[ng-model*="oxygen"]', 'input[ng-model*="O2"]', 'input[ng-model*="SpO2"]', '#oxygenSaturation', '#o2sat', 'input[placeholder*="O2"]', 'input[placeholder*="Sat"]'];
    for (const sel of o2Selectors) {
      await safeFill(page, sel, vitals.oxygenSaturation);
    }

    // Pain Level
    const painSelectors = ['input[name*="pain"]', 'input[ng-model*="pain"]', 'input[ng-model*="Pain"]', '#painLevel', '#pain', 'input[placeholder*="Pain"]'];
    for (const sel of painSelectors) {
      await safeFill(page, sel, vitals.painLevel);
    }

    // Weight
    const weightSelectors = ['input[name*="weight"]', 'input[ng-model*="weight"]', 'input[ng-model*="Weight"]', '#weight', 'input[placeholder*="Weight"]'];
    for (const sel of weightSelectors) {
      await safeFill(page, sel, vitals.weight);
    }

    // ── Fill Clinical Assessment / Notes ─────────────────────────────────
    const clinicalNotes = faker.lorem.paragraph();
    const notesSelectors = [
      'textarea[name*="note"]',
      'textarea[name*="Note"]',
      'textarea[ng-model*="note"]',
      'textarea[ng-model*="Note"]',
      'textarea[ng-model*="clinical"]',
      'textarea[ng-model*="Clinical"]',
      'textarea[ng-model*="assessment"]',
      'textarea[ng-model*="Assessment"]',
      'textarea[placeholder*="Note"]',
      'textarea[placeholder*="note"]',
      'textarea[placeholder*="Assessment"]',
      '#clinicalNotes',
      '#notes',
    ];
    for (const sel of notesSelectors) {
      const el = page.locator(sel).first();
      if (await el.isVisible({ timeout: 1500 }).catch(() => false)) {
        await el.clear();
        await el.fill(clinicalNotes);
      }
    }

    // ── Fill Patient Education ───────────────────────────────────────────
    const educationNotes = faker.helpers.arrayElement([
      'Educated patient on medication management and compliance.',
      'Reviewed disease process and signs/symptoms to report.',
      'Provided fall prevention education and home safety assessment.',
      'Educated on wound care and infection prevention measures.',
      'Reviewed diabetic diet, blood glucose monitoring, and insulin administration.',
    ]);

    const eduSelectors = [
      'textarea[name*="education"]',
      'textarea[name*="Education"]',
      'textarea[ng-model*="education"]',
      'textarea[ng-model*="Education"]',
      'textarea[placeholder*="Education"]',
      'textarea[placeholder*="education"]',
      '#patientEducation',
      '#education',
    ];
    for (const sel of eduSelectors) {
      const el = page.locator(sel).first();
      if (await el.isVisible({ timeout: 1500 }).catch(() => false)) {
        await el.clear();
        await el.fill(educationNotes);
      }
    }

    // ── Fill Skilled Services Provided ───────────────────────────────────
    const skilledServices = faker.helpers.arrayElement([
      'Skilled nursing assessment, vital signs monitoring, wound care.',
      'Skilled observation and assessment, medication management, patient education.',
      'Skilled assessment, disease management, care coordination.',
      'Skilled nursing visit for assessment, venipuncture, medication teaching.',
    ]);

    const serviceSelectors = [
      'textarea[name*="service"]',
      'textarea[name*="Service"]',
      'textarea[name*="skilled"]',
      'textarea[name*="Skilled"]',
      'textarea[ng-model*="service"]',
      'textarea[ng-model*="Service"]',
      'textarea[ng-model*="skilled"]',
      'textarea[ng-model*="Skilled"]',
      'textarea[placeholder*="Services"]',
      '#skilledServices',
      '#services',
    ];
    for (const sel of serviceSelectors) {
      const el = page.locator(sel).first();
      if (await el.isVisible({ timeout: 1500 }).catch(() => false)) {
        await el.clear();
        await el.fill(skilledServices);
      }
    }

    // ── Handle Select Dropdowns on the form ──────────────────────────────
    // Attempt to fill any visible select dropdowns with valid first options
    const allSelects = page.locator('select:visible');
    const selectCount = await allSelects.count();
    for (let i = 0; i < selectCount; i++) {
      const sel = allSelects.nth(i);
      try {
        const options = await sel.locator('option').allTextContents();
        const validOptions = options.filter(
          (o) => o.trim() && !o.includes('Select') && !o.includes('--') && !o.includes('Choose')
        );
        if (validOptions.length > 0) {
          await sel.selectOption({ label: validOptions[0] });
        }
      } catch {
        // Skip if we cannot interact with this select
      }
    }

    // ── Handle Radio Buttons ─────────────────────────────────────────────
    // Find all unique radio group names and select the first option for each
    const allRadios = page.locator('input[type="radio"]:visible');
    const radioCount = await allRadios.count();
    const handledGroups = new Set<string>();
    for (let i = 0; i < radioCount; i++) {
      try {
        const name = await allRadios.nth(i).getAttribute('name');
        if (name && !handledGroups.has(name)) {
          handledGroups.add(name);
          await page.locator(`input[type="radio"][name="${name}"]`).first().click();
          await page.waitForTimeout(200);
        }
      } catch {
        // Skip inaccessible radios
      }
    }

    // ── Handle Checkboxes (check any unchecked ones) ─────────────────────
    const allCheckboxes = page.locator('input[type="checkbox"]:visible');
    const cbCount = await allCheckboxes.count();
    // Only check the first few checkboxes (not all, as some may be "agree" toggles)
    const maxCheckboxes = Math.min(cbCount, 5);
    for (let i = 0; i < maxCheckboxes; i++) {
      try {
        const cb = allCheckboxes.nth(i);
        if (!(await cb.isChecked())) {
          await cb.check();
          await page.waitForTimeout(200);
        }
      } catch {
        // Skip inaccessible checkboxes
      }
    }

    // ── Fill any remaining visible empty text inputs ─────────────────────
    const allTextInputs = page.locator('input[type="text"]:visible, input:not([type]):visible');
    const inputCount = await allTextInputs.count();
    for (let i = 0; i < inputCount; i++) {
      try {
        const inp = allTextInputs.nth(i);
        const currentValue = await inp.inputValue();
        if (!currentValue || currentValue.trim() === '') {
          const placeholder = (await inp.getAttribute('placeholder')) || '';
          const name = (await inp.getAttribute('name')) || '';
          const nameLC = name.toLowerCase();
          const placeholderLC = placeholder.toLowerCase();

          // Skip date fields (already handled) and search fields
          if (
            placeholderLC.includes('search') ||
            nameLC.includes('search') ||
            placeholderLC.includes('filter')
          ) {
            continue;
          }

          // Determine a sensible value
          let fillValue = faker.lorem.words(2);
          if (placeholderLC.includes('date') || nameLC.includes('date')) {
            fillValue = todayStr;
          } else if (placeholderLC.includes('time') || nameLC.includes('time')) {
            fillValue = timeInStr;
          } else if (placeholderLC.includes('phone') || nameLC.includes('phone')) {
            fillValue = '(555) 123-4567';
          }

          await inp.fill(fillValue);
          await page.waitForTimeout(150);
        }
      } catch {
        // Skip inaccessible inputs
      }
    }

    // ── Fill remaining visible empty textareas ───────────────────────────
    const allTextareas = page.locator('textarea:visible');
    const taCount = await allTextareas.count();
    for (let i = 0; i < taCount; i++) {
      try {
        const ta = allTextareas.nth(i);
        const currentValue = await ta.inputValue();
        if (!currentValue || currentValue.trim() === '') {
          await ta.fill(faker.lorem.sentence());
        }
      } catch {
        // Skip inaccessible textareas
      }
    }

    await page.waitForTimeout(1000);

    // ── Save the form ────────────────────────────────────────────────────
    const saveSelectors = [
      'button:has-text("Save")',
      'input[type="submit"][value*="Save"]',
      'button:has-text("Complete")',
      'a:has-text("Save")',
      'button:has-text("Submit")',
      '#btnSave',
      '.btn-save',
      'button.btn-primary:has-text("Save")',
    ];

    let saved = false;
    for (const sel of saveSelectors) {
      const btn = page.locator(sel).first();
      if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await btn.click();
        saved = true;
        break;
      }
    }

    if (!saved) {
      // Fallback: try pressing Ctrl+S
      await page.keyboard.press('Control+s');
    }

    await page.waitForTimeout(3000);
    await waitForPageLoad(page);

    // ── Dismiss any confirmation dialogs ─────────────────────────────────
    await dismissDialogs(page);
    await page.waitForTimeout(1000);
    await dismissDialogs(page);

    // ── Verify completion ────────────────────────────────────────────────
    // After saving, we should be back on the dashboard or see a success state
    const currentUrl = page.url();
    const successIndicators = [
      page.locator('.swal2-success, .alert-success, .toast-success').first(),
      page.locator('text=Success').first(),
      page.locator('text=saved').first(),
      page.locator('text=completed').first(),
    ];

    let verified = false;
    for (const indicator of successIndicators) {
      if (await indicator.isVisible({ timeout: 2000 }).catch(() => false)) {
        verified = true;
        break;
      }
    }

    // Also consider navigation back to the dashboard as success
    if (!verified) {
      verified = currentUrl.includes('patientcare') || currentUrl.includes('overview') || currentUrl.includes('tasks');
    }

    expect(verified, 'Visit task should be saved or user returned to dashboard').toBeTruthy();

    // Save the task completion state
    saveState({ visitTaskCompleted: true });

    // ── Screenshot ───────────────────────────────────────────────────────
    await page.screenshot({ path: 'screenshots/04-complete-visit-task.png' });
  });
});
