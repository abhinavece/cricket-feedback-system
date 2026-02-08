import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getMatches, getMatch, createMatch, updateMatch, deleteMatch, getMatchAvailability, updateAvailability, deleteAvailability, createAvailability, getPlayers } from '../../services/api';
import { 
  Calendar, Clock, ChevronRight, X, RefreshCw, CheckCircle, XCircle, 
  HelpCircle, Clock as ClockIcon, Plus, Edit2, Trash2, MapPin, Trophy, 
  UserPlus, Users, MessageSquare, ChevronDown, ChevronUp, Sparkles,
  Brain, Send, Zap, Target
} from 'lucide-react';
import { matchEvents } from '../../utils/matchEvents';
import MatchFeedbackDashboard from '../../components/MatchFeedbackDashboard';
import AvailabilityEditModal from '../AvailabilityEditModal';

interface Match {
  _id: string;
  matchId: string;
  date: string;
  time: string;
  slot: string;
  opponent: string;
  ground: string;
  status: string;
  squad?: any[];
  squadStats?: {
    total: number;
    yes: number;
    no: number;
    tentative: number;
    pending: number;
  };
}

const MobileMatchesTab: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { isViewer } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed'>('upcoming');
  
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    slot: 'morning',
    opponent: '',
    ground: '',
    notes: ''
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [availabilities, setAvailabilities] = useState<any[]>([]);
  const [editingAvailId, setEditingAvailId] = useState<string | null>(null);
  const [editingAvailabilityPlayer, setEditingAvailabilityPlayer] = useState<{id: string; name: string; response: 'yes' | 'no' | 'tentative' | 'pending'} | null>(null);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [allPlayers, setAllPlayers] = useState<any[]>([]);
  const [selectedPlayersToAdd, setSelectedPlayersToAdd] = useState<string[]>([]);
  const [showFeedbackSection, setShowFeedbackSection] = useState(false);

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

    const numParticles = 25;
    
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

          if (dist < 80) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(16, 185, 129, ${0.06 * (1 - dist / 80)})`;
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

  const fetchMatches = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const data = await getMatches();
      setMatches(data);
    } catch (err) {
      console.error('Error fetching matches:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  const handleRefresh = () => fetchMatches(true);

  const resetForm = () => {
    setFormData({ date: '', time: '', slot: 'morning', opponent: '', ground: '', notes: '' });
    setEditMode(false);
    setShowForm(false);
  };

  const handleCreateMatch = () => {
    resetForm();
    setShowForm(true);
  };

  const handleEditMatch = () => {
    if (!selectedMatch) return;
    setFormData({
      date: selectedMatch.date?.split('T')[0] || '',
      time: selectedMatch.time || '',
      slot: selectedMatch.slot || 'morning',
      opponent: selectedMatch.opponent || '',
      ground: selectedMatch.ground || '',
      notes: selectedMatch.notes || ''
    });
    setEditMode(true);
    setShowForm(true);
    setSelectedMatch(null);
  };

  const handleSubmitForm = async () => {
    if (!formData.opponent || !formData.date) {
      setError('Opponent and date are required');
      return;
    }
    setActionLoading(true);
    try {
      if (editMode && selectedMatch) {
        await updateMatch(selectedMatch._id, formData);
        setSuccess('Match updated');
      } else {
        await createMatch(formData);
        setSuccess('Match created');
      }
      resetForm();
      fetchMatches(true);
      matchEvents.emit();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save match');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteMatch = async () => {
    if (!selectedMatch || !window.confirm('Delete this match?')) return;
    setActionLoading(true);
    try {
      await deleteMatch(selectedMatch._id);
      setSuccess('Match deleted');
      setSelectedMatch(null);
      fetchMatches(true);
      matchEvents.emit();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete match');
    } finally {
      setActionLoading(false);
    }
  };

  if (error || success) {
    setTimeout(() => { setError(null); setSuccess(null); }, 3000);
  }

  const handleViewDetail = async (match: Match) => {
    setLoadingDetail(true);
    try {
      const fullMatch = await getMatch(match._id);
      setSelectedMatch(fullMatch);
      try {
        const availResult = await getMatchAvailability(match._id);
        setAvailabilities(availResult.data || []);
      } catch (e) {
        setAvailabilities([]);
      }
    } catch (err) {
      console.error('Error fetching match detail:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleUpdateAvailStatus = async (newStatus: 'yes' | 'no' | 'tentative') => {
    if (!editingAvailabilityPlayer) return;
    setActionLoading(true);
    try {
      await updateAvailability(editingAvailabilityPlayer.id, { response: newStatus });
      setSuccess('Status updated');
      setEditingAvailabilityPlayer(null);
      if (selectedMatch) {
        const availResult = await getMatchAvailability(selectedMatch._id);
        setAvailabilities(availResult.data || []);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAvail = async (availId: string, playerName: string) => {
    if (!window.confirm(`Remove ${playerName}?`)) return;
    setActionLoading(true);
    try {
      await deleteAvailability(availId);
      setSuccess('Player removed');
      if (selectedMatch) {
        const availResult = await getMatchAvailability(selectedMatch._id);
        setAvailabilities(availResult.data || []);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to remove');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenAddPlayer = async () => {
    try {
      const players = await getPlayers();
      const existingIds = new Set(availabilities.map((a: any) => a.playerId));
      setAllPlayers(players.filter((p: any) => !existingIds.has(p._id)));
      setSelectedPlayersToAdd([]);
      setShowAddPlayer(true);
    } catch (err) {
      setError('Failed to load players');
    }
  };

  const handleAddPlayers = async () => {
    if (selectedPlayersToAdd.length === 0 || !selectedMatch) return;
    setActionLoading(true);
    try {
      await createAvailability(selectedMatch._id, selectedPlayersToAdd);
      setSuccess(`Added ${selectedPlayersToAdd.length} player(s)`);
      setShowAddPlayer(false);
      const availResult = await getMatchAvailability(selectedMatch._id);
      setAvailabilities(availResult.data || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add players');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    return `${h > 12 ? h - 12 : h}:${minutes} ${h >= 12 ? 'PM' : 'AM'}`;
  };

  const isUpcoming = (dateString: string) => {
    return new Date(dateString) >= new Date(new Date().setHours(0, 0, 0, 0));
  };

  const filteredMatches = matches.filter(match => {
    if (filter === 'upcoming') return isUpcoming(match.date);
    if (filter === 'completed') return !isUpcoming(match.date);
    return true;
  });

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'confirmed': return { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' };
      case 'cancelled': return { bg: 'bg-rose-500/20', text: 'text-rose-400', border: 'border-rose-500/30' };
      case 'completed': return { bg: 'bg-violet-500/20', text: 'text-violet-400', border: 'border-violet-500/30' };
      default: return { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' };
    }
  };

  // Calculate stats
  const stats = {
    total: matches.length,
    upcoming: matches.filter(m => isUpcoming(m.date)).length,
    completed: matches.filter(m => !isUpcoming(m.date)).length
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="relative">
          <div className="w-10 h-10 border-2 border-emerald-500/30 rounded-full" />
          <div className="absolute inset-0 w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-sm text-slate-400">Loading matches...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-[60vh]">
      {/* Neural Network Background */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none opacity-40"
        style={{ zIndex: 0 }}
      />

      <div className="relative z-10">
        {/* Toast Messages */}
        {(error || success) && (
          <div className={`fixed top-16 left-4 right-4 z-[60] p-3 rounded-xl ${error ? 'bg-rose-500/90' : 'bg-emerald-500/90'} text-white text-sm shadow-lg`}>
            {error || success}
          </div>
        )}

        {/* Header with Stats */}
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-violet-500 rounded-full flex items-center justify-center border-2 border-slate-900">
                <Sparkles className="w-2 h-2 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Match Center
                <span className="px-1.5 py-0.5 bg-violet-500/20 border border-violet-500/30 rounded text-[9px] text-violet-400 font-medium">
                  AI
                </span>
              </h2>
              <p className="text-[10px] text-slate-500">{stats.total} matches • {stats.upcoming} upcoming</p>
            </div>
          </div>

          {/* Filter & Actions */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
              {(['upcoming', 'completed', 'all'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all whitespace-nowrap ${
                    filter === f
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-800/50 text-slate-400 border border-transparent'
                  }`}
                >
                  {f === 'upcoming' && <Zap className="w-3 h-3" />}
                  {f === 'completed' && <Target className="w-3 h-3" />}
                  {f === 'all' && <Calendar className="w-3 h-3" />}
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
            <div className="flex gap-1.5">
              {!isViewer() && (
                <button
                  onClick={handleCreateMatch}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-[10px] font-medium shadow-lg shadow-emerald-500/20"
                >
                  <Plus className="w-3 h-3" />
                </button>
              )}
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-400 text-[10px] font-medium disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Match List */}
        <div className="space-y-2">
          {filteredMatches.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="relative">
                <div className="w-14 h-14 bg-slate-800/50 rounded-xl flex items-center justify-center">
                  <Calendar className="w-7 h-7 text-slate-600" />
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-violet-500/20 rounded-full flex items-center justify-center">
                  <Sparkles className="w-2.5 h-2.5 text-violet-400" />
                </div>
              </div>
              <p className="text-sm text-slate-400">No {filter} matches</p>
            </div>
          ) : (
            filteredMatches.map((match) => {
              const statusConfig = getStatusConfig(match.status);
              return (
                <div
                  key={match._id}
                  className="bg-slate-800/40 backdrop-blur-sm rounded-xl border border-white/5 overflow-hidden active:bg-slate-800/60 transition-all"
                  onClick={() => handleViewDetail(match)}
                >
                  {/* Top Color Bar */}
                  <div className={`h-0.5 w-full ${
                    match.status === 'confirmed' ? 'bg-gradient-to-r from-emerald-500 to-cyan-500' :
                    match.status === 'completed' ? 'bg-gradient-to-r from-violet-500 to-purple-500' :
                    'bg-gradient-to-r from-amber-500 to-orange-500'
                  }`} />
                  
                  <div className="p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-semibold text-white text-sm truncate">vs {match.opponent}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${statusConfig.bg} ${statusConfig.text} border ${statusConfig.border}`}>
                            {match.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(match.date)}
                          </span>
                          {match.time && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatTime(match.time)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetail(match);
                          }}
                          className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                        <ChevronRight className="w-4 h-4 text-slate-600" />
                      </div>
                    </div>
                    
                    {/* Squad Stats */}
                    {match.squadStats && (
                      <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          <span className="text-[10px] text-emerald-400 font-medium">{match.squadStats.yes || 0}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                          <span className="text-[10px] text-rose-400 font-medium">{match.squadStats.no || 0}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          <span className="text-[10px] text-amber-400 font-medium">{match.squadStats.tentative || 0}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                          <span className="text-[10px] text-slate-400 font-medium">{match.squadStats.pending || 0}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Detail Modal */}
        {selectedMatch && (
          <div className="fixed inset-x-0 top-[52px] bottom-0 z-50 bg-black/70 backdrop-blur-sm" onClick={() => setSelectedMatch(null)}>
            <div
              className="absolute bottom-0 left-0 right-0 bg-slate-900 rounded-t-3xl max-h-[calc(100vh-52px)] overflow-y-auto animate-slide-up border-t border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-slate-900/95 backdrop-blur-xl pt-3 pb-2 px-4 border-b border-white/5">
                <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mb-3" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-lg flex items-center justify-center">
                      <Trophy className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-white">vs {selectedMatch.opponent}</h3>
                  </div>
                  <button onClick={() => setSelectedMatch(null)} className="p-2 text-slate-400 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-4 space-y-4">
                {/* Match Info */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-800/50 rounded-xl p-3 border border-white/5">
                    <p className="text-[10px] text-slate-500 mb-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Date & Time
                    </p>
                    <p className="text-sm text-white">{formatDate(selectedMatch.date)}</p>
                    {selectedMatch.time && <p className="text-[10px] text-slate-400">{formatTime(selectedMatch.time)}</p>}
                  </div>
                  <div className="bg-slate-800/50 rounded-xl p-3 border border-white/5">
                    <p className="text-[10px] text-slate-500 mb-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> Ground
                    </p>
                    <p className="text-sm text-white truncate">{selectedMatch.ground || 'TBD'}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                {!isViewer() && (
                  <div className="flex gap-2">
                    <button
                      onClick={handleEditMatch}
                      className="flex-1 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white text-xs font-medium flex items-center justify-center gap-1.5"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      onClick={handleDeleteMatch}
                      disabled={actionLoading}
                      className="py-2.5 px-4 bg-rose-500/20 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-medium flex items-center justify-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Availability List */}
                <div className="bg-slate-800/30 rounded-xl border border-white/5 overflow-hidden">
                  <div className="flex items-center justify-between p-3 border-b border-white/5">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs text-slate-300 font-medium">Availability ({availabilities.length})</span>
                    </div>
                    {!isViewer() && (
                      <button
                        onClick={handleOpenAddPlayer}
                        className="flex items-center gap-1 px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg text-[10px] font-medium border border-emerald-500/30"
                      >
                        <UserPlus className="w-3 h-3" /> Add
                      </button>
                    )}
                  </div>
                  
                  {availabilities.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-6 text-slate-500">
                      <Users className="w-8 h-8 mb-2 opacity-50" />
                      <p className="text-xs">No availability tracking</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-white/5">
                      {availabilities.map((avail: any) => (
                        <div 
                          key={avail._id} 
                          className="flex items-center justify-between p-3 active:bg-slate-700/30 transition-colors"
                          onClick={() => !isViewer() && setEditingAvailabilityPlayer({ id: avail._id, name: avail.playerName, response: avail.response as 'yes' | 'no' | 'tentative' | 'pending' })}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${
                              avail.response === 'yes' ? 'bg-emerald-400' :
                              avail.response === 'no' ? 'bg-rose-400' :
                              avail.response === 'tentative' ? 'bg-amber-400' : 'bg-slate-400'
                            }`} />
                            <span className="text-sm text-white">{avail.playerName}</span>
                          </div>
                          {!isViewer() ? (
                            <div className="flex gap-1">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteAvail(avail._id, avail.playerName);
                                }} 
                                className="p-1.5 bg-rose-500/20 text-rose-400 rounded"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Feedback Section */}
                <div className="bg-slate-800/30 rounded-xl border border-white/5 overflow-hidden">
                  <button
                    onClick={() => setShowFeedbackSection(!showFeedbackSection)}
                    className="w-full flex items-center justify-between p-3"
                  >
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs text-slate-300 font-medium">Match Feedback</span>
                    </div>
                    {showFeedbackSection ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                  {showFeedbackSection && (
                    <div className="border-t border-white/5">
                      <MatchFeedbackDashboard matchId={selectedMatch._id} matchOpponent={selectedMatch.opponent} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {loadingDetail && (
          <div className="fixed inset-x-0 top-[52px] bottom-0 z-50 bg-black/60 flex items-center justify-center">
            <div className="relative">
              <div className="w-10 h-10 border-2 border-emerald-500/30 rounded-full" />
              <div className="absolute inset-0 w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
          </div>
        )}

        {/* Create/Edit Form Modal */}
        {showForm && (
          <div className="fixed inset-x-0 top-[52px] bottom-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={resetForm}>
            <div className="bg-slate-900 border border-white/10 rounded-2xl p-4 w-full max-w-sm max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-white font-semibold">
                  {editMode ? 'Edit Match' : 'Create Match'}
                </h3>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] text-slate-500 mb-1 block uppercase tracking-wider">Opponent *</label>
                  <input
                    type="text"
                    value={formData.opponent}
                    onChange={(e) => setFormData({...formData, opponent: e.target.value})}
                    className="w-full px-3 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500/50"
                    placeholder="Team name"
                  />
                </div>
                
                <div>
                  <label className="text-[10px] text-slate-500 mb-1 block uppercase tracking-wider">Date *</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="w-full px-3 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 mb-1 block uppercase tracking-wider">Time</label>
                    <input
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData({...formData, time: e.target.value})}
                      className="w-full px-3 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 mb-1 block uppercase tracking-wider">Slot</label>
                    <select
                      value={formData.slot}
                      onChange={(e) => setFormData({...formData, slot: e.target.value})}
                      className="w-full px-3 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500/50"
                    >
                      <option value="morning">🌅 Morning</option>
                      <option value="evening">🌆 Evening</option>
                      <option value="night">🌙 Night</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="text-[10px] text-slate-500 mb-1 block uppercase tracking-wider">Ground</label>
                  <input
                    type="text"
                    value={formData.ground}
                    onChange={(e) => setFormData({...formData, ground: e.target.value})}
                    className="w-full px-3 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500/50"
                    placeholder="Ground name"
                  />
                </div>
                
                <div>
                  <label className="text-[10px] text-slate-500 mb-1 block uppercase tracking-wider">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="w-full px-3 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white text-sm resize-none focus:outline-none focus:border-emerald-500/50"
                    rows={2}
                    placeholder="Optional notes"
                  />
                </div>
                
                <button
                  onClick={handleSubmitForm}
                  disabled={actionLoading || !formData.opponent || !formData.date}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl text-white font-medium text-sm disabled:opacity-50 shadow-lg shadow-emerald-500/20"
                >
                  {actionLoading ? 'Saving...' : (editMode ? 'Update Match' : 'Create Match')}
                </button>
                
                <button
                  onClick={resetForm}
                  className="w-full py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-slate-300 font-medium text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Player Modal */}
        {showAddPlayer && (
          <div className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowAddPlayer(false)}>
            <div className="bg-slate-900 border border-white/10 rounded-2xl p-4 w-full max-w-sm max-h-[70vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-white font-semibold text-sm">Add Players</h3>
                </div>
                <button onClick={() => setShowAddPlayer(false)} className="text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {allPlayers.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-sm">
                  All players already added
                </div>
              ) : (
                <>
                  <p className="text-[10px] text-slate-500 mb-2">{selectedPlayersToAdd.length} selected</p>
                  <div className="flex-1 overflow-y-auto space-y-1 mb-3">
                    {allPlayers.map((player: any) => {
                      const isSelected = selectedPlayersToAdd.includes(player._id);
                      return (
                        <div
                          key={player._id}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedPlayersToAdd(prev => prev.filter(id => id !== player._id));
                            } else {
                              setSelectedPlayersToAdd(prev => [...prev, player._id]);
                            }
                          }}
                          className={`p-3 rounded-xl cursor-pointer transition-all ${isSelected ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-slate-800/50 border border-transparent'}`}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600'}`}>
                              {isSelected && <CheckCircle className="w-3 h-3 text-white" />}
                            </div>
                            <div>
                              <p className="text-white text-sm">{player.name}</p>
                              <p className="text-[10px] text-slate-500">{player.phone}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <button
                    onClick={handleAddPlayers}
                    disabled={selectedPlayersToAdd.length === 0 || actionLoading}
                    className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl text-white text-sm font-medium disabled:opacity-50 shadow-lg shadow-emerald-500/20"
                  >
                    {actionLoading ? 'Adding...' : `Add (${selectedPlayersToAdd.length})`}
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        <AvailabilityEditModal
          isOpen={editingAvailabilityPlayer !== null}
          playerName={editingAvailabilityPlayer?.name || ''}
          currentResponse={editingAvailabilityPlayer?.response || 'pending'}
          onClose={() => setEditingAvailabilityPlayer(null)}
          onUpdate={handleUpdateAvailStatus}
          isLoading={actionLoading}
        />
      </div>

      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
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

export default MobileMatchesTab;
