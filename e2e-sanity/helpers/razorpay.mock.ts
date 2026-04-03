// helpers/razorpay.mock.ts
// Utilities to intercept and mock Razorpay payment flows in Playwright tests.
// Import and call `mockRazorpaySuccess` or `mockRazorpayFailure` before triggering payment.

import { Page } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface RazorpayMockOptions {
  orderId?:   string;
  paymentId?: string;
  signature?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Mock a successful Razorpay payment
//
// Intercepts:
//   1. POST /api/orders       → returns a fake Razorpay order ID
//   2. POST /api/payments/verify → returns { success: true }
//   3. Injects window.Razorpay stub so the SDK "opens" and auto-succeeds
// ─────────────────────────────────────────────────────────────────────────────

export async function mockRazorpaySuccess(page: Page, opts: RazorpayMockOptions = {}) {
  const orderId   = opts.orderId   ?? `order_sanity_${Date.now()}`;
  const paymentId = opts.paymentId ?? `pay_sanity_${Date.now()}`;
  const signature = opts.signature ?? 'mock_signature_sanity';

  // Intercept order creation
  await page.route('**/api/orders', async route => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status:      200,
        contentType: 'application/json',
        body: JSON.stringify({
          razorpayOrderId: orderId,
          amount:          49900,
          currency:        'INR',
        }),
      });
    } else {
      await route.continue();
    }
  });

  // Intercept payment verification
  await page.route('**/api/payments/verify**', async route => {
    await route.fulfill({
      status:      200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, orderId, paymentId }),
    });
  });

  // Stub the Razorpay SDK so it fires success handler immediately without UI
  await page.addInitScript(
    ({ oid, pid, sig }) => {
      (window as any).Razorpay = function (opts: any) {
        return {
          open: () => {
            // Simulate immediate successful payment callback
            setTimeout(() => {
              if (typeof opts?.handler === 'function') {
                opts.handler({
                  razorpay_order_id:   oid,
                  razorpay_payment_id: pid,
                  razorpay_signature:  sig,
                });
              }
            }, 100);
          },
        };
      };
    },
    { oid: orderId, pid: paymentId, sig: signature }
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Mock a failed Razorpay payment
// ─────────────────────────────────────────────────────────────────────────────

export async function mockRazorpayFailure(page: Page) {
  await page.route('**/api/orders', async route => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status:      200,
        contentType: 'application/json',
        body: JSON.stringify({
          razorpayOrderId: `order_fail_${Date.now()}`,
          amount:          49900,
          currency:        'INR',
        }),
      });
    } else {
      await route.continue();
    }
  });

  await page.route('**/api/payments/verify**', async route => {
    await route.fulfill({
      status:      400,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Payment verification failed', code: 'BAD_REQUEST_ERROR' }),
    });
  });

  await page.addInitScript(() => {
    (window as any).Razorpay = function (opts: any) {
      return {
        open: () => {
          setTimeout(() => {
            if (typeof opts?.modal?.ondismiss === 'function') {
              opts.modal.ondismiss();
            }
          }, 100);
        },
      };
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Mock Razorpay subscription flow
// ─────────────────────────────────────────────────────────────────────────────

export async function mockRazorpaySubscriptionSuccess(page: Page) {
  const subscriptionId = `sub_sanity_${Date.now()}`;
  const paymentId      = `pay_sub_${Date.now()}`;

  await page.route('**/api/subscriptions/create**', async route => {
    await route.fulfill({
      status:      200,
      contentType: 'application/json',
      body: JSON.stringify({ subscriptionId, status: 'created' }),
    });
  });

  await page.route('**/api/subscriptions/verify**', async route => {
    await route.fulfill({
      status:      200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, subscriptionId, paymentId }),
    });
  });

  await page.addInitScript(
    ({ sid, pid }) => {
      (window as any).Razorpay = function (opts: any) {
        return {
          open: () => {
            setTimeout(() => {
              if (typeof opts?.handler === 'function') {
                opts.handler({
                  razorpay_subscription_id: sid,
                  razorpay_payment_id:      pid,
                  razorpay_signature:       'mock_sub_signature',
                });
              }
            }, 100);
          },
        };
      };
    },
    { sid: subscriptionId, pid: paymentId }
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Mock Razorpay donation payment
// ─────────────────────────────────────────────────────────────────────────────

export async function mockRazorpayDonationSuccess(page: Page) {
  const paymentId = `pay_don_${Date.now()}`;

  await page.route('**/api/donations/create**', async route => {
    await route.fulfill({
      status:      200,
      contentType: 'application/json',
      body: JSON.stringify({
        razorpayOrderId: `order_don_${Date.now()}`,
        amount: 10800,
        currency: 'INR',
      }),
    });
  });

  await page.route('**/api/donations/verify**', async route => {
    await route.fulfill({
      status:      200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, paymentId }),
    });
  });

  await page.addInitScript(({ pid }) => {
    (window as any).Razorpay = function (opts: any) {
      return {
        open: () => {
          setTimeout(() => {
            if (typeof opts?.handler === 'function') {
              opts.handler({
                razorpay_order_id:   `order_don_mock`,
                razorpay_payment_id: pid,
                razorpay_signature:  'mock_don_signature',
              });
            }
          }, 100);
        },
      };
    };
  }, { pid: paymentId });
}
