import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  // Locators
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly forgotPasswordLink: Locator;
  readonly registerLink: Locator;
  readonly googleLoginButton: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.locator('input[name="email"], input[type="email"]');
    this.passwordInput = page.locator('input[name="password"], input[type="password"]');
    this.submitButton = page.locator('button[type="submit"]');
    this.errorMessage = page.locator('[data-testid="error-message"], .error-message');
    this.forgotPasswordLink = page.locator('[data-testid="forgot-password"]');
    this.registerLink = page.locator('[data-testid="register-link"]');
    this.googleLoginButton = page.locator('[data-testid="google-login"]');
  }

  async goto(locale: string = 'en') {
    await this.page.goto(`/${locale}/login`);
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async getErrorMessage(): Promise<string | null> {
    if (await this.errorMessage.isVisible()) {
      return this.errorMessage.textContent();
    }
    return null;
  }

  async navigateToForgotPassword() {
    await this.forgotPasswordLink.click();
  }

  async navigateToRegister() {
    await this.registerLink.click();
  }

  async loginWithGoogle() {
    await this.googleLoginButton.click();
  }
}
