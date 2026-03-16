import { Page } from '@playwright/test';

export class LoginPage {
  constructor(private page: Page) {}

  // Locators
  private emailInput = this.page.locator('#loginemail');
  private passwordInput = this.page.locator('#loginpassword');
  private loginButton = this.page.locator('button[type="submit"]');

  async goto(): Promise<void> {
    await this.page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await this.page.waitForTimeout(2000);
  }

  async login(email: string, password: string): Promise<void> {
    await this.goto();

    // If already logged in (redirected to dashboard), skip login
    if (this.page.url().includes('/dashboard')) {
      return;
    }

    // Check if login form is visible
    const isLoginVisible = await this.emailInput.isVisible({ timeout: 5000 }).catch(() => false);
    if (!isLoginVisible) {
      // Already logged in or redirected
      return;
    }

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
