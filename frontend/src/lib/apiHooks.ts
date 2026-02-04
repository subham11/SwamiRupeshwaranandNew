/**
 * React Query Hooks for API Data Fetching
 * 
 * These hooks provide:
 * - Automatic caching and deduplication
 * - Loading/error states
 * - Background refetching
 * - SSR compatibility (Amplify)
 */

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { AppLocale } from "@/i18n/config";
import * as api from "@/lib/api";

// Query key factory for consistency
export const queryKeys = {
  // Page content
  pageContent: (pageId: string, locale: AppLocale) =>
    ["pageContent", pageId, locale] as const,
  pagesList: () => ["pagesList"] as const,

  // Events
  events: (locale: AppLocale, status?: string) =>
    ["events", locale, status] as const,
  event: (slug: string, locale: AppLocale) =>
    ["event", slug, locale] as const,

  // Teachings
  teachings: (locale: AppLocale) => ["teachings", locale] as const,
  teaching: (slug: string, locale: AppLocale) =>
    ["teaching", slug, locale] as const,

  // Services
  services: (locale: AppLocale) => ["services", locale] as const,

  // Media
  media: (locale: AppLocale, type?: string) =>
    ["media", locale, type] as const,

  // Health
  health: () => ["health"] as const,
};

// ============================================
// Page Content Hooks
// ============================================

/**
 * Fetch page content by ID with bilingual support
 */
export function usePageContent<T = unknown>(
  pageId: string,
  locale: AppLocale,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.pageContent(pageId, locale),
    queryFn: () => api.fetchPageContent<T>(pageId, locale),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
    ...options,
  });
}

/**
 * Fetch pages list for navigation/sitemap
 */
export function usePagesList() {
  return useQuery({
    queryKey: queryKeys.pagesList(),
    queryFn: api.fetchPagesList,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// ============================================
// Events Hooks
// ============================================

/**
 * Fetch events list
 */
export function useEvents(
  locale: AppLocale,
  status?: "upcoming" | "past",
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.events(locale, status),
    queryFn: () => api.fetchEvents(locale, status),
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  });
}

/**
 * Fetch single event by slug
 */
export function useEvent(
  slug: string,
  locale: AppLocale,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.event(slug, locale),
    queryFn: () => api.fetchEventBySlug(slug, locale),
    staleTime: 5 * 60 * 1000,
    enabled: !!slug,
    ...options,
  });
}

// ============================================
// Teachings Hooks
// ============================================

/**
 * Fetch teachings list
 */
export function useTeachings(
  locale: AppLocale,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.teachings(locale),
    queryFn: () => api.fetchTeachings(locale),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

/**
 * Fetch single teaching by slug
 */
export function useTeaching(
  slug: string,
  locale: AppLocale,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.teaching(slug, locale),
    queryFn: () => api.fetchTeachingBySlug(slug, locale),
    staleTime: 5 * 60 * 1000,
    enabled: !!slug,
    ...options,
  });
}

// ============================================
// Services Hooks
// ============================================

/**
 * Fetch services list
 */
export function useServices(
  locale: AppLocale,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.services(locale),
    queryFn: () => api.fetchServices(locale),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

// ============================================
// Media Hooks
// ============================================

/**
 * Fetch media/gallery items
 */
export function useMedia(
  locale: AppLocale,
  type?: "image" | "video" | "youtube",
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.media(locale, type),
    queryFn: () => api.fetchMedia(locale, type),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

// ============================================
// Auth Hooks
// ============================================

/**
 * Request OTP mutation
 */
export function useRequestOtp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (email: string) => api.requestOtp(email),
    onSuccess: () => {
      // Optionally invalidate user-related queries
    },
  });
}

/**
 * Verify OTP mutation
 */
export function useVerifyOtp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ email, otp }: { email: string; otp: string }) =>
      api.verifyOtp(email, otp),
    onSuccess: (data) => {
      if (data.accessToken) {
        // Store token in localStorage or secure cookie
        if (typeof window !== "undefined") {
          localStorage.setItem("accessToken", data.accessToken);
          if (data.refreshToken) {
            localStorage.setItem("refreshToken", data.refreshToken);
          }
        }
      }
    },
  });
}

// ============================================
// Health Check Hook
// ============================================

/**
 * Check API health status
 */
export function useHealthCheck(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.health(),
    queryFn: api.checkHealth,
    staleTime: 30 * 1000, // 30 seconds
    retry: 1,
    ...options,
  });
}

// ============================================
// Prefetch Utilities
// ============================================

/**
 * Prefetch page content (for SSR/SSG)
 */
export async function prefetchPageContent<T = unknown>(
  queryClient: ReturnType<typeof useQueryClient>,
  pageId: string,
  locale: AppLocale
) {
  await queryClient.prefetchQuery({
    queryKey: queryKeys.pageContent(pageId, locale),
    queryFn: () => api.fetchPageContent<T>(pageId, locale),
  });
}

/**
 * Prefetch events (for SSR/SSG)
 */
export async function prefetchEvents(
  queryClient: ReturnType<typeof useQueryClient>,
  locale: AppLocale,
  status?: "upcoming" | "past"
) {
  await queryClient.prefetchQuery({
    queryKey: queryKeys.events(locale, status),
    queryFn: () => api.fetchEvents(locale, status),
  });
}

/**
 * Prefetch teachings (for SSR/SSG)
 */
export async function prefetchTeachings(
  queryClient: ReturnType<typeof useQueryClient>,
  locale: AppLocale
) {
  await queryClient.prefetchQuery({
    queryKey: queryKeys.teachings(locale),
    queryFn: () => api.fetchTeachings(locale),
  });
}
