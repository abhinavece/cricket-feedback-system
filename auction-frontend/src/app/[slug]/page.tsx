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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
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

            {/* Stats grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <StatCard
                icon={<Users className="w-5 h-5 text-blue-400" />}
                value={String(teamCount)}
                label="Teams"
                gradient="from-blue-500/20 to-cyan-500/20"
                border="border-blue-500/20"
                href={`/${params.slug}/teams`}
              />
              <StatCard
                icon={<UserCheck className="w-5 h-5 text-emerald-400" />}
                value={String(totalPlayers)}
                label="Players"
                sub={soldCount > 0 ? `${soldCount} sold` : undefined}
                gradient="from-emerald-500/20 to-teal-500/20"
                border="border-emerald-500/20"
                href={`/${params.slug}/players`}
              />
              <StatCard
                icon={<IndianRupee className="w-5 h-5 text-amber-400" />}
                value={formatCurrency(auction.config.purseValue)}
                label="Team Purse"
                sub={`Base: ${formatCurrency(auction.config.basePrice)}`}
                gradient="from-amber-500/20 to-orange-500/20"
                border="border-amber-500/20"
              />
              <StatCard
                icon={<Target className="w-5 h-5 text-purple-400" />}
                value={`${auction.config.minSquadSize}–${auction.config.maxSquadSize}`}
                label="Squad Size"
                sub={auction.currentRound ? `Round ${auction.currentRound}` : undefined}
                gradient="from-purple-500/20 to-pink-500/20"
                border="border-purple-500/20"
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
            <div className="glass-card p-6 sm:p-8 animated-border overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 via-orange-500/5 to-amber-500/5" />
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-red-500/20 flex items-center justify-center">
                    <Eye className="w-7 h-7 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-white">Auction is LIVE</h3>
                    <p className="text-sm text-slate-400">Watch the bidding action in real-time</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-amber-400 font-semibold group-hover:translate-x-1 transition-transform">
                  <span className="hidden sm:inline">Watch Now</span>
                  <ArrowRight className="w-5 h-5" />
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {auction.teams.map((team: any) => (
                <Link
                  key={team._id}
                  href={`/${params.slug}/teams`}
                  className="group relative overflow-hidden rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/5 hover:border-white/15 transition-all duration-300 hover:shadow-xl hover:shadow-black/20"
                >
                  {/* Gradient top bar */}
                  <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${team.primaryColor}, ${team.primaryColor}88)` }} />
                  
                  {/* Subtle glow effect */}
                  <div 
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-16 opacity-20 blur-2xl pointer-events-none"
                    style={{ background: team.primaryColor }}
                  />
                  
                  <div className="relative p-5">
                    <div className="flex items-center gap-4 mb-4">
                      <TeamLogo
                        logo={team.logo}
                        name={team.name}
                        primaryColor={team.primaryColor}
                        size="md"
                      />
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-bold text-white truncate group-hover:text-amber-400 transition-colors">
                          {team.name}
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {team.squadSize || 0} player{(team.squadSize || 0) !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>

                    {/* Purse section */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-baseline">
                        <span className="text-base font-bold text-white">{formatCurrency(team.purseRemaining)}</span>
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider">remaining</span>
                      </div>
                      <div className="h-2 bg-slate-800/80 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${team.purseValue > 0 ? (team.purseRemaining / team.purseValue) * 100 : 100}%`,
                            background: `linear-gradient(90deg, ${team.primaryColor}, ${team.primaryColor}cc)`,
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-600">
                        <span>{Math.round(team.purseValue > 0 ? (team.purseRemaining / team.purseValue) * 100 : 100)}% left</span>
                        <span>of {formatCurrency(team.purseValue)}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Player breakdown */}
        {totalPlayers > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-5">
              <UserCheck className="w-5 h-5 text-emerald-400" /> Player Pool
            </h2>
            <div className="glass-card p-5 sm:p-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { key: 'pool', label: 'In Pool', color: 'text-blue-400', bg: 'bg-blue-500/10', icon: '🎯' },
                  { key: 'sold', label: 'Sold', color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: '✅' },
                  { key: 'unsold', label: 'Unsold', color: 'text-orange-400', bg: 'bg-orange-500/10', icon: '↩️' },
                  { key: 'disqualified', label: 'Disqualified', color: 'text-red-400', bg: 'bg-red-500/10', icon: '❌' },
                ].map(item => {
                  const count = auction.playerStats?.[item.key] || 0;
                  const pct = totalPlayers > 0 ? Math.round((count / totalPlayers) * 100) : 0;
                  return (
                    <div key={item.key} className={`relative p-4 rounded-xl ${item.bg} overflow-hidden`}>
                      <div className="relative">
                        <div className={`text-3xl font-bold ${item.color} mb-1`}>{count}</div>
                        <div className="text-xs text-slate-400">{item.label}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{pct}%</div>
                      </div>
                      {/* Background progress fill */}
                      <div
                        className="absolute bottom-0 left-0 h-1 rounded-full opacity-50"
                        style={{
                          width: `${pct}%`,
                          background: `var(--tw-gradient-from, currentColor)`,
                        }}
                      />
                    </div>
                  );
                })}
              </div>
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

            <div className="space-y-2">
              {auction.topSoldPlayers.slice(0, 5).map((player: any, idx: number) => {
                const roleConfig = PLAYER_ROLES[player.role as keyof typeof PLAYER_ROLES] || { label: player.role, icon: '🏏', color: 'text-slate-400' };
                const isTop3 = idx < 3;
                const medals = ['🥇', '🥈', '🥉'];

                return (
                  <div
                    key={player._id}
                    className={`glass-card p-4 flex items-center gap-4 ${isTop3 ? 'border-amber-500/10' : ''}`}
                  >
                    {/* Rank */}
                    <div className="w-8 text-center flex-shrink-0">
                      {isTop3 ? (
                        <span className="text-lg">{medals[idx]}</span>
                      ) : (
                        <span className="text-sm font-bold text-slate-500">#{idx + 1}</span>
                      )}
                    </div>

                    {/* Player info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white truncate">{player.name}</span>
                        <span className={`text-xs ${roleConfig.color}`}>{roleConfig.icon} {roleConfig.label}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        #{player.playerNumber} · Round {player.soldInRound || 1}
                      </div>
                    </div>

                    {/* Sold to */}
                    {player.soldTo && (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <TeamLogo
                          logo={player.soldTo.logo}
                          name={player.soldTo.name}
                          primaryColor={player.soldTo.primaryColor}
                          size="xs"
                        />
                        <span className="text-xs text-slate-400 hidden sm:inline">{player.soldTo.name}</span>
                      </div>
                    )}

                    {/* Amount */}
                    <div className="flex-shrink-0 text-right">
                      <div className="font-bold gradient-text-amber text-base sm:text-lg">
                        {formatCurrency(player.soldAmount)}
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

function StatCard({ icon, value, label, sub, gradient, border, href }: {
  icon: React.ReactNode;
  value: string;
  label: string;
  sub?: string;
  gradient: string;
  border: string;
  href?: string;
}) {
  const content = (
    <>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">{label}</span>
        {href && <ArrowRight className="w-3 h-3 text-slate-600 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />}
      </div>
      <div className="text-2xl sm:text-3xl font-bold text-white">{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={`glass-card p-4 sm:p-5 border ${border} bg-gradient-to-br ${gradient} group hover:border-white/20 transition-all cursor-pointer`}>
        {content}
      </Link>
    );
  }

  return (
    <div className={`glass-card p-4 sm:p-5 border ${border} bg-gradient-to-br ${gradient}`}>
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
    <Link href={href} className="glass-card-hover p-5 sm:p-6 group block">
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <h3 className="text-base font-bold text-white mb-1 group-hover:text-amber-400 transition-colors flex items-center gap-2">
        {title}
        {pulse && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
      </h3>
      <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
      <div className="flex items-center gap-1 mt-3 text-sm text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity">
        View <ArrowRight className="w-3.5 h-3.5" />
      </div>
    </Link>
  );
}
