'use client';

import { BiddingPlayer } from '@/contexts/AuctionSocketContext';
import { PLAYER_ROLES } from '@/lib/constants';

interface PlayerCardProps {
  player: BiddingPlayer | null;
  currentBid: number;
  basePrice: number;
  status: string;
  soldTeam?: { name: string; shortName: string; primaryColor: string } | null;
  compact?: boolean;
}

function formatCurrency(amount: number) {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  return `₹${amount.toLocaleString('en-IN')}`;
}

export default function PlayerCard({ player, currentBid, basePrice, status, soldTeam, compact }: PlayerCardProps) {
  if (!player) {
    return (
      <div className="glass-card p-8 sm:p-12 text-center">
        <div className="text-4xl mb-3">🏏</div>
        <p className="text-slate-400">Waiting for next player...</p>
      </div>
    );
  }

  const roleConfig = PLAYER_ROLES[player.role as keyof typeof PLAYER_ROLES] || { label: player.role, icon: '🏏', color: 'text-slate-400' };
  const isSold = status === 'sold';
  const isUnsold = status === 'unsold';
  const isRevealed = status === 'revealed';
  const hasBids = currentBid > basePrice || (currentBid === basePrice && status !== 'revealed');

  return (
    <div className={`glass-card overflow-hidden ${isSold ? 'ring-2 ring-emerald-500/50' : isUnsold ? 'ring-2 ring-orange-500/50' : ''}`}>
      {/* Status banner */}
      {(isSold || isUnsold) && (
        <div className={`px-4 py-2 text-center text-sm font-bold uppercase tracking-wider ${
          isSold ? 'bg-emerald-500/20 text-emerald-400' : 'bg-orange-500/20 text-orange-400'
        }`}>
          {isSold ? '✅ SOLD!' : '↩️ UNSOLD'}
        </div>
      )}

      <div className={`${compact ? 'p-4' : 'p-5 sm:p-8'}`}>
        <div className="flex items-start gap-4 sm:gap-6">
          {/* Player avatar */}
          <div className={`${compact ? 'w-16 h-16' : 'w-20 h-20 sm:w-24 sm:h-24'} rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center flex-shrink-0 ${isRevealed ? 'animate-pulse' : ''}`}>
            {player.imageUrl ? (
              <img src={player.imageUrl} alt={player.name} className="w-full h-full object-cover rounded-2xl" />
            ) : (
              <span className={`${compact ? 'text-2xl' : 'text-3xl sm:text-4xl'}`}>{roleConfig.icon}</span>
            )}
          </div>

          {/* Player info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-slate-500 font-mono">#{player.playerNumber}</span>
              <span className={`badge ${roleConfig.color} bg-white/5 text-[11px]`}>
                {roleConfig.icon} {roleConfig.label}
              </span>
            </div>
            <h2 className={`${compact ? 'text-xl' : 'text-2xl sm:text-3xl'} font-bold text-white mb-2 truncate`}>
              {player.name}
            </h2>

            {/* Bid amount */}
            {!isRevealed && (
              <div className="space-y-1">
                <div className="text-xs text-slate-400">
                  {hasBids ? 'Current Bid' : 'Base Price'}
                </div>
                <div className={`${compact ? 'text-2xl' : 'text-3xl sm:text-4xl'} font-bold gradient-text-amber`}>
                  {formatCurrency(currentBid || basePrice)}
                </div>
              </div>
            )}

            {/* Sold to team */}
            {isSold && soldTeam && (
              <div className="flex items-center gap-2 mt-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: soldTeam.primaryColor }}
                >
                  {soldTeam.shortName}
                </div>
                <span className="text-sm font-medium text-white">{soldTeam.name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Bid progress bar */}
        {!isRevealed && !compact && basePrice > 0 && (
          <div className="mt-4">
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, ((currentBid || basePrice) / (basePrice * 10)) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>Base: {formatCurrency(basePrice)}</span>
              {hasBids && <span>{((currentBid || basePrice) / basePrice).toFixed(1)}× base</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
