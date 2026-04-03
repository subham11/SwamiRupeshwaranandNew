// page-objects/index.ts
// All Page Object Models for bhairavapath.com

import { Page, Locator, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// Base Page
// ─────────────────────────────────────────────────────────────────────────────
export class BasePage {
  constructor(protected page: Page) {}

  get languageSwitcher() { return this.page.locator('[data-testid="lang-switcher"]'); }
  get currencySwitcher() { return this.page.locator('[data-testid="currency-switcher"]'); }
  get headerCartIcon()   { return this.page.locator('[data-testid="cart-icon"]'); }
  get cartBadge()        { return this.page.locator('[data-testid="cart-badge"]'); }
  get searchTrigger()    { return this.page.locator('[data-testid="search-trigger"]'); }

  async switchToHindi() {
    await this.languageSwitcher.click();
    await this.page.locator('[data-testid="lang-hi"]').click();
  }

  async switchToEnglish() {
    await this.languageSwitcher.click();
    await this.page.locator('[data-testid="lang-en"]').click();
  }

  async switchCurrency(currency: 'INR' | 'USD') {
    await this.currencySwitcher.click();
    await this.page.locator(`[data-testid="currency-${currency.toLowerCase()}"]`).click();
  }

  async openSearch() {
    await this.searchTrigger.click();
    await expect(this.page.locator('[data-testid="search-modal"]')).toBeVisible();
  }

  async openSearchWithKeyboard() {
    await this.page.keyboard.press('Control+k');
    await expect(this.page.locator('[data-testid="search-modal"]')).toBeVisible();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Auth Page
// ─────────────────────────────────────────────────────────────────────────────
export class AuthPage extends BasePage {
  get emailInput()    { return this.page.locator('[data-testid="auth-email"]'); }
  get passwordInput() { return this.page.locator('[data-testid="auth-password"]'); }
  get otpInput()      { return this.page.locator('[data-testid="auth-otp"]'); }
  get sendOtpBtn()    { return this.page.locator('[data-testid="send-otp-btn"]'); }
  get loginBtn()      { return this.page.locator('[data-testid="login-btn"]'); }
  get otpTab()        { return this.page.locator('[data-testid="tab-otp"]'); }
  get passwordTab()   { return this.page.locator('[data-testid="tab-password"]'); }
  get errorMsg()      { return this.page.locator('[data-testid="auth-error"]'); }

  async goto() { await this.page.goto('/login'); }

  async loginWithPassword(email: string, password: string) {
    await this.goto();
    await this.passwordTab.click();
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginBtn.click();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Products Page
// ─────────────────────────────────────────────────────────────────────────────
export class ProductsPage extends BasePage {
  get categoryTabs()   { return this.page.locator('[data-testid="category-tab"]'); }
  get productCards()   { return this.page.locator('[data-testid="product-card"]'); }
  get loadMoreBtn()    { return this.page.locator('[data-testid="load-more"]'); }
  get skeletonCards()  { return this.page.locator('[data-testid="product-skeleton"]'); }

  async goto(locale = 'en') { await this.page.goto(`/${locale}/products`); }

  async filterByCategory(name: string) {
    await this.categoryTabs.filter({ hasText: name }).click();
    await this.page.waitForLoadState('networkidle');
  }

  async getProductCard(index = 0) {
    return this.productCards.nth(index);
  }

  async openFirstProduct() {
    await this.productCards.first().click();
    await this.page.waitForURL(/\/products\/.+/);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Product Detail Page
// ─────────────────────────────────────────────────────────────────────────────
export class ProductDetailPage extends BasePage {
  get title()         { return this.page.locator('[data-testid="product-title"]'); }
  get price()         { return this.page.locator('[data-testid="product-price"]'); }
  get originalPrice() { return this.page.locator('[data-testid="product-original-price"]'); }
  get stockStatus()   { return this.page.locator('[data-testid="stock-status"]'); }
  get addToCartBtn()  { return this.page.locator('[data-testid="add-to-cart-btn"]'); }
  get addToWishlistBtn(){ return this.page.locator('[data-testid="add-to-wishlist-btn"]'); }
  get images()        { return this.page.locator('[data-testid="product-image"]'); }
  get description()   { return this.page.locator('[data-testid="product-description"]'); }
  get reviewsSection(){ return this.page.locator('[data-testid="reviews-section"]'); }
  get reviewStars()   { return this.page.locator('[data-testid="star-rating"] button'); }
  get reviewText()    { return this.page.locator('[data-testid="review-text"]'); }
  get submitReviewBtn(){ return this.page.locator('[data-testid="submit-review-btn"]'); }
  get reviewSuccessMsg(){ return this.page.locator('[data-testid="review-success"]'); }

  async submitReview(stars: number, text: string) {
    await this.reviewStars.nth(stars - 1).click();
    await this.reviewText.fill(text);
    await this.submitReviewBtn.click();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Cart Page
// ─────────────────────────────────────────────────────────────────────────────
export class CartPage extends BasePage {
  get cartItems()        { return this.page.locator('[data-testid="cart-item"]'); }
  get cartTotal()        { return this.page.locator('[data-testid="cart-total"]'); }
  get clearCartBtn()     { return this.page.locator('[data-testid="clear-cart-btn"]'); }
  get checkoutBtn()      { return this.page.locator('[data-testid="checkout-btn"]'); }
  get emptyCartMsg()     { return this.page.locator('[data-testid="empty-cart"]'); }
  get couponInput()      { return this.page.locator('[data-testid="coupon-input"]'); }
  get applyCouponBtn()   { return this.page.locator('[data-testid="apply-coupon-btn"]'); }
  get couponSuccess()    { return this.page.locator('[data-testid="coupon-success"]'); }
  get couponError()      { return this.page.locator('[data-testid="coupon-error"]'); }

  async goto() { await this.page.goto('/cart'); }

  async increaseQty(itemIndex = 0) {
    await this.cartItems.nth(itemIndex)
      .locator('[data-testid="qty-increase"]').click();
  }

  async decreaseQty(itemIndex = 0) {
    await this.cartItems.nth(itemIndex)
      .locator('[data-testid="qty-decrease"]').click();
  }

  async removeItem(itemIndex = 0) {
    await this.cartItems.nth(itemIndex)
      .locator('[data-testid="remove-item"]').click();
  }

  async applyCoupon(code: string) {
    await this.couponInput.fill(code);
    await this.applyCouponBtn.click();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Checkout Page
// ─────────────────────────────────────────────────────────────────────────────
export class CheckoutPage extends BasePage {
  get fullNameInput()   { return this.page.locator('[data-testid="address-name"]'); }
  get phoneInput()      { return this.page.locator('[data-testid="address-phone"]'); }
  get line1Input()      { return this.page.locator('[data-testid="address-line1"]'); }
  get line2Input()      { return this.page.locator('[data-testid="address-line2"]'); }
  get cityInput()       { return this.page.locator('[data-testid="address-city"]'); }
  get stateInput()      { return this.page.locator('[data-testid="address-state"]'); }
  get pincodeInput()    { return this.page.locator('[data-testid="address-pincode"]'); }
  get placeOrderBtn()   { return this.page.locator('[data-testid="place-order-btn"]'); }
  get validationErrors(){ return this.page.locator('[data-testid="field-error"]'); }

  async fillAddress(a: {
    fullName: string; phone: string; line1: string;
    city: string; state: string; pincode: string;
  }) {
    await this.fullNameInput.fill(a.fullName);
    await this.phoneInput.fill(a.phone);
    await this.line1Input.fill(a.line1);
    await this.cityInput.fill(a.city);
    await this.stateInput.fill(a.state);
    await this.pincodeInput.fill(a.pincode);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard Page
// ─────────────────────────────────────────────────────────────────────────────
export class DashboardPage extends BasePage {
  get profileTab()       { return this.page.locator('[data-testid="tab-profile"]'); }
  get ordersTab()        { return this.page.locator('[data-testid="tab-orders"]'); }
  get subscriptionsTab() { return this.page.locator('[data-testid="tab-subscriptions"]'); }
  get wishlistTab()      { return this.page.locator('[data-testid="tab-wishlist"]'); }
  get securityTab()      { return this.page.locator('[data-testid="tab-security"]'); }
  get nameInput()        { return this.page.locator('[data-testid="profile-name"]'); }
  get saveProfileBtn()   { return this.page.locator('[data-testid="save-profile-btn"]'); }
  get orderCards()       { return this.page.locator('[data-testid="order-card"]'); }
  get wishlistItems()    { return this.page.locator('[data-testid="wishlist-item"]'); }
  get downloadInvoiceBtn(){ return this.page.locator('[data-testid="download-invoice"]'); }

  async goto() { await this.page.goto('/dashboard'); }
}

// ─────────────────────────────────────────────────────────────────────────────
// Search Modal
// ─────────────────────────────────────────────────────────────────────────────
export class SearchModal extends BasePage {
  get modal()         { return this.page.locator('[data-testid="search-modal"]'); }
  get input()         { return this.page.locator('[data-testid="search-input"]'); }
  get results()       { return this.page.locator('[data-testid="search-result"]'); }
  get resultGroups()  { return this.page.locator('[data-testid="result-group"]'); }
  get emptyState()    { return this.page.locator('[data-testid="search-empty"]'); }
  get loadingSpinner(){ return this.page.locator('[data-testid="search-loading"]'); }
  get noResults()     { return this.page.locator('[data-testid="search-no-results"]'); }

  async search(query: string) {
    await this.input.fill(query);
    await this.page.waitForTimeout(350); // debounce
    await expect(this.loadingSpinner).toBeHidden({ timeout: 5000 });
  }

  async closeWithEsc() {
    await this.page.keyboard.press('Escape');
    await expect(this.modal).toBeHidden();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin — Base
// ─────────────────────────────────────────────────────────────────────────────
export class AdminBasePage extends BasePage {
  async gotoAdmin(path: string) {
    await this.page.goto(`/admin${path}`);
  }

  get statsCards()   { return this.page.locator('[data-testid="stat-card"]'); }
  get filterTabs()   { return this.page.locator('[data-testid="filter-tab"]'); }
  get tableRows()    { return this.page.locator('[data-testid="table-row"]'); }
  get createBtn()    { return this.page.locator('[data-testid="create-btn"]'); }
  get saveBtn()      { return this.page.locator('[data-testid="save-btn"]'); }
  get deleteBtn()    { return this.page.locator('[data-testid="delete-btn"]'); }
  get confirmDelete(){ return this.page.locator('[data-testid="confirm-delete"]'); }
  get toast()        { return this.page.locator('[data-testid="toast"]'); }
  get successToast() { return this.page.locator('[data-testid="toast-success"]'); }
  get searchInput()  { return this.page.locator('[data-testid="admin-search"]'); }
  get pagination()   { return this.page.locator('[data-testid="pagination"]'); }
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin — Products
// ─────────────────────────────────────────────────────────────────────────────
export class AdminProductsPage extends AdminBasePage {
  get titleInput()        { return this.page.locator('[data-testid="product-title-en"]'); }
  get titleHiInput()      { return this.page.locator('[data-testid="product-title-hi"]'); }
  get descInput()         { return this.page.locator('[data-testid="product-desc-en"]'); }
  get priceInput()        { return this.page.locator('[data-testid="product-price"]'); }
  get originalPriceInput(){ return this.page.locator('[data-testid="product-original-price"]'); }
  get slugInput()         { return this.page.locator('[data-testid="product-slug"]'); }
  get categorySelect()    { return this.page.locator('[data-testid="product-category"]'); }
  get stockSelect()       { return this.page.locator('[data-testid="product-stock"]'); }
  get featuredToggle()    { return this.page.locator('[data-testid="product-featured"]'); }
  get activeToggle()      { return this.page.locator('[data-testid="product-active"]'); }
  get imageUpload()       { return this.page.locator('[data-testid="image-dropzone"] input[type=file]'); }
  get discountBadge()     { return this.page.locator('[data-testid="discount-calc"]'); }

  async gotoList()   { await this.gotoAdmin('/products'); }
  async gotoCreate() { await this.gotoAdmin('/products/create'); }
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin — Orders
// ─────────────────────────────────────────────────────────────────────────────
export class AdminOrdersPage extends AdminBasePage {
  get orderRows()          { return this.page.locator('[data-testid="order-row"]'); }
  get statusDropdown()     { return this.page.locator('[data-testid="status-dropdown"]'); }
  get trackingInput()      { return this.page.locator('[data-testid="tracking-number"]'); }
  get updateStatusBtn()    { return this.page.locator('[data-testid="update-status-btn"]'); }
  get orderDetailExpand()  { return this.page.locator('[data-testid="order-expand"]'); }

  async goto() { await this.gotoAdmin('/orders'); }

  async updateOrderStatus(rowIndex: number, status: string, tracking?: string) {
    await this.orderRows.nth(rowIndex).locator('[data-testid="order-actions"]').click();
    await this.statusDropdown.selectOption(status);
    if (tracking) await this.trackingInput.fill(tracking);
    await this.updateStatusBtn.click();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin — CMS
// ─────────────────────────────────────────────────────────────────────────────
export class AdminCMSPage extends AdminBasePage {
  get pageTitleInput()  { return this.page.locator('[data-testid="cms-title"]'); }
  get slugInput()       { return this.page.locator('[data-testid="cms-slug"]'); }
  get statusSelect()    { return this.page.locator('[data-testid="cms-status"]'); }
  get addComponentBtn() { return this.page.locator('[data-testid="add-component-btn"]'); }
  get componentMenu()   { return this.page.locator('[data-testid="component-menu"]'); }
  get componentBlocks() { return this.page.locator('[data-testid="component-block"]'); }
  get previewBtn()      { return this.page.locator('[data-testid="preview-btn"]'); }
  get publishBtn()      { return this.page.locator('[data-testid="publish-btn"]'); }
  get dragHandle()      { return this.page.locator('[data-testid="drag-handle"]'); }

  async gotoList()   { await this.gotoAdmin('/cms'); }
  async gotoCreate() { await this.gotoAdmin('/cms/create'); }

  async addComponent(type: string) {
    await this.addComponentBtn.click();
    await this.componentMenu.locator(`[data-type="${type}"]`).click();
  }
}
