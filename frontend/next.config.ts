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
