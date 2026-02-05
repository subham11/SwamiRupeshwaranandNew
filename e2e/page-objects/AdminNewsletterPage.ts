import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { NewsletterFrequency } from '../fixtures/test-data';

export class AdminNewsletterPage extends BasePage {
  // Newsletter List
  readonly newslettersTable: Locator;
  readonly newsletterRows: Locator;
  readonly createNewsletterButton: Locator;

  // Newsletter Form Modal
  readonly newsletterModal: Locator;
  readonly subjectInput: Locator;
  readonly contentEditor: Locator;
  readonly frequencySelect: Locator;
  readonly scheduleInput: Locator;
  readonly saveAsDraftButton: Locator;
  readonly sendNowButton: Locator;
  readonly scheduleButton: Locator;

  // Subscribers Tab
  readonly subscribersTab: Locator;
  readonly subscribersTable: Locator;
  readonly subscriberRows: Locator;
  readonly addSubscriberButton: Locator;

  // Email Preview
  readonly previewButton: Locator;
  readonly previewModal: Locator;

  // Trigger Email
  readonly triggerEmailButton: Locator;
  readonly triggerConfirmModal: Locator;
  readonly triggerConfirmButton: Locator;

  // Toast
  readonly successToast: Locator;
  readonly errorToast: Locator;

  constructor(page: Page) {
    super(page);
    // Newsletter List
    this.newslettersTable = page.locator('[data-testid="newsletters-table"]');
    this.newsletterRows = page.locator('[data-testid="newsletter-row"]');
    this.createNewsletterButton = page.locator('[data-testid="create-newsletter-button"], button:has-text("Create Newsletter")');

    // Newsletter Form Modal
    this.newsletterModal = page.locator('[data-testid="newsletter-modal"], [role="dialog"]:has-text("Newsletter")');
    this.subjectInput = page.locator('[data-testid="newsletter-subject"], input[name="subject"]');
    this.contentEditor = page.locator('[data-testid="newsletter-content"], [contenteditable="true"], textarea[name="content"]');
    this.frequencySelect = page.locator('[data-testid="newsletter-frequency"], select[name="frequency"]');
    this.scheduleInput = page.locator('[data-testid="newsletter-schedule"], input[name="schedule"]');
    this.saveAsDraftButton = page.locator('[data-testid="save-draft"], button:has-text("Save as Draft")');
    this.sendNowButton = page.locator('[data-testid="send-now"], button:has-text("Send Now")');
    this.scheduleButton = page.locator('[data-testid="schedule-newsletter"], button:has-text("Schedule")');

    // Subscribers Tab
    this.subscribersTab = page.locator('[data-testid="subscribers-tab"], [role="tab"]:has-text("Subscribers")');
    this.subscribersTable = page.locator('[data-testid="subscribers-table"]');
    this.subscriberRows = page.locator('[data-testid="subscriber-row"]');
    this.addSubscriberButton = page.locator('[data-testid="add-subscriber"], button:has-text("Add Subscriber")');

    // Email Preview
    this.previewButton = page.locator('[data-testid="preview-button"], button:has-text("Preview")');
    this.previewModal = page.locator('[data-testid="preview-modal"], [role="dialog"]:has-text("Preview")');

    // Trigger Email
    this.triggerEmailButton = page.locator('[data-testid="trigger-email"], button:has-text("Send to All")');
    this.triggerConfirmModal = page.locator('[data-testid="trigger-confirm-modal"]');
    this.triggerConfirmButton = page.locator('[data-testid="trigger-confirm"], button:has-text("Confirm")');

    // Toast
    this.successToast = page.locator('[data-testid="success-toast"], .toast-success');
    this.errorToast = page.locator('[data-testid="error-toast"], .toast-error');
  }

  async goto(locale: string = 'en') {
    await this.page.goto(`/${locale}/admin/newsletter`);
  }

  async getNewsletterCount(): Promise<number> {
    return this.newsletterRows.count();
  }

  async openCreateNewsletterModal() {
    await this.createNewsletterButton.click();
    await this.newsletterModal.waitFor({ state: 'visible' });
  }

  async createNewsletter(options: {
    subject: string;
    content: string;
    frequency: NewsletterFrequency;
    schedule?: string;
  }) {
    await this.openCreateNewsletterModal();
    await this.subjectInput.fill(options.subject);
    await this.contentEditor.fill(options.content);
    await this.frequencySelect.selectOption(options.frequency);
    
    if (options.schedule) {
      await this.scheduleInput.fill(options.schedule);
      await this.scheduleButton.click();
    } else {
      await this.saveAsDraftButton.click();
    }
  }

  async getNewsletterRowBySubject(subject: string): Promise<Locator> {
    return this.page.locator(`[data-testid="newsletter-row"]:has-text("${subject}")`);
  }

  async triggerEmailForNewsletter(subject: string) {
    const row = await this.getNewsletterRowBySubject(subject);
    await row.locator('[data-testid="trigger-email"], button:has-text("Send")').click();
    await this.triggerConfirmModal.waitFor({ state: 'visible' });
    await this.triggerConfirmButton.click();
  }

  async sendNewsletterNow(options: {
    subject: string;
    content: string;
    frequency: NewsletterFrequency;
  }) {
    await this.openCreateNewsletterModal();
    await this.subjectInput.fill(options.subject);
    await this.contentEditor.fill(options.content);
    await this.frequencySelect.selectOption(options.frequency);
    await this.sendNowButton.click();
  }

  async goToSubscribersTab() {
    await this.subscribersTab.click();
  }

  async getSubscriberCount(): Promise<number> {
    await this.goToSubscribersTab();
    return this.subscriberRows.count();
  }

  async previewNewsletter() {
    await this.previewButton.click();
    await this.previewModal.waitFor({ state: 'visible' });
  }
}
