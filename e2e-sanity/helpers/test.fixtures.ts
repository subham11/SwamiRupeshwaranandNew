// helpers/test.fixtures.ts
// Custom Playwright fixtures that auto-inject typed Page Object Models and API helpers.
// Import `test` and `expect` from this file instead of @playwright/test in any spec
// that benefits from pre-wired POMs.

import { test as base, expect } from '@playwright/test';
import {
  AuthPage,
  ProductsPage,
  ProductDetailPage,
  CartPage,
  CheckoutPage,
  DashboardPage,
  SearchModal,
  AdminBasePage,
  AdminProductsPage,
  AdminOrdersPage,
  AdminCMSPage,
} from '../page-objects';
import {
  getAdminToken,
  getUserToken,
  createTestProduct,
  deleteProduct,
  clearCartViaApi,
  addToCartViaApi,
  getFirstActiveProductId,
} from './api.helper';

// ─────────────────────────────────────────────────────────────────────────────
// Fixture type declarations
// ─────────────────────────────────────────────────────────────────────────────

type BhairavatpathFixtures = {
  // Page Object Models
  authPage:        AuthPage;
  productsPage:    ProductsPage;
  productDetail:   ProductDetailPage;
  cartPage:        CartPage;
  checkoutPage:    CheckoutPage;
  dashboardPage:   DashboardPage;
  searchModal:     SearchModal;
  adminBase:       AdminBasePage;
  adminProducts:   AdminProductsPage;
  adminOrders:     AdminOrdersPage;
  adminCMS:        AdminCMSPage;

  // Helpers
  adminToken:      string;
  userToken:       string;

  // Test product that is created before the test and deleted after
  testProductId:   string;

  // Cart pre-populated with one item
  cartWithItem:    void;
};

// ─────────────────────────────────────────────────────────────────────────────
// Extended test object
// ─────────────────────────────────────────────────────────────────────────────

export const test = base.extend<BhairavatpathFixtures>({

  // ── Page Object Models ────────────────────────────────────────────────────

  authPage: async ({ page }, use) => {
    await use(new AuthPage(page));
  },

  productsPage: async ({ page }, use) => {
    await use(new ProductsPage(page));
  },

  productDetail: async ({ page }, use) => {
    await use(new ProductDetailPage(page));
  },

  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },

  checkoutPage: async ({ page }, use) => {
    await use(new CheckoutPage(page));
  },

  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },

  searchModal: async ({ page }, use) => {
    await use(new SearchModal(page));
  },

  adminBase: async ({ page }, use) => {
    await use(new AdminBasePage(page));
  },

  adminProducts: async ({ page }, use) => {
    await use(new AdminProductsPage(page));
  },

  adminOrders: async ({ page }, use) => {
    await use(new AdminOrdersPage(page));
  },

  adminCMS: async ({ page }, use) => {
    await use(new AdminCMSPage(page));
  },

  // ── API tokens ────────────────────────────────────────────────────────────

  adminToken: async ({ request }, use) => {
    const token = await getAdminToken(request);
    await use(token);
  },

  userToken: async ({ request }, use) => {
    const token = await getUserToken(request);
    await use(token);
  },

  // ── Ephemeral test product (created before test, deleted after) ───────────

  testProductId: async ({ request, adminToken }, use) => {
    const productId = await createTestProduct(request, adminToken);
    await use(productId);
    await deleteProduct(request, adminToken, productId);
  },

  // ── Cart pre-populated with one item ─────────────────────────────────────

  cartWithItem: async ({ request, userToken, page }, use) => {
    // Clear cart first, then add one product
    await clearCartViaApi(request, userToken);
    const productId = await getFirstActiveProductId(request);
    if (productId) {
      await addToCartViaApi(request, userToken, productId);
    }
    await use();
    await clearCartViaApi(request, userToken);
  },
});

export { expect };
