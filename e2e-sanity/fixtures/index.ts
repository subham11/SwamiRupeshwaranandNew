// fixtures/index.ts
// Centralised test data, constants, and custom fixtures

export const TEST_USERS = {
  admin: {
    email:    process.env.ADMIN_EMAIL    || 'admin@swamirupeshwaranand.org',
    password: process.env.ADMIN_PASSWORD || 'Admin@1234',
  },
  user: {
    email:    process.env.USER_EMAIL    || 'testuser@swamirupeshwaranand.org',
    password: process.env.USER_PASSWORD || 'User@1234',
    name:     'Sanity Tester',
    phone:    '9000000001',
  },
};

export const TEST_PRODUCT = {
  title:       'Sanity Test Book EN',
  titleHi:     'सैनिटी टेस्ट बुक HI',
  description: 'Auto-generated product for E2E sanity testing',
  price:       '499',
  originalPrice: '699',
  slug:        `sanity-test-book-${Date.now()}`,
  category:    'Books',
  stock:       'in_stock',
};

export const TEST_CATEGORY = {
  name:        'Sanity Category EN',
  nameHi:      'सैनिटी कैटेगरी HI',
  description: 'Auto-generated category for E2E testing',
  slug:        `sanity-cat-${Date.now()}`,
};

export const TEST_COUPON = {
  code:         `SANITY${Date.now()}`,
  type:         'percentage',
  value:        '10',
  minOrder:     '100',
  maxDiscount:  '200',
};

export const TEST_ADDRESS = {
  fullName: 'Sanity Tester',
  phone:    '9000000001',
  line1:    '123 Test Street',
  city:     'Bengaluru',
  state:    'Karnataka',
  pincode:  '560001',
  country:  'India',
};

export const TEST_REVIEW = {
  rating:  4,
  text:    'Great product - E2E sanity review',
  textHi:  'बेहतरीन उत्पाद - E2E सैनिटी समीक्षा',
};

export const TEST_CMS_PAGE = {
  title:  'Sanity CMS Page',
  slug:   `sanity-cms-${Date.now()}`,
  status: 'draft',
};

export const TEST_EVENT = {
  title:       'Sanity Test Event',
  description: 'Auto-generated event for E2E testing',
  location:    'Bengaluru Ashram',
};

export const TEST_DONATION_AMOUNTS = [108, 251, 501, 1001, 2100];

export const SUBSCRIPTION_PLANS = ['Free', 'Silver', 'Gold', 'Diamond'];

export const LOCALES = ['en', 'hi'] as const;
export type Locale = typeof LOCALES[number];
