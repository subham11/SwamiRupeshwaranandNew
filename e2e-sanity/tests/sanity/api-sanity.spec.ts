// tests/sanity/api-sanity.spec.ts
// API-level sanity tests against production backend

import { test, expect } from '@playwright/test';

const api = process.env.API_URL || 'https://n4vi400a5e.execute-api.ap-south-1.amazonaws.com/prod/api/v1';

// ─────────────────────────────────────────────────────────────────────────────
// Public Endpoints (no auth required)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('API Sanity — Health & Infrastructure', () => {

  test('GET /health returns OK', async ({ request }) => {
    const res = await request.get(`${api}/health`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.status).toBe('ok');
    console.log(`  → Service: ${body.service}, Version: ${body.version}`);
  });
});

test.describe('API Sanity — Products (Public)', () => {

  test('GET /products/public returns product list', async ({ request }) => {
    const res = await request.get(`${api}/products/public`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.items).toBeDefined();
    expect(body.items.length).toBeGreaterThan(0);
    const p = body.items[0];
    expect(p.id).toBeDefined();
    expect(p.title).toBeDefined();
    expect(p.price).toBeDefined();
    console.log(`  → Found ${body.items.length} products, first: "${p.title}"`);
  });

  test('GET /products/public?limit=3 respects limit', async ({ request }) => {
    const res = await request.get(`${api}/products/public?limit=3`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.items.length).toBeLessThanOrEqual(3);
  });

  test('GET /products/public/featured returns featured products', async ({ request }) => {
    const res = await request.get(`${api}/products/public/featured`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.items).toBeDefined();
    console.log(`  → Featured products: ${body.items.length}`);
  });

  test('GET /products/public/categories returns categories', async ({ request }) => {
    const res = await request.get(`${api}/products/public/categories`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.items).toBeDefined();
    expect(body.items.length).toBeGreaterThan(0);
    const cat = body.items[0];
    expect(cat.name).toBeDefined();
    expect(cat.slug).toBeDefined();
    console.log(`  → Categories: ${body.items.map((c: any) => c.name).join(', ')}`);
  });

  test('GET /products/public/category/:slug returns filtered products', async ({ request }) => {
    // First get categories
    const catRes = await request.get(`${api}/products/public/categories`);
    const cats = await catRes.json();
    const slug = cats.items?.[0]?.slug;
    if (!slug) { test.skip(); return; }

    const res = await request.get(`${api}/products/public/category/${slug}`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.items).toBeDefined();
    expect(body.items.length).toBeGreaterThan(0);
    console.log(`  → Category "${slug}": ${body.count} products`);
  });

  test('GET /products/public/:slug returns product detail', async ({ request }) => {
    // Get first product to find a slug
    const listRes = await request.get(`${api}/products/public?limit=1`);
    const list = await listRes.json();
    const slug = list.items?.[0]?.slug;
    if (!slug) { test.skip(); return; }

    const res = await request.get(`${api}/products/public/${slug}`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.title || body.item?.title).toBeDefined();
    console.log(`  → Product detail: "${body.title || body.item?.title}"`);
  });

  test('Products have bilingual fields (titleHi)', async ({ request }) => {
    const res = await request.get(`${api}/products/public?limit=5`);
    const body = await res.json();
    const withHindi = body.items.filter((p: any) => p.titleHi);
    console.log(`  → ${withHindi.length}/${body.items.length} products have Hindi titles`);
    expect(withHindi.length).toBeGreaterThan(0);
  });
});

test.describe('API Sanity — Search', () => {

  test('GET /search?q=meditation returns results', async ({ request }) => {
    const res = await request.get(`${api}/search?q=meditation`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.products).toBeDefined();
    expect(body.events).toBeDefined();
    expect(body.pages).toBeDefined();
    console.log(`  → Results: ${body.products.length} products, ${body.events.length} events, ${body.pages.length} pages`);
  });

  test('GET /search?q=ध्यान&locale=hi returns Hindi results', async ({ request }) => {
    const res = await request.get(`${api}/search?q=ध्यान&locale=hi`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    const total = (body.products?.length || 0) + (body.events?.length || 0) + (body.pages?.length || 0);
    console.log(`  → Hindi search results: ${total} total`);
  });

  test('GET /search?q=xyz123 returns empty results gracefully', async ({ request }) => {
    const res = await request.get(`${api}/search?q=xyz123nonexistent`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.totalResults).toBe(0);
  });

  test('Search requires no authentication', async ({ request }) => {
    const res = await request.get(`${api}/search?q=test`);
    expect(res.ok()).toBeTruthy();
  });
});

test.describe('API Sanity — Auth Endpoints', () => {

  test('POST /auth/otp/request works for valid email', async ({ request }) => {
    const res = await request.post(`${api}/auth/otp/request`, {
      data: { email: 'subham11@gmail.com' },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.success).toBe(true);
    console.log(`  → OTP request: ${body.message}`);
  });

  test('POST /auth/login with wrong password returns 401', async ({ request }) => {
    const res = await request.post(`${api}/auth/login`, {
      data: { email: 'subham11@gmail.com', password: 'WrongPassword123!' },
    });
    expect(res.status()).toBeGreaterThanOrEqual(400);
    expect(res.status()).toBeLessThan(500);
  });

  test('GET /auth/profile without token returns 401', async ({ request }) => {
    const res = await request.get(`${api}/auth/profile`);
    expect(res.status()).toBe(401);
  });

  test('GET /cart without token returns 401', async ({ request }) => {
    const res = await request.get(`${api}/cart`);
    expect(res.status()).toBe(401);
  });

  test('GET /orders without token returns 401', async ({ request }) => {
    const res = await request.get(`${api}/orders`);
    expect(res.status()).toBe(401);
  });

  test('GET /wishlist without token returns 401', async ({ request }) => {
    const res = await request.get(`${api}/wishlist`);
    expect(res.status()).toBe(401);
  });
});

test.describe('API Sanity — Events', () => {

  test('GET /events returns event list', async ({ request }) => {
    const res = await request.get(`${api}/events`);
    expect(res.status()).toBeLessThan(500);
    if (res.ok()) {
      const body = await res.json();
      console.log(`  → Events found: ${body.items?.length || body.data?.length || 0}`);
    }
  });
});

test.describe('API Sanity — CMS / Content', () => {

  test('GET /content/pages returns CMS pages', async ({ request }) => {
    const res = await request.get(`${api}/content/pages`);
    expect(res.status()).toBeLessThan(500);
    if (res.ok()) {
      const body = await res.json();
      console.log(`  → CMS pages: ${body.items?.length || body.data?.length || 0}`);
    }
  });
});

test.describe('API Sanity — Subscriptions', () => {

  test('GET /subscriptions/plans returns subscription plans', async ({ request }) => {
    const res = await request.get(`${api}/subscriptions/plans`);
    expect(res.status()).toBeLessThan(500);
    if (res.ok()) {
      const body = await res.json();
      console.log(`  → Plans: ${JSON.stringify(body).substring(0, 200)}`);
    }
  });
});

test.describe('API Sanity — Response Format Validation', () => {

  test('Products response has proper structure', async ({ request }) => {
    const res = await request.get(`${api}/products/public?limit=1`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    // Validate response schema
    expect(body).toHaveProperty('items');
    if (body.items.length > 0) {
      const p = body.items[0];
      expect(p).toHaveProperty('id');
      expect(p).toHaveProperty('title');
      expect(p).toHaveProperty('price');
      expect(typeof p.price).toBe('number');
      expect(typeof p.title).toBe('string');
    }
  });

  test('Categories response has proper structure', async ({ request }) => {
    const res = await request.get(`${api}/products/public/categories`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toHaveProperty('items');
    if (body.items.length > 0) {
      const c = body.items[0];
      expect(c).toHaveProperty('id');
      expect(c).toHaveProperty('name');
      expect(c).toHaveProperty('slug');
    }
  });

  test('Search response has proper structure', async ({ request }) => {
    const res = await request.get(`${api}/search?q=test`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toHaveProperty('products');
    expect(body).toHaveProperty('events');
    expect(body).toHaveProperty('pages');
    expect(body).toHaveProperty('totalResults');
    expect(Array.isArray(body.products)).toBeTruthy();
    expect(Array.isArray(body.events)).toBeTruthy();
    expect(Array.isArray(body.pages)).toBeTruthy();
  });

  test('Health response has proper structure', async ({ request }) => {
    const res = await request.get(`${api}/health`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toHaveProperty('status');
    expect(body).toHaveProperty('timestamp');
    expect(body).toHaveProperty('service');
  });
});
