/**
 * Test data constants used across E2E tests
 */

export const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'test@example.com',
  password: process.env.TEST_USER_PASSWORD || 'testpassword123',
  name: 'Test User',
};

export const TEST_ADMIN = {
  email: process.env.TEST_ADMIN_EMAIL || 'admin@example.com',
  password: process.env.TEST_ADMIN_PASSWORD || 'adminpassword123',
  name: 'Admin User',
};

export const TEST_DONATION = {
  amount: '100',
  name: 'Test Donor',
  email: 'donor@example.com',
  phone: '+919876543210',
  purpose: 'general',
  message: 'Test donation message',
};

export const TEST_TICKET = {
  subject: 'Test Support Ticket',
  category: 'general',
  priority: 'medium',
  description: 'This is a test support ticket created by E2E tests.',
  email: 'support-test@example.com',
};

export const TEST_NEWSLETTER = {
  email: 'newsletter-test@example.com',
  name: 'Newsletter Subscriber',
};

export const LOCALES = ['en', 'hi'] as const;
export type Locale = (typeof LOCALES)[number];

export const URLS = {
  home: (locale: Locale = 'en') => `/${locale}`,
  login: (locale: Locale = 'en') => `/${locale}/login`,
  register: (locale: Locale = 'en') => `/${locale}/register`,
  donate: (locale: Locale = 'en') => `/${locale}/donate`,
  support: (locale: Locale = 'en') => `/${locale}/support`,
  subscriptions: (locale: Locale = 'en') => `/${locale}/subscriptions`,
  admin: (locale: Locale = 'en') => `/${locale}/admin`,
  teachings: (locale: Locale = 'en') => `/${locale}/teachings`,
  events: (locale: Locale = 'en') => `/${locale}/events`,
  about: (locale: Locale = 'en') => `/${locale}/about`,
  contact: (locale: Locale = 'en') => `/${locale}/contact`,
};
