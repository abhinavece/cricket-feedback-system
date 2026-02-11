import { siteConfig } from './constants';

export function generateAuctionEventSchema(auction: {
  name: string;
  slug: string;
  description?: string;
  status: string;
  scheduledStartTime?: string;
  startedAt?: string;
  completedAt?: string;
  teamCount?: number;
  playerCount?: number;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: `${auction.name} — Player Auction`,
    description: auction.description || `Live cricket player auction: ${auction.name}`,
    url: `${siteConfig.url}/${auction.slug}`,
    eventStatus: auction.status === 'completed' || auction.status === 'finalized'
      ? 'https://schema.org/EventCompleted'
      : auction.status === 'live'
        ? 'https://schema.org/EventMovedOnline'
        : 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
    startDate: auction.scheduledStartTime || auction.startedAt,
    endDate: auction.completedAt,
    organizer: {
      '@type': 'Organization',
      name: 'CricSmart',
      url: siteConfig.seoUrl,
    },
    location: {
      '@type': 'VirtualLocation',
      url: `${siteConfig.url}/${auction.slug}/live`,
    },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
    },
  };
}

export function generateWebsiteSchema() {
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
    },
  };
}

export function SchemaScript({ schema }: { schema: Record<string, any> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
