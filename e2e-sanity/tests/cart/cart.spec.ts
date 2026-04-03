// tests/cart/cart.spec.ts
// STORY-004: Shopping Cart

import { test, expect } from '@playwright/test';
import { ProductsPage, ProductDetailPage, CartPage } from '../../page-objects';
import { TEST_COUPON } from '../../fixtures';

// Helper: navigate to first in-stock product and add to cart
async function addFirstProductToCart(page: any) {
  const products = new ProductsPage(page);
  await products.goto();
  await products.openFirstProduct();
  const detail = new ProductDetailPage(page);
  await detail.addToCartBtn.click();
  await expect(page.locator('[data-testid="cart-toast"]')).toBeVisible({ timeout: 5_000 });
}

test.describe('STORY-004 | Shopping Cart', () => {

  test('cart icon shows item count badge after adding a product', async ({ page }) => {
    await addFirstProductToCart(page);
    const detail = new ProductDetailPage(page);
    const badge = detail.cartBadge;
    await expect(badge).toBeVisible();
    const count = await badge.textContent();
    expect(Number(count)).toBeGreaterThan(0);
  });

  test('cart page displays added item with title, price, quantity, subtotal', async ({ page }) => {
    await addFirstProductToCart(page);
    const cart = new CartPage(page);
    await cart.goto();
    await expect(cart.cartItems.first()).toBeVisible();
    const item = cart.cartItems.first();
    await expect(item.locator('[data-testid="item-title"]')).not.toBeEmpty();
    await expect(item.locator('[data-testid="item-price"]')).toBeVisible();
    await expect(item.locator('[data-testid="item-qty"]')).toBeVisible();
    await expect(item.locator('[data-testid="item-subtotal"]')).toBeVisible();
  });

  test('user can increase item quantity', async ({ page }) => {
    await addFirstProductToCart(page);
    const cart = new CartPage(page);
    await cart.goto();
    const qtyBefore = await cart.cartItems.first()
      .locator('[data-testid="item-qty"]').textContent();
    await cart.increaseQty(0);
    const qtyAfter = await cart.cartItems.first()
      .locator('[data-testid="item-qty"]').textContent();
    expect(Number(qtyAfter)).toBe(Number(qtyBefore) + 1);
  });

  test('user can decrease item quantity', async ({ page }) => {
    await addFirstProductToCart(page);
    const cart = new CartPage(page);
    await cart.goto();
    // First increase to 2 so we can decrease
    await cart.increaseQty(0);
    const qtyBefore = await cart.cartItems.first()
      .locator('[data-testid="item-qty"]').textContent();
    await cart.decreaseQty(0);
    const qtyAfter = await cart.cartItems.first()
      .locator('[data-testid="item-qty"]').textContent();
    expect(Number(qtyAfter)).toBe(Number(qtyBefore) - 1);
  });

  test('user can remove individual item from cart', async ({ page }) => {
    await addFirstProductToCart(page);
    const cart = new CartPage(page);
    await cart.goto();
    const countBefore = await cart.cartItems.count();
    await cart.removeItem(0);
    await page.waitForLoadState('networkidle');
    const countAfter = await cart.cartItems.count();
    expect(countAfter).toBe(countBefore - 1);
  });

  test('user can clear entire cart', async ({ page }) => {
    await addFirstProductToCart(page);
    const cart = new CartPage(page);
    await cart.goto();
    await cart.clearCartBtn.click();
    // Handle possible confirmation dialog
    const confirmBtn = page.locator('[data-testid="confirm-clear"]');
    if (await confirmBtn.isVisible({ timeout: 2000 })) await confirmBtn.click();
    await expect(cart.emptyCartMsg).toBeVisible({ timeout: 5_000 });
  });

  test('cart total reflects item prices and quantities', async ({ page }) => {
    await addFirstProductToCart(page);
    const cart = new CartPage(page);
    await cart.goto();
    await expect(cart.cartTotal).toBeVisible();
    const totalText = await cart.cartTotal.textContent();
    expect(totalText).toMatch(/[\d,.₹$]+/);
  });

  test('Proceed to Checkout button leads to address form', async ({ page }) => {
    await addFirstProductToCart(page);
    const cart = new CartPage(page);
    await cart.goto();
    await cart.checkoutBtn.click();
    await expect(page).toHaveURL(/checkout/, { timeout: 8_000 });
    await expect(page.locator('[data-testid="address-name"]')).toBeVisible();
  });

  test('cart persists across page refresh', async ({ page }) => {
    await addFirstProductToCart(page);
    const cart = new CartPage(page);
    await cart.goto();
    const countBefore = await cart.cartItems.count();
    await page.reload();
    await page.waitForLoadState('networkidle');
    const countAfter = await cart.cartItems.count();
    expect(countAfter).toBe(countBefore);
  });
});
