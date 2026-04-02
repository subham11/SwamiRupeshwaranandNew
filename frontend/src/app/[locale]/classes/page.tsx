"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { AppLocale } from "@/i18n/config";
import { Container } from "@/components/ui/Container";
import { fetchProductsByCategory, Product } from "@/lib/api";

const CATEGORY_SLUG = "sanskrit-vedanta-classes";
const PAGE_SIZE = 12;

const TEXTS = {
  en: {
    title: "Sanskrit & Vedanta Classes",
    subtitle:
      "Master the sacred language and timeless philosophy of the Vedas",
    empty: "Classes are coming soon. Stay tuned!",
    loading: "Loading more\u2026",
    off: "OFF",
    outOfStock: "Batch Full",
    limited: "Limited Seats",
    join: "Join Class",
  },
  hi: {
    title: "\u0938\u0902\u0938\u094D\u0915\u0943\u0924 \u090F\u0935\u0902 \u0935\u0947\u0926\u093E\u0902\u0924 \u0915\u0915\u094D\u0937\u093E\u090F\u0902",
    subtitle:
      "\u0935\u0947\u0926\u094B\u0902 \u0915\u0940 \u092A\u0935\u093F\u0924\u094D\u0930 \u092D\u093E\u0937\u093E \u0914\u0930 \u0915\u093E\u0932\u091C\u092F\u0940 \u0926\u0930\u094D\u0936\u0928 \u092E\u0947\u0902 \u092A\u093E\u0930\u0902\u0917\u0924 \u0939\u094B\u0902",
    empty:
      "\u0915\u0915\u094D\u0937\u093E\u090F\u0902 \u091C\u0932\u094D\u0926 \u0906 \u0930\u0939\u0940 \u0939\u0948\u0902\u0964 \u092C\u0928\u0947 \u0930\u0939\u0947\u0902!",
    loading:
      "\u0914\u0930 \u0932\u094B\u0921 \u0939\u094B \u0930\u0939\u093E \u0939\u0948\u2026",
    off: "\u091B\u0942\u091F",
    outOfStock: "\u092C\u0948\u091A \u092D\u0930\u093E",
    limited: "\u0938\u0940\u092E\u093F\u0924 \u0938\u0940\u091F\u0947\u0902",
    join: "\u0915\u0915\u094D\u0937\u093E \u092E\u0947\u0902 \u0936\u093E\u092E\u093F\u0932 \u0939\u094B\u0902",
  },
};

export default function ClassesPage() {
  const params = useParams();
  const locale = (params?.locale as AppLocale) || "en";
  const txt = TEXTS[locale] || TEXTS.en;

  const [products, setProducts] = useState<Product[]>([]);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const getLocaleField = (en: string, hi?: string) =>
    locale === "hi" && hi ? hi : en;

  const loadProducts = useCallback(
    async (reset = false) => {
      try {
        if (reset) {
          setLoading(true);
          setProducts([]);
          setCursor(undefined);
          setHasMore(true);
        } else {
          setLoadingMore(true);
        }

        const data = await fetchProductsByCategory(
          CATEGORY_SLUG,
          PAGE_SIZE,
          reset ? undefined : cursor,
        );
        const items = data.items || [];

        if (reset) {
          setProducts(items);
        } else {
          setProducts((prev) => [...prev, ...items]);
        }

        setCursor(data.cursor || undefined);
        setHasMore(!!data.cursor);
      } catch {
        // Fail gracefully
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [cursor],
  );

  useEffect(() => {
    loadProducts(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          loadProducts(false);
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, loadingMore, loading, cursor]);

  return (
    <div style={{ backgroundColor: "var(--color-background)" }}>
      {/* Hero Section */}
      <section className="relative py-16 sm:py-24 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, #78350F22 0%, #92400E22 50%, #B4530022 100%)",
          }}
        />
        <div className="absolute inset-0 opacity-10">
          <div
            className="w-full h-full"
            style={{
              backgroundImage:
                'url(\'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 40"><text x="10" y="30" font-family="serif" font-size="20" fill="%2392400E" opacity="0.15">\u0913\u092E</text></svg>\')',
              backgroundSize: "80px 40px",
            }}
          />
        </div>
        <Container>
          <div className="relative text-center max-w-3xl mx-auto">
            <div className="text-5xl mb-4">📜</div>
            <h1
              className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4"
              style={{
                fontFamily: "var(--font-heading)",
                color: "var(--color-primary)",
              }}
            >
              {txt.title}
            </h1>
            <p
              className="text-lg sm:text-xl max-w-2xl mx-auto"
              style={{ color: "var(--color-muted)" }}
            >
              {txt.subtitle}
            </p>
          </div>
        </Container>
      </section>

      {/* Product Grid */}
      <section className="py-12 sm:py-16">
        <Container>
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl overflow-hidden bg-white dark:bg-gray-800 animate-pulse"
                >
                  <div className="h-48 sm:h-56 bg-gray-200 dark:bg-gray-700" />
                  <div className="p-5 space-y-3">
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && products.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <Link
                  key={product.id}
                  href={`/${locale}/products/${product.slug}`}
                  className="group"
                >
                  <div className="rounded-2xl overflow-hidden bg-white border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 dark:bg-gray-800 dark:border-gray-700 h-full flex flex-col">
                    <div className="relative h-48 sm:h-56 bg-gray-50 dark:bg-gray-700 overflow-hidden">
                      {product.imageUrls?.[0] ? (
                        <img
                          src={product.imageUrls[0]}
                          alt={getLocaleField(product.title, product.titleHi)}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-4xl text-gray-300">
                          📜
                        </div>
                      )}
                      {product.discountPercent &&
                        product.discountPercent > 0 && (
                          <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-lg">
                            {Math.round(product.discountPercent)}% {txt.off}
                          </span>
                        )}
                      {product.stockStatus === "out_of_stock" && (
                        <span className="absolute top-3 right-3 bg-gray-800/80 text-white text-xs px-2 py-1 rounded-lg">
                          {txt.outOfStock}
                        </span>
                      )}
                      {product.stockStatus === "limited" && (
                        <span className="absolute top-3 right-3 bg-yellow-500/90 text-white text-xs px-2 py-1 rounded-lg">
                          {txt.limited}
                        </span>
                      )}
                    </div>
                    <div className="p-5 flex flex-col flex-1">
                      <h3
                        className="font-semibold text-base sm:text-lg line-clamp-2 mb-1"
                        style={{ color: "var(--color-primary)" }}
                      >
                        {getLocaleField(product.title, product.titleHi)}
                      </h3>
                      {(product.subtitle || product.subtitleHi) && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
                          {getLocaleField(
                            product.subtitle || "",
                            product.subtitleHi,
                          )}
                        </p>
                      )}
                      <div className="mt-auto flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className="text-lg font-bold"
                            style={{ color: "var(--color-gold)" }}
                          >
                            ₹{product.price}
                          </span>
                          {product.originalPrice &&
                            product.originalPrice > product.price && (
                              <span className="text-sm text-gray-400 line-through">
                                ₹{product.originalPrice}
                              </span>
                            )}
                        </div>
                        {product.totalReviews > 0 && (
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <span className="text-yellow-500">
                              {"★".repeat(
                                Math.round(product.avgRating || 0),
                              )}
                            </span>
                            <span>({product.totalReviews})</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {!loading && products.length === 0 && (
            <div className="text-center py-20">
              <p className="text-5xl mb-4">📜</p>
              <p className="text-lg text-gray-500 dark:text-gray-400">
                {txt.empty}
              </p>
            </div>
          )}

          {loadingMore && (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
              <span className="ml-3 text-gray-500">{txt.loading}</span>
            </div>
          )}

          <div ref={sentinelRef} className="h-4" />
        </Container>
      </section>
    </div>
  );
}
