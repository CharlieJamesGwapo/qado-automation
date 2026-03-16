const { waitForPageLoad } = require('../helpers/utils');

class PatientManagerPage {
  constructor(page) {
    this.page = page;

    this.searchInput = this.page.locator('input[placeholder="Search Patients"]');
    this.patientRows = this.page.locator('tbody tr');
  }

  async goto() {
    await this.page.goto('/patients/admitted');
    await waitForPageLoad(this.page);
  }

  async searchPatient(name) {
    await this.searchInput.waitFor({ state: 'visible', timeout: 10000 });
    await this.searchInput.clear();
    await this.searchInput.fill(name);
    await this.page.waitForTimeout(2000);
    await waitForPageLoad(this.page);
  }

  async isPatientVisible(name) {
    const row = this.page.locator(`tbody tr:has-text("${name}")`);
    return await row.isVisible({ timeout: 5000 }).catch(() => false);
  }

  async openPatient(name) {
    const row = this.page.locator(`tbody tr:has-text("${name}")`).first();
    await row.waitFor({ state: 'visible', timeout: 10000 });
    const link = row.locator('a').first();
    await link.click();
    await waitForPageLoad(this.page);
  }

  async openFirstPatient() {
    const firstLink = this.patientRows.nth(1).locator('a').first();
    await firstLink.waitFor({ state: 'visible', timeout: 10000 });
    await firstLink.click();
    await waitForPageLoad(this.page);
  }

  async getPatientInfoFromUrl() {
    const url = this.page.url();
    const match = url.match(/patientcare\/([^/]+)\/([^/]+)/);
    if (match) {
      return { patientId: match[1], episodeId: match[2] };
    }
    return { patientId: '', episodeId: '' };
  }
}

module.exports = { PatientManagerPage };
