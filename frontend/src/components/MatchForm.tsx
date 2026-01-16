import React, { useState, useEffect } from 'react';
// @ts-ignore
import { Calendar, Clock, MapPin, Users, Trophy, Edit3, Navigation, Link, Tag, CheckCircle } from 'lucide-react';

interface MatchFormData {
  date: string;
  time: string;
  slot: 'morning' | 'evening' | 'night' | 'custom';
  ground: string;
  locationLink: string;
  opponent: string;
  cricHeroesMatchId: string;
  notes: string;
  status: 'draft' | 'confirmed' | 'cancelled' | 'completed';
  matchType: 'practice' | 'tournament' | 'friendly';
}

interface MatchFormProps {
  initialData?: Partial<MatchFormData>;
  onSubmit: (data: MatchFormData) => void;
  onCancel: () => void;
  loading?: boolean;
  mode: 'create' | 'edit';
}

const MatchForm: React.FC<MatchFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  loading = false,
  mode
}) => {
  const [formData, setFormData] = useState<MatchFormData>({
    date: '',
    time: '',
    slot: 'morning',
    ground: '',
    locationLink: '',
    opponent: '',
    cricHeroesMatchId: '',
    notes: '',
    status: 'draft',
    matchType: 'practice',
    ...initialData
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    if (!formData.slot) {
      newErrors.slot = 'Slot is required';
    }

    if (!formData.ground.trim()) {
      newErrors.ground = 'Ground is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleInputChange = (field: keyof MatchFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg mb-4">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black text-white mb-2">
            {mode === 'create' ? 'Create New Match' : 'Edit Match'}
          </h1>
          <p className="text-slate-400">
            {mode === 'create' 
              ? 'Set up a new cricket match and manage squad availability' 
              : 'Update match details and squad information'
            }
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Required Fields Section */}
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-emerald-400" />
              Required Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Match Date *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  className={`w-full px-4 py-3 bg-slate-700/50 border rounded-lg text-white placeholder-slate-400 transition-all ${
                    errors.date 
                      ? 'border-rose-500 focus:ring-rose-500/20' 
                      : 'border-slate-600 focus:border-emerald-500 focus:ring-emerald-500/20'
                  } focus:outline-none focus:ring-2`}
                />
                {errors.date && (
                  <p className="mt-1 text-xs text-rose-400">{errors.date}</p>
                )}
              </div>

              {/* Slot */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Time Slot *
                </label>
                <select
                  value={formData.slot}
                  onChange={(e) => handleInputChange('slot', e.target.value as any)}
                  className={`w-full px-4 py-3 bg-slate-700/50 border rounded-lg text-white transition-all ${
                    errors.slot 
                      ? 'border-rose-500 focus:ring-rose-500/20' 
                      : 'border-slate-600 focus:border-emerald-500 focus:ring-emerald-500/20'
                  } focus:outline-none focus:ring-2`}
                >
                  <option value="morning">Morning (6AM - 12PM)</option>
                  <option value="evening">Evening (12PM - 6PM)</option>
                  <option value="night">Night (6PM - 12AM)</option>
                  <option value="custom">Custom Time</option>
                </select>
                {errors.slot && (
                  <p className="mt-1 text-xs text-rose-400">{errors.slot}</p>
                )}
              </div>

              {/* Custom Time (shown only when custom slot is selected) */}
              {formData.slot === 'custom' && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Custom Time
                  </label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) => handleInputChange('time', e.target.value)}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 transition-all focus:border-emerald-500 focus:ring-emerald-500/20 focus:outline-none focus:ring-2"
                  />
                </div>
              )}

              {/* Ground */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Ground *
                </label>
                <input
                  type="text"
                  value={formData.ground}
                  onChange={(e) => handleInputChange('ground', e.target.value)}
                  placeholder="e.g., Main Ground, Practice Ground"
                  className={`w-full px-4 py-3 bg-slate-700/50 border rounded-lg text-white placeholder-slate-400 transition-all ${
                    errors.ground 
                      ? 'border-rose-500 focus:ring-rose-500/20' 
                      : 'border-slate-600 focus:border-emerald-500 focus:ring-emerald-500/20'
                  } focus:outline-none focus:ring-2`}
                />
                {errors.ground && (
                  <p className="mt-1 text-xs text-rose-400">{errors.ground}</p>
                )}
              </div>

              {/* Location Link */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <Navigation className="w-4 h-4 inline mr-1" />
                  Google Maps Location Link
                </label>
                <input
                  type="url"
                  value={formData.locationLink}
                  onChange={(e) => handleInputChange('locationLink', e.target.value)}
                  placeholder="https://maps.google.com/... or https://goo.gl/maps/..."
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 transition-all focus:border-emerald-500 focus:ring-emerald-500/20 focus:outline-none focus:ring-2"
                />
                <p className="mt-1 text-xs text-slate-500">Paste Google Maps link for easy directions</p>
              </div>
            </div>
          </div>

          {/* Match Settings Section */}
          <div className="bg-slate-800/30 backdrop-blur-xl rounded-2xl border border-white/5 p-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Tag className="w-5 h-5 text-slate-400" />
              Match Settings
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Match Type */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <Trophy className="w-4 h-4 inline mr-1" />
                  Match Type
                </label>
                <select
                  value={formData.matchType}
                  onChange={(e) => handleInputChange('matchType', e.target.value as any)}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white transition-all focus:border-emerald-500 focus:ring-emerald-500/20 focus:outline-none focus:ring-2"
                >
                  <option value="practice">🏏 Practice Match</option>
                  <option value="tournament">🏆 Tournament Match</option>
                  <option value="friendly">🤝 Friendly Match</option>
                </select>
              </div>

              {/* Match Status */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <CheckCircle className="w-4 h-4 inline mr-1" />
                  Match Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value as any)}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white transition-all focus:border-emerald-500 focus:ring-emerald-500/20 focus:outline-none focus:ring-2"
                >
                  <option value="draft">📝 Draft</option>
                  <option value="confirmed">✅ Confirmed</option>
                  <option value="completed">🏁 Completed</option>
                  <option value="cancelled">❌ Cancelled</option>
                </select>
              </div>
            </div>
          </div>

          {/* Optional Fields Section */}
          <div className="bg-slate-800/30 backdrop-blur-xl rounded-2xl border border-white/5 p-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-slate-400" />
              Additional Information
            </h2>
            
            <div className="space-y-4">
              {/* Opponent */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Opponent Team (Match Name)
                </label>
                <input
                  type="text"
                  value={formData.opponent}
                  onChange={(e) => handleInputChange('opponent', e.target.value)}
                  placeholder="e.g., Warriors Cricket Club (leave empty for 'Practice Match')"
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 transition-all focus:border-emerald-500 focus:ring-emerald-500/20 focus:outline-none focus:ring-2"
                />
                <p className="mt-1 text-xs text-slate-500">If left empty, will display as "Practice Match"</p>
              </div>

              {/* CricHeroes Match ID */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  CricHeroes Match ID
                </label>
                <input
                  type="text"
                  value={formData.cricHeroesMatchId}
                  onChange={(e) => handleInputChange('cricHeroesMatchId', e.target.value)}
                  placeholder="Optional: Link to CricHeroes match"
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 transition-all focus:border-emerald-500 focus:ring-emerald-500/20 focus:outline-none focus:ring-2"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Match Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Additional information about the match..."
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 transition-all focus:border-emerald-500 focus:ring-emerald-500/20 focus:outline-none focus:ring-2 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium rounded-lg transition-all duration-200 shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {mode === 'create' ? 'Creating...' : 'Updating...'}
                </span>
              ) : (
                <span>{mode === 'create' ? 'Create Match' : 'Update Match'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MatchForm;
