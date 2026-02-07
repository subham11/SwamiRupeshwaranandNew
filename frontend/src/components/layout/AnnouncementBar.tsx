"use client";

import Link from "next/link";
import { type AnnouncementItem } from "@/content/pageContent";

interface AnnouncementBarProps {
  locale: "en" | "hi";
  announcements: AnnouncementItem[];
}

export default function AnnouncementBar({ locale, announcements }: AnnouncementBarProps) {
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
