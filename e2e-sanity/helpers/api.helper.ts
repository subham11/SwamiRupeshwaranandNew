// helpers/api.helper.ts
// Reusable API-level utilities for test setup and assertions

import { APIRequestContext } from '@playwright/test';
import { API_URL } from '../playwright.config';
import { TEST_USERS } from '../fixtures';

// ─────────────────────────────────────────────────────────────────────────────
// Auth
// ─────────────────────────────────────────────────────────────────────────────

export async function getAdminToken(request: APIRequestContext): Promise<string> {
  const res = await request.post(`${API_URL}/auth/login`, {
    data: {
      email:    process.env.ADMIN_EMAIL    || TEST_USERS.admin.email,
      password: process.env.ADMIN_PASSWORD || TEST_USERS.admin.password,
    },
  });
  if (!res.ok()) throw new Error(`Admin login failed: ${res.status()} ${await res.text()}`);
  return (await res.json()).accessToken;
}

export async function getUserToken(request: APIRequestContext): Promise<string> {
  const res = await request.post(`${API_URL}/auth/login`, {
    data: {
      email:    process.env.USER_EMAIL    || TEST_USERS.user.email,
      password: process.env.USER_PASSWORD || TEST_USERS.user.password,
    },
  });
  if (!res.ok()) throw new Error(`User login failed: ${res.status()} ${await res.text()}`);
  return (await res.json()).accessToken;
}

export function adminHeaders(token: string) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

// ─────────────────────────────────────────────────────────────────────────────
// Products
// ─────────────────────────────────────────────────────────────────────────────

export async function createTestProduct(
  request: APIRequestContext,
  token: string,
  overrides: Record<string, unknown> = {}
): Promise<string> {
  const slug = `sanity-product-${Date.now()}`;
  const res  = await request.post(`${API_URL}/products`, {
    headers: adminHeaders(token),
    data: {
      title:         'Sanity API Product',
      titleHi:       'सैनिटी API प्रोडक्ट',
      description:   'Auto-created for E2E testing',
      price:         299,
      originalPrice: 499,
      slug,
      stockStatus:   'in_stock',
      isActive:      true,
      isFeatured:    false,
      ...overrides,
    },
  });
  const body = await res.json();
  return body.id ?? body.data?.id;
}

export async function deleteProduct(
  request: APIRequestContext,
  token: string,
  productId: string
): Promise<void> {
  await request.delete(`${API_URL}/products/${productId}`, {
    headers: adminHeaders(token),
  }).catch(() => {});
}

export async function getFirstActiveProductId(
  request: APIRequestContext
): Promise<string | null> {
  const res  = await request.get(`${API_URL}/products?limit=1&isActive=true`);
  const body = await res.json();
  return body.data?.[0]?.id ?? null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Coupons
// ─────────────────────────────────────────────────────────────────────────────

export async function createActiveCoupon(
  request: APIRequestContext,
  token: string,
  overrides: Record<string, unknown> = {}
): Promise<string> {
  const code = `SANITY${Date.now()}`;
  await request.post(`${API_URL}/coupons`, {
    headers: adminHeaders(token),
    data: {
      code,
      type:         'percentage',
      value:        10,
      minOrderAmount: 0,
      maxDiscount:  500,
      usageLimit:   100,
      expiryDate:   new Date(Date.now() + 7 * 86_400_000).toISOString(),
      ...overrides,
    },
  });
  return code;
}

// ─────────────────────────────────────────────────────────────────────────────
// Orders
// ─────────────────────────────────────────────────────────────────────────────

export async function getFirstPaidOrderId(
  request: APIRequestContext,
  token: string
): Promise<string | null> {
  const res  = await request.get(`${API_URL}/orders?status=paid&limit=1`, {
    headers: adminHeaders(token),
  });
  const body = await res.json();
  return body.data?.[0]?.id ?? null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Cart (via API for setup)
// ─────────────────────────────────────────────────────────────────────────────

export async function addToCartViaApi(
  request: APIRequestContext,
  userToken: string,
  productId: string,
  quantity = 1
): Promise<void> {
  await request.post(`${API_URL}/cart/items`, {
    headers: adminHeaders(userToken),
    data: { productId, quantity },
  });
}

export async function clearCartViaApi(
  request: APIRequestContext,
  userToken: string
): Promise<void> {
  await request.delete(`${API_URL}/cart`, {
    headers: adminHeaders(userToken),
  }).catch(() => {});
}

// ─────────────────────────────────────────────────────────────────────────────
// Retry wrapper
// ─────────────────────────────────────────────────────────────────────────────

export async function withRetry<T>(
  fn: () => Promise<T>,
  attempts = 3,
  delayMs  = 1000
): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (i < attempts - 1) {
        await new Promise(r => setTimeout(r, delayMs * Math.pow(2, i)));
      }
    }
  }
  throw lastError;
}
