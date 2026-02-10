import type { Metadata } from 'next';
import { siteConfig } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Login to CricSmart — AI-Powered Cricket Platform',
  description: 'Sign in to CricSmart with Google. Access AI-powered team management, tournament hub, cricket auctions, and more. Free for all cricket teams.',
  keywords: [
    'cricsmart login',
    'cricket app login',
    'cricsmart sign in',
    'cricket team management login',
    'cricket tournament login',
    'cricket auction login',
  ],
  alternates: {
    canonical: `${siteConfig.url}/auth/login`,
  },
  openGraph: {
    title: 'Login to CricSmart — AI-Powered Cricket Platform',
    description: 'Sign in to access AI-powered team management, tournament hub, cricket auctions, and more.',
    url: `${siteConfig.url}/auth/login`,
    type: 'website',
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: 'CricSmart Login',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Login to CricSmart — AI Cricket Platform',
    description: 'Sign in to access AI-powered team management, tournaments, and more.',
    images: [siteConfig.ogImage],
  },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Minimal layout: no Header/Footer for clean focused auth experience
  return (
    <div className="-mt-16 sm:-mt-20">
      {children}
    </div>
  );
}
