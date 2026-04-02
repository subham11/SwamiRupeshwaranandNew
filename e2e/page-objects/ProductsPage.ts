import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page object for the Products listing page (/[locale]/products)
 * and individual category pages (/[locale]/courses, /retreats, etc.)
 */
export class ProductsPage extends BasePage {
  readonly productGrid: Locator;
  readonly productCards: Locator;
  readonly loadingSkeletons: Locator;
  readonly emptyState: Locator;
  readonly loadingMore: Locator;
  readonly sentinel: Locator;
  readonly heroTitle: Locator;

  constructor(page: Page) {
    super(page);
    // Products page uses grid-cols-2, category pages use grid-cols-1
    this.productGrid = page.locator('.grid');
    this.productCards = page.locator('a.group:has(h3)');
    this.loadingSkeletons = page.locator('.animate-pulse');
    this.emptyState = page.locator('.text-center.py-20');
    this.loadingMore = page.locator('.animate-spin');
    this.sentinel = page.locator('.h-4').last();
    this.heroTitle = page.locator('h1');
  }

  async gotoProducts(locale = 'en') {
    await this.goto(`/${locale}/products`);
  }

  async gotoCourses(locale = 'en') {
    await this.goto(`/${locale}/courses`);
  }

  async gotoRetreats(locale = 'en') {
    await this.goto(`/${locale}/retreats`);
  }

  async gotoAstrology(locale = 'en') {
    await this.goto(`/${locale}/astrology`);
  }

  async gotoClasses(locale = 'en') {
    await this.goto(`/${locale}/classes`);
  }

  async gotoSatsang(locale = 'en') {
    await this.goto(`/${locale}/satsang`);
  }

  async waitForProducts() {
    // Wait for skeletons to disappear and content to load
    await this.page.waitForTimeout(1000);
    await this.page.waitForLoadState('networkidle');
  }

  async getProductCount(): Promise<number> {
    await this.waitForProducts();
    return this.productCards.count();
  }

  async getProductTitles(): Promise<string[]> {
    await this.waitForProducts();
    const titles: string[] = [];
    const cards = await this.productCards.all();
    for (const card of cards) {
      const titleEl = card.locator('h3');
      const text = await titleEl.textContent();
      if (text) titles.push(text.trim());
    }
    return titles;
  }

  async clickProduct(index: number) {
    const cards = await this.productCards.all();
    if (index < cards.length) {
      await cards[index].click();
    }
  }

  async clickProductByTitle(title: string) {
    await this.productCards.filter({ hasText: title }).first().click();
  }

  async getHeroTitle(): Promise<string> {
    return (await this.heroTitle.textContent()) || '';
  }

  async isEmptyState(): Promise<boolean> {
    return this.emptyState.isVisible();
  }

  async isLoading(): Promise<boolean> {
    return (await this.loadingSkeletons.count()) > 0;
  }
}
