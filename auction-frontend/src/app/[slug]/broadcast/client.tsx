'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AuctionSocketProvider, useAuctionSocket } from '@/contexts/AuctionSocketContext';
import { PLAYER_ROLES } from '@/lib/constants';
import { Gavel, RotateCcw, Users, UserCheck, Clock } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';

export function BroadcastView({ auctionId, slug, auctionName }: { auctionId: string; slug: string; auctionName: string }) {
  return (
    <AuctionSocketProvider auctionId={auctionId}>
      <BroadcastContent auctionName={auctionName} />
    </AuctionSocketProvider>
  );
}

function formatCurrency(amount: number) {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  return `₹${amount.toLocaleString('en-IN')}`;
}

const RING_RADIUS = 42;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const PHASE_CONFIG: Record<string, { label: string; color: string; stroke: string }> = {
  revealed: { label: 'REVEALING', color: 'text-cyan-400', stroke: '#22d3ee' },
  open: { label: 'BIDDING', color: 'text-emerald-400', stroke: '#34d399' },
  going_once: { label: 'GOING ONCE', color: 'text-amber-400', stroke: '#fbbf24' },
  going_twice: { label: 'GOING TWICE', color: 'text-red-400', stroke: '#f87171' },
};

function BroadcastContent({ auctionName }: { auctionName: string }) {
  const { state, announcements } = useAuctionSocket();

  if (!state) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="w-16 h-16 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 text-sm">Connecting...</p>
        </div>
      </div>
    );
  }

  const isLive = state.status === 'live';
  const isPaused = state.status === 'paused';
  const isCompleted = ['completed', 'trade_window', 'finalized'].includes(state.status);
  const bidding = state.bidding;
  const currentTeam = bidding?.currentBidTeamId
    ? state.teams.find(t => t._id === bidding.currentBidTeamId)
    : null;

  return (
    <div className="min-h-screen bg-slate-950 overflow-hidden relative">
      {/* Ambient background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-amber-500/[0.03] blur-[120px] rounded-full" />
        {currentTeam && (
          <div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] blur-[100px] rounded-full transition-all duration-1000"
            style={{ background: `${currentTeam.primaryColor}10` }}
          />
        )}
      </div>

      {/* ─── Top Bar ─── */}
      <div className="relative z-10 px-8 py-4 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold text-white tracking-tight">{auctionName}</h1>
          {isLive && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/15 border border-red-500/20">
              <div className="relative w-2 h-2">
                <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-50" />
                <div className="relative w-2 h-2 rounded-full bg-red-500" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-red-400">Live</span>
            </div>
          )}
          {isPaused && (
            <div className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/20">
              <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-amber-400">Paused</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-5 text-xs">
          <span className="flex items-center gap-1.5 text-slate-500"><Clock className="w-3.5 h-3.5" /> Round {state.currentRound}</span>
          <span className="flex items-center gap-1.5 text-blue-400"><Users className="w-3.5 h-3.5" /> {state.stats.inPool} in pool</span>
          <span className="flex items-center gap-1.5 text-emerald-400"><UserCheck className="w-3.5 h-3.5" /> {state.stats.sold} sold</span>
        </div>
      </div>

      {/* ─── Announcement Overlay ─── */}
      <AnimatePresence>
        {announcements.length > 0 && (
          <motion.div
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }}
            className="absolute top-16 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl bg-amber-500/15 border border-amber-500/20 backdrop-blur-xl"
          >
            <p className="text-sm text-amber-200 font-medium">{announcements[0].message}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Main Content ─── */}
      <div className="relative z-10 flex flex-col items-center justify-center" style={{ minHeight: 'calc(100vh - 72px)' }}>

        {/* Waiting / Paused / Completed states */}
        {!isLive && !isPaused && !isCompleted && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full border-2 border-dashed border-slate-700 animate-spin" style={{ animationDuration: '15s' }} />
              <div className="absolute inset-4 rounded-full bg-slate-800/50 flex items-center justify-center">
                <span className="text-3xl">🏏</span>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Auction Starting Soon</h2>
            <p className="text-slate-500">Stay tuned...</p>
          </motion.div>
        )}

        {isPaused && !bidding && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
            <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }} className="text-6xl mb-4">⏸️</motion.div>
            <h2 className="text-3xl font-bold text-white">Auction Paused</h2>
          </motion.div>
        )}

        {isCompleted && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
            <div className="text-6xl mb-4">🏆</div>
            <h2 className="text-3xl font-bold text-white mb-2">Auction Complete</h2>
            <p className="text-lg text-slate-400">{state.stats.sold} players sold · {state.stats.unsold} unsold</p>
          </motion.div>
        )}

        {/* ─── Live Bidding ─── */}
        {(isLive || isPaused) && bidding && (
          <div className="w-full max-w-6xl mx-auto px-8">
            <div className="grid grid-cols-12 gap-8 items-start">

              {/* Left: Player info */}
              <div className="col-span-7">
                <AnimatePresence mode="wait">
                  {bidding.player ? (
                    <BroadcastPlayerCard
                      key={bidding.player._id}
                      player={bidding.player}
                      currentBid={bidding.currentBid}
                      basePrice={state.config.basePrice}
                      status={bidding.status}
                      soldTeam={currentTeam}
                      bidHistory={bidding.bidHistory}
                      teams={state.teams}
                    />
                  ) : (
                    <motion.div
                      key="waiting"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center py-20"
                    >
                      <div className="w-20 h-20 rounded-full border-2 border-dashed border-slate-700 animate-spin mx-auto mb-4" style={{ animationDuration: '8s' }} />
                      <p className="text-slate-500 text-lg">Next player coming up...</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Right: Timer + Teams */}
              <div className="col-span-5 space-y-6">
                {/* Timer */}
                {!['sold', 'unsold', 'waiting'].includes(bidding.status) && (
                  <BroadcastTimer expiresAt={bidding.timerExpiresAt} phase={bidding.status} />
                )}

                {/* Teams strip */}
                <div className="space-y-2">
                  {state.teams.map(team => {
                    const isHighest = team._id === bidding.currentBidTeamId;
                    const spentPct = team.purseValue > 0 ? ((team.purseValue - team.purseRemaining) / team.purseValue) * 100 : 0;

                    return (
                      <motion.div
                        key={team._id}
                        animate={isHighest ? { scale: [1, 1.02, 1] } : {}}
                        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all ${
                          isHighest
                            ? 'bg-amber-500/10 border-amber-500/30'
                            : 'bg-slate-800/20 border-white/5'
                        }`}
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
                          style={{ background: team.primaryColor, boxShadow: isHighest ? `0 0 12px ${team.primaryColor}50` : 'none' }}
                        >
                          {team.shortName}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-white truncate">{team.name}</span>
                            <span className="text-[11px] text-slate-400 tabular-nums ml-2">{formatCurrency(team.purseRemaining)}</span>
                          </div>
                          <div className="h-1 bg-slate-900/60 rounded-full overflow-hidden mt-1">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${100 - spentPct}%`, background: team.primaryColor }}
                            />
                          </div>
                        </div>
                        {isHighest && <Gavel className="w-4 h-4 text-amber-400 flex-shrink-0" />}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── Bottom Bar ─── */}
      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-white/5 bg-slate-950/80 backdrop-blur-xl px-8 py-2">
        <div className="flex items-center justify-between text-[11px] text-slate-600">
          <span>CricSmart Auction</span>
          <span>Powered by cricsmart.in</span>
        </div>
      </div>
    </div>
  );
}

function BroadcastPlayerCard({
  player,
  currentBid,
  basePrice,
  status,
  soldTeam,
  bidHistory,
  teams,
}: {
  player: any;
  currentBid: number;
  basePrice: number;
  status: string;
  soldTeam: any;
  bidHistory: any[];
  teams: any[];
}) {
  const roleConfig = PLAYER_ROLES[player.role as keyof typeof PLAYER_ROLES] || { label: player.role, icon: '🏏', color: 'text-slate-400' };
  const isSold = status === 'sold';
  const isUnsold = status === 'unsold';
  const isRevealed = status === 'revealed';
  const hasBids = currentBid > basePrice || (currentBid === basePrice && status !== 'revealed');
  const multiplier = basePrice > 0 ? (currentBid || basePrice) / basePrice : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ type: 'spring', damping: 20, stiffness: 180 }}
      className={`relative overflow-hidden rounded-3xl border ${
        isSold ? 'sold-glow border-emerald-500/30' :
        isUnsold ? 'unsold-glow border-orange-500/30' :
        'border-white/10'
      } bg-slate-800/40 backdrop-blur-xl`}
    >
      {/* Sold/Unsold banner */}
      <AnimatePresence>
        {isSold && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="bg-gradient-to-r from-emerald-600/25 via-emerald-500/15 to-emerald-600/25 border-b border-emerald-500/20 px-6 py-3 flex items-center justify-center gap-3"
          >
            <motion.div initial={{ rotate: -30, scale: 1.5 }} animate={{ rotate: 0, scale: 1 }} transition={{ type: 'spring', damping: 8 }}>
              <Gavel className="w-5 h-5 text-emerald-400" />
            </motion.div>
            <span className="text-lg font-bold uppercase tracking-[0.2em] text-emerald-400">Sold!</span>
          </motion.div>
        )}
        {isUnsold && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="bg-gradient-to-r from-orange-600/20 via-orange-500/10 to-orange-600/20 border-b border-orange-500/20 px-6 py-3 flex items-center justify-center gap-3"
          >
            <RotateCcw className="w-5 h-5 text-orange-400" />
            <span className="text-lg font-bold uppercase tracking-[0.2em] text-orange-400">Unsold</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Going once/twice banner */}
      {(status === 'going_once' || status === 'going_twice') && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`px-6 py-2.5 text-center font-bold uppercase tracking-[0.25em] text-sm border-b ${
            status === 'going_twice' ? 'bg-red-500/15 border-red-500/20 text-red-400' : 'bg-amber-500/15 border-amber-500/20 text-amber-400'
          }`}
        >
          <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 0.7, repeat: Infinity }}>
            {status === 'going_twice' ? '⚡ GOING TWICE ⚡' : '🔨 GOING ONCE'}
          </motion.span>
        </motion.div>
      )}

      <div className="p-8">
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <motion.div
            initial={isRevealed ? { scale: 0.5, opacity: 0 } : false}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: 'spring', damping: 15 }}
            className="w-28 h-28 rounded-2xl bg-gradient-to-br from-slate-700/80 to-slate-800/80 flex items-center justify-center border border-white/10 flex-shrink-0 relative overflow-hidden"
          >
            {player.imageUrl ? (
              <img src={player.imageUrl} alt={player.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-5xl">{roleConfig.icon}</span>
            )}
            <div className="absolute -top-1 -right-1 px-2 py-0.5 rounded-bl-lg bg-slate-900/90 border-l border-b border-white/10">
              <span className="text-[10px] font-bold text-slate-400">#{player.playerNumber}</span>
            </div>
          </motion.div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <motion.div initial={isRevealed ? { x: -15, opacity: 0 } : false} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.15 }}>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold ${roleConfig.color} bg-white/5 border border-white/5`}>
                {roleConfig.icon} {roleConfig.label}
              </span>
            </motion.div>

            <motion.h2
              initial={isRevealed ? { x: -15, opacity: 0 } : false}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-4xl font-extrabold text-white mt-2 mb-3 truncate"
            >
              {player.name}
            </motion.h2>

            {/* Bid amount */}
            {!isRevealed && (
              <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                <div className="text-[11px] text-slate-500 uppercase tracking-wider font-medium mb-1">
                  {isSold ? 'Sold For' : hasBids ? 'Current Bid' : 'Base Price'}
                </div>
                <div className="flex items-baseline gap-4">
                  <motion.span
                    key={currentBid}
                    initial={{ scale: 1.2, opacity: 0.5 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`text-5xl font-extrabold ${isSold ? 'text-emerald-400' : 'gradient-text-gold'}`}
                  >
                    {formatCurrency(currentBid || basePrice)}
                  </motion.span>
                  {hasBids && multiplier > 1 && (
                    <span className={`text-sm font-bold px-3 py-1 rounded-lg ${
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

            {isRevealed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="flex items-center gap-2">
                <span className="text-sm text-slate-500">Base Price</span>
                <span className="text-2xl font-bold text-amber-400">{formatCurrency(basePrice)}</span>
              </motion.div>
            )}

            {/* Sold to team */}
            {isSold && soldTeam && (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="flex items-center gap-3 mt-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-bold text-white shadow-lg"
                  style={{ background: soldTeam.primaryColor, boxShadow: `0 4px 15px ${soldTeam.primaryColor}50` }}
                >
                  {soldTeam.shortName}
                </div>
                <span className="text-base font-semibold text-white">{soldTeam.name}</span>
              </motion.div>
            )}
          </div>
        </div>

        {/* Bid history strip */}
        {bidHistory.length > 0 && !isRevealed && (
          <div className="mt-6 flex items-center gap-2 overflow-x-auto">
            {[...bidHistory].reverse().slice(0, 6).map((bid: any, idx: number) => {
              const team = teams.find((t: any) => t._id === bid.teamId);
              const isLatest = idx === 0;
              return (
                <motion.div
                  key={`${bid.teamId}-${bid.amount}-${idx}`}
                  initial={isLatest ? { scale: 0.8, opacity: 0 } : false}
                  animate={{ scale: 1, opacity: 1 }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl flex-shrink-0 ${
                    isLatest ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-slate-800/30'
                  }`}
                >
                  <div
                    className="w-5 h-5 rounded flex items-center justify-center text-[7px] font-bold text-white"
                    style={{ background: team?.primaryColor || '#64748b' }}
                  >
                    {team?.shortName?.charAt(0) || '?'}
                  </div>
                  <span className={`text-xs font-bold tabular-nums ${isLatest ? 'text-amber-400' : 'text-slate-500'}`}>
                    {formatCurrency(bid.amount)}
                  </span>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function BroadcastTimer({ expiresAt, phase }: { expiresAt: string | null; phase: string }) {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [progress, setProgress] = useState(1);
  const startTimeRef = useRef<number | null>(null);
  const totalRef = useRef<number>(30);

  useEffect(() => {
    if (!expiresAt) { setSecondsLeft(0); setProgress(0); return; }
    const expiresMs = new Date(expiresAt).getTime();
    if (!startTimeRef.current) {
      const total = Math.max(1, Math.ceil((expiresMs - Date.now()) / 1000));
      totalRef.current = total;
      startTimeRef.current = expiresMs - total * 1000;
    }
    const update = () => {
      const remaining = Math.max(0, (expiresMs - Date.now()) / 1000);
      setSecondsLeft(Math.ceil(remaining));
      setProgress(totalRef.current > 0 ? remaining / totalRef.current : 0);
    };
    update();
    const interval = setInterval(update, 50);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const config = PHASE_CONFIG[phase] || { label: phase.toUpperCase(), color: 'text-slate-400', stroke: '#94a3b8' };
  const isUrgent = phase === 'going_twice' || (phase === 'going_once' && secondsLeft <= 2);
  const strokeDashoffset = RING_CIRCUMFERENCE * (1 - progress);

  return (
    <div className="flex flex-col items-center gap-3">
      <motion.div
        key={phase}
        initial={{ y: -5, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`text-xs font-bold uppercase tracking-[0.3em] ${config.color} ${isUrgent ? 'animate-pulse' : ''}`}
      >
        {config.label}
      </motion.div>

      <div className={`relative w-36 h-36 ${isUrgent ? 'timer-urgent rounded-full' : ''}`}>
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-slate-800/30 to-slate-900/30" />
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={RING_RADIUS} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="3" />
          <circle
            cx="50" cy="50" r={RING_RADIUS} fill="none" stroke={config.stroke} strokeWidth="3.5" strokeLinecap="round"
            strokeDasharray={RING_CIRCUMFERENCE} strokeDashoffset={strokeDashoffset}
            style={{ transition: 'stroke-dashoffset 0.15s linear' }} opacity={0.85}
          />
          <circle
            cx="50" cy="50" r={RING_RADIUS} fill="none" stroke={config.stroke} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={RING_CIRCUMFERENCE} strokeDashoffset={strokeDashoffset}
            style={{ transition: 'stroke-dashoffset 0.15s linear', filter: 'blur(8px)' }} opacity={0.25}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            key={secondsLeft}
            initial={isUrgent ? { scale: 1.3 } : false}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 12, stiffness: 300 }}
            className={`text-5xl font-extrabold font-mono ${config.color} tabular-nums`}
          >
            {String(secondsLeft).padStart(2, '0')}
          </motion.span>
        </div>
      </div>
    </div>
  );
}
