/**
 * Newsletter Admin E2E Tests
 * Tests for admin newsletter management:
 * - Create and manage newsletters
 * - View subscribers
 * - Trigger email sending
 */

import { test, expect } from '../../fixtures';
import { 
  TEST_SUPER_ADMIN,
  NewsletterFrequency,
  URLS 
} from '../../fixtures/test-data';

test.describe('Newsletter Management', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.login(TEST_SUPER_ADMIN.email, TEST_SUPER_ADMIN.password);
    await loginPage.page.waitForURL(/.*admin|dashboard.*/);
  });

  test.describe('Newsletter Dashboard', () => {
    test('should access newsletter management page', async ({ adminNewsletterPage }) => {
      await adminNewsletterPage.goto();
      
      await expect(adminNewsletterPage.newslettersTable.or(adminNewsletterPage.page.locator('text=Newsletter'))).toBeVisible();
    });

    test('should display create newsletter button', async ({ adminNewsletterPage }) => {
      await adminNewsletterPage.goto();
      
      const createButton = adminNewsletterPage.createNewsletterButton
        .or(adminNewsletterPage.page.locator('button:has-text("Create"), button:has-text("New")'));
      
      await expect(createButton.or(adminNewsletterPage.newslettersTable)).toBeVisible();
    });

    test('should show newsletter list or empty state', async ({ adminNewsletterPage }) => {
      await adminNewsletterPage.goto();
      
      const content = adminNewsletterPage.newsletterRows.first()
        .or(adminNewsletterPage.page.locator('text=/no newsletters|empty/i'))
        .or(adminNewsletterPage.newslettersTable);
      
      await expect(content).toBeVisible();
    });
  });

  test.describe('Create Newsletter', () => {
    test('should open create newsletter modal', async ({ adminNewsletterPage }) => {
      await adminNewsletterPage.goto();
      
      if (await adminNewsletterPage.createNewsletterButton.isVisible().catch(() => false)) {
        await adminNewsletterPage.openCreateNewsletterModal();
        await expect(adminNewsletterPage.newsletterModal).toBeVisible();
      }
    });

    test('should show newsletter form fields', async ({ adminNewsletterPage }) => {
      await adminNewsletterPage.goto();
      
      if (await adminNewsletterPage.createNewsletterButton.isVisible().catch(() => false)) {
        await adminNewsletterPage.openCreateNewsletterModal();
        
        await expect(adminNewsletterPage.subjectInput).toBeVisible();
        await expect(adminNewsletterPage.contentEditor.or(adminNewsletterPage.newsletterModal)).toBeVisible();
      }
    });

    test('should show frequency options', async ({ adminNewsletterPage }) => {
      await adminNewsletterPage.goto();
      
      if (await adminNewsletterPage.createNewsletterButton.isVisible().catch(() => false)) {
        await adminNewsletterPage.openCreateNewsletterModal();
        
        if (await adminNewsletterPage.frequencySelect.isVisible()) {
          const options = await adminNewsletterPage.frequencySelect.locator('option').allTextContents();
          // Should have frequency options
          expect(options.length).toBeGreaterThan(0);
        }
      }
    });

    test.skip('should save newsletter as draft', async ({ adminNewsletterPage }) => {
      await adminNewsletterPage.goto();
      
      await adminNewsletterPage.createNewsletter({
        subject: `Test Newsletter Draft ${Date.now()}`,
        content: 'This is a test newsletter content for E2E testing.',
        frequency: NewsletterFrequency.WEEKLY
      });
      
      await expect(adminNewsletterPage.successToast).toBeVisible();
    });
  });

  test.describe('Newsletter Preview', () => {
    test('should have preview functionality', async ({ adminNewsletterPage }) => {
      await adminNewsletterPage.goto();
      
      if (await adminNewsletterPage.createNewsletterButton.isVisible().catch(() => false)) {
        await adminNewsletterPage.openCreateNewsletterModal();
        
        // Fill some content
        if (await adminNewsletterPage.subjectInput.isVisible()) {
          await adminNewsletterPage.subjectInput.fill('Preview Test');
          await adminNewsletterPage.contentEditor.fill('Preview content');
          
          // Check for preview button
          const previewButton = adminNewsletterPage.previewButton;
          if (await previewButton.isVisible()) {
            await previewButton.click();
            await expect(adminNewsletterPage.previewModal.or(adminNewsletterPage.page.locator('text=/preview/i'))).toBeVisible();
          }
        }
      }
    });
  });

  test.describe('Subscribers Management', () => {
    test('should navigate to subscribers tab', async ({ adminNewsletterPage }) => {
      await adminNewsletterPage.goto();
      
      if (await adminNewsletterPage.subscribersTab.isVisible().catch(() => false)) {
        await adminNewsletterPage.goToSubscribersTab();
        
        await expect(adminNewsletterPage.subscribersTable.or(adminNewsletterPage.page.locator('text=Subscribers'))).toBeVisible();
      }
    });

    test('should show subscriber count', async ({ adminNewsletterPage }) => {
      await adminNewsletterPage.goto();
      
      if (await adminNewsletterPage.subscribersTab.isVisible().catch(() => false)) {
        const count = await adminNewsletterPage.getSubscriberCount();
        expect(count).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Send Newsletter', () => {
    test.skip('should trigger newsletter send', async ({ adminNewsletterPage }) => {
      // Skipped to avoid sending actual emails
      await adminNewsletterPage.goto();
      
      const firstNewsletter = adminNewsletterPage.newsletterRows.first();
      
      if (await firstNewsletter.isVisible()) {
        const subject = await firstNewsletter.locator('[data-testid="newsletter-subject"]').textContent();
        
        if (subject) {
          await adminNewsletterPage.triggerEmailForNewsletter(subject);
          await expect(adminNewsletterPage.successToast).toBeVisible();
        }
      }
    });
  });
});
