/**
 * API Client for Backend Communication
 * 
 * Handles all API calls to the backend server.
 * - In development: Calls local backend (http://localhost:2026)
 * - In production: Calls API Gateway endpoint
 */

import type { AppLocale } from "@/i18n/config";

// API Configuration
const _rawApiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:2026";
const API_BASE_URL = `${_rawApiUrl.replace(/\/api\/v1\/?$/, '')}/api/v1`;

// Request timeout (10 seconds)
const REQUEST_TIMEOUT = 10000;

/**
 * Custom fetch with timeout and error handling
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout = REQUEST_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * API Error class for standardized error handling
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Try to refresh the access token using the stored refresh token.
 * Returns the new token or null on failure.
 */
let _refreshPromise: Promise<string | null> | null = null;

async function tryRefreshToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  if (_refreshPromise) return _refreshPromise;

  _refreshPromise = (async () => {
    const refreshToken = localStorage.getItem("auth_refresh_token");
    if (!refreshToken) return null;

    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (data.accessToken && data.refreshToken) {
        const authToken = data.idToken || data.accessToken;
        localStorage.setItem("auth_access_token", authToken);
        localStorage.setItem("auth_refresh_token", data.refreshToken);
        // Notify React state (useAuth) about the refreshed token
        window.dispatchEvent(new CustomEvent("auth_token_refreshed", {
          detail: { accessToken: authToken, refreshToken: data.refreshToken },
        }));
        return authToken as string;
      }
      return null;
    } catch {
      return null;
    } finally {
      _refreshPromise = null;
    }
  })();

  return _refreshPromise;
}

/**
 * Get the freshest access token from localStorage.
 * This avoids stale tokens held in React state after Cognito ID tokens expire (1 hr).
 */
function getFreshAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("auth_access_token");
}

/**
 * Build headers for an API request, injecting the freshest token from localStorage.
 * Any Authorization header passed by the caller is replaced with the fresh one.
 */
function buildHeaders(callerHeaders?: HeadersInit): Record<string, string> {
  const merged: Record<string, string> = {};
  if (callerHeaders) {
    if (callerHeaders instanceof Headers) {
      callerHeaders.forEach((v, k) => { merged[k] = v; });
    } else if (Array.isArray(callerHeaders)) {
      callerHeaders.forEach(([k, v]) => { merged[k] = v; });
    } else {
      Object.assign(merged, callerHeaders);
    }
  }
  // Always use the freshest token from localStorage
  const token = getFreshAccessToken();
  if (token) {
    merged["Authorization"] = `Bearer ${token}`;
  }
  return merged;
}

/**
 * Generic API request handler with automatic 401 retry via token refresh.
 * Always uses the freshest token from localStorage (not stale React state).
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  try {
    // Use fresh token for the initial request
    const freshOptions = { ...options, headers: buildHeaders(options.headers) };
    const response = await fetchWithTimeout(url, freshOptions);

    // On 401, attempt token refresh and retry once
    if (response.status === 401 && typeof window !== "undefined") {
      const newToken = await tryRefreshToken();
      if (newToken) {
        const retryHeaders = buildHeaders(options.headers);
        retryHeaders["Authorization"] = `Bearer ${newToken}`;

        const retryResponse = await fetchWithTimeout(url, {
          ...options,
          headers: retryHeaders,
        });

        if (!retryResponse.ok) {
          const errorData = await retryResponse.json().catch(() => ({}));
          throw new ApiError(
            errorData.message || `HTTP error ${retryResponse.status}`,
            retryResponse.status,
            errorData.code
          );
        }
        return retryResponse.json();
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.message || `HTTP error ${response.status}`,
        response.status,
        errorData.code
      );
    }

    return response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (error instanceof Error && error.name === "AbortError") {
      throw new ApiError("Request timeout", 408, "TIMEOUT");
    }
    throw new ApiError(
      error instanceof Error ? error.message : "Network error",
      0,
      "NETWORK_ERROR"
    );
  }
}

// ============================================
// Page Content API
// ============================================

export interface PageContentResponse<T = unknown> {
  success: boolean;
  data: T;
  locale: AppLocale;
  pageId: string;
  updatedAt: string;
}

/**
 * Fetch page content by page ID
 */
export async function fetchPageContent<T = unknown>(
  pageId: string,
  locale: AppLocale
): Promise<PageContentResponse<T>> {
  return apiRequest<PageContentResponse<T>>(
    `/content/pages/${pageId}?locale=${locale}`
  );
}

/**
 * Fetch all pages list (for sitemap/navigation)
 */
export async function fetchPagesList(): Promise<{
  pages: Array<{ pageId: string; slug: string; title: { en: string; hi: string } }>;
}> {
  return apiRequest("/content/pages");
}

// ============================================
// Events API
// ============================================

export interface EventItem {
  id: string;
  slug: string;
  title: { en: string; hi: string };
  description: { en: string; hi: string };
  location: { en: string; hi: string };
  startAt: string;
  endAt?: string;
  heroImage?: string;
  status: "upcoming" | "past" | "cancelled";
}

/**
 * Fetch events list
 */
export async function fetchEvents(
  locale: AppLocale,
  status?: "upcoming" | "past"
): Promise<{ events: EventItem[] }> {
  const statusParam = status ? `&status=${status}` : "";
  return apiRequest(`/events?locale=${locale}${statusParam}`);
}

/**
 * Fetch single event by slug
 */
export async function fetchEventBySlug(
  slug: string,
  locale: AppLocale
): Promise<{ event: EventItem }> {
  return apiRequest(`/events/${slug}?locale=${locale}`);
}

/**
 * Fetch all events for admin (with auth)
 */
export async function fetchAllEventsAdmin(accessToken: string): Promise<{ items: EventItem[]; count: number }> {
  return apiRequest("/events?limit=500", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

/**
 * Create a new event (Editor+)
 */
export async function createEvent(
  data: {
    title: string;
    description: string;
    startDate: string;
    endDate?: string;
    location: string;
    venue?: string;
    image?: string;
    registrationUrl?: string;
    maxParticipants?: number;
    status?: string;
    locale?: string;
  },
  accessToken: string
): Promise<EventItem> {
  return apiRequest("/events", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(data),
  });
}

/**
 * Update an event (Editor+)
 */
export async function updateEvent(
  id: string,
  data: Partial<{
    title: string;
    description: string;
    startDate: string;
    endDate?: string;
    location: string;
    venue?: string;
    image?: string;
    registrationUrl?: string;
    maxParticipants?: number;
    status?: string;
    locale?: string;
  }>,
  accessToken: string
): Promise<EventItem> {
  return apiRequest(`/events/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(data),
  });
}

/**
 * Delete an event (Editor+)
 */
export async function deleteEvent(id: string, accessToken: string): Promise<void> {
  return apiRequest(`/events/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

// ============================================
// Teachings API
// ============================================

export interface TeachingItem {
  id: string;
  slug: string;
  title: { en: string; hi: string };
  description: { en: string; hi: string };
  content?: { en: string; hi: string };
  icon?: string;
  imageUrl?: string;
  category?: string;
  order: number;
}

/**
 * Fetch teachings list
 */
export async function fetchTeachings(
  locale: AppLocale
): Promise<{ teachings: TeachingItem[] }> {
  return apiRequest(`/teachings?locale=${locale}`);
}

/**
 * Fetch single teaching by slug
 */
export async function fetchTeachingBySlug(
  slug: string,
  locale: AppLocale
): Promise<{ teaching: TeachingItem }> {
  return apiRequest(`/teachings/${slug}?locale=${locale}`);
}

// ============================================
// Services API
// ============================================

export interface ServiceItem {
  id: string;
  slug: string;
  title: { en: string; hi: string };
  shortDescription: { en: string; hi: string };
  longDescription?: { en: string; hi: string };
  icon?: string;
  imageUrl?: string;
  order: number;
}

/**
 * Fetch services list
 */
export async function fetchServices(
  locale: AppLocale
): Promise<{ services: ServiceItem[] }> {
  return apiRequest(`/content/services?locale=${locale}`);
}

// ============================================
// Media/Gallery API
// ============================================

export interface MediaItem {
  id: string;
  type: "image" | "video" | "youtube";
  title: { en: string; hi: string };
  url: string;
  thumbnail?: string;
  alt?: { en: string; hi: string };
  category?: string;
  publishedAt?: string;
}

/**
 * Fetch gallery/media items
 */
export async function fetchMedia(
  locale: AppLocale,
  type?: "image" | "video" | "youtube"
): Promise<{ media: MediaItem[] }> {
  const typeParam = type ? `&type=${type}` : "";
  return apiRequest(`/content/media?locale=${locale}${typeParam}`);
}

// ============================================
// Auth API
// ============================================

export interface OtpRequestResponse {
  success: boolean;
  message: string;
  expiresIn: number;
}

export interface OtpVerifyResponse {
  success: boolean;
  message: string;
  accessToken?: string;
  refreshToken?: string;
  user?: {
    id: string;
    email: string;
    name?: string;
    isNewUser: boolean;
  };
}

/**
 * Request OTP for login/signup
 */
export async function requestOtp(email: string): Promise<OtpRequestResponse> {
  return apiRequest("/auth/otp/request", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

/**
 * Verify OTP and get tokens
 */
export async function verifyOtp(
  email: string,
  otp: string
): Promise<OtpVerifyResponse> {
  return apiRequest("/auth/otp/verify", {
    method: "POST",
    body: JSON.stringify({ email, otp }),
  });
}

// ============================================
// Health Check API
// ============================================

/**
 * Check API health status
 */
export async function checkHealth(): Promise<{
  status: string;
  timestamp: string;
  environment: string;
}> {
  return apiRequest("/health");
}

// ============================================
// CMS API (Page Components)
// ============================================

export interface LocalizedString {
  en: string;
  hi?: string;
}

export interface CMSPage {
  id: string;
  slug: string;
  title: LocalizedString;
  description?: LocalizedString;
  path?: string;
  heroImage?: string;
  status: 'draft' | 'published' | 'archived';
  displayOrder: number;
  metaTitle?: LocalizedString;
  metaDescription?: LocalizedString;
  componentIds: string[];
  createdAt: string;
  updatedAt: string;
}

/** Field schema definition from a component template */
export interface ComponentFieldDefinition {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'richtext' | 'image' | 'video' | 'url' | 'number' | 'boolean' | 'select' | 'color' | 'date' | 'array' | 'json';
  required?: boolean;
  localized?: boolean;
  defaultValue?: unknown;
  placeholder?: string;
  helpText?: string;
  options?: string[];
}

/** Runtime field value stored on a component */
export interface ComponentFieldValue {
  key: string;
  value?: unknown;
  localizedValue?: LocalizedString;
}

export interface CMSComponent {
  id: string;
  pageId: string;
  componentType: string;
  name: LocalizedString;
  description?: LocalizedString;
  fields: ComponentFieldValue[];
  displayOrder: number;
  isVisible: boolean;
  customClasses?: string;
  customStyles?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface CMSPageWithComponents extends CMSPage {
  components: CMSComponent[];
}

export interface ComponentTemplate {
  componentType: string;
  name: string;
  description: string;
  icon: string;
  fields: ComponentFieldDefinition[];
  isGlobal?: boolean;
}

/**
 * Fetch all CMS pages
 */
export async function fetchCMSPages(accessToken: string): Promise<CMSPage[]> {
  const res: { items: CMSPage[]; count: number } = await apiRequest("/cms/pages", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res.items;
}

/**
 * Fetch CMS page with components by slug (public, no auth needed)
 * Uses short revalidation to serve fresh CMS content on the public site
 */
export async function fetchCMSPageBySlug(slug: string): Promise<CMSPageWithComponents | null> {
  try {
    return await apiRequest<CMSPageWithComponents>(`/cms/pages/by-slug/${slug}`, {
      next: { revalidate: 60 }, // revalidate every 60 seconds
    } as RequestInit);
  } catch {
    return null;
  }
}

/**
 * Fetch all published CMS pages (public, no auth needed)
 * Used for collecting global components like announcement bars across all pages
 */
export async function fetchAllPublishedCMSPages(): Promise<CMSPage[]> {
  try {
    const res: { items: CMSPage[]; count: number } = await apiRequest('/cms/pages?publishedOnly=true', {
      next: { revalidate: 60 },
    } as RequestInit);
    return res.items || [];
  } catch {
    return [];
  }
}

/**
 * Fetch CMS page with components
 */
export async function fetchCMSPageWithComponents(
  pageId: string,
  accessToken: string
): Promise<CMSPageWithComponents> {
  return apiRequest(`/cms/pages/${pageId}/with-components`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

/**
 * Fetch components for a page
 */
export async function fetchCMSPageComponents(
  pageId: string,
  accessToken: string
): Promise<CMSComponent[]> {
  const res: { items: CMSComponent[]; count: number } = await apiRequest(`/cms/components/page/${pageId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res.items;
}

/**
 * Create a new CMS page
 */
export async function createCMSPage(
  data: { title: LocalizedString; slug: string; description?: LocalizedString; status?: string; path?: string; displayOrder?: number },
  accessToken: string
): Promise<CMSPage> {
  return apiRequest("/cms/pages", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(data),
  });
}

/**
 * Update a CMS page
 */
export async function updateCMSPage(
  pageId: string,
  data: Partial<{ title: LocalizedString; slug: string; description?: LocalizedString; status?: string; path?: string; displayOrder?: number }>,
  accessToken: string
): Promise<CMSPage> {
  return apiRequest(`/cms/pages/${pageId}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(data),
  });
}

/**
 * Delete a CMS page
 */
export async function deleteCMSPage(pageId: string, accessToken: string): Promise<void> {
  return apiRequest(`/cms/pages/${pageId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

/**
 * Create a new CMS component
 */
export async function createCMSComponent(
  data: {
    pageId: string;
    componentType: string;
    name: LocalizedString;
    description?: LocalizedString;
    fields?: ComponentFieldValue[];
    displayOrder?: number;
    isVisible?: boolean;
  },
  accessToken: string
): Promise<CMSComponent> {
  return apiRequest("/cms/components", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(data),
  });
}

/**
 * Update a CMS component
 */
export async function updateCMSComponent(
  componentId: string,
  data: Partial<{
    name: LocalizedString;
    description: LocalizedString;
    fields: ComponentFieldValue[];
    displayOrder: number;
    isVisible: boolean;
  }>,
  accessToken: string
): Promise<CMSComponent> {
  return apiRequest(`/cms/components/${componentId}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(data),
  });
}

/**
 * Delete a CMS component
 */
export async function deleteCMSComponent(componentId: string, accessToken: string): Promise<void> {
  return apiRequest(`/cms/components/${componentId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

/**
 * Reorder CMS components within a page
 */
export async function reorderCMSComponents(
  pageId: string,
  componentIds: string[],
  accessToken: string
): Promise<CMSComponent[]> {
  const res: { items: CMSComponent[]; count: number } = await apiRequest("/cms/components/reorder", {
    method: "PUT",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ pageId, componentIds }),
  });
  return res.items;
}

/**
 * Fetch component templates
 */
export async function fetchComponentTemplates(accessToken: string): Promise<ComponentTemplate[]> {
  const res: { items: ComponentTemplate[]; count: number } = await apiRequest("/cms/templates", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res.items;
}

/**
 * Fetch all global components (components whose type is marked as global)
 */
export async function fetchGlobalComponents(accessToken: string): Promise<CMSComponent[]> {
  const res: { items: CMSComponent[]; count: number } = await apiRequest("/cms/components/global", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res.items;
}

/**
 * Initialize a global component with default fields from its template.
 * If the component already exists, returns the existing one.
 */
export async function initializeGlobalComponent(
  componentType: string,
  accessToken: string
): Promise<CMSComponent> {
  return apiRequest("/cms/components/global/initialize", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ componentType }),
  });
}

// ============================================
// Newsletter API
// ============================================

export interface NewsletterSubscriber {
  id: string;
  email: string;
  name?: string;
  status: 'active' | 'unsubscribed' | 'bounced';
  source?: string;
  tags: string[];
  subscribedAt: string;
  createdAt: string;
}

export interface NewsletterCampaign {
  id: string;
  subject: LocalizedString;
  content: LocalizedString;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';
  targetTags: string[];
  scheduledAt?: string;
  sentAt?: string;
  stats: {
    totalRecipients: number;
    sent: number;
    failed: number;
  };
  createdBy: string;
  createdAt: string;
}

export interface NewsletterStats {
  totalSubscribers: number;
  activeSubscribers: number;
  unsubscribed: number;
  thirtyDayGrowth: number;
  totalCampaignsSent: number;
}

export async function subscribeNewsletter(email: string, name?: string): Promise<NewsletterSubscriber> {
  return apiRequest("/newsletter/subscribe", {
    method: "POST",
    body: JSON.stringify({ email, name }),
  });
}

export async function fetchNewsletterSubscribers(accessToken: string): Promise<NewsletterSubscriber[]> {
  return apiRequest("/newsletter/subscribers", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export async function fetchNewsletterCampaigns(accessToken: string): Promise<NewsletterCampaign[]> {
  return apiRequest("/newsletter/campaigns", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export async function createNewsletterCampaign(
  data: { subject: LocalizedString; content: LocalizedString; targetTags?: string[] },
  accessToken: string
): Promise<NewsletterCampaign> {
  return apiRequest("/newsletter/campaigns", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(data),
  });
}

export async function updateNewsletterCampaign(
  campaignId: string,
  data: Partial<{ subject: LocalizedString; content: LocalizedString; targetTags: string[] }>,
  accessToken: string
): Promise<NewsletterCampaign> {
  return apiRequest(`/newsletter/campaigns/${campaignId}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(data),
  });
}

export async function deleteNewsletterCampaign(campaignId: string, accessToken: string): Promise<void> {
  return apiRequest(`/newsletter/campaigns/${campaignId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export async function deleteNewsletterSubscriber(subscriberId: string, accessToken: string): Promise<void> {
  return apiRequest(`/newsletter/subscribers/${subscriberId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export async function sendNewsletterCampaign(
  campaignId: string,
  locale: 'en' | 'hi',
  accessToken: string
): Promise<NewsletterCampaign> {
  return apiRequest(`/newsletter/campaigns/${campaignId}/send`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ sendNow: true, locale }),
  });
}

export async function fetchNewsletterStats(accessToken: string): Promise<NewsletterStats> {
  return apiRequest("/newsletter/stats", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

// ============================================
// Donation API
// ============================================

export interface DonationConfig {
  id: string;
  purpose: string;
  title: LocalizedString;
  description?: LocalizedString;
  suggestedAmounts: Array<{ amount: number; label?: LocalizedString; isPopular?: boolean }>;
  minimumAmount: number;
  maximumAmount?: number;
  allowCustomAmount: boolean;
  isActive: boolean;
  displayOrder: number;
}

export interface Donation {
  id: string;
  donationNumber: string;
  amount: number;
  purpose: string;
  donationType: 'one_time' | 'recurring';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  donorName?: string;
  donorEmail?: string;
  donorPhone?: string;
  isAnonymous: boolean;
  wants80GCertificate: boolean;
  createdAt: string;
}

export interface DonationStats {
  totalDonations: number;
  totalAmount: number;
  thisMonthAmount: number;
  lastMonthAmount: number;
  averageDonation: number;
  topPurpose: string;
  donorCount: number;
  recurringDonors: number;
}

export async function fetchDonationConfigs(): Promise<DonationConfig[]> {
  return apiRequest("/donations/config?activeOnly=true");
}

export async function fetchAllDonations(accessToken: string): Promise<Donation[]> {
  return apiRequest("/donations", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export async function fetchDonationStats(accessToken: string): Promise<DonationStats> {
  return apiRequest("/donations/stats", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export async function createDonation(
  data: { amount: number; purpose: string; donorName?: string; donorEmail?: string }
): Promise<Donation> {
  return apiRequest("/donations", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function fetchAllDonationConfigs(accessToken: string): Promise<DonationConfig[]> {
  return apiRequest("/donations/config", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export async function createDonationConfig(
  data: Partial<DonationConfig>,
  accessToken: string
): Promise<DonationConfig> {
  return apiRequest("/donations/config", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(data),
  });
}

export async function updateDonationConfig(
  configId: string,
  data: Partial<DonationConfig>,
  accessToken: string
): Promise<DonationConfig> {
  return apiRequest(`/donations/config/${configId}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(data),
  });
}

export async function deleteDonationConfig(configId: string, accessToken: string): Promise<void> {
  return apiRequest(`/donations/config/${configId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export async function updateDonation(
  donationId: string,
  data: Partial<Donation>,
  accessToken: string
): Promise<Donation> {
  return apiRequest(`/donations/${donationId}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(data),
  });
}

// ============================================
// Subscription Plans API
// ============================================

export interface ApiSubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features?: string[];
  popular?: boolean;
  isActive: boolean;
}

export async function fetchSubscriptionPlans(): Promise<ApiSubscriptionPlan[]> {
  const response = await apiRequest("/subscriptions/plans") as { items?: ApiSubscriptionPlan[] } | ApiSubscriptionPlan[];
  return (response as { items?: ApiSubscriptionPlan[] })?.items || (response as ApiSubscriptionPlan[]) || [];
}

export async function fetchMySubscription(accessToken: string): Promise<unknown> {
  return apiRequest("/subscriptions/my-subscription/active", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

// ---- Admin Subscription Plan CRUD ----

export async function createSubscriptionPlan(
  data: Omit<ApiSubscriptionPlan, "id">,
  accessToken: string
): Promise<ApiSubscriptionPlan> {
  return apiRequest("/subscriptions/plans", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(data),
  });
}

export async function updateSubscriptionPlan(
  id: string,
  data: Partial<ApiSubscriptionPlan>,
  accessToken: string
): Promise<ApiSubscriptionPlan> {
  return apiRequest(`/subscriptions/plans/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(data),
  });
}

export async function deleteSubscriptionPlan(id: string, accessToken: string): Promise<void> {
  return apiRequest(`/subscriptions/plans/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

// ---- Admin User Subscription Management ----

export interface UserSubscription {
  id: string;
  userId: string;
  planId: string;
  status: string;
  startDate: string;
  endDate?: string;
  cancelledAt?: string;
  cancelReason?: string;
  createdAt: string;
  updatedAt: string;
}

export async function fetchAllSubscriptions(
  accessToken: string,
  status?: string,
  limit?: number
): Promise<{ items: UserSubscription[]; count: number }> {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (limit) params.set("limit", String(limit));
  const qs = params.toString() ? `?${params.toString()}` : "";
  return apiRequest(`/subscriptions/admin/all${qs}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export async function fetchSubscriptionById(
  id: string,
  accessToken: string
): Promise<UserSubscription> {
  return apiRequest(`/subscriptions/admin/${id}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export async function updateUserSubscription(
  id: string,
  data: Partial<UserSubscription>,
  accessToken: string
): Promise<UserSubscription> {
  return apiRequest(`/subscriptions/admin/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(data),
  });
}

export async function activateSubscription(id: string, accessToken: string): Promise<UserSubscription> {
  return apiRequest(`/subscriptions/admin/${id}/activate`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export async function cancelSubscription(
  id: string,
  accessToken: string,
  reason?: string
): Promise<UserSubscription> {
  return apiRequest(`/subscriptions/admin/${id}/cancel`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ reason }),
  });
}

// ============================================
// Payment API (Razorpay Integration)
// ============================================

export interface SubscriptionPaymentResponse {
  subscriptionId: string;
  razorpayOrderId?: string;
  razorpaySubscriptionId?: string;
  amount: number;
  currency: string;
  razorpayKeyId: string;
  planName: string;
  planDescription: string;
  isAutopay: boolean;
  notes?: Record<string, string>;
}

export interface DonationPaymentResponse {
  donationId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  razorpayKeyId: string;
  notes?: Record<string, string>;
}

export interface PaymentVerificationResponse {
  success: boolean;
  message: string;
  entityId?: string;
  status?: string;
}

/**
 * Initiate a subscription payment - creates Razorpay Order or Subscription
 */
export async function initiateSubscriptionPayment(
  planId: string,
  accessToken: string
): Promise<SubscriptionPaymentResponse> {
  return apiRequest("/payments/subscription/initiate", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ planId }),
  });
}

/**
 * Verify a one-time order payment (for 5100/21000 plans)
 */
export async function verifyOrderPayment(
  data: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    subscriptionId: string;
  },
  accessToken: string
): Promise<PaymentVerificationResponse> {
  return apiRequest("/payments/subscription/verify-order", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(data),
  });
}

/**
 * Verify an autopay subscription payment
 */
export async function verifySubscriptionPayment(
  data: {
    razorpaySubscriptionId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    subscriptionId: string;
  },
  accessToken: string
): Promise<PaymentVerificationResponse> {
  return apiRequest("/payments/subscription/verify-subscription", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(data),
  });
}

/**
 * Initiate a donation payment
 */
export async function initiateDonationPayment(
  data: {
    amount: number;
    purpose: string;
    donorName?: string;
    donorEmail?: string;
    donorPhone?: string;
  }
): Promise<DonationPaymentResponse> {
  return apiRequest("/payments/donation/initiate", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Verify a donation payment
 */
export async function verifyDonationPayment(
  data: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    donationId: string;
  }
): Promise<PaymentVerificationResponse> {
  return apiRequest("/payments/donation/verify", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Get current user's payment history
 */
export async function fetchMyPayments(accessToken: string): Promise<any[]> {
  return apiRequest("/payments/user-payments", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

/**
 * Get payment failures (admin only)
 */
export async function fetchPaymentFailures(accessToken: string, limit?: number): Promise<any[]> {
  const qs = limit ? `?limit=${limit}` : "";
  return apiRequest(`/payments/failures${qs}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

// ============================================
// Support Tickets API
// ============================================

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  message: string;
  category: string;
  status: 'open' | 'in_progress' | 'waiting_for_user' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  userEmail: string;
  userName?: string;
  repliesCount: number;
  lastReplyAt?: string;
  createdAt: string;
}

export interface TicketReply {
  id: string;
  ticketId: string;
  message: string;
  isInternal: boolean;
  isAdminReply: boolean;
  repliedByName?: string;
  createdAt: string;
}

export interface SupportStats {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  averageResolutionTime: number;
  ticketsThisWeek: number;
  ticketsLastWeek: number;
}

export async function createSupportTicket(
  data: { subject: string; message: string; category?: string; name?: string; email?: string }
): Promise<SupportTicket> {
  return apiRequest("/support/tickets/guest", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function fetchAllTickets(accessToken: string): Promise<SupportTicket[]> {
  return apiRequest("/support/tickets", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export async function fetchUserTickets(
  accessToken: string,
  options?: { limit?: number }
): Promise<{ items: SupportTicket[] }> {
  const params = new URLSearchParams();
  if (options?.limit) params.append("limit", options.limit.toString());
  const query = params.toString() ? `?${params.toString()}` : "";
  return apiRequest(`/support/my-tickets${query}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export async function fetchTicketWithReplies(
  ticketId: string,
  accessToken: string
): Promise<SupportTicket & { replies: TicketReply[] }> {
  return apiRequest(`/support/tickets/${ticketId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export async function createTicketReply(
  ticketId: string,
  message: string,
  isInternal: boolean,
  accessToken: string
): Promise<TicketReply> {
  return apiRequest(`/support/tickets/${ticketId}/admin-reply`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ message, isInternal }),
  });
}

export async function updateTicketStatus(
  ticketId: string,
  status: string,
  accessToken: string
): Promise<SupportTicket> {
  return apiRequest(`/support/tickets/${ticketId}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ status }),
  });
}

export async function deleteSupportTicket(ticketId: string, accessToken: string): Promise<void> {
  return apiRequest(`/support/tickets/${ticketId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export async function fetchSupportStats(accessToken: string): Promise<SupportStats> {
  return apiRequest("/support/stats", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

// ============================================
// Uploads API
// ============================================

export interface UploadedFile {
  key: string;
  url: string;
  name: string;
  size: number;
  contentType: string;
  folder: string;
  uploadedAt: string;
}

export interface FileMetadata {
  key: string;
  size: number;
  contentType: string;
  lastModified: string;
}

export async function getPresignedUploadUrl(
  folder: string,
  fileName: string,
  contentType: string,
  accessToken: string
): Promise<{ uploadUrl: string; downloadUrl: string; key: string }> {
  return apiRequest("/uploads/presigned-url", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ folder, fileName, contentType }),
  });
}

export async function listUploadedFiles(folder: string, accessToken: string): Promise<FileMetadata[]> {
  return apiRequest(`/uploads/list?folder=${folder}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export async function deleteUploadedFile(key: string, accessToken: string): Promise<void> {
  return apiRequest(`/uploads/${encodeURIComponent(key)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export interface UploadFolder {
  name: string;
  key: string;
}

export async function fetchUploadFolders(accessToken: string): Promise<{ folders: UploadFolder[] }> {
  return apiRequest("/uploads/folders", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export default {
  fetchPageContent,
  fetchPagesList,
  fetchEvents,
  fetchEventBySlug,
  fetchTeachings,
  fetchTeachingBySlug,
  fetchServices,
  fetchMedia,
  requestOtp,
  verifyOtp,
  checkHealth,
  // CMS
  fetchCMSPages,
  fetchCMSPageBySlug,
  fetchAllPublishedCMSPages,
  fetchCMSPageWithComponents,
  fetchCMSPageComponents,
  createCMSPage,
  updateCMSPage,
  deleteCMSPage,
  createCMSComponent,
  updateCMSComponent,
  deleteCMSComponent,
  reorderCMSComponents,
  fetchComponentTemplates,
  // Newsletter
  subscribeNewsletter,
  fetchNewsletterSubscribers,
  fetchNewsletterCampaigns,
  createNewsletterCampaign,
  updateNewsletterCampaign,
  deleteNewsletterCampaign,
  deleteNewsletterSubscriber,
  sendNewsletterCampaign,
  fetchNewsletterStats,
  // Donations
  fetchDonationConfigs,
  fetchAllDonationConfigs,
  fetchAllDonations,
  fetchDonationStats,
  createDonation,
  createDonationConfig,
  updateDonationConfig,
  deleteDonationConfig,
  updateDonation,
  // Events (fetchEvents, fetchEventBySlug listed above)
  fetchAllEventsAdmin,
  createEvent,
  updateEvent,
  deleteEvent,
  // Subscriptions
  fetchSubscriptionPlans,
  fetchMySubscription,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  deleteSubscriptionPlan,
  fetchAllSubscriptions,
  fetchSubscriptionById,
  updateUserSubscription,
  activateSubscription,
  cancelSubscription,
  // Support
  createSupportTicket,
  fetchAllTickets,
  fetchUserTickets,
  fetchTicketWithReplies,
  createTicketReply,
  updateTicketStatus,
  deleteSupportTicket,
  fetchSupportStats,
  // Uploads
  getPresignedUploadUrl,
  listUploadedFiles,
  deleteUploadedFile,
  fetchUploadFolders,
  // Payments (Razorpay)
  initiateSubscriptionPayment,
  verifyOrderPayment,
  verifySubscriptionPayment,
  initiateDonationPayment,
  verifyDonationPayment,
  fetchMyPayments,
  fetchPaymentFailures,
};
