import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class DonationPage extends BasePage {
  // Locators
  readonly amountInput: Locator;
  readonly predefinedAmounts: Locator;
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly phoneInput: Locator;
  readonly purposeSelect: Locator;
  readonly recurringCheckbox: Locator;
  readonly anonymousCheckbox: Locator;
  readonly messageTextarea: Locator;
  readonly submitButton: Locator;
  readonly successMessage: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.amountInput = page.locator('input[name="amount"]');
    this.predefinedAmounts = page.locator('[data-testid="predefined-amount"]');
    this.nameInput = page.locator('input[name="donorName"]');
    this.emailInput = page.locator('input[name="donorEmail"]');
    this.phoneInput = page.locator('input[name="donorPhone"]');
    this.purposeSelect = page.locator('select[name="purpose"], [data-testid="purpose-select"]');
    this.recurringCheckbox = page.locator('input[name="isRecurring"]');
    this.anonymousCheckbox = page.locator('input[name="isAnonymous"]');
    this.messageTextarea = page.locator('textarea[name="message"]');
    this.submitButton = page.locator('button[type="submit"]');
    this.successMessage = page.locator('[data-testid="success-message"]');
    this.errorMessage = page.locator('[data-testid="error-message"]');
  }

  async goto(locale: string = 'en') {
    await this.page.goto(`/${locale}/donate`);
  }

  async selectPredefinedAmount(index: number) {
    await this.predefinedAmounts.nth(index).click();
  }

  async fillCustomAmount(amount: string) {
    await this.amountInput.fill(amount);
  }

  async fillDonorInfo(name: string, email: string, phone?: string) {
    await this.nameInput.fill(name);
    await this.emailInput.fill(email);
    if (phone) {
      await this.phoneInput.fill(phone);
    }
  }

  async selectPurpose(purpose: string) {
    await this.purposeSelect.selectOption(purpose);
  }

  async setRecurring(recurring: boolean) {
    if (recurring) {
      await this.recurringCheckbox.check();
    } else {
      await this.recurringCheckbox.uncheck();
    }
  }

  async setAnonymous(anonymous: boolean) {
    if (anonymous) {
      await this.anonymousCheckbox.check();
    } else {
      await this.anonymousCheckbox.uncheck();
    }
  }

  async addMessage(message: string) {
    await this.messageTextarea.fill(message);
  }

  async submitDonation() {
    await this.submitButton.click();
  }

  async makeDonation(options: {
    amount: string;
    name: string;
    email: string;
    phone?: string;
    purpose?: string;
    recurring?: boolean;
    anonymous?: boolean;
    message?: string;
  }) {
    await this.fillCustomAmount(options.amount);
    await this.fillDonorInfo(options.name, options.email, options.phone);
    
    if (options.purpose) {
      await this.selectPurpose(options.purpose);
    }
    if (options.recurring !== undefined) {
      await this.setRecurring(options.recurring);
    }
    if (options.anonymous !== undefined) {
      await this.setAnonymous(options.anonymous);
    }
    if (options.message) {
      await this.addMessage(options.message);
    }
    
    await this.submitDonation();
  }
}
