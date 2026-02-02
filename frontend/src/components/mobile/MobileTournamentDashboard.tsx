/**
 * @fileoverview Mobile Tournament Dashboard
 * 
 * Admin interface for managing tournaments on mobile devices.
 * Supports creating tournaments, uploading player lists, and CRUD operations.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Trophy, Plus, Upload, Link as LinkIcon, Search, X, Edit3, Trash2,
  MoreVertical, ChevronLeft, Users, Calendar, Share2, Copy, Check,
  ChevronDown, ExternalLink, QrCode, AlertCircle, FileSpreadsheet
} from 'lucide-react';
import {
  getTournaments, getTournament, createTournament, updateTournament, deleteTournament,
  getTournamentEntries, addTournamentEntry, updateTournamentEntry, deleteTournamentEntry,
  previewTournamentUpload, importTournamentEntries, regenerateTournamentToken,
  Tournament, TournamentEntry
} from '../../services/api';
import ConfirmDialog from '../ConfirmDialog';

// Role options
const ROLE_OPTIONS = [
  { value: 'batsman', label: 'Batsman' },
  { value: 'bowler', label: 'Bowler' },
  { value: 'all-rounder', label: 'All-Rounder' },
  { value: 'wicket-keeper', label: 'Wicket Keeper' },
  { value: 'captain', label: 'Captain' },
  { value: 'vice-captain', label: 'Vice Captain' },
  { value: 'coach', label: 'Coach' },
  { value: 'manager', label: 'Manager' },
  { value: 'player', label: 'Player' },
];

interface MobileTournamentDashboardProps {
  onBack?: () => void;
}

type View = 'list' | 'detail' | 'create' | 'edit-entry';

const MobileTournamentDashboard: React.FC<MobileTournamentDashboardProps> = ({ onBack }) => {
  // View state
  const [view, setView] = useState<View>('list');
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<TournamentEntry | null>(null);
  
  // Tournament list state
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Tournament detail state
  const [entries, setEntries] = useState<TournamentEntry[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [filterTeams, setFilterTeams] = useState<string[]>([]);
  const [filterRoles, setFilterRoles] = useState<string[]>([]);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
  });
  const [entryFormData, setEntryFormData] = useState({
    name: '',
    phone: '',
    email: '',
    role: 'player',
    teamName: '',
    companyName: '',
    cricHeroesId: '',
    jerseyNumber: '',
  });
  
  // Upload state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<any>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  
  // Share state
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  
  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ open: false, title: '', message: '', onConfirm: () => {} });
  
  // Action menu state
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);
  const [showHowTo, setShowHowTo] = useState(true);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load tournaments
  const loadTournaments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getTournaments({ limit: 50 });
      setTournaments(result.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load tournaments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTournaments();
  }, [loadTournaments]);

  // Load tournament entries
  const loadEntries = useCallback(async (tournamentId: string) => {
    try {
      setEntriesLoading(true);
      const result = await getTournamentEntries(tournamentId, {
        search: searchQuery || undefined,
        role: selectedRole || undefined,
        teamName: selectedTeam || undefined,
        limit: 100,
      });
      setEntries(result.data);
      setFilterTeams(result.filters.teams);
      setFilterRoles(result.filters.roles);
    } catch (err: any) {
      console.error('Error loading entries:', err);
    } finally {
      setEntriesLoading(false);
    }
  }, [searchQuery, selectedRole, selectedTeam]);

  // Open tournament detail
  const openTournamentDetail = async (tournament: Tournament) => {
    setSelectedTournament(tournament);
    setView('detail');
    setSearchQuery('');
    setSelectedRole('');
    setSelectedTeam('');
    await loadEntries(tournament._id);
  };

  // Create tournament
  const handleCreateTournament = async () => {
    if (!formData.name.trim()) {
      setError('Tournament name is required');
      return;
    }
    
    try {
      setLoading(true);
      const result = await createTournament({
        name: formData.name,
        description: formData.description || undefined,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
      });
      
      setTournaments(prev => [result.data, ...prev]);
      setView('list');
      setFormData({ name: '', description: '', startDate: '', endDate: '' });
    } catch (err: any) {
      setError(err.message || 'Failed to create tournament');
    } finally {
      setLoading(false);
    }
  };

  // Handle file selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedTournament) return;
    
    setUploadFile(file);
    setShowUploadModal(true);
    setUploadLoading(true);
    
    try {
      const result = await previewTournamentUpload(selectedTournament._id, file);
      setUploadPreview(result.data);
      setColumnMapping(result.data.suggestedMapping);
    } catch (err: any) {
      setError(err.message || 'Failed to parse file');
      setShowUploadModal(false);
    } finally {
      setUploadLoading(false);
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Import entries
  const handleImport = async () => {
    if (!uploadFile || !selectedTournament) return;
    
    setUploadLoading(true);
    try {
      const result = await importTournamentEntries(selectedTournament._id, uploadFile, columnMapping);
      
      // Show success message
      alert(`Successfully imported ${result.data.imported} entries. ${result.data.skipped} skipped, ${result.data.invalid} invalid.`);
      
      // Refresh entries
      await loadEntries(selectedTournament._id);
      
      // Refresh tournament to get updated stats
      const updatedTournament = await getTournament(selectedTournament._id);
      setSelectedTournament(updatedTournament.data);
      
      // Close modal
      setShowUploadModal(false);
      setUploadFile(null);
      setUploadPreview(null);
    } catch (err: any) {
      setError(err.message || 'Failed to import entries');
    } finally {
      setUploadLoading(false);
    }
  };

  // Add entry
  const handleAddEntry = async () => {
    if (!entryFormData.name.trim() || !selectedTournament) return;
    
    try {
      setLoading(true);
      await addTournamentEntry(selectedTournament._id, {
        name: entryFormData.name,
        phone: entryFormData.phone || undefined,
        email: entryFormData.email || undefined,
        role: entryFormData.role,
        teamName: entryFormData.teamName || undefined,
        companyName: entryFormData.companyName || undefined,
        cricHeroesId: entryFormData.cricHeroesId || undefined,
        jerseyNumber: entryFormData.jerseyNumber ? parseInt(entryFormData.jerseyNumber) : undefined,
      });
      
      // Refresh entries
      await loadEntries(selectedTournament._id);
      
      // Refresh tournament stats
      const updatedTournament = await getTournament(selectedTournament._id);
      setSelectedTournament(updatedTournament.data);
      
      // Reset form and close
      setEntryFormData({
        name: '', phone: '', email: '', role: 'player',
        teamName: '', companyName: '', cricHeroesId: '', jerseyNumber: '',
      });
      setView('detail');
    } catch (err: any) {
      setError(err.message || 'Failed to add entry');
    } finally {
      setLoading(false);
    }
  };

  // Update entry
  const handleUpdateEntry = async () => {
    if (!selectedEntry || !selectedTournament) return;
    
    try {
      setLoading(true);
      await updateTournamentEntry(selectedTournament._id, selectedEntry._id, {
        entryData: {
          name: entryFormData.name,
          phone: entryFormData.phone || undefined,
          email: entryFormData.email || undefined,
          role: entryFormData.role,
          teamName: entryFormData.teamName || undefined,
          companyName: entryFormData.companyName || undefined,
          cricHeroesId: entryFormData.cricHeroesId || undefined,
          jerseyNumber: entryFormData.jerseyNumber ? parseInt(entryFormData.jerseyNumber) : undefined,
        },
      });
      
      // Refresh entries
      await loadEntries(selectedTournament._id);
      
      // Reset and close
      setSelectedEntry(null);
      setView('detail');
    } catch (err: any) {
      setError(err.message || 'Failed to update entry');
    } finally {
      setLoading(false);
    }
  };

  // Delete entry
  const handleDeleteEntry = (entry: TournamentEntry) => {
    setConfirmDialog({
      open: true,
      title: 'Delete Entry',
      message: `Are you sure you want to delete ${entry.entryData.name}?`,
      onConfirm: async () => {
        if (!selectedTournament) return;
        try {
          await deleteTournamentEntry(selectedTournament._id, entry._id);
          await loadEntries(selectedTournament._id);
          
          // Refresh tournament stats
          const updatedTournament = await getTournament(selectedTournament._id);
          setSelectedTournament(updatedTournament.data);
        } catch (err: any) {
          setError(err.message || 'Failed to delete entry');
        }
        setConfirmDialog(prev => ({ ...prev, open: false }));
      },
    });
  };

  // Copy public link
  const copyPublicLink = () => {
    if (!selectedTournament?.publicToken) return;
    
    const url = `${window.location.origin}/tournament/${selectedTournament.publicToken}`;
    navigator.clipboard.writeText(url);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  // Share using native share API
  const shareLink = () => {
    if (!selectedTournament?.publicToken) return;
    
    const url = `${window.location.origin}/tournament/${selectedTournament.publicToken}`;
    
    if (navigator.share) {
      navigator.share({
        title: selectedTournament.name,
        text: `View registered players for ${selectedTournament.name}`,
        url,
      });
    } else {
      copyPublicLink();
    }
  };

  // Publish tournament
  const publishTournament = async () => {
    if (!selectedTournament) return;
    
    try {
      const result = await updateTournament(selectedTournament._id, { status: 'published' });
      setSelectedTournament(result.data);
      loadTournaments();
    } catch (err: any) {
      setError(err.message || 'Failed to publish tournament');
    }
  };

  // Render tournament list view
  const renderListView = () => (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-xl border-b border-white/10 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <button onClick={onBack} className="p-2 -ml-2 hover:bg-white/10 rounded-lg">
                <ChevronLeft className="w-5 h-5 text-slate-400" />
              </button>
            )}
            <div>
              <h1 className="text-lg font-semibold text-white">Tournaments</h1>
              <p className="text-xs text-slate-400">{tournaments.length} tournaments</p>
            </div>
          </div>
          
          <button
            onClick={() => setView('create')}
            className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 
                     rounded-lg text-white text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            New
          </button>
        </div>
      </header>

      {/* How to - compact tip */}
      <div className="px-4 pb-2">
        <button
          onClick={() => setShowHowTo(v => !v)}
          className="w-full flex items-center justify-between gap-2 py-2 px-3 bg-slate-800/50 border border-white/10 rounded-lg text-left"
        >
          <span className="text-xs text-slate-400 flex items-center gap-1.5">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            How to create &amp; upload Excel/CSV
          </span>
          <ChevronDown className={`w-4 h-4 text-slate-500 flex-shrink-0 transition-transform ${showHowTo ? 'rotate-180' : ''}`} />
        </button>
        {showHowTo && (
          <div className="mt-2 p-3 bg-slate-800/30 border border-white/5 rounded-lg text-xs text-slate-400 space-y-2">
            <p><strong className="text-slate-300">1. Create:</strong> Tap <strong className="text-emerald-400">New</strong> → name the tournament → <strong className="text-emerald-400">Create Tournament</strong>.</p>
            <p><strong className="text-slate-300">2. Upload:</strong> Open a tournament (tap it) → tap <strong className="text-emerald-400">Upload</strong> → choose <strong className="text-slate-300">.xlsx or .csv</strong> (PDF not supported) → review mapping → <strong className="text-emerald-400">Import</strong>.</p>
            <p><strong className="text-slate-300">3. Records:</strong> Same screen shows the player list; use search to find anyone.</p>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {loading && !tournaments.length ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tournaments.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No tournaments yet</p>
            <button
              onClick={() => setView('create')}
              className="mt-4 text-emerald-400 text-sm"
            >
              Create your first tournament
            </button>
          </div>
        ) : (
          tournaments.map(tournament => (
            <button
              key={tournament._id}
              onClick={() => openTournamentDetail(tournament)}
              className="w-full bg-slate-800/50 border border-white/10 rounded-xl p-4 text-left
                       transition-all active:scale-[0.98]"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-medium truncate">{tournament.name}</h3>
                  <div className="flex items-center gap-3 mt-1 text-sm">
                    <span className="flex items-center gap-1 text-slate-400">
                      <Users className="w-3.5 h-3.5" />
                      {tournament.stats?.entryCount || 0}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      tournament.status === 'published' ? 'bg-emerald-500/20 text-emerald-400' :
                      tournament.status === 'draft' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {tournament.status}
                    </span>
                  </div>
                </div>
                <ChevronDown className="w-5 h-5 text-slate-500 -rotate-90" />
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );

  // Render tournament detail view
  const renderDetailView = () => {
    if (!selectedTournament) return null;
    
    return (
      <div className="min-h-screen bg-slate-900">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-xl border-b border-white/10">
          <div className="px-4 py-3 flex items-center justify-between">
            <button
              onClick={() => { setView('list'); setSelectedTournament(null); }}
              className="p-2 -ml-2 hover:bg-white/10 rounded-lg"
            >
              <ChevronLeft className="w-5 h-5 text-slate-400" />
            </button>
            
            <h1 className="text-lg font-semibold text-white truncate flex-1 mx-2 text-center">
              {selectedTournament.name}
            </h1>
            
            <button
              onClick={() => setShowShareSheet(true)}
              className="p-2 hover:bg-white/10 rounded-lg"
            >
              <Share2 className="w-5 h-5 text-slate-400" />
            </button>
          </div>
          
          {/* Stats */}
          <div className="px-4 pb-3 flex items-center gap-3">
            <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-sm">
              {selectedTournament.stats?.entryCount || 0} Players
            </span>
            <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-sm">
              {selectedTournament.stats?.teamCount || 0} Teams
            </span>
            {selectedTournament.status === 'draft' && (
              <button
                onClick={publishTournament}
                className="ml-auto text-amber-400 text-sm px-3 py-1 border border-amber-500/30 rounded-full"
              >
                Publish
              </button>
            )}
          </div>
          
          {/* Action buttons */}
          <div className="px-4 pb-3 flex gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-2 py-2 bg-slate-800 border border-white/10
                       rounded-lg text-white text-sm"
            >
              <Upload className="w-4 h-4" />
              Upload
            </button>
            <button
              onClick={() => {
                setEntryFormData({
                  name: '', phone: '', email: '', role: 'player',
                  teamName: '', companyName: '', cricHeroesId: '', jerseyNumber: '',
                });
                setSelectedEntry(null);
                setView('edit-entry');
              }}
              className="flex-1 flex items-center justify-center gap-2 py-2 bg-emerald-500/20 
                       border border-emerald-500/30 rounded-lg text-emerald-400 text-sm"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
            <button
              onClick={() => setShowShareSheet(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 
                       border border-white/10 rounded-lg text-white text-sm"
            >
              <LinkIcon className="w-4 h-4" />
            </button>
          </div>
          
          {/* Search */}
          <div className="px-4 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search players..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  loadEntries(selectedTournament._id);
                }}
                className="w-full bg-slate-800/50 border border-white/10 rounded-lg pl-9 pr-4 py-2
                         text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
              />
            </div>
          </div>
        </header>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Entries list */}
        <div className="p-4 space-y-2">
          {entriesLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">No players yet</p>
              <p className="text-slate-500 text-xs mt-1">Upload a file or add players manually</p>
            </div>
          ) : (
            entries.map(entry => (
              <div
                key={entry._id}
                className="bg-slate-800/50 border border-white/10 rounded-xl p-3 flex items-center"
              >
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-medium truncate">{entry.entryData.name}</h4>
                  <p className="text-slate-400 text-sm truncate">
                    {entry.entryData.role} {entry.entryData.teamName && `• ${entry.entryData.teamName}`}
                  </p>
                </div>
                
                <div className="relative">
                  <button
                    onClick={() => setShowActionMenu(showActionMenu === entry._id ? null : entry._id)}
                    className="p-2 hover:bg-white/10 rounded-lg"
                  >
                    <MoreVertical className="w-4 h-4 text-slate-400" />
                  </button>
                  
                  {showActionMenu === entry._id && (
                    <div className="absolute right-0 top-full mt-1 bg-slate-800 border border-white/10 rounded-lg
                                  shadow-xl z-20 min-w-[120px] py-1">
                      <button
                        onClick={() => {
                          setSelectedEntry(entry);
                          setEntryFormData({
                            name: entry.entryData.name,
                            phone: entry.entryData.phone || '',
                            email: entry.entryData.email || '',
                            role: entry.entryData.role,
                            teamName: entry.entryData.teamName || '',
                            companyName: entry.entryData.companyName || '',
                            cricHeroesId: entry.entryData.cricHeroesId || '',
                            jerseyNumber: entry.entryData.jerseyNumber?.toString() || '',
                          });
                          setShowActionMenu(null);
                          setView('edit-entry');
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-white hover:bg-white/10 flex items-center gap-2"
                      >
                        <Edit3 className="w-4 h-4" /> Edit
                      </button>
                      <button
                        onClick={() => {
                          setShowActionMenu(null);
                          handleDeleteEntry(entry);
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-rose-400 hover:bg-white/10 flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  // Render create tournament view
  const renderCreateView = () => (
    <div className="min-h-screen bg-slate-900">
      <header className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-xl border-b border-white/10 px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setView('list')}
            className="p-2 -ml-2 hover:bg-white/10 rounded-lg"
          >
            <ChevronLeft className="w-5 h-5 text-slate-400" />
          </button>
          <h1 className="text-lg font-semibold text-white">New Tournament</h1>
          <div className="w-9" />
        </div>
      </header>

      <div className="p-4 space-y-4">
        <div>
          <label className="block text-sm text-slate-400 mb-1">Tournament Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., Corporate Cricket League 2026"
            className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-4 py-3
                     text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
          />
        </div>

        <div>
          <label className="block text-sm text-slate-400 mb-1">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Optional description..."
            rows={3}
            className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-4 py-3
                     text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Start Date</label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-4 py-3
                       text-white focus:outline-none focus:border-emerald-500/50"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">End Date</label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
              className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-4 py-3
                       text-white focus:outline-none focus:border-emerald-500/50"
            />
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-rose-400 text-sm bg-rose-500/10 px-3 py-2 rounded-lg">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <button
          onClick={handleCreateTournament}
          disabled={loading || !formData.name.trim()}
          className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl text-white font-medium
                   disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating...' : 'Create Tournament'}
        </button>
      </div>
    </div>
  );

  // Render edit entry view
  const renderEditEntryView = () => (
    <div className="min-h-screen bg-slate-900">
      <header className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-xl border-b border-white/10 px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => { setView('detail'); setSelectedEntry(null); }}
            className="p-2 -ml-2 hover:bg-white/10 rounded-lg"
          >
            <ChevronLeft className="w-5 h-5 text-slate-400" />
          </button>
          <h1 className="text-lg font-semibold text-white">
            {selectedEntry ? 'Edit Player' : 'Add Player'}
          </h1>
          <div className="w-9" />
        </div>
      </header>

      <div className="p-4 space-y-4">
        <div>
          <label className="block text-sm text-slate-400 mb-1">Name *</label>
          <input
            type="text"
            value={entryFormData.name}
            onChange={(e) => setEntryFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Player name"
            className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-4 py-3
                     text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
          />
        </div>

        <div>
          <label className="block text-sm text-slate-400 mb-1">Phone</label>
          <input
            type="tel"
            value={entryFormData.phone}
            onChange={(e) => setEntryFormData(prev => ({ ...prev, phone: e.target.value }))}
            placeholder="+91 98765 43210"
            className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-4 py-3
                     text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
          />
        </div>

        <div>
          <label className="block text-sm text-slate-400 mb-1">Email</label>
          <input
            type="email"
            value={entryFormData.email}
            onChange={(e) => setEntryFormData(prev => ({ ...prev, email: e.target.value }))}
            placeholder="player@company.com"
            className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-4 py-3
                     text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
          />
        </div>

        <div>
          <label className="block text-sm text-slate-400 mb-1">Role</label>
          <select
            value={entryFormData.role}
            onChange={(e) => setEntryFormData(prev => ({ ...prev, role: e.target.value }))}
            className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-4 py-3
                     text-white focus:outline-none focus:border-emerald-500/50"
          >
            {ROLE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-slate-400 mb-1">Team</label>
          <input
            type="text"
            value={entryFormData.teamName}
            onChange={(e) => setEntryFormData(prev => ({ ...prev, teamName: e.target.value }))}
            placeholder="Team name"
            className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-4 py-3
                     text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
          />
        </div>

        <div>
          <label className="block text-sm text-slate-400 mb-1">Company</label>
          <input
            type="text"
            value={entryFormData.companyName}
            onChange={(e) => setEntryFormData(prev => ({ ...prev, companyName: e.target.value }))}
            placeholder="Company name"
            className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-4 py-3
                     text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-slate-400 mb-1">CricHeroes ID</label>
            <input
              type="text"
              value={entryFormData.cricHeroesId}
              onChange={(e) => setEntryFormData(prev => ({ ...prev, cricHeroesId: e.target.value }))}
              placeholder="CH123456"
              className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-4 py-3
                       text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Jersey #</label>
            <input
              type="number"
              value={entryFormData.jerseyNumber}
              onChange={(e) => setEntryFormData(prev => ({ ...prev, jerseyNumber: e.target.value }))}
              placeholder="45"
              className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-4 py-3
                       text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
            />
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-rose-400 text-sm bg-rose-500/10 px-3 py-2 rounded-lg">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <button
          onClick={selectedEntry ? handleUpdateEntry : handleAddEntry}
          disabled={loading || !entryFormData.name.trim()}
          className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl text-white font-medium
                   disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : (selectedEntry ? 'Save Changes' : 'Add Player')}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {view === 'list' && renderListView()}
      {view === 'detail' && renderDetailView()}
      {view === 'create' && renderCreateView()}
      {view === 'edit-entry' && renderEditEntryView()}

      {/* Upload Preview Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end">
          <div className="w-full bg-slate-800 rounded-t-3xl max-h-[85vh] overflow-y-auto animate-slide-up">
            <div className="sticky top-0 bg-slate-800 px-4 pt-4 pb-2 border-b border-white/10">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-white">Import Preview</h3>
                <button
                  onClick={() => { setShowUploadModal(false); setUploadFile(null); setUploadPreview(null); }}
                  className="p-2 hover:bg-white/10 rounded-lg"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              {uploadPreview && (
                <p className="text-sm text-slate-400">
                  Found {uploadPreview.rowCount} rows in {uploadPreview.filename}
                </p>
              )}
            </div>

            {uploadLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : uploadPreview ? (
              <div className="p-4 space-y-4">
                {/* Column mapping */}
                <div className="space-y-2">
                  <h4 className="text-sm text-slate-400">Column Mapping</h4>
                  {Object.entries(columnMapping).map(([field, column]) => (
                    <div key={field} className="flex items-center justify-between bg-slate-900/50 rounded-lg p-2">
                      <span className="text-white text-sm capitalize">{field.replace(/([A-Z])/g, ' $1')}</span>
                      <span className="text-emerald-400 text-sm">{column}</span>
                    </div>
                  ))}
                </div>

                {/* Preview rows */}
                <div className="space-y-2">
                  <h4 className="text-sm text-slate-400">Preview (first 5 rows)</h4>
                  {uploadPreview.preview.slice(0, 5).map((row: any, i: number) => (
                    <div key={i} className="bg-slate-900/50 rounded-lg p-2 text-sm">
                      <span className="text-white">{row[columnMapping.name] || 'No name'}</span>
                      {row[columnMapping.teamName] && (
                        <span className="text-slate-400 ml-2">• {row[columnMapping.teamName]}</span>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleImport}
                  disabled={uploadLoading}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl text-white font-medium"
                >
                  Import {uploadPreview.rowCount} Players
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Share Sheet */}
      {showShareSheet && selectedTournament && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end" onClick={() => setShowShareSheet(false)}>
          <div className="w-full bg-slate-800 rounded-t-3xl" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1.5 bg-slate-600 rounded-full mx-auto mt-3" />
            
            <div className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Share Tournament</h3>
              
              <div className="bg-slate-900/50 rounded-xl p-4 mb-4">
                <p className="text-xs text-slate-400 mb-2">Public Link</p>
                <p className="text-white text-sm break-all">
                  {window.location.origin}/tournament/{selectedTournament.publicToken}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={copyPublicLink}
                  className="flex items-center justify-center gap-2 py-3 bg-slate-700 rounded-xl text-white"
                >
                  {linkCopied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
                  {linkCopied ? 'Copied!' : 'Copy Link'}
                </button>
                <button
                  onClick={shareLink}
                  className="flex items-center justify-center gap-2 py-3 bg-emerald-500/20 rounded-xl text-emerald-400"
                >
                  <Share2 className="w-5 h-5" />
                  Share
                </button>
              </div>
              
              <button
                onClick={() => window.open(`/tournament/${selectedTournament.publicToken}`, '_blank')}
                className="w-full mt-3 flex items-center justify-center gap-2 py-3 border border-white/10 rounded-xl text-slate-400"
              >
                <ExternalLink className="w-5 h-5" />
                Open in Browser
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
        confirmText="Delete"
        cancelText="Cancel"
      />

      {/* Click outside to close action menu */}
      {showActionMenu && (
        <div className="fixed inset-0 z-10" onClick={() => setShowActionMenu(null)} />
      )}
    </>
  );
};

export default MobileTournamentDashboard;
