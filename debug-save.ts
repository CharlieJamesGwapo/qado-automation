import { chromium } from '@playwright/test';
import { generatePatientData } from './src/data/test-data';
import * as fs from 'fs';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    storageState: 'auth/session.json',
    viewport: { width: 1920, height: 1080 },
  });
  const page = await context.newPage();

  // Go to Add Patient
  await page.goto('https://qado.medisource.com/patient', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  // Skip eligibility modal
  const modal = page.locator('.modal.in');
  if (await modal.isVisible({ timeout: 5000 }).catch(() => false)) {
    const skip = modal.locator('button:has-text("Skip")');
    if (await skip.isVisible({ timeout: 3000 }).catch(() => false)) {
      await skip.click();
      await page.waitForTimeout(2000);
    }
  }

  const data = generatePatientData();
  console.log('Patient:', data.lastName, data.firstName);

  // Fill minimum required fields only
  // Referral date
  await page.locator('#refDate').click();
  await page.locator('#refDate').clear();
  await page.locator('#refDate').fill(data.refDate);
  await page.locator('#refDate').press('Tab');
  await page.waitForTimeout(500);

  // Pre-admission date
  await page.locator('#pre_admission_date').click();
  await page.locator('#pre_admission_date').clear();
  await page.locator('#pre_admission_date').fill(data.preAdmissionDate);
  await page.locator('#pre_admission_date').press('Tab');
  await page.waitForTimeout(500);

  // Auto-assign MRN
  const mrn = page.locator('#medRecNumberAssign');
  if (await mrn.isVisible() && !(await mrn.isChecked())) {
    await mrn.click();
  }

  // Insurance - use JS for Chosen.js
  await page.evaluate(() => {
    const sel = document.querySelector('#primary_insurance') as HTMLSelectElement;
    if (sel && sel.options.length > 1) {
      sel.value = sel.options[1].value;
      sel.dispatchEvent(new Event('change', { bubbles: true }));
      if ((window as any).jQuery) {
        (window as any).jQuery(sel).trigger('chosen:updated').trigger('change');
      }
      const angular = (window as any).angular;
      if (angular) { try { angular.element(sel).scope().$apply(); } catch(e) {} }
    }
  });
  await page.waitForTimeout(500);

  // Patient name
  await page.locator('#last_name').fill(data.lastName);
  await page.locator('#first_name').fill(data.firstName);

  // Birthdate
  await page.locator('#birthdate').click();
  await page.locator('#birthdate').clear();
  await page.locator('#birthdate').fill(data.birthdate);
  await page.locator('#birthdate').press('Tab');
  await page.waitForTimeout(500);

  // Gender
  await page.evaluate(() => {
    const radio = document.querySelector('input[name="728"][value="Male"]') as HTMLInputElement;
    if (radio) { radio.checked = true; radio.dispatchEvent(new Event('change', { bubbles: true })); }
  });

  // Address
  await page.locator('#main_line1').fill(data.mainLine1);
  await page.locator('#main_city').fill(data.mainCity);

  // State - Chosen.js
  await page.evaluate(() => {
    const sel = document.querySelector('#main_state') as HTMLSelectElement;
    if (sel) {
      const ca = Array.from(sel.options).find(o => o.text.includes('California'));
      if (ca) sel.value = ca.value;
      sel.dispatchEvent(new Event('change', { bubbles: true }));
      if ((window as any).jQuery) { (window as any).jQuery(sel).trigger('chosen:updated').trigger('change'); }
      try { (window as any).angular.element(sel).scope().$apply(); } catch(e) {}
    }
  });
  await page.waitForTimeout(500);

  await page.locator('#main_zipcode').fill(data.mainZipcode);

  // Service address - same as patient
  const sameAs = page.locator('button:has-text("Same as Patient Address")');
  if (await sameAs.isVisible({ timeout: 3000 }).catch(() => false)) {
    await sameAs.click();
    await page.waitForTimeout(1000);
  }

  // Physician - Chosen.js
  await page.evaluate(() => {
    const sel = document.querySelector('#physician_attending') as HTMLSelectElement;
    if (sel && sel.options.length > 1) {
      sel.value = sel.options[1].value;
      sel.dispatchEvent(new Event('change', { bubbles: true }));
      if ((window as any).jQuery) { (window as any).jQuery(sel).trigger('chosen:updated').trigger('change'); }
      try { (window as any).angular.element(sel).scope().$apply(); } catch(e) {}
    }
  });
  await page.waitForTimeout(500);

  // Admission type
  await page.evaluate(() => {
    const sel = document.querySelector('#admissiontype') as HTMLSelectElement;
    if (sel && sel.options.length > 1) {
      sel.value = sel.options[3].value; // Elective
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

  // M0080 discipline
  await page.evaluate(() => {
    const radio = document.querySelector('input[name="M0080"][value="SN"]') as HTMLInputElement;
    if (radio) { radio.checked = true; radio.dispatchEvent(new Event('change', { bubbles: true })); }
  });

  // Clinical staff - RN
  await page.evaluate(() => {
    const sel = document.querySelector('#cs_rn') as HTMLSelectElement;
    if (sel && sel.options.length > 1) {
      sel.value = sel.options[1].value;
      sel.dispatchEvent(new Event('change', { bubbles: true }));
      if ((window as any).jQuery) { (window as any).jQuery(sel).trigger('chosen:updated').trigger('change'); }
      try { (window as any).angular.element(sel).scope().$apply(); } catch(e) {}
    }
  });

  // PT
  await page.evaluate(() => {
    const sel = document.querySelector('#cs_pt') as HTMLSelectElement;
    if (sel && sel.options.length > 1) {
      sel.value = sel.options[1].value;
      sel.dispatchEvent(new Event('change', { bubbles: true }));
      if ((window as any).jQuery) { (window as any).jQuery(sel).trigger('chosen:updated').trigger('change'); }
      try { (window as any).angular.element(sel).scope().$apply(); } catch(e) {}
    }
  });

  // ST
  await page.evaluate(() => {
    const sel = document.querySelector('#cs_st') as HTMLSelectElement;
    if (sel && sel.options.length > 1) {
      sel.value = sel.options[1].value;
      sel.dispatchEvent(new Event('change', { bubbles: true }));
      if ((window as any).jQuery) { (window as any).jQuery(sel).trigger('chosen:updated').trigger('change'); }
      try { (window as any).angular.element(sel).scope().$apply(); } catch(e) {}
    }
  });

  // OT
  await page.evaluate(() => {
    const sel = document.querySelector('#cs_ot') as HTMLSelectElement;
    if (sel && sel.options.length > 1) {
      sel.value = sel.options[1].value;
      sel.dispatchEvent(new Event('change', { bubbles: true }));
      if ((window as any).jQuery) { (window as any).jQuery(sel).trigger('chosen:updated').trigger('change'); }
      try { (window as any).angular.element(sel).scope().$apply(); } catch(e) {}
    }
  });

  // CM
  await page.evaluate(() => {
    const sel = document.querySelector('#cs_cm') as HTMLSelectElement;
    if (sel && sel.options.length > 1) {
      sel.value = sel.options[1].value;
      sel.dispatchEvent(new Event('change', { bubbles: true }));
      if ((window as any).jQuery) { (window as any).jQuery(sel).trigger('chosen:updated').trigger('change'); }
      try { (window as any).angular.element(sel).scope().$apply(); } catch(e) {}
    }
  });

  await page.waitForTimeout(1000);

  // Screenshot before save
  await page.screenshot({ path: 'screenshots/debug-before-save.png', fullPage: true });

  // Check for any validation errors
  const errors = await page.evaluate(() => {
    const errEls = document.querySelectorAll('.ng-invalid, .input-err, .has-error, .error-msg');
    return Array.from(errEls).map(e => {
      const name = e.getAttribute('name') || e.getAttribute('id') || '';
      const cls = e.getAttribute('class') || '';
      return `${e.tagName} name=${name} class=${cls.substring(0, 60)}`;
    }).slice(0, 20);
  });
  console.log('\nValidation errors before save:', errors);

  // Check required fields that are still empty
  const emptyRequired = await page.evaluate(() => {
    const reqFields = document.querySelectorAll('[required], [ng-required]');
    const empty: string[] = [];
    reqFields.forEach(f => {
      const input = f as HTMLInputElement | HTMLSelectElement;
      const name = input.getAttribute('name') || input.getAttribute('id') || '';
      if (!input.value || input.value === '') {
        empty.push(`${input.tagName} name=${name} id=${input.id}`);
      }
    });
    return empty;
  });
  console.log('\nEmpty required fields:', emptyRequired);

  // Click Save
  console.log('\nClicking Save...');
  await page.locator('button:has-text("Save")').click();
  await page.waitForTimeout(5000);

  // Check for alerts/modals
  const alertText = await page.evaluate(() => {
    const swal = document.querySelector('.swal2-content, .swal2-title, .swal2-html-container');
    return swal ? (swal as HTMLElement).innerText : '';
  });
  console.log('Alert after save:', alertText);

  // Screenshot after save
  await page.screenshot({ path: 'screenshots/debug-after-save.png', fullPage: true });
  console.log('URL after save:', page.url());

  // Dismiss any alert
  const okBtn = page.locator('.swal2-confirm, button:has-text("OK"), button:has-text("Yes")').first();
  if (await okBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await okBtn.click();
    await page.waitForTimeout(3000);
  }

  console.log('Final URL:', page.url());
  await page.screenshot({ path: 'screenshots/debug-final.png', fullPage: true });

  await browser.close();
})();
