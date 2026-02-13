'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
  getTrades, adminApproveTrade, adminRejectTrade, getAuctionAdmin,
} from '@/lib/api';
import {
  Loader2, ArrowLeftRight, Check, X, Play, AlertTriangle,
  Clock, CheckCircle2, XCircle, MessageSquare, Ban,
  RefreshCw, Gavel, Shield, IndianRupee,
} from 'lucide-react';
import ConfirmModal from '@/components/auction/ConfirmModal';

interface TradePlayer {
  playerId: string;
  name: string;
  role?: string;
  soldAmount?: number;
}

interface Trade {
  _id: string;
  auctionId: string;
  initiatorTeamId: string;
  counterpartyTeamId: string;
  initiatorPlayers: TradePlayer[];
  counterpartyPlayers: TradePlayer[];
  initiatorTeam: { _id: string; name: string; shortName: string; primaryColor?: string; purseRemaining?: number };
  counterpartyTeam: { _id: string; name: string; shortName: string; primaryColor?: string; purseRemaining?: number };
  status: 'pending_counterparty' | 'both_agreed' | 'executed' | 'rejected' | 'withdrawn' | 'cancelled' | 'expired';
  initiatorTotalValue?: number;
  counterpartyTotalValue?: number;
  settlementAmount?: number;
  settlementDirection?: string;
  purseSettlementEnabled?: boolean;
  initiatorMessage?: string;
  counterpartyMessage?: string;
  adminNote?: string;
  rejectedBy?: string;
  rejectionReason?: string;
  cancellationReason?: string;
  publicAnnouncement?: string;
  executedAt?: string;
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; icon: any; color: string; bg: string; border: string }> = {
  pending_counterparty: { label: 'Pending Team', icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  both_agreed: { label: 'Both Agreed', icon: CheckCircle2, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  executed: { label: 'Executed', icon: Gavel, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  rejected: { label: 'Rejected', icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
  withdrawn: { label: 'Withdrawn', icon: Ban, color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20' },
  cancelled: { label: 'Cancelled', icon: XCircle, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
  expired: { label: 'Expired', icon: Clock, color: 'text-slate-500', bg: 'bg-slate-500/10', border: 'border-slate-500/20' },
};

function formatCurrency(amount: number) {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  return `₹${amount.toLocaleString('en-IN')}`;
}

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
  const [approveTradeId, setApproveTradeId] = useState<string | null>(null);

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

  const handleApproveExecute = async (tradeId: string) => {
    setApproveTradeId(null);
    setActionLoading(`approve-${tradeId}`);
    try {
      const res = await adminApproveTrade(auctionId, tradeId);
      if (res.warnings?.length) {
        alert('Trade executed with warnings:\n' + res.warnings.join('\n'));
      }
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
      await adminRejectTrade(auctionId, tradeId, rejectReason);
      setRejectingTradeId(null);
      setRejectReason('');
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
    pending: trades.filter(t => t.status === 'pending_counterparty').length,
    agreed: trades.filter(t => t.status === 'both_agreed').length,
    executed: trades.filter(t => t.status === 'executed').length,
    other: trades.filter(t => ['rejected', 'withdrawn', 'cancelled', 'expired'].includes(t.status)).length,
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
            Bilateral trade negotiation — teams agree, you approve & execute
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
          { key: 'total', filterKey: 'all', label: 'Total', value: tradeStats.total, color: 'text-white', bg: 'bg-slate-800/50' },
          { key: 'pending', filterKey: 'pending_counterparty', label: 'Pending', value: tradeStats.pending, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { key: 'agreed', filterKey: 'both_agreed', label: 'Agreed', value: tradeStats.agreed, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { key: 'executed', filterKey: 'executed', label: 'Executed', value: tradeStats.executed, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { key: 'other', filterKey: 'other', label: 'Other', value: tradeStats.other, color: 'text-slate-400', bg: 'bg-slate-500/10' },
        ].map(stat => (
          <button
            key={stat.key}
            onClick={() => setFilter(stat.filterKey)}
            className={`p-3 rounded-xl text-center transition-all ${stat.bg} border ${
              filter === stat.filterKey ? 'border-white/20 ring-1 ring-white/10' : 'border-transparent hover:border-white/10'
            }`}
          >
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">{stat.label}</div>
          </button>
        ))}
      </div>

      {/* Trade List */}
      {(() => {
        const displayed = filter === 'other'
          ? trades.filter(t => ['rejected', 'withdrawn', 'cancelled', 'expired'].includes(t.status))
          : filteredTrades;

        return displayed.length === 0 ? (
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
                : 'No trades match the selected filter.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayed.map(trade => (
              <AdminTradeCard
                key={trade._id}
                trade={trade}
                actionLoading={actionLoading}
                rejectingTradeId={rejectingTradeId}
                rejectReason={rejectReason}
                isTradeWindowActive={isTradeWindowActive}
                onApproveExecute={(id) => setApproveTradeId(id)}
                onReject={handleReject}
                onStartReject={(id) => { setRejectingTradeId(id); setRejectReason(''); }}
                onCancelReject={() => { setRejectingTradeId(null); setRejectReason(''); }}
                onRejectReasonChange={setRejectReason}
              />
            ))}
          </div>
        );
      })()}
      <ConfirmModal
        open={!!approveTradeId}
        title="Approve & Execute Trade"
        message="Approve & execute this trade? Players will be swapped between teams and purse adjustments applied."
        variant="warning"
        confirmLabel="Approve & Execute"
        loading={!!actionLoading}
        onConfirm={() => { if (approveTradeId) handleApproveExecute(approveTradeId); }}
        onCancel={() => setApproveTradeId(null)}
      />
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
      if (remaining <= 0) { setTimeLeft('Expired'); return; }
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
              Bilateral trades: team proposes → counterparty accepts → you approve & execute (max {maxTradesPerTeam} per team) · {timeLeft}
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
            <p className="text-xs text-slate-400">Open the trade window from the Overview tab.</p>
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
            <p className="text-xs text-slate-400">Results are permanent. No further trades.</p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

function AdminTradeCard({ trade, actionLoading, rejectingTradeId, rejectReason, isTradeWindowActive, onApproveExecute, onReject, onStartReject, onCancelReject, onRejectReasonChange }: {
  trade: Trade;
  actionLoading: string | null;
  rejectingTradeId: string | null;
  rejectReason: string;
  isTradeWindowActive: boolean;
  onApproveExecute: (id: string) => void;
  onReject: (id: string) => void;
  onStartReject: (id: string) => void;
  onCancelReject: () => void;
  onRejectReasonChange: (reason: string) => void;
}) {
  const statusCfg = STATUS_CONFIG[trade.status] || STATUS_CONFIG.pending_counterparty;
  const StatusIcon = statusCfg.icon;
  const isRejecting = rejectingTradeId === trade._id;
  const teamColor = (color?: string) => color || '#6366f1';

  // Settlement warning
  const hasSettlementWarning = trade.purseSettlementEnabled && trade.settlementAmount && trade.settlementAmount > 0 && (() => {
    if (trade.settlementDirection === 'initiator_pays') {
      return (trade.initiatorTeam?.purseRemaining ?? Infinity) < trade.settlementAmount;
    }
    if (trade.settlementDirection === 'counterparty_pays') {
      return (trade.counterpartyTeam?.purseRemaining ?? Infinity) < trade.settlementAmount;
    }
    return false;
  })();

  return (
    <div className={`glass-card overflow-hidden border ${statusCfg.border}`}>
      {/* Header */}
      <div className="p-4 sm:p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg ${statusCfg.bg} flex items-center justify-center`}>
            <StatusIcon className={`w-4 h-4 ${statusCfg.color}`} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
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
          {/* Initiator Team */}
          <div className="p-3 sm:p-4 rounded-xl bg-slate-800/50 border border-white/5">
            <div className="flex items-center gap-2 mb-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-white"
                style={{ backgroundColor: teamColor(trade.initiatorTeam?.primaryColor) }}>
                {trade.initiatorTeam?.shortName?.slice(0, 2)}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{trade.initiatorTeam?.name}</p>
                <p className="text-[10px] text-slate-500">Initiator · Sends</p>
              </div>
            </div>
            <div className="space-y-1.5">
              {trade.initiatorPlayers.map(p => (
                <div key={p.playerId} className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-red-500/10 border border-red-500/10">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    <span className="text-sm text-red-300 font-medium">{p.name}</span>
                  </div>
                  {p.soldAmount ? <span className="text-[10px] text-red-400/60">{formatCurrency(p.soldAmount)}</span> : null}
                </div>
              ))}
            </div>
            {trade.initiatorTotalValue !== undefined && (
              <p className="text-[10px] text-slate-500 mt-2 text-right">Total: {formatCurrency(trade.initiatorTotalValue)}</p>
            )}
          </div>

          {/* Arrow */}
          <div className="flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
              <ArrowLeftRight className="w-5 h-5 text-purple-400" />
            </div>
          </div>

          {/* Counterparty Team */}
          <div className="p-3 sm:p-4 rounded-xl bg-slate-800/50 border border-white/5">
            <div className="flex items-center gap-2 mb-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-white"
                style={{ backgroundColor: teamColor(trade.counterpartyTeam?.primaryColor) }}>
                {trade.counterpartyTeam?.shortName?.slice(0, 2)}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{trade.counterpartyTeam?.name}</p>
                <p className="text-[10px] text-slate-500">Counterparty · Sends</p>
              </div>
            </div>
            <div className="space-y-1.5">
              {trade.counterpartyPlayers.map(p => (
                <div key={p.playerId} className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/10">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span className="text-sm text-emerald-300 font-medium">{p.name}</span>
                  </div>
                  {p.soldAmount ? <span className="text-[10px] text-emerald-400/60">{formatCurrency(p.soldAmount)}</span> : null}
                </div>
              ))}
            </div>
            {trade.counterpartyTotalValue !== undefined && (
              <p className="text-[10px] text-slate-500 mt-2 text-right">Total: {formatCurrency(trade.counterpartyTotalValue)}</p>
            )}
          </div>
        </div>

        {/* Settlement Info */}
        {trade.settlementAmount !== undefined && trade.settlementAmount > 0 && (
          <div className={`mt-3 p-3 rounded-xl flex items-center justify-between ${
            hasSettlementWarning ? 'bg-red-500/10 border border-red-500/20' : 'bg-slate-800/50 border border-white/5'
          }`}>
            <div className="flex items-center gap-2">
              <IndianRupee className={`w-4 h-4 ${hasSettlementWarning ? 'text-red-400' : 'text-slate-400'}`} />
              <span className="text-xs text-slate-300">
                Settlement: <span className="font-semibold">{formatCurrency(trade.settlementAmount)}</span>
                {trade.settlementDirection === 'initiator_pays'
                  ? ` (${trade.initiatorTeam?.shortName} pays → ${trade.counterpartyTeam?.shortName})`
                  : ` (${trade.counterpartyTeam?.shortName} pays → ${trade.initiatorTeam?.shortName})`}
              </span>
            </div>
            {hasSettlementWarning && (
              <span className="text-[10px] text-red-400 font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Insufficient purse
              </span>
            )}
          </div>
        )}
      </div>

      {/* Messages */}
      {trade.initiatorMessage && (
        <div className="mx-4 sm:mx-5 mb-2 p-2.5 rounded-xl bg-slate-800/30 border border-white/5">
          <p className="text-xs text-slate-400 flex items-start gap-1.5">
            <MessageSquare className="w-3 h-3 mt-0.5 shrink-0 text-purple-400" />
            <span><span className="text-purple-400 font-medium">Initiator:</span> {trade.initiatorMessage}</span>
          </p>
        </div>
      )}
      {trade.counterpartyMessage && (
        <div className="mx-4 sm:mx-5 mb-2 p-2.5 rounded-xl bg-slate-800/30 border border-white/5">
          <p className="text-xs text-slate-400 flex items-start gap-1.5">
            <MessageSquare className="w-3 h-3 mt-0.5 shrink-0 text-cyan-400" />
            <span><span className="text-cyan-400 font-medium">Counterparty:</span> {trade.counterpartyMessage}</span>
          </p>
        </div>
      )}

      {/* Rejection / Cancellation */}
      {trade.status === 'rejected' && trade.rejectionReason && (
        <div className="mx-4 sm:mx-5 mb-4 p-3 rounded-xl bg-red-500/5 border border-red-500/10">
          <div className="flex items-start gap-2">
            <XCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
            <p className="text-sm text-red-300/80">
              {trade.rejectedBy === 'admin' ? '(Admin) ' : '(Team) '}{trade.rejectionReason}
            </p>
          </div>
        </div>
      )}
      {trade.status === 'cancelled' && trade.cancellationReason && (
        <div className="mx-4 sm:mx-5 mb-4 p-3 rounded-xl bg-orange-500/5 border border-orange-500/10">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-400 mt-0.5 shrink-0" />
            <p className="text-sm text-orange-300/80">{trade.cancellationReason}</p>
          </div>
        </div>
      )}
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
          <input type="text" value={rejectReason} onChange={(e) => onRejectReasonChange(e.target.value)}
            placeholder="Why is this trade being rejected?"
            className="w-full px-3 py-2 rounded-lg bg-slate-900/50 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
            autoFocus />
          <div className="flex gap-2 mt-2.5">
            <button onClick={() => onReject(trade._id)} disabled={actionLoading === `reject-${trade._id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all">
              {actionLoading === `reject-${trade._id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
              Confirm Reject
            </button>
            <button onClick={onCancelReject} className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all">Cancel</button>
          </div>
        </div>
      )}

      {/* Action Buttons — only for both_agreed (admin approve+execute) and pending/agreed (admin reject) */}
      {['pending_counterparty', 'both_agreed'].includes(trade.status) && !isRejecting && (
        <div className="px-4 sm:px-5 pb-4 flex flex-wrap gap-2">
          {trade.status === 'both_agreed' && isTradeWindowActive && (
            <button onClick={() => onApproveExecute(trade._id)} disabled={!!actionLoading}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-40">
              {actionLoading === `approve-${trade._id}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              Approve & Execute
            </button>
          )}
          <button onClick={() => onStartReject(trade._id)} disabled={!!actionLoading}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all disabled:opacity-40">
            <X className="w-3.5 h-3.5" /> Reject
          </button>
        </div>
      )}
    </div>
  );
}
