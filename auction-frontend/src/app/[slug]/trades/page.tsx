import { fetchAuctionBySlug, fetchAuctionTrades } from '@/lib/server-api';
import { TradesClient } from './client';
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  try {
    const res = await fetchAuctionBySlug(params.slug);
    const auction = res.data;
    return {
      title: `Trades - ${auction.name} | CricSmart`,
      description: `View executed player trades for ${auction.name} auction on CricSmart.`,
      openGraph: {
        title: `${auction.name} - Executed Trades`,
        description: `Player trades and transfers from the ${auction.name} auction.`,
      },
    };
  } catch {
    return { title: 'Trades | CricSmart' };
  }
}

export default async function TradesPage({ params }: { params: { slug: string } }) {
  let trades: any[] = [];
  let auction: any = null;

  try {
    const [auctionRes, tradesRes] = await Promise.all([
      fetchAuctionBySlug(params.slug),
      fetchAuctionTrades(params.slug),
    ]);
    auction = auctionRes.data;
    trades = tradesRes.data || [];
  } catch {}

  const isTradeWindow = auction?.status === 'trade_window';
  const tradeWindowEndsAt = auction?.tradeWindowEndsAt;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <TradesClient
        trades={trades}
        isTradeWindow={isTradeWindow}
        tradeWindowEndsAt={tradeWindowEndsAt}
        slug={params.slug}
      />
    </div>
  );
}
