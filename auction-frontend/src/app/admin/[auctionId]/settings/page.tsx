'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  getAuctionAdmin, updateAuctionConfig, deleteAuction, addAuctionAdmin, removeAuctionAdmin,
} from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import {
  Loader2, Save, Trash2, AlertTriangle, UserPlus, X, Shield, ArrowLeftRight,
} from 'lucide-react';

interface AuctionConfig {
  basePrice: number;
  purseValue: number;
  minSquadSize: number;
  maxSquadSize: number;
  bidIncrementPreset: string;
  retentionEnabled: boolean;
  maxRetentions: number;
  tradeWindowHours: number;
  maxTradesPerTeam: number;
  tradeSettlementEnabled: boolean;
}

export default function SettingsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const auctionId = params.auctionId as string;

  const [auction, setAuction] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    description: '',
    basePrice: 0,
    purseValue: 0,
    minSquadSize: 11,
    maxSquadSize: 18,
    bidIncrementPreset: 'standard',
    retentionEnabled: true,
    maxRetentions: 3,
    scheduledStartTime: '',
    tradeWindowHours: 24,
    maxTradesPerTeam: 2,
    tradeSettlementEnabled: false,
  });

  const [adminEmail, setAdminEmail] = useState('');
  const [addingAdmin, setAddingAdmin] = useState(false);

  const loadAuction = useCallback(async () => {
    try {
      const res = await getAuctionAdmin(auctionId);
      const a = res.data;
      setAuction(a);
      setForm({
        name: a.name || '',
        description: a.description || '',
        basePrice: a.config.basePrice || 0,
        purseValue: a.config.purseValue || 0,
        minSquadSize: a.config.minSquadSize || 11,
        maxSquadSize: a.config.maxSquadSize || 18,
        bidIncrementPreset: a.config.bidIncrementPreset || 'standard',
        retentionEnabled: a.config.retentionEnabled ?? true,
        maxRetentions: a.config.maxRetentions || 3,
        scheduledStartTime: a.scheduledStartTime ? new Date(a.scheduledStartTime).toISOString().slice(0, 16) : '',
        tradeWindowHours: a.config.tradeWindowHours || 24,
        maxTradesPerTeam: a.config.maxTradesPerTeam || 2,
        tradeSettlementEnabled: a.config.tradeSettlementEnabled ?? false,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [auctionId]);

  useEffect(() => { loadAuction(); }, [loadAuction]);

  const isDraft = auction?.status === 'draft';
  const isOwner = auction?.admins?.some((a: any) => a.userId === user?._id && a.role === 'owner');

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await updateAuctionConfig(auctionId, {
        name: form.name.trim(),
        description: form.description.trim(),
        config: {
          basePrice: form.basePrice,
          purseValue: form.purseValue,
          minSquadSize: form.minSquadSize,
          maxSquadSize: form.maxSquadSize,
          bidIncrementPreset: form.bidIncrementPreset,
          retentionEnabled: form.retentionEnabled,
          maxRetentions: form.maxRetentions,
          tradeWindowHours: form.tradeWindowHours,
          maxTradesPerTeam: form.maxTradesPerTeam,
          tradeSettlementEnabled: form.tradeSettlementEnabled,
        },
        scheduledStartTime: form.scheduledStartTime || undefined,
      });
      setSuccess('Settings saved');
      setTimeout(() => setSuccess(null), 3000);
      await loadAuction();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAuction = async () => {
    if (!window.confirm('Delete this auction? This cannot be undone.')) return;
    if (!window.confirm('Are you absolutely sure? All teams and players will be lost.')) return;
    try {
      await deleteAuction(auctionId);
      router.push('/admin');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmail.trim()) return;
    setAddingAdmin(true);
    try {
      await addAuctionAdmin(auctionId, adminEmail.trim());
      setAdminEmail('');
      await loadAuction();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setAddingAdmin(false);
    }
  };

  const handleRemoveAdmin = async (userId: string) => {
    if (!window.confirm('Remove this admin?')) return;
    try {
      await removeAuctionAdmin(auctionId, userId);
      await loadAuction();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)} Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(0)} Lakh`;
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  if (!auction) {
    return <div className="glass-card p-8 text-center text-red-400">Failed to load auction settings</div>;
  }

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Status banner */}
      {!isDraft && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-300">Configuration Locked</p>
              <p className="text-xs text-amber-200/70 mt-0.5">
                Settings can only be edited in draft status. Current status: <strong>{auction.status}</strong>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Basic info */}
      <div className="glass-card p-5 sm:p-6">
        <h3 className="text-base font-semibold text-white mb-5">Basic Information</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Auction Name</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
              className="input-field"
              disabled={!isDraft}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
              className="input-field resize-none"
              rows={2}
              disabled={!isDraft}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Scheduled Start</label>
            <input
              type="datetime-local"
              value={form.scheduledStartTime}
              onChange={e => setForm(prev => ({ ...prev, scheduledStartTime: e.target.value }))}
              className="input-field"
              disabled={!isDraft}
            />
          </div>
        </div>
      </div>

      {/* Auction config */}
      <div className="glass-card p-5 sm:p-6">
        <h3 className="text-base font-semibold text-white mb-5">Auction Configuration</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Base Price</label>
            <input
              type="number"
              value={form.basePrice}
              onChange={e => setForm(prev => ({ ...prev, basePrice: parseInt(e.target.value) || 0 }))}
              className="input-field"
              disabled={!isDraft}
            />
            <p className="text-xs text-slate-500 mt-1">{formatCurrency(form.basePrice)}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Team Purse</label>
            <input
              type="number"
              value={form.purseValue}
              onChange={e => setForm(prev => ({ ...prev, purseValue: parseInt(e.target.value) || 0 }))}
              className="input-field"
              disabled={!isDraft}
            />
            <p className="text-xs text-slate-500 mt-1">{formatCurrency(form.purseValue)}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Min Squad Size</label>
            <input
              type="number"
              value={form.minSquadSize}
              onChange={e => setForm(prev => ({ ...prev, minSquadSize: parseInt(e.target.value) || 1 }))}
              className="input-field"
              min={1}
              max={30}
              disabled={!isDraft}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Max Squad Size</label>
            <input
              type="number"
              value={form.maxSquadSize}
              onChange={e => setForm(prev => ({ ...prev, maxSquadSize: parseInt(e.target.value) || 1 }))}
              className="input-field"
              min={form.minSquadSize}
              max={30}
              disabled={!isDraft}
            />
          </div>
        </div>

        {/* Bid preset */}
        <div className="mt-5">
          <label className="block text-sm font-medium text-slate-300 mb-2">Bid Increment Preset</label>
          <div className="grid grid-cols-3 gap-3">
            {['budget', 'standard', 'premium'].map(preset => (
              <button
                key={preset}
                type="button"
                onClick={() => isDraft && setForm(prev => ({ ...prev, bidIncrementPreset: preset }))}
                disabled={!isDraft}
                className={`p-3 rounded-xl border text-center text-sm font-medium capitalize transition-all ${
                  form.bidIncrementPreset === preset
                    ? 'border-amber-500/50 bg-amber-500/10 text-amber-400'
                    : 'border-white/10 bg-slate-800/30 text-slate-400'
                } ${!isDraft ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Retention */}
        <div className="mt-5 flex items-center justify-between p-4 rounded-xl bg-slate-800/30 border border-white/5">
          <div>
            <div className="text-sm font-medium text-white">Player Retention</div>
            <div className="text-xs text-slate-400 mt-0.5">Allow teams to retain players</div>
          </div>
          <button
            type="button"
            onClick={() => isDraft && setForm(prev => ({ ...prev, retentionEnabled: !prev.retentionEnabled }))}
            disabled={!isDraft}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              form.retentionEnabled ? 'bg-amber-500' : 'bg-slate-700'
            } ${!isDraft ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform shadow-sm ${
              form.retentionEnabled ? 'translate-x-5' : ''
            }`} />
          </button>
        </div>

        {form.retentionEnabled && (
          <div className="mt-3 ml-4">
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Max Retentions Per Team</label>
            <input
              type="number"
              value={form.maxRetentions}
              onChange={e => setForm(prev => ({ ...prev, maxRetentions: parseInt(e.target.value) || 0 }))}
              className="input-field w-32"
              min={0}
              max={10}
              disabled={!isDraft}
            />
          </div>
        )}
      </div>

      {/* Trade Settings — editable even after draft */}
      <div className="glass-card p-5 sm:p-6">
        <h3 className="text-base font-semibold text-white mb-5 flex items-center gap-2">
          <ArrowLeftRight className="w-4 h-4 text-purple-400" /> Trade Settings
        </h3>
        <p className="text-xs text-slate-400 mb-4">These settings apply when the trade window is opened after the auction completes.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Trade Window Duration (hours)</label>
            <input
              type="number"
              value={form.tradeWindowHours}
              onChange={e => setForm(prev => ({ ...prev, tradeWindowHours: parseInt(e.target.value) || 1 }))}
              className="input-field"
              min={1}
              max={168}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Max Trades Per Team</label>
            <input
              type="number"
              value={form.maxTradesPerTeam}
              onChange={e => setForm(prev => ({ ...prev, maxTradesPerTeam: parseInt(e.target.value) || 1 }))}
              className="input-field"
              min={1}
              max={10}
            />
            <p className="text-xs text-slate-500 mt-1">Only executed trades count toward this limit</p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between p-4 rounded-xl bg-slate-800/30 border border-white/5">
          <div>
            <div className="text-sm font-medium text-white">Purse Settlement</div>
            <div className="text-xs text-slate-400 mt-0.5">Adjust team purses based on player value difference in trades</div>
          </div>
          <button
            type="button"
            onClick={() => setForm(prev => ({ ...prev, tradeSettlementEnabled: !prev.tradeSettlementEnabled }))}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              form.tradeSettlementEnabled ? 'bg-purple-500' : 'bg-slate-700'
            }`}
          >
            <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform shadow-sm ${
              form.tradeSettlementEnabled ? 'translate-x-5' : ''
            }`} />
          </button>
        </div>
        {form.tradeSettlementEnabled && (
          <p className="text-xs text-purple-300/70 mt-2 ml-1">
            When enabled, the admin can settle purse differences when executing trades (e.g., if Team A sends a ₹5L player for a ₹3L player, ₹2L may be transferred).
          </p>
        )}
      </div>

      {/* Save button */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary"
        >
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save Changes</>}
        </button>
        {success && <span className="text-sm text-emerald-400">{success}</span>}
        {error && <span className="text-sm text-red-400">{error}</span>}
      </div>

      {/* Admin management */}
      <div className="glass-card p-5 sm:p-6">
        <h3 className="text-base font-semibold text-white mb-5 flex items-center gap-2">
          <Shield className="w-4 h-4 text-amber-400" /> Admin Management
        </h3>
        <div className="space-y-2 mb-4">
          {auction.admins?.map((admin: any) => (
            <div key={admin.userId} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/30">
              <div className="flex items-center gap-2">
                <span className="text-sm text-white">{admin.email}</span>
                <span className={`badge text-[10px] ${admin.role === 'owner' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-600/30 text-slate-400'}`}>
                  {admin.role}
                </span>
              </div>
              {isOwner && admin.role !== 'owner' && (
                <button
                  onClick={() => handleRemoveAdmin(admin.userId)}
                  className="btn-ghost p-1.5 text-red-400 hover:bg-red-500/10"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        {isOwner && (
          <form onSubmit={handleAddAdmin} className="flex gap-2">
            <input
              type="email"
              value={adminEmail}
              onChange={e => setAdminEmail(e.target.value)}
              placeholder="Co-admin email"
              className="input-field flex-1"
            />
            <button type="submit" disabled={addingAdmin || !adminEmail.trim()} className="btn-primary text-sm disabled:opacity-40">
              {addingAdmin ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              Add
            </button>
          </form>
        )}
      </div>

      {/* Danger zone */}
      {isDraft && isOwner && (
        <div className="glass-card p-5 sm:p-6 border-red-500/20">
          <h3 className="text-base font-semibold text-red-400 mb-3">Danger Zone</h3>
          <p className="text-sm text-slate-400 mb-4">
            Permanently delete this auction and all associated teams and players. This cannot be undone.
          </p>
          <button onClick={handleDeleteAuction} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-red-400 border border-red-500/30 hover:bg-red-500/10 transition-all">
            <Trash2 className="w-4 h-4" /> Delete Auction
          </button>
        </div>
      )}
    </div>
  );
}
