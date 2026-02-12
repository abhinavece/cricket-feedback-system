'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuctionSocketProvider, useAuctionSocket } from '@/contexts/AuctionSocketContext';
import PlayerCard from '@/components/auction/PlayerCard';
import Timer from '@/components/auction/Timer';
import BidTicker from '@/components/auction/BidTicker';
import TeamPanel from '@/components/auction/TeamPanel';
import { siteConfig } from '@/lib/constants';
import {
  Wifi, WifiOff, IndianRupee, Users, UserCheck, Clock,
  Gavel, AlertTriangle, Trophy, Radio, ShieldCheck, Wallet,
  TrendingUp, CircleDot, Pause, CheckCircle2,
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
      <TeamBiddingContent teamName={teamName} />
    </AuctionSocketProvider>
  );
}

function TeamBiddingContent({ teamName }: { teamName: string }) {
  const { state, connectionStatus, emit, announcements } = useAuctionSocket();
  const [bidLoading, setBidLoading] = useState(false);
  const [bidError, setBidError] = useState('');

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
  const isCompleted = ['completed', 'trade_window', 'finalized'].includes(state.status);
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

      <div className="max-w-4xl mx-auto w-full px-3 sm:px-6 py-4 sm:py-6 flex-1">
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

        {isCompleted && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-8 text-center mb-6 border-emerald-500/10">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-6 h-6 text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-1">Auction Completed</h2>
            <p className="text-sm text-slate-400">{state.stats.sold} players sold</p>
          </motion.div>
        )}

        {!isLive && !isPaused && !isCompleted && (
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
          <div className="space-y-4 sm:space-y-5">
            {/* Player + Timer */}
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <div className="flex-1 w-full">
                <PlayerCard
                  player={bidding.player}
                  currentBid={bidding.currentBid}
                  basePrice={state.config.basePrice}
                  status={bidding.status}
                  soldTeam={currentTeam ? { name: currentTeam.name, shortName: currentTeam.shortName, primaryColor: currentTeam.primaryColor } : null}
                  compact
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

            {/* Bid history */}
            {bidding.bidHistory.length > 0 && (
              <div className="glass-card p-4">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.15em]">Bid History</h3>
                </div>
                <BidTicker bidHistory={bidding.bidHistory} teams={state.teams} maxItems={5} />
              </div>
            )}

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

            {/* Teams overview */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-4 rounded-full bg-gradient-to-b from-amber-500 to-orange-500" />
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.15em]">All Teams</h3>
              </div>
              <TeamPanel teams={state.teams} currentBidTeamId={bidding.currentBidTeamId} compact />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function getIncrement(currentBid: number, config: any): number {
  if (currentBid < 100000) return 10000;
  if (currentBid < 500000) return 25000;
  return 50000;
}
