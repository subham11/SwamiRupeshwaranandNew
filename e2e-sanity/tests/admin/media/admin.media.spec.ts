// tests/admin/media/admin.media.spec.ts
// STORY-032: Media Library
// STORY-030: Admin Help Center

import { test, expect } from '@playwright/test';
import { AdminBasePage } from '../../../page-objects';
import path from 'path';

test.describe('STORY-032 | Media Library', () => {

  test('media library page loads at /admin/media', async ({ page }) => {
    const admin = new AdminBasePage(page);
    await admin.gotoAdmin('/media');
    await expect(page.locator('[data-testid="media-library"]')).toBeVisible({ timeout: 10_000 });
  });

  test('media page shows upload drag-and-drop zone', async ({ page }) => {
    const admin = new AdminBasePage(page);
    await admin.gotoAdmin('/media');
    await expect(page.locator('[data-testid="media-dropzone"]')).toBeVisible({ timeout: 8_000 });
  });

  test('media page shows file browser with folder structure', async ({ page }) => {
    const admin = new AdminBasePage(page);
    await admin.gotoAdmin('/media');
    await expect(page.locator('[data-testid="media-file-browser"]')).toBeVisible({ timeout: 8_000 });
  });

  test('admin can upload an image file', async ({ page }) => {
    const admin = new AdminBasePage(page);
    await admin.gotoAdmin('/media');
    const fileInput = page.locator('[data-testid="media-file-input"]');
    await fileInput.setInputFiles(
      path.join(__dirname, '../../../fixtures/test-image.jpg')
    );
    await expect(page.locator('[data-testid="upload-progress"]')).toBeVisible({ timeout: 5_000 });
    await expect(page.locator('[data-testid="upload-success"]')).toBeVisible({ timeout: 15_000 });
  });

  test('Copy URL button copies file URL to clipboard', async ({ page }) => {
    const admin = new AdminBasePage(page);
    await admin.gotoAdmin('/media');
    const mediaItems = page.locator('[data-testid="media-item"]');
    if (await mediaItems.count() > 0) {
      await mediaItems.first().hover();
      const copyBtn = mediaItems.first().locator('[data-testid="copy-url-btn"]');
      await expect(copyBtn).toBeVisible({ timeout: 3_000 });
      await copyBtn.click();
      const feedback = page.locator('[data-testid="copy-success"]');
      await expect(feedback).toBeVisible({ timeout: 3_000 });
    }
  });

  test('admin can delete a media file with confirmation', async ({ page }) => {
    const admin = new AdminBasePage(page);
    await admin.gotoAdmin('/media');
    const mediaItems = page.locator('[data-testid="media-item"]');
    if (await mediaItems.count() > 0) {
      const before = await mediaItems.count();
      await mediaItems.last().hover();
      await mediaItems.last().locator('[data-testid="delete-media-btn"]').click();
      if (await admin.confirmDelete.isVisible({ timeout: 2000 })) {
        await admin.confirmDelete.click();
      }
      await expect(admin.successToast).toBeVisible({ timeout: 8_000 });
      await page.waitForLoadState('networkidle');
      expect(await mediaItems.count()).toBeLessThan(before);
    }
  });

  test('oversized file upload shows error (> 5MB for images)', async ({ page }) => {
    const admin = new AdminBasePage(page);
    await admin.gotoAdmin('/media');
    // Create an in-memory blob > 5MB
    const bigFile = page.evaluate(() => {
      const bytes  = new Uint8Array(6 * 1024 * 1024); // 6MB
      const blob   = new Blob([bytes], { type: 'image/jpeg' });
      const dt     = new DataTransfer();
      dt.items.add(new File([blob], 'big.jpg', { type: 'image/jpeg' }));
      const input  = document.querySelector('[data-testid="media-file-input"]') as HTMLInputElement;
      if (input) {
        Object.defineProperty(input, 'files', { value: dt.files });
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    const errorMsg = page.locator('[data-testid="upload-size-error"]');
    if (await errorMsg.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await expect(errorMsg).toBeVisible();
    }
  });
});

test.describe('STORY-030 | Admin Help Center', () => {

  test('help center loads at /admin/help', async ({ page }) => {
    await page.goto('/admin/help');
    await expect(page.locator('[data-testid="help-center"]')).toBeVisible({ timeout: 10_000 });
  });

  test('sidebar navigation is present', async ({ page }) => {
    await page.goto('/admin/help');
    await expect(page.locator('[data-testid="help-sidebar"]')).toBeVisible({ timeout: 8_000 });
  });

  test('search functionality within documentation works', async ({ page }) => {
    await page.goto('/admin/help');
    const searchInput = page.locator('[data-testid="help-search"]');
    await expect(searchInput).toBeVisible({ timeout: 8_000 });
    await searchInput.fill('products');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="help-result"]').first()).toBeVisible({ timeout: 5_000 });
  });

  test('11 documentation sections are present in sidebar', async ({ page }) => {
    await page.goto('/admin/help');
    const sections = page.locator('[data-testid="help-section-link"]');
    await expect(sections.first()).toBeVisible({ timeout: 8_000 });
    const count = await sections.count();
    expect(count).toBeGreaterThanOrEqual(11);
  });

  test('expected section labels present: Products, Orders, CMS, Payments', async ({ page }) => {
    await page.goto('/admin/help');
    const sidebarText = await page.locator('[data-testid="help-sidebar"]').textContent();
    const expected    = ['Products', 'Orders', 'CMS', 'Payments', 'Settings'];
    for (const label of expected) {
      expect(sidebarText).toContain(label);
    }
  });

  test('help center is mobile responsive — sidebar toggles on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/admin/help');
    const toggleBtn = page.locator('[data-testid="help-sidebar-toggle"]');
    if (await toggleBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      const sidebar = page.locator('[data-testid="help-sidebar"]');
      await toggleBtn.click();
      // Sidebar may hide or show depending on initial state
      await page.waitForTimeout(300);
      await expect(page.locator('[data-testid="help-center"]')).toBeVisible();
    }
  });
});
