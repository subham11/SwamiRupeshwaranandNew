"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { AppLocale } from "@/i18n/config";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/Decorative";
import {
  fetchPublicProducts,
  fetchProductCategories,
  Product,
  ProductCategory,
} from "@/lib/api";
import { useCurrency } from "@/lib/useCurrency";

const TEXTS = {
  en: {
    title: "Our Products",
    subtitle: "Explore our collection of authentic spiritual offerings",
    all: "All",
    noProducts: "No products found in this category.",
    noProductsYet: "Products are coming soon. Stay tuned!",
    off: "OFF",
    outOfStock: "Out of Stock",
    limited: "Limited Stock",
    loading: "Loading more…",
  },
  hi: {
    title: "हमारे उत्पाद",
    subtitle: "प्रामाणिक आध्यात्मिक उत्पादों का हमारा संग्रह देखें",
    all: "सभी",
    noProducts: "इस श्रेणी में कोई उत्पाद नहीं मिला।",
    noProductsYet: "उत्पाद जल्द आ रहे हैं। बने रहें!",
    off: "छूट",
    outOfStock: "उपलब्ध नहीं",
    limited: "सीमित",
    loading: "और लोड हो रहा है…",
  },
};

const PAGE_SIZE = 12;

export default function ProductsPage() {
  const params = useParams();
  const locale = (params?.locale as AppLocale) || "en";
  const txt = TEXTS[locale] || TEXTS.en;
  const { format } = useCurrency();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const getLocaleField = (en: string, hi?: string) =>
    locale === "hi" && hi ? hi : en;

  // Load categories once
  useEffect(() => {
    fetchProductCategories()
      .then((data) => setCategories(data.items || []))
      .catch(() => {});
  }, []);

  // Load products (initial or on category change)
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

        const params: Record<string, string> = {
          limit: String(PAGE_SIZE),
          locale,
        };

        if (activeCategory !== "all") {
          params.categoryId = activeCategory;
        }
        if (!reset && cursor) {
          params.cursor = cursor;
        }

        const data = await fetchPublicProducts(params);
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
    [activeCategory, cursor, locale],
  );

  // Initial load + reset on category change
  useEffect(() => {
    loadProducts(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory, locale]);

  // Infinite Scroll with IntersectionObserver
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
      <section className="py-12 sm:py-16 md:py-20">
        <Container>
          <SectionHeading title={txt.title} subtitle={txt.subtitle} />

          {/* Category Filter */}
          {categories.length > 0 && (
            <div className="flex justify-center gap-2 mb-10 flex-wrap">
              <button
                data-testid="category-tab"
                onClick={() => setActiveCategory("all")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  activeCategory === "all"
                    ? "text-white shadow-md"
                    : "bg-white/80 hover:bg-white dark:bg-gray-800 dark:hover:bg-gray-700"
                }`}
                style={
                  activeCategory === "all"
                    ? { backgroundColor: "var(--color-gold)" }
                    : { color: "var(--color-text-secondary)" }
                }
              >
                {txt.all}
              </button>
              {categories
                .filter((c) => c.isActive)
                .map((cat) => (
                  <button
                    data-testid="category-tab"
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                      activeCategory === cat.id
                        ? "text-white shadow-md"
                        : "bg-white/80 hover:bg-white dark:bg-gray-800 dark:hover:bg-gray-700"
                    }`}
                    style={
                      activeCategory === cat.id
                        ? { backgroundColor: "var(--color-gold)" }
                        : { color: "var(--color-text-secondary)" }
                    }
                  >
                    {getLocaleField(cat.name, cat.nameHi)}
                  </button>
                ))}
            </div>
          )}

          {/* Loading Skeleton */}
          {loading && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {[...Array(8)].map((_, i) => (
                <div
                  data-testid="product-skeleton"
                  key={i}
                  className="rounded-2xl overflow-hidden bg-white dark:bg-gray-800 animate-pulse"
                >
                  <div className="h-48 sm:h-56 bg-gray-200 dark:bg-gray-700" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Product Grid */}
          {!loading && products.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {products.map((product) => (
                <Link
                  key={product.id}
                  href={`/${locale}/products/${product.slug}`}
                  className="group"
                >
                  <div data-testid="product-card" className="rounded-2xl overflow-hidden bg-white border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 dark:bg-gray-800 dark:border-gray-700 h-full flex flex-col">
                    {/* Image */}
                    <div className="relative h-48 sm:h-56 bg-gray-50 dark:bg-gray-700 overflow-hidden">
                      {product.imageUrls?.[0] ? (
                        <img
                          src={product.imageUrls[0]}
                          alt={getLocaleField(product.title, product.titleHi)}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-4xl text-gray-300">
                          🛒
                        </div>
                      )}

                      {/* Discount Badge */}
                      {product.discountPercent && product.discountPercent > 0 && (
                        <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-lg">
                          {Math.round(product.discountPercent)}% {txt.off}
                        </span>
                      )}

                      {/* Stock Badge */}
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

                    {/* Content */}
                    <div className="p-4 flex flex-col flex-1">
                      <h3
                        data-testid="card-title"
                        className="font-semibold text-sm sm:text-base line-clamp-2 mb-1"
                        style={{ color: "var(--color-primary)" }}
                      >
                        {getLocaleField(product.title, product.titleHi)}
                      </h3>
                      {(product.subtitle || product.subtitleHi) && (
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 line-clamp-1 mb-2">
                          {getLocaleField(product.subtitle || "", product.subtitleHi)}
                        </p>
                      )}
                      {product.categoryName && (
                        <span
                          data-testid="card-category"
                          className="inline-block text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 mb-2"
                        >
                          {getLocaleField(product.categoryName, product.categoryNameHi)}
                        </span>
                      )}

                      <div className="mt-auto">
                        {/* Price */}
                        <div className="flex items-center gap-2">
                          {product.variants && product.variants.length > 0 && (
                            <span className="text-xs text-gray-500">
                              {locale === "hi" ? "से" : "from"}
                            </span>
                          )}
                          <span
                            data-testid="card-price"
                            className="text-lg font-bold"
                            style={{ color: "var(--color-gold)" }}
                          >
                            {format(product.price)}
                          </span>
                          {(!product.variants || product.variants.length === 0) &&
                            product.originalPrice &&
                            product.originalPrice > product.price && (
                              <span className="text-sm text-gray-400 line-through">
                                {format(product.originalPrice)}
                              </span>
                            )}
                        </div>

                        {/* Rating */}
                        {product.totalReviews > 0 && (
                          <div className="flex items-center gap-1 mt-1 text-xs sm:text-sm text-gray-500">
                            <span className="text-yellow-500">
                              {"★".repeat(Math.round(product.avgRating || 0))}
                              {"☆".repeat(5 - Math.round(product.avgRating || 0))}
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

          {/* Empty State */}
          {!loading && products.length === 0 && (
            <div className="text-center py-20">
              <p className="text-5xl mb-4">🛒</p>
              <p className="text-lg text-gray-500 dark:text-gray-400">
                {activeCategory !== "all" ? txt.noProducts : txt.noProductsYet}
              </p>
            </div>
          )}

          {/* Loading More Spinner */}
          {loadingMore && (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
              <span className="ml-3 text-gray-500">{txt.loading}</span>
            </div>
          )}

          {/* Intersection Observer Sentinel */}
          <div data-testid="load-more" ref={sentinelRef} className="h-4" />
        </Container>
      </section>
    </div>
  );
}
