"use client";

import Link from "next/link";
import { type AnnouncementItem } from "@/content/pageContent";

// Static content for client component (will be passed as prop from server in future)
const announcements: AnnouncementItem[] = [
  {
    id: "ann-1",
    text: {
      en: "🔔 Join us for Hanuman Chalisa Path every Tuesday at 7 AM",
      hi: "🔔 हर मंगलवार को सुबह 7 बजे हनुमान चालीसा पाठ के लिए हमसे जुड़ें"
    },
    link: "/events"
  },
  {
    id: "ann-2",
    text: {
      en: "🎉 Special Bhandara on Nov 25th",
      hi: "🎉 25 नवंबर को विशेष भंडारा"
    },
    link: "/events"
  },
  {
    id: "ann-3",
    text: {
      en: "📿 New Yoga Sessions starting Nov 20th",
      hi: "📿 20 नवंबर से नई योग कक्षाएं"
    },
    link: "/services"
  },
  {
    id: "ann-4",
    text: {
      en: "🙏 Daily Satsang at 6 PM",
      hi: "🙏 रोज शाम 6 बजे सत्संग"
    },
    link: "/swamiji"
  },
  {
    id: "ann-5",
    text: {
      en: "✨ Mahashivratri Special Programs - Feb 15, 2026",
      hi: "✨ महाशिवरात्रि विशेष कार्यक्रम - 15 फरवरी 2026"
    },
    link: "/events"
  }
];

export default function AnnouncementBar({ locale }: { locale: "en" | "hi" }) {
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
