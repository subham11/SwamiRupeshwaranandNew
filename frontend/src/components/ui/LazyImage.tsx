'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

interface LazyImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  aspectRatio?: '1:1' | '16:9' | '4:3' | '3:2';
  fallback?: string;
  priority?: boolean;
  fill?: boolean;
}

const ASPECT_RATIOS: Record<string, string> = {
  '1:1': 'aspect-square',
  '16:9': 'aspect-video',
  '4:3': 'aspect-[4/3]',
  '3:2': 'aspect-[3/2]',
};

const SHIMMER_SVG = `
<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#f3f4f6" />
      <stop offset="50%" style="stop-color:#e5e7eb" />
      <stop offset="100%" style="stop-color:#f3f4f6" />
    </linearGradient>
  </defs>
  <rect width="400" height="300" fill="url(#g)">
    <animate attributeName="x" from="-400" to="400" dur="1.5s" repeatCount="indefinite" />
  </rect>
</svg>`;

function toBase64(str: string): string {
  if (typeof window !== 'undefined') {
    return window.btoa(str);
  }
  return Buffer.from(str).toString('base64');
}

const PLACEHOLDER = `data:image/svg+xml;base64,${toBase64(SHIMMER_SVG)}`;
const DEFAULT_FALLBACK = '/images/placeholder.webp';

export default function LazyImage({
  src,
  alt,
  width,
  height,
  className = '',
  aspectRatio,
  fallback,
  priority = false,
  fill = false,
}: LazyImageProps) {
  const [isVisible, setIsVisible] = useState(priority);
  const [hasError, setHasError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading (skip if priority)
  useEffect(() => {
    if (priority || isVisible) return;

    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [priority, isVisible]);

  const imgSrc = hasError ? (fallback || DEFAULT_FALLBACK) : src;
  const arClass = aspectRatio ? ASPECT_RATIOS[aspectRatio] : '';

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${arClass} ${className}`}
    >
      {/* Shimmer placeholder */}
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-gray-200 dark:bg-gray-700" />
      )}

      {isVisible && (
        fill ? (
          <Image
            src={imgSrc}
            alt={alt}
            fill
            className={`object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
            placeholder="blur"
            blurDataURL={PLACEHOLDER}
            onLoad={() => setLoaded(true)}
            onError={() => setHasError(true)}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority={priority}
          />
        ) : (
          <Image
            src={imgSrc}
            alt={alt}
            width={width || 400}
            height={height || 300}
            className={`transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
            placeholder="blur"
            blurDataURL={PLACEHOLDER}
            onLoad={() => setLoaded(true)}
            onError={() => setHasError(true)}
            priority={priority}
          />
        )
      )}
    </div>
  );
}
