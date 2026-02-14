import { Metadata } from 'next';
import SchemaScript from '@/components/SchemaScript';
import { generateWebPageSchema } from '@/lib/schema';
import { siteConfig } from '@/lib/api';
import AuctionFeaturesClient from './AuctionFeaturesClient';

export const metadata: Metadata = {
  title: 'Cricket Player Auction Platform - IPL-Style Live Bidding',
  description: 'Professional cricket player auctions with real-time bidding, post-auction trading window, broadcast view for streaming, and comprehensive analytics. Free for small auctions.',
  keywords: [
    'cricket player auction',
    'IPL auction app',
    'cricket auction software',
    'live cricket bidding',
    'fantasy cricket auction',
    'cricket auction platform',
    'player auction system',
    'cricket bidding app',
    'local league auction',
  ],
  alternates: {
    canonical: `${siteConfig.url}/cricket-player-auction`,
  },
  openGraph: {
    title: 'CricSmart Auction - IPL-Style Cricket Player Auctions',
    description: 'Professional cricket player auctions with real-time WebSocket bidding, post-auction trading, broadcast view for YouTube, and comprehensive analytics.',
    url: `${siteConfig.url}/cricket-player-auction`,
    type: 'website',
    images: [{ url: siteConfig.ogImage, width: 1200, height: 630, alt: 'CricSmart Auction' }],
  },
};

export default function CricketPlayerAuctionPage() {
  const webPageSchema = generateWebPageSchema({
    name: 'CricSmart Auction - IPL-Style Cricket Player Auctions',
    description: 'Professional cricket player auctions with real-time bidding, post-auction trading, broadcast view, and comprehensive analytics.',
    url: `${siteConfig.url}/cricket-player-auction`,
    breadcrumb: [{ name: 'CricSmart Auction', url: `${siteConfig.url}/cricket-player-auction` }],
  });

  return (
    <>
      <SchemaScript schema={webPageSchema} />
      <AuctionFeaturesClient />
    </>
  );
}
