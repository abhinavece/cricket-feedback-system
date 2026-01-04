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
        <h1 className="text-4xl font-bold mb-2" style={{color: 'var(--primary-green)'}}>Admin Dashboard</h1>
        <p className="text-secondary">Manage cricket feedback and user data</p>
      </div>
        
        {/* Tab Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-8 border-b" style={{borderColor: 'var(--border-color)'}}>
            <button
              onClick={() => setActiveTab('feedback')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-all ${
                activeTab === 'feedback'
                  ? 'border-primary-green text-primary-green'
                  : 'border-transparent text-secondary hover:text-primary'
              }`}
            >
              Feedback Management
            </button>
            {user?.role === 'admin' && (
              <>
                <button
                  onClick={() => setActiveTab('users')}
                  className={`py-3 px-1 border-b-2 font-medium text-sm transition-all ${
                    activeTab === 'users'
                      ? 'border-primary-green text-primary-green'
                      : 'border-transparent text-secondary hover:text-primary'
                  }`}
                >
                  User Management
                </button>
                <button
                  onClick={() => setActiveTab('whatsapp')}
                  className={`py-3 px-1 border-b-2 font-medium text-sm transition-all ${
                    activeTab === 'whatsapp'
                      ? 'border-primary-green text-primary-green'
                      : 'border-transparent text-secondary hover:text-primary'
                  }`}
                >
                  WhatsApp Messaging
                </button>
              </>
            )}
          </nav>
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
            <div className="mb-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: 'venue', label: 'Venue' },
                    { key: 'equipment', label: 'Equipment' },
                    { key: 'timing', label: 'Timing' },
                    { key: 'umpiring', label: 'Umpiring' },
                    { key: 'other', label: 'Other' },
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
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
                    className="px-4 py-2 rounded-full text-sm font-medium border border-gray-700 text-secondary hover:text-white transition-all"
                    onClick={() => setSelectedIssue(null)}
                  >
                    Clear Filters
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    className={`btn btn-outline text-sm ${currentView === 'active' ? 'border-primary-green text-primary-green' : ''}`}
                    onClick={() => setCurrentView('active')}
                  >
                    Active ({feedback.length})
                  </button>
                  <button
                    className={`btn btn-outline text-sm ${currentView === 'trash' ? 'border-primary-green text-primary-green' : ''}`}
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
          className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-backdrop-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeModal();
            }
          }}
        >
          <div
            className="w-full max-w-4xl bg-gradient-to-br from-gray-900 via-gray-900/95 to-black border border-gray-800 rounded-3xl shadow-2xl animate-modal-in overflow-hidden"
            style={{ maxHeight: '90vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative p-6 md:p-10">
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 text-secondary hover:text-white transition"
                aria-label="Close details"
              >
                ✕
              </button>

              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-primary-green/80">Feedback Detail</p>
                  <h2 className="text-3xl md:text-4xl font-bold text-white mt-2">
                    {selectedFeedback.playerName}
                  </h2>
                  <p className="text-sm text-secondary mt-2">
                    Submitted on {formatDate(selectedFeedback.createdAt)} · Match date:{' '}
                    {formatDate(String(selectedFeedback.matchDate))}
                  </p>
                </div>
                <div className="bg-primary-green/10 border border-primary-green/40 rounded-2xl px-6 py-4 text-right">
                  <p className="text-xs text-secondary uppercase tracking-wide">Overall Spirit</p>
                  <p className="text-4xl font-black text-primary-green">{selectedFeedback.teamSpirit.toFixed(1)}</p>
                  <p className="text-xs text-secondary mt-1">/ 5</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                  { label: 'Batting', value: selectedFeedback.batting },
                  { label: 'Bowling', value: selectedFeedback.bowling },
                  { label: 'Fielding', value: selectedFeedback.fielding },
                  { label: 'Team Spirit', value: selectedFeedback.teamSpirit },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl border border-gray-800 bg-gray-900/70 p-4"
                  >
                    <p className="text-xs uppercase tracking-wide text-secondary">{stat.label}</p>
                    <p className="text-2xl font-semibold text-white mt-2">
                      {stat.value.toFixed(1)}
                      <span className="text-sm text-secondary"> / 5</span>
                    </p>
                    <div className="text-sm text-accent-orange mt-1">
                      {renderStars(Math.round(stat.value))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mb-8">
                <p className="text-sm uppercase tracking-[0.4em] text-secondary mb-3">Issue Signals</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(selectedFeedback.issues).every(([, value]) => !value) ? (
                    <span className="px-3 py-1 rounded-full text-sm border border-gray-700 text-secondary">
                      No specific issues flagged
                    </span>
                  ) : (
                    Object.entries(selectedFeedback.issues)
                      .filter(([, value]) => value)
                      .map(([issueKey]) => (
                        <span
                          key={issueKey}
                          className="px-4 py-1.5 rounded-full text-sm font-medium bg-primary-green/10 text-primary-green border border-primary-green/40"
                        >
                          {issueKey}
                        </span>
                      ))
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gray-900/70 border border-gray-800 rounded-2xl p-5">
                  <p className="text-xs uppercase tracking-[0.3em] text-secondary">Match Narration</p>
                  <p className="text-base text-white leading-relaxed mt-3">{selectedFeedback.feedbackText}</p>
                </div>
                <div className="bg-gray-900/70 border border-gray-800 rounded-2xl p-5">
                  <p className="text-xs uppercase tracking-[0.3em] text-secondary">Additional Notes</p>
                  <p className="text-base text-white leading-relaxed mt-3">
                    {selectedFeedback.additionalComments?.trim() || 'No additional comments provided.'}
                  </p>
                </div>
              </div>

              <div className="mt-10 flex flex-wrap gap-3 justify-end">
                <button className="btn btn-outline" onClick={closeModal}>
                  Close
                </button>
                {currentView === 'active' ? (
                  <button
                    className="btn btn-danger"
                    onClick={() => {
                      handleDeleteFeedback(selectedFeedback._id);
                      closeModal();
                    }}
                  >
                    Move to Trash
                  </button>
                ) : (
                  <>
                    <button
                      className="btn btn-outline"
                      onClick={() => {
                        handleRestoreFeedback(selectedFeedback._id);
                        closeModal();
                      }}
                    >
                      Restore
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => {
                        handlePermanentDelete(selectedFeedback._id);
                        closeModal();
                      }}
                    >
                      Delete Permanently
                    </button>
                  </>
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
