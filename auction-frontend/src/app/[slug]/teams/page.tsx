import { Metadata } from 'next';
import { fetchAuctionBySlug, fetchAuctionTeams } from '@/lib/server-api';
import { siteConfig, PLAYER_ROLES } from '@/lib/constants';
import { generateBreadcrumbJsonLd } from '@/lib/schema';
import { TeamsClient } from './client';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  try {
    const res = await fetchAuctionBySlug(params.slug);
    const auction = res.data;
    const teamCount = auction.teams?.length || 0;
    return {
      title: `Team Squads — ${auction.name}`,
      description: `View all ${teamCount} team compositions, retained players, and squad details for ${auction.name}.`,
      openGraph: {
        title: `Team Squads — ${auction.name} | ${siteConfig.name}`,
        description: `${teamCount} teams competing in ${auction.name}. View full squad compositions.`,
        url: `${siteConfig.url}/${params.slug}/teams`,
      },
      alternates: { canonical: `${siteConfig.url}/${params.slug}/teams` },
    };
  } catch {
    return { title: 'Teams' };
  }
}

export default async function TeamsPublicPage({ params }: { params: { slug: string } }) {
  let teams: any[] = [];
  let auction: any = null;
  try {
    const [teamsRes, auctionRes] = await Promise.all([
      fetchAuctionTeams(params.slug),
      fetchAuctionBySlug(params.slug),
    ]);
    teams = teamsRes.data || [];
    auction = auctionRes.data;
  } catch {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 text-center">
        <p className="text-slate-400">Unable to load teams.</p>
      </div>
    );
  }

  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: 'Auctions', url: `${siteConfig.url}/explore` },
    { name: auction.name, url: `${siteConfig.url}/${params.slug}` },
    { name: 'Teams', url: `${siteConfig.url}/${params.slug}/teams` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <TeamsClient teams={teams} auctionName={auction.name} config={auction.config} />
    </>
  );
}
