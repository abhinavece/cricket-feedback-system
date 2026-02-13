'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuctionSocketProvider, useAuctionSocket } from '@/contexts/AuctionSocketContext';
import PlayerCard from '@/components/auction/PlayerCard';
import Timer from '@/components/auction/Timer';
import BidTicker from '@/components/auction/BidTicker';
import TeamPanel from '@/components/auction/TeamPanel';
import TradeProposalPanel from '@/components/auction/TradeProposalPanel';
import PlayerDetailModal from '@/components/auction/PlayerDetailModal';
import { getTeamPlayers } from '@/lib/api';
import { siteConfig, PLAYER_ROLES } from '@/lib/constants';
import {
  Wifi, WifiOff, IndianRupee, Users, UserCheck, Clock,
  Gavel, AlertTriangle, Trophy, Radio, ShieldCheck, Wallet,
  TrendingUp, CircleDot, Pause, CheckCircle2, BarChart3,
  ArrowLeftRight, Lock, Bell,
} from 'lucide-react';

function formatCurrency(amount: number) {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  return `₹${amount.toLocaleString('en-IN')}`;
}

export default function TeamBidPage() {
  const params = useParams();
  const accessToken = params.token as string;
  const [teamToken, setTeamToken] = useState<string | null>(null);
  const [auctionId, setAuctionId] = useState<string | null>(null);
  const [teamName, setTeamName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [accessCode, setAccessCode] = useState('');
  const [needsCode, setNeedsCode] = useState(false);

  useEffect(() => {
    async function validateToken() {
      try {
        const apiUrl = siteConfig.apiUrl;
        const res = await fetch(`${apiUrl}/api/v1/auctions/team-login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessToken }),
        });

        if (res.ok) {
          const data = await res.json();
          setTeamToken(data.token);
          setAuctionId(data.auctionId);
          setTeamName(data.teamName || 'Your Team');
          setLoading(false);
        } else {
          setNeedsCode(true);
          setLoading(false);
        }
      } catch (err) {
        setError('Failed to validate access token');
        setLoading(false);
      }
    }
    validateToken();
  }, [accessToken]);

  const handleCodeLogin = async () => {
    if (!accessCode.trim()) return;
    setLoading(true);
    setError('');
    try {
      const apiUrl = siteConfig.apiUrl;
      const res = await fetch(`${apiUrl}/api/v1/auctions/team-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken, accessCode: accessCode.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        setTeamToken(data.token);
        setAuctionId(data.auctionId);
        setTeamName(data.teamName || 'Your Team');
        setNeedsCode(false);
      } else {
        const data = await res.json();
        setError(data.error || 'Invalid access code');
      }
    } catch {
      setError('Failed to login');
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-14 text-center">
          <div className="relative w-14 h-14 mx-auto mb-5">
            <div className="absolute inset-0 rounded-full border-2 border-amber-500/30 border-t-amber-500 animate-spin" />
            <div className="absolute inset-2 rounded-full bg-slate-800/50 flex items-center justify-center">
              <Gavel className="w-4 h-4 text-amber-400" />
            </div>
          </div>
          <p className="text-slate-400 text-sm">Verifying access...</p>
        </motion.div>
      </div>
    );
  }

  if (error && !needsCode) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-8 text-center max-w-md">
          <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Access Error</h2>
          <p className="text-slate-400 text-sm">{error}</p>
        </motion.div>
      </div>
    );
  }

  if (needsCode) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-6 h-6 text-amber-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-1">Team Login</h2>
            <p className="text-sm text-slate-400">Enter your 6-character access code to join</p>
          </div>
          {error && (
            <div className="mb-4 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400 text-center">
              {error}
            </div>
          )}
          <input
            type="text"
            value={accessCode}
            onChange={e => setAccessCode(e.target.value.toUpperCase())}
            placeholder="------"
            maxLength={6}
            className="input-field text-center text-2xl font-mono tracking-[0.4em] mb-4 py-4"
            onKeyDown={e => e.key === 'Enter' && handleCodeLogin()}
            autoFocus
          />
          <button
            onClick={handleCodeLogin}
            disabled={accessCode.length < 6 || loading}
            className="btn-primary w-full"
          >
            {loading ? 'Verifying...' : 'Join Auction'}
          </button>
        </motion.div>
      </div>
    );
  }

  if (!teamToken || !auctionId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6 text-orange-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Invalid Link</h2>
          <p className="text-slate-400 text-sm">This bidding link is invalid or has expired.</p>
        </div>
      </div>
    );
  }

  return (
    <AuctionSocketProvider auctionId={auctionId} teamToken={teamToken} role="team">
      <TeamBiddingContent teamName={teamName} teamToken={teamToken} auctionId={auctionId} />
    </AuctionSocketProvider>
  );
}

function TeamBiddingContent({ teamName, teamToken, auctionId }: { teamName: string; teamToken: string; auctionId: string }) {
  const { state, connectionStatus, emit, announcements } = useAuctionSocket();
  const [bidLoading, setBidLoading] = useState(false);
  const [bidError, setBidError] = useState('');
  const [myPlayers, setMyPlayers] = useState<{ _id: string; name: string; role?: string; soldAmount?: number; isLocked?: boolean; customFields?: Record<string, any>; imageUrl?: string }[]>([]);

  const handleBid = useCallback(() => {
    setBidLoading(true);
    setBidError('');
    emit('team:bid', undefined, (res: any) => {
      setBidLoading(false);
      if (!res?.success) {
        setBidError(res?.error || 'Bid failed');
        setTimeout(() => setBidError(''), 4000);
      }
    });
  }, [emit]);

  if (!state) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-14 text-center">
          <div className="relative w-14 h-14 mx-auto mb-5">
            <div className="absolute inset-0 rounded-full border-2 border-amber-500/30 border-t-amber-500 animate-spin" />
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
  const isAuctionCompleted = state.status === 'completed';
  const isTradeWindow = state.status === 'trade_window';
  const isFinalized = state.status === 'finalized';
  const isPostAuction = isAuctionCompleted || isTradeWindow || isFinalized;
  const bidding = state.bidding;
  const myTeam = state.myTeam;
  const canBid = isLive && bidding &&
    ['open', 'going_once', 'going_twice'].includes(bidding.status) &&
    myTeam?.canBid &&
    bidding.currentBidTeamId !== myTeam?._id;

  const currentTeam = bidding?.currentBidTeamId
    ? state.teams.find(t => t._id === bidding.currentBidTeamId)
    : null;

  const isHighestBidder = bidding?.currentBidTeamId === myTeam?._id;

  const nextBidAmount = bidding
    ? bidding.bidHistory.length === 0
      ? state.config.basePrice
      : bidding.currentBid + getIncrement(bidding.currentBid, state.config)
    : 0;

  const pursePct = myTeam && state.config.purseValue > 0
    ? ((state.config.purseValue - myTeam.purseRemaining) / state.config.purseValue) * 100
    : 0;

  return (
    <div className="min-h-screen flex flex-col">
      {/* ─── Sticky Team Header ─── */}
      <div className="border-b border-white/5 bg-slate-950/90 backdrop-blur-2xl sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                <Gavel className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="text-sm font-bold text-white block leading-tight">{teamName}</span>
                <div className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${connectionStatus === 'connected' ? 'bg-emerald-500' : 'bg-orange-500 animate-pulse'}`} />
                  <span className="text-[10px] text-slate-500">{connectionStatus === 'connected' ? 'Connected' : 'Reconnecting'}</span>
                </div>
              </div>
            </div>
            {myTeam && (
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="text-right">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">Purse</div>
                  <div className="text-sm font-bold text-white tabular-nums">{formatCurrency(myTeam.purseRemaining)}</div>
                </div>
                <div className="w-px h-8 bg-white/5" />
                <div className="text-right">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">Max Bid</div>
                  <div className="text-sm font-bold text-amber-400 tabular-nums">{formatCurrency(myTeam.maxBid)}</div>
                </div>
              </div>
            )}
          </div>
          {/* Purse progress bar in header */}
          {myTeam && (
            <div className="mt-2 h-1 bg-slate-800/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
                style={{ width: `${100 - pursePct}%` }}
              />
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto w-full px-3 sm:px-6 py-4 sm:py-6 flex-1">
        {/* ─── Announcements ─── */}
        <AnimatePresence>
          {announcements.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4"
            >
              <div className="px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/15">
                <div className="flex items-center gap-2">
                  <Radio className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 animate-pulse" />
                  <p className="text-sm text-amber-200/90">{announcements[0].message}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Non-live States ─── */}
        {isPaused && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-8 text-center mb-6 border-amber-500/10">
            <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }} className="w-14 h-14 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
              <Pause className="w-6 h-6 text-amber-400" />
            </motion.div>
            <h2 className="text-xl font-bold text-white mb-1">Auction Paused</h2>
            <p className="text-sm text-slate-400">Bidding will resume shortly</p>
          </motion.div>
        )}

        {isPostAuction && (
          <PostAuctionView
            state={state}
            teamName={teamName}
            teamToken={teamToken}
            auctionId={auctionId}
            myPlayers={myPlayers}
            setMyPlayers={setMyPlayers}
          />
        )}

        {!isLive && !isPaused && !isPostAuction && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-8 text-center mb-6">
            <div className="relative w-16 h-16 mx-auto mb-5">
              <div className="absolute inset-0 rounded-full border-2 border-dashed border-slate-700 animate-spin" style={{ animationDuration: '10s' }} />
              <div className="absolute inset-2 rounded-full bg-slate-800/50 flex items-center justify-center">
                <CircleDot className="w-5 h-5 text-slate-500" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-white mb-1">Waiting to Start</h2>
            <p className="text-sm text-slate-400">The auction hasn&apos;t started yet</p>
          </motion.div>
        )}

        {/* ─── Live Bidding View ─── */}
        {isLive && bidding && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
            {/* Left column — player card + bid button */}
            <div className="lg:col-span-7 space-y-4">
              {/* Player + Timer */}
              <div className="flex flex-col sm:flex-row gap-4 items-start">
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
                    <Timer expiresAt={bidding.timerExpiresAt} phase={bidding.status} />
                  </div>
                )}
              </div>

              {/* ─── BID BUTTON — the hero ─── */}
              {!['sold', 'unsold', 'waiting'].includes(bidding.status) && (
                <div className="space-y-2.5">
                  <AnimatePresence mode="wait">
                    {isHighestBidder ? (
                      <motion.div
                        key="highest"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="glass-card p-5 text-center border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-emerald-500/10"
                      >
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          <span className="text-base font-bold text-emerald-400">You are the highest bidder</span>
                        </div>
                        <p className="text-sm text-slate-400 tabular-nums">Current bid: {formatCurrency(bidding.currentBid)}</p>
                      </motion.div>
                    ) : (
                      <motion.div key="bid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <button
                          onClick={handleBid}
                          disabled={!canBid || bidLoading}
                          className={`w-full rounded-2xl text-center transition-all ${
                            canBid && !bidLoading
                              ? 'btn-bid'
                              : 'py-5 bg-slate-800/60 text-slate-500 cursor-not-allowed border border-white/5 rounded-2xl'
                          }`}
                        >
                          {bidLoading ? (
                            <span className="flex items-center justify-center gap-2">
                              <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                              Placing bid...
                            </span>
                          ) : canBid ? (
                            <span className="flex items-center justify-center gap-3">
                              <Gavel className="w-6 h-6" />
                              BID {formatCurrency(nextBidAmount)}
                            </span>
                          ) : !myTeam?.canBid ? (
                            <span className="flex items-center justify-center gap-2 text-sm">
                              <Wallet className="w-4 h-4" /> Insufficient Purse
                            </span>
                          ) : (
                            'Waiting...'
                          )}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence>
                    {bidError && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400 text-center"
                      >
                        {bidError}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Teams overview */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1 h-4 rounded-full bg-gradient-to-b from-amber-500 to-orange-500" />
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.15em]">All Teams</h3>
                </div>
                <TeamPanel teams={state.teams} currentBidTeamId={bidding.currentBidTeamId} compact />
              </div>
            </div>

            {/* Right column — team info + bid history */}
            <div className="lg:col-span-5 space-y-4">
              {/* My team info */}
              {myTeam && (
                <div className="glass-card p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Wallet className="w-3.5 h-3.5 text-slate-500" />
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.15em]">Your Team</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-3 rounded-xl bg-slate-800/30 border border-white/5 text-center">
                      <div className="text-lg font-extrabold text-white tabular-nums">{formatCurrency(myTeam.purseRemaining)}</div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">Purse Left</div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-800/30 border border-white/5 text-center">
                      <div className="text-lg font-extrabold text-amber-400 tabular-nums">{formatCurrency(myTeam.maxBid)}</div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">Max Bid</div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-800/30 border border-white/5 text-center">
                      <div className="text-lg font-extrabold text-white tabular-nums">{myTeam.squadSize}</div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">Squad</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Bid history */}
              {bidding.bidHistory.length > 0 && (
                <div className="glass-card p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.15em]">Bid History</h3>
                  </div>
                  <BidTicker bidHistory={bidding.bidHistory} teams={state.teams} maxItems={8} />
                </div>
              )}

              {/* Auction stats */}
              <div className="glass-card p-4">
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className="w-3.5 h-3.5 text-slate-500" />
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.15em]">Auction Stats</h3>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-xl bg-slate-800/30 border border-white/5">
                    <div className="flex items-center gap-1.5 text-cyan-400 mb-1"><Clock className="w-3 h-3" /><span className="text-[10px] font-medium uppercase">Round</span></div>
                    <div className="text-lg font-extrabold text-white tabular-nums">{state.currentRound}</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-800/30 border border-white/5">
                    <div className="flex items-center gap-1.5 text-blue-400 mb-1"><Users className="w-3 h-3" /><span className="text-[10px] font-medium uppercase">In Pool</span></div>
                    <div className="text-lg font-extrabold text-white tabular-nums">{state.stats.inPool}</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-800/30 border border-white/5">
                    <div className="flex items-center gap-1.5 text-emerald-400 mb-1"><UserCheck className="w-3 h-3" /><span className="text-[10px] font-medium uppercase">Sold</span></div>
                    <div className="text-lg font-extrabold text-white tabular-nums">{state.stats.sold}</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-800/30 border border-white/5">
                    <div className="flex items-center gap-1.5 text-orange-400 mb-1"><span className="text-[10px]">↩️</span><span className="text-[10px] font-medium uppercase">Unsold</span></div>
                    <div className="text-lg font-extrabold text-white tabular-nums">{state.stats.unsold}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TradeWindowCountdown({ endsAt }: { endsAt: string }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const update = () => {
      const diff = new Date(endsAt).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft('Expired');
        setIsExpired(true);
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(h > 0 ? `${h}h ${m}m ${s}s` : m > 0 ? `${m}m ${s}s` : `${s}s`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [endsAt]);

  return (
    <span className={`tabular-nums font-mono text-sm font-bold ${isExpired ? 'text-red-400' : 'text-purple-300'}`}>
      {timeLeft}
    </span>
  );
}

function TradeToast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 5000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className="px-4 py-2.5 rounded-xl bg-purple-500/15 border border-purple-500/20 text-sm text-purple-300 flex items-center gap-2"
    >
      <Bell className="w-3.5 h-3.5 flex-shrink-0" />
      <span className="flex-1">{message}</span>
      <button onClick={onDismiss} className="text-purple-400 hover:text-white text-xs ml-2">✕</button>
    </motion.div>
  );
}

function PostAuctionView({ state, teamName, teamToken, auctionId, myPlayers, setMyPlayers }: {
  state: any;
  teamName: string;
  teamToken: string;
  auctionId: string;
  myPlayers: { _id: string; name: string; role?: string; soldAmount?: number; isLocked?: boolean; customFields?: Record<string, any>; imageUrl?: string }[];
  setMyPlayers: (p: any[]) => void;
}) {
  const { socket } = useAuctionSocket();
  const [loadingPlayers, setLoadingPlayers] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [tradeToasts, setTradeToasts] = useState<{ id: number; message: string }[]>([]);
  const [tradeRefreshKey, setTradeRefreshKey] = useState(0);
  const toastIdRef = useRef(0);
  const myTeam = state.myTeam;

  const isTradeWindow = state.status === 'trade_window';
  const isFinalized = state.status === 'finalized';
  const isCompleted = state.status === 'completed';

  const playerFields = state.playerFields || [];
  const fieldLabelMap: Record<string, string> = {};
  playerFields.forEach((f: any) => { fieldLabelMap[f.key] = f.label; });
  const allFieldKeys = playerFields.length > 0
    ? [...playerFields].sort((a: any, b: any) => a.order - b.order).map((f: any) => f.key)
    : undefined;

  const addToast = useCallback((message: string) => {
    const id = ++toastIdRef.current;
    setTradeToasts(prev => [...prev.slice(-2), { id, message }]);
  }, []);

  const refreshSquad = useCallback(() => {
    if (!myTeam?._id) return;
    getTeamPlayers(auctionId, teamToken, myTeam._id)
      .then(data => setMyPlayers((data.data || []).map((p: any) => ({
        _id: p._id, name: p.name, role: p.role, soldAmount: p.soldAmount,
        isLocked: p.isLocked, customFields: p.customFields, imageUrl: p.imageUrl,
      }))))
      .catch(() => {});
  }, [auctionId, teamToken, myTeam?._id, setMyPlayers]);

  // Initial squad fetch
  useEffect(() => {
    if (!myTeam?._id) return;
    refreshSquad();
    setLoadingPlayers(false);
  }, [myTeam?._id, refreshSquad]);

  // Listen for trade socket events
  useEffect(() => {
    if (!socket || !myTeam?._id) return;

    const myId = myTeam._id;

    const onProposed = (data: any) => {
      addToast(`New trade proposal from ${data.initiatorTeam?.shortName || 'a team'}`);
      setTradeRefreshKey(k => k + 1);
    };

    const onAccepted = (data: any) => {
      addToast('Your trade proposal was accepted!');
      setTradeRefreshKey(k => k + 1);
    };

    const onRejected = (data: any) => {
      addToast(`Trade rejected${data.reason ? ': ' + data.reason : ''}`);
      setTradeRefreshKey(k => k + 1);
    };

    const onWithdrawn = (data: any) => {
      addToast('A trade proposal was withdrawn');
      setTradeRefreshKey(k => k + 1);
    };

    const onCancelled = (data: any) => {
      addToast(`Trade auto-cancelled: ${data.reason || 'player conflict'}`);
      setTradeRefreshKey(k => k + 1);
    };

    const onExecuted = (data: any) => {
      addToast(`Trade executed: ${data.announcement || 'Players swapped'}`);
      setTradeRefreshKey(k => k + 1);
      // Re-fetch squad since players may have changed
      setTimeout(refreshSquad, 500);
    };

    const onAdminRejected = (data: any) => {
      addToast(`Trade rejected by admin${data.reason ? ': ' + data.reason : ''}`);
      setTradeRefreshKey(k => k + 1);
    };

    socket.on('trade:proposed', onProposed);
    socket.on('trade:accepted', onAccepted);
    socket.on('trade:rejected', onRejected);
    socket.on('trade:withdrawn', onWithdrawn);
    socket.on('trade:cancelled', onCancelled);
    socket.on('trade:executed', onExecuted);
    socket.on('trade:admin_rejected', onAdminRejected);

    return () => {
      socket.off('trade:proposed', onProposed);
      socket.off('trade:accepted', onAccepted);
      socket.off('trade:rejected', onRejected);
      socket.off('trade:withdrawn', onWithdrawn);
      socket.off('trade:cancelled', onCancelled);
      socket.off('trade:executed', onExecuted);
      socket.off('trade:admin_rejected', onAdminRejected);
    };
  }, [socket, myTeam?._id, addToast, refreshSquad]);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 mb-6">
      {/* Trade Toasts */}
      <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4 space-y-2">
        <AnimatePresence>
          {tradeToasts.map(t => (
            <TradeToast
              key={t.id}
              message={t.message}
              onDismiss={() => setTradeToasts(prev => prev.filter(x => x.id !== t.id))}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Status Banner — differentiated by state */}
      {isTradeWindow ? (
        <div className="glass-card p-5 text-center border-purple-500/15 bg-gradient-to-r from-purple-500/5 via-transparent to-purple-500/5">
          <div className="w-14 h-14 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-3">
            <ArrowLeftRight className="w-6 h-6 text-purple-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-1">Trade Window Open</h2>
          <p className="text-sm text-slate-400 mb-3">
            {state.stats.sold} players sold · Your squad: {myPlayers.length} players
          </p>
          {state.tradeWindowEndsAt && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/10 border border-purple-500/15">
              <Clock className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-xs text-purple-400/80">Closes in</span>
              <TradeWindowCountdown endsAt={state.tradeWindowEndsAt} />
            </div>
          )}
        </div>
      ) : isFinalized ? (
        <div className="glass-card p-5 text-center border-slate-500/10">
          <div className="w-14 h-14 rounded-full bg-slate-500/10 flex items-center justify-center mx-auto mb-3">
            <Lock className="w-6 h-6 text-slate-300" />
          </div>
          <h2 className="text-xl font-bold text-white mb-1">Auction Finalized</h2>
          <p className="text-sm text-slate-400">
            Results are permanent · Your squad: {myPlayers.length} players
          </p>
        </div>
      ) : (
        <div className="glass-card p-5 text-center border-emerald-500/10">
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
            <Trophy className="w-6 h-6 text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-1">Auction Completed</h2>
          <p className="text-sm text-slate-400">
            {state.stats.sold} players sold · Your squad: {myPlayers.length} players
          </p>
          <p className="text-xs text-slate-500 mt-2">Waiting for admin to open the trade window</p>
        </div>
      )}

      {/* Your Squad */}
      {myPlayers.length > 0 && (
        <div className="glass-card p-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.15em] mb-3 flex items-center gap-2">
            <div className="w-1 h-4 rounded-full bg-gradient-to-b from-amber-500 to-orange-500" />
            Your Squad ({myPlayers.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {myPlayers.map(p => {
              const rc = PLAYER_ROLES[p.role as keyof typeof PLAYER_ROLES] || { label: p.role, icon: '🏏', color: 'text-slate-400' };
              return (
                <div
                  key={p._id}
                  onClick={() => setSelectedPlayer({
                    ...p,
                    status: 'sold',
                    soldTo: myTeam ? { _id: myTeam._id, name: myTeam.name, shortName: myTeam.shortName, primaryColor: myTeam.primaryColor } : undefined,
                  })}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-slate-800/30 border border-white/5 hover:border-white/10 hover:bg-white/[0.03] cursor-pointer transition-all"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-700/80 to-slate-800/80 flex items-center justify-center border border-white/10 flex-shrink-0 overflow-hidden">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm">{rc.icon}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-white truncate block">{p.name}</span>
                    <span className={`text-[10px] ${rc.color}`}>{rc.label}</span>
                  </div>
                  {p.soldAmount ? <span className="text-[11px] font-semibold text-emerald-400 tabular-nums flex-shrink-0">{formatCurrency(p.soldAmount)}</span> : null}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Player Detail Modal */}
      {selectedPlayer && (
        <PlayerDetailModal
          player={selectedPlayer}
          onClose={() => setSelectedPlayer(null)}
          customFieldKeys={allFieldKeys}
          fieldLabelMap={fieldLabelMap}
          basePrice={state.config?.basePrice}
        />
      )}

      {/* Trade Proposal Panel — visible during trade_window, hidden when finalized */}
      {myTeam && !isFinalized && (
        <TradeProposalPanel
          key={tradeRefreshKey}
          auctionId={auctionId}
          teamToken={teamToken}
          myTeamId={myTeam._id}
          myTeamName={myTeam.name}
          myTeamShortName={myTeam.shortName}
          myTeamColor={myTeam.primaryColor}
          teams={state.teams}
          auctionStatus={state.status}
          tradeWindowEndsAt={state.tradeWindowEndsAt || undefined}
          maxTradesPerTeam={state.tradeConfig?.maxTradesPerTeam || 2}
          myPlayers={myPlayers}
        />
      )}
    </motion.div>
  );
}

function getIncrement(currentBid: number, config: any): number {
  if (currentBid < 100000) return 10000;
  if (currentBid < 500000) return 25000;
  return 50000;
}
