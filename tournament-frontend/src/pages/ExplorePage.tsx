import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Users,
  Calendar,
  Trophy,
  ArrowRight,
  Sparkles,
  Clock,
  MapPin,
  ChevronRight,
  ExternalLink,
  Globe,
  Filter,
  X,
} from 'lucide-react';
import api from '../services/api';

interface TournamentSummary {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  status: 'draft' | 'published' | 'ongoing' | 'completed';
  startDate?: string;
  endDate?: string;
  branding?: {
    logo?: string;
    coverImage?: string;
    primaryColor?: string;
  };
  settings?: {
    isPublic?: boolean;
  };
  stats?: {
    entryCount: number;
    teamCount: number;
  };
  publicToken?: string;
  createdAt: string;
  playerCount?: number;
  franchiseCount?: number;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return 'TBD';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'ongoing':
      return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    case 'published':
      return 'bg-violet-500/20 text-violet-400 border-violet-500/30';
    case 'completed':
      return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    default:
      return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'ongoing':
      return 'Live';
    case 'published':
      return 'Upcoming';
    case 'completed':
      return 'Completed';
    default:
      return 'Draft';
  }
}

const TournamentCard: React.FC<{ tournament: TournamentSummary }> = ({ tournament }) => {
  const coverImage = tournament.branding?.coverImage;
  const primaryColor = tournament.branding?.primaryColor || '#8b5cf6';

  return (
    <div className="group relative bg-broadcast-800/50 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden hover:border-violet-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-violet-500/10">
      {/* Cover Image or Gradient */}
      <div className="relative h-40 overflow-hidden">
        {coverImage ? (
          <img
            src={coverImage}
            alt={tournament.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div
            className="w-full h-full"
            style={{
              background: `linear-gradient(135deg, ${primaryColor}40 0%, ${primaryColor}10 100%)`,
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-broadcast-800 via-transparent to-transparent" />
        
        {/* Status Badge */}
        <div className="absolute top-3 right-3">
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(tournament.status)}`}>
            {getStatusLabel(tournament.status)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="text-lg font-bold text-white mb-2 group-hover:text-violet-400 transition-colors line-clamp-1">
          {tournament.name}
        </h3>
        
        {tournament.description && (
          <p className="text-sm text-slate-400 mb-4 line-clamp-2">
            {tournament.description}
          </p>
        )}

        {/* Stats Row */}
        <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            <span>{tournament.playerCount || tournament.stats?.entryCount || 0} players</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Trophy className="w-4 h-4" />
            <span>{tournament.franchiseCount || tournament.stats?.teamCount || 0} teams</span>
          </div>
        </div>

        {/* Date */}
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
          <Calendar className="w-3.5 h-3.5" />
          <span>
            {tournament.startDate
              ? `${formatDate(tournament.startDate)}${tournament.endDate ? ` - ${formatDate(tournament.endDate)}` : ''}`
              : 'Dates TBD'}
          </span>
        </div>

        {/* Action Button */}
        {tournament.publicToken && (
          <Link
            to={`/share/tournament/${tournament.publicToken}`}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-violet-500/10 text-violet-400 font-medium text-sm hover:bg-violet-500/20 transition-colors"
          >
            <Globe className="w-4 h-4" />
            View Tournament
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>
    </div>
  );
};

const ExplorePage: React.FC = () => {
  const [tournaments, setTournaments] = useState<TournamentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchPublicTournaments();
  }, []);

  const fetchPublicTournaments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/api/tournaments/public');
      setTournaments(response.data.data || []);
    } catch (err: any) {
      console.error('Error fetching public tournaments:', err);
      setError(err.response?.data?.error || 'Failed to load tournaments');
      setTournaments([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter tournaments
  const filteredTournaments = tournaments.filter((t) => {
    const matchesSearch =
      !searchQuery ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Group by status
  const liveTournaments = filteredTournaments.filter((t) => t.status === 'ongoing');
  const upcomingTournaments = filteredTournaments.filter((t) => t.status === 'published');
  const completedTournaments = filteredTournaments.filter((t) => t.status === 'completed');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 mb-4">
          <Sparkles className="w-4 h-4 text-violet-400" />
          <span className="text-sm font-medium text-violet-300">Discover Tournaments</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
          Explore <span className="text-violet-400">Tournaments</span>
        </h1>
        <p className="text-slate-400 max-w-xl mx-auto">
          Browse public cricket tournaments. View player pools, team rosters, and tournament details.
        </p>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="text"
            placeholder="Search tournaments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-broadcast-800/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-slate-500" />
            </button>
          )}
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-slate-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 bg-broadcast-800/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-violet-500/50 transition-colors appearance-none cursor-pointer min-w-[140px]"
          >
            <option value="all">All Status</option>
            <option value="ongoing">Live</option>
            <option value="published">Upcoming</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="text-center py-20 bg-broadcast-800/50 rounded-2xl border border-white/10">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">Failed to load tournaments</h3>
          <p className="text-slate-400 mb-6">{error}</p>
          <button
            onClick={fetchPublicTournaments}
            className="px-6 py-2.5 bg-violet-500/20 text-violet-400 rounded-lg hover:bg-violet-500/30 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredTournaments.length === 0 && (
        <div className="text-center py-20 bg-broadcast-800/50 rounded-2xl border border-white/10">
          <div className="w-16 h-16 rounded-2xl bg-violet-500/10 flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8 text-violet-400" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No tournaments found</h3>
          <p className="text-slate-400 mb-6">
            {searchQuery || statusFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'No public tournaments are available yet'}
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-violet-500 text-white rounded-lg hover:bg-violet-600 transition-colors"
          >
            <Trophy className="w-5 h-5" />
            Create Tournament
          </Link>
        </div>
      )}

      {/* Tournament Sections */}
      {!loading && !error && filteredTournaments.length > 0 && (
        <div className="space-y-12">
          {/* Live Tournaments */}
          {liveTournaments.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                <h2 className="text-xl font-bold text-white">Live Now</h2>
                <span className="text-sm text-slate-500">({liveTournaments.length})</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {liveTournaments.map((tournament) => (
                  <TournamentCard key={tournament._id} tournament={tournament} />
                ))}
              </div>
            </section>
          )}

          {/* Upcoming Tournaments */}
          {upcomingTournaments.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-6">
                <Clock className="w-5 h-5 text-violet-400" />
                <h2 className="text-xl font-bold text-white">Upcoming</h2>
                <span className="text-sm text-slate-500">({upcomingTournaments.length})</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcomingTournaments.map((tournament) => (
                  <TournamentCard key={tournament._id} tournament={tournament} />
                ))}
              </div>
            </section>
          )}

          {/* Completed Tournaments */}
          {completedTournaments.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-6">
                <Trophy className="w-5 h-5 text-slate-400" />
                <h2 className="text-xl font-bold text-white">Completed</h2>
                <span className="text-sm text-slate-500">({completedTournaments.length})</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {completedTournaments.map((tournament) => (
                  <TournamentCard key={tournament._id} tournament={tournament} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};

export default ExplorePage;
