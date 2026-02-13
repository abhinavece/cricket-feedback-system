import { Metadata } from 'next';
import { fetchAuctionBySlug, fetchAuctionPlayers } from '@/lib/server-api';
import { siteConfig } from '@/lib/constants';
import { generateBreadcrumbJsonLd } from '@/lib/schema';
import { PlayersClient } from './client';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  try {
    const res = await fetchAuctionBySlug(params.slug);
    const auction = res.data;
    return {
      title: `Players — ${auction.name}`,
      description: `View all players in ${auction.name}. Filter by status — sold, unsold, or in pool. Sort by custom fields.`,
      openGraph: {
        title: `Players — ${auction.name} | ${siteConfig.name}`,
        url: `${siteConfig.url}/${params.slug}/players`,
      },
      alternates: { canonical: `${siteConfig.url}/${params.slug}/players` },
    };
  } catch {
    return { title: 'Players' };
  }
}

export default async function PlayersPublicPage({ params }: { params: { slug: string } }) {
  let auction: any = null;
  let players: any[] = [];
  let displayConfig: any = null;

  try {
    const [auctionRes, playersRes] = await Promise.all([
      fetchAuctionBySlug(params.slug),
      fetchAuctionPlayers(params.slug, { limit: 200 }),
    ]);
    auction = auctionRes.data;
    players = playersRes.data || [];
  } catch {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 text-center">
        <p className="text-slate-400">Unable to load players.</p>
      </div>
    );
  }

  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: 'Auctions', url: `${siteConfig.url}/explore` },
    { name: auction.name, url: `${siteConfig.url}/${params.slug}` },
    { name: 'Players', url: `${siteConfig.url}/${params.slug}/players` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <PlayersClient
        players={players}
        auctionName={auction.name}
        slug={params.slug}
        config={auction.config}
        playerFields={auction.playerFields || []}
      />
    </>
  );
}
