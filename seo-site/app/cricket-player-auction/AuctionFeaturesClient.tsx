'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import { 
  Gavel, 
  Radio,
  Monitor,
  ArrowLeftRight,
  RotateCcw,
  Wallet,
  TrendingUp,
  Crown,
  Eye,
  BarChart3,
  FileSpreadsheet,
  ArrowRight, 
  CheckCircle2, 
  Zap,
  Star,
  Sparkles,
  Play
} from 'lucide-react';
import Breadcrumbs from '@/components/Breadcrumbs';
import { siteConfig } from '@/lib/api';

const AUCTION_LOGIN_URL = '/auth/login?redirect=https%3A%2F%2Fauction.cricsmart.in&service=auction';

// Top 10 Premium Features
const features = [
  {
    icon: Radio,
    title: 'Real-time Live Bidding',
    description: 'WebSocket-powered instant updates. Every bid reflects across all devices in milliseconds. No refresh needed.',
    gradient: 'from-rose-500 to-pink-600',
    bgGlow: 'bg-rose-500/20',
    delay: 0,
  },
  {
    icon: Monitor,
    title: 'Broadcast View',
    description: 'OBS-ready streaming overlay for YouTube/Twitch. Full-screen immersive layout with animated player cards and bid tickers.',
    gradient: 'from-violet-500 to-purple-600',
    bgGlow: 'bg-violet-500/20',
    delay: 0.1,
  },
  {
    icon: ArrowLeftRight,
    title: 'Post-Auction Trading',
    description: '48-hour bilateral trade window after auction. Teams propose player swaps with purse adjustments. Admin oversight included.',
    gradient: 'from-cyan-500 to-blue-600',
    bgGlow: 'bg-cyan-500/20',
    delay: 0.2,
  },
  {
    icon: RotateCcw,
    title: 'Admin Undo Stack',
    description: 'Made a mistake? Reverse the last 3 player actions (sold/unsold). Full purse restoration and squad adjustments.',
    gradient: 'from-amber-500 to-orange-600',
    bgGlow: 'bg-amber-500/20',
    delay: 0.3,
  },
  {
    icon: Wallet,
    title: 'Team Purse Management',
    description: 'Auto-calculate max affordable bids based on remaining purse and mandatory squad slots. Real-time budget tracking.',
    gradient: 'from-emerald-500 to-teal-600',
    bgGlow: 'bg-emerald-500/20',
    delay: 0.4,
  },
  {
    icon: TrendingUp,
    title: 'Tiered Bid Increments',
    description: 'IPL-style preset templates. ₹5L jumps under ₹1Cr, ₹25L jumps above ₹5Cr. Fully customizable per auction.',
    gradient: 'from-blue-500 to-indigo-600',
    bgGlow: 'bg-blue-500/20',
    delay: 0.5,
  },
  {
    icon: Crown,
    title: 'Player Retention System',
    description: 'Marquee picks with captain designation. Retained players deducted from purse before auction starts.',
    gradient: 'from-yellow-500 to-amber-600',
    bgGlow: 'bg-yellow-500/20',
    delay: 0.6,
  },
  {
    icon: Eye,
    title: 'Spectator Mode',
    description: 'Public live view link for fans. Follow every bid in real-time without bidding access. Perfect for league followers.',
    gradient: 'from-pink-500 to-rose-600',
    bgGlow: 'bg-pink-500/20',
    delay: 0.7,
  },
  {
    icon: BarChart3,
    title: 'Comprehensive Analytics',
    description: 'Team spending breakdown, role distribution charts, multiplier analysis, value picks vs premium buys.',
    gradient: 'from-indigo-500 to-violet-600',
    bgGlow: 'bg-indigo-500/20',
    delay: 0.8,
  },
  {
    icon: FileSpreadsheet,
    title: 'Excel Export',
    description: 'Multi-sheet XLSX with summary, team rosters, sold players, unsold players. One-click download after auction.',
    gradient: 'from-green-500 to-emerald-600',
    bgGlow: 'bg-green-500/20',
    delay: 0.9,
  },
];

const FeatureCard: React.FC<{
  feature: typeof features[0];
  index: number;
}> = ({ feature, index }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.5, delay: feature.delay }}
      className="group relative"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl" />
      <div className={`absolute inset-0 ${feature.bgGlow} opacity-0 group-hover:opacity-100 rounded-2xl blur-xl transition-opacity duration-500`} />
      
      <div className="relative bg-slate-800/30 backdrop-blur-sm border border-white/10 rounded-2xl p-6 h-full hover:border-amber-500/30 transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-xl group-hover:shadow-amber-500/10">
        {/* Floating Icon */}
        <motion.div
          className={`w-14 h-14 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mb-5 shadow-lg`}
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ type: "spring", stiffness: 400 }}
        >
          <feature.icon className="w-7 h-7 text-white" />
        </motion.div>

        {/* Content */}
        <h3 className="text-lg font-bold text-white mb-2 group-hover:text-amber-400 transition-colors">
          {feature.title}
        </h3>
        <p className="text-sm text-slate-400 leading-relaxed">
          {feature.description}
        </p>

        {/* Hover Indicator */}
        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <Sparkles className="w-4 h-4 text-amber-400" />
        </div>
      </div>
    </motion.div>
  );
};

const AnimatedCounter: React.FC<{ value: string; label: string }> = ({ value, label }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.5 }}
      className="text-center"
    >
      <div className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
        {value}
      </div>
      <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">{label}</div>
    </motion.div>
  );
};

export default function AuctionFeaturesClient() {
  const heroRef = useRef(null);
  const heroInView = useInView(heroRef, { once: true });

  return (
    <div>
      {/* Hero Section */}
      <section ref={heroRef} className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-900" />
        
        {/* Animated Background Glows */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px]"
            animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.15, 0.1] }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          <motion.div
            className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-orange-500/10 rounded-full blur-[100px]"
            animate={{ scale: [1.2, 1, 1.2], opacity: [0.1, 0.2, 0.1] }}
            transition={{ duration: 6, repeat: Infinity }}
          />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
          <Breadcrumbs items={[{ name: 'CricSmart Auction', href: '/cricket-player-auction' }]} />
          
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={heroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6 }}
          >
            {/* Product Logo Area - Ready for future logo */}
            <motion.div
              className="flex items-center justify-center gap-4 mb-8"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={heroInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
              transition={{ delay: 0.2 }}
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/25">
                <Gavel className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
              <div className="text-left">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight">
                  CricSmart Auction
                </h1>
                <p className="text-amber-400 font-medium text-lg">IPL-Style Live Bidding</p>
              </div>
            </motion.div>

            {/* Headline */}
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-6 leading-tight">
              Professional Player Auctions{' '}
              <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
                For Your League
              </span>
            </h2>

            {/* Subheadline */}
            <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-8">
              Real-time bidding, broadcast streaming, post-auction trades, and comprehensive analytics. 
              Everything you need to run a professional cricket auction.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link
                  href={AUCTION_LOGIN_URL}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40"
                >
                  <Gavel className="w-5 h-5" />
                  Start an Auction
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </motion.div>
              <Link
                href="https://auction.cricsmart.in"
                className="inline-flex items-center gap-2 px-6 py-4 text-slate-300 hover:text-white font-medium transition-colors"
              >
                <Play className="w-4 h-4" />
                Watch Demo
              </Link>
            </div>

            {/* Stats */}
            <div className="flex items-center justify-center gap-8 sm:gap-12">
              <AnimatedCounter value="Live" label="Bidding" />
              <AnimatedCounter value="48hr" label="Trade Window" />
              <AnimatedCounter value="Free" label="Under 5 Teams" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-12 relative">
        <div className="absolute inset-0 bg-slate-900" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6">
          <div className="grid sm:grid-cols-2 gap-6">
            <motion.div
              className="bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 rounded-2xl p-6 text-center"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 rounded-full mb-3">
                <Star className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 text-xs font-bold uppercase">Free</span>
              </div>
              <p className="text-3xl font-black text-white mb-1">₹0</p>
              <p className="text-slate-300 text-sm">For auctions with under 5 teams</p>
              <p className="text-slate-500 text-xs mt-2">All features included</p>
            </motion.div>
            <motion.div
              className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-6 text-center"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 rounded-full mb-3">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-amber-400 text-xs font-bold uppercase">Pro Auction</span>
              </div>
              <p className="text-3xl font-black text-white mb-1">₹1,999</p>
              <p className="text-slate-300 text-sm">For auctions with 5 or more teams</p>
              <p className="text-slate-500 text-xs mt-2">Per auction, one-time fee</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900" />
        
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
          {/* Section Header */}
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

          {/* Features Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {features.slice(0, 5).map((feature, index) => (
              <FeatureCard key={feature.title} feature={feature} index={index} />
            ))}
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mt-6">
            {features.slice(5, 10).map((feature, index) => (
              <FeatureCard key={feature.title} feature={feature} index={index + 5} />
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 relative">
        <div className="absolute inset-0 bg-slate-900" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6">
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
              { step: '1', title: 'Set Up Auction', description: 'Define teams, budget caps, player categories, and bid increment rules.' },
              { step: '2', title: 'Add Players', description: 'Import player list via Excel/CSV. Set base prices and custom fields.' },
              { step: '3', title: 'Go Live', description: 'Start the auction. Teams bid in real-time from any device.' },
              { step: '4', title: 'Trade & Export', description: 'Open trade window, finalize rosters, export comprehensive reports.' },
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
                  className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white font-black text-xl shadow-lg shadow-amber-500/25"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                >
                  {s.step}
                </motion.div>
                <h3 className="font-bold text-white mb-2">{s.title}</h3>
                <p className="text-sm text-slate-400">{s.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 relative">
        <div className="absolute inset-0 bg-slate-950" />
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            className="bg-gradient-to-br from-amber-500/10 via-slate-800/50 to-orange-500/10 border border-amber-500/20 rounded-3xl p-8 lg:p-12"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <motion.div
              whileHover={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ duration: 0.5 }}
            >
              <Gavel className="w-12 h-12 text-amber-400 mx-auto mb-4" />
            </motion.div>
            <h2 className="text-3xl font-black text-white mb-4">
              Ready to Run Your Auction?
            </h2>
            <p className="text-slate-300 mb-6 max-w-lg mx-auto">
              Free for auctions with fewer than 5 teams. 
              Full-featured with real-time bidding and post-auction trading.
            </p>
            <div className="space-y-2 mb-8 max-w-xs mx-auto">
              {['Real-time live bidding', 'Broadcast view for streaming', 'Post-auction trading window', 'Comprehensive analytics', 'Excel export'].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  {item}
                </div>
              ))}
            </div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                href={AUCTION_LOGIN_URL}
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-amber-500/25"
              >
                Start Free Auction
                <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
