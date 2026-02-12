'use client';

import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { AuctionSocketProvider, useAuctionSocket } from '@/contexts/AuctionSocketContext';
import PlayerCard from '@/components/auction/PlayerCard';
import Timer from '@/components/auction/Timer';
import BidTicker from '@/components/auction/BidTicker';
import TeamPanel from '@/components/auction/TeamPanel';
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Pause, SkipForward, Square, Wifi, WifiOff,
  Users, UserCheck, Clock, Megaphone, AlertTriangle,
  Zap, Send, Undo2, ShieldBan, TrendingUp, BarChart3,
  CircleDot, Trophy, Rocket, MonitorPlay, ChevronRight,
  Ban, ExternalLink,
} from 'lucide-react';

function getStoredToken(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
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
        <div className="glass-card p-8 max-w-md mx-auto">
          <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Please sign in to access the admin control panel.</p>
        </div>
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
  const [undoToast, setUndoToast] = useState<string | null>(null);
  const [disqualifyReason, setDisqualifyReason] = useState('');

  const handleAction = useCallback((event: string, data?: any) => {
    setLoading(event);
    emit(event, data, (res: any) => {
      setLoading(null);
      if (!res?.success) {
        alert(res?.error || 'Action failed');
      } else if (event === 'admin:undo' && res.undoneAction) {
        setUndoToast(`Undone: ${res.undoneAction.publicMessage || res.undoneAction.type}`);
        setTimeout(() => setUndoToast(null), 3000);
      }
      setShowConfirm(null);
    });
  }, [emit]);

  if (!state) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-14 text-center max-w-md mx-auto">
          <div className="relative w-14 h-14 mx-auto mb-5">
            <div className="absolute inset-0 rounded-full border-2 border-amber-500/30 border-t-amber-500 animate-spin" />
            <div className="absolute inset-2 rounded-full bg-slate-800/50 flex items-center justify-center">
              <CircleDot className="w-4 h-4 text-amber-400" />
            </div>
          </div>
          <p className="text-slate-400 text-sm">
            {connectionStatus === 'error' ? 'Connection lost. Retrying...' : 'Connecting to admin panel...'}
          </p>
        </motion.div>
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
  const totalPlayers = state.stats.totalPlayers || (state.stats.inPool + state.stats.sold + state.stats.unsold);
  const progressPct = totalPlayers > 0 ? ((state.stats.sold + state.stats.unsold) / totalPlayers) * 100 : 0;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
      {/* ─── Undo Toast ─── */}
      <AnimatePresence>
        {undoToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-xl bg-slate-800/95 border border-amber-500/20 shadow-xl backdrop-blur-xl"
          >
            <div className="flex items-center gap-2">
              <Undo2 className="w-4 h-4 text-amber-400" />
              <span className="text-sm text-amber-200">{undoToast}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Status Header ─── */}
      <div className="glass-card px-4 py-2.5 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`badge text-[11px] ${
            isLive ? 'bg-red-500/20 text-red-400' :
            isPaused ? 'bg-amber-500/20 text-amber-400' :
            isCompleted ? 'bg-emerald-500/20 text-emerald-400' :
            'bg-blue-500/20 text-blue-400'
          }`}>
            <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-red-500 animate-pulse' : isPaused ? 'bg-amber-500' : isCompleted ? 'bg-emerald-500' : 'bg-blue-500'}`} />
            {state.status.toUpperCase().replace('_', ' ')}
          </div>
          <div className={`w-1.5 h-1.5 rounded-full ${connectionStatus === 'connected' ? 'bg-emerald-500' : 'bg-orange-500 animate-pulse'}`} />
          <span className="text-[10px] text-slate-600 uppercase font-medium">Admin</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 text-[11px]">
          <span className="flex items-center gap-1 text-slate-500"><Clock className="w-3 h-3" /> R{state.currentRound}</span>
          <span className="flex items-center gap-1 text-blue-400"><Users className="w-3 h-3" /> {state.stats.inPool}</span>
          <span className="flex items-center gap-1 text-emerald-400"><UserCheck className="w-3 h-3" /> {state.stats.sold}</span>
          {state.remainingPlayerCount !== undefined && (
            <span className="flex items-center gap-1 text-slate-500">Q:{state.remainingPlayerCount}</span>
          )}
        </div>
      </div>

      {/* ─── Progress Bar ─── */}
      {(isLive || isPaused) && (
        <div className="mb-4">
          <div className="h-1 bg-slate-800/60 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-600 mt-1 px-0.5">
            <span>{state.stats.sold + state.stats.unsold} / {totalPlayers}</span>
            <span>{Math.round(progressPct)}%</span>
          </div>
        </div>
      )}

      {/* ─── Admin Control Bar ─── */}
      <div className="glass-card p-3 sm:p-4 mb-4">
        {/* Row 1: Main auction controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Start */}
          {isConfigured && (
            <button onClick={() => handleAction('admin:start')} disabled={loading === 'admin:start'} className="btn-primary text-sm">
              <Zap className="w-4 h-4" />
              {loading === 'admin:start' ? 'Starting...' : 'Go Live'}
            </button>
          )}

          {/* Pause / Resume */}
          {isLive && (
            <button onClick={() => handleAction('admin:pause', { reason: 'Admin break' })} disabled={!!loading} className="btn-secondary text-sm">
              <Pause className="w-4 h-4" /> {loading === 'admin:pause' ? 'Pausing...' : 'Pause'}
            </button>
          )}
          {isPaused && (
            <button onClick={() => handleAction('admin:resume')} disabled={!!loading} className="btn-primary text-sm">
              <Play className="w-4 h-4" /> {loading === 'admin:resume' ? 'Resuming...' : 'Resume'}
            </button>
          )}

          {/* Next Player — shown when waiting OR after sold/unsold */}
          {isLive && bidding && ['waiting', 'sold', 'unsold'].includes(bidding.status) && (
            <button onClick={() => handleAction('admin:next_player')} disabled={!!loading} className="btn-primary text-sm">
              <ChevronRight className="w-4 h-4" /> {loading === 'admin:next_player' ? 'Picking...' : 'Next Player'}
            </button>
          )}
          {isLive && !bidding && (
            <button onClick={() => handleAction('admin:next_player')} disabled={!!loading} className="btn-primary text-sm">
              <ChevronRight className="w-4 h-4" /> {loading === 'admin:next_player' ? 'Picking...' : 'Next Player'}
            </button>
          )}

          {/* Skip player — during active bidding only */}
          {isLive && bidding && !['waiting', 'sold', 'unsold'].includes(bidding.status) && (
            <button onClick={() => handleAction('admin:skip')} disabled={!!loading} className="btn-ghost text-sm text-orange-400 hover:text-orange-300">
              <SkipForward className="w-4 h-4" /> Skip
            </button>
          )}

          {/* Undo — reverses last sold/unsold/disqualified action (max 3 consecutive) */}
          {(isLive || isPaused) && (
            <button
              onClick={() => handleAction('admin:undo')}
              disabled={!!loading}
              className="btn-ghost text-sm text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
              title="Undo last sold/unsold action (max 3 consecutive)"
            >
              <Undo2 className="w-4 h-4" />
              {loading === 'admin:undo' ? 'Undoing...' : 'Undo'}
            </button>
          )}

          {/* Disqualify current player */}
          {isLive && bidding && bidding.player && !['sold', 'unsold', 'waiting'].includes(bidding.status) && (
            <>
              {showConfirm === 'disqualify' ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={disqualifyReason}
                    onChange={e => setDisqualifyReason(e.target.value)}
                    placeholder="Reason (optional)"
                    className="input-field text-xs py-1 px-2 w-32"
                  />
                  <button
                    onClick={() => {
                      handleAction('admin:disqualify', { playerId: bidding.player?._id, reason: disqualifyReason || 'Disqualified by admin' });
                      setDisqualifyReason('');
                    }}
                    disabled={!!loading}
                    className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-xs font-semibold hover:bg-red-500/30"
                  >
                    {loading === 'admin:disqualify' ? 'Removing...' : 'Confirm DQ'}
                  </button>
                  <button onClick={() => { setShowConfirm(null); setDisqualifyReason(''); }} className="px-2 py-1.5 rounded-lg bg-slate-800 text-slate-400 text-xs hover:text-white">
                    Cancel
                  </button>
                </div>
              ) : (
                <button onClick={() => setShowConfirm('disqualify')} className="btn-ghost text-sm text-red-400 hover:text-red-300" title="Remove this player from auction">
                  <Ban className="w-4 h-4" /> Disqualify
                </button>
              )}
            </>
          )}

          <div className="flex-1" />

          {/* End auction */}
          {(isLive || isPaused) && (
            <>
              {showConfirm === 'complete' ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-red-400">End auction?</span>
                  <button onClick={() => handleAction('admin:complete', { reason: 'Ended by admin' })} disabled={!!loading} className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-xs font-semibold hover:bg-red-500/30">
                    {loading === 'admin:complete' ? 'Ending...' : 'Confirm'}
                  </button>
                  <button onClick={() => setShowConfirm(null)} className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 text-xs hover:text-white">
                    Cancel
                  </button>
                </div>
              ) : (
                <button onClick={() => setShowConfirm('complete')} className="btn-ghost text-sm text-red-400 hover:text-red-300">
                  <Square className="w-4 h-4" /> End Auction
                </button>
              )}
            </>
          )}
        </div>

        {/* Row 2: Announcement + Broadcast link */}
        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-white/5">
          <div className="flex items-center gap-2 flex-1">
            <Megaphone className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
            <input
              type="text"
              value={announcement}
              onChange={e => setAnnouncement(e.target.value)}
              placeholder="Type announcement for all viewers..."
              className="input-field text-sm py-1.5 px-3 flex-1"
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
              className="btn-ghost text-amber-400 disabled:opacity-30"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <a
            href={`/${state.slug || ''}/broadcast`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost text-xs text-slate-500 hover:text-slate-300 flex-shrink-0"
            title="Open full-screen broadcast view for streaming (OBS)"
          >
            <MonitorPlay className="w-3.5 h-3.5" /> Broadcast View <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* ─── Prominent Action Banner after SOLD/UNSOLD ─── */}
      <AnimatePresence>
        {isLive && bidding && ['sold', 'unsold'].includes(bidding.status) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`mb-4 p-4 rounded-2xl border flex flex-col sm:flex-row items-center gap-3 sm:gap-4 ${
              bidding.status === 'sold'
                ? 'bg-emerald-500/10 border-emerald-500/20'
                : 'bg-orange-500/10 border-orange-500/20'
            }`}
          >
            <div className="flex-1 text-center sm:text-left">
              <p className={`text-sm font-semibold ${
                bidding.status === 'sold' ? 'text-emerald-400' : 'text-orange-400'
              }`}>
                {bidding.status === 'sold'
                  ? `✅ ${bidding.player?.name || 'Player'} — SOLD${currentTeam ? ` to ${currentTeam.name}` : ''}`
                  : `⏭️ ${bidding.player?.name || 'Player'} — UNSOLD`
                }
              </p>
              <p className="text-xs text-slate-500 mt-0.5">Click &quot;Next Player&quot; when ready to continue, or &quot;Undo&quot; to reverse this.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleAction('admin:undo')}
                disabled={!!loading}
                className="px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold hover:bg-amber-500/20 transition-colors inline-flex items-center gap-1.5"
              >
                <Undo2 className="w-3.5 h-3.5" /> {loading === 'admin:undo' ? 'Undoing...' : 'Undo'}
              </button>
              <button
                onClick={() => handleAction('admin:next_player')}
                disabled={!!loading}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold hover:brightness-110 transition-all inline-flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
              >
                <ChevronRight className="w-3.5 h-3.5" /> {loading === 'admin:next_player' ? 'Picking...' : 'Next Player'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Announcements ─── */}
      <AnimatePresence>
        {announcements.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mb-4 space-y-1">
            {announcements.slice(0, 3).map((a, i) => (
              <div key={i} className="px-3 py-2 rounded-xl bg-amber-500/5 border border-amber-500/10 flex items-center gap-2">
                <Megaphone className="w-3 h-3 text-amber-400 flex-shrink-0" />
                <span className="text-xs text-amber-300/80">{a.message}</span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Configured ─── */}
      {isConfigured && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-8 sm:p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-5">
            <Rocket className="w-7 h-7 text-blue-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Ready to Launch</h2>
          <p className="text-slate-400 text-sm mb-1">
            {state.stats.totalPlayers} players · {state.teams.length} teams
          </p>
          <p className="text-slate-500 text-xs">Click &quot;Go Live&quot; above to start the auction</p>
        </motion.div>
      )}

      {/* ─── Completed ─── */}
      {isCompleted && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-8 sm:p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-5">
            <Trophy className="w-7 h-7 text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Auction Completed</h2>
          <p className="text-slate-400 text-sm">{state.stats.sold} sold · {state.stats.unsold} unsold</p>
        </motion.div>
      )}

      {/* ─── Paused ─── */}
      {isPaused && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-6 text-center mb-4 border-amber-500/10">
          <Pause className="w-6 h-6 text-amber-400 mx-auto mb-2" />
          <h2 className="text-lg font-bold text-white">Auction Paused</h2>
          <p className="text-sm text-slate-400">Click Resume to continue</p>
        </motion.div>
      )}

      {/* ─── Live Bidding ─── */}
      {isLive && bidding && bidding.player && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
          <div className="lg:col-span-8 space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start">
              <div className="flex-1 w-full">
                <PlayerCard
                  player={bidding.player}
                  currentBid={bidding.currentBid}
                  basePrice={state.config.basePrice}
                  status={bidding.status}
                  soldTeam={currentTeam ? { name: currentTeam.name, shortName: currentTeam.shortName, primaryColor: currentTeam.primaryColor } : null}
                />
              </div>
              {!['sold', 'unsold', 'waiting'].includes(bidding.status) && (
                <div className="flex-shrink-0 self-center sm:self-start">
                  <Timer expiresAt={bidding.timerExpiresAt} phase={bidding.status} />
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-4 rounded-full bg-gradient-to-b from-amber-500 to-orange-500" />
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.15em]">Teams</h3>
              </div>
              <TeamPanel teams={state.teams} currentBidTeamId={bidding.currentBidTeamId} />
            </div>
          </div>

          <div className="lg:col-span-4 space-y-4 sm:space-y-6">
            <div className="glass-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.15em]">Bid History</h3>
              </div>
              <BidTicker bidHistory={bidding.bidHistory} teams={state.teams} />
            </div>

            {/* Quick stats */}
            <div className="glass-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="w-3.5 h-3.5 text-slate-500" />
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.15em]">Stats</h3>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-xl bg-slate-800/30 border border-white/5 text-center">
                  <div className="text-lg font-extrabold text-white tabular-nums">{state.currentRound}</div>
                  <div className="text-[9px] text-slate-500 uppercase">Round</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-800/30 border border-white/5 text-center">
                  <div className="text-lg font-extrabold text-blue-400 tabular-nums">{state.stats.inPool}</div>
                  <div className="text-[9px] text-slate-500 uppercase">In Pool</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-800/30 border border-white/5 text-center">
                  <div className="text-lg font-extrabold text-emerald-400 tabular-nums">{state.stats.sold}</div>
                  <div className="text-[9px] text-slate-500 uppercase">Sold</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-800/30 border border-white/5 text-center">
                  <div className="text-lg font-extrabold text-orange-400 tabular-nums">{state.stats.unsold}</div>
                  <div className="text-[9px] text-slate-500 uppercase">Unsold</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
