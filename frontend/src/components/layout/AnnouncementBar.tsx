"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { type AnnouncementItem } from "@/content/pageContent";

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

interface AnnouncementCMSData {
  textHtml: Record<string, string>;
  bgColor: string;
  textColor: string;
  link: string;
  isScrolling: boolean;
  ariaLabel: string;
}

function getFieldValue(fields: CMSComponent["fields"], key: string): unknown {
  const field = fields.find((f) => f.key === key);
  if (!field) return undefined;
  return field.value;
}

function getFieldLocalizedValue(fields: CMSComponent["fields"], key: string): Record<string, string> | undefined {
  const field = fields.find((f) => f.key === key);
  if (!field) return undefined;
  return field.localizedValue;
}

/**
 * Fetch announcement bar data from the global CMS components endpoint.
 */
async function fetchAnnouncementFromCMS(): Promise<AnnouncementCMSData | null> {
  try {
    const res = await fetch(`${API_BASE}/cms/components/global/public`);
    if (!res.ok) return null;
    const data: { items: CMSComponent[]; count: number } = await res.json();
    const comp = data.items.find((c) => c.componentType === "announcement_bar" && c.isVisible);
    if (!comp) return null;

    const textLocalized = getFieldLocalizedValue(comp.fields, "text");
    if (!textLocalized) return null;

    return {
      textHtml: textLocalized,
      bgColor: (getFieldValue(comp.fields, "bgColor") as string) || "#f97316",
      textColor: (getFieldValue(comp.fields, "textColor") as string) || "#ffffff",
      link: (getFieldValue(comp.fields, "link") as string) || "",
      isScrolling: getFieldValue(comp.fields, "isScrolling") !== false,
      ariaLabel: (getFieldValue(comp.fields, "ariaLabel") as string) || "Announcements",
    };
  } catch {
    return null;
  }
}

/**
 * Strip HTML tags to get plain text (for checking emptiness).
 */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

interface AnnouncementBarProps {
  locale: "en" | "hi";
  announcements?: AnnouncementItem[];
}

export default function AnnouncementBar({ locale, announcements: initialAnnouncements }: AnnouncementBarProps) {
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>(
    initialAnnouncements ?? FALLBACK_ANNOUNCEMENTS
  );
  const [cmsData, setCmsData] = useState<AnnouncementCMSData | null>(null);

  useEffect(() => {
    fetchAnnouncementFromCMS().then((data) => {
      if (data && stripHtml(data.textHtml[locale] || "")) {
        setCmsData(data);
      }
    });
  }, [locale]);

  // CMS-driven rich text announcement bar
  if (cmsData) {
    const htmlContent = cmsData.textHtml[locale] || cmsData.textHtml.en || "";
    if (!stripHtml(htmlContent)) return null;

    const content = (
      <div
        className="announcement-rich-text"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    );

    const wrappedContent = cmsData.link ? (
      <Link href={`/${locale}${cmsData.link.startsWith("/") ? cmsData.link : `/${cmsData.link}`}`} className="hover:underline">
        {content}
      </Link>
    ) : content;

    return (
      <div
        className="w-full overflow-hidden relative"
        style={{ backgroundColor: cmsData.bgColor, color: cmsData.textColor }}
        role="marquee"
        aria-label={cmsData.ariaLabel}
      >
        <div className="overflow-hidden py-2.5">
          {cmsData.isScrolling ? (
            <div className="marquee-container">
              <div className="marquee-content">
                <span className="inline-flex items-center whitespace-nowrap mx-8">{wrappedContent}</span>
                <span className="inline-flex items-center whitespace-nowrap mx-8">{wrappedContent}</span>
              </div>
            </div>
          ) : (
            <div className="text-center text-sm md:text-base font-medium px-4">
              {wrappedContent}
            </div>
          )}
        </div>

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
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
        `}</style>
        <style jsx global>{`
          .announcement-rich-text p { display: inline; margin: 0; }
          .announcement-rich-text a { text-decoration: underline; }
        `}</style>
      </div>
    );
  }

  // Fallback: individual announcement items
  if (!announcements || announcements.length === 0) return null;

  const validAnnouncements = announcements.filter(
    (item) => item.text[locale]?.trim()
  );

  if (validAnnouncements.length === 0) return null;

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
            {validAnnouncements.map((item, idx) => (
              <Link
                key={`${item.id}-1-${idx}`}
                href={`/${locale}${item.link}`}
                aria-label={item.text[locale]}
                className="inline-flex items-center text-white text-sm md:text-base font-medium hover:underline whitespace-nowrap mx-4"
              >
                {item.text[locale]}
              </Link>
            ))}
            {/* Duplicate for seamless loop */}
            {validAnnouncements.map((item, idx) => (
              <Link
                key={`${item.id}-2-${idx}`}
                href={`/${locale}${item.link}`}
                aria-label={item.text[locale]}
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
