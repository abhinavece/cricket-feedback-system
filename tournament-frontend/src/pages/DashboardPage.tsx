import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Trophy,
  Plus,
  Users,
  Building2,
  BarChart3,
  Calendar,
  ChevronRight,
  Search,
  MoreVertical,
  Trash2,
  Edit,
  X,
} from 'lucide-react';
import { tournamentApi } from '../services/api';
import type { Tournament } from '../types';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  // Fetch tournaments
  const { data, isLoading, error, refetch, isError } = useQuery({
    queryKey: ['tournaments'],
    queryFn: () => tournamentApi.list(),
    retry: (failureCount, error: any) => {
      // Don't retry on NO_ORGANIZATION – backend will auto-create org on next request after fix
      if (error?.response?.data?.code === 'NO_ORGANIZATION') return false;
      return failureCount < 2;
    },
  });

  const tournaments = data?.data || [];
  const noOrgError = isError && (error as any)?.response?.data?.code === 'NO_ORGANIZATION';

  // Filter by search
  const filteredTournaments = tournaments.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-accent-500/20 text-accent-400 border-accent-500/30';
      case 'completed':
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
      default:
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl text-white">
            YOUR TOURNAMENTS
          </h1>
          <p className="text-slate-400 mt-1">
            Manage and monitor all your cricket tournaments
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center gap-2 self-start"
        >
          <Plus className="w-4 h-4" />
          New Tournament
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          placeholder="Search tournaments..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input-field pl-10"
        />
      </div>

      {/* No organization – backend should auto-create; offer retry */}
      {noOrgError && (
        <div className="glass-panel p-6 text-center">
          <p className="text-slate-300 mb-2">Setting up your tournament workspace…</p>
          <p className="text-sm text-slate-500 mb-4">
            You’re not in an organization yet. Refresh or retry to create one automatically.
          </p>
          <button onClick={() => refetch()} className="btn-primary">
            Retry
          </button>
        </div>
      )}

      {/* Tournament grid */}
      {!noOrgError && isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="stat-card h-48 animate-pulse">
              <div className="p-5 space-y-4">
                <div className="h-6 bg-white/5 rounded w-3/4" />
                <div className="h-4 bg-white/5 rounded w-1/2" />
                <div className="flex gap-4 mt-6">
                  <div className="h-12 bg-white/5 rounded flex-1" />
                  <div className="h-12 bg-white/5 rounded flex-1" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!noOrgError && !isLoading && filteredTournaments.length === 0 && (
        <div className="text-center py-16">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-broadcast-700/50 flex items-center justify-center">
            <Trophy className="w-10 h-10 text-slate-600" />
          </div>
          <h3 className="font-heading text-xl uppercase text-slate-400 mb-2">
            No tournaments yet
          </h3>
          <p className="text-slate-500 mb-6">
            Create your first tournament to get started
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Tournament
          </button>
        </div>
      )}

      {!noOrgError && !isLoading && filteredTournaments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTournaments.map((tournament, index) => (
            <TournamentCard
              key={tournament._id}
              tournament={tournament}
              index={index}
              isMenuOpen={activeMenu === tournament._id}
              onMenuToggle={() => setActiveMenu(activeMenu === tournament._id ? null : tournament._id)}
              onNavigate={() => navigate(`/tournament/${tournament._id}`)}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateTournamentModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
};

// Tournament Card Component
const TournamentCard: React.FC<{
  tournament: Tournament;
  index: number;
  isMenuOpen: boolean;
  onMenuToggle: () => void;
  onNavigate: () => void;
}> = ({ tournament, index, isMenuOpen, onMenuToggle, onNavigate }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-accent-500/20 text-accent-400 border-accent-500/30';
      case 'completed':
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
      default:
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    }
  };

  return (
    <div
      className="stat-card group cursor-pointer hover:border-white/10 transition-all duration-200 animate-slide-up"
      style={{ animationDelay: `${index * 50}ms` }}
      onClick={onNavigate}
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-heading text-lg uppercase text-white truncate group-hover:text-accent-400 transition-colors">
              {tournament.name}
            </h3>
            <span className={`inline-flex px-2 py-0.5 rounded text-[10px] uppercase tracking-wider border ${getStatusColor(tournament.status)}`}>
              {tournament.status}
            </span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMenuToggle();
            }}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 rounded-lg bg-broadcast-700/50">
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <Users className="w-3.5 h-3.5" />
              <span className="text-[10px] uppercase tracking-wider">Players</span>
            </div>
            <p className="score-display text-2xl text-white">
              {tournament.playerCount || 0}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-broadcast-700/50">
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <Building2 className="w-3.5 h-3.5" />
              <span className="text-[10px] uppercase tracking-wider">Teams</span>
            </div>
            <p className="score-display text-2xl text-white">
              {tournament.franchiseCount || 0}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-white/5">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Calendar className="w-3.5 h-3.5" />
            {tournament.startDate
              ? new Date(tournament.startDate).toLocaleDateString()
              : 'No date set'}
          </div>
          <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-accent-400 transition-colors" />
        </div>
      </div>

      {/* Dropdown menu */}
      {isMenuOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); onMenuToggle(); }} />
          <div className="absolute right-4 top-12 w-40 py-1 bg-broadcast-700 border border-white/10 rounded-lg shadow-xl z-50 animate-fade-in">
            <button
              onClick={(e) => { e.stopPropagation(); /* TODO: Edit */ }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-white/5"
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); /* TODO: Delete */ }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-400 hover:bg-white/5"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
};

// Create Tournament Modal
const CreateTournamentModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');

  const createMutation = useMutation({
    mutationFn: (data: Partial<Tournament>) => tournamentApi.create(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      if (response.success && response.data) {
        navigate(`/tournament/${response.data._id}`);
      }
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createMutation.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
      startDate: startDate || undefined,
      status: 'draft',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md glass-panel p-6 animate-slide-up">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <h2 className="font-display text-2xl text-white">CREATE TOURNAMENT</h2>
          <p className="text-sm text-slate-400">Set up a new cricket tournament</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-heading uppercase tracking-wider text-slate-400 mb-1.5">
              Tournament Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., IPL 2026"
              className="input-field"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-heading uppercase tracking-wider text-slate-400 mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description..."
              rows={3}
              className="input-field resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-heading uppercase tracking-wider text-slate-400 mb-1.5">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input-field"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || createMutation.isPending}
              className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createMutation.isPending ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DashboardPage;
