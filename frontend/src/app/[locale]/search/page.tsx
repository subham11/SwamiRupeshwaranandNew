'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import type { AppLocale } from '@/i18n/config';
import { Container } from '@/components/ui/Container';
import { globalSearch, SearchResults } from '@/lib/api';

const TEXTS = {
  en: {
    title: 'Search Results',
    searching: 'Searching...',
    resultsFor: (q: string) => `Results for "${q}"`,
    noQuery: 'Enter a search term to find products, events, and pages.',
    noResults: (q: string) => `No results found for "${q}"`,
    products: 'Products',
    events: 'Events',
    pages: 'Pages',
    totalResults: (n: number) => `${n} result${n !== 1 ? 's' : ''} found`,
    viewProduct: 'View product',
    viewEvent: 'View event',
    viewPage: 'View page',
  },
  hi: {
    title: 'खोज परिणाम',
    searching: 'खोज रहा है...',
    resultsFor: (q: string) => `"${q}" के परिणाम`,
    noQuery: 'उत्पाद, कार्यक्रम और पृष्ठ खोजने के लिए एक खोज शब्द दर्ज करें।',
    noResults: (q: string) => `"${q}" के लिए कोई परिणाम नहीं मिला`,
    products: 'उत्पाद',
    events: 'कार्यक्रम',
    pages: 'पृष्ठ',
    totalResults: (n: number) => `${n} परिणाम मिले`,
    viewProduct: 'उत्पाद देखें',
    viewEvent: 'कार्यक्रम देखें',
    viewPage: 'पृष्ठ देखें',
  },
};

function SearchPageInner() {
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = (params?.locale as AppLocale) || 'en';
  const txt = TEXTS[locale] || TEXTS.en;
  const query = searchParams.get('q') || '';

  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);

  const getLocaleField = (en: string, hi?: string) =>
    locale === 'hi' && hi ? hi : en;

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults(null);
      return;
    }
    setLoading(true);
    try {
      const data = await globalSearch(q.trim(), undefined, 20);
      setResults(data);
    } catch {
      setResults({ products: [], events: [], pages: [], totalResults: 0 });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    doSearch(query);
  }, [query, doSearch]);

  return (
    <div style={{ backgroundColor: 'var(--color-background)' }} className="min-h-screen">
      <section className="py-12 sm:py-16">
        <Container>
          {/* Header */}
          <div className="mb-10">
            <h1
              className="text-3xl sm:text-4xl font-heading font-bold mb-2"
              style={{ color: 'var(--color-primary)' }}
            >
              {txt.title}
            </h1>
            {query && (
              <p className="text-lg text-gray-600 dark:text-gray-400">
                {txt.resultsFor(query)}
              </p>
            )}
            {results && !loading && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {txt.totalResults(results.totalResults)}
              </p>
            )}
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
              <span className="ml-3 text-gray-500 dark:text-gray-400">{txt.searching}</span>
            </div>
          )}

          {/* No query */}
          {!query && !loading && (
            <div className="text-center py-20">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <p className="text-lg text-gray-500 dark:text-gray-400">{txt.noQuery}</p>
            </div>
          )}

          {/* No results */}
          {results && results.totalResults === 0 && query && !loading && (
            <div className="text-center py-20">
              <p className="text-5xl mb-4">&#128269;</p>
              <p className="text-lg text-gray-500 dark:text-gray-400">
                {txt.noResults(query)}
              </p>
            </div>
          )}

          {/* Results */}
          {results && results.totalResults > 0 && !loading && (
            <div className="space-y-12">
              {/* Products Section */}
              {results.products.length > 0 && (
                <div>
                  <h2
                    className="text-xl font-heading font-semibold mb-4 pb-2 border-b"
                    style={{ color: 'var(--color-primary)', borderColor: 'var(--color-border)' }}
                  >
                    {txt.products}
                    <span className="text-sm font-normal text-gray-400 ml-2">
                      ({results.products.length})
                    </span>
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                    {results.products.map((product) => (
                      <Link
                        key={product.id}
                        href={`/${locale}/products/${product.slug}`}
                        className="group"
                      >
                        <div className="rounded-2xl overflow-hidden bg-white border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 dark:bg-gray-800 dark:border-gray-700 h-full flex flex-col">
                          {/* Image */}
                          <div className="relative h-40 sm:h-48 bg-gray-50 dark:bg-gray-700 overflow-hidden">
                            {product.images?.[0] ? (
                              <img
                                src={product.images[0]}
                                alt={getLocaleField(product.title, product.titleHi)}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="flex items-center justify-center h-full text-4xl text-gray-300">
                                P
                              </div>
                            )}
                          </div>
                          {/* Content */}
                          <div className="p-4 flex flex-col flex-1">
                            <h3
                              className="font-semibold text-sm sm:text-base line-clamp-2 mb-1"
                              style={{ color: 'var(--color-primary)' }}
                            >
                              {getLocaleField(product.title, product.titleHi)}
                            </h3>
                            {product.categoryName && (
                              <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 mb-2 w-fit">
                                {product.categoryName}
                              </span>
                            )}
                            <div className="mt-auto">
                              <span
                                className="text-lg font-bold"
                                style={{ color: 'var(--color-gold)' }}
                              >
                                ₹{product.price}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Events Section */}
              {results.events.length > 0 && (
                <div>
                  <h2
                    className="text-xl font-heading font-semibold mb-4 pb-2 border-b"
                    style={{ color: 'var(--color-primary)', borderColor: 'var(--color-border)' }}
                  >
                    {txt.events}
                    <span className="text-sm font-normal text-gray-400 ml-2">
                      ({results.events.length})
                    </span>
                  </h2>
                  <div className="space-y-3">
                    {results.events.map((event) => (
                      <Link
                        key={event.id}
                        href={`/${locale}/events/${event.slug}`}
                        className="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group"
                      >
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: 'var(--color-primary-light, #FFF7ED)' }}
                        >
                          <svg
                            className="w-6 h-6 text-orange-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                            />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3
                            className="font-semibold text-base group-hover:text-orange-600 transition-colors truncate"
                            style={{ color: 'var(--color-text)' }}
                          >
                            {getLocaleField(event.title, event.titleHi)}
                          </h3>
                          {event.date && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                              {new Date(event.date).toLocaleDateString(
                                locale === 'hi' ? 'hi-IN' : 'en-IN',
                                { year: 'numeric', month: 'long', day: 'numeric' },
                              )}
                            </p>
                          )}
                        </div>
                        <svg
                          className="w-5 h-5 text-gray-400 group-hover:text-orange-500 transition-colors flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Pages Section */}
              {results.pages.length > 0 && (
                <div>
                  <h2
                    className="text-xl font-heading font-semibold mb-4 pb-2 border-b"
                    style={{ color: 'var(--color-primary)', borderColor: 'var(--color-border)' }}
                  >
                    {txt.pages}
                    <span className="text-sm font-normal text-gray-400 ml-2">
                      ({results.pages.length})
                    </span>
                  </h2>
                  <div className="space-y-3">
                    {results.pages.map((page) => (
                      <Link
                        key={page.id}
                        href={`/${locale}/${page.slug}`}
                        className="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group"
                      >
                        <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                          <svg
                            className="w-6 h-6 text-gray-400 dark:text-gray-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                            />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3
                            className="font-semibold text-base group-hover:text-orange-600 transition-colors truncate"
                            style={{ color: 'var(--color-text)' }}
                          >
                            {getLocaleField(page.title, page.titleHi)}
                          </h3>
                        </div>
                        <svg
                          className="w-5 h-5 text-gray-400 group-hover:text-orange-500 transition-colors flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Container>
      </section>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <SearchPageInner />
    </Suspense>
  );
}
