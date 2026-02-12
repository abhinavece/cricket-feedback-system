'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PLAYER_ROLES } from '@/lib/constants';
import {
  UserCheck, Users, Search, X, ArrowUpDown, ArrowUp, ArrowDown,
  ExternalLink, Filter, ChevronDown,
} from 'lucide-react';

interface Player {
  _id: string;
  name: string;
  role: string;
  playerNumber: number;
  imageUrl?: string;
  customFields?: Record<string, any>;
  status: string;
  soldAmount?: number;
  soldInRound?: number;
  soldTo?: { _id: string; name: string; shortName: string; primaryColor: string; logo?: string };
}

function formatCurrency(amount: number) {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  return `₹${amount.toLocaleString('en-IN')}`;
}

const STATUS_FILTERS = [
  { key: 'all', label: 'All', color: 'text-white', bg: 'bg-white/10' },
  { key: 'pool', label: 'In Pool', color: 'text-blue-400', bg: 'bg-blue-500/15' },
  { key: 'sold', label: 'Sold', color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
  { key: 'unsold', label: 'Unsold', color: 'text-orange-400', bg: 'bg-orange-500/15' },
];

export function PlayersClient({ players, auctionName, slug, config }: {
  players: Player[];
  auctionName: string;
  slug: string;
  config: { basePrice: number; purseValue: number };
}) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('playerNumber');
  const [sortDir, setSortDir] = useState<1 | -1>(1);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  const roles = useMemo(() => {
    const set = new Set(players.map(p => p.role));
    return Array.from(set);
  }, [players]);

  const filtered = useMemo(() => {
    let list = [...players];
    if (statusFilter !== 'all') list = list.filter(p => p.status === statusFilter);
    if (roleFilter !== 'all') list = list.filter(p => p.role === roleFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || String(p.playerNumber).includes(q));
    }

    list.sort((a, b) => {
      let av: any, bv: any;
      if (sortKey === 'name') { av = a.name.toLowerCase(); bv = b.name.toLowerCase(); }
      else if (sortKey === 'playerNumber') { av = a.playerNumber; bv = b.playerNumber; }
      else if (sortKey === 'soldAmount') { av = a.soldAmount || 0; bv = b.soldAmount || 0; }
      else if (sortKey.startsWith('customFields.')) {
        const k = sortKey.replace('customFields.', '');
        av = a.customFields?.[k] ?? ''; bv = b.customFields?.[k] ?? '';
        const na = Number(av), nb = Number(bv);
        if (!isNaN(na) && !isNaN(nb)) { av = na; bv = nb; }
      }
      else { av = a.playerNumber; bv = b.playerNumber; }
      if (av < bv) return -1 * sortDir;
      if (av > bv) return 1 * sortDir;
      return 0;
    });
    return list;
  }, [players, statusFilter, roleFilter, search, sortKey, sortDir]);

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir(d => d === 1 ? -1 : 1);
    else { setSortKey(key); setSortDir(1); }
  };

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: players.length };
    players.forEach(p => { counts[p.status] = (counts[p.status] || 0) + 1; });
    return counts;
  }, [players]);

  const customFieldKeys = useMemo(() => {
    const keys = new Set<string>();
    players.forEach(p => {
      if (p.customFields) Object.keys(p.customFields).forEach(k => keys.add(k));
    });
    return Array.from(keys).slice(0, 6);
  }, [players]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 flex items-center gap-2">
          <UserCheck className="w-6 h-6 text-emerald-400" /> Players
        </h2>
        <p className="text-slate-400 text-sm">
          {players.length} player{players.length !== 1 ? 's' : ''} in {auctionName}
        </p>
      </div>

      {/* Status filter pills */}
      <div className="flex flex-wrap gap-2 mb-4">
        {STATUS_FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setStatusFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
              statusFilter === f.key
                ? `${f.bg} ${f.color} border-current/20`
                : 'bg-slate-800/30 text-slate-500 border-white/5 hover:border-white/10'
            }`}
          >
            {f.label}
            <span className="ml-1.5 opacity-60">{statusCounts[f.key] || 0}</span>
          </button>
        ))}
      </div>

      {/* Search + role filter + sort */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search players..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-9 text-sm w-full"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-3.5 h-3.5 text-slate-500 hover:text-white" />
            </button>
          )}
        </div>
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="input-field text-sm w-full sm:w-40"
        >
          <option value="all">All Roles</option>
          {roles.map(r => {
            const rc = PLAYER_ROLES[r as keyof typeof PLAYER_ROLES];
            return <option key={r} value={r}>{rc?.icon} {rc?.label || r}</option>;
          })}
        </select>
        <select
          value={sortKey}
          onChange={e => handleSort(e.target.value)}
          className="input-field text-sm w-full sm:w-44"
        >
          <option value="playerNumber">Sort: #Number</option>
          <option value="name">Sort: Name</option>
          <option value="soldAmount">Sort: Sold Amount</option>
          {customFieldKeys.map(k => (
            <option key={k} value={`customFields.${k}`}>Sort: {k}</option>
          ))}
        </select>
      </div>

      {/* Results count */}
      <div className="text-xs text-slate-500 mb-3">
        Showing {filtered.length} of {players.length} players
        {sortKey !== 'playerNumber' && (
          <button onClick={() => setSortDir(d => d === 1 ? -1 : 1)} className="ml-2 text-amber-400 hover:text-amber-300 inline-flex items-center gap-0.5">
            {sortDir === 1 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
            {sortDir === 1 ? 'Asc' : 'Desc'}
          </button>
        )}
      </div>

      {/* Player cards grid */}
      {filtered.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">No Players Found</h3>
          <p className="text-sm text-slate-400">Try adjusting your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(player => {
            const rc = PLAYER_ROLES[player.role as keyof typeof PLAYER_ROLES] || { label: player.role, icon: '🏏', color: 'text-slate-400' };
            const isSold = player.status === 'sold';
            const isUnsold = player.status === 'unsold';
            const topFields = customFieldKeys.slice(0, 3);

            return (
              <motion.div
                key={player._id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setSelectedPlayer(player)}
                className={`glass-card-hover cursor-pointer overflow-hidden transition-all ${
                  isSold ? 'border-emerald-500/10' : isUnsold ? 'border-orange-500/10' : ''
                }`}
              >
                {/* Status bar */}
                <div className={`h-0.5 ${
                  isSold ? 'bg-emerald-500' : isUnsold ? 'bg-orange-500' : 'bg-blue-500/40'
                }`} />

                <div className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-slate-700/80 to-slate-800/80 flex items-center justify-center border border-white/10 flex-shrink-0 overflow-hidden">
                      {player.imageUrl ? (
                        <img src={player.imageUrl} alt={player.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-lg">{rc.icon}</span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs text-slate-600 font-mono">#{player.playerNumber}</span>
                        <span className={`text-[10px] font-semibold ${rc.color}`}>{rc.label}</span>
                      </div>
                      <h4 className="text-sm font-bold text-white truncate">{player.name}</h4>

                      {/* Status + sold info */}
                      {isSold && player.soldTo && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <span
                            className="w-4 h-4 rounded text-[7px] font-bold flex items-center justify-center text-white flex-shrink-0"
                            style={{ background: player.soldTo.primaryColor }}
                          >
                            {player.soldTo.shortName?.charAt(0)}
                          </span>
                          <span className="text-[10px] text-slate-400 truncate">{player.soldTo.name}</span>
                          <span className="text-[10px] font-bold text-emerald-400 ml-auto flex-shrink-0">
                            {formatCurrency(player.soldAmount!)}
                          </span>
                        </div>
                      )}
                      {isUnsold && (
                        <span className="text-[10px] text-orange-400 mt-1 inline-block">Unsold</span>
                      )}
                      {player.status === 'pool' && (
                        <span className="text-[10px] text-blue-400/60 mt-1 inline-block">In Pool</span>
                      )}
                    </div>
                  </div>

                  {/* Custom fields preview */}
                  {topFields.length > 0 && player.customFields && (
                    <div className="mt-2.5 pt-2.5 border-t border-white/5 grid grid-cols-3 gap-1.5">
                      {topFields.map(k => {
                        const val = player.customFields?.[k];
                        if (val === undefined || val === null || val === '') return <div key={k} />;
                        return (
                          <div key={k} className="text-[10px] truncate">
                            <span className="text-slate-600">{k}: </span>
                            <span className="text-slate-400 font-medium">{String(val)}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Player Detail Modal */}
      <AnimatePresence>
        {selectedPlayer && (
          <PlayerModal player={selectedPlayer} onClose={() => setSelectedPlayer(null)} customFieldKeys={customFieldKeys} config={config} />
        )}
      </AnimatePresence>
    </div>
  );
}

function PlayerModal({ player, onClose, customFieldKeys, config }: {
  player: Player;
  onClose: () => void;
  customFieldKeys: string[];
  config: { basePrice: number };
}) {
  const rc = PLAYER_ROLES[player.role as keyof typeof PLAYER_ROLES] || { label: player.role, icon: '🏏', color: 'text-slate-400' };
  const isSold = player.status === 'sold';
  const multiplier = isSold && player.soldAmount && config.basePrice > 0
    ? (player.soldAmount / config.basePrice).toFixed(1)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        onClick={e => e.stopPropagation()}
        className="glass-card w-full max-w-md max-h-[85vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-start gap-4 p-5 border-b border-white/5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-700/80 to-slate-800/80 flex items-center justify-center border border-white/10 overflow-hidden flex-shrink-0">
            {player.imageUrl ? (
              <img src={player.imageUrl} alt={player.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl">{rc.icon}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-slate-500 font-mono">#{player.playerNumber}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${
                isSold ? 'bg-emerald-500/15 text-emerald-400' :
                player.status === 'unsold' ? 'bg-orange-500/15 text-orange-400' :
                'bg-blue-500/15 text-blue-400'
              }`}>
                {player.status}
              </span>
            </div>
            <h3 className="text-xl font-bold text-white truncate">{player.name}</h3>
            <span className={`text-xs font-medium ${rc.color}`}>{rc.icon} {rc.label}</span>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5 flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sold info */}
        {isSold && player.soldTo && (
          <div className="px-5 py-3 bg-emerald-500/5 border-b border-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-bold text-white"
                  style={{ background: player.soldTo.primaryColor }}
                >
                  {player.soldTo.shortName?.charAt(0)}
                </span>
                <div>
                  <span className="text-sm text-white font-medium">{player.soldTo.name}</span>
                  {player.soldInRound && (
                    <span className="text-[10px] text-slate-500 ml-2">Round {player.soldInRound}</span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-emerald-400">{formatCurrency(player.soldAmount!)}</span>
                {multiplier && Number(multiplier) > 1 && (
                  <span className="text-[10px] text-slate-500 ml-1">({multiplier}×)</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Custom fields */}
        <div className="p-5">
          {customFieldKeys.length > 0 && player.customFields ? (
            <div className="space-y-0">
              {customFieldKeys.map(k => {
                const val = player.customFields?.[k];
                return (
                  <div key={k} className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
                    <span className="text-sm text-slate-400 capitalize">{k.replace(/_/g, ' ')}</span>
                    <span className="text-sm font-medium text-white">
                      {val !== undefined && val !== null && val !== '' ? String(val) : '—'}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-500 text-center py-4">No additional details</p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
