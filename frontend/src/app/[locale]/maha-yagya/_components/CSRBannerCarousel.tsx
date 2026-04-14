"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/effect-fade";
import { Autoplay, Pagination, EffectFade } from "swiper/modules";
import type { AppLocale } from "@/i18n/config";

const banners = [
  {
    src: "/images/csr-partner-banner.jpg",
    alt: { en: "Become Our CSR Partner", hi: "हमारे CSR पार्टनर बनें" },
  },
  {
    src: "/images/csr-partner-banner_01.jpg",
    alt: { en: "CSR Partner — 750 Cr Tree Plantation Initiative", hi: "CSR पार्टनर — 750 करोड़ वृक्षारोपण पहल" },
  },
];

export default function CSRBannerCarousel({ locale }: { locale: AppLocale }) {
  return (
    <div className="csr-banner-carousel max-w-2xl mx-auto">
      <Swiper
        modules={[Autoplay, Pagination, EffectFade]}
        effect="fade"
        fadeEffect={{ crossFade: true }}
        loop
        autoplay={{ delay: 4500, disableOnInteraction: false }}
        pagination={{ clickable: true }}
        className="rounded-2xl overflow-hidden shadow-2xl border border-white/10"
      >
        {banners.map((b, i) => (
          <SwiperSlide key={i}>
            <a href="#stall-options" className="block">
              <img
                src={b.src}
                alt={b.alt[locale] || b.alt.en}
                className="w-full h-auto block"
              />
            </a>
          </SwiperSlide>
        ))}
      </Swiper>

      <style jsx global>{`
        .csr-banner-carousel .swiper-pagination {
          position: absolute;
          bottom: 12px;
          z-index: 10;
        }
        .csr-banner-carousel .swiper-pagination-bullet {
          width: 10px;
          height: 10px;
          background: rgba(255, 255, 255, 0.6);
          opacity: 1;
          transition: all 0.3s ease;
        }
        .csr-banner-carousel .swiper-pagination-bullet-active {
          background: var(--color-gold);
          transform: scale(1.25);
        }
      `}</style>
    </div>
  );
}
