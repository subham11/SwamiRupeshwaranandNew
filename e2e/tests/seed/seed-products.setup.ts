/**
 * Playwright setup: Seed 30 test products across 6 categories.
 * Runs before all browser tests. Products are tracked for cleanup.
 */
import { test as setup } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { getAdminToken, createProduct, getProductBySlug } from '../../fixtures/api-helpers';
import { SEED_PRODUCTS, E2E_SLUG_PREFIX } from '../../fixtures/seed-data';

const SEED_FILE = path.join(__dirname, '../../fixtures/.seed/created-products.json');

setup('seed test products', async ({ request }) => {
  console.log(`\n🌱 Seeding ${SEED_PRODUCTS.length} test products...`);

  // Get admin token
  const token = await getAdminToken(request);
  console.log('✅ Authenticated as Super Admin');

  const createdProducts: { id: string; slug: string }[] = [];
  let skipped = 0;
  let created = 0;
  let failed = 0;

  for (const productData of SEED_PRODUCTS) {
    // Check if product already exists
    const existing = await getProductBySlug(request, productData.slug);
    if (existing && existing.id) {
      console.log(`  ⏭️  Skipping (exists): ${productData.slug}`);
      createdProducts.push({ id: existing.id, slug: productData.slug });
      skipped++;
      continue;
    }

    const result = await createProduct(request, token, productData);
    if (result && result.id) {
      console.log(`  ✅ Created: ${productData.slug} (${result.id})`);
      createdProducts.push({ id: result.id, slug: productData.slug });
      created++;
    } else {
      console.log(`  ❌ Failed: ${productData.slug}`);
      failed++;
    }
  }

  // Save created product IDs for teardown
  const seedDir = path.dirname(SEED_FILE);
  if (!fs.existsSync(seedDir)) {
    fs.mkdirSync(seedDir, { recursive: true });
  }
  fs.writeFileSync(SEED_FILE, JSON.stringify(createdProducts, null, 2));

  console.log(`\n🌱 Seed complete: ${created} created, ${skipped} skipped, ${failed} failed`);
  console.log(`📄 Saved ${createdProducts.length} product IDs to ${SEED_FILE}\n`);
});
