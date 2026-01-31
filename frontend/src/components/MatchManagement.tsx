import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Plus, Filter, Search, Calendar, Trophy, Users, 
  Sparkles, Brain, RefreshCw, Target, CheckCircle, 
  Clock, Zap
} from 'lucide-react';
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
  const canvasRef = useRef<HTMLCanvasElement>(null);
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
  const [initialDetailTab, setInitialDetailTab] = useState<'overview' | 'responses' | 'squad' | 'feedback'>('overview');
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

  // Animated neural network background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      opacity: number;
    }> = [];

    const numParticles = 40;
    
    for (let i = 0; i < numParticles; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        radius: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.3 + 0.1,
      });
    }

    let animationId: number;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(16, 185, 129, ${p.opacity})`;
        ctx.fill();

        particles.slice(i + 1).forEach((p2) => {
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(16, 185, 129, ${0.06 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationId);
    };
  }, []);

  const fetchMatches = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const data = await matchApi.getMatches({ page: pageNum, limit: 10 });
      const pagination = data.pagination || {};
      const hasMoreData = (pageNum * 10) < (pagination.total || 0);

      if (append) {
        setMatches(prev => [...prev, ...(data.matches || [])]);
      } else {
        setMatches(data.matches || []);
      }

      setHasMore(hasMoreData);
      setCurrentPage(pageNum);
    } catch (error) {
      console.error('[MatchManagement] Error fetching matches:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    if (hasFetchedInitial.current) return;
    hasFetchedInitial.current = true;
    fetchMatches(1, false);
  }, [fetchMatches]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let isScrolling = false;
    
    const handleScroll = () => {
      if (isScrolling) return;
      
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (loading || loadingMore || !hasMore) return;
        
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight;
        const clientHeight = document.documentElement.clientHeight;
        
        if (scrollTop + clientHeight >= scrollHeight - 300) {
          if (!loadingMore && hasMore) {
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
      fetchMatches(1, false);
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
          fetchMatches(1, false);
          matchEvents.emit();
        } catch (error) {
          console.error('Error deleting match:', error);
        }
        setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} });
      }
    });
  };

  const handleFeedback = (match: Match) => {
    setSelectedMatchForDetail(match);
    setInitialDetailTab('overview'); // Open overview tab by default
    setShowDetailModal(true);
  };

  const handleViewAvailability = (match: Match) => {
    setSelectedMatchForAvailability(match);
    setShowAvailability(true);
  };

  const handleSendAvailabilityFromDetail = (match: Match) => {
    setShowDetailModal(false);
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
    <div className="relative min-h-screen">
      {/* Neural Network Background */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full pointer-events-none opacity-40"
        style={{ zIndex: 0 }}
      />

      {/* Gradient Overlays */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        {/* Header Section */}
        <div className="bg-slate-900/80 backdrop-blur-xl border-b border-white/5 sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <Trophy className="w-6 h-6 md:w-7 md:h-7 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-violet-500 rounded-full flex items-center justify-center border-2 border-slate-900">
                    <Sparkles className="w-2.5 h-2.5 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                    Match Center
                    <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 bg-violet-500/20 border border-violet-500/30 rounded-full text-xs text-violet-400">
                      <Brain className="w-3 h-3" />
                      AI
                    </span>
                  </h1>
                  <p className="text-sm text-slate-400 hidden sm:block">Manage matches & squad availability</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={() => fetchMatches(1, false)}
                  className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-sm text-slate-300 hover:bg-slate-800 hover:border-emerald-500/30 transition-all group"
                >
                  <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
                
                {!isViewer() && (
                  <button
                    onClick={handleCreateMatch}
                    className="relative group"
                  >
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl blur opacity-60 group-hover:opacity-100 transition" />
                    <div className="relative flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-medium rounded-xl transition-all">
                      <Plus className="w-4 h-4" />
                      <span className="hidden sm:inline">Create Match</span>
                    </div>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
            {[
              { label: 'Total', value: stats.total, icon: <Trophy className="w-5 h-5" />, color: 'emerald', gradient: 'from-emerald-500/20 to-cyan-500/20' },
              { label: 'Upcoming', value: stats.upcoming, icon: <Calendar className="w-5 h-5" />, color: 'amber', gradient: 'from-amber-500/20 to-orange-500/20' },
              { label: 'Confirmed', value: stats.confirmed, icon: <CheckCircle className="w-5 h-5" />, color: 'cyan', gradient: 'from-cyan-500/20 to-blue-500/20' },
              { label: 'Completed', value: stats.completed, icon: <Target className="w-5 h-5" />, color: 'violet', gradient: 'from-violet-500/20 to-purple-500/20' },
            ].map((stat, idx) => (
              <div
                key={idx}
                className={`relative group bg-gradient-to-br ${stat.gradient} backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:border-${stat.color}-500/30 transition-all overflow-hidden`}
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-white/5 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="relative">
                  <div className={`w-10 h-10 bg-${stat.color}-500/20 rounded-lg flex items-center justify-center text-${stat.color}-400 mb-3`}>
                    {stat.icon}
                  </div>
                  <p className="text-2xl md:text-3xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-slate-400 uppercase tracking-wider mt-1">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Search & Filters */}
          <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/30 rounded-2xl p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-3">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search matches, opponents, grounds..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                />
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {[
                  { id: 'all', label: 'All', icon: <Zap className="w-3 h-3" /> },
                  { id: 'confirmed', label: 'Confirmed', icon: <CheckCircle className="w-3 h-3" /> },
                  { id: 'draft', label: 'Draft', icon: <Clock className="w-3 h-3" /> },
                  { id: 'completed', label: 'Completed', icon: <Target className="w-3 h-3" /> },
                ].map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => setStatusFilter(filter.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                      statusFilter === filter.id
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-800/50 text-slate-400 border border-transparent hover:border-slate-700'
                    }`}
                  >
                    {filter.icon}
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Matches Grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="relative">
                <div className="w-12 h-12 border-2 border-emerald-500/30 rounded-full" />
                <div className="absolute inset-0 w-12 h-12 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              </div>
              <p className="text-sm text-slate-400">Loading matches...</p>
            </div>
          ) : filteredMatches.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="relative">
                <div className="w-20 h-20 bg-slate-800/50 rounded-2xl flex items-center justify-center">
                  <Trophy className="w-10 h-10 text-slate-600" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-violet-500/20 rounded-full flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-violet-400" />
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-bold text-white mb-2">No matches found</h3>
                <p className="text-sm text-slate-400 max-w-sm">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Try adjusting your filters or search terms' 
                    : 'Get started by creating your first match'
                  }
                </p>
              </div>
              {!isViewer() && !searchTerm && statusFilter === 'all' && (
                <button
                  onClick={handleCreateMatch}
                  className="mt-4 flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-medium rounded-xl shadow-lg shadow-emerald-500/20"
                >
                  <Plus className="w-5 h-5" />
                  Create Your First Match
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                {filteredMatches.map((match, index) => (
                  <MatchCard
                    key={match._id}
                    match={match}
                    onEdit={!isViewer() ? handleEditMatch : undefined}
                    onDelete={!isViewer() ? handleDeleteMatch : undefined}
                    onFeedback={handleFeedback}
                    onViewAvailability={handleViewAvailability}
                    animationDelay={index * 50}
                  />
                ))}
              </div>
              
              {/* Loading More Indicator */}
              {loadingMore && (
                <div className="flex justify-center items-center py-8">
                  <div className="flex items-center gap-3 px-4 py-2 bg-slate-800/50 rounded-full">
                    <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-slate-400">Loading more...</span>
                  </div>
                </div>
              )}
              
              {/* End of List */}
              {!hasMore && matches.length > 0 && (
                <div className="flex justify-center items-center py-8">
                  <p className="text-sm text-slate-500 px-4 py-2 bg-slate-800/30 rounded-full">
                    All matches loaded
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Match Detail Modal */}
      {showDetailModal && selectedMatchForDetail && (
        <MatchDetailModal
          match={selectedMatchForDetail}
          initialTab={initialDetailTab}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedMatchForDetail(null);
            setInitialDetailTab('overview');
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
          <div className="bg-slate-900 border border-white/10 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
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

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default MatchManagement;
