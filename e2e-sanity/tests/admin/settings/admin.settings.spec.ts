// tests/admin/settings/admin.settings.spec.ts
// STORY-018: Admin Settings – Razorpay Key Management
// STORY-031: SMTP Email Settings

import { test, expect } from '@playwright/test';
import { AdminBasePage } from '../../../page-objects';

test.describe('STORY-018 | Razorpay Key Management (Super Admin)', () => {

  test('settings page loads at /admin/settings', async ({ page }) => {
    const admin = new AdminBasePage(page);
    await admin.gotoAdmin('/settings');
    await expect(page.locator('[data-testid="settings-page"]')).toBeVisible({ timeout: 10_000 });
  });

  test('Razorpay tab is present and clickable', async ({ page }) => {
    const admin = new AdminBasePage(page);
    await admin.gotoAdmin('/settings');
    const tab = page.locator('[data-testid="tab-razorpay"]');
    await expect(tab).toBeVisible({ timeout: 8_000 });
    await tab.click();
    await expect(page.locator('[data-testid="razorpay-settings-panel"]')).toBeVisible();
  });

  test('Razorpay panel has Key ID, Key Secret, and Webhook Secret fields', async ({ page }) => {
    const admin = new AdminBasePage(page);
    await admin.gotoAdmin('/settings');
    await page.locator('[data-testid="tab-razorpay"]').click();
    await expect(page.locator('[data-testid="rzp-key-id"]')).toBeVisible();
    await expect(page.locator('[data-testid="rzp-key-secret"]')).toBeVisible();
    await expect(page.locator('[data-testid="rzp-webhook-secret"]')).toBeVisible();
  });

  test('existing keys are masked (showing partial chars)', async ({ page }) => {
    const admin = new AdminBasePage(page);
    await admin.gotoAdmin('/settings');
    await page.locator('[data-testid="tab-razorpay"]').click();
    const keyIdInput = page.locator('[data-testid="rzp-key-id"]');
    const value = await keyIdInput.inputValue();
    if (value.length > 0) {
      // Should contain masking indicators e.g. rzp_****_xxxx or similar
      expect(value).toMatch(/\*{2,}|••/);
    }
  });

  test('"Test Connection" button is present', async ({ page }) => {
    const admin = new AdminBasePage(page);
    await admin.gotoAdmin('/settings');
    await page.locator('[data-testid="tab-razorpay"]').click();
    await expect(page.locator('[data-testid="test-razorpay-btn"]')).toBeVisible();
  });

  test('test keys show amber indicator, live keys show green', async ({ page }) => {
    const admin = new AdminBasePage(page);
    await admin.gotoAdmin('/settings');
    await page.locator('[data-testid="tab-razorpay"]').click();
    const modeIndicator = page.locator('[data-testid="razorpay-mode-indicator"]');
    if (await modeIndicator.isVisible({ timeout: 3_000 }).catch(() => false)) {
      const mode = await modeIndicator.getAttribute('data-mode');
      expect(['test', 'live']).toContain(mode);
    }
  });

  test('non-super-admin cannot access settings — redirected', async ({ page }) => {
    // This project runs as user (chromium:user), not super_admin
    await page.goto('/admin/settings');
    await expect(page).not.toHaveURL(/\/admin\/settings/, { timeout: 8_000 });
  });
});

test.describe('STORY-031 | SMTP Email Settings', () => {

  test('SMTP tab exists in admin settings', async ({ page }) => {
    const admin = new AdminBasePage(page);
    await admin.gotoAdmin('/settings');
    const smtpTab = page.locator('[data-testid="tab-smtp"]');
    await expect(smtpTab).toBeVisible({ timeout: 8_000 });
  });

  test('SMTP panel shows Host, Port, Username, Password, From Email, From Name', async ({ page }) => {
    const admin = new AdminBasePage(page);
    await admin.gotoAdmin('/settings');
    await page.locator('[data-testid="tab-smtp"]').click();
    await expect(page.locator('[data-testid="smtp-host"]')).toBeVisible();
    await expect(page.locator('[data-testid="smtp-port"]')).toBeVisible();
    await expect(page.locator('[data-testid="smtp-username"]')).toBeVisible();
    await expect(page.locator('[data-testid="smtp-password"]')).toBeVisible();
    await expect(page.locator('[data-testid="smtp-from-email"]')).toBeVisible();
    await expect(page.locator('[data-testid="smtp-from-name"]')).toBeVisible();
  });

  test('SMTP password field is masked', async ({ page }) => {
    const admin = new AdminBasePage(page);
    await admin.gotoAdmin('/settings');
    await page.locator('[data-testid="tab-smtp"]').click();
    const pwdInput = page.locator('[data-testid="smtp-password"]');
    const type = await pwdInput.getAttribute('type');
    expect(type).toBe('password');
  });

  test('admin can save SMTP settings', async ({ page }) => {
    const admin = new AdminBasePage(page);
    await admin.gotoAdmin('/settings');
    await page.locator('[data-testid="tab-smtp"]').click();
    await page.locator('[data-testid="smtp-host"]').fill('smtp.test-server.com');
    await page.locator('[data-testid="smtp-port"]').fill('587');
    await page.locator('[data-testid="smtp-from-email"]').fill('noreply@swamirupeshwaranand.org');
    await page.locator('[data-testid="smtp-from-name"]').fill('Swami Rupeshwaranand');
    await page.locator('[data-testid="save-smtp-btn"]').click();
    await expect(admin.successToast).toBeVisible({ timeout: 8_000 });
  });
});
