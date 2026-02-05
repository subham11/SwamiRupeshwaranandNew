import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class SubscriptionsPage extends BasePage {
  // Locators
  readonly planCards: Locator;
  readonly subscribeButtons: Locator;
  readonly currentPlan: Locator;
  readonly contentList: Locator;
  readonly contentItems: Locator;

  constructor(page: Page) {
    super(page);
    this.planCards = page.locator('[data-testid="plan-card"]');
    this.subscribeButtons = page.locator('[data-testid="subscribe-button"]');
    this.currentPlan = page.locator('[data-testid="current-plan"]');
    this.contentList = page.locator('[data-testid="content-list"]');
    this.contentItems = page.locator('[data-testid="content-item"]');
  }

  async goto(locale: string = 'en') {
    await this.page.goto(`/${locale}/subscriptions`);
  }

  async getPlanCount(): Promise<number> {
    return this.planCards.count();
  }

  async selectPlan(index: number) {
    await this.subscribeButtons.nth(index).click();
  }

  async selectPlanByName(name: string) {
    const planCard = this.page.locator(`[data-testid="plan-card"]:has-text("${name}")`);
    await planCard.locator('[data-testid="subscribe-button"]').click();
  }

  async getCurrentPlanName(): Promise<string | null> {
    if (await this.currentPlan.isVisible()) {
      return this.currentPlan.textContent();
    }
    return null;
  }

  async getContentCount(): Promise<number> {
    return this.contentItems.count();
  }

  async accessContent(index: number) {
    await this.contentItems.nth(index).click();
  }
}
