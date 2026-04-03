// tests/checkout/checkout.spec.ts
// STORY-005: Checkout & Order Creation

import { test, expect } from '@playwright/test';
import { ProductsPage, ProductDetailPage, CartPage, CheckoutPage } from '../../page-objects';
import { TEST_ADDRESS } from '../../fixtures';

async function reachCheckout(page: any) {
  const products = new ProductsPage(page);
  await products.goto();
  await products.openFirstProduct();
  const detail = new ProductDetailPage(page);
  await detail.addToCartBtn.click();
  await page.waitForTimeout(500);
  const cart = new CartPage(page);
  await cart.goto();
  await cart.checkoutBtn.click();
  await expect(page).toHaveURL(/checkout/, { timeout: 8_000 });
}

test.describe('STORY-005 | Checkout & Order Creation', () => {

  test('address form renders all required fields', async ({ page }) => {
    await reachCheckout(page);
    const checkout = new CheckoutPage(page);
    await expect(checkout.fullNameInput).toBeVisible();
    await expect(checkout.phoneInput).toBeVisible();
    await expect(checkout.line1Input).toBeVisible();
    await expect(checkout.cityInput).toBeVisible();
    await expect(checkout.stateInput).toBeVisible();
    await expect(checkout.pincodeInput).toBeVisible();
  });

  test('address form validates required fields on empty submit', async ({ page }) => {
    await reachCheckout(page);
    const checkout = new CheckoutPage(page);
    await checkout.placeOrderBtn.click();
    await expect(checkout.validationErrors.first()).toBeVisible({ timeout: 5_000 });
  });

  test('pincode validates format (6 digits)', async ({ page }) => {
    await reachCheckout(page);
    const checkout = new CheckoutPage(page);
    await checkout.pincodeInput.fill('12'); // invalid
    await checkout.placeOrderBtn.click();
    // Should show pincode error
    const pincodeError = page.locator('[data-testid="pincode-error"]');
    await expect(pincodeError).toBeVisible({ timeout: 5_000 });
  });

  test('Razorpay payment modal opens on valid form submission', async ({ page }) => {
    await reachCheckout(page);
    const checkout = new CheckoutPage(page);
    await checkout.fillAddress(TEST_ADDRESS);
    await checkout.placeOrderBtn.click();

    // Razorpay opens in an iframe or new context
    // Wait for Razorpay iframe or modal
    const razorpayFrame = page.frameLocator('iframe[src*="razorpay"]');
    const razorpayModal = page.locator('[data-testid="razorpay-modal"]');

    const razorpayVisible = await razorpayFrame.locator('body')
      .isVisible({ timeout: 10_000 })
      .catch(() => false)
      || await razorpayModal.isVisible({ timeout: 2_000 }).catch(() => false);

    expect(razorpayVisible).toBeTruthy();
  });

  test('mock payment failure shows error and retry option', async ({ page }) => {
    // Mock failed payment response
    await page.route('**/payments/verify**', route =>
      route.fulfill({ status: 400, body: JSON.stringify({ error: 'Payment failed' }) })
    );

    await reachCheckout(page);
    const checkout = new CheckoutPage(page);
    await checkout.fillAddress(TEST_ADDRESS);
    await checkout.placeOrderBtn.click();

    await expect(page.locator('[data-testid="payment-error"]')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('[data-testid="retry-payment-btn"]')).toBeVisible();
  });

  test('saved address is pre-filled on second checkout visit', async ({ page }) => {
    await reachCheckout(page);
    const checkout = new CheckoutPage(page);
    await checkout.fillAddress(TEST_ADDRESS);
    // Save address
    const saveAddressBtn = page.locator('[data-testid="save-address"]');
    if (await saveAddressBtn.isVisible()) await saveAddressBtn.click();

    // Visit checkout again
    await reachCheckout(page);
    const prefilled = await checkout.fullNameInput.inputValue();
    expect(prefilled).toBe(TEST_ADDRESS.fullName);
  });
});
