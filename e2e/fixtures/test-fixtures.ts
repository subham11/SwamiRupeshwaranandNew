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
});

export { expect };
