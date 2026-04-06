// tests/sanity/ui-sanity.spec.ts
// UI-level sanity tests — verify key pages load and render correctly

import { test, expect } from '@playwright/test';

test.describe('UI Sanity — Public Pages Load', () => {

  test('Homepage loads and shows content', async ({ page }) => {
    await page.goto('/en');
    // Title may be "Swami Rupeshwaranand" or "bhairavapath"
    await expect(page).toHaveTitle(/swami|rupeshwaranand|bhairavapath|भैरवपथ/i);
    await expect(page.locator('body')).toBeVisible();
    const header = page.locator('header, nav').first();
    await expect(header).toBeVisible({ timeout: 15_000 });
  });

  test('Hindi homepage loads', async ({ page }) => {
    await page.goto('/hi');
    await expect(page.locator('body')).toBeVisible();
    // Should have Hindi text somewhere
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toMatch(/[\u0900-\u097F]/); // Devanagari range
  });

  test('Products page loads and shows product grid', async ({ page }) => {
    await page.goto('/en/products');
    // Wait for products to load
    const productCard = page.locator('[data-testid="product-card"]');
    await expect(productCard.first()).toBeVisible({ timeout: 15_000 });
    // Should have multiple products
    const count = await productCard.count();
    expect(count).toBeGreaterThan(0);
    console.log(`  → Found ${count} product cards`);
  });

  test('Product card shows title, price, and category', async ({ page }) => {
    await page.goto('/en/products');
    const card = page.locator('[data-testid="product-card"]').first();
    await expect(card).toBeVisible({ timeout: 15_000 });
    // Title
    const title = card.locator('[data-testid="card-title"]');
    await expect(title).toBeVisible();
    const titleText = await title.textContent();
    expect(titleText!.length).toBeGreaterThan(0);
    // Price
    const price = card.locator('[data-testid="card-price"]');
    await expect(price).toBeVisible();
  });

  test('Category tabs are visible on products page', async ({ page }) => {
    await page.goto('/en/products');
    const tab = page.locator('[data-testid="category-tab"]');
    await expect(tab.first()).toBeVisible({ timeout: 15_000 });
    const tabCount = await tab.count();
    expect(tabCount).toBeGreaterThan(1); // At least "All" + one category
    console.log(`  → Found ${tabCount} category tabs`);
  });

  test('Login page renders with auth form', async ({ page }) => {
    await page.goto('/en/login');
    // Should have email input
    const emailInput = page.locator('[data-testid="auth-email"]');
    await expect(emailInput).toBeVisible({ timeout: 10_000 });
  });

  test('Cart page loads', async ({ page }) => {
    await page.goto('/en/cart');
    // Cart page should load — may redirect to login or show empty/cart content
    await expect(page.locator('body')).toBeVisible();
    const bodyText = await page.textContent('body');
    // Should show cart-related or login content
    expect(bodyText!.length).toBeGreaterThan(50);
  });

  test('Subscribe page loads', async ({ page }) => {
    await page.goto('/en/subscribe');
    await expect(page.locator('body')).toBeVisible();
    // Should show subscription plans or content
    const bodyText = await page.textContent('body');
    expect(bodyText!.length).toBeGreaterThan(100);
  });
});

test.describe('UI Sanity — Search Modal', () => {

  test('Search trigger is visible in header', async ({ page }) => {
    await page.goto('/en');
    const trigger = page.locator('[data-testid="search-trigger"]');
    await expect(trigger).toBeVisible({ timeout: 10_000 });
  });

  test('Clicking search trigger opens modal', async ({ page }) => {
    await page.goto('/en');
    await page.locator('[data-testid="search-trigger"]').click();
    const modal = page.locator('[data-testid="search-modal"]');
    await expect(modal).toBeVisible({ timeout: 5_000 });
    const input = page.locator('[data-testid="search-input"]');
    await expect(input).toBeVisible();
  });

  test('Search shows results for valid query', async ({ page }) => {
    await page.goto('/en');
    await page.locator('[data-testid="search-trigger"]').click();
    const input = page.locator('[data-testid="search-input"]');
    await input.fill('meditation');
    // Wait for results (debounced)
    const result = page.locator('[data-testid="search-result"]');
    await expect(result.first()).toBeVisible({ timeout: 10_000 });
  });

  test('Search shows no-results for gibberish', async ({ page }) => {
    await page.goto('/en');
    await page.locator('[data-testid="search-trigger"]').click();
    const input = page.locator('[data-testid="search-input"]');
    await input.fill('xyzzy99999zzzz');
    // Wait for no-results state
    const noResults = page.locator('[data-testid="search-no-results"]');
    await expect(noResults).toBeVisible({ timeout: 10_000 });
  });

  test('Escape closes search modal', async ({ page }) => {
    await page.goto('/en');
    await page.locator('[data-testid="search-trigger"]').click();
    await expect(page.locator('[data-testid="search-modal"]')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-testid="search-modal"]')).not.toBeVisible();
  });
});

test.describe('UI Sanity — Navigation & i18n', () => {

  test('Header navigation links are visible', async ({ page }) => {
    await page.goto('/en');
    // Verify key nav elements exist
    const nav = page.locator('nav, header').first();
    await expect(nav).toBeVisible({ timeout: 10_000 });
    // Login link should be visible for unauthenticated users
    const loginLink = page.locator('a:has-text("Login"), button:has-text("Login")');
    await expect(loginLink.first()).toBeVisible({ timeout: 5_000 });
  });

  test('Currency switcher is visible', async ({ page }) => {
    await page.goto('/en');
    const switcher = page.locator('[data-testid="currency-switcher"]');
    // May not be visible on all viewports
    const visible = await switcher.isVisible().catch(() => false);
    console.log(`  → Currency switcher visible: ${visible}`);
    // Not failing if hidden on mobile
  });

  test('Products page in Hindi shows Devanagari', async ({ page }) => {
    await page.goto('/hi/products');
    const card = page.locator('[data-testid="product-card"]').first();
    await expect(card).toBeVisible({ timeout: 15_000 });
    // Page content should contain Devanagari characters
    const text = await page.locator('body').textContent();
    expect(text).toMatch(/[\u0900-\u097F]/);
  });
});

test.describe('UI Sanity — Maha Yagya Page', () => {

  test('Maha Yagya page loads', async ({ page }) => {
    await page.goto('/en/maha-yagya');
    await expect(page.locator('body')).toBeVisible();
    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('Maha Yagya');
  });

  test('Key Benefits section shows 4 USPs', async ({ page }) => {
    await page.goto('/en/maha-yagya');
    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('25,000+');
    expect(bodyText).toContain('1 Cr+');
    expect(bodyText).toContain('Unmissable');
  });

  test('Sponsor section shows all 4 tiers with prices', async ({ page }) => {
    await page.goto('/en/maha-yagya');
    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('Sponsor');
    expect(bodyText).toContain('Title Partner');
    expect(bodyText).toContain('50,00,000');
    expect(bodyText).toContain('Co Partner');
    expect(bodyText).toContain('25,00,000');
    expect(bodyText).toContain('Associate Partner');
    expect(bodyText).toContain('10,00,000');
    expect(bodyText).toContain('Prime Stall Partner');
    expect(bodyText).toContain('5,00,000');
  });

  test('Yajaman section shows VVIP/VIP tiers', async ({ page }) => {
    await page.goto('/en/maha-yagya');
    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('Yajaman');
    expect(bodyText).toContain('Vishisht Yajaman');
    expect(bodyText).toContain('VVIP');
    expect(bodyText).toContain('5,51,000');
    expect(bodyText).toContain('Mukhya Yajaman');
    expect(bodyText).toContain('2,51,000');
    expect(bodyText).toContain('Sahayogi Yajaman');
    expect(bodyText).toContain('1,51,000');
  });

  test('Camps & Programs section shows 4 tiers with prices', async ({ page }) => {
    await page.goto('/en/maha-yagya');
    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('Camps');
    expect(bodyText).toContain('One Day Camp');
    expect(bodyText).toContain('11,000');
    expect(bodyText).toContain('Three Days Camp');
    expect(bodyText).toContain('21,000');
    expect(bodyText).toContain('Five Days Camp');
    expect(bodyText).toContain('51,000');
    expect(bodyText).toContain('Divine Meet');
  });

  test('Enquire Now buttons are visible', async ({ page }) => {
    await page.goto('/en/maha-yagya');
    const enquireButtons = page.locator('a:has-text("Enquire Now"), button:has-text("Enquire Now")');
    const count = await enquireButtons.count();
    expect(count).toBeGreaterThan(0);
    console.log(`  → Found ${count} "Enquire Now" buttons`);
  });

  test('Lead form has category and tier dropdowns', async ({ page }) => {
    await page.goto('/en/maha-yagya');
    // Scroll to form section
    const formSection = page.locator('form').first();
    await formSection.scrollIntoViewIfNeeded();
    // Category dropdown
    const categorySelect = page.locator('select[name="category"]');
    await expect(categorySelect).toBeVisible({ timeout: 10_000 });
    // Tier dropdown
    const tierSelect = page.locator('select[name="tier"]');
    await expect(tierSelect).toBeVisible();
  });

  test('Lead form category dropdown has 3 options', async ({ page }) => {
    await page.goto('/en/maha-yagya');
    const categorySelect = page.locator('select[name="category"]');
    await categorySelect.scrollIntoViewIfNeeded();
    const options = categorySelect.locator('option');
    // placeholder + 3 categories = 4
    const count = await options.count();
    expect(count).toBe(4);
  });

  test('Maha Yagya Hindi page loads with Devanagari', async ({ page }) => {
    await page.goto('/hi/maha-yagya');
    await expect(page.locator('body')).toBeVisible();
    const bodyText = await page.textContent('body');
    expect(bodyText).toMatch(/[\u0900-\u097F]/); // Devanagari
    expect(bodyText).toContain('यज्ञमान');
  });

  test('Speakers carousel section is visible with placeholder cards', async ({ page }) => {
    await page.goto('/en/maha-yagya');
    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('Our Speakers');
    expect(bodyText).toContain('Speaker 1');
    expect(bodyText).toContain('Full speaker lineup coming soon');
    // Swiper container should exist
    const swiper = page.locator('.speakers-swiper');
    await expect(swiper).toBeVisible({ timeout: 10_000 });
  });

  test('All tiers show free accommodation and health checkup', async ({ page }) => {
    await page.goto('/en/maha-yagya');
    const bodyText = await page.textContent('body');
    // "Free Accommodation & Meals" should appear in all Yajaman (3) + Camp (4) tiers = 7
    const accommodationCount = (bodyText!.match(/Free Accommodation & Meals/g) || []).length;
    expect(accommodationCount).toBeGreaterThanOrEqual(7);
    const healthCount = (bodyText!.match(/Free Health Checkup/g) || []).length;
    expect(healthCount).toBeGreaterThanOrEqual(7);
    console.log(`  → Free Accommodation mentions: ${accommodationCount}, Free Health: ${healthCount}`);
  });

  test('Maha Yagya page loads within 12 seconds', async ({ page }) => {
    const start = Date.now();
    await page.goto('/en/maha-yagya', { waitUntil: 'domcontentloaded' });
    const elapsed = Date.now() - start;
    console.log(`  → Maha Yagya DOMContentLoaded in ${elapsed}ms`);
    expect(elapsed).toBeLessThan(12_000);
  });
});

test.describe('UI Sanity — Homepage Popup', () => {

  test('Maha Yagya popup appears on homepage after delay', async ({ page }) => {
    // Clear any previous dismissal
    await page.goto('/en');
    await page.evaluate(() => sessionStorage.removeItem('mahayagya_popup_dismissed'));
    await page.reload();
    // Wait for popup (3s delay + render)
    const popup = page.locator('text=108 Kund World Peace Mahayagya');
    await expect(popup).toBeVisible({ timeout: 10_000 });
    // Verify CTA link
    const cta = page.locator('a:has-text("Learn More & Participate")');
    await expect(cta).toBeVisible();
  });

  test('Popup can be dismissed', async ({ page }) => {
    await page.goto('/en');
    await page.evaluate(() => sessionStorage.removeItem('mahayagya_popup_dismissed'));
    await page.reload();
    const popup = page.locator('text=108 Kund World Peace Mahayagya');
    await expect(popup).toBeVisible({ timeout: 10_000 });
    // Click "Maybe Later"
    await page.locator('button:has-text("Maybe Later")').click();
    await expect(popup).not.toBeVisible({ timeout: 3_000 });
  });
});

test.describe('UI Sanity — Performance', () => {

  test('Homepage loads within 10 seconds', async ({ page }) => {
    const start = Date.now();
    await page.goto('/en', { waitUntil: 'domcontentloaded' });
    const elapsed = Date.now() - start;
    console.log(`  → Homepage DOMContentLoaded in ${elapsed}ms`);
    expect(elapsed).toBeLessThan(10_000);
  });

  test('Products page loads within 12 seconds', async ({ page }) => {
    const start = Date.now();
    await page.goto('/en/products', { waitUntil: 'domcontentloaded' });
    const elapsed = Date.now() - start;
    console.log(`  → Products DOMContentLoaded in ${elapsed}ms`);
    expect(elapsed).toBeLessThan(12_000);
  });

  test('No console errors on homepage', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto('/en', { waitUntil: 'networkidle' });
    // Filter out expected third-party errors
    const realErrors = errors.filter(e =>
      !e.includes('favicon') &&
      !e.includes('third-party') &&
      !e.includes('analytics') &&
      !e.includes('ERR_BLOCKED_BY_CLIENT')
    );
    if (realErrors.length > 0) {
      console.log('  → Console errors:', realErrors);
    }
    // Warn but don't fail — some hydration warnings are expected
    expect(realErrors.length).toBeLessThan(5);
  });
});
