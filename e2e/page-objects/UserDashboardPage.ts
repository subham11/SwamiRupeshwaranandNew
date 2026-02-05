import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class UserDashboardPage extends BasePage {
  // Dashboard Overview
  readonly welcomeMessage: Locator;
  readonly subscriptionStatus: Locator;
  readonly subscriptionPlan: Locator;
  readonly subscriptionExpiry: Locator;

  // Navigation
  readonly subscriptionLink: Locator;
  readonly contentLink: Locator;
  readonly ticketsLink: Locator;
  readonly profileLink: Locator;

  // Quick Actions
  readonly upgradeButton: Locator;
  readonly viewContentButton: Locator;
  readonly createTicketButton: Locator;

  // Recent Activity
  readonly recentActivity: Locator;

  constructor(page: Page) {
    super(page);
    this.welcomeMessage = page.locator('[data-testid="welcome-message"]');
    this.subscriptionStatus = page.locator('[data-testid="subscription-status"]');
    this.subscriptionPlan = page.locator('[data-testid="subscription-plan"]');
    this.subscriptionExpiry = page.locator('[data-testid="subscription-expiry"]');

    // Navigation
    this.subscriptionLink = page.locator('[data-testid="nav-subscription"], a:has-text("Subscription")');
    this.contentLink = page.locator('[data-testid="nav-content"], a:has-text("Content")');
    this.ticketsLink = page.locator('[data-testid="nav-tickets"], a:has-text("Support")');
    this.profileLink = page.locator('[data-testid="nav-profile"], a:has-text("Profile")');

    // Quick Actions
    this.upgradeButton = page.locator('[data-testid="upgrade-button"], button:has-text("Upgrade")');
    this.viewContentButton = page.locator('[data-testid="view-content"], button:has-text("View Content")');
    this.createTicketButton = page.locator('[data-testid="create-ticket"], button:has-text("Create Ticket")');

    // Recent Activity
    this.recentActivity = page.locator('[data-testid="recent-activity"]');
  }

  async goto(locale: string = 'en') {
    await this.page.goto(`/${locale}/dashboard`);
  }

  async getSubscriptionPlanName(): Promise<string | null> {
    return this.subscriptionPlan.textContent();
  }

  async getSubscriptionStatus(): Promise<string | null> {
    return this.subscriptionStatus.textContent();
  }

  async navigateToSubscription() {
    await this.subscriptionLink.click();
  }

  async navigateToContent() {
    await this.contentLink.click();
  }

  async navigateToTickets() {
    await this.ticketsLink.click();
  }

  async navigateToProfile() {
    await this.profileLink.click();
  }

  async clickUpgrade() {
    await this.upgradeButton.click();
  }
}
