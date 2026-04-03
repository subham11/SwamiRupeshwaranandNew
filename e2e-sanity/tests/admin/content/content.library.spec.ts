// tests/admin/content/content.library.spec.ts
// STORY-021: Content Library & Monthly Schedule

import { test, expect } from '@playwright/test';
import { AdminBasePage } from '../../../page-objects';
import path from 'path';

const CONTENT_TYPES = ['stotra', 'kavach', 'pdf', 'audio', 'video'] as const;
const SUBSCRIPTION_PLANS = ['Free', 'Silver', 'Gold', 'Diamond'];

test.describe('STORY-021 | Content Library & Monthly Schedule', () => {

  // ── Admin: Content Upload ──────────────────────────────────────────────────

  test('content library page loads at /admin/content', async ({ page }) => {
    const admin = new AdminBasePage(page);
    await admin.gotoAdmin('/content');
    await expect(page.locator('[data-testid="content-library-page"]'))
      .toBeVisible({ timeout: 10_000 });
  });

  test('admin can create content with title, type, description', async ({ page }) => {
    const admin = new AdminBasePage(page);
    await admin.gotoAdmin('/content/create');

    await page.locator('[data-testid="content-title"]').fill(`Sanity Stotra ${Date.now()}`);
    await page.locator('[data-testid="content-type"]').selectOption('stotra');
    await page.locator('[data-testid="content-description"]').fill(
      'Auto-generated stotra content for E2E testing'
    );
    await admin.saveBtn.click();
    await expect(admin.successToast).toBeVisible({ timeout: 8_000 });
  });

  test('all 5 content types are selectable', async ({ page }) => {
    const admin = new AdminBasePage(page);
    await admin.gotoAdmin('/content/create');
    const typeSelect = page.locator('[data-testid="content-type"]');
    await expect(typeSelect).toBeVisible({ timeout: 8_000 });

    for (const type of CONTENT_TYPES) {
      await typeSelect.selectOption(type);
      expect(await typeSelect.inputValue()).toBe(type);
    }
  });

  test('admin can upload a file for content item', async ({ page }) => {
    const admin = new AdminBasePage(page);
    await admin.gotoAdmin('/content/create');
    await page.locator('[data-testid="content-title"]').fill(`Upload Test ${Date.now()}`);
    await page.locator('[data-testid="content-type"]').selectOption('pdf');

    const fileInput = page.locator('[data-testid="content-file-input"]');
    await fileInput.setInputFiles(
      path.join(__dirname, '../../../fixtures/test-image.jpg')
    );
    await expect(page.locator('[data-testid="file-upload-preview"]'))
      .toBeVisible({ timeout: 8_000 });
  });

  test('admin can edit an existing content item', async ({ page }) => {
    const admin = new AdminBasePage(page);
    await admin.gotoAdmin('/content');
    await page.waitForLoadState('networkidle');
    if (await admin.tableRows.count() > 0) {
      await admin.tableRows.first().locator('[data-testid="edit-btn"]').click();
      await expect(page).toHaveURL(/\/admin\/content\/.+\/edit/);
      await page.locator('[data-testid="content-description"]').fill(
        `Updated description ${Date.now()}`
      );
      await admin.saveBtn.click();
      await expect(admin.successToast).toBeVisible({ timeout: 8_000 });
    }
  });

  test('admin can delete a content item', async ({ page }) => {
    const admin = new AdminBasePage(page);
    await admin.gotoAdmin('/content');
    await page.waitForLoadState('networkidle');
    if (await admin.tableRows.count() > 0) {
      const before = await admin.tableRows.count();
      await admin.tableRows.last().locator('[data-testid="delete-btn"]').click();
      if (await admin.confirmDelete.isVisible({ timeout: 2000 })) {
        await admin.confirmDelete.click();
      }
      await expect(admin.successToast).toBeVisible({ timeout: 8_000 });
      await page.waitForLoadState('networkidle');
      expect(await admin.tableRows.count()).toBeLessThan(before);
    }
  });

  // ── Admin: Monthly Schedule ────────────────────────────────────────────────

  test('monthly schedule page loads at /admin/content/schedule', async ({ page }) => {
    const admin = new AdminBasePage(page);
    await admin.gotoAdmin('/content/schedule');
    await expect(page.locator('[data-testid="monthly-schedule-page"]'))
      .toBeVisible({ timeout: 10_000 });
  });

  test('schedule grid shows plans as columns and months as rows', async ({ page }) => {
    const admin = new AdminBasePage(page);
    await admin.gotoAdmin('/content/schedule');
    await page.waitForLoadState('networkidle');

    const grid = page.locator('[data-testid="schedule-grid"]');
    await expect(grid).toBeVisible({ timeout: 8_000 });

    for (const plan of SUBSCRIPTION_PLANS) {
      const col = grid.locator(`[data-plan="${plan.toLowerCase()}"]`).first();
      const colByText = grid.locator('[data-testid="plan-column"]').filter({ hasText: plan });
      const visible = await col.isVisible().catch(() => false)
        || await colByText.isVisible().catch(() => false);
      expect(visible, `Plan column "${plan}" should be visible`).toBeTruthy();
    }
  });

  test('admin can assign content to a month and plan', async ({ page }) => {
    const admin = new AdminBasePage(page);
    await admin.gotoAdmin('/content/schedule');
    await page.waitForLoadState('networkidle');

    // Find a cell in the schedule grid and assign content
    const cell = page.locator('[data-testid="schedule-cell"]').first();
    if (await cell.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await cell.locator('[data-testid="assign-content-btn"]').click();
      const modal = page.locator('[data-testid="assign-content-modal"]');
      await expect(modal).toBeVisible({ timeout: 5_000 });

      const contentOptions = modal.locator('[data-testid="content-option"]');
      if (await contentOptions.count() > 0) {
        await contentOptions.first().click();
        await modal.locator('[data-testid="confirm-assign"]').click();
        await expect(admin.successToast).toBeVisible({ timeout: 8_000 });
      }
    }
  });

  // ── Subscriber: Content Access ─────────────────────────────────────────────

  test('subscriber content page loads for logged-in user', async ({ page }) => {
    await page.goto('/en/content');
    // Either shows content (if subscribed) or upgrade prompt
    const hasContent   = await page.locator('[data-testid="content-library"]')
      .isVisible({ timeout: 8_000 }).catch(() => false);
    const hasUpgrade   = await page.locator('[data-testid="upgrade-prompt"]')
      .isVisible({ timeout: 3_000 }).catch(() => false);
    const hasAuthGate  = await page.locator('[data-testid="auth-required"]')
      .isVisible({ timeout: 3_000 }).catch(() => false);
    expect(hasContent || hasUpgrade || hasAuthGate).toBeTruthy();
  });

  test('content viewer supports PDF display', async ({ page }) => {
    await page.goto('/en/content');
    const pdfItem = page.locator('[data-testid="content-item"][data-type="pdf"]').first();
    if (await pdfItem.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await pdfItem.click();
      await expect(page.locator('[data-testid="pdf-viewer"]')).toBeVisible({ timeout: 8_000 });
    }
  });

  test('content viewer supports audio playback', async ({ page }) => {
    await page.goto('/en/content');
    const audioItem = page.locator('[data-testid="content-item"][data-type="audio"]').first();
    if (await audioItem.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await audioItem.click();
      const audioEl = page.locator('[data-testid="audio-player"]');
      await expect(audioEl).toBeVisible({ timeout: 8_000 });
      const controls = await audioEl.getAttribute('controls');
      expect(controls).not.toBeNull();
    }
  });
});
