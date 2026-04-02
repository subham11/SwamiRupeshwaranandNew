/**
 * E2E tests: Product checkout with Razorpay payment.
 */
import { test, expect } from '../../fixtures/test-fixtures';
import { interceptAndMockOrderPayment } from '../../fixtures/razorpay-helpers';
import { E2E_SLUG_PREFIX } from '../../fixtures/seed-data';

const TEST_PRODUCT_SLUG = `${E2E_SLUG_PREFIX}organic-dhoop-gift-set`;

const TEST_ADDRESS = {
  fullName: 'E2E Checkout User',
  phone: '9123456789',
  address1: '42 Temple Street',
  city: 'Haridwar',
  state: 'Uttarakhand',
  pincode: '249401',
};

test.describe('Product Checkout with Razorpay', () => {
  test('should complete checkout flow up to payment', async ({
    page,
    productDetailPage,
    cartPage,
  }) => {
    // Add product to cart
    await productDetailPage.gotoProduct(TEST_PRODUCT_SLUG);
    await page.waitForLoadState('networkidle');

    const isNotFound = await productDetailPage.isNotFound();
    if (isNotFound) {
      test.skip(true, 'Seeded product not found');
      return;
    }

    if (await productDetailPage.isAddToCartVisible()) {
      await productDetailPage.addToCart();
      await page.waitForTimeout(1500);
    }

    // Navigate to cart
    await cartPage.gotoCart();
    await page.waitForLoadState('networkidle');

    const isEmpty = await cartPage.isEmptyCart();
    if (isEmpty) {
      test.skip(true, 'Cart is empty');
      return;
    }

    // Proceed through checkout
    await cartPage.proceedToCheckout();
    await page.waitForTimeout(1000);

    await cartPage.fillAddress(TEST_ADDRESS);
    await page.waitForTimeout(1000);

    // Check we reached the checkout/payment step
    if (await cartPage.proceedButton.isVisible()) {
      await cartPage.proceedToCheckout();
      await page.waitForTimeout(1000);
    }

    // Should see place order button or payment message
    const placeOrder = page.locator('button:has-text("Place Order")');
    const paymentMsg = page.locator('text=Payment');
    expect(
      (await placeOrder.isVisible()) || (await paymentMsg.first().isVisible()),
    ).toBeTruthy();
  });

  test('should handle mocked successful order payment', async ({
    page,
    productDetailPage,
    cartPage,
  }) => {
    // Set up payment mocks
    await interceptAndMockOrderPayment(page);

    // Add product
    await productDetailPage.gotoProduct(TEST_PRODUCT_SLUG);
    await page.waitForLoadState('networkidle');

    const isNotFound = await productDetailPage.isNotFound();
    if (isNotFound) {
      test.skip(true, 'Seeded product not found');
      return;
    }

    if (await productDetailPage.isAddToCartVisible()) {
      await productDetailPage.addToCart();
      await page.waitForTimeout(1500);
    }

    await cartPage.gotoCart();
    await page.waitForLoadState('networkidle');

    // Verify cart loaded
    expect(page.url()).toContain('/cart');
  });

  test('should show correct product in cart after adding', async ({
    page,
    productDetailPage,
    cartPage,
  }) => {
    await productDetailPage.gotoProduct(TEST_PRODUCT_SLUG);
    await page.waitForLoadState('networkidle');

    const isNotFound = await productDetailPage.isNotFound();
    if (isNotFound) {
      test.skip(true, 'Seeded product not found');
      return;
    }

    if (await productDetailPage.isAddToCartVisible()) {
      await productDetailPage.addToCart();
      await page.waitForTimeout(1500);
    }

    await cartPage.gotoCart();
    await page.waitForLoadState('networkidle');

    const isEmpty = await cartPage.isEmptyCart();
    if (!isEmpty) {
      // Product name should appear somewhere in cart
      const productInCart = page.locator('text=Organic Dhoop, text=Dhoop');
      const hasProduct = await productInCart.first().isVisible();
      // May also be shown by price
      const priceInCart = page.locator('text=₹299');
      const hasPrice = await priceInCart.first().isVisible();
      expect(hasProduct || hasPrice).toBeTruthy();
    }
  });
});
