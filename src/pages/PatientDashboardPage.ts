import { Page } from '@playwright/test';
import { waitForPageLoad, dismissDialogs } from '../helpers/utils';

export class PatientDashboardPage {
  constructor(private page: Page) {}

  // Tab navigation
  async navigateToTab(tabName: string): Promise<void> {
    const tab = this.page.locator(`a:has-text("${tabName}")`).first();
    await tab.waitFor({ state: 'visible', timeout: 10000 });
    await tab.click();
    await waitForPageLoad(this.page);
  }

  async goToTasks(): Promise<void> { await this.navigateToTab('Tasks'); }
  async goToMDOrders(): Promise<void> { await this.navigateToTab('MD Orders'); }
  async goToCommunication(): Promise<void> { await this.navigateToTab('Communication'); }
  async goToAdverseEvents(): Promise<void> { await this.navigateToTab('Adverse Events'); }
  async goToMedication(): Promise<void> { await this.navigateToTab('Medication'); }
  async goToMiscellaneous(): Promise<void> { await this.navigateToTab('Miscellaneous'); }
  async goToNursingCarePlan(): Promise<void> { await this.navigateToTab('Nursing Care Plan'); }
  async goToChart(): Promise<void> { await this.navigateToTab('Chart'); }
  async goToVSMonitor(): Promise<void> { await this.navigateToTab('VS Monitor'); }

  // Go to patient dashboard via URL
  async goto(patientId: string, episodeId: string): Promise<void> {
    await this.page.goto(`/patientcare/${patientId}/${episodeId}/overview`);
    await waitForPageLoad(this.page);
  }

  // Get the "+" FAB button for adding tasks
  async clickAddButton(): Promise<void> {
    const addBtn = this.page.locator('a.btn-float, button.btn-float, .fab, [class*="float"] a, a:has(i.zmdi-plus), a.add-btn').first();
    if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addBtn.click();
      await this.page.waitForTimeout(1000);
    } else {
      // Try the blue + button visible in screenshot
      const plusBtn = this.page.locator('.fixed-action-btn a, .btn-fab, [class*="action-btn"] a').first();
      await plusBtn.click();
      await this.page.waitForTimeout(1000);
    }
  }

  // Click on a task in the task list
  async openTask(taskName: string): Promise<void> {
    const taskLink = this.page.locator(`a:has-text("${taskName}")`).first();
    await taskLink.waitFor({ state: 'visible', timeout: 10000 });
    await taskLink.click();
    await waitForPageLoad(this.page);
  }

  // Schedule a new visit
  async scheduleVisit(): Promise<void> {
    await this.clickAddButton();
    // Look for add visit options in the FAB menu
    const addVisit = this.page.locator('a:has-text("Add Visit"), a:has-text("Schedule"), button:has-text("Add Visit"), a:has-text("Add Task")').first();
    if (await addVisit.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addVisit.click();
      await waitForPageLoad(this.page);
    }
  }

  // Get patient name displayed on the dashboard
  async getPatientName(): Promise<string> {
    const nameEl = this.page.locator('h1, h2, .patient-name, [class*="patient"] h1, [class*="patient"] h2').first();
    return await nameEl.textContent() || '';
  }

  // Check if a specific tab is active
  async isTabActive(tabName: string): Promise<boolean> {
    const tab = this.page.locator(`.nav-tabs li.active:has-text("${tabName}"), .waves-effect.active:has-text("${tabName}")`);
    return await tab.isVisible({ timeout: 3000 }).catch(() => false);
  }

  // Get info from URL
  getPatientInfoFromUrl(): { patientId: string; episodeId: string } {
    const url = this.page.url();
    const match = url.match(/patientcare\/([^/]+)\/([^/]+)/);
    if (match) {
      return { patientId: match[1], episodeId: match[2] };
    }
    return { patientId: '', episodeId: '' };
  }
}
