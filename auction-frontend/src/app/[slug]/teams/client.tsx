'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PLAYER_ROLES } from '@/lib/constants';
import PlayerDetailModal from '@/components/auction/PlayerDetailModal';
import {
  Users, Shield, Crown, UserCheck, X, TrendingUp, Wallet,
  IndianRupee, BarChart3,
} from 'lucide-react';

interface PlayerField {
  key: string;
  label: string;
  type: string;
  showOnCard: boolean;
  showInList: boolean;
  sortable: boolean;
  order: number;
}

function formatCurrency(amount: number) {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function TeamsClient({ teams, auctionName, config, playerFields = [] }: {
  teams: any[];
  auctionName: string;
  config: { basePrice: number; purseValue: number; minSquadSize: number; maxSquadSize: number };
  playerFields?: PlayerField[];
}) {
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [sortBy, setSortBy] = useState<'spent' | 'remaining' | 'squad'>('spent');

  const sortedTeams = [...teams].sort((a, b) => {
    if (sortBy === 'spent') return (b.purseValue - b.purseRemaining) - (a.purseValue - a.purseRemaining);
    if (sortBy === 'remaining') return b.purseRemaining - a.purseRemaining;
    return b.squadSize - a.squadSize;
  });

  const fieldLabelMap = useMemo(() => {
    const map: Record<string, string> = {};
    playerFields.forEach(f => { map[f.key] = f.label; });
    return map;
  }, [playerFields]);

  const allFieldKeys = useMemo(() => {
    if (playerFields.length > 0) return [...playerFields].sort((a, b) => a.order - b.order).map(f => f.key);
    const keys = new Set<string>();
    teams.forEach(t => {
      (t.boughtPlayers || []).forEach((p: any) => {
        if (p.customFields) Object.keys(p.customFields).forEach(k => keys.add(k));
      });
    });
    return Array.from(keys);
  }, [teams, playerFields]);

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
          {sortedTeams.map(team => (
            <TeamCard
              key={team._id}
              team={team}
              config={config}
              onClick={() => setSelectedTeam(team)}
            />
          ))}
        </div>
      )}

      {/* Team Detail Modal */}
      <AnimatePresence>
        {selectedTeam && !selectedPlayer && (
          <TeamDetailModal
            team={selectedTeam}
            config={config}
            onClose={() => setSelectedTeam(null)}
            onPlayerClick={(player: any) => setSelectedPlayer(player)}
            fieldLabelMap={fieldLabelMap}
            cardFieldKeys={playerFields.filter(f => f.showOnCard).sort((a, b) => a.order - b.order).map(f => f.key)}
          />
        )}
      </AnimatePresence>

      {/* Player Detail Modal */}
      {selectedPlayer && (
        <PlayerDetailModal
          player={selectedPlayer}
          onClose={() => setSelectedPlayer(null)}
          customFieldKeys={allFieldKeys}
          fieldLabelMap={fieldLabelMap}
          basePrice={config.basePrice}
        />
      )}
    </div>
  );
}

function TeamCard({ team, config, onClick }: {
  team: any;
  config: { maxSquadSize: number };
  onClick: () => void;
}) {
  const spent = team.purseValue - team.purseRemaining;
  const spentPct = team.purseValue > 0 ? (spent / team.purseValue) * 100 : 0;
  const boughtCount = (team.boughtPlayers || []).length;
  const retainedCount = (team.retainedPlayers || []).length;
  const totalPlayers = boughtCount + retainedCount;
  const slotsLeft = config.maxSquadSize - totalPlayers;

  return (
    <div
      className="glass-card-hover overflow-hidden cursor-pointer transition-all"
      onClick={onClick}
    >
      <div className="h-1" style={{ background: team.primaryColor }} />
      <div className="p-4">
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
              <span>{totalPlayers} player{totalPlayers !== 1 ? 's' : ''}</span>
              <span>·</span>
              <span>{slotsLeft} slot{slotsLeft !== 1 ? 's' : ''} left</span>
            </div>
          </div>
        </div>

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

        <div>
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${spentPct}%`, background: team.primaryColor }} />
          </div>
          <div className="flex justify-between text-[9px] text-slate-600 mt-1">
            <span>{Math.round(spentPct)}% utilized</span>
            <span>{formatCurrency(team.purseValue)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function TeamDetailModal({ team, config, onClose, onPlayerClick, fieldLabelMap, cardFieldKeys }: {
  team: any;
  config: { basePrice: number; purseValue: number; minSquadSize: number; maxSquadSize: number };
  onClose: () => void;
  onPlayerClick: (player: any) => void;
  fieldLabelMap: Record<string, string>;
  cardFieldKeys: string[];
}) {
  const spent = team.purseValue - team.purseRemaining;
  const spentPct = team.purseValue > 0 ? (spent / team.purseValue) * 100 : 0;
  const retainedPlayers = (team.retainedPlayers || []).map((p: any) => ({ ...p, isRetained: true }));
  const boughtPlayers = (team.boughtPlayers || []).map((p: any) => ({ ...p, isRetained: false }));
  const allPlayers = [...retainedPlayers, ...boughtPlayers];
  const slotsLeft = config.maxSquadSize - allPlayers.length;

  const avgPrice = boughtPlayers.length > 0
    ? boughtPlayers.reduce((s: number, p: any) => s + (p.soldAmount || 0), 0) / boughtPlayers.length
    : 0;
  const maxPrice = boughtPlayers.length > 0
    ? Math.max(...boughtPlayers.map((p: any) => p.soldAmount || 0))
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8 sm:pt-16 bg-black/60 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        onClick={e => e.stopPropagation()}
        className="glass-card w-full max-w-2xl mb-8"
      >
        {/* Team color header */}
        <div className="h-2 rounded-t-xl" style={{ background: team.primaryColor }} />

        <div className="p-5 sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold text-white shadow-lg"
                style={{ background: team.primaryColor }}
              >
                {team.shortName}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{team.name}</h2>
                <p className="text-xs text-slate-400">
                  {allPlayers.length} player{allPlayers.length !== 1 ? 's' : ''} · {slotsLeft} slot{slotsLeft !== 1 ? 's' : ''} remaining
                </p>
              </div>
            </div>
            <button onClick={onClose} className="btn-ghost p-1.5">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Financial Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            <div className="p-3 rounded-xl bg-slate-800/40 border border-white/5">
              <div className="flex items-center gap-1.5 mb-1">
                <Wallet className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[10px] text-slate-500 uppercase">Total Purse</span>
              </div>
              <div className="text-sm font-bold text-white tabular-nums">{formatCurrency(team.purseValue)}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/40 border border-white/5">
              <div className="flex items-center gap-1.5 mb-1">
                <IndianRupee className="w-3.5 h-3.5 text-red-400" />
                <span className="text-[10px] text-slate-500 uppercase">Spent</span>
              </div>
              <div className="text-sm font-bold text-white tabular-nums">{formatCurrency(spent)}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/40 border border-white/5">
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[10px] text-slate-500 uppercase">Remaining</span>
              </div>
              <div className="text-sm font-bold text-emerald-400 tabular-nums">{formatCurrency(team.purseRemaining)}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/40 border border-white/5">
              <div className="flex items-center gap-1.5 mb-1">
                <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[10px] text-slate-500 uppercase">Avg Price</span>
              </div>
              <div className="text-sm font-bold text-amber-400 tabular-nums">{boughtPlayers.length > 0 ? formatCurrency(avgPrice) : '—'}</div>
            </div>
          </div>

          {/* Purse utilization bar */}
          <div className="mb-6">
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${spentPct}%`, background: team.primaryColor }} />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>{Math.round(spentPct)}% utilized</span>
              <span>Max buy: {formatCurrency(maxPrice)}</span>
            </div>
          </div>

          {/* Retained Players */}
          {retainedPlayers.length > 0 && (
            <div className="mb-5">
              <div className="text-[11px] text-amber-400/80 font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" /> Retained Players ({retainedPlayers.length})
              </div>
              <div className="space-y-1.5">
                {retainedPlayers.map((player: any, i: number) => (
                  <PlayerRow
                    key={`r-${i}`}
                    player={player}
                    onClick={() => onPlayerClick({ ...player, status: 'sold', soldTo: { _id: team._id, name: team.name, shortName: team.shortName, primaryColor: team.primaryColor } })}
                    fieldLabelMap={fieldLabelMap}
                    cardFieldKeys={cardFieldKeys}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Purchased Players */}
          {boughtPlayers.length > 0 && (
            <div>
              <div className="text-[11px] text-emerald-400/80 font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5" /> Purchased Players ({boughtPlayers.length})
              </div>
              <div className="space-y-1.5">
                {[...boughtPlayers].sort((a: any, b: any) => (b.soldAmount || 0) - (a.soldAmount || 0)).map((player: any, i: number) => (
                  <PlayerRow
                    key={`b-${i}`}
                    player={player}
                    onClick={() => onPlayerClick({ ...player, status: 'sold', soldTo: { _id: team._id, name: team.name, shortName: team.shortName, primaryColor: team.primaryColor } })}
                    fieldLabelMap={fieldLabelMap}
                    cardFieldKeys={cardFieldKeys}
                  />
                ))}
              </div>
            </div>
          )}

          {allPlayers.length === 0 && (
            <div className="text-center py-8">
              <Users className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-400">No players in squad yet</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function PlayerRow({ player, onClick, fieldLabelMap, cardFieldKeys }: {
  player: any;
  onClick: () => void;
  fieldLabelMap: Record<string, string>;
  cardFieldKeys: string[];
}) {
  const rc = PLAYER_ROLES[player.role as keyof typeof PLAYER_ROLES] || { label: player.role, icon: '🏏', color: 'text-slate-400' };

  return (
    <div
      onClick={onClick}
      className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all hover:bg-white/[0.03] ${
        player.isRetained
          ? 'bg-amber-500/5 border border-amber-500/10'
          : 'bg-slate-800/20 border border-white/5 hover:border-white/10'
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        {/* Avatar */}
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-slate-700/80 to-slate-800/80 flex items-center justify-center border border-white/10 flex-shrink-0 overflow-hidden">
          {player.imageUrl ? (
            <img src={player.imageUrl} alt={player.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-sm">{rc.icon}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium text-white truncate">{player.name}</span>
            {player.isCaptain && <Crown className="w-3 h-3 text-amber-400 flex-shrink-0" />}
            {player.isRetained && (
              <span className="text-[8px] bg-amber-500/15 text-amber-400 px-1 py-0.5 rounded flex-shrink-0 font-bold">RTN</span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-[10px] ${rc.color}`}>{rc.label}</span>
            {player.playerNumber && <span className="text-[10px] text-slate-600">#{player.playerNumber}</span>}
            {/* Show top 2 card fields inline */}
            {cardFieldKeys.slice(0, 2).map(k => {
              const val = player.customFields?.[k];
              if (!val && val !== 0) return null;
              return (
                <span key={k} className="text-[10px] text-slate-500">
                  {fieldLabelMap[k] || k}: <span className="text-slate-400">{String(val)}</span>
                </span>
              );
            })}
          </div>
        </div>
      </div>
      <div className="flex-shrink-0 ml-2">
        {player.soldAmount ? (
          <span className="text-xs font-semibold text-emerald-400 tabular-nums">
            {formatCurrency(player.soldAmount)}
          </span>
        ) : player.retentionPrice ? (
          <span className="text-xs font-semibold text-amber-400 tabular-nums">
            {formatCurrency(player.retentionPrice)}
          </span>
        ) : null}
      </div>
    </div>
  );
}
