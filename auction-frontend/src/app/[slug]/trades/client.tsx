'use client';

import { useState, useEffect } from 'react';
import {
  ArrowLeftRight, Clock, ArrowRight, Users, Trophy,
  IndianRupee, ChevronDown, ChevronUp,
} from 'lucide-react';

interface TradePlayer {
  playerId: string;
  name: string;
  role?: string;
  soldAmount?: number;
}

interface Trade {
  _id: string;
  initiatorTeam: { name: string; shortName?: string; primaryColor?: string };
  counterpartyTeam: { name: string; shortName?: string; primaryColor?: string };
  initiatorPlayers: TradePlayer[];
  counterpartyPlayers: TradePlayer[];
  initiatorTotalValue: number;
  counterpartyTotalValue: number;
  settlementAmount: number;
  settlementDirection: 'initiator_pays' | 'counterparty_pays' | 'even';
  purseSettlementEnabled: boolean;
  executedAt: string;
  publicAnnouncement?: string;
}

function formatCurrency(v: number) {
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)}Cr`;
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(0)}K`;
  return `₹${v}`;
}

export function TradesClient({ trades, isTradeWindow, tradeWindowEndsAt, slug }: {
  trades: Trade[];
  isTradeWindow: boolean;
  tradeWindowEndsAt?: string;
  slug: string;
}) {
  const [timeLeft, setTimeLeft] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!tradeWindowEndsAt) return;
    const update = () => {
      const diff = new Date(tradeWindowEndsAt).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft('Expired'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(h > 0 ? `${h}h ${m}m ${s}s` : m > 0 ? `${m}m ${s}s` : `${s}s`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [tradeWindowEndsAt]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
            Player Trades
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            {trades.length === 0
              ? 'No trades have been executed yet'
              : `${trades.length} trade${trades.length !== 1 ? 's' : ''} executed`}
          </p>
        </div>

        {isTradeWindow && tradeWindowEndsAt && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-500/10 border border-purple-500/15">
            <Clock className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-purple-400/80">Trade window closes in</span>
            <span className="font-mono text-sm font-bold tabular-nums text-purple-300">{timeLeft}</span>
          </div>
        )}
      </div>

      {/* Trade List */}
      {trades.length === 0 ? (
        <div className="glass-card p-12 sm:p-16 text-center">
          <ArrowLeftRight className="w-12 h-12 text-slate-700 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">No Trades Yet</h3>
          <p className="text-sm text-slate-400 max-w-sm mx-auto">
            {isTradeWindow
              ? 'The trade window is open. Executed trades will appear here.'
              : 'No player trades were executed in this auction.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {trades.map((trade, idx) => (
            <TradeCard
              key={trade._id}
              trade={trade}
              index={idx}
              isExpanded={expandedId === trade._id}
              onToggle={() => setExpandedId(expandedId === trade._id ? null : trade._id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TradeCard({ trade, index, isExpanded, onToggle }: {
  trade: Trade;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const initColor = trade.initiatorTeam.primaryColor || '#6366f1';
  const counterColor = trade.counterpartyTeam.primaryColor || '#8b5cf6';

  return (
    <div className="glass-card overflow-hidden">
      {/* Summary row */}
      <button
        onClick={onToggle}
        className="w-full px-4 sm:px-5 py-4 flex items-center gap-3 sm:gap-4 hover:bg-white/[0.02] transition-colors text-left"
      >
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-emerald-500/10 flex items-center justify-center">
          <span className="text-xs font-bold text-emerald-400">#{index + 1}</span>
        </div>

        <div className="flex-1 min-w-0 flex items-center gap-2 sm:gap-3">
          {/* Initiator team */}
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: initColor }} />
            <span className="text-sm font-semibold text-white truncate">
              {trade.initiatorTeam.shortName || trade.initiatorTeam.name}
            </span>
            <span className="text-[10px] text-slate-500 flex-shrink-0">
              ({trade.initiatorPlayers.length}P)
            </span>
          </div>

          <ArrowLeftRight className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />

          {/* Counterparty team */}
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: counterColor }} />
            <span className="text-sm font-semibold text-white truncate">
              {trade.counterpartyTeam.shortName || trade.counterpartyTeam.name}
            </span>
            <span className="text-[10px] text-slate-500 flex-shrink-0">
              ({trade.counterpartyPlayers.length}P)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[10px] text-slate-600 hidden sm:inline">
            {new Date(trade.executedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          )}
        </div>
      </button>

      {/* Expanded detail */}
      {isExpanded && (
        <div className="px-4 sm:px-5 pb-4 sm:pb-5 border-t border-white/5">
          {trade.publicAnnouncement && (
            <p className="text-xs text-slate-400 italic mt-3 mb-4 px-3 py-2 rounded-lg bg-slate-800/30">
              {trade.publicAnnouncement}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
            {/* Initiator side */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: initColor }} />
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {trade.initiatorTeam.name}
                </h4>
                <ArrowRight className="w-3 h-3 text-slate-600" />
              </div>
              <div className="space-y-1.5">
                {trade.initiatorPlayers.map(p => (
                  <div key={p.playerId} className="flex items-center justify-between p-2 rounded-lg bg-slate-800/30">
                    <div>
                      <span className="text-sm text-white">{p.name}</span>
                      {p.role && <span className="text-[10px] text-slate-500 ml-1.5">{p.role}</span>}
                    </div>
                    {p.soldAmount ? (
                      <span className="text-xs text-slate-400 font-mono">{formatCurrency(p.soldAmount)}</span>
                    ) : null}
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-1.5">
                Total value: <span className="text-white font-mono">{formatCurrency(trade.initiatorTotalValue)}</span>
              </p>
            </div>

            {/* Counterparty side */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: counterColor }} />
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {trade.counterpartyTeam.name}
                </h4>
                <ArrowRight className="w-3 h-3 text-slate-600" />
              </div>
              <div className="space-y-1.5">
                {trade.counterpartyPlayers.map(p => (
                  <div key={p.playerId} className="flex items-center justify-between p-2 rounded-lg bg-slate-800/30">
                    <div>
                      <span className="text-sm text-white">{p.name}</span>
                      {p.role && <span className="text-[10px] text-slate-500 ml-1.5">{p.role}</span>}
                    </div>
                    {p.soldAmount ? (
                      <span className="text-xs text-slate-400 font-mono">{formatCurrency(p.soldAmount)}</span>
                    ) : null}
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-1.5">
                Total value: <span className="text-white font-mono">{formatCurrency(trade.counterpartyTotalValue)}</span>
              </p>
            </div>
          </div>

          {/* Financial Settlement */}
          {trade.purseSettlementEnabled && trade.settlementAmount > 0 && (
            <div className="mt-4 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 flex items-center gap-2">
              <IndianRupee className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs text-slate-400">
                Purse settlement: <span className="text-amber-300 font-semibold">{formatCurrency(trade.settlementAmount)}</span>
                {' '}
                {trade.settlementDirection === 'initiator_pays'
                  ? `(${trade.initiatorTeam.shortName || trade.initiatorTeam.name} pays)`
                  : trade.settlementDirection === 'counterparty_pays'
                  ? `(${trade.counterpartyTeam.shortName || trade.counterpartyTeam.name} pays)`
                  : '(even)'}
              </span>
            </div>
          )}

          {/* Timestamp */}
          <p className="text-[10px] text-slate-600 mt-3">
            Executed on {new Date(trade.executedAt).toLocaleString('en-IN', {
              day: 'numeric', month: 'short', year: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })}
          </p>
        </div>
      )}
    </div>
  );
}
