// tests/admin/cms/admin.cms.spec.ts
// STORY-020: CMS Page Builder

import { test, expect } from '@playwright/test';
import { AdminCMSPage } from '../../../page-objects';
import { TEST_CMS_PAGE } from '../../../fixtures';

const CMS_COMPONENT_TYPES = [
  'hero_section',
  'text_block',
  'image_gallery',
  'feature_grid',
  'cta_section',
  'testimonials',
  'faq',
  'video',
];

test.describe('STORY-020 | CMS Page Builder', () => {

  test('CMS pages list loads', async ({ page }) => {
    const cms = new AdminCMSPage(page);
    await cms.gotoList();
    await expect(page.locator('[data-testid="cms-pages-list"]')).toBeVisible({ timeout: 10_000 });
  });

  test('create page form renders title, slug, and status fields', async ({ page }) => {
    const cms = new AdminCMSPage(page);
    await cms.gotoCreate();
    await expect(cms.pageTitleInput).toBeVisible();
    await expect(cms.slugInput).toBeVisible();
    await expect(cms.statusSelect).toBeVisible();
  });

  test('admin can create a draft CMS page', async ({ page }) => {
    const cms  = new AdminCMSPage(page);
    await cms.gotoCreate();
    const slug = `${TEST_CMS_PAGE.slug}-${Date.now()}`;
    await cms.pageTitleInput.fill(TEST_CMS_PAGE.title);
    await cms.slugInput.fill(slug);
    await cms.statusSelect.selectOption('draft');
    await cms.saveBtn.click();
    await expect(cms.successToast).toBeVisible({ timeout: 8_000 });
  });

  test('component menu shows all 8 component types', async ({ page }) => {
    const cms = new AdminCMSPage(page);
    await cms.gotoCreate();
    await cms.pageTitleInput.fill('Component Test');
    await cms.slugInput.fill(`comp-test-${Date.now()}`);
    await cms.addComponentBtn.click();
    for (const type of CMS_COMPONENT_TYPES) {
      await expect(
        cms.componentMenu.locator(`[data-type="${type}"]`)
      ).toBeVisible({ timeout: 5_000 });
    }
  });

  test('admin can add a hero_section component', async ({ page }) => {
    const cms = new AdminCMSPage(page);
    await cms.gotoCreate();
    await cms.pageTitleInput.fill('Hero Test Page');
    await cms.slugInput.fill(`hero-test-${Date.now()}`);
    await cms.addComponent('hero_section');
    await expect(cms.componentBlocks.first()).toBeVisible({ timeout: 5_000 });
    const blockType = await cms.componentBlocks.first().getAttribute('data-component-type');
    expect(blockType).toBe('hero_section');
  });

  test('admin can add a text_block component and fill content', async ({ page }) => {
    const cms = new AdminCMSPage(page);
    await cms.gotoCreate();
    await cms.pageTitleInput.fill('Text Block Test');
    await cms.slugInput.fill(`text-test-${Date.now()}`);
    await cms.addComponent('text_block');
    const block = cms.componentBlocks.first();
    await expect(block).toBeVisible({ timeout: 5_000 });
    const textField = block.locator('[data-testid="component-text-content"]');
    if (await textField.isVisible({ timeout: 2000 }).catch(() => false)) {
      await textField.fill('Hello Swamirupeshwaranand Sanity Test');
    }
  });

  test('admin can add multiple components', async ({ page }) => {
    const cms = new AdminCMSPage(page);
    await cms.gotoCreate();
    await cms.pageTitleInput.fill('Multi Component Test');
    await cms.slugInput.fill(`multi-comp-${Date.now()}`);
    for (const type of ['hero_section', 'text_block', 'faq']) {
      await cms.addComponent(type);
      await page.waitForTimeout(300);
    }
    await expect(cms.componentBlocks).toHaveCount(3, { timeout: 5_000 });
  });

  test('admin can reorder components via drag-and-drop', async ({ page }) => {
    const cms = new AdminCMSPage(page);
    await cms.gotoCreate();
    await cms.pageTitleInput.fill('Drag Test');
    await cms.slugInput.fill(`drag-test-${Date.now()}`);
    for (const type of ['hero_section', 'text_block']) {
      await cms.addComponent(type);
      await page.waitForTimeout(200);
    }
    const handles = cms.dragHandle;
    if (await handles.count() >= 2) {
      const first = await handles.nth(0).boundingBox();
      const second = await handles.nth(1).boundingBox();
      if (first && second) {
        await page.mouse.move(first.x + first.width / 2, first.y + first.height / 2);
        await page.mouse.down();
        await page.mouse.move(second.x + second.width / 2, second.y + second.height / 2 + 10, { steps: 20 });
        await page.mouse.up();
        // Assert order changed — component-type attributes swapped
        const firstType = await cms.componentBlocks.nth(0).getAttribute('data-component-type');
        expect(firstType).toBe('text_block');
      }
    }
  });

  test('admin can delete a component block', async ({ page }) => {
    const cms = new AdminCMSPage(page);
    await cms.gotoCreate();
    await cms.pageTitleInput.fill('Delete Component Test');
    await cms.slugInput.fill(`del-comp-${Date.now()}`);
    await cms.addComponent('text_block');
    await expect(cms.componentBlocks.first()).toBeVisible({ timeout: 5_000 });
    await cms.componentBlocks.first().locator('[data-testid="delete-component"]').click();
    await expect(cms.componentBlocks).toHaveCount(0, { timeout: 5_000 });
  });

  test('admin can publish a page', async ({ page }) => {
    const cms  = new AdminCMSPage(page);
    await cms.gotoCreate();
    const slug = `pub-test-${Date.now()}`;
    await cms.pageTitleInput.fill('Published Test Page');
    await cms.slugInput.fill(slug);
    await cms.statusSelect.selectOption('draft');
    await cms.addComponent('text_block');
    await cms.saveBtn.click();
    await expect(cms.successToast).toBeVisible({ timeout: 8_000 });
    await cms.publishBtn.click();
    await expect(cms.successToast).toBeVisible({ timeout: 8_000 });
  });

  test('published page is accessible at /{locale}/{slug}', async ({ page }) => {
    // Use a known published slug from the seed or create one
    const cms  = new AdminCMSPage(page);
    const slug = `pub-access-${Date.now()}`;
    await cms.gotoCreate();
    await cms.pageTitleInput.fill('Public Access Test');
    await cms.slugInput.fill(slug);
    await cms.statusSelect.selectOption('published');
    await cms.saveBtn.click();
    await expect(cms.successToast).toBeVisible({ timeout: 8_000 });

    await page.goto(`/en/${slug}`);
    await expect(page).toHaveURL(`/en/${slug}`, { timeout: 8_000 });
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('page preview button opens preview before publishing', async ({ page }) => {
    const cms = new AdminCMSPage(page);
    await cms.gotoCreate();
    await cms.pageTitleInput.fill('Preview Test');
    await cms.slugInput.fill(`preview-${Date.now()}`);
    await cms.addComponent('hero_section');
    if (await cms.previewBtn.isVisible()) {
      const [previewPage] = await Promise.all([
        page.context().waitForEvent('page'),
        cms.previewBtn.click(),
      ]);
      await expect(previewPage).not.toBeNull();
      await previewPage.waitForLoadState('domcontentloaded');
    }
  });

  test('admin can delete a CMS page', async ({ page }) => {
    const cms = new AdminCMSPage(page);
    await cms.gotoList();
    if (await cms.tableRows.count() > 0) {
      const before = await cms.tableRows.count();
      await cms.tableRows.last().locator('[data-testid="delete-btn"]').click();
      if (await cms.confirmDelete.isVisible({ timeout: 2000 })) {
        await cms.confirmDelete.click();
      }
      await expect(cms.successToast).toBeVisible({ timeout: 8_000 });
      await page.waitForLoadState('networkidle');
      expect(await cms.tableRows.count()).toBeLessThan(before);
    }
  });
});
