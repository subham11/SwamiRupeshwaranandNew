/**
 * API Client for Backend Communication
 * 
 * Handles all API calls to the backend server.
 * - In development: Calls local backend (http://localhost:2026)
 * - In production: Calls API Gateway endpoint
 */

import type { AppLocale } from "@/i18n/config";

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:2026/api/v1";

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
 * Generic API request handler
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetchWithTimeout(url, options);

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
};
