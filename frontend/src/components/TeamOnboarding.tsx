/**
 * @fileoverview Team Onboarding Component
 * 
 * Wizard-style onboarding flow for new users to either:
 * 1. Create a new team (for team organizers/captains)
 * 2. Find and request to join an existing team
 * 3. Join via invite link (for players with invite)
 * 
 * Industry best practice: Clear separation between creating and joining,
 * with messaging to prevent duplicate team creation.
 */

import React, { useState, useCallback } from 'react';
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
  Search,
  HelpCircle,
  CheckCircle,
  Clock,
  Zap,
  Shield,
  BarChart3,
} from 'lucide-react';
import { getHomepageUrl } from '../utils/domain';
import { useOrganization } from '../contexts/OrganizationContext';
import {
  searchOrganizations,
  lookupOrganizationByCricHeroesId,
  requestToJoinOrganization,
  SearchedOrganization,
} from '../services/api';
import { isFeatureEnabled } from '../config/featureFlags';

interface TeamOnboardingProps {
  onComplete: () => void;
  onCancel?: () => void;
  // If provided, skip choice and go directly to join flow
  inviteCode?: string;
}

type OnboardingStep = 
  | 'choice' 
  | 'create-info' 
  | 'create-form' 
  | 'create-success' 
  | 'join-options'
  | 'join-search'
  | 'join-cricheroes'
  | 'join-code'
  | 'request-sent';

const TeamOnboarding: React.FC<TeamOnboardingProps> = ({ onComplete, onCancel, inviteCode }) => {
  const { createOrganization } = useOrganization();
  const [step, setStep] = useState<OnboardingStep>(inviteCode ? 'join-code' : 'choice');
  
  // Check if team discovery feature is enabled
  const isTeamDiscoveryEnabled = isFeatureEnabled('TEAM_DISCOVERY');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Form state
  const [teamName, setTeamName] = useState('');
  const [description, setDescription] = useState('');
  const [joinCode, setJoinCode] = useState(inviteCode || '');
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchedOrganization[]>([]);
  const [searching, setSearching] = useState(false);
  const [cricHeroesId, setCricHeroesId] = useState('');
  const [foundTeam, setFoundTeam] = useState<SearchedOrganization | null>(null);
  const [requestMessage, setRequestMessage] = useState('');
  const [showCricHeroesGuide, setShowCricHeroesGuide] = useState(false);

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

  // Search for teams by name
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setError('Please enter at least 2 characters to search');
      return;
    }

    try {
      setSearching(true);
      setError(null);
      
      const result = await searchOrganizations(searchQuery.trim());
      setSearchResults(result.organizations);
      
      if (result.organizations.length === 0) {
        setError('No teams found. Try a different search or create your own team.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to search');
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, [searchQuery]);

  // Lookup team by CricHeroes ID
  const handleCricHeroesLookup = async () => {
    if (!cricHeroesId.trim()) {
      setError('Please enter a CricHeroes Team ID');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setFoundTeam(null);
      
      const result = await lookupOrganizationByCricHeroesId(cricHeroesId.trim());
      setFoundTeam(result.organization);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Team not found');
    } finally {
      setLoading(false);
    }
  };

  // Request to join a team
  const handleRequestToJoin = async (team: SearchedOrganization, method: 'search' | 'cricheroes_id') => {
    try {
      setLoading(true);
      setError(null);
      
      await requestToJoinOrganization(team._id, {
        message: requestMessage.trim() || undefined,
        discoveryMethod: method,
      });
      
      setSuccessMessage(`Request sent to ${team.name}!`);
      setStep('request-sent');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to send request');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: Users, title: 'Squad Management', desc: 'Track availability & responses', color: 'emerald' },
    { icon: Calendar, title: 'Match Scheduling', desc: 'Organize fixtures easily', color: 'blue' },
    { icon: MessageSquare, title: 'WhatsApp Updates', desc: 'One-click notifications', color: 'green' },
    { icon: BarChart3, title: 'Feedback & Stats', desc: 'Track performance', color: 'purple' },
  ];

  const steps = [
    { num: 1, title: 'Create Team', desc: 'Name your team' },
    { num: 2, title: 'Add Players', desc: 'Import or add manually' },
    { num: 3, title: 'Schedule Match', desc: 'Create your first match' },
  ];

  const homepageUrl = getHomepageUrl();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header with Logo */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <a 
            href={homepageUrl}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">CricSmart</span>
          </a>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Secure Setup</span>
          </div>
        </div>
      </header>

      <div className="pt-20 pb-8 px-4 flex items-center justify-center min-h-screen">
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
            <div className="p-6 sm:p-8">
              {/* Welcome Header */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-sm font-medium mb-4">
                  <Sparkles className="w-4 h-4" />
                  Welcome to CricSmart
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                  Smart Cricket Team Management
                </h1>
                <p className="text-slate-400 text-sm sm:text-base">
                  Everything you need to run your cricket team efficiently
                </p>
              </div>

              {/* What you can do - Visual Features */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {features.map((feature, i) => (
                  <div key={i} className="text-center p-3 bg-slate-700/20 rounded-xl">
                    <div className={`w-10 h-10 mx-auto mb-2 rounded-lg flex items-center justify-center ${
                      feature.color === 'emerald' ? 'bg-emerald-500/20' :
                      feature.color === 'blue' ? 'bg-blue-500/20' :
                      feature.color === 'green' ? 'bg-green-500/20' : 'bg-purple-500/20'
                    }`}>
                      <feature.icon className={`w-5 h-5 ${
                        feature.color === 'emerald' ? 'text-emerald-400' :
                        feature.color === 'blue' ? 'text-blue-400' :
                        feature.color === 'green' ? 'text-green-400' : 'text-purple-400'
                      }`} />
                    </div>
                    <p className="text-xs font-medium text-white">{feature.title}</p>
                    <p className="text-xs text-slate-500 hidden sm:block">{feature.desc}</p>
                  </div>
                ))}
              </div>

              {/* Choice Cards */}
              <p className="text-center text-sm text-slate-400 mb-4">How would you like to get started?</p>
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                {/* Create Team Card */}
                <button
                  onClick={() => setStep('create-info')}
                  className="group p-5 bg-gradient-to-br from-emerald-500/10 to-teal-500/5 hover:from-emerald-500/20 hover:to-teal-500/10 border border-emerald-500/30 hover:border-emerald-500/50 rounded-xl text-left transition-all duration-300"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-11 h-11 bg-emerald-500/20 group-hover:bg-emerald-500/30 rounded-xl flex items-center justify-center transition-colors">
                      <Building2 className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-white">I'm a Captain</h3>
                      <p className="text-xs text-slate-400">Create a new team</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-400 mb-3">
                    Set up your team in 30 seconds. Add players, schedule matches, and manage everything.
                  </p>
                  <div className="flex items-center text-emerald-400 text-sm font-medium">
                    Create Team <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>

                {/* Find Team Card */}
                <button
                  onClick={() => setStep('join-options')}
                  className="group p-5 bg-gradient-to-br from-blue-500/10 to-indigo-500/5 hover:from-blue-500/20 hover:to-indigo-500/10 border border-blue-500/30 hover:border-blue-500/50 rounded-xl text-left transition-all duration-300"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-11 h-11 bg-blue-500/20 group-hover:bg-blue-500/30 rounded-xl flex items-center justify-center transition-colors">
                      <UserPlus className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-white">I'm a Player</h3>
                      <p className="text-xs text-slate-400">Join existing team</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-400 mb-3">
                    Got an invite link? Join your team to respond to matches and give feedback.
                  </p>
                  <div className="flex items-center text-blue-400 text-sm font-medium">
                    Join Team <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              </div>

              {/* Important Notice */}
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-amber-200">
                    <span className="font-medium">Already have a team on CricSmart?</span> Ask your admin for an invite link instead of creating a duplicate.
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
            <div className="p-6 sm:p-8">
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-xs font-medium mb-3">
                  <Zap className="w-3 h-3" />
                  Quick Setup
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
                  Here's How It Works
                </h2>
                <p className="text-slate-400 text-sm">
                  Get your team ready in under a minute
                </p>
              </div>

              {/* Visual Steps */}
              <div className="space-y-3 mb-6">
                {steps.map((s, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 bg-slate-700/30 rounded-xl">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                      {s.num}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{s.title}</p>
                      <p className="text-xs text-slate-400">{s.desc}</p>
                    </div>
                    {i < steps.length - 1 && (
                      <ChevronRight className="w-4 h-4 text-slate-600" />
                    )}
                    {i === steps.length - 1 && (
                      <Check className="w-5 h-5 text-emerald-400" />
                    )}
                  </div>
                ))}
              </div>

              {/* What you'll get */}
              <div className="bg-slate-700/20 rounded-xl p-4 mb-6">
                <p className="text-xs font-medium text-slate-300 mb-3">What's included:</p>
                <div className="grid grid-cols-2 gap-2">
                  {['Player roster', 'Match scheduling', 'WhatsApp updates', 'Payment tracking'].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-400">
                      <CheckCircle className="w-3 h-3 text-emerald-400" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('choice')}
                  className="flex items-center justify-center gap-2 px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-xl transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Back
                </button>
                <button
                  onClick={() => setStep('create-form')}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium rounded-xl transition-all"
                >
                  Let's Go
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
                    style={{ fontSize: '16px' }}
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
                    style={{ fontSize: '16px' }}
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

          {/* Step: Join Options */}
          {step === 'join-options' && (
            <div className="p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Find Your Team
                </h2>
                <p className="text-slate-400">
                  Choose how you want to find and join your team
                </p>
              </div>

              {/* Join Options */}
              <div className="space-y-3 mb-8">
                {/* Search by Name - Only if team discovery is enabled */}
                {isTeamDiscoveryEnabled && (
                  <button
                    onClick={() => { setStep('join-search'); setError(null); }}
                    className="w-full flex items-center gap-4 p-4 bg-slate-700/30 hover:bg-blue-500/10 border border-slate-600 hover:border-blue-500/50 rounded-xl text-left transition-all"
                  >
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Search className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">Search by Team Name</p>
                      <p className="text-xs text-slate-400">Find your team by searching its name</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </button>
                )}

                {/* CricHeroes ID - Only if team discovery is enabled */}
                {isTeamDiscoveryEnabled && (
                  <button
                    onClick={() => { setStep('join-cricheroes'); setError(null); }}
                    className="w-full flex items-center gap-4 p-4 bg-slate-700/30 hover:bg-purple-500/10 border border-slate-600 hover:border-purple-500/50 rounded-xl text-left transition-all"
                  >
                    <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Trophy className="w-5 h-5 text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">Use CricHeroes Team ID</p>
                      <p className="text-xs text-slate-400">Find team using CricHeroes app integration</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </button>
                )}

                {/* Invite Code - Always visible */}
                <button
                  onClick={() => { setStep('join-code'); setError(null); }}
                  className="w-full flex items-center gap-4 p-4 bg-slate-700/30 hover:bg-emerald-500/10 border border-slate-600 hover:border-emerald-500/50 rounded-xl text-left transition-all"
                >
                  <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Link className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">I Have an Invite Link</p>
                    <p className="text-xs text-slate-400">Join instantly with a link from your team admin</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </button>

                {/* Coming Soon notice when team discovery is disabled */}
                {!isTeamDiscoveryEnabled && (
                  <div className="p-4 bg-slate-700/20 border border-slate-600 rounded-xl">
                    <p className="text-sm text-slate-400 text-center">
                      🚀 Team search coming soon! For now, ask your team admin for an invite link.
                    </p>
                  </div>
                )}
              </div>

              <button
                onClick={() => setStep('choice')}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-xl transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
                Back
              </button>
            </div>
          )}

          {/* Step: Search by Name */}
          {step === 'join-search' && (
            <div className="p-8">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Search for Your Team
                </h2>
                <p className="text-slate-400 text-sm">
                  Enter your team's name to find and request to join
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              {/* Search Input */}
              <div className="mb-6">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Enter team name..."
                    className="flex-1 px-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    style={{ fontSize: '16px' }}
                    autoFocus
                  />
                  <button
                    onClick={handleSearch}
                    disabled={searching || searchQuery.trim().length < 2}
                    className="px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-600 text-white font-medium rounded-xl transition-colors"
                  >
                    {searching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="mb-6 max-h-64 overflow-y-auto space-y-2">
                  {searchResults.map((team) => (
                    <div
                      key={team._id}
                      className="p-4 bg-slate-700/30 border border-slate-600 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white truncate">{team.name}</p>
                          <p className="text-xs text-slate-400">
                            {team.stats.playerCount} players · {team.stats.memberCount} members
                          </p>
                        </div>
                        {team.isMember ? (
                          <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-medium rounded-full">
                            Member
                          </span>
                        ) : team.hasPendingRequest ? (
                          <span className="px-3 py-1 bg-amber-500/20 text-amber-400 text-xs font-medium rounded-full flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Pending
                          </span>
                        ) : (
                          <button
                            onClick={() => handleRequestToJoin(team, 'search')}
                            disabled={loading}
                            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
                          >
                            Request to Join
                          </button>
                        )}
                      </div>
                      {team.description && (
                        <p className="mt-2 text-xs text-slate-400 line-clamp-2">{team.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => { setStep('join-options'); setSearchResults([]); setSearchQuery(''); setError(null); }}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-xl transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
                Back
              </button>
            </div>
          )}

          {/* Step: CricHeroes Lookup */}
          {step === 'join-cricheroes' && (
            <div className="p-8">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Trophy className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Find via CricHeroes
                </h2>
                <p className="text-slate-400 text-sm">
                  Enter your team's CricHeroes ID to find them
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              {/* CricHeroes ID Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  CricHeroes Team ID
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={cricHeroesId}
                    onChange={(e) => setCricHeroesId(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCricHeroesLookup()}
                    placeholder="e.g., 123456"
                    className="flex-1 px-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    style={{ fontSize: '16px' }}
                    autoFocus
                  />
                  <button
                    onClick={handleCricHeroesLookup}
                    disabled={loading || !cricHeroesId.trim()}
                    className="px-6 py-3 bg-purple-500 hover:bg-purple-600 disabled:bg-slate-600 text-white font-medium rounded-xl transition-colors"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Help link */}
              <button
                onClick={() => setShowCricHeroesGuide(true)}
                className="mb-6 flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300"
              >
                <HelpCircle className="w-4 h-4" />
                How do I find my CricHeroes Team ID?
              </button>

              {/* Found Team */}
              {foundTeam && (
                <div className="mb-6 p-4 bg-slate-700/30 border border-purple-500/30 rounded-xl">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-white">{foundTeam.name}</p>
                      <p className="text-sm text-slate-400">
                        {foundTeam.stats.playerCount} players · {foundTeam.stats.memberCount} members
                      </p>
                    </div>
                  </div>
                  
                  {foundTeam.isMember ? (
                    <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-400 text-sm flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      You're already a member of this team
                    </div>
                  ) : foundTeam.hasPendingRequest ? (
                    <div className="p-3 bg-amber-500/10 rounded-lg text-amber-400 text-sm flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      You have a pending request for this team
                    </div>
                  ) : (
                    <>
                      <textarea
                        value={requestMessage}
                        onChange={(e) => setRequestMessage(e.target.value)}
                        placeholder="Optional: Add a message for the team admin..."
                        rows={2}
                        className="w-full px-3 py-2 mb-3 bg-slate-600/50 border border-white/10 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
                        style={{ fontSize: '16px' }}
                      />
                      <button
                        onClick={() => handleRequestToJoin(foundTeam, 'cricheroes_id')}
                        disabled={loading}
                        className="w-full px-4 py-3 bg-purple-500 hover:bg-purple-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                        Request to Join
                      </button>
                    </>
                  )}
                </div>
              )}

              <button
                onClick={() => { setStep('join-options'); setFoundTeam(null); setCricHeroesId(''); setError(null); }}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-xl transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
                Back
              </button>
            </div>
          )}

          {/* Step: Request Sent Success */}
          {step === 'request-sent' && (
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 text-white" />
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-3">
                Request Sent!
              </h2>
              <p className="text-slate-400 mb-8 max-w-md mx-auto">
                {successMessage || 'Your request has been sent to the team admins. They will review and approve your request.'}
              </p>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6 text-left">
                <p className="text-sm text-blue-300 font-medium mb-1">What happens next?</p>
                <ul className="text-xs text-blue-400/80 space-y-1">
                  <li>• Team admins will review your request</li>
                  <li>• You'll be notified when you're approved</li>
                  <li>• Once approved, you can access the team dashboard</li>
                </ul>
              </div>

              <button
                onClick={() => setStep('choice')}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-slate-700/50 hover:bg-slate-700 text-white font-medium rounded-xl transition-colors"
              >
                Back to Options
              </button>
            </div>
          )}

          {/* CricHeroes Guide Modal */}
          {showCricHeroesGuide && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowCricHeroesGuide(false)}>
              <div className="bg-slate-800 border border-white/10 rounded-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white">Find Your CricHeroes Team ID</h3>
                  <button onClick={() => setShowCricHeroesGuide(false)} className="text-slate-400 hover:text-white">
                    ×
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-purple-400 font-bold text-sm">1</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Open CricHeroes app</p>
                      <p className="text-xs text-slate-400">Launch the CricHeroes app on your phone</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-purple-400 font-bold text-sm">2</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Go to your team page</p>
                      <p className="text-xs text-slate-400">Navigate to your team's profile</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-purple-400 font-bold text-sm">3</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Tap "Share Team"</p>
                      <p className="text-xs text-slate-400">Or look in team settings/info</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-purple-400 font-bold text-sm">4</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Copy the Team ID from the URL</p>
                      <p className="text-xs text-slate-400">
                        The URL will be like: cricheroes.com/team/<span className="text-purple-400 font-mono">123456</span>
                        <br />
                        The number at the end is your Team ID
                      </p>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => setShowCricHeroesGuide(false)}
                  className="mt-6 w-full px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white font-medium rounded-lg transition-colors"
                >
                  Got it
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
                  style={{ fontSize: '16px' }}
                  autoFocus
                />
                <p className="mt-2 text-xs text-slate-500">
                  You can paste the full link or just the code
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => inviteCode ? (onCancel ? onCancel() : null) : setStep('join-options')}
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
    </div>
  );
};

export default TeamOnboarding;
