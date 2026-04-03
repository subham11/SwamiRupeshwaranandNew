// tests/setup/global.setup.ts
// Seeds 30 products across 6 categories via API before tests run

import { test as setup, expect } from '@playwright/test';
import { API_URL } from '../../playwright.config';
import { TEST_USERS } from '../../fixtures';

const CATEGORIES = [
  { name: 'Books',       nameHi: 'पुस्तकें',   slug: 'books' },
  { name: 'Courses',     nameHi: 'पाठ्यक्रम',  slug: 'courses' },
  { name: 'Retreats',    nameHi: 'रिट्रीट',    slug: 'retreats' },
  { name: 'Astrology',   nameHi: 'ज्योतिष',   slug: 'astrology' },
  { name: 'Classes',     nameHi: 'कक्षाएं',   slug: 'classes' },
  { name: 'Satsang',     nameHi: 'सत्संग',    slug: 'satsang' },
];

setup('seed: authenticate as admin', async ({ request }) => {
  const res = await request.post(`${API_URL}/auth/login`, {
    data: { email: TEST_USERS.admin.email, password: TEST_USERS.admin.password },
  });
  expect(res.ok(), `Admin login failed: ${await res.text()}`).toBeTruthy();
  const { accessToken } = await res.json();

  // ── Create categories ──────────────────────────────────────────────────────
  const categoryIds: Record<string, string> = {};

  for (const cat of CATEGORIES) {
    let attempt = 0;
    while (attempt < 3) {
      try {
        const r = await request.post(`${API_URL}/categories`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          data: { ...cat, description: `${cat.name} category`, descriptionHi: `${cat.nameHi} विवरण` },
        });
        if (r.ok() || r.status() === 409) { // 409 = already exists
          const body = await r.json();
          categoryIds[cat.slug] = body.id || body.data?.id;
          break;
        }
      } catch {
        await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000));
      }
      attempt++;
    }
  }

  // ── Seed 30 products (5 per category) ─────────────────────────────────────
  const stocks = ['in_stock', 'in_stock', 'in_stock', 'limited', 'out_of_stock'];
  const catSlugs = Object.keys(categoryIds);

  for (let i = 0; i < 30; i++) {
    const catSlug = catSlugs[Math.floor(i / 5)];
    const price   = 100 + (i * 50);
    const product = {
      title:         `Test ${catSlug} Product ${i + 1}`,
      titleHi:       `टेस्ट ${catSlug} प्रोडक्ट ${i + 1}`,
      description:   `Description for test product ${i + 1}`,
      descriptionHi: `टेस्ट प्रोडक्ट ${i + 1} का विवरण`,
      price,
      originalPrice: price + 200,
      slug:          `test-${catSlug}-${i + 1}-${Date.now()}`,
      categoryId:    categoryIds[catSlug],
      stockStatus:   stocks[i % 5],
      isFeatured:    i % 5 === 0,
      isActive:      true,
      tags:          ['test', 'sanity', catSlug],
    };

    let attempt = 0;
    while (attempt < 3) {
      try {
        const r = await request.post(`${API_URL}/products`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          data: product,
        });
        if (r.ok()) break;
      } catch {
        await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000));
      }
      attempt++;
    }
  }

  // ── Create test subscription plans ────────────────────────────────────────
  const plans = [
    { name: 'Free',    price: 0,    interval: 'monthly', features: ['Basic Access'] },
    { name: 'Silver',  price: 299,  interval: 'monthly', features: ['Silver Content', 'Newsletter'] },
    { name: 'Gold',    price: 699,  interval: 'monthly', features: ['Gold Content', 'Downloads'] },
    { name: 'Diamond', price: 1499, interval: 'monthly', features: ['All Access', 'Live Sessions'] },
  ];

  for (const plan of plans) {
    await request.post(`${API_URL}/subscription-plans`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: plan,
    }).catch(() => {}); // ignore if already exists
  }

  console.log('✅ Global seed complete: 6 categories, 30 products, 4 plans');
});
