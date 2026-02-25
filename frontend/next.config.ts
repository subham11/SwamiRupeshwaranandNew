import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  
  // AWS Amplify SSR compatibility
  // Using 'standalone' for Amplify SSR, 'export' for static manual deployment
  output: process.env.AMPLIFY_BUILD === 'true' 
    ? 'standalone' 
    : process.env.STATIC_EXPORT === 'true' 
      ? 'export' 
      : undefined,
  
  // Image optimization settings
  images: {
    // Disable image optimization in Amplify to avoid Lambda cold starts
    unoptimized: process.env.AMPLIFY_BUILD === 'true',
    // Define allowed remote image patterns for security
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.swamirupeshwaranand.in',
      },
      {
        protocol: 'https',
        hostname: 's3.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
      },
    ],
  },
  
  // Trailing slashes for consistent routing
  trailingSlash: false,
  
  // Enable experimental features for better performance
  experimental: {
    // Optimize package imports for smaller bundles
    optimizePackageImports: ['motion', 'swiper', '@tanstack/react-query'],
  },
  
  // Headers for security and caching
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
      // Cache static assets
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // ─── CDN Cache: Public pages (5 min browser, 10 min CDN edge) ─────
      // Amplify CDN respects these Cache-Control headers for edge caching
      // This cuts SSR compute costs by 50-70% for public content pages
      {
        source: '/:locale(en|hi)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, s-maxage=600, stale-while-revalidate=60',
          },
        ],
      },
      {
        source: '/:locale(en|hi)/teachings/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, s-maxage=600, stale-while-revalidate=60',
          },
        ],
      },
      {
        source: '/:locale(en|hi)/swamiji',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, s-maxage=600, stale-while-revalidate=60',
          },
        ],
      },
      {
        source: '/:locale(en|hi)/ashram',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, s-maxage=600, stale-while-revalidate=60',
          },
        ],
      },
      {
        source: '/:locale(en|hi)/services',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, s-maxage=600, stale-while-revalidate=60',
          },
        ],
      },
      {
        source: '/:locale(en|hi)/events',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, s-maxage=600, stale-while-revalidate=60',
          },
        ],
      },
      {
        source: '/:locale(en|hi)/gurukul',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, s-maxage=600, stale-while-revalidate=60',
          },
        ],
      },
      {
        source: '/:locale(en|hi)/contact',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, s-maxage=600, stale-while-revalidate=60',
          },
        ],
      },
      {
        source: '/:locale(en|hi)/donation',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, s-maxage=600, stale-while-revalidate=60',
          },
        ],
      },
      // ─── Dynamic pages: NO caching (auth-protected, user-specific) ────
      {
        source: '/:locale(en|hi)/dashboard/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, private',
          },
        ],
      },
      {
        source: '/:locale(en|hi)/admin/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, private',
          },
        ],
      },
      {
        source: '/:locale(en|hi)/login',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, private',
          },
        ],
      },
    ];
  },
  
  // Rewrites for API proxy (optional, for local development)
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:2026';
    
    // Only proxy in development
    if (process.env.NODE_ENV !== 'production') {
      return [
        {
          source: '/api/:path*',
          destination: `${apiUrl}/api/v1/:path*`,
        },
      ];
    }
    
    return [];
  },
  
  // Redirects for locale handling
  async redirects() {
    return [
      {
        source: '/',
        destination: '/en',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
