import { Metadata } from 'next';
import Link from 'next/link';
import { fetchAuctionBySlug, fetchAuctionTrades } from '@/lib/server-api';
import { generateAuctionJsonLd, generateBreadcrumbJsonLd } from '@/lib/schema';
import { siteConfig, AUCTION_STATUSES, PLAYER_ROLES } from '@/lib/constants';
import {
  Users, UserCheck, IndianRupee, Calendar, Trophy, Gavel,
  ArrowRight, Clock, BarChart3, Eye, Target, ArrowLeftRight,
} from 'lucide-react';
import TeamLogo from '@/components/auction/TeamLogo';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  try {
    const res = await fetchAuctionBySlug(params.slug);
    const auction = res.data;
    const teamCount = auction.teams?.length || 0;
    const totalPlayers = auction.playerStats ? Object.values(auction.playerStats).reduce((sum: number, n: any) => sum + n, 0) : 0;

    return {
      title: `${auction.name} — Player Auction`,
      description: auction.description || `Cricket player auction with ${teamCount} teams and ${totalPlayers} players. ${auction.status === 'live' ? 'Watch live now!' : 'View details and results.'}`,
      openGraph: {
        title: `${auction.name} — Player Auction | ${siteConfig.name}`,
        description: auction.description || `${teamCount} teams, ${totalPlayers} players. Real-time cricket auction.`,
        url: `${siteConfig.url}/${params.slug}`,
        siteName: siteConfig.name,
        type: 'website',
        images: [{ url: auction.coverImage || `${siteConfig.url}/og/auction-default.jpg`, width: 1200, height: 630 }],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${auction.name} — Player Auction`,
        description: auction.description || `${teamCount} teams competing in a live cricket player auction.`,
      },
      alternates: {
        canonical: `${siteConfig.url}/${params.slug}`,
      },
    };
  } catch {
    return { title: 'Auction Not Found' };
  }
}

function formatCurrency(amount: number) {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(0)} Lakh`;
  return `₹${amount.toLocaleString('en-IN')}`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

export default async function AuctionDetailPage({ params }: { params: { slug: string } }) {
  let auction: any;
  try {
    const res = await fetchAuctionBySlug(params.slug);
    auction = res.data;
  } catch {
    return null; // Layout handles not-found
  }

  if (!auction) return null;

  // Fetch executed trades for completed auctions
  let trades: any[] = [];
  if (['completed', 'trade_window', 'finalized'].includes(auction.status)) {
    try {
      const tradesRes = await fetchAuctionTrades(params.slug);
      trades = tradesRes.data || [];
    } catch {}
  }

  const statusConfig = AUCTION_STATUSES[auction.status as keyof typeof AUCTION_STATUSES] || AUCTION_STATUSES.draft;
  const teamCount = auction.teams?.length || 0;
  const totalPlayers = auction.playerStats ? Object.values(auction.playerStats).reduce((sum: number, n: any) => sum + n, 0) : 0;
  const soldCount = auction.playerStats?.sold || 0;
  const isLive = auction.status === 'live';
  const isCompleted = ['completed', 'trade_window', 'finalized'].includes(auction.status);

  const jsonLd = generateAuctionJsonLd(auction);
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: 'Auctions', url: `${siteConfig.url}/explore` },
    { name: auction.name, url: `${siteConfig.url}/${auction.slug}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Hero section */}
        <div className="relative mb-10">
          {/* Cover image banner */}
          {auction.coverImage && (
            <div className="relative -mx-4 sm:-mx-6 -mt-8 sm:-mt-12 mb-8 h-56 sm:h-72 lg:h-80 overflow-hidden rounded-b-3xl">
              <img
                src={auction.coverImage}
                alt={auction.name}
                className="w-full h-full object-cover"
              />
              {/* Multi-layer gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/20" />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/40 via-transparent to-slate-950/40" />
              
              {/* Status badge */}
              <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
                <div className={`px-4 py-2 rounded-full backdrop-blur-xl border border-white/10 flex items-center gap-2 text-sm font-semibold ${statusConfig.bg} ${statusConfig.color}`}>
                  {isLive && <span className={`w-2 h-2 rounded-full ${statusConfig.dot}`} />}
                  {statusConfig.label}
                </div>
              </div>
            </div>
          )}

          {/* Background glow for live auctions */}
          {isLive && (
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-red-500/10 rounded-full blur-[100px] pointer-events-none" />
          )}

          <div className="relative">
            {/* Auction name + description */}
            <div className="max-w-3xl mb-8">
              {auction.description && (
                <p className="text-base sm:text-lg text-slate-300 leading-relaxed">{auction.description}</p>
              )}
              {(auction.scheduledStartTime || auction.startedAt) && (
                <div className="flex items-center gap-2 mt-4 text-sm text-slate-400">
                  <Calendar className="w-4 h-4" />
                  {auction.startedAt
                    ? `Started ${formatDate(auction.startedAt)}`
                    : `Scheduled: ${formatDate(auction.scheduledStartTime)}`
                  }
                  {auction.completedAt && (
                    <span className="ml-3">· Ended {formatDate(auction.completedAt)}</span>
                  )}
                </div>
              )}
            </div>

            {/* Stats grid - Premium compact cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard
                icon={<Users className="w-4 h-4 text-blue-400" />}
                value={String(teamCount)}
                label="Teams"
                color="blue"
                href={`/${params.slug}/teams`}
              />
              <StatCard
                icon={<UserCheck className="w-4 h-4 text-emerald-400" />}
                value={String(totalPlayers)}
                label="Players"
                sub={soldCount > 0 ? `${soldCount} sold` : undefined}
                color="emerald"
                href={`/${params.slug}/players`}
              />
              <StatCard
                icon={<IndianRupee className="w-4 h-4 text-amber-400" />}
                value={formatCurrency(auction.config.purseValue)}
                label="Team Purse"
                sub={`Base: ${formatCurrency(auction.config.basePrice)}`}
                color="amber"
              />
              <StatCard
                icon={<Target className="w-4 h-4 text-purple-400" />}
                value={`${auction.config.minSquadSize}–${auction.config.maxSquadSize}`}
                label="Squad Size"
                sub={auction.currentRound ? `Round ${auction.currentRound}` : undefined}
                color="purple"
              />
            </div>
          </div>
        </div>

        {/* Live CTA banner */}
        {isLive && (
          <Link
            href={`/${params.slug}/live`}
            className="block mb-10 group"
          >
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-500/10 via-orange-500/10 to-amber-500/10 border border-red-500/20 p-5 sm:p-6 backdrop-blur-xl">
              {/* Animated border */}
              <div className="absolute inset-0 rounded-2xl animated-border" />
              {/* Glow */}
              <div className="absolute top-0 left-1/4 w-48 h-24 bg-red-500/20 rounded-full blur-3xl" />
              
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                      <Eye className="w-6 h-6 text-red-400" />
                    </div>
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-white">Auction is LIVE</h3>
                    <p className="text-xs sm:text-sm text-slate-400">Watch real-time bidding</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 text-amber-400 font-semibold text-sm group-hover:bg-amber-500/20 transition-all">
                  <span className="hidden sm:inline">Watch Now</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* Teams overview */}
        {teamCount > 0 && (
          <section className="mb-10">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" /> Teams
              </h2>
              <Link
                href={`/${params.slug}/teams`}
                className="btn-ghost text-sm text-amber-400 hover:text-amber-300"
              >
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {auction.teams.map((team: any) => (
                <Link
                  key={team._id}
                  href={`/${params.slug}/teams`}
                  className="group relative overflow-hidden rounded-xl bg-slate-900/50 backdrop-blur-xl border border-white/[0.06] hover:border-white/15 transition-all duration-300 hover:shadow-lg"
                >
                  {/* Team color accent */}
                  <div className="h-1 w-full" style={{ background: team.primaryColor }} />
                  
                  {/* Hover glow */}
                  <div 
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-12 opacity-0 group-hover:opacity-30 blur-2xl transition-opacity pointer-events-none"
                    style={{ background: team.primaryColor }}
                  />
                  
                  <div className="relative p-3">
                    <div className="flex items-center gap-2.5 mb-2.5">
                      <TeamLogo
                        logo={team.logo}
                        name={team.name}
                        primaryColor={team.primaryColor}
                        size="sm"
                      />
                      <div className="min-w-0 flex-1">
                        <h3 className="text-xs font-bold text-white truncate group-hover:text-amber-400 transition-colors">
                          {team.name}
                        </h3>
                        <p className="text-[10px] text-slate-500">
                          {team.squadSize || 0} players
                        </p>
                      </div>
                    </div>

                    {/* Compact purse display */}
                    <div className="flex items-center justify-between text-[10px] mb-1.5">
                      <span className="text-xs font-bold text-white">{formatCurrency(team.purseRemaining)}</span>
                      <span className="text-slate-500">{Math.round(team.purseValue > 0 ? (team.purseRemaining / team.purseValue) * 100 : 100)}%</span>
                    </div>
                    <div className="h-1 bg-slate-800/80 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${team.purseValue > 0 ? (team.purseRemaining / team.purseValue) * 100 : 100}%`,
                          background: team.primaryColor,
                        }}
                      />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Player breakdown - Compact stats */}
        {totalPlayers > 0 && (
          <section className="mb-10">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <UserCheck className="w-4 h-4 text-emerald-400" /> Player Pool
            </h2>
            <div className="grid grid-cols-4 gap-2">
              {[
                { key: 'pool', label: 'Pool', color: 'text-blue-400', border: 'border-blue-500/20', bg: 'from-blue-500/10' },
                { key: 'sold', label: 'Sold', color: 'text-emerald-400', border: 'border-emerald-500/20', bg: 'from-emerald-500/10' },
                { key: 'unsold', label: 'Unsold', color: 'text-orange-400', border: 'border-orange-500/20', bg: 'from-orange-500/10' },
                { key: 'disqualified', label: 'DQ', color: 'text-red-400', border: 'border-red-500/20', bg: 'from-red-500/10' },
              ].map(item => {
                const count = auction.playerStats?.[item.key] || 0;
                const pct = totalPlayers > 0 ? Math.round((count / totalPlayers) * 100) : 0;
                return (
                  <div key={item.key} className={`relative p-3 rounded-xl bg-gradient-to-br ${item.bg} to-transparent border ${item.border} backdrop-blur-sm overflow-hidden`}>
                    <div className={`text-xl sm:text-2xl font-bold ${item.color} mb-0.5`}>{count}</div>
                    <div className="text-[10px] text-slate-400">{item.label}</div>
                    {/* Progress indicator */}
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-800">
                      <div className={`h-full ${item.color.replace('text-', 'bg-')}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Top sold players */}
        {auction.topSoldPlayers && auction.topSoldPlayers.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" /> Top Picks
              </h2>
              {isCompleted && (
                <Link
                  href={`/${params.slug}/analytics`}
                  className="btn-ghost text-sm text-amber-400 hover:text-amber-300"
                >
                  Full Analytics <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {auction.topSoldPlayers.slice(0, 6).map((player: any, idx: number) => {
                const roleConfig = PLAYER_ROLES[player.role as keyof typeof PLAYER_ROLES] || { label: player.role, icon: '🏏', color: 'text-slate-400' };
                const isTop3 = idx < 3;
                const medals = ['🥇', '🥈', '🥉'];

                return (
                  <div
                    key={player._id}
                    className={`relative overflow-hidden rounded-xl bg-slate-900/50 backdrop-blur-xl border transition-all hover:border-white/15 p-3 ${
                      isTop3 ? 'border-amber-500/20' : 'border-white/[0.06]'
                    }`}
                  >
                    {/* Top 3 glow */}
                    {isTop3 && (
                      <div className="absolute top-0 left-0 w-20 h-10 bg-amber-500/10 rounded-full blur-xl" />
                    )}
                    
                    <div className="relative flex items-center gap-3">
                      {/* Rank badge */}
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        isTop3 ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800/50 text-slate-500'
                      }`}>
                        {isTop3 ? medals[idx] : idx + 1}
                      </div>

                      {/* Player info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-semibold text-white truncate">{player.name}</span>
                          <span className={`text-[10px] ${roleConfig.color}`}>{roleConfig.icon}</span>
                        </div>
                        {player.soldTo && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <TeamLogo
                              logo={player.soldTo.logo}
                              name={player.soldTo.name}
                              primaryColor={player.soldTo.primaryColor}
                              size="xs"
                            />
                            <span className="text-[10px] text-slate-500 truncate">{player.soldTo.name}</span>
                          </div>
                        )}
                      </div>

                      {/* Amount */}
                      <div className="flex-shrink-0">
                        <div className="text-sm font-bold gradient-text-gold">
                          {formatCurrency(player.soldAmount)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Executed Trades */}
        {trades.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-5">
              <ArrowLeftRight className="w-5 h-5 text-purple-400" /> Post-Auction Trades
            </h2>
            <div className="space-y-3">
              {trades.map((trade: any) => (
                <div key={trade._id} className="glass-card p-4 sm:p-5 border border-purple-500/10">
                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Initiator team */}
                    <div className="flex items-center gap-2">
                      <TeamLogo
                        logo={trade.initiatorTeam?.logo}
                        name={trade.initiatorTeam?.name || 'Team'}
                        primaryColor={trade.initiatorTeam?.primaryColor || '#6366f1'}
                        size="sm"
                      />
                      <span className="text-sm font-semibold text-white">{trade.initiatorTeam?.name}</span>
                    </div>

                    <ArrowLeftRight className="w-4 h-4 text-purple-400 shrink-0" />

                    {/* Counterparty team */}
                    <div className="flex items-center gap-2">
                      <TeamLogo
                        logo={trade.counterpartyTeam?.logo}
                        name={trade.counterpartyTeam?.name || 'Team'}
                        primaryColor={trade.counterpartyTeam?.primaryColor || '#6366f1'}
                        size="sm"
                      />
                      <span className="text-sm font-semibold text-white">{trade.counterpartyTeam?.name}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase">Sends</span>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {trade.initiatorPlayers?.map((p: any) => (
                          <span key={p.playerId} className="px-2 py-0.5 rounded bg-red-500/10 text-red-300 text-xs">
                            {p.name}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase">Receives</span>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {trade.counterpartyPlayers?.map((p: any) => (
                          <span key={p.playerId} className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 text-xs">
                            {p.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {trade.publicAnnouncement && (
                    <p className="text-xs text-slate-400 mt-2 flex items-start gap-1.5">
                      <Gavel className="w-3 h-3 mt-0.5 shrink-0 text-emerald-400" />
                      {trade.publicAnnouncement}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Quick links */}
        <section>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <QuickLinkCard
              href={`/${params.slug}/teams`}
              icon={<Users className="w-6 h-6 text-blue-400" />}
              title="Team Squads"
              description={`View all ${teamCount} team compositions, retained players, and purse details`}
              gradient="from-blue-500/10 to-cyan-500/10"
            />
            <QuickLinkCard
              href={`/${params.slug}/players`}
              icon={<UserCheck className="w-6 h-6 text-emerald-400" />}
              title="All Players"
              description={`Browse ${totalPlayers} players — filter by sold, unsold, or in pool. Sort and view details.`}
              gradient="from-emerald-500/10 to-teal-500/10"
            />
            {isCompleted && (
              <QuickLinkCard
                href={`/${params.slug}/analytics`}
                icon={<BarChart3 className="w-6 h-6 text-emerald-400" />}
                title="Auction Analytics"
                description="Team spending, role breakdown, value picks, and premium player analysis"
                gradient="from-emerald-500/10 to-teal-500/10"
              />
            )}
            {isLive && (
              <QuickLinkCard
                href={`/${params.slug}/live`}
                icon={<Eye className="w-6 h-6 text-red-400" />}
                title="Watch Live"
                description="Real-time bidding updates, timer, and live auction feed"
                gradient="from-red-500/10 to-rose-500/10"
                pulse
              />
            )}
          </div>
        </section>
      </div>
    </>
  );
}

function StatCard({ icon, value, label, sub, color, href }: {
  icon: React.ReactNode;
  value: string;
  label: string;
  sub?: string;
  color: 'blue' | 'emerald' | 'amber' | 'purple';
  href?: string;
}) {
  const colorMap = {
    blue: { border: 'border-blue-500/20', bg: 'from-blue-500/10' },
    emerald: { border: 'border-emerald-500/20', bg: 'from-emerald-500/10' },
    amber: { border: 'border-amber-500/20', bg: 'from-amber-500/10' },
    purple: { border: 'border-purple-500/20', bg: 'from-purple-500/10' },
  };
  const c = colorMap[color];

  const content = (
    <div className="relative">
      <div className="flex items-center gap-1.5 mb-1.5">
        {icon}
        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">{label}</span>
        {href && <ArrowRight className="w-3 h-3 text-slate-600 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />}
      </div>
      <div className="text-xl sm:text-2xl font-bold text-white">{value}</div>
      {sub && <div className="text-[10px] text-slate-500 mt-0.5">{sub}</div>}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className={`relative overflow-hidden rounded-xl p-3 sm:p-4 border ${c.border} bg-gradient-to-br ${c.bg} to-transparent backdrop-blur-sm group hover:border-white/20 transition-all cursor-pointer`}>
        {content}
      </Link>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-xl p-3 sm:p-4 border ${c.border} bg-gradient-to-br ${c.bg} to-transparent backdrop-blur-sm`}>
      {content}
    </div>
  );
}

function QuickLinkCard({ href, icon, title, description, gradient, pulse }: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
  pulse?: boolean;
}) {
  return (
    <Link href={href} className="group relative overflow-hidden rounded-xl bg-slate-900/50 backdrop-blur-xl border border-white/[0.06] hover:border-white/15 p-4 transition-all">
      {/* Hover glow */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br from-amber-500/5 via-transparent to-transparent" />
      
      <div className="relative flex items-start gap-3">
        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors flex items-center gap-2">
            {title}
            {pulse && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
            )}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{description}</p>
        </div>
        <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-1" />
      </div>
    </Link>
  );
}
