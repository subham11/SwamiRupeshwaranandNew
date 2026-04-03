// tests/setup/global.teardown.ts
// Cleans up all test data created during the sanity suite

import { test as teardown } from '@playwright/test';
import { API_URL } from '../../playwright.config';
import { TEST_USERS } from '../../fixtures';

teardown('teardown: delete all seeded test data', async ({ request }) => {
  // Authenticate as admin
  const loginRes = await request.post(`${API_URL}/auth/login`, {
    data: { email: TEST_USERS.admin.email, password: TEST_USERS.admin.password },
  });

  if (!loginRes.ok()) {
    console.warn('⚠️  Teardown: Could not authenticate as admin. Skipping cleanup.');
    return;
  }

  const { accessToken } = await loginRes.json();
  const headers = { Authorization: `Bearer ${accessToken}` };

  // ── Delete test products ────────────────────────────────────────────────────
  try {
    const productsRes = await request.get(`${API_URL}/products?q=test&limit=50`, { headers });
    if (productsRes.ok()) {
      const { data } = await productsRes.json();
      for (const product of (data ?? [])) {
        if (product.title?.toLowerCase().includes('test') ||
            product.slug?.startsWith('test-')) {
          await request.delete(`${API_URL}/products/${product.id}`, { headers }).catch(() => {});
        }
      }
    }
  } catch { console.warn('⚠️  Teardown: Could not delete test products'); }

  // ── Delete test categories ──────────────────────────────────────────────────
  try {
    const catsRes = await request.get(`${API_URL}/categories`, { headers });
    if (catsRes.ok()) {
      const cats = await catsRes.json();
      for (const cat of (cats.data ?? cats ?? [])) {
        if (cat.name?.toLowerCase().includes('sanity') ||
            cat.slug?.includes('sanity')) {
          await request.delete(`${API_URL}/categories/${cat.id}`, { headers }).catch(() => {});
        }
      }
    }
  } catch { console.warn('⚠️  Teardown: Could not delete test categories'); }

  // ── Delete test CMS pages ───────────────────────────────────────────────────
  try {
    const pagesRes = await request.get(`${API_URL}/cms/pages?q=sanity&limit=20`, { headers });
    if (pagesRes.ok()) {
      const { data } = await pagesRes.json();
      for (const pg of (data ?? [])) {
        if (pg.slug?.includes('sanity') || pg.title?.toLowerCase().includes('sanity')) {
          await request.delete(`${API_URL}/cms/pages/${pg.id}`, { headers }).catch(() => {});
        }
      }
    }
  } catch { console.warn('⚠️  Teardown: Could not delete test CMS pages'); }

  // ── Delete test coupons ─────────────────────────────────────────────────────
  try {
    const couponsRes = await request.get(`${API_URL}/coupons?limit=50`, { headers });
    if (couponsRes.ok()) {
      const { data } = await couponsRes.json();
      for (const coupon of (data ?? [])) {
        if (/^(TEST|SANITY|PCT|FLAT|EXP|DUP)\d+$/i.test(coupon.code ?? '')) {
          await request.delete(`${API_URL}/coupons/${coupon.id}`, { headers }).catch(() => {});
        }
      }
    }
  } catch { console.warn('⚠️  Teardown: Could not delete test coupons'); }

  // ── Delete test events ──────────────────────────────────────────────────────
  try {
    const eventsRes = await request.get(`${API_URL}/events?q=Sanity&limit=20`, { headers });
    if (eventsRes.ok()) {
      const { data } = await eventsRes.json();
      for (const ev of (data ?? [])) {
        if (ev.title?.includes('Sanity')) {
          await request.delete(`${API_URL}/events/${ev.id}`, { headers }).catch(() => {});
        }
      }
    }
  } catch { console.warn('⚠️  Teardown: Could not delete test events'); }

  // ── Clean newsletter test subscribers ──────────────────────────────────────
  try {
    const nlRes = await request.get(`${API_URL}/newsletter/subscribers?limit=50`, { headers });
    if (nlRes.ok()) {
      const { data } = await nlRes.json();
      for (const sub of (data ?? [])) {
        if (sub.email?.includes('sanity_') && sub.email?.includes('@testmail.com')) {
          await request.delete(`${API_URL}/newsletter/subscribers/${sub.id}`, { headers }).catch(() => {});
        }
      }
    }
  } catch { console.warn('⚠️  Teardown: Could not clean newsletter subscribers'); }

  console.log('✅ Teardown complete');
});
