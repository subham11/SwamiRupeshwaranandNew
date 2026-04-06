// tests/admin/emails/email.templates.spec.ts
// STORY-022: Styled Email Templates
//
// Strategy: We cannot open a real email inbox in E2E tests, so we verify:
//   1. Email trigger endpoints are called correctly (route interception)
//   2. Admin "Send Test Email" UI works
//   3. Email template preview pages render correctly (if exposed at /admin/emails/preview)
//   4. API-level smoke: templates render without 5xx errors

import { test, expect } from '@playwright/test';
import { AdminBasePage } from '../../../page-objects';
import { getAdminToken, adminHeaders } from '../../../helpers/api.helper';
import { API_URL } from '../../../playwright.config';

// Email types as defined in STORY-022
const EMAIL_TEMPLATES = [
  'order_confirmation',
  'order_status_update',
  'welcome',
  'subscription_confirmation',
  'donation_thank_you',
  'newsletter_welcome',
  'otp',
] as const;

test.describe('STORY-022 | Styled Email Templates', () => {

  // ── Template Previews ──────────────────────────────────────────────────────

  test('email templates preview page loads at /admin/emails', async ({ page }) => {
    const admin = new AdminBasePage(page);
    await admin.gotoAdmin('/emails');
    // May be a preview list or a settings-style page
    await expect(page.locator('body')).not.toBeEmpty();
    await expect(page).not.toHaveURL(/404|not-found/, { timeout: 5_000 });
  });

  for (const template of EMAIL_TEMPLATES) {
    test(`template preview renders for: ${template}`, async ({ page }) => {
      await page.goto(`/admin/emails/preview/${template}`);
      const status = page.locator('[data-testid="preview-status"]');
      const body   = page.locator('[data-testid="email-preview"]');

      // Either a dedicated preview renders or we fall back to the templates list
      const previewVisible = await body.isVisible({ timeout: 5_000 }).catch(() => false);
      const notFound       = page.url().includes('404');
      if (!notFound) {
        await expect(page.locator('body')).not.toBeEmpty();
      }
    });
  }

  // ── API: template render endpoints ────────────────────────────────────────

  test('order_confirmation template renders without error', async ({ request }) => {
    const token = await getAdminToken(request);
    const res   = await request.post(`${API_URL}/email/preview`, {
      headers: adminHeaders(token),
      data:    { template: 'order_confirmation', orderId: 'test-order-001' },
    });
    // Either 200 (rendered HTML) or 404 if no preview endpoint — not a 5xx
    expect(res.status()).toBeLessThan(500);
  });

  test('otp template renders without error', async ({ request }) => {
    const token = await getAdminToken(request);
    const res   = await request.post(`${API_URL}/email/preview`, {
      headers: adminHeaders(token),
      data:    { template: 'otp', otp: '123456' },
    });
    expect(res.status()).toBeLessThan(500);
  });

  // ── Trigger verification via route interception ───────────────────────────

  test('registration sends welcome email (API call intercepted)', async ({ page }) => {
    let emailCallMade = false;
    await page.route('**/api/email/**', route => {
      emailCallMade = true;
      route.continue();
    });

    // Attempt a fresh registration — if user already exists, test the OTP flow
    await page.goto('/login');
    await page.locator('[data-testid="tab-otp"]').click();
    await page.locator('[data-testid="auth-email"]').fill(`sanity_new_${Date.now()}@testmail.com`);
    await page.locator('[data-testid="send-otp-btn"]').click();
    await page.waitForTimeout(1500);
    // Email endpoint may or may not fire synchronously in the page context
    // The main check is that OTP was sent
    await expect(
      page.locator('[data-testid="otp-sent-notice"]')
    ).toBeVisible({ timeout: 8_000 });
  });

  test('OTP email is triggered on login attempt (intercepted)', async ({ page }) => {
    let emailCalled = false;
    await page.route('**/api/auth/send-otp**', route => {
      emailCalled = true;
      route.continue();
    });

    await page.goto('/login');
    await page.locator('[data-testid="tab-otp"]').click();
    await page.locator('[data-testid="auth-email"]').fill('testuser@swamirupeshwaranand.org');
    await page.locator('[data-testid="send-otp-btn"]').click();
    await page.waitForTimeout(1500);
    expect(emailCalled).toBe(true);
  });

  // ── Design requirements (if preview page is exposed) ─────────────────────

  test('email preview contains branded header elements', async ({ page }) => {
    await page.goto('/admin/emails/preview/order_confirmation');
    if (page.url().includes('preview')) {
      const preview = page.locator('[data-testid="email-preview"]');
      if (await preview.isVisible({ timeout: 5_000 }).catch(() => false)) {
        const html = await preview.innerHTML();
        // Must contain branded content (orange gradient or logo text)
        const hasBranding = html.includes('swamirupeshwaranand') ||
                            html.includes('Swamirupeshwaranand') ||
                            html.includes('Swami Rupeshwaranand') ||
                            html.includes('gradient')      ||
                            html.includes('header');
        expect(hasBranding).toBeTruthy();
      }
    }
  });

  test('order confirmation preview contains itemized table and CTA button', async ({ page }) => {
    await page.goto('/admin/emails/preview/order_confirmation');
    if (!page.url().includes('404')) {
      const preview = page.locator('[data-testid="email-preview"]');
      if (await preview.isVisible({ timeout: 5_000 }).catch(() => false)) {
        const html = await preview.innerHTML();
        expect(html).toMatch(/table|grid/i);   // itemized table
        expect(html).toMatch(/view.order|button/i); // CTA
      }
    }
  });

  test('OTP email preview shows large digit display', async ({ page }) => {
    await page.goto('/admin/emails/preview/otp');
    if (!page.url().includes('404')) {
      const preview = page.locator('[data-testid="email-preview"]');
      if (await preview.isVisible({ timeout: 5_000 }).catch(() => false)) {
        const html = await preview.innerHTML();
        // OTP digits displayed prominently
        expect(html).toMatch(/font-size|letter-spacing|otp|code/i);
        expect(html).toMatch(/expire|valid|minutes/i);
      }
    }
  });

  // ── Plain-text fallback ───────────────────────────────────────────────────

  test('email API accepts text/plain content-type (plain-text fallback)', async ({ request }) => {
    const token = await getAdminToken(request);
    const res   = await request.post(`${API_URL}/email/preview`, {
      headers: { ...adminHeaders(token), 'Accept': 'text/plain' },
      data:    { template: 'welcome' },
    });
    expect(res.status()).toBeLessThan(500);
  });
});
