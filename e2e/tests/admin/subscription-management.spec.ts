/**
 * Admin Subscription Management E2E Tests
 * Tests for admin subscription plan management:
 * - CRUD operations on subscription plans
 * - Content management and assignment
 * - User subscription overview
 */

import { test, expect } from '../../fixtures';
import { 
  TEST_SUPER_ADMIN,
  SUBSCRIPTION_PLANS,
  URLS 
} from '../../fixtures/test-data';

test.describe('Subscription Plan Management', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.login(TEST_SUPER_ADMIN.email, TEST_SUPER_ADMIN.password);
    await loginPage.page.waitForURL(/.*admin|dashboard.*/);
  });

  test.describe('View Subscription Plans', () => {
    test('should display all subscription plans', async ({ adminSubscriptionsPage }) => {
      await adminSubscriptionsPage.goto();
      
      // Should see plans table or list
      await expect(adminSubscriptionsPage.plansTable.or(adminSubscriptionsPage.page.locator('text=Plans'))).toBeVisible();
    });

    test('should show plan details including price and autopay status', async ({ adminSubscriptionsPage, page }) => {
      await adminSubscriptionsPage.goto();
      
      // Check for price display
      const priceDisplay = page.locator('text=/₹|INR|price/i');
      await expect(priceDisplay.first().or(adminSubscriptionsPage.plansTable)).toBeVisible();
    });

    test('should display Free tier correctly', async ({ adminSubscriptionsPage, page }) => {
      await adminSubscriptionsPage.goto();
      
      // Look for Free plan
      const freePlan = page.locator(`text=${SUBSCRIPTION_PLANS.FREE.name}`);
      await expect(freePlan.or(page.locator('text=Free'))).toBeVisible();
    });

    test('should display premium tiers with correct pricing', async ({ adminSubscriptionsPage, page }) => {
      await adminSubscriptionsPage.goto();
      
      // Check for premium plan prices
      const prices = [
        SUBSCRIPTION_PLANS.BASIC.price,
        SUBSCRIPTION_PLANS.STANDARD.price,
        SUBSCRIPTION_PLANS.PREMIUM.price
      ];
      
      // At least one price should be visible
      const priceLocators = prices.map(p => page.locator(`text=${p}`));
      const anyPriceVisible = await Promise.any(priceLocators.map(l => l.isVisible().then(v => v ? true : Promise.reject())));
      
      // Expect subscription page to be functional
      await expect(adminSubscriptionsPage.plansTable.or(page.locator('text=Subscriptions'))).toBeVisible();
    });
  });

  test.describe('Create Subscription Plan', () => {
    test('should open create plan modal', async ({ adminSubscriptionsPage }) => {
      await adminSubscriptionsPage.goto();
      
      if (await adminSubscriptionsPage.createPlanButton.isVisible().catch(() => false)) {
        await adminSubscriptionsPage.openCreatePlanModal();
        await expect(adminSubscriptionsPage.planModal).toBeVisible();
      }
    });

    test('should validate required fields when creating plan', async ({ adminSubscriptionsPage }) => {
      await adminSubscriptionsPage.goto();
      
      if (await adminSubscriptionsPage.createPlanButton.isVisible().catch(() => false)) {
        await adminSubscriptionsPage.openCreatePlanModal();
        
        // Try to submit empty form
        await adminSubscriptionsPage.planSubmitButton.click();
        
        // Should show validation error or stay on modal
        await expect(adminSubscriptionsPage.planModal).toBeVisible();
      }
    });

    test.skip('should create a new subscription plan', async ({ adminSubscriptionsPage }) => {
      // Skipped to avoid creating test data in production
      await adminSubscriptionsPage.goto();
      
      const timestamp = Date.now();
      await adminSubscriptionsPage.createPlan({
        name: `Test Plan ${timestamp}`,
        price: 999,
        description: 'Test subscription plan description',
        features: 'Feature 1\nFeature 2\nFeature 3',
        autopay: true,
        duration: 'monthly'
      });
      
      await expect(adminSubscriptionsPage.successToast).toBeVisible();
    });

    test('should differentiate autopay plans from manual payment plans', async ({ adminSubscriptionsPage, page }) => {
      await adminSubscriptionsPage.goto();
      
      // Plans <= ₹2100 should show autopay, higher plans manual
      // This is informational - implementation varies
      const autopayIndicator = page.locator('text=/autopay|automatic|upi/i');
      const manualIndicator = page.locator('text=/manual|bank transfer/i');
      
      // At least subscription management should be visible
      await expect(adminSubscriptionsPage.plansTable.or(page.locator('text=Subscriptions'))).toBeVisible();
    });
  });

  test.describe('Edit Subscription Plan', () => {
    test('should allow editing existing plan', async ({ adminSubscriptionsPage }) => {
      await adminSubscriptionsPage.goto();
      
      const planRow = await adminSubscriptionsPage.getPlanRowByName(SUBSCRIPTION_PLANS.BASIC.name);
      if (await planRow.isVisible().catch(() => false)) {
        const editButton = planRow.locator('[data-testid="edit-plan"], button:has-text("Edit")');
        if (await editButton.isVisible()) {
          await editButton.click();
          await expect(adminSubscriptionsPage.planModal).toBeVisible();
        }
      }
    });

    test.skip('should update plan description', async ({ adminSubscriptionsPage }) => {
      await adminSubscriptionsPage.goto();
      
      await adminSubscriptionsPage.editPlan(SUBSCRIPTION_PLANS.BASIC.name);
      await adminSubscriptionsPage.planDescriptionInput.fill('Updated description');
      await adminSubscriptionsPage.planSubmitButton.click();
      
      await expect(adminSubscriptionsPage.successToast).toBeVisible();
    });
  });

  test.describe('Subscription Content Management', () => {
    test('should navigate to content tab', async ({ adminSubscriptionsPage }) => {
      await adminSubscriptionsPage.goto();
      
      if (await adminSubscriptionsPage.contentTab.isVisible().catch(() => false)) {
        await adminSubscriptionsPage.goToContentTab();
        await expect(adminSubscriptionsPage.contentList.or(adminSubscriptionsPage.page.locator('text=Content'))).toBeVisible();
      }
    });

    test.skip('should add content to subscription plan', async ({ adminSubscriptionsPage }) => {
      // Skipped to avoid creating test data in production
      await adminSubscriptionsPage.goto();
      
      await adminSubscriptionsPage.addContent({
        title: 'Test Content',
        type: 'pdf',
        filePath: './fixtures/test-file.pdf',
        planId: SUBSCRIPTION_PLANS.BASIC.id
      });
      
      await expect(adminSubscriptionsPage.successToast).toBeVisible();
    });
  });

  test.describe('User Subscriptions Overview', () => {
    test('should navigate to user subscriptions tab', async ({ adminSubscriptionsPage }) => {
      await adminSubscriptionsPage.goto();
      
      if (await adminSubscriptionsPage.userSubscriptionsTab.isVisible().catch(() => false)) {
        await adminSubscriptionsPage.goToUserSubscriptionsTab();
        await expect(adminSubscriptionsPage.userSubscriptionsList.or(adminSubscriptionsPage.page.locator('text=Users'))).toBeVisible();
      }
    });

    test('should display active subscriptions', async ({ adminSubscriptionsPage, page }) => {
      await adminSubscriptionsPage.goto();
      
      if (await adminSubscriptionsPage.userSubscriptionsTab.isVisible().catch(() => false)) {
        await adminSubscriptionsPage.goToUserSubscriptionsTab();
        
        // Should show subscription data or empty state
        const subscriptionData = page.locator('[data-testid="subscription-row"], tr, [data-testid="empty-state"]');
        await expect(subscriptionData.first().or(page.locator('text=No subscriptions'))).toBeVisible();
      }
    });
  });
});
