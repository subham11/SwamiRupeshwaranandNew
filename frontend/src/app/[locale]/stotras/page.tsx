'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Container from '@/components/ui/Container';
import ContentViewerModal from '@/components/ui/ContentViewerModal';
import { fetchPublicContent, SubscriptionContent } from '@/lib/api';
import type { AppLocale } from '@/i18n/config';

export default function StotrasPage() {
  const params = useParams();
  const locale = (params?.locale as AppLocale) || 'en';
  const isHindi = locale === 'hi';

  const [items, setItems] = useState<SubscriptionContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewerItem, setViewerItem] = useState<SubscriptionContent | null>(null);

  useEffect(() => {
    fetchPublicContent('stotra', locale)
      .then((data) => {
        setItems(data.items || []);
        setLoading(false);
      })
      .catch(() => {
        setError(isHindi ? 'स्तोत्र लोड करने में विफल' : 'Failed to load stotras');
        setLoading(false);
      });
  }, [locale, isHindi]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-amber-50 py-12">
      <Container>
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
            🙏 {isHindi ? 'दिव्य स्तोत्र' : 'Divine Stotras'}
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            {isHindi ? 'पवित्र स्तोत्र संग्रह' : 'Sacred Stotra Collection'}
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {isHindi
              ? 'भक्ति और साधना के लिए दिव्य स्तोत्रों का मुफ़्त संग्रह। डाउनलोड करें और अपनी दैनिक पूजा में शामिल करें।'
              : 'A free collection of divine stotras for devotion and sadhana. Download and incorporate them into your daily worship.'}
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-center py-16">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-orange-600 underline hover:text-orange-800"
            >
              {isHindi ? 'पुनः प्रयास करें' : 'Try again'}
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && items.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📿</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              {isHindi ? 'जल्द ही स्तोत्र उपलब्ध होंगे' : 'Stotras Coming Soon'}
            </h2>
            <p className="text-gray-500 mb-6">
              {isHindi
                ? 'हम जल्द ही यहाँ दिव्य स्तोत्र जोड़ेंगे। कृपया बाद में पुनः देखें।'
                : 'We are adding divine stotras here soon. Please check back later.'}
            </p>
            <Link
              href={`/${locale}/subscribe`}
              className="inline-flex items-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition font-medium"
            >
              {isHindi ? 'सभी योजनाएं देखें' : 'View All Plans'} →
            </Link>
          </div>
        )}

        {/* Content Grid */}
        {!loading && !error && items.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="group bg-white rounded-xl border border-orange-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer"
                onClick={() => item.fileUrl && setViewerItem(item)}
                role={item.fileUrl ? 'button' : undefined}
                tabIndex={item.fileUrl ? 0 : undefined}
                onKeyDown={(e) => { if (e.key === 'Enter' && item.fileUrl) setViewerItem(item); }}
              >
                {/* Thumbnail */}
                {item.thumbnailUrl ? (
                  <div className="h-40 bg-orange-50 overflow-hidden">
                    <img
                      src={item.thumbnailUrl}
                      alt={isHindi && item.titleHi ? item.titleHi : item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="h-40 bg-gradient-to-br from-orange-100 to-amber-50 flex items-center justify-center">
                    <span className="text-5xl">📜</span>
                  </div>
                )}

                {/* Content */}
                <div className="p-5">
                  <h3 className="font-semibold text-lg text-gray-900 mb-1 line-clamp-2">
                    {isHindi && item.titleHi ? item.titleHi : item.title}
                  </h3>
                  {(isHindi ? item.descriptionHi || item.description : item.description) && (
                    <p className="text-gray-500 text-sm line-clamp-2 mb-4">
                      {isHindi ? item.descriptionHi || item.description : item.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded-full">
                      ✓ {isHindi ? 'मुफ़्त' : 'Free'}
                    </span>
                    {item.fileUrl && (
                      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-orange-600 group-hover:text-orange-800 transition">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        {isHindi ? 'देखें' : 'View'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CTA Section */}
        {!loading && !error && items.length > 0 && (
          <div className="mt-16 text-center bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl p-8 border border-orange-100">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {isHindi ? 'और अधिक स्तोत्र चाहिए?' : 'Want More Stotras?'}
            </h2>
            <p className="text-gray-600 mb-6">
              {isHindi
                ? 'हमारी सदस्यता योजनाओं के साथ प्रीमियम स्तोत्र, कवच और अन्य आध्यात्मिक सामग्री अनलॉक करें।'
                : 'Unlock premium stotras, kavach, and other spiritual content with our subscription plans.'}
            </p>
            <Link
              href={`/${locale}/subscribe`}
              className="inline-flex items-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition font-medium"
            >
              {isHindi ? 'सदस्यता योजनाएं देखें' : 'View Subscription Plans'} →
            </Link>
          </div>
        )}

        {/* Content Viewer Modal */}
        {viewerItem && viewerItem.fileUrl && (
          <ContentViewerModal
            isOpen={!!viewerItem}
            onClose={() => setViewerItem(null)}
            fileUrl={viewerItem.fileUrl}
            title={isHindi && viewerItem.titleHi ? viewerItem.titleHi : viewerItem.title}
            accent="orange"
          />
        )}
      </Container>
    </main>
  );
}
