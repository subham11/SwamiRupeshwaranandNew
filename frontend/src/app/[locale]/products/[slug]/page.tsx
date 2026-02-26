"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { AppLocale } from "@/i18n/config";
import { Container } from "@/components/ui/Container";
import {
  fetchProductBySlug,
  fetchProductReviews,
  createProductReview,
  Product,
  ProductReview,
} from "@/lib/api";
import { useAuth } from "@/lib/useAuth";

const TEXTS = {
  en: {
    home: "Home",
    products: "Products",
    inStock: "In Stock",
    outOfStock: "Out of Stock",
    limited: "Limited Stock",
    off: "OFF",
    weight: "Weight",
    tags: "Tags",
    description: "Description",
    reviews: "Reviews",
    writeReview: "Write a Review",
    submitReview: "Submit Review",
    submitting: "Submitting…",
    loginToReview: "Login to write a review",
    rating: "Rating",
    reviewPlaceholder: "Share your experience with this product…",
    reviewPlaceholderHi: "Hindi review (optional)",
    noReviews: "No reviews yet. Be the first to review!",
    loadMore: "Load More Reviews",
    outOf5: "out of 5",
    buyNow: "Buy Now",
    comingSoon: "Coming Soon",
    notFound: "Product not found",
    backToProducts: "← Back to Products",
    verified: "Verified Purchase",
  },
  hi: {
    home: "होम",
    products: "उत्पाद",
    inStock: "उपलब्ध",
    outOfStock: "उपलब्ध नहीं",
    limited: "सीमित",
    off: "छूट",
    weight: "वजन",
    tags: "टैग",
    description: "विवरण",
    reviews: "समीक्षाएं",
    writeReview: "समीक्षा लिखें",
    submitReview: "समीक्षा भेजें",
    submitting: "भेजा जा रहा है…",
    loginToReview: "समीक्षा लिखने के लिए लॉगिन करें",
    rating: "रेटिंग",
    reviewPlaceholder: "इस उत्पाद के साथ अपना अनुभव साझा करें…",
    reviewPlaceholderHi: "हिंदी समीक्षा (वैकल्पिक)",
    noReviews: "अभी तक कोई समीक्षा नहीं। पहले समीक्षक बनें!",
    loadMore: "और समीक्षाएं लोड करें",
    outOf5: "में से 5",
    buyNow: "अभी खरीदें",
    comingSoon: "जल्द आ रहा है",
    notFound: "उत्पाद नहीं मिला",
    backToProducts: "← उत्पादों पर वापस जाएं",
    verified: "सत्यापित खरीदारी",
  },
};

const STOCK_STYLES: Record<string, { bg: string; text: string }> = {
  in_stock: { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-400" },
  out_of_stock: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400" },
  limited: { bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-700 dark:text-yellow-400" },
};

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const locale = (params?.locale as AppLocale) || "en";
  const txt = TEXTS[locale] || TEXTS.en;

  const { user, accessToken, isAuthenticated } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [mainImage, setMainImage] = useState<string>("");
  const [showVideo, setShowVideo] = useState(false);

  // Reviews
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [reviewCursor, setReviewCursor] = useState<string | undefined>();
  const [hasMoreReviews, setHasMoreReviews] = useState(false);
  const [loadingReviews, setLoadingReviews] = useState(false);

  // Review Form
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [reviewTextHi, setReviewTextHi] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  const getLocaleField = (en?: string, hi?: string) =>
    locale === "hi" && hi ? hi : en || "";

  // Load product
  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetchProductBySlug(slug)
      .then((p) => {
        setProduct(p);
        if (p.imageUrls?.[0]) setMainImage(p.imageUrls[0]);
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [slug]);

  // Load reviews
  const loadReviews = useCallback(async (reset = false) => {
    if (!product) return;
    setLoadingReviews(true);
    try {
      const data = await fetchProductReviews(product.id, 10, reset ? undefined : reviewCursor);
      const items = data.items || [];
      if (reset) {
        setReviews(items);
      } else {
        setReviews((prev) => [...prev, ...items]);
      }
      setReviewCursor(data.cursor || undefined);
      setHasMoreReviews(!!data.cursor);
    } catch {
      // silent
    } finally {
      setLoadingReviews(false);
    }
  }, [product, reviewCursor]);

  useEffect(() => {
    if (product) loadReviews(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id]);

  // Submit review
  const handleSubmitReview = async () => {
    if (!accessToken || !product) return;
    setSubmittingReview(true);
    setReviewError(null);
    try {
      const payload: Record<string, unknown> = { rating: reviewRating };
      if (reviewText) payload.reviewText = reviewText;
      if (reviewTextHi) payload.reviewTextHi = reviewTextHi;
      await createProductReview(product.id, payload, accessToken);
      setReviewSuccess(true);
      setShowReviewForm(false);
      setReviewText("");
      setReviewTextHi("");
      setReviewRating(5);
      // Reload reviews
      await loadReviews(true);
      setTimeout(() => setReviewSuccess(false), 3000);
    } catch {
      setReviewError("Failed to submit review. You may have already reviewed this product.");
    } finally {
      setSubmittingReview(false);
    }
  };

  // --------------- Render ---------------

  if (loading) {
    return (
      <div style={{ backgroundColor: "var(--color-background)" }}>
        <Container className="py-12">
          <div className="grid lg:grid-cols-2 gap-10 animate-pulse">
            <div className="h-[400px] bg-gray-200 dark:bg-gray-700 rounded-2xl" />
            <div className="space-y-4">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mt-4" />
              <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded mt-6" />
            </div>
          </div>
        </Container>
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{ backgroundColor: "var(--color-background)" }}>
        <Container className="py-20 text-center">
          <p className="text-5xl mb-4">😔</p>
          <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--color-primary)" }}>
            {txt.notFound}
          </h1>
          <Link
            href={`/${locale}/products`}
            className="inline-block mt-4 px-6 py-2 rounded-full text-white"
            style={{ backgroundColor: "var(--color-gold)" }}
          >
            {txt.backToProducts}
          </Link>
        </Container>
      </div>
    );
  }

  const purchaseLink = getLocaleField(product.purchaseLink, product.purchaseLinkHi);
  const stockStyle = STOCK_STYLES[product.stockStatus] || STOCK_STYLES.in_stock;
  const stockLabel = product.stockStatus === "in_stock" ? txt.inStock : product.stockStatus === "out_of_stock" ? txt.outOfStock : txt.limited;

  return (
    <div style={{ backgroundColor: "var(--color-background)" }}>
      <Container className="py-8 sm:py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center text-sm text-gray-500 mb-6 gap-2 flex-wrap">
          <Link href={`/${locale}`} className="hover:text-orange-600 transition">
            {txt.home}
          </Link>
          <span>/</span>
          <Link href={`/${locale}/products`} className="hover:text-orange-600 transition">
            {txt.products}
          </Link>
          <span>/</span>
          <span className="text-gray-700 dark:text-gray-300 font-medium truncate max-w-[200px]">
            {getLocaleField(product.title, product.titleHi)}
          </span>
        </nav>

        {/* Main Layout */}
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left: Image Gallery */}
          <div>
            {/* Main Image */}
            <div className="relative rounded-2xl overflow-hidden bg-white dark:bg-gray-800 border dark:border-gray-700 mb-4 aspect-square">
              {showVideo && product.videoUrl ? (
                <video
                  src={product.videoUrl}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                />
              ) : mainImage ? (
                <img
                  src={mainImage}
                  alt={getLocaleField(product.title, product.titleHi)}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-6xl text-gray-300">🛒</div>
              )}

              {/* Discount Badge */}
              {product.discountPercent && product.discountPercent > 0 && (
                <span className="absolute top-4 left-4 bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-xl">
                  {Math.round(product.discountPercent)}% {txt.off}
                </span>
              )}
            </div>

            {/* Thumbnails */}
            {((product.imageUrls && product.imageUrls.length > 1) || product.videoUrl) && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {product.imageUrls?.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => { setMainImage(url); setShowVideo(false); }}
                    className={`flex-none w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition ${
                      mainImage === url && !showVideo ? "border-orange-500" : "border-gray-200 dark:border-gray-700"
                    }`}
                  >
                    <img src={url} alt={`Thumb ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
                {product.videoUrl && (
                  <button
                    onClick={() => setShowVideo(true)}
                    className={`flex-none w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition flex items-center justify-center bg-gray-100 dark:bg-gray-800 ${
                      showVideo ? "border-orange-500" : "border-gray-200 dark:border-gray-700"
                    }`}
                  >
                    <span className="text-2xl">▶️</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Right: Product Info */}
          <div>
            {/* Category */}
            {product.categoryName && (
              <p className="text-sm font-medium mb-2" style={{ color: "var(--color-gold)" }}>
                {getLocaleField(product.categoryName, product.categoryNameHi)}
              </p>
            )}

            {/* Title */}
            <h1
              className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2"
              style={{ color: "var(--color-primary)" }}
            >
              {getLocaleField(product.title, product.titleHi)}
            </h1>

            {/* Subtitle */}
            {(product.subtitle || product.subtitleHi) && (
              <p className="text-lg text-gray-500 dark:text-gray-400 mb-4">
                {getLocaleField(product.subtitle, product.subtitleHi)}
              </p>
            )}

            {/* Rating Summary */}
            {product.totalReviews > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <span className="text-yellow-500 text-lg">
                  {"★".repeat(Math.round(product.avgRating || 0))}
                  {"☆".repeat(5 - Math.round(product.avgRating || 0))}
                </span>
                <span className="text-sm text-gray-500">
                  {product.avgRating?.toFixed(1)} {txt.outOf5} ({product.totalReviews} {txt.reviews.toLowerCase()})
                </span>
              </div>
            )}

            {/* Price */}
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl font-bold" style={{ color: "var(--color-gold)" }}>
                ₹{product.price}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <>
                  <span className="text-xl text-gray-400 line-through">₹{product.originalPrice}</span>
                  <span className="text-sm font-bold bg-green-100 text-green-700 px-2 py-1 rounded-lg dark:bg-green-900/30 dark:text-green-400">
                    {Math.round(product.discountPercent || 0)}% {txt.off}
                  </span>
                </>
              )}
            </div>

            {/* Stock Status */}
            <div className="mb-6">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${stockStyle.bg} ${stockStyle.text}`}>
                <span className={`w-2 h-2 rounded-full ${
                  product.stockStatus === "in_stock" ? "bg-green-500" : product.stockStatus === "out_of_stock" ? "bg-red-500" : "bg-yellow-500"
                }`} />
                {stockLabel}
              </span>
            </div>

            {/* Weight */}
            {(product.weight || product.weightHi) && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                <span className="font-medium">{txt.weight}:</span>
                <span>{getLocaleField(product.weight, product.weightHi)}</span>
              </div>
            )}

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {product.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-full text-xs font-medium bg-orange-50 dark:bg-orange-900/20"
                    style={{ color: "var(--color-gold)" }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Purchase / CTA */}
            <div className="mb-8">
              {purchaseLink ? (
                <a
                  href={purchaseLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-8 py-3 rounded-full text-white font-semibold text-lg transition hover:shadow-lg hover:scale-105"
                  style={{ backgroundColor: "var(--color-gold)" }}
                >
                  🛒 {txt.buyNow}
                </a>
              ) : (
                <span className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-gray-200 text-gray-500 font-semibold text-lg dark:bg-gray-700 dark:text-gray-400">
                  {txt.comingSoon}
                </span>
              )}
            </div>

            {/* Description */}
            {(product.description || product.descriptionHi) && (
              <div className="border-t dark:border-gray-700 pt-6">
                <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--color-primary)" }}>
                  {txt.description}
                </h2>
                <p className="text-gray-600 dark:text-gray-300 whitespace-pre-line leading-relaxed">
                  {getLocaleField(product.description, product.descriptionHi)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ========== Reviews Section ========== */}
        <div className="mt-12 sm:mt-16 border-t dark:border-gray-700 pt-10">
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <h2 className="text-2xl font-bold" style={{ color: "var(--color-primary)" }}>
              {txt.reviews} {product.totalReviews > 0 && `(${product.totalReviews})`}
            </h2>
            {isAuthenticated ? (
              <button
                onClick={() => setShowReviewForm(!showReviewForm)}
                className="px-5 py-2.5 rounded-full text-white font-medium transition hover:shadow-lg"
                style={{ backgroundColor: "var(--color-gold)" }}
              >
                ✍️ {txt.writeReview}
              </button>
            ) : (
              <Link
                href={`/${locale}/login`}
                className="px-5 py-2.5 rounded-full border-2 font-medium transition hover:bg-gray-50 dark:hover:bg-gray-800"
                style={{ borderColor: "var(--color-gold)", color: "var(--color-gold)" }}
              >
                {txt.loginToReview}
              </Link>
            )}
          </div>

          {/* Rating Summary Bar */}
          {product.totalReviews > 0 && (
            <div className="flex items-center gap-6 mb-8 bg-white dark:bg-gray-800 rounded-2xl border dark:border-gray-700 p-6">
              <div className="text-center">
                <p className="text-4xl font-bold" style={{ color: "var(--color-gold)" }}>
                  {product.avgRating?.toFixed(1)}
                </p>
                <span className="text-yellow-500 text-lg">
                  {"★".repeat(Math.round(product.avgRating || 0))}
                  {"☆".repeat(5 - Math.round(product.avgRating || 0))}
                </span>
                <p className="text-sm text-gray-500 mt-1">
                  {product.totalReviews} {txt.reviews.toLowerCase()}
                </p>
              </div>
            </div>
          )}

          {/* Review Form */}
          {showReviewForm && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border dark:border-gray-700 p-6 mb-8">
              <h3 className="font-semibold text-lg mb-4" style={{ color: "var(--color-primary)" }}>
                {txt.writeReview}
              </h3>

              {reviewError && (
                <p className="text-red-600 text-sm mb-3 bg-red-50 dark:bg-red-900/20 rounded-lg p-3">{reviewError}</p>
              )}

              {/* Star Selector */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{txt.rating}</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setReviewRating(star)}
                      className={`text-3xl transition ${star <= reviewRating ? "text-yellow-500" : "text-gray-300 dark:text-gray-600"}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              {/* Review text */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Review (English)
                  </label>
                  <textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    rows={4}
                    className="w-full border rounded-xl px-4 py-3 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder={txt.reviewPlaceholder}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    समीक्षा (हिंदी)
                  </label>
                  <textarea
                    value={reviewTextHi}
                    onChange={(e) => setReviewTextHi(e.target.value)}
                    rows={4}
                    className="w-full border rounded-xl px-4 py-3 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder={txt.reviewPlaceholderHi}
                  />
                </div>
              </div>

              <button
                onClick={handleSubmitReview}
                disabled={submittingReview}
                className="px-6 py-2.5 rounded-full text-white font-medium transition hover:shadow-lg disabled:opacity-50"
                style={{ backgroundColor: "var(--color-gold)" }}
              >
                {submittingReview ? txt.submitting : txt.submitReview}
              </button>
            </div>
          )}

          {/* Success */}
          {reviewSuccess && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-xl text-sm">
              Your review has been submitted and is pending approval. Thank you!
            </div>
          )}

          {/* Review List */}
          {reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-5"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {review.userEmail?.split("@")[0] || "Anonymous"}
                      </p>
                      <span className="text-yellow-500 text-sm">
                        {"★".repeat(review.rating)}
                        {"☆".repeat(5 - review.rating)}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(review.createdAt).toLocaleDateString(locale === "hi" ? "hi-IN" : "en-IN")}
                    </span>
                  </div>
                  {(review.reviewText || review.reviewTextHi) && (
                    <p className="text-gray-600 dark:text-gray-300 mt-2">
                      {getLocaleField(review.reviewText, review.reviewTextHi)}
                    </p>
                  )}
                </div>
              ))}

              {/* Load More */}
              {hasMoreReviews && (
                <div className="text-center pt-4">
                  <button
                    onClick={() => loadReviews(false)}
                    disabled={loadingReviews}
                    className="px-6 py-2 rounded-full border-2 font-medium transition hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
                    style={{ borderColor: "var(--color-gold)", color: "var(--color-gold)" }}
                  >
                    {loadingReviews ? "…" : txt.loadMore}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border dark:border-gray-700">
              <p className="text-3xl mb-3">⭐</p>
              <p className="text-gray-500 dark:text-gray-400">{txt.noReviews}</p>
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}
