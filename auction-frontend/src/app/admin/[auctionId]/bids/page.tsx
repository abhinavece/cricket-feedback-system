'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { getBidHistory, voidBid, getAuctionTeamsAdmin } from '@/lib/api';
import {
  Loader2, History, Filter, ChevronLeft, ChevronRight,
  CheckCircle, XCircle, Ban, X, AlertTriangle,
} from 'lucide-react';
import ConfirmModal from '@/components/auction/ConfirmModal';

interface BidLog {
  _id: string;
  teamId: { _id: string; name: string; shortName: string; primaryColor: string } | null;
  playerId: { _id: string; name: string; playerNumber: number; role: string } | null;
  type: 'bid_accepted' | 'bid_rejected' | 'bid_voided';
  attemptedAmount: number;
  reason: string;
  purseAtTime: number;
  maxBidAtTime: number;
  timestamp: string;
}

interface Team {
  _id: string;
  name: string;
  shortName: string;
}

export default function BidHistoryPage() {
  const params = useParams();
  const auctionId = params.auctionId as string;

  const [logs, setLogs] = useState<BidLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [teams, setTeams] = useState<Team[]>([]);

  // Filters
  const [filterTeam, setFilterTeam] = useState('');
  const [filterType, setFilterType] = useState('');

  // Void modal
  const [voidTarget, setVoidTarget] = useState<BidLog | null>(null);
  const [voidReason, setVoidReason] = useState('');
  const [voidLoading, setVoidLoading] = useState(false);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page };
      if (filterTeam) params.teamId = filterTeam;
      if (filterType) params.type = filterType;
      const res = await getBidHistory(auctionId, params);
      setLogs(res.data);
      setTotal(res.total);
      setPages(res.pages);
    } catch (err) {
      console.error('Failed to load bid history:', err);
    } finally {
      setLoading(false);
    }
  }, [auctionId, page, filterTeam, filterType]);

  const loadTeams = useCallback(async () => {
    try {
      const res = await getAuctionTeamsAdmin(auctionId);
      setTeams(res.data || []);
    } catch (err) {
      console.error('Failed to load teams:', err);
    }
  }, [auctionId]);

  useEffect(() => { loadTeams(); }, [loadTeams]);
  useEffect(() => { loadLogs(); }, [loadLogs]);

  const handleVoid = async () => {
    if (!voidTarget) return;
    setVoidLoading(true);
    try {
      await voidBid(auctionId, voidTarget._id, { reason: voidReason.trim() || undefined });
      setVoidTarget(null);
      setVoidReason('');
      loadLogs();
    } catch (err: any) {
      alert(err.message || 'Failed to void bid');
    } finally {
      setVoidLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)} Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)} L`;
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const typeConfig: Record<string, { label: string; icon: React.ReactNode; badge: string }> = {
    bid_accepted: {
      label: 'Accepted',
      icon: <CheckCircle className="w-4 h-4 text-emerald-400" />,
      badge: 'bg-emerald-500/15 text-emerald-400',
    },
    bid_rejected: {
      label: 'Rejected',
      icon: <XCircle className="w-4 h-4 text-red-400" />,
      badge: 'bg-red-500/15 text-red-400',
    },
    bid_voided: {
      label: 'Voided',
      icon: <Ban className="w-4 h-4 text-amber-400" />,
      badge: 'bg-amber-500/15 text-amber-400',
    },
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">Bid History</h2>
          <p className="text-sm text-slate-400 mt-1">{total} bid record{total !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Filter className="w-4 h-4 text-slate-400" />
        <select
          value={filterTeam}
          onChange={e => { setFilterTeam(e.target.value); setPage(1); }}
          className="input-field w-full sm:w-48"
        >
          <option value="">All Teams</option>
          {teams.map(t => (
            <option key={t._id} value={t._id}>{t.name}</option>
          ))}
        </select>
        <select
          value={filterType}
          onChange={e => { setFilterType(e.target.value); setPage(1); }}
          className="input-field w-full sm:w-40"
        >
          <option value="">All Types</option>
          <option value="bid_accepted">Accepted</option>
          <option value="bid_rejected">Rejected</option>
          <option value="bid_voided">Voided</option>
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        </div>
      ) : logs.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <History className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">No Bid Records</h3>
          <p className="text-sm text-slate-400">Bid history will appear here once bidding starts.</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block glass-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-slate-400">
                  <th className="text-left p-3 font-medium">Time</th>
                  <th className="text-left p-3 font-medium">Player</th>
                  <th className="text-left p-3 font-medium">Team</th>
                  <th className="text-right p-3 font-medium">Amount</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium">Reason</th>
                  <th className="text-right p-3 font-medium">Purse</th>
                  <th className="text-center p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => {
                  const tc = typeConfig[log.type] || typeConfig.bid_accepted;
                  return (
                    <tr key={log._id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="p-3 text-slate-300 text-xs whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString('en-IN', {
                          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit',
                        })}
                      </td>
                      <td className="p-3">
                        {log.playerId ? (
                          <span className="text-white font-medium">
                            <span className="text-slate-500">#{log.playerId.playerNumber}</span> {log.playerId.name}
                          </span>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                      <td className="p-3">
                        {log.teamId ? (
                          <span className="inline-flex items-center gap-1.5">
                            <span
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: log.teamId.primaryColor || '#666' }}
                            />
                            <span className="text-white">{log.teamId.shortName || log.teamId.name}</span>
                          </span>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                      <td className="p-3 text-right font-mono text-white font-semibold">
                        {formatCurrency(log.attemptedAmount)}
                      </td>
                      <td className="p-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${tc.badge}`}>
                          {tc.icon} {tc.label}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400 text-xs max-w-[200px] truncate" title={log.reason}>
                        {log.reason || '—'}
                      </td>
                      <td className="p-3 text-right text-slate-400 text-xs font-mono">
                        {formatCurrency(log.purseAtTime)}
                      </td>
                      <td className="p-3 text-center">
                        {log.type === 'bid_accepted' && (
                          <button
                            onClick={() => setVoidTarget(log)}
                            className="text-xs text-red-400 hover:text-red-300 font-medium transition-colors"
                          >
                            Void
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {logs.map(log => {
              const tc = typeConfig[log.type] || typeConfig.bid_accepted;
              return (
                <div key={log._id} className="glass-card p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${tc.badge}`}>
                      {tc.icon} {tc.label}
                    </span>
                    <span className="text-xs text-slate-500">
                      {new Date(log.timestamp).toLocaleString('en-IN', {
                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      {log.playerId && (
                        <p className="text-sm text-white font-medium">
                          <span className="text-slate-500">#{log.playerId.playerNumber}</span> {log.playerId.name}
                        </p>
                      )}
                      {log.teamId && (
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: log.teamId.primaryColor || '#666' }}
                          />
                          {log.teamId.name}
                        </p>
                      )}
                    </div>
                    <span className="text-lg font-bold text-white font-mono">
                      {formatCurrency(log.attemptedAmount)}
                    </span>
                  </div>
                  {log.reason && (
                    <p className="text-xs text-slate-500">{log.reason}</p>
                  )}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-slate-500">Purse: {formatCurrency(log.purseAtTime)}</span>
                    {log.type === 'bid_accepted' && (
                      <button
                        onClick={() => setVoidTarget(log)}
                        className="text-xs text-red-400 hover:text-red-300 font-medium"
                      >
                        Void Bid
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="btn-secondary text-sm disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-slate-400">
                Page {page} of {pages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(pages, p + 1))}
                disabled={page >= pages}
                className="btn-secondary text-sm disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}

      {/* Void Bid Modal */}
      {voidTarget && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setVoidTarget(null)}>
          <div className="glass-card w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <div>
                <h3 className="text-lg font-bold text-white">Void Bid</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {voidTarget.playerId?.name} — {formatCurrency(voidTarget.attemptedAmount)} by {voidTarget.teamId?.name}
                </p>
              </div>
              <button onClick={() => setVoidTarget(null)} className="btn-ghost p-1.5"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm text-amber-400 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>This marks the bid as voided in the audit log. It does NOT reverse the sale — use Return to Pool for that.</span>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Reason (optional)</label>
                <input
                  type="text"
                  value={voidReason}
                  onChange={e => setVoidReason(e.target.value)}
                  className="input-field"
                  placeholder="e.g. Invalid bid, error, duplicate..."
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setVoidTarget(null)} className="btn-secondary text-sm">Cancel</button>
                <button
                  onClick={handleVoid}
                  disabled={voidLoading}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-500 transition-colors disabled:opacity-40"
                >
                  {voidLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Voiding...</> : <><Ban className="w-4 h-4" /> Void Bid</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
