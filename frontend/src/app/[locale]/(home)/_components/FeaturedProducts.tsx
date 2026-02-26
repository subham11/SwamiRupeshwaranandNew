"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import type { AppLocale } from "@/i18n/config";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/Decorative";
import { fetchFeaturedProducts, fetchProductCategories, Product, ProductCategory } from "@/lib/api";

interface FeaturedProductsProps {
  locale: AppLocale;
}

const TEXTS = {
  en: {
    title: "Our Products",
    subtitle: "Discover authentic spiritual offerings curated by the Ashram",
    all: "All",
    seeAll: "See All Products →",
    inStock: "In Stock",
    outOfStock: "Out of Stock",
    limited: "Limited Stock",
    off: "OFF",
    noProducts: "Products coming soon…",
  },
  hi: {
    title: "हमारे उत्पाद",
    subtitle: "आश्रम द्वारा चयनित प्रामाणिक आध्यात्मिक उत्पाद",
    all: "सभी",
    seeAll: "सभी उत्पाद देखें →",
    inStock: "उपलब्ध",
    outOfStock: "उपलब्ध नहीं",
    limited: "सीमित",
    off: "छूट",
    noProducts: "उत्पाद जल्द आ रहे हैं…",
  },
};

export default function FeaturedProducts({ locale }: FeaturedProductsProps) {
  const txt = TEXTS[locale] || TEXTS.en;

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const [prodRes, catRes] = await Promise.all([
          fetchFeaturedProducts(),
          fetchProductCategories(),
        ]);
        setProducts(prodRes.items || []);
        setCategories(catRes.items || []);
      } catch {
        // Fail silently on home page
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filteredProducts =
    activeCategory === "all"
      ? products
      : products.filter((p) => p.categoryId === activeCategory);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = 320;
    scrollRef.current.scrollBy({
      left: dir === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  // Don't show section if no products loaded and loading finished
  if (!loading && products.length === 0) return null;

  const getLocaleField = (en: string, hi?: string) =>
    locale === "hi" && hi ? hi : en;

  return (
    <section className="py-12 sm:py-16 md:py-20 relative overflow-hidden">
      {/* Subtle pattern bg */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `radial-gradient(circle at 70% 70%, var(--color-gold) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      <Container className="relative z-10">
        <SectionHeading title={txt.title} subtitle={txt.subtitle} />

        {/* Category Filter Tabs */}
        {categories.length > 0 && (
          <div className="flex justify-center gap-2 mb-8 flex-wrap">
            <button
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
            {categories.filter((c) => c.isActive).map((cat) => (
              <button
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden bg-white dark:bg-gray-800 animate-pulse">
                <div className="h-52 bg-gray-200 dark:bg-gray-700" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Carousel */}
        {!loading && filteredProducts.length > 0 && (
          <div className="relative group">
            {/* Scroll Arrows */}
            {filteredProducts.length > 4 && (
              <>
                <button
                  onClick={() => scroll("left")}
                  className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-10 h-10 rounded-full bg-white shadow-lg items-center justify-center text-gray-600 hover:text-orange-600 opacity-0 group-hover:opacity-100 transition dark:bg-gray-800 dark:text-gray-300"
                  aria-label="Scroll left"
                >
                  ‹
                </button>
                <button
                  onClick={() => scroll("right")}
                  className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-10 h-10 rounded-full bg-white shadow-lg items-center justify-center text-gray-600 hover:text-orange-600 opacity-0 group-hover:opacity-100 transition dark:bg-gray-800 dark:text-gray-300"
                  aria-label="Scroll right"
                >
                  ›
                </button>
              </>
            )}

            {/* Scrollable Container */}
            <div
              ref={scrollRef}
              className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {filteredProducts.map((product) => (
                <Link
                  key={product.id}
                  href={`/${locale}/products/${product.slug}`}
                  className="flex-none w-[270px] sm:w-[280px] snap-start group/card"
                >
                  <div className="rounded-2xl overflow-hidden bg-white border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 dark:bg-gray-800 dark:border-gray-700">
                    {/* Image */}
                    <div className="relative h-52 bg-gray-50 dark:bg-gray-700 overflow-hidden">
                      {product.imageUrls?.[0] ? (
                        <img
                          src={product.imageUrls[0]}
                          alt={getLocaleField(product.title, product.titleHi)}
                          className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-300"
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
                    <div className="p-4">
                      <h3
                        className="font-semibold text-base line-clamp-1 mb-1"
                        style={{ color: "var(--color-primary)" }}
                      >
                        {getLocaleField(product.title, product.titleHi)}
                      </h3>
                      {(product.subtitle || product.subtitleHi) && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1 mb-2">
                          {getLocaleField(product.subtitle || "", product.subtitleHi)}
                        </p>
                      )}

                      {/* Price */}
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold" style={{ color: "var(--color-gold)" }}>
                          ₹{product.price}
                        </span>
                        {product.originalPrice && product.originalPrice > product.price && (
                          <span className="text-sm text-gray-400 line-through">
                            ₹{product.originalPrice}
                          </span>
                        )}
                      </div>

                      {/* Rating */}
                      {product.totalReviews > 0 && (
                        <div className="flex items-center gap-1 mt-2 text-sm text-gray-500">
                          <span className="text-yellow-500">
                            {"★".repeat(Math.round(product.avgRating || 0))}
                            {"☆".repeat(5 - Math.round(product.avgRating || 0))}
                          </span>
                          <span>({product.totalReviews})</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* No products */}
        {!loading && filteredProducts.length === 0 && products.length > 0 && (
          <p className="text-center text-gray-500 py-8">{txt.noProducts}</p>
        )}

        {/* See All Button */}
        {!loading && products.length > 0 && (
          <div className="text-center mt-8">
            <Link
              href={`/${locale}/products`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-medium text-white transition hover:shadow-lg"
              style={{ backgroundColor: "var(--color-gold)" }}
            >
              {txt.seeAll}
            </Link>
          </div>
        )}
      </Container>
    </section>
  );
}
