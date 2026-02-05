import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class NewsletterPage extends BasePage {
  // Locators - for inline newsletter form
  readonly emailInput: Locator;
  readonly nameInput: Locator;
  readonly submitButton: Locator;
  readonly successMessage: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.locator('[data-testid="newsletter-email"], input[name="newsletterEmail"]');
    this.nameInput = page.locator('[data-testid="newsletter-name"], input[name="newsletterName"]');
    this.submitButton = page.locator('[data-testid="newsletter-submit"]');
    this.successMessage = page.locator('[data-testid="newsletter-success"]');
    this.errorMessage = page.locator('[data-testid="newsletter-error"]');
  }

  async subscribe(email: string, name?: string) {
    await this.emailInput.fill(email);
    if (name && await this.nameInput.isVisible()) {
      await this.nameInput.fill(name);
    }
    await this.submitButton.click();
  }

  async isSubscriptionSuccessful(): Promise<boolean> {
    return this.successMessage.isVisible();
  }

  async getErrorMessage(): Promise<string | null> {
    if (await this.errorMessage.isVisible()) {
      return this.errorMessage.textContent();
    }
    return null;
  }
}
