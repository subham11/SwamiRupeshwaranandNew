/**
 * Content Provider - Unified Content Fetching Layer
 * 
 * This module provides a unified interface for fetching page content.
 * It abstracts the data source, allowing seamless switching between:
 * - Local static content (development/fallback)
 * - Backend API (production)
 * 
 * All content is bilingual (EN/HI) with proper type safety.
 */

import type { AppLocale } from "@/i18n/config";
import { fetchPageContent, fetchCMSPageBySlug, ApiError } from "@/lib/api";
import type { CMSPageWithComponents, CMSComponent, ComponentFieldValue } from "@/lib/api";
import {
  homeContent,
  type HomePageContent,
  type LocalizedText,
  type AnnouncementItem,
  type HeroSlide,
  type TeachingCard,
  type QuoteItem,
  type SectionContent,
} from "@/content/pageContent";

// Re-export types for convenience
export type {
  LocalizedText,
  AnnouncementItem,
  HeroSlide,
  TeachingCard,
  QuoteItem,
  SectionContent,
  HomePageContent,
};

// Page IDs enum for type safety
export const PAGE_IDS = {
  HOME: "home",
  SWAMIJI: "swamiji",
  ASHRAM: "ashram",
  TEACHINGS: "teachings",
  SERVICES: "services",
  EVENTS: "events",
  DONATION: "donation",
  CONTACT: "contact",
  GURUKUL: "gurukul",
} as const;

export type PageId = (typeof PAGE_IDS)[keyof typeof PAGE_IDS];

// ============================================
// Page Content Types (Bilingual)
// ============================================

export interface BilingualContent {
  en: string;
  hi: string;
}

export interface HeroSection {
  title: BilingualContent;
  subtitle: BilingualContent;
  backgroundImage?: string;
  ctaText?: BilingualContent;
  ctaLink?: string;
}

export interface ContentSection {
  id: string;
  type: "text" | "image" | "video" | "gallery" | "cards" | "testimonials" | "faq";
  title?: BilingualContent;
  subtitle?: BilingualContent;
  content?: BilingualContent;
  items?: Array<{
    id: string;
    title?: BilingualContent;
    description?: BilingualContent;
    imageUrl?: string;
    link?: string;
    icon?: string;
  }>;
  imageUrl?: string;
  videoUrl?: string;
  order: number;
}

export interface PageContent {
  pageId: string;
  slug: string;
  title: BilingualContent;
  description?: BilingualContent;
  hero?: HeroSection;
  sections: ContentSection[];
  seo?: {
    title: BilingualContent;
    description: BilingualContent;
    keywords?: string[];
    ogImage?: string;
  };
  updatedAt: string;
}

// ============================================
// Content Provider Class
// ============================================

interface ContentProviderOptions {
  useApi: boolean; // Whether to use API or local content
  apiTimeout?: number;
  enableFallback?: boolean; // Fall back to local content on API error
}

class ContentProvider {
  private options: ContentProviderOptions;

  constructor(options: Partial<ContentProviderOptions> = {}) {
    this.options = {
      useApi: process.env.NODE_ENV === "production" || 
              process.env.NEXT_PUBLIC_USE_API === "true",
      apiTimeout: 10000,
      enableFallback: true,
      ...options,
    };
  }

  /**
   * Get localized text from bilingual content
   */
  getLocalizedText(content: BilingualContent, locale: AppLocale): string {
    return content[locale] || content.en;
  }

  /**
   * Fetch page content by ID
   */
  async getPageContent(pageId: PageId, locale: AppLocale): Promise<PageContent> {
    if (this.options.useApi) {
      try {
        const response = await fetchPageContent<PageContent>(pageId, locale);
        return response.data;
      } catch (error) {
        if (this.options.enableFallback) {
          console.warn(`API error for page ${pageId}, using fallback:`, error);
          return this.getStaticPageContent(pageId);
        }
        throw error;
      }
    }
    return this.getStaticPageContent(pageId);
  }

  /**
   * Get static fallback content
   */
  private getStaticPageContent(pageId: PageId): PageContent {
    // Convert local content to PageContent format
    switch (pageId) {
      case PAGE_IDS.HOME:
        return this.transformHomeContent();
      default:
        return this.getDefaultPageContent(pageId);
    }
  }

  /**
   * Transform home content to PageContent format
   */
  private transformHomeContent(): PageContent {
    return {
      pageId: PAGE_IDS.HOME,
      slug: "",
      title: {
        en: "Swami Rupeshwaranand Ji - Divine Guidance for Modern Life",
        hi: "स्वामी रूपेश्वरानंद जी - आधुनिक जीवन के लिए दैवीय मार्गदर्शन",
      },
      description: {
        en: "Welcome to the spiritual abode of Swami Rupeshwaranand Ji",
        hi: "स्वामी रूपेश्वरानंद जी के आध्यात्मिक आश्रम में आपका स्वागत है",
      },
      hero: {
        title: homeContent.heroSlides[0]?.title || { en: "", hi: "" },
        subtitle: homeContent.heroSlides[0]?.subtitle || { en: "", hi: "" },
        backgroundImage: homeContent.heroSlides[0]?.imageUrl,
        ctaText: homeContent.heroSlides[0]?.ctaText,
        ctaLink: homeContent.heroSlides[0]?.ctaLink,
      },
      sections: [
        {
          id: "teachings",
          type: "cards",
          title: homeContent.sacredTeachings.section.title,
          subtitle: homeContent.sacredTeachings.section.subtitle,
          items: homeContent.sacredTeachings.cards.map((card) => ({
            id: card.id,
            title: card.title,
            description: card.description,
            imageUrl: card.imageUrl,
            link: card.link,
            icon: card.icon,
          })),
          order: 1,
        },
        {
          id: "about-ashram",
          type: "text",
          title: homeContent.aboutAshram.title,
          subtitle: homeContent.aboutAshram.subtitle,
          content: homeContent.aboutAshram.description,
          order: 2,
        },
        {
          id: "quotes",
          type: "testimonials",
          title: { en: "Words of Wisdom", hi: "ज्ञान के शब्द" },
          items: homeContent.quotes.map((quote) => ({
            id: quote.id,
            description: quote.text,
            title: quote.author,
          })),
          order: 3,
        },
        {
          id: "donation",
          type: "text",
          title: homeContent.donation.title,
          subtitle: homeContent.donation.subtitle,
          order: 4,
        },
      ],
      seo: {
        title: {
          en: "Swami Rupeshwaranand Ji - Spiritual Guidance & Teachings",
          hi: "स्वामी रूपेश्वरानंद जी - आध्यात्मिक मार्गदर्शन और शिक्षाएं",
        },
        description: {
          en: "Experience divine teachings and spiritual guidance from Swami Rupeshwaranand Ji. Join our ashram for meditation, yoga, and spiritual growth.",
          hi: "स्वामी रूपेश्वरानंद जी से दिव्य शिक्षाएं और आध्यात्मिक मार्गदर्शन प्राप्त करें। ध्यान, योग और आध्यात्मिक विकास के लिए हमारे आश्रम से जुड़ें।",
        },
        keywords: ["swami", "rupeshwaranand", "ashram", "spiritual", "meditation", "yoga"],
      },
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Get default page content structure
   */
  private getDefaultPageContent(pageId: PageId): PageContent {
    const pageTitles: Record<PageId, BilingualContent> = {
      home: { en: "Home", hi: "होम" },
      swamiji: { en: "About Swamiji", hi: "स्वामीजी के बारे में" },
      ashram: { en: "About Ashram", hi: "आश्रम के बारे में" },
      teachings: { en: "Teachings", hi: "शिक्षाएं" },
      services: { en: "Services", hi: "सेवाएं" },
      events: { en: "Events", hi: "कार्यक्रम" },
      donation: { en: "Donation", hi: "दान" },
      contact: { en: "Contact Us", hi: "संपर्क करें" },
      gurukul: { en: "Gurukul", hi: "गुरुकुल" },
    };

    return {
      pageId,
      slug: pageId,
      title: pageTitles[pageId] || { en: pageId, hi: pageId },
      sections: [],
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Get home page specific content - fetches from CMS API first, falls back to static
   */
  async getHomeContent(locale: AppLocale): Promise<HomePageContent> {
    if (this.options.useApi) {
      try {
        // Fetch from CMS by slug (public, no auth)
        const cmsPage = await fetchCMSPageBySlug("home");
        if (cmsPage && cmsPage.components && cmsPage.components.length > 0) {
          return this.transformCMSToHomeContent(cmsPage);
        }
        // If no CMS page found, fall through to static
        console.warn("No CMS page found for home, using fallback");
      } catch (error) {
        if (this.options.enableFallback) {
          console.warn("API error for home content, using fallback:", error);
          return homeContent;
        }
        throw error;
      }
    }
    return homeContent;
  }

  /**
   * Transform CMS page+components into HomePageContent shape
   */
  private transformCMSToHomeContent(cmsPage: CMSPageWithComponents): HomePageContent {
    const components = cmsPage.components || [];

    // Helper to get field value from a component
    const getField = (comp: CMSComponent, key: string): ComponentFieldValue | undefined =>
      comp.fields.find((f) => f.key === key);

    const getFieldValue = (comp: CMSComponent, key: string): unknown =>
      getField(comp, key)?.value;

    const getLocalizedField = (comp: CMSComponent, key: string): LocalizedText =>
      (getField(comp, key)?.localizedValue as LocalizedText) || { en: "", hi: "" };

    // Find components by type
    const heroComp = components.find((c) => c.componentType === "hero_section" && c.isVisible);
    const announcementComp = components.find((c) => c.componentType === "announcement_bar" && c.isVisible);
    const teachingsComp = components.find((c) => c.componentType === "sacred_teachings" && c.isVisible);
    const eventsComp = components.find((c) => c.componentType === "upcoming_events" && c.isVisible);
    const wisdomComp = components.find((c) => c.componentType === "words_of_wisdom" && c.isVisible);

    // Build hero slides from the hero component
    const heroSlides: HeroSlide[] = heroComp
      ? [
          {
            id: heroComp.id,
            imageUrl: (getFieldValue(heroComp, "backgroundImage") as string) || "/images/hero-1.svg",
            title: getLocalizedField(heroComp, "heading"),
            subtitle: getLocalizedField(heroComp, "subheading"),
            ctaText: getLocalizedField(heroComp, "ctaText"),
            ctaLink: (getFieldValue(heroComp, "ctaLink") as string) || "/swamiji",
          },
        ]
      : homeContent.heroSlides;

    // Build announcements
    const announcements: AnnouncementItem[] = announcementComp
      ? [
          {
            id: announcementComp.id,
            text: getLocalizedField(announcementComp, "text"),
            link: (getFieldValue(announcementComp, "link") as string) || "/events",
            icon: "🔔",
          },
        ]
      : homeContent.announcements;

    // Build sacred teachings section
    const sacredTeachings = teachingsComp
      ? {
          section: {
            title: getLocalizedField(teachingsComp, "title"),
            subtitle: getLocalizedField(teachingsComp, "subtitle"),
          },
          cards: homeContent.sacredTeachings.cards, // cards are still from static (dynamic later)
        }
      : homeContent.sacredTeachings;

    // Build quotes from words_of_wisdom component
    let quotes: QuoteItem[] = homeContent.quotes;
    if (wisdomComp) {
      const quotesData = getFieldValue(wisdomComp, "quotes");
      if (Array.isArray(quotesData)) {
        quotes = quotesData.map((q: { text?: LocalizedText; author?: LocalizedText }, i: number) => ({
          id: `quote-${i}`,
          text: q.text || { en: "", hi: "" },
          author: q.author || { en: "", hi: "" },
        }));
      }
    }

    // Build events section
    const events: SectionContent = eventsComp
      ? {
          title: getLocalizedField(eventsComp, "title"),
          subtitle: getLocalizedField(eventsComp, "subtitle"),
        }
      : homeContent.events;

    return {
      announcements,
      heroSlides,
      sacredTeachings,
      aboutAshram: homeContent.aboutAshram, // static until CMS component exists
      services: homeContent.services,
      events,
      quotes,
      donation: homeContent.donation,
    };
  }

  /**
   * Get announcements
   */
  async getAnnouncements(locale: AppLocale): Promise<AnnouncementItem[]> {
    const content = await this.getHomeContent(locale);
    return content.announcements || [];
  }

  /**
   * Get hero slides
   */
  async getHeroSlides(locale: AppLocale): Promise<HeroSlide[]> {
    const content = await this.getHomeContent(locale);
    return content.heroSlides || [];
  }

  /**
   * Get sacred teachings
   */
  async getSacredTeachings(locale: AppLocale) {
    const content = await this.getHomeContent(locale);
    return content.sacredTeachings || { section: {}, cards: [] };
  }

  /**
   * Get quotes
   */
  async getQuotes(locale: AppLocale): Promise<QuoteItem[]> {
    const content = await this.getHomeContent(locale);
    return content.quotes || [];
  }
}

// Singleton instance
export const contentProvider = new ContentProvider();

// Convenience functions
export const getPageContent = (pageId: PageId, locale: AppLocale) =>
  contentProvider.getPageContent(pageId, locale);

export const getHomeContent = (locale: AppLocale) =>
  contentProvider.getHomeContent(locale);

export const getAnnouncements = (locale: AppLocale) =>
  contentProvider.getAnnouncements(locale);

export const getHeroSlides = (locale: AppLocale) =>
  contentProvider.getHeroSlides(locale);

export const getSacredTeachings = (locale: AppLocale) =>
  contentProvider.getSacredTeachings(locale);

export const getQuotes = (locale: AppLocale) =>
  contentProvider.getQuotes(locale);

/**
 * Helper to get localized text
 */
export function t(content: BilingualContent | undefined, locale: AppLocale): string {
  if (!content) return "";
  return content[locale] || content.en || "";
}

export default contentProvider;
