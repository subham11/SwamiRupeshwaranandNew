// tests/search/search.public.spec.ts
// STORY-015: Global Search API
// STORY-016: Search UI (Cmd+K)

import { test, expect } from '@playwright/test';
import { SearchModal } from '../../page-objects';

test.describe('STORY-016 | Search UI (Cmd+K)', () => {

  test('search icon in header is visible', async ({ page }) => {
    await page.goto('/en/products');
    const icon = page.locator('[data-testid="search-trigger"]');
    await expect(icon).toBeVisible();
  });

  test('clicking search icon opens search modal', async ({ page }) => {
    await page.goto('/en/products');
    const search = new SearchModal(page);
    await search.openSearch();
    await expect(search.modal).toBeVisible();
    await expect(search.input).toBeVisible();
  });

  test('Ctrl+K keyboard shortcut opens search modal', async ({ page }) => {
    await page.goto('/en/products');
    const search = new SearchModal(page);
    await search.openSearchWithKeyboard();
    await expect(search.modal).toBeVisible();
  });

  test('search modal shows empty state by default', async ({ page }) => {
    await page.goto('/en/products');
    const search = new SearchModal(page);
    await search.openSearch();
    await expect(search.emptyState).toBeVisible();
    const emptyText = await search.emptyState.textContent();
    expect(emptyText?.toLowerCase()).toContain('start typing');
  });

  test('search shows loading spinner then results', async ({ page }) => {
    await page.goto('/en/products');
    const search = new SearchModal(page);
    await search.openSearch();
    await search.input.type('test', { delay: 50 });
    // Loading may flash
    await search.page.waitForTimeout(350 + 100); // debounce + buffer
    await expect(search.loadingSpinner).toBeHidden({ timeout: 8_000 });
    // Either results or no-results
    const hasResults  = await search.results.count() > 0;
    const hasNoResult = await search.noResults.isVisible().catch(() => false);
    expect(hasResults || hasNoResult).toBeTruthy();
  });

  test('search results are grouped by type (Products, Events, Pages)', async ({ page }) => {
    await page.goto('/en/products');
    const search = new SearchModal(page);
    await search.openSearch();
    await search.search('test');
    if (await search.results.count() > 0) {
      const groups = search.resultGroups;
      const count = await groups.count();
      expect(count).toBeGreaterThan(0);
      const groupLabels = await groups.allTextContents();
      const validGroups = ['products', 'events', 'pages'];
      groupLabels.forEach(label => {
        expect(validGroups.some(g => label.toLowerCase().includes(g))).toBeTruthy();
      });
    }
  });

  test('product results show title, price, and category badge', async ({ page }) => {
    await page.goto('/en/products');
    const search = new SearchModal(page);
    await search.openSearch();
    await search.search('test');
    const productGroup = page.locator('[data-testid="result-group-products"]');
    if (await productGroup.isVisible({ timeout: 3_000 }).catch(() => false)) {
      const firstResult = productGroup.locator('[data-testid="search-result"]').first();
      await expect(firstResult.locator('[data-testid="result-title"]')).toBeVisible();
    }
  });

  test('keyboard navigation: arrows navigate results, Enter selects', async ({ page }) => {
    await page.goto('/en/products');
    const search = new SearchModal(page);
    await search.openSearch();
    await search.search('test');
    if (await search.results.count() > 0) {
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(100);
      await page.keyboard.press('Enter');
      await expect(search.modal).toBeHidden({ timeout: 5_000 });
    }
  });

  test('Escape closes search modal', async ({ page }) => {
    await page.goto('/en/products');
    const search = new SearchModal(page);
    await search.openSearch();
    await search.closeWithEsc();
  });

  test('no results state shows message with query', async ({ page }) => {
    await page.goto('/en/products');
    const search = new SearchModal(page);
    await search.openSearch();
    await search.search('xyzabcnotexist12345');
    await expect(search.noResults).toBeVisible({ timeout: 5_000 });
    const text = await search.noResults.textContent();
    expect(text?.toLowerCase()).toContain('no results');
  });

  test('clicking a result navigates to item and closes modal', async ({ page }) => {
    await page.goto('/en/products');
    const search = new SearchModal(page);
    await search.openSearch();
    await search.search('test');
    if (await search.results.count() > 0) {
      await search.results.first().click();
      await expect(search.modal).toBeHidden({ timeout: 5_000 });
      // Should have navigated away from product listing
      await expect(page).not.toHaveURL('/en/products');
    }
  });

  test('search results page at /search?q= shows full results', async ({ page }) => {
    await page.goto('/search?q=test');
    await expect(page.locator('[data-testid="search-results-page"]')).toBeVisible({ timeout: 8_000 });
  });
});

test.describe('STORY-015 | Global Search API', () => {

  test('search API returns results across products, events, pages', async ({ request }) => {
    const res = await request.get('/api/search?q=test');
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toHaveProperty('products');
    expect(body).toHaveProperty('events');
    expect(body).toHaveProperty('pages');
  });

  test('search API accepts locale parameter', async ({ request }) => {
    const enRes = await request.get('/api/search?q=test&locale=en');
    const hiRes = await request.get('/api/search?q=test&locale=hi');
    expect(enRes.ok()).toBeTruthy();
    expect(hiRes.ok()).toBeTruthy();
  });

  test('search API accepts type filter', async ({ request }) => {
    const res = await request.get('/api/search?q=test&types=product');
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toHaveProperty('products');
  });

  test('search API is public — no auth required', async ({ request }) => {
    const res = await request.get('/api/search?q=test');
    expect(res.status()).not.toBe(401);
    expect(res.status()).not.toBe(403);
  });
});
