import { Metadata } from 'next';
import { fetchAuctionBySlug, fetchAuctionAnalytics } from '@/lib/server-api';
import { siteConfig, PLAYER_ROLES } from '@/lib/constants';
import { generateBreadcrumbJsonLd } from '@/lib/schema';
import {
  Trophy, BarChart3, TrendingUp, Target, Users,
  IndianRupee, Percent, Crown, ArrowDown,
} from 'lucide-react';
import { AnalyticsCharts } from './charts';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  try {
    const res = await fetchAuctionBySlug(params.slug);
    const auction = res.data;
    return {
      title: `Auction Results — ${auction.name}`,
      description: `Post-auction analytics for ${auction.name}. Top picks, team spending breakdown, role-wise pricing, value picks, and premium player analysis.`,
      openGraph: {
        title: `Auction Results — ${auction.name} | ${siteConfig.name}`,
        description: `Complete auction analytics and results for ${auction.name}.`,
        url: `${siteConfig.url}/${params.slug}/analytics`,
      },
      alternates: { canonical: `${siteConfig.url}/${params.slug}/analytics` },
    };
  } catch {
    return { title: 'Analytics' };
  }
}

function formatCurrency(amount: number) {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  return `₹${amount.toLocaleString('en-IN')}`;
}

export default async function AnalyticsPublicPage({ params }: { params: { slug: string } }) {
  let analytics: any = null;
  let auctionName = '';
  let basePrice = 0;

  try {
    const [analyticsRes, auctionRes] = await Promise.all([
      fetchAuctionAnalytics(params.slug),
      fetchAuctionBySlug(params.slug),
    ]);
    analytics = analyticsRes.data;
    auctionName = auctionRes.data?.name || '';
    basePrice = auctionRes.data?.config?.basePrice || 0;
  } catch (err: any) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 text-center">
        <BarChart3 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-white mb-2">Analytics Not Available</h3>
        <p className="text-sm text-slate-400">
          Analytics are available after the auction is completed.
        </p>
      </div>
    );
  }

  if (!analytics) return null;

  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: 'Auctions', url: `${siteConfig.url}/explore` },
    { name: auctionName, url: `${siteConfig.url}/${params.slug}` },
    { name: 'Analytics', url: `${siteConfig.url}/${params.slug}/analytics` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Auction Analytics</h2>
          <p className="text-slate-400">Complete breakdown of {auctionName} auction results</p>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-10">
          <SummaryCard
            icon={<Trophy className="w-5 h-5 text-amber-400" />}
            value={String(analytics.totalPlayersSold || 0)}
            label="Players Sold"
            gradient="from-amber-500/20 to-orange-500/20"
          />
          <SummaryCard
            icon={<ArrowDown className="w-5 h-5 text-orange-400" />}
            value={String(analytics.totalPlayersUnsold || 0)}
            label="Unsold"
            gradient="from-orange-500/20 to-red-500/20"
          />
          <SummaryCard
            icon={<IndianRupee className="w-5 h-5 text-emerald-400" />}
            value={formatCurrency(analytics.totalSpent || 0)}
            label="Total Spent"
            gradient="from-emerald-500/20 to-teal-500/20"
          />
          <SummaryCard
            icon={<TrendingUp className="w-5 h-5 text-purple-400" />}
            value={analytics.topSoldPlayers?.[0] ? formatCurrency(analytics.topSoldPlayers[0].soldAmount) : '—'}
            label="Highest Bid"
            gradient="from-purple-500/20 to-pink-500/20"
          />
        </div>

        {/* Charts (client component) */}
        <AnalyticsCharts
          teamSpending={analytics.teamSpending || []}
          roleBreakdown={analytics.roleBreakdown || []}
          roundStats={analytics.roundStats || []}
        />

        {/* Top 10 highest sold */}
        {analytics.topSoldPlayers && analytics.topSoldPlayers.length > 0 && (
          <section className="mb-10">
            <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-5">
              <Trophy className="w-5 h-5 text-amber-400" /> Top 10 Highest Bids
            </h3>
            <div className="glass-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase w-12">#</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Player</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Role</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Team</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Amount</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Multiplier</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.topSoldPlayers.map((player: any, idx: number) => {
                      const rc = PLAYER_ROLES[player.role as keyof typeof PLAYER_ROLES] || { label: player.role, icon: '🏏', color: 'text-slate-400' };
                      const multiplier = basePrice > 0 ? (player.soldAmount / basePrice) : 0;
                      const medals = ['🥇', '🥈', '🥉'];

                      return (
                        <tr key={player._id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                          <td className="px-4 py-3">
                            {idx < 3 ? (
                              <span className="text-base">{medals[idx]}</span>
                            ) : (
                              <span className="text-slate-500 font-mono text-xs">{idx + 1}</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-medium text-white">{player.name}</span>
                            <span className="text-slate-600 text-xs ml-2">#{player.playerNumber}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-medium ${rc.color}`}>{rc.icon} {rc.label}</span>
                          </td>
                          <td className="px-4 py-3">
                            {player.soldTo ? (
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-6 h-6 rounded flex items-center justify-center text-[8px] font-bold text-white"
                                  style={{ background: player.soldTo.primaryColor }}
                                >
                                  {player.soldTo.shortName?.charAt(0)}
                                </div>
                                <span className="text-slate-300 text-xs">{player.soldTo.name}</span>
                              </div>
                            ) : (
                              <span className="text-slate-600">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="font-bold gradient-text-amber">{formatCurrency(player.soldAmount)}</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={`text-xs font-semibold ${multiplier >= 5 ? 'text-red-400' : multiplier >= 2 ? 'text-amber-400' : 'text-slate-400'}`}>
                              {multiplier > 0 ? `${multiplier.toFixed(1)}×` : '—'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* Premium Picks */}
        {analytics.premiumPicks && analytics.premiumPicks.length > 0 && (
          <section className="mb-10">
            <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-5">
              <Crown className="w-5 h-5 text-purple-400" /> Premium Picks
              <span className="text-xs text-slate-500 font-normal ml-1">Highest multiplier over base price</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {analytics.premiumPicks.map((pick: any, idx: number) => {
                const rc = PLAYER_ROLES[pick.role as keyof typeof PLAYER_ROLES] || { label: pick.role, icon: '🏏', color: 'text-slate-400' };
                return (
                  <div key={pick._id} className="glass-card p-4 border-purple-500/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-white">{pick.name}</span>
                      <span className="badge bg-purple-500/15 text-purple-400 text-[11px]">
                        {pick.multiplier}× base
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs ${rc.color}`}>{rc.icon} {rc.label}</span>
                      <span className="font-bold gradient-text-amber">{formatCurrency(pick.soldAmount)}</span>
                    </div>
                    {pick.soldTo && (
                      <div className="flex items-center gap-1.5 mt-2">
                        <div
                          className="w-4 h-4 rounded text-[7px] font-bold flex items-center justify-center text-white"
                          style={{ background: pick.soldTo.primaryColor }}
                        >
                          {pick.soldTo.shortName?.charAt(0)}
                        </div>
                        <span className="text-xs text-slate-400">{pick.soldTo.name}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Value Picks */}
        {analytics.valuePicks && analytics.valuePicks.length > 0 && (
          <section className="mb-10">
            <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-5">
              <Target className="w-5 h-5 text-emerald-400" /> Value Picks
              <span className="text-xs text-slate-500 font-normal ml-1">Bought at base price</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {analytics.valuePicks.map((pick: any) => {
                const rc = PLAYER_ROLES[pick.role as keyof typeof PLAYER_ROLES] || { label: pick.role, icon: '🏏', color: 'text-slate-400' };
                return (
                  <div key={pick._id} className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-medium text-white text-sm truncate">{pick.name}</span>
                      <span className={`text-[10px] ${rc.color} flex-shrink-0`}>{rc.icon}</span>
                    </div>
                    {pick.soldTo && (
                      <div
                        className="w-5 h-5 rounded text-[7px] font-bold flex items-center justify-center text-white flex-shrink-0"
                        style={{ background: pick.soldTo.primaryColor }}
                      >
                        {pick.soldTo.shortName?.charAt(0)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Unsold players */}
        {analytics.unsoldPlayers && analytics.unsoldPlayers.length > 0 && (
          <section className="mb-10">
            <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-5">
              <ArrowDown className="w-5 h-5 text-orange-400" /> Unsold Players
              <span className="badge bg-orange-500/15 text-orange-400 text-[11px]">{analytics.unsoldPlayers.length}</span>
            </h3>
            <div className="glass-card overflow-hidden">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/5">
                {analytics.unsoldPlayers.map((player: any) => {
                  const rc = PLAYER_ROLES[player.role as keyof typeof PLAYER_ROLES] || { label: player.role, icon: '🏏', color: 'text-slate-400' };
                  return (
                    <div key={player._id} className="p-3 bg-slate-900/50 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 font-mono">#{player.playerNumber}</span>
                        <span className="text-sm text-slate-300">{player.name}</span>
                      </div>
                      <span className={`text-xs ${rc.color}`}>{rc.icon} {rc.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}
      </div>
    </>
  );
}

function SummaryCard({ icon, value, label, gradient }: {
  icon: React.ReactNode;
  value: string;
  label: string;
  gradient: string;
}) {
  return (
    <div className={`glass-card p-4 sm:p-5 bg-gradient-to-br ${gradient}`}>
      <div className="flex items-center gap-2 mb-2">{icon}</div>
      <div className="text-2xl sm:text-3xl font-bold text-white">{value}</div>
      <div className="text-xs text-slate-400 mt-1">{label}</div>
    </div>
  );
}
