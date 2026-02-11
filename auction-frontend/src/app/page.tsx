import Link from 'next/link';
import { Gavel, Users, Zap, BarChart3, Shield, Eye, ArrowRight, Sparkles, Timer, TrendingUp } from 'lucide-react';

const features = [
  {
    icon: Zap,
    title: 'Real-Time Bidding',
    description: 'Live WebSocket-powered auctions with instant bid updates, going-once/going-twice timers, and real-time purse tracking.',
    gradient: 'from-amber-500 to-orange-500',
  },
  {
    icon: Users,
    title: 'Team Management',
    description: 'Create teams, set budgets, manage retained players with captain designation, and track squad composition live.',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    icon: BarChart3,
    title: 'Smart Analytics',
    description: 'Post-auction analytics with spending breakdown, role-wise pricing, value picks, and premium player analysis.',
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    icon: Shield,
    title: 'Admin Controls',
    description: 'Undo last 3 actions, pause mid-bid, disqualify players with purse refund, and manual overrides when needed.',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    icon: Eye,
    title: 'Spectator Mode',
    description: 'Public live view for spectators. Share your auction link — anyone can watch the bidding war unfold in real-time.',
    gradient: 'from-red-500 to-rose-500',
  },
  {
    icon: Timer,
    title: 'Configurable Timers',
    description: 'Tiered bid increments, customizable bidding windows, going-once/going-twice phases — just like the real IPL auction.',
    gradient: 'from-indigo-500 to-violet-500',
  },
];

const stats = [
  { value: '7', label: 'Auction States', sublabel: 'Draft to Finalized' },
  { value: '3', label: 'Bid Presets', sublabel: 'Budget · Standard · Premium' },
  { value: '∞', label: 'Teams & Players', sublabel: 'No Limits' },
  { value: '< 50ms', label: 'Bid Latency', sublabel: 'Real-time WebSocket' },
];

export default function HomePage() {
  return (
    <div className="relative">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 via-transparent to-transparent" />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-float" />
        <div className="absolute top-40 right-1/4 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-20">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 mb-8 animate-fade-in">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-medium text-amber-300">IPL-Style Cricket Auctions</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6 animate-slide-up">
              <span className="text-white">Run Your Cricket</span>
              <br />
              <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 bg-clip-text text-transparent">
                Auction Like a Pro
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed animate-slide-up" style={{ animationDelay: '0.1s' }}>
              Real-time bidding, smart player management, tiered increments, and spectator mode.
              Everything you need to run a world-class cricket player auction.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <Link href="/admin" className="btn-primary text-base px-8 py-4 group">
                Create Your Auction
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/explore" className="btn-secondary text-base px-8 py-4">
                <Eye className="w-5 h-5" />
                Explore Auctions
              </Link>
            </div>
          </div>

          {/* Hero visual — Auction mockup */}
          <div className="mt-16 sm:mt-20 max-w-4xl mx-auto animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <div className="glass-card p-6 sm:p-8">
              {/* Mock auction header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-sm font-bold text-red-400 uppercase tracking-wider">Live Auction</span>
                </div>
                <div className="text-sm text-slate-400">Round 1 · Player 12 of 80</div>
              </div>

              {/* Mock player card */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-2xl">
                      🏏
                    </div>
                    <div>
                      <h3 className="text-xl sm:text-2xl font-bold text-white">Rohit Sharma</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="badge bg-blue-500/20 text-blue-400">Batsman</span>
                        <span className="text-sm text-slate-400">#12</span>
                      </div>
                    </div>
                  </div>

                  {/* Bid progress */}
                  <div className="space-y-3">
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm text-slate-400">Current Bid</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl sm:text-4xl font-bold gradient-text-amber">&#8377;25,00,000</span>
                      </div>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full w-3/5 transition-all duration-500" />
                    </div>
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Base: &#8377;5,00,000</span>
                      <span>Highest Bidder: Mumbai Mavericks</span>
                    </div>
                  </div>
                </div>

                {/* Timer & teams */}
                <div className="flex flex-col items-center justify-center gap-4">
                  <div className="text-center">
                    <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Going Once</div>
                    <div className="text-5xl font-bold text-amber-400 font-mono">05</div>
                    <div className="text-xs text-slate-500">seconds</div>
                  </div>
                  <div className="flex gap-2">
                    {['MM', 'RR', 'CSK'].map((team, i) => (
                      <div
                        key={team}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold border ${
                          i === 0
                            ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                            : 'bg-slate-800 border-white/5 text-slate-500'
                        }`}
                      >
                        {team}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-white/5 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl sm:text-4xl font-bold gradient-text-amber mb-1">{stat.value}</div>
                <div className="text-sm font-medium text-white mb-0.5">{stat.label}</div>
                <div className="text-xs text-slate-500">{stat.sublabel}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="section-heading mb-4">Everything You Need</h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              From draft setup to post-auction analytics. Run professional cricket auctions with all the tools the pros use.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div key={feature.title} className="glass-card-hover p-6 group">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 border-t border-white/5 bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="section-heading mb-4">How It Works</h2>
            <p className="text-lg text-slate-400">Three simple steps to run your auction</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Set Up', desc: 'Create your auction, add teams with budgets, import players from Excel. Configure bid increments and timers.', icon: '⚙️' },
              { step: '02', title: 'Go Live', desc: 'Start the auction. Teams bid in real-time using magic links. Spectators watch the action unfold live.', icon: '🔴' },
              { step: '03', title: 'Analyze', desc: 'View comprehensive analytics, team spending, value picks. Export results and share public analytics.', icon: '📊' },
            ].map((item) => (
              <div key={item.step} className="relative glass-card p-8 text-center group hover:border-amber-500/20 transition-all">
                <div className="text-5xl mb-4">{item.icon}</div>
                <div className="text-xs font-bold text-amber-500 tracking-widest mb-2">STEP {item.step}</div>
                <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="glass-card p-10 sm:p-16 animated-border">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 mb-6 shadow-xl shadow-amber-500/20">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Ready to Run Your Auction?
            </h2>
            <p className="text-lg text-slate-400 mb-8 max-w-xl mx-auto">
              Set up your first cricket player auction in minutes. Free to use, no credit card required.
            </p>
            <Link href="/admin" className="btn-primary text-lg px-10 py-4 group">
              Get Started Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
