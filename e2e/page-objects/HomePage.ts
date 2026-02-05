import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class HomePage extends BasePage {
  // Locators
  readonly heroSection: Locator;
  readonly navBar: Locator;
  readonly languageToggle: Locator;
  readonly themeToggle: Locator;
  readonly loginButton: Locator;
  readonly registerButton: Locator;
  readonly footer: Locator;

  constructor(page: Page) {
    super(page);
    this.heroSection = page.locator('[data-testid="hero-section"]');
    this.navBar = page.locator('nav');
    this.languageToggle = page.locator('[data-testid="language-toggle"]');
    this.themeToggle = page.locator('[data-testid="theme-toggle"]');
    this.loginButton = page.locator('[data-testid="login-button"]');
    this.registerButton = page.locator('[data-testid="register-button"]');
    this.footer = page.locator('footer');
  }

  async goto(locale: string = 'en') {
    await this.page.goto(`/${locale}`);
  }

  async switchLanguage(locale: 'en' | 'hi') {
    await this.languageToggle.click();
    await this.page.locator(`[data-testid="lang-${locale}"]`).click();
  }

  async toggleTheme() {
    await this.themeToggle.click();
  }

  async navigateToLogin() {
    await this.loginButton.click();
  }

  async navigateToRegister() {
    await this.registerButton.click();
  }

  async isHeroVisible(): Promise<boolean> {
    return this.heroSection.isVisible();
  }
}
