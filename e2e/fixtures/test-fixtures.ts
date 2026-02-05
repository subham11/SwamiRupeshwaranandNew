import { test as base, expect } from '@playwright/test';
import {
  HomePage,
  LoginPage,
  RegisterPage,
  DonationPage,
  NewsletterPage,
  SupportPage,
  SubscriptionsPage,
  AdminDashboardPage,
  AdminUsersPage,
  AdminSubscriptionsPage,
  AdminEventsPage,
  AdminNewsletterPage,
  AdminDonationsPage,
  AdminTicketsPage,
  AdminPaymentsPage,
  AdminContentPage,
  UserDashboardPage,
  UserContentPage,
} from '../page-objects';

// Declare types for fixtures
type PageFixtures = {
  homePage: HomePage;
  loginPage: LoginPage;
  registerPage: RegisterPage;
  donationPage: DonationPage;
  newsletterPage: NewsletterPage;
  supportPage: SupportPage;
  subscriptionsPage: SubscriptionsPage;
  adminDashboardPage: AdminDashboardPage;
  // Admin Pages
  adminUsersPage: AdminUsersPage;
  adminSubscriptionsPage: AdminSubscriptionsPage;
  adminEventsPage: AdminEventsPage;
  adminNewsletterPage: AdminNewsletterPage;
  adminDonationsPage: AdminDonationsPage;
  adminTicketsPage: AdminTicketsPage;
  adminPaymentsPage: AdminPaymentsPage;
  adminContentPage: AdminContentPage;
  // User Pages
  userDashboardPage: UserDashboardPage;
  userContentPage: UserContentPage;
};

// Extend base test with page object fixtures
export const test = base.extend<PageFixtures>({
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  registerPage: async ({ page }, use) => {
    await use(new RegisterPage(page));
  },
  donationPage: async ({ page }, use) => {
    await use(new DonationPage(page));
  },
  newsletterPage: async ({ page }, use) => {
    await use(new NewsletterPage(page));
  },
  supportPage: async ({ page }, use) => {
    await use(new SupportPage(page));
  },
  subscriptionsPage: async ({ page }, use) => {
    await use(new SubscriptionsPage(page));
  },
  adminDashboardPage: async ({ page }, use) => {
    await use(new AdminDashboardPage(page));
  },
  // Admin Pages
  adminUsersPage: async ({ page }, use) => {
    await use(new AdminUsersPage(page));
  },
  adminSubscriptionsPage: async ({ page }, use) => {
    await use(new AdminSubscriptionsPage(page));
  },
  adminEventsPage: async ({ page }, use) => {
    await use(new AdminEventsPage(page));
  },
  adminNewsletterPage: async ({ page }, use) => {
    await use(new AdminNewsletterPage(page));
  },
  adminDonationsPage: async ({ page }, use) => {
    await use(new AdminDonationsPage(page));
  },
  adminTicketsPage: async ({ page }, use) => {
    await use(new AdminTicketsPage(page));
  },
  adminPaymentsPage: async ({ page }, use) => {
    await use(new AdminPaymentsPage(page));
  },
  adminContentPage: async ({ page }, use) => {
    await use(new AdminContentPage(page));
  },
  // User Pages
  userDashboardPage: async ({ page }, use) => {
    await use(new UserDashboardPage(page));
  },
  userContentPage: async ({ page }, use) => {
    await use(new UserContentPage(page));
  },
});

export { expect };
