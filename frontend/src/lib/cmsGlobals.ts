/**
 * Server-side utility for fetching global CMS component data.
 * Used by layout components (Header, Footer) that are server components.
 */

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:2026").replace(/\/api\/v1\/?$/, "") + "/api/v1";

interface CMSField {
  key: string;
  value?: unknown;
  localizedValue?: Record<string, string>;
}

interface CMSComponent {
  id: string;
  componentType: string;
  isVisible: boolean;
  fields: CMSField[];
}

let cachedComponents: CMSComponent[] | null = null;
let cacheTimestamp = 0;

// CMS revalidation TTL — configurable via env var
// Launch phase: 300s (5 min) for frequent CMS edits
// Steady state: 3600s (1 hr) once content stabilizes to weekly edits
const CMS_REVALIDATE_SECONDS = Number(process.env.NEXT_PUBLIC_CMS_REVALIDATE_SECONDS) || 300;
const CACHE_TTL = CMS_REVALIDATE_SECONDS * 1000;

/**
 * Fetch all global CMS components (server-side, cached per CMS_REVALIDATE_SECONDS).
 */
export async function getGlobalComponents(): Promise<CMSComponent[]> {
  const now = Date.now();
  if (cachedComponents && now - cacheTimestamp < CACHE_TTL) {
    return cachedComponents;
  }

  try {
    const res = await fetch(`${API_BASE}/cms/components/global/public`, {
      next: { revalidate: CMS_REVALIDATE_SECONDS },
    });
    if (!res.ok) return cachedComponents || [];
    const data: { items: CMSComponent[]; count: number } = await res.json();
    cachedComponents = data.items;
    cacheTimestamp = now;
    return data.items;
  } catch {
    return cachedComponents || [];
  }
}

/**
 * Get a specific global component by type.
 */
export async function getGlobalComponent(componentType: string): Promise<CMSComponent | null> {
  const components = await getGlobalComponents();
  return components.find((c) => c.componentType === componentType && c.isVisible) || null;
}

/**
 * Extract a plain (non-localized) field value from a CMS component.
 */
export function getField<T = string>(fields: CMSField[], key: string, fallback?: T): T {
  const field = fields.find((f) => f.key === key);
  if (!field) return (fallback ?? "") as T;
  return (field.value as T) ?? ((fallback ?? "") as T);
}

/**
 * Extract a localized field value for a given locale.
 */
export function getLocalizedField(fields: CMSField[], key: string, locale: string, fallback = ""): string {
  const field = fields.find((f) => f.key === key);
  if (!field?.localizedValue) return fallback;
  return field.localizedValue[locale] || field.localizedValue.en || fallback;
}
