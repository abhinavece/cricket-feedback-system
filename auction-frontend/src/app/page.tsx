'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Gavel, 
  Users, 
  Zap, 
  BarChart3, 
  Shield, 
  Eye, 
  ArrowRight, 
  Sparkles, 
  Timer, 
  Radio,
  ArrowLeftRight,
  RotateCcw,
  Wallet,
  TrendingUp,
  Crown,
  FileSpreadsheet,
  Play,
  CheckCircle2
} from 'lucide-react';

const features = [
  {
    icon: Radio,
    title: 'Real-Time Live Bidding',
    description: 'WebSocket-powered instant updates. Every bid reflects across all devices in milliseconds.',
    gradient: 'from-rose-500 to-pink-600',
  },
  {
    icon: Eye,
    title: 'Broadcast View',
    description: 'OBS-ready streaming overlay for YouTube/Twitch. Full-screen immersive experience.',
    gradient: 'from-violet-500 to-purple-600',
  },
  {
    icon: ArrowLeftRight,
    title: 'Post-Auction Trading',
    description: '48-hour bilateral trade window. Teams propose swaps with purse adjustments.',
    gradient: 'from-cyan-500 to-blue-600',
  },
  {
    icon: RotateCcw,
    title: 'Admin Undo Stack',
    description: 'Reverse last 3 actions with full purse restoration and squad adjustments.',
    gradient: 'from-amber-500 to-orange-600',
  },
  {
    icon: Wallet,
    title: 'Smart Purse Management',
    description: 'Auto-calculate max bids based on remaining budget and squad requirements.',
    gradient: 'from-emerald-500 to-teal-600',
  },
  {
    icon: Crown,
    title: 'Player Retention System',
    description: 'Marquee picks with captain designation. Retained players deducted before auction.',
    gradient: 'from-yellow-500 to-amber-600',
  },
];

const stats = [
  { value: 'Live', label: 'Bidding', sublabel: 'Real-time WebSocket' },
  { value: '48hr', label: 'Trade Window', sublabel: 'Post-auction trades' },
  { value: '< 50ms', label: 'Latency', sublabel: 'Instant updates' },
  { value: 'Free', label: 'Under 5 Teams', sublabel: 'Full features' },
];

const FeatureCard = ({ feature, index }: { feature: typeof features[0]; index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay: index * 0.1 }}
    className="group relative"
  >
    <div className="absolute inset-0 bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl" />
    <div className="relative bg-slate-900/80 border border-slate-700/50 rounded-2xl p-6 h-full hover:border-amber-500/30 transition-all duration-300 group-hover:scale-[1.02]">
      <motion.div
        className={`w-12 h-12 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center mb-4 shadow-lg`}
        whileHover={{ scale: 1.1, rotate: 5 }}
        transition={{ type: "spring", stiffness: 400 }}
      >
        <feature.icon className="w-6 h-6 text-white" />
      </motion.div>
      <h3 className="text-lg font-bold text-white mb-2 group-hover:text-amber-400 transition-colors">
        {feature.title}
      </h3>
      <p className="text-sm text-slate-400 leading-relaxed">
        {feature.description}
      </p>
    </div>
  </motion.div>
);

export default function HomePage() {
  return (
    <div className="relative min-h-screen bg-slate-950 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-amber-500/5 rounded-full blur-[200px]" />
      </div>
      
      {/* Hero Section */}
      <section className="relative pt-20 sm:pt-32 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-4xl mx-auto">
            {/* Product Logo */}
            <motion.div 
              className="flex items-center justify-center gap-4 mb-10"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-amber-500/30">
                <Gavel className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
              <div className="text-left">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white">
                  CricSmart Auction
                </h1>
                <p className="text-amber-400 font-medium text-lg">IPL-Style Live Bidding Platform</p>
              </div>
            </motion.div>

            {/* Headline */}
            <motion.h2 
              className="text-2xl sm:text-4xl lg:text-5xl font-bold text-white mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              Professional Player Auctions{' '}
              <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
                For Your League
              </span>
            </motion.h2>

            {/* Subheadline */}
            <motion.p 
              className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Real-time bidding, broadcast streaming, post-auction trades, and comprehensive analytics.
            </motion.p>

            {/* CTAs */}
            <motion.div 
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Link href="/admin" className="group relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl blur-lg opacity-50 group-hover:opacity-80 transition-opacity" />
                <div className="relative flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl">
                  <Gavel className="w-5 h-5" />
                  Create Your Auction
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
              <Link 
                href="/explore" 
                className="flex items-center gap-2 px-8 py-4 bg-slate-800/50 hover:bg-slate-800 text-white font-semibold rounded-xl border border-slate-700 transition-colors"
              >
                <Play className="w-5 h-5" />
                Explore Auctions
              </Link>
            </motion.div>
          </div>

          {/* Hero Visual - Premium Auction Preview */}
          <motion.div 
            className="max-w-5xl mx-auto"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <div className="relative bg-slate-900/80 border border-slate-700/50 rounded-3xl p-6 sm:p-10 overflow-hidden">
              {/* Glow effect */}
              <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-amber-500/20 rounded-full blur-[100px]" />
              
              {/* Live indicator */}
              <div className="relative flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="relative flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                    <span className="text-sm font-bold text-red-400 uppercase tracking-wider">Live Auction</span>
                  </div>
                </div>
                <div className="px-4 py-2 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-300 font-medium">
                  Round 1 · Player 12 of 80
                </div>
              </div>

              {/* Player Card - Premium Design */}
              <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
                <div className="lg:col-span-2">
                  <div className="flex items-center gap-6 mb-8">
                    {/* Player Avatar - Gradient instead of emoji */}
                    <div className="relative">
                      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500 flex items-center justify-center shadow-2xl shadow-cyan-500/30">
                        <span className="text-4xl sm:text-5xl font-black text-white">RS</span>
                      </div>
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 border-4 border-slate-900 flex items-center justify-center shadow-lg">
                        <Crown className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-3xl sm:text-4xl font-black text-white mb-2">Star Player</h3>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 text-sm font-semibold">
                          Right-Hand Batsman
                        </span>
                        <span className="text-slate-500 text-sm">Base: ₹5,00,000</span>
                      </div>
                    </div>
                  </div>

                  {/* Bid Progress */}
                  <div className="space-y-4">
                    <div className="flex items-end justify-between">
                      <span className="text-sm text-slate-500 uppercase tracking-wider font-medium">Current Bid</span>
                      <div className="flex items-baseline gap-3">
                        <span className="text-5xl sm:text-6xl font-black bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                          ₹25L
                        </span>
                        <span className="px-2 py-1 rounded-md bg-emerald-500/20 text-emerald-400 text-sm font-bold">5x</span>
                      </div>
                    </div>
                    <div className="h-4 bg-slate-800 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 rounded-full relative"
                        initial={{ width: 0 }}
                        animate={{ width: '60%' }}
                        transition={{ delay: 0.8, duration: 1 }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 animate-shimmer" />
                      </motion.div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Base: ₹5,00,000</span>
                      <span className="text-amber-400 font-semibold">Highest: Mumbai Mavericks</span>
                    </div>
                  </div>
                </div>

                {/* Timer & Team Badges */}
                <div className="flex flex-col items-center gap-6">
                  {/* Timer Ring */}
                  <div className="relative">
                    <svg className="w-32 h-32 -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" fill="none" strokeWidth="8" className="stroke-slate-800" />
                      <motion.circle 
                        cx="50" cy="50" r="42" fill="none" strokeWidth="8" 
                        className="stroke-amber-500" 
                        strokeLinecap="round"
                        strokeDasharray="264"
                        initial={{ strokeDashoffset: 264 }}
                        animate={{ strokeDashoffset: 106 }}
                        transition={{ delay: 1, duration: 1.5 }}
                        style={{ filter: 'drop-shadow(0 0 12px rgba(245, 158, 11, 0.6))' }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-[10px] text-amber-400 uppercase tracking-widest font-bold">Going Once</span>
                      <span className="text-5xl font-black text-white font-mono">05</span>
                    </div>
                  </div>
                  
                  {/* Team Badges */}
                  <div className="flex gap-3">
                    {[
                      { name: 'MM', color: 'from-amber-500 to-orange-500', active: true },
                      { name: 'RR', color: 'from-pink-500 to-rose-500', active: false },
                      { name: 'CSK', color: 'from-yellow-500 to-amber-500', active: false },
                    ].map((team) => (
                      <div
                        key={team.name}
                        className={`w-14 h-14 rounded-xl flex items-center justify-center text-sm font-bold transition-all ${
                          team.active
                            ? `bg-gradient-to-br ${team.color} text-white shadow-lg shadow-amber-500/30 scale-110`
                            : 'bg-slate-800 border border-slate-700 text-slate-500'
                        }`}
                      >
                        {team.name}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="relative py-12 border-y border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, idx) => (
              <motion.div 
                key={stat.label} 
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <div className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent mb-1">
                  {stat.value}
                </div>
                <div className="text-sm font-semibold text-white mb-0.5">{stat.label}</div>
                <div className="text-xs text-slate-500">{stat.sublabel}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-amber-400 text-sm font-medium">Premium Features</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
              International Standard{' '}
              <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                Auction System
              </span>
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Every feature you need to run an IPL-style player auction for your local cricket league
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <FeatureCard key={feature.title} feature={feature} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative py-20 bg-slate-900/50 border-y border-slate-800/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <motion.h2 
            className="text-3xl font-black text-white mb-12 text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            How It Works
          </motion.h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { step: '1', title: 'Set Up Auction', description: 'Define teams, budgets, player categories, and bid rules.', icon: Gavel },
              { step: '2', title: 'Add Players', description: 'Import from Excel/CSV. Set base prices and custom fields.', icon: Users },
              { step: '3', title: 'Go Live', description: 'Teams bid in real-time. Spectators watch the action.', icon: Radio },
              { step: '4', title: 'Trade & Export', description: 'Open trade window, finalize rosters, export reports.', icon: FileSpreadsheet },
            ].map((s, i) => (
              <motion.div
                key={s.step}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <motion.div
                  className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/25"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                >
                  <s.icon className="w-7 h-7 text-white" />
                </motion.div>
                <div className="text-xs font-bold text-amber-400 mb-2">STEP {s.step}</div>
                <h3 className="font-bold text-white mb-2">{s.title}</h3>
                <p className="text-sm text-slate-400">{s.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-20 sm:py-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            className="relative bg-gradient-to-br from-amber-500/10 via-slate-900 to-orange-500/10 border border-amber-500/20 rounded-3xl p-10 sm:p-16 overflow-hidden"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            {/* Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[150px] bg-amber-500/20 rounded-full blur-[80px]" />
            
            <div className="relative">
              <motion.div
                className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-amber-500/30"
                whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ duration: 0.5 }}
              >
                <TrendingUp className="w-10 h-10 text-white" />
              </motion.div>
              
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
                Ready to Run Your Auction?
              </h2>
              <p className="text-slate-400 mb-8 max-w-lg mx-auto">
                Free for auctions with fewer than 5 teams. Full-featured with real-time bidding and post-auction trading.
              </p>
              
              <div className="space-y-3 mb-10 max-w-xs mx-auto">
                {['Real-time live bidding', 'Broadcast view for streaming', 'Post-auction trading window', 'Comprehensive analytics'].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
              
              <Link href="/admin" className="group relative inline-flex">
                <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl blur-lg opacity-50 group-hover:opacity-80 transition-opacity" />
                <div className="relative flex items-center gap-2 px-10 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl text-lg">
                  Start Free Auction
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
