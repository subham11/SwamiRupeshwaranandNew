"use client";

import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import "swiper/css/effect-coverflow";
import { Autoplay, Pagination, Navigation, EffectCoverflow } from "swiper/modules";
import { motion } from "motion/react";
import type { AppLocale } from "@/i18n/config";

const stallImages = [
  { src: "/images/stall-1.jpg", alt: { en: "Brahmavadini Foundation Exhibition Stall - Tent Setup", hi: "ब्रह्मवादिनी फाउंडेशन प्रदर्शनी स्टॉल - तंबू सेटअप" } },
  { src: "/images/stall-2.jpg", alt: { en: "Brahmavadini Foundation Exhibition Stall - Premium Booth", hi: "ब्रह्मवादिनी फाउंडेशन प्रदर्शनी स्टॉल - प्रीमियम बूथ" } },
  { src: "/images/stall-3.jpg", alt: { en: "Brahmavadini Foundation Exhibition Stall - Modern Design", hi: "ब्रह्मवादिनी फाउंडेशन प्रदर्शनी स्टॉल - आधुनिक डिज़ाइन" } },
  { src: "/images/stall-4.jpg", alt: { en: "Brahmavadini Foundation Exhibition Stall - Blue Canopy", hi: "ब्रह्मवादिनी फाउंडेशन प्रदर्शनी स्टॉल - नीला शामियाना" } },
];

function t(obj: { en: string; hi: string }, locale: AppLocale) {
  return obj[locale] || obj.en;
}

export default function StallCarousel({ locale }: { locale: AppLocale }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6 }}
    >
      <Swiper
        modules={[Autoplay, Pagination, Navigation, EffectCoverflow]}
        effect="coverflow"
        grabCursor
        centeredSlides
        loop
        autoplay={{ delay: 3500, disableOnInteraction: false }}
        pagination={{ clickable: true }}
        navigation
        coverflowEffect={{
          rotate: 0,
          stretch: 0,
          depth: 120,
          modifier: 2.5,
          slideShadows: false,
        }}
        slidesPerView={1.2}
        breakpoints={{
          640: { slidesPerView: 1.5 },
          1024: { slidesPerView: 2.2 },
        }}
        className="stall-carousel !pb-14"
      >
        {stallImages.map((img, i) => (
          <SwiperSlide key={i}>
            <motion.div
              className="relative aspect-[16/10] rounded-2xl overflow-hidden shadow-lg border"
              style={{ borderColor: "var(--color-border)" }}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <Image
                src={img.src}
                alt={t(img.alt, locale)}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 90vw, (max-width: 1024px) 60vw, 45vw"
              />
              {/* Subtle gradient overlay at bottom */}
              <div
                className="absolute inset-x-0 bottom-0 h-1/4"
                style={{
                  background: "linear-gradient(to top, rgba(0,0,0,0.35), transparent)",
                }}
              />
            </motion.div>
          </SwiperSlide>
        ))}
      </Swiper>

      <style jsx global>{`
        .stall-carousel .swiper-pagination-bullet {
          width: 10px;
          height: 10px;
          background: var(--color-muted);
          opacity: 0.4;
          transition: all 0.3s ease;
        }
        .stall-carousel .swiper-pagination-bullet-active {
          background: var(--color-gold);
          opacity: 1;
          transform: scale(1.2);
        }
        .stall-carousel .swiper-button-prev,
        .stall-carousel .swiper-button-next {
          color: var(--color-gold);
          width: 40px;
          height: 40px;
          background: rgba(255,255,255,0.9);
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }
        .stall-carousel .swiper-button-prev::after,
        .stall-carousel .swiper-button-next::after {
          font-size: 16px;
          font-weight: bold;
        }
        @media (max-width: 640px) {
          .stall-carousel .swiper-button-prev,
          .stall-carousel .swiper-button-next {
            display: none;
          }
        }
      `}</style>
    </motion.div>
  );
}
