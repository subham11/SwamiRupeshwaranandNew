"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation, EffectFade } from "swiper/modules";
import { motion } from "motion/react";
import Image from "next/image";
import type { AppLocale } from "@/i18n/config";

import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import "swiper/css/effect-fade";

interface Slide {
  image: string;
  title?: Record<string, string>;
  subtitle?: Record<string, string>;
  cta_text?: Record<string, string>;
  cta_link?: string;
  overlay_color?: string;
}

interface BannerCarouselProps {
  slides: Slide[];
  autoplay?: boolean;
  autoplayDelay?: number;
  showPagination?: boolean;
  showNavigation?: boolean;
  loop?: boolean;
  height?: "small" | "medium" | "large" | "full";
  locale: AppLocale;
}

const heightMap = {
  small: "h-[300px]",
  medium: "h-[400px]",
  large: "h-[500px] sm:h-[600px]",
  full: "h-screen",
};

export default function BannerCarousel({
  slides,
  autoplay = true,
  autoplayDelay = 5000,
  showPagination = true,
  showNavigation = true,
  loop = true,
  height = "large",
  locale,
}: BannerCarouselProps) {
  if (!slides || slides.length === 0) return null;

  return (
    <div className={`relative w-full ${heightMap[height] || heightMap.large}`}>
      <Swiper
        modules={[Autoplay, Pagination, Navigation, EffectFade]}
        effect="fade"
        autoplay={autoplay ? { delay: autoplayDelay, disableOnInteraction: false } : false}
        pagination={showPagination ? { clickable: true } : false}
        navigation={showNavigation}
        loop={loop}
        className="h-full w-full [&_.swiper-pagination-bullet]:w-3 [&_.swiper-pagination-bullet]:h-3 [&_.swiper-pagination-bullet-active]:bg-amber-500"
      >
        {slides.map((slide, i) => (
          <SwiperSlide key={i}>
            <div className="relative h-full w-full">
              {/* Background Image */}
              <Image
                src={slide.image}
                alt={slide.title?.[locale] || slide.title?.en || `Slide ${i + 1}`}
                fill
                className="object-cover"
                priority={i === 0}
              />

              {/* Overlay */}
              <div
                className="absolute inset-0"
                style={{
                  backgroundColor: slide.overlay_color || "rgba(0,0,0,0.4)",
                }}
              />

              {/* Content */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center px-6 max-w-4xl">
                  {slide.title && (
                    <motion.h2
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.2 }}
                      className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4"
                    >
                      {slide.title[locale] || slide.title.en}
                    </motion.h2>
                  )}
                  {slide.subtitle && (
                    <motion.p
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.4 }}
                      className="text-lg sm:text-xl text-white/80 mb-6"
                    >
                      {slide.subtitle[locale] || slide.subtitle.en}
                    </motion.p>
                  )}
                  {slide.cta_text && slide.cta_link && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.6 }}
                    >
                      <a
                        href={slide.cta_link}
                        className="inline-block px-8 py-3 rounded-lg font-semibold text-white transition-all hover:brightness-110 hover:shadow-lg"
                        style={{
                          background: "linear-gradient(135deg, var(--color-gold), var(--color-accent))",
                        }}
                      >
                        {slide.cta_text[locale] || slide.cta_text.en}
                      </a>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
