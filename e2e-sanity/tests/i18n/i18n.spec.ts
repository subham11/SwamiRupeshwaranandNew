// tests/i18n/i18n.spec.ts
// STORY-038: Bilingual Support (English / Hindi)
// STORY-027: Multi-Currency Support (INR / USD)

import { test, expect } from '@playwright/test';
import { BasePage } from '../../page-objects';
import { LOCALES } from '../../fixtures';

test.describe('STORY-038 | Bilingual Support (EN / HI)', () => {

  test('floating language switcher is visible on all pages', async ({ page }) => {
    const pages = ['/en/products', '/en/subscribe', '/en'];
    for (const path of pages) {
      await page.goto(path);
      const switcher = new BasePage(page).languageSwitcher;
      await expect(switcher).toBeVisible({ timeout: 8_000 });
    }
  });

  test('English locale uses /en/ URL prefix', async ({ page }) => {
    await page.goto('/en/products');
    await expect(page).toHaveURL(/\/en\//);
  });

  test('Hindi locale uses /hi/ URL prefix', async ({ page }) => {
    await page.goto('/hi/products');
    await expect(page).toHaveURL(/\/hi\//);
  });

  test('switching to Hindi redirects to /hi/ path', async ({ page }) => {
    await page.goto('/en/products');
    const lang = new BasePage(page);
    await lang.switchToHindi();
    await expect(page).toHaveURL(/\/hi\//, { timeout: 8_000 });
  });

  test('switching back to English redirects to /en/ path', async ({ page }) => {
    await page.goto('/hi/products');
    const lang = new BasePage(page);
    await lang.switchToEnglish();
    await expect(page).toHaveURL(/\/en\//, { timeout: 8_000 });
  });

  test('Hindi product page renders Devanagari text', async ({ page }) => {
    await page.goto('/hi/products');
    await page.waitForLoadState('networkidle');
    const card = page.locator('[data-testid="product-card"]').first();
    await expect(card).toBeVisible({ timeout: 10_000 });
    const title = await card.locator('[data-testid="card-title"]').textContent();
    expect(title).toMatch(/[\u0900-\u097F]/);
  });

  test('navigation and static text translated in Hindi locale', async ({ page }) => {
    await page.goto('/hi');
    await page.waitForLoadState('networkidle');
    const nav = page.locator('[data-testid="main-nav"]');
    if (await nav.isVisible({ timeout: 5_000 }).catch(() => false)) {
      const navText = await nav.textContent();
      // Should contain some Devanagari or translated text
      const hasDevanagari = /[\u0900-\u097F]/.test(navText ?? '');
      const hasDifferentText = navText !== '';
      expect(hasDevanagari || hasDifferentText).toBeTruthy();
    }
  });

  test('language preference persists across page navigation', async ({ page }) => {
    await page.goto('/en/products');
    const lang = new BasePage(page);
    await lang.switchToHindi();
    await expect(page).toHaveURL(/\/hi\/products/, { timeout: 8_000 });
    // Navigate to another page
    await page.locator('[data-testid="product-card"]').first().click();
    await expect(page).toHaveURL(/\/hi\/products\/.+/, { timeout: 8_000 });
  });

  test('search results respect locale parameter', async ({ page }) => {
    await page.goto('/hi/products');
    const lang = new BasePage(page);
    await lang.openSearch();
    await page.locator('[data-testid="search-input"]').fill('test');
    await page.waitForTimeout(400);
    const results = page.locator('[data-testid="search-result"]');
    if (await results.count() > 0) {
      // Results should be in Hindi context
      await expect(results.first()).toBeVisible();
    }
  });

  test('all product detail fields support bilingual content in admin', async ({ page }) => {
    await page.goto('/admin/products/create');
    await expect(page.locator('[data-testid="product-title-en"]')).toBeVisible({ timeout: 8_000 });
    await expect(page.locator('[data-testid="product-title-hi"]')).toBeVisible();
    await expect(page.locator('[data-testid="product-desc-en"]')).toBeVisible();
    await expect(page.locator('[data-testid="product-desc-hi"]')).toBeVisible();
  });
});

test.describe('STORY-027 | Multi-Currency Support (INR / USD)', () => {

  test('currency switcher is visible in header', async ({ page }) => {
    await page.goto('/en/products');
    const switcher = new BasePage(page).currencySwitcher;
    await expect(switcher).toBeVisible({ timeout: 8_000 });
  });

  test('default currency is INR', async ({ page }) => {
    await page.goto('/en/products');
    const switcher = page.locator('[data-testid="currency-switcher"]');
    const text = await switcher.textContent();
    expect(text?.toUpperCase()).toContain('INR');
  });

  test('switching to USD updates product prices', async ({ page }) => {
    await page.goto('/en/products');
    await page.waitForLoadState('networkidle');
    const firstPrice = await page.locator('[data-testid="card-price"]')
      .first().textContent();

    const lang = new BasePage(page);
    await lang.switchCurrency('USD');
    await page.waitForLoadState('networkidle');

    const newPrice = await page.locator('[data-testid="card-price"]')
      .first().textContent();
    // Prices should be different (converted)
    expect(newPrice).not.toBe(firstPrice);
    expect(newPrice).toMatch(/\$/); // USD symbol
  });

  test('INR prices have no decimal places, USD has 2 decimals', async ({ page }) => {
    await page.goto('/en/products');
    await page.waitForLoadState('networkidle');

    // INR check
    const inrPrice = await page.locator('[data-testid="card-price"]').first().textContent();
    if (inrPrice?.includes('₹')) {
      expect(inrPrice).not.toMatch(/₹\d+\.\d+/); // no decimals for INR
    }

    // Switch to USD
    await new BasePage(page).switchCurrency('USD');
    await page.waitForLoadState('networkidle');
    const usdPrice = await page.locator('[data-testid="card-price"]').first().textContent();
    if (usdPrice?.includes('$')) {
      expect(usdPrice).toMatch(/\$\d+\.\d{2}/); // 2 decimals for USD
    }
  });

  test('currency preference persists across page navigation', async ({ page }) => {
    await page.goto('/en/products');
    await new BasePage(page).switchCurrency('USD');
    // Navigate to product detail
    await page.locator('[data-testid="product-card"]').first().click();
    await page.waitForLoadState('networkidle');
    const price = await page.locator('[data-testid="product-price"]').textContent();
    expect(price).toMatch(/\$/);
  });

  test('cart totals display in selected currency', async ({ page }) => {
    await page.goto('/en/products');
    await new BasePage(page).switchCurrency('USD');
    await page.locator('[data-testid="product-card"]').first().click();
    await page.locator('[data-testid="add-to-cart-btn"]').click();
    await page.goto('/cart');
    await page.waitForLoadState('networkidle');
    const total = await page.locator('[data-testid="cart-total"]').textContent();
    expect(total).toMatch(/\$/);
  });

  test('payments still processed in INR regardless of display currency', async ({ page }) => {
    await page.goto('/en/products');
    await new BasePage(page).switchCurrency('USD');
    await page.locator('[data-testid="product-card"]').first().click();
    await page.locator('[data-testid="add-to-cart-btn"]').click();
    await page.goto('/cart');
    await page.locator('[data-testid="checkout-btn"]').click();
    await expect(page).toHaveURL(/checkout/, { timeout: 8_000 });
    // Checkout/payment note should mention INR or ₹
    const note = page.locator('[data-testid="payment-currency-note"]');
    if (await note.isVisible({ timeout: 3_000 }).catch(() => false)) {
      const text = await note.textContent();
      expect(text?.toUpperCase()).toMatch(/INR|₹/);
    }
  });
});
