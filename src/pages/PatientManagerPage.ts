import { Page, expect } from '@playwright/test';
import { waitForPageLoad } from '../helpers/utils';

export class PatientManagerPage {
  constructor(private page: Page) {}

  private searchInput = this.page.locator('input[placeholder="Search Patients"]');
  private patientRows = this.page.locator('tbody tr');

  async goto(): Promise<void> {
    await this.page.goto('/patients/admitted');
    await waitForPageLoad(this.page);
  }

  async searchPatient(name: string): Promise<void> {
    await this.searchInput.waitFor({ state: 'visible', timeout: 10000 });
    await this.searchInput.clear();
    await this.searchInput.fill(name);
    await this.page.waitForTimeout(2000);
    await waitForPageLoad(this.page);
  }

  async isPatientVisible(name: string): Promise<boolean> {
    const row = this.page.locator(`tbody tr:has-text("${name}")`);
    return await row.isVisible({ timeout: 5000 }).catch(() => false);
  }

  async openPatient(name: string): Promise<void> {
    const row = this.page.locator(`tbody tr:has-text("${name}")`).first();
    await row.waitFor({ state: 'visible', timeout: 10000 });
    const link = row.locator('a').first();
    await link.click();
    await waitForPageLoad(this.page);
  }

  async openFirstPatient(): Promise<void> {
    const firstLink = this.patientRows.nth(1).locator('a').first();
    await firstLink.waitFor({ state: 'visible', timeout: 10000 });
    await firstLink.click();
    await waitForPageLoad(this.page);
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
