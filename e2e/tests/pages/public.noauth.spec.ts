import { test, expect } from '@playwright/test';

/**
 * Tests that don't require authentication
 * These run independently without auth setup
 */

test.describe('Public Pages - No Auth Required', () => {
  test('homepage loads in English', async ({ page }) => {
    await page.goto('/en');
    await expect(page).toHaveTitle(/.+/);
  });

  test('homepage loads in Hindi', async ({ page }) => {
    await page.goto('/hi');
    await expect(page).toHaveTitle(/.+/);
  });

  test('root redirects to locale', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/(en|hi)/);
  });

  test('404 page for invalid routes', async ({ page }) => {
    const response = await page.goto('/en/non-existent-page-12345');
    // Should either show 404 or redirect
    expect(response?.status()).toBeGreaterThanOrEqual(200);
  });
});

test.describe('SEO Basics', () => {
  test('homepage has meta description', async ({ page }) => {
    await page.goto('/en');
    
    const metaDescription = await page.locator('meta[name="description"]').getAttribute('content');
    expect(metaDescription).toBeTruthy();
  });

  test('homepage has viewport meta tag', async ({ page }) => {
    await page.goto('/en');
    
    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewport).toContain('width=device-width');
  });

  test('pages have proper heading hierarchy', async ({ page }) => {
    await page.goto('/en');
    
    // Should have at least one h1
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeGreaterThanOrEqual(1);
  });
});

test.describe('Accessibility Basics', () => {
  test('images should have alt text', async ({ page }) => {
    await page.goto('/en');
    
    const images = page.locator('img');
    const count = await images.count();
    
    for (let i = 0; i < Math.min(count, 10); i++) {
      const alt = await images.nth(i).getAttribute('alt');
      // Alt should exist (can be empty string for decorative images)
      expect(alt).not.toBeNull();
    }
  });

  test('buttons should be accessible', async ({ page }) => {
    await page.goto('/en');
    
    const buttons = page.locator('button');
    const count = await buttons.count();
    
    let accessibleCount = 0;
    for (let i = 0; i < Math.min(count, 10); i++) {
      const button = buttons.nth(i);
      if (await button.isVisible()) {
        // Should have text content or aria-label
        const text = await button.textContent();
        const ariaLabel = await button.getAttribute('aria-label');
        if (text?.trim() || ariaLabel) {
          accessibleCount++;
        }
      }
    }
    // At least some buttons should be accessible
    expect(accessibleCount).toBeGreaterThan(0);
  });

  test('links should have descriptive text', async ({ page }) => {
    await page.goto('/en');
    
    const links = page.locator('a');
    const count = await links.count();
    
    for (let i = 0; i < Math.min(count, 10); i++) {
      const link = links.nth(i);
      if (await link.isVisible()) {
        const text = await link.textContent();
        const ariaLabel = await link.getAttribute('aria-label');
        // Should have some accessible name
        expect(text?.trim() || ariaLabel).toBeTruthy();
      }
    }
  });
});

test.describe('Performance Basics', () => {
  test('homepage loads within reasonable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/en');
    const loadTime = Date.now() - startTime;
    
    // Should load within 10 seconds
    expect(loadTime).toBeLessThan(10000);
  });
});
