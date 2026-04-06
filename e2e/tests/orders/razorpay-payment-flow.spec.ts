/**
 * E2E Test: Razorpay Payment Flow (Test Mode)
 *
 * Uses Razorpay TEST keys to complete a real payment:
 * 1. Create a test order via Razorpay API
 * 2. Open Razorpay checkout in a FRESH browser context (no prior session)
 * 3. Pay via UPI with success@razorpay
 * 4. Verify payment captured via Razorpay API
 *
 * Requires RAZORPAY_TEST_KEY_ID and RAZORPAY_TEST_KEY_SECRET in e2e/.env
 */
import { test, expect, chromium } from '@playwright/test';
import * as crypto from 'crypto';

const RAZORPAY_TEST_KEY_ID = process.env.RAZORPAY_TEST_KEY_ID || '';
const RAZORPAY_TEST_KEY_SECRET = process.env.RAZORPAY_TEST_KEY_SECRET || '';

function razorpayAuth() {
  return 'Basic ' + Buffer.from(`${RAZORPAY_TEST_KEY_ID}:${RAZORPAY_TEST_KEY_SECRET}`).toString('base64');
}

test.describe.serial('Razorpay Payment Flow (Test Mode)', () => {
  let razorpayOrderId: string;
  let razorpayPaymentId: string;

  test.skip(!RAZORPAY_TEST_KEY_ID || !RAZORPAY_TEST_KEY_SECRET,
    'Skipped: Set RAZORPAY_TEST_KEY_ID and RAZORPAY_TEST_KEY_SECRET in e2e/.env');

  // ──────────────────────────────────────────────
  // Step 1: Create a Razorpay test order via API
  // ──────────────────────────────────────────────
  test('Step 1: Create Razorpay test order', async ({ request }) => {
    const resp = await request.post('https://api.razorpay.com/v1/orders', {
      headers: {
        'Authorization': razorpayAuth(),
        'Content-Type': 'application/json',
      },
      data: {
        amount: 29900,
        currency: 'INR',
        receipt: 'e2e_test_receipt',
        payment_capture: 1,
        notes: {
          purpose: 'E2E payment test',
          orderId: 'e2e-test-order',
          type: 'product_order',
        },
      },
    });

    expect(resp.ok()).toBeTruthy();
    const order = await resp.json();
    razorpayOrderId = order.id;

    expect(razorpayOrderId).toMatch(/^order_/);
    expect(order.amount).toBe(29900);
    expect(order.status).toBe('created');

    console.log(`✅ Razorpay test order created: ${razorpayOrderId} (₹299)`);
  });

  // ──────────────────────────────────────────────
  // Step 2: Complete payment in a fresh browser context
  // ──────────────────────────────────────────────
  test('Step 2: Complete payment via Razorpay UPI test flow', async () => {
    test.setTimeout(90000);
    expect(razorpayOrderId).toBeTruthy();

    // Launch a FRESH browser context — no cookies, no session state
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      await page.goto('about:blank');

      // Expose function to capture payment result
      let resolvePayment: (val: string) => void;
      const paymentPromise = new Promise<string>((resolve) => { resolvePayment = resolve; });

      await page.exposeFunction('__e2ePaymentSuccess', (data: string) => {
        resolvePayment(data);
      });

      // Open Razorpay checkout
      await page.evaluate(({ keyId, orderId }) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => {
          const rzp = new (window as any).Razorpay({
            key: keyId,
            amount: 29900,
            currency: 'INR',
            name: 'Bhairava Path',
            description: 'E2E Test Payment',
            order_id: orderId,
            handler: (response: any) => {
              (window as any).__e2ePaymentSuccess(JSON.stringify(response));
            },
            prefill: {
              name: 'E2E Test Buyer',
              email: 'test@swamirupeshwaranand.org',
              contact: '+919004023156',
            },
          });
          rzp.open();
        };
        document.head.appendChild(script);
      }, { keyId: RAZORPAY_TEST_KEY_ID, orderId: razorpayOrderId });

      // Wait for Razorpay checkout iframe to load
      const rzpFrame = page.frameLocator('.razorpay-checkout-frame').first();
      await page.waitForTimeout(4000);

      // Handle "Contact details" dialog if it appears
      try {
        const contactText = rzpFrame.locator('text=Contact details').first();
        const hasContactDialog = await contactText.isVisible({ timeout: 3000 }).catch(() => false);
        if (hasContactDialog) {
          // Find and fill the phone input
          const phoneInput = rzpFrame.locator('input[type="tel"], input[placeholder*="Mobile"]').first();
          await phoneInput.click({ force: true, clickCount: 3 });
          await page.waitForTimeout(200);
          // Type a valid 10-digit Indian number
          await phoneInput.pressSequentially('9004023156', { delay: 50 });
          await page.waitForTimeout(300);
          const continueBtn = rzpFrame.locator('button:has-text("Continue")').first();
          await continueBtn.click({ force: true });
          await page.waitForTimeout(2000);
          console.log('  Filled contact details (9876543210)');
        }
      } catch { /* dialog might not appear in fresh context */ }

      // Select UPI payment method
      const upiOption = rzpFrame.locator('text=UPI').first();
      await upiOption.waitFor({ timeout: 10000 });
      await upiOption.click({ force: true });
      await page.waitForTimeout(2000);
      console.log('  Selected UPI payment method');

      // Find UPI ID input — might need to switch from QR to ID view
      let upiInput = rzpFrame.locator(
        'input[name="vpa"], input[placeholder*="UPI"], input[placeholder*="@"]'
      ).first();
      let hasUpiInput = await upiInput.isVisible({ timeout: 3000 }).catch(() => false);

      if (!hasUpiInput) {
        // Try switching from QR to UPI ID view
        const switchSelectors = [
          'text=Enter UPI ID',
          'text=UPI ID',
          'text=Pay with UPI ID',
        ];
        for (const sel of switchSelectors) {
          const el = rzpFrame.locator(sel).first();
          const vis = await el.isVisible({ timeout: 1000 }).catch(() => false);
          if (vis) {
            await el.click({ force: true });
            await page.waitForTimeout(1500);
            console.log(`  Switched to UPI ID via: ${sel}`);
            break;
          }
        }

        // Try finding input again with broader selector
        upiInput = rzpFrame.locator('input[type="text"], input[name="vpa"]').first();
        hasUpiInput = await upiInput.isVisible({ timeout: 5000 }).catch(() => false);
      }

      expect(hasUpiInput).toBeTruthy();

      await upiInput.click({ force: true });
      await upiInput.fill('success@razorpay');
      await page.waitForTimeout(500);
      console.log('  Entered UPI ID: success@razorpay');

      // Click "Verify and Pay"
      const payBtn = rzpFrame.locator(
        'button:has-text("Verify and Pay"), button:has-text("Pay")'
      ).first();
      await payBtn.waitFor({ timeout: 5000 });
      await payBtn.click({ force: true });
      console.log('  Clicked Verify and Pay');

      // Wait for payment to complete
      const resultStr = await Promise.race([
        paymentPromise,
        new Promise<string>((_, reject) => setTimeout(() => reject(new Error(
          'Payment handler not called within 30s'
        )), 30000)),
      ]);

      const result = JSON.parse(resultStr);
      razorpayPaymentId = result.razorpay_payment_id;

      expect(razorpayPaymentId).toMatch(/^pay_/);
      expect(result.razorpay_order_id).toBe(razorpayOrderId);
      expect(result.razorpay_signature).toBeTruthy();

      // Verify signature
      const expectedSignature = crypto
        .createHmac('sha256', RAZORPAY_TEST_KEY_SECRET)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');
      expect(result.razorpay_signature).toBe(expectedSignature);

      console.log(`✅ Payment completed and signature verified!`);
      console.log(`   Payment ID: ${razorpayPaymentId}`);
      console.log(`   Order ID:   ${razorpayOrderId}`);
    } finally {
      await context.close();
      await browser.close();
    }
  });

  // ──────────────────────────────────────────────
  // Step 3: Verify payment captured in Razorpay
  // ──────────────────────────────────────────────
  test('Step 3: Verify payment captured in Razorpay', async ({ request }) => {
    expect(razorpayPaymentId).toBeTruthy();

    const resp = await request.get(`https://api.razorpay.com/v1/payments/${razorpayPaymentId}`, {
      headers: { 'Authorization': razorpayAuth() },
    });

    expect(resp.ok()).toBeTruthy();
    const payment = await resp.json();

    expect(payment.id).toBe(razorpayPaymentId);
    expect(payment.order_id).toBe(razorpayOrderId);
    expect(payment.amount).toBe(29900);
    expect(payment.currency).toBe('INR');
    expect(payment.status).toBe('captured');

    console.log(`✅ Payment verified in Razorpay:`);
    console.log(`   Status:  ${payment.status}`);
    console.log(`   Amount:  ₹${payment.amount / 100}`);
    console.log(`   Method:  ${payment.method}`);
    console.log(`   Email:   ${payment.email}`);

    // Verify the order is now paid
    const orderResp = await request.get(`https://api.razorpay.com/v1/orders/${razorpayOrderId}`, {
      headers: { 'Authorization': razorpayAuth() },
    });
    const order = await orderResp.json();
    expect(order.status).toBe('paid');
    console.log(`   Order:   ${order.status}`);
  });
});
