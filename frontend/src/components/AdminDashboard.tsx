import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { getAllFeedback, getStats, deleteFeedback, getTrashFeedback, restoreFeedback, permanentDeleteFeedback, getFeedbackById } from '../services/api';
import type { FeedbackSubmission } from '../types';
import ConfirmDialog from './ConfirmDialog';
import { useAuth } from '../contexts/AuthContext';
import FeedbackCard from './FeedbackCard';
import Footer from './Footer';
import PageHeader from './PageHeader';
import FeedbackSummary from './FeedbackSummary';

// Lazy load heavy tab components - only loaded when tab is selected
const UserManagement = lazy(() => import('./UserManagement'));
const WhatsAppMessagingTab = lazy(() => import('./WhatsAppMessagingTab'));
const MatchManagement = lazy(() => import('./MatchManagement'));
const PaymentManagement = lazy(() => import('./PaymentManagement'));
const HistoryTab = lazy(() => import('./HistoryTab'));
const SettingsPage = lazy(() => import('../pages/SettingsPage'));
const WhatsAppAnalyticsTab = lazy(() => import('./WhatsAppAnalyticsTab'));
const GroundsTab = lazy(() => import('./GroundsTab'));

// Tab loading spinner
const TabLoadingSpinner = () => (
  <div className="flex items-center justify-center py-20">
    <div className="text-center">
      <div className="spinner mb-4"></div>
      <p className="text-sm text-slate-400">Loading...</p>
    </div>
  </div>
);

interface FeedbackStats {
  totalSubmissions: number;
  avgBatting: number;
  avgBowling: number;
  avgFielding: number;
  avgTeamSpirit: number;
  venueIssues: number;
  equipmentIssues: number;
  timingIssues: number;
  umpiringIssues: number;
  otherIssues: number;
}

interface AdminDashboardProps {
  activeTab?: 'feedback' | 'users' | 'whatsapp' | 'chats' | 'matches' | 'payments' | 'player-history' | 'analytics' | 'settings' | 'grounds';
  onTabChange?: (tab: 'feedback' | 'users' | 'whatsapp' | 'chats' | 'matches' | 'payments' | 'player-history' | 'analytics' | 'settings' | 'grounds') => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  activeTab: propActiveTab = 'feedback',
  onTabChange
}) => {
  const [feedback, setFeedback] = useState<FeedbackSubmission[]>([]);
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackSubmission | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'active' | 'trash'>('active');
  const [trashFeedback, setTrashFeedback] = useState<FeedbackSubmission[]>([]);
  const [activeTab, setActiveTab] = useState<'feedback' | 'users' | 'whatsapp' | 'chats' | 'matches' | 'payments' | 'player-history' | 'analytics' | 'settings' | 'grounds'>(propActiveTab);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const hasFetchedInitial = React.useRef(false);

  // Sync activeTab with prop changes from parent
  useEffect(() => {
    setActiveTab(propActiveTab);
  }, [propActiveTab]);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });
  const { user, isViewer } = useAuth();

  const fetchData = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    try {
      console.log(`[AdminDashboard] Fetching feedback - Page: ${pageNum}, Append: ${append}`);
      
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const [feedbackResponse, statsData] = await Promise.all([
        getAllFeedback({ page: pageNum, limit: 10 }),
        getStats()
      ]);
      
      const pagination = feedbackResponse.pagination || {};
      const hasMoreData = (pageNum * 10) < (pagination.total || 0);
      
      console.log(`[AdminDashboard] Feedback Response:`, {
        feedbackCount: feedbackResponse.feedback?.length || 0,
        pagination,
        calculatedHasMore: hasMoreData
      });
      
      if (append) {
        setFeedback(prev => {
          const newFeedback = [...prev, ...(feedbackResponse.feedback || [])];
          console.log(`[AdminDashboard] Appended feedback. Total now: ${newFeedback.length}`);
          return newFeedback;
        });
      } else {
        setFeedback(feedbackResponse.feedback || []);
        console.log(`[AdminDashboard] Set initial feedback: ${feedbackResponse.feedback?.length || 0}`);
      }

      setHasMore(hasMoreData);
      setCurrentPage(pageNum);
      setStats(statsData);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to fetch data');
      // Set default stats to prevent undefined errors
      setStats({
        totalSubmissions: 0,
        avgBatting: 0,
        avgBowling: 0,
        avgFielding: 0,
        avgTeamSpirit: 0,
        venueIssues: 0,
        equipmentIssues: 0,
        timingIssues: 0,
        umpiringIssues: 0,
        otherIssues: 0,
      });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // Initial load - only once
  useEffect(() => {
    if (hasFetchedInitial.current) return;
    hasFetchedInitial.current = true;
    console.log('[AdminDashboard] Component mounted, fetching initial feedback');
    fetchData(1, false);
  }, [fetchData]);

  // Infinite scroll handler
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let isScrolling = false;
    
    const handleScroll = () => {
      if (isScrolling) return;
      
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (loading || loadingMore || !hasMore) {
          console.log('[AdminDashboard] Scroll ignored - loading:', loading, 'loadingMore:', loadingMore, 'hasMore:', hasMore);
          return;
        }
        
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight;
        const clientHeight = document.documentElement.clientHeight;
        
        console.log('[AdminDashboard] Scroll position:', {
          scrollTop,
          clientHeight,
          scrollHeight,
          distanceFromBottom: scrollHeight - (scrollTop + clientHeight)
        });
        
        // Trigger when user is 300px from bottom
        if (scrollTop + clientHeight >= scrollHeight - 300) {
          if (!loadingMore && hasMore) {
            console.log('[AdminDashboard] Triggering load more - next page:', currentPage + 1);
            isScrolling = true;
            fetchData(currentPage + 1, true);
            setTimeout(() => { isScrolling = false; }, 500);
          }
        }
      }, 100);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [loading, loadingMore, hasMore, currentPage, fetchData]);

  // Fetch trash data when view changes
  useEffect(() => {
    if (currentView === 'trash') {
      fetchTrashData();
    }
  }, [currentView]);

  const fetchTrashData = async () => {
    try {
      const trashData = await getTrashFeedback();
      setTrashFeedback(trashData);
    } catch (err) {
      console.error('Error fetching trash data:', err);
      setError('Failed to fetch trash data');
    }
  };

  const handleDeleteFeedback = async (id: string) => {
    try {
      await deleteFeedback(id);
      console.log('[AdminDashboard] Feedback deleted, refreshing list');
      await fetchData(1, false); // Refresh active feedback
    } catch (err) {
      console.error('Error deleting feedback:', err);
      alert('Failed to delete feedback');
    }
  };

  const handleRestoreFeedback = async (id: string) => {
    try {
      await restoreFeedback(id);
      console.log('[AdminDashboard] Feedback restored, refreshing lists');
      await fetchData(1, false); // Refresh active feedback
      await fetchTrashData(); // Refresh trash
    } catch (err) {
      console.error('Error restoring feedback:', err);
      alert('Failed to restore feedback');
    }
  };

  const handlePermanentDelete = async (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Permanent Delete',
      message: 'Are you sure you want to permanently delete this feedback? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await permanentDeleteFeedback(id);
          await fetchTrashData(); // Refresh trash
          setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} });
        } catch (err) {
          console.error('Error permanently deleting feedback:', err);
          alert('Failed to permanently delete feedback');
        }
      }
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderStars = (rating: number) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  const [loadingDetail, setLoadingDetail] = useState(false);

  const handleFeedbackClick = async (item: FeedbackSubmission) => {
    // If the item already has full details (feedbackText), use it directly
    if (item.feedbackText) {
      setSelectedFeedback(item);
      setShowModal(true);
      return;
    }
    
    // Otherwise, fetch full details from API
    setLoadingDetail(true);
    setShowModal(true);
    try {
      const fullFeedback = await getFeedbackById(item._id);
      setSelectedFeedback(fullFeedback);
    } catch (err) {
      console.error('Error fetching feedback details:', err);
      // Fall back to partial data
      setSelectedFeedback(item);
    } finally {
      setLoadingDetail(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedFeedback(null);
  };

  const handleIssueClick = (issue: string) => {
    setSelectedIssue(selectedIssue === issue ? null : issue);
  };

  const handleTrashClick = (id: string) => {
    handleDeleteFeedback(id);
  };

  const getFilteredFeedback = () => {
    if (!selectedIssue) return feedback;
    
    return feedback.filter(item => 
      item.issues[selectedIssue as keyof typeof item.issues] === true
    );
  };

  const getTabInfo = () => {
    switch (activeTab) {
      case 'feedback':
        return { title: 'Feedback Hub', desc: 'Analyze player performance and match insights' };
      case 'matches':
        return { title: 'Match Management', desc: 'Create and manage cricket matches' };
      case 'payments':
        return { title: 'Payment Management', desc: 'Track and manage match payments' };
      case 'player-history':
        return { title: 'Player Payment History', desc: 'View complete payment history for any player' };
      case 'whatsapp':
        return { title: 'Messaging Hub', desc: 'Blast WhatsApp updates to your team' };
      case 'users':
        return { title: 'User Directory', desc: 'Manage access and roles for the platform' };
      case 'settings':
        return { title: 'Settings', desc: 'Manage your account and player profile' };
      default:
        return { title: 'Admin Dashboard', desc: 'Manage cricket feedback and user data' };
    }
  };

  const { title: pageTitle, desc: pageDesc } = getTabInfo();

  if (loading) {
    return (
      <div className="container flex items-center justify-center" style={{minHeight: '80vh'}}>
        <div className="text-center">
          <div className="spinner"></div>
          <p className="mt-4 text-secondary">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container flex items-center justify-center" style={{minHeight: '80vh'}}>
        <div className="alert alert-error">
          {error}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="container">
      {/* New Elegant Page Header */}
      <PageHeader activeTab={activeTab} />
        
        {/* Tab Navigation - Elegant & Space Efficient */}
        <div className="mb-8 md:mb-12">
          {/* Desktop: Clean Tab Navigation */}
          <nav className="hidden md:flex gap-1 p-1 bg-white/5 rounded-xl border border-white/10">
            <button
              onClick={() => { setActiveTab('feedback'); onTabChange?.('feedback'); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'feedback'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              Feedback
            </button>
            {user?.role === 'admin' && (
              <button
                onClick={() => { setActiveTab('whatsapp'); onTabChange?.('whatsapp'); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'whatsapp'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                WhatsApp
              </button>
            )}
            <button
              onClick={() => { setActiveTab('matches'); onTabChange?.('matches'); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'matches'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              Matches
            </button>
            <button
              onClick={() => { setActiveTab('payments'); onTabChange?.('payments'); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'payments'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              Payments
            </button>
            <button
              onClick={() => { setActiveTab('grounds'); onTabChange?.('grounds'); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'grounds'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              Grounds
            </button>
            <button
              onClick={() => { setActiveTab('player-history'); onTabChange?.('player-history'); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'player-history'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              History
            </button>
            {user?.role === 'admin' && (
              <button
                onClick={() => { setActiveTab('analytics'); onTabChange?.('analytics'); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'analytics'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                Analytics
              </button>
            )}
            {user?.role === 'admin' && (
              <button
                onClick={() => { setActiveTab('users'); onTabChange?.('users'); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'users'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                Users
              </button>
            )}
            <button
              onClick={() => { setActiveTab('settings'); onTabChange?.('settings'); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'settings'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              Settings
            </button>
          </nav>

          {/* Mobile: Clean Segmented Control */}
          <div className="md:hidden bg-white/5 p-1 rounded-xl border border-white/10 flex items-center gap-1">
            <button
              onClick={() => setActiveTab('feedback')}
              className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'feedback'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              <span className="hidden sm:inline">Feedback</span>
            </button>
            {user?.role === 'admin' && (
              <button
                onClick={() => setActiveTab('whatsapp')}
                className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
                  activeTab === 'whatsapp'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-400'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span className="hidden sm:inline">WA</span>
              </button>
            )}
            <button
              onClick={() => setActiveTab('matches')}
              className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'matches'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="hidden sm:inline">Match</span>
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'payments'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="hidden sm:inline">Pay</span>
            </button>
            {user?.role === 'admin' && (
              <button
                onClick={() => setActiveTab('users')}
                className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
                  activeTab === 'users'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-400'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <span className="hidden sm:inline">Users</span>
              </button>
            )}
          </div>
        </div>
        
        {/* Tab Content */}
        {activeTab === 'feedback' && (
          <>
            {/* Active/Trash View Toggle */}
            <div className="mb-8">
              {/* Mobile Layout */}
              <div className="md:hidden">
                <div className="flex flex-col gap-4">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h2 className="text-lg font-bold text-white">
                        {currentView === 'active' ? 'Active Feedback' : 'Trash Bin'}
                      </h2>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-white/10 text-white/70">
                        {currentView === 'active' ? feedback.length : trashFeedback.length}
                      </span>
                    </div>
                  </div>
                  
                  {/* Mobile Toggle Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentView('active')}
                      className={`flex-1 px-4 py-2.5 rounded-lg text-xs font-medium transition-all ${
                        currentView === 'active'
                          ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                          : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <span>Active</span>
                      </div>
                    </button>
                    {!isViewer() && (
                      <button
                        onClick={() => setCurrentView('trash')}
                        className={`flex-1 px-4 py-2.5 rounded-lg text-xs font-medium transition-all ${
                          currentView === 'trash'
                            ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                            : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center justify-center gap-1.5">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span>Trash</span>
                        </div>
                      </button>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Desktop Layout - Unchanged */}
              <div className="hidden md:block">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold text-white">
                      {currentView === 'active' ? 'Active Feedback' : 'Trash Bin'}
                    </h2>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-white/70">
                      {currentView === 'active' ? feedback.length : trashFeedback.length} items
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentView('active')}
                      className={`px-6 py-3 rounded-xl text-sm font-medium transition-all ${
                        currentView === 'active'
                          ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                          : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        Active
                      </div>
                    </button>
                    {!isViewer() && (
                      <button
                        onClick={() => setCurrentView('trash')}
                        className={`px-6 py-3 rounded-xl text-sm font-medium transition-all ${
                          currentView === 'trash'
                            ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                            : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Trash
                        </div>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* AI-Powered Statistics Dashboard - Only show in active view */}
            {currentView === 'active' && stats && (
              <FeedbackSummary stats={stats} className="mb-8" />
            )}
            {/* Issue Filters - Only show in active view */}
            {currentView === 'active' && (
            <div className="filter-section mb-8">
              <div className="card p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  {/* Filter Pills */}
                  <div className="w-full md:w-auto">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-secondary mb-3">Filter by Issue</h4>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { key: 'venue', label: 'Venue', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
                        { key: 'equipment', label: 'Equipment', icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
                        { key: 'timing', label: 'Timing', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
                        { key: 'umpiring', label: 'Umpiring', icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
                        { key: 'other', label: 'Other', icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
                      ].map(({ key, label, icon }) => (
                        <button
                          key={key}
                          className={`filter-pill flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                            selectedIssue === key
                              ? 'bg-primary-solid text-white shadow-md shadow-primary-solid/20'
                              : 'bg-surface-hover text-secondary hover:bg-surface-hover/80 hover:text-white'
                          }`}
                          onClick={() => handleIssueClick(key)}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={icon} />
                          </svg>
                          {label}
                        </button>
                      ))}
                      
                      {selectedIssue && (
                        <button
                          className="filter-pill flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-accent-danger/10 text-accent-danger hover:bg-accent-danger/20 transition-all"
                          onClick={() => setSelectedIssue(null)}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Clear Filter
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            )}
            
            {/* Feedback List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {(() => {
                const displayedFeedback = currentView === 'active' ? getFilteredFeedback() : trashFeedback;
                
                if (!displayedFeedback.length) {
                  return (
                    <div className="col-span-full card text-center py-12">
                      <p className="text-secondary">
                        {currentView === 'active'
                          ? selectedIssue
                            ? 'No feedback found for this issue filter.'
                            : 'No feedback submissions yet.'
                          : 'Trash is empty.'}
                      </p>
                    </div>
                  );
                }
                
                return displayedFeedback.map((item, index) => (
                  <FeedbackCard
                    key={item._id}
                    item={item}
                    index={index}
                    onClick={handleFeedbackClick}
                    onTrash={!isViewer() && currentView === 'active' ? handleTrashClick : undefined}
                    onRestore={!isViewer() && currentView === 'trash' ? handleRestoreFeedback : undefined}
                    onDelete={!isViewer() && currentView === 'trash' ? handlePermanentDelete : undefined}
                  />
                ));
              })()}
            </div>

            {/* Loading More Indicator */}
            {currentView === 'active' && loadingMore && (
              <div className="flex justify-center items-center py-8">
                <div className="flex items-center gap-3 text-slate-400">
                  <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm">Loading more feedback...</span>
                </div>
              </div>
            )}

            {/* No More Feedback Indicator */}
            {currentView === 'active' && !hasMore && feedback.length > 0 && (
              <div className="flex justify-center items-center py-8">
                <p className="text-sm text-slate-500">No more feedback to load</p>
              </div>
            )}
          </>
        )}
        {activeTab === 'whatsapp' && user?.role === 'admin' && (
          <Suspense fallback={<TabLoadingSpinner />}>
            <WhatsAppMessagingTab />
          </Suspense>
        )}
        {activeTab === 'matches' && (
          <Suspense fallback={<TabLoadingSpinner />}>
            <MatchManagement />
          </Suspense>
        )}
        {activeTab === 'payments' && (
          <Suspense fallback={<TabLoadingSpinner />}>
            <PaymentManagement />
          </Suspense>
        )}
        {activeTab === 'grounds' && (
          <Suspense fallback={<TabLoadingSpinner />}>
            <GroundsTab />
          </Suspense>
        )}
        {activeTab === 'player-history' && (
          <Suspense fallback={<TabLoadingSpinner />}>
            <HistoryTab />
          </Suspense>
        )}
        {activeTab === 'analytics' && user?.role === 'admin' && (
          <Suspense fallback={<TabLoadingSpinner />}>
            <WhatsAppAnalyticsTab />
          </Suspense>
        )}
        {activeTab === 'users' && (
          <Suspense fallback={<TabLoadingSpinner />}>
            <UserManagement />
          </Suspense>
        )}
        {activeTab === 'settings' && (
          <Suspense fallback={<TabLoadingSpinner />}>
            <SettingsPage />
          </Suspense>
        )}
      </div>

      {/* Feedback Detail Modal */}
      {showModal && (loadingDetail ? (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="text-center">
            <div className="spinner mb-4"></div>
            <p className="text-sm text-slate-400">Loading details...</p>
          </div>
        </div>
      ) : selectedFeedback && (() => {
        const item = selectedFeedback;
        return (
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-backdrop-in"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                closeModal();
              }
            }}
          >
            <div
              className="w-full max-w-4xl bg-[#1a1a2e] border border-white/10 rounded-[2rem] shadow-2xl animate-modal-in overflow-y-auto no-scrollbar"
              style={{ maxHeight: '90vh' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative p-6 md:p-10">
                <button
                  onClick={closeModal}
                  className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-secondary hover:text-white hover:bg-white/10 transition-all z-10"
                  aria-label="Close details"
                >
                  <span className="text-2xl">×</span>
                </button>

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8 mt-4 md:mt-0">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-3 py-1 rounded-full bg-primary-green/10 text-primary-green text-[10px] font-bold uppercase tracking-widest border border-primary-green/20">Feedback Detail</span>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black text-white leading-tight">
                      {item.isRedacted ? (
                        <span className="inline-flex items-center gap-2 text-slate-400 italic">
                          Anonymous Feedback
                        </span>
                      ) : (
                        item.playerName
                      )}
                    </h2>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-secondary mt-3">
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary-green"></span>
                        {formatDate(item.createdAt)}
                      </span>
                      <span className="text-white/20">•</span>
                      <span>Match: {formatDate(String(item.matchDate))}</span>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-primary-green/20 to-primary-green/5 border border-primary-green/30 rounded-2xl px-8 py-6 text-center md:text-right shadow-inner">
                    <p className="text-[10px] text-secondary uppercase tracking-[0.2em] mb-1 font-bold">Overall Spirit</p>
                    <p className="text-5xl font-black text-primary-green drop-shadow-sm">
                      {item.teamSpirit !== null ? item.teamSpirit.toFixed(1) : 'N/A'}
                    </p>
                    <p className="text-[10px] text-secondary mt-1 font-medium">OUT OF 5.0</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                  {[
                    { label: 'Batting', value: item.batting },
                    { label: 'Bowling', value: item.bowling },
                    { label: 'Fielding', value: item.fielding },
                    { label: 'Team Spirit', value: item.teamSpirit },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="group rounded-2xl border border-white/5 bg-white/5 p-5 transition-all hover:bg-white/10 hover:border-white/10"
                    >
                      <p className="text-[10px] uppercase tracking-widest text-secondary font-bold mb-3">{stat.label}</p>
                      <div className="flex items-baseline gap-1">
                        <span className={`text-3xl font-black ${stat.value !== null ? 'text-white' : 'text-slate-500'}`}>
                          {stat.value !== null ? stat.value.toFixed(1) : 'N/A'}
                        </span>
                        {stat.value !== null && <span className="text-xs text-secondary/50 font-medium">/ 5</span>}
                      </div>
                      <div className="text-sm text-yellow-500 mt-2 flex gap-0.5">
                        {stat.value !== null ? renderStars(Math.round(stat.value)) : <span className="text-slate-500 text-xs">Not rated</span>}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mb-10">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-secondary font-bold mb-4">Issue Signals</p>
                  <div className="flex flex-wrap gap-2.5">
                    {Object.entries(item.issues).every(([, value]) => !value) ? (
                      <span className="px-4 py-2 rounded-xl text-xs border border-white/5 bg-white/5 text-secondary italic">
                        No specific issues flagged by player
                      </span>
                    ) : (
                      Object.entries(item.issues)
                        .filter(([, value]) => value)
                        .map(([issueKey]) => (
                          <span
                            key={issueKey}
                            className="px-5 py-2 rounded-xl text-xs font-bold bg-primary-green text-white shadow-lg shadow-primary-green/20 uppercase tracking-wider"
                          >
                            {issueKey}
                          </span>
                        ))
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                  <div className="bg-white/5 border border-white/5 rounded-2xl p-6 md:p-8">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="w-1 h-4 bg-primary-green rounded-full"></span>
                      <p className="text-xs uppercase tracking-[0.2em] text-secondary font-bold">Match Narration</p>
                    </div>
                    <p className="text-base text-white/90 leading-relaxed font-medium italic">"{item.feedbackText}"</p>
                  </div>
                  <div className="bg-white/5 border border-white/5 rounded-2xl p-6 md:p-8">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="w-1 h-4 bg-accent-blue rounded-full"></span>
                      <p className="text-xs uppercase tracking-[0.2em] text-secondary font-bold">Additional Notes</p>
                    </div>
                    <p className="text-base text-white/90 leading-relaxed font-medium">
                      {item.additionalComments?.trim() || 'No additional comments provided.'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4 justify-end pt-6 border-t border-white/5">
                  <button
                    className="btn btn-outline h-14 md:h-auto order-2 md:order-1"
                    onClick={closeModal}
                    style={{ borderColor: 'rgba(255,255,255,0.1)', color: 'var(--text-secondary)' }}
                  >
                    Close Detail
                  </button>
                  {!isViewer() && (
                    currentView === 'active' ? (
                      <button
                        className="btn btn-danger h-14 md:h-auto order-1 md:order-2"
                        onClick={() => {
                          handleDeleteFeedback(item._id);
                          closeModal();
                        }}
                      >
                        Move to Trash
                      </button>
                    ) : (
                      <div className="flex flex-col md:flex-row gap-3 order-1 md:order-2 w-full md:w-auto">
                        <button
                          className="btn btn-outline h-14 md:h-auto"
                          onClick={() => {
                            handleRestoreFeedback(item._id);
                            closeModal();
                          }}
                        >
                          Restore Feedback
                        </button>
                        <button
                          className="btn btn-danger h-14 md:h-auto"
                          onClick={() => {
                            handlePermanentDelete(item._id);
                            closeModal();
                          }}
                        >
                          Delete Permanently
                        </button>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })())}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} })}
      />

      {/* Footer */}
      <Footer minimal />
    </>
  );
};

export default AdminDashboard;
