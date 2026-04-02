/**
 * Playwright teardown: Remove all seeded test products.
 * Runs after all browser tests complete.
 */
import { test as teardown } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { getAdminToken, deleteProduct } from '../../fixtures/api-helpers';

const SEED_FILE = path.join(__dirname, '../../fixtures/.seed/created-products.json');

teardown('cleanup test products', async ({ request }) => {
  // Check if we should skip cleanup
  if (process.env.E2E_SKIP_CLEANUP === 'true') {
    console.log('⏭️  Skipping cleanup (E2E_SKIP_CLEANUP=true)');
    return;
  }

  if (!fs.existsSync(SEED_FILE)) {
    console.log('⏭️  No seed file found, nothing to clean up');
    return;
  }

  const products: { id: string; slug: string }[] = JSON.parse(
    fs.readFileSync(SEED_FILE, 'utf-8'),
  );

  if (products.length === 0) {
    console.log('⏭️  No products to clean up');
    return;
  }

  console.log(`\n🧹 Cleaning up ${products.length} test products...`);

  const token = await getAdminToken(request);
  let deleted = 0;
  let failed = 0;

  for (const product of products) {
    const success = await deleteProduct(request, token, product.id);
    if (success) {
      console.log(`  ✅ Deleted: ${product.slug}`);
      deleted++;
    } else {
      console.log(`  ❌ Failed to delete: ${product.slug} (${product.id})`);
      failed++;
    }
  }

  // Remove the seed file
  fs.unlinkSync(SEED_FILE);

  console.log(`\n🧹 Cleanup complete: ${deleted} deleted, ${failed} failed\n`);
});
