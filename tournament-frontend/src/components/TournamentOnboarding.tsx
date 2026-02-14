import React, { useState } from 'react';
import {
  Trophy,
  Building2,
  Link,
  ChevronRight,
  ChevronLeft,
  Check,
  Loader2,
  Sparkles,
  Users,
  BarChart3,
  Calendar,
  Gavel,
  Shield,
  Zap,
  AlertCircle,
} from 'lucide-react';
import { organizationApi } from '../services/api';

interface TournamentOnboardingProps {
  onComplete: () => void;
  onCancel?: () => void;
  inviteCode?: string;
}

type OnboardingStep =
  | 'choice'
  | 'create-info'
  | 'create-form'
  | 'create-success'
  | 'join-code'
  | 'join-success';

const TournamentOnboarding: React.FC<TournamentOnboardingProps> = ({
  onComplete,
  onCancel,
  inviteCode,
}) => {
  const [step, setStep] = useState<OnboardingStep>(inviteCode ? 'join-code' : 'choice');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [orgName, setOrgName] = useState('');
  const [description, setDescription] = useState('');
  const [joinCode, setJoinCode] = useState(inviteCode || '');

  const handleCreateOrg = async () => {
    if (!orgName.trim()) {
      setError('Organization name is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await organizationApi.create({
        name: orgName.trim(),
        description: description.trim() || undefined,
      });

      setStep('create-success');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to create organization';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinWithCode = async () => {
    if (!joinCode.trim()) {
      setError('Please enter an invite code');
      return;
    }

    let code = joinCode.trim();
    if (code.includes('/invite/')) {
      code = code.split('/invite/')[1].split(/[?#]/)[0];
    }

    try {
      setLoading(true);
      setError(null);

      await organizationApi.joinWithCode(code);

      setStep('join-success');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Invalid or expired invite code';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: Users, title: 'Player Registration', desc: 'Bulk import & manage players', color: 'emerald' },
    { icon: Calendar, title: 'Scheduling', desc: 'Plan fixtures & matches', color: 'blue' },
    { icon: Gavel, title: 'Auction Support', desc: 'Run player auctions', color: 'amber' },
    { icon: BarChart3, title: 'Analytics', desc: 'Track performance & stats', color: 'purple' },
  ];

  const steps = [
    { num: 1, title: 'Create Organization', desc: 'Name your tournament org' },
    { num: 2, title: 'Create Tournament', desc: 'Set up your first tournament' },
    { num: 3, title: 'Add Players', desc: 'Import or add manually' },
  ];

  const siteUrl = import.meta.env.VITE_SITE_URL || 'https://cricsmart.in';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <a
            href={siteUrl}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">CricSmart</span>
            <span className="text-xs text-violet-400 font-medium uppercase tracking-wider hidden sm:inline">Tournament Hub</span>
          </a>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Secure Setup</span>
          </div>
        </div>
      </header>

      <div className="pt-20 pb-8 px-4 flex items-center justify-center min-h-screen">
        <div className="w-full max-w-2xl">
          {/* Progress indicator for create flow */}
          {step.startsWith('create-') && step !== 'choice' && (
            <div className="flex items-center justify-center gap-2 mb-8">
              {['create-info', 'create-form', 'create-success'].map((s, i) => (
                <div
                  key={s}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    s === step
                      ? 'w-8 bg-violet-500'
                      : ['create-info', 'create-form', 'create-success'].indexOf(step) > i
                      ? 'w-2 bg-violet-500'
                      : 'w-2 bg-slate-600'
                  }`}
                />
              ))}
            </div>
          )}

          <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl">

            {/* Step: Choice — Create or Join */}
            {step === 'choice' && (
              <div className="p-6 sm:p-8">
                {/* Welcome Header */}
                <div className="text-center mb-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-violet-500/10 border border-violet-500/20 rounded-full text-violet-400 text-sm font-medium mb-4">
                    <Sparkles className="w-4 h-4" />
                    Welcome to Tournament Hub
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                    Organize Cricket Tournaments
                  </h1>
                  <p className="text-slate-400 text-sm sm:text-base">
                    Everything you need to run professional cricket tournaments
                  </p>
                </div>

                {/* Features grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                  {features.map((feature, i) => (
                    <div key={i} className="text-center p-3 bg-slate-700/20 rounded-xl">
                      <div className={`w-10 h-10 mx-auto mb-2 rounded-lg flex items-center justify-center ${
                        feature.color === 'emerald' ? 'bg-emerald-500/20' :
                        feature.color === 'blue' ? 'bg-blue-500/20' :
                        feature.color === 'amber' ? 'bg-amber-500/20' : 'bg-purple-500/20'
                      }`}>
                        <feature.icon className={`w-5 h-5 ${
                          feature.color === 'emerald' ? 'text-emerald-400' :
                          feature.color === 'blue' ? 'text-blue-400' :
                          feature.color === 'amber' ? 'text-amber-400' : 'text-purple-400'
                        }`} />
                      </div>
                      <p className="text-xs font-medium text-white">{feature.title}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{feature.desc}</p>
                    </div>
                  ))}
                </div>

                {/* Choice buttons */}
                <div className="space-y-3">
                  <button
                    onClick={() => setStep('create-info')}
                    className="w-full group flex items-center gap-4 p-4 bg-slate-700/30 hover:bg-violet-500/10 border border-slate-600/50 hover:border-violet-500/30 rounded-xl transition-all"
                  >
                    <div className="w-12 h-12 bg-violet-500/20 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-violet-500/30 transition-colors">
                      <Building2 className="w-6 h-6 text-violet-400" />
                    </div>
                    <div className="text-left flex-1">
                      <h3 className="font-semibold text-white group-hover:text-violet-300 transition-colors">
                        Create Tournament Organization
                      </h3>
                      <p className="text-sm text-slate-400">
                        I'm an organizer — set up my tournament workspace
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-violet-400 transition-colors" />
                  </button>

                  <button
                    onClick={() => setStep('join-code')}
                    className="w-full group flex items-center gap-4 p-4 bg-slate-700/30 hover:bg-emerald-500/10 border border-slate-600/50 hover:border-emerald-500/30 rounded-xl transition-all"
                  >
                    <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-500/30 transition-colors">
                      <Link className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div className="text-left flex-1">
                      <h3 className="font-semibold text-white group-hover:text-emerald-300 transition-colors">
                        Join with Invite Code
                      </h3>
                      <p className="text-sm text-slate-400">
                        I have an invite from a tournament organizer
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                  </button>
                </div>

                {onCancel && (
                  <button
                    onClick={onCancel}
                    className="w-full mt-4 text-sm text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    Go back
                  </button>
                )}
              </div>
            )}

            {/* Step: Create Info — Why create */}
            {step === 'create-info' && (
              <div className="p-6 sm:p-8">
                <button
                  onClick={() => { setStep('choice'); setError(null); }}
                  className="flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors mb-6"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>

                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-violet-500/20">
                    <Trophy className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
                    How It Works
                  </h2>
                  <p className="text-slate-400 text-sm">
                    Get your tournament up and running in 3 simple steps
                  </p>
                </div>

                <div className="space-y-4 mb-8">
                  {steps.map((s) => (
                    <div key={s.num} className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-violet-500/20 rounded-lg flex items-center justify-center flex-shrink-0 text-violet-400 font-bold text-sm">
                        {s.num}
                      </div>
                      <div>
                        <h3 className="font-medium text-white">{s.title}</h3>
                        <p className="text-sm text-slate-400">{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-violet-500/5 border border-violet-500/20 rounded-xl p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <Zap className="w-5 h-5 text-violet-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-violet-300">You'll be the Admin</p>
                      <p className="text-xs text-slate-400 mt-1">
                        As the creator, you'll have full control. You can invite co-admins and manage all tournament settings.
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setStep('create-form')}
                  className="w-full py-3 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-violet-500/25 flex items-center justify-center gap-2"
                >
                  Continue
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Step: Create Form */}
            {step === 'create-form' && (
              <div className="p-6 sm:p-8">
                <button
                  onClick={() => { setStep('create-info'); setError(null); }}
                  className="flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors mb-6"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>

                <div className="text-center mb-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
                    Name Your Organization
                  </h2>
                  <p className="text-slate-400 text-sm">
                    This is your tournament workspace — you can create multiple tournaments inside it
                  </p>
                </div>

                {error && (
                  <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl mb-4">
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <p className="text-sm text-red-300">{error}</p>
                  </div>
                )}

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Organization Name *
                    </label>
                    <input
                      type="text"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      placeholder="e.g., Mumbai Cricket League, Sunday Smashers"
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder:text-slate-500 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all outline-none"
                      autoFocus
                      onKeyDown={(e) => e.key === 'Enter' && handleCreateOrg()}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Description <span className="text-slate-500">(optional)</span>
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Brief description of your tournament organization..."
                      rows={3}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder:text-slate-500 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all outline-none resize-none"
                    />
                  </div>
                </div>

                <button
                  onClick={handleCreateOrg}
                  disabled={loading || !orgName.trim()}
                  className="w-full py-3 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-violet-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      Create Organization
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Step: Create Success */}
            {step === 'create-success' && (
              <div className="p-6 sm:p-8 text-center">
                <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-emerald-400" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
                  You're All Set!
                </h2>
                <p className="text-slate-400 mb-2">
                  <span className="text-white font-medium">{orgName}</span> has been created.
                </p>
                <p className="text-sm text-slate-500 mb-6">
                  You're the <span className="text-violet-400 font-medium">Admin</span> — you have full control over this organization and all its tournaments.
                </p>

                <div className="bg-slate-700/30 border border-slate-600/30 rounded-xl p-4 mb-6 text-left">
                  <p className="text-sm font-medium text-slate-300 mb-2">What's next?</p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm text-slate-400">
                      <div className="w-5 h-5 bg-violet-500/20 rounded flex items-center justify-center flex-shrink-0">
                        <span className="text-violet-400 text-xs font-bold">1</span>
                      </div>
                      Create your first tournament
                    </li>
                    <li className="flex items-center gap-2 text-sm text-slate-400">
                      <div className="w-5 h-5 bg-violet-500/20 rounded flex items-center justify-center flex-shrink-0">
                        <span className="text-violet-400 text-xs font-bold">2</span>
                      </div>
                      Add players or import from a spreadsheet
                    </li>
                    <li className="flex items-center gap-2 text-sm text-slate-400">
                      <div className="w-5 h-5 bg-violet-500/20 rounded flex items-center justify-center flex-shrink-0">
                        <span className="text-violet-400 text-xs font-bold">3</span>
                      </div>
                      Invite co-admins to help manage
                    </li>
                  </ul>
                </div>

                <button
                  onClick={onComplete}
                  className="w-full py-3 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-violet-500/25 flex items-center justify-center gap-2"
                >
                  Go to Dashboard
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Step: Join with Code */}
            {step === 'join-code' && (
              <div className="p-6 sm:p-8">
                {!inviteCode && (
                  <button
                    onClick={() => { setStep('choice'); setError(null); }}
                    className="flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors mb-6"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back
                  </button>
                )}

                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Link className="w-8 h-8 text-emerald-400" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
                    Join with Invite Code
                  </h2>
                  <p className="text-slate-400 text-sm">
                    Paste the invite code or link you received from a tournament organizer
                  </p>
                </div>

                {error && (
                  <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl mb-4">
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <p className="text-sm text-red-300">{error}</p>
                  </div>
                )}

                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Invite Code or Link *
                  </label>
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    placeholder="e.g., abc123 or https://cricsmart.in/invite/abc123"
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleJoinWithCode()}
                  />
                </div>

                <button
                  onClick={handleJoinWithCode}
                  disabled={loading || !joinCode.trim()}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Joining...
                    </>
                  ) : (
                    <>
                      Join Organization
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="mt-6 text-center">
                  <p className="text-xs text-slate-500">
                    Don't have a code?{' '}
                    <button
                      onClick={() => { setStep('choice'); setError(null); }}
                      className="text-violet-400 hover:text-violet-300 transition-colors"
                    >
                      Create your own organization
                    </button>
                  </p>
                </div>
              </div>
            )}

            {/* Step: Join Success */}
            {step === 'join-success' && (
              <div className="p-6 sm:p-8 text-center">
                <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-emerald-400" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
                  Welcome Aboard!
                </h2>
                <p className="text-slate-400 mb-6">
                  You've successfully joined the organization. The admin has assigned your role and permissions.
                </p>

                <button
                  onClick={onComplete}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
                >
                  Go to Dashboard
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default TournamentOnboarding;
