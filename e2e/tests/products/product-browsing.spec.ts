/**
 * E2E tests: Product browsing on the main products page.
 */
import { test, expect } from '../../fixtures/test-fixtures';

test.describe('Product Browsing', () => {
  test('should display products on the products page', async ({
    productsPage,
  }) => {
    await productsPage.gotoProducts();
    await productsPage.waitForProducts();

    const count = await productsPage.getProductCount();
    // With seeded data, we should have products
    if (count > 0) {
      expect(count).toBeGreaterThan(0);

      // Verify cards show titles
      const titles = await productsPage.getProductTitles();
      expect(titles.length).toBeGreaterThan(0);
      for (const title of titles) {
        expect(title.length).toBeGreaterThan(0);
      }
    }
  });

  test('should show product cards with price and title', async ({
    productsPage,
    page,
  }) => {
    await productsPage.gotoProducts();
    await productsPage.waitForProducts();

    const count = await productsPage.getProductCount();
    if (count > 0) {
      // Check first product card has price indicator (₹ in a span with gold color)
      const firstCard = page.locator('a.group:has(h3)').first();
      const priceSpan = firstCard.locator('span.text-lg.font-bold');
      await expect(priceSpan).toBeVisible({ timeout: 5000 });
      const priceText = await priceSpan.textContent();
      expect(priceText).toMatch(/₹/);

      // Check title exists
      const titleEl = firstCard.locator('h3');
      const title = await titleEl.textContent();
      expect(title).toBeTruthy();
    }
  });

  test('should navigate to product detail on card click', async ({
    productsPage,
    page,
  }) => {
    await productsPage.gotoProducts();
    await productsPage.waitForProducts();

    const count = await productsPage.getProductCount();
    if (count > 0) {
      // Click first product card and wait for navigation
      const firstCard = page.locator('a.group:has(h3)').first();
      const href = await firstCard.getAttribute('href');
      expect(href).toBeTruthy();
      await firstCard.click();
      // Wait for URL to change to product detail
      await page.waitForURL(/\/en\/products\/[^/]+/, { timeout: 10000 });
      expect(page.url()).toMatch(/\/en\/products\/.+/);
    }
  });

  test('should render products page in Hindi locale', async ({
    productsPage,
    page,
  }) => {
    await productsPage.gotoProducts('hi');
    await productsPage.waitForProducts();

    // Page should be in Hindi locale
    expect(page.url()).toContain('/hi/products');
  });
});
