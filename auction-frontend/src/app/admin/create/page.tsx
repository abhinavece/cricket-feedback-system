'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createAuction, getBidIncrementPresets } from '@/lib/api';
import { ArrowLeft, ArrowRight, Gavel, Settings, Check, Loader2 } from 'lucide-react';
import Link from 'next/link';

const STEPS = ['Basics', 'Configuration', 'Review'];

const PRESET_OPTIONS = [
  { id: 'budget', label: 'Budget', desc: 'Small increments for budget-friendly auctions', icon: '💰' },
  { id: 'standard', label: 'Standard', desc: 'Balanced increments for most auctions', icon: '⚡' },
  { id: 'premium', label: 'Premium', desc: 'Larger increments for high-stakes auctions', icon: '🏆' },
];

export default function CreateAuctionPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    description: '',
    basePrice: 500000,
    purseValue: 10000000,
    minSquadSize: 11,
    maxSquadSize: 18,
    bidIncrementPreset: 'standard',
    retentionEnabled: true,
    maxRetentions: 3,
  });

  const updateForm = (key: string, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setError(null);
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)} Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(0)} Lakh`;
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const canProceed = () => {
    if (step === 0) return form.name.trim().length >= 3;
    if (step === 1) return form.basePrice > 0 && form.purseValue > 0 && form.minSquadSize > 0 && form.maxSquadSize >= form.minSquadSize;
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await createAuction({
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
        },
      });
      router.push(`/admin/${res.data._id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create auction');
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Back link */}
      <Link href="/admin" className="btn-ghost text-sm mb-6 -ml-2">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Create New Auction</h1>
      <p className="text-slate-400 mb-8">Set up your cricket player auction in a few steps</p>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-10">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2 flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
              i < step ? 'bg-emerald-500 text-white' :
              i === step ? 'bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30' :
              'bg-slate-800 text-slate-500 border border-white/10'
            }`}>
              {i < step ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            <span className={`text-sm font-medium hidden sm:block ${i <= step ? 'text-white' : 'text-slate-500'}`}>
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-px mx-2 ${i < step ? 'bg-emerald-500' : 'bg-slate-800'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="glass-card p-6 sm:p-8">
        {/* Step 0: Basics */}
        {step === 0 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Auction Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => updateForm('name', e.target.value)}
                placeholder="e.g., Mavericks Premier League 2025"
                className="input-field"
                autoFocus
              />
              <p className="text-xs text-slate-500 mt-1.5">Min 3 characters. This will be visible to all participants.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Description (optional)</label>
              <textarea
                value={form.description}
                onChange={(e) => updateForm('description', e.target.value)}
                placeholder="Brief description of your auction..."
                rows={3}
                className="input-field resize-none"
              />
            </div>
          </div>
        )}

        {/* Step 1: Configuration */}
        {step === 1 && (
          <div className="space-y-8 animate-fade-in">
            {/* Purse & Base Price */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Base Price *</label>
                <input
                  type="number"
                  value={form.basePrice}
                  onChange={(e) => updateForm('basePrice', parseInt(e.target.value) || 0)}
                  className="input-field"
                  min={0}
                />
                <p className="text-xs text-slate-500 mt-1.5">{formatCurrency(form.basePrice)} per player</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Team Purse Value *</label>
                <input
                  type="number"
                  value={form.purseValue}
                  onChange={(e) => updateForm('purseValue', parseInt(e.target.value) || 0)}
                  className="input-field"
                  min={0}
                />
                <p className="text-xs text-slate-500 mt-1.5">{formatCurrency(form.purseValue)} per team</p>
              </div>
            </div>

            {/* Squad Size */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Min Squad Size *</label>
                <input
                  type="number"
                  value={form.minSquadSize}
                  onChange={(e) => updateForm('minSquadSize', parseInt(e.target.value) || 1)}
                  className="input-field"
                  min={1}
                  max={30}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Max Squad Size *</label>
                <input
                  type="number"
                  value={form.maxSquadSize}
                  onChange={(e) => updateForm('maxSquadSize', parseInt(e.target.value) || 1)}
                  className="input-field"
                  min={form.minSquadSize}
                  max={30}
                />
              </div>
            </div>

            {/* Bid Increment Preset */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">Bid Increment Preset</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {PRESET_OPTIONS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => updateForm('bidIncrementPreset', preset.id)}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      form.bidIncrementPreset === preset.id
                        ? 'border-amber-500/50 bg-amber-500/10 shadow-lg shadow-amber-500/10'
                        : 'border-white/10 bg-slate-800/30 hover:border-white/20'
                    }`}
                  >
                    <div className="text-xl mb-2">{preset.icon}</div>
                    <div className={`text-sm font-semibold mb-1 ${form.bidIncrementPreset === preset.id ? 'text-amber-400' : 'text-white'}`}>
                      {preset.label}
                    </div>
                    <div className="text-xs text-slate-400">{preset.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Retention toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/30 border border-white/5">
              <div>
                <div className="text-sm font-medium text-white">Player Retention</div>
                <div className="text-xs text-slate-400 mt-0.5">Allow teams to retain players before auction</div>
              </div>
              <button
                type="button"
                onClick={() => updateForm('retentionEnabled', !form.retentionEnabled)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  form.retentionEnabled ? 'bg-amber-500' : 'bg-slate-700'
                }`}
              >
                <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform shadow-sm ${
                  form.retentionEnabled ? 'translate-x-5' : ''
                }`} />
              </button>
            </div>

            {form.retentionEnabled && (
              <div className="ml-4 animate-fade-in">
                <label className="block text-sm font-medium text-slate-300 mb-2">Max Retentions Per Team</label>
                <input
                  type="number"
                  value={form.maxRetentions}
                  onChange={(e) => updateForm('maxRetentions', parseInt(e.target.value) || 0)}
                  className="input-field w-32"
                  min={0}
                  max={10}
                />
              </div>
            )}
          </div>
        )}

        {/* Step 2: Review */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center mb-2">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-amber-500/20">
                <Gavel className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white">Review Your Auction</h2>
            </div>

            <div className="space-y-3">
              {[
                { label: 'Name', value: form.name },
                { label: 'Description', value: form.description || '—' },
                { label: 'Base Price', value: formatCurrency(form.basePrice) },
                { label: 'Team Purse', value: formatCurrency(form.purseValue) },
                { label: 'Squad Size', value: `${form.minSquadSize} – ${form.maxSquadSize} players` },
                { label: 'Bid Preset', value: PRESET_OPTIONS.find(p => p.id === form.bidIncrementPreset)?.label || form.bidIncrementPreset },
                { label: 'Retention', value: form.retentionEnabled ? `Enabled (max ${form.maxRetentions})` : 'Disabled' },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
                  <span className="text-sm text-slate-400">{item.label}</span>
                  <span className="text-sm font-medium text-white">{item.value}</span>
                </div>
              ))}
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                {error}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between mt-6">
        <button
          onClick={() => setStep(Math.max(0, step - 1))}
          className={`btn-ghost ${step === 0 ? 'invisible' : ''}`}
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        {step < STEPS.length - 1 ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={!canProceed()}
            className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting || !canProceed()}
            className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</>
            ) : (
              <><Settings className="w-4 h-4" /> Create Auction</>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
