'use client';

import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { AuctionSocketProvider, useAuctionSocket } from '@/contexts/AuctionSocketContext';
import PlayerCard from '@/components/auction/PlayerCard';
import Timer from '@/components/auction/Timer';
import BidTicker from '@/components/auction/BidTicker';
import TeamPanel from '@/components/auction/TeamPanel';
import { useState, useCallback } from 'react';
import {
  Play, Pause, SkipForward, Square, Wifi, WifiOff,
  Users, UserCheck, Clock, Megaphone, AlertTriangle,
  Zap, Send,
} from 'lucide-react';

function getStoredToken(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    // AUTH_STORAGE_KEY = 'auction_auth_token' — stored as plain string by AuthContext
    return localStorage.getItem('auction_auth_token') || undefined;
  } catch {}
  return undefined;
}

export default function AdminLivePage() {
  const params = useParams();
  const auctionId = params.auctionId as string;
  const token = getStoredToken();

  if (!token) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 text-center">
        <p className="text-slate-400">Please sign in to access the admin control panel.</p>
      </div>
    );
  }

  return (
    <AuctionSocketProvider auctionId={auctionId} token={token} role="admin">
      <AdminLiveContent auctionId={auctionId} />
    </AuctionSocketProvider>
  );
}

function AdminLiveContent({ auctionId }: { auctionId: string }) {
  const { state, connectionStatus, emit, announcements } = useAuctionSocket();
  const [loading, setLoading] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const [showConfirm, setShowConfirm] = useState<string | null>(null);

  const handleAction = useCallback((event: string, data?: any) => {
    setLoading(event);
    emit(event, data, (res: any) => {
      setLoading(null);
      if (!res?.success) {
        alert(res?.error || 'Action failed');
      }
      setShowConfirm(null);
    });
  }, [emit]);

  if (!state) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="glass-card p-12 text-center">
          <div className="w-12 h-12 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">
            {connectionStatus === 'error' ? 'Failed to connect. Retrying...' : 'Connecting...'}
          </p>
        </div>
      </div>
    );
  }

  const isLive = state.status === 'live';
  const isPaused = state.status === 'paused';
  const isConfigured = state.status === 'configured';
  const isCompleted = ['completed', 'trade_window', 'finalized'].includes(state.status);
  const bidding = state.bidding;
  const currentTeam = bidding?.currentBidTeamId
    ? state.teams.find(t => t._id === bidding.currentBidTeamId)
    : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Header bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`badge ${
            isLive ? 'bg-red-500/20 text-red-400' :
            isPaused ? 'bg-amber-500/20 text-amber-400' :
            isCompleted ? 'bg-emerald-500/20 text-emerald-400' :
            'bg-blue-500/20 text-blue-400'
          }`}>
            <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-red-500 animate-pulse' : isPaused ? 'bg-amber-500' : 'bg-emerald-500'}`} />
            {state.status.toUpperCase().replace('_', ' ')}
          </div>
          {connectionStatus === 'connected' ? (
            <Wifi className="w-4 h-4 text-emerald-400" />
          ) : (
            <WifiOff className="w-4 h-4 text-orange-400" />
          )}
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Round {state.currentRound}</span>
          <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {state.stats.inPool} pool</span>
          <span className="flex items-center gap-1"><UserCheck className="w-3 h-3" /> {state.stats.sold} sold</span>
          {state.remainingPlayerCount !== undefined && (
            <span className="flex items-center gap-1">📋 {state.remainingPlayerCount} remaining</span>
          )}
        </div>
      </div>

      {/* Admin Control Bar */}
      <div className="glass-card p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          {/* Start button (only when configured) */}
          {isConfigured && (
            <button
              onClick={() => handleAction('admin:start')}
              disabled={loading === 'admin:start'}
              className="btn-primary text-sm"
            >
              <Zap className="w-4 h-4" />
              {loading === 'admin:start' ? 'Starting...' : 'Go Live'}
            </button>
          )}

          {/* Pause / Resume */}
          {isLive && (
            <button
              onClick={() => handleAction('admin:pause', { reason: 'Admin break' })}
              disabled={!!loading}
              className="btn-secondary text-sm"
            >
              <Pause className="w-4 h-4" />
              {loading === 'admin:pause' ? 'Pausing...' : 'Pause'}
            </button>
          )}
          {isPaused && (
            <button
              onClick={() => handleAction('admin:resume')}
              disabled={!!loading}
              className="btn-primary text-sm"
            >
              <Play className="w-4 h-4" />
              {loading === 'admin:resume' ? 'Resuming...' : 'Resume'}
            </button>
          )}

          {/* Next Player (when stuck in waiting or no active bidding) */}
          {isLive && (!bidding || bidding.status === 'waiting') && (
            <button
              onClick={() => handleAction('admin:next_player')}
              disabled={!!loading}
              className="btn-primary text-sm"
            >
              <SkipForward className="w-4 h-4" />
              {loading === 'admin:next_player' ? 'Picking...' : 'Next Player'}
            </button>
          )}

          {/* Skip player */}
          {isLive && bidding && bidding.status !== 'waiting' && (
            <button
              onClick={() => handleAction('admin:skip')}
              disabled={!!loading}
              className="btn-ghost text-sm text-orange-400 hover:text-orange-300"
            >
              <SkipForward className="w-4 h-4" />
              Skip
            </button>
          )}

          {/* End auction */}
          {(isLive || isPaused) && (
            <>
              {showConfirm === 'complete' ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-red-400">End auction?</span>
                  <button
                    onClick={() => handleAction('admin:complete', { reason: 'Ended by admin' })}
                    disabled={!!loading}
                    className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-xs font-semibold hover:bg-red-500/30"
                  >
                    {loading === 'admin:complete' ? 'Ending...' : 'Confirm End'}
                  </button>
                  <button
                    onClick={() => setShowConfirm(null)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 text-xs hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowConfirm('complete')}
                  className="btn-ghost text-sm text-red-400 hover:text-red-300"
                >
                  <Square className="w-4 h-4" />
                  End Auction
                </button>
              )}
            </>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Announcement */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={announcement}
              onChange={e => setAnnouncement(e.target.value)}
              placeholder="Broadcast message..."
              className="input-field text-sm py-2 px-3 w-48 sm:w-64"
              onKeyDown={e => {
                if (e.key === 'Enter' && announcement.trim()) {
                  handleAction('admin:announce', { message: announcement.trim() });
                  setAnnouncement('');
                }
              }}
            />
            <button
              onClick={() => {
                if (announcement.trim()) {
                  handleAction('admin:announce', { message: announcement.trim() });
                  setAnnouncement('');
                }
              }}
              disabled={!announcement.trim()}
              className="btn-ghost text-amber-400"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Announcements */}
      {announcements.length > 0 && (
        <div className="mb-4 space-y-1">
          {announcements.slice(0, 3).map((a, i) => (
            <div key={i} className="px-3 py-2 rounded-lg bg-amber-500/5 border border-amber-500/10 flex items-center gap-2">
              <Megaphone className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              <span className="text-xs text-amber-300">{a.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Not yet started */}
      {isConfigured && (
        <div className="glass-card p-8 text-center">
          <div className="text-4xl mb-4">🚀</div>
          <h2 className="text-xl font-bold text-white mb-2">Ready to Launch</h2>
          <p className="text-slate-400 mb-4">
            {state.stats.totalPlayers} players, {state.teams.length} teams. Click &quot;Go Live&quot; to start the auction.
          </p>
        </div>
      )}

      {/* Completed */}
      {isCompleted && (
        <div className="glass-card p-8 text-center">
          <div className="text-4xl mb-4">🏆</div>
          <h2 className="text-xl font-bold text-white mb-2">Auction Completed</h2>
          <p className="text-slate-400">{state.stats.sold} sold · {state.stats.unsold} unsold</p>
        </div>
      )}

      {/* Paused */}
      {isPaused && (
        <div className="glass-card p-6 text-center mb-6 border-amber-500/20">
          <div className="text-3xl mb-2">⏸️</div>
          <h2 className="text-lg font-bold text-white">Auction Paused</h2>
          <p className="text-sm text-slate-400">Click Resume to continue with next player</p>
        </div>
      )}

      {/* Live bidding */}
      {isLive && bidding && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
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
                <Timer expiresAt={bidding.timerExpiresAt} phase={bidding.status} />
              )}
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Teams</h3>
              <TeamPanel teams={state.teams} currentBidTeamId={bidding.currentBidTeamId} />
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass-card p-4">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Bid History</h3>
              <BidTicker bidHistory={bidding.bidHistory} teams={state.teams} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
