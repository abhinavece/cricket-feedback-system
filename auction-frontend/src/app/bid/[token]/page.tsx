'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { AuctionSocketProvider, useAuctionSocket } from '@/contexts/AuctionSocketContext';
import PlayerCard from '@/components/auction/PlayerCard';
import Timer from '@/components/auction/Timer';
import BidTicker from '@/components/auction/BidTicker';
import TeamPanel from '@/components/auction/TeamPanel';
import { siteConfig } from '@/lib/constants';
import {
  Wifi, WifiOff, IndianRupee, Users, UserCheck, Clock,
  Gavel, AlertTriangle, Trophy, Radio, ShieldCheck,
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

  // Step 1: Validate access token and login
  useEffect(() => {
    async function validateToken() {
      try {
        const apiUrl = siteConfig.apiUrl;
        // First, try to get team info from access token
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
          // May need access code
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

  // Step 2: Login with access code
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
        <div className="glass-card p-12 text-center">
          <div className="w-12 h-12 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (error && !needsCode) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="glass-card p-8 text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Access Error</h2>
          <p className="text-slate-400">{error}</p>
        </div>
      </div>
    );
  }

  if (needsCode) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="glass-card p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <ShieldCheck className="w-12 h-12 text-amber-400 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-white mb-1">Team Login</h2>
            <p className="text-sm text-slate-400">Enter your 6-character access code to join the auction</p>
          </div>
          {error && (
            <div className="mb-4 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
              {error}
            </div>
          )}
          <input
            type="text"
            value={accessCode}
            onChange={e => setAccessCode(e.target.value.toUpperCase())}
            placeholder="Access Code"
            maxLength={6}
            className="input-field text-center text-2xl font-mono tracking-[0.3em] mb-4"
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
        </div>
      </div>
    );
  }

  if (!teamToken || !auctionId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-orange-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Invalid Link</h2>
          <p className="text-slate-400">This bidding link is invalid or has expired.</p>
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
        <div className="glass-card p-12 text-center">
          <div className="w-12 h-12 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">
            {connectionStatus === 'error' ? 'Connection failed. Retrying...' : 'Connecting to auction...'}
          </p>
        </div>
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

  // Calculate next bid amount
  const nextBidAmount = bidding
    ? bidding.bidHistory.length === 0
      ? state.config.basePrice
      : bidding.currentBid + getIncrement(bidding.currentBid, state.config)
    : 0;

  return (
    <div className="min-h-screen">
      {/* Team header */}
      <div className="border-b border-white/5 bg-slate-900/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Gavel className="w-5 h-5 text-amber-400" />
              <span className="text-sm font-bold text-white">{teamName}</span>
              {connectionStatus === 'connected' ? (
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <WifiOff className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
              )}
            </div>
            {myTeam && (
              <div className="flex items-center gap-4 text-xs">
                <span className="text-slate-400">
                  Purse: <span className="font-bold text-white">{formatCurrency(myTeam.purseRemaining)}</span>
                </span>
                <span className="text-slate-400">
                  Max Bid: <span className="font-bold text-amber-400">{formatCurrency(myTeam.maxBid)}</span>
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {/* Announcements */}
        {announcements.length > 0 && (
          <div className="mb-4 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <p className="text-sm text-amber-300">{announcements[0].message}</p>
            </div>
          </div>
        )}

        {/* Not live states */}
        {isPaused && (
          <div className="glass-card p-8 text-center mb-6">
            <div className="text-3xl mb-3">⏸️</div>
            <h2 className="text-xl font-bold text-white mb-1">Auction Paused</h2>
            <p className="text-sm text-slate-400">Bidding will resume shortly</p>
          </div>
        )}

        {isCompleted && (
          <div className="glass-card p-8 text-center mb-6">
            <div className="text-3xl mb-3">🏆</div>
            <h2 className="text-xl font-bold text-white mb-1">Auction Completed</h2>
            <p className="text-sm text-slate-400">{state.stats.sold} players sold</p>
          </div>
        )}

        {!isLive && !isPaused && !isCompleted && (
          <div className="glass-card p-8 text-center mb-6">
            <div className="text-3xl mb-3">⏳</div>
            <h2 className="text-xl font-bold text-white mb-1">Waiting to Start</h2>
            <p className="text-sm text-slate-400">The auction hasn&apos;t started yet</p>
          </div>
        )}

        {/* Live bidding view */}
        {isLive && bidding && (
          <div className="space-y-6">
            {/* Player + Timer */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
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
                <Timer expiresAt={bidding.timerExpiresAt} phase={bidding.status} />
              )}
            </div>

            {/* BID BUTTON — the hero */}
            {!['sold', 'unsold', 'waiting'].includes(bidding.status) && (
              <div className="space-y-3">
                {isHighestBidder ? (
                  <div className="glass-card p-5 text-center border-emerald-500/20 bg-emerald-500/5">
                    <div className="text-lg font-bold text-emerald-400 mb-1">✅ You are the highest bidder</div>
                    <p className="text-sm text-slate-400">Current bid: {formatCurrency(bidding.currentBid)}</p>
                  </div>
                ) : (
                  <button
                    onClick={handleBid}
                    disabled={!canBid || bidLoading}
                    className={`w-full py-5 sm:py-6 rounded-2xl text-center transition-all ${
                      canBid && !bidLoading
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-xl shadow-xl shadow-amber-500/30 hover:shadow-amber-500/50 hover:scale-[1.02] active:scale-[0.98]'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    {bidLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Bidding...
                      </span>
                    ) : canBid ? (
                      <span className="flex items-center justify-center gap-3">
                        <Gavel className="w-6 h-6" />
                        BID {formatCurrency(nextBidAmount)}
                      </span>
                    ) : !myTeam?.canBid ? (
                      'Insufficient Purse'
                    ) : (
                      'Waiting...'
                    )}
                  </button>
                )}

                {bidError && (
                  <div className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400 text-center">
                    {bidError}
                  </div>
                )}
              </div>
            )}

            {/* Bid history */}
            {bidding.bidHistory.length > 0 && (
              <div className="glass-card p-4">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Bid History</h3>
                <BidTicker bidHistory={bidding.bidHistory} teams={state.teams} maxItems={5} />
              </div>
            )}

            {/* My team info */}
            {myTeam && (
              <div className="glass-card p-4">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Your Team</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <div className="text-lg font-bold text-white">{formatCurrency(myTeam.purseRemaining)}</div>
                    <div className="text-[10px] text-slate-500">Purse Left</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-amber-400">{formatCurrency(myTeam.maxBid)}</div>
                    <div className="text-[10px] text-slate-500">Max Bid</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-white">{myTeam.squadSize}</div>
                    <div className="text-[10px] text-slate-500">Squad Size</div>
                  </div>
                </div>
              </div>
            )}

            {/* Teams overview (compact) */}
            <div>
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">All Teams</h3>
              <TeamPanel teams={state.teams} currentBidTeamId={bidding.currentBidTeamId} compact />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper to calculate bid increment on the client side (mirrors server logic)
function getIncrement(currentBid: number, config: any): number {
  // Simple approximation — server is authoritative
  if (currentBid < 100000) return 10000;
  if (currentBid < 500000) return 25000;
  return 50000;
}
