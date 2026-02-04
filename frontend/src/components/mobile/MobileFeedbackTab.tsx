import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getAllFeedback, deleteFeedback, getFeedbackById, getStats, getTrashFeedback, restoreFeedback, permanentDeleteFeedback } from '../../services/api';
import type { FeedbackSubmission } from '../../types';
import { Star, Trash2, ChevronRight, X, RefreshCw, RotateCcw, Archive, UserX } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface FeedbackStats {
  totalSubmissions: number;
  avgBatting: number;
  avgBowling: number;
  avgFielding: number;
  avgTeamSpirit: number;
}

const MobileFeedbackTab: React.FC = () => {
  const { isViewer } = useAuth();
  const [feedback, setFeedback] = useState<FeedbackSubmission[]>([]);
  const [trashFeedback, setTrashFeedback] = useState<FeedbackSubmission[]>([]);
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackSubmission | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [currentView, setCurrentView] = useState<'active' | 'trash'>('active');
  const [actionLoading, setActionLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
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
    if (currentView === 'active') {
      fetchFeedback(1, false, true);
    } else {
      fetchTrash();
    }
  };

  const fetchTrash = async () => {
    setRefreshing(true);
    try {
      const data = await getTrashFeedback();
      setTrashFeedback(data || []);
    } catch (err) {
      console.error('Error fetching trash:', err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (currentView === 'trash') {
      fetchTrash();
    }
  }, [currentView]);

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
        setSuccess('Moved to trash');
      } catch (err) {
        console.error('Error deleting feedback:', err);
      }
    }
  };

  const handleRestore = async (id: string) => {
    setActionLoading(true);
    try {
      await restoreFeedback(id);
      setTrashFeedback(prev => prev.filter(f => f._id !== id));
      setSuccess('Restored');
      fetchFeedback(1, false, true);
    } catch (err) {
      console.error('Error restoring feedback:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePermanentDelete = async (id: string) => {
    if (window.confirm('Permanently delete this feedback? This cannot be undone.')) {
      setActionLoading(true);
      try {
        await permanentDeleteFeedback(id);
        setTrashFeedback(prev => prev.filter(f => f._id !== id));
        setSuccess('Permanently deleted');
      } catch (err) {
        console.error('Error permanently deleting:', err);
      } finally {
        setActionLoading(false);
      }
    }
  };

  // Clear success message
  if (success) {
    setTimeout(() => setSuccess(null), 2000);
  }

  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getAverageRating = (item: FeedbackSubmission) => {
    const ratings = [item.batting, item.bowling, item.fielding, item.teamSpirit].filter((r): r is number => r !== null && r !== undefined);
    if (ratings.length === 0) return 'N/A';
    return (ratings.reduce((sum, r) => sum + r, 0) / ratings.length).toFixed(1);
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
      {/* Success Toast */}
      {success && (
        <div className="fixed top-16 left-4 right-4 z-[60] p-3 rounded-xl bg-emerald-500/90 text-white text-sm">
          {success}
        </div>
      )}

      {/* Header with View Toggle & Refresh */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentView('active')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                currentView === 'active'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-800/50 text-slate-400'
              }`}
            >
              Active
            </button>
            {!isViewer() && (
              <button
                onClick={() => setCurrentView('trash')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${
                  currentView === 'trash'
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : 'bg-slate-800/50 text-slate-400'
                }`}
              >
                <Archive className="w-3 h-3" /> Trash
              </button>
            )}
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-medium disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
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

      {/* Active Feedback List */}
      {currentView === 'active' && (
        <>
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
                      {item.isRedacted ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-700/50 text-slate-400 text-sm rounded-full">
                          <UserX className="w-3 h-3" />
                          <span className="italic">Anonymous</span>
                        </span>
                      ) : (
                        <span className="font-medium text-white text-sm truncate">{item.playerName}</span>
                      )}
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
                    {!isViewer() && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(item._id); }}
                        className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
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
        </>
      )}

      {/* Trash List */}
      {currentView === 'trash' && (
        <div className="space-y-2">
          {trashFeedback.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Archive className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Trash is empty</p>
            </div>
          ) : (
            trashFeedback.map((item) => (
              <div
                key={item._id}
                className="bg-slate-800/30 rounded-xl p-3 border border-red-500/10"
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
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleRestore(item._id)}
                      disabled={actionLoading}
                      className="p-2 text-emerald-400 hover:bg-emerald-500/20 rounded-lg transition-colors"
                      title="Restore"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handlePermanentDelete(item._id)}
                      disabled={actionLoading}
                      className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                      title="Delete permanently"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Detail Modal - Slide up sheet */}
      {selectedFeedback && (
        <div className="fixed inset-x-0 top-[52px] bottom-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedFeedback(null)}>
          <div
            className="absolute bottom-0 left-0 right-0 bg-slate-900 rounded-t-3xl max-h-[calc(100vh-52px)] overflow-y-auto animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="sticky top-0 bg-slate-900 pt-3 pb-2 px-4 border-b border-white/5">
              <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mb-3" />
              <div className="flex items-center justify-between">
                {selectedFeedback.isRedacted ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-700/50 text-slate-400 text-lg rounded-full">
                    <UserX className="w-4 h-4" />
                    <span className="italic font-medium">Anonymous Feedback</span>
                  </span>
                ) : (
                  <h3 className="text-lg font-bold text-white">{selectedFeedback.playerName}</h3>
                )}
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
        <div className="fixed inset-x-0 top-[52px] bottom-0 z-50 bg-black/60 flex items-center justify-center">
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
