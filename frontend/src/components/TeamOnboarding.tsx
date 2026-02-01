/**
 * @fileoverview Team Onboarding Component
 * 
 * Wizard-style onboarding flow for creating a new team/organization.
 * Guides users through team setup with name, description, and optional settings.
 */

import React, { useState } from 'react';
import {
  Building2,
  Users,
  ChevronRight,
  ChevronLeft,
  Check,
  Loader2,
  Sparkles,
  Trophy,
  Calendar,
  MessageSquare,
} from 'lucide-react';
import { useOrganization } from '../contexts/OrganizationContext';

interface TeamOnboardingProps {
  onComplete: () => void;
  onCancel?: () => void;
}

const TeamOnboarding: React.FC<TeamOnboardingProps> = ({ onComplete, onCancel }) => {
  const { createOrganization } = useOrganization();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [teamName, setTeamName] = useState('');
  const [description, setDescription] = useState('');

  const handleCreateTeam = async () => {
    if (!teamName.trim()) {
      setError('Team name is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      await createOrganization(teamName.trim(), description.trim() || undefined);
      
      setStep(3); // Success step
    } catch (err: any) {
      setError(err.message || 'Failed to create team');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: Users, title: 'Player Management', desc: 'Track your squad and availability' },
    { icon: Calendar, title: 'Match Scheduling', desc: 'Organize matches and track stats' },
    { icon: MessageSquare, title: 'WhatsApp Integration', desc: 'Send updates directly to players' },
    { icon: Trophy, title: 'Performance Tracking', desc: 'Collect and analyze feedback' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all duration-300 ${
                s === step
                  ? 'w-8 bg-emerald-500'
                  : s < step
                  ? 'w-2 bg-emerald-500'
                  : 'w-2 bg-slate-600'
              }`}
            />
          ))}
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          {/* Step 1: Welcome */}
          {step === 1 && (
            <div className="p-8">
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-3">
                  Create Your Team
                </h1>
                <p className="text-slate-400 max-w-md mx-auto">
                  Set up your cricket team in seconds. Manage players, schedule matches, 
                  and keep everyone in sync with WhatsApp.
                </p>
              </div>

              {/* Feature highlights */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-4 bg-slate-700/30 rounded-xl"
                  >
                    <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">{feature.title}</div>
                      <div className="text-xs text-slate-400">{feature.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                {onCancel && (
                  <button
                    onClick={onCancel}
                    className="flex-1 px-6 py-3 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                )}
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium rounded-xl transition-all"
                >
                  Get Started
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Team Details */}
          {step === 2 && (
            <div className="p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Team Details
                </h2>
                <p className="text-slate-400">
                  Give your team a name and optional description
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-6 mb-8">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Team Name *
                  </label>
                  <input
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="e.g., Mavericks XI, Street Kings CC"
                    className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                    autoFocus
                  />
                  <p className="mt-2 text-xs text-slate-500">
                    This will be visible to all team members
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Description (optional)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Tell us about your team..."
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 px-6 py-3 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-xl transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Back
                </button>
                <button
                  onClick={handleCreateTeam}
                  disabled={loading || !teamName.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      Create Team
                      <ChevronRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Success */}
          {step === 3 && (
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 text-white" />
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-3">
                Team Created!
              </h2>
              <p className="text-slate-400 mb-8 max-w-md mx-auto">
                <span className="text-emerald-400 font-medium">{teamName}</span> is ready to go. 
                Start by adding your players and scheduling your first match.
              </p>

              <div className="space-y-3">
                <button
                  onClick={onComplete}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium rounded-xl transition-all"
                >
                  Go to Dashboard
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Quick tips */}
              <div className="mt-8 pt-8 border-t border-white/10">
                <p className="text-sm text-slate-400 mb-4">Quick tips to get started:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <span className="px-3 py-1 bg-slate-700/50 rounded-full text-xs text-slate-300">
                    Add players
                  </span>
                  <span className="px-3 py-1 bg-slate-700/50 rounded-full text-xs text-slate-300">
                    Create a match
                  </span>
                  <span className="px-3 py-1 bg-slate-700/50 rounded-full text-xs text-slate-300">
                    Send availability requests
                  </span>
                  <span className="px-3 py-1 bg-slate-700/50 rounded-full text-xs text-slate-300">
                    Connect WhatsApp
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamOnboarding;
