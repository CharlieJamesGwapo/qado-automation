class LoginPage {
  constructor(page) {
    this.page = page;

    // Locators
    this.emailInput = this.page.locator('#loginemail');
    this.passwordInput = this.page.locator('#loginpassword');
    this.loginButton = this.page.locator('button[type="submit"]');
  }

  async goto() {
    await this.page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await this.page.waitForTimeout(2000);
  }

  async login(email, password) {
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

  async isLoggedIn() {
    return this.page.url().includes('/dashboard');
  }
}

module.exports = { LoginPage };
