import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Star,
  Calendar,
  MapPin,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  TrendingUp
} from 'lucide-react';
import { getPlayerFeedback } from '../services/api';

interface FeedbackStats {
  totalFeedback: number;
  avgBatting: number;
  avgBowling: number;
  avgFielding: number;
  avgTeamSpirit: number;
}

interface MatchInfo {
  _id: string;
  opponent: string;
  date: string;
  ground: string;
  slot: string;
}

interface FeedbackItem {
  _id: string;
  playerName: string;
  matchDate: string;
  batting: number;
  bowling: number;
  fielding: number;
  teamSpirit: number;
  feedbackText: string;
  additionalComments?: string;
  issues: {
    venue: boolean;
    equipment: boolean;
    timing: boolean;
    umpiring: boolean;
    other: boolean;
  };
  createdAt: string;
  feedbackType: 'match' | 'general';
  matchId?: MatchInfo;
}

interface PlayerFeedbackHistoryProps {
  playerId: string;
  playerName?: string;
  compact?: boolean;
}

const PlayerFeedbackHistory: React.FC<PlayerFeedbackHistoryProps> = ({
  playerId,
  playerName,
  compact = false
}) => {
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedFeedback, setExpandedFeedback] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getPlayerFeedback(playerId);
      setStats(response.stats);
      setFeedback(response.feedback);
    } catch (err: any) {
      console.error('Error fetching player feedback:', err);
      setError('Failed to load feedback history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (playerId) {
      fetchData();
    }
  }, [playerId]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-3 h-3 ${star <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`}
          />
        ))}
      </div>
    );
  };

  const getAverageRating = (item: FeedbackItem) => {
    return (item.batting + item.bowling + item.fielding + item.teamSpirit) / 4;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 text-center">
        <p className="text-red-400">{error}</p>
        <button
          onClick={fetchData}
          className="mt-2 text-sm text-red-300 hover:text-red-200 flex items-center gap-1 mx-auto"
        >
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  if (!stats || stats.totalFeedback === 0) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-white/10 text-center">
        <MessageSquare className="w-10 h-10 text-slate-600 mx-auto mb-3" />
        <p className="text-slate-400 mb-1">No feedback history</p>
        <p className="text-xs text-slate-500">
          {playerName || 'This player'} hasn't submitted any match feedback yet.
        </p>
      </div>
    );
  }

  const overallAvg = (stats.avgBatting + stats.avgBowling + stats.avgFielding + stats.avgTeamSpirit) / 4;

  return (
    <div className="space-y-4">
      {/* Stats Card */}
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-4 border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            Feedback Stats
          </h3>
          <span className="text-xs px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-full">
            {stats.totalFeedback} {stats.totalFeedback === 1 ? 'feedback' : 'feedbacks'}
          </span>
        </div>

        {/* Overall Average */}
        <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-300">Overall Average</span>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-white">{overallAvg.toFixed(1)}</span>
              {renderStars(Math.round(overallAvg))}
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        {!compact && (
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Batting', value: stats.avgBatting, emoji: '🏏' },
              { label: 'Bowling', value: stats.avgBowling, emoji: '⚡' },
              { label: 'Fielding', value: stats.avgFielding, emoji: '🎯' },
              { label: 'Team Spirit', value: stats.avgTeamSpirit, emoji: '💪' },
            ].map(({ label, value, emoji }) => (
              <div key={label} className="bg-slate-900/50 rounded-lg p-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{emoji}</span>
                  <span className="text-xs text-slate-400">{label}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm font-bold text-white">{value.toFixed(1)}</span>
                  {renderStars(Math.round(value))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Feedback List */}
      {!compact && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 px-1">
            <MessageSquare className="w-4 h-4 text-emerald-400" />
            Feedback History
          </h3>

          {feedback.map((item) => (
            <div
              key={item._id}
              className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-white/10 overflow-hidden"
            >
              <button
                onClick={() => setExpandedFeedback(expandedFeedback === item._id ? null : item._id)}
                className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-700/30 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {item.matchId ? (
                      <>
                        <span className="text-sm font-medium text-emerald-400">
                          vs {item.matchId.opponent || 'Unknown'}
                        </span>
                        <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs">
                          Match
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-sm font-medium text-slate-300">
                          {formatDate(item.matchDate)}
                        </span>
                        <span className="px-1.5 py-0.5 bg-slate-500/20 text-slate-400 rounded text-xs">
                          General
                        </span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {item.matchId ? formatDate(item.matchId.date) : formatDate(item.matchDate)}
                    </span>
                    {item.matchId?.ground && (
                      <span className="flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3" />
                        {item.matchId.ground}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <span className="text-sm text-slate-300">{getAverageRating(item).toFixed(1)}</span>
                  </div>
                  {expandedFeedback === item._id ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </button>

              {expandedFeedback === item._id && (
                <div className="px-4 pb-4 space-y-3 border-t border-slate-700">
                  {/* Ratings Grid */}
                  <div className="grid grid-cols-4 gap-2 pt-3">
                    {[
                      { label: 'Bat', value: item.batting },
                      { label: 'Bowl', value: item.bowling },
                      { label: 'Field', value: item.fielding },
                      { label: 'Spirit', value: item.teamSpirit },
                    ].map(({ label, value }) => (
                      <div key={label} className="text-center">
                        <p className="text-xs text-slate-500">{label}</p>
                        <p className="text-sm font-bold text-white">{value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Feedback Text */}
                  <div className="bg-slate-900/50 rounded-lg p-3">
                    <p className="text-sm text-slate-300">{item.feedbackText}</p>
                  </div>

                  {/* Additional Comments */}
                  {item.additionalComments && (
                    <div className="bg-slate-900/50 rounded-lg p-3">
                      <p className="text-xs text-slate-500 mb-1">Additional Comments:</p>
                      <p className="text-sm text-slate-400">{item.additionalComments}</p>
                    </div>
                  )}

                  {/* Issues */}
                  {Object.entries(item.issues).some(([_, v]) => v) && (
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(item.issues).map(([key, value]) =>
                        value ? (
                          <span key={key} className="px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-full text-xs">
                            {key.charAt(0).toUpperCase() + key.slice(1)}
                          </span>
                        ) : null
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Refresh Button */}
      <button
        onClick={fetchData}
        className="w-full py-2 px-4 bg-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors flex items-center justify-center gap-2 text-sm"
      >
        <RefreshCw className="w-4 h-4" />
        Refresh
      </button>
    </div>
  );
};

export default PlayerFeedbackHistory;
