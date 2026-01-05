import React, { useState, useEffect } from 'react';
import { getAllFeedback, getStats, deleteFeedback, getTrashFeedback, restoreFeedback, permanentDeleteFeedback } from '../services/api';
import type { FeedbackSubmission } from '../types';
import ConfirmDialog from './ConfirmDialog';
import UserManagement from './UserManagement';
import WhatsAppMessagingTab from './WhatsAppMessagingTab';
import { useAuth } from '../contexts/AuthContext';

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

const AdminDashboard: React.FC = () => {
  const [feedback, setFeedback] = useState<FeedbackSubmission[]>([]);
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackSubmission | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'active' | 'trash'>('active');
  const [trashFeedback, setTrashFeedback] = useState<FeedbackSubmission[]>([]);
  const [activeTab, setActiveTab] = useState<'feedback' | 'users' | 'whatsapp'>('feedback');
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
  const { user } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (currentView === 'trash') {
      fetchTrashData();
    }
  }, [currentView]);

  const fetchData = async () => {
    try {
      console.log('Fetching data...');
      const [feedbackData, statsData] = await Promise.all([
        getAllFeedback(),
        getStats()
      ]);
      
      console.log('Feedback data:', feedbackData);
      console.log('Stats data:', statsData);
      
      setFeedback(feedbackData);
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
    }
  };

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
      await fetchData(); // Refresh active feedback
    } catch (err) {
      console.error('Error deleting feedback:', err);
      alert('Failed to delete feedback');
    }
  };

  const handleRestoreFeedback = async (id: string) => {
    try {
      await restoreFeedback(id);
      await fetchData(); // Refresh active feedback
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

  const handleFeedbackClick = (item: FeedbackSubmission) => {
    setSelectedFeedback(item);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedFeedback(null);
  };

  const handleIssueClick = (issue: string) => {
    setSelectedIssue(selectedIssue === issue ? null : issue);
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
        return { title: 'Feedback Center', desc: 'Monitor and analyze player match feedback' };
      case 'users':
        return { title: 'User Directory', desc: 'Manage access and roles for the platform' };
      case 'whatsapp':
        return { title: 'Messaging Hub', desc: 'Blast WhatsApp updates to your team' };
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
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 transition-all duration-300" style={{color: 'var(--primary-green)'}}>
          {pageTitle}
        </h1>
        <p className="text-secondary transition-all duration-300">{pageDesc}</p>
      </div>
        
        {/* Tab Navigation */}
        <div className="mb-8 md:mb-10">
          {/* Desktop Advanced Tabs */}
          <nav className="hidden md:flex p-1.5 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 w-fit shadow-2xl relative overflow-hidden">
            {/* Desktop Slider */}
            <div 
              className="absolute h-[calc(100%-12px)] rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] shadow-[0_0_20px_rgba(16,185,129,0.4)]"
              style={{
                width: activeTab === 'feedback' ? '180px' : activeTab === 'users' ? '160px' : '180px',
                left: activeTab === 'feedback' ? '6px' : activeTab === 'users' ? '186px' : '346px'
              }}
            />
            
            <button
              onClick={() => setActiveTab('feedback')}
              className={`relative z-10 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${
                activeTab === 'feedback' ? 'text-white' : 'text-secondary hover:text-white'
              }`}
              style={{ width: '180px', justifyContent: 'center' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              Feedback Center
            </button>
            {user?.role === 'admin' && (
              <>
                <button
                  onClick={() => setActiveTab('users')}
                  className={`relative z-10 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${
                    activeTab === 'users' ? 'text-white' : 'text-secondary hover:text-white'
                  }`}
                  style={{ width: '160px', justifyContent: 'center' }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Users
                </button>
                <button
                  onClick={() => setActiveTab('whatsapp')}
                  className={`relative z-10 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${
                    activeTab === 'whatsapp' ? 'text-white' : 'text-secondary hover:text-white'
                  }`}
                  style={{ width: '180px', justifyContent: 'center' }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  WhatsApp Hub
                </button>
              </>
            )}
          </nav>

          {/* Mobile Premium Tab Selection */}
          <div className="md:hidden bg-[#0f172a]/80 backdrop-blur-xl p-1.5 rounded-[1.5rem] border border-white/10 flex items-center shadow-[0_20px_50px_rgba(0,0,0,0.5)] mb-6 relative overflow-hidden">
            {/* Animated Glow Background Slider */}
            <div 
              className="absolute h-[calc(100%-12px)] rounded-[1.1rem] bg-gradient-to-br from-emerald-400 to-emerald-600 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] shadow-[0_0_25px_rgba(16,185,129,0.5)]"
              style={{
                width: user?.role === 'admin' ? 'calc(33.33% - 6px)' : 'calc(100% - 12px)',
                left: activeTab === 'feedback' ? '6px' : activeTab === 'users' ? '33.33%' : '66.66%'
              }}
            >
              {/* Subtle inner light effect */}
              <div className="absolute inset-0 bg-white/20 rounded-[1.1rem] mix-blend-overlay"></div>
            </div>
            
            <button
              onClick={() => setActiveTab('feedback')}
              className={`relative z-10 flex-1 py-3 px-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex flex-col items-center gap-2 ${
                activeTab === 'feedback' ? 'text-white' : 'text-slate-400'
              }`}
            >
              <div className={`p-1.5 rounded-lg transition-all duration-300 ${activeTab === 'feedback' ? 'bg-white/10 scale-110' : 'bg-transparent'}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              Feedback
            </button>
            {user?.role === 'admin' && (
              <>
                <button
                  onClick={() => setActiveTab('users')}
                  className={`relative z-10 flex-1 py-3 px-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex flex-col items-center gap-2 ${
                    activeTab === 'users' ? 'text-white' : 'text-slate-400'
                  }`}
                >
                  <div className={`p-1.5 rounded-lg transition-all duration-300 ${activeTab === 'users' ? 'bg-white/10 scale-110' : 'bg-transparent'}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  Users
                </button>
                <button
                  onClick={() => setActiveTab('whatsapp')}
                  className={`relative z-10 flex-1 py-3 px-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex flex-col items-center gap-2 ${
                    activeTab === 'whatsapp' ? 'text-white' : 'text-slate-400'
                  }`}
                >
                  <div className={`p-1.5 rounded-lg transition-all duration-300 ${activeTab === 'whatsapp' ? 'bg-white/10 scale-110' : 'bg-transparent'}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  WhatsApp
                </button>
              </>
            )}
          </div>
        </div>
        
        {/* Tab Content */}
        {activeTab === 'feedback' && (
          <>
            {/* Statistics Cards */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="card">
                  <h3 className="text-sm font-medium text-secondary mb-2">Total Submissions</h3>
                  <p className="text-3xl font-bold" style={{color: 'var(--primary-green)'}}>{stats.totalSubmissions}</p>
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-secondary">Avg Batting:</span>
                      <span className="font-medium text-primary">{(stats.avgBatting || 0).toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-secondary">Avg Bowling:</span>
                      <span className="font-medium text-primary">{(stats.avgBowling || 0).toFixed(1)}</span>
                    </div>
                  </div>
                </div>
                <div className="card">
                  <h3 className="text-sm font-medium text-secondary mb-2">Avg Batting</h3>
                  <p className="text-2xl font-bold text-primary">{(stats.avgBatting || 0).toFixed(1)}</p>
                  <div className="text-accent-orange">{renderStars(Math.round(stats.avgBatting || 0))}</div>
                </div>
                <div className="card">
                  <h3 className="text-sm font-medium text-secondary mb-2">Avg Bowling</h3>
                  <p className="text-2xl font-bold text-primary">{(stats.avgBowling || 0).toFixed(1)}</p>
                  <div className="text-accent-orange">{renderStars(Math.round(stats.avgBowling || 0))}</div>
                </div>
                <div className="card">
                  <h3 className="text-sm font-medium text-secondary mb-2">Avg Team Spirit</h3>
                  <p className="text-2xl font-bold text-primary">{(stats.avgTeamSpirit || 0).toFixed(1)}</p>
                  <div className="text-accent-orange">{renderStars(Math.round(stats.avgTeamSpirit || 0))}</div>
                </div>
              </div>
            )}
            {/* Issue Filters */}
            <div className="mb-6 overflow-hidden">
              <div className="flex flex-col gap-4">
                <div className="flex overflow-x-auto no-scrollbar pb-2 gap-2" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
                  {[
                    { key: 'venue', label: 'Venue' },
                    { key: 'equipment', label: 'Equipment' },
                    { key: 'timing', label: 'Timing' },
                    { key: 'umpiring', label: 'Umpiring' },
                    { key: 'other', label: 'Other' },
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      className={`px-4 py-2 rounded-full text-xs md:text-sm font-medium border transition-all whitespace-nowrap min-h-[40px] flex items-center ${
                        selectedIssue === key
                          ? 'bg-primary-green text-white border-primary-green'
                          : 'border-gray-700 text-secondary hover:text-white'
                      }`}
                      onClick={() => handleIssueClick(key)}
                    >
                      {label}
                    </button>
                  ))}
                  <button
                    className="px-4 py-2 rounded-full text-xs md:text-sm font-medium border border-gray-700 text-secondary hover:text-white transition-all whitespace-nowrap min-h-[40px] flex items-center"
                    onClick={() => setSelectedIssue(null)}
                  >
                    Clear Filters
                  </button>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                  <button
                    className={`btn btn-outline flex-1 md:flex-none text-xs md:text-sm h-11 md:h-auto ${currentView === 'active' ? 'border-primary-green text-primary-green' : ''}`}
                    onClick={() => setCurrentView('active')}
                  >
                    Active ({feedback.length})
                  </button>
                  <button
                    className={`btn btn-outline flex-1 md:flex-none text-xs md:text-sm h-11 md:h-auto ${currentView === 'trash' ? 'border-primary-green text-primary-green' : ''}`}
                    onClick={() => setCurrentView('trash')}
                  >
                    Trash ({trashFeedback.length})
                  </button>
                </div>
              </div>
            </div>

            {/* Feedback List */}
            <div className="space-y-4">
              {(() => {
                const displayedFeedback =
                  currentView === 'active' ? getFilteredFeedback() : trashFeedback;

                if (!displayedFeedback.length) {
                  return (
                    <div className="card text-center py-12">
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

                return displayedFeedback.map((item) => (
                  <div
                    key={item._id}
                    className="card flex flex-col md:flex-row md:items-center md:justify-between gap-4 cursor-pointer transition hover:border-primary-green/50"
                    onClick={() => handleFeedbackClick(item)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        handleFeedbackClick(item);
                      }
                    }}
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <div>
                          <p className="text-lg font-semibold text-white">{item.playerName}</p>
                          <p className="text-xs text-secondary">{formatDate(item.createdAt)}</p>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs">
                          {Object.entries(item.issues)
                            .filter(([, value]) => value)
                            .map(([issueKey]) => (
                              <span
                                key={issueKey}
                                className="px-2 py-1 rounded-full bg-gray-800 border border-gray-700 text-secondary"
                              >
                                {issueKey}
                              </span>
                            ))}
                        </div>
                      </div>
                      <p className="text-secondary text-sm mt-3 line-clamp-2">
                        {item.feedbackText}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      {currentView === 'active' ? (
                        <button
                          className="btn btn-outline text-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteFeedback(item._id);
                          }}
                        >
                          Move to Trash
                        </button>
                      ) : (
                        <>
                          <button
                            className="btn btn-outline text-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRestoreFeedback(item._id);
                            }}
                          >
                            Restore
                          </button>
                          <button
                            className="btn btn-danger text-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePermanentDelete(item._id);
                            }}
                          >
                            Delete Permanently
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ));
              })()}
            </div>
          </>
        )}
        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'whatsapp' && user?.role === 'admin' && <WhatsAppMessagingTab />}
      </div>

      {/* Feedback Detail Modal */}
      {showModal && selectedFeedback && (
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
                    {selectedFeedback.playerName}
                  </h2>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-secondary mt-3">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary-green"></span>
                      {formatDate(selectedFeedback.createdAt)}
                    </span>
                    <span className="text-white/20">•</span>
                    <span>Match: {formatDate(String(selectedFeedback.matchDate))}</span>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-primary-green/20 to-primary-green/5 border border-primary-green/30 rounded-2xl px-8 py-6 text-center md:text-right shadow-inner">
                  <p className="text-[10px] text-secondary uppercase tracking-[0.2em] mb-1 font-bold">Overall Spirit</p>
                  <p className="text-5xl font-black text-primary-green drop-shadow-sm">{selectedFeedback.teamSpirit.toFixed(1)}</p>
                  <p className="text-[10px] text-secondary mt-1 font-medium">OUT OF 5.0</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                {[
                  { label: 'Batting', value: selectedFeedback.batting },
                  { label: 'Bowling', value: selectedFeedback.bowling },
                  { label: 'Fielding', value: selectedFeedback.fielding },
                  { label: 'Team Spirit', value: selectedFeedback.teamSpirit },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="group rounded-2xl border border-white/5 bg-white/5 p-5 transition-all hover:bg-white/10 hover:border-white/10"
                  >
                    <p className="text-[10px] uppercase tracking-widest text-secondary font-bold mb-3">{stat.label}</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-white">{stat.value.toFixed(1)}</span>
                      <span className="text-xs text-secondary/50 font-medium">/ 5</span>
                    </div>
                    <div className="text-sm text-yellow-500 mt-2 flex gap-0.5">
                      {renderStars(Math.round(stat.value))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mb-10">
                <p className="text-[10px] uppercase tracking-[0.3em] text-secondary font-bold mb-4">Issue Signals</p>
                <div className="flex flex-wrap gap-2.5">
                  {Object.entries(selectedFeedback.issues).every(([, value]) => !value) ? (
                    <span className="px-4 py-2 rounded-xl text-xs border border-white/5 bg-white/5 text-secondary italic">
                      No specific issues flagged by player
                    </span>
                  ) : (
                    Object.entries(selectedFeedback.issues)
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
                  <p className="text-base text-white/90 leading-relaxed font-medium italic">"{selectedFeedback.feedbackText}"</p>
                </div>
                <div className="bg-white/5 border border-white/5 rounded-2xl p-6 md:p-8">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-1 h-4 bg-accent-blue rounded-full"></span>
                    <p className="text-xs uppercase tracking-[0.2em] text-secondary font-bold">Additional Notes</p>
                  </div>
                  <p className="text-base text-white/90 leading-relaxed font-medium">
                    {selectedFeedback.additionalComments?.trim() || 'No additional comments provided.'}
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
                {currentView === 'active' ? (
                  <button
                    className="btn btn-danger h-14 md:h-auto order-1 md:order-2"
                    onClick={() => {
                      handleDeleteFeedback(selectedFeedback._id);
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
                        handleRestoreFeedback(selectedFeedback._id);
                        closeModal();
                      }}
                    >
                      Restore Feedback
                    </button>
                    <button
                      className="btn btn-danger h-14 md:h-auto"
                      onClick={() => {
                        handlePermanentDelete(selectedFeedback._id);
                        closeModal();
                      }}
                    >
                      Delete Permanently
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} })}
      />
    </>
  );
};

export default AdminDashboard;
