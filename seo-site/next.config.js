/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,
  
  // Output standalone for Docker deployment
  output: 'standalone',
  
  // Image optimization configuration
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cricsmart.in',
      },
      {
        protocol: 'https',
        hostname: 'app.cricsmart.in',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  
  // Compression
  compress: true,
  
  // Power optimizations
  poweredByHeader: false,
  
  // Environment variables
  env: {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'https://cricsmart.in',
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://cricsmart.in',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'https://app.cricsmart.in',
    NEXT_PUBLIC_TOURNAMENT_URL: process.env.NEXT_PUBLIC_TOURNAMENT_URL || 'https://tournament.cricsmart.in',
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
  },
  
  // Headers for SEO and security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  
  // Redirects for SEO
  async redirects() {
    return [
      // Redirect www to non-www
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.cricsmart.in' }],
        destination: 'https://cricsmart.in/:path*',
        permanent: true,
      },
      // 301 redirects for old product URLs (preserve backlinks)
      {
        source: '/features',
        destination: '/cricket-team-management',
        permanent: true,
      },
      {
        source: '/tournament',
        destination: '/cricket-tournament-management',
        permanent: true,
      },
      {
        source: '/auction',
        destination: '/cricket-player-auction',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
