'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { getDisplayConfig, updateDisplayConfig } from '@/lib/api';
import {
  Loader2, Save, GripVertical, Eye, EyeOff, ArrowUpDown,
  ListChecks, ChevronUp, ChevronDown, ExternalLink, Type,
  Hash, Calendar, Link2,
} from 'lucide-react';

interface PlayerField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'url' | 'date';
  showOnCard: boolean;
  showInList: boolean;
  sortable: boolean;
  order: number;
}

const TYPE_OPTIONS: { value: PlayerField['type']; label: string; icon: React.ReactNode }[] = [
  { value: 'text', label: 'Text', icon: <Type className="w-3 h-3" /> },
  { value: 'number', label: 'Number', icon: <Hash className="w-3 h-3" /> },
  { value: 'url', label: 'URL', icon: <Link2 className="w-3 h-3" /> },
  { value: 'date', label: 'Date', icon: <Calendar className="w-3 h-3" /> },
];

export default function PlayerFieldsPage() {
  const params = useParams();
  const auctionId = params.auctionId as string;

  const [fields, setFields] = useState<PlayerField[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const loadConfig = useCallback(async () => {
    try {
      const res = await getDisplayConfig(auctionId);
      const sorted = (res.data?.playerFields || []).sort((a: PlayerField, b: PlayerField) => a.order - b.order);
      setFields(sorted);
    } catch (err) {
      console.error('Load display config error:', err);
    } finally {
      setLoading(false);
    }
  }, [auctionId]);

  useEffect(() => { loadConfig(); }, [loadConfig]);

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg(null);
    try {
      // Re-index order before saving
      const reindexed = fields.map((f, i) => ({ ...f, order: i }));
      await updateDisplayConfig(auctionId, reindexed);
      setFields(reindexed);
      setDirty(false);
      setSaveMsg('Saved successfully');
      setTimeout(() => setSaveMsg(null), 3000);
    } catch (err: any) {
      setSaveMsg(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const updateField = (index: number, updates: Partial<PlayerField>) => {
    setFields(prev => {
      const next = [...prev];
      next[index] = { ...next[index], ...updates };
      return next;
    });
    setDirty(true);
  };

  const moveField = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= fields.length) return;
    setFields(prev => {
      const next = [...prev];
      [next[index], next[newIndex]] = [next[newIndex], next[index]];
      return next.map((f, i) => ({ ...f, order: i }));
    });
    setDirty(true);
  };

  const cardFieldCount = fields.filter(f => f.showOnCard).length;

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ListChecks className="w-5 h-5 text-amber-400" />
            Player Display Fields
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Configure which fields appear on player cards, lists, and the live auction view.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saveMsg && (
            <span className={`text-sm ${saveMsg.startsWith('Error') ? 'text-red-400' : 'text-emerald-400'}`}>
              {saveMsg}
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving || !dirty}
            className="btn-primary text-sm disabled:opacity-40"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {fields.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <ListChecks className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">No Player Fields</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Import players from an Excel/CSV file to auto-detect custom fields.
            All additional columns beyond Name and Role will appear here.
          </p>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="flex flex-wrap gap-4">
            <div className="glass-card px-4 py-3 flex items-center gap-2">
              <span className="text-xs text-slate-400">Total fields:</span>
              <span className="text-sm font-bold text-white">{fields.length}</span>
            </div>
            <div className="glass-card px-4 py-3 flex items-center gap-2">
              <Eye className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs text-slate-400">On Card:</span>
              <span className={`text-sm font-bold ${cardFieldCount > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                {cardFieldCount}
              </span>
            </div>
            <div className="glass-card px-4 py-3 flex items-center gap-2">
              <ArrowUpDown className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs text-slate-400">Sortable:</span>
              <span className="text-sm font-bold text-amber-400">
                {fields.filter(f => f.sortable).length}
              </span>
            </div>
          </div>

          {/* Column headers */}
          <div className="hidden sm:grid grid-cols-[40px_1fr_120px_200px_80px_80px_80px] gap-2 px-4 text-[11px] font-semibold text-slate-500 uppercase">
            <span></span>
            <span>Label</span>
            <span>Type</span>
            <span className="text-center">Visibility</span>
            <span className="text-center">Sort</span>
            <span></span>
            <span></span>
          </div>

          {/* Field rows */}
          <div className="space-y-1">
            {fields.map((field, index) => (
              <div
                key={field.key}
                className="glass-card px-4 py-3 grid grid-cols-1 sm:grid-cols-[40px_1fr_120px_200px_80px_80px_80px] gap-3 sm:gap-2 items-center"
              >
                {/* Drag handle / order */}
                <div className="hidden sm:flex items-center justify-center">
                  <GripVertical className="w-4 h-4 text-slate-600" />
                </div>

                {/* Label (editable) */}
                <div>
                  <input
                    type="text"
                    value={field.label}
                    onChange={e => updateField(index, { label: e.target.value })}
                    className="bg-transparent text-sm font-medium text-white border-b border-transparent hover:border-white/10 focus:border-amber-500/50 focus:outline-none w-full py-0.5 transition-colors"
                  />
                  <span className="text-[10px] text-slate-600 font-mono">{field.key}</span>
                </div>

                {/* Type dropdown */}
                <select
                  value={field.type}
                  onChange={e => updateField(index, { type: e.target.value as PlayerField['type'] })}
                  className="input-field text-xs py-1.5"
                >
                  {TYPE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>

                {/* Visibility toggles */}
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => updateField(index, { showInList: !field.showInList })}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all border ${
                      field.showInList
                        ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                        : 'bg-slate-800/30 border-white/5 text-slate-500'
                    }`}
                    title="Show in player list table"
                  >
                    {field.showInList ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    List
                  </button>
                  <button
                    onClick={() => updateField(index, { showOnCard: !field.showOnCard })}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all border ${
                      field.showOnCard
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        : 'bg-slate-800/30 border-white/5 text-slate-500'
                    }`}
                    title="Show on live auction card"
                  >
                    {field.showOnCard ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    Card
                  </button>
                </div>

                {/* Sortable toggle */}
                <div className="flex justify-center">
                  <button
                    onClick={() => updateField(index, { sortable: !field.sortable })}
                    className={`p-1.5 rounded-md transition-all border ${
                      field.sortable
                        ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                        : 'bg-slate-800/30 border-white/5 text-slate-600'
                    }`}
                    title="Toggle sortable"
                  >
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Move up/down */}
                <div className="flex items-center justify-center gap-1">
                  <button
                    onClick={() => moveField(index, -1)}
                    disabled={index === 0}
                    className="btn-ghost p-1 disabled:opacity-20"
                    title="Move up"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => moveField(index, 1)}
                    disabled={index === fields.length - 1}
                    className="btn-ghost p-1 disabled:opacity-20"
                    title="Move down"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>

                {/* Order badge (mobile) */}
                <div className="sm:hidden flex items-center gap-2">
                  <span className="text-[10px] text-slate-500">Order: {index + 1}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Sticky save bar when dirty */}
          {dirty && (
            <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-sm border-t border-white/5 p-4 flex items-center justify-center gap-4 z-40">
              <span className="text-sm text-slate-400">You have unsaved changes</span>
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary text-sm"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
