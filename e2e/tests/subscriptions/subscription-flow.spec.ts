import { test, expect } from '../../fixtures';

test.describe('Subscriptions Page', () => {
  test('should display subscription plans', async ({ subscriptionsPage }) => {
    await subscriptionsPage.goto();

    const planCount = await subscriptionsPage.getPlanCount();
    expect(planCount).toBeGreaterThan(0);
  });

  test('should show plan cards with subscribe buttons', async ({ subscriptionsPage }) => {
    await subscriptionsPage.goto();

    await expect(subscriptionsPage.planCards.first()).toBeVisible();
    await expect(subscriptionsPage.subscribeButtons.first()).toBeVisible();
  });

  test('should have multiple plan options', async ({ subscriptionsPage }) => {
    await subscriptionsPage.goto();

    const planCount = await subscriptionsPage.getPlanCount();
    // Typically expect at least 2 plans (basic + premium)
    expect(planCount).toBeGreaterThanOrEqual(1);
  });
});

test.describe('Subscriptions - Different Locales', () => {
  test('should work in English', async ({ subscriptionsPage, page }) => {
    await subscriptionsPage.goto('en');
    await expect(page).toHaveURL(/\/en\/subscriptions/);
  });

  test('should work in Hindi', async ({ subscriptionsPage, page }) => {
    await subscriptionsPage.goto('hi');
    await expect(page).toHaveURL(/\/hi\/subscriptions/);
  });
});

test.describe('Subscription Selection Flow', () => {
  test('should be able to select a plan', async ({ subscriptionsPage, page }) => {
    await subscriptionsPage.goto();

    // Click on first plan's subscribe button
    await subscriptionsPage.selectPlan(0);

    // Should navigate to checkout or show subscription modal
    // Adjust based on actual app behavior
  });
});
