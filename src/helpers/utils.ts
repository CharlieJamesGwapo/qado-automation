import { Page, Locator } from '@playwright/test';

/**
 * Wait for AngularJS to finish processing
 */
export async function waitForAngular(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    const angular = (window as any).angular;
    if (!angular) return true;
    const injector = angular.element(document.body).injector();
    if (!injector) return true;
    const $http = injector.get('$http');
    return $http.pendingRequests.length === 0;
  }, { timeout: 15000 }).catch(() => {});
  await page.waitForLoadState('networkidle').catch(() => {});
}

/**
 * Select an option from a standard HTML <select> dropdown
 */
export async function selectOption(page: Page, selector: string, optionIndex: number = 1): Promise<void> {
  const select = page.locator(selector);
  await select.waitFor({ state: 'visible', timeout: 10000 });
  const options = await select.locator('option').allTextContents();
  const validOptions = options.filter(o => o.trim() && !o.includes('Select') && !o.includes('--'));
  if (validOptions.length > 0) {
    const idx = Math.min(optionIndex, validOptions.length - 1);
    await select.selectOption({ label: validOptions[idx] });
  }
}

/**
 * Select option by visible text
 */
export async function selectByText(page: Page, selector: string, text: string): Promise<void> {
  const select = page.locator(selector);
  await select.waitFor({ state: 'visible', timeout: 10000 });
  await select.selectOption({ label: text });
}

/**
 * Fill a date input (mm/dd/yyyy format used by the app's datepicker)
 */
export async function fillDate(page: Page, selector: string, date: string): Promise<void> {
  const input = page.locator(selector);
  await input.waitFor({ state: 'visible', timeout: 10000 });
  await input.click();
  await input.clear();
  await input.fill(date);
  await input.press('Tab');
  await page.waitForTimeout(300);
}

/**
 * Click a radio button by its name attribute and value
 */
export async function selectRadio(page: Page, name: string, value: string): Promise<void> {
  await page.locator(`input[type="radio"][name="${name}"][value="${value}"]`).click();
}

/**
 * Click the first radio button for a given name attribute
 */
export async function selectFirstRadio(page: Page, name: string): Promise<void> {
  await page.locator(`input[type="radio"][name="${name}"]`).first().click();
}

/**
 * Safe fill - only fills if element is visible
 */
export async function safeFill(page: Page, selector: string, value: string): Promise<void> {
  const el = page.locator(selector);
  if (await el.isVisible({ timeout: 3000 }).catch(() => false)) {
    await el.clear();
    await el.fill(value);
  }
}

/**
 * Safe click - only clicks if element is visible
 */
export async function safeClick(page: Page, selector: string): Promise<void> {
  const el = page.locator(selector);
  if (await el.isVisible({ timeout: 3000 }).catch(() => false)) {
    await el.click();
  }
}

/**
 * Wait for page to stabilize after navigation
 */
export async function waitForPageLoad(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(1000);
  await waitForAngular(page);
}

/**
 * Dismiss any alert/modal dialogs
 */
export async function dismissDialogs(page: Page): Promise<void> {
  const okButton = page.locator('.swal2-confirm, button:has-text("OK")').first();
  if (await okButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await okButton.click();
    await page.waitForTimeout(500);
  }
}

/**
 * Format date as mm/dd/yyyy
 */
export function formatDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
}

/**
 * Get a date offset from today
 */
export function getDateOffset(daysFromNow: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return formatDate(date);
}

/**
 * Format phone number as (000) 000-0000
 */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '').substring(0, 10);
  return `(${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6, 10)}`;
}
