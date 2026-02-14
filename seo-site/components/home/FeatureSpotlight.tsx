'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Brain, 
  MessageCircle, 
  Users, 
  CreditCard, 
  Trophy, 
  Gavel,
  Smartphone,
  BarChart3,
  Shield,
  Zap,
  CheckCircle2,
  ArrowRight,
  Play,
  Sparkles
} from 'lucide-react';

interface FeatureSpot {
  id: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  description: string;
  benefits: string[];
  gradient: string;
  bgGradient: string;
  image?: string;
  stats?: { value: string; label: string }[];
}

const features: FeatureSpot[] = [
  {
    id: 'ai-payments',
    icon: <Brain className="w-8 h-8" />,
    title: 'AI-Powered Payment Verification',
    subtitle: 'Zero Manual Work',
    description: 'Upload payment screenshots and let our AI do the heavy lifting. Automatic OCR extracts transaction details, verifies amounts, and updates player records instantly.',
    benefits: [
      'Auto-extract UPI transaction IDs',
      'Verify payment amounts automatically',
      'Track outstanding dues in real-time',
      'Generate payment reports instantly'
    ],
    gradient: 'from-violet-500 to-purple-600',
    bgGradient: 'from-violet-500/10 to-purple-500/5',
    stats: [
      { value: '99%', label: 'Accuracy' },
      { value: '<2s', label: 'Processing' },
      { value: '₹0', label: 'Manual Work' }
    ]
  },
  {
    id: 'whatsapp',
    icon: <MessageCircle className="w-8 h-8" />,
    title: 'WhatsApp Automation',
    subtitle: 'One-Tap Responses',
    description: 'Send match availability requests, payment reminders, and team announcements directly to WhatsApp. Players respond with a single tap — no app download needed.',
    benefits: [
      'Bulk availability requests',
      'Automated payment reminders',
      'Match day notifications',
      'One-tap player responses'
    ],
    gradient: 'from-green-500 to-emerald-600',
    bgGradient: 'from-green-500/10 to-emerald-500/5',
    stats: [
      { value: '95%', label: 'Response Rate' },
      { value: '10x', label: 'Faster' },
      { value: '24/7', label: 'Automated' }
    ]
  },
  {
    id: 'squad-builder',
    icon: <Users className="w-8 h-8" />,
    title: 'Smart Squad Builder',
    subtitle: 'Build Your Best XI',
    description: 'Real-time availability dashboard shows exactly who\'s in, who\'s out, and who\'s tentative. Make informed decisions and build your strongest playing XI.',
    benefits: [
      'Live availability tracking',
      'Role-based player filtering',
      'Performance-based suggestions',
      'Substitution management'
    ],
    gradient: 'from-cyan-500 to-teal-600',
    bgGradient: 'from-cyan-500/10 to-teal-500/5',
    stats: [
      { value: '100%', label: 'Visibility' },
      { value: 'Live', label: 'Updates' },
      { value: 'Smart', label: 'Suggestions' }
    ]
  },
  {
    id: 'tournament',
    icon: <Trophy className="w-8 h-8" />,
    title: 'Tournament Management',
    subtitle: 'Pro-Level Organization',
    description: 'Run tournaments like a pro. Team registration, fixture generation, live scoring, leaderboards, and financial tracking — all in one powerful dashboard.',
    benefits: [
      'Automated fixture generation',
      'Live scoring & leaderboards',
      'Team registration portal',
      'Prize money tracking'
    ],
    gradient: 'from-amber-500 to-orange-600',
    bgGradient: 'from-amber-500/10 to-orange-500/5',
    stats: [
      { value: '50+', label: 'Tournaments' },
      { value: '200+', label: 'Teams' },
      { value: '∞', label: 'Matches' }
    ]
  },
  {
    id: 'auction',
    icon: <Gavel className="w-8 h-8" />,
    title: 'Live Player Auctions',
    subtitle: 'IPL-Style Experience',
    description: 'Host professional player auctions with real-time bidding, budget management, and spectator mode. Just like the IPL — but for your local league.',
    benefits: [
      'Real-time live bidding',
      'Budget & purse management',
      'Spectator mode for viewers',
      'Post-auction trading'
    ],
    gradient: 'from-rose-500 to-pink-600',
    bgGradient: 'from-rose-500/10 to-pink-500/5',
    stats: [
      { value: 'Live', label: 'Bidding' },
      { value: 'Real-time', label: 'Updates' },
      { value: 'Pro', label: 'Experience' }
    ]
  },
  {
    id: 'analytics',
    icon: <BarChart3 className="w-8 h-8" />,
    title: 'Performance Analytics',
    subtitle: 'Data-Driven Decisions',
    description: 'Track player performance across matches. Batting averages, bowling economy, fielding stats — everything you need to make informed team decisions.',
    benefits: [
      'Individual player stats',
      'Team performance trends',
      'Match-by-match analysis',
      'Exportable reports'
    ],
    gradient: 'from-blue-500 to-indigo-600',
    bgGradient: 'from-blue-500/10 to-indigo-500/5',
    stats: [
      { value: '360°', label: 'View' },
      { value: 'Deep', label: 'Insights' },
      { value: 'Visual', label: 'Reports' }
    ]
  },
];

const FeatureCard: React.FC<{
  feature: FeatureSpot;
  index: number;
  isVisible: boolean;
}> = ({ feature, index, isVisible }) => {
  const isEven = index % 2 === 0;
  
  return (
    <div
      className={`grid lg:grid-cols-2 gap-8 lg:gap-12 items-center transition-all duration-700 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
      }`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      {/* Content */}
      <div className={`${isEven ? 'lg:order-1' : 'lg:order-2'}`}>
        {/* Icon Badge */}
        <div className={`inline-flex items-center gap-3 px-4 py-2 bg-gradient-to-r ${feature.bgGradient} border border-white/10 rounded-full mb-6`}>
          <div className={`p-2 bg-gradient-to-br ${feature.gradient} rounded-xl text-white`}>
            {feature.icon}
          </div>
          <span className="text-white font-semibold">{feature.subtitle}</span>
        </div>

        {/* Title */}
        <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-4 leading-tight">
          {feature.title}
        </h3>

        {/* Description */}
        <p className="text-slate-400 text-lg mb-6 leading-relaxed">
          {feature.description}
        </p>

        {/* Benefits */}
        <ul className="space-y-3 mb-8">
          {feature.benefits.map((benefit) => (
            <li key={benefit} className="flex items-start gap-3">
              <CheckCircle2 className={`w-5 h-5 mt-0.5 flex-shrink-0 bg-gradient-to-br ${feature.gradient} bg-clip-text text-transparent`} style={{ color: 'rgb(16, 185, 129)' }} />
              <span className="text-slate-300">{benefit}</span>
            </li>
          ))}
        </ul>

        {/* Stats */}
        {feature.stats && (
          <div className="flex flex-wrap gap-6">
            {feature.stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className={`text-2xl font-black bg-gradient-to-r ${feature.gradient} bg-clip-text text-transparent`}>
                  {stat.value}
                </div>
                <div className="text-xs text-slate-500 uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Visual */}
      <div className={`${isEven ? 'lg:order-2' : 'lg:order-1'}`}>
        <div className={`relative rounded-3xl bg-gradient-to-br ${feature.bgGradient} border border-white/10 p-8 overflow-hidden`}>
          {/* Decorative elements */}
          <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${feature.gradient} opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2`} />
          <div className={`absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-br ${feature.gradient} opacity-10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2`} />
          
          {/* Feature illustration */}
          <div className="relative aspect-[4/3] flex items-center justify-center">
            <div className={`w-32 h-32 bg-gradient-to-br ${feature.gradient} rounded-3xl flex items-center justify-center shadow-2xl`}>
              <div className="text-white scale-150">
                {feature.icon}
              </div>
            </div>
            
            {/* Orbiting elements */}
            <div className="absolute inset-0 animate-spin" style={{ animationDuration: '20s' }}>
              <div className="absolute top-4 left-1/2 w-12 h-12 bg-slate-800/80 border border-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Zap className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div className="absolute inset-0 animate-spin" style={{ animationDuration: '25s', animationDirection: 'reverse' }}>
              <div className="absolute bottom-4 right-8 w-10 h-10 bg-slate-800/80 border border-white/10 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <Sparkles className="w-4 h-4 text-cyan-400" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const FeatureSpotlight: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.05 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} id="feature-spotlight" className="py-24 px-4 sm:px-6 bg-slate-900 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-0 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 right-0 w-[500px] h-[500px] bg-violet-500/5 rounded-full blur-[150px]" />
      </div>

      <div className="relative max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span className="text-emerald-400 text-sm font-medium">Powerful Features</span>
          </div>
          
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-6">
            Everything Your Team Needs,
            <br />
            <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-violet-400 bg-clip-text text-transparent">
              All in One Platform
            </span>
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">
            From AI-powered automation to professional tournament management — discover why cricket teams across India choose CricSmart.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="space-y-24 lg:space-y-32">
          {features.map((feature, index) => (
            <FeatureCard
              key={feature.id}
              feature={feature}
              index={index}
              isVisible={isVisible}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureSpotlight;
