/**
 * Test data constants used across E2E tests
 */

// ============================================
// User Roles
// ============================================
export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  CONTENT_EDITOR = 'content_editor',
  USER = 'user',
}

// ============================================
// Test Users
// ============================================
export const TEST_SUPER_ADMIN = {
  email: process.env.TEST_SUPER_ADMIN_EMAIL || 'subham11@gmail.com',
  password: process.env.TEST_SUPER_ADMIN_PASSWORD || 'SuperAdmin@123',
  name: 'Subham (Super Admin)',
  role: UserRole.SUPER_ADMIN,
};

export const TEST_ADMIN = {
  email: process.env.TEST_ADMIN_EMAIL || 'admin@example.com',
  password: process.env.TEST_ADMIN_PASSWORD || 'Admin@123',
  name: 'Test Admin',
  role: UserRole.ADMIN,
};

export const TEST_CONTENT_EDITOR = {
  email: process.env.TEST_CONTENT_EDITOR_EMAIL || 'editor@example.com',
  password: process.env.TEST_CONTENT_EDITOR_PASSWORD || 'Editor@123',
  name: 'Test Content Editor',
  role: UserRole.CONTENT_EDITOR,
};

export const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'user@example.com',
  password: process.env.TEST_USER_PASSWORD || 'User@123',
  name: 'Test User',
  phone: '+919876543210',
  role: UserRole.USER,
};

// For invite flow testing
export const TEST_INVITE_USER = {
  email: 'invite-test@example.com',
  tempPassword: 'TempPass@123',
  newPassword: 'NewPass@456',
  name: 'Invited User',
};

// ============================================
// Subscription Plans (as per requirements)
// ============================================
export const SUBSCRIPTION_PLANS = {
  FREE: {
    name: 'Free',
    price: 0,
    currency: 'INR',
    features: ['10 Stotras including Bajrang Baan'],
    autopay: false,
    contentCount: 10,
  },
  BASIC_300: {
    name: 'Basic',
    price: 300,
    currency: 'INR',
    features: ['20 Stotras', 'Bajrang Baan practices'],
    autopay: true, // UPI autopay
    contentCount: 20,
  },
  STANDARD_1100: {
    name: 'Standard',
    price: 1100,
    currency: 'INR',
    features: ['20 Stotras', 'Bajrang Baan practices', 'One-time online guidance from Ashram'],
    autopay: true, // UPI autopay
    contentCount: 20,
  },
  PREMIUM_2100: {
    name: 'Premium',
    price: 2100,
    currency: 'INR',
    features: ['20 Stotras', '2 special protective kavach', 'Online guidance from Ashram 5 times/month'],
    autopay: true, // UPI autopay
    contentCount: 22,
  },
  GOLD_5100: {
    name: 'Gold',
    price: 5100,
    currency: 'INR',
    features: ['20 Stotras', '5 special protective kavach', 'Online guidance on Stotra armor accomplishment'],
    autopay: false, // Manual payment
    contentCount: 25,
  },
  DIAMOND_21000: {
    name: 'Diamond',
    price: 21000,
    currency: 'INR',
    features: [
      '30 Stotras',
      '5 special protective kavach',
      'Guidance from Ashram',
      'One-time online guidance on Stotra kavach accomplishment from Swami Rupeshwaranand',
    ],
    autopay: false, // Manual payment
    contentCount: 35,
  },
};

export const SUBSCRIPTION_PLAN_KEYS = Object.keys(SUBSCRIPTION_PLANS) as (keyof typeof SUBSCRIPTION_PLANS)[];

// ============================================
// Newsletter Frequencies
// ============================================
export enum NewsletterFrequency {
  WEEKLY = 'weekly',
  BI_WEEKLY = 'bi_weekly',
  MONTHLY = 'monthly',
  HALF_YEARLY = 'half_yearly',
  YEARLY = 'yearly',
}

export const TEST_NEWSLETTER = {
  email: 'newsletter-test@example.com',
  name: 'Newsletter Subscriber',
  subject: 'Test Newsletter',
  content: 'This is a test newsletter content.',
};

// ============================================
// Donation Configuration
// ============================================
export enum DonationFrequency {
  ONE_TIME = 'one_time',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
}

export const TEST_DONATION = {
  amount: '500',
  name: 'Test Donor',
  email: 'donor@example.com',
  phone: '+919876543210',
  purpose: 'general',
  message: 'Test donation message',
};

export const DONATION_AMOUNTS = {
  weekly: 100,
  monthly: 500,
  quarterly: 1500,
  yearly: 5000,
};

// ============================================
// Support Tickets
// ============================================
export enum TicketCategory {
  GENERAL = 'general',
  PAYMENT = 'payment',
  SUBSCRIPTION = 'subscription',
  TECHNICAL = 'technical',
  CONTENT = 'content',
}

export enum TicketPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum TicketStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  WAITING_FOR_USER = 'waiting_for_user',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export const TEST_TICKET = {
  subject: 'Test Support Ticket',
  category: TicketCategory.GENERAL,
  priority: TicketPriority.MEDIUM,
  description: 'This is a test support ticket created by E2E tests.',
  email: 'support-test@example.com',
};

export const TEST_PAYMENT_ISSUE_TICKET = {
  subject: 'Payment Failed - Need Help',
  category: TicketCategory.PAYMENT,
  priority: TicketPriority.HIGH,
  description: 'My payment failed but amount was deducted. Please help.',
  email: 'payment-issue@example.com',
};

// ============================================
// Events
// ============================================
export const TEST_EVENT = {
  title: 'Test Spiritual Event',
  description: 'A test event for E2E testing',
  date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
  time: '10:00',
  location: 'Ashram Main Hall',
  capacity: 100,
};

// ============================================
// Content Management
// ============================================
export const TEST_PAGE_CONTENT = {
  pageId: 'home',
  componentType: 'hero',
  title: 'Test Hero Title',
  subtitle: 'Test Hero Subtitle',
};

export const TEST_ANNOUNCEMENT = {
  message: 'Test announcement message for E2E testing',
  isActive: true,
  link: '/events',
};

// ============================================
// URLs
// ============================================
export const LOCALES = ['en', 'hi'] as const;
export type Locale = (typeof LOCALES)[number];

export const URLS = {
  // Public
  home: (locale: Locale = 'en') => `/${locale}`,
  login: (locale: Locale = 'en') => `/${locale}/login`,
  register: (locale: Locale = 'en') => `/${locale}/register`,
  forgotPassword: (locale: Locale = 'en') => `/${locale}/forgot-password`,
  donate: (locale: Locale = 'en') => `/${locale}/donate`,
  support: (locale: Locale = 'en') => `/${locale}/support`,
  subscriptions: (locale: Locale = 'en') => `/${locale}/subscriptions`,
  events: (locale: Locale = 'en') => `/${locale}/events`,
  teachings: (locale: Locale = 'en') => `/${locale}/teachings`,
  about: (locale: Locale = 'en') => `/${locale}/about`,
  contact: (locale: Locale = 'en') => `/${locale}/contact`,

  // User Dashboard
  userDashboard: (locale: Locale = 'en') => `/${locale}/dashboard`,
  userSubscription: (locale: Locale = 'en') => `/${locale}/dashboard/subscription`,
  userTickets: (locale: Locale = 'en') => `/${locale}/dashboard/tickets`,
  userContent: (locale: Locale = 'en') => `/${locale}/dashboard/content`,

  // Admin
  admin: (locale: Locale = 'en') => `/${locale}/admin`,
  adminUsers: (locale: Locale = 'en') => `/${locale}/admin/users`,
  adminSubscriptions: (locale: Locale = 'en') => `/${locale}/admin/subscriptions`,
  adminContent: (locale: Locale = 'en') => `/${locale}/admin/content`,
  adminEvents: (locale: Locale = 'en') => `/${locale}/admin/events`,
  adminNewsletter: (locale: Locale = 'en') => `/${locale}/admin/newsletter`,
  adminDonations: (locale: Locale = 'en') => `/${locale}/admin/donations`,
  adminTickets: (locale: Locale = 'en') => `/${locale}/admin/tickets`,
  adminPayments: (locale: Locale = 'en') => `/${locale}/admin/payments`,
  adminAnnouncements: (locale: Locale = 'en') => `/${locale}/admin/announcements`,
};

// ============================================
// API Endpoints
// ============================================
export const API_ENDPOINTS = {
  // Auth
  login: '/api/v1/auth/login',
  register: '/api/v1/auth/register',
  verifyOtp: '/api/v1/auth/verify-otp',
  sendOtp: '/api/v1/auth/send-otp',
  resetPassword: '/api/v1/auth/reset-password',
  changePassword: '/api/v1/auth/change-password',

  // Users
  users: '/api/v1/users',
  inviteUser: '/api/v1/users/invite',
  updateRole: '/api/v1/users/:id/role',

  // Subscriptions
  subscriptionPlans: '/api/v1/subscriptions/plans',
  userSubscription: '/api/v1/subscriptions/my',
  subscriptionContent: '/api/v1/subscriptions/content',

  // Payments
  createPayment: '/api/v1/payments/create',
  verifyPayment: '/api/v1/payments/verify',
  paymentFailures: '/api/v1/payments/failures',

  // Events
  events: '/api/v1/events',

  // Newsletter
  newsletter: '/api/v1/newsletter',
  newsletterSubscribe: '/api/v1/newsletter/subscribe',
  newsletterTrigger: '/api/v1/newsletter/trigger',

  // Donations
  donations: '/api/v1/donations',
  donationConfig: '/api/v1/donations/config',

  // Tickets
  tickets: '/api/v1/support/tickets',
  ticketReply: '/api/v1/support/tickets/:id/reply',

  // Content
  pages: '/api/v1/pages',
  pageComponents: '/api/v1/page-components',
  announcements: '/api/v1/announcements',
  uploads: '/api/v1/uploads',
};
