import Link from 'next/link';
import { Gavel, Users, Zap, BarChart3, Shield, Eye, ArrowRight, Sparkles, Timer, TrendingUp, Brain, Cpu } from 'lucide-react';

const features = [
  {
    icon: Zap,
    title: 'Real-Time Bidding',
    description: 'Live WebSocket-powered auctions with instant bid updates, going-once/going-twice timers, and real-time purse tracking.',
    gradient: 'from-amber-500 to-orange-500',
    glow: 'rgba(245, 158, 11, 0.15)',
  },
  {
    icon: Users,
    title: 'Team Management',
    description: 'Create teams, set budgets, manage retained players with captain designation, and track squad composition live.',
    gradient: 'from-blue-500 to-cyan-500',
    glow: 'rgba(59, 130, 246, 0.15)',
  },
  {
    icon: BarChart3,
    title: 'Smart Analytics',
    description: 'Post-auction analytics with spending breakdown, role-wise pricing, value picks, and premium player analysis.',
    gradient: 'from-emerald-500 to-teal-500',
    glow: 'rgba(16, 185, 129, 0.15)',
  },
  {
    icon: Shield,
    title: 'Admin Controls',
    description: 'Undo last 3 actions, pause mid-bid, disqualify players with purse refund, and manual overrides when needed.',
    gradient: 'from-purple-500 to-pink-500',
    glow: 'rgba(139, 92, 246, 0.15)',
  },
  {
    icon: Eye,
    title: 'Spectator Mode',
    description: 'Public live view for spectators. Share your auction link — anyone can watch the bidding war unfold in real-time.',
    gradient: 'from-red-500 to-rose-500',
    glow: 'rgba(239, 68, 68, 0.15)',
  },
  {
    icon: Timer,
    title: 'Configurable Timers',
    description: 'Tiered bid increments, customizable bidding windows, going-once/going-twice phases — just like the real IPL auction.',
    gradient: 'from-indigo-500 to-violet-500',
    glow: 'rgba(99, 102, 241, 0.15)',
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
    <div className="relative min-h-screen bg-mesh-gradient-vibrant overflow-hidden">
      {/* Noise overlay */}
      <div className="noise-overlay" />
      
      {/* More vibrant floating orbs */}
      <div className="floating-orb floating-orb-amber w-[600px] h-[600px] top-[-15%] right-[-10%]" style={{ animationDelay: '0s' }} />
      <div className="floating-orb floating-orb-purple w-[500px] h-[500px] top-[25%] left-[-15%]" style={{ animationDelay: '4s' }} />
      <div className="floating-orb floating-orb-cyan w-[550px] h-[550px] bottom-[-15%] right-[15%]" style={{ animationDelay: '8s' }} />
      <div className="floating-orb floating-orb-emerald w-[400px] h-[400px] bottom-[15%] left-[5%]" style={{ animationDelay: '12s' }} />
      <div className="floating-orb floating-orb-rose w-[300px] h-[300px] top-[50%] right-[40%]" style={{ animationDelay: '16s' }} />
      
      {/* Hero section */}
      <section className="relative bg-aurora">
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-grid-pattern opacity-30" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-20 sm:pt-32 pb-24">
          <div className="text-center max-w-4xl mx-auto">
            {/* AI Badge */}
            <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-500/20 mb-10 animate-fade-in backdrop-blur-sm">
              <div className="relative">
                <Cpu className="w-4 h-4 text-amber-400" />
                <div className="absolute inset-0 animate-ping">
                  <Cpu className="w-4 h-4 text-amber-400 opacity-40" />
                </div>
              </div>
              <span className="text-sm font-medium text-amber-300">AI-Powered Cricket Auctions</span>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>

            {/* Headline with premium typography */}
            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tight mb-8 animate-slide-up">
              <span className="text-white text-glow">Run Your Cricket</span>
              <br />
              <span className="text-shimmer">
                Auction Like a Pro
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed animate-slide-up opacity-0" style={{ animationDelay: '0.15s' }}>
              Real-time bidding, smart player management, tiered increments, and spectator mode.
              Everything you need to run a world-class cricket player auction.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up opacity-0" style={{ animationDelay: '0.25s' }}>
              <Link href="/admin" className="group relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 rounded-2xl blur-lg opacity-40 group-hover:opacity-70 transition-opacity duration-500" />
                <div className="relative btn-primary text-base px-10 py-5">
                  Create Your Auction
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
              <Link href="/explore" className="btn-secondary text-base px-10 py-5 backdrop-blur-sm">
                <Eye className="w-5 h-5" />
                Explore Auctions
              </Link>
            </div>
          </div>

          {/* Hero visual — Premium Auction mockup */}
          <div className="mt-20 sm:mt-28 max-w-5xl mx-auto animate-slide-up opacity-0" style={{ animationDelay: '0.4s' }}>
            <div className="premium-card p-8 sm:p-10">
              {/* Ambient glow */}
              <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-amber-500/20 rounded-full blur-[80px] pointer-events-none" />
              
              {/* Mock auction header */}
              <div className="relative flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="absolute inset-0 w-3 h-3 rounded-full bg-red-500 animate-ping" />
                  </div>
                  <span className="text-sm font-bold text-red-400 uppercase tracking-wider">Live Auction</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="px-3 py-1.5 rounded-full bg-slate-800/80 border border-white/5 text-xs text-slate-400">
                    Round 1 · Player 12 of 80
                  </div>
                </div>
              </div>

              {/* Mock player card */}
              <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2">
                  <div className="flex items-center gap-5 mb-6">
                    <div className="relative">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-4xl shadow-2xl shadow-blue-500/20">
                        🏏
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-white">C</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">Rohit Sharma</h3>
                      <div className="flex items-center gap-3">
                        <span className="badge bg-blue-500/20 text-blue-400 border border-blue-500/20">Batsman</span>
                        <span className="text-sm text-slate-500">#12</span>
                        <span className="text-sm text-slate-500">•</span>
                        <span className="text-sm text-slate-500">India</span>
                      </div>
                    </div>
                  </div>

                  {/* Bid progress */}
                  <div className="space-y-4">
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm text-slate-500 uppercase tracking-wider">Current Bid</span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl sm:text-5xl font-bold gradient-text-gold">₹25,00,000</span>
                        <span className="text-sm text-emerald-400">5x base</span>
                      </div>
                    </div>
                    <div className="h-3 bg-slate-800/80 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 rounded-full w-3/5 transition-all duration-500 relative">
                        <div className="absolute inset-0 bg-white/20" style={{ animation: 'shimmer-bg 2s ease-in-out infinite' }} />
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-slate-600">
                      <span>Base: ₹5,00,000</span>
                      <span className="text-amber-400">Highest: Mumbai Mavericks</span>
                    </div>
                  </div>
                </div>

                {/* Timer & teams */}
                <div className="flex flex-col items-center justify-center gap-6">
                  <div className="relative">
                    {/* Timer ring */}
                    <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" fill="none" strokeWidth="6" className="stroke-slate-800" />
                      <circle 
                        cx="50" cy="50" r="42" fill="none" strokeWidth="6" 
                        className="stroke-amber-500" 
                        strokeLinecap="round"
                        strokeDasharray="264"
                        strokeDashoffset="106"
                        style={{ filter: 'drop-shadow(0 0 8px rgba(245, 158, 11, 0.5))' }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className="text-[10px] text-amber-400 uppercase tracking-wider font-medium">Going Once</div>
                      <div className="text-4xl font-bold text-white font-mono">05</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {[{ name: 'MM', color: '#f59e0b', active: true }, { name: 'RR', color: '#ec4899', active: false }, { name: 'CSK', color: '#eab308', active: false }].map((team) => (
                      <div
                        key={team.name}
                        className={`w-12 h-12 rounded-xl flex items-center justify-center text-xs font-bold border transition-all ${
                          team.active
                            ? 'border-amber-500/50 text-white shadow-lg'
                            : 'bg-slate-800/50 border-white/5 text-slate-600'
                        }`}
                        style={team.active ? { background: `linear-gradient(135deg, ${team.color}33, ${team.color}11)`, boxShadow: `0 0 20px ${team.color}33` } : {}}
                      >
                        {team.name}
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
      <section className="relative border-y border-white/[0.03] bg-slate-900/30 backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/[0.02] via-transparent to-purple-500/[0.02]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-14">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, idx) => (
              <div key={stat.label} className="text-center group" style={{ animationDelay: `${idx * 100}ms` }}>
                <div className="text-4xl sm:text-5xl font-bold gradient-text-gold mb-2 group-hover:text-glow transition-all">{stat.value}</div>
                <div className="text-sm font-medium text-white mb-1">{stat.label}</div>
                <div className="text-xs text-slate-500">{stat.sublabel}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative py-24 sm:py-32">
        {/* Background orbs */}
        <div className="floating-orb floating-orb-emerald w-[300px] h-[300px] top-[10%] right-[10%]" style={{ animationDelay: '8s' }} />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-medium text-emerald-300">Powerful Features</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
              Everything You <span className="text-shimmer">Need</span>
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              From draft setup to post-auction analytics. Run professional cricket auctions with all the tools the pros use.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <div 
                key={feature.title} 
                className="group relative glass-card-hover p-7 overflow-hidden"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                {/* Hover glow */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ background: `radial-gradient(circle at 30% 30%, ${feature.glow}, transparent 70%)` }}
                />
                
                <div className="relative">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-5 shadow-xl group-hover:scale-110 group-hover:shadow-2xl transition-all duration-500`}>
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-3 group-hover:text-amber-400 transition-colors">{feature.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{feature.description}</p>
                </div>
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
      <section className="relative py-24 sm:py-32">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-500/[0.02] to-transparent" />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="relative premium-card p-12 sm:p-20">
            {/* Animated border */}
            <div className="absolute inset-0 rounded-3xl animated-border" />
            
            {/* Ambient glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[150px] bg-amber-500/20 rounded-full blur-[60px]" />
            
            <div className="relative">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600 mb-8 shadow-2xl shadow-amber-500/30">
                <TrendingUp className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
                Ready to Run Your <span className="text-shimmer">Auction</span>?
              </h2>
              <p className="text-lg text-slate-400 mb-10 max-w-xl mx-auto">
                Set up your first cricket player auction in minutes. Free to use, no credit card required.
              </p>
              <Link href="/admin" className="group relative inline-flex">
                <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 rounded-2xl blur-lg opacity-50 group-hover:opacity-80 transition-opacity duration-500" />
                <div className="relative btn-primary text-lg px-12 py-5">
                  Get Started Free
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
