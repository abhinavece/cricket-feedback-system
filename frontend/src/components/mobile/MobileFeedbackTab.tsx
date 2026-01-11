import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getAllFeedback, deleteFeedback, getFeedbackById, getStats } from '../../services/api';
import type { FeedbackSubmission } from '../../types';
import { Star, Trash2, ChevronRight, X, RefreshCw } from 'lucide-react';

interface FeedbackStats {
  totalSubmissions: number;
  avgBatting: number;
  avgBowling: number;
  avgFielding: number;
  avgTeamSpirit: number;
}

const MobileFeedbackTab: React.FC = () => {
  const [feedback, setFeedback] = useState<FeedbackSubmission[]>([]);
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackSubmission | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const fetchFeedback = useCallback(async (pageNum: number, append: boolean = false, isRefresh: boolean = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const [response, statsData] = await Promise.all([
        getAllFeedback({ page: pageNum, limit: 15 }),
        pageNum === 1 ? getStats() : Promise.resolve(null)
      ]);
      
      const pagination = response.pagination || {};
      const hasMoreData = (pageNum * 15) < (pagination.total || 0);

      if (append) {
        setFeedback(prev => [...prev, ...(response.feedback || [])]);
      } else {
        setFeedback(response.feedback || []);
      }
      
      if (statsData) setStats(statsData);
      setHasMore(hasMoreData);
      setCurrentPage(pageNum);
    } catch (err) {
      console.error('Error fetching feedback:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, []);

  const handleRefresh = () => {
    fetchFeedback(1, false, true);
  };

  // Initial load
  useEffect(() => {
    fetchFeedback(1, false);
  }, [fetchFeedback]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          fetchFeedback(currentPage + 1, true);
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [hasMore, loadingMore, loading, currentPage, fetchFeedback]);

  const handleViewDetail = async (item: FeedbackSubmission) => {
    setLoadingDetail(true);
    try {
      const fullFeedback = await getFeedbackById(item._id);
      setSelectedFeedback(fullFeedback);
    } catch (err) {
      console.error('Error fetching feedback detail:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Move this feedback to trash?')) {
      try {
        await deleteFeedback(id);
        setFeedback(prev => prev.filter(f => f._id !== id));
      } catch (err) {
        console.error('Error deleting feedback:', err);
      }
    }
  };

  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getAverageRating = (item: FeedbackSubmission) => {
    return ((item.batting + item.bowling + item.fielding + item.teamSpirit) / 4).toFixed(1);
  };

  if (loading && feedback.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <>
      {/* Stats Header with Refresh */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-white">Performance Overview</h2>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-medium disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        
        {stats && (
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-emerald-500/10 rounded-lg p-2 text-center border border-emerald-500/20">
              <p className="text-[10px] text-emerald-400 mb-0.5">Batting</p>
              <p className="text-sm font-bold text-emerald-400">{stats.avgBatting.toFixed(1)}</p>
            </div>
            <div className="bg-sky-500/10 rounded-lg p-2 text-center border border-sky-500/20">
              <p className="text-[10px] text-sky-400 mb-0.5">Bowling</p>
              <p className="text-sm font-bold text-sky-400">{stats.avgBowling.toFixed(1)}</p>
            </div>
            <div className="bg-amber-500/10 rounded-lg p-2 text-center border border-amber-500/20">
              <p className="text-[10px] text-amber-400 mb-0.5">Fielding</p>
              <p className="text-sm font-bold text-amber-400">{stats.avgFielding.toFixed(1)}</p>
            </div>
            <div className="bg-purple-500/10 rounded-lg p-2 text-center border border-purple-500/20">
              <p className="text-[10px] text-purple-400 mb-0.5">Spirit</p>
              <p className="text-sm font-bold text-purple-400">{stats.avgTeamSpirit.toFixed(1)}</p>
            </div>
          </div>
        )}
      </div>

      {/* Compact Feedback List */}
      <div className="space-y-2">
        {feedback.map((item) => (
          <div
            key={item._id}
            className="bg-slate-800/50 rounded-xl p-3 border border-white/5 active:bg-slate-800/70 transition-colors"
            onClick={() => handleViewDetail(item)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white text-sm truncate">{item.playerName}</span>
                  <span className="text-xs text-slate-500">{formatDate(item.matchDate)}</span>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <span className="text-xs text-amber-400 font-medium">{getAverageRating(item)}</span>
                  </div>
                  <div className="flex gap-2 text-xs text-slate-500">
                    <span>B:{item.batting}</span>
                    <span>Bw:{item.bowling}</span>
                    <span>F:{item.fielding}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(item._id); }}
                  className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Load More Trigger */}
      <div ref={loadMoreRef} className="py-4">
        {loadingMore && (
          <div className="flex items-center justify-center">
            <div className="spinner w-6 h-6"></div>
          </div>
        )}
        {!hasMore && feedback.length > 0 && (
          <p className="text-center text-xs text-slate-500">No more feedback</p>
        )}
      </div>

      {/* Detail Modal - Slide up sheet */}
      {selectedFeedback && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedFeedback(null)}>
          <div
            className="absolute bottom-0 left-0 right-0 bg-slate-900 rounded-t-3xl max-h-[85vh] overflow-y-auto animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="sticky top-0 bg-slate-900 pt-3 pb-2 px-4 border-b border-white/5">
              <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mb-3" />
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">{selectedFeedback.playerName}</h3>
                <button onClick={() => setSelectedFeedback(null)} className="p-2 text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-slate-500">{formatDate(selectedFeedback.matchDate)}</p>
            </div>

            <div className="p-4 space-y-4">
              {/* Ratings Grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Batting', value: selectedFeedback.batting },
                  { label: 'Bowling', value: selectedFeedback.bowling },
                  { label: 'Fielding', value: selectedFeedback.fielding },
                  { label: 'Team Spirit', value: selectedFeedback.teamSpirit },
                ].map((stat) => (
                  <div key={stat.label} className="bg-slate-800/50 rounded-xl p-3">
                    <p className="text-xs text-slate-400 mb-1">{stat.label}</p>
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      <span className="text-xl font-bold text-white">{stat.value}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Feedback Text */}
              {selectedFeedback.feedbackText && (
                <div className="bg-slate-800/50 rounded-xl p-4">
                  <p className="text-xs text-slate-400 mb-2">Feedback</p>
                  <p className="text-sm text-white leading-relaxed">{selectedFeedback.feedbackText}</p>
                </div>
              )}

              {/* Additional Comments */}
              {selectedFeedback.additionalComments && (
                <div className="bg-slate-800/50 rounded-xl p-4">
                  <p className="text-xs text-slate-400 mb-2">Additional Comments</p>
                  <p className="text-sm text-white leading-relaxed">{selectedFeedback.additionalComments}</p>
                </div>
              )}

              {/* Issues */}
              {selectedFeedback.issues && Object.entries(selectedFeedback.issues).some(([_, v]) => v) && (
                <div className="bg-slate-800/50 rounded-xl p-4">
                  <p className="text-xs text-slate-400 mb-2">Issues Reported</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(selectedFeedback.issues)
                      .filter(([_, v]) => v)
                      .map(([key]) => (
                        <span key={key} className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full capitalize">
                          {key}
                        </span>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Loading Detail Overlay */}
      {loadingDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
          <div className="spinner"></div>
        </div>
      )}

      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default MobileFeedbackTab;
