import { Metadata } from 'next';
import { fetchAuctionBySlug } from '@/lib/server-api';
import { siteConfig } from '@/lib/constants';
import { SpectatorLiveView } from './client';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  try {
    const res = await fetchAuctionBySlug(params.slug);
    const auction = res.data;
    return {
      title: `Live — ${auction.name}`,
      description: `Watch ${auction.name} live. Real-time bidding, player reveals, and team squad updates.`,
      openGraph: {
        title: `Watch Live — ${auction.name} | ${siteConfig.name}`,
        description: `Live cricket player auction. Watch the bidding action in real-time.`,
        url: `${siteConfig.url}/${params.slug}/live`,
      },
      alternates: { canonical: `${siteConfig.url}/${params.slug}/live` },
    };
  } catch {
    return { title: 'Live Auction' };
  }
}

export default async function LivePage({ params }: { params: { slug: string } }) {
  let auctionId = '';
  let auctionName = '';
  try {
    const res = await fetchAuctionBySlug(params.slug);
    auctionId = res.data?._id || '';
    auctionName = res.data?.name || '';
  } catch {}

  if (!auctionId) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 text-center">
        <p className="text-slate-400">Auction not found.</p>
      </div>
    );
  }

  return <SpectatorLiveView auctionId={auctionId} slug={params.slug} />;
}
