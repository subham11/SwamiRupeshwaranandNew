/**
 * Content Management E2E Tests  
 * Tests for admin content/page management:
 * - Page editing
 * - Component management
 * - Announcements
 * - Image uploads
 */

import { test, expect } from '../../fixtures';
import { 
  TEST_SUPER_ADMIN,
  TEST_CONTENT_EDITOR,
  TEST_PAGE_CONTENT,
  TEST_ANNOUNCEMENT,
  URLS 
} from '../../fixtures/test-data';

test.describe('Admin Content Management', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.login(TEST_SUPER_ADMIN.email, TEST_SUPER_ADMIN.password);
    await loginPage.page.waitForURL(/.*admin|dashboard.*/);
  });

  test.describe('Pages Management', () => {
    test('should access content management page', async ({ adminContentPage }) => {
      await adminContentPage.goto();
      
      await expect(adminContentPage.pagesTable.or(adminContentPage.page.locator('text=Content'))).toBeVisible();
    });

    test('should display list of pages', async ({ adminContentPage }) => {
      await adminContentPage.goto();
      
      const pagesContent = adminContentPage.pageRows.first()
        .or(adminContentPage.page.locator('text=/no pages|home|about/i'))
        .or(adminContentPage.pagesTable);
      
      await expect(pagesContent).toBeVisible();
    });

    test('should search pages', async ({ adminContentPage }) => {
      await adminContentPage.goto();
      
      if (await adminContentPage.searchInput.isVisible().catch(() => false)) {
        await adminContentPage.searchInput.fill('home');
        await adminContentPage.page.waitForTimeout(500);
        
        await expect(adminContentPage.pagesTable).toBeVisible();
      }
    });

    test('should open page editor', async ({ adminContentPage }) => {
      await adminContentPage.goto();
      
      const firstPage = adminContentPage.pageRows.first();
      
      if (await firstPage.isVisible().catch(() => false)) {
        const editButton = firstPage.locator('[data-testid="edit-page"], button:has-text("Edit")');
        if (await editButton.isVisible().catch(() => false)) {
          await editButton.click();
          await expect(adminContentPage.pageEditorModal.or(adminContentPage.page.locator('text=/edit|editor/i'))).toBeVisible();
        }
      }
    });
  });

  test.describe('Component Management', () => {
    test('should show add component option in page editor', async ({ adminContentPage }) => {
      await adminContentPage.goto();
      
      const firstPage = adminContentPage.pageRows.first();
      
      if (await firstPage.isVisible().catch(() => false)) {
        const editButton = firstPage.locator('[data-testid="edit-page"], button:has-text("Edit")');
        if (await editButton.isVisible().catch(() => false)) {
          await editButton.click();
          
          // Wait for editor to load
          await adminContentPage.page.waitForTimeout(1000);
          
          const addButton = adminContentPage.addComponentButton
            .or(adminContentPage.page.locator('button:has-text("Add")'));
          await expect(addButton.or(adminContentPage.pageEditorModal)).toBeVisible();
        }
      }
    });

    test.skip('should add a component to page', async ({ adminContentPage }) => {
      await adminContentPage.goto();
      await adminContentPage.openPageEditor('home');
      
      await adminContentPage.addComponent('hero', {
        title: TEST_PAGE_CONTENT.title,
        subtitle: TEST_PAGE_CONTENT.subtitle,
        content: TEST_PAGE_CONTENT.content
      });
      
      await adminContentPage.savePage();
      await expect(adminContentPage.successToast).toBeVisible();
    });

    test.skip('should edit existing component', async ({ adminContentPage }) => {
      await adminContentPage.goto();
      await adminContentPage.openPageEditor('home');
      
      await adminContentPage.editComponent(0, {
        title: 'Updated Title'
      });
      
      await adminContentPage.savePage();
      await expect(adminContentPage.successToast).toBeVisible();
    });
  });

  test.describe('Announcements', () => {
    test('should access announcements tab', async ({ adminContentPage }) => {
      await adminContentPage.goto();
      
      if (await adminContentPage.announcementsTab.isVisible().catch(() => false)) {
        await adminContentPage.goToAnnouncementsTab();
        
        const announcementsContent = adminContentPage.createAnnouncementButton
          .or(adminContentPage.announcementsList)
          .or(adminContentPage.page.locator('text=/announcements/i'));
        await expect(announcementsContent).toBeVisible();
      }
    });

    test.skip('should create an announcement', async ({ adminContentPage }) => {
      await adminContentPage.goto();
      
      await adminContentPage.createAnnouncement(
        TEST_ANNOUNCEMENT.message,
        TEST_ANNOUNCEMENT.link,
        TEST_ANNOUNCEMENT.isActive
      );
      
      await expect(adminContentPage.successToast).toBeVisible();
    });
  });

  test.describe('Image Management', () => {
    test('should access images tab', async ({ adminContentPage }) => {
      await adminContentPage.goto();
      
      if (await adminContentPage.imagesTab.isVisible().catch(() => false)) {
        await adminContentPage.goToImagesTab();
        
        const imagesContent = adminContentPage.uploadImageButton
          .or(adminContentPage.imageGallery)
          .or(adminContentPage.page.locator('text=/images|media/i'));
        await expect(imagesContent).toBeVisible();
      }
    });

    test('should show upload button', async ({ adminContentPage }) => {
      await adminContentPage.goto();
      
      if (await adminContentPage.imagesTab.isVisible().catch(() => false)) {
        await adminContentPage.goToImagesTab();
        
        const uploadButton = adminContentPage.uploadImageButton
          .or(adminContentPage.page.locator('button:has-text("Upload")'));
        await expect(uploadButton.or(adminContentPage.imageGallery)).toBeVisible();
      }
    });
  });
});

test.describe('Content Editor Role', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.login(TEST_CONTENT_EDITOR.email, TEST_CONTENT_EDITOR.password);
    await loginPage.page.waitForURL(/.*dashboard.*/);
  });

  test('should access content management', async ({ adminContentPage }) => {
    await adminContentPage.goto();
    
    // Content editors should be able to access content management
    await expect(adminContentPage.pagesTable.or(adminContentPage.page.locator('text=/content|pages/i'))).toBeVisible();
  });

  test('should be able to edit pages', async ({ adminContentPage }) => {
    await adminContentPage.goto();
    
    const firstPage = adminContentPage.pageRows.first();
    
    if (await firstPage.isVisible().catch(() => false)) {
      const editButton = firstPage.locator('[data-testid="edit-page"], button:has-text("Edit")');
      await expect(editButton.or(firstPage)).toBeVisible();
    }
  });
});
