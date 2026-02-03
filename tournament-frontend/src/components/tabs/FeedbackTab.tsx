import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Search,
  Star,
  User,
  ChevronDown,
  MessageSquare,
  Filter,
} from 'lucide-react';
import { feedbackApi, playerApi, franchiseApi } from '../../services/api';
import type { TournamentFeedback, TournamentPlayer, Franchise } from '../../types';

interface FeedbackTabProps {
  tournamentId: string;
}

const FeedbackTab: React.FC<FeedbackTabProps> = ({ tournamentId }) => {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterPlayer, setFilterPlayer] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch feedback
  const { data: feedbackData, isLoading: loadingFeedback } = useQuery({
    queryKey: ['feedback', tournamentId, filterPlayer],
    queryFn: () => feedbackApi.list(tournamentId, { playerId: filterPlayer || undefined }),
  });

  // Fetch feedback stats
  const { data: statsData } = useQuery({
    queryKey: ['feedback-stats', tournamentId],
    queryFn: () => feedbackApi.getStats(tournamentId),
  });

  // Fetch players for filter
  const { data: playersData } = useQuery({
    queryKey: ['players', tournamentId],
    queryFn: () => playerApi.list(tournamentId),
  });

  const feedbackList = feedbackData?.data || [];
  const stats = statsData?.data;
  const players = playersData?.data || [];

  const filteredFeedback = feedbackList.filter((f) =>
    f.playerName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getAvgRating = (f: TournamentFeedback) => {
    const ratings = [f.batting, f.bowling, f.fielding, f.teamSpirit].filter(Boolean) as number[];
    return ratings.length > 0 ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : '-';
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Feedback" value={stats?.totalFeedback || 0} />
        <StatCard label="Avg Batting" value={stats?.avgBatting?.toFixed(1) || '-'} icon="bat" />
        <StatCard label="Avg Bowling" value={stats?.avgBowling?.toFixed(1) || '-'} icon="ball" />
        <StatCard label="Avg Fielding" value={stats?.avgFielding?.toFixed(1) || '-'} icon="catch" />
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by player name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-10"
          />
        </div>

        {/* Player filter */}
        <div className="relative">
          <select
            value={filterPlayer}
            onChange={(e) => setFilterPlayer(e.target.value)}
            className="input-field pr-10 appearance-none min-w-[180px]"
          >
            <option value="">All Players</option>
            {players.map((p) => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
        </div>

        {/* Add button */}
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Feedback</span>
        </button>
      </div>

      {/* Feedback List */}
      {loadingFeedback ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="stat-card p-4 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white/5" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-white/5 rounded w-1/4" />
                  <div className="h-3 bg-white/5 rounded w-1/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredFeedback.length === 0 ? (
        <div className="text-center py-16 stat-card">
          <MessageSquare className="w-12 h-12 mx-auto mb-4 text-slate-600" />
          <h3 className="font-heading text-lg uppercase text-slate-400 mb-2">
            No feedback yet
          </h3>
          <p className="text-slate-500 text-sm mb-4">
            Start collecting player performance feedback
          </p>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Feedback
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredFeedback.map((feedback) => (
            <FeedbackCard key={feedback._id} feedback={feedback} avgRating={getAvgRating(feedback)} />
          ))}
        </div>
      )}

      {/* Add Feedback Modal */}
      {showAddModal && (
        <FeedbackFormModal
          tournamentId={tournamentId}
          players={players}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
};

// Stat Card
const StatCard: React.FC<{ label: string; value: string | number; icon?: string }> = ({ label, value, icon }) => (
  <div className="stat-card p-4">
    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">{label}</p>
    <p className="score-display text-2xl text-white">{value}</p>
  </div>
);

// Feedback Card
const FeedbackCard: React.FC<{ feedback: TournamentFeedback; avgRating: string }> = ({ feedback, avgRating }) => {
  return (
    <div className="stat-card p-4 hover:border-white/10 transition-colors">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-accent-500/20 flex items-center justify-center flex-shrink-0">
          <span className="font-heading text-accent-400">
            {feedback.playerName?.charAt(0)?.toUpperCase() || '?'}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-heading text-white">
              {feedback.playerName || 'Unknown Player'}
            </h3>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-gold/20 text-gold text-xs">
              <Star className="w-3 h-3 fill-current" />
              {avgRating}
            </div>
          </div>

          {/* Ratings */}
          <div className="flex flex-wrap gap-3 text-xs">
            {feedback.batting && (
              <RatingBadge label="Batting" value={feedback.batting} />
            )}
            {feedback.bowling && (
              <RatingBadge label="Bowling" value={feedback.bowling} />
            )}
            {feedback.fielding && (
              <RatingBadge label="Fielding" value={feedback.fielding} />
            )}
            {feedback.teamSpirit && (
              <RatingBadge label="Spirit" value={feedback.teamSpirit} />
            )}
          </div>

          {/* Comments */}
          {feedback.comments && (
            <p className="text-sm text-slate-400 mt-2 line-clamp-2">
              "{feedback.comments}"
            </p>
          )}

          {/* Meta */}
          <p className="text-xs text-slate-600 mt-2">
            {new Date(feedback.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
};

// Rating Badge
const RatingBadge: React.FC<{ label: string; value: number }> = ({ label, value }) => {
  const getColor = (v: number) => {
    if (v >= 4) return 'text-emerald-400';
    if (v >= 3) return 'text-amber-400';
    return 'text-rose-400';
  };

  return (
    <span className="flex items-center gap-1.5 text-slate-500">
      {label}:
      <span className={`font-mono font-bold ${getColor(value)}`}>{value}</span>
    </span>
  );
};

// Feedback Form Modal
const FeedbackFormModal: React.FC<{
  tournamentId: string;
  players: TournamentPlayer[];
  onClose: () => void;
}> = ({ tournamentId, players, onClose }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    playerId: '',
    batting: 0,
    bowling: 0,
    fielding: 0,
    teamSpirit: 0,
    comments: '',
  });

  const mutation = useMutation({
    mutationFn: (data: Partial<TournamentFeedback>) => feedbackApi.create(tournamentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback', tournamentId] });
      queryClient.invalidateQueries({ queryKey: ['feedback-stats', tournamentId] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.playerId) return;
    
    const selectedPlayer = players.find((p) => p._id === formData.playerId);
    mutation.mutate({
      ...formData,
      playerName: selectedPlayer?.name,
      batting: formData.batting || undefined,
      bowling: formData.bowling || undefined,
      fielding: formData.fielding || undefined,
      teamSpirit: formData.teamSpirit || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md glass-panel p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition-colors"
        >
          <span className="sr-only">Close</span>
          ×
        </button>

        <h2 className="font-display text-2xl text-white mb-6">ADD FEEDBACK</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Player selection */}
          <div>
            <label className="block text-xs font-heading uppercase tracking-wider text-slate-400 mb-1.5">
              Select Player *
            </label>
            <select
              value={formData.playerId}
              onChange={(e) => setFormData({ ...formData, playerId: e.target.value })}
              className="input-field"
              required
            >
              <option value="">Choose a player</option>
              {players.map((p) => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Ratings */}
          <div className="space-y-4">
            <RatingInput
              label="Batting"
              value={formData.batting}
              onChange={(v) => setFormData({ ...formData, batting: v })}
            />
            <RatingInput
              label="Bowling"
              value={formData.bowling}
              onChange={(v) => setFormData({ ...formData, bowling: v })}
            />
            <RatingInput
              label="Fielding"
              value={formData.fielding}
              onChange={(v) => setFormData({ ...formData, fielding: v })}
            />
            <RatingInput
              label="Team Spirit"
              value={formData.teamSpirit}
              onChange={(v) => setFormData({ ...formData, teamSpirit: v })}
            />
          </div>

          {/* Comments */}
          <div>
            <label className="block text-xs font-heading uppercase tracking-wider text-slate-400 mb-1.5">
              Comments
            </label>
            <textarea
              value={formData.comments}
              onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
              placeholder="Optional feedback notes..."
              rows={3}
              className="input-field resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button
              type="submit"
              disabled={!formData.playerId || mutation.isPending}
              className="btn-primary flex-1 disabled:opacity-50"
            >
              {mutation.isPending ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Rating Input Component
const RatingInput: React.FC<{
  label: string;
  value: number;
  onChange: (value: number) => void;
}> = ({ label, value, onChange }) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-heading uppercase tracking-wider text-slate-400">
          {label}
        </label>
        <span className="text-sm font-mono text-white">{value || '-'}</span>
      </div>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => onChange(rating === value ? 0 : rating)}
            className={`flex-1 h-10 rounded-lg font-heading text-sm transition-all ${
              rating <= value
                ? 'bg-gold/30 text-gold border border-gold/50'
                : 'bg-broadcast-700/50 text-slate-500 border border-white/5 hover:border-white/20'
            }`}
          >
            {rating}
          </button>
        ))}
      </div>
    </div>
  );
};

export default FeedbackTab;
