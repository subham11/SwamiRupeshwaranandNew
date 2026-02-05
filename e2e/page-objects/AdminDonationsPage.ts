import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { DonationFrequency } from '../fixtures/test-data';

export class AdminDonationsPage extends BasePage {
  // Donations List
  readonly donationsTable: Locator;
  readonly donationRows: Locator;
  readonly totalDonationsAmount: Locator;

  // Filters
  readonly dateRangeFilter: Locator;
  readonly statusFilter: Locator;
  readonly frequencyFilter: Locator;

  // Configuration Tab
  readonly configTab: Locator;
  readonly weeklyAmountInput: Locator;
  readonly monthlyAmountInput: Locator;
  readonly quarterlyAmountInput: Locator;
  readonly yearlyAmountInput: Locator;
  readonly saveConfigButton: Locator;

  // Initiatives Tab
  readonly initiativesTab: Locator;
  readonly createInitiativeButton: Locator;
  readonly initiativeModal: Locator;
  readonly initiativeNameInput: Locator;
  readonly initiativeDescriptionInput: Locator;
  readonly initiativeGoalInput: Locator;
  readonly initiativeSubmitButton: Locator;

  // Toast
  readonly successToast: Locator;
  readonly errorToast: Locator;

  constructor(page: Page) {
    super(page);
    // Donations List
    this.donationsTable = page.locator('[data-testid="donations-table"]');
    this.donationRows = page.locator('[data-testid="donation-row"]');
    this.totalDonationsAmount = page.locator('[data-testid="total-donations"]');

    // Filters
    this.dateRangeFilter = page.locator('[data-testid="date-range-filter"]');
    this.statusFilter = page.locator('[data-testid="status-filter"]');
    this.frequencyFilter = page.locator('[data-testid="frequency-filter"]');

    // Configuration
    this.configTab = page.locator('[data-testid="config-tab"], [role="tab"]:has-text("Configuration")');
    this.weeklyAmountInput = page.locator('[data-testid="weekly-amount"], input[name="weeklyAmount"]');
    this.monthlyAmountInput = page.locator('[data-testid="monthly-amount"], input[name="monthlyAmount"]');
    this.quarterlyAmountInput = page.locator('[data-testid="quarterly-amount"], input[name="quarterlyAmount"]');
    this.yearlyAmountInput = page.locator('[data-testid="yearly-amount"], input[name="yearlyAmount"]');
    this.saveConfigButton = page.locator('[data-testid="save-config"], button:has-text("Save")');

    // Initiatives
    this.initiativesTab = page.locator('[data-testid="initiatives-tab"], [role="tab"]:has-text("Initiatives")');
    this.createInitiativeButton = page.locator('[data-testid="create-initiative"], button:has-text("Create Initiative")');
    this.initiativeModal = page.locator('[data-testid="initiative-modal"]');
    this.initiativeNameInput = page.locator('[data-testid="initiative-name"], input[name="name"]');
    this.initiativeDescriptionInput = page.locator('[data-testid="initiative-description"], textarea[name="description"]');
    this.initiativeGoalInput = page.locator('[data-testid="initiative-goal"], input[name="goal"]');
    this.initiativeSubmitButton = page.locator('[data-testid="initiative-submit"], button[type="submit"]');

    // Toast
    this.successToast = page.locator('[data-testid="success-toast"], .toast-success');
    this.errorToast = page.locator('[data-testid="error-toast"], .toast-error');
  }

  async goto(locale: string = 'en') {
    await this.page.goto(`/${locale}/admin/donations`);
  }

  async getDonationCount(): Promise<number> {
    return this.donationRows.count();
  }

  async getTotalDonations(): Promise<string | null> {
    return this.totalDonationsAmount.textContent();
  }

  async goToConfigTab() {
    await this.configTab.click();
  }

  async setDonationAmounts(amounts: {
    weekly?: number;
    monthly?: number;
    quarterly?: number;
    yearly?: number;
  }) {
    await this.goToConfigTab();
    
    if (amounts.weekly !== undefined) {
      await this.weeklyAmountInput.fill(amounts.weekly.toString());
    }
    if (amounts.monthly !== undefined) {
      await this.monthlyAmountInput.fill(amounts.monthly.toString());
    }
    if (amounts.quarterly !== undefined) {
      await this.quarterlyAmountInput.fill(amounts.quarterly.toString());
    }
    if (amounts.yearly !== undefined) {
      await this.yearlyAmountInput.fill(amounts.yearly.toString());
    }

    await this.saveConfigButton.click();
  }

  async goToInitiativesTab() {
    await this.initiativesTab.click();
  }

  async createInitiative(options: {
    name: string;
    description: string;
    goal: number;
  }) {
    await this.goToInitiativesTab();
    await this.createInitiativeButton.click();
    await this.initiativeModal.waitFor({ state: 'visible' });
    
    await this.initiativeNameInput.fill(options.name);
    await this.initiativeDescriptionInput.fill(options.description);
    await this.initiativeGoalInput.fill(options.goal.toString());
    await this.initiativeSubmitButton.click();
  }

  async filterByFrequency(frequency: DonationFrequency) {
    await this.frequencyFilter.selectOption(frequency);
  }

  async filterByStatus(status: string) {
    await this.statusFilter.selectOption(status);
  }
}
