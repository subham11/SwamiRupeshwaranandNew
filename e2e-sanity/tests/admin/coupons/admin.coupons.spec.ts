// tests/admin/coupons/admin.coupons.spec.ts
// STORY-009: Coupon Management (Admin)
// STORY-010: Coupon Redemption (Customer)

import { test, expect } from '@playwright/test';
import { AdminBasePage, CartPage, ProductsPage, ProductDetailPage } from '../../../page-objects';
import { TEST_COUPON } from '../../../fixtures';
import { API_URL } from '../../../playwright.config';

// ─── Admin Coupon Management ──────────────────────────────────────────────────
test.describe('STORY-009 | Coupon Management (Admin)', () => {

  test('coupons list page loads with stats', async ({ page }) => {
    const admin = new AdminBasePage(page);
    await admin.gotoAdmin('/coupons');
    await expect(page.locator('[data-testid="coupons-page"]')).toBeVisible({ timeout: 8_000 });
  });

  test('admin can create a percentage coupon', async ({ page }) => {
    const admin = new AdminBasePage(page);
    await admin.gotoAdmin('/coupons/create');
    const code = `PCT${Date.now()}`;
    await page.locator('[data-testid="coupon-code"]').fill(code);
    await page.locator('[data-testid="coupon-type"]').selectOption('percentage');
    await page.locator('[data-testid="coupon-value"]').fill('15');
    await page.locator('[data-testid="coupon-min-order"]').fill('200');
    await page.locator('[data-testid="coupon-max-discount"]').fill('300');
    await admin.saveBtn.click();
    await expect(admin.successToast).toBeVisible({ timeout: 8_000 });
  });

  test('admin can create a flat coupon', async ({ page }) => {
    const admin = new AdminBasePage(page);
    await admin.gotoAdmin('/coupons/create');
    const code = `FLAT${Date.now()}`;
    await page.locator('[data-testid="coupon-code"]').fill(code);
    await page.locator('[data-testid="coupon-type"]').selectOption('flat');
    await page.locator('[data-testid="coupon-value"]').fill('100');
    await page.locator('[data-testid="coupon-min-order"]').fill('300');
    await admin.saveBtn.click();
    await expect(admin.successToast).toBeVisible({ timeout: 8_000 });
  });

  test('admin can set expiry date and usage limit', async ({ page }) => {
    const admin = new AdminBasePage(page);
    await admin.gotoAdmin('/coupons/create');
    const code = `EXP${Date.now()}`;
    await page.locator('[data-testid="coupon-code"]').fill(code);
    await page.locator('[data-testid="coupon-type"]').selectOption('percentage');
    await page.locator('[data-testid="coupon-value"]').fill('5');

    // Set expiry 30 days from now
    const expiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await page.locator('[data-testid="coupon-expiry"]').fill(
      expiry.toISOString().split('T')[0]
    );
    await page.locator('[data-testid="coupon-usage-limit"]').fill('100');
    await admin.saveBtn.click();
    await expect(admin.successToast).toBeVisible({ timeout: 8_000 });
  });

  test('system prevents duplicate coupon codes', async ({ page }) => {
    const admin = new AdminBasePage(page);
    // Create first coupon
    await admin.gotoAdmin('/coupons/create');
    const code = `DUP${Date.now()}`;
    await page.locator('[data-testid="coupon-code"]').fill(code);
    await page.locator('[data-testid="coupon-type"]').selectOption('flat');
    await page.locator('[data-testid="coupon-value"]').fill('50');
    await admin.saveBtn.click();
    await expect(admin.successToast).toBeVisible({ timeout: 8_000 });

    // Try to create duplicate
    await admin.gotoAdmin('/coupons/create');
    await page.locator('[data-testid="coupon-code"]').fill(code);
    await page.locator('[data-testid="coupon-type"]').selectOption('flat');
    await page.locator('[data-testid="coupon-value"]').fill('50');
    await admin.saveBtn.click();
    await expect(page.locator('[data-testid="toast-error"]')).toBeVisible({ timeout: 8_000 });
  });

  test('coupon list shows status: active, expired, depleted', async ({ page }) => {
    const admin = new AdminBasePage(page);
    await admin.gotoAdmin('/coupons');
    await page.waitForLoadState('networkidle');
    if (await admin.tableRows.count() > 0) {
      const statuses = await page.locator('[data-testid="coupon-status"]').allTextContents();
      const validStatuses = ['active', 'expired', 'depleted'];
      statuses.forEach(s => {
        expect(validStatuses.some(v => s.toLowerCase().includes(v))).toBeTruthy();
      });
    }
  });

  test('admin can edit a coupon', async ({ page }) => {
    const admin = new AdminBasePage(page);
    await admin.gotoAdmin('/coupons');
    if (await admin.tableRows.count() > 0) {
      await admin.tableRows.first().locator('[data-testid="edit-btn"]').click();
      await expect(page).toHaveURL(/\/admin\/coupons\/.+\/edit/);
      await page.locator('[data-testid="coupon-value"]').fill('20');
      await admin.saveBtn.click();
      await expect(admin.successToast).toBeVisible({ timeout: 8_000 });
    }
  });

  test('admin can delete a coupon', async ({ page }) => {
    const admin = new AdminBasePage(page);
    await admin.gotoAdmin('/coupons');
    if (await admin.tableRows.count() > 0) {
      const before = await admin.tableRows.count();
      await admin.tableRows.last().locator('[data-testid="delete-btn"]').click();
      if (await admin.confirmDelete.isVisible({ timeout: 2000 })) {
        await admin.confirmDelete.click();
      }
      await expect(admin.successToast).toBeVisible({ timeout: 8_000 });
      await page.waitForLoadState('networkidle');
      expect(await admin.tableRows.count()).toBeLessThan(before);
    }
  });
});

// ─── Customer Coupon Redemption ───────────────────────────────────────────────
test.describe('STORY-010 | Coupon Redemption (Customer)', () => {

  // Helper: create active coupon via API and return code
  async function createCoupon(request: any, overrides: Record<string, any> = {}) {
    const loginRes = await request.post(`${API_URL}/auth/login`, {
      data: { email: process.env.ADMIN_EMAIL || 'admin@swamirupeshwaranand.org',
              password: process.env.ADMIN_PASSWORD || 'Admin@1234' },
    });
    const { accessToken } = await loginRes.json();
    const code = `TEST${Date.now()}`;
    await request.post(`${API_URL}/coupons`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { code, type: 'percentage', value: 10, minOrderAmount: 0,
              maxDiscount: 500, usageLimit: 100,
              expiryDate: new Date(Date.now() + 7 * 86400_000).toISOString(),
              ...overrides },
    });
    return code;
  }

  test('valid coupon code shows success and discount amount', async ({ page, request }) => {
    const code = await createCoupon(request);
    // Add product to cart
    const products = new ProductsPage(page);
    await products.goto();
    await products.openFirstProduct();
    const detail = new ProductDetailPage(page);
    await detail.addToCartBtn.click();
    await page.waitForTimeout(500);

    const cart = new CartPage(page);
    await cart.goto();
    await cart.applyCoupon(code);
    await expect(cart.couponSuccess).toBeVisible({ timeout: 5_000 });
    const discountRow = page.locator('[data-testid="discount-amount"]');
    await expect(discountRow).toBeVisible();
  });

  test('coupon code is case-insensitive', async ({ page, request }) => {
    const code = await createCoupon(request);
    const products = new ProductsPage(page);
    await products.goto();
    await products.openFirstProduct();
    await new ProductDetailPage(page).addToCartBtn.click();
    await page.waitForTimeout(500);
    const cart = new CartPage(page);
    await cart.goto();
    await cart.applyCoupon(code.toLowerCase());
    await expect(cart.couponSuccess).toBeVisible({ timeout: 5_000 });
  });

  test('expired coupon shows clear error message', async ({ page, request }) => {
    const code = await createCoupon(request, {
      expiryDate: new Date(Date.now() - 86400_000).toISOString(), // expired yesterday
    });
    const products = new ProductsPage(page);
    await products.goto();
    await products.openFirstProduct();
    await new ProductDetailPage(page).addToCartBtn.click();
    await page.waitForTimeout(500);
    const cart = new CartPage(page);
    await cart.goto();
    await cart.applyCoupon(code);
    await expect(cart.couponError).toBeVisible({ timeout: 5_000 });
    const errText = await cart.couponError.textContent();
    expect(errText?.toLowerCase()).toMatch(/expired|invalid/);
  });

  test('invalid coupon shows error message', async ({ page }) => {
    const products = new ProductsPage(page);
    await products.goto();
    await products.openFirstProduct();
    await new ProductDetailPage(page).addToCartBtn.click();
    await page.waitForTimeout(500);
    const cart = new CartPage(page);
    await cart.goto();
    await cart.applyCoupon('NOTAREALCODE999');
    await expect(cart.couponError).toBeVisible({ timeout: 5_000 });
  });

  test('percentage coupon respects max discount cap', async ({ page, request }) => {
    const code = await createCoupon(request, {
      type: 'percentage', value: 99, maxDiscount: 50,
    });
    const products = new ProductsPage(page);
    await products.goto();
    await products.openFirstProduct();
    await new ProductDetailPage(page).addToCartBtn.click();
    await page.waitForTimeout(500);
    const cart = new CartPage(page);
    await cart.goto();
    await cart.applyCoupon(code);
    if (await cart.couponSuccess.isVisible({ timeout: 5_000 }).catch(() => false)) {
      const discountText = await page.locator('[data-testid="discount-amount"]').textContent();
      const discountNum  = parseFloat(discountText?.replace(/[^0-9.]/g, '') ?? '0');
      expect(discountNum).toBeLessThanOrEqual(50);
    }
  });
});
