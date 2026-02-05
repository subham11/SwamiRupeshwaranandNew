import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class SupportPage extends BasePage {
  // Locators
  readonly subjectInput: Locator;
  readonly categorySelect: Locator;
  readonly prioritySelect: Locator;
  readonly descriptionTextarea: Locator;
  readonly emailInput: Locator;
  readonly submitButton: Locator;
  readonly successMessage: Locator;
  readonly errorMessage: Locator;
  readonly ticketList: Locator;
  readonly ticketItems: Locator;

  constructor(page: Page) {
    super(page);
    this.subjectInput = page.locator('input[name="subject"]');
    this.categorySelect = page.locator('select[name="category"], [data-testid="category-select"]');
    this.prioritySelect = page.locator('select[name="priority"], [data-testid="priority-select"]');
    this.descriptionTextarea = page.locator('textarea[name="description"]');
    this.emailInput = page.locator('input[name="email"]');
    this.submitButton = page.locator('button[type="submit"]');
    this.successMessage = page.locator('[data-testid="success-message"]');
    this.errorMessage = page.locator('[data-testid="error-message"]');
    this.ticketList = page.locator('[data-testid="ticket-list"]');
    this.ticketItems = page.locator('[data-testid="ticket-item"]');
  }

  async goto(locale: string = 'en') {
    await this.page.goto(`/${locale}/support`);
  }

  async createTicket(options: {
    subject: string;
    category?: string;
    priority?: string;
    description: string;
    email?: string;
  }) {
    await this.subjectInput.fill(options.subject);
    
    if (options.category) {
      await this.categorySelect.selectOption(options.category);
    }
    if (options.priority) {
      await this.prioritySelect.selectOption(options.priority);
    }
    
    await this.descriptionTextarea.fill(options.description);
    
    if (options.email) {
      await this.emailInput.fill(options.email);
    }
    
    await this.submitButton.click();
  }

  async getTicketCount(): Promise<number> {
    return this.ticketItems.count();
  }

  async clickTicket(index: number) {
    await this.ticketItems.nth(index).click();
  }
}
