'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getMyAuctions } from '@/lib/api';
import { AUCTION_STATUSES } from '@/lib/constants';
import { Plus, Gavel, ChevronRight, Calendar, Users, UserCheck, Loader2 } from 'lucide-react';

interface Auction {
  _id: string;
  name: string;
  slug: string;
  status: string;
  config: {
    basePrice: number;
    purseValue: number;
  };
  scheduledStartTime?: string;
  createdAt: string;
  teamCount?: number;
  playerCount?: number;
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAuctions() {
      try {
        const res = await getMyAuctions();
        setAuctions(res.data || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load auctions');
      } finally {
        setLoading(false);
      }
    }
    loadAuctions();
  }, []);

  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Welcome header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Welcome back, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-slate-400 mt-1">Manage your cricket auctions</p>
        </div>
        <Link href="/admin/create" className="btn-primary text-sm sm:text-base">
          <Plus className="w-5 h-5" />
          Create Auction
        </Link>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        </div>
      ) : error ? (
        <div className="glass-card p-8 text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="btn-secondary text-sm">
            Retry
          </button>
        </div>
      ) : auctions.length === 0 ? (
        /* Empty state */
        <div className="glass-card p-12 sm:p-16 text-center max-w-xl mx-auto">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center mx-auto mb-6">
            <Gavel className="w-10 h-10 text-amber-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-3">No Auctions Yet</h2>
          <p className="text-slate-400 mb-8 leading-relaxed">
            Create your first cricket player auction. Set up teams, import players,
            configure bid increments, and go live in minutes.
          </p>
          <Link href="/admin/create" className="btn-primary text-base">
            <Plus className="w-5 h-5" />
            Create Your First Auction
          </Link>
        </div>
      ) : (
        /* Auction grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {auctions.map((auction) => {
            const statusConfig = AUCTION_STATUSES[auction.status as keyof typeof AUCTION_STATUSES] || AUCTION_STATUSES.draft;
            return (
              <Link
                key={auction._id}
                href={`/admin/${auction._id}`}
                className="glass-card-hover p-5 sm:p-6 group"
              >
                {/* Status + name */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-2 h-2 rounded-full ${statusConfig.dot}`} />
                      <span className={`text-xs font-semibold uppercase tracking-wider ${statusConfig.color}`}>
                        {statusConfig.label}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-white truncate group-hover:text-amber-400 transition-colors">
                      {auction.name}
                    </h3>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-amber-400 group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center p-2 rounded-lg bg-slate-800/50">
                    <div className="text-sm font-bold text-white">{formatCurrency(auction.config.purseValue)}</div>
                    <div className="text-[10px] text-slate-500 uppercase">Purse</div>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-slate-800/50">
                    <div className="text-sm font-bold text-white flex items-center justify-center gap-1">
                      <Users className="w-3 h-3 text-slate-400" />
                      {auction.teamCount || 0}
                    </div>
                    <div className="text-[10px] text-slate-500 uppercase">Teams</div>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-slate-800/50">
                    <div className="text-sm font-bold text-white flex items-center justify-center gap-1">
                      <UserCheck className="w-3 h-3 text-slate-400" />
                      {auction.playerCount || 0}
                    </div>
                    <div className="text-[10px] text-slate-500 uppercase">Players</div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Calendar className="w-3 h-3" />
                  {auction.scheduledStartTime
                    ? `Scheduled: ${new Date(auction.scheduledStartTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
                    : `Created: ${new Date(auction.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
                  }
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
