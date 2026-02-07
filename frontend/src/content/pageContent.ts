/**
 * Centralized Page Content Configuration
 * 
 * FUTURE: This content will come from database/API via page IDs.
 * Currently serves as a structured placeholder that can be easily
 * replaced with API calls.
 * 
 * Usage: import { getPageContent } from "@/content/pageContent";
 *        const content = await getPageContent("home", locale);
 */

import type { AppLocale } from "@/i18n/config";

// Content Types
export interface LocalizedText {
  en: string;
  hi: string;
}

export interface AnnouncementItem {
  id: string;
  text: LocalizedText;
  link: string;
  icon?: string;
  bgColor?: string;
  textColor?: string;
}

export interface TeachingCard {
  id: string;
  slug: string;
  icon: string;
  imageUrl: string;
  title: LocalizedText;
  description: LocalizedText;
  link: string;
}

export interface HeroSlide {
  id: string;
  imageUrl: string;
  title: LocalizedText;
  subtitle: LocalizedText;
  ctaText: LocalizedText;
  ctaLink: string;
}

export interface QuoteItem {
  id: string;
  text: LocalizedText;
  author: LocalizedText;
}

export interface SectionContent {
  title: LocalizedText;
  subtitle: LocalizedText;
  description?: LocalizedText;
}

// Page Content Interface
export interface HomePageContent {
  announcements: AnnouncementItem[];
  heroSlides: HeroSlide[];
  sacredTeachings: {
    section: SectionContent;
    cards: TeachingCard[];
  };
  aboutAshram: SectionContent & {
    ctaPrimary: LocalizedText;
    ctaSecondary: LocalizedText;
  };
  services: SectionContent;
  events: SectionContent;
  quotes: QuoteItem[];
  donation: SectionContent & {
    ctaText: LocalizedText;
  };
}

// Static Content (Replace with API calls later)
const homeContent: HomePageContent = {
  announcements: [
    {
      id: "ann-1",
      text: {
        en: "🔔 Join us for Hanuman Chalisa Path every Tuesday at 7 AM",
        hi: "🔔 हर मंगलवार को सुबह 7 बजे हनुमान चालीसा पाठ के लिए हमसे जुड़ें"
      },
      link: "/events",
      icon: "🔔"
    },
    {
      id: "ann-2",
      text: {
        en: "🎉 Special Bhandara on Nov 25th",
        hi: "🎉 25 नवंबर को विशेष भंडारा"
      },
      link: "/events",
      icon: "🎉"
    },
    {
      id: "ann-3",
      text: {
        en: "📿 New Yoga Sessions starting Nov 20th",
        hi: "📿 20 नवंबर से नई योग कक्षाएं"
      },
      link: "/services",
      icon: "📿"
    },
    {
      id: "ann-4",
      text: {
        en: "🙏 Daily Satsang at 6 PM",
        hi: "🙏 रोज शाम 6 बजे सत्संग"
      },
      link: "/swamiji",
      icon: "🙏"
    },
    {
      id: "ann-5",
      text: {
        en: "✨ Mahashivratri Special Programs - Feb 15, 2026",
        hi: "✨ महाशिवरात्रि विशेष कार्यक्रम - 15 फरवरी 2026"
      },
      link: "/events",
      icon: "✨"
    }
  ],

  heroSlides: [
    {
      id: "hero-1",
      imageUrl: "/images/hero-1.svg",
      title: {
        en: "Divine Guidance For Modern Life",
        hi: "आधुनिक जीवन के लिए दैवीय मार्गदर्शन"
      },
      subtitle: {
        en: "Discover the path to inner peace and spiritual awakening",
        hi: "आंतरिक शांति और आध्यात्मिक जागृति का मार्ग खोजें"
      },
      ctaText: { en: "Explore Now", hi: "अभी खोजें" },
      ctaLink: "/swamiji"
    },
    {
      id: "hero-2",
      imageUrl: "/images/hero-2.svg",
      title: {
        en: "Daily Inspirations & Teachings",
        hi: "दैनिक प्रेरणा और शिक्षाएं"
      },
      subtitle: {
        en: "Ancient wisdom for contemporary challenges",
        hi: "समकालीन चुनौतियों के लिए प्राचीन ज्ञान"
      },
      ctaText: { en: "Learn More", hi: "और जानें" },
      ctaLink: "/teachings"
    },
    {
      id: "hero-3",
      imageUrl: "/images/hero-3.svg",
      title: {
        en: "Path to Inner Peace",
        hi: "आंतरिक शांति का मार्ग"
      },
      subtitle: {
        en: "Find tranquility through meditation and devotion",
        hi: "ध्यान और भक्ति के माध्यम से शांति पाएं"
      },
      ctaText: { en: "Start Journey", hi: "यात्रा शुरू करें" },
      ctaLink: "/ashram"
    }
  ],

  sacredTeachings: {
    section: {
      title: {
        en: "Sacred Teachings",
        hi: "पवित्र शिक्षाएं"
      },
      subtitle: {
        en: "Timeless wisdom for modern living",
        hi: "आधुनिक जीवन के लिए कालजयी ज्ञान"
      }
    },
    cards: [
      {
        id: "teaching-1",
        slug: "inner-peace",
        icon: "🙏",
        imageUrl: "/images/hero-1.svg",
        title: {
          en: "Path to Inner Peace",
          hi: "आंतरिक शांति का मार्ग"
        },
        description: {
          en: "Discover ancient techniques for finding tranquility in the modern world through meditation and mindful living.",
          hi: "ध्यान और सचेत जीवन के माध्यम से आधुनिक दुनिया में शांति पाने की प्राचीन तकनीकें खोजें।"
        },
        link: "/teachings/inner-peace"
      },
      {
        id: "teaching-2",
        slug: "mantras",
        icon: "📿",
        imageUrl: "/images/hero-2.svg",
        title: {
          en: "Power of Mantras",
          hi: "मंत्रों की शक्ति"
        },
        description: {
          en: "Learn how sacred sounds and vibrations can transform your consciousness and connect you with the divine.",
          hi: "जानें कैसे पवित्र ध्वनियां और कंपन आपकी चेतना को बदल सकते हैं और आपको परमात्मा से जोड़ सकते हैं।"
        },
        link: "/teachings/mantras"
      },
      {
        id: "teaching-3",
        slug: "seva",
        icon: "🙏🏻",
        imageUrl: "/images/hero-3.svg",
        title: {
          en: "Service to Humanity",
          hi: "मानवता की सेवा"
        },
        description: {
          en: "Understand why selfless service (Seva) is considered the highest form of spiritual practice.",
          hi: "समझें कि निःस्वार्थ सेवा (सेवा) को सर्वोच्च आध्यात्मिक अभ्यास क्यों माना जाता है।"
        },
        link: "/teachings/seva"
      },
      {
        id: "teaching-4",
        slug: "dharma",
        icon: "🙏🏼",
        imageUrl: "/images/hero-1.svg",
        title: {
          en: "Living with Purpose",
          hi: "उद्देश्य के साथ जीना"
        },
        description: {
          en: "Find your dharma and learn to align your daily actions with your higher spiritual purpose.",
          hi: "अपने धर्म को खोजें और अपनी दैनिक क्रियाओं को अपने उच्च आध्यात्मिक उद्देश्य के साथ संरेखित करना सीखें।"
        },
        link: "/teachings/dharma"
      }
    ]
  },

  aboutAshram: {
    title: {
      en: "Sri Pitambara Peeth",
      hi: "श्री पीताम्बरा पीठ"
    },
    subtitle: {
      en: "Your Gateway to Vaikuntha",
      hi: "जीवन में शक्ति, सफलता एबं मोक्ष"
    },
    description: {
      en: "In the sacred land of the Himalayas, where sages once performed deep penance and awakened the cosmic energies, lies the holy abode of Sri Pitambara Peeth.",
      hi: "हिमालय की पवित्र भूमि में, जहाँ ऋषियों ने गहन तपस्या की और ब्रह्मांडीय ऊर्जाओं को जागृत किया, वहाँ श्री पीताम्बरा पीठ का पवित्र निवास है।"
    },
    ctaPrimary: {
      en: "Explore Ashram",
      hi: "आश्रम देखें"
    },
    ctaSecondary: {
      en: "About Swamiji",
      hi: "स्वामीजी के बारे में"
    }
  },

  services: {
    title: {
      en: "Services & Offerings",
      hi: "सेवाएं एवं अनुष्ठान"
    },
    subtitle: {
      en: "Sacred spiritual services available at the ashram",
      hi: "आश्रम में उपलब्ध विभिन्न आध्यात्मिक सेवाएं"
    }
  },

  events: {
    title: {
      en: "Upcoming Events",
      hi: "आगामी कार्यक्रम"
    },
    subtitle: {
      en: "Join us for spiritual gatherings and community activities",
      hi: "आध्यात्मिक सभाओं और सामुदायिक गतिविधियों में हमसे जुड़ें"
    }
  },

  quotes: [
    {
      id: "quote-1",
      text: {
        en: "The mind is everything. What you think, you become.",
        hi: "मन ही सब कुछ है। जो आप सोचते हैं, वही आप बन जाते हैं।"
      },
      author: {
        en: "Swami Rupeshwaranand",
        hi: "स्वामी रूपेश्वरानंद"
      }
    },
    {
      id: "quote-2",
      text: {
        en: "In the silence of the heart, God speaks.",
        hi: "हृदय की शांति में, ईश्वर बोलते हैं।"
      },
      author: {
        en: "Swami Rupeshwaranand",
        hi: "स्वामी रूपेश्वरानंद"
      }
    },
    {
      id: "quote-3",
      text: {
        en: "Service to humanity is service to God.",
        hi: "मानवता की सेवा ही ईश्वर की सेवा है।"
      },
      author: {
        en: "Swami Rupeshwaranand",
        hi: "स्वामी रूपेश्वरानंद"
      }
    }
  ],

  donation: {
    title: {
      en: "Support Our Mission",
      hi: "हमारे मिशन का समर्थन करें"
    },
    subtitle: {
      en: "Your contribution helps us spread the light of knowledge",
      hi: "आपका योगदान हमें ज्ञान की रोशनी फैलाने में मदद करता है"
    },
    ctaText: {
      en: "Make a Donation",
      hi: "दान करें"
    }
  }
};

/**
 * Get page content by page ID
 * FUTURE: Replace with API call - await fetch(`/api/content/${pageId}?locale=${locale}`)
 */
export async function getPageContent(pageId: string, locale: AppLocale): Promise<HomePageContent> {
  // TODO: Replace with actual API call
  // const response = await fetch(`${process.env.API_URL}/pages/${pageId}?locale=${locale}`);
  // return response.json();
  
  return homeContent;
}

/**
 * Get announcements
 * FUTURE: Replace with API call
 */
export async function getAnnouncements(locale: AppLocale): Promise<AnnouncementItem[]> {
  // TODO: Replace with actual API call
  return homeContent.announcements;
}

/**
 * Get sacred teachings
 * FUTURE: Replace with API call
 */
export async function getSacredTeachings(locale: AppLocale) {
  // TODO: Replace with actual API call
  return homeContent.sacredTeachings;
}

/**
 * Get hero slides
 * FUTURE: Replace with API call
 */
export async function getHeroSlides(locale: AppLocale): Promise<HeroSlide[]> {
  // TODO: Replace with actual API call
  return homeContent.heroSlides;
}

/**
 * Get quotes
 * FUTURE: Replace with API call
 */
export async function getQuotes(locale: AppLocale): Promise<QuoteItem[]> {
  // TODO: Replace with actual API call
  return homeContent.quotes;
}

// Export static content for direct access if needed
export { homeContent };
