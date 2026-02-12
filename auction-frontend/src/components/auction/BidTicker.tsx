'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { BidEntry, TeamInfo } from '@/contexts/AuctionSocketContext';
import { TrendingUp } from 'lucide-react';

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
      <div className="text-center py-6">
        <div className="w-10 h-10 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto mb-2.5">
          <TrendingUp className="w-4 h-4 text-slate-600" />
        </div>
        <p className="text-xs text-slate-500">Bids will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5 max-h-[280px] overflow-y-auto">
      <AnimatePresence initial={false}>
        {recentBids.map((bid, idx) => {
          const team = teams.find(t => t._id === bid.teamId);
          const isLatest = idx === 0;
          const teamColor = team?.primaryColor || '#64748b';

          return (
            <motion.div
              key={`${bid.teamId}-${bid.amount}-${bid.timestamp}`}
              initial={{ opacity: 0, x: -20, height: 0 }}
              animate={{ opacity: 1, x: 0, height: 'auto' }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors ${
                isLatest
                  ? 'bg-gradient-to-r from-amber-500/10 to-orange-500/5 border border-amber-500/20'
                  : 'bg-slate-800/20 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0 ${isLatest ? 'ring-2 ring-amber-400/40' : ''}`}
                    style={{ background: teamColor }}
                  >
                    {team?.shortName || '?'}
                  </div>
                  {isLatest && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-500 flex items-center justify-center"
                    >
                      <span className="text-[7px] font-bold text-white">1</span>
                    </motion.div>
                  )}
                </div>
                <div className="min-w-0">
                  <span className={`text-sm font-semibold ${isLatest ? 'text-white' : 'text-slate-400'} truncate block`}>
                    {team?.name || 'Unknown'}
                  </span>
                </div>
              </div>
              <motion.span
                key={bid.amount}
                initial={isLatest ? { scale: 1.1 } : false}
                animate={{ scale: 1 }}
                className={`text-sm font-bold tabular-nums flex-shrink-0 ${
                  isLatest ? 'gradient-text-gold' : 'text-slate-500'
                }`}
              >
                {formatCurrency(bid.amount)}
              </motion.span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
