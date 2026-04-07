"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import type { AppLocale } from "@/i18n/config";

const STORAGE_KEY = "mahayagya_popup_dismissed";

const content = {
  badge: { en: "🔥 Upcoming Grand Event", hi: "🔥 आगामी भव्य आयोजन" },
  title: {
    en: "108 Kund World Peace Mahayagya",
    hi: "108 कुंड विश्व शांति महायज्ञ",
  },
  subtitle: {
    en: "& Global Health and Wellness Mega Expo with Launching of Mega Environmental Project",
    hi: "एवं वैश्विक स्वास्थ्य और कल्याण मेगा एक्सपो एवं मेगा पर्यावरण परियोजना का शुभारंभ",
  },
  location: {
    en: "📍 Varanasi, UP • 10–14 June 2026",
    hi: "📍 वाराणसी, UP • 10–14 जून 2026",
  },
  highlights: [
    { en: "25,000+ Daily Visitors", hi: "25,000+ दैनिक आगंतुक" },
    { en: "2 Cr+ Digital Reach", hi: "2 करोड़+ डिजिटल पहुंच" },
    { en: "300+ Exhibition Stalls", hi: "300+ प्रदर्शनी स्टॉल" },
  ],
  initiative: {
    en: "An initiative by Brahmavadini Spiritual Services Pvt. Ltd. & Brahmavadini Foundation & Swami Rupeshwaranand Ashram",
    hi: "ब्रह्मवादिनी स्पिरिचुअल सर्विसेज प्रा. लि. एवं ब्रह्मवादिनी फाउंडेशन एवं स्वामी रूपेश्वरानंद आश्रम की एक पहल",
  },
  cta: { en: "Learn More & Participate", hi: "और जानें और भाग लें" },
  dismiss: { en: "Maybe Later", hi: "बाद में" },
};

function t(obj: { en: string; hi: string }, locale: AppLocale) {
  return obj[locale] || obj.en;
}

export default function MahaYagyaPopup({ locale }: { locale: AppLocale }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(STORAGE_KEY)) return;
    const timer = setTimeout(() => setIsVisible(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  function dismiss() {
    setIsVisible(false);
    sessionStorage.setItem(STORAGE_KEY, "1");
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
          onClick={dismiss}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 30 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
            style={{ background: "linear-gradient(160deg, #1a0a00, var(--color-primary), #1a0a00)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={dismiss}
              className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white/15 text-white/80 hover:bg-white/25 hover:text-white transition-colors"
              aria-label="Close"
            >
              ✕
            </button>

            {/* Decorative fire pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 25% 25%, var(--color-gold) 1px, transparent 1px), radial-gradient(circle at 75% 75%, var(--color-gold) 1px, transparent 1px)",
                  backgroundSize: "30px 30px",
                }}
              />
            </div>

            <div className="relative p-6 sm:p-8 text-center">
              {/* Badge */}
              <motion.span
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4"
                style={{
                  backgroundColor: "rgba(255,255,255,0.12)",
                  color: "var(--color-gold)",
                  border: "1px solid rgba(255,183,77,0.3)",
                }}
              >
                {t(content.badge, locale)}
              </motion.span>

              {/* Title */}
              <motion.h3
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="font-heading text-2xl sm:text-3xl font-bold text-white mb-1 leading-tight"
              >
                {t(content.title, locale)}
              </motion.h3>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="text-sm sm:text-base font-medium mb-3 leading-snug"
              >
                <span className="block text-base sm:text-lg" style={{ color: "var(--color-gold)" }}>&amp;</span>
                <span className="block text-white/80">
                  {locale === "hi" ? "वैश्विक स्वास्थ्य और कल्याण मेगा एक्सपो" : "Global Health and Wellness Mega Expo"}
                </span>
                <span className="block text-base sm:text-lg" style={{ color: "var(--color-gold)" }}>&amp;</span>
                <span className="block text-white/80">
                  {locale === "hi" ? "मेगा पर्यावरण परियोजना का शुभारंभ" : "Launching of Mega Environmental Project"}
                </span>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-sm text-white/70 mb-5"
              >
                {t(content.location, locale)}
              </motion.p>

              {/* Highlights */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="flex flex-wrap justify-center gap-2 mb-6"
              >
                {content.highlights.map((h, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-white/90"
                    style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
                  >
                    {t(h, locale)}
                  </span>
                ))}
              </motion.div>

              {/* Initiative */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.38 }}
                className="mb-5 px-3 py-2 rounded-lg border border-white/10"
                style={{ background: "rgba(255,255,255,0.05)" }}
              >
                <p className="text-[10px] tracking-widest uppercase text-white/35 mb-1">
                  {locale === "hi" ? "एक पहल" : "An initiative by"}
                </p>
                <p className="text-[11px] sm:text-xs text-white/70 leading-relaxed">
                  <a href="https://brahmavadini.in" target="_blank" rel="noopener noreferrer" className="text-white/80 hover:text-amber-300 transition-colors border-b border-white/20 hover:border-amber-300 pb-px">
                    {locale === "hi" ? "ब्रह्मवादिनी स्पिरिचुअल सर्विसेज प्रा. लि." : "Brahmavadini Spiritual Services Pvt. Ltd."}
                  </a>
                  <span className="mx-1.5 text-white/25">•</span>
                  <a href="https://brahmavadini.org" target="_blank" rel="noopener noreferrer" className="text-white/80 hover:text-amber-300 transition-colors border-b border-white/20 hover:border-amber-300 pb-px">
                    {locale === "hi" ? "ब्रह्मवादिनी फाउंडेशन" : "Brahmavadini Foundation"}
                  </a>
                  <span className="mx-1.5 text-white/25">•</span>
                  <a href="https://swamirupeshwaranand.in" target="_blank" rel="noopener noreferrer" className="text-white/80 hover:text-amber-300 transition-colors border-b border-white/20 hover:border-amber-300 pb-px">
                    {locale === "hi" ? "स्वामी रूपेश्वरानंद आश्रम" : "Swami Rupeshwaranand Ashram"}
                  </a>
                </p>
              </motion.div>

              {/* CTA */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-3"
              >
                <Link
                  href={`/${locale}/maha-yagya`}
                  onClick={dismiss}
                  className="block w-full py-3 rounded-lg font-semibold text-white text-center transition-all hover:brightness-110 hover:shadow-lg"
                  style={{
                    background: "linear-gradient(135deg, var(--color-gold), var(--color-accent))",
                  }}
                >
                  {t(content.cta, locale)}
                </Link>
                <button
                  onClick={dismiss}
                  className="w-full py-2 text-sm text-white/50 hover:text-white/80 transition-colors"
                >
                  {t(content.dismiss, locale)}
                </button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
