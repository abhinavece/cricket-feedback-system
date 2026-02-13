'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  getAuctionAdmin, configureAuction, goLiveAuction,
  pauseAuction, resumeAuction, completeAuction,
  openTradeWindow, finalizeAuction, exportAuctionResults, cloneAuction,
  uploadAuctionCover,
} from '@/lib/api';
import ImageUploader from '@/components/auction/ImageUploader';
import { AUCTION_STATUSES, PLAYER_ROLES } from '@/lib/constants';
import {
  Loader2, Gavel, Users, UserCheck, IndianRupee, Clock,
  Play, Pause, Square, CheckCircle, AlertTriangle, Copy, ExternalLink,
  Radio, ChevronRight, ArrowLeftRight, Lock, Timer, Download, CopyPlus,
} from 'lucide-react';
import Link from 'next/link';
import ConfirmModal from '@/components/auction/ConfirmModal';

interface AuctionDetail {
  _id: string;
  name: string;
  slug: string;
  status: string;
  description?: string;
  coverImage?: string;
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
  tradeStats?: Record<string, number>;
  tradeWindowEndsAt?: string;
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
        case 'open-trade-window': res = await openTradeWindow(auctionId); break;
        case 'finalize': res = await finalizeAuction(auctionId); break;
        default: return;
      }
      // After going live or resuming, redirect to the live control panel
      if (action === 'go-live' || action === 'resume') {
        router.push(`/admin/${auctionId}/live`);
        return;
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      await loadAuction();
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

  const isAuctionLive = auction.status === 'live';
  const isAuctionPaused = auction.status === 'paused';

  return (
    <div className="space-y-6">
      {/* Live Control Panel Banner */}
      {(isAuctionLive || isAuctionPaused) && (
        <Link
          href={`/admin/${auctionId}/live`}
          className={`block p-4 sm:p-5 rounded-2xl border transition-all hover:scale-[1.005] ${
            isAuctionLive
              ? 'bg-red-500/10 border-red-500/20 hover:bg-red-500/15'
              : 'bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/15'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isAuctionLive ? 'bg-red-500/20' : 'bg-amber-500/20'
              }`}>
                <Radio className={`w-5 h-5 ${isAuctionLive ? 'text-red-400' : 'text-amber-400'}`} />
              </div>
              <div>
                <p className={`text-sm font-bold ${isAuctionLive ? 'text-red-400' : 'text-amber-400'}`}>
                  {isAuctionLive ? 'Auction is LIVE' : 'Auction is PAUSED'}
                </p>
                <p className="text-xs text-slate-400">
                  {isAuctionLive
                    ? 'Open Live Control Panel to manage bidding, next player, undo, and more'
                    : 'Open Live Control Panel to resume and manage the auction'
                  }
                </p>
              </div>
            </div>
            <div className={`flex items-center gap-1 text-sm font-semibold ${
              isAuctionLive ? 'text-red-400' : 'text-amber-400'
            }`}>
              Open Live Panel <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </Link>
      )}

      {/* Trade Window Banner */}
      {auction.status === 'trade_window' && (
        <TradeWindowBanner
          auctionId={auctionId}
          tradeWindowEndsAt={auction.tradeWindowEndsAt}
          tradeStats={auction.tradeStats}
        />
      )}

      {/* Finalized Banner */}
      {auction.status === 'finalized' && (
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-500/10 border border-slate-500/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-500/20 flex items-center justify-center">
              <Lock className="w-5 h-5 text-slate-300" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-300">Auction Finalized</p>
              <p className="text-xs text-slate-400">Results are permanent. No further changes possible.</p>
            </div>
          </div>
          {auction.tradeStats && Object.keys(auction.tradeStats).length > 0 && (
            <div className="flex items-center gap-4 mt-3 ml-13">
              {auction.tradeStats.executed ? (
                <span className="text-xs text-emerald-400">{auction.tradeStats.executed} trade(s) executed</span>
              ) : (
                <span className="text-xs text-slate-500">No trades were executed</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Cover image */}
      {auction.coverImage && (
        <div className="relative -mx-4 sm:-mx-6 mb-6 h-32 sm:h-48 overflow-hidden rounded-xl sm:rounded-none">
          <img src={auction.coverImage} alt={auction.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
        </div>
      )}

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

        <div className="flex items-center gap-2">
          {/* Clone Auction */}
          <button
            onClick={async () => {
              const name = prompt('Name for the cloned auction:', `${auction.name} (Copy)`);
              if (name === null) return;
              try {
                const res = await cloneAuction(auctionId, { name: name || undefined });
                router.push(`/admin/${res.data._id}`);
              } catch (err: any) { alert(err.message); }
            }}
            className="btn-ghost text-xs gap-1.5 border border-white/10 rounded-lg"
            title="Clone this auction"
          >
            <CopyPlus className="w-3.5 h-3.5" /> Clone
          </button>
          {/* Export Results */}
          {!['draft', 'configured'].includes(auction.status) && (
            <button
              onClick={async () => {
                try { await exportAuctionResults(auctionId); } catch (err: any) { alert(err.message); }
              }}
              className="btn-ghost text-xs gap-1.5 border border-white/10 rounded-lg"
              title="Export results to Excel"
            >
              <Download className="w-3.5 h-3.5" /> Export
            </button>
          )}
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
          auctionId={auctionId}
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

      {/* Cover Image */}
      {['draft', 'configured'].includes(auction.status) && (
        <div className="glass-card p-5 sm:p-6">
          <ImageUploader
            currentImageUrl={auction.coverImage}
            onUpload={async (file) => {
              const result = await uploadAuctionCover(auctionId, file);
              setAuction(prev => prev ? { ...prev, coverImage: result.data.coverImage } : prev);
              return result.data;
            }}
            label="Auction Cover Image"
          />
        </div>
      )}

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

function LifecycleControls({ status, teamCount, playerCount, loading, onAction, auctionId }: {
  status: string;
  teamCount: number;
  playerCount: number;
  loading: string | null;
  onAction: (action: string) => void;
  auctionId: string;
}) {
  const [confirmState, setConfirmState] = useState<{ open: boolean; action: string; title: string; message: string; variant: 'danger' | 'warning' | 'info' }>(
    { open: false, action: '', title: '', message: '', variant: 'warning' }
  );

  const VARIANT_MAP: Record<string, 'danger' | 'warning' | 'info'> = {
    configure: 'info',
    'go-live': 'warning',
    pause: 'warning',
    resume: 'info',
    complete: 'danger',
    'open-trade-window': 'info',
    finalize: 'danger',
  };

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
    completed: [
      {
        label: 'Open Trade Window',
        action: 'open-trade-window',
        icon: ArrowLeftRight,
        color: 'from-purple-500 to-violet-500',
        confirm: 'Open the trade window? Teams will be able to propose player swaps.',
      },
      {
        label: 'Finalize (Skip Trades)',
        action: 'finalize',
        icon: Lock,
        color: 'from-slate-500 to-slate-600',
        confirm: 'Finalize the auction without a trade window? Results become permanent.',
      },
    ],
    trade_window: [
      {
        label: 'Finalize Auction',
        action: 'finalize',
        icon: Lock,
        color: 'from-amber-500 to-orange-500',
        confirm: 'Finalize the auction? Any pending trades will be auto-rejected. Results become permanent.',
      },
    ],
  };

  const actions = FLOW[status] || [];

  if (actions.length === 0) {
    const message = status === 'finalized' ? 'Auction is finalized. Results are permanent.'
      : 'No actions available.';
    return <p className="text-sm text-slate-400">{message}</p>;
  }

  return (
    <div className="flex flex-wrap gap-3 items-center">
      {actions.map(act => {
        const Icon = act.icon;
        const isLoading = loading === act.action;
        const isDisabled = act.disabled || !!loading;
        return (
          <div key={act.action} className="flex flex-col items-start">
            <button
              onClick={() => {
                if (act.confirm) {
                  setConfirmState({
                    open: true,
                    action: act.action,
                    title: act.label,
                    message: act.confirm,
                    variant: VARIANT_MAP[act.action] || 'warning',
                  });
                } else {
                  onAction(act.action);
                }
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

      {/* Live Panel link for live/paused states */}
      {(status === 'live' || status === 'paused') && (
        <Link
          href={`/admin/${auctionId}/live`}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all shadow-lg bg-gradient-to-r from-red-500 to-rose-600 hover:shadow-xl hover:scale-[1.02]"
        >
          <Radio className="w-4 h-4" />
          Open Live Panel
          <ChevronRight className="w-4 h-4" />
        </Link>
      )}

      <ConfirmModal
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        variant={confirmState.variant}
        confirmLabel={confirmState.action === 'complete' || confirmState.action === 'finalize' ? 'Yes, proceed' : 'Confirm'}
        loading={!!loading}
        onConfirm={() => {
          onAction(confirmState.action);
          setConfirmState(prev => ({ ...prev, open: false }));
        }}
        onCancel={() => setConfirmState(prev => ({ ...prev, open: false }))}
      />
    </div>
  );
}

function TradeWindowBanner({ auctionId, tradeWindowEndsAt, tradeStats }: {
  auctionId: string;
  tradeWindowEndsAt?: string;
  tradeStats?: Record<string, number>;
}) {
  const [timeLeft, setTimeLeft] = useState('');
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!tradeWindowEndsAt) return;
    const update = () => {
      const diff = new Date(tradeWindowEndsAt).getTime() - Date.now();
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
  }, [tradeWindowEndsAt]);

  const pending = (tradeStats?.pending_counterparty || 0) + (tradeStats?.both_agreed || 0);
  const executed = tradeStats?.executed || 0;
  const rejected = (tradeStats?.rejected || 0) + (tradeStats?.cancelled || 0) + (tradeStats?.expired || 0);

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-purple-500/10 border border-purple-500/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
            <ArrowLeftRight className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-purple-400">Trade Window Active</p>
            <p className="text-xs text-slate-400">
              {tradeWindowEndsAt ? (
                isExpired ? (
                  <span className="text-red-400">Expired — finalize to close</span>
                ) : (
                  <>Closes in <span className="font-mono font-bold text-purple-300">{timeLeft}</span></>
                )
              ) : 'No timer set'}
            </p>
          </div>
        </div>
        <Link
          href={`/admin/${auctionId}/trades`}
          className="flex items-center gap-1 text-sm font-semibold text-purple-400 hover:text-purple-300 transition-colors"
        >
          View Trades <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Trade Stats */}
      <div className="flex items-center gap-4 mt-3 ml-13">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-amber-400" />
          <span className="text-xs text-slate-400">{pending} pending</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-xs text-slate-400">{executed} executed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-red-400" />
          <span className="text-xs text-slate-400">{rejected} rejected</span>
        </div>
      </div>
    </div>
  );
}
