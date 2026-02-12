/**
 * JSON-LD Structured Data generators for SEO pages.
 * Uses Schema.org Event type for auction pages.
 */

import { siteConfig } from './constants';

export function SchemaScript({ schema }: { schema: Record<string, any> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface AuctionData {
  name: string;
  slug: string;
  description?: string;
  status: string;
  scheduledStartTime?: string;
  startedAt?: string;
  completedAt?: string;
  teams?: { name: string }[];
  playerStats?: Record<string, number>;
  config?: { purseValue?: number; basePrice?: number };
}

export function generateAuctionJsonLd(auction: AuctionData) {
  const url = `${siteConfig.url}/${auction.slug}`;
  const totalPlayers = auction.playerStats
    ? Object.values(auction.playerStats).reduce((sum, n) => sum + n, 0)
    : 0;
  const teamCount = auction.teams?.length || 0;

  const statusMap: Record<string, string> = {
    configured: 'https://schema.org/EventScheduled',
    live: 'https://schema.org/EventScheduled',
    paused: 'https://schema.org/EventPostponed',
    completed: 'https://schema.org/EventCompleted',
    trade_window: 'https://schema.org/EventCompleted',
    finalized: 'https://schema.org/EventCompleted',
  };

  const jsonLd: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: `${auction.name} — Player Auction`,
    description: auction.description || `Live cricket player auction: ${teamCount} teams, ${totalPlayers} players.`,
    url,
    eventStatus: statusMap[auction.status] || 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
    organizer: {
      '@type': 'Organization',
      name: 'CricSmart',
      url: siteConfig.seoUrl,
    },
    location: {
      '@type': 'VirtualLocation',
      url: `${url}/live`,
    },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
    },
    image: `${siteConfig.url}/og/auction-default.jpg`,
  };

  if (auction.scheduledStartTime || auction.startedAt) {
    jsonLd.startDate = auction.startedAt || auction.scheduledStartTime;
  }
  if (auction.completedAt) {
    jsonLd.endDate = auction.completedAt;
  }

  return jsonLd;
}

export function generateBreadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export const generateWebsiteSchema = generateWebsiteJsonLd;

export function generateWebsiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    publisher: {
      '@type': 'Organization',
      name: 'CricSmart',
      url: siteConfig.seoUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${siteConfig.url}/cricsmart-logo-512.png`,
      },
    },
  };
}
