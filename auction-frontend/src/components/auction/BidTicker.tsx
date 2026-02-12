'use client';

import { BidEntry, TeamInfo } from '@/contexts/AuctionSocketContext';

interface BidTickerProps {
  bidHistory: BidEntry[];
  teams: TeamInfo[];
  maxItems?: number;
}

function formatCurrency(amount: number) {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  return `₹${amount.toLocaleString('en-IN')}`;
}

export default function BidTicker({ bidHistory, teams, maxItems = 10 }: BidTickerProps) {
  const recentBids = [...bidHistory].reverse().slice(0, maxItems);

  if (recentBids.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-slate-500">No bids yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {recentBids.map((bid, idx) => {
        const team = teams.find(t => t._id === bid.teamId);
        const isLatest = idx === 0;
        return (
          <div
            key={`${bid.teamId}-${bid.amount}-${idx}`}
            className={`flex items-center justify-between px-3 py-2 rounded-xl transition-all ${
              isLatest
                ? 'bg-amber-500/10 border border-amber-500/20'
                : 'bg-slate-800/30 border border-white/5'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
                style={{ background: team?.primaryColor || '#64748b' }}
              >
                {team?.shortName?.charAt(0) || '?'}
              </div>
              <div>
                <span className={`text-sm font-medium ${isLatest ? 'text-white' : 'text-slate-300'}`}>
                  {team?.shortName || 'Unknown'}
                </span>
                {isLatest && (
                  <span className="ml-2 text-[10px] text-amber-400 font-semibold uppercase">Highest</span>
                )}
              </div>
            </div>
            <span className={`text-sm font-bold ${isLatest ? 'gradient-text-amber' : 'text-slate-400'}`}>
              {formatCurrency(bid.amount)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
