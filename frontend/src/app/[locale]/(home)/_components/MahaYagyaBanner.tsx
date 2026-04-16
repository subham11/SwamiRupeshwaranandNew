"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Container } from "@/components/ui/Container";
import type { AppLocale } from "@/i18n/config";

function t(obj: { en: string; hi: string }, locale: AppLocale) {
  return obj[locale] || obj.en;
}

const content = {
  badge: { en: "🔥 Upcoming Grand Event", hi: "🔥 आगामी भव्य आयोजन" },
  yantra: {
    en: "✨ Shri Baglamukhi Yantra — Real Gold / Silver / Copper Made",
    hi: "✨ श्री बगलामुखी यंत्र — असली स्वर्ण / रजत / ताम्र निर्मित",
  },
  title: {
    en: "108 Kund World Peace Maha Yagya",
    hi: "108 कुंड विश्व शांति महा यज्ञ",
  },
  sub1: { en: "Global Health and Wellness Mega Expo", hi: "वैश्विक स्वास्थ्य और कल्याण मेगा एक्सपो" },
  sub2: { en: "Launching of Mega Environmental Project", hi: "मेगा पर्यावरण परियोजना का शुभारंभ" },
  location: { en: "📍 Varanasi, UP  •  3–7 June 2026", hi: "📍 वाराणसी, UP  •  3–7 जून 2026" },
  highlights: [
    { en: "25,000+ Daily Visitors", hi: "25,000+ दैनिक आगंतुक" },
    { en: "2 Cr+ Digital Reach", hi: "2 करोड़+ डिजिटल पहुंच" },
    { en: "300+ Exhibition Stalls", hi: "300+ प्रदर्शनी स्टॉल" },
  ],
  cta: { en: "Know More", hi: "और जानें" },
};

export default function MahaYagyaBanner({ locale }: { locale: AppLocale }) {
  return (
    <section className="py-8 sm:py-12">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative rounded-2xl overflow-hidden shadow-2xl"
          style={{ background: "linear-gradient(135deg, #1a0a00 0%, var(--color-primary) 50%, #1a0a00 100%)" }}
        >
          {/* Dot pattern overlay */}
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(circle at 25% 25%, var(--color-gold) 1px, transparent 1px), radial-gradient(circle at 75% 75%, var(--color-gold) 1px, transparent 1px)",
              backgroundSize: "30px 30px",
            }}
          />

          <div className="relative px-6 py-8 sm:px-10 sm:py-10 flex flex-col lg:flex-row lg:items-center gap-8">

            {/* ── LEFT: Titles ── */}
            <div className="flex-1 min-w-0">
              {/* Badge */}
              <span
                className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-3"
                style={{
                  backgroundColor: "rgba(255,255,255,0.12)",
                  color: "var(--color-gold)",
                  border: "1px solid rgba(255,183,77,0.3)",
                }}
              >
                {t(content.badge, locale)}
              </span>

              {/* Yantra highlight */}
              <div
                className="inline-block mb-3 px-3 py-1.5 rounded-lg text-xs font-semibold"
                style={{
                  background: "linear-gradient(135deg, rgba(255,183,77,0.18), rgba(255,140,0,0.12))",
                  border: "1px solid rgba(255,183,77,0.4)",
                  color: "var(--color-gold)",
                }}
              >
                {t(content.yantra, locale)}
              </div>

              <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight mb-1">
                {t(content.title, locale)}
              </h2>
              <p className="text-sm sm:text-base font-medium" style={{ color: "var(--color-gold)" }}>
                {locale === "hi" ? "एवं" : "&"}
              </p>
              <p className="text-base sm:text-lg font-semibold text-white/85 leading-snug">
                {t(content.sub1, locale)}
              </p>
              <p className="text-sm sm:text-base font-medium" style={{ color: "var(--color-gold)" }}>
                {locale === "hi" ? "एवं" : "&"}
              </p>
              <p className="text-base sm:text-lg font-semibold text-white/85 leading-snug mb-3">
                {t(content.sub2, locale)}
              </p>

              <p className="text-sm text-white/60">
                {t(content.location, locale)}
              </p>
            </div>

            {/* ── RIGHT: Stats + CTA ── */}
            <div className="lg:w-72 xl:w-80 flex flex-col gap-5 lg:border-l lg:border-white/10 lg:pl-8">
              {/* Stats */}
              <div className="flex flex-wrap gap-2">
                {content.highlights.map((h, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium text-white/90"
                    style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
                  >
                    {t(h, locale)}
                  </span>
                ))}
              </div>

              {/* Initiative */}
              <div
                className="px-3 py-2 rounded-lg border border-white/10 text-center"
                style={{ background: "rgba(255,255,255,0.05)" }}
              >
                <p className="text-[10px] tracking-widest uppercase text-white/35 mb-1">
                  {locale === "hi" ? "एक पहल" : "An initiative by"}
                </p>
                <p className="text-[10px] sm:text-xs text-white/65 leading-relaxed">
                  <a href="https://brahmavadini.in" target="_blank" rel="noopener noreferrer" className="hover:text-amber-300 transition-colors">
                    {locale === "hi" ? "ब्रह्मवादिनी स्पिरिचुअल सर्विसेज" : "Brahmavadini Spiritual Services"}
                  </a>
                  <span className="mx-1 text-white/25">•</span>
                  <a href="https://brahmavadini.org" target="_blank" rel="noopener noreferrer" className="hover:text-amber-300 transition-colors">
                    {locale === "hi" ? "ब्रह्मवादिनी फाउंडेशन" : "Brahmavadini Foundation"}
                  </a>
                  <span className="mx-1 text-white/25">•</span>
                  <a href="https://swamirupeshwaranand.in" target="_blank" rel="noopener noreferrer" className="hover:text-amber-300 transition-colors">
                    {locale === "hi" ? "स्वामी रूपेश्वरानंद आश्रम" : "Swami Rupeshwaranand Ashram"}
                  </a>
                </p>
              </div>

              {/* CTA */}
              <Link
                href={`/${locale}/maha-yagya`}
                className="block w-full py-3 rounded-xl font-semibold text-white text-center transition-all hover:brightness-110 hover:shadow-[0_8px_24px_rgba(234,179,8,0.35)] hover:-translate-y-0.5"
                style={{
                  background: "linear-gradient(135deg, var(--color-gold), var(--color-accent))",
                }}
              >
                {t(content.cta, locale)} →
              </Link>
            </div>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
