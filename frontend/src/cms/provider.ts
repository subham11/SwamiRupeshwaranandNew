import type { ContentBundle } from "@/cms/types";

/**
 * CMS-ready interface:
 * - Start with LocalJsonProvider (ships with the repo)
 * - Swap later with: SanityProvider / StrapiProvider / ContentfulProvider / WordPressProvider etc.
 */
export interface CmsProvider {
  getBundle(): Promise<ContentBundle>;
}
