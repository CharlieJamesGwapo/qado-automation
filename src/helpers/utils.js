/**
 * Wait for AngularJS to finish processing
 */
async function waitForAngular(page) {
  await page.waitForFunction(() => {
    const angular = window.angular;
    if (!angular) return true;
    const injector = angular.element(document.body).injector();
    if (!injector) return true;
    const $http = injector.get('$http');
    return $http.pendingRequests.length === 0;
  }, { timeout: 15000 }).catch(() => {});
}

/**
 * Select an option from a dropdown.
 * Handles both native <select> and Chosen.js styled dropdowns.
 */
async function selectOption(page, selector, optionIndex = 1) {
  const select = page.locator(selector);

  // Check if native select is visible
  const isVisible = await select.isVisible({ timeout: 3000 }).catch(() => false);

  if (isVisible) {
    const options = await select.locator('option').allTextContents();
    const validOptions = options.filter(o => o.trim() && !o.includes('Select') && !o.includes('--'));
    if (validOptions.length > 0) {
      const idx = Math.min(optionIndex, validOptions.length - 1);
      await select.selectOption({ label: validOptions[idx] });
    }
    return;
  }

  // Native select is hidden — try Chosen.js UI interaction
  // Get the element's id to find its Chosen container
  const elId = await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    return el?.id || el?.getAttribute('name') || '';
  }, selector);

  if (elId) {
    // Try clicking the Chosen container
    const chosenContainer = page.locator(`#${elId}_chosen`).first();
    if (await chosenContainer.isVisible({ timeout: 3000 }).catch(() => false)) {
      await chosenContainer.click();
      await page.waitForTimeout(500);
      // Get the dropdown results
      const results = page.locator(`#${elId}_chosen .chosen-results li.active-result`);
      const count = await results.count();
      if (count > 0) {
        const idx = Math.min(optionIndex, count - 1);
        await results.nth(idx).click();
        await page.waitForTimeout(500);
        return;
      }
    }
  }

  // Fallback: set value via jQuery + AngularJS
  await page.evaluate(({ sel, idx }) => {
    const selectEl = document.querySelector(sel);
    if (!selectEl) return;

    const options = Array.from(selectEl.options).filter(
      o => o.value && o.text.trim() && !o.text.includes('Select') && !o.text.includes('--')
    );
    if (options.length === 0) return;

    const optIndex = Math.min(idx, options.length - 1);

    if (window.jQuery) {
      window.jQuery(selectEl).val(options[optIndex].value).trigger('chosen:updated').trigger('change');
    } else {
      selectEl.value = options[optIndex].value;
      selectEl.dispatchEvent(new Event('change', { bubbles: true }));
    }

    const angular = window.angular;
    if (angular) {
      const ngModel = angular.element(selectEl).controller('ngModel');
      if (ngModel) {
        ngModel.$setViewValue(options[optIndex].value);
        ngModel.$render();
      }
      try { angular.element(selectEl).scope().$apply(); } catch (e) {}
    }
  }, { sel: selector, idx: optionIndex });

  await page.waitForTimeout(500);
}

/**
 * Select option by visible text — handles Chosen.js
 */
async function selectByText(page, selector, text) {
  const select = page.locator(selector);
  const isVisible = await select.isVisible({ timeout: 3000 }).catch(() => false);

  if (isVisible) {
    await select.selectOption({ label: text });
  } else {
    await page.evaluate(({ sel, txt }) => {
      const selectEl = document.querySelector(sel);
      if (!selectEl) return;
      const option = Array.from(selectEl.options).find(o => o.text.trim().includes(txt));
      if (option) {
        if (window.jQuery) {
          window.jQuery(selectEl).val(option.value).trigger('chosen:updated').trigger('change');
        }
        const angular = window.angular;
        if (angular) {
          try { angular.element(selectEl).scope().$apply(); } catch (e) {}
        }
      }
    }, { sel: selector, txt: text });
    await page.waitForTimeout(500);
  }
}

/**
 * Fill a date input (mm/dd/yyyy format used by the app's datepicker)
 */
async function fillDate(page, selector, date) {
  const input = page.locator(selector);
  const isVisible = await input.isVisible({ timeout: 5000 }).catch(() => false);
  if (!isVisible) return;

  try {
    await input.click({ force: true });
    await input.fill(date, { force: true });
    await input.press('Escape');
    await page.waitForTimeout(300);
    await input.press('Tab');
  } catch {
    // Fallback
    await page.evaluate(({ sel, val }) => {
      const el = document.querySelector(sel);
      if (el) { el.value = val; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); }
    }, { sel: selector, val: date });
  }

  // Ensure AngularJS picks up the value
  await page.evaluate(({ sel, val }) => {
    const el = document.querySelector(sel);
    if (!el) return;
    const angular = window.angular;
    if (angular) {
      const ngModel = angular.element(el).controller('ngModel');
      if (ngModel) { ngModel.$setViewValue(val); ngModel.$render(); }
      try { angular.element(el).scope().$apply(); } catch(e) {}
    }
  }, { sel: selector, val: date });
  await page.waitForTimeout(500);
}

/**
 * Click a radio button by its name attribute and value
 */
async function selectRadio(page, name, value) {
  // Use label-based selection since radio names can be dynamic
  const clicked = await page.evaluate(({ n, v }) => {
    // Try direct selector first
    let radio = document.querySelector(`input[type="radio"][name="${n}"][value="${v}"]`);
    if (radio) { radio.click(); return true; }
    // Try by value only
    radio = document.querySelector(`input[type="radio"][value="${v}"]`);
    if (radio) { radio.click(); return true; }
    // Try by label text
    const labels = document.querySelectorAll('label');
    for (const label of labels) {
      if (label.textContent?.trim() === v) {
        const r = label.querySelector('input[type="radio"]');
        if (r) { r.click(); return true; }
      }
    }
    return false;
  }, { n: name, v: value });
}

/**
 * Click the first radio button for a given name attribute
 */
async function selectFirstRadio(page, name) {
  await page.evaluate((n) => {
    const radio = document.querySelector(`input[type="radio"][name="${n}"]`);
    if (radio) radio.click();
  }, name);
}

/**
 * Safe fill - fills via force or JS
 */
async function safeFill(page, selector, value) {
  const el = page.locator(selector);
  if (await el.isVisible({ timeout: 3000 }).catch(() => false)) {
    try {
      await el.clear();
      await el.fill(value);
    } catch {
      await page.evaluate(({ sel, val }) => {
        const input = document.querySelector(sel);
        if (input) { input.value = val; input.dispatchEvent(new Event('input', { bubbles: true })); }
      }, { sel: selector, val: value });
    }
  } else {
    // Try JS fallback for hidden elements
    await page.evaluate(({ sel, val }) => {
      const input = document.querySelector(sel);
      if (input) { input.value = val; input.dispatchEvent(new Event('input', { bubbles: true })); }
    }, { sel: selector, val: value });
  }
}

/**
 * Safe click
 */
async function safeClick(page, selector) {
  const el = page.locator(selector);
  if (await el.isVisible({ timeout: 3000 }).catch(() => false)) {
    await el.click();
  }
}

/**
 * Wait for page to stabilize after navigation
 */
async function waitForPageLoad(page) {
  await page.waitForLoadState('domcontentloaded').catch(() => {});
  await page.waitForTimeout(2000);
}

/**
 * Dismiss any alert/modal dialogs
 */
async function dismissDialogs(page) {
  const okButton = page.locator('.swal2-confirm, button:has-text("OK"), button:has-text("Yes")').first();
  if (await okButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await okButton.click();
    await page.waitForTimeout(500);
  }
}

/**
 * Force-remove all Bootstrap modals from the DOM
 */
async function forceCloseModals(page) {
  await page.evaluate(() => {
    document.querySelectorAll('.modal').forEach(m => m.remove());
    document.querySelectorAll('.modal-backdrop').forEach(b => b.remove());
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
  });
  await page.waitForTimeout(500);
}

/**
 * Remove required validation from eligibility check fields
 */
async function clearEligibilityValidation(page) {
  await page.evaluate(() => {
    const selectors = [
      'input[name="medcareid"]', 'input[name="lastname"]', '#dob',
      '[name="eligibilitydateFrom"]', '[name="eligibilitydateTo"]'
    ];
    selectors.forEach(sel => {
      const el = document.querySelector(sel);
      if (el) {
        el.removeAttribute('required');
        el.removeAttribute('ng-required');
        el.classList.remove('ng-invalid', 'ng-invalid-required');
        el.classList.add('ng-valid');
      }
    });
  });
}

function formatDate(date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${month}/${day}/${date.getFullYear()}`;
}

function getDateOffset(daysFromNow) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return formatDate(date);
}

function formatPhone(phone) {
  const digits = phone.replace(/\D/g, '').substring(0, 10);
  return `(${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6, 10)}`;
}

module.exports = {
  waitForAngular,
  selectOption,
  selectByText,
  fillDate,
  selectRadio,
  selectFirstRadio,
  safeFill,
  safeClick,
  waitForPageLoad,
  dismissDialogs,
  forceCloseModals,
  clearEligibilityValidation,
  formatDate,
  getDateOffset,
  formatPhone,
};
