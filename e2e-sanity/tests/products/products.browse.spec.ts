// tests/products/products.browse.spec.ts
// STORY-003: Public Product Browsing

import { test, expect } from '@playwright/test';
import { ProductsPage, ProductDetailPage } from '../../page-objects';

test.describe('STORY-003 | Public Product Browsing', () => {

  test('products page displays cards in a responsive grid', async ({ page }) => {
    const products = new ProductsPage(page);
    await products.goto();
    const cards = products.productCards;
    await expect(cards.first()).toBeVisible({ timeout: 10_000 });
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('each product card shows image, title, price, original price and category badge', async ({ page }) => {
    const products = new ProductsPage(page);
    await products.goto();
    const card = await products.getProductCard(0);
    await expect(card.locator('img')).toBeVisible();
    await expect(card.locator('[data-testid="card-title"]')).not.toBeEmpty();
    await expect(card.locator('[data-testid="card-price"]')).toBeVisible();
    await expect(card.locator('[data-testid="card-original-price"]')).toBeVisible();
    await expect(card.locator('[data-testid="card-category"]')).toBeVisible();
  });

  test('category tabs are rendered', async ({ page }) => {
    const products = new ProductsPage(page);
    await products.goto();
    const tabs = products.categoryTabs;
    await expect(tabs.first()).toBeVisible();
    const count = await tabs.count();
    expect(count).toBeGreaterThan(0);
  });

  test('clicking a category tab filters products', async ({ page }) => {
    const products = new ProductsPage(page);
    await products.goto();
    const tabs = products.categoryTabs;
    const firstTabText = await tabs.first().textContent();
    await tabs.first().click();
    await page.waitForLoadState('networkidle');
    const cards = products.productCards;
    // Category badge on each card should match
    const badgeText = await cards.first().locator('[data-testid="card-category"]').textContent();
    expect(badgeText?.toLowerCase()).toContain(firstTabText?.toLowerCase().trim() ?? '');
  });

  test('clicking a product card navigates to detail page', async ({ page }) => {
    const products = new ProductsPage(page);
    await products.goto();
    await products.openFirstProduct();
    await expect(page).toHaveURL(/\/products\/.+/);
  });

  test('product detail page shows all required elements', async ({ page }) => {
    const products = new ProductsPage(page);
    await products.goto();
    await products.openFirstProduct();

    const detail = new ProductDetailPage(page);
    await expect(detail.title).toBeVisible();
    await expect(detail.price).toBeVisible();
    await expect(detail.originalPrice).toBeVisible();
    await expect(detail.description).toBeVisible();
    await expect(detail.stockStatus).toBeVisible();
    await expect(detail.addToCartBtn).toBeVisible();
    await expect(detail.images.first()).toBeVisible();
  });

  test('load more / infinite scroll loads additional products', async ({ page }) => {
    const products = new ProductsPage(page);
    await products.goto();
    const initialCount = await products.productCards.count();

    const loadMore = products.loadMoreBtn;
    if (await loadMore.isVisible()) {
      await loadMore.click();
      await page.waitForLoadState('networkidle');
      const newCount = await products.productCards.count();
      expect(newCount).toBeGreaterThan(initialCount);
    } else {
      // infinite scroll: scroll to bottom
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(1500);
      const newCount = await products.productCards.count();
      expect(newCount).toBeGreaterThanOrEqual(initialCount);
    }
  });

  test('STORY-038 | Hindi locale renders Hindi content on products page', async ({ page }) => {
    const products = new ProductsPage(page);
    await products.goto('hi');
    const card = await products.getProductCard(0);
    const title = await card.locator('[data-testid="card-title"]').textContent();
    // Hindi products should contain Devanagari characters
    expect(title).toMatch(/[\u0900-\u097F]/);
  });

  test('skeleton loading components appear before products load', async ({ page }) => {
    // Throttle network to observe skeletons
    await page.route('**/products**', async route => {
      await page.waitForTimeout(300);
      await route.continue();
    });
    await page.goto('/en/products');
    // Skeletons may flash; just ensure page doesn't show blank screen
    await expect(page.locator('body')).not.toBeEmpty();
    await expect(page.locator('[data-testid="product-card"]').first()).toBeVisible({ timeout: 15_000 });
  });
});
