import { Metadata } from 'next';
import SchemaScript from '@/components/SchemaScript';
import { generateWebPageSchema } from '@/lib/schema';
import { siteConfig } from '@/lib/api';
import AuctionClient from './AuctionClient';

export const metadata: Metadata = {
  title: 'Cricket Player Auction - AI-Powered IPL-Style Auction Platform',
  description: 'Run professional cricket player auctions with AI-powered player valuation, live bidding, budget management, and real-time analytics. Free for small auctions.',
  keywords: [
    'cricket player auction',
    'IPL auction',
    'cricket auction app',
    'player auction software',
    'live cricket auction',
    'cricket bidding platform',
    'fantasy cricket auction',
    'local cricket league auction',
  ],
  alternates: {
    canonical: `${siteConfig.url}/auction`,
  },
  openGraph: {
    title: 'Cricket Player Auction - IPL-Style Live Bidding | CricSmart',
    description: 'AI-powered cricket player auction matching international standards. Live bidding, smart valuations, budget management.',
    url: `${siteConfig.url}/auction`,
    type: 'website',
    images: [{ url: siteConfig.ogImage, width: 1200, height: 630, alt: 'CricSmart Player Auction' }],
  },
};

export default function AuctionPage() {
  const webPageSchema = generateWebPageSchema({
    name: 'Cricket Player Auction - AI-Powered Auction Management',
    description: 'AI-powered cricket player auction management matching international standards. Live bidding, player valuation, budget management.',
    url: `${siteConfig.url}/auction`,
    breadcrumb: [{ name: 'Auction', url: `${siteConfig.url}/auction` }],
  });

  return (
    <>
      <SchemaScript schema={webPageSchema} />
      <AuctionClient />
    </>
  );
}
