import React, { useState, useEffect } from 'react';
// @ts-ignore
import { Plus, Filter, Search, Calendar, Trophy, Users } from 'lucide-react';
import MatchForm from './MatchForm';
import MatchCard from './MatchCard';
import ConfirmDialog from './ConfirmDialog';
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
}

const MatchManagement: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
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

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      const data = await matchApi.getMatches();
      setMatches(data.matches || []);
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      setLoading(false);
    }
  };

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
      fetchMatches();
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
          fetchMatches();
        } catch (error) {
          console.error('Error deleting match:', error);
        }
        setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} });
      }
    });
  };

  const handleViewMatch = (match: Match) => {
    // TODO: Implement match view modal/details
    console.log('View match:', match);
  };

  const handleManageSquad = (match: Match) => {
    // TODO: Implement squad management modal
    console.log('Manage squad:', match);
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
          opponent: editingMatch.opponent,
          cricHeroesMatchId: editingMatch.cricHeroesMatchId,
          notes: editingMatch.notes
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-black text-white flex items-center gap-3">
                <Trophy className="w-8 h-8 text-emerald-400" />
                Match Management
              </h1>
              <p className="text-slate-400 mt-1">Create and manage cricket matches with squad availability</p>
            </div>
            
            <button
              onClick={handleCreateMatch}
              className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium rounded-lg transition-all duration-200 shadow-lg shadow-emerald-500/20 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create Match
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-white/10 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search matches by ID, opponent, or ground..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 transition-all focus:border-emerald-500 focus:ring-emerald-500/20 focus:outline-none focus:ring-2"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white transition-all focus:border-emerald-500 focus:ring-emerald-500/20 focus:outline-none focus:ring-2"
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
            {!searchTerm && statusFilter === 'all' && (
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
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredMatches.map((match) => (
              <MatchCard
                key={match._id}
                match={match}
                onEdit={handleEditMatch}
                onDelete={handleDeleteMatch}
                onView={handleViewMatch}
                onManageSquad={handleManageSquad}
              />
            ))}
          </div>
        )}
      </div>

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
