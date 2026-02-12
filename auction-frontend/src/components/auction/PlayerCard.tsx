'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { BiddingPlayer } from '@/contexts/AuctionSocketContext';
import { PLAYER_ROLES } from '@/lib/constants';
import { Gavel, RotateCcw } from 'lucide-react';

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
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="glass-card p-8 sm:p-14 text-center"
      >
        <div className="relative w-20 h-20 mx-auto mb-5">
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-slate-700 animate-spin" style={{ animationDuration: '8s' }} />
          <div className="absolute inset-2 rounded-full bg-slate-800/50 flex items-center justify-center">
            <span className="text-3xl">🏏</span>
          </div>
        </div>
        <p className="text-slate-400 text-sm font-medium">Waiting for next player...</p>
        <div className="flex justify-center gap-1 mt-3">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-amber-500/50"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </div>
      </motion.div>
    );
  }

  const roleConfig = PLAYER_ROLES[player.role as keyof typeof PLAYER_ROLES] || { label: player.role, icon: '🏏', color: 'text-slate-400' };
  const isSold = status === 'sold';
  const isUnsold = status === 'unsold';
  const isRevealed = status === 'revealed';
  const isGoingOnce = status === 'going_once';
  const isGoingTwice = status === 'going_twice';
  const hasBids = currentBid > basePrice || (currentBid === basePrice && status !== 'revealed');
  const multiplier = basePrice > 0 ? (currentBid || basePrice) / basePrice : 0;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={player._id + status}
        initial={isRevealed ? { opacity: 0, scale: 0.9, y: 20 } : false}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 200 }}
        className={`glass-card overflow-hidden relative ${
          isSold ? 'sold-glow ring-1 ring-emerald-500/40' :
          isUnsold ? 'unsold-glow ring-1 ring-orange-500/40' :
          isGoingTwice ? 'timer-urgent ring-1 ring-red-500/30' :
          isGoingOnce ? 'ring-1 ring-amber-500/30' : ''
        }`}
      >
        {/* Ambient glow behind card */}
        {isSold && soldTeam && (
          <div
            className="absolute inset-0 opacity-10 blur-3xl"
            style={{ background: `radial-gradient(ellipse at center, ${soldTeam.primaryColor}, transparent 70%)` }}
          />
        )}

        {/* SOLD / UNSOLD overlay banner */}
        <AnimatePresence>
          {isSold && (
            <motion.div
              initial={{ y: -40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="relative bg-gradient-to-r from-emerald-600/30 via-emerald-500/20 to-emerald-600/30 border-b border-emerald-500/20 px-4 py-2.5 flex items-center justify-center gap-2"
            >
              <motion.div
                initial={{ rotate: -30, scale: 1.3 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: 'spring', damping: 10 }}
              >
                <Gavel className="w-4 h-4 text-emerald-400" />
              </motion.div>
              <span className="text-sm font-bold uppercase tracking-[0.15em] text-emerald-400">Sold!</span>
            </motion.div>
          )}
          {isUnsold && (
            <motion.div
              initial={{ y: -40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="relative bg-gradient-to-r from-orange-600/20 via-orange-500/15 to-orange-600/20 border-b border-orange-500/20 px-4 py-2.5 flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4 text-orange-400" />
              <span className="text-sm font-bold uppercase tracking-[0.15em] text-orange-400">Unsold</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Going Once / Going Twice phase indicator */}
        {(isGoingOnce || isGoingTwice) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`px-4 py-2 text-center font-bold uppercase tracking-[0.2em] text-xs border-b ${
              isGoingTwice
                ? 'bg-red-500/15 border-red-500/20 text-red-400'
                : 'bg-amber-500/15 border-amber-500/20 text-amber-400'
            }`}
          >
            <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 0.8, repeat: Infinity }}>
              {isGoingTwice ? '⚡ GOING TWICE ⚡' : '🔨 GOING ONCE'}
            </motion.span>
          </motion.div>
        )}

        <div className={`relative ${compact ? 'p-4' : 'p-5 sm:p-7'}`}>
          <div className="flex items-start gap-4 sm:gap-5">
            {/* Player avatar */}
            <motion.div
              initial={isRevealed ? { scale: 0.5, opacity: 0 } : false}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: 'spring', damping: 15 }}
              className={`${compact ? 'w-16 h-16' : 'w-20 h-20 sm:w-24 sm:h-24'} rounded-2xl flex-shrink-0 relative`}
            >
              <div className={`w-full h-full rounded-2xl bg-gradient-to-br from-slate-700/80 to-slate-800/80 flex items-center justify-center border ${
                isSold ? 'border-emerald-500/30' : isUnsold ? 'border-orange-500/30' : 'border-white/10'
              } overflow-hidden`}>
                {player.imageUrl ? (
                  <img src={player.imageUrl} alt={player.name} className="w-full h-full object-cover" />
                ) : (
                  <span className={`${compact ? 'text-2xl' : 'text-3xl sm:text-4xl'}`}>{roleConfig.icon}</span>
                )}
              </div>
              {/* Player number badge */}
              <div className="absolute -top-1.5 -right-1.5 w-7 h-7 rounded-lg bg-slate-900 border border-white/10 flex items-center justify-center">
                <span className="text-[10px] font-bold text-slate-400">#{player.playerNumber}</span>
              </div>
            </motion.div>

            {/* Player info */}
            <div className="flex-1 min-w-0">
              <motion.div
                initial={isRevealed ? { x: -10, opacity: 0 } : false}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.15 }}
              >
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold ${roleConfig.color} bg-white/5 border border-white/5`}>
                  {roleConfig.icon} {roleConfig.label}
                </span>
              </motion.div>

              <motion.h2
                initial={isRevealed ? { x: -10, opacity: 0 } : false}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className={`${compact ? 'text-xl' : 'text-2xl sm:text-3xl'} font-bold text-white mt-1.5 mb-1 truncate`}
              >
                {player.name}
              </motion.h2>

              {/* Bid amount */}
              {!isRevealed && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2"
                >
                  <div className="text-[11px] text-slate-500 uppercase tracking-wider font-medium mb-0.5">
                    {isSold ? 'Sold For' : hasBids ? 'Current Bid' : 'Base Price'}
                  </div>
                  <div className="flex items-baseline gap-3">
                    <motion.span
                      key={currentBid}
                      initial={{ scale: 1.15, opacity: 0.5 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className={`${compact ? 'text-2xl' : 'text-3xl sm:text-4xl'} font-extrabold ${
                        isSold ? 'text-emerald-400' : 'gradient-text-gold'
                      }`}
                    >
                      {formatCurrency(currentBid || basePrice)}
                    </motion.span>
                    {hasBids && multiplier > 1 && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                        multiplier >= 5 ? 'bg-red-500/20 text-red-400' :
                        multiplier >= 3 ? 'bg-amber-500/20 text-amber-400' :
                        'bg-slate-700/50 text-slate-400'
                      }`}>
                        {multiplier.toFixed(1)}×
                      </span>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Revealed — show base price label */}
              {isRevealed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mt-2 flex items-center gap-2"
                >
                  <span className="text-xs text-slate-500">Base Price</span>
                  <span className="text-lg font-bold text-amber-400">{formatCurrency(basePrice)}</span>
                </motion.div>
              )}

              {/* Sold to team */}
              {isSold && soldTeam && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center gap-2.5 mt-3"
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-[10px] font-bold text-white shadow-lg"
                    style={{ background: soldTeam.primaryColor, boxShadow: `0 4px 15px ${soldTeam.primaryColor}40` }}
                  >
                    {soldTeam.shortName}
                  </div>
                  <span className="text-sm font-semibold text-white">{soldTeam.name}</span>
                </motion.div>
              )}
            </div>
          </div>

          {/* Bid multiplier progress */}
          {!isRevealed && !compact && basePrice > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-5">
              <div className="h-1.5 bg-slate-800/80 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-red-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (multiplier / 10) * 100)}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 mt-1.5">
                <span>Base: {formatCurrency(basePrice)}</span>
                <span>10× = {formatCurrency(basePrice * 10)}</span>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
