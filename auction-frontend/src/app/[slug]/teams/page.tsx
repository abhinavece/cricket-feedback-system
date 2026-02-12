import { Metadata } from 'next';
import { fetchAuctionBySlug, fetchAuctionTeams } from '@/lib/server-api';
import { siteConfig, PLAYER_ROLES } from '@/lib/constants';
import { generateBreadcrumbJsonLd } from '@/lib/schema';
import { Users, IndianRupee, Shield, Crown } from 'lucide-react';

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

function formatCurrency(amount: number) {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  return `₹${amount.toLocaleString('en-IN')}`;
}

export default async function TeamsPublicPage({ params }: { params: { slug: string } }) {
  let teams: any[] = [];
  let auctionName = '';
  try {
    const [teamsRes, auctionRes] = await Promise.all([
      fetchAuctionTeams(params.slug),
      fetchAuctionBySlug(params.slug),
    ]);
    teams = teamsRes.data || [];
    auctionName = auctionRes.data?.name || '';
  } catch {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 text-center">
        <p className="text-slate-400">Unable to load teams.</p>
      </div>
    );
  }

  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: 'Auctions', url: `${siteConfig.url}/explore` },
    { name: auctionName, url: `${siteConfig.url}/${params.slug}` },
    { name: 'Teams', url: `${siteConfig.url}/${params.slug}/teams` },
  ]);

  // Sort teams by spent (descending)
  const sortedTeams = [...teams].sort((a, b) => {
    const aSpent = a.purseValue - a.purseRemaining;
    const bSpent = b.purseValue - b.purseRemaining;
    return bSpent - aSpent;
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Team Squads</h2>
          <p className="text-slate-400">
            {teams.length} team{teams.length !== 1 ? 's' : ''} · Full squad compositions and retained players
          </p>
        </div>

        {teams.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">No Teams Yet</h3>
            <p className="text-sm text-slate-400">Teams haven&apos;t been set up for this auction yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedTeams.map((team) => {
              const spent = team.purseValue - team.purseRemaining;
              const spentPct = team.purseValue > 0 ? (spent / team.purseValue) * 100 : 0;
              const allPlayers = [
                ...(team.retainedPlayers || []).map((p: any) => ({ ...p, isRetained: true })),
                ...(team.boughtPlayers || []).map((p: any) => ({ ...p, isRetained: false })),
              ];
              const roleGroups: Record<string, any[]> = {};
              allPlayers.forEach(p => {
                const role = p.role || 'unknown';
                if (!roleGroups[role]) roleGroups[role] = [];
                roleGroups[role].push(p);
              });

              return (
                <div key={team._id} className="glass-card overflow-hidden">
                  {/* Team color bar */}
                  <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${team.primaryColor}, ${team.secondaryColor || team.primaryColor}88)` }} />

                  <div className="p-5 sm:p-6">
                    {/* Team header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                      <div className="flex items-center gap-4">
                        <div
                          className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold text-white shadow-xl flex-shrink-0"
                          style={{ background: team.primaryColor }}
                        >
                          {team.shortName}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white">{team.name}</h3>
                          <p className="text-sm text-slate-400">
                            {allPlayers.length} player{allPlayers.length !== 1 ? 's' : ''} in squad
                          </p>
                        </div>
                      </div>

                      {/* Purse stats */}
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <div className="text-lg font-bold text-white">{formatCurrency(spent)}</div>
                          <div className="text-[10px] text-slate-500 uppercase tracking-wider">Spent</div>
                        </div>
                        <div className="w-px h-8 bg-white/10" />
                        <div className="text-center">
                          <div className="text-lg font-bold text-emerald-400">{formatCurrency(team.purseRemaining)}</div>
                          <div className="text-[10px] text-slate-500 uppercase tracking-wider">Remaining</div>
                        </div>
                      </div>
                    </div>

                    {/* Purse progress */}
                    <div className="mb-6">
                      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700 relative"
                          style={{ width: `${spentPct}%`, background: team.primaryColor }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20 rounded-full" />
                        </div>
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500 mt-1.5">
                        <span>{Math.round(spentPct)}% utilized</span>
                        <span>Total: {formatCurrency(team.purseValue)}</span>
                      </div>
                    </div>

                    {/* Players by role */}
                    {allPlayers.length === 0 ? (
                      <p className="text-sm text-slate-500 text-center py-4">No players in squad yet</p>
                    ) : (
                      <div className="space-y-4">
                        {Object.entries(roleGroups).map(([role, players]) => {
                          const rc = PLAYER_ROLES[role as keyof typeof PLAYER_ROLES] || { label: role, icon: '🏏', color: 'text-slate-400' };
                          return (
                            <div key={role}>
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`text-sm font-semibold ${rc.color}`}>
                                  {rc.icon} {rc.label}
                                </span>
                                <span className="text-xs text-slate-600">({players.length})</span>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                {players.map((player: any, i: number) => (
                                  <div
                                    key={player._id || i}
                                    className={`flex items-center justify-between p-3 rounded-xl transition-colors ${
                                      player.isRetained
                                        ? 'bg-amber-500/5 border border-amber-500/10'
                                        : 'bg-slate-800/30 border border-white/5'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      {player.isCaptain && <Crown className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />}
                                      <span className="text-sm font-medium text-white truncate">{player.name}</span>
                                      {player.isRetained && (
                                        <span className="badge text-[9px] bg-amber-500/15 text-amber-400 px-1.5 py-0.5 flex-shrink-0">
                                          <Shield className="w-2.5 h-2.5" /> RTN
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex-shrink-0 ml-2">
                                      {player.soldAmount ? (
                                        <span className="text-xs font-semibold text-emerald-400">
                                          {formatCurrency(player.soldAmount)}
                                        </span>
                                      ) : player.playerNumber ? (
                                        <span className="text-xs text-slate-500">#{player.playerNumber}</span>
                                      ) : null}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
