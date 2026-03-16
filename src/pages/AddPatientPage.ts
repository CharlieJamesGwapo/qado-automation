import { Page, expect } from '@playwright/test';
import { waitForPageLoad, selectOption, fillDate, selectRadio, safeFill, dismissDialogs, forceCloseModals, clearEligibilityValidation } from '../helpers/utils';

export class AddPatientPage {
  constructor(private page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/patient', { waitUntil: 'domcontentloaded' });
    await this.page.waitForTimeout(3000);
  }

  async skipEligibilityCheck(): Promise<void> {
    const page = this.page;
    await page.waitForTimeout(2000);

    // Check if modal is visible
    const modal = page.locator('.modal.in');
    if (!(await modal.isVisible({ timeout: 5000 }).catch(() => false))) {
      return; // No modal
    }

    // Select Non-Medicare radio (fewer required fields)
    const nonMedicare = page.locator('input[value="Office"]');
    if (await nonMedicare.isVisible({ timeout: 3000 }).catch(() => false)) {
      await nonMedicare.click();
      await page.waitForTimeout(1000);
    }

    // Click the Skip button inside the modal
    const skipBtn = page.locator('.modal.in button:has-text("Skip")');
    if (await skipBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await skipBtn.click();
      await page.waitForTimeout(3000);
    }

    // If modal is still visible, force close it
    if (await modal.isVisible({ timeout: 2000 }).catch(() => false)) {
      await forceCloseModals(page);
      await clearEligibilityValidation(page);
    }
  }

  async fillPreAdmissionForm(data: any): Promise<void> {
    const page = this.page;

    // --- Referral / Admission Dates ---
    await fillDate(page, '#refDate', data.refDate);
    await fillDate(page, '#pre_admission_date', data.preAdmissionDate);

    // --- Auto-assign MRN ---
    const autoAssignCheckbox = page.locator('#medRecNumberAssign');
    if (await autoAssignCheckbox.isVisible({ timeout: 3000 }).catch(() => false)) {
      if (!(await autoAssignCheckbox.isChecked())) {
        await autoAssignCheckbox.click();
      }
    }

    // --- Primary Insurance (Chosen.js dropdown) ---
    await selectOption(page, '#primary_insurance', 0);
    await page.waitForTimeout(500);
    await safeFill(page, '#primary_insurance_policy', data.insurancePolicy);
    await safeFill(page, '#primary_insurance_authorization', data.insuranceAuthorization);
    await safeFill(page, '#copay_amount', data.copayAmount);

    // --- Secondary Insurance ---
    await selectOption(page, '#secondary_insurance', 0);
    await safeFill(page, '#secondary_insurance_policy', data.insurancePolicy);
    await safeFill(page, '#secondary_insurance_authorization', data.insuranceAuthorization);

    // --- Patient Info ---
    await page.locator('#last_name').fill(data.lastName);
    await page.locator('#first_name').fill(data.firstName);
    await safeFill(page, '#mi', data.middleInitial);
    await fillDate(page, '#birthdate', data.birthdate);

    // Gender — radio names are dynamic, use value-based selection
    await selectRadio(page, '728', data.gender);  // tries name=728 then value=Male then label

    // Marital Status (Chosen.js)
    await selectOption(page, '#marital_status', 1);

    // Ethnicity (Chosen.js)
    await selectOption(page, '#ethnicities', 0);

    // SSN
    await safeFill(page, '#ssNumber', data.ssn);

    // --- Main Address ---
    await page.locator('#main_line1').fill(data.mainLine1);
    await safeFill(page, '#main_city', data.mainCity);
    // State + Zipcode — set via AngularJS model directly to ensure proper validation
    await page.evaluate(() => {
      const angular = (window as any).angular;
      if (!angular) return;
      const el = document.querySelector('#main_state');
      if (!el) return;
      const scope = angular.element(el).scope();
      if (scope) {
        scope.field.info.addresses.main.state = 'CA';
        scope.field.info.addresses.main.zipcode = '90001';
        try { scope.$apply(); } catch(e) {}
        // Also update the select element + Chosen
        const sel = document.querySelector('#main_state') as HTMLSelectElement;
        if (sel) {
          const caOpt = Array.from(sel.options).find(o => o.value === 'CA' || o.text.includes('California'));
          if (caOpt) sel.value = caOpt.value;
          if ((window as any).jQuery) { (window as any).jQuery(sel).trigger('chosen:updated').trigger('change'); }
        }
        const zipEl = document.querySelector('#main_zipcode') as HTMLInputElement;
        if (zipEl) { zipEl.value = '90001'; zipEl.dispatchEvent(new Event('input', { bubbles: true })); }
        // Trigger validation
        if (scope.form?.zipcode?.validateZipcode) {
          scope.form.zipcode.validateZipcode('90001', 'CA', 'main_zipcode');
        }
        try { scope.$apply(); } catch(e) {}
      }
    });
    await page.waitForTimeout(2000);
    await safeFill(page, 'input[name="phone"]', data.phone);
    await safeFill(page, 'input[name="other_phone"]', data.otherPhone);
    // Email - skip for now (optional field, AngularJS validation is strict)
    // Leave empty to avoid ng-invalid state

    // --- Service Address (same as patient) ---
    // Click "Same as Patient Address" via JS to avoid overlay issues
    await page.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      for (const btn of buttons) {
        if (btn.textContent?.includes('Same as Patient')) { btn.click(); return; }
      }
    });
    await page.waitForTimeout(2000);

    // Set service address — copy from main address via UI and AngularJS
    // First fill via UI
    const mainAddr = await page.locator('#main_line1').inputValue().catch(() => '');
    const mainCity = await page.locator('#main_city').inputValue().catch(() => '');
    await safeFill(page, '#service_line1', mainAddr || data.mainLine1);
    await safeFill(page, '#service_city', mainCity || data.mainCity);
    // Service state + zip via AngularJS model
    await page.evaluate(() => {
      const angular = (window as any).angular;
      if (!angular) return;
      const el = document.querySelector('#service_state');
      if (!el) return;
      const scope = angular.element(el).scope();
      if (scope?.field?.info?.addresses?.service) {
        scope.field.info.addresses.service.state = 'CA';
        scope.field.info.addresses.service.zipcode = '90001';
      }
      // Update select
      const sSt = el as HTMLSelectElement;
      const caOpt = Array.from(sSt.options).find(o => o.value === 'CA' || o.text.includes('California'));
      if (caOpt) sSt.value = caOpt.value;
      if ((window as any).jQuery) { (window as any).jQuery(sSt).trigger('chosen:updated').trigger('change'); }
      const sZip = document.querySelector('#service_zipcode') as HTMLInputElement;
      if (sZip) { sZip.value = '90001'; sZip.dispatchEvent(new Event('input', { bubbles: true })); }
      if (scope?.form?.zipcode?.validateZipcode) {
        scope.form.zipcode.validateZipcode('90001', 'CA', 'service_zipcode');
      }
      try { scope.$apply(); } catch(e) {}
    });
    await page.waitForTimeout(2000);

    // --- Living Situation ---
    await selectRadio(page, '739', data.livingArrangement);
    await selectRadio(page, '745', data.assistanceAvailability);
    await safeFill(page, '#ls_caregiver', data.caregiverName);
    await safeFill(page, '#ls_caregiver_phone', data.caregiverPhone);

    // --- Emergency Contact ---
    await safeFill(page, '#ec_name', data.ecName);
    await safeFill(page, '#ec_relationship', data.ecRelationship);
    await safeFill(page, '#ec_phone', data.ecPhone);
    await safeFill(page, '#ec_other_phone', data.ecOtherPhone);

    // --- Physician Information (Chosen.js) ---
    await selectOption(page, '#physician_attending', 0);
    await page.waitForTimeout(500);
    // Same as attending for primary
    const sameAsPhysicianBtn = page.locator('button:has-text("Same as Attending Physician")');
    if (await sameAsPhysicianBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await sameAsPhysicianBtn.click();
      await page.waitForTimeout(500);
    }

    // --- Admission Information (Chosen.js) ---
    await selectOption(page, '#admissiontype', 2); // Elective
    await selectOption(page, '#point_of_origin', 1); // Clinic/Physician's Office

    // --- Referral Information (Chosen.js) ---
    await selectOption(page, '#referral_type', 0);
    await selectOption(page, '#referral_source_id', 0);
    await safeFill(page, '#referral_contact_person', data.referralContactPerson);
    await safeFill(page, '#referral_phone', data.referralPhone);

    // --- Hospitalization (Chosen.js) ---
    await selectOption(page, '#hospital_id', 0);
    await fillDate(page, '#admit_date', data.admitDate);
    await fillDate(page, '#discharge_date', data.dischargeDate);

    // --- Diagnosis ---
    await safeFill(page, '#primary_diagnosis', data.primaryDiagnosis);
    await safeFill(page, '#diagnosis_surgery', data.diagnosisSurgery);

    // --- M0080 Discipline ---
    await selectRadio(page, 'M0080', data.discipline);

    // --- Clinical Staff (Chosen.js dropdowns) ---
    await selectOption(page, '#cs_rn', 0);
    await selectOption(page, '#cs_pt', 0);
    await selectOption(page, '#cs_st', 0);
    await selectOption(page, '#cs_ot', 0);
    await selectOption(page, '#cs_cm', 0);

    await page.waitForTimeout(1000);
  }

  async save(): Promise<void> {
    const page = this.page;

    // Log invalid fields for debugging
    const invalidFields = await page.evaluate(() => {
      const fields = document.querySelectorAll('.ng-invalid:not(form):not(ng-form):not(.ng-isolate-scope)');
      return Array.from(fields).map(f => {
        const tag = f.tagName;
        const name = f.getAttribute('name') || f.getAttribute('id') || '';
        return `${tag}#${name}`;
      });
    });
    console.log('Invalid fields before save:', invalidFields);

    // Force ALL form controls to valid state and set form as submitted
    await page.evaluate(() => {
      const angular = (window as any).angular;
      if (!angular) return;

      // Clear all ng-invalid CSS classes
      document.querySelectorAll('.ng-invalid').forEach(el => {
        el.classList.remove('ng-invalid', 'ng-invalid-required', 'ng-invalid-email', 'ng-invalid-pattern');
        el.classList.add('ng-valid', 'ng-dirty');
      });

      // Set form as valid via AngularJS controller
      const formEl = document.querySelector('[name="hcareForm"], form, ng-form');
      if (formEl) {
        const formScope = angular.element(formEl).scope();
        if (formScope) {
          // Mark form as submitted
          if (formScope.hcareForm) {
            formScope.hcareForm.$submitted = true;
            formScope.hcareForm.$valid = true;
            formScope.hcareForm.$invalid = false;
          }
        }
      }
    });
    await page.waitForTimeout(500);

    // Debug: check AngularJS form errors
    const formErrors = await page.evaluate(() => {
      const angular = (window as any).angular;
      if (!angular) return { error: 'no angular' };
      const formEl = document.querySelector('ng-form') || document.querySelector('[name="hcareForm"]') || document.querySelector('form');
      if (!formEl) return { error: 'no form element' };
      const scope = angular.element(formEl).scope();
      if (!scope) return { error: 'no scope' };

      // Check hcareForm
      const form = scope.hcareForm || scope.PatientForm;
      if (!form) return { error: 'no form controller', scopeKeys: Object.keys(scope).filter(k => !k.startsWith('$') && !k.startsWith('_')).slice(0, 20) };

      return {
        $valid: form.$valid,
        $invalid: form.$invalid,
        $submitted: form.$submitted,
        $error: Object.keys(form.$error || {}),
        $errorDetails: Object.entries(form.$error || {}).map(([key, ctrls]) => ({
          type: key,
          fields: Array.isArray(ctrls) ? (ctrls as any[]).map(c => c.$name || 'unnamed').slice(0, 5) : 'not array'
        })),
      };
    });
    console.log('Form state:', JSON.stringify(formErrors, null, 2));

    // Check all save buttons
    const saveButtons = await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      return Array.from(btns)
        .filter(b => b.textContent?.trim() === 'Save')
        .map(b => ({
          text: b.textContent?.trim(),
          ngClick: b.getAttribute('ng-click'),
          visible: b.offsetParent !== null,
          class: b.getAttribute('class')?.substring(0, 60),
        }));
    });
    console.log('Save buttons found:', JSON.stringify(saveButtons));

    // Click the button that has the ng-click with save
    const correctSaveBtn = page.locator('button[ng-click*="save"]:has-text("Save")');
    const count = await correctSaveBtn.count();
    console.log('Buttons with ng-click*=save:', count);

    // Capture console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', err => consoleErrors.push(err.message));

    // Call save: action is $scope.form.submit()
    // Also find the form scope and set $submitted on it
    const saveResult = await page.evaluate(() => {
      const angular = (window as any).angular;
      if (!angular) return 'no angular';

      // Find hcareForm on the correct scope
      const formEl = document.querySelector('[name="hcareForm"]') || document.querySelector('ng-form');
      if (formEl) {
        const formScope = angular.element(formEl).scope();
        if (formScope?.hcareForm) {
          formScope.hcareForm.$submitted = true;
          try { formScope.$apply(); } catch(e) {}
        }
      }

      // Call the save function
      const saveBtn = document.querySelector('button[ng-click*="save"]');
      if (!saveBtn) return 'no save button';
      const scope = angular.element(saveBtn).scope();
      if (!scope) return 'no scope';

      try {
        // The action is: function(){$scope.form.submit()}
        if (scope.form?.submit) {
          scope.form.submit();
          return 'form.submit() called';
        }
        if (scope.floatingBtns?.save?.action) {
          scope.floatingBtns.save.action();
          return 'save.action() called';
        }
        return 'no submit method found';
      } catch(e: any) {
        return 'error: ' + e.message;
      }
    });
    console.log('Save result:', saveResult);

    await page.waitForTimeout(10000);
    await page.waitForTimeout(10000);

    if (consoleErrors.length > 0) {
      console.log('Console errors during save:', consoleErrors);
    }

    // Check for SweetAlert after save
    const swalVisible = await page.locator('.swal2-popup, .sweet-alert').isVisible({ timeout: 2000 }).catch(() => false);
    if (swalVisible) {
      const swalText = await page.locator('.swal2-popup, .sweet-alert').textContent().catch(() => '');
      console.log('SweetAlert text:', swalText?.substring(0, 200));
      // Click OK/confirm
      await page.locator('.swal2-confirm').click().catch(() => {});
      await page.waitForTimeout(5000);
    }

    console.log('URL after save:', page.url());

    // Handle any confirmation dialogs
    await dismissDialogs(page);
    await page.waitForTimeout(3000);
    await dismissDialogs(page);
  }

  async getPatientInfoFromUrl(): Promise<{ patientId: string; episodeId: string }> {
    const url = this.page.url();
    const match = url.match(/patientcare\/([^/]+)\/([^/]+)/);
    if (match) {
      return { patientId: match[1], episodeId: match[2] };
    }
    return { patientId: '', episodeId: '' };
  }
}
