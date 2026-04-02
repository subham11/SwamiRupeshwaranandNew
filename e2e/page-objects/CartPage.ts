import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page object for the Cart page (/[locale]/cart)
 * Three steps: Cart → Address → Checkout
 */
export class CartPage extends BasePage {
  // Cart step
  readonly emptyCartMessage: Locator;
  readonly browseProductsLink: Locator;
  readonly cartItems: Locator;
  readonly clearCartButton: Locator;
  readonly proceedButton: Locator;
  readonly orderSummary: Locator;
  readonly totalAmount: Locator;

  // Address step
  readonly backToCartButton: Locator;
  readonly fullNameInput: Locator;
  readonly phoneInput: Locator;
  readonly addressLine1Input: Locator;
  readonly addressLine2Input: Locator;
  readonly cityInput: Locator;
  readonly stateInput: Locator;
  readonly pincodeInput: Locator;
  readonly countryInput: Locator;
  readonly saveAddressButton: Locator;
  readonly editAddressButton: Locator;

  // Checkout step
  readonly placeOrderButton: Locator;
  readonly checkoutMessage: Locator;

  // General
  readonly pageTitle: Locator;
  readonly loginButton: Locator;

  constructor(page: Page) {
    super(page);

    // Cart step
    this.emptyCartMessage = page.locator('text=Your cart is empty');
    this.browseProductsLink = page.locator('a:has-text("Browse Products")');
    this.cartItems = page.locator('.lg\\:col-span-2 >> .border, .lg\\:col-span-2 >> [class*="flex"][class*="gap"]');
    this.clearCartButton = page.locator('button:has-text("Clear Cart")');
    this.proceedButton = page.locator('button:has-text("Proceed to Checkout")');
    this.orderSummary = page.locator('text=Order Summary');
    this.totalAmount = page.locator('.text-xl.font-bold, .text-lg.font-bold').last();

    // Address step — inputs use labels (no placeholders), select by label text
    this.backToCartButton = page.locator('button:has-text("Back to Cart")');
    this.fullNameInput = page.locator('label:has-text("Full Name") + input, label:has-text("पूरा नाम") + input').first();
    this.phoneInput = page.locator('input[type="tel"]').first();
    this.addressLine1Input = page.locator('label:has-text("Address Line 1") + input, label:has-text("पता पंक्ति 1") + input').first();
    this.addressLine2Input = page.locator('label:has-text("Address Line 2") + input, label:has-text("पता पंक्ति 2") + input').first();
    this.cityInput = page.locator('label:has-text("City") + input, label:has-text("शहर") + input').first();
    this.stateInput = page.locator('label:has-text("State") + input, label:has-text("राज्य") + input').first();
    this.pincodeInput = page.locator('input[pattern="[0-9]{6}"]').first();
    this.countryInput = page.locator('label:has-text("Country") + input, label:has-text("देश") + input').first();
    this.saveAddressButton = page.locator('button:has-text("Save Address"), button:has-text("पता सहेजें")').first();
    this.editAddressButton = page.locator('button:has-text("Edit"), button:has-text("संपादित")');

    // Checkout step
    this.placeOrderButton = page.locator('button:has-text("Place Order")');
    this.checkoutMessage = page.locator('text=Payment integration coming soon');

    // General
    this.pageTitle = page.locator('h1:has-text("Shopping Cart"), h1:has-text("Cart")');
    this.loginButton = page.locator('button:has-text("Login"), a:has-text("Login")');
  }

  async gotoCart(locale = 'en') {
    await this.goto(`/${locale}/cart`);
  }

  async isEmptyCart(): Promise<boolean> {
    return this.emptyCartMessage.isVisible();
  }

  async getItemCount(): Promise<number> {
    // Count cart item rows
    const items = this.page.locator('[class*="border"][class*="rounded"]').filter({
      has: this.page.locator('img'),
    });
    return items.count();
  }

  async clearCart() {
    if (await this.clearCartButton.isVisible()) {
      await this.clearCartButton.click();
    }
  }

  async proceedToCheckout() {
    await this.proceedButton.click();
  }

  async fillAddress(data: {
    fullName: string;
    phone: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    pincode: string;
    country?: string;
  }) {
    await this.fullNameInput.fill(data.fullName);
    await this.phoneInput.fill(data.phone);
    await this.addressLine1Input.fill(data.address1);
    if (data.address2) {
      await this.addressLine2Input.fill(data.address2);
    }
    await this.cityInput.fill(data.city);
    await this.stateInput.fill(data.state);
    await this.pincodeInput.fill(data.pincode);
    if (data.country) {
      await this.countryInput.fill(data.country);
    }
    await this.saveAddressButton.click();
  }

  async placeOrder() {
    await this.placeOrderButton.click();
  }

  async getTotal(): Promise<string> {
    return (await this.totalAmount.textContent()) || '';
  }
}
