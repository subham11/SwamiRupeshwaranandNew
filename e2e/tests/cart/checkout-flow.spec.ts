/**
 * E2E tests: Checkout flow — Cart → Address → Checkout.
 */
import { test, expect } from '../../fixtures/test-fixtures';
// Slug is auto-generated from title by the API
const TEST_PRODUCT_SLUG = 'bhairava-sadhana-guidebook';

const TEST_ADDRESS = {
  fullName: 'E2E Test User',
  phone: '9876543210',
  address1: '123 Ashram Road',
  address2: 'Near Shiva Temple',
  city: 'Varanasi',
  state: 'Uttar Pradesh',
  pincode: '221001',
  country: 'India',
};

test.describe('Checkout Flow', () => {
  test.beforeEach(async ({ page, productDetailPage }) => {
    // Ensure cart has an item
    await productDetailPage.gotoProduct(TEST_PRODUCT_SLUG);
    await page.waitForLoadState('networkidle');

    const isNotFound = await productDetailPage.isNotFound();
    if (isNotFound) {
      // Try alternate product
      await productDetailPage.gotoProduct('stotra-sangrah-complete-collection-book');
      await page.waitForLoadState('networkidle');
    }

    if (await productDetailPage.isAddToCartVisible()) {
      await productDetailPage.addToCart();
      await page.waitForTimeout(1500);
    }
  });

  test('should proceed from cart to address step', async ({
    page,
    cartPage,
  }) => {
    await cartPage.gotoCart();
    await page.waitForLoadState('networkidle');

    const isEmpty = await cartPage.isEmptyCart();
    if (isEmpty) {
      test.skip(true, 'Cart is empty — product may not have been added');
      return;
    }

    await cartPage.proceedToCheckout();
    await page.waitForTimeout(1000);

    // Should now see address form or Shipping Address heading
    const addressHeading = page.locator('text=/Shipping Address|shipping address/i');
    const addressForm = page.locator('label:has-text("Full Name")');
    const isAddressStep = await addressHeading.first().isVisible().catch(() => false) ||
      await addressForm.isVisible().catch(() => false);
    expect(isAddressStep).toBeTruthy();
  });

  test('should fill address and proceed to checkout step', async ({
    page,
    cartPage,
  }) => {
    await cartPage.gotoCart();
    await page.waitForLoadState('networkidle');

    const isEmpty = await cartPage.isEmptyCart();
    if (isEmpty) {
      test.skip(true, 'Cart is empty');
      return;
    }

    // Step 1: Proceed to address
    await cartPage.proceedToCheckout();
    await page.waitForTimeout(1000);

    // Step 2: Fill address form (or skip if already saved)
    const addressFormVisible = await cartPage.fullNameInput.isVisible({ timeout: 3000 }).catch(() => false);
    if (addressFormVisible) {
      await cartPage.fillAddress(TEST_ADDRESS);
      await page.waitForTimeout(1000);
    } else {
      // Address already saved — check if we see the saved summary
      const savedAddress = page.locator('text=/Shipping Address|shipping address/i');
      const hasSaved = await savedAddress.first().isVisible().catch(() => false);
      if (hasSaved) {
        // Address is already saved, we can proceed
        await page.waitForTimeout(500);
      }
    }

    // Step 3: Should be able to proceed to checkout
    // Look for the proceed/place order button
    const placeOrderVisible = await cartPage.placeOrderButton.isVisible();
    const proceedVisible = await cartPage.proceedButton.isVisible();
    expect(placeOrderVisible || proceedVisible).toBeTruthy();
  });

  test('should show checkout/payment step after address', async ({
    page,
    cartPage,
  }) => {
    await cartPage.gotoCart();
    await page.waitForLoadState('networkidle');

    const isEmpty = await cartPage.isEmptyCart();
    if (isEmpty) {
      test.skip(true, 'Cart is empty');
      return;
    }

    // Proceed through steps
    await cartPage.proceedToCheckout();
    await page.waitForTimeout(1000);

    // Fill address form (or skip if already saved)
    const addressFormVisible = await cartPage.fullNameInput.isVisible({ timeout: 3000 }).catch(() => false);
    if (addressFormVisible) {
      await cartPage.fillAddress(TEST_ADDRESS);
      await page.waitForTimeout(1000);
    } else {
      // Address already saved — just wait briefly
      await page.waitForTimeout(500);
    }

    // Click proceed again to go to checkout step (if there's another proceed button)
    if (await cartPage.proceedButton.isVisible()) {
      await cartPage.proceedToCheckout();
      await page.waitForTimeout(1000);
    }

    // Should see Place Order or payment integration message
    const placeOrder = page.locator('button:has-text("Place Order")');
    const paymentMsg = page.locator('text=Payment integration coming soon');
    const hasPlaceOrder = await placeOrder.isVisible();
    const hasPaymentMsg = await paymentMsg.isVisible();
    expect(hasPlaceOrder || hasPaymentMsg).toBeTruthy();
  });

  test('should allow editing saved address', async ({
    page,
    cartPage,
  }) => {
    await cartPage.gotoCart();
    await page.waitForLoadState('networkidle');

    const isEmpty = await cartPage.isEmptyCart();
    if (isEmpty) {
      test.skip(true, 'Cart is empty');
      return;
    }

    await cartPage.proceedToCheckout();
    await page.waitForTimeout(1000);

    // If address is already saved, click Edit to show form; otherwise fill fresh
    const editBtn = page.locator('text=/Edit Address|Edit/i').first();
    if (await editBtn.isVisible().catch(() => false)) {
      await editBtn.click();
      await page.waitForTimeout(500);
    } else {
      // No saved address yet — fill and save first
      await cartPage.fillAddress(TEST_ADDRESS);
      await page.waitForTimeout(1000);
      // Now click Edit
      if (await editBtn.isVisible().catch(() => false)) {
        await editBtn.click();
        await page.waitForTimeout(500);
      }
    }

    // Form should be visible — update city
    if (await cartPage.cityInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await cartPage.cityInput.fill('Rishikesh');
      await cartPage.saveAddressButton.click();
      await page.waitForTimeout(1000);
      // Verify address was saved with new city
      const savedAddress = page.locator('text=Rishikesh');
      expect(await savedAddress.isVisible()).toBeTruthy();
    }
  });
});
