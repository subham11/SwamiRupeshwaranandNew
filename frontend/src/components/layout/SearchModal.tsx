'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { globalSearch, SearchResults } from '@/lib/api';
import type { AppLocale } from '@/i18n/config';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TEXTS = {
  en: {
    placeholder: 'Search products, events, pages...',
    startTyping: 'Start typing to search...',
    noResults: (q: string) => `No results found for '${q}'`,
    products: 'Products',
    events: 'Events',
    pages: 'Pages',
    viewAll: 'View all results',
    shortcut: 'ESC to close',
  },
  hi: {
    placeholder: 'उत्पाद, कार्यक्रम, पृष्ठ खोजें...',
    startTyping: 'खोजने के लिए टाइप करें...',
    noResults: (q: string) => `'${q}' के लिए कोई परिणाम नहीं मिला`,
    products: 'उत्पाद',
    events: 'कार्यक्रम',
    pages: 'पृष्ठ',
    viewAll: 'सभी परिणाम देखें',
    shortcut: 'बंद करने के लिए ESC',
  },
};

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as AppLocale) || 'en';
  const txt = TEXTS[locale] || TEXTS.en;

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Build flat list of navigable items for keyboard navigation
  const flatItems = results
    ? [
        ...results.products.map((p) => ({
          type: 'product' as const,
          id: p.id,
          title: locale === 'hi' && p.titleHi ? p.titleHi : p.title,
          subtitle: p.categoryName ? p.categoryName : undefined,
          extra: `₹${p.price}`,
          href: `/${locale}/products/${p.slug}`,
        })),
        ...results.events.map((e) => ({
          type: 'event' as const,
          id: e.id,
          title: locale === 'hi' && e.titleHi ? e.titleHi : e.title,
          subtitle: e.date
            ? new Date(e.date).toLocaleDateString(locale === 'hi' ? 'hi-IN' : 'en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })
            : undefined,
          extra: undefined,
          href: `/${locale}/events/${e.slug}`,
        })),
        ...results.pages.map((p) => ({
          type: 'page' as const,
          id: p.id,
          title: locale === 'hi' && p.titleHi ? p.titleHi : p.title,
          subtitle: undefined,
          extra: undefined,
          href: `/${locale}/${p.slug}`,
        })),
      ]
    : [];

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setResults(null);
      setActiveIndex(-1);
    }
  }, [isOpen]);

  // Debounced search
  const doSearch = useCallback(
    async (q: string) => {
      if (!q.trim()) {
        setResults(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const data = await globalSearch(q.trim(), undefined, 8);
        setResults(data);
        setActiveIndex(-1);
      } catch {
        setResults({ products: [], events: [], pages: [], totalResults: 0 });
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const handleInputChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) {
      setResults(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(() => doSearch(value), 300);
  };

  // Navigate to item
  const navigateTo = (href: string) => {
    onClose();
    router.push(href);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev < flatItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : flatItems.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && flatItems[activeIndex]) {
        navigateTo(flatItems[activeIndex].href);
      } else if (query.trim()) {
        onClose();
        router.push(`/${locale}/search?q=${encodeURIComponent(query.trim())}`);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  if (!isOpen) return null;

  const hasQuery = query.trim().length > 0;
  const hasResults = results && results.totalResults > 0;
  const noResults = results && results.totalResults === 0 && hasQuery;

  // Group section indices for rendering headers
  const productStart = 0;
  const eventStart = results ? results.products.length : 0;
  const pageStart = results ? results.products.length + results.events.length : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] sm:pt-[15vh] px-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="Search"
      data-testid="search-modal"
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden"
        style={{
          animation: 'searchModalIn 0.2s ease-out',
        }}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          {/* Search Icon */}
          <svg
            className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={txt.placeholder}
            className="flex-1 bg-transparent text-lg outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
            autoComplete="off"
            spellCheck={false}
            data-testid="search-input"
          />
          {loading && (
            <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin flex-shrink-0" data-testid="search-loading" />
          )}
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
            {txt.shortcut}
          </kbd>
        </div>

        {/* Results Area */}
        <div className="max-h-[60vh] overflow-y-auto">
          {/* Empty / Start state */}
          {!hasQuery && !results && (
            <div className="px-5 py-12 text-center text-gray-400 dark:text-gray-500" data-testid="search-empty">
              <svg
                className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600"
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
              <p>{txt.startTyping}</p>
            </div>
          )}

          {/* No results */}
          {noResults && (
            <div className="px-5 py-12 text-center text-gray-400 dark:text-gray-500" data-testid="search-no-results">
              <p className="text-lg mb-1">{txt.noResults(query)}</p>
            </div>
          )}

          {/* Results */}
          {hasResults && (
            <div className="py-2">
              {/* Products Section */}
              {results.products.length > 0 && (
                <div data-testid="result-group result-group-products">
                  <div className="px-5 py-2 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    {txt.products}
                  </div>
                  {results.products.map((product, i) => {
                    const idx = productStart + i;
                    return (
                      <button
                        key={product.id}
                        onClick={() => navigateTo(`/${locale}/products/${product.slug}`)}
                        onMouseEnter={() => setActiveIndex(idx)}
                        data-testid="search-result"
                        className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-colors ${
                          activeIndex === idx
                            ? 'bg-orange-50 dark:bg-orange-950/30'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                      >
                        {/* Product thumbnail */}
                        <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {product.images?.[0] ? (
                            <img
                              src={product.images[0]}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-gray-400 text-sm">P</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {locale === 'hi' && product.titleHi ? product.titleHi : product.title}
                          </p>
                          {product.categoryName && (
                            <span className="inline-block mt-0.5 text-xs px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300">
                              {product.categoryName}
                            </span>
                          )}
                        </div>
                        <span className="text-sm font-semibold text-orange-600 dark:text-orange-400 flex-shrink-0">
                          ₹{product.price}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Events Section */}
              {results.events.length > 0 && (
                <div data-testid="result-group result-group-events">
                  <div className="px-5 py-2 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mt-1">
                    {txt.events}
                  </div>
                  {results.events.map((event, i) => {
                    const idx = eventStart + i;
                    return (
                      <button
                        key={event.id}
                        onClick={() => navigateTo(`/${locale}/events/${event.slug}`)}
                        onMouseEnter={() => setActiveIndex(idx)}
                        data-testid="search-result"
                        className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-colors ${
                          activeIndex === idx
                            ? 'bg-orange-50 dark:bg-orange-950/30'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-lg bg-orange-50 dark:bg-orange-900/30 flex-shrink-0 flex items-center justify-center">
                          <svg
                            className="w-5 h-5 text-orange-500"
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
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {locale === 'hi' && event.titleHi ? event.titleHi : event.title}
                          </p>
                          {event.date && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              {new Date(event.date).toLocaleDateString(
                                locale === 'hi' ? 'hi-IN' : 'en-IN',
                                { year: 'numeric', month: 'short', day: 'numeric' },
                              )}
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Pages Section */}
              {results.pages.length > 0 && (
                <div data-testid="result-group result-group-pages">
                  <div className="px-5 py-2 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mt-1">
                    {txt.pages}
                  </div>
                  {results.pages.map((page, i) => {
                    const idx = pageStart + i;
                    return (
                      <button
                        key={page.id}
                        onClick={() => navigateTo(`/${locale}/${page.slug}`)}
                        onMouseEnter={() => setActiveIndex(idx)}
                        data-testid="search-result"
                        className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-colors ${
                          activeIndex === idx
                            ? 'bg-orange-50 dark:bg-orange-950/30'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex-shrink-0 flex items-center justify-center">
                          <svg
                            className="w-5 h-5 text-gray-400 dark:text-gray-500"
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
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {locale === 'hi' && page.titleHi ? page.titleHi : page.title}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {hasQuery && hasResults && (
          <div className="px-5 py-3 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => {
                onClose();
                router.push(`/${locale}/search?q=${encodeURIComponent(query.trim())}`);
              }}
              className="w-full text-center text-sm font-medium text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition-colors py-1"
            >
              {txt.viewAll} &rarr;
            </button>
          </div>
        )}
      </div>

      {/* Animation keyframes */}
      <style jsx global>{`
        @keyframes searchModalIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
