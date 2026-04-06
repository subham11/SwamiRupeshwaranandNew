"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import { Autoplay, Pagination, Navigation } from "swiper/modules";
import type { AppLocale } from "@/i18n/config";

interface Speaker {
  name: { en: string; hi: string };
  title: { en: string; hi: string };
  image?: string;
}

const speakers: Speaker[] = [
  {
    name: { en: "Speaker 1", hi: "वक्ता 1" },
    title: { en: "Spiritual Leader", hi: "आध्यात्मिक नेता" },
  },
  {
    name: { en: "Speaker 2", hi: "वक्ता 2" },
    title: { en: "Wellness Expert", hi: "कल्याण विशेषज्ञ" },
  },
  {
    name: { en: "Speaker 3", hi: "वक्ता 3" },
    title: { en: "Yoga Guru", hi: "योग गुरु" },
  },
  {
    name: { en: "Speaker 4", hi: "वक्ता 4" },
    title: { en: "Vedic Scholar", hi: "वैदिक विद्वान" },
  },
  {
    name: { en: "Speaker 5", hi: "वक्ता 5" },
    title: { en: "Ayurveda Specialist", hi: "आयुर्वेद विशेषज्ञ" },
  },
  {
    name: { en: "Speaker 6", hi: "वक्ता 6" },
    title: { en: "Health & Nutrition Coach", hi: "स्वास्थ्य और पोषण कोच" },
  },
  {
    name: { en: "Speaker 7", hi: "वक्ता 7" },
    title: { en: "Cultural Ambassador", hi: "सांस्कृतिक दूत" },
  },
  {
    name: { en: "Speaker 8", hi: "वक्ता 8" },
    title: { en: "Meditation Teacher", hi: "ध्यान शिक्षक" },
  },
];

function t(obj: { en: string; hi: string }, locale: AppLocale) {
  return obj[locale] || obj.en;
}

export default function SpeakersCarousel({ locale }: { locale: AppLocale }) {
  return (
    <Swiper
      modules={[Autoplay, Pagination, Navigation]}
      spaceBetween={20}
      slidesPerView={2}
      loop
      autoplay={{ delay: 3000, disableOnInteraction: false }}
      pagination={{ clickable: true }}
      navigation
      breakpoints={{
        480: { slidesPerView: 2, spaceBetween: 20 },
        640: { slidesPerView: 3, spaceBetween: 24 },
        1024: { slidesPerView: 4, spaceBetween: 28 },
        1280: { slidesPerView: 5, spaceBetween: 28 },
      }}
      className="speakers-swiper !pb-12"
    >
      {speakers.map((speaker, i) => (
        <SwiperSlide key={i}>
          <div className="flex flex-col items-center text-center group">
            {/* Avatar placeholder */}
            <div
              className="relative w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-full overflow-hidden mb-4 border-3 transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg"
              style={{ borderColor: "var(--color-gold)" }}
            >
              {speaker.image ? (
                <img
                  src={speaker.image}
                  alt={t(speaker.name, locale)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{ backgroundColor: "var(--color-secondary)" }}
                >
                  {/* Blank person silhouette */}
                  <svg
                    className="w-16 h-16 sm:w-20 sm:h-20"
                    style={{ color: "var(--color-muted)", opacity: 0.4 }}
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v1.2c0 .7.5 1.2 1.2 1.2h16.8c.7 0 1.2-.5 1.2-1.2v-1.2c0-3.2-6.4-4.8-9.6-4.8z" />
                  </svg>
                </div>
              )}
            </div>
            {/* Name */}
            <h4
              className="font-heading text-base sm:text-lg font-semibold mb-1 transition-colors duration-300"
              style={{ color: "var(--color-primary)" }}
            >
              {t(speaker.name, locale)}
            </h4>
            {/* Title */}
            <p className="text-xs sm:text-sm" style={{ color: "var(--color-muted)" }}>
              {t(speaker.title, locale)}
            </p>
          </div>
        </SwiperSlide>
      ))}
    </Swiper>
  );
}
