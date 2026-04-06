"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, FreeMode } from "swiper/modules";
import Image from "next/image";
import type { AppLocale } from "@/i18n/config";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/Decorative";

import "swiper/css";
import "swiper/css/free-mode";

interface StripItem {
  image: string;
  name?: Record<string, string>;
  title?: Record<string, string>;
  description?: Record<string, string>;
}

interface ImageTextStripProps {
  title?: string;
  subtitle?: string;
  items: StripItem[];
  autoScroll?: boolean;
  scrollSpeed?: number;
  cardStyle?: "rounded" | "circular" | "square";
  showDescription?: boolean;
  locale: AppLocale;
}

const imageStyleMap = {
  rounded: "rounded-xl",
  circular: "rounded-full",
  square: "rounded-none",
};

export default function ImageTextStrip({
  title,
  subtitle,
  items,
  autoScroll = true,
  scrollSpeed = 3000,
  cardStyle = "rounded",
  showDescription = true,
  locale,
}: ImageTextStripProps) {
  if (!items || items.length === 0) return null;

  const isCircular = cardStyle === "circular";

  return (
    <section className="py-12 sm:py-16">
      <Container>
        {title && <SectionHeading title={title} subtitle={subtitle} />}
        <Swiper
          modules={[Autoplay, FreeMode]}
          freeMode={true}
          autoplay={
            autoScroll
              ? { delay: scrollSpeed, disableOnInteraction: false, pauseOnMouseEnter: true }
              : false
          }
          spaceBetween={16}
          slidesPerView="auto"
          breakpoints={{
            0: { slidesPerView: 1.5 },
            640: { slidesPerView: 2.5 },
            768: { slidesPerView: 3.5 },
            1024: { slidesPerView: 4.5 },
          }}
          className="!overflow-visible"
        >
          {items.map((item, i) => (
            <SwiperSlide key={i} className="!w-auto">
              <div className="w-52 sm:w-60 group cursor-pointer">
                {/* Image */}
                <div
                  className={`relative ${
                    isCircular ? "w-40 h-40 sm:w-48 sm:h-48 mx-auto" : "w-full aspect-[3/4]"
                  } overflow-hidden ${imageStyleMap[cardStyle]} mb-3 border border-zinc-200 dark:border-zinc-700`}
                >
                  <Image
                    src={item.image}
                    alt={item.name?.[locale] || item.name?.en || `Item ${i + 1}`}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                {/* Text */}
                <div className={isCircular ? "text-center" : ""}>
                  {item.name && (
                    <h4
                      className="font-heading font-semibold text-base sm:text-lg truncate"
                      style={{ color: "var(--color-primary)" }}
                    >
                      {item.name[locale] || item.name.en}
                    </h4>
                  )}
                  {item.title && (
                    <p
                      className="text-sm truncate"
                      style={{ color: "var(--color-muted)" }}
                    >
                      {item.title[locale] || item.title.en}
                    </p>
                  )}
                  {showDescription && item.description && (
                    <p
                      className="text-xs mt-1 line-clamp-2"
                      style={{ color: "var(--color-muted)" }}
                    >
                      {item.description[locale] || item.description.en}
                    </p>
                  )}
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </Container>
    </section>
  );
}
