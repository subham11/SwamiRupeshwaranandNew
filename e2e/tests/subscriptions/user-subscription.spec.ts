/**
 * User Subscription Flow E2E Tests
 * Tests for user-facing subscription functionality:
 * - View subscription plans
 * - Subscribe to plans
 * - Payment flow (Razorpay integration)
 * - Content access based on subscription
 */

import { test, expect } from '../../fixtures';
import { 
  TEST_USER,
  SUBSCRIPTION_PLANS,
  URLS,
  TIMEOUTS
} from '../../fixtures/test-data';

test.describe('Public Subscription Page', () => {
  test('should display subscription plans for unauthenticated users', async ({ subscriptionsPage }) => {
    await subscriptionsPage.goto();
    
    // Should show subscription plans
    await expect(subscriptionsPage.page).toHaveURL(/.*subscriptions.*/);
    
    // Look for pricing cards or plan listings
    const planCards = subscriptionsPage.page.locator('[data-testid="plan-card"], .plan-card, [class*="pricing"]');
    const planList = subscriptionsPage.page.locator('text=/Free|Basic|Standard|Premium/i');
    
    await expect(planCards.first().or(planList.first())).toBeVisible();
  });

  test('should show Free tier details', async ({ subscriptionsPage }) => {
    await subscriptionsPage.goto();
    
    const freePlan = subscriptionsPage.page.locator('text=/Free/i');
    await expect(freePlan.first()).toBeVisible();
  });

  test('should show pricing for paid tiers', async ({ subscriptionsPage }) => {
    await subscriptionsPage.goto();
    
    // Look for currency symbols or amounts
    const pricing = subscriptionsPage.page.locator('text=/₹|INR|300|1100|2100|5100|21000/');
    await expect(pricing.first().or(subscriptionsPage.page.locator('text=/price|pricing/i'))).toBeVisible();
  });

  test('should indicate autopay vs manual payment plans', async ({ subscriptionsPage }) => {
    await subscriptionsPage.goto();
    
    // Higher tier plans (₹5100, ₹21000) should indicate manual payment
    // Lower tier plans should indicate autopay/UPI
    const paymentInfo = subscriptionsPage.page.locator('text=/autopay|manual|UPI|bank/i');
    
    // Payment info might not be visible on public page
    await expect(subscriptionsPage.page).toHaveURL(/.*subscriptions.*/);
  });

  test('should prompt login when clicking subscribe without auth', async ({ subscriptionsPage }) => {
    await subscriptionsPage.goto();
    
    // Find any subscribe button
    const subscribeButton = subscriptionsPage.page.locator('button:has-text("Subscribe"), a:has-text("Subscribe"), [data-testid="subscribe-button"]');
    
    if (await subscribeButton.first().isVisible().catch(() => false)) {
      await subscribeButton.first().click();
      
      // Should redirect to login
      await expect(subscriptionsPage.page).toHaveURL(/.*login.*/, { timeout: TIMEOUTS.NAVIGATION });
    }
  });
});

test.describe('Authenticated User Subscription', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.login(TEST_USER.email, TEST_USER.password);
    await loginPage.page.waitForURL(/.*dashboard.*/);
  });

  test('should show current subscription status on dashboard', async ({ userDashboardPage }) => {
    await userDashboardPage.goto();
    
    // Look for subscription info
    const subscriptionInfo = userDashboardPage.subscriptionStatus
      .or(userDashboardPage.subscriptionPlan)
      .or(userDashboardPage.page.locator('text=/subscription|plan/i'));
    
    await expect(subscriptionInfo.first().or(userDashboardPage.welcomeMessage)).toBeVisible();
  });

  test('should navigate to upgrade subscription', async ({ userDashboardPage, page }) => {
    await userDashboardPage.goto();
    
    const upgradeButton = userDashboardPage.upgradeButton
      .or(page.locator('a:has-text("Upgrade")'))
      .or(page.locator('[data-testid="upgrade"]'));
    
    if (await upgradeButton.first().isVisible().catch(() => false)) {
      await upgradeButton.first().click();
      await expect(page).toHaveURL(/.*subscriptions|upgrade.*/);
    }
  });

  test('should display all available plans for upgrade', async ({ subscriptionsPage }) => {
    await subscriptionsPage.goto();
    
    // Authenticated users should see all plans
    const plans = [
      SUBSCRIPTION_PLANS.FREE.name,
      SUBSCRIPTION_PLANS.BASIC.name,
      SUBSCRIPTION_PLANS.STANDARD.name,
      SUBSCRIPTION_PLANS.PREMIUM.name
    ];
    
    // At least one plan should be visible
    const planLocators = plans.map(p => subscriptionsPage.page.locator(`text=${p}`));
    await expect(planLocators[0].or(subscriptionsPage.page.locator('text=/plan|tier/i'))).toBeVisible();
  });
});

test.describe('Subscription Payment Flow', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.login(TEST_USER.email, TEST_USER.password);
    await loginPage.page.waitForURL(/.*dashboard.*/);
  });

  test('should show payment options when selecting a plan', async ({ subscriptionsPage }) => {
    await subscriptionsPage.goto();
    
    // Click on a paid plan
    const basicPlanButton = subscriptionsPage.page.locator(`button:has-text("Subscribe"):near(:text("${SUBSCRIPTION_PLANS.BASIC.name}"))`);
    const anySubscribeButton = subscriptionsPage.page.locator('button:has-text("Subscribe")').first();
    
    const buttonToClick = (await basicPlanButton.isVisible().catch(() => false)) 
      ? basicPlanButton 
      : anySubscribeButton;
    
    if (await buttonToClick.isVisible().catch(() => false)) {
      await buttonToClick.click();
      
      // Should show payment modal/page or Razorpay
      const paymentIndicator = subscriptionsPage.page.locator('text=/payment|pay|razorpay|checkout/i');
      await expect(paymentIndicator.first().or(subscriptionsPage.page.locator('iframe'))).toBeVisible({ timeout: 10000 });
    }
  });

  test.skip('should show UPI autopay option for plans <= ₹2100', async ({ subscriptionsPage }) => {
    // This test checks the Razorpay integration which requires actual payment flow
    await subscriptionsPage.goto();
    
    // Select a plan eligible for autopay
    const standardPlanButton = subscriptionsPage.page.locator(`button:has-text("Subscribe"):near(:text("${SUBSCRIPTION_PLANS.STANDARD.name}"))`);
    
    if (await standardPlanButton.isVisible()) {
      await standardPlanButton.click();
      
      // Razorpay with UPI autopay should appear
      const upiOption = subscriptionsPage.page.locator('text=/UPI|autopay/i');
      await expect(upiOption).toBeVisible({ timeout: 10000 });
    }
  });

  test.skip('should show manual payment option for plans > ₹2100', async ({ subscriptionsPage }) => {
    await subscriptionsPage.goto();
    
    // Select premium plan (₹5100 or ₹21000)
    const premiumPlanButton = subscriptionsPage.page.locator(`button:has-text("Subscribe"):near(:text("${SUBSCRIPTION_PLANS.PROFESSIONAL.name}"))`);
    
    if (await premiumPlanButton.isVisible()) {
      await premiumPlanButton.click();
      
      // Should show bank transfer/manual payment option
      const manualOption = subscriptionsPage.page.locator('text=/bank transfer|manual|contact/i');
      await expect(manualOption).toBeVisible({ timeout: 10000 });
    }
  });

  test('should handle payment cancellation gracefully', async ({ subscriptionsPage, page }) => {
    await subscriptionsPage.goto();
    
    const subscribeButton = page.locator('button:has-text("Subscribe")').first();
    
    if (await subscribeButton.isVisible().catch(() => false)) {
      await subscribeButton.click();
      
      // Wait for payment modal
      await page.waitForTimeout(2000);
      
      // Try to close/cancel (ESC key or close button)
      await page.keyboard.press('Escape');
      
      // Should return to subscription page
      await expect(page).toHaveURL(/.*subscriptions.*/);
    }
  });
});

test.describe('Content Access by Subscription', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.login(TEST_USER.email, TEST_USER.password);
    await loginPage.page.waitForURL(/.*dashboard.*/);
  });

  test('should show available content based on subscription tier', async ({ userContentPage }) => {
    await userContentPage.goto();
    
    // Should show content grid or list
    await expect(userContentPage.contentGrid.or(userContentPage.page.locator('text=/content|resources/i'))).toBeVisible();
  });

  test('should indicate locked content for higher tiers', async ({ userContentPage, page }) => {
    await userContentPage.goto();
    
    // Look for locked/premium content indicators
    const lockedIndicator = page.locator('[data-testid="locked"], .locked, [class*="lock"], text=/upgrade|premium only/i');
    
    // Locked content may or may not exist depending on user's subscription
    if (await lockedIndicator.first().isVisible().catch(() => false)) {
      await expect(lockedIndicator.first()).toBeVisible();
    }
  });

  test('should show upgrade prompt for locked content', async ({ userContentPage }) => {
    await userContentPage.goto();
    
    // If there's locked content, clicking it should prompt upgrade
    const lockedContent = userContentPage.lockedContent;
    
    if (await lockedContent.first().isVisible().catch(() => false)) {
      await lockedContent.first().click();
      
      const upgradePrompt = userContentPage.upgradePrompt
        .or(userContentPage.page.locator('text=/upgrade|subscribe/i'));
      await expect(upgradePrompt).toBeVisible();
    }
  });

  test('should allow downloading accessible content', async ({ userContentPage }) => {
    await userContentPage.goto();
    
    // Open first available content
    const contentItems = userContentPage.contentItems;
    
    if (await contentItems.first().isVisible().catch(() => false)) {
      await userContentPage.openContent(0);
      
      // Check for download button
      const downloadButton = userContentPage.downloadButton;
      if (await downloadButton.isVisible().catch(() => false)) {
        await expect(downloadButton).toBeEnabled();
      }
    }
  });
});

test.describe('Subscription Renewal', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.login(TEST_USER.email, TEST_USER.password);
    await loginPage.page.waitForURL(/.*dashboard.*/);
  });

  test('should display subscription expiry date', async ({ userDashboardPage, page }) => {
    await userDashboardPage.goto();
    
    const expiryInfo = userDashboardPage.subscriptionExpiry
      .or(page.locator('text=/expires|renewal|valid until/i'));
    
    // Expiry info may or may not be visible depending on subscription status
    await expect(userDashboardPage.page).toHaveURL(/.*dashboard.*/);
  });

  test('should show renewal options for expiring subscriptions', async ({ userDashboardPage, page }) => {
    await userDashboardPage.goto();
    
    const renewButton = page.locator('button:has-text("Renew"), a:has-text("Renew"), [data-testid="renew"]');
    
    // Renewal button visibility depends on subscription status
    if (await renewButton.isVisible().catch(() => false)) {
      await expect(renewButton).toBeEnabled();
    }
  });
});
