/**
 * @fileoverview Team Onboarding Component
 * 
 * Wizard-style onboarding flow for new users to either:
 * 1. Create a new team (for team organizers/captains)
 * 2. Join an existing team (for players with an invite link)
 * 
 * Industry best practice: Clear separation between creating and joining,
 * with messaging to prevent duplicate team creation.
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
  UserPlus,
  Link,
  AlertCircle,
} from 'lucide-react';
import { useOrganization } from '../contexts/OrganizationContext';

interface TeamOnboardingProps {
  onComplete: () => void;
  onCancel?: () => void;
  // If provided, skip choice and go directly to join flow
  inviteCode?: string;
}

type OnboardingStep = 'choice' | 'create-info' | 'create-form' | 'create-success' | 'join-info' | 'join-code';

const TeamOnboarding: React.FC<TeamOnboardingProps> = ({ onComplete, onCancel, inviteCode }) => {
  const { createOrganization } = useOrganization();
  const [step, setStep] = useState<OnboardingStep>(inviteCode ? 'join-code' : 'choice');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [teamName, setTeamName] = useState('');
  const [description, setDescription] = useState('');
  const [joinCode, setJoinCode] = useState(inviteCode || '');

  const handleCreateTeam = async () => {
    if (!teamName.trim()) {
      setError('Team name is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      await createOrganization(teamName.trim(), description.trim() || undefined);
      
      setStep('create-success');
    } catch (err: any) {
      setError(err.message || 'Failed to create team');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinWithCode = async () => {
    if (!joinCode.trim()) {
      setError('Please enter an invite code');
      return;
    }

    // Clean the code - handle both full URLs and just codes
    let code = joinCode.trim();
    if (code.includes('/invite/')) {
      code = code.split('/invite/')[1].split(/[?#]/)[0];
    }

    // Redirect to the invite page which will handle the join flow
    window.location.href = `/invite/${code}`;
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
        {/* Progress indicator - only for multi-step flows */}
        {(step.startsWith('create-') && step !== 'choice') && (
          <div className="flex items-center justify-center gap-2 mb-8">
            {['create-info', 'create-form', 'create-success'].map((s, i) => (
              <div
                key={s}
                className={`h-2 rounded-full transition-all duration-300 ${
                  s === step
                    ? 'w-8 bg-emerald-500'
                    : ['create-info', 'create-form', 'create-success'].indexOf(step) > i
                    ? 'w-2 bg-emerald-500'
                    : 'w-2 bg-slate-600'
                }`}
              />
            ))}
          </div>
        )}

        <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          
          {/* Step: Choice - Create or Join */}
          {step === 'choice' && (
            <div className="p-8">
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-3">
                  Welcome to CricSmart!
                </h1>
                <p className="text-slate-400 max-w-md mx-auto">
                  Let's get you set up. Are you starting a new team or joining an existing one?
                </p>
              </div>

              {/* Choice Cards */}
              <div className="grid md:grid-cols-2 gap-4 mb-8">
                {/* Create Team Card */}
                <button
                  onClick={() => setStep('create-info')}
                  className="group p-6 bg-slate-700/30 hover:bg-emerald-500/10 border border-slate-600 hover:border-emerald-500/50 rounded-xl text-left transition-all duration-300"
                >
                  <div className="w-12 h-12 bg-emerald-500/20 group-hover:bg-emerald-500/30 rounded-xl flex items-center justify-center mb-4 transition-colors">
                    <Building2 className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Create a Team</h3>
                  <p className="text-sm text-slate-400 mb-4">
                    I'm starting fresh or I'm the captain/organizer setting up my team.
                  </p>
                  <div className="flex items-center text-emerald-400 text-sm font-medium group-hover:gap-2 transition-all">
                    Get Started <ChevronRight className="w-4 h-4 ml-1" />
                  </div>
                </button>

                {/* Join Team Card */}
                <button
                  onClick={() => setStep('join-info')}
                  className="group p-6 bg-slate-700/30 hover:bg-blue-500/10 border border-slate-600 hover:border-blue-500/50 rounded-xl text-left transition-all duration-300"
                >
                  <div className="w-12 h-12 bg-blue-500/20 group-hover:bg-blue-500/30 rounded-xl flex items-center justify-center mb-4 transition-colors">
                    <UserPlus className="w-6 h-6 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Join a Team</h3>
                  <p className="text-sm text-slate-400 mb-4">
                    My team already exists and I have an invite link from my admin.
                  </p>
                  <div className="flex items-center text-blue-400 text-sm font-medium group-hover:gap-2 transition-all">
                    Enter Invite Code <ChevronRight className="w-4 h-4 ml-1" />
                  </div>
                </button>
              </div>

              {/* Important Notice */}
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-amber-200 font-medium mb-1">
                    Already have a team on CricSmart?
                  </p>
                  <p className="text-xs text-amber-300/80">
                    Don't create a new team! Ask your team admin to send you an invite link. 
                    Creating duplicate teams will cause confusion.
                  </p>
                </div>
              </div>

              {onCancel && (
                <button
                  onClick={onCancel}
                  className="w-full mt-6 px-6 py-3 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-xl transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          )}

          {/* Step: Create Info */}
          {step === 'create-info' && (
            <div className="p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Create Your Team
                </h2>
                <p className="text-slate-400">
                  Set up your cricket team in seconds
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
                <button
                  onClick={() => setStep('choice')}
                  className="flex items-center justify-center gap-2 px-6 py-3 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-xl transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Back
                </button>
                <button
                  onClick={() => setStep('create-form')}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium rounded-xl transition-all"
                >
                  Continue
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Step: Create Form */}
          {step === 'create-form' && (
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
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
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
                  onClick={() => setStep('create-info')}
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

          {/* Step: Create Success */}
          {step === 'create-success' && (
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

              {/* Invite team members tip */}
              <div className="mt-8 pt-8 border-t border-white/10">
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                  <p className="text-sm text-blue-300 mb-2 font-medium">
                    Next: Invite your teammates
                  </p>
                  <p className="text-xs text-blue-400/80">
                    Go to Team Settings → Invite Links to create invite links for your players.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step: Join Info */}
          {step === 'join-info' && (
            <div className="p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <UserPlus className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Join Your Team
                </h2>
                <p className="text-slate-400">
                  You'll need an invite link from your team admin
                </p>
              </div>

              {/* Info about getting invite */}
              <div className="space-y-4 mb-8">
                <div className="bg-slate-700/30 rounded-xl p-4 flex gap-3">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-400 font-bold">1</span>
                  </div>
                  <div>
                    <p className="text-sm text-white font-medium">Ask your team admin</p>
                    <p className="text-xs text-slate-400">
                      Contact your team captain or organizer who manages the team on CricSmart
                    </p>
                  </div>
                </div>

                <div className="bg-slate-700/30 rounded-xl p-4 flex gap-3">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-400 font-bold">2</span>
                  </div>
                  <div>
                    <p className="text-sm text-white font-medium">Get the invite link</p>
                    <p className="text-xs text-slate-400">
                      They can create one from Team Settings → Invite Links
                    </p>
                  </div>
                </div>

                <div className="bg-slate-700/30 rounded-xl p-4 flex gap-3">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-400 font-bold">3</span>
                  </div>
                  <div>
                    <p className="text-sm text-white font-medium">Enter the code or click the link</p>
                    <p className="text-xs text-slate-400">
                      You'll automatically join the team with the right permissions
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('choice')}
                  className="flex items-center justify-center gap-2 px-6 py-3 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-xl transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Back
                </button>
                <button
                  onClick={() => setStep('join-code')}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium rounded-xl transition-all"
                >
                  I Have an Invite
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Step: Join with Code */}
          {step === 'join-code' && (
            <div className="p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Link className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Enter Invite Code
                </h2>
                <p className="text-slate-400">
                  Paste the invite link or code from your team admin
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <div className="mb-8">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Invite Link or Code
                </label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  placeholder="e.g., https://cricsmart.in/invite/abc123 or abc123"
                  className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                  autoFocus
                />
                <p className="mt-2 text-xs text-slate-500">
                  You can paste the full link or just the code
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => inviteCode ? (onCancel ? onCancel() : null) : setStep('join-info')}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 px-6 py-3 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-xl transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Back
                </button>
                <button
                  onClick={handleJoinWithCode}
                  disabled={loading || !joinCode.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Joining...
                    </>
                  ) : (
                    <>
                      Join Team
                      <ChevronRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>

              {/* Don't have invite? */}
              <div className="mt-6 pt-6 border-t border-white/10 text-center">
                <p className="text-sm text-slate-500">
                  Don't have an invite?{' '}
                  <button 
                    onClick={() => setStep('choice')}
                    className="text-emerald-400 hover:text-emerald-300 font-medium"
                  >
                    Create your own team
                  </button>
                </p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default TeamOnboarding;
