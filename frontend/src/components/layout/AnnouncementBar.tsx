"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { type AnnouncementItem, type LocalizedText } from "@/content/pageContent";

// Static fallback announcements (used while loading or if API fails)
const FALLBACK_ANNOUNCEMENTS: AnnouncementItem[] = [
  {
    id: "ann-1",
    text: { en: "🔔 Join us for Hanuman Chalisa Path every Tuesday at 7 AM", hi: "🔔 हर मंगलवार को सुबह 7 बजे हनुमान चालीसा पाठ के लिए हमसे जुड़ें" },
    link: "/events",
  },
  {
    id: "ann-2",
    text: { en: "🎉 Special Bhandara on Nov 25th", hi: "🎉 25 नवंबर को विशेष भंडारा" },
    link: "/events",
  },
  {
    id: "ann-3",
    text: { en: "📿 New Yoga Sessions starting Nov 20th", hi: "📿 20 नवंबर से नई योग कक्षाएं" },
    link: "/services",
  },
  {
    id: "ann-4",
    text: { en: "🙏 Daily Satsang at 6 PM", hi: "🙏 रोज शाम 6 बजे सत्संग" },
    link: "/swamiji",
  },
  {
    id: "ann-5",
    text: { en: "✨ Mahashivratri Special Programs - Feb 15, 2026", hi: "✨ महाशिवरात्रि विशेष कार्यक्रम - 15 फरवरी 2026" },
    link: "/events",
  },
];

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:2026").replace(/\/api\/v1\/?$/, "") + "/api/v1";

interface CMSComponent {
  id: string;
  componentType: string;
  isVisible: boolean;
  fields: { key: string; value?: unknown; localizedValue?: Record<string, string> }[];
}

interface CMSPageWithComponents {
  slug: string;
  components?: CMSComponent[];
}

/**
 * Fetch all announcements from CMS (client-side).
 * Scans all published pages for announcement_bar components.
 */
async function fetchAnnouncementsFromCMS(): Promise<AnnouncementItem[]> {
  try {
    // 1. Get all published pages
    const pagesRes = await fetch(`${API_BASE}/cms/pages?publishedOnly=true`);
    if (!pagesRes.ok) return [];
    const pagesData: { items: { slug: string }[] } = await pagesRes.json();
    if (!pagesData.items?.length) return [];

    // 2. Fetch each page's components and collect announcement bars
    const allAnnouncements: AnnouncementItem[] = [];

    await Promise.all(
      pagesData.items.map(async (page) => {
        try {
          const pageRes = await fetch(`${API_BASE}/cms/pages/by-slug/${page.slug}`);
          if (!pageRes.ok) return;
          const cmsPage: CMSPageWithComponents = await pageRes.json();
          if (!cmsPage.components) return;

          const announcementComps = cmsPage.components.filter(
            (c) => c.componentType === "announcement_bar" && c.isVisible
          );

          for (const comp of announcementComps) {
            const textField = comp.fields.find((f) => f.key === "text");
            const linkField = comp.fields.find((f) => f.key === "link");

            if (textField) {
              allAnnouncements.push({
                id: comp.id,
                text: (textField.localizedValue as unknown as LocalizedText) || {
                  en: String(textField.value || ""),
                  hi: "",
                },
                link: (linkField?.value as string) || `/${page.slug}`,
                icon: "🔔",
              });
            }
          }
        } catch {
          // skip individual page failures
        }
      })
    );

    return allAnnouncements;
  } catch {
    return [];
  }
}

interface AnnouncementBarProps {
  locale: "en" | "hi";
  announcements?: AnnouncementItem[];
}

export default function AnnouncementBar({ locale, announcements: initialAnnouncements }: AnnouncementBarProps) {
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>(
    initialAnnouncements ?? FALLBACK_ANNOUNCEMENTS
  );

  useEffect(() => {
    // Fetch fresh announcements from CMS on client side
    fetchAnnouncementsFromCMS().then((cmsAnnouncements) => {
      if (cmsAnnouncements.length > 0) {
        setAnnouncements(cmsAnnouncements);
      }
      // If CMS returns nothing, keep the initial/fallback announcements
    });
  }, []);

  if (!announcements || announcements.length === 0) return null;

  return (
    <div 
      className="w-full overflow-hidden relative"
      style={{ 
        background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))'
      }}
    >
      {/* Continuous Scrolling Marquee */}
      <div className="overflow-hidden py-2.5">
        <div className="marquee-container">
          <div className="marquee-content">
            {announcements.map((item, idx) => (
              <Link
                key={`${item.id}-1-${idx}`}
                href={`/${locale}${item.link}`}
                className="inline-flex items-center text-white text-sm md:text-base font-medium hover:underline whitespace-nowrap mx-4"
              >
                {item.text[locale]}
              </Link>
            ))}
            {/* Duplicate for seamless loop */}
            {announcements.map((item, idx) => (
              <Link
                key={`${item.id}-2-${idx}`}
                href={`/${locale}${item.link}`}
                className="inline-flex items-center text-white text-sm md:text-base font-medium hover:underline whitespace-nowrap mx-4"
              >
                {item.text[locale]}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* CSS for marquee animation */}
      <style jsx>{`
        .marquee-container {
          display: flex;
          overflow: hidden;
          width: 100%;
        }
        .marquee-content {
          display: flex;
          animation: marquee 40s linear infinite;
          will-change: transform;
        }
        .marquee-content:hover {
          animation-play-state: paused;
        }
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
}
