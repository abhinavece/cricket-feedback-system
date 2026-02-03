import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  X,
  Users,
  DollarSign,
  Building2,
  Palette,
} from 'lucide-react';
import { franchiseApi, playerApi } from '../../services/api';
import type { Franchise, TournamentPlayer } from '../../types';

interface FranchisesTabProps {
  tournamentId: string;
}

const FranchisesTab: React.FC<FranchisesTabProps> = ({ tournamentId }) => {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingFranchise, setEditingFranchise] = useState<Franchise | null>(null);
  const [selectedFranchise, setSelectedFranchise] = useState<Franchise | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  // Fetch franchises
  const { data: franchisesData, isLoading } = useQuery({
    queryKey: ['franchises', tournamentId],
    queryFn: () => franchiseApi.list(tournamentId),
  });

  const franchises = franchisesData?.data || [];

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (franchiseId: string) => franchiseApi.delete(tournamentId, franchiseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['franchises', tournamentId] });
      setActiveMenu(null);
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <p className="text-slate-400">
          {franchises.length} {franchises.length === 1 ? 'franchise' : 'franchises'}
        </p>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Franchise
        </button>
      </div>

      {/* Franchises Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="stat-card h-48 animate-pulse">
              <div className="p-5 space-y-4">
                <div className="h-8 bg-white/5 rounded w-3/4" />
                <div className="h-4 bg-white/5 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : franchises.length === 0 ? (
        <div className="text-center py-16 stat-card">
          <Building2 className="w-12 h-12 mx-auto mb-4 text-slate-600" />
          <h3 className="font-heading text-lg uppercase text-slate-400 mb-2">
            No franchises yet
          </h3>
          <p className="text-slate-500 text-sm mb-4">
            Create franchises to organize teams in your tournament
          </p>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Franchise
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {franchises.map((franchise) => (
            <FranchiseCard
              key={franchise._id}
              franchise={franchise}
              isMenuOpen={activeMenu === franchise._id}
              onMenuToggle={() => setActiveMenu(activeMenu === franchise._id ? null : franchise._id)}
              onEdit={() => { setEditingFranchise(franchise); setActiveMenu(null); }}
              onDelete={() => { if (confirm('Delete this franchise?')) deleteMutation.mutate(franchise._id); }}
              onViewPlayers={() => { setSelectedFranchise(franchise); setActiveMenu(null); }}
            />
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {(showAddModal || editingFranchise) && (
        <FranchiseFormModal
          tournamentId={tournamentId}
          franchise={editingFranchise}
          onClose={() => { setShowAddModal(false); setEditingFranchise(null); }}
        />
      )}

      {/* Franchise Players Modal */}
      {selectedFranchise && (
        <FranchisePlayersModal
          tournamentId={tournamentId}
          franchise={selectedFranchise}
          onClose={() => setSelectedFranchise(null)}
        />
      )}
    </div>
  );
};

// Franchise Card
const FranchiseCard: React.FC<{
  franchise: Franchise;
  isMenuOpen: boolean;
  onMenuToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onViewPlayers: () => void;
}> = ({ franchise, isMenuOpen, onMenuToggle, onEdit, onDelete, onViewPlayers }) => {
  const budgetUsed = franchise.budget - franchise.remainingBudget;
  const budgetPercent = franchise.budget > 0 ? (budgetUsed / franchise.budget) * 100 : 0;

  return (
    <div
      className="stat-card overflow-hidden cursor-pointer hover:border-white/10 transition-all group relative"
      onClick={onViewPlayers}
    >
      {/* Color accent bar */}
      <div
        className="h-1.5"
        style={{ background: `linear-gradient(90deg, ${franchise.primaryColor}, ${franchise.secondaryColor || franchise.primaryColor})` }}
      />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center font-display text-xl text-white"
              style={{ backgroundColor: franchise.primaryColor + '40' }}
            >
              {franchise.shortName || franchise.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="font-heading text-lg text-white group-hover:text-accent-400 transition-colors">
                {franchise.name}
              </h3>
              <p className="text-xs text-slate-500">{franchise.shortName}</p>
            </div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onMenuToggle(); }}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 rounded-lg bg-broadcast-700/50">
            <div className="flex items-center gap-1.5 text-slate-500 mb-1">
              <Users className="w-3 h-3" />
              <span className="text-[10px] uppercase tracking-wider">Players</span>
            </div>
            <p className="score-display text-xl text-white">
              {franchise.playerIds?.length || 0}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-broadcast-700/50">
            <div className="flex items-center gap-1.5 text-slate-500 mb-1">
              <DollarSign className="w-3 h-3" />
              <span className="text-[10px] uppercase tracking-wider">Remaining</span>
            </div>
            <p className="score-display text-xl text-gold">
              {(franchise.remainingBudget / 1000).toFixed(0)}K
            </p>
          </div>
        </div>

        {/* Budget bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Budget used</span>
            <span className="text-slate-400">{budgetPercent.toFixed(0)}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-broadcast-700 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${budgetPercent}%`,
                backgroundColor: budgetPercent > 80 ? '#f59e0b' : '#14b8a6',
              }}
            />
          </div>
        </div>
      </div>

      {/* Menu */}
      {isMenuOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); onMenuToggle(); }} />
          <div className="absolute right-4 top-12 w-40 py-1 bg-broadcast-700 border border-white/10 rounded-lg shadow-xl z-50 animate-fade-in">
            <button
              onClick={(e) => { e.stopPropagation(); onViewPlayers(); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-white/5"
            >
              <Users className="w-4 h-4" />
              View Players
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-white/5"
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-400 hover:bg-white/5"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
};

// Franchise Form Modal
const FranchiseFormModal: React.FC<{
  tournamentId: string;
  franchise?: Franchise | null;
  onClose: () => void;
}> = ({ tournamentId, franchise, onClose }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: franchise?.name || '',
    shortName: franchise?.shortName || '',
    primaryColor: franchise?.primaryColor || '#14b8a6',
    secondaryColor: franchise?.secondaryColor || '',
    owner: franchise?.owner || '',
    budget: franchise?.budget?.toString() || '100000',
  });

  const mutation = useMutation({
    mutationFn: (data: Partial<Franchise>) =>
      franchise
        ? franchiseApi.update(tournamentId, franchise._id, data)
        : franchiseApi.create(tournamentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['franchises', tournamentId] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.shortName.trim()) return;
    mutation.mutate({
      ...formData,
      budget: Number(formData.budget),
      remainingBudget: franchise ? franchise.remainingBudget : Number(formData.budget),
    } as Partial<Franchise>);
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

        <h2 className="font-display text-2xl text-white mb-6">
          {franchise ? 'EDIT FRANCHISE' : 'CREATE FRANCHISE'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-heading uppercase tracking-wider text-slate-400 mb-1.5">
              Franchise Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Chennai Super Kings"
              className="input-field"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-heading uppercase tracking-wider text-slate-400 mb-1.5">
                Short Name *
              </label>
              <input
                type="text"
                value={formData.shortName}
                onChange={(e) => setFormData({ ...formData, shortName: e.target.value.toUpperCase().slice(0, 4) })}
                placeholder="CSK"
                maxLength={4}
                className="input-field uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-heading uppercase tracking-wider text-slate-400 mb-1.5">
                Budget
              </label>
              <input
                type="number"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                className="input-field"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-heading uppercase tracking-wider text-slate-400 mb-1.5">
                Primary Color
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  className="w-12 h-12 rounded-lg cursor-pointer bg-transparent"
                />
                <input
                  type="text"
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  className="input-field flex-1"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-heading uppercase tracking-wider text-slate-400 mb-1.5">
                Secondary Color
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={formData.secondaryColor || '#ffffff'}
                  onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                  className="w-12 h-12 rounded-lg cursor-pointer bg-transparent"
                />
                <input
                  type="text"
                  value={formData.secondaryColor}
                  onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                  placeholder="Optional"
                  className="input-field flex-1"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-heading uppercase tracking-wider text-slate-400 mb-1.5">
              Owner Name
            </label>
            <input
              type="text"
              value={formData.owner}
              onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
              placeholder="Optional"
              className="input-field"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button
              type="submit"
              disabled={!formData.name.trim() || !formData.shortName.trim() || mutation.isPending}
              className="btn-primary flex-1 disabled:opacity-50"
            >
              {mutation.isPending ? 'Saving...' : franchise ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Franchise Players Modal
const FranchisePlayersModal: React.FC<{
  tournamentId: string;
  franchise: Franchise;
  onClose: () => void;
}> = ({ tournamentId, franchise, onClose }) => {
  // Fetch franchise players
  const { data: playersData, isLoading } = useQuery({
    queryKey: ['franchise-players', tournamentId, franchise._id],
    queryFn: () => playerApi.list(tournamentId, { franchiseId: franchise._id }),
  });

  const players = playersData?.data || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl glass-panel overflow-hidden animate-slide-up max-h-[80vh]">
        {/* Header with franchise color */}
        <div
          className="p-6 border-b border-white/10"
          style={{ background: `linear-gradient(135deg, ${franchise.primaryColor}20, transparent)` }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center font-display text-2xl text-white"
              style={{ backgroundColor: franchise.primaryColor + '40' }}
            >
              {franchise.shortName}
            </div>
            <div>
              <h2 className="font-display text-2xl text-white">{franchise.name}</h2>
              <p className="text-sm text-slate-400">
                {players.length} players • Budget: ${(franchise.remainingBudget / 1000).toFixed(0)}K remaining
              </p>
            </div>
          </div>
        </div>

        {/* Players list */}
        <div className="p-6 overflow-y-auto max-h-[50vh]">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-white/5 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : players.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-10 h-10 mx-auto mb-3 text-slate-600" />
              <p className="text-slate-400">No players assigned yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {players.map((player) => (
                <div
                  key={player._id}
                  className="flex items-center gap-4 p-3 rounded-lg bg-broadcast-700/30 hover:bg-broadcast-700/50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-accent-500/20 flex items-center justify-center">
                    <span className="font-heading text-accent-400">
                      {player.name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-heading text-white">{player.name}</p>
                    <p className="text-xs text-slate-500">{player.role || 'Player'}</p>
                  </div>
                  {player.soldPrice && (
                    <div className="text-right">
                      <p className="text-sm font-mono text-gold">
                        ${player.soldPrice.toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FranchisesTab;
