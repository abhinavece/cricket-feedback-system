import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SchemaScript from '@/components/SchemaScript';
import { generateOrganizationSchema } from '@/lib/schema';
import { siteConfig } from '@/lib/api';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const viewport: Viewport = {
  themeColor: '#020617',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: 'CricSmart - AI-Powered Cricket Team Management Platform',
    template: '%s | CricSmart',
  },
  description: 'Smart cricket team management with AI-powered payment verification, WhatsApp automation, and intelligent squad building. Free for teams up to 50 players.',
  keywords: siteConfig.keywords,
  authors: [{ name: siteConfig.name, url: siteConfig.url }],
  creator: siteConfig.name,
  publisher: siteConfig.name,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: siteConfig.url,
  },
  openGraph: {
    type: 'website',
    locale: siteConfig.locale,
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: 'CricSmart - AI-Powered Cricket Team Management',
    description: 'Smart cricket team management with AI-powered payment verification, WhatsApp automation, and intelligent squad building.',
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: 'CricSmart - AI Cricket Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CricSmart - AI-Powered Cricket Team Management',
    description: 'Smart cricket team management with AI-powered payment verification, WhatsApp automation, and intelligent squad building.',
    site: siteConfig.twitterHandle,
    creator: siteConfig.twitterHandle,
    images: [siteConfig.ogImage],
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
  category: 'sports',
  classification: 'Cricket, Sports Technology',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href={siteConfig.apiUrl} />
        
        {/* Favicons */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        
        {/* Organization Schema - Global */}
        <SchemaScript schema={generateOrganizationSchema()} />
      </head>
      <body className={`${inter.className} antialiased bg-slate-950 text-white min-h-screen flex flex-col`}>
        <Header />
        <main className="flex-1 pt-16 sm:pt-20">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
