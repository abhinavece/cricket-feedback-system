'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  getAuctionAdmin, configureAuction, goLiveAuction,
  pauseAuction, resumeAuction, completeAuction,
} from '@/lib/api';
import { AUCTION_STATUSES, PLAYER_ROLES } from '@/lib/constants';
import {
  Loader2, Gavel, Users, UserCheck, IndianRupee, Clock,
  Play, Pause, Square, CheckCircle, AlertTriangle, Copy, ExternalLink,
} from 'lucide-react';

interface AuctionDetail {
  _id: string;
  name: string;
  slug: string;
  status: string;
  description?: string;
  config: {
    basePrice: number;
    purseValue: number;
    minSquadSize: number;
    maxSquadSize: number;
    bidIncrementPreset: string;
    retentionEnabled: boolean;
    maxRetentions: number;
    tradeWindowHours: number;
  };
  admins: { userId: string; role: string; email: string }[];
  teams: any[];
  playerStats: Record<string, number>;
  scheduledStartTime?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  currentRound?: number;
}

export default function AuctionOverviewPage() {
  const params = useParams();
  const router = useRouter();
  const auctionId = params.auctionId as string;

  const [auction, setAuction] = useState<AuctionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadAuction = useCallback(async () => {
    try {
      const res = await getAuctionAdmin(auctionId);
      setAuction(res.data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [auctionId]);

  useEffect(() => { loadAuction(); }, [loadAuction]);

  const handleLifecycleAction = async (action: string) => {
    if (!auction) return;
    setActionLoading(action);
    try {
      let res;
      switch (action) {
        case 'configure': res = await configureAuction(auctionId); break;
        case 'go-live': res = await goLiveAuction(auctionId); break;
        case 'pause': res = await pauseAuction(auctionId); break;
        case 'resume': res = await resumeAuction(auctionId); break;
        case 'complete': res = await completeAuction(auctionId); break;
        default: return;
      }
      await loadAuction();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)} Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(0)} Lakh`;
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const copySlugUrl = () => {
    const url = `${window.location.origin}/${auction?.slug}`;
    navigator.clipboard.writeText(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  if (error || !auction) {
    return (
      <div className="glass-card p-8 text-center">
        <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <p className="text-red-400 mb-4">{error || 'Auction not found'}</p>
        <button onClick={() => router.push('/admin')} className="btn-secondary text-sm">
          Back to Dashboard
        </button>
      </div>
    );
  }

  const statusConfig = AUCTION_STATUSES[auction.status as keyof typeof AUCTION_STATUSES] || AUCTION_STATUSES.draft;
  const totalPlayers = Object.values(auction.playerStats).reduce((sum, n) => sum + n, 0);
  const teamCount = auction.teams.length;

  return (
    <div className="space-y-6">
      {/* Auction header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className={`badge ${statusConfig.bg} ${statusConfig.color}`}>
              <div className={`w-2 h-2 rounded-full ${statusConfig.dot}`} />
              {statusConfig.label}
            </div>
            {auction.currentRound && auction.status === 'live' && (
              <span className="text-xs text-slate-400">Round {auction.currentRound}</span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">{auction.name}</h1>
          {auction.description && (
            <p className="text-slate-400 mt-1 text-sm">{auction.description}</p>
          )}
        </div>

        {/* Public link */}
        <button
          onClick={copySlugUrl}
          className="btn-ghost text-xs gap-1.5 border border-white/10 rounded-lg"
          title="Copy public URL"
        >
          <Copy className="w-3.5 h-3.5" />
          /{auction.slug}
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          icon={<Users className="w-5 h-5 text-blue-400" />}
          label="Teams"
          value={String(teamCount)}
          sub={`of ${auction.config.maxSquadSize} max squad`}
        />
        <StatCard
          icon={<UserCheck className="w-5 h-5 text-emerald-400" />}
          label="Players"
          value={String(totalPlayers)}
          sub={`${auction.playerStats.pool || 0} in pool`}
        />
        <StatCard
          icon={<IndianRupee className="w-5 h-5 text-amber-400" />}
          label="Purse"
          value={formatCurrency(auction.config.purseValue)}
          sub={`Base: ${formatCurrency(auction.config.basePrice)}`}
        />
        <StatCard
          icon={<Clock className="w-5 h-5 text-purple-400" />}
          label="Created"
          value={new Date(auction.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          sub={auction.startedAt ? `Live: ${new Date(auction.startedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` : 'Not started'}
        />
      </div>

      {/* Player breakdown */}
      {totalPlayers > 0 && (
        <div className="glass-card p-5 sm:p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Player Breakdown</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { key: 'pool', label: 'In Pool', color: 'text-blue-400', bg: 'bg-blue-500/10' },
              { key: 'sold', label: 'Sold', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
              { key: 'unsold', label: 'Unsold', color: 'text-orange-400', bg: 'bg-orange-500/10' },
              { key: 'disqualified', label: 'Disqualified', color: 'text-red-400', bg: 'bg-red-500/10' },
            ].map(item => (
              <div key={item.key} className={`p-3 rounded-xl ${item.bg} text-center`}>
                <div className={`text-2xl font-bold ${item.color}`}>
                  {auction.playerStats[item.key] || 0}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lifecycle controls */}
      <div className="glass-card p-5 sm:p-6">
        <h3 className="text-sm font-semibold text-white mb-4">Auction Controls</h3>
        <LifecycleControls
          status={auction.status}
          teamCount={teamCount}
          playerCount={totalPlayers}
          loading={actionLoading}
          onAction={handleLifecycleAction}
        />
      </div>

      {/* Quick config summary */}
      <div className="glass-card p-5 sm:p-6">
        <h3 className="text-sm font-semibold text-white mb-4">Configuration</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
          {[
            { label: 'Base Price', value: formatCurrency(auction.config.basePrice) },
            { label: 'Team Purse', value: formatCurrency(auction.config.purseValue) },
            { label: 'Squad Size', value: `${auction.config.minSquadSize} – ${auction.config.maxSquadSize}` },
            { label: 'Bid Preset', value: auction.config.bidIncrementPreset },
            { label: 'Retention', value: auction.config.retentionEnabled ? `Enabled (max ${auction.config.maxRetentions})` : 'Disabled' },
            { label: 'Trade Window', value: `${auction.config.tradeWindowHours || 48}h` },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
              <span className="text-sm text-slate-400">{item.label}</span>
              <span className="text-sm font-medium text-white">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Admins */}
      <div className="glass-card p-5 sm:p-6">
        <h3 className="text-sm font-semibold text-white mb-4">Admins</h3>
        <div className="space-y-2">
          {auction.admins.map(admin => (
            <div key={admin.userId} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/30">
              <div>
                <span className="text-sm text-white">{admin.email}</span>
                <span className={`ml-2 badge text-[10px] ${admin.role === 'owner' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-600/30 text-slate-400'}`}>
                  {admin.role}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) {
  return (
    <div className="glass-card p-4">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs text-slate-400 uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-xl sm:text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-slate-500 mt-0.5">{sub}</div>
    </div>
  );
}

function LifecycleControls({ status, teamCount, playerCount, loading, onAction }: {
  status: string;
  teamCount: number;
  playerCount: number;
  loading: string | null;
  onAction: (action: string) => void;
}) {
  const FLOW: Record<string, { label: string; action: string; icon: any; color: string; confirm?: string; disabled?: boolean; disabledReason?: string }[]> = {
    draft: [{
      label: 'Lock Configuration',
      action: 'configure',
      icon: CheckCircle,
      color: 'from-blue-500 to-cyan-500',
      confirm: 'This will lock the auction config. Teams and players must be ready. Continue?',
      disabled: teamCount < 2 || playerCount < teamCount,
      disabledReason: teamCount < 2 ? 'Need at least 2 teams' : playerCount < teamCount ? 'Need at least as many players as teams' : undefined,
    }],
    configured: [{
      label: 'Go Live',
      action: 'go-live',
      icon: Play,
      color: 'from-red-500 to-rose-500',
      confirm: 'Start the auction? This will make it live for all teams and spectators.',
    }],
    live: [
      {
        label: 'Pause',
        action: 'pause',
        icon: Pause,
        color: 'from-yellow-500 to-amber-500',
        confirm: 'Pause the auction? If mid-bid, the current player returns to pool.',
      },
      {
        label: 'End Auction',
        action: 'complete',
        icon: Square,
        color: 'from-slate-500 to-slate-600',
        confirm: 'End the auction now? This cannot be undone.',
      },
    ],
    paused: [
      {
        label: 'Resume',
        action: 'resume',
        icon: Play,
        color: 'from-emerald-500 to-teal-500',
      },
      {
        label: 'End Auction',
        action: 'complete',
        icon: Square,
        color: 'from-slate-500 to-slate-600',
        confirm: 'End the auction now? This cannot be undone.',
      },
    ],
  };

  const actions = FLOW[status] || [];

  if (actions.length === 0) {
    const message = status === 'completed' ? 'Auction completed. Trade window is active.'
      : status === 'trade_window' ? 'Trade window is open.'
      : status === 'finalized' ? 'Auction is finalized. No further actions.'
      : 'No actions available.';
    return <p className="text-sm text-slate-400">{message}</p>;
  }

  return (
    <div className="flex flex-wrap gap-3">
      {actions.map(act => {
        const Icon = act.icon;
        const isLoading = loading === act.action;
        const isDisabled = act.disabled || !!loading;
        return (
          <div key={act.action} className="flex flex-col items-start">
            <button
              onClick={() => {
                if (act.confirm && !window.confirm(act.confirm)) return;
                onAction(act.action);
              }}
              disabled={isDisabled}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all shadow-lg
                bg-gradient-to-r ${act.color}
                ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'hover:shadow-xl hover:scale-[1.02]'}
              `}
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
              {act.label}
            </button>
            {act.disabledReason && act.disabled && (
              <span className="text-[11px] text-red-400 mt-1 ml-1">{act.disabledReason}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
