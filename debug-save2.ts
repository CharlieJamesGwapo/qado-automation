import { chromium } from '@playwright/test';
import { generatePatientData } from './src/data/test-data';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    storageState: 'auth/session.json',
    viewport: { width: 1920, height: 1080 },
  });
  const page = await context.newPage();

  await page.goto('https://qado.medisource.com/patient', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  // Skip eligibility — call AngularJS skip function via scope
  await page.evaluate(() => {
    // Try calling the AngularJS skip function directly
    const skipBtn = document.querySelector('[ng-click*="skip"]') as HTMLElement;
    if (skipBtn) {
      const angular = (window as any).angular;
      if (angular) {
        const scope = angular.element(skipBtn).scope();
        if (scope && scope.eligibility && scope.eligibility.skip) {
          scope.eligibility.skip();
          scope.$apply();
        }
      }
    }
  });
  await page.waitForTimeout(2000);

  // Force remove ALL modals and backdrops
  await page.evaluate(() => {
    document.querySelectorAll('.modal').forEach(m => m.remove());
    document.querySelectorAll('.modal-backdrop').forEach(b => b.remove());
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
  });
  await page.waitForTimeout(1000);

  // Remove required from eligibility form fields
  await page.evaluate(() => {
    const eligFields = document.querySelectorAll('input[name="medcareid"], input[name="lastname"], #dob, [name="eligibilitydateFrom"], [name="eligibilitydateTo"]');
    eligFields.forEach(el => {
      el.removeAttribute('required');
      el.removeAttribute('ng-required');
      el.classList.remove('ng-invalid', 'ng-invalid-required');
      el.classList.add('ng-valid');
    });
  });

  const data = generatePatientData();
  console.log('Patient:', data.lastName, data.firstName);

  // Fill ONLY the absolute minimum required fields via Playwright force-click
  // Dates
  await page.locator('#refDate').fill(data.refDate, { force: true });
  await page.locator('#refDate').press('Tab');
  await page.waitForTimeout(300);

  await page.locator('#pre_admission_date').fill(data.preAdmissionDate, { force: true });
  await page.locator('#pre_admission_date').press('Tab');
  await page.waitForTimeout(300);

  // Name
  await page.locator('#last_name').fill(data.lastName, { force: true });
  await page.locator('#first_name').fill(data.firstName, { force: true });

  // Birthdate
  await page.locator('#birthdate').fill(data.birthdate, { force: true });
  await page.locator('#birthdate').press('Tab');
  await page.waitForTimeout(300);

  // Gender - use label text since radio names are dynamic
  await page.evaluate(() => {
    const labels = document.querySelectorAll('label');
    for (const label of labels) {
      if (label.textContent?.trim() === 'Male') {
        const radio = label.querySelector('input[type="radio"]') || document.getElementById(label.getAttribute('for') || '');
        if (radio) { (radio as HTMLInputElement).click(); return; }
      }
    }
    // Fallback: find radio with value="Male"
    const radio = document.querySelector('input[type="radio"][value="Male"]') as HTMLInputElement;
    if (radio) { radio.click(); }
  });

  // Address
  await page.locator('#main_line1').fill(data.mainLine1, { force: true });
  await page.locator('#main_city').fill('Los Angeles', { force: true });
  // Zipcode - use evaluate to ensure it works
  await page.evaluate(() => {
    const el = document.querySelector('#main_zipcode') as HTMLInputElement;
    if (el) { el.value = '90210'; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); }
  });

  // State
  await page.evaluate(() => {
    const sel = document.querySelector('#main_state') as HTMLSelectElement;
    if (sel) {
      const ca = Array.from(sel.options).find(o => o.text.includes('California'));
      if (ca) { sel.value = ca.value; sel.dispatchEvent(new Event('change', { bubbles: true })); }
      if ((window as any).jQuery) { (window as any).jQuery(sel).trigger('chosen:updated').trigger('change'); }
      try { (window as any).angular.element(sel).scope().$apply(); } catch(e) {}
    }
  });

  // Service address same as patient - use JS
  await page.evaluate(() => {
    const buttons = document.querySelectorAll('button');
    for (const btn of buttons) {
      if (btn.textContent?.includes('Same as Patient')) {
        btn.click();
        return;
      }
    }
  });
  await page.waitForTimeout(2000);

  // Verify service address was copied - if not, fill manually
  await page.evaluate(() => {
    const serviceLine = document.querySelector('#service_line1') as HTMLInputElement;
    const mainLine = document.querySelector('#main_line1') as HTMLInputElement;
    if (serviceLine && (!serviceLine.value || serviceLine.value === '') && mainLine) {
      serviceLine.value = mainLine.value;
      serviceLine.dispatchEvent(new Event('input', { bubbles: true }));
      serviceLine.dispatchEvent(new Event('change', { bubbles: true }));

      const serviceCity = document.querySelector('#service_city') as HTMLInputElement;
      const mainCity = document.querySelector('#main_city') as HTMLInputElement;
      if (serviceCity && mainCity) { serviceCity.value = mainCity.value; serviceCity.dispatchEvent(new Event('input', { bubbles: true })); }

      const serviceZip = document.querySelector('#service_zipcode') as HTMLInputElement;
      const mainZip = document.querySelector('#main_zipcode') as HTMLInputElement;
      if (serviceZip && mainZip) { serviceZip.value = mainZip.value; serviceZip.dispatchEvent(new Event('input', { bubbles: true })); }

      // State
      const serviceState = document.querySelector('#service_state') as HTMLSelectElement;
      const mainState = document.querySelector('#main_state') as HTMLSelectElement;
      if (serviceState && mainState) {
        serviceState.value = mainState.value;
        serviceState.dispatchEvent(new Event('change', { bubbles: true }));
        if ((window as any).jQuery) { (window as any).jQuery(serviceState).trigger('chosen:updated').trigger('change'); }
      }

      try { (window as any).angular.element(serviceLine).scope().$apply(); } catch(e) {}
    }
  });

  // Physician attending
  await page.evaluate(() => {
    const sel = document.querySelector('#physician_attending') as HTMLSelectElement;
    if (sel && sel.options.length > 1) {
      sel.value = sel.options[1].value;
      sel.dispatchEvent(new Event('change', { bubbles: true }));
      if ((window as any).jQuery) { (window as any).jQuery(sel).trigger('chosen:updated').trigger('change'); }
      try { (window as any).angular.element(sel).scope().$apply(); } catch(e) {}
    }
  });

  // Admission type
  await page.evaluate(() => {
    const sel = document.querySelector('#admissiontype') as HTMLSelectElement;
    if (sel && sel.options.length > 1) {
      sel.value = sel.options[3].value;
      sel.dispatchEvent(new Event('change', { bubbles: true }));
      if ((window as any).jQuery) { (window as any).jQuery(sel).trigger('chosen:updated').trigger('change'); }
      try { (window as any).angular.element(sel).scope().$apply(); } catch(e) {}
    }
  });

  // Point of origin
  await page.evaluate(() => {
    const sel = document.querySelector('#point_of_origin') as HTMLSelectElement;
    if (sel && sel.options.length > 1) {
      sel.value = sel.options[1].value;
      sel.dispatchEvent(new Event('change', { bubbles: true }));
      if ((window as any).jQuery) { (window as any).jQuery(sel).trigger('chosen:updated').trigger('change'); }
      try { (window as any).angular.element(sel).scope().$apply(); } catch(e) {}
    }
  });

  // Insurance
  await page.evaluate(() => {
    const sel = document.querySelector('#primary_insurance') as HTMLSelectElement;
    if (sel && sel.options.length > 1) {
      sel.value = sel.options[1].value;
      sel.dispatchEvent(new Event('change', { bubbles: true }));
      if ((window as any).jQuery) { (window as any).jQuery(sel).trigger('chosen:updated').trigger('change'); }
      try { (window as any).angular.element(sel).scope().$apply(); } catch(e) {}
    }
  });

  // M0080
  await page.evaluate(() => {
    const radio = document.querySelector('input[name="M0080"][value="SN"]') as HTMLInputElement;
    if (radio) { radio.click(); }
  });

  // Clinical staff - interact with Chosen.js UI directly
  for (const id of ['cs_rn', 'cs_pt', 'cs_st', 'cs_ot', 'cs_cm']) {
    // Find the Chosen container for this select
    const chosenContainer = page.locator(`#${id}_chosen, select[name="${id}"] + .chosen-container`).first();
    if (await chosenContainer.isVisible({ timeout: 3000 }).catch(() => false)) {
      await chosenContainer.click();
      await page.waitForTimeout(500);
      // Click the first result in the dropdown
      const firstResult = page.locator('.chosen-results li.active-result').first();
      if (await firstResult.isVisible({ timeout: 3000 }).catch(() => false)) {
        await firstResult.click();
        await page.waitForTimeout(500);
      }
    } else {
      // Fallback: use jQuery + AngularJS
      await page.evaluate((sel) => {
        const el = document.querySelector('#' + sel) as HTMLSelectElement;
        if (!el || el.options.length <= 1) return;
        if ((window as any).jQuery) {
          (window as any).jQuery(el).val(el.options[1].value).trigger('chosen:updated').trigger('change');
        }
      }, id);
    }
  }

  await page.waitForTimeout(1000);

  // Screenshot before save
  await page.screenshot({ path: 'screenshots/debug2-before-save.png', fullPage: true });

  // Check validation errors
  const errors = await page.evaluate(() => {
    const form = document.querySelector('form');
    const invalidFields = document.querySelectorAll('.ng-invalid:not(form):not(.ng-isolate-scope)');
    const errorMsgs = document.querySelectorAll('.input-err, .error-msg, .text-danger, [class*="error"]');
    return {
      invalidCount: invalidFields.length,
      invalidFields: Array.from(invalidFields).slice(0, 10).map(f => `${f.tagName}#${f.id||''}.${(f.getAttribute('name')||'')} cls=${(f.getAttribute('class')||'').substring(0,40)}`),
      errorMsgs: Array.from(errorMsgs).map(e => (e as HTMLElement).innerText?.trim()).filter(t => t).slice(0, 10),
      formValid: form ? !form.classList.contains('ng-invalid') : 'no form',
    };
  });
  console.log('\nValidation before save:', JSON.stringify(errors, null, 2));

  // Click Save
  console.log('\nClicking Save...');
  await page.locator('button:has-text("Save")').click({ force: true });
  await page.waitForTimeout(8000);

  // Check what happened
  console.log('URL after save:', page.url());

  // Check for SweetAlert
  const swalInfo = await page.evaluate(() => {
    const swal = document.querySelector('.swal2-popup, .sweet-alert');
    if (swal) {
      const title = swal.querySelector('.swal2-title, h2')?.textContent?.trim();
      const content = swal.querySelector('.swal2-content, .swal2-html-container, p')?.textContent?.trim();
      return { visible: true, title, content };
    }
    return { visible: false };
  });
  console.log('SweetAlert:', JSON.stringify(swalInfo));

  // Check for toasts
  const toasts = await page.evaluate(() => {
    const toast = document.querySelectorAll('.toast, .notification, [class*="toast"], [class*="notify"]');
    return Array.from(toast).map(t => (t as HTMLElement).innerText?.trim()).filter(t => t);
  });
  console.log('Toasts:', toasts);

  await page.screenshot({ path: 'screenshots/debug2-after-save.png', fullPage: true });

  // Click OK on SweetAlert if visible
  const okBtn = page.locator('.swal2-confirm, .sweet-alert button.confirm, button:has-text("OK")').first();
  if (await okBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    console.log('Clicking OK on alert...');
    await okBtn.click();
    await page.waitForTimeout(5000);
    console.log('URL after OK:', page.url());
  }

  await page.screenshot({ path: 'screenshots/debug2-final.png', fullPage: true });
  console.log('Final URL:', page.url());

  await browser.close();
})();
