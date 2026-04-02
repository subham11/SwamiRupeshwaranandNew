/**
 * E2E Test: Razorpay Payment Flow (Test Mode)
 *
 * Uses Razorpay TEST keys to:
 * 1. Create a test order via Razorpay API
 * 2. Open Razorpay checkout and pay via UPI (success@razorpay)
 * 3. Verify payment captured via Razorpay API
 *
 * Uses UPI test flow (success@razorpay) which is more reliable than
 * card flow for automated testing (no 3DS iframe handling needed).
 *
 * Requires RAZORPAY_TEST_KEY_ID and RAZORPAY_TEST_KEY_SECRET in e2e/.env
 */
import { test, expect } from '@playwright/test';
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
  // Step 2: Complete payment via UPI (success@razorpay)
  // ──────────────────────────────────────────────
  test('Step 2: Complete payment via Razorpay UPI test flow', async ({ page }) => {
    test.setTimeout(90000);
    expect(razorpayOrderId).toBeTruthy();

    await page.goto('about:blank');

    // Expose function to capture payment result
    let resolvePayment: (val: any) => void;
    const paymentPromise = new Promise<any>((resolve) => { resolvePayment = resolve; });

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
            email: 'test@bhairavapath.com',
            contact: '9876543210',
          },
        });
        rzp.open();
      };
      document.head.appendChild(script);
    }, { keyId: RAZORPAY_TEST_KEY_ID, orderId: razorpayOrderId });

    // Wait for Razorpay checkout to load
    const rzpFrame = page.frameLocator('.razorpay-checkout-frame').first();
    await page.waitForTimeout(3000);

    // Click on UPI payment method
    const upiOption = rzpFrame.locator('text=UPI').first();
    await upiOption.waitFor({ timeout: 10000 });
    await upiOption.click();
    await page.waitForTimeout(1500);
    console.log('  Selected UPI payment method');

    // Look for "Enter UPI ID" or "VPA" input field
    // Razorpay UPI flow: user enters their VPA (Virtual Payment Address)
    const upiInput = rzpFrame.locator(
      'input[name="vpa"], input[placeholder*="UPI"], input[placeholder*="upi"], input[placeholder*="@"], input[type="text"]'
    ).first();
    await upiInput.waitFor({ timeout: 10000 });
    await upiInput.click();
    await upiInput.fill('success@razorpay');
    await page.waitForTimeout(500);
    console.log('  Entered UPI ID: success@razorpay');

    // Click "Verify and Pay" button
    const payBtn = rzpFrame.locator(
      'button:has-text("Verify and Pay"), button:has-text("Pay ₹"), button:has-text("Pay"), button:has-text("Continue")'
    ).first();
    await payBtn.waitFor({ timeout: 5000 });
    await payBtn.click();
    console.log('  Clicked Verify and Pay button');

    // In test mode with success@razorpay, payment should auto-succeed
    // or show a Success button
    await page.waitForTimeout(3000);

    // Check for Success button in any frame
    let clicked = false;
    for (let attempt = 0; attempt < 20 && !clicked; attempt++) {
      for (const frame of page.frames()) {
        try {
          const successBtn = frame.locator(
            'button:has-text("Success"), input[value="Success"], a:has-text("Success")'
          ).first();
          const isVisible = await successBtn.isVisible({ timeout: 500 }).catch(() => false);
          if (isVisible) {
            await successBtn.click();
            console.log(`  Clicked Success button`);
            clicked = true;
            break;
          }
        } catch { continue; }
      }

      if (!clicked) {
        // Check for popup
        const pages = page.context().pages();
        for (const p of pages) {
          if (p !== page) {
            try {
              const successBtn = p.locator(
                'button:has-text("Success"), input[value="Success"]'
              ).first();
              const isVisible = await successBtn.isVisible({ timeout: 500 }).catch(() => false);
              if (isVisible) {
                await successBtn.click();
                console.log(`  Clicked Success in popup`);
                clicked = true;
                break;
              }
            } catch { continue; }
          }
        }
      }

      if (!clicked) await page.waitForTimeout(1000);
    }

    // Debug if not found
    if (!clicked) {
      console.log('  Frames:');
      for (const frame of page.frames()) {
        console.log(`    ${frame.url().substring(0, 80)}`);
        // Try to capture inner HTML of each frame for debug
        try {
          const text = await frame.locator('body').innerText({ timeout: 1000 });
          if (text.length < 500) console.log(`    Content: ${text.substring(0, 200)}`);
        } catch { /* skip */ }
      }
      await page.screenshot({ path: 'test-results/razorpay-upi-debug.png' });
    }

    // Wait for payment handler
    const resultStr = await Promise.race([
      paymentPromise,
      new Promise<string>((_, reject) => setTimeout(() => reject(new Error(
        'Payment handler not called within 30s. Success button ' + (clicked ? 'clicked' : 'NOT found')
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
