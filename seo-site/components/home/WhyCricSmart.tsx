'use client';

import Link from 'next/link';
import { 
  Users, 
  Trophy, 
  Gavel, 
  Brain, 
  MessageSquare, 
  CreditCard,
  Calendar,
  Radio,
  ArrowLeftRight,
  ArrowRight,
  Sparkles
} from 'lucide-react';

const products = [
  {
    name: 'CricSmart Teams',
    href: '/cricket-team-management',
    icon: Users,
    gradient: 'from-emerald-500 to-cyan-500',
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/20',
    hoverBorder: 'hover:border-emerald-500/40',
    highlights: [
      { icon: Brain, text: 'AI payment verification' },
      { icon: MessageSquare, text: 'WhatsApp notifications' },
      { icon: CreditCard, text: 'Dues & payment tracking' },
    ],
  },
  {
    name: 'CricSmart Tournament',
    href: '/cricket-tournament-management',
    icon: Trophy,
    gradient: 'from-violet-500 to-purple-500',
    iconBg: 'bg-violet-500/10',
    iconColor: 'text-violet-400',
    borderColor: 'border-violet-500/20',
    hoverBorder: 'hover:border-violet-500/40',
    highlights: [
      { icon: Calendar, text: 'Team registration portal' },
      { icon: MessageSquare, text: 'Automated team followups' },
      { icon: CreditCard, text: 'Payment & balance tracking' },
    ],
  },
  {
    name: 'CricSmart Auction',
    href: '/cricket-player-auction',
    icon: Gavel,
    gradient: 'from-amber-500 to-orange-500',
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-400',
    borderColor: 'border-amber-500/20',
    hoverBorder: 'hover:border-amber-500/40',
    highlights: [
      { icon: Radio, text: 'Real-time live bidding' },
      { icon: ArrowLeftRight, text: 'Post-auction trading' },
      { icon: Gavel, text: 'Broadcast view for streaming' },
    ],
  },
];

export default function WhyCricSmart() {
  return (
    <section className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" />
      
      {/* Background Glows */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-emerald-500/5 rounded-full blur-[100px]" />
        <div className="absolute top-1/3 left-1/2 w-[250px] h-[250px] bg-violet-500/5 rounded-full blur-[100px]" />
        <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] bg-amber-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/50 border border-white/10 rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-white" />
            <span className="text-white text-sm font-medium">Why CricSmart</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
            Three Products,{' '}
            <span className="bg-gradient-to-r from-emerald-400 via-violet-400 to-amber-400 bg-clip-text text-transparent">
              One Platform
            </span>
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Everything your cricket league needs — from team management to tournaments to auctions. 
            All products work together seamlessly.
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {products.map((product) => (
            <Link
              key={product.name}
              href={product.href}
              className={`group relative bg-slate-800/30 backdrop-blur-sm border ${product.borderColor} ${product.hoverBorder} rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02]`}
            >
              {/* Icon */}
              <div className={`w-12 h-12 ${product.iconBg} rounded-xl flex items-center justify-center mb-4 ${product.iconColor} group-hover:scale-110 transition-transform`}>
                <product.icon className="w-6 h-6" />
              </div>

              {/* Title */}
              <h3 className="text-xl font-bold text-white mb-4 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:bg-clip-text" style={{ backgroundImage: `linear-gradient(to right, var(--tw-gradient-stops))` }}>
                <span className={`group-hover:bg-gradient-to-r ${product.gradient} group-hover:bg-clip-text group-hover:text-transparent transition-all`}>
                  {product.name}
                </span>
              </h3>

              {/* Highlights */}
              <div className="space-y-3 mb-6">
                {product.highlights.map((h, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm text-slate-400">
                    <h.icon className="w-4 h-4 text-slate-500 flex-shrink-0" />
                    {h.text}
                  </div>
                ))}
              </div>

              {/* Learn More */}
              <div className={`flex items-center gap-2 text-sm font-medium bg-gradient-to-r ${product.gradient} bg-clip-text text-transparent`}>
                Learn More
                <ArrowRight className={`w-4 h-4 ${product.iconColor} group-hover:translate-x-1 transition-transform`} />
              </div>
            </Link>
          ))}
        </div>

        {/* Integration Note */}
        <div className="mt-12 text-center">
          <p className="text-slate-500 text-sm">
            All products share the same player database, team rosters, and payment history.
          </p>
        </div>
      </div>
    </section>
  );
}
