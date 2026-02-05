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

// ============================================
// CMS API (Page Components)
// ============================================

export interface LocalizedString {
  en: string;
  hi: string;
}

export interface CMSPage {
  id: string;
  title: LocalizedString;
  slug: string;
  description?: LocalizedString;
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface ComponentFieldDefinition {
  name: string;
  label: LocalizedString;
  type: 'text' | 'textarea' | 'richtext' | 'image' | 'video' | 'url' | 'number' | 'boolean' | 'select' | 'color' | 'date' | 'array' | 'json';
  required?: boolean;
  defaultValue?: unknown;
  options?: Array<{ value: string; label: LocalizedString }>;
  placeholder?: LocalizedString;
}

export interface ComponentFieldValue {
  name: string;
  value: unknown;
}

export interface CMSComponent {
  id: string;
  pageId: string;
  componentType: string;
  name: string;
  fieldDefinitions: ComponentFieldDefinition[];
  fieldValues: ComponentFieldValue[];
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ComponentTemplate {
  type: string;
  name: string;
  description: string;
  fields: ComponentFieldDefinition[];
}

/**
 * Fetch all CMS pages
 */
export async function fetchCMSPages(accessToken: string): Promise<CMSPage[]> {
  return apiRequest("/cms/pages", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

/**
 * Fetch CMS page with components
 */
export async function fetchCMSPageWithComponents(
  pageId: string,
  accessToken: string
): Promise<{ page: CMSPage; components: CMSComponent[] }> {
  return apiRequest(`/cms/pages/${pageId}/with-components`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

/**
 * Create a new CMS page
 */
export async function createCMSPage(
  data: { title: LocalizedString; slug: string; description?: LocalizedString; status?: string },
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
  data: Partial<{ title: LocalizedString; slug: string; description?: LocalizedString; status?: string }>,
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
    name: string;
    fieldValues?: ComponentFieldValue[];
    order?: number;
    isActive?: boolean;
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
    name: string;
    fieldValues: ComponentFieldValue[];
    order: number;
    isActive: boolean;
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
 * Bulk update CMS components
 */
export async function bulkUpdateCMSComponents(
  updates: Array<{ componentId: string; fieldValues?: ComponentFieldValue[]; order?: number; isActive?: boolean }>,
  accessToken: string
): Promise<CMSComponent[]> {
  return apiRequest("/cms/components/bulk-update", {
    method: "PUT",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ updates }),
  });
}

/**
 * Fetch component templates
 */
export async function fetchComponentTemplates(accessToken: string): Promise<ComponentTemplate[]> {
  return apiRequest("/cms/templates", {
    headers: { Authorization: `Bearer ${accessToken}` },
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
  const response = await apiRequest("/subscriptions/plans");
  return response?.items || response || [];
}

export async function fetchMySubscription(accessToken: string): Promise<unknown> {
  return apiRequest("/subscriptions/my-subscription/active", {
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
  fetchCMSPageWithComponents,
  createCMSPage,
  updateCMSPage,
  deleteCMSPage,
  createCMSComponent,
  updateCMSComponent,
  deleteCMSComponent,
  bulkUpdateCMSComponents,
  fetchComponentTemplates,
  // Newsletter
  subscribeNewsletter,
  fetchNewsletterSubscribers,
  fetchNewsletterCampaigns,
  createNewsletterCampaign,
  sendNewsletterCampaign,
  fetchNewsletterStats,
  // Donations
  fetchDonationConfigs,
  fetchAllDonations,
  fetchDonationStats,
  createDonation,
  // Subscriptions
  fetchSubscriptionPlans,
  fetchMySubscription,
  // Support
  createSupportTicket,
  fetchAllTickets,
  fetchUserTickets,
  fetchTicketWithReplies,
  createTicketReply,
  updateTicketStatus,
  fetchSupportStats,
  // Uploads
  getPresignedUploadUrl,
  listUploadedFiles,
  deleteUploadedFile,
};
};
