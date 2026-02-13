'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
  getTrades, approveTrade, rejectTrade, executeTrade,
  getAuctionAdmin,
} from '@/lib/api';
import {
  Loader2, ArrowLeftRight, Check, X, Play, AlertTriangle,
  Clock, CheckCircle2, XCircle, ArrowRight, MessageSquare,
  Users, RefreshCw, Gavel, Shield,
} from 'lucide-react';

interface Trade {
  _id: string;
  auctionId: string;
  fromTeamId: string;
  toTeamId: string;
  fromPlayers: { playerId: string; name: string }[];
  toPlayers: { playerId: string; name: string }[];
  fromTeam: { _id: string; name: string; shortName: string; primaryColor?: string };
  toTeam: { _id: string; name: string; shortName: string; primaryColor?: string };
  status: 'proposed' | 'approved' | 'rejected' | 'executed';
  rejectionReason?: string;
  publicAnnouncement?: string;
  executedAt?: string;
  createdAt: string;
}

const STATUS_CONFIG = {
  proposed: { label: 'Proposed', icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  approved: { label: 'Approved', icon: CheckCircle2, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  rejected: { label: 'Rejected', icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
  executed: { label: 'Executed', icon: Gavel, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
};

export default function AdminTradesPage() {
  const params = useParams();
  const auctionId = params.auctionId as string;

  const [trades, setTrades] = useState<Trade[]>([]);
  const [auction, setAuction] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [rejectingTradeId, setRejectingTradeId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [tradesRes, auctionRes] = await Promise.all([
        getTrades(auctionId),
        getAuctionAdmin(auctionId),
      ]);
      setTrades(tradesRes.data || []);
      setAuction(auctionRes.data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [auctionId]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleApprove = async (tradeId: string) => {
    setActionLoading(`approve-${tradeId}`);
    try {
      await approveTrade(auctionId, tradeId);
      await loadData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (tradeId: string) => {
    setActionLoading(`reject-${tradeId}`);
    try {
      await rejectTrade(auctionId, tradeId, rejectReason);
      setRejectingTradeId(null);
      setRejectReason('');
      await loadData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleExecute = async (tradeId: string) => {
    if (!window.confirm('Execute this trade? Players will be swapped between teams. This action is logged.')) return;
    setActionLoading(`execute-${tradeId}`);
    try {
      await executeTrade(auctionId, tradeId);
      await loadData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredTrades = filter === 'all' ? trades : trades.filter(t => t.status === filter);

  const tradeStats = {
    total: trades.length,
    proposed: trades.filter(t => t.status === 'proposed').length,
    approved: trades.filter(t => t.status === 'approved').length,
    executed: trades.filter(t => t.status === 'executed').length,
    rejected: trades.filter(t => t.status === 'rejected').length,
  };

  const isTradeWindowActive = auction?.status === 'trade_window';
  const tradeWindowEndsAt = auction?.tradeWindowEndsAt;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-8 text-center">
        <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <ArrowLeftRight className="w-5 h-5 text-purple-400" />
            </div>
            Post-Auction Trades
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Review and manage player swap proposals between teams
          </p>
        </div>
        <button onClick={loadData} className="btn-ghost text-sm gap-2">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Trade Window Status Banner */}
      {auction && (
        <TradeWindowBanner
          status={auction.status}
          tradeWindowEndsAt={tradeWindowEndsAt}
          maxTradesPerTeam={auction.config?.maxTradesPerTeam || 2}
        />
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { key: 'total', label: 'Total', value: tradeStats.total, color: 'text-white', bg: 'bg-slate-800/50' },
          { key: 'proposed', label: 'Pending', value: tradeStats.proposed, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { key: 'approved', label: 'Approved', value: tradeStats.approved, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { key: 'executed', label: 'Executed', value: tradeStats.executed, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { key: 'rejected', label: 'Rejected', value: tradeStats.rejected, color: 'text-red-400', bg: 'bg-red-500/10' },
        ].map(stat => (
          <button
            key={stat.key}
            onClick={() => setFilter(stat.key === 'total' ? 'all' : stat.key)}
            className={`p-3 rounded-xl text-center transition-all ${stat.bg} border ${
              (filter === stat.key || (filter === 'all' && stat.key === 'total'))
                ? 'border-white/20 ring-1 ring-white/10'
                : 'border-transparent hover:border-white/10'
            }`}
          >
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">{stat.label}</div>
          </button>
        ))}
      </div>

      {/* Trade List */}
      {filteredTrades.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center mx-auto mb-4">
            <ArrowLeftRight className="w-8 h-8 text-slate-600" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            {trades.length === 0 ? 'No Trades Yet' : 'No Matching Trades'}
          </h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            {trades.length === 0
              ? 'Trade proposals from teams will appear here once the trade window is open.'
              : `No trades with status "${filter}" found.`
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTrades.map(trade => (
            <TradeCard
              key={trade._id}
              trade={trade}
              actionLoading={actionLoading}
              rejectingTradeId={rejectingTradeId}
              rejectReason={rejectReason}
              isTradeWindowActive={isTradeWindowActive}
              onApprove={handleApprove}
              onReject={handleReject}
              onExecute={handleExecute}
              onStartReject={(id) => { setRejectingTradeId(id); setRejectReason(''); }}
              onCancelReject={() => { setRejectingTradeId(null); setRejectReason(''); }}
              onRejectReasonChange={setRejectReason}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TradeWindowBanner({ status, tradeWindowEndsAt, maxTradesPerTeam }: {
  status: string;
  tradeWindowEndsAt?: string;
  maxTradesPerTeam: number;
}) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!tradeWindowEndsAt || status !== 'trade_window') return;

    const update = () => {
      const remaining = new Date(tradeWindowEndsAt).getTime() - Date.now();
      if (remaining <= 0) {
        setTimeLeft('Expired');
        return;
      }
      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      setTimeLeft(`${hours}h ${minutes}m remaining`);
    };

    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [tradeWindowEndsAt, status]);

  if (status === 'trade_window') {
    return (
      <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-purple-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-purple-400">Trade Window Active</p>
            <p className="text-xs text-slate-400">
              Teams can propose player-for-player swaps (max {maxTradesPerTeam} per team) · {timeLeft}
            </p>
          </div>
          <div className="text-right shrink-0">
            <div className="text-sm font-bold text-purple-300">{timeLeft}</div>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'completed') {
    return (
      <div className="p-4 rounded-2xl bg-slate-800/50 border border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-700/50 flex items-center justify-center">
            <Shield className="w-5 h-5 text-slate-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Trade Window Not Open</p>
            <p className="text-xs text-slate-400">
              Open the trade window from the Overview tab to allow teams to propose swaps.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'finalized') {
    return (
      <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-400">Auction Finalized</p>
            <p className="text-xs text-slate-400">
              Results are permanent. No further trades can be proposed or executed.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

function TradeCard({ trade, actionLoading, rejectingTradeId, rejectReason, isTradeWindowActive, onApprove, onReject, onExecute, onStartReject, onCancelReject, onRejectReasonChange }: {
  trade: Trade;
  actionLoading: string | null;
  rejectingTradeId: string | null;
  rejectReason: string;
  isTradeWindowActive: boolean;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onExecute: (id: string) => void;
  onStartReject: (id: string) => void;
  onCancelReject: () => void;
  onRejectReasonChange: (reason: string) => void;
}) {
  const statusCfg = STATUS_CONFIG[trade.status];
  const StatusIcon = statusCfg.icon;
  const isRejecting = rejectingTradeId === trade._id;

  const teamColor = (color?: string) => color || '#6366f1';

  return (
    <div className={`glass-card overflow-hidden border ${statusCfg.border}`}>
      {/* Header */}
      <div className="p-4 sm:p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg ${statusCfg.bg} flex items-center justify-center`}>
            <StatusIcon className={`w-4.5 h-4.5 ${statusCfg.color}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusCfg.bg} ${statusCfg.color}`}>
                {statusCfg.label}
              </span>
              <span className="text-[11px] text-slate-500">
                {new Date(trade.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Trade Visual */}
      <div className="px-4 sm:px-5 pb-4">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-3 sm:gap-4 items-center">
          {/* From Team */}
          <div className="p-3 sm:p-4 rounded-xl bg-slate-800/50 border border-white/5">
            <div className="flex items-center gap-2 mb-2.5">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-white"
                style={{ backgroundColor: teamColor(trade.fromTeam.primaryColor) }}
              >
                {trade.fromTeam.shortName?.slice(0, 2)}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{trade.fromTeam.name}</p>
                <p className="text-[10px] text-slate-500">Sends</p>
              </div>
            </div>
            <div className="space-y-1.5">
              {trade.fromPlayers.map(p => (
                <div key={p.playerId} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-red-500/10 border border-red-500/10">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  <span className="text-sm text-red-300 font-medium">{p.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Arrow */}
          <div className="flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
              <ArrowLeftRight className="w-5 h-5 text-purple-400" />
            </div>
          </div>

          {/* To Team */}
          <div className="p-3 sm:p-4 rounded-xl bg-slate-800/50 border border-white/5">
            <div className="flex items-center gap-2 mb-2.5">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-white"
                style={{ backgroundColor: teamColor(trade.toTeam.primaryColor) }}
              >
                {trade.toTeam.shortName?.slice(0, 2)}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{trade.toTeam.name}</p>
                <p className="text-[10px] text-slate-500">Sends</p>
              </div>
            </div>
            <div className="space-y-1.5">
              {trade.toPlayers.map(p => (
                <div key={p.playerId} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/10">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-sm text-emerald-300 font-medium">{p.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Rejection Reason */}
      {trade.status === 'rejected' && trade.rejectionReason && (
        <div className="mx-4 sm:mx-5 mb-4 p-3 rounded-xl bg-red-500/5 border border-red-500/10">
          <div className="flex items-start gap-2">
            <MessageSquare className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
            <p className="text-sm text-red-300/80">{trade.rejectionReason}</p>
          </div>
        </div>
      )}

      {/* Executed Announcement */}
      {trade.status === 'executed' && trade.publicAnnouncement && (
        <div className="mx-4 sm:mx-5 mb-4 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
          <div className="flex items-start gap-2">
            <Gavel className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
            <p className="text-sm text-emerald-300/80">{trade.publicAnnouncement}</p>
          </div>
        </div>
      )}

      {/* Reject Reason Input */}
      {isRejecting && (
        <div className="mx-4 sm:mx-5 mb-4 p-3 rounded-xl bg-slate-800/50 border border-white/5">
          <label className="text-xs text-slate-400 mb-1.5 block">Rejection Reason (optional)</label>
          <input
            type="text"
            value={rejectReason}
            onChange={(e) => onRejectReasonChange(e.target.value)}
            placeholder="Why is this trade being rejected?"
            className="w-full px-3 py-2 rounded-lg bg-slate-900/50 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
            autoFocus
          />
          <div className="flex gap-2 mt-2.5">
            <button
              onClick={() => onReject(trade._id)}
              disabled={actionLoading === `reject-${trade._id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
            >
              {actionLoading === `reject-${trade._id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
              Confirm Reject
            </button>
            <button
              onClick={onCancelReject}
              className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {(trade.status === 'proposed' || trade.status === 'approved') && !isRejecting && (
        <div className="px-4 sm:px-5 pb-4 flex flex-wrap gap-2">
          {trade.status === 'proposed' && (
            <>
              <button
                onClick={() => onApprove(trade._id)}
                disabled={!!actionLoading}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-40"
              >
                {actionLoading === `approve-${trade._id}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Approve
              </button>
              <button
                onClick={() => onStartReject(trade._id)}
                disabled={!!actionLoading}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all disabled:opacity-40"
              >
                <X className="w-3.5 h-3.5" />
                Reject
              </button>
            </>
          )}
          {trade.status === 'approved' && isTradeWindowActive && (
            <>
              <button
                onClick={() => onExecute(trade._id)}
                disabled={!!actionLoading}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-40"
              >
                {actionLoading === `execute-${trade._id}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                Execute Trade
              </button>
              <button
                onClick={() => onStartReject(trade._id)}
                disabled={!!actionLoading}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all disabled:opacity-40"
              >
                <X className="w-3.5 h-3.5" />
                Reject
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
