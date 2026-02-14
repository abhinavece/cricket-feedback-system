import { Metadata } from 'next';
import Link from 'next/link';
import { 
  Trophy, 
  Users, 
  BarChart3, 
  Calendar, 
  CreditCard, 
  Eye, 
  ArrowRight, 
  CheckCircle2, 
  Rocket,
  Shield,
  Zap,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import Breadcrumbs from '@/components/Breadcrumbs';
import SchemaScript from '@/components/SchemaScript';
import { generateWebPageSchema } from '@/lib/schema';
import { siteConfig } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Cricket Tournament Management Software - Registration & Payments',
  description: 'Run cricket tournaments effortlessly. Team registration portal, automated followups, payment tracking, brackets & leaderboards. Just ₹999 per tournament.',
  keywords: [
    'cricket tournament management',
    'cricket tournament app',
    'tournament bracket software',
    'cricket league management',
    'cricket tournament software',
    'tournament organizer app',
    'cricket leaderboard',
    'cricket scoring app',
  ],
  alternates: {
    canonical: `${siteConfig.url}/cricket-tournament-management`,
  },
  openGraph: {
    title: 'CricSmart Tournament - Pro Cricket Tournament Management',
    description: 'Run cricket tournaments like a pro. Team registration, automated followups, payment tracking. ₹999 per tournament.',
    url: `${siteConfig.url}/cricket-tournament-management`,
    type: 'website',
    images: [{ url: siteConfig.ogImage, width: 1200, height: 630, alt: 'CricSmart Tournament' }],
  },
};

const features = [
  {
    icon: Users,
    title: 'Team Registration Portal',
    description: 'Teams register online with player lists. No more spreadsheets or WhatsApp groups for coordination.',
  },
  {
    icon: Calendar,
    title: 'Match Scheduling',
    description: 'Auto-generate round-robin or knockout schedules. Assign venues and time slots effortlessly.',
  },
  {
    icon: MessageSquare,
    title: 'Automated Team Followups',
    description: 'Schedule confirmations, match reminders, and team coordination without manual WhatsApp messages.',
  },
  {
    icon: Trophy,
    title: 'Tournament Brackets',
    description: 'Visual knockout brackets that update as matches are completed. Share with all teams.',
  },
  {
    icon: CreditCard,
    title: 'Payment & Balance Tracking',
    description: 'Collect registration fees, track payments per team, and manage tournament finances.',
  },
  {
    icon: Eye,
    title: 'Spectator View',
    description: 'Public-facing tournament page where fans can follow scores, standings, and schedules.',
  },
  {
    icon: Shield,
    title: 'Multi-Admin Support',
    description: 'Add multiple organizers with different access levels. Delegate without losing control.',
  },
  {
    icon: Zap,
    title: 'Export & Reports',
    description: 'Export match results, scorecards, and financial reports for record keeping.',
  },
];

const steps = [
  { step: '1', title: 'Create Tournament', description: 'Set up your tournament with format, rules, entry fees, and schedule.' },
  { step: '2', title: 'Register Teams', description: 'Share the registration link. Teams sign up with player lists online.' },
  { step: '3', title: 'Hassle-Free Followups', description: 'Automated team discussions, schedule confirmations, and coordination without manual effort.' },
  { step: '4', title: 'Payment Management', description: 'Collect entry fees, track who paid, send reminders, and manage tournament finances.' },
  { step: '5', title: 'Analyse Profits', description: 'View financial reports, profit/loss analysis, and export detailed summaries.' },
];

export default function CricketTournamentManagementPage() {
  const webPageSchema = generateWebPageSchema({
    name: 'CricSmart Tournament - Pro Cricket Tournament Management',
    description: 'Run cricket tournaments effortlessly. Team registration, automated followups, payment tracking, brackets & leaderboards.',
    url: `${siteConfig.url}/cricket-tournament-management`,
    breadcrumb: [{ name: 'CricSmart Tournament', url: `${siteConfig.url}/cricket-tournament-management` }],
  });

  return (
    <>
      <SchemaScript schema={webPageSchema} />

      <div className="pt-20">
        {/* Header */}
        <section className="relative py-16">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-900" />
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/4 left-1/3 w-[400px] h-[400px] bg-violet-500/10 rounded-full blur-[100px]" />
            <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] bg-purple-500/10 rounded-full blur-[100px]" />
          </div>

          <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
            <Breadcrumbs items={[{ name: 'CricSmart Tournament', href: '/cricket-tournament-management' }]} />
            <div className="text-center">
              {/* Product Logo Area - Ready for future logo */}
              <div className="flex items-center justify-center gap-4 mb-8">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-violet-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/25">
                  <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                </div>
                <div className="text-left">
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight">
                    CricSmart Tournament
                  </h1>
                  <p className="text-violet-400 font-medium text-lg">Pro Tournament Organization</p>
                </div>
              </div>
              
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                Run Your Tournament{' '}
                <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                  Like a Pro
                </span>
              </h2>
              <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-6">
                Focus on the game, not the coordination. Automated team followups, 
                payment management, and hassle-free tournament organization.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href={`/auth/login?redirect=${encodeURIComponent(siteConfig.tournamentUrl)}&service=tournament`}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-400 hover:to-purple-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-violet-500/25"
                >
                  <Rocket className="w-5 h-5" />
                  Start a Tournament
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <div className="text-slate-400 text-sm">
                  Just <span className="text-white font-bold text-lg">₹999</span> per tournament
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 relative">
          <div className="absolute inset-0 bg-slate-900" />
          <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6">
            <h2 className="text-3xl font-black text-white mb-10 text-center">How It Works</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
              {steps.map((s, i) => (
                <div key={s.step} className="text-center relative">
                  {i < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-7 left-[calc(50%+28px)] w-[calc(100%-56px)] h-0.5 bg-gradient-to-r from-violet-500/40 to-purple-500/20" />
                  )}
                  <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white font-black text-xl relative z-10">
                    {s.step}
                  </div>
                  <h3 className="font-bold text-white mb-2 text-sm lg:text-base">{s.title}</h3>
                  <p className="text-xs lg:text-sm text-slate-400">{s.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-16 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-slate-950" />
          <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
            <h2 className="text-3xl font-black text-white mb-10 text-center">
              Everything You Need to Run a Tournament
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="bg-slate-800/30 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-violet-500/30 transition-all group"
                >
                  <div className="w-12 h-12 bg-violet-500/10 rounded-xl flex items-center justify-center mb-4 text-violet-400 group-hover:scale-110 transition-transform">
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-white mb-2 group-hover:text-violet-400 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-slate-400">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing CTA */}
        <section className="py-16 relative">
          <div className="absolute inset-0 bg-slate-950" />
          <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <div className="bg-gradient-to-br from-violet-500/10 via-slate-800/50 to-purple-500/10 border border-violet-500/20 rounded-3xl p-8 lg:p-12">
              <Trophy className="w-12 h-12 text-violet-400 mx-auto mb-4" />
              <h2 className="text-3xl font-black text-white mb-2">₹999 per Tournament</h2>
              <p className="text-slate-300 mb-6">One-time fee. No monthly charges. No hidden costs.</p>
              <div className="space-y-2 mb-8 max-w-xs mx-auto">
                {['Team registration portal', 'Automated team followups', 'Payment & balance tracking', 'Multi-admin support', 'Tournament brackets'].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-violet-400 flex-shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
              <Link
                href={`/auth/login?redirect=${encodeURIComponent(siteConfig.tournamentUrl)}&service=tournament`}
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-400 hover:to-purple-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-violet-500/25"
              >
                Start Your Tournament
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
