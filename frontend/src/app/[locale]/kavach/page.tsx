'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Container from '@/components/ui/Container';
import { fetchPublicContent, SubscriptionContent } from '@/lib/api';
import type { AppLocale } from '@/i18n/config';

export default function KavachPage() {
  const params = useParams();
  const locale = (params?.locale as AppLocale) || 'en';
  const isHindi = locale === 'hi';

  const [items, setItems] = useState<SubscriptionContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPublicContent('kavach', locale)
      .then((data) => {
        setItems(data.items || []);
        setLoading(false);
      })
      .catch(() => {
        setError(isHindi ? 'कवच लोड करने में विफल' : 'Failed to load kavach');
        setLoading(false);
      });
  }, [locale, isHindi]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-orange-50 py-12">
      <Container>
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
            🛡️ {isHindi ? 'दिव्य कवच' : 'Divine Kavach'}
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            {isHindi ? 'पवित्र कवच संग्रह' : 'Sacred Kavach Collection'}
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {isHindi
              ? 'सुरक्षा और आशीर्वाद के लिए दिव्य कवचों का मुफ़्त संग्रह। डाउनलोड करें और अपनी दैनिक साधना में शामिल करें।'
              : 'A free collection of divine kavach for protection and blessings. Download and incorporate them into your daily sadhana.'}
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-center py-16">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-amber-600 underline hover:text-amber-800"
            >
              {isHindi ? 'पुनः प्रयास करें' : 'Try again'}
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && items.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🛡️</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              {isHindi ? 'जल्द ही कवच उपलब्ध होंगे' : 'Kavach Coming Soon'}
            </h2>
            <p className="text-gray-500 mb-6">
              {isHindi
                ? 'हम जल्द ही यहाँ दिव्य कवच जोड़ेंगे। कृपया बाद में पुनः देखें।'
                : 'We are adding divine kavach here soon. Please check back later.'}
            </p>
            <Link
              href={`/${locale}/subscribe`}
              className="inline-flex items-center gap-2 bg-amber-600 text-white px-6 py-3 rounded-lg hover:bg-amber-700 transition font-medium"
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
                className="group bg-white rounded-xl border border-amber-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
              >
                {/* Thumbnail */}
                {item.thumbnailUrl ? (
                  <div className="h-40 bg-amber-50 overflow-hidden">
                    <img
                      src={item.thumbnailUrl}
                      alt={isHindi && item.titleHi ? item.titleHi : item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="h-40 bg-gradient-to-br from-amber-100 to-orange-50 flex items-center justify-center">
                    <span className="text-5xl">🛡️</span>
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
                      <a
                        href={item.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-600 hover:text-amber-800 transition"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {isHindi ? 'डाउनलोड PDF' : 'Download PDF'}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CTA Section */}
        {!loading && !error && items.length > 0 && (
          <div className="mt-16 text-center bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-8 border border-amber-100">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {isHindi ? 'और अधिक कवच चाहिए?' : 'Want More Kavach?'}
            </h2>
            <p className="text-gray-600 mb-6">
              {isHindi
                ? 'हमारी सदस्यता योजनाओं के साथ प्रीमियम कवच, स्तोत्र और अन्य आध्यात्मिक सामग्री अनलॉक करें।'
                : 'Unlock premium kavach, stotras, and other spiritual content with our subscription plans.'}
            </p>
            <Link
              href={`/${locale}/subscribe`}
              className="inline-flex items-center gap-2 bg-amber-600 text-white px-6 py-3 rounded-lg hover:bg-amber-700 transition font-medium"
            >
              {isHindi ? 'सदस्यता योजनाएं देखें' : 'View Subscription Plans'} →
            </Link>
          </div>
        )}
      </Container>
    </main>
  );
}
