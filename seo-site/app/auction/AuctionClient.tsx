'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Gavel, 
  Brain, 
  Users, 
  BarChart3, 
  Monitor, 
  Wallet, 
  Tags, 
  Eye, 
  Download, 
  ArrowRight, 
  CheckCircle2, 
  Zap,
  Star
} from 'lucide-react';
import Breadcrumbs from '@/components/Breadcrumbs';

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Player Valuation',
    description: 'Our AI analyzes player stats, past performances, and roles to suggest base prices and expected valuations.',
    gradient: 'from-violet-500/20 to-purple-500/20',
    iconColor: 'text-violet-400',
  },
  {
    icon: Monitor,
    title: 'Live Auction Room',
    description: 'Real-time auction interface with timer, bid tracking, and instant updates for all participants.',
    gradient: 'from-emerald-500/20 to-cyan-500/20',
    iconColor: 'text-emerald-400',
  },
  {
    icon: Gavel,
    title: 'Real-Time Bidding',
    description: 'Smooth bidding experience with bid increments, paddle system, and instant confirmation.',
    gradient: 'from-amber-500/20 to-orange-500/20',
    iconColor: 'text-amber-400',
  },
  {
    icon: Wallet,
    title: 'Team Budget Management',
    description: 'Set purse limits per team. Auto-track remaining budget, max bid capacity, and mandatory slots.',
    gradient: 'from-blue-500/20 to-indigo-500/20',
    iconColor: 'text-blue-400',
  },
  {
    icon: Tags,
    title: 'Player Categorization',
    description: 'Categorize players by role (batsman, bowler, all-rounder), tier (marquee, set 1, set 2), and skill level.',
    gradient: 'from-cyan-500/20 to-blue-500/20',
    iconColor: 'text-cyan-400',
  },
  {
    icon: BarChart3,
    title: 'Auction Analytics',
    description: 'Live analytics showing spending patterns, team composition, most expensive picks, and value deals.',
    gradient: 'from-green-500/20 to-emerald-500/20',
    iconColor: 'text-green-400',
  },
  {
    icon: Eye,
    title: 'Spectator Mode',
    description: 'Share a live view link with spectators. They follow the auction in real-time without bidding access.',
    gradient: 'from-pink-500/20 to-rose-500/20',
    iconColor: 'text-pink-400',
  },
  {
    icon: Download,
    title: 'Export Results',
    description: 'Export complete auction results, team compositions, spending breakdowns, and unsold player lists.',
    gradient: 'from-slate-500/20 to-slate-600/20',
    iconColor: 'text-slate-400',
  },
];

const steps = [
  { step: '1', title: 'Set Up Auction', description: 'Define teams, budget caps, player categories, and auction rules.' },
  { step: '2', title: 'Add Players', description: 'Upload player list with stats. AI suggests base prices automatically.' },
  { step: '3', title: 'Go Live', description: 'Start the auction. Teams bid in real-time from any device.' },
  { step: '4', title: 'Review & Export', description: 'View analytics, finalize squads, and export results.' },
];

const AUCTION_LOGIN_URL = '/auth/login?redirect=https%3A%2F%2Fauction.cricsmart.in&service=auction';

export default function AuctionClient() {
  return (
    <div className="pt-20">
      {/* Header */}
      <section className="relative py-16">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-900" />
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-[100px]" />
          <div className="absolute top-1/3 right-1/3 w-[300px] h-[300px] bg-orange-500/10 rounded-full blur-[100px]" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
          <Breadcrumbs items={[{ name: 'Auction', href: '/auction' }]} />
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full mb-6">
              <Gavel className="w-4 h-4 text-amber-400" />
              <span className="text-amber-400 text-sm font-medium">AI-Powered Auction</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-white mb-4">
              Cricket Player Auction{' '}
              <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                Like the Pros
              </span>
            </h1>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-6">
              AI-powered auction management matching international standards. 
              Live bidding, smart player valuation, and real-time analytics.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href={AUCTION_LOGIN_URL}
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-amber-500/25"
              >
                <Gavel className="w-5 h-5" />
                Start an Auction
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Highlight */}
      <section className="py-8 relative">
        <div className="absolute inset-0 bg-slate-900" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6">
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 rounded-2xl p-6 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 rounded-full mb-3">
                <Star className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 text-xs font-bold uppercase">Free</span>
              </div>
              <p className="text-3xl font-black text-white mb-1">₹0</p>
              <p className="text-slate-300 text-sm">For auctions with under 5 teams</p>
              <p className="text-slate-500 text-xs mt-2">All features included</p>
            </div>
            <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-6 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 rounded-full mb-3">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-amber-400 text-xs font-bold uppercase">Pro Auction</span>
              </div>
              <p className="text-3xl font-black text-white mb-1">₹1,999</p>
              <p className="text-slate-300 text-sm">For auctions with 5 or more teams</p>
              <p className="text-slate-500 text-xs mt-2">Per auction, one-time fee</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 relative">
        <div className="absolute inset-0 bg-slate-900" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl font-black text-white mb-10 text-center">How It Works</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white font-black text-xl">
                  {s.step}
                </div>
                <h3 className="font-bold text-white mb-2">{s.title}</h3>
                <p className="text-sm text-slate-400">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-slate-950" />
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl font-black text-white mb-4 text-center">
            International Standard Features
          </h2>
          <p className="text-slate-400 text-center mb-10 max-w-2xl mx-auto">
            Every feature you need to run an IPL-style player auction for your local cricket league
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className={`bg-slate-800/30 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-amber-500/30 transition-all group relative overflow-hidden`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity`} />
                <div className="relative">
                  <div className={`w-12 h-12 bg-slate-700/50 rounded-xl flex items-center justify-center mb-4 ${feature.iconColor} group-hover:scale-110 transition-transform`}>
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-white mb-2 group-hover:text-amber-400 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-slate-400">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 relative">
        <div className="absolute inset-0 bg-slate-950" />
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div className="bg-gradient-to-br from-amber-500/10 via-slate-800/50 to-orange-500/10 border border-amber-500/20 rounded-3xl p-8 lg:p-12">
            <Gavel className="w-12 h-12 text-amber-400 mx-auto mb-4" />
            <h2 className="text-3xl font-black text-white mb-4">
              Ready to Run Your Auction?
            </h2>
            <p className="text-slate-300 mb-6 max-w-lg mx-auto">
              Free for auctions with fewer than 5 teams. 
              Full-featured with AI player valuation and live bidding.
            </p>
            <div className="space-y-2 mb-8 max-w-xs mx-auto">
              {['AI player valuation', 'Live bidding room', 'Budget management', 'Spectator mode', 'Export results'].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  {item}
                </div>
              ))}
            </div>
            <Link
              href={AUCTION_LOGIN_URL}
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-amber-500/25"
            >
              Start Free Auction
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
