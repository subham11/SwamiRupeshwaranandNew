/**
 * Dynamic Page Component
 * 
 * A wrapper component that fetches page content by pageId and renders
 * the appropriate sections. Supports bilingual content (EN/HI).
 */

"use client";

import { usePageContent } from "@/lib/apiHooks";
import type { AppLocale } from "@/i18n/config";
import { Container } from "@/components/ui/Container";
import { t, type BilingualContent } from "@/content/contentProvider";
import { motion } from "motion/react";
import { spacing, textSizes, cn } from "@/lib/responsive";

// Types for dynamic page content from API
interface DynamicPageContentSection {
  id: string;
  type: string;
  title?: BilingualContent;
  subtitle?: BilingualContent;
  content?: BilingualContent;
  items?: Array<{
    id: string;
    title?: BilingualContent;
    description?: BilingualContent;
    imageUrl?: string;
    link?: string;
    icon?: string;
  }>;
  imageUrl?: string;
  order: number;
}

interface DynamicPageContent {
  hero?: {
    title: BilingualContent;
    subtitle?: BilingualContent;
    backgroundImage?: string;
    ctaText?: BilingualContent;
    ctaLink?: string;
  };
  title?: BilingualContent;
  description?: BilingualContent;
  sections?: DynamicPageContentSection[];
}

interface DynamicPageProps {
  pageId: string;
  locale: AppLocale;
  fallbackContent?: React.ReactNode;
}

// Loading skeleton
function PageSkeleton() {
  return (
    <div className={cn(spacing.section)}>
      <Container>
        <div className="animate-pulse space-y-8">
          {/* Hero skeleton */}
          <div className="h-64 sm:h-80 md:h-96 bg-zinc-200 dark:bg-zinc-800 rounded-2xl" />
          
          {/* Title skeleton */}
          <div className="space-y-4 max-w-2xl mx-auto text-center">
            <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4 mx-auto" />
            <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2 mx-auto" />
          </div>
          
          {/* Content skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
            ))}
          </div>
        </div>
      </Container>
    </div>
  );
}

// Error state
function PageError({ message, locale }: { message: string; locale: AppLocale }) {
  const errorText = {
    en: "Unable to load page content",
    hi: "पेज सामग्री लोड करने में असमर्थ"
  };
  
  const retryText = {
    en: "Please try again later",
    hi: "कृपया बाद में पुनः प्रयास करें"
  };

  return (
    <div className={cn(spacing.section)}>
      <Container>
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🙏</div>
          <h2 className={cn(textSizes.h2, "font-semibold text-zinc-700 dark:text-zinc-300 mb-2")}>
            {t(errorText, locale)}
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400">
            {t(retryText, locale)}
          </p>
          <p className="text-sm text-red-500 mt-4">{message}</p>
        </div>
      </Container>
    </div>
  );
}

// Section renderer
interface SectionProps {
  section: {
    id: string;
    type: string;
    title?: BilingualContent;
    subtitle?: BilingualContent;
    content?: BilingualContent;
    items?: Array<{
      id: string;
      title?: BilingualContent;
      description?: BilingualContent;
      imageUrl?: string;
      link?: string;
      icon?: string;
    }>;
    imageUrl?: string;
    order: number;
  };
  locale: AppLocale;
  index: number;
}

function ContentSection({ section, locale, index }: SectionProps) {
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay: index * 0.1 },
  };

  return (
    <motion.section
      {...fadeInUp}
      className={cn(spacing.sectionSm, "border-b border-zinc-100 dark:border-zinc-800 last:border-0")}
    >
      {section.title && (
        <div className="text-center mb-8 sm:mb-12">
          <h2 className={cn(textSizes.h2, "font-bold text-zinc-800 dark:text-zinc-100 mb-2")}>
            {t(section.title, locale)}
          </h2>
          {section.subtitle && (
            <p className={cn(textSizes.body, "text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto")}>
              {t(section.subtitle, locale)}
            </p>
          )}
        </div>
      )}

      {/* Text content */}
      {section.type === "text" && section.content && (
        <div className="prose prose-zinc dark:prose-invert max-w-3xl mx-auto">
          <p className={cn(textSizes.body, "text-zinc-600 dark:text-zinc-400 leading-relaxed")}>
            {t(section.content, locale)}
          </p>
        </div>
      )}

      {/* Cards grid */}
      {section.type === "cards" && section.items && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {section.items.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * idx }}
              className="group relative bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-zinc-100 dark:border-zinc-800"
            >
              {item.icon && (
                <span className="text-3xl mb-4 block">{item.icon}</span>
              )}
              {item.title && (
                <h3 className={cn(textSizes.h4, "font-semibold text-zinc-800 dark:text-zinc-100 mb-2")}>
                  {t(item.title, locale)}
                </h3>
              )}
              {item.description && (
                <p className={cn(textSizes.small, "text-zinc-600 dark:text-zinc-400 line-clamp-3")}>
                  {t(item.description, locale)}
                </p>
              )}
              {item.link && (
                <a
                  href={item.link}
                  className="absolute inset-0 rounded-2xl"
                  aria-label={t(item.title, locale)}
                />
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Testimonials/Quotes */}
      {section.type === "testimonials" && section.items && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {section.items.map((item, idx) => (
            <motion.blockquote
              key={item.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 * idx }}
              className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-zinc-800 dark:to-zinc-900 rounded-2xl p-6 sm:p-8"
            >
              <p className={cn(textSizes.body, "text-zinc-700 dark:text-zinc-300 italic mb-4")}>
                &ldquo;{t(item.description, locale)}&rdquo;
              </p>
              {item.title && (
                <cite className={cn(textSizes.small, "text-amber-700 dark:text-amber-500 not-italic font-medium")}>
                  — {t(item.title, locale)}
                </cite>
              )}
            </motion.blockquote>
          ))}
        </div>
      )}

      {/* Image section */}
      {section.type === "image" && section.imageUrl && (
        <div className="relative aspect-video sm:aspect-[21/9] rounded-2xl overflow-hidden">
          <img
            src={section.imageUrl}
            alt={t(section.title, locale) || ""}
            className="w-full h-full object-cover"
          />
        </div>
      )}
    </motion.section>
  );
}

export default function DynamicPage({ pageId, locale, fallbackContent }: DynamicPageProps) {
  const { data, isLoading, isError, error } = usePageContent<DynamicPageContent>(pageId, locale);

  if (isLoading) {
    return <PageSkeleton />;
  }

  if (isError) {
    // If there's fallback content, show it
    if (fallbackContent) {
      return <>{fallbackContent}</>;
    }
    return <PageError message={error?.message || "Unknown error"} locale={locale} />;
  }

  const pageData = data?.data as DynamicPageContent | undefined;

  if (!pageData) {
    if (fallbackContent) {
      return <>{fallbackContent}</>;
    }
    return <PageSkeleton />;
  }

  return (
    <div>
      {/* Hero Section */}
      {pageData.hero && (
        <section className="relative min-h-[50vh] sm:min-h-[60vh] flex items-center justify-center overflow-hidden">
          {pageData.hero.backgroundImage && (
            <img
              src={pageData.hero.backgroundImage}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/70" />
          
          <Container className="relative z-10 text-center text-white py-12 sm:py-16">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(textSizes.hero, "font-bold mb-4")}
            >
              {t(pageData.hero.title, locale)}
            </motion.h1>
            
            {pageData.hero.subtitle && (
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className={cn(textSizes.h4, "text-white/90 max-w-2xl mx-auto mb-8")}
              >
                {t(pageData.hero.subtitle, locale)}
              </motion.p>
            )}
            
            {pageData.hero.ctaText && pageData.hero.ctaLink && (
              <motion.a
                href={pageData.hero.ctaLink}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="inline-block px-6 py-3 sm:px-8 sm:py-4 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-full transition-colors"
              >
                {t(pageData.hero.ctaText, locale)}
              </motion.a>
            )}
          </Container>
        </section>
      )}

      {/* Page Title (if no hero) */}
      {!pageData.hero && pageData.title && (
        <section className={cn(spacing.section, "bg-gradient-to-b from-amber-50 to-white dark:from-zinc-900 dark:to-zinc-950")}>
          <Container className="text-center">
            <h1 className={cn(textSizes.h1, "font-bold text-zinc-800 dark:text-zinc-100 mb-4")}>
              {t(pageData.title, locale)}
            </h1>
            {pageData.description && (
              <p className={cn(textSizes.body, "text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto")}>
                {t(pageData.description, locale)}
              </p>
            )}
          </Container>
        </section>
      )}

      {/* Content Sections */}
      <Container>
        {pageData.sections?.map((section, index) => (
          <ContentSection
            key={section.id}
            section={section}
            locale={locale}
            index={index}
          />
        ))}
      </Container>
    </div>
  );
}
