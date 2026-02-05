import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class AdminPaymentsPage extends BasePage {
  // Payments List
  readonly paymentsTable: Locator;
  readonly paymentRows: Locator;
  readonly totalPaymentsAmount: Locator;

  // Filters
  readonly dateRangeFilter: Locator;
  readonly statusFilter: Locator;
  readonly typeFilter: Locator;
  readonly searchInput: Locator;

  // Payment Failures Tab
  readonly failuresTab: Locator;
  readonly failuresTable: Locator;
  readonly failureRows: Locator;

  // Payment Detail Modal
  readonly paymentDetailModal: Locator;
  readonly paymentId: Locator;
  readonly paymentAmount: Locator;
  readonly paymentStatus: Locator;
  readonly paymentDate: Locator;
  readonly paymentUser: Locator;
  readonly paymentType: Locator;

  // Failure Resolution
  readonly retryPaymentButton: Locator;
  readonly markAsResolvedButton: Locator;
  readonly refundButton: Locator;
  readonly resolutionNotesInput: Locator;

  // Toast
  readonly successToast: Locator;
  readonly errorToast: Locator;

  constructor(page: Page) {
    super(page);
    // Payments List
    this.paymentsTable = page.locator('[data-testid="payments-table"]');
    this.paymentRows = page.locator('[data-testid="payment-row"]');
    this.totalPaymentsAmount = page.locator('[data-testid="total-payments"]');

    // Filters
    this.dateRangeFilter = page.locator('[data-testid="date-range-filter"]');
    this.statusFilter = page.locator('[data-testid="status-filter"]');
    this.typeFilter = page.locator('[data-testid="type-filter"]');
    this.searchInput = page.locator('[data-testid="payment-search"], input[placeholder*="Search"]');

    // Payment Failures Tab
    this.failuresTab = page.locator('[data-testid="failures-tab"], [role="tab"]:has-text("Failures")');
    this.failuresTable = page.locator('[data-testid="failures-table"]');
    this.failureRows = page.locator('[data-testid="failure-row"]');

    // Payment Detail Modal
    this.paymentDetailModal = page.locator('[data-testid="payment-detail-modal"], [role="dialog"]');
    this.paymentId = page.locator('[data-testid="payment-id"]');
    this.paymentAmount = page.locator('[data-testid="payment-amount"]');
    this.paymentStatus = page.locator('[data-testid="payment-status"]');
    this.paymentDate = page.locator('[data-testid="payment-date"]');
    this.paymentUser = page.locator('[data-testid="payment-user"]');
    this.paymentType = page.locator('[data-testid="payment-type"]');

    // Failure Resolution
    this.retryPaymentButton = page.locator('[data-testid="retry-payment"], button:has-text("Retry")');
    this.markAsResolvedButton = page.locator('[data-testid="mark-resolved"], button:has-text("Mark Resolved")');
    this.refundButton = page.locator('[data-testid="refund-payment"], button:has-text("Refund")');
    this.resolutionNotesInput = page.locator('[data-testid="resolution-notes"], textarea[name="notes"]');

    // Toast
    this.successToast = page.locator('[data-testid="success-toast"], .toast-success');
    this.errorToast = page.locator('[data-testid="error-toast"], .toast-error');
  }

  async goto(locale: string = 'en') {
    await this.page.goto(`/${locale}/admin/payments`);
  }

  async getPaymentCount(): Promise<number> {
    return this.paymentRows.count();
  }

  async goToFailuresTab() {
    await this.failuresTab.click();
  }

  async getFailureCount(): Promise<number> {
    await this.goToFailuresTab();
    return this.failureRows.count();
  }

  async filterByStatus(status: string) {
    await this.statusFilter.selectOption(status);
  }

  async filterByType(type: string) {
    await this.typeFilter.selectOption(type);
  }

  async searchPayments(query: string) {
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(500);
  }

  async openPaymentDetail(paymentId: string) {
    const row = this.page.locator(`[data-testid="payment-row"]:has-text("${paymentId}")`);
    await row.click();
    await this.paymentDetailModal.waitFor({ state: 'visible' });
  }

  async openFailureDetail(index: number = 0) {
    await this.goToFailuresTab();
    await this.failureRows.nth(index).click();
    await this.paymentDetailModal.waitFor({ state: 'visible' });
  }

  async resolveFailure(notes: string) {
    await this.resolutionNotesInput.fill(notes);
    await this.markAsResolvedButton.click();
  }

  async retryFailedPayment() {
    await this.retryPaymentButton.click();
  }

  async refundPayment() {
    await this.refundButton.click();
    // Confirm dialog
    await this.page.locator('button:has-text("Confirm")').click();
  }
}
