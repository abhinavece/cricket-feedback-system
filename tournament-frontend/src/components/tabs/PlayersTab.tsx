import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  Plus,
  Upload,
  MoreVertical,
  Edit,
  Trash2,
  X,
  User,
  Phone,
  Mail,
  Filter,
  ChevronDown,
  Building2,
  DollarSign,
  Ban,
  CheckCircle,
  ChevronRight,
  Calendar,
  Shield,
  MapPin,
  Briefcase,
  Hash,
  ExternalLink,
} from 'lucide-react';
import { playerApi, franchiseApi } from '../../services/api';
import type { TournamentPlayer, Franchise } from '../../types';

interface PlayersTabProps {
  tournamentId: string;
}

const PlayersTab: React.FC<PlayersTabProps> = ({ tournamentId }) => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFranchise, setFilterFranchise] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<TournamentPlayer | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<TournamentPlayer | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  // Fetch players
  const { data: playersData, isLoading: loadingPlayers } = useQuery({
    queryKey: ['players', tournamentId, searchQuery, filterFranchise],
    queryFn: () => playerApi.list(tournamentId, { search: searchQuery, franchiseId: filterFranchise || undefined }),
  });

  // Fetch franchises for filter
  const { data: franchisesData } = useQuery({
    queryKey: ['franchises', tournamentId],
    queryFn: () => franchiseApi.list(tournamentId),
  });

  const players = playersData?.data || [];
  const franchises = franchisesData?.data || [];

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (playerId: string) => playerApi.delete(tournamentId, playerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players', tournamentId] });
      setActiveMenu(null);
    },
  });

  const getRoleBadge = (role?: string) => {
    const styles: Record<string, string> = {
      batsman: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      bowler: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
      'all-rounder': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      'wicket-keeper': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    };
    return styles[role || ''] || 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  };

  const getFranchiseName = (franchiseId?: string) => {
    if (!franchiseId) return null;
    const franchise = franchises.find((f) => f._id === franchiseId);
    return franchise?.shortName || franchise?.name;
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search players..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-10"
          />
        </div>

        {/* Franchise filter */}
        <div className="relative">
          <select
            value={filterFranchise}
            onChange={(e) => setFilterFranchise(e.target.value)}
            className="input-field pr-10 appearance-none min-w-[160px]"
          >
            <option value="">All Teams</option>
            <option value="unassigned">Unassigned</option>
            {franchises.map((f) => (
              <option key={f._id} value={f._id}>{f.name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="btn-secondary flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Import</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Player</span>
          </button>
        </div>
      </div>

      {/* Players List */}
      {loadingPlayers ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="stat-card p-4 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white/5" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-white/5 rounded w-1/4" />
                  <div className="h-3 bg-white/5 rounded w-1/6" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : players.length === 0 ? (
        <div className="text-center py-16 stat-card">
          <User className="w-12 h-12 mx-auto mb-4 text-slate-600" />
          <h3 className="font-heading text-lg uppercase text-slate-400 mb-2">
            No players yet
          </h3>
          <p className="text-slate-500 text-sm mb-4">
            Add players individually or import from Excel/CSV
          </p>
          <div className="flex justify-center gap-3">
            <button
              type="button"
              onClick={() => setShowImportModal(true)}
              className="btn-secondary flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Import
            </button>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Player
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {players.map((player, idx) => {
            const isIneligible = player.status === 'withdrawn';
            return (
              <button
                key={player._id}
                type="button"
                onClick={() => setSelectedPlayer(player)}
                className={`w-full stat-card p-4 hover:border-accent-500/30 hover:bg-accent-500/5 transition-all duration-200 relative group text-left cursor-pointer animate-slide-up ${
                  isIneligible ? 'opacity-60 border-rose-500/20' : ''
                }`}
                style={{ animationDelay: `${idx * 30}ms` }}
              >
                <div className="flex items-center gap-4">
                  {/* Avatar with gradient ring */}
                  <div className="relative">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
                      isIneligible 
                        ? 'bg-gradient-to-br from-rose-400/20 to-rose-600/10 border-rose-500/20' 
                        : 'bg-gradient-to-br from-accent-400/20 to-accent-600/10 border-accent-500/20'
                    }`}>
                      <span className={`font-display text-lg ${isIneligible ? 'text-rose-400' : 'text-accent-400'}`}>
                        {player.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    {isIneligible && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 flex items-center justify-center border-2 border-broadcast-800">
                        <Ban className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className={`font-heading transition-colors truncate ${
                        isIneligible ? 'text-rose-300 line-through' : 'text-white group-hover:text-accent-400'
                      }`}>
                        {player.name}
                      </h3>
                      {isIneligible && (
                        <span className="px-2 py-0.5 rounded text-[10px] uppercase tracking-wider border bg-rose-500/20 text-rose-400 border-rose-500/30">
                          Ineligible
                        </span>
                      )}
                      {player.role && !isIneligible && (
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider border ${getRoleBadge(player.role)}`}>
                          {player.role}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                      {player.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {player.phone}
                        </span>
                      )}
                      {player.companyName && (
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-3 h-3" />
                          {player.companyName}
                        </span>
                      )}
                      {player.cricHeroesId && (
                        <span className="flex items-center gap-1">
                          <Hash className="w-3 h-3" />
                          {player.cricHeroesId}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Arrow indicator */}
                  <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-accent-400 group-hover:translate-x-1 transition-all" />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Add/Edit Player Modal */}
      {(showAddModal || editingPlayer) && (
        <PlayerFormModal
          tournamentId={tournamentId}
          player={editingPlayer}
          onClose={() => { setShowAddModal(false); setEditingPlayer(null); }}
        />
      )}

      {/* Import Modal */}
      {showImportModal && (
        <ImportModal
          tournamentId={tournamentId}
          onClose={() => setShowImportModal(false)}
        />
      )}

      {/* Player Detail Modal */}
      {selectedPlayer && (
        <PlayerDetailModal
          player={selectedPlayer}
          tournamentId={tournamentId}
          onClose={() => setSelectedPlayer(null)}
          onEdit={() => { setEditingPlayer(selectedPlayer); setSelectedPlayer(null); }}
          onDelete={() => { deleteMutation.mutate(selectedPlayer._id); setSelectedPlayer(null); }}
        />
      )}
    </div>
  );
};

// Player Form Modal
const PlayerFormModal: React.FC<{
  tournamentId: string;
  player?: TournamentPlayer | null;
  onClose: () => void;
}> = ({ tournamentId, player, onClose }) => {
  const queryClient = useQueryClient();
  
  // Format DOB to YYYY-MM-DD for date input
  const formatDateForInput = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [formData, setFormData] = useState({
    name: player?.name || '',
    phone: player?.phone || '',
    email: player?.email || '',
    dateOfBirth: formatDateForInput(player?.dateOfBirth),
    cricHeroesId: player?.cricHeroesId || '',
    companyName: player?.companyName || '',
    address: player?.address || '',
    role: player?.role || '',
    battingStyle: player?.battingStyle || '',
    bowlingStyle: player?.bowlingStyle || '',
    basePrice: player?.basePrice?.toString() || '',
  });

  const mutation = useMutation({
    mutationFn: (data: Partial<TournamentPlayer>) =>
      player
        ? playerApi.update(tournamentId, player._id, data)
        : playerApi.create(tournamentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players', tournamentId] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    mutation.mutate({
      ...formData,
      basePrice: formData.basePrice ? Number(formData.basePrice) : undefined,
    } as Partial<TournamentPlayer>);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg glass-panel p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="font-display text-2xl text-white mb-6">
          {player ? 'EDIT PLAYER' : 'ADD PLAYER'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-heading uppercase tracking-wider text-slate-400 mb-1.5">
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input-field"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-heading uppercase tracking-wider text-slate-400 mb-1.5">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-xs font-heading uppercase tracking-wider text-slate-400 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input-field"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-heading uppercase tracking-wider text-slate-400 mb-1.5">
                Date of Birth
              </label>
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-xs font-heading uppercase tracking-wider text-slate-400 mb-1.5">
                CricHeroes ID
              </label>
              <input
                type="text"
                value={formData.cricHeroesId}
                onChange={(e) => setFormData({ ...formData, cricHeroesId: e.target.value })}
                placeholder="e.g., 12345678"
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-heading uppercase tracking-wider text-slate-400 mb-1.5">
              Company
            </label>
            <input
              type="text"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              placeholder="Company name"
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-xs font-heading uppercase tracking-wider text-slate-400 mb-1.5">
              Address
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="City, State"
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-xs font-heading uppercase tracking-wider text-slate-400 mb-1.5">
              Role
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="input-field"
            >
              <option value="">Select role</option>
              <option value="batsman">Batsman</option>
              <option value="bowler">Bowler</option>
              <option value="all-rounder">All-Rounder</option>
              <option value="wicket-keeper">Wicket-Keeper</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-heading uppercase tracking-wider text-slate-400 mb-1.5">
                Batting Style
              </label>
              <select
                value={formData.battingStyle}
                onChange={(e) => setFormData({ ...formData, battingStyle: e.target.value })}
                className="input-field"
              >
                <option value="">Select</option>
                <option value="right-hand">Right Hand</option>
                <option value="left-hand">Left Hand</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-heading uppercase tracking-wider text-slate-400 mb-1.5">
                Bowling Style
              </label>
              <input
                type="text"
                value={formData.bowlingStyle}
                onChange={(e) => setFormData({ ...formData, bowlingStyle: e.target.value })}
                placeholder="e.g., Right-arm fast"
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-heading uppercase tracking-wider text-slate-400 mb-1.5">
              Base Price
            </label>
            <input
              type="number"
              value={formData.basePrice}
              onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
              placeholder="0"
              className="input-field"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button
              type="submit"
              disabled={!formData.name.trim() || mutation.isPending}
              className="btn-primary flex-1 disabled:opacity-50"
            >
              {mutation.isPending ? 'Saving...' : player ? 'Update' : 'Add Player'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Import Modal
const ImportModal: React.FC<{
  tournamentId: string;
  onClose: () => void;
}> = ({ tournamentId, onClose }) => {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const importMutation = useMutation({
    mutationFn: (file: File) => playerApi.bulkImport(tournamentId, file),
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: ['players', tournamentId] });
      const imported = response?.data?.imported ?? response?.imported ?? 0;
      alert(`Imported ${imported} players`);
      onClose();
    },
    onError: (error: any) => {
      alert(error.response?.data?.error || 'Import failed');
    },
  });

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.csv'))) {
      setFile(droppedFile);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) setFile(selectedFile);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md glass-panel p-6 animate-slide-up">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="font-display text-2xl text-white mb-2">IMPORT PLAYERS</h2>
        <p className="text-sm text-slate-400 mb-6">
          Upload an Excel (.xlsx) or CSV file with player data
        </p>

        {/* Drop zone */}
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
            dragActive
              ? 'border-accent-400 bg-accent-500/10'
              : 'border-white/10 hover:border-white/20'
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
        >
          {file ? (
            <div>
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-accent-500/20 flex items-center justify-center">
                <Upload className="w-6 h-6 text-accent-400" />
              </div>
              <p className="font-heading text-white">{file.name}</p>
              <p className="text-xs text-slate-500 mt-1">
                {(file.size / 1024).toFixed(1)} KB
              </p>
              <button
                onClick={() => setFile(null)}
                className="text-xs text-rose-400 hover:text-rose-300 mt-2"
              >
                Remove
              </button>
            </div>
          ) : (
            <div>
              <Upload className="w-10 h-10 mx-auto mb-3 text-slate-600" />
              <p className="text-slate-400 mb-2">
                Drag & drop your file here
              </p>
              <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-slate-300 cursor-pointer transition-colors">
                <span>Or browse files</span>
                <input
                  type="file"
                  accept=".xlsx,.csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            </div>
          )}
        </div>

        {/* Expected format */}
        <div className="mt-4 p-3 rounded-lg bg-broadcast-700/50 text-xs text-slate-400">
          <p className="font-heading uppercase tracking-wider text-slate-500 mb-1">
            Expected columns:
          </p>
          <p>Name, Phone, Email, Role, Batting Style, Bowling Style, Base Price</p>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
          <button
            onClick={() => file && importMutation.mutate(file)}
            disabled={!file || importMutation.isPending}
            className="btn-primary flex-1 disabled:opacity-50"
          >
            {importMutation.isPending ? 'Importing...' : 'Import'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Player Detail Modal – Beautiful full-screen detail view
const PlayerDetailModal: React.FC<{
  player: TournamentPlayer;
  tournamentId: string;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ player, tournamentId, onClose, onEdit, onDelete }) => {
  const queryClient = useQueryClient();
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showReasonDialog, setShowReasonDialog] = useState(false);
  const [ineligibilityReason, setIneligibilityReason] = useState('');

  // Mutation for marking ineligible
  const markIneligibleMutation = useMutation({
    mutationFn: () => playerApi.update(tournamentId, player._id, { 
      status: 'withdrawn',
      ineligibilityReason: ineligibilityReason || null
    } as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players', tournamentId] });
      setShowReasonDialog(false);
      setIneligibilityReason('');
      onClose();
    },
  });

  const markEligibleMutation = useMutation({
    mutationFn: () => playerApi.update(tournamentId, player._id, { status: 'registered' } as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players', tournamentId] });
      onClose();
    },
  });

  const isIneligible = (player as any).status === 'withdrawn';

  const getRoleBadge = (role?: string) => {
    const styles: Record<string, { bg: string; text: string; icon: string }> = {
      batsman: { bg: 'from-blue-500/20 to-blue-600/10', text: 'text-blue-400', icon: '🏏' },
      bowler: { bg: 'from-rose-500/20 to-rose-600/10', text: 'text-rose-400', icon: '⚾' },
      'all-rounder': { bg: 'from-purple-500/20 to-purple-600/10', text: 'text-purple-400', icon: '⭐' },
      'wicket-keeper': { bg: 'from-amber-500/20 to-amber-600/10', text: 'text-amber-400', icon: '🧤' },
    };
    return styles[role || ''] || { bg: 'from-slate-500/20 to-slate-600/10', text: 'text-slate-400', icon: '👤' };
  };

  const roleStyle = getRoleBadge(player.role);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slide-up">
        {/* Gradient header background */}
        <div className={`absolute inset-x-0 top-0 h-40 bg-gradient-to-br ${roleStyle.bg} opacity-60`} />
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-transparent to-broadcast-800" />

        <div className="relative glass-panel rounded-3xl overflow-hidden shadow-2xl">
          {/* Close button - positioned to avoid mobile menu overlap */}
          <button
            onClick={onClose}
            className="fixed sm:absolute top-5 right-5 z-50 p-2.5 rounded-full bg-black/40 hover:bg-black/60 text-white/80 hover:text-white transition-all duration-200"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Player header */}
          <div className="relative px-8 pt-12 pb-8">
            <div className="flex items-start gap-6">
              {/* Large avatar */}
              <div className="relative flex-shrink-0">
                <div className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${roleStyle.bg} border-3 border-white/20 flex items-center justify-center shadow-2xl`}>
                  <span className="font-display text-5xl text-white">
                    {player.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                {isIneligible && (
                  <div className="absolute -bottom-2 -right-2 w-9 h-9 rounded-full bg-rose-500 border-3 border-broadcast-800 flex items-center justify-center shadow-lg">
                    <Ban className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>

              {/* Name and role */}
              <div className="flex-1 pt-1">
                <h2 className="font-display text-3xl text-white leading-tight mb-3">
                  {player.name}
                </h2>
                <div className="flex flex-wrap gap-2 mb-2">
                  {player.role && (
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${roleStyle.bg} border border-white/20 shadow-lg`}>
                      <span className="text-lg">{roleStyle.icon}</span>
                      <span className={`text-sm font-heading uppercase tracking-wider font-semibold ${roleStyle.text}`}>
                        {player.role}
                      </span>
                    </div>
                  )}
                  {player.cricHeroesId && (
                    <a
                      href={`https://cricheroes.in/player-profile/${player.cricHeroesId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/40 hover:border-emerald-500/60 transition-all shadow-lg"
                    >
                      <Hash className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm font-semibold text-emerald-400">{player.cricHeroesId}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                    </a>
                  )}
                </div>
                {isIneligible && (
                  <p className="text-sm text-rose-400 mt-2 flex items-center gap-2 font-medium">
                    <Ban className="w-4 h-4" />
                    Marked as ineligible
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mx-8" />

          {/* Details grid */}
          <div className="px-6 py-5 space-y-4">
            {/* Contact info */}
            {(player.phone || player.email) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {player.phone && (
                  <div className="p-3 rounded-xl bg-broadcast-700/30 border border-white/5">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                      <Phone className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-heading uppercase tracking-wider">Phone</span>
                    </div>
                    <p className="text-white font-mono text-sm">{player.phone}</p>
                  </div>
                )}
                {player.email && (
                  <div className="p-3 rounded-xl bg-broadcast-700/30 border border-white/5">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                      <Mail className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-heading uppercase tracking-wider">Email</span>
                    </div>
                    <p className="text-white text-sm truncate">{player.email}</p>
                  </div>
                )}
              </div>
            )}

            {/* DOB and CricHeroes */}
            {(player.dateOfBirth || player.cricHeroesId) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {player.dateOfBirth && (
                  <div className="p-3 rounded-xl bg-broadcast-700/30 border border-white/5">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-heading uppercase tracking-wider">Date of Birth</span>
                    </div>
                    <p className="text-white text-sm">{new Date(player.dateOfBirth).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                )}
                {player.cricHeroesId && (
                  <div className="p-3 rounded-xl bg-broadcast-700/30 border border-white/5">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                      <Hash className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-heading uppercase tracking-wider">CricHeroes ID</span>
                    </div>
                    <a
                      href={`https://cricheroes.in/player-profile/${player.cricHeroesId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent-400 hover:text-accent-300 text-sm flex items-center gap-1"
                    >
                      {player.cricHeroesId}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Company and Address */}
            {(player.companyName || player.address) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {player.companyName && (
                  <div className="p-3 rounded-xl bg-broadcast-700/30 border border-white/5">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                      <Briefcase className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-heading uppercase tracking-wider">Company</span>
                    </div>
                    <p className="text-white text-sm">{player.companyName}</p>
                  </div>
                )}
                {player.address && (
                  <div className="p-3 rounded-xl bg-broadcast-700/30 border border-white/5">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-heading uppercase tracking-wider">Address</span>
                    </div>
                    <p className="text-white text-sm">{player.address}</p>
                  </div>
                )}
              </div>
            )}

            {/* Playing style */}
            {(player.battingStyle || player.bowlingStyle) && (
              <div className="grid grid-cols-2 gap-3">
                {player.battingStyle && (
                  <div className="p-3 rounded-xl bg-broadcast-700/30 border border-white/5">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                      <span className="text-xs">🏏</span>
                      <span className="text-[10px] font-heading uppercase tracking-wider">Batting</span>
                    </div>
                    <p className="text-white text-sm capitalize">{player.battingStyle}</p>
                  </div>
                )}
                {player.bowlingStyle && (
                  <div className="p-3 rounded-xl bg-broadcast-700/30 border border-white/5">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                      <span className="text-xs">⚾</span>
                      <span className="text-[10px] font-heading uppercase tracking-wider">Bowling</span>
                    </div>
                    <p className="text-white text-sm">{player.bowlingStyle}</p>
                  </div>
                )}
              </div>
            )}

            {/* Stats row */}
            {player.stats && (
              <div className="grid grid-cols-4 gap-2">
                <StatBox label="Matches" value={player.stats.matches ?? '-'} />
                <StatBox label="Runs" value={player.stats.runs ?? '-'} />
                <StatBox label="Wickets" value={player.stats.wickets ?? '-'} />
                <StatBox label="Catches" value={player.stats.catches ?? '-'} />
              </div>
            )}

            {/* Registered date */}
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Calendar className="w-3.5 h-3.5" />
              <span>Registered {player.createdAt ? new Date(player.createdAt).toLocaleDateString() : 'N/A'}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="px-6 pb-6 pt-2 space-y-3">
            {/* Primary actions */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onEdit}
                className="flex-1 btn-primary flex items-center justify-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit Player
              </button>
              <button
                type="button"
                onClick={() => isIneligible ? markEligibleMutation.mutate() : setShowReasonDialog(true)}
                disabled={markIneligibleMutation.isPending || markEligibleMutation.isPending}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-heading uppercase tracking-wider text-sm transition-all ${
                  isIneligible
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30'
                }`}
              >
                {isIneligible ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Mark Eligible
                  </>
                ) : (
                  <>
                    <Ban className="w-4 h-4" />
                    Mark Ineligible
                  </>
                )}
              </button>
            </div>

            {/* Delete button */}
            {!showConfirmDelete ? (
              <button
                type="button"
                onClick={() => setShowConfirmDelete(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all text-sm"
              >
                <Trash2 className="w-4 h-4" />
                Delete Player
              </button>
            ) : (
              <div className="flex gap-2 animate-fade-in">
                <button
                  type="button"
                  onClick={() => setShowConfirmDelete(false)}
                  className="flex-1 btn-secondary text-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={onDelete}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-rose-500 text-white font-heading uppercase tracking-wider text-sm hover:bg-rose-600 transition-colors"
                >
                  Confirm Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ineligibility Reason Dialog */}
      {showReasonDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setShowReasonDialog(false)} />
          <div className="relative w-full max-w-md glass-panel p-6 animate-slide-up rounded-2xl">
            <h3 className="font-display text-xl text-white mb-4">Mark Player Ineligible</h3>
            <p className="text-sm text-slate-400 mb-4">
              Provide a reason for marking <span className="font-semibold text-white">{player.name}</span> as ineligible (optional)
            </p>
            <textarea
              value={ineligibilityReason}
              onChange={(e) => setIneligibilityReason(e.target.value)}
              placeholder="e.g., Failed to meet eligibility criteria, Injury, etc."
              className="input-field w-full h-24 resize-none mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowReasonDialog(false)}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => markIneligibleMutation.mutate()}
                disabled={markIneligibleMutation.isPending}
                className="flex-1 btn-primary disabled:opacity-50"
              >
                {markIneligibleMutation.isPending ? 'Marking...' : 'Mark Ineligible'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Stat Box Component
const StatBox: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div className="p-2 rounded-lg bg-broadcast-700/30 border border-white/5 text-center">
    <p className="score-display text-lg text-white">{value}</p>
    <p className="text-[9px] font-heading uppercase tracking-wider text-slate-500">{label}</p>
  </div>
);

export default PlayersTab;
