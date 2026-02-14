import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Star,
  AlertTriangle,
  Link as LinkIcon,
  Copy,
  Check,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  User
} from 'lucide-react';
import { getMatchFeedback, generateFeedbackLink, deleteFeedbackLink } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface FeedbackStats {
  totalSubmissions: number;
  avgBatting: number;
  avgBowling: number;
  avgFielding: number;
  avgTeamSpirit: number;
  issues: {
    venue: number;
    equipment: number;
    timing: number;
    umpiring: number;
    other: number;
  };
}

interface FeedbackItem {
  _id: string;
  playerName: string;
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
  playerId?: {
    _id: string;
    name: string;
  };
}

interface FeedbackLinkInfo {
  token: string;
  url: string;
  expiresAt: string | null;
  accessCount: number;
  submissionCount: number;
  isActive: boolean;
}

interface MatchFeedbackDashboardProps {
  matchId: string;
  matchOpponent?: string;
}

const MatchFeedbackDashboard: React.FC<MatchFeedbackDashboardProps> = ({ matchId, matchOpponent }) => {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [feedbackLink, setFeedbackLink] = useState<FeedbackLinkInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [expandedFeedback, setExpandedFeedback] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getMatchFeedback(matchId);
      setStats(response.stats);
      setFeedback(response.feedback);
      setFeedbackLink(response.feedbackLink);
    } catch (err: any) {
      console.error('Error fetching match feedback:', err);
      setError('Failed to load feedback data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (matchId) {
      fetchData();
    }
  }, [matchId]);

  const handleGenerateLink = async () => {
    try {
      setGeneratingLink(true);
      const response = await generateFeedbackLink(matchId);
      setFeedbackLink({
        token: response.token,
        url: response.url,
        expiresAt: response.expiresAt,
        accessCount: response.accessCount || 0,
        submissionCount: response.submissionCount || 0,
        isActive: true
      });
    } catch (err) {
      console.error('Error generating feedback link:', err);
      setError('Failed to generate feedback link');
    } finally {
      setGeneratingLink(false);
    }
  };

  const handleCopyLink = async () => {
    if (!feedbackLink) return;
    const fullUrl = `${window.location.origin}/feedback/${feedbackLink.token}`;
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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

  const isAdminRole = isAdmin();

  return (
    <div className="space-y-4">
      {/* Feedback Link Section (Admin Only) */}
      {isAdminRole && (
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-4 border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-white">Feedback Link</h3>
            </div>
            {feedbackLink && (
              <span className="text-xs text-slate-400">
                {feedbackLink.submissionCount} submissions
              </span>
            )}
          </div>

          {feedbackLink ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/feedback/${feedbackLink.token}`}
                  className="flex-1 bg-slate-900/50 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-300 truncate"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-3 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-colors flex items-center gap-1"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span className="text-sm">{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
              {feedbackLink.expiresAt && (
                <p className="text-xs text-slate-500">
                  Expires: {formatDate(feedbackLink.expiresAt)}
                </p>
              )}
            </div>
          ) : (
            <button
              onClick={handleGenerateLink}
              disabled={generatingLink}
              className="w-full py-2 px-4 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {generatingLink ? (
                <>
                  <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <LinkIcon className="w-4 h-4" />
                  Generate Feedback Link
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Stats Summary */}
      {stats && stats.totalSubmissions > 0 ? (
        <>
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-4 border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                Feedback Summary
              </h3>
              <span className="text-xs px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-full">
                {stats.totalSubmissions} responses
              </span>
            </div>

            {/* Average Ratings */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                { label: 'Batting', value: stats.avgBatting, emoji: '🏏' },
                { label: 'Bowling', value: stats.avgBowling, emoji: '⚡' },
                { label: 'Fielding', value: stats.avgFielding, emoji: '🎯' },
                { label: 'Team Spirit', value: stats.avgTeamSpirit, emoji: '💪' },
              ].map(({ label, value, emoji }) => (
                <div key={label} className="bg-slate-900/50 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-sm">{emoji}</span>
                    <span className="text-xs text-slate-400">{label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-white">{value.toFixed(1)}</span>
                    {renderStars(Math.round(value))}
                  </div>
                </div>
              ))}
            </div>

            {/* Issues Breakdown */}
            {Object.values(stats.issues).some(v => v > 0) && (
              <div className="border-t border-slate-700 pt-3">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-medium text-slate-300">Issues Reported</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(stats.issues).map(([key, count]) =>
                    count > 0 ? (
                      <span key={key} className="px-2 py-1 bg-amber-500/20 text-amber-400 rounded-full text-xs">
                        {key.charAt(0).toUpperCase() + key.slice(1)}: {count}
                      </span>
                    ) : null
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Feedback List */}
          <div className="space-y-2">
            {feedback.map((item) => (
              <div
                key={item._id}
                className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-white/10 overflow-hidden"
              >
                <button
                  onClick={() => setExpandedFeedback(expandedFeedback === item._id ? null : item._id)}
                  className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-700/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{item.playerName}</p>
                      <p className="text-xs text-slate-500">{formatDate(item.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      <span className="text-sm text-slate-300">
                        {((item.batting + item.bowling + item.fielding + item.teamSpirit) / 4).toFixed(1)}
                      </span>
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
                    {/* Ratings */}
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
        </>
      ) : (
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-white/10 text-center">
          <MessageSquare className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 mb-1">No feedback yet</p>
          <p className="text-xs text-slate-500">
            {isAdminRole
              ? 'Generate a feedback link and share it with players to collect feedback.'
              : 'Feedback will appear here once players submit their responses.'}
          </p>
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

export default MatchFeedbackDashboard;
