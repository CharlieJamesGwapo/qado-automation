import { Page } from '@playwright/test';

export class LoginPage {
  constructor(private page: Page) {}

  // Locators
  private emailInput = this.page.locator('#loginemail');
  private passwordInput = this.page.locator('#loginpassword');
  private loginButton = this.page.locator('button[type="submit"]');

  async goto(): Promise<void> {
    await this.page.goto('/login');
    await this.page.waitForLoadState('networkidle');
  }

  async login(email: string, password: string): Promise<void> {
    await this.goto();
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(3000);
  }

  async isLoggedIn(): Promise<boolean> {
    return this.page.url().includes('/dashboard');
  }
}
