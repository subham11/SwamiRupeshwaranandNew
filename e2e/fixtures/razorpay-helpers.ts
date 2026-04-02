/**
 * Razorpay test mode helpers for E2E payment testing.
 */
import { Page, FrameLocator } from '@playwright/test';

export const RAZORPAY_TEST_CARD = {
  number: '4111111111111111',
  expiry: '12/30',
  cvv: '123',
  name: 'Test User',
};

export const RAZORPAY_TEST_UPI = 'success@razorpay';

/**
 * Wait for the Razorpay checkout iframe to appear.
 */
export async function waitForRazorpayFrame(page: Page): Promise<FrameLocator> {
  await page.waitForSelector('iframe[src*="razorpay"]', { timeout: 15000 });
  return page.frameLocator('iframe[src*="razorpay"]');
}

/**
 * Mock approach: intercept Razorpay script and payment verification for CI.
 * This prevents the actual Razorpay modal from opening and simulates success.
 */
export async function interceptAndMockPayment(page: Page) {
  // Block Razorpay checkout script to prevent modal
  await page.route('**/checkout.razorpay.com/**', (route) => route.abort());

  // Mock the subscription initiation to return a test subscription ID
  await page.route('**/payments/subscription/initiate', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        subscriptionId: 'sub_test_e2e_mock',
        razorpaySubscriptionId: 'sub_test_razorpay_mock',
        status: 'created',
      }),
    }),
  );

  // Mock payment verification to return success
  await page.route('**/payments/subscription/verify**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        message: 'Payment verified successfully',
        subscriptionId: 'sub_test_e2e_mock',
      }),
    }),
  );
}

/**
 * Mock approach for order payment (product checkout).
 */
export async function interceptAndMockOrderPayment(page: Page) {
  await page.route('**/checkout.razorpay.com/**', (route) => route.abort());

  await page.route('**/payments/create', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        orderId: 'order_test_e2e_mock',
        razorpayOrderId: 'order_test_razorpay_mock',
        amount: 100,
        currency: 'INR',
      }),
    }),
  );

  await page.route('**/payments/verify', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        message: 'Payment verified',
        orderId: 'order_test_e2e_mock',
      }),
    }),
  );
}

/**
 * Mock payment failure for testing error handling.
 */
export async function interceptAndMockPaymentFailure(page: Page) {
  await page.route('**/checkout.razorpay.com/**', (route) => route.abort());

  await page.route('**/payments/subscription/verify**', (route) =>
    route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify({
        success: false,
        message: 'Payment verification failed',
      }),
    }),
  );
}
