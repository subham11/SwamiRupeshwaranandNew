import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class AdminDashboardPage extends BasePage {
  // Locators
  readonly sidebar: Locator;
  readonly statsCards: Locator;
  readonly userCount: Locator;
  readonly donationTotal: Locator;
  readonly ticketCount: Locator;
  readonly recentActivity: Locator;

  // Sidebar menu items
  readonly usersMenuItem: Locator;
  readonly donationsMenuItem: Locator;
  readonly ticketsMenuItem: Locator;
  readonly contentMenuItem: Locator;
  readonly settingsMenuItem: Locator;

  constructor(page: Page) {
    super(page);
    this.sidebar = page.locator('[data-testid="admin-sidebar"]');
    this.statsCards = page.locator('[data-testid="stats-card"]');
    this.userCount = page.locator('[data-testid="user-count"]');
    this.donationTotal = page.locator('[data-testid="donation-total"]');
    this.ticketCount = page.locator('[data-testid="ticket-count"]');
    this.recentActivity = page.locator('[data-testid="recent-activity"]');

    this.usersMenuItem = page.locator('[data-testid="menu-users"]');
    this.donationsMenuItem = page.locator('[data-testid="menu-donations"]');
    this.ticketsMenuItem = page.locator('[data-testid="menu-tickets"]');
    this.contentMenuItem = page.locator('[data-testid="menu-content"]');
    this.settingsMenuItem = page.locator('[data-testid="menu-settings"]');
  }

  async goto(locale: string = 'en') {
    await this.page.goto(`/${locale}/admin`);
  }

  async navigateToUsers() {
    await this.usersMenuItem.click();
  }

  async navigateToDonations() {
    await this.donationsMenuItem.click();
  }

  async navigateToTickets() {
    await this.ticketsMenuItem.click();
  }

  async navigateToContent() {
    await this.contentMenuItem.click();
  }

  async navigateToSettings() {
    await this.settingsMenuItem.click();
  }

  async getStatsCardCount(): Promise<number> {
    return this.statsCards.count();
  }

  async getUserCount(): Promise<string | null> {
    return this.userCount.textContent();
  }

  async getDonationTotal(): Promise<string | null> {
    return this.donationTotal.textContent();
  }
}
