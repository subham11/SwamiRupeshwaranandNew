"use client";

import { useState } from "react";
import Image from "next/image";
import type { AppLocale } from "@/i18n/config";

const IMAGES = [
  {
    src: "/images/food-fest-1.jpg",
    alt: { en: "Food Stall Booking Open – All India Food Festival Varanasi 2026", hi: "फूड स्टॉल बुकिंग खुली – ऑल इंडिया फूड फेस्टिवल वाराणसी 2026" },
    label: { en: "All India Food Festival", hi: "ऑल इंडिया फूड फेस्टिवल" },
  },
  {
    src: "/images/food-fest-2.jpg",
    alt: { en: "Standard Food Stall – ₹50,000", hi: "स्टैंडर्ड फूड स्टॉल – ₹50,000" },
    label: { en: "Standard Food Stall", hi: "स्टैंडर्ड फूड स्टॉल" },
  },
  {
    src: "/images/food-fest-3.jpg",
    alt: { en: "State-wise Food Stall Booking", hi: "राज्यवार फूड स्टॉल बुकिंग" },
    label: { en: "State-wise Booking", hi: "राज्यवार बुकिंग" },
  },
  {
    src: "/images/food-fest-4.jpg",
    alt: { en: "Prime Food Stall – ₹5 Lakh", hi: "प्राइम फूड स्टॉल – ₹5 लाख" },
    label: { en: "Prime Food Stall", hi: "प्राइम फूड स्टॉल" },
  },
];

function t(obj: { en: string; hi: string }, locale: AppLocale) {
  return obj[locale] || obj.en;
}

export default function StallGallery({ locale }: { locale: AppLocale }) {
  const [lightbox, setLightbox] = useState<number | null>(null);

  function prev() {
    setLightbox((i) => (i === null ? null : (i - 1 + IMAGES.length) % IMAGES.length));
  }
  function next() {
    setLightbox((i) => (i === null ? null : (i + 1) % IMAGES.length));
  }

  return (
    <>
      {/* Gallery grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {IMAGES.map((img, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setLightbox(i)}
            className="group relative overflow-hidden rounded-xl sm:rounded-2xl aspect-video lg:aspect-[4/3] focus:outline-none focus:ring-2 focus:ring-amber-500"
            aria-label={t(img.alt, locale)}
          >
            <Image
              src={img.src}
              alt={t(img.alt, locale)}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 25vw"
            />
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute bottom-0 inset-x-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
              <p className="text-white text-xs sm:text-sm font-semibold leading-tight">
                {t(img.label, locale)}
              </p>
            </div>
            {/* Zoom icon */}
            <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
              </svg>
            </div>
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
          onClick={() => setLightbox(null)}
        >
          {/* Image container */}
          <div
            className="relative max-w-5xl w-full max-h-[90vh] rounded-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full" style={{ aspectRatio: "16/9" }}>
              <Image
                src={IMAGES[lightbox].src}
                alt={t(IMAGES[lightbox].alt, locale)}
                fill
                className="object-contain"
                sizes="100vw"
                priority
              />
            </div>
            {/* Caption */}
            <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
              <p className="text-white text-sm font-semibold text-center">
                {t(IMAGES[lightbox].label, locale)}
              </p>
              <p className="text-white/50 text-xs text-center mt-1">
                {lightbox + 1} / {IMAGES.length}
              </p>
            </div>
          </div>

          {/* Prev */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            aria-label="Previous"
          >
            ‹
          </button>

          {/* Next */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            aria-label="Next"
          >
            ›
          </button>

          {/* Close */}
          <button
            type="button"
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors text-lg leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>
      )}
    </>
  );
}
