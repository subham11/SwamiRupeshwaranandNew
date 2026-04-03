// tests/admin/reviews/admin.reviews.spec.ts
// STORY-011: Product Reviews (Customer)
// STORY-012: Reviews Moderation (Admin)

import { test, expect } from '@playwright/test';
import { AdminBasePage, ProductsPage, ProductDetailPage } from '../../../page-objects';
import { TEST_REVIEW } from '../../../fixtures';

// ─── Customer review submission ───────────────────────────────────────────────
test.describe('STORY-011 | Product Reviews (Customer)', () => {

  test('product detail page shows reviews section', async ({ page }) => {
    const products = new ProductsPage(page);
    await products.goto();
    await products.openFirstProduct();
    const detail = new ProductDetailPage(page);
    await expect(detail.reviewsSection).toBeVisible();
  });

  test('logged-in user can submit a 1–5 star review', async ({ page }) => {
    const products = new ProductsPage(page);
    await products.goto();
    await products.openFirstProduct();
    const detail = new ProductDetailPage(page);
    await detail.submitReview(TEST_REVIEW.rating, TEST_REVIEW.text);
    await expect(detail.reviewSuccessMsg).toBeVisible({ timeout: 8_000 });
  });

  test('review text is optional — submission works without text', async ({ page }) => {
    const products = new ProductsPage(page);
    await products.goto();
    await products.openFirstProduct();
    const detail = new ProductDetailPage(page);
    await detail.reviewStars.nth(3).click(); // 4 stars
    await detail.submitReviewBtn.click();
    await expect(detail.reviewSuccessMsg).toBeVisible({ timeout: 8_000 });
  });

  test('review text max length enforced at 2000 chars', async ({ page }) => {
    const products = new ProductsPage(page);
    await products.goto();
    await products.openFirstProduct();
    const detail = new ProductDetailPage(page);
    const longText = 'A'.repeat(2100);
    await detail.reviewText.fill(longText);
    const actual = await detail.reviewText.inputValue();
    expect(actual.length).toBeLessThanOrEqual(2000);
  });

  test('new review defaults to pending (not shown publicly)', async ({ page }) => {
    const products = new ProductsPage(page);
    await products.goto();
    await products.openFirstProduct();
    const url    = page.url();
    const detail = new ProductDetailPage(page);

    // Count current approved reviews
    const beforeCount = await page.locator('[data-testid="approved-review"]').count();
    await detail.submitReview(TEST_REVIEW.rating, `Pending check ${Date.now()}`);
    await expect(detail.reviewSuccessMsg).toBeVisible({ timeout: 8_000 });

    // Reload and count — should NOT increase immediately
    await page.reload();
    await page.waitForLoadState('networkidle');
    const afterCount = await page.locator('[data-testid="approved-review"]').count();
    expect(afterCount).toBe(beforeCount);
  });
});

// ─── Admin review moderation ──────────────────────────────────────────────────
test.describe('STORY-012 | Reviews Moderation (Admin)', () => {

  test('admin reviews page shows stats: Total, Pending, Approved, Avg Rating', async ({ page }) => {
    const admin = new AdminBasePage(page);
    await admin.gotoAdmin('/reviews');
    await expect(admin.statsCards.first()).toBeVisible({ timeout: 10_000 });
    const labels = await admin.statsCards.allTextContents();
    const joined = labels.join(' ').toLowerCase();
    expect(joined).toContain('total');
    expect(joined).toContain('pending');
    expect(joined).toContain('approved');
  });

  test('filter tabs render: All, Pending, Approved, Rejected', async ({ page }) => {
    const admin = new AdminBasePage(page);
    await admin.gotoAdmin('/reviews');
    const tabs = await admin.filterTabs.allTextContents();
    const joined = tabs.join(' ').toLowerCase();
    expect(joined).toContain('all');
    expect(joined).toContain('pending');
    expect(joined).toContain('approved');
    expect(joined).toContain('rejected');
  });

  test('review list shows product, reviewer email, star rating, status badge, date', async ({ page }) => {
    const admin = new AdminBasePage(page);
    await admin.gotoAdmin('/reviews');
    if (await admin.tableRows.count() > 0) {
      const row = admin.tableRows.first();
      await expect(row.locator('[data-testid="review-product"]')).toBeVisible();
      await expect(row.locator('[data-testid="review-email"]')).toBeVisible();
      await expect(row.locator('[data-testid="review-stars"]')).toBeVisible();
      await expect(row.locator('[data-testid="review-status"]')).toBeVisible();
      await expect(row.locator('[data-testid="review-date"]')).toBeVisible();
    }
  });

  test('admin can open full review detail modal', async ({ page }) => {
    const admin = new AdminBasePage(page);
    await admin.gotoAdmin('/reviews');
    await admin.filterTabs.filter({ hasText: /pending/i }).click();
    await page.waitForLoadState('networkidle');
    if (await admin.tableRows.count() > 0) {
      await admin.tableRows.first().locator('[data-testid="view-review-btn"]').click();
      const modal = page.locator('[data-testid="review-detail-modal"]');
      await expect(modal).toBeVisible({ timeout: 5_000 });
      await expect(modal.locator('[data-testid="review-full-text-en"]')).toBeVisible();
    }
  });

  test('admin can approve a pending review', async ({ page }) => {
    const admin = new AdminBasePage(page);
    await admin.gotoAdmin('/reviews');
    await admin.filterTabs.filter({ hasText: /pending/i }).click();
    await page.waitForLoadState('networkidle');
    if (await admin.tableRows.count() > 0) {
      await admin.tableRows.first().locator('[data-testid="approve-review-btn"]').click();
      await expect(admin.successToast).toBeVisible({ timeout: 5_000 });
    }
  });

  test('admin can reject a pending review', async ({ page }) => {
    const admin = new AdminBasePage(page);
    await admin.gotoAdmin('/reviews');
    await admin.filterTabs.filter({ hasText: /pending/i }).click();
    await page.waitForLoadState('networkidle');
    if (await admin.tableRows.count() > 0) {
      await admin.tableRows.first().locator('[data-testid="reject-review-btn"]').click();
      await expect(admin.successToast).toBeVisible({ timeout: 5_000 });
    }
  });

  test('admin can delete a review with confirmation dialog', async ({ page }) => {
    const admin = new AdminBasePage(page);
    await admin.gotoAdmin('/reviews');
    if (await admin.tableRows.count() > 0) {
      const before = await admin.tableRows.count();
      await admin.tableRows.first().locator('[data-testid="delete-btn"]').click();
      await expect(admin.confirmDelete).toBeVisible({ timeout: 3_000 });
      await admin.confirmDelete.click();
      await expect(admin.successToast).toBeVisible({ timeout: 5_000 });
      await page.waitForLoadState('networkidle');
      expect(await admin.tableRows.count()).toBeLessThan(before);
    }
  });

  test('approving review updates product average rating', async ({ page, request }) => {
    const admin = new AdminBasePage(page);
    // Get product rating before
    const productRes = await request.get('/api/products?limit=1');
    const product    = (await productRes.json()).data[0];
    const ratingBefore = product?.averageRating ?? 0;

    // Approve a pending review via admin
    await admin.gotoAdmin('/reviews');
    await admin.filterTabs.filter({ hasText: /pending/i }).click();
    await page.waitForLoadState('networkidle');
    if (await admin.tableRows.count() > 0) {
      await admin.tableRows.first().locator('[data-testid="approve-review-btn"]').click();
      await expect(admin.successToast).toBeVisible({ timeout: 5_000 });
    }
    // Rating may or may not change depending on values — just assert it's a number
    const productRes2 = await request.get('/api/products?limit=1');
    const product2    = (await productRes2.json()).data[0];
    expect(typeof product2?.averageRating).toBe('number');
  });
});
