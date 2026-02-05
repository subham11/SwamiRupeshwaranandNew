import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class AdminSubscriptionsPage extends BasePage {
  // Plan Management
  readonly plansTable: Locator;
  readonly planRows: Locator;
  readonly createPlanButton: Locator;

  // Plan Form Modal
  readonly planModal: Locator;
  readonly planNameInput: Locator;
  readonly planPriceInput: Locator;
  readonly planDescriptionInput: Locator;
  readonly planFeaturesInput: Locator;
  readonly planAutopayCheckbox: Locator;
  readonly planDurationSelect: Locator;
  readonly planSubmitButton: Locator;

  // Content Management
  readonly contentTab: Locator;
  readonly contentList: Locator;
  readonly addContentButton: Locator;
  readonly contentModal: Locator;
  readonly contentTitleInput: Locator;
  readonly contentTypeSelect: Locator;
  readonly contentFileInput: Locator;
  readonly contentPlanSelect: Locator;
  readonly contentSubmitButton: Locator;

  // User Subscriptions Tab
  readonly userSubscriptionsTab: Locator;
  readonly userSubscriptionsList: Locator;

  // Toast
  readonly successToast: Locator;
  readonly errorToast: Locator;

  constructor(page: Page) {
    super(page);
    // Plan Management
    this.plansTable = page.locator('[data-testid="plans-table"]');
    this.planRows = page.locator('[data-testid="plan-row"]');
    this.createPlanButton = page.locator('[data-testid="create-plan-button"], button:has-text("Create Plan")');

    // Plan Form Modal
    this.planModal = page.locator('[data-testid="plan-modal"], [role="dialog"]:has-text("Plan")');
    this.planNameInput = page.locator('[data-testid="plan-name"], input[name="name"]');
    this.planPriceInput = page.locator('[data-testid="plan-price"], input[name="price"]');
    this.planDescriptionInput = page.locator('[data-testid="plan-description"], textarea[name="description"]');
    this.planFeaturesInput = page.locator('[data-testid="plan-features"], textarea[name="features"]');
    this.planAutopayCheckbox = page.locator('[data-testid="plan-autopay"], input[name="autopay"]');
    this.planDurationSelect = page.locator('[data-testid="plan-duration"], select[name="duration"]');
    this.planSubmitButton = page.locator('[data-testid="plan-submit"], button[type="submit"]');

    // Content Management
    this.contentTab = page.locator('[data-testid="content-tab"], [role="tab"]:has-text("Content")');
    this.contentList = page.locator('[data-testid="content-list"]');
    this.addContentButton = page.locator('[data-testid="add-content-button"], button:has-text("Add Content")');
    this.contentModal = page.locator('[data-testid="content-modal"], [role="dialog"]:has-text("Content")');
    this.contentTitleInput = page.locator('[data-testid="content-title"], input[name="title"]');
    this.contentTypeSelect = page.locator('[data-testid="content-type"], select[name="type"]');
    this.contentFileInput = page.locator('[data-testid="content-file"], input[type="file"]');
    this.contentPlanSelect = page.locator('[data-testid="content-plan"], select[name="planId"]');
    this.contentSubmitButton = page.locator('[data-testid="content-submit"], button[type="submit"]');

    // User Subscriptions
    this.userSubscriptionsTab = page.locator('[data-testid="user-subscriptions-tab"], [role="tab"]:has-text("User Subscriptions")');
    this.userSubscriptionsList = page.locator('[data-testid="user-subscriptions-list"]');

    // Toast
    this.successToast = page.locator('[data-testid="success-toast"], .toast-success');
    this.errorToast = page.locator('[data-testid="error-toast"], .toast-error');
  }

  async goto(locale: string = 'en') {
    await this.page.goto(`/${locale}/admin/subscriptions`);
  }

  async getPlanCount(): Promise<number> {
    return this.planRows.count();
  }

  async openCreatePlanModal() {
    await this.createPlanButton.click();
    await this.planModal.waitFor({ state: 'visible' });
  }

  async createPlan(options: {
    name: string;
    price: number;
    description?: string;
    features?: string;
    autopay?: boolean;
    duration?: string;
  }) {
    await this.openCreatePlanModal();
    await this.planNameInput.fill(options.name);
    await this.planPriceInput.fill(options.price.toString());
    
    if (options.description) {
      await this.planDescriptionInput.fill(options.description);
    }
    if (options.features) {
      await this.planFeaturesInput.fill(options.features);
    }
    if (options.autopay !== undefined) {
      if (options.autopay) {
        await this.planAutopayCheckbox.check();
      } else {
        await this.planAutopayCheckbox.uncheck();
      }
    }
    if (options.duration) {
      await this.planDurationSelect.selectOption(options.duration);
    }

    await this.planSubmitButton.click();
  }

  async getPlanRowByName(name: string): Promise<Locator> {
    return this.page.locator(`[data-testid="plan-row"]:has-text("${name}")`);
  }

  async editPlan(name: string) {
    const row = await this.getPlanRowByName(name);
    await row.locator('[data-testid="edit-plan"], button:has-text("Edit")').click();
    await this.planModal.waitFor({ state: 'visible' });
  }

  async deletePlan(name: string) {
    const row = await this.getPlanRowByName(name);
    await row.locator('[data-testid="delete-plan"], button:has-text("Delete")').click();
    // Confirm deletion
    await this.page.locator('button:has-text("Confirm")').click();
  }

  async goToContentTab() {
    await this.contentTab.click();
  }

  async addContent(options: {
    title: string;
    type: 'pdf' | 'image' | 'video';
    filePath: string;
    planId: string;
  }) {
    await this.goToContentTab();
    await this.addContentButton.click();
    await this.contentModal.waitFor({ state: 'visible' });

    await this.contentTitleInput.fill(options.title);
    await this.contentTypeSelect.selectOption(options.type);
    await this.contentFileInput.setInputFiles(options.filePath);
    await this.contentPlanSelect.selectOption(options.planId);
    await this.contentSubmitButton.click();
  }

  async goToUserSubscriptionsTab() {
    await this.userSubscriptionsTab.click();
  }
}
