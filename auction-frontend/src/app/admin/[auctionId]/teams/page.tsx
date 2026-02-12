'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
  getAuctionTeamsAdmin, getAuctionAdmin, addTeam, deleteTeam, regenerateTeamAccess,
} from '@/lib/api';
import {
  Loader2, Plus, Users, Copy, Link2, Trash2, RefreshCw, X,
  ChevronDown, ChevronUp, AlertTriangle, Check,
} from 'lucide-react';

interface Team {
  _id: string;
  name: string;
  shortName: string;
  primaryColor: string;
  secondaryColor: string;
  logo?: string;
  owner?: { name?: string; email?: string };
  purseValue: number;
  purseRemaining: number;
  players: any[];
  retainedPlayers: any[];
  accessToken: string;
  rawAccessCode?: string;
}

export default function TeamsPage() {
  const params = useParams();
  const auctionId = params.auctionId as string;

  const [teams, setTeams] = useState<Team[]>([]);
  const [auctionStatus, setAuctionStatus] = useState('draft');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [teamsRes, auctionRes] = await Promise.all([
        getAuctionTeamsAdmin(auctionId),
        getAuctionAdmin(auctionId),
      ]);
      setTeams(teamsRes.data || []);
      setAuctionStatus(auctionRes.data?.status || 'draft');
    } catch (err: any) {
      console.error('Load teams error:', err);
    } finally {
      setLoading(false);
    }
  }, [auctionId]);

  useEffect(() => { loadData(); }, [loadData]);

  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const handleCopyLink = async (team: Team) => {
    const url = `${window.location.origin}/bid/${team.accessToken}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(team._id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!window.confirm('Remove this team? This cannot be undone.')) return;
    try {
      await deleteTeam(auctionId, teamId);
      setTeams(prev => prev.filter(t => t._id !== teamId));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRegenAccess = async (teamId: string) => {
    if (!window.confirm('Regenerate access credentials? Old magic link will stop working.')) return;
    try {
      const res = await regenerateTeamAccess(auctionId, teamId);
      await loadData();
      alert(`New magic link:\n${window.location.origin}/bid/${res.data.accessToken}\n\nAccess code: ${res.data.rawAccessCode}`);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const canAddTeams = ['draft', 'configured'].includes(auctionStatus);
  const canDeleteTeams = auctionStatus === 'draft';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Teams</h2>
          <p className="text-sm text-slate-400">{teams.length} team{teams.length !== 1 ? 's' : ''}</p>
        </div>
        {canAddTeams && (
          <button onClick={() => setShowAddModal(true)} className="btn-primary text-sm">
            <Plus className="w-4 h-4" /> Add Team
          </button>
        )}
      </div>

      {/* Teams list */}
      {teams.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">No Teams Yet</h3>
          <p className="text-sm text-slate-400 mb-6">Add teams to your auction. Each team gets a magic link for bidding.</p>
          {canAddTeams && (
            <button onClick={() => setShowAddModal(true)} className="btn-primary text-sm">
              <Plus className="w-4 h-4" /> Add First Team
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {teams.map(team => {
            const isExpanded = expandedTeam === team._id;
            const squadCount = (team.players?.length || 0) + (team.retainedPlayers?.length || 0);
            const pursePercent = team.purseValue > 0 ? (team.purseRemaining / team.purseValue) * 100 : 100;

            return (
              <div key={team._id} className="glass-card overflow-hidden">
                {/* Team color bar */}
                <div className="h-1.5" style={{ background: team.primaryColor }} />

                <div className="p-5">
                  {/* Team header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold text-white shadow-lg"
                        style={{ background: team.primaryColor }}
                      >
                        {team.shortName}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white">{team.name}</h3>
                        {team.owner?.name && (
                          <p className="text-xs text-slate-400">{team.owner.name}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setExpandedTeam(isExpanded ? null : team._id)}
                      className="btn-ghost p-1.5"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="text-center p-2 rounded-lg bg-slate-800/50">
                      <div className="text-sm font-bold text-white">{formatCurrency(team.purseRemaining)}</div>
                      <div className="text-[10px] text-slate-500">Remaining</div>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-slate-800/50">
                      <div className="text-sm font-bold text-white">{squadCount}</div>
                      <div className="text-[10px] text-slate-500">Squad</div>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-slate-800/50">
                      <div className="text-sm font-bold text-white">{team.retainedPlayers?.length || 0}</div>
                      <div className="text-[10px] text-slate-500">Retained</div>
                    </div>
                  </div>

                  {/* Purse bar */}
                  <div className="mb-4">
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pursePercent}%`,
                          background: pursePercent > 50 ? team.primaryColor : pursePercent > 20 ? '#f59e0b' : '#ef4444',
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                      <span>{formatCurrency(team.purseRemaining)} left</span>
                      <span>{formatCurrency(team.purseValue)} total</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopyLink(team)}
                      className="btn-ghost text-xs flex-1 border border-white/10 rounded-lg"
                    >
                      {copiedId === team._id ? (
                        <><Check className="w-3.5 h-3.5 text-emerald-400" /> Copied!</>
                      ) : (
                        <><Link2 className="w-3.5 h-3.5" /> Magic Link</>
                      )}
                    </button>
                    <button
                      onClick={() => handleRegenAccess(team._id)}
                      className="btn-ghost text-xs p-2 border border-white/10 rounded-lg"
                      title="Regenerate credentials"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                    {canDeleteTeams && (
                      <button
                        onClick={() => handleDeleteTeam(team._id)}
                        className="btn-ghost text-xs p-2 border border-red-500/20 rounded-lg text-red-400 hover:bg-red-500/10"
                        title="Remove team"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Expanded section — squad */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-white/5 animate-fade-in">
                      {squadCount === 0 ? (
                        <p className="text-xs text-slate-500 text-center py-3">No players in squad yet</p>
                      ) : (
                        <div className="space-y-2">
                          {team.retainedPlayers?.map((rp: any) => (
                            <div key={rp._id} className="flex items-center justify-between p-2 rounded-lg bg-slate-800/30">
                              <div className="flex items-center gap-2">
                                <span className="text-xs">{rp.isCaptain ? '©️' : '🏏'}</span>
                                <span className="text-sm text-white">{rp.name}</span>
                                <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">RTM</span>
                              </div>
                              <span className="text-xs text-slate-400">{rp.role}</span>
                            </div>
                          ))}
                          {team.players?.map((p: any) => (
                            <div key={p._id || p.playerId?._id} className="flex items-center justify-between p-2 rounded-lg bg-slate-800/30">
                              <div className="flex items-center gap-2">
                                <span className="text-xs">🏏</span>
                                <span className="text-sm text-white">{p.playerId?.name || 'Player'}</span>
                              </div>
                              <span className="text-xs text-slate-400">
                                {p.soldAmount ? formatCurrency(p.soldAmount) : p.playerId?.role || ''}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Team Modal */}
      {showAddModal && (
        <AddTeamModal
          auctionId={auctionId}
          onClose={() => setShowAddModal(false)}
          onAdded={(newTeam) => {
            setTeams(prev => [...prev, newTeam]);
            setShowAddModal(false);
          }}
        />
      )}
    </div>
  );
}

function AddTeamModal({ auctionId, onClose, onAdded }: {
  auctionId: string;
  onClose: () => void;
  onAdded: (team: any) => void;
}) {
  const [form, setForm] = useState({
    name: '',
    shortName: '',
    primaryColor: '#14b8a6',
    ownerName: '',
    ownerEmail: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdTeam, setCreatedTeam] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.shortName.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await addTeam(auctionId, {
        name: form.name.trim(),
        shortName: form.shortName.trim(),
        primaryColor: form.primaryColor,
        owner: form.ownerName ? { name: form.ownerName, email: form.ownerEmail } : undefined,
      });
      setCreatedTeam(res.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyMagicLink = () => {
    if (createdTeam?.magicLink) {
      navigator.clipboard.writeText(createdTeam.magicLink);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-card w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <h3 className="text-lg font-bold text-white">
            {createdTeam ? 'Team Created!' : 'Add Team'}
          </h3>
          <button onClick={createdTeam ? () => { onAdded(createdTeam); } : onClose} className="btn-ghost p-1.5">
            <X className="w-5 h-5" />
          </button>
        </div>

        {createdTeam ? (
          <div className="p-5 space-y-4">
            <div className="text-center mb-4">
              <div
                className="w-16 h-16 rounded-xl flex items-center justify-center text-lg font-bold text-white mx-auto mb-3 shadow-lg"
                style={{ background: createdTeam.primaryColor || '#14b8a6' }}
              >
                {createdTeam.shortName}
              </div>
              <h4 className="text-lg font-bold text-white">{createdTeam.name}</h4>
            </div>

            <div className="space-y-3 bg-slate-800/50 rounded-xl p-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Magic Link (share with team owner)</label>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={createdTeam.magicLink || ''}
                    className="input-field text-xs flex-1"
                  />
                  <button onClick={handleCopyMagicLink} className="btn-ghost border border-white/10 rounded-lg px-3">
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Access Code (one-time display)</label>
                <code className="block p-2 bg-slate-900 rounded-lg text-amber-400 text-sm font-mono">
                  {createdTeam.rawAccessCode}
                </code>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <p className="text-xs text-amber-300">
                <AlertTriangle className="w-3.5 h-3.5 inline mr-1" />
                Save the access code now. It won&apos;t be shown again.
              </p>
            </div>

            <button onClick={() => onAdded(createdTeam)} className="btn-primary w-full">
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Team Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Mumbai Mavericks"
                className="input-field"
                autoFocus
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Short Name *</label>
                <input
                  type="text"
                  value={form.shortName}
                  onChange={e => setForm(prev => ({ ...prev, shortName: e.target.value.toUpperCase().slice(0, 5) }))}
                  placeholder="MM"
                  className="input-field uppercase"
                  maxLength={5}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.primaryColor}
                    onChange={e => setForm(prev => ({ ...prev, primaryColor: e.target.value }))}
                    className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent"
                  />
                  <span className="text-xs text-slate-400">{form.primaryColor}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Owner Name</label>
                <input
                  type="text"
                  value={form.ownerName}
                  onChange={e => setForm(prev => ({ ...prev, ownerName: e.target.value }))}
                  placeholder="Optional"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Owner Email</label>
                <input
                  type="email"
                  value={form.ownerEmail}
                  onChange={e => setForm(prev => ({ ...prev, ownerEmail: e.target.value }))}
                  placeholder="Optional"
                  className="input-field"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">{error}</div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={onClose} className="btn-secondary text-sm">Cancel</button>
              <button
                type="submit"
                disabled={submitting || !form.name.trim() || !form.shortName.trim()}
                className="btn-primary text-sm disabled:opacity-40"
              >
                {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Adding...</> : <><Plus className="w-4 h-4" /> Add Team</>}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
