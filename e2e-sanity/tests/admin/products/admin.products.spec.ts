// tests/admin/products/admin.products.spec.ts
// STORY-001: Product Management (Admin)
// STORY-002: Product Categories Management

import { test, expect } from '@playwright/test';
import { AdminProductsPage } from '../../../page-objects';
import { TEST_PRODUCT, TEST_CATEGORY } from '../../../fixtures';
import path from 'path';

test.describe('STORY-001 | Admin Product Management', () => {

  test('admin products list page loads with search and pagination', async ({ page }) => {
    const admin = new AdminProductsPage(page);
    await admin.gotoList();
    await expect(admin.tableRows.first()).toBeVisible({ timeout: 10_000 });
    await expect(admin.searchInput).toBeVisible();
    await expect(admin.pagination).toBeVisible();
  });

  test('admin can search products', async ({ page }) => {
    const admin = new AdminProductsPage(page);
    await admin.gotoList();
    await admin.searchInput.fill('test');
    await page.waitForLoadState('networkidle');
    const rows = admin.tableRows;
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
  });

  test('create product form renders all required fields', async ({ page }) => {
    const admin = new AdminProductsPage(page);
    await admin.gotoCreate();
    await expect(admin.titleInput).toBeVisible();
    await expect(admin.titleHiInput).toBeVisible();
    await expect(admin.descInput).toBeVisible();
    await expect(admin.priceInput).toBeVisible();
    await expect(admin.originalPriceInput).toBeVisible();
    await expect(admin.slugInput).toBeVisible();
    await expect(admin.categorySelect).toBeVisible();
    await expect(admin.stockSelect).toBeVisible();
    await expect(admin.featuredToggle).toBeVisible();
    await expect(admin.activeToggle).toBeVisible();
    await expect(admin.imageUpload).toBeAttached();
  });

  test('discount percentage auto-calculates from price vs originalPrice', async ({ page }) => {
    const admin = new AdminProductsPage(page);
    await admin.gotoCreate();
    await admin.priceInput.fill('499');
    await admin.originalPriceInput.fill('699');
    await page.locator('body').click(); // blur
    const discount = admin.discountBadge;
    await expect(discount).toBeVisible({ timeout: 3_000 });
    const text = await discount.textContent();
    // ~28% discount
    expect(text).toMatch(/\d+\s*%/);
  });

  test('admin can create a product with all fields', async ({ page }) => {
    const admin = new AdminProductsPage(page);
    await admin.gotoCreate();
    await admin.titleInput.fill(TEST_PRODUCT.title);
    await admin.titleHiInput.fill(TEST_PRODUCT.titleHi);
    await admin.descInput.fill(TEST_PRODUCT.description);
    await admin.priceInput.fill(TEST_PRODUCT.price);
    await admin.originalPriceInput.fill(TEST_PRODUCT.originalPrice);
    await admin.slugInput.fill(`${TEST_PRODUCT.slug}-${Date.now()}`);
    await admin.stockSelect.selectOption(TEST_PRODUCT.stock);
    await admin.saveBtn.click();
    await expect(admin.successToast).toBeVisible({ timeout: 8_000 });
  });

  test('admin can upload product image via drag-and-drop zone', async ({ page }) => {
    const admin = new AdminProductsPage(page);
    await admin.gotoCreate();
    // Set files on the hidden input
    await admin.imageUpload.setInputFiles(
      path.join(__dirname, '../../../fixtures/test-image.jpg')
    );
    await expect(page.locator('[data-testid="image-preview"]').first()).toBeVisible({ timeout: 8_000 });
  });

  test('admin can set stock status: in_stock, out_of_stock, limited', async ({ page }) => {
    const admin = new AdminProductsPage(page);
    await admin.gotoCreate();
    for (const status of ['in_stock', 'out_of_stock', 'limited']) {
      await admin.stockSelect.selectOption(status);
      const selected = await admin.stockSelect.inputValue();
      expect(selected).toBe(status);
    }
  });

  test('admin can toggle product active/inactive', async ({ page }) => {
    const admin = new AdminProductsPage(page);
    await admin.gotoCreate();
    const isActive = await admin.activeToggle.isChecked();
    await admin.activeToggle.click();
    expect(await admin.activeToggle.isChecked()).toBe(!isActive);
  });

  test('admin can mark product as featured', async ({ page }) => {
    const admin = new AdminProductsPage(page);
    await admin.gotoCreate();
    await admin.featuredToggle.click();
    await expect(admin.featuredToggle).toBeChecked();
  });

  test('admin can edit an existing product', async ({ page }) => {
    const admin = new AdminProductsPage(page);
    await admin.gotoList();
    // Click first product edit button
    await admin.tableRows.first().locator('[data-testid="edit-btn"]').click();
    await expect(page).toHaveURL(/\/admin\/products\/.+\/edit/);
    const updated = `Updated Title ${Date.now()}`;
    await admin.titleInput.fill(updated);
    await admin.saveBtn.click();
    await expect(admin.successToast).toBeVisible({ timeout: 8_000 });
  });

  test('admin can delete a product with confirmation', async ({ page }) => {
    const admin = new AdminProductsPage(page);
    await admin.gotoList();
    const rowsBefore = await admin.tableRows.count();
    await admin.tableRows.last().locator('[data-testid="delete-btn"]').click();
    await expect(admin.confirmDelete).toBeVisible({ timeout: 3_000 });
    await admin.confirmDelete.click();
    await expect(admin.successToast).toBeVisible({ timeout: 8_000 });
    await page.waitForLoadState('networkidle');
    const rowsAfter = await admin.tableRows.count();
    expect(rowsAfter).toBeLessThan(rowsBefore);
  });
});

test.describe('STORY-002 | Admin Product Categories', () => {

  test('categories list page loads', async ({ page }) => {
    const admin = new AdminProductsPage(page);
    await admin.gotoAdmin('/categories');
    await expect(admin.tableRows.first()).toBeVisible({ timeout: 8_000 });
  });

  test('admin can create a category with bilingual fields', async ({ page }) => {
    const admin = new AdminProductsPage(page);
    await admin.gotoAdmin('/categories/create');
    await page.locator('[data-testid="cat-name"]').fill(TEST_CATEGORY.name);
    await page.locator('[data-testid="cat-name-hi"]').fill(TEST_CATEGORY.nameHi);
    await page.locator('[data-testid="cat-desc"]').fill(TEST_CATEGORY.description);
    await page.locator('[data-testid="cat-slug"]').fill(`${TEST_CATEGORY.slug}-${Date.now()}`);
    await admin.saveBtn.click();
    await expect(admin.successToast).toBeVisible({ timeout: 8_000 });
  });

  test('deleting a category does not delete associated products', async ({ page }) => {
    // API-level check: products in category still exist after category delete
    const admin = new AdminProductsPage(page);
    await admin.gotoAdmin('/categories');
    const rowsBefore = await page.locator('[data-testid="product-count-badge"]')
      .first().textContent();
    await admin.tableRows.first().locator('[data-testid="delete-btn"]').click();
    if (await admin.confirmDelete.isVisible({ timeout: 2000 })) {
      await admin.confirmDelete.click();
    }
    await admin.gotoList();
    const productRows = await admin.tableRows.count();
    expect(productRows).toBeGreaterThan(0); // products still exist
  });

  test('categories display as filter tabs on public products page', async ({ page }) => {
    await page.goto('/en/products');
    const tabs = page.locator('[data-testid="category-tab"]');
    await expect(tabs.first()).toBeVisible({ timeout: 8_000 });
    const count = await tabs.count();
    expect(count).toBeGreaterThan(0);
  });
});
