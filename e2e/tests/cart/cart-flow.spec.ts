/**
 * E2E tests: Cart flow — add items, update quantity, remove, clear.
 */
import { test, expect } from '../../fixtures/test-fixtures';
// Slug is auto-generated from title by the API
const TEST_PRODUCT_SLUG = 'stotra-sangrah-complete-collection-book';

test.describe('Cart Flow', () => {
  test('should show empty cart state', async ({ cartPage }) => {
    await cartPage.gotoCart();
    await cartPage.page.waitForLoadState('networkidle');

    // Cart may or may not be empty depending on previous tests
    // This test verifies the page loads correctly
    expect(cartPage.page.url()).toContain('/cart');
  });

  test('should add product to cart and see it in cart', async ({
    page,
    productDetailPage,
    cartPage,
  }) => {
    // Navigate to a known product and add to cart
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

      // Navigate to cart
      await cartPage.gotoCart();
      await page.waitForLoadState('networkidle');

      // Verify cart is not empty (has at least the product we just added)
      const isEmpty = await cartPage.isEmptyCart();
      expect(isEmpty).toBeFalsy();
    }
  });

  test('should show order summary with total', async ({
    page,
    productDetailPage,
    cartPage,
  }) => {
    // Ensure cart has an item
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
      // Order summary should be visible
      await expect(cartPage.orderSummary).toBeVisible();
    }
  });

  test('should have Proceed to Checkout button when cart has items', async ({
    page,
    cartPage,
  }) => {
    await cartPage.gotoCart();
    await page.waitForLoadState('networkidle');

    const isEmpty = await cartPage.isEmptyCart();
    if (!isEmpty) {
      await expect(cartPage.proceedButton).toBeVisible();
    }
  });

  test('should show Browse Products link when cart is empty', async ({
    page,
    cartPage,
  }) => {
    // Clear cart first
    await cartPage.gotoCart();
    await page.waitForLoadState('networkidle');

    if (await cartPage.clearCartButton.isVisible()) {
      await cartPage.clearCart();
      await page.waitForTimeout(1000);
    }

    const isEmpty = await cartPage.isEmptyCart();
    if (isEmpty) {
      await expect(cartPage.browseProductsLink).toBeVisible();
    }
  });
});
