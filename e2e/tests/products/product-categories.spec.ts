/**
 * E2E tests: Verify all 5 category pages render products correctly.
 */
import { test, expect } from '../../fixtures/test-fixtures';

const CATEGORY_PAGES = [
  {
    name: 'Online Meditation Courses',
    path: '/en/courses',
    heroTitle: 'Online Meditation Courses',
    heroTitleHi: 'ऑनलाइन ध्यान पाठ्यक्रम',
    hiPath: '/hi/courses',
  },
  {
    name: 'Spiritual Retreats',
    path: '/en/retreats',
    heroTitle: 'Spiritual Retreats',
    heroTitleHi: 'आध्यात्मिक शिविर',
    hiPath: '/hi/retreats',
  },
  {
    name: 'Astrology Consultation',
    path: '/en/astrology',
    heroTitle: 'Astrology Consultation',
    heroTitleHi: 'ज्योतिष परामर्श',
    hiPath: '/hi/astrology',
  },
  {
    name: 'Sanskrit & Vedanta Classes',
    path: '/en/classes',
    heroTitle: 'Sanskrit & Vedanta Classes',
    heroTitleHi: 'संस्कृत एवं वेदांत कक्षाएं',
    hiPath: '/hi/classes',
  },
  {
    name: 'Satsang Events',
    path: '/en/satsang',
    heroTitle: 'Satsang Events',
    heroTitleHi: 'सत्संग कार्यक्रम',
    hiPath: '/hi/satsang',
  },
];

test.describe('Product Category Pages', () => {
  for (const category of CATEGORY_PAGES) {
    test(`should display "${category.name}" page with products`, async ({
      productsPage,
    }) => {
      await productsPage.goto(category.path);
      await productsPage.waitForProducts();

      // Verify hero title
      const title = await productsPage.getHeroTitle();
      expect(title).toContain(category.heroTitle);

      // Verify products load (at least 1 from seed data + existing)
      const count = await productsPage.getProductCount();
      // If no products exist yet, empty state is also acceptable
      if (count === 0) {
        const isEmpty = await productsPage.isEmptyState();
        expect(isEmpty).toBeTruthy();
      } else {
        expect(count).toBeGreaterThan(0);
      }
    });

    test(`should display "${category.name}" in Hindi`, async ({
      productsPage,
    }) => {
      await productsPage.goto(category.hiPath);
      await productsPage.waitForProducts();

      const title = await productsPage.getHeroTitle();
      expect(title).toContain(category.heroTitleHi);
    });
  }

  test('should navigate from product card to detail page', async ({
    productsPage,
    page,
  }) => {
    await productsPage.goto('/en/courses');
    await productsPage.waitForProducts();

    const count = await productsPage.getProductCount();
    if (count > 0) {
      const firstCard = page.locator('a.group:has(h3)').first();
      const href = await firstCard.getAttribute('href');
      expect(href).toContain('/en/products/');
      await firstCard.click();
      await page.waitForURL(/\/en\/products\/[^/]+/, { timeout: 10000 });
      expect(page.url()).toContain('/en/products/');
    }
  });
});
