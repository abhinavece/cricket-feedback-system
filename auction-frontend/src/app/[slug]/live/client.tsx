'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AuctionSocketProvider, useAuctionSocket } from '@/contexts/AuctionSocketContext';
import PlayerCard from '@/components/auction/PlayerCard';
import Timer from '@/components/auction/Timer';
import BidTicker from '@/components/auction/BidTicker';
import TeamPanel from '@/components/auction/TeamPanel';
import {
  Wifi, WifiOff, Radio, Users, UserCheck, Trophy, Clock,
  CircleDot, TrendingUp, BarChart3, Pause, ArrowLeftRight, Lock,
} from 'lucide-react';

export function SpectatorLiveView({ auctionId, slug }: { auctionId: string; slug: string }) {
  return (
    <AuctionSocketProvider auctionId={auctionId}>
      <SpectatorContent slug={slug} />
    </AuctionSocketProvider>
  );
}

function SpectatorContent({ slug }: { slug: string }) {
  const { state, connectionStatus, announcements } = useAuctionSocket();

  if (!state) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-14 text-center max-w-md mx-auto"
        >
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-2 border-amber-500/30 border-t-amber-500 animate-spin" />
            <div className="absolute inset-2 rounded-full bg-slate-800/50 flex items-center justify-center">
              <CircleDot className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <p className="text-slate-400 text-sm">
            {connectionStatus === 'error' ? 'Connection lost. Retrying...' : 'Connecting to auction...'}
          </p>
        </motion.div>
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
  const totalPlayers = state.stats.totalPlayers || (state.stats.inPool + state.stats.sold + state.stats.unsold);
  const progressPct = totalPlayers > 0 ? ((state.stats.sold + state.stats.unsold) / totalPlayers) * 100 : 0;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
      {/* ─── Live Status Bar ─── */}
      <div className="glass-card px-4 py-2.5 mb-4 sm:mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Live indicator */}
          {isLive ? (
            <div className="flex items-center gap-2">
              <div className="relative w-2.5 h-2.5">
                <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-50" />
                <div className="relative w-2.5 h-2.5 rounded-full bg-red-500" />
              </div>
              <span className="text-xs font-bold uppercase tracking-[0.15em] text-red-400">Live</span>
            </div>
          ) : isPaused ? (
            <div className="flex items-center gap-2">
              <Pause className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-bold uppercase tracking-[0.15em] text-amber-400">Paused</span>
            </div>
          ) : state.status === 'trade_window' ? (
            <div className="flex items-center gap-2">
              <ArrowLeftRight className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-xs font-bold uppercase tracking-[0.15em] text-purple-400">Trading</span>
            </div>
          ) : state.status === 'finalized' ? (
            <div className="flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-slate-300" />
              <span className="text-xs font-bold uppercase tracking-[0.15em] text-slate-300">Finalized</span>
            </div>
          ) : isCompleted ? (
            <div className="flex items-center gap-2">
              <Trophy className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-[0.15em] text-emerald-400">Completed</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-slate-500">
              <CircleDot className="w-3.5 h-3.5" />
              <span className="text-xs font-bold uppercase tracking-[0.15em]">Waiting</span>
            </div>
          )}

          {/* Connection dot */}
          <div className={`w-1.5 h-1.5 rounded-full ${connectionStatus === 'connected' ? 'bg-emerald-500' : 'bg-orange-500 animate-pulse'}`} />
        </div>

        {/* Stats pills */}
        <div className="flex items-center gap-2 sm:gap-3">
          <StatPill icon={<Clock className="w-3 h-3" />} label="R" value={String(state.currentRound)} />
          <StatPill icon={<Users className="w-3 h-3" />} label="" value={String(state.stats.inPool)} color="text-blue-400" />
          <StatPill icon={<UserCheck className="w-3 h-3" />} label="" value={String(state.stats.sold)} color="text-emerald-400" />
        </div>
      </div>

      {/* ─── Auction Progress Bar ─── */}
      {(isLive || isPaused) && (
        <div className="mb-4 sm:mb-6">
          <div className="h-1 bg-slate-800/60 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-600 mt-1 px-0.5">
            <span>{state.stats.sold + state.stats.unsold} of {totalPlayers} players</span>
            <span>{Math.round(progressPct)}%</span>
          </div>
        </div>
      )}

      {/* ─── Announcements ─── */}
      <AnimatePresence>
        {announcements.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className="mb-4 sm:mb-6"
          >
            <div className="px-4 py-3 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-orange-500/10 border border-amber-500/15">
              <div className="flex items-center gap-2.5">
                <Radio className="w-4 h-4 text-amber-400 flex-shrink-0 animate-pulse" />
                <p className="text-sm text-amber-200/90 font-medium">{announcements[0].message}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Paused State ─── */}
      {isPaused && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-8 sm:p-14 text-center mb-6 border-amber-500/10"
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-5"
          >
            <Pause className="w-7 h-7 text-amber-400" />
          </motion.div>
          <h2 className="text-2xl font-bold text-white mb-2">Auction Paused</h2>
          <p className="text-slate-400 text-sm">The auction will resume shortly. Stay tuned!</p>
        </motion.div>
      )}

      {/* ─── Completed / Trade Window / Finalized State ─── */}
      {isCompleted && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`glass-card p-8 sm:p-14 text-center mb-6 ${
            state.status === 'trade_window' ? 'border-purple-500/10' :
            state.status === 'finalized' ? 'border-slate-500/10' :
            'border-emerald-500/10'
          }`}
        >
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 ${
            state.status === 'trade_window' ? 'bg-purple-500/10' :
            state.status === 'finalized' ? 'bg-slate-500/10' :
            'bg-emerald-500/10'
          }`}>
            {state.status === 'trade_window' ? (
              <ArrowLeftRight className="w-7 h-7 text-purple-400" />
            ) : state.status === 'finalized' ? (
              <Lock className="w-7 h-7 text-slate-300" />
            ) : (
              <Trophy className="w-7 h-7 text-emerald-400" />
            )}
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {state.status === 'trade_window' ? 'Trade Window Open' :
             state.status === 'finalized' ? 'Auction Finalized' :
             'Auction Completed'}
          </h2>
          <p className="text-slate-400 text-sm mb-6">
            {state.stats.sold} players sold · {state.stats.unsold} unsold
            {state.status === 'trade_window' && ' · Teams are proposing trades'}
            {state.status === 'finalized' && ' · Results are permanent'}
          </p>
          <a href={`/${slug}/analytics`} className="btn-primary">
            <BarChart3 className="w-4 h-4" /> View Analytics
          </a>
        </motion.div>
      )}

      {/* ─── Not Yet Live ─── */}
      {!isLive && !isPaused && !isCompleted && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card p-8 sm:p-14 text-center mb-6"
        >
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-slate-700 animate-spin" style={{ animationDuration: '12s' }} />
            <div className="absolute inset-3 rounded-full bg-slate-800/50 flex items-center justify-center">
              <Radio className="w-6 h-6 text-slate-500" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Waiting to Go Live</h2>
          <p className="text-sm text-slate-400 max-w-sm mx-auto">
            The auction hasn&apos;t started yet. This page will update automatically when it goes live.
          </p>
          <div className="flex justify-center gap-1 mt-5">
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-slate-600"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* ─── Live Bidding View ─── */}
      {isLive && bidding && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
          {/* Main content — player + timer */}
          <div className="lg:col-span-8 space-y-4 sm:space-y-6">
            {/* Player card + timer */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start">
              <div className="flex-1 w-full">
                <PlayerCard
                  player={bidding.player}
                  currentBid={bidding.currentBid}
                  basePrice={state.config.basePrice}
                  status={bidding.status}
                  soldTeam={currentTeam ? { name: currentTeam.name, shortName: currentTeam.shortName, primaryColor: currentTeam.primaryColor } : null}
                  playerFields={state.playerFields}
                />
              </div>
              {!['sold', 'unsold', 'waiting'].includes(bidding.status) && (
                <div className="flex-shrink-0 self-center sm:self-start">
                  <Timer
                    expiresAt={bidding.timerExpiresAt}
                    phase={bidding.status}
                  />
                </div>
              )}
            </div>

            {/* Teams grid */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-4 rounded-full bg-gradient-to-b from-amber-500 to-orange-500" />
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.15em]">Teams</h3>
              </div>
              <TeamPanel
                teams={state.teams}
                currentBidTeamId={bidding.currentBidTeamId}
              />
            </div>
          </div>

          {/* Sidebar — bid ticker + stats */}
          <div className="lg:col-span-4 space-y-4 sm:space-y-6">
            {/* Bid history */}
            <div className="glass-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.15em]">Bid History</h3>
                {bidding.bidHistory.length > 0 && (
                  <span className="ml-auto text-[10px] text-slate-600 tabular-nums">{bidding.bidHistory.length} bids</span>
                )}
              </div>
              <BidTicker
                bidHistory={bidding.bidHistory}
                teams={state.teams}
              />
            </div>

            {/* Quick stats */}
            <div className="glass-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="w-3.5 h-3.5 text-slate-500" />
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.15em]">Auction Stats</h3>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <StatCard label="Round" value={String(state.currentRound)} icon={<Clock className="w-3.5 h-3.5" />} color="text-cyan-400" />
                <StatCard label="In Pool" value={String(state.stats.inPool)} icon={<Users className="w-3.5 h-3.5" />} color="text-blue-400" />
                <StatCard label="Sold" value={String(state.stats.sold)} icon={<UserCheck className="w-3.5 h-3.5" />} color="text-emerald-400" />
                <StatCard label="Unsold" value={String(state.stats.unsold)} icon={<span className="text-[10px]">↩️</span>} color="text-orange-400" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatPill({ icon, label, value, color = 'text-slate-400' }: { icon: React.ReactNode; label: string; value: string; color?: string }) {
  return (
    <div className={`flex items-center gap-1 ${color}`}>
      {icon}
      <span className="text-[11px] font-bold tabular-nums">
        {label && <span className="text-slate-600 mr-0.5">{label}</span>}
        {value}
      </span>
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="p-3 rounded-xl bg-slate-800/30 border border-white/5">
      <div className={`flex items-center gap-1.5 mb-1.5 ${color}`}>
        {icon}
        <span className="text-[10px] font-medium uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-xl font-extrabold text-white tabular-nums">{value}</div>
    </div>
  );
}
