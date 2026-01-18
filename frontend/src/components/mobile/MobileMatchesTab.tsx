import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getMatches, getMatch, createMatch, updateMatch, deleteMatch, getMatchAvailability, updateAvailability, deleteAvailability, createAvailability, getPlayers } from '../../services/api';
import { Calendar, Clock, ChevronRight, X, RefreshCw, CheckCircle, XCircle, HelpCircle, Clock as ClockIcon, Plus, Edit2, Trash2, MapPin, Trophy, UserPlus, Users } from 'lucide-react';
import { matchEvents } from '../../utils/matchEvents';

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
  const { isViewer } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed'>('upcoming');
  
  // Form states
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
  
  // Availability management state
  const [availabilities, setAvailabilities] = useState<any[]>([]);
  const [editingAvailId, setEditingAvailId] = useState<string | null>(null);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [allPlayers, setAllPlayers] = useState<any[]>([]);
  const [selectedPlayersToAdd, setSelectedPlayersToAdd] = useState<string[]>([]);

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
      // Notify other components about match change
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
      // Notify other components about match change
      matchEvents.emit();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete match');
    } finally {
      setActionLoading(false);
    }
  };

  // Clear messages after delay
  if (error || success) {
    setTimeout(() => { setError(null); setSuccess(null); }, 3000);
  }

  const handleViewDetail = async (match: Match) => {
    setLoadingDetail(true);
    try {
      const fullMatch = await getMatch(match._id);
      setSelectedMatch(fullMatch);
      // Also load availability records
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

  // Availability management handlers
  const handleUpdateAvailStatus = async (availId: string, newStatus: 'yes' | 'no' | 'tentative') => {
    setActionLoading(true);
    try {
      await updateAvailability(availId, { response: newStatus });
      setSuccess('Status updated');
      setEditingAvailId(null);
      // Refresh availability
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-emerald-500/20 text-emerald-400';
      case 'cancelled': return 'bg-red-500/20 text-red-400';
      case 'completed': return 'bg-blue-500/20 text-blue-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <>
      {/* Toast Messages */}
      {(error || success) && (
        <div className={`fixed top-16 left-4 right-4 z-[60] p-3 rounded-xl ${error ? 'bg-red-500/90' : 'bg-emerald-500/90'} text-white text-sm`}>
          {error || success}
        </div>
      )}

      {/* Header with Create & Refresh */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex gap-2">
          {(['upcoming', 'completed', 'all'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                filter === f
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-800/50 text-slate-400'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {!isViewer() && (
            <button
              onClick={handleCreateMatch}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-medium"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-medium disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Match List */}
      <div className="space-y-2">
        {filteredMatches.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No {filter} matches</p>
          </div>
        ) : (
          filteredMatches.map((match) => (
            <div
              key={match._id}
              className="bg-slate-800/50 rounded-xl p-3 border border-white/5 active:bg-slate-800/70 transition-colors"
              onClick={() => handleViewDetail(match)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-white text-sm">vs {match.opponent}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${getStatusColor(match.status)}`}>
                      {match.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
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
                  {match.squadStats && (
                    <div className="flex items-center gap-3 mt-2 text-xs">
                      <span className="flex items-center gap-1 text-emerald-400">
                        <CheckCircle className="w-3 h-3" />{match.squadStats.yes || 0}
                      </span>
                      <span className="flex items-center gap-1 text-red-400">
                        <XCircle className="w-3 h-3" />{match.squadStats.no || 0}
                      </span>
                      <span className="flex items-center gap-1 text-amber-400">
                        <HelpCircle className="w-3 h-3" />{match.squadStats.tentative || 0}
                      </span>
                      <span className="flex items-center gap-1 text-slate-500">
                        <ClockIcon className="w-3 h-3" />{match.squadStats.pending || 0}
                      </span>
                    </div>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detail Modal */}
      {selectedMatch && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedMatch(null)}>
          <div
            className="absolute bottom-0 left-0 right-0 bg-slate-900 rounded-t-3xl max-h-[85vh] overflow-y-auto animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-slate-900 pt-3 pb-2 px-4 border-b border-white/5">
              <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mb-3" />
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">vs {selectedMatch.opponent}</h3>
                <button onClick={() => setSelectedMatch(null)} className="p-2 text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 space-y-4">
              {/* Match Info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-800/50 rounded-xl p-3">
                  <p className="text-xs text-slate-400 mb-1">Date & Time</p>
                  <p className="text-sm text-white">{formatDate(selectedMatch.date)}</p>
                  {selectedMatch.time && <p className="text-xs text-slate-400">{formatTime(selectedMatch.time)}</p>}
                </div>
                <div className="bg-slate-800/50 rounded-xl p-3">
                  <p className="text-xs text-slate-400 mb-1">Ground</p>
                  <p className="text-sm text-white truncate">{selectedMatch.ground || 'TBD'}</p>
                </div>
              </div>

              {/* Action Buttons - only visible to non-viewers */}
              {!isViewer() && (
                <div className="flex gap-2">
                  <button
                    onClick={handleEditMatch}
                    className="flex-1 py-2 bg-slate-700 rounded-lg text-white text-xs font-medium flex items-center justify-center gap-1"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={handleDeleteMatch}
                    disabled={actionLoading}
                    className="py-2 px-4 bg-red-500/20 rounded-lg text-red-400 text-xs font-medium flex items-center justify-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              )}

              {/* Availability List with CRUD */}
              <div className="bg-slate-800/50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-slate-400">Availability ({availabilities.length})</p>
                  {!isViewer() && (
                    <button
                      onClick={handleOpenAddPlayer}
                      className="flex items-center gap-1 px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg text-xs"
                    >
                      <UserPlus className="w-3 h-3" /> Add
                    </button>
                  )}
                </div>
                {availabilities.length === 0 ? (
                  <div className="text-center py-4 text-slate-500 text-sm">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No availability tracking yet
                  </div>
                ) : (
                  <div className="space-y-2">
                    {availabilities.map((avail: any) => (
                      <div key={avail._id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                        <div className="flex-1">
                          <span className="text-sm text-white">{avail.playerName}</span>
                          <span className={`ml-2 text-xs ${
                            avail.response === 'yes' ? 'text-emerald-400' :
                            avail.response === 'no' ? 'text-red-400' :
                            avail.response === 'tentative' ? 'text-amber-400' : 'text-slate-500'
                          }`}>
                            {avail.response === 'yes' ? '✓' : avail.response === 'no' ? '✗' : avail.response === 'tentative' ? '?' : '⏳'}
                          </span>
                        </div>
                        {!isViewer() && editingAvailId === avail._id ? (
                          <div className="flex gap-1">
                            <button onClick={() => handleUpdateAvailStatus(avail._id, 'yes')} className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded">Y</button>
                            <button onClick={() => handleUpdateAvailStatus(avail._id, 'tentative')} className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs rounded">?</button>
                            <button onClick={() => handleUpdateAvailStatus(avail._id, 'no')} className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded">N</button>
                            <button onClick={() => setEditingAvailId(null)} className="px-2 py-1 bg-slate-600 text-white text-xs rounded">✕</button>
                          </div>
                        ) : !isViewer() ? (
                          <div className="flex gap-1">
                            <button onClick={() => setEditingAvailId(avail._id)} className="p-1.5 bg-slate-700 text-white rounded">
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button onClick={() => handleDeleteAvail(avail._id, avail.playerName)} className="p-1.5 bg-red-500/20 text-red-400 rounded">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {loadingDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
          <div className="spinner"></div>
        </div>
      )}

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-4" onClick={resetForm}>
          <div className="bg-slate-800 rounded-2xl p-4 w-full max-w-sm max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-emerald-400" /> 
              {editMode ? 'Edit Match' : 'Create Match'}
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Opponent *</label>
                <input
                  type="text"
                  value={formData.opponent}
                  onChange={(e) => setFormData({...formData, opponent: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-700 rounded-lg text-white text-sm"
                  placeholder="Team name"
                />
              </div>
              
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Date *</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-700 rounded-lg text-white text-sm"
                />
              </div>
              
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Time</label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({...formData, time: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-700 rounded-lg text-white text-sm"
                />
              </div>
              
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Slot</label>
                <select
                  value={formData.slot}
                  onChange={(e) => setFormData({...formData, slot: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-700 rounded-lg text-white text-sm"
                >
                  <option value="morning">Morning</option>
                  <option value="evening">Evening</option>
                  <option value="night">Night</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Ground</label>
                <input
                  type="text"
                  value={formData.ground}
                  onChange={(e) => setFormData({...formData, ground: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-700 rounded-lg text-white text-sm"
                  placeholder="Ground name"
                />
              </div>
              
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-700 rounded-lg text-white text-sm resize-none"
                  rows={2}
                  placeholder="Optional notes"
                />
              </div>
              
              <button
                onClick={handleSubmitForm}
                disabled={actionLoading || !formData.opponent || !formData.date}
                className="w-full py-2.5 bg-emerald-500 rounded-lg text-white font-medium disabled:opacity-50"
              >
                {actionLoading ? 'Saving...' : (editMode ? 'Update Match' : 'Create Match')}
              </button>
              
              <button
                onClick={resetForm}
                className="w-full py-2.5 bg-slate-700 rounded-lg text-slate-300 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Player Modal */}
      {showAddPlayer && (
        <div className="fixed inset-0 z-[70] bg-black/70 flex items-center justify-center p-4" onClick={() => setShowAddPlayer(false)}>
          <div className="bg-slate-800 rounded-2xl p-4 w-full max-w-sm max-h-[70vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-emerald-400" /> Add Players
              </h3>
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
                <p className="text-xs text-slate-400 mb-2">{selectedPlayersToAdd.length} selected</p>
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
                        className={`p-3 rounded-lg cursor-pointer ${isSelected ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-slate-700/50'}`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'bg-emerald-500 border-emerald-500' : 'border-slate-500'}`}>
                            {isSelected && <CheckCircle className="w-3 h-3 text-white" />}
                          </div>
                          <div>
                            <p className="text-white text-sm">{player.name}</p>
                            <p className="text-xs text-slate-400">{player.phone}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <button
                  onClick={handleAddPlayers}
                  disabled={selectedPlayersToAdd.length === 0 || actionLoading}
                  className="w-full py-2 bg-emerald-500 rounded-lg text-white text-sm font-medium disabled:opacity-50"
                >
                  {actionLoading ? 'Adding...' : `Add (${selectedPlayersToAdd.length})`}
                </button>
              </>
            )}
          </div>
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

export default MobileMatchesTab;
