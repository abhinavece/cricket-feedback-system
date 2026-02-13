'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import {
  getAuctionPlayersAdmin, getAuctionAdmin, getAuctionTeamsAdmin, addPlayer, updatePlayer,
  assignPlayer, reassignPlayer, returnPlayerToPool, deletePlayer, reinstatePlayer, markPlayerIneligible,
  bulkPlayerAction, importPlayersPreview, importPlayersConfirm, getDisplayConfig,
} from '@/lib/api';
import { PLAYER_ROLES } from '@/lib/constants';
import {
  Loader2, Plus, Search, Upload, X, UserCheck, Filter,
  FileSpreadsheet, ArrowRight, Check, AlertTriangle,
  ArrowUpDown, ArrowUp, ArrowDown, Eye, ExternalLink, Pencil, Save,
  ArrowLeftRight, RotateCcw, UserPlus, Trash2, ShieldOff, ShieldCheck, CheckSquare,
} from 'lucide-react';
import ConfirmModal from '@/components/auction/ConfirmModal';

interface PlayerField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'url' | 'date';
  showOnCard: boolean;
  showInList: boolean;
  sortable: boolean;
  order: number;
}

interface Player {
  _id: string;
  playerNumber: number;
  name: string;
  role: string;
  status: string;
  imageUrl?: string;
  importSource: string;
  soldTo?: { _id: string; name: string; shortName: string; primaryColor: string };
  soldAmount?: number;
  soldInRound?: number;
  isDisqualified: boolean;
  customFields?: Record<string, any>;
  roundHistory?: { round: number; result: string; highestBid: number; highestBidTeam?: string }[];
}

export default function PlayersPage() {
  const params = useParams();
  const auctionId = params.auctionId as string;

  const [players, setPlayers] = useState<Player[]>([]);
  const [total, setTotal] = useState(0);
  const [auctionStatus, setAuctionStatus] = useState('draft');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ status: '', role: '', search: '' });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [playerFields, setPlayerFields] = useState<PlayerField[]>([]);
  const [sortKey, setSortKey] = useState('playerNumber');
  const [sortDir, setSortDir] = useState<1 | -1>(1);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [assigningPlayer, setAssigningPlayer] = useState<Player | null>(null);
  const [teams, setTeams] = useState<{ _id: string; name: string; shortName: string; primaryColor: string; purseRemaining: number }[]>([]);
  const [returnConfirm, setReturnConfirm] = useState<Player | null>(null);
  const [returnLoading, setReturnLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Player | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [ineligiblePlayer, setIneligiblePlayer] = useState<Player | null>(null);
  const [reinstateConfirm, setReinstateConfirm] = useState<Player | null>(null);
  const [reinstateLoading, setReinstateLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout>();

  const loadPlayers = useCallback(async (p = page) => {
    try {
      const queryParams: Record<string, string> = { page: String(p), limit: '50' };
      if (filters.status) queryParams.status = filters.status;
      if (filters.role) queryParams.role = filters.role;
      if (filters.search) queryParams.search = filters.search;
      queryParams.sort = `${sortDir === -1 ? '-' : ''}${sortKey}`;

      const res = await getAuctionPlayersAdmin(auctionId, queryParams);
      setPlayers(res.data || []);
      setTotal(res.pagination?.total || 0);
    } catch (err: any) {
      console.error('Load players error:', err);
    } finally {
      setLoading(false);
    }
  }, [auctionId, page, filters, sortKey, sortDir]);

  const loadAuctionStatus = useCallback(async () => {
    try {
      const res = await getAuctionAdmin(auctionId);
      setAuctionStatus(res.data?.status || 'draft');
    } catch {}
  }, [auctionId]);

  const loadDisplayConfig = useCallback(async () => {
    try {
      const res = await getDisplayConfig(auctionId);
      setPlayerFields((res.data?.playerFields || []).sort((a: PlayerField, b: PlayerField) => a.order - b.order));
    } catch {}
  }, [auctionId]);

  const loadTeams = useCallback(async () => {
    try {
      const res = await getAuctionTeamsAdmin(auctionId);
      setTeams((res.data || []).map((t: any) => ({
        _id: t._id,
        name: t.name,
        shortName: t.shortName,
        primaryColor: t.primaryColor,
        purseRemaining: t.purseRemaining,
      })));
    } catch {}
  }, [auctionId]);

  const handleReturnToPool = async (player: Player) => {
    setReturnLoading(true);
    try {
      await returnPlayerToPool(auctionId, player._id);
      setReturnConfirm(null);
      loadPlayers();
      loadTeams();
    } catch (err: any) {
      alert(err.message || 'Failed to return player to pool');
    } finally {
      setReturnLoading(false);
    }
  };

  const handleDeletePlayer = async (player: Player) => {
    setDeleteLoading(true);
    try {
      await deletePlayer(auctionId, player._id);
      setDeleteConfirm(null);
      loadPlayers();
      loadTeams();
    } catch (err: any) {
      alert(err.message || 'Failed to delete player');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleReinstatePlayer = async (player: Player) => {
    setReinstateLoading(true);
    try {
      await reinstatePlayer(auctionId, player._id);
      setReinstateConfirm(null);
      loadPlayers();
    } catch (err: any) {
      alert(err.message || 'Failed to reinstate player');
    } finally {
      setReinstateLoading(false);
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedIds.size === 0) return;
    setBulkLoading(true);
    try {
      await bulkPlayerAction(auctionId, { action, playerIds: Array.from(selectedIds) });
      setSelectedIds(new Set());
      setBulkAction(null);
      loadPlayers();
      loadTeams();
    } catch (err: any) {
      alert(err.message || 'Bulk action failed');
    } finally {
      setBulkLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === players.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(players.map(p => p._id)));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  useEffect(() => { loadAuctionStatus(); loadDisplayConfig(); loadTeams(); }, [loadAuctionStatus, loadDisplayConfig, loadTeams]);
  useEffect(() => { loadPlayers(); }, [loadPlayers]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(prev => prev === 1 ? -1 : 1);
    } else {
      setSortKey(key);
      setSortDir(1);
    }
    setPage(1);
  };

  const listFields = playerFields.filter(f => f.showInList);

  const handleSearchChange = (value: string) => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: value }));
      setPage(1);
    }, 300);
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const canAddPlayers = ['draft', 'configured'].includes(auctionStatus);

  const roleConfig = (role: string) =>
    PLAYER_ROLES[role as keyof typeof PLAYER_ROLES] || { label: role, icon: '🏏', color: 'text-slate-400' };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      pool: 'bg-blue-500/15 text-blue-400',
      sold: 'bg-emerald-500/15 text-emerald-400',
      unsold: 'bg-orange-500/15 text-orange-400',
      disqualified: 'bg-red-500/15 text-red-400',
      ineligible: 'bg-yellow-500/15 text-yellow-400',
    };
    return map[status] || 'bg-slate-500/15 text-slate-400';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Players</h2>
          <p className="text-sm text-slate-400">{total} player{total !== 1 ? 's' : ''} total</p>
        </div>
        {canAddPlayers && (
          <div className="flex gap-2">
            <button onClick={() => setShowImportModal(true)} className="btn-secondary text-sm">
              <Upload className="w-4 h-4" /> Import Excel
            </button>
            <button onClick={() => setShowAddModal(true)} className="btn-primary text-sm">
              <Plus className="w-4 h-4" /> Add Player
            </button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name or number..."
            defaultValue={filters.search}
            onChange={e => handleSearchChange(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <select
          value={filters.role}
          onChange={e => { setFilters(prev => ({ ...prev, role: e.target.value })); setPage(1); }}
          className="input-field w-full sm:w-40"
        >
          <option value="">All Roles</option>
          {Object.entries(PLAYER_ROLES).map(([key, val]) => (
            <option key={key} value={key}>{val.label}</option>
          ))}
        </select>
        <select
          value={filters.status}
          onChange={e => { setFilters(prev => ({ ...prev, status: e.target.value })); setPage(1); }}
          className="input-field w-full sm:w-40"
        >
          <option value="">All Status</option>
          <option value="pool">In Pool</option>
          <option value="sold">Sold</option>
          <option value="unsold">Unsold</option>
          <option value="disqualified">Disqualified</option>
          <option value="ineligible">Ineligible</option>
        </select>
      </div>

      {/* Players table/list */}
      {players.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <UserCheck className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">No Players</h3>
          <p className="text-sm text-slate-400 mb-6">
            {total === 0
              ? 'Add players manually or import from an Excel/CSV file.'
              : 'No players match the current filters.'}
          </p>
          {canAddPlayers && total === 0 && (
            <div className="flex justify-center gap-3">
              <button onClick={() => setShowImportModal(true)} className="btn-secondary text-sm">
                <Upload className="w-4 h-4" /> Import Excel
              </button>
              <button onClick={() => setShowAddModal(true)} className="btn-primary text-sm">
                <Plus className="w-4 h-4" /> Add Player
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="glass-card overflow-hidden hidden sm:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="w-10 px-2 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === players.length && players.length > 0}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-amber-500 focus:ring-amber-500/30"
                      />
                    </th>
                    <SortHeader label="#" sortKey="playerNumber" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
                    <SortHeader label="Player" sortKey="name" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
                    <SortHeader label="Role" sortKey="role" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
                    {listFields.map(f => (
                      <SortHeader
                        key={f.key}
                        label={f.label}
                        sortKey={`customFields.${f.key}`}
                        currentKey={sortKey}
                        currentDir={sortDir}
                        onSort={f.sortable ? handleSort : undefined}
                      />
                    ))}
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Sold To</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Amount</th>
                    <th className="w-10 px-2 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {players.map(player => {
                    const rc = roleConfig(player.role);
                    return (
                      <tr
                        key={player._id}
                        onClick={() => setSelectedPlayer(player)}
                        className={`border-b border-white/5 last:border-0 hover:bg-white/[0.03] transition-colors cursor-pointer ${selectedIds.has(player._id) ? 'bg-amber-500/5' : ''}`}
                      >
                        <td className="px-2 py-3" onClick={e => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedIds.has(player._id)}
                            onChange={() => toggleSelect(player._id)}
                            className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-amber-500 focus:ring-amber-500/30"
                          />
                        </td>
                        <td className="px-4 py-3 text-slate-500 font-mono text-xs">{player.playerNumber}</td>
                        <td className="px-4 py-3">
                          <span className="font-medium text-white">{player.name}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium ${rc.color}`}>
                            {rc.icon} {rc.label}
                          </span>
                        </td>
                        {listFields.map(f => (
                          <td key={f.key} className="px-4 py-3 text-sm text-slate-300 whitespace-nowrap">
                            <FieldValue value={player.customFields?.[f.key]} type={f.type} />
                          </td>
                        ))}
                        <td className="px-4 py-3">
                          <span className={`badge text-[11px] ${statusBadge(player.status)}`}>
                            {player.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {player.soldTo ? (
                            <span className="flex items-center gap-1.5">
                              <span
                                className="w-4 h-4 rounded text-[8px] font-bold flex items-center justify-center text-white"
                                style={{ background: player.soldTo.primaryColor }}
                              >
                                {player.soldTo.shortName?.charAt(0)}
                              </span>
                              <span className="text-sm text-slate-300">{player.soldTo.name}</span>
                            </span>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {player.soldAmount ? (
                            <span className="font-medium text-emerald-400">{formatCurrency(player.soldAmount)}</span>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>
                        <td className="px-2 py-3">
                          <button
                            onClick={e => { e.stopPropagation(); setEditingPlayer(player); }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                            title="Edit player"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden space-y-2">
            {players.map(player => {
              const rc = roleConfig(player.role);
              const topFields = listFields.slice(0, 4);
              return (
                <div
                  key={player._id}
                  onClick={() => setSelectedPlayer(player)}
                  className="glass-card p-4 cursor-pointer active:scale-[0.99] transition-transform"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-mono">#{player.playerNumber}</span>
                      <span className="font-medium text-white">{player.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={e => { e.stopPropagation(); setEditingPlayer(player); }}
                        className="p-1 rounded-lg text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <span className={`badge text-[10px] ${statusBadge(player.status)}`}>{player.status}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-xs ${rc.color}`}>{rc.icon} {rc.label}</span>
                    {player.soldTo && (
                      <span className="text-xs text-slate-400">
                        → {player.soldTo.shortName} {player.soldAmount ? formatCurrency(player.soldAmount) : ''}
                      </span>
                    )}
                  </div>
                  {topFields.length > 0 && (
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 pt-1.5 border-t border-white/5">
                      {topFields.map(f => {
                        const val = player.customFields?.[f.key];
                        if (val === undefined || val === null || val === '') return null;
                        return (
                          <span key={f.key} className="text-[11px] text-slate-400">
                            <span className="text-slate-500">{f.label}:</span>{' '}
                            <span className="text-slate-300">{String(val)}</span>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {total > 50 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-ghost text-sm disabled:opacity-30"
              >
                Previous
              </button>
              <span className="text-sm text-slate-400">
                Page {page} of {Math.ceil(total / 50)}
              </span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page >= Math.ceil(total / 50)}
                className="btn-ghost text-sm disabled:opacity-30"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Add Player Modal */}
      {showAddModal && (
        <AddPlayerModal
          auctionId={auctionId}
          onClose={() => setShowAddModal(false)}
          onAdded={() => { setShowAddModal(false); loadPlayers(1); setPage(1); }}
        />
      )}

      {/* Import Modal */}
      {showImportModal && (
        <ImportPlayersModal
          auctionId={auctionId}
          onClose={() => setShowImportModal(false)}
          onImported={() => { setShowImportModal(false); loadPlayers(1); setPage(1); loadDisplayConfig(); }}
        />
      )}

      {/* Player Profile Modal */}
      {selectedPlayer && (
        <PlayerProfileModal
          player={selectedPlayer}
          playerFields={playerFields}
          onClose={() => setSelectedPlayer(null)}
          onEdit={(p) => { setSelectedPlayer(null); setEditingPlayer(p); }}
          formatCurrency={formatCurrency}
          roleConfig={roleConfig}
          statusBadge={statusBadge}
        />
      )}

      {/* Edit Player Modal */}
      {editingPlayer && (
        <EditPlayerModal
          auctionId={auctionId}
          player={editingPlayer}
          playerFields={playerFields}
          onClose={() => setEditingPlayer(null)}
          onSaved={() => { setEditingPlayer(null); loadPlayers(); }}
          onAssign={(p) => { setEditingPlayer(null); setAssigningPlayer(p); }}
          onReturnToPool={(p) => { setEditingPlayer(null); setReturnConfirm(p); }}
          onDelete={(p) => { setEditingPlayer(null); setDeleteConfirm(p); }}
          onIneligible={(p) => { setEditingPlayer(null); setIneligiblePlayer(p); }}
          onReinstate={(p) => { setEditingPlayer(null); setReinstateConfirm(p); }}
        />
      )}

      {/* Assign / Reassign Player Modal */}
      {assigningPlayer && (
        <AssignPlayerModal
          auctionId={auctionId}
          player={assigningPlayer}
          teams={teams}
          onClose={() => setAssigningPlayer(null)}
          onDone={() => { setAssigningPlayer(null); loadPlayers(); loadTeams(); }}
        />
      )}

      {/* Mark Ineligible Modal */}
      {ineligiblePlayer && (
        <IneligibleModal
          auctionId={auctionId}
          player={ineligiblePlayer}
          onClose={() => setIneligiblePlayer(null)}
          onDone={() => { setIneligiblePlayer(null); loadPlayers(); loadTeams(); }}
        />
      )}

      {/* Return to Pool Confirm */}
      <ConfirmModal
        open={!!returnConfirm}
        title="Return Player to Pool"
        message={returnConfirm ? `Return ${returnConfirm.name} to pool? ₹${(returnConfirm.soldAmount || 0).toLocaleString('en-IN')} will be refunded to ${returnConfirm.soldTo?.name || 'the team'}.` : ''}
        variant="warning"
        confirmLabel="Return to Pool"
        loading={returnLoading}
        onConfirm={() => returnConfirm && handleReturnToPool(returnConfirm)}
        onCancel={() => setReturnConfirm(null)}
      />

      {/* Delete Player Confirm */}
      <ConfirmModal
        open={!!deleteConfirm}
        title="Delete Player"
        message={deleteConfirm ? `Permanently delete ${deleteConfirm.name}?${deleteConfirm.status === 'sold' ? ` ₹${(deleteConfirm.soldAmount || 0).toLocaleString('en-IN')} will be refunded to ${deleteConfirm.soldTo?.name || 'the team'}.` : ''} This cannot be undone.` : ''}
        variant="danger"
        confirmLabel="Delete Player"
        loading={deleteLoading}
        onConfirm={() => deleteConfirm && handleDeletePlayer(deleteConfirm)}
        onCancel={() => setDeleteConfirm(null)}
      />

      {/* Reinstate Player Confirm */}
      <ConfirmModal
        open={!!reinstateConfirm}
        title="Reinstate Player"
        message={reinstateConfirm ? `Reinstate ${reinstateConfirm.name} back to the player pool?` : ''}
        variant="info"
        confirmLabel="Reinstate"
        loading={reinstateLoading}
        onConfirm={() => reinstateConfirm && handleReinstatePlayer(reinstateConfirm)}
        onCancel={() => setReinstateConfirm(null)}
      />

      {/* Bulk Delete Confirm */}
      <ConfirmModal
        open={bulkAction === 'delete'}
        title="Bulk Delete"
        message={`Delete ${selectedIds.size} selected player(s)? Sold players will have their amounts refunded. This cannot be undone.`}
        variant="danger"
        confirmLabel={`Delete ${selectedIds.size} Player(s)`}
        loading={bulkLoading}
        onConfirm={() => handleBulkAction('delete')}
        onCancel={() => setBulkAction(null)}
      />

      {/* Bulk Mark Ineligible Confirm */}
      <ConfirmModal
        open={bulkAction === 'mark-ineligible'}
        title="Bulk Mark Ineligible"
        message={`Mark ${selectedIds.size} selected player(s) as ineligible? Sold players will have their amounts refunded.`}
        variant="warning"
        confirmLabel={`Mark ${selectedIds.size} Ineligible`}
        loading={bulkLoading}
        onConfirm={() => handleBulkAction('mark-ineligible')}
        onCancel={() => setBulkAction(null)}
      />

      {/* Bulk Return to Pool Confirm */}
      <ConfirmModal
        open={bulkAction === 'return-to-pool'}
        title="Bulk Return to Pool"
        message={`Return ${selectedIds.size} selected player(s) to the pool? Sold amounts will be refunded to their teams.`}
        variant="warning"
        confirmLabel={`Return ${selectedIds.size} to Pool`}
        loading={bulkLoading}
        onConfirm={() => handleBulkAction('return-to-pool')}
        onCancel={() => setBulkAction(null)}
      />

      {/* Floating Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl bg-slate-900/95 border border-white/10 backdrop-blur-xl shadow-2xl shadow-black/40">
          <span className="text-sm font-semibold text-white">
            <CheckSquare className="w-4 h-4 inline mr-1.5 text-amber-400" />
            {selectedIds.size} selected
          </span>
          <div className="w-px h-6 bg-white/10" />
          <button
            onClick={() => setBulkAction('return-to-pool')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Return to Pool
          </button>
          <button
            onClick={() => setBulkAction('mark-ineligible')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 transition-colors"
          >
            <ShieldOff className="w-3.5 h-3.5" /> Ineligible
          </button>
          <button
            onClick={() => setBulkAction('delete')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Sort Header
// ============================================================

function SortHeader({ label, sortKey, currentKey, currentDir, onSort }: {
  label: string;
  sortKey: string;
  currentKey: string;
  currentDir: 1 | -1;
  onSort?: (key: string) => void;
}) {
  const isActive = currentKey === sortKey;
  return (
    <th
      onClick={onSort ? () => onSort(sortKey) : undefined}
      className={`text-left px-4 py-3 text-xs font-semibold uppercase whitespace-nowrap ${
        onSort ? 'cursor-pointer select-none hover:text-white' : ''
      } ${isActive ? 'text-amber-400' : 'text-slate-400'}`}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {onSort && (
          isActive
            ? (currentDir === 1 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)
            : <ArrowUpDown className="w-3 h-3 opacity-40" />
        )}
      </span>
    </th>
  );
}

// ============================================================
// Field Value Renderer
// ============================================================

function FieldValue({ value, type }: { value: any; type: string }) {
  if (value === undefined || value === null || value === '') {
    return <span className="text-slate-600">—</span>;
  }
  if (type === 'url') {
    return (
      <a
        href={String(value)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={e => e.stopPropagation()}
        className="text-blue-400 hover:text-blue-300 inline-flex items-center gap-1"
      >
        <ExternalLink className="w-3 h-3" /> Link
      </a>
    );
  }
  if (type === 'number') {
    const num = Number(value);
    if (!isNaN(num)) {
      return <span>{Number.isInteger(num) ? num : num.toFixed(2)}</span>;
    }
  }
  return <span>{String(value)}</span>;
}

// ============================================================
// Player Profile Modal
// ============================================================

function PlayerProfileModal({ player, playerFields, onClose, onEdit, formatCurrency, roleConfig, statusBadge }: {
  player: Player;
  playerFields: PlayerField[];
  onClose: () => void;
  onEdit: (player: Player) => void;
  formatCurrency: (n: number) => string;
  roleConfig: (role: string) => { label: string; icon: string; color: string };
  statusBadge: (status: string) => string;
}) {
  const rc = roleConfig(player.role);
  const allFields = [...playerFields].sort((a, b) => a.order - b.order);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-card w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
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
              <span className={`badge text-[10px] ${statusBadge(player.status)}`}>{player.status}</span>
            </div>
            <h3 className="text-xl font-bold text-white truncate">{player.name}</h3>
            <span className={`text-xs font-medium ${rc.color}`}>{rc.icon} {rc.label}</span>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => onEdit(player)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
              title="Edit player"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="btn-ghost p-1.5">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sale info */}
        {player.soldTo && (
          <div className="px-5 py-3 bg-emerald-500/5 border-b border-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="w-6 h-6 rounded text-[9px] font-bold flex items-center justify-center text-white"
                  style={{ background: player.soldTo.primaryColor }}
                >
                  {player.soldTo.shortName?.charAt(0)}
                </span>
                <span className="text-sm text-white font-medium">Sold to {player.soldTo.name}</span>
              </div>
              {player.soldAmount && (
                <span className="text-sm font-bold text-emerald-400">{formatCurrency(player.soldAmount)}</span>
              )}
            </div>
          </div>
        )}

        {/* Custom fields */}
        <div className="p-5 space-y-0">
          {allFields.length > 0 ? (
            <div className="space-y-0">
              {allFields.map(f => {
                const val = player.customFields?.[f.key];
                return (
                  <div key={f.key} className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
                    <span className="text-sm text-slate-400">{f.label}</span>
                    <span className="text-sm font-medium text-white">
                      <FieldValue value={val} type={f.type} />
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-500 text-center py-4">No custom fields configured</p>
          )}
        </div>

        {/* Round history */}
        {player.roundHistory && player.roundHistory.length > 0 && (
          <div className="px-5 pb-5">
            <h4 className="text-xs font-semibold text-slate-400 uppercase mb-2">Round History</h4>
            <div className="space-y-1.5">
              {player.roundHistory.map((rh, i) => (
                <div key={i} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-800/30">
                  <span className="text-slate-400">Round {rh.round}</span>
                  <span className={
                    rh.result === 'sold' ? 'text-emerald-400 font-medium' :
                    rh.result === 'unsold' ? 'text-orange-400' :
                    'text-slate-400'
                  }>
                    {rh.result}{rh.highestBid > 0 ? ` — ${formatCurrency(rh.highestBid)}` : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Add Player Modal
// ============================================================

function AddPlayerModal({ auctionId, onClose, onAdded }: {
  auctionId: string;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [form, setForm] = useState({ name: '', role: 'batsman', imageUrl: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await addPlayer(auctionId, {
        name: form.name.trim(),
        role: form.role,
        imageUrl: form.imageUrl.trim() || undefined,
      });
      onAdded();
    } catch (err: any) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-card w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <h3 className="text-lg font-bold text-white">Add Player</h3>
          <button onClick={onClose} className="btn-ghost p-1.5"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Player name"
              className="input-field"
              autoFocus
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Role *</label>
            <select
              value={form.role}
              onChange={e => setForm(prev => ({ ...prev, role: e.target.value }))}
              className="input-field"
            >
              {Object.entries(PLAYER_ROLES).map(([key, val]) => (
                <option key={key} value={key}>{val.icon} {val.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Image URL</label>
            <input
              type="url"
              value={form.imageUrl}
              onChange={e => setForm(prev => ({ ...prev, imageUrl: e.target.value }))}
              placeholder="https://..."
              className="input-field"
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">{error}</div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary text-sm">Cancel</button>
            <button type="submit" disabled={submitting || !form.name.trim()} className="btn-primary text-sm disabled:opacity-40">
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Adding...</> : <><Plus className="w-4 h-4" /> Add</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// Edit Player Modal
// ============================================================

function EditPlayerModal({ auctionId, player, playerFields, onClose, onSaved, onAssign, onReturnToPool, onDelete, onIneligible, onReinstate }: {
  auctionId: string;
  player: Player;
  playerFields: PlayerField[];
  onClose: () => void;
  onSaved: () => void;
  onAssign: (player: Player) => void;
  onReturnToPool: (player: Player) => void;
  onDelete: (player: Player) => void;
  onIneligible: (player: Player) => void;
  onReinstate: (player: Player) => void;
}) {
  const [name, setName] = useState(player.name);
  const [role, setRole] = useState(player.role);
  const [imageUrl, setImageUrl] = useState(player.imageUrl || '');
  const [customFields, setCustomFields] = useState<Record<string, any>>(() => {
    const cf: Record<string, any> = {};
    for (const f of playerFields) {
      cf[f.key] = player.customFields?.[f.key] ?? '';
    }
    return cf;
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      // Build customFields — only include fields that changed
      const updatedCustomFields: Record<string, any> = {};
      for (const f of playerFields) {
        const newVal = customFields[f.key];
        const oldVal = player.customFields?.[f.key] ?? '';
        if (String(newVal) !== String(oldVal)) {
          updatedCustomFields[f.key] = f.type === 'number' && newVal !== '' ? Number(newVal) : newVal;
        }
      }

      const payload: Record<string, any> = {};
      if (name.trim() !== player.name) payload.name = name.trim();
      if (role !== player.role) payload.role = role;
      if (imageUrl.trim() !== (player.imageUrl || '')) payload.imageUrl = imageUrl.trim();
      if (Object.keys(updatedCustomFields).length > 0) {
        // Merge with existing customFields
        payload.customFields = { ...(player.customFields || {}), ...updatedCustomFields };
      }

      if (Object.keys(payload).length === 0) {
        onClose();
        return;
      }

      await updatePlayer(auctionId, player._id, payload);
      onSaved();
    } catch (err: any) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  const allFields = [...playerFields].sort((a, b) => a.order - b.order);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-card w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <div>
            <h3 className="text-lg font-bold text-white">Edit Player</h3>
            <p className="text-xs text-slate-500 mt-0.5">#{player.playerNumber} · {player.name}</p>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Name *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="input-field"
              autoFocus
              required
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Role *</label>
            <select value={role} onChange={e => setRole(e.target.value)} className="input-field">
              {Object.entries(PLAYER_ROLES).map(([key, val]) => (
                <option key={key} value={key}>{val.icon} {val.label}</option>
              ))}
            </select>
          </div>

          {/* Image URL */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Image URL</label>
            <input
              type="url"
              value={imageUrl}
              onChange={e => setImageUrl(e.target.value)}
              placeholder="https://..."
              className="input-field"
            />
          </div>

          {/* Custom Fields */}
          {allFields.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-white/5">
              <h4 className="text-xs font-semibold text-slate-400 uppercase">Player Stats</h4>
              {allFields.map(f => (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">{f.label}</label>
                  <input
                    type={f.type === 'number' ? 'number' : 'text'}
                    value={customFields[f.key] ?? ''}
                    onChange={e => setCustomFields(prev => ({ ...prev, [f.key]: e.target.value }))}
                    placeholder={f.label}
                    className="input-field"
                    step={f.type === 'number' ? 'any' : undefined}
                  />
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">{error}</div>
          )}

          {/* Admin Actions */}
          <div className="pt-3 border-t border-white/5 space-y-2">
            <h4 className="text-xs font-semibold text-slate-400 uppercase">Admin Actions</h4>
            <div className="flex flex-wrap gap-2">
              {['pool', 'unsold'].includes(player.status) && (
                <button
                  type="button"
                  onClick={() => onAssign(player)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5" /> Assign to Team
                </button>
              )}
              {player.status === 'sold' && (
                <>
                  <button
                    type="button"
                    onClick={() => onAssign(player)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-purple-400 bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 transition-colors"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5" /> Reassign to Team
                  </button>
                  <button
                    type="button"
                    onClick={() => onReturnToPool(player)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Return to Pool
                  </button>
                </>
              )}
              {['disqualified', 'ineligible'].includes(player.status) && (
                <button
                  type="button"
                  onClick={() => onReinstate(player)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5" /> Reinstate
                </button>
              )}
              {!['disqualified', 'ineligible'].includes(player.status) && (
                <button
                  type="button"
                  onClick={() => onIneligible(player)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-orange-400 bg-orange-500/10 border border-orange-500/20 hover:bg-orange-500/20 transition-colors"
                >
                  <ShieldOff className="w-3.5 h-3.5" /> Mark Ineligible
                </button>
              )}
              <button
                type="button"
                onClick={() => onDelete(player)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary text-sm">Cancel</button>
            <button type="submit" disabled={submitting || !name.trim()} className="btn-primary text-sm disabled:opacity-40">
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save Changes</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// Assign / Reassign Player Modal
// ============================================================

function AssignPlayerModal({ auctionId, player, teams, onClose, onDone }: {
  auctionId: string;
  player: Player;
  teams: { _id: string; name: string; shortName: string; primaryColor: string; purseRemaining: number }[];
  onClose: () => void;
  onDone: () => void;
}) {
  const isReassign = player.status === 'sold';
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [amount, setAmount] = useState<string>(isReassign ? String(player.soldAmount || 0) : '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter out current team for reassign
  const availableTeams = isReassign
    ? teams.filter(t => t._id !== player.soldTo?._id)
    : teams;

  const selectedTeam = availableTeams.find(t => t._id === selectedTeamId);
  const numAmount = Number(amount) || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeamId || numAmount < 0) return;
    setSubmitting(true);
    setError(null);
    try {
      if (isReassign) {
        await reassignPlayer(auctionId, player._id, { newTeamId: selectedTeamId, newAmount: numAmount });
      } else {
        await assignPlayer(auctionId, player._id, { teamId: selectedTeamId, amount: numAmount });
      }
      onDone();
    } catch (err: any) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  const formatCurrency = (n: number) => {
    if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
    if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
    return `₹${n.toLocaleString('en-IN')}`;
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-card w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <div>
            <h3 className="text-lg font-bold text-white">
              {isReassign ? 'Reassign Player' : 'Assign to Team'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              #{player.playerNumber} · {player.name}
              {isReassign && player.soldTo && (
                <span className="text-amber-400"> · Currently: {player.soldTo.name}</span>
              )}
            </p>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Team Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              {isReassign ? 'New Team' : 'Team'} *
            </label>
            <select
              value={selectedTeamId}
              onChange={e => setSelectedTeamId(e.target.value)}
              className="input-field"
              required
            >
              <option value="">— Select team —</option>
              {availableTeams.map(t => (
                <option key={t._id} value={t._id}>
                  {t.name} ({t.shortName}) — Purse: {formatCurrency(t.purseRemaining)}
                </option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Amount (₹) *</label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              min="0"
              step="1000"
              className="input-field"
              placeholder="Enter amount"
              required
            />
          </div>

          {/* Purse check */}
          {selectedTeam && numAmount > 0 && (
            <div className={`p-3 rounded-lg text-xs ${
              numAmount > selectedTeam.purseRemaining
                ? 'bg-red-500/10 border border-red-500/20 text-red-400'
                : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
            }`}>
              {numAmount > selectedTeam.purseRemaining ? (
                <span>⚠️ Insufficient purse! {selectedTeam.name} has {formatCurrency(selectedTeam.purseRemaining)} remaining.</span>
              ) : (
                <span>✓ {selectedTeam.name} purse after: {formatCurrency(selectedTeam.purseRemaining - numAmount)}</span>
              )}
            </div>
          )}

          {isReassign && player.soldTo && (
            <div className="p-3 rounded-lg bg-slate-800/50 border border-white/5 text-xs text-slate-400">
              <span className="text-white font-medium">{player.soldTo.name}</span> will be refunded{' '}
              <span className="text-emerald-400 font-medium">{formatCurrency(player.soldAmount || 0)}</span>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">{error}</div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary text-sm">Cancel</button>
            <button
              type="submit"
              disabled={submitting || !selectedTeamId || numAmount < 0 || (selectedTeam ? numAmount > selectedTeam.purseRemaining : false)}
              className="btn-primary text-sm disabled:opacity-40"
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
              ) : isReassign ? (
                <><ArrowLeftRight className="w-4 h-4" /> Reassign</>
              ) : (
                <><UserPlus className="w-4 h-4" /> Assign</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// Mark Ineligible Modal
// ============================================================

function IneligibleModal({ auctionId, player, onClose, onDone }: {
  auctionId: string;
  player: Player;
  onClose: () => void;
  onDone: () => void;
}) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await markPlayerIneligible(auctionId, player._id, { reason: reason.trim() || undefined });
      onDone();
    } catch (err: any) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-card w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <div>
            <h3 className="text-lg font-bold text-white">Mark Ineligible</h3>
            <p className="text-xs text-slate-500 mt-0.5">#{player.playerNumber} · {player.name}</p>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-sm text-slate-300">
            This player will be removed from the auction pool.
            {player.status === 'sold' && (
              <span className="text-amber-400"> The sold amount will be refunded to the team.</span>
            )}
          </p>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Reason (optional)</label>
            <input
              type="text"
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="input-field"
              placeholder="e.g. Injury, pending verification, late arrival..."
              autoFocus
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">{error}</div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary text-sm">Cancel</button>
            <button type="submit" disabled={submitting} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-orange-600 hover:bg-orange-500 transition-colors disabled:opacity-40">
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</> : <><ShieldOff className="w-4 h-4" /> Mark Ineligible</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// Import Players Modal
// ============================================================

function ImportPlayersModal({ auctionId, onClose, onImported }: {
  auctionId: string;
  onClose: () => void;
  onImported: () => void;
}) {
  const [step, setStep] = useState<'upload' | 'mapping' | 'done'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [skippedColumns, setSkippedColumns] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setLoading(true);
    setError(null);
    try {
      const res = await importPlayersPreview(auctionId, f);
      setPreview(res.data);
      setMapping(res.data.suggestedMapping || {});
      setSkippedColumns(new Set());
      setStep('mapping');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!file || !mapping.name || !mapping.role) return;
    setLoading(true);
    setError(null);
    try {
      // Build final mapping: mapped fields + all non-skipped columns stay as customFields
      const finalMapping = { ...mapping };
      // Columns not in mapping and not skipped will auto-become customFields on the backend
      // Skipped columns need to be passed so backend can exclude them
      if (skippedColumns.size > 0) {
        finalMapping._skipColumns = Array.from(skippedColumns).join(',');
      }
      const res = await importPlayersConfirm(auctionId, file, finalMapping);
      setResult(res.data);
      setStep('done');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Compute which columns are unmapped (will become custom fields)
  const mappedHeaders = new Set(Object.values(mapping).filter(Boolean));
  const customColumns = preview
    ? (preview.headers as string[]).filter((h: string) => !mappedHeaders.has(h) && !skippedColumns.has(h))
    : [];

  const toggleSkipColumn = (col: string) => {
    setSkippedColumns(prev => {
      const next = new Set(prev);
      if (next.has(col)) next.delete(col);
      else next.add(col);
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-card w-full max-w-3xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <h3 className="text-lg font-bold text-white">
            {step === 'upload' ? 'Import Players' : step === 'mapping' ? 'Map & Import Columns' : 'Import Complete'}
          </h3>
          <button onClick={step === 'done' ? onImported : onClose} className="btn-ghost p-1.5">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          {step === 'upload' && (
            <div className="text-center py-8">
              <FileSpreadsheet className="w-16 h-16 text-slate-500 mx-auto mb-4" />
              <h4 className="text-lg font-bold text-white mb-2">Upload Excel or CSV</h4>
              <p className="text-sm text-slate-400 mb-6 max-w-md mx-auto">
                Your file should have columns for player name and role at minimum.
                All additional columns (stats, age, etc.) will be auto-imported as player fields.
              </p>
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.csv,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={loading}
                className="btn-primary"
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</> : <><Upload className="w-4 h-4" /> Choose File</>}
              </button>
              {error && (
                <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">{error}</div>
              )}
            </div>
          )}

          {step === 'mapping' && preview && (
            <div className="space-y-5">
              <div className="p-3 rounded-lg bg-slate-800/50 text-sm text-slate-300">
                Found <strong className="text-white">{preview.totalRows}</strong> rows and{' '}
                <strong className="text-white">{preview.headers.length}</strong> columns in{' '}
                <strong className="text-white">{file?.name}</strong>
              </div>

              {/* Required column mapping */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-white">Map Required Columns</h4>
                {['name', 'role', 'imageUrl'].map(field => {
                  const isRequired = field !== 'imageUrl';
                  const label = field === 'imageUrl' ? 'Image URL' : field === 'name' ? 'Player Name' : 'Role';
                  return (
                    <div key={field} className="flex items-center gap-3">
                      <label className="text-sm text-slate-300 w-28">
                        {label}
                        {isRequired && <span className="text-red-400"> *</span>}
                      </label>
                      <ArrowRight className="w-4 h-4 text-slate-600 flex-shrink-0" />
                      <select
                        value={mapping[field] || ''}
                        onChange={e => setMapping(prev => ({ ...prev, [field]: e.target.value }))}
                        className="input-field flex-1"
                      >
                        <option value="">— Select column —</option>
                        {preview.headers.map((h: string) => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                      {mapping[field] && (
                        <span className="text-emerald-400 text-xs flex-shrink-0">
                          <Check className="w-4 h-4" />
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Auto-imported custom columns */}
              {customColumns.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-white">
                      Auto-imported as Player Stats ({customColumns.length} columns)
                    </h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(preview.headers as string[])
                      .filter((h: string) => !mappedHeaders.has(h))
                      .map((col: string) => {
                        const isSkipped = skippedColumns.has(col);
                        return (
                          <button
                            key={col}
                            onClick={() => toggleSkipColumn(col)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                              isSkipped
                                ? 'bg-slate-800/30 border-white/5 text-slate-500 line-through'
                                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                            }`}
                          >
                            {isSkipped ? <X className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                            {col}
                          </button>
                        );
                      })}
                  </div>
                  <p className="text-[11px] text-slate-500">Click a column to skip it from import</p>
                </div>
              )}

              {/* Preview table — show ALL columns */}
              <div>
                <h4 className="text-sm font-semibold text-white mb-2">Preview (first 5 rows)</h4>
                <div className="overflow-x-auto rounded-lg border border-white/5">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-800/50">
                        {preview.headers.map((h: string) => {
                          const isMapped = mappedHeaders.has(h);
                          const isSkipped = skippedColumns.has(h);
                          return (
                            <th
                              key={h}
                              className={`px-3 py-2 text-left font-medium whitespace-nowrap ${
                                isSkipped ? 'text-slate-600 line-through' : isMapped ? 'text-amber-400' : 'text-slate-400'
                              }`}
                            >
                              {h}
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.preview.slice(0, 5).map((row: any, i: number) => (
                        <tr key={i} className="border-t border-white/5">
                          {preview.headers.map((h: string) => {
                            const isSkipped = skippedColumns.has(h);
                            return (
                              <td
                                key={h}
                                className={`px-3 py-2 truncate max-w-[150px] ${
                                  isSkipped ? 'text-slate-600' : 'text-slate-300'
                                }`}
                              >
                                {String(row[h] ?? '')}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">{error}</div>
              )}

              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  {customColumns.length} stat column{customColumns.length !== 1 ? 's' : ''} will be imported
                </p>
                <div className="flex gap-3">
                  <button onClick={() => { setStep('upload'); setPreview(null); setFile(null); }} className="btn-secondary text-sm">
                    Back
                  </button>
                  <button
                    onClick={handleConfirmImport}
                    disabled={loading || !mapping.name || !mapping.role}
                    className="btn-primary text-sm disabled:opacity-40"
                  >
                    {loading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Importing...</>
                    ) : (
                      <><Check className="w-4 h-4" /> Import {preview.totalRows} Players</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 'done' && result && (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-emerald-400" />
              </div>
              <h4 className="text-xl font-bold text-white mb-2">Import Successful</h4>
              <p className="text-slate-400 mb-6">
                <strong className="text-white">{result.imported}</strong> players imported.
                {result.totalInPool != null && <> <strong className="text-white">{result.totalInPool}</strong> total in pool.</>}
              </p>
              {result.errors && result.errors.length > 0 && (
                <div className="mb-6 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-left">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span className="text-sm font-medium text-amber-300">{result.errors.length} row(s) skipped</span>
                  </div>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {result.errors.map((err: any, i: number) => (
                      <p key={i} className="text-xs text-amber-200/70">Row {err.row}: {err.error}</p>
                    ))}
                  </div>
                </div>
              )}
              <button onClick={onImported} className="btn-primary">Done</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
