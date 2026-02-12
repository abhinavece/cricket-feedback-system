'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PLAYER_ROLES } from '@/lib/constants';
import {
  Users, IndianRupee, Shield, Crown, ChevronDown, ChevronUp,
  Wallet, UserCheck, X, ArrowUpDown,
} from 'lucide-react';

function formatCurrency(amount: number) {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function TeamsClient({ teams, auctionName, config }: {
  teams: any[];
  auctionName: string;
  config: { basePrice: number; purseValue: number; minSquadSize: number; maxSquadSize: number };
}) {
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'spent' | 'remaining' | 'squad'>('spent');

  const sortedTeams = [...teams].sort((a, b) => {
    if (sortBy === 'spent') return (b.purseValue - b.purseRemaining) - (a.purseValue - a.purseRemaining);
    if (sortBy === 'remaining') return b.purseRemaining - a.purseRemaining;
    return b.squadSize - a.squadSize;
  });

  const toggleExpand = (id: string) => {
    setExpandedTeamId(prev => prev === id ? null : id);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-400" /> Teams
          </h2>
          <p className="text-slate-400 text-sm">
            {teams.length} team{teams.length !== 1 ? 's' : ''} in {auctionName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Sort:</span>
          {(['spent', 'remaining', 'squad'] as const).map(key => (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                sortBy === key
                  ? 'bg-amber-500/15 text-amber-400 border-amber-500/20'
                  : 'bg-slate-800/30 text-slate-500 border-white/5 hover:border-white/10'
              }`}
            >
              {key === 'spent' ? 'Most Spent' : key === 'remaining' ? 'Most Purse' : 'Squad Size'}
            </button>
          ))}
        </div>
      </div>

      {teams.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">No Teams Yet</h3>
          <p className="text-sm text-slate-400">Teams haven&apos;t been set up for this auction yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedTeams.map(team => {
            const spent = team.purseValue - team.purseRemaining;
            const spentPct = team.purseValue > 0 ? (spent / team.purseValue) * 100 : 0;
            const allPlayers = [
              ...(team.retainedPlayers || []).map((p: any) => ({ ...p, isRetained: true })),
              ...(team.boughtPlayers || []).map((p: any) => ({ ...p, isRetained: false })),
            ];
            const isExpanded = expandedTeamId === team._id;
            const boughtCount = (team.boughtPlayers || []).length;
            const retainedCount = (team.retainedPlayers || []).length;
            const slotsLeft = config.maxSquadSize - allPlayers.length;

            return (
              <div key={team._id} className="glass-card overflow-hidden flex flex-col">
                {/* Team color bar */}
                <div className="h-1" style={{ background: team.primaryColor }} />

                {/* Team header - always visible */}
                <div
                  className="p-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
                  onClick={() => toggleExpand(team._id)}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold text-white shadow-lg flex-shrink-0"
                      style={{ background: team.primaryColor }}
                    >
                      {team.shortName}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-white truncate">{team.name}</h3>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500">
                        <span>{allPlayers.length} player{allPlayers.length !== 1 ? 's' : ''}</span>
                        <span>·</span>
                        <span>{slotsLeft} slot{slotsLeft !== 1 ? 's' : ''} left</span>
                      </div>
                    </div>
                    <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    </motion.div>
                  </div>

                  {/* Key stats grid */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="p-2 rounded-lg bg-slate-800/40 text-center">
                      <div className="text-xs font-bold text-white tabular-nums">{formatCurrency(spent)}</div>
                      <div className="text-[9px] text-slate-500 uppercase">Spent</div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-800/40 text-center">
                      <div className="text-xs font-bold text-emerald-400 tabular-nums">{formatCurrency(team.purseRemaining)}</div>
                      <div className="text-[9px] text-slate-500 uppercase">Remaining</div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-800/40 text-center">
                      <div className="text-xs font-bold text-amber-400 tabular-nums">{boughtCount}</div>
                      <div className="text-[9px] text-slate-500 uppercase">Bought</div>
                    </div>
                  </div>

                  {/* Purse bar */}
                  <div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${spentPct}%`, background: team.primaryColor }}
                      />
                    </div>
                    <div className="flex justify-between text-[9px] text-slate-600 mt-1">
                      <span>{Math.round(spentPct)}% utilized</span>
                      <span>{formatCurrency(team.purseValue)}</span>
                    </div>
                  </div>
                </div>

                {/* Expanded: Player list */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden border-t border-white/5"
                    >
                      <div className="p-4 space-y-1.5 max-h-80 overflow-y-auto">
                        {allPlayers.length === 0 ? (
                          <p className="text-xs text-slate-500 text-center py-3">No players in squad yet</p>
                        ) : (
                          <>
                            {/* Retained */}
                            {retainedCount > 0 && (
                              <div className="mb-2">
                                <div className="text-[10px] text-amber-400/60 font-semibold uppercase tracking-wider mb-1 flex items-center gap-1">
                                  <Shield className="w-3 h-3" /> Retained ({retainedCount})
                                </div>
                                {allPlayers.filter(p => p.isRetained).map((player: any, i: number) => (
                                  <PlayerRow key={`r-${i}`} player={player} />
                                ))}
                              </div>
                            )}

                            {/* Bought */}
                            {boughtCount > 0 && (
                              <div>
                                <div className="text-[10px] text-emerald-400/60 font-semibold uppercase tracking-wider mb-1 flex items-center gap-1">
                                  <UserCheck className="w-3 h-3" /> Purchased ({boughtCount})
                                </div>
                                {allPlayers.filter(p => !p.isRetained).sort((a: any, b: any) => (b.soldAmount || 0) - (a.soldAmount || 0)).map((player: any, i: number) => (
                                  <PlayerRow key={`b-${i}`} player={player} />
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PlayerRow({ player }: { player: any }) {
  const rc = PLAYER_ROLES[player.role as keyof typeof PLAYER_ROLES] || { label: player.role, icon: '🏏', color: 'text-slate-400' };

  return (
    <div className={`flex items-center justify-between p-2.5 rounded-lg transition-colors ${
      player.isRetained
        ? 'bg-amber-500/5 border border-amber-500/10'
        : 'bg-slate-800/20 border border-white/5'
    }`}>
      <div className="flex items-center gap-2 min-w-0">
        <span className={`text-[10px] ${rc.color}`}>{rc.icon}</span>
        <span className="text-xs font-medium text-white truncate">{player.name}</span>
        {player.isCaptain && <Crown className="w-3 h-3 text-amber-400 flex-shrink-0" />}
        {player.isRetained && (
          <span className="text-[8px] bg-amber-500/15 text-amber-400 px-1 py-0.5 rounded flex-shrink-0 font-bold">RTN</span>
        )}
      </div>
      <div className="flex-shrink-0 ml-2">
        {player.soldAmount ? (
          <span className="text-[11px] font-semibold text-emerald-400 tabular-nums">
            {formatCurrency(player.soldAmount)}
          </span>
        ) : player.playerNumber ? (
          <span className="text-[10px] text-slate-600">#{player.playerNumber}</span>
        ) : null}
      </div>
    </div>
  );
}
