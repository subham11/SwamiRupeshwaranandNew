import Image from "next/image";
import Link from "next/link";
import type { AppLocale } from "@/i18n/config";
import { Container } from "@/components/ui/Container";
import { cms } from "@/cms";
import { type HomePageContent } from "@/content/pageContent";
import { t } from "@/content/contentProvider";
import { SacredDivider, SectionHeading, QuoteBlock, EventBadge } from "@/components/ui/Decorative";
import AshramImageCards from "./AshramImageCards";

function fmtDate(iso: string, locale: AppLocale) {
  try {
    return new Intl.DateTimeFormat(locale === "hi" ? "hi-IN" : "en-IN", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function getDateParts(iso: string) {
  const date = new Date(iso);
  return {
    day: date.getDate(),
    month: date.toLocaleString('en', { month: 'short' }).toUpperCase()
  };
}

interface HomeSectionsProps {
  locale: AppLocale;
  content?: HomePageContent;
}

export default async function HomeSections({ locale, content }: HomeSectionsProps) {
  const bundle = await cms.getBundle();

  const services = [...bundle.services].sort((a, b) => a.order - b.order).slice(0, 6);
  const events = bundle.events.filter((e) => e.status === "upcoming").slice(0, 3);
  const gallery = bundle.gallery.filter(g => g.kind === "image").slice(0, 6);

  // Content from props with fallbacks
  const aboutAshram = content?.aboutAshram || {
    title: { en: "About the Ashram", hi: "आश्रम के बारे में" },
    subtitle: { en: "A Sanctuary of Peace", hi: "शांति का आश्रय" },
    description: { en: "Welcome to our sacred space.", hi: "हमारे पवित्र स्थान में आपका स्वागत है।" },
    ctaPrimary: { en: "Visit Ashram", hi: "आश्रम देखें" },
    ctaSecondary: { en: "About Swamiji", hi: "स्वामीजी के बारे में" }
  };
  
  const servicesSection = content?.services || {
    title: { en: "Our Services", hi: "हमारी सेवाएं" },
    subtitle: { en: "Spiritual offerings for your journey", hi: "आपकी आध्यात्मिक यात्रा के लिए सेवाएं" }
  };
  
  const eventsSection = content?.events || {
    title: { en: "Upcoming Events", hi: "आगामी कार्यक्रम" },
    subtitle: { en: "Join us for spiritual gatherings", hi: "आध्यात्मिक सभाओं में हमसे जुड़ें" }
  };
  
  const quotes = content?.quotes || [];
  const donation = content?.donation || {
    title: { en: "Support Our Mission", hi: "हमारे मिशन का समर्थन करें" },
    subtitle: { en: "Your contribution helps spread light", hi: "आपका योगदान रोशनी फैलाने में मदद करता है" },
    ctaText: { en: "Donate Now", hi: "अभी दान करें" }
  };

  return (
    <div style={{ backgroundColor: 'var(--color-background)' }}>
      {/* About Ashram Section */}
      <section className="py-12 sm:py-16 md:py-20 relative overflow-hidden">
        {/* Sacred Pattern Background */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `radial-gradient(circle at 30% 30%, var(--color-gold) 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}
        />
        
        <Container className="relative z-10">
          <div className="grid gap-8 sm:gap-10 lg:gap-12 lg:grid-cols-12 lg:items-center">
            {/* Text Content */}
            <div className="lg:col-span-5">
              <div 
                className="flex items-center gap-3 mb-3 sm:mb-4"
                style={{ color: 'var(--color-gold)' }}
              >
                <span className="h-px w-6 sm:w-8 bg-current" />
                <span className="text-xs sm:text-sm font-medium uppercase tracking-widest">
                  {t(aboutAshram.subtitle, locale)}
                </span>
              </div>
              
              <h2 
                className="font-heading text-2xl sm:text-3xl md:text-4xl font-semibold mb-3 sm:mb-4"
                style={{ color: 'var(--color-primary)' }}
              >
                {t(aboutAshram.title, locale)}
              </h2>
              
              <p 
                className="text-sm sm:text-base md:text-lg leading-relaxed mb-4 sm:mb-6"
                style={{ color: 'var(--color-muted)' }}
              >
                {t(aboutAshram.description, locale)}
              </p>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Link 
                  href={`/${locale}/ashram`} 
                  className="btn-primary text-center"
                >
                  {t(aboutAshram.ctaPrimary, locale)}
                </Link>
                <Link
                  href={`/${locale}/swamiji`}
                  className="btn-outline text-center"
                >
                  {t(aboutAshram.ctaSecondary, locale)}
                </Link>
              </div>
            </div>

            <AshramImageCards locale={locale} />
          </div>
        </Container>
      </section>

      <SacredDivider icon="✦" />

      {/* Services Section - Responsive */}
      <section className="py-12 sm:py-16 md:py-20" style={{ backgroundColor: 'var(--color-secondary)' }}>
        <Container>
          <SectionHeading 
            title={t(servicesSection.title, locale)}
            subtitle={t(servicesSection.subtitle, locale)}
          />

          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <Link 
                key={s.slug} 
                href={`/${locale}/services#${s.slug}`} 
                className="group sacred-card"
              >
                <div 
                  className="overflow-hidden rounded-lg mb-3 sm:mb-4"
                  style={{ border: '1px solid var(--color-border)' }}
                >
                  <Image 
                    src={s.heroImage || "/images/service-1.svg"} 
                    alt={s.title[locale] || "Service"} 
                    width={600} 
                    height={400} 
                    className="h-40 sm:h-48 w-full object-cover transition-transform duration-500 group-hover:scale-105" 
                  />
                </div>
                <h3 
                  className="font-heading text-lg sm:text-xl font-semibold mb-1.5 sm:mb-2"
                  style={{ color: 'var(--color-primary)' }}
                >
                  {s.title[locale]}
                </h3>
                <p 
                  className="text-xs sm:text-sm leading-relaxed line-clamp-2"
                  style={{ color: 'var(--color-muted)' }}
                >
                  {s.shortDescription[locale]}
                </p>
                <div 
                  className="mt-3 sm:mt-4 flex items-center gap-2 text-xs sm:text-sm font-medium group-hover:gap-3 transition-all"
                  style={{ color: 'var(--color-gold)' }}
                >
                  <span>{locale === "en" ? "Learn More" : "और जानें"}</span>
                  <span>→</span>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-8 sm:mt-10 md:mt-12 text-center">
            <Link 
              href={`/${locale}/services`} 
              className="btn-outline"
            >
              {locale === "hi" ? "सभी सेवाएं देखें" : "View All Services"}
            </Link>
          </div>
        </Container>
      </section>

      <SacredDivider icon="ॐ" />

      {/* Quote Section */}
      {quotes.length > 0 && (
        <section className="py-12 sm:py-16 md:py-20">
          <Container>
            <div className="max-w-4xl mx-auto">
              <QuoteBlock 
                quote={t(quotes[0]?.text, locale) || ""}
                author={t(quotes[0]?.author, locale) || ""}
              />
            </div>
          </Container>
        </section>
      )}

      {/* Events Section - Responsive */}
      <section className="py-12 sm:py-16 md:py-20" style={{ backgroundColor: 'var(--color-secondary)' }}>
        <Container>
          <SectionHeading 
            title={t(eventsSection.title, locale)}
            subtitle={t(eventsSection.subtitle, locale)}
          />

          <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {events.map((e) => {
              const dateParts = getDateParts(e.startAt);
              return (
                <div 
                  key={e.id} 
                  className="sacred-card flex flex-col"
                >
                  <div className="relative overflow-hidden rounded-lg mb-3 sm:mb-4">
                    <Image 
                      src={e.heroImage || "/images/event-1.svg"} 
                      alt={e.title[locale] || "Event"} 
                      width={600} 
                      height={400} 
                      className="h-48 w-full object-cover" 
                    />
                    {/* Date Badge */}
                    <div className="absolute top-4 left-4">
                      <EventBadge day={dateParts.day} month={dateParts.month} />
                    </div>
                  </div>
                  
                  <h3 
                    className="font-heading text-xl font-semibold mb-2"
                    style={{ color: 'var(--color-primary)' }}
                  >
                    {e.title[locale]}
                  </h3>
                  
                  <p 
                    className="text-sm mb-2"
                    style={{ color: 'var(--color-muted)' }}
                  >
                    {fmtDate(e.startAt, locale)}
                  </p>
                  
                  <p 
                    className="text-sm leading-relaxed flex-grow"
                    style={{ color: 'var(--color-foreground)' }}
                  >
                    {e.description[locale]}
                  </p>
                  
                  <div 
                    className="mt-4 flex items-center gap-2 text-sm"
                    style={{ color: 'var(--color-muted)' }}
                  >
                    <span>📍</span>
                    <span>{e.location[locale]}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-12 text-center">
            <Link 
              href={`/${locale}/events`} 
              className="btn-primary"
            >
              {locale === "hi" ? "सभी कार्यक्रम देखें" : "View All Events"}
            </Link>
          </div>
        </Container>
      </section>

      <SacredDivider icon="❈" />

      {/* Gallery Section */}
      <section className="py-12 sm:py-16 md:py-20">
        <Container>
          <SectionHeading 
            title={locale === "hi" ? "आश्रम गैलरी" : "Ashram Gallery"}
            subtitle={locale === "hi" 
              ? "आश्रम की झलकियाँ" 
              : "Glimpses of the sacred ashram"
            }
          />

          <div className="columns-2 gap-4 md:columns-3">
            {gallery.map((img) => (
              <div 
                key={img.id} 
                className="mb-4 break-inside-avoid overflow-hidden rounded-lg shadow-sacred transition-transform duration-300 hover:scale-[1.02]"
                style={{ border: '1px solid var(--color-border)' }}
              >
                <Image 
                  src={img.url} 
                  alt={img.kind === "image" ? (img.alt[locale] || "Gallery image") : (img.title[locale] || "Gallery image")} 
                  width={600} 
                  height={600} 
                  className="h-auto w-full object-cover" 
                />
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link 
              href={`/${locale}/ashram`} 
              className="btn-outline"
            >
              {locale === "hi" ? "और देखें" : "View More"}
            </Link>
          </div>
        </Container>
      </section>

      {/* Donation CTA - Full width banner */}
      <section 
        className="py-section-lg relative overflow-hidden"
        style={{ 
          background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))'
        }}
      >
        {/* Sacred Pattern */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
            backgroundSize: '30px 30px'
          }}
        />
        
        <Container className="relative z-10 text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-semibold text-white mb-4">
            {donation.title[locale]}
          </h2>
          <p className="text-lg text-white/80 max-w-2xl mx-auto mb-8">
            {donation.subtitle[locale]}
          </p>
          <Link 
            href={`/${locale}/donation`} 
            className="inline-flex items-center gap-2 px-8 py-4 rounded-md font-medium text-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            style={{ 
              backgroundColor: 'var(--color-gold)',
              color: 'var(--color-foreground)'
            }}
          >
            🙏 {donation.ctaText[locale]}
          </Link>
        </Container>
      </section>
    </div>
  );
}
