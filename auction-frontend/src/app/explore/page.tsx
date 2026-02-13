import Link from 'next/link';
import { Search, Users, UserCheck, Calendar, Gavel, ArrowRight, Sparkles, Radio, Trophy, Clock } from 'lucide-react';
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
  coverImage?: string;
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
    <div className="relative min-h-screen bg-mesh-gradient">
      {/* Noise overlay */}
      <div className="noise-overlay" />
      
      {/* Floating orbs */}
      <div className="floating-orb floating-orb-amber w-[400px] h-[400px] top-[5%] right-[10%]" style={{ animationDelay: '0s' }} />
      <div className="floating-orb floating-orb-purple w-[300px] h-[300px] top-[40%] left-[5%]" style={{ animationDelay: '7s' }} />
      <div className="floating-orb floating-orb-cyan w-[350px] h-[350px] bottom-[10%] right-[20%]" style={{ animationDelay: '14s' }} />
      
      {/* Grid pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-20" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {/* Header */}
        <div className="text-center mb-16 animate-slide-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 mb-6 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-medium text-amber-300">Discover Auctions</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4">
            Explore <span className="text-shimmer">Auctions</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            {total > 0 
              ? `Browse ${total} auction${total !== 1 ? 's' : ''} — watch live bidding, view results, and discover upcoming events`
              : 'No auctions available yet. Be the first to create one!'
            }
          </p>
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
    </div>
  );
}

function AuctionCard({ auction }: { auction: AuctionSummary }) {
  const statusConfig = AUCTION_STATUSES[auction.status as keyof typeof AUCTION_STATUSES] || AUCTION_STATUSES.draft;
  const isLive = auction.status === 'live';
  const isCompleted = ['completed', 'trade_window', 'finalized'].includes(auction.status);

  return (
    <Link
      href={`/${auction.slug}`}
      className="group relative block overflow-hidden"
    >
      {/* Card with premium styling */}
      <div className={`relative h-full rounded-2xl bg-slate-900/70 backdrop-blur-xl border transition-all duration-500 ${
        isLive 
          ? 'border-red-500/30 shadow-lg shadow-red-500/10' 
          : 'border-white/[0.06] hover:border-amber-500/20'
      } group-hover:shadow-xl group-hover:shadow-amber-500/5`}>
        
        {/* Animated border for live */}
        {isLive && <div className="absolute inset-0 rounded-2xl animated-border" />}
        
        {/* Hover glow effect */}
        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-br from-amber-500/5 via-transparent to-purple-500/5" />
        
        {/* Content */}
        <div className="relative p-6">
          {/* Status badge */}
          <div className="flex items-center justify-between mb-4">
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${statusConfig.bg} border border-white/5`}>
              {isLive && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                </span>
              )}
              {!isLive && <div className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />}
              <span className={`text-xs font-semibold uppercase tracking-wider ${statusConfig.color}`}>
                {statusConfig.label}
              </span>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-800/50 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
            </div>
          </div>

          {/* Name */}
          <h3 className="text-xl font-bold text-white mb-2 group-hover:text-amber-400 transition-colors line-clamp-2">
            {auction.name}
          </h3>

          {auction.description && (
            <p className="text-sm text-slate-400 mb-5 line-clamp-2 leading-relaxed">{auction.description}</p>
          )}

          {/* Stats row */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/50 text-sm text-slate-300">
              <Users className="w-3.5 h-3.5 text-blue-400" /> {auction.teamCount}
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/50 text-sm text-slate-300">
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" /> {auction.playerCount}
            </div>
            {isCompleted && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-sm text-emerald-400">
                <Trophy className="w-3.5 h-3.5" /> Results
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-white/5">
            <span className="text-sm font-medium text-amber-400">{formatCurrency(auction.config.purseValue)}</span>
            <span className="text-xs text-slate-500 flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              {auction.startedAt
                ? new Date(auction.startedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                : auction.scheduledStartTime
                  ? new Date(auction.scheduledStartTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                  : new Date(auction.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
              }
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
