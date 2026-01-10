import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, Users, Send, Edit, Trash2, Download, RefreshCw, Search, Filter, Copy, CheckCircle, XCircle, AlertCircle, Circle, Bell } from 'lucide-react';
import { getMatchAvailability, sendReminder } from '../services/api';
import { matchApi } from '../services/matchApi';

interface Match {
  _id: string;
  matchId: string;
  cricHeroesMatchId: string;
  date: string;
  time: string;
  slot: string;
  opponent: string;
  ground: string;
  status: 'draft' | 'confirmed' | 'cancelled' | 'completed';
  squad: Array<{
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

interface AvailabilityRecord {
  _id: string;
  matchId: string;
  playerId: string;
  playerName: string;
  playerPhone: string;
  response: 'yes' | 'no' | 'tentative' | 'pending';
  respondedAt?: Date;
  messageContent?: string;
  outgoingMessageId?: string;
  incomingMessageId?: string;
  status: 'sent' | 'delivered' | 'read' | 'responded' | 'no_response';
  createdAt: Date;
  updatedAt: Date;
}

interface MatchDetailModalProps {
  match: Match;
  onClose: () => void;
  onEdit?: (match: Match) => void;
  onDelete?: (matchId: string) => void;
  onSendAvailability?: (match: Match) => void;
}

const MatchDetailModal: React.FC<MatchDetailModalProps> = ({
  match: initialMatch,
  onClose,
  onEdit,
  onDelete,
  onSendAvailability
}) => {
  const [match, setMatch] = useState<Match>(initialMatch);
  const [availabilities, setAvailabilities] = useState<AvailabilityRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'responded' | 'pending' | 'yes' | 'no' | 'tentative'>('all');
  const [activeTab, setActiveTab] = useState<'overview' | 'responses' | 'squad'>('overview');
  const [sendingReminder, setSendingReminder] = useState(false);

  const loadMatchAndAvailability = React.useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch fresh match data to get updated statistics
      const updatedMatch = await matchApi.getMatch(match._id);
      setMatch(updatedMatch);
      
      // Fetch availability records if availability was sent
      if (updatedMatch.availabilitySent) {
        const response = await getMatchAvailability(match._id);
        setAvailabilities(response.data || []);
      }
    } catch (err) {
      console.error('Failed to load match data:', err);
    } finally {
      setLoading(false);
    }
  }, [match._id]);

  useEffect(() => {
    loadMatchAndAvailability();
    
    // Auto-refresh every 10 seconds
    const interval = setInterval(loadMatchAndAvailability, 10000);
    return () => clearInterval(interval);
  }, [loadMatchAndAvailability]);

  const matchDate = new Date(match.date);
  const isUpcoming = matchDate > new Date();

  const getStatusColor = () => {
    switch (match.status) {
      case 'confirmed': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'draft': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'cancelled': return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      case 'completed': return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getResponseIcon = (response: string) => {
    switch (response) {
      case 'yes': return <CheckCircle className="w-5 h-5 text-emerald-400" />;
      case 'no': return <XCircle className="w-5 h-5 text-rose-400" />;
      case 'tentative': return <AlertCircle className="w-5 h-5 text-amber-400" />;
      default: return <Circle className="w-5 h-5 text-slate-400" />;
    }
  };

  const getResponseBadge = (response: string) => {
    switch (response) {
      case 'yes': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'no': return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      case 'tentative': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const filteredAvailabilities = availabilities.filter(avail => {
    const matchesSearch = avail.playerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         avail.playerPhone.includes(searchTerm);
    
    let matchesFilter = true;
    if (filterStatus === 'responded') {
      matchesFilter = avail.response !== 'pending';
    } else if (filterStatus === 'pending') {
      matchesFilter = avail.response === 'pending';
    } else if (filterStatus !== 'all') {
      matchesFilter = avail.response === filterStatus;
    }
    
    return matchesSearch && matchesFilter;
  });

  const availableSquad = availabilities.filter(a => a.response === 'yes');
  const tentativeSquad = availabilities.filter(a => a.response === 'tentative');
  const unavailableSquad = availabilities.filter(a => a.response === 'no');

  const stats = {
    total: match.totalPlayersRequested || 0,
    confirmed: match.confirmedPlayers || 0,
    declined: match.declinedPlayers || 0,
    tentative: match.tentativePlayers || 0,
    pending: match.noResponsePlayers || 0,
    responded: (match.confirmedPlayers || 0) + (match.declinedPlayers || 0) + (match.tentativePlayers || 0),
    responseRate: match.totalPlayersRequested ? Math.round((((match.confirmedPlayers || 0) + (match.declinedPlayers || 0) + (match.tentativePlayers || 0)) / match.totalPlayersRequested) * 100) : 0
  };

  const handleSendReminder = async () => {
    try {
      setSendingReminder(true);
      const response = await sendReminder(match._id);
      alert(response.message || 'Reminders sent successfully!');
      loadMatchAndAvailability(); // Refresh data
    } catch (err: any) {
      console.error('Failed to send reminders:', err);
      alert(err.response?.data?.error || 'Failed to send reminders');
    } finally {
      setSendingReminder(false);
    }
  };

  const copySquadList = () => {
    const squadText = `
Match: ${match.opponent || 'Practice Match'} @ ${match.ground}
Date: ${matchDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}

AVAILABLE (${availableSquad.length}):
${availableSquad.map((p, i) => `${i + 1}. ${p.playerName} - ${p.playerPhone}`).join('\n')}

TENTATIVE (${tentativeSquad.length}):
${tentativeSquad.map((p, i) => `${i + 1}. ${p.playerName} - ${p.playerPhone}`).join('\n')}

NOT AVAILABLE (${unavailableSquad.length}):
${unavailableSquad.map((p, i) => `${i + 1}. ${p.playerName} - ${p.playerPhone}`).join('\n')}
    `.trim();
    
    navigator.clipboard.writeText(squadText);
    alert('Squad list copied to clipboard!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/10">
        
        {/* Header */}
        <div className="bg-slate-900/95 backdrop-blur-xl border-b border-white/10 p-4 md:p-6">
          <div className="flex items-start justify-between mb-2 md:mb-4">
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                <h2 className="text-xl md:text-2xl font-black text-white">{match.matchId}</h2>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-2 py-0.5 md:px-3 md:py-1 rounded-full text-xs font-bold border ${getStatusColor()}`}>
                    {match.status.charAt(0).toUpperCase() + match.status.slice(1)}
                  </span>
                  {match.availabilitySent && (
                    <span className="px-2 py-0.5 md:px-3 md:py-1 bg-blue-500/20 text-blue-400 text-xs font-bold rounded-full border border-blue-500/30">
                      📤 Sent
                    </span>
                  )}
                </div>
              </div>
              <p className="text-lg md:text-xl text-slate-300 font-semibold">vs {match.opponent || 'TBD'}</p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg"
            >
              <X className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          </div>

          {/* Quick Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4 mb-2 md:mb-4">
            <div className="flex items-center gap-2 text-slate-300">
              <Calendar className="w-4 h-4 md:w-5 md:h-5 text-emerald-400" />
              <span className="text-xs md:text-sm">
                {matchDate.toLocaleDateString('en-US', { 
                  weekday: 'short', 
                  month: 'short', 
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Clock className="w-4 h-4 md:w-5 md:h-5 text-amber-400" />
              <span className="text-xs md:text-sm">{match.time || match.slot}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <MapPin className="w-4 h-4 md:w-5 md:h-5 text-rose-400" />
              <span className="text-xs md:text-sm truncate">{match.ground}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-1 md:gap-2">
            {onEdit && (
              <button
                onClick={() => onEdit(match)}
                className="px-2 py-1.5 md:px-4 md:py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs md:text-sm font-medium rounded-lg transition-all flex items-center gap-1 md:gap-2"
              >
                <Edit className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden sm:inline">Edit Match</span>
                <span className="sm:hidden">Edit</span>
              </button>
            )}
            {onSendAvailability && isUpcoming && !match.availabilitySent && (
              <button
                onClick={() => onSendAvailability(match)}
                className="px-2 py-1.5 md:px-4 md:py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs md:text-sm font-medium rounded-lg transition-all flex items-center gap-1 md:gap-2 border border-emerald-500/30"
              >
                <Send className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden sm:inline">Send Availability</span>
                <span className="sm:hidden">Send</span>
              </button>
            )}
            {match.availabilitySent && stats.pending > 0 && (
              <button
                onClick={handleSendReminder}
                disabled={sendingReminder}
                className="px-2 py-1.5 md:px-4 md:py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-xs md:text-sm font-medium rounded-lg transition-all flex items-center gap-1 md:gap-2 border border-amber-500/30 disabled:opacity-50"
              >
                <Bell className={`w-3 h-3 md:w-4 md:h-4 ${sendingReminder ? 'animate-pulse' : ''}`} />
                <span className="hidden sm:inline">Reminder ({stats.pending})</span>
                <span className="sm:hidden">Rmd ({stats.pending})</span>
              </button>
            )}
            <button
              onClick={loadMatchAndAvailability}
              disabled={loading}
              className="px-2 py-1.5 md:px-4 md:py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-xs md:text-sm font-medium rounded-lg transition-all flex items-center gap-1 md:gap-2 border border-blue-500/30 disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 md:w-4 md:h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
              <span className="sm:hidden">↻</span>
            </button>
            {availabilities.length > 0 && (
              <button
                onClick={copySquadList}
                className="px-2 py-1.5 md:px-4 md:py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 text-xs md:text-sm font-medium rounded-lg transition-all flex items-center gap-1 md:gap-2 border border-purple-500/30"
              >
                <Copy className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden sm:inline">Copy Squad</span>
                <span className="sm:hidden">Copy</span>
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 md:gap-2 mt-2 md:mt-4 border-b border-white/10">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-2 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-medium transition-all ${
                activeTab === 'overview'
                  ? 'text-emerald-400 border-b-2 border-emerald-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('responses')}
              className={`px-2 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-medium transition-all ${
                activeTab === 'responses'
                  ? 'text-emerald-400 border-b-2 border-emerald-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="hidden sm:inline">Player Responses</span>
              <span className="sm:hidden">Responses</span> ({availabilities.length})
            </button>
            <button
              onClick={() => setActiveTab('squad')}
              className={`px-2 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-medium transition-all ${
                activeTab === 'squad'
                  ? 'text-emerald-400 border-b-2 border-emerald-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="hidden sm:inline">Squad Builder</span>
              <span className="sm:hidden">Squad</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6">
          
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              
              {/* Availability Summary */}
              {match.availabilitySent && (
                <div>
                  <h3 className="text-lg font-bold text-white mb-4">Availability Summary</h3>
                  
                  {/* Stats Cards - Mobile Optimized */}
                  {/* Desktop: Show 5 separate cards */}
                  <div className="hidden md:grid md:grid-cols-5 md:gap-4 mb-6">
                    <div className="bg-slate-800/50 border border-white/10 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-slate-400 font-medium">Total Sent</p>
                          <p className="text-2xl font-black text-white">{stats.total}</p>
                        </div>
                        <Send className="w-8 h-8 text-blue-400" />
                      </div>
                    </div>
                    
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-emerald-400 font-medium">Confirmed</p>
                          <p className="text-2xl font-black text-emerald-400">{stats.confirmed}</p>
                        </div>
                        <CheckCircle className="w-8 h-8 text-emerald-400" />
                      </div>
                    </div>
                    
                    <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-rose-400 font-medium">Declined</p>
                          <p className="text-2xl font-black text-rose-400">{stats.declined}</p>
                        </div>
                        <XCircle className="w-8 h-8 text-rose-400" />
                      </div>
                    </div>
                    
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-amber-400 font-medium">Tentative</p>
                          <p className="text-2xl font-black text-amber-400">{stats.tentative}</p>
                        </div>
                        <AlertCircle className="w-8 h-8 text-amber-400" />
                      </div>
                    </div>
                    
                    <div className="bg-slate-500/10 border border-slate-500/30 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-slate-400 font-medium">No Response</p>
                          <p className="text-2xl font-black text-slate-400">{stats.pending}</p>
                        </div>
                        <Circle className="w-8 h-8 text-slate-400" />
                      </div>
                    </div>
                  </div>

                  {/* Mobile: Single compact summary card */}
                  <div className="md:hidden bg-slate-800/50 border border-white/10 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-xs text-slate-400 font-medium">Response Summary</p>
                        <p className="text-lg font-black text-white">{stats.responded}/{stats.total} ({stats.responseRate}%)</p>
                      </div>
                      <Send className="w-6 h-6 text-blue-400" />
                    </div>
                    
                    {/* Compact response bars */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                        <span className="text-xs text-emerald-400 font-medium min-w-[70px]">Yes {stats.confirmed}</span>
                        <div className="flex-1 bg-slate-700/50 rounded-full h-2 overflow-hidden">
                          <div className="h-full bg-emerald-400 rounded-full transition-all duration-500" style={{ width: `${stats.total > 0 ? (stats.confirmed / stats.total) * 100 : 0}%` }}></div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                        <span className="text-xs text-amber-400 font-medium min-w-[70px]">Tentative {stats.tentative}</span>
                        <div className="flex-1 bg-slate-700/50 rounded-full h-2 overflow-hidden">
                          <div className="h-full bg-amber-400 rounded-full transition-all duration-500" style={{ width: `${stats.total > 0 ? (stats.tentative / stats.total) * 100 : 0}%` }}></div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-rose-400"></div>
                        <span className="text-xs text-rose-400 font-medium min-w-[70px]">No {stats.declined}</span>
                        <div className="flex-1 bg-slate-700/50 rounded-full h-2 overflow-hidden">
                          <div className="h-full bg-rose-400 rounded-full transition-all duration-500" style={{ width: `${stats.total > 0 ? (stats.declined / stats.total) * 100 : 0}%` }}></div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                        <span className="text-xs text-slate-400 font-medium min-w-[70px]">No Response {stats.pending}</span>
                        <div className="flex-1 bg-slate-700/50 rounded-full h-2 overflow-hidden">
                          <div className="h-full bg-slate-400 rounded-full transition-all duration-500" style={{ width: `${stats.total > 0 ? (stats.pending / stats.total) * 100 : 0}%` }}></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Response Rate - Desktop Only */}
                  <div className="hidden md:block bg-slate-800/50 border border-white/10 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-300">Response Rate</span>
                      <span className="text-sm font-bold text-white">
                        {stats.responded}/{stats.total} ({stats.responseRate}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-700/50 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-emerald-400 to-teal-400 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${stats.responseRate}%` }}
                      ></div>
                    </div>
                    {match.availabilitySentAt && (
                      <p className="text-xs text-slate-400 mt-2">
                        Sent on {new Date(match.availabilitySentAt).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    )}
                  </div>

                  {/* Player List with Timestamps */}
                  {availabilities.length > 0 && (
                    <div className="mt-4 md:mt-6">
                      <h4 className="text-md font-bold text-white mb-3">Players Sent Availability Request</h4>
                      <div className="bg-slate-800/50 border border-white/10 rounded-lg p-3 md:p-4 space-y-2">
                        {availabilities.map((avail) => (
                          <div key={avail._id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-all gap-2">
                            <div className="flex items-center gap-3 flex-1">
                              {getResponseIcon(avail.response)}
                              <div>
                                <p className="text-sm font-medium text-white">{avail.playerName}</p>
                                <p className="text-xs text-slate-400">{avail.playerPhone}</p>
                              </div>
                            </div>
                            <div className="text-right sm:text-left">
                              <p className="text-xs text-slate-400">
                                📤 {new Date(avail.createdAt).toLocaleString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                              {avail.respondedAt && (
                                <p className="text-xs text-emerald-400">
                                  ✅ {new Date(avail.respondedAt).toLocaleString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Match Notes */}
              {match.notes && (
                <div>
                  <h3 className="text-lg font-bold text-white mb-3">Match Notes</h3>
                  <div className="bg-slate-800/50 border border-white/10 rounded-lg p-4">
                    <p className="text-slate-300 text-sm whitespace-pre-wrap">{match.notes}</p>
                  </div>
                </div>
              )}

              {/* Squad Status */}
              {match.squadStatus && (
                <div>
                  <h3 className="text-lg font-bold text-white mb-3">Squad Status</h3>
                  <div className="bg-slate-800/50 border border-white/10 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <Users className="w-6 h-6 text-emerald-400" />
                      <div>
                        <p className="text-sm text-slate-400">Current Status</p>
                        <p className="text-lg font-bold text-white capitalize">{match.squadStatus}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Player Responses Tab */}
          {activeTab === 'responses' && (
            <div className="space-y-4">
              
              {/* Search and Filter */}
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search players by name or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="px-4 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500/50"
                >
                  <option value="all">All Players</option>
                  <option value="responded">Responded</option>
                  <option value="pending">No Response</option>
                  <option value="yes">Confirmed</option>
                  <option value="no">Declined</option>
                  <option value="tentative">Tentative</option>
                </select>
              </div>

              {/* Player List */}
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
                </div>
              ) : filteredAvailabilities.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">
                    {availabilities.length === 0 
                      ? 'No availability requests sent yet' 
                      : 'No players match your search'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredAvailabilities.map((avail) => (
                    <div
                      key={avail._id}
                      className="bg-slate-800/50 border border-white/10 rounded-lg p-4 hover:border-white/20 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="mt-1">
                            {getResponseIcon(avail.response)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-bold text-white">{avail.playerName}</h4>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${getResponseBadge(avail.response)}`}>
                                {avail.response === 'yes' ? 'Confirmed' : 
                                 avail.response === 'no' ? 'Declined' :
                                 avail.response === 'tentative' ? 'Tentative' : 'No Response'}
                              </span>
                            </div>
                            <p className="text-sm text-slate-400 mb-2">{avail.playerPhone}</p>
                            
                            <div className="space-y-1 text-xs text-slate-500">
                              <p>
                                📤 Sent: {new Date(avail.createdAt).toLocaleString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                              {avail.respondedAt && (
                                <p>
                                  ✅ Responded: {new Date(avail.respondedAt).toLocaleString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              )}
                              {avail.messageContent && (
                                <p className="text-slate-400 italic">"{avail.messageContent}"</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Squad Builder Tab */}
          {activeTab === 'squad' && (
            <div className="space-y-4">
              {/* Mobile: Compact summary */}
              <div className="md:hidden bg-slate-800/50 border border-white/10 rounded-lg p-4 mb-4">
                <h4 className="font-bold text-white mb-3">Squad Summary</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                    <span className="text-xs text-emerald-400 font-medium min-w-[70px]">Available {availableSquad.length}</span>
                    <div className="flex-1 bg-slate-700/50 rounded-full h-2 overflow-hidden">
                      <div className="h-full bg-emerald-400 rounded-full transition-all duration-500" style={{ width: `${availableSquad.length + tentativeSquad.length + unavailableSquad.length > 0 ? (availableSquad.length / (availableSquad.length + tentativeSquad.length + unavailableSquad.length)) * 100 : 0}%` }}></div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                    <span className="text-xs text-amber-400 font-medium min-w-[70px]">Tentative {tentativeSquad.length}</span>
                    <div className="flex-1 bg-slate-700/50 rounded-full h-2 overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full transition-all duration-500" style={{ width: `${availableSquad.length + tentativeSquad.length + unavailableSquad.length > 0 ? (tentativeSquad.length / (availableSquad.length + tentativeSquad.length + unavailableSquad.length)) * 100 : 0}%` }}></div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-rose-400"></div>
                    <span className="text-xs text-rose-400 font-medium min-w-[70px]">Not Available {unavailableSquad.length}</span>
                    <div className="flex-1 bg-slate-700/50 rounded-full h-2 overflow-hidden">
                      <div className="h-full bg-rose-400 rounded-full transition-all duration-500" style={{ width: `${availableSquad.length + tentativeSquad.length + unavailableSquad.length > 0 ? (unavailableSquad.length / (availableSquad.length + tentativeSquad.length + unavailableSquad.length)) * 100 : 0}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Desktop: 3-column grid */}
              <div className="hidden md:grid md:grid-cols-3 md:gap-4">
                
                {/* Available */}
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-emerald-400 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      Available ({availableSquad.length})
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {availableSquad.map((player, idx) => (
                      <div key={player._id} className="bg-slate-800/50 rounded-lg p-3">
                        <p className="text-sm font-medium text-white">{idx + 1}. {player.playerName}</p>
                        <p className="text-xs text-slate-400">{player.playerPhone}</p>
                      </div>
                    ))}
                    {availableSquad.length === 0 && (
                      <p className="text-sm text-slate-500 text-center py-4">No confirmed players</p>
                    )}
                  </div>
                </div>

                {/* Tentative */}
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-amber-400 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5" />
                      Tentative ({tentativeSquad.length})
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {tentativeSquad.map((player, idx) => (
                      <div key={player._id} className="bg-slate-800/50 rounded-lg p-3">
                        <p className="text-sm font-medium text-white">{idx + 1}. {player.playerName}</p>
                        <p className="text-xs text-slate-400">{player.playerPhone}</p>
                      </div>
                    ))}
                    {tentativeSquad.length === 0 && (
                      <p className="text-sm text-slate-500 text-center py-4">No tentative players</p>
                    )}
                  </div>
                </div>

                {/* Not Available */}
                <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-rose-400 flex items-center gap-2">
                      <XCircle className="w-5 h-5" />
                      Not Available ({unavailableSquad.length})
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {unavailableSquad.map((player, idx) => (
                      <div key={player._id} className="bg-slate-800/50 rounded-lg p-3">
                        <p className="text-sm font-medium text-white">{idx + 1}. {player.playerName}</p>
                        <p className="text-xs text-slate-400">{player.playerPhone}</p>
                      </div>
                    ))}
                    {unavailableSquad.length === 0 && (
                      <p className="text-sm text-slate-500 text-center py-4">No declined players</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Squad Summary - Desktop Only */}
              <div className="hidden md:block bg-slate-800/50 border border-white/10 rounded-lg p-4">
                <h4 className="font-bold text-white mb-2">Squad Summary</h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-black text-emerald-400">{availableSquad.length}</p>
                    <p className="text-xs text-slate-400">Confirmed</p>
                  </div>
                  <div>
                    <p className="text-2xl font-black text-amber-400">{tentativeSquad.length}</p>
                    <p className="text-xs text-slate-400">Tentative</p>
                  </div>
                  <div>
                    <p className="text-2xl font-black text-rose-400">{unavailableSquad.length}</p>
                    <p className="text-xs text-slate-400">Declined</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-900/95 backdrop-blur-xl border-t border-white/10 p-4 md:p-6 flex gap-3 justify-end">
          {/* Mobile: Minimal footer */}
          <div className="md:hidden flex items-center justify-between gap-2">
            <button
              onClick={loadMatchAndAvailability}
              disabled={loading}
              className="flex-1 px-2 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1 border border-blue-500/30 disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-medium rounded-lg transition-all"
            >
              Close
            </button>
          </div>

          {/* Desktop: Full footer */}
          <div className="hidden md:flex items-center justify-between gap-2 text-xs text-slate-400">
            <div className="flex flex-row items-center gap-4">
              <span className="flex items-center gap-1">
                <RefreshCw className="w-3 h-3 animate-spin" />
                Auto-refreshing every 10s
              </span>
              {match.lastAvailabilityUpdate && (
                <span>
                  Last updated: {new Date(match.lastAvailabilityUpdate).toLocaleTimeString()}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchDetailModal;
