/**
 * API helper functions for direct backend calls in E2E tests.
 * Used for seeding data, cleanup, and test setup/teardown.
 */
import { APIRequestContext } from '@playwright/test';
import { TEST_SUPER_ADMIN } from './test-data';

const API_BASE =
  process.env.API_BASE_URL ||
  'https://n4vi400a5e.execute-api.ap-south-1.amazonaws.com/prod/api/v1';

/**
 * Authenticate as Super Admin and return JWT access token.
 */
export async function getAdminToken(request: APIRequestContext): Promise<string> {
  const resp = await request.post(`${API_BASE}/auth/login`, {
    data: {
      email: TEST_SUPER_ADMIN.email,
      password: TEST_SUPER_ADMIN.password,
    },
  });
  if (!resp.ok()) {
    throw new Error(`Login failed: ${resp.status()} ${await resp.text()}`);
  }
  const body = await resp.json();
  // Backend JWT guard validates the idToken (Cognito), not the accessToken
  const token =
    body.idToken || body.accessToken || body.token || body.data?.idToken || body.data?.accessToken;
  if (!token) {
    throw new Error(`No token in login response: ${JSON.stringify(body)}`);
  }
  return token;
}

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

// ─── Products ────────────────────────────────────────────────

export interface CreateProductData {
  title: string;
  titleHi?: string;
  subtitle?: string;
  subtitleHi?: string;
  description: string;
  descriptionHi?: string;
  price: number;
  originalPrice?: number;
  categoryId: string;
  slug?: string; // Not sent to API — used locally for tracking/identification
  images?: string[];
  stockStatus?: 'in_stock' | 'out_of_stock' | 'limited';
  tags?: string[];
  isFeatured?: boolean;
  isActive?: boolean;
}

export async function createProduct(
  request: APIRequestContext,
  token: string,
  data: CreateProductData,
) {
  // Strip slug (local-only field) before sending to API
  const { slug, ...apiData } = data;
  const resp = await request.post(`${API_BASE}/products`, {
    headers: authHeaders(token),
    data: apiData,
  });
  if (!resp.ok()) {
    const text = await resp.text();
    console.warn(`Failed to create product "${data.slug}": ${resp.status()} ${text}`);
    return null;
  }
  return resp.json();
}

export async function deleteProduct(
  request: APIRequestContext,
  token: string,
  productId: string,
) {
  const resp = await request.delete(`${API_BASE}/products/${productId}`, {
    headers: authHeaders(token),
  });
  return resp.ok();
}

export async function getProductBySlug(
  request: APIRequestContext,
  slug: string,
) {
  const resp = await request.get(`${API_BASE}/products/public/slug/${slug}`);
  if (!resp.ok()) return null;
  return resp.json();
}

// ─── CMS Pages ───────────────────────────────────────────────

export async function createCMSPage(
  request: APIRequestContext,
  token: string,
  data: { title: string; titleHi?: string; slug: string; status?: string },
) {
  // CMS API expects title as localized object { en, hi }, not flat strings
  const apiData: Record<string, unknown> = {
    slug: data.slug,
    title: { en: data.title, ...(data.titleHi ? { hi: data.titleHi } : {}) },
    status: data.status || 'published',
  };
  const resp = await request.post(`${API_BASE}/cms/pages`, {
    headers: authHeaders(token),
    data: apiData,
  });
  if (!resp.ok()) {
    console.warn(`Failed to create CMS page: ${resp.status()} ${await resp.text()}`);
    return null;
  }
  return resp.json();
}

export async function deleteCMSPage(
  request: APIRequestContext,
  token: string,
  pageId: string,
) {
  const resp = await request.delete(`${API_BASE}/cms/pages/${pageId}`, {
    headers: authHeaders(token),
  });
  return resp.ok();
}

export async function listCMSPages(
  request: APIRequestContext,
  token: string,
) {
  const resp = await request.get(`${API_BASE}/cms/pages`, {
    headers: authHeaders(token),
  });
  if (!resp.ok()) return { items: [] };
  return resp.json();
}

// ─── CMS Components ─────────────────────────────────────────

export async function createCMSComponent(
  request: APIRequestContext,
  token: string,
  data: {
    pageId: string;
    componentType: string;
    name: string;
    nameHi?: string;
    fields?: Record<string, unknown>[];
    isVisible?: boolean;
    order?: number;
  },
) {
  // CMS API expects name as localized object { en, hi }, not flat strings
  const apiData: Record<string, unknown> = {
    pageId: data.pageId,
    componentType: data.componentType,
    name: { en: data.name, ...(data.nameHi ? { hi: data.nameHi } : {}) },
    isVisible: data.isVisible ?? true,
  };
  if (data.fields) apiData.fields = data.fields;
  // Note: 'order' is not accepted by the API
  const resp = await request.post(`${API_BASE}/cms/components`, {
    headers: authHeaders(token),
    data: apiData,
  });
  if (!resp.ok()) {
    console.warn(`Failed to create CMS component: ${resp.status()} ${await resp.text()}`);
    return null;
  }
  return resp.json();
}

export async function deleteCMSComponent(
  request: APIRequestContext,
  token: string,
  componentId: string,
) {
  const resp = await request.delete(`${API_BASE}/cms/components/${componentId}`, {
    headers: authHeaders(token),
  });
  return resp.ok();
}

// ─── Cart ────────────────────────────────────────────────────

export async function clearCart(
  request: APIRequestContext,
  token: string,
) {
  const resp = await request.delete(`${API_BASE}/cart`, {
    headers: authHeaders(token),
  });
  return resp.ok();
}

export async function addToCart(
  request: APIRequestContext,
  token: string,
  productId: string,
  quantity = 1,
) {
  const resp = await request.post(`${API_BASE}/cart/items`, {
    headers: authHeaders(token),
    data: { productId, quantity },
  });
  return resp.ok();
}

// ─── Orders ─────────────────────────────────────────────────

export async function initiateCheckout(
  request: APIRequestContext,
  token: string,
) {
  const resp = await request.post(`${API_BASE}/orders/checkout`, {
    headers: authHeaders(token),
  });
  if (!resp.ok()) {
    const text = await resp.text();
    console.warn(`Checkout failed: ${resp.status()} ${text}`);
    return null;
  }
  return resp.json();
}

export async function verifyOrderPayment(
  request: APIRequestContext,
  token: string,
  data: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    orderId: string;
  },
) {
  const resp = await request.post(`${API_BASE}/orders/verify-payment`, {
    headers: authHeaders(token),
    data,
  });
  if (!resp.ok()) {
    const text = await resp.text();
    console.warn(`Payment verification failed: ${resp.status()} ${text}`);
    return null;
  }
  return resp.json();
}

export async function fetchOrders(
  request: APIRequestContext,
  token: string,
) {
  const resp = await request.get(`${API_BASE}/orders`, {
    headers: authHeaders(token),
  });
  if (!resp.ok()) return [];
  return resp.json();
}

export async function fetchOrderById(
  request: APIRequestContext,
  token: string,
  orderId: string,
) {
  const resp = await request.get(`${API_BASE}/orders/${orderId}`, {
    headers: authHeaders(token),
  });
  if (!resp.ok()) return null;
  return resp.json();
}

export async function updateAddress(
  request: APIRequestContext,
  token: string,
  address: {
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
    country?: string;
  },
) {
  const resp = await request.put(`${API_BASE}/cart/address`, {
    headers: authHeaders(token),
    data: address,
  });
  return resp.ok();
}
