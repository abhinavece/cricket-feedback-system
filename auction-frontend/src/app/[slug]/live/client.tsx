'use client';

import { AuctionSocketProvider, useAuctionSocket } from '@/contexts/AuctionSocketContext';
import PlayerCard from '@/components/auction/PlayerCard';
import Timer from '@/components/auction/Timer';
import BidTicker from '@/components/auction/BidTicker';
import TeamPanel from '@/components/auction/TeamPanel';
import { Wifi, WifiOff, Radio, Users, UserCheck, Trophy, Clock } from 'lucide-react';

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="glass-card p-12 text-center">
          <div className="w-12 h-12 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">
            {connectionStatus === 'error' ? 'Failed to connect. Retrying...' : 'Connecting to auction...'}
          </p>
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Connection indicator */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {connectionStatus === 'connected' ? (
            <div className="flex items-center gap-1.5 text-emerald-400">
              <Wifi className="w-4 h-4" />
              <span className="text-xs font-medium">LIVE</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-orange-400">
              <WifiOff className="w-4 h-4" />
              <span className="text-xs font-medium">Reconnecting...</span>
            </div>
          )}
          {isLive && <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Round {state.currentRound}</span>
          <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {state.stats.inPool} in pool</span>
          <span className="flex items-center gap-1"><UserCheck className="w-3 h-3" /> {state.stats.sold} sold</span>
        </div>
      </div>

      {/* Announcements banner */}
      {announcements.length > 0 && (
        <div className="mb-4 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <p className="text-sm text-amber-300">{announcements[0].message}</p>
          </div>
        </div>
      )}

      {/* Paused state */}
      {isPaused && (
        <div className="glass-card p-8 sm:p-12 text-center mb-6">
          <div className="text-4xl mb-4">⏸️</div>
          <h2 className="text-2xl font-bold text-white mb-2">Auction Paused</h2>
          <p className="text-slate-400">The auction will resume shortly. Stay tuned!</p>
        </div>
      )}

      {/* Completed state */}
      {isCompleted && (
        <div className="glass-card p-8 sm:p-12 text-center mb-6">
          <div className="text-4xl mb-4">🏆</div>
          <h2 className="text-2xl font-bold text-white mb-2">Auction Completed</h2>
          <p className="text-slate-400 mb-4">
            {state.stats.sold} players sold · {state.stats.unsold} unsold
          </p>
          <a href={`/${slug}/analytics`} className="btn-primary">
            <Trophy className="w-4 h-4" /> View Analytics
          </a>
        </div>
      )}

      {/* Not yet live */}
      {!isLive && !isPaused && !isCompleted && (
        <div className="glass-card p-8 sm:p-12 text-center mb-6">
          <div className="text-4xl mb-4">📡</div>
          <h2 className="text-2xl font-bold text-white mb-2">Waiting to Go Live</h2>
          <p className="text-slate-400">The auction hasn&apos;t started yet. This page will update automatically.</p>
        </div>
      )}

      {/* Live bidding view */}
      {isLive && bidding && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content — player + timer */}
          <div className="lg:col-span-2 space-y-6">
            {/* Player card + timer row */}
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="flex-1">
                <PlayerCard
                  player={bidding.player}
                  currentBid={bidding.currentBid}
                  basePrice={state.config.basePrice}
                  status={bidding.status}
                  soldTeam={currentTeam ? { name: currentTeam.name, shortName: currentTeam.shortName, primaryColor: currentTeam.primaryColor } : null}
                />
              </div>
              {!['sold', 'unsold', 'waiting'].includes(bidding.status) && (
                <Timer
                  expiresAt={bidding.timerExpiresAt}
                  phase={bidding.status}
                />
              )}
            </div>

            {/* Teams grid */}
            <div>
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Teams</h3>
              <TeamPanel
                teams={state.teams}
                currentBidTeamId={bidding.currentBidTeamId}
              />
            </div>
          </div>

          {/* Sidebar — bid ticker + stats */}
          <div className="space-y-6">
            {/* Bid history */}
            <div className="glass-card p-4">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Bid History</h3>
              <BidTicker
                bidHistory={bidding.bidHistory}
                teams={state.teams}
              />
            </div>

            {/* Quick stats */}
            <div className="glass-card p-4">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Stats</h3>
              <div className="grid grid-cols-2 gap-3">
                <StatBox label="Round" value={String(state.currentRound)} />
                <StatBox label="In Pool" value={String(state.stats.inPool)} />
                <StatBox label="Sold" value={String(state.stats.sold)} />
                <StatBox label="Unsold" value={String(state.stats.unsold)} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-xl bg-slate-800/30 border border-white/5 text-center">
      <div className="text-lg font-bold text-white">{value}</div>
      <div className="text-[10px] text-slate-500 uppercase">{label}</div>
    </div>
  );
}
