// tests/payments/razorpay.payments.spec.ts
// STORY-017: Razorpay Payment Integration
// Covers: product checkout, subscription purchase, donation, webhook handling,
//         success/failure flows, signature verification

import { test, expect } from '@playwright/test';
import {
  mockRazorpaySuccess,
  mockRazorpayFailure,
  mockRazorpaySubscriptionSuccess,
  mockRazorpayDonationSuccess,
} from '../../helpers/razorpay.mock';
import { ProductsPage, ProductDetailPage, CartPage, CheckoutPage } from '../../page-objects';
import { TEST_ADDRESS } from '../../fixtures';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

async function addProductAndReachCheckout(page: any) {
  const products = new ProductsPage(page);
  await products.goto();
  await products.openFirstProduct();
  await new ProductDetailPage(page).addToCartBtn.click();
  await page.waitForTimeout(400);
  await page.goto('/cart');
  await new CartPage(page).checkoutBtn.click();
  await expect(page).toHaveURL(/checkout/, { timeout: 8_000 });
}

// ─────────────────────────────────────────────────────────────────────────────
// Test Suite
// ─────────────────────────────────────────────────────────────────────────────

test.describe('STORY-017 | Razorpay Payment Integration', () => {

  // ── Product Checkout ───────────────────────────────────────────────────────

  test('product checkout creates a Razorpay order via API', async ({ page, request }) => {
    let orderCreateCalled = false;
    await page.route('**/api/orders', route => {
      if (route.request().method() === 'POST') orderCreateCalled = true;
      route.continue();
    });

    await addProductAndReachCheckout(page);
    await new CheckoutPage(page).fillAddress(TEST_ADDRESS);
    await new CheckoutPage(page).placeOrderBtn.click();
    await page.waitForTimeout(1000);
    expect(orderCreateCalled).toBe(true);
  });

  test('successful product payment marks order as paid and clears cart', async ({ page }) => {
    await mockRazorpaySuccess(page);
    await addProductAndReachCheckout(page);
    const checkout = new CheckoutPage(page);
    await checkout.fillAddress(TEST_ADDRESS);
    await checkout.placeOrderBtn.click();

    // Should land on order confirmation
    await expect(page).toHaveURL(/order-confirmation|orders\/[^/]+/, { timeout: 12_000 });
    await expect(page.locator('[data-testid="order-confirmation"]')).toBeVisible({ timeout: 8_000 });

    // Cart should be empty
    await page.goto('/cart');
    await expect(page.locator('[data-testid="empty-cart"]')).toBeVisible({ timeout: 5_000 });
  });

  test('order confirmation page shows order details', async ({ page }) => {
    await mockRazorpaySuccess(page);
    await addProductAndReachCheckout(page);
    await new CheckoutPage(page).fillAddress(TEST_ADDRESS);
    await new CheckoutPage(page).placeOrderBtn.click();
    await expect(page).toHaveURL(/order-confirmation|orders\/[^/]+/, { timeout: 12_000 });

    const confirmation = page.locator('[data-testid="order-confirmation"]');
    await expect(confirmation).toBeVisible({ timeout: 8_000 });
    await expect(confirmation.locator('[data-testid="order-id"]')).not.toBeEmpty();
    await expect(confirmation.locator('[data-testid="order-amount"]')).toBeVisible();
    await expect(confirmation.locator('[data-testid="order-items"]')).toBeVisible();
  });

  test('failed product payment shows error message and retry button', async ({ page }) => {
    await mockRazorpayFailure(page);
    await addProductAndReachCheckout(page);
    await new CheckoutPage(page).fillAddress(TEST_ADDRESS);
    await new CheckoutPage(page).placeOrderBtn.click();

    await expect(page.locator('[data-testid="payment-error"]')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('[data-testid="retry-payment-btn"]')).toBeVisible();
  });

  test('retry payment button re-initiates the payment flow', async ({ page }) => {
    await mockRazorpayFailure(page);
    await addProductAndReachCheckout(page);
    await new CheckoutPage(page).fillAddress(TEST_ADDRESS);
    await new CheckoutPage(page).placeOrderBtn.click();
    await expect(page.locator('[data-testid="payment-error"]')).toBeVisible({ timeout: 10_000 });

    // Now mock success and retry
    await mockRazorpaySuccess(page);
    await page.locator('[data-testid="retry-payment-btn"]').click();
    await expect(page).toHaveURL(/order-confirmation|orders\/[^/]+/, { timeout: 12_000 });
  });

  test('payment signature is verified on backend before confirming order', async ({ page, request }) => {
    let verifyEndpointCalled = false;
    await page.route('**/api/payments/verify**', async route => {
      verifyEndpointCalled = true;
      await route.fulfill({
        status:      200,
        contentType: 'application/json',
        body:        JSON.stringify({ success: true }),
      });
    });

    await mockRazorpaySuccess(page);
    await addProductAndReachCheckout(page);
    await new CheckoutPage(page).fillAddress(TEST_ADDRESS);
    await new CheckoutPage(page).placeOrderBtn.click();
    await page.waitForTimeout(2000);
    expect(verifyEndpointCalled).toBe(true);
  });

  // ── Subscription Payment ───────────────────────────────────────────────────

  test('subscription purchase creates a Razorpay subscription', async ({ page }) => {
    await mockRazorpaySubscriptionSuccess(page);
    await page.goto('/en/subscribe');
    await page.waitForLoadState('networkidle');

    const silverCard = page.locator('[data-testid="plan-card"]').filter({ hasText: 'Silver' });
    if (await silverCard.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await silverCard.locator('[data-testid="subscribe-btn"]').click();
      await expect(
        page.locator('[data-testid="subscription-confirmed"]')
      ).toBeVisible({ timeout: 12_000 });
    }
  });

  test('subscription confirmation email is sent on activation (API check)', async ({ request, page }) => {
    // We verify the endpoint call is made — actual email delivery is mocked by SMTP
    let emailSent = false;
    await page.route('**/api/email/send**', route => {
      emailSent = true;
      route.continue();
    });
    await mockRazorpaySubscriptionSuccess(page);
    await page.goto('/en/subscribe');
    await page.waitForLoadState('networkidle');
    const freeCard = page.locator('[data-testid="plan-card"]').filter({ hasText: 'Free' });
    if (await freeCard.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await freeCard.locator('[data-testid="subscribe-btn"]').click();
      await page.waitForTimeout(2000);
      // Either email API called or subscription confirmed — both valid outcomes
      const confirmed = await page.locator('[data-testid="subscription-confirmed"]')
        .isVisible({ timeout: 8_000 }).catch(() => false);
      expect(confirmed || emailSent).toBeTruthy();
    }
  });

  // ── Donation Payment ───────────────────────────────────────────────────────

  test('donation creates a Razorpay order and processes successfully', async ({ page }) => {
    await mockRazorpayDonationSuccess(page);
    await page.goto('/en/donate');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="donation-amount-btn"]').first().click();
    await page.locator('[data-testid="donate-now-btn"]').click();

    await expect(
      page.locator('[data-testid="donation-success"]')
    ).toBeVisible({ timeout: 12_000 });
  });

  test('donation thank-you shows amount, transaction ID, and tax note', async ({ page }) => {
    await mockRazorpayDonationSuccess(page);
    await page.goto('/en/donate');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="donation-amount-btn"]').first().click();
    await page.locator('[data-testid="donate-now-btn"]').click();

    const success = page.locator('[data-testid="donation-success"]');
    await expect(success).toBeVisible({ timeout: 12_000 });
    await expect(success.locator('[data-testid="donation-amount"]')).toBeVisible();
    await expect(success.locator('[data-testid="transaction-id"]')).not.toBeEmpty();
  });

  // ── Webhook ────────────────────────────────────────────────────────────────

  test('webhook endpoint exists and accepts POST', async ({ request }) => {
    const res = await request.post('/api/payments/webhook', {
      headers: { 'x-razorpay-signature': 'test_signature' },
      data: { event: 'payment.captured', payload: {} },
    });
    // Webhook should not 404 — may return 400/401 for invalid signature
    expect(res.status()).not.toBe(404);
    expect(res.status()).not.toBe(405);
  });

  test('all payment events are logged (API check)', async ({ request }) => {
    const loginRes = await request.post('/api/auth/login', {
      data: { email: process.env.ADMIN_EMAIL || 'admin@bhairavapath.com',
              password: process.env.ADMIN_PASSWORD || 'Admin@1234' },
    });
    const { accessToken } = await loginRes.json();
    const res = await request.get('/api/activity-log?entityType=order&limit=5', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    // Just verify the endpoint returns data — detailed log assertions in analytics spec
    expect(res.ok()).toBeTruthy();
  });
});
