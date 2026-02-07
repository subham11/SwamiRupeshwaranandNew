'use client';

import { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';

const API_BASE =
  (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:2026').replace(/\/api\/v1\/?$/, '') +
  '/api/v1';

interface CMSComponent {
  id: string;
  componentType: string;
  isVisible: boolean;
  displayOrder: number;
  fields: { key: string; value?: unknown; localizedValue?: Record<string, string> }[];
}

interface CMSPageWithComponents {
  slug: string;
  components?: CMSComponent[];
}

interface TextBlock {
  id: string;
  title: string;
  content: string;
  alignment: string;
  order: number;
}

interface CMSTextBlocksProps {
  pageSlug: string;
  locale: 'en' | 'hi';
}

/**
 * Client-side component that fetches text_block components from a CMS page
 * and renders them with rich HTML content.
 */
export default function CMSTextBlocks({ pageSlug, locale }: CMSTextBlocksProps) {
  const [textBlocks, setTextBlocks] = useState<TextBlock[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTextBlocks() {
      try {
        const res = await fetch(`${API_BASE}/cms/pages/by-slug/${pageSlug}`);
        if (!res.ok) {
          setLoading(false);
          return;
        }
        const cmsPage: CMSPageWithComponents = await res.json();
        if (!cmsPage.components) {
          setLoading(false);
          return;
        }

        const blocks = cmsPage.components
          .filter((c) => c.componentType === 'text_block' && c.isVisible)
          .sort((a, b) => a.displayOrder - b.displayOrder)
          .map((comp) => {
            const titleField = comp.fields.find((f) => f.key === 'title');
            const contentField = comp.fields.find((f) => f.key === 'content');
            const alignField = comp.fields.find((f) => f.key === 'alignment');

            const title =
              titleField?.localizedValue?.[locale] || (titleField?.value as string) || '';
            const content =
              contentField?.localizedValue?.[locale] || (contentField?.value as string) || '';
            const alignment = (alignField?.value as string) || 'left';

            return {
              id: comp.id,
              title,
              content,
              alignment,
              order: comp.displayOrder,
            };
          });

        setTextBlocks(blocks);
      } catch {
        // Silently fail — CMS content is supplementary
      } finally {
        setLoading(false);
      }
    }

    fetchTextBlocks();
  }, [pageSlug, locale]);

  if (loading || textBlocks.length === 0) return null;

  return (
    <div className="space-y-12 sm:space-y-16">
      {textBlocks.map((block, index) => (
        <section
          key={block.id}
          className={index !== 0 ? 'pt-8 sm:pt-12 border-t border-zinc-200 dark:border-zinc-800' : ''}
        >
          {block.title && (
            <h2
              className="text-xl sm:text-2xl md:text-3xl font-heading font-semibold text-zinc-800 dark:text-zinc-100 mb-4 sm:mb-6"
              style={{ textAlign: block.alignment as 'left' | 'center' | 'right' }}
            >
              {block.title}
            </h2>
          )}
          {block.content && (
            <div
              className="prose prose-zinc dark:prose-invert max-w-none text-base sm:text-lg leading-relaxed"
              style={{ textAlign: block.alignment as 'left' | 'center' | 'right' }}
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(block.content),
              }}
            />
          )}
        </section>
      ))}

      <style jsx global>{`
        .prose h1 { font-size: 2em; font-weight: 700; margin-bottom: 0.5em; color: var(--color-primary, #92400e); }
        .prose h2 { font-size: 1.5em; font-weight: 600; margin-bottom: 0.5em; color: var(--color-primary, #92400e); }
        .prose h3 { font-size: 1.25em; font-weight: 600; margin-bottom: 0.5em; }
        .prose p { margin-bottom: 1em; }
        .prose ul, .prose ol { margin-bottom: 1em; padding-left: 1.5em; }
        .prose li { margin-bottom: 0.25em; }
        .prose blockquote {
          border-left: 4px solid var(--color-gold, #d97706);
          padding-left: 1em;
          margin: 1em 0;
          font-style: italic;
          color: #6b7280;
        }
        .prose a { color: var(--color-primary, #92400e); text-decoration: underline; }
        .prose strong { font-weight: 700; }
      `}</style>
    </div>
  );
}
