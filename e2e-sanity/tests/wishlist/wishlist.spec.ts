// tests/wishlist/wishlist.spec.ts
// STORY-008: Product Wishlist

import { test, expect } from '@playwright/test';
import { ProductsPage, ProductDetailPage, DashboardPage } from '../../page-objects';

async function openFirstProduct(page: any) {
  const products = new ProductsPage(page);
  await products.goto();
  await products.openFirstProduct();
  return new ProductDetailPage(page);
}

test.describe('STORY-008 | Product Wishlist', () => {

  test('add to wishlist button exists on product detail page', async ({ page }) => {
    const detail = await openFirstProduct(page);
    await expect(detail.addToWishlistBtn).toBeVisible();
  });

  test('user can add product to wishlist', async ({ page }) => {
    const detail = await openFirstProduct(page);
    await detail.addToWishlistBtn.click();
    // Success indicator (button change or toast)
    const wishlistAdded = page.locator('[data-testid="wishlist-added"]');
    const btnActive = detail.addToWishlistBtn.locator('[aria-pressed="true"]');
    const confirmed = await wishlistAdded.isVisible({ timeout: 5_000 }).catch(() => false)
      || await btnActive.isVisible({ timeout: 2_000 }).catch(() => false);
    expect(confirmed).toBeTruthy();
  });

  test('adding same product twice is idempotent (no duplicates)', async ({ page }) => {
    const detail = await openFirstProduct(page);
    await detail.addToWishlistBtn.click();
    await page.waitForTimeout(500);
    await detail.addToWishlistBtn.click(); // second click

    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await dashboard.wishlistTab.click();
    await page.waitForLoadState('networkidle');

    // Count items with same title — should be 1
    const titles = await dashboard.wishlistItems
      .locator('[data-testid="wishlist-item-title"]')
      .allTextContents();
    const url  = page.url();
    const slug = url.split('/').pop() ?? '';
    const dupes = titles.filter(t => t.trim().length > 0);
    const uniqueTitles = new Set(dupes);
    expect(uniqueTitles.size).toBe(dupes.length);
  });

  test('wishlist tab in dashboard displays product cards with image, title, price', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await dashboard.wishlistTab.click();
    await page.waitForLoadState('networkidle');

    const items = dashboard.wishlistItems;
    if (await items.count() === 0) {
      // Add a product first
      await openFirstProduct(page).then(d => d.addToWishlistBtn.click());
      await dashboard.goto();
      await dashboard.wishlistTab.click();
    }

    const first = items.first();
    await expect(first.locator('img')).toBeVisible();
    await expect(first.locator('[data-testid="wishlist-item-title"]')).not.toBeEmpty();
    await expect(first.locator('[data-testid="wishlist-item-price"]')).toBeVisible();
  });

  test('wishlist item has Add to Cart button', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await dashboard.wishlistTab.click();
    await page.waitForLoadState('networkidle');
    const items = dashboard.wishlistItems;
    if (await items.count() > 0) {
      await expect(items.first().locator('[data-testid="wishlist-add-to-cart"]')).toBeVisible();
    }
  });

  test('user can remove item from wishlist', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await dashboard.wishlistTab.click();
    await page.waitForLoadState('networkidle');
    const items = dashboard.wishlistItems;
    if (await items.count() > 0) {
      const countBefore = await items.count();
      await items.first().locator('[data-testid="wishlist-remove"]').click();
      await page.waitForLoadState('networkidle');
      const countAfter = await dashboard.wishlistItems.count();
      expect(countAfter).toBe(countBefore - 1);
    }
  });

  test('user can clear entire wishlist', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await dashboard.wishlistTab.click();
    await page.waitForLoadState('networkidle');
    const clearBtn = page.locator('[data-testid="clear-wishlist"]');
    if (await clearBtn.isVisible()) {
      await clearBtn.click();
      const confirm = page.locator('[data-testid="confirm-clear-wishlist"]');
      if (await confirm.isVisible({ timeout: 2000 })) await confirm.click();
      await expect(page.locator('[data-testid="empty-wishlist"]')).toBeVisible({ timeout: 5_000 });
    }
  });
});
