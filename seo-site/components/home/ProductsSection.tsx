'use client';

import React from 'react';
import Link from 'next/link';
import { Users, Trophy, Gavel, ArrowRight, CheckCircle2 } from 'lucide-react';

const products = [
  {
    icon: Users,
    title: 'Manage Team',
    subtitle: 'AI-driven team management',
    description: 'No hassle of team availability and payment tracking. AI verifies payments, WhatsApp sends reminders, and smart tools build your best XI.',
    gradient: 'from-emerald-500 to-cyan-500',
    shadowColor: 'shadow-emerald-500/20',
    borderHover: 'hover:border-emerald-500/40',
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-400',
    href: '/features',
    loginHref: '/auth/login?redirect=https%3A%2F%2Fapp.cricsmart.in&service=team',
    cta: 'Start Managing',
    highlights: ['AI Payment Verification', 'WhatsApp Automation', 'Smart Squad Builder', 'Match Analytics'],
  },
  {
    icon: Trophy,
    title: 'Manage Tournament',
    subtitle: 'Pro tournament management',
    description: 'No hassle for payment and balance checks. Team registration, live scoring, leaderboards, brackets, and financial tracking — all automated.',
    gradient: 'from-violet-500 to-purple-500',
    shadowColor: 'shadow-violet-500/20',
    borderHover: 'hover:border-violet-500/40',
    iconBg: 'bg-violet-500/10',
    iconColor: 'text-violet-400',
    href: '/tournament',
    loginHref: '/auth/login?redirect=https%3A%2F%2Ftournament.cricsmart.in&service=tournament',
    cta: 'Create Tournament',
    highlights: ['Team Registration', 'Live Scoring', 'Payment Tracking', 'Leaderboards'],
  },
  {
    icon: Gavel,
    title: 'Create Auction',
    subtitle: 'International standard auctions',
    description: 'AI-powered auction management matching IPL standards. Live bidding, smart player valuation, budget management, and real-time analytics.',
    gradient: 'from-amber-500 to-orange-500',
    shadowColor: 'shadow-amber-500/20',
    borderHover: 'hover:border-amber-500/40',
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-400',
    href: '/auction',
    loginHref: '/auth/login?redirect=https%3A%2F%2Fauction.cricsmart.in&service=auction',
    cta: 'Start Auction',
    highlights: ['AI Player Valuation', 'Live Bidding Room', 'Budget Management', 'Spectator Mode'],
  },
];

const ProductsSection: React.FC = () => {

  return (
    <section className="relative py-20 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" />
      
      {/* Subtle background accents */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 left-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/3 right-0 w-[500px] h-[500px] bg-violet-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-4">
            One Platform,{' '}
            <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
              Three Powerhouses
            </span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Whether you manage a team, run a tournament, or host an auction — CricSmart has you covered.
          </p>
        </div>

        {/* Product Cards */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {products.map((product) => (
            <div
              key={product.title}
              className={`group relative bg-slate-800/30 backdrop-blur-sm border border-white/10 rounded-2xl p-6 lg:p-8 transition-all duration-300 hover:scale-[1.02] ${product.borderHover} hover:shadow-xl ${product.shadowColor}`}
            >
              {/* Icon */}
              <div className={`w-14 h-14 ${product.iconBg} rounded-2xl flex items-center justify-center mb-5 ${product.iconColor} group-hover:scale-110 transition-transform`}>
                <product.icon className="w-7 h-7" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-black text-white mb-1">{product.title}</h3>
              <p className={`text-sm font-medium mb-3 bg-gradient-to-r ${product.gradient} bg-clip-text text-transparent`}>
                {product.subtitle}
              </p>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                {product.description}
              </p>

              {/* Highlights */}
              <div className="space-y-2 mb-6">
                {product.highlights.map((h) => (
                  <div key={h} className="flex items-center gap-2 text-sm text-slate-300">
                    <CheckCircle2 className={`w-4 h-4 ${product.iconColor} flex-shrink-0`} />
                    {h}
                  </div>
                ))}
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col gap-2 mt-auto">
                <Link
                  href={product.loginHref}
                  className={`flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r ${product.gradient} text-white font-semibold rounded-xl transition-all hover:shadow-lg ${product.shadowColor} hover:scale-[1.01]`}
                >
                  {product.cta}
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href={product.href}
                  className="flex items-center justify-center gap-1 w-full py-2 text-slate-400 hover:text-white text-sm font-medium transition-colors"
                >
                  Learn More about {product.title}
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

    </section>
  );
};

export default ProductsSection;
