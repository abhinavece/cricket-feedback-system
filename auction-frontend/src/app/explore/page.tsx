import Link from 'next/link';
import { Search, Users, UserCheck, Calendar, Gavel, ArrowRight } from 'lucide-react';
import { getPublicAuctions } from '@/lib/api';
import { AUCTION_STATUSES } from '@/lib/constants';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Explore Auctions',
  description: 'Browse live and upcoming cricket player auctions. Watch real-time bidding, view team squads, and explore completed auction analytics.',
};

export const revalidate = 60;

interface AuctionSummary {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  status: string;
  config: { basePrice: number; purseValue: number };
  scheduledStartTime?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  teamCount: number;
  playerCount: number;
}

async function fetchAuctions(): Promise<{ data: AuctionSummary[]; total: number }> {
  try {
    const res = await getPublicAuctions(1, 50);
    return { data: res.data || [], total: res.pagination?.total || 0 };
  } catch {
    return { data: [], total: 0 };
  }
}

function formatCurrency(amount: number) {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(0)}L`;
  return `₹${amount.toLocaleString('en-IN')}`;
}

export default async function ExplorePage() {
  const { data: auctions, total } = await fetchAuctions();

  const liveAuctions = auctions.filter(a => a.status === 'live');
  const upcomingAuctions = auctions.filter(a => ['configured', 'paused'].includes(a.status));
  const completedAuctions = auctions.filter(a => ['completed', 'trade_window', 'finalized'].includes(a.status));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Explore Auctions</h1>
          <p className="text-slate-400">
            {total > 0 ? `${total} auction${total !== 1 ? 's' : ''} available` : 'No auctions available yet'}
          </p>
        </div>
      </div>

      {auctions.length === 0 ? (
        <div className="glass-card p-12 sm:p-16 text-center max-w-xl mx-auto">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center mx-auto mb-6">
            <Search className="w-10 h-10 text-slate-500" />
          </div>
          <h2 className="text-xl font-bold text-white mb-3">No Auctions Yet</h2>
          <p className="text-slate-400 mb-8 leading-relaxed">
            Be the first to create an auction! Once auctions are created and configured, they&apos;ll appear here for everyone to see.
          </p>
          <Link href="/admin/create" className="btn-primary">
            <Gavel className="w-5 h-5" /> Create First Auction
          </Link>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Live Auctions */}
          {liveAuctions.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                <h2 className="text-xl font-bold text-white">Live Now</h2>
                <span className="badge bg-red-500/20 text-red-400">{liveAuctions.length}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {liveAuctions.map(auction => (
                  <AuctionCard key={auction._id} auction={auction} />
                ))}
              </div>
            </section>
          )}

          {/* Upcoming */}
          {upcomingAuctions.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-5">
                <h2 className="text-xl font-bold text-white">Upcoming</h2>
                <span className="badge bg-blue-500/20 text-blue-400">{upcomingAuctions.length}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {upcomingAuctions.map(auction => (
                  <AuctionCard key={auction._id} auction={auction} />
                ))}
              </div>
            </section>
          )}

          {/* Completed */}
          {completedAuctions.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-5">
                <h2 className="text-xl font-bold text-white">Completed</h2>
                <span className="badge bg-emerald-500/20 text-emerald-400">{completedAuctions.length}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {completedAuctions.map(auction => (
                  <AuctionCard key={auction._id} auction={auction} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function AuctionCard({ auction }: { auction: AuctionSummary }) {
  const statusConfig = AUCTION_STATUSES[auction.status as keyof typeof AUCTION_STATUSES] || AUCTION_STATUSES.draft;
  const isLive = auction.status === 'live';

  return (
    <Link
      href={`/${auction.slug}`}
      className={`glass-card-hover p-5 sm:p-6 group block ${isLive ? 'animated-border' : ''}`}
    >
      {/* Status */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${statusConfig.dot}`} />
          <span className={`text-xs font-semibold uppercase tracking-wider ${statusConfig.color}`}>
            {statusConfig.label}
          </span>
        </div>
        <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
      </div>

      {/* Name */}
      <h3 className="text-lg font-bold text-white mb-2 group-hover:text-amber-400 transition-colors line-clamp-2">
        {auction.name}
      </h3>

      {auction.description && (
        <p className="text-sm text-slate-400 mb-4 line-clamp-2">{auction.description}</p>
      )}

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm text-slate-400 mb-3">
        <span className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" /> {auction.teamCount} teams
        </span>
        <span className="flex items-center gap-1.5">
          <UserCheck className="w-3.5 h-3.5" /> {auction.playerCount} players
        </span>
      </div>

      {/* Purse */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">Purse: {formatCurrency(auction.config.purseValue)}</span>
        <span className="text-xs text-slate-500 flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {auction.startedAt
            ? new Date(auction.startedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
            : auction.scheduledStartTime
              ? new Date(auction.scheduledStartTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
              : new Date(auction.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
          }
        </span>
      </div>
    </Link>
  );
}
