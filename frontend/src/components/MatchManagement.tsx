import React, { useState, useEffect, useCallback } from 'react';
// @ts-ignore
import { Plus, Filter, Search, Calendar, Trophy, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import MatchForm from './MatchForm';
import MatchCard from './MatchCard';
import ConfirmDialog from './ConfirmDialog';
import MatchAvailabilityDashboard from './MatchAvailabilityDashboard';
import MatchDetailModal from './MatchDetailModal';
import { matchApi } from '../services/matchApi';
import { matchEvents } from '../utils/matchEvents';

interface Match {
  _id: string;
  matchId: string;
  cricHeroesMatchId: string;
  date: string;
  time: string;
  slot: string;
  opponent: string;
  ground: string;
  locationLink?: string;
  status: 'draft' | 'confirmed' | 'cancelled' | 'completed';
  matchType?: 'practice' | 'tournament' | 'friendly';
  squad?: Array<{
    player: {
      _id: string;
      name: string;
      phone: string;
      role: string;
      team: string;
    };
    response: 'yes' | 'no' | 'tentative' | 'pending';
    respondedAt: string | null;
    notes: string;
  }>;
  createdBy: {
    name: string;
    email: string;
  };
  createdAt: string;
  notes: string;
  // Availability tracking fields
  availabilitySent?: boolean;
  availabilitySentAt?: string;
  totalPlayersRequested?: number;
  confirmedPlayers?: number;
  declinedPlayers?: number;
  tentativePlayers?: number;
  noResponsePlayers?: number;
  lastAvailabilityUpdate?: string;
  squadStatus?: 'pending' | 'partial' | 'full';
}

const MatchManagement: React.FC = () => {
  const { isViewer } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const hasFetchedInitial = React.useRef(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAvailability, setShowAvailability] = useState(false);
  const [selectedMatchForAvailability, setSelectedMatchForAvailability] = useState<Match | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedMatchForDetail, setSelectedMatchForDetail] = useState<Match | null>(null);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
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

  // Fetch matches with pagination
  const fetchMatches = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    try {
      console.log(`[MatchManagement] Fetching matches - Page: ${pageNum}, Append: ${append}`);
      
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const data = await matchApi.getMatches({ page: pageNum, limit: 10 });
      const pagination = data.pagination || {};
      
      // Calculate hasMore: if current page * limit < total, there are more pages
      const hasMoreData = (pageNum * 10) < (pagination.total || 0);
      
      console.log(`[MatchManagement] API Response:`, {
        matchCount: data.matches?.length || 0,
        pagination,
        calculatedHasMore: hasMoreData,
        pageNum,
        total: pagination.total
      });

      if (append) {
        setMatches(prev => {
          const newMatches = [...prev, ...(data.matches || [])];
          console.log(`[MatchManagement] Appended matches. Total now: ${newMatches.length}`);
          return newMatches;
        });
      } else {
        setMatches(data.matches || []);
        console.log(`[MatchManagement] Set initial matches: ${data.matches?.length || 0}`);
      }

      console.log(`[MatchManagement] Setting hasMore to: ${hasMoreData}`);
      setHasMore(hasMoreData);
      setCurrentPage(pageNum);
    } catch (error) {
      console.error('[MatchManagement] Error fetching matches:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // Initial load - only once
  useEffect(() => {
    if (hasFetchedInitial.current) return;
    hasFetchedInitial.current = true;
    console.log('[MatchManagement] Component mounted, fetching initial matches');
    fetchMatches(1, false);
  }, [fetchMatches]);

  // Close filter menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showFilterMenu) {
        setShowFilterMenu(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showFilterMenu]);

  // Infinite scroll handler
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let isScrolling = false;
    
    const handleScroll = () => {
      if (isScrolling) return;
      
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (loading || loadingMore || !hasMore) {
          console.log('[MatchManagement] Scroll ignored - loading:', loading, 'loadingMore:', loadingMore, 'hasMore:', hasMore);
          return;
        }
        
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight;
        const clientHeight = document.documentElement.clientHeight;
        
        console.log('[MatchManagement] Scroll position:', {
          scrollTop,
          clientHeight,
          scrollHeight,
          distanceFromBottom: scrollHeight - (scrollTop + clientHeight)
        });
        
        // Trigger when user is 300px from bottom
        if (scrollTop + clientHeight >= scrollHeight - 300) {
          if (!loadingMore && hasMore) {
            console.log('[MatchManagement] Triggering load more - next page:', currentPage + 1);
            isScrolling = true;
            fetchMatches(currentPage + 1, true);
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
  }, [loading, loadingMore, hasMore, currentPage, fetchMatches]);

  const handleCreateMatch = () => {
    setEditingMatch(null);
    setShowForm(true);
  };

  const handleEditMatch = (match: Match) => {
    setEditingMatch(match);
    setShowForm(true);
  };

  const handleFormSubmit = async (formData: any) => {
    try {
      if (editingMatch) {
        await matchApi.updateMatch(editingMatch._id, formData);
      } else {
        await matchApi.createMatch(formData);
      }
      setShowForm(false);
      setEditingMatch(null);
      console.log('[MatchManagement] Match saved, refreshing list');
      fetchMatches(1, false);
      // Notify other components about match change
      matchEvents.emit();
    } catch (error) {
      console.error('Error saving match:', error);
    }
  };

  const handleDeleteMatch = (matchId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Match',
      message: 'Are you sure you want to delete this match? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await matchApi.deleteMatch(matchId);
          console.log('[MatchManagement] Match deleted, refreshing list');
          fetchMatches(1, false);
          // Notify other components about match change
          matchEvents.emit();
        } catch (error) {
          console.error('Error deleting match:', error);
        }
        setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} });
      }
    });
  };

  const handleViewMatch = (match: Match) => {
    setSelectedMatchForDetail(match);
    setShowDetailModal(true);
  };

  const handleManageSquad = (match: Match) => {
    setSelectedMatchForDetail(match);
    setShowDetailModal(true);
  };

  const handleViewAvailability = (match: Match) => {
    setSelectedMatchForAvailability(match);
    setShowAvailability(true);
  };

  const handleSendAvailabilityFromDetail = (match: Match) => {
    setShowDetailModal(false);
    // Navigate to WhatsApp tab with match pre-selected
    // This would require lifting state up or using a router
    console.log('Send availability for match:', match._id);
  };

  const filteredMatches = matches.filter(match => {
    const matchesSearch = match.matchId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         match.opponent.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         match.ground.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || match.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getMatchStats = () => {
    const total = matches.length;
    const upcoming = matches.filter(m => new Date(m.date) > new Date()).length;
    const completed = matches.filter(m => m.status === 'completed').length;
    const confirmed = matches.filter(m => m.status === 'confirmed').length;

    return { total, upcoming, completed, confirmed };
  };

  const stats = getMatchStats();

  if (showForm) {
    return (
      <MatchForm
        mode={editingMatch ? 'edit' : 'create'}
        initialData={editingMatch ? {
          date: editingMatch.date.split('T')[0],
          time: editingMatch.time,
          slot: editingMatch.slot as 'morning' | 'evening' | 'night' | 'custom',
          ground: editingMatch.ground,
          locationLink: editingMatch.locationLink || '',
          opponent: editingMatch.opponent,
          cricHeroesMatchId: editingMatch.cricHeroesMatchId,
          notes: editingMatch.notes,
          status: editingMatch.status,
          matchType: editingMatch.matchType || 'practice'
        } : undefined}
        onSubmit={handleFormSubmit}
        onCancel={() => {
          setShowForm(false);
          setEditingMatch(null);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-slate-800/50 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-6">
            <div>
              <h1 className="text-xl sm:text-3xl font-black text-white flex items-center gap-2 sm:gap-3">
                <Trophy className="w-5 h-5 sm:w-8 sm:h-8 text-emerald-400" />
                Match Management
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5 sm:mt-1 hidden sm:block">Create and manage cricket matches with squad availability</p>
            </div>
            
            {!isViewer() && (
              <button
                onClick={handleCreateMatch}
                className="px-4 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-sm sm:text-base font-medium rounded-lg transition-all duration-200 shadow-lg shadow-emerald-500/20 flex items-center gap-2 w-full sm:w-auto justify-center"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                Create Match
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-8">
        {/* Mobile: Single compact card with inline stats */}
        <div className="sm:hidden bg-slate-800/50 backdrop-blur-xl rounded-lg border border-white/10 p-3 mb-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <Trophy className="w-3 h-3 text-emerald-400" />
              <span className="text-xs text-slate-400">Total:</span>
              <span className="text-sm font-black text-white">{stats.total}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-amber-400" />
              <span className="text-xs text-slate-400">Up:</span>
              <span className="text-sm font-black text-white">{stats.upcoming}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3 text-emerald-400" />
              <span className="text-xs text-slate-400">Conf:</span>
              <span className="text-sm font-black text-white">{stats.confirmed}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <Trophy className="w-3 h-3 text-slate-400" />
              <span className="text-xs text-slate-400">Done:</span>
              <span className="text-sm font-black text-white">{stats.completed}</span>
            </div>
          </div>
        </div>

        {/* Desktop: 4-column grid */}
        <div className="hidden sm:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-white/10 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Total Matches</p>
                <p className="text-2xl font-black text-white mt-1">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-slate-700/50 rounded-lg flex items-center justify-center">
                <Trophy className="w-6 h-6 text-emerald-400" />
              </div>
            </div>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-white/10 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Upcoming</p>
                <p className="text-2xl font-black text-white mt-1">{stats.upcoming}</p>
              </div>
              <div className="w-12 h-12 bg-slate-700/50 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-amber-400" />
              </div>
            </div>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-white/10 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Confirmed</p>
                <p className="text-2xl font-black text-white mt-1">{stats.confirmed}</p>
              </div>
              <div className="w-12 h-12 bg-slate-700/50 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-emerald-400" />
              </div>
            </div>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-white/10 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Completed</p>
                <p className="text-2xl font-black text-white mt-1">{stats.completed}</p>
              </div>
              <div className="w-12 h-12 bg-slate-700/50 rounded-lg flex items-center justify-center">
                <Trophy className="w-6 h-6 text-slate-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-lg border border-white/10 p-3 sm:p-6 mb-4 sm:mb-8">
          {/* Mobile: Search + Filter Button */}
          <div className="sm:hidden flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search matches..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 transition-all focus:border-emerald-500 focus:ring-emerald-500/20 focus:outline-none focus:ring-2"
              />
            </div>
            
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowFilterMenu(!showFilterMenu);
                }}
                className="px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-400 hover:text-white transition-all flex items-center gap-1"
              >
                <Filter className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Desktop: Search + Dropdown */}
          <div className="hidden sm:flex flex-col sm:flex-row gap-2 sm:gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search matches..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 sm:py-3 text-sm sm:text-base bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 transition-all focus:border-emerald-500 focus:ring-emerald-500/20 focus:outline-none focus:ring-2"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base bg-slate-700/50 border border-slate-600 rounded-lg text-white transition-all focus:border-emerald-500 focus:ring-emerald-500/20 focus:outline-none focus:ring-2"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Mobile Filter Dropdown - Outside container to avoid clipping */}
        {showFilterMenu && (
          <div 
            className="fixed left-0 right-0 top-32 z-[9999] px-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full max-w-xs mx-auto bg-slate-800 border border-slate-600 rounded-lg shadow-lg overflow-hidden">
              {['all', 'draft', 'confirmed', 'cancelled', 'completed'].map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    setStatusFilter(status);
                    setShowFilterMenu(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm transition-all ${
                    statusFilter === status
                      ? 'bg-emerald-500/20 text-emerald-400 border-l-2 border-emerald-400'
                      : 'text-slate-300 hover:bg-slate-700/50'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Matches Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredMatches.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No matches found</h3>
            <p className="text-slate-400 mb-6">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your filters or search terms' 
                : 'Get started by creating your first match'
              }
            </p>
            {!isViewer() && !searchTerm && statusFilter === 'all' && (
              <button
                onClick={handleCreateMatch}
                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium rounded-lg transition-all duration-200 shadow-lg shadow-emerald-500/20 flex items-center gap-2 mx-auto"
              >
                <Plus className="w-5 h-5" />
                Create Your First Match
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredMatches.map((match) => (
                <MatchCard
                  key={match._id}
                  match={match}
                  onEdit={!isViewer() ? handleEditMatch : undefined}
                  onDelete={!isViewer() ? handleDeleteMatch : undefined}
                  onView={handleViewMatch}
                  onManageSquad={!isViewer() ? handleManageSquad : undefined}
                  onViewAvailability={handleViewAvailability}
                />
              ))}
            </div>
            
            {/* Loading More Indicator */}
            {loadingMore && (
              <div className="flex justify-center items-center py-8">
                <div className="flex items-center gap-3 text-slate-400">
                  <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm">Loading more matches...</span>
                </div>
              </div>
            )}
            
            {/* No More Matches Indicator */}
            {!hasMore && matches.length > 0 && (
              <div className="flex justify-center items-center py-8">
                <p className="text-sm text-slate-500">No more matches to load</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Match Detail Modal */}
      {showDetailModal && selectedMatchForDetail && (
        <MatchDetailModal
          match={selectedMatchForDetail}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedMatchForDetail(null);
            console.log('[MatchManagement] Modal closed, refreshing matches');
            fetchMatches(1, false);
          }}
          onEdit={!isViewer() ? (match) => {
            setShowDetailModal(false);
            handleEditMatch(match);
          } : undefined}
          onDelete={!isViewer() ? (matchId) => {
            setShowDetailModal(false);
            handleDeleteMatch(matchId);
          } : undefined}
          onSendAvailability={!isViewer() ? handleSendAvailabilityFromDetail : undefined}
        />
      )}

      {/* Availability Dashboard Modal */}
      {showAvailability && selectedMatchForAvailability && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <MatchAvailabilityDashboard
                matchId={selectedMatchForAvailability._id}
                matchTitle={`${selectedMatchForAvailability.opponent || 'Practice Match'} @ ${selectedMatchForAvailability.ground}`}
                onClose={() => {
                  setShowAvailability(false);
                  setSelectedMatchForAvailability(null);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} })}
      />
    </div>
  );
};

export default MatchManagement;
