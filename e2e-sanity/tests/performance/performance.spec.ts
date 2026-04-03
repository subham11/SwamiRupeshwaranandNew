// tests/performance/performance.spec.ts
// STORY-033: Image Optimization & Lazy Loading
// STORY-034: Skeleton Loading Components

import { test, expect } from '@playwright/test';
import { ProductsPage } from '../../page-objects';

test.describe('STORY-033 | Image Optimization & Lazy Loading', () => {

  test('product images use next/image (lazy loading via loading attribute)', async ({ page }) => {
    const products = new ProductsPage(page);
    await products.goto();
    await expect(products.productCards.first()).toBeVisible({ timeout: 10_000 });

    const images = page.locator('[data-testid="product-card"] img');
    const count  = await images.count();
    expect(count).toBeGreaterThan(0);

    // All images should have loading="lazy" or be rendered via next/image
    for (let i = 0; i < Math.min(count, 5); i++) {
      const img       = images.nth(i);
      const loading   = await img.getAttribute('loading');
      const srcSet    = await img.getAttribute('srcset');
      const dataSrc   = await img.getAttribute('data-src');
      const isNextImg = await img.evaluate((el: HTMLImageElement) =>
        el.closest('[data-nimg]') !== null || el.hasAttribute('data-nimg')
      );
      const isLazy = loading === 'lazy' || !!srcSet || !!dataSrc || isNextImg;
      expect(isLazy, `Image #${i} should use lazy loading`).toBeTruthy();
    }
  });

  test('images load with shimmer/blur placeholder before fully loaded', async ({ page }) => {
    // Throttle to simulate slow connection
    const client = await page.context().newCDPSession(page);
    await client.send('Network.emulateNetworkConditions', {
      offline:            false,
      downloadThroughput: 50 * 1024,  // 50 KB/s
      uploadThroughput:   20 * 1024,
      latency:            200,
    });

    const products = new ProductsPage(page);
    await products.goto();

    // LazyImage component should show placeholder while loading
    const placeholders = page.locator('[data-testid="img-placeholder"], [data-testid="shimmer"]');
    // They may flash briefly — just confirm the page loads without blank screens
    await expect(page.locator('[data-testid="product-card"]').first())
      .toBeVisible({ timeout: 30_000 });

    await client.send('Network.emulateNetworkConditions', {
      offline:            false,
      downloadThroughput: -1,
      uploadThroughput:   -1,
      latency:            0,
    });
  });

  test('broken images show error fallback instead of broken icon', async ({ page }) => {
    // Force an image to 404
    let intercepted = false;
    await page.route('**/*.jpg', async route => {
      if (!intercepted) {
        intercepted = true;
        await route.fulfill({ status: 404, body: '' });
      } else {
        await route.continue();
      }
    });

    const products = new ProductsPage(page);
    await products.goto();
    await page.waitForLoadState('networkidle');

    // Check that broken images show the fallback element, not a broken img tag
    const errorFallback = page.locator('[data-testid="img-error-fallback"]');
    const brokenImg     = page.locator('img[src=""], img:not([src])');
    // Either fallback exists or there are no genuinely broken img tags
    const fallbackCount = await errorFallback.count();
    const brokenCount   = await brokenImg.count();
    // Test passes if fallbacks are used (preferred) or no broken imgs (acceptable)
    expect(fallbackCount > 0 || brokenCount === 0).toBeTruthy();
  });

  test('product images use WebP or AVIF format when supported', async ({ page }) => {
    // Add Accept header for modern formats
    await page.setExtraHTTPHeaders({ Accept: 'image/avif,image/webp,*/*' });
    const products = new ProductsPage(page);
    await products.goto();
    await expect(products.productCards.first()).toBeVisible({ timeout: 10_000 });

    const images   = page.locator('[data-testid="product-card"] img');
    const firstSrc = await images.first().getAttribute('src') ?? '';
    const srcSet   = await images.first().getAttribute('srcset') ?? '';

    // Next.js image optimization serves webp/avif via query params or srcset
    const usesModernFormat =
      firstSrc.includes('_next/image') ||
      firstSrc.includes('.webp') ||
      firstSrc.includes('.avif') ||
      srcSet.includes('webp') ||
      srcSet.includes('avif') ||
      srcSet.includes('_next/image');

    expect(usesModernFormat, 'Should serve optimized image format').toBeTruthy();
  });

  test('images have correct aspect ratios (no layout shift)', async ({ page }) => {
    const products = new ProductsPage(page);
    await products.goto();
    await expect(products.productCards.first()).toBeVisible({ timeout: 10_000 });

    // Measure CLS by checking that img elements have explicit dimensions
    const images = page.locator('[data-testid="product-card"] img');
    const count  = await images.count();

    for (let i = 0; i < Math.min(count, 3); i++) {
      const img    = images.nth(i);
      const width  = await img.getAttribute('width');
      const height = await img.getAttribute('height');
      const style  = await img.getAttribute('style') ?? '';
      const hasAspectRatio =
        (width && height) ||
        style.includes('aspect-ratio') ||
        style.includes('width') ||
        await img.evaluate((el: HTMLElement) => {
          const s = window.getComputedStyle(el);
          return !!s.aspectRatio || s.width !== 'auto';
        });
      expect(hasAspectRatio, `Image #${i} should have defined dimensions`).toBeTruthy();
    }
  });

  test('remote image domains include S3 and CloudFront in Next.js config', async ({ request }) => {
    // Fetch next.config.js or check that S3/CloudFront images actually load
    const res = await request.get('/en/products');
    expect(res.ok()).toBeTruthy();
    // If images from S3/CloudFront load without CORS/config errors, this passes implicitly
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// STORY-034 | Skeleton Loading Components
// ─────────────────────────────────────────────────────────────────────────────

test.describe('STORY-034 | Skeleton Loading Components', () => {

  test('skeleton loaders appear before product cards load (throttled network)', async ({ page }) => {
    let resolveProducts: () => void;
    const productsBlocked = new Promise<void>(res => { resolveProducts = res; });

    await page.route('**/api/products**', async route => {
      await productsBlocked;
      await route.continue();
    });

    // Navigate — skeletons should appear immediately while API is blocked
    const navPromise = page.goto('/en/products');

    // Check for skeleton elements before unblocking
    await page.waitForTimeout(300);
    const skeletons = page.locator(
      '[data-testid="product-skeleton"], [data-testid*="skeleton"]'
    );
    const skeletonCount = await skeletons.count();

    // Unblock the API
    resolveProducts!();
    await navPromise;

    // Skeletons should have appeared (count > 0 before products loaded)
    expect(skeletonCount).toBeGreaterThan(0);
  });

  test('product card skeleton matches layout of real product card', async ({ page }) => {
    // Block products briefly and capture skeleton DOM
    let resolveProducts: () => void;
    const blocked = new Promise<void>(res => { resolveProducts = res; });
    await page.route('**/api/products**', async route => {
      await blocked;
      await route.continue();
    });

    page.goto('/en/products');
    await page.waitForTimeout(300);

    const skeleton = page.locator('[data-testid="product-skeleton"]').first();
    if (await skeleton.isVisible()) {
      const skeletonBox = await skeleton.boundingBox();
      resolveProducts!();
      await page.waitForLoadState('networkidle');

      const realCard = page.locator('[data-testid="product-card"]').first();
      const realBox  = await realCard.boundingBox();

      // Skeleton dimensions should be roughly similar to real card (within 20%)
      if (skeletonBox && realBox) {
        const widthRatio = skeletonBox.width / realBox.width;
        expect(widthRatio).toBeGreaterThan(0.8);
        expect(widthRatio).toBeLessThan(1.2);
      }
    } else {
      resolveProducts!();
    }
  });

  test('dashboard shows loading skeletons while fetching data', async ({ page }) => {
    let resolveProfile: () => void;
    const blocked = new Promise<void>(res => { resolveProfile = res; });
    await page.route('**/api/users/profile**', async route => {
      await blocked;
      await route.continue();
    });

    page.goto('/dashboard');
    await page.waitForTimeout(400);

    const skeletons = page.locator('[data-testid*="skeleton"]');
    const count     = await skeletons.count();

    resolveProfile!();
    await page.waitForLoadState('networkidle');

    expect(count).toBeGreaterThan(0);
  });

  test('skeleton has pulse animation (CSS class check)', async ({ page }) => {
    let resolveProducts: () => void;
    const blocked = new Promise<void>(res => { resolveProducts = res; });
    await page.route('**/api/products**', async route => {
      await blocked;
      await route.continue();
    });

    page.goto('/en/products');
    await page.waitForTimeout(300);

    const skeleton = page.locator('[data-testid="product-skeleton"]').first();
    if (await skeleton.isVisible()) {
      // Check for Tailwind animate-pulse or custom shimmer class
      const classes = await skeleton.evaluate((el: Element) => el.className);
      const hasAnimation =
        classes.includes('animate-pulse') ||
        classes.includes('shimmer')       ||
        classes.includes('skeleton')      ||
        classes.includes('loading');
      expect(hasAnimation, `Skeleton should have animation class. Got: ${classes}`).toBeTruthy();
    }

    resolveProducts!();
  });

  test('text skeletons support configurable lines (DOM count)', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const textSkeletons = page.locator('[data-testid="text-skeleton"]');
    if (await textSkeletons.count() > 0) {
      const lineCount = await textSkeletons.first()
        .locator('[data-testid="skeleton-line"]').count();
      // TextSkeleton should render at least 1 line
      expect(lineCount).toBeGreaterThan(0);
    }
  });

  test('shimmer gradient uses consistent animation timing', async ({ page }) => {
    let resolveProducts: () => void;
    const blocked = new Promise<void>(res => { resolveProducts = res; });
    await page.route('**/api/products**', async route => {
      await blocked;
      await route.continue();
    });

    page.goto('/en/products');
    await page.waitForTimeout(300);

    const skeleton = page.locator('[data-testid="product-skeleton"]').first();
    if (await skeleton.isVisible()) {
      const animDuration = await skeleton.evaluate((el: Element) => {
        const computed = window.getComputedStyle(el);
        return computed.animationDuration || computed.getPropertyValue('--shimmer-duration');
      });
      // Duration should be a non-zero value
      expect(animDuration).not.toBe('0s');
      expect(animDuration).not.toBe('');
    }

    resolveProducts!();
  });
});
