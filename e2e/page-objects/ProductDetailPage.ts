import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page object for the Product Detail page (/[locale]/products/[slug])
 */
export class ProductDetailPage extends BasePage {
  readonly productTitle: Locator;
  readonly productPrice: Locator;
  readonly originalPrice: Locator;
  readonly productDescription: Locator;
  readonly mainImage: Locator;
  readonly thumbnails: Locator;
  readonly addToCartButton: Locator;
  readonly buyNowLink: Locator;
  readonly stockBadge: Locator;
  readonly reviewSection: Locator;
  readonly writeReviewButton: Locator;
  readonly reviewTextarea: Locator;
  readonly submitReviewButton: Locator;
  readonly reviewCards: Locator;
  readonly backToProducts: Locator;
  readonly notFound: Locator;

  constructor(page: Page) {
    super(page);
    this.productTitle = page.locator('h1');
    this.productPrice = page.locator('.text-3xl.font-bold').first();
    this.originalPrice = page.locator('.line-through');
    this.productDescription = page.locator('[class*="prose"], [class*="description"]');
    this.mainImage = page.locator('.aspect-square img, .rounded-2xl img').first();
    this.thumbnails = page.locator('.w-16.h-16, .w-20.h-20');
    this.addToCartButton = page.locator('button:has-text("Add to Cart")');
    this.buyNowLink = page.locator('a:has-text("Buy Now")');
    this.stockBadge = page.locator('.rounded-full:has-text("Stock"), .rounded-full:has-text("Limited")');
    this.reviewSection = page.locator('text=Reviews').first();
    this.writeReviewButton = page.locator('button:has-text("Write a Review")');
    this.reviewTextarea = page.locator('textarea').first();
    this.submitReviewButton = page.locator('button:has-text("Submit Review")');
    this.reviewCards = page.locator('.rounded-xl.border');
    this.backToProducts = page.locator('a:has-text("Back to Products")');
    this.notFound = page.locator('text=Product not found');
  }

  async gotoProduct(slug: string, locale = 'en') {
    await this.goto(`/${locale}/products/${slug}`);
  }

  async getTitle(): Promise<string> {
    return (await this.productTitle.textContent()) || '';
  }

  async getPrice(): Promise<string> {
    return (await this.productPrice.textContent()) || '';
  }

  async hasOriginalPrice(): Promise<boolean> {
    return this.originalPrice.isVisible();
  }

  async addToCart() {
    await this.addToCartButton.click();
  }

  async isAddToCartVisible(): Promise<boolean> {
    return this.addToCartButton.isVisible();
  }

  async isNotFound(): Promise<boolean> {
    // Wait for page to finish loading (skeleton disappears, content appears)
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(2000);
    // Check if still showing "not found" after loading completes
    return this.notFound.isVisible();
  }

  async getStockStatus(): Promise<string> {
    if (await this.stockBadge.isVisible()) {
      return (await this.stockBadge.textContent()) || '';
    }
    return '';
  }
}
