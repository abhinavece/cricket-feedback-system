'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Users, 
  Trophy, 
  Building2, 
  Briefcase,
  ArrowRight,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

interface UseCase {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  painPoints: string[];
  solutions: string[];
  cta: string;
  href: string;
  gradient: string;
  popular?: boolean;
}

const useCases: UseCase[] = [
  {
    id: 'weekend-teams',
    icon: <Users className="w-7 h-7" />,
    title: 'Weekend Cricket Teams',
    description: 'Local teams playing friendly matches every weekend. Managing 20-50 players, tracking who\'s available, and collecting match fees.',
    painPoints: [
      'Chasing players for availability via calls/texts',
      'Manual payment tracking in spreadsheets',
      'Last-minute dropouts ruining matches'
    ],
    solutions: [
      'One-tap WhatsApp availability responses',
      'AI-powered payment verification',
      'Real-time squad visibility dashboard'
    ],
    cta: 'Start Managing Your Team',
    href: '/auth/login?redirect=https%3A%2F%2Fapp.cricsmart.in&service=team',
    gradient: 'from-emerald-500 to-cyan-500',
    popular: true
  },
  {
    id: 'tournaments',
    icon: <Trophy className="w-7 h-7" />,
    title: 'Tournament Organizers',
    description: 'Running cricket tournaments with multiple teams, managing registrations, fixtures, and prize money distribution.',
    painPoints: [
      'Complex fixture scheduling',
      'Payment collection from multiple teams',
      'Manual score updates and leaderboards'
    ],
    solutions: [
      'Automated fixture generation',
      'Centralized payment tracking',
      'Live scoring with auto leaderboards'
    ],
    cta: 'Organize Your Tournament',
    href: '/auth/login?redirect=https%3A%2F%2Ftournament.cricsmart.in&service=tournament',
    gradient: 'from-violet-500 to-purple-500'
  },
  {
    id: 'corporate',
    icon: <Building2 className="w-7 h-7" />,
    title: 'Corporate Cricket Leagues',
    description: 'Companies running internal cricket leagues with inter-department tournaments and employee engagement activities.',
    painPoints: [
      'Coordinating across departments',
      'Budget management and approvals',
      'Engaging non-playing employees'
    ],
    solutions: [
      'Multi-admin team management',
      'Detailed financial reports',
      'Spectator mode for viewers'
    ],
    cta: 'Setup Corporate League',
    href: '/auth/login?redirect=https%3A%2F%2Ftournament.cricsmart.in&service=tournament',
    gradient: 'from-blue-500 to-indigo-500'
  },
  {
    id: 'leagues',
    icon: <Briefcase className="w-7 h-7" />,
    title: 'Local Cricket Leagues',
    description: 'Community-run leagues with player auctions, season-long competitions, and professional-style management.',
    painPoints: [
      'Running fair player auctions',
      'Season-long stat tracking',
      'Maintaining competitive balance'
    ],
    solutions: [
      'IPL-style live auction system',
      'Comprehensive analytics dashboard',
      'Budget caps and trading windows'
    ],
    cta: 'Launch Your League',
    href: '/auth/login?redirect=https%3A%2F%2Fauction.cricsmart.in&service=auction',
    gradient: 'from-amber-500 to-orange-500'
  },
];

const UseCaseCard: React.FC<{ useCase: UseCase; index: number; isVisible: boolean }> = ({ useCase, index, isVisible }) => {
  return (
    <div
      className={`group relative bg-slate-800/30 backdrop-blur-sm border border-white/10 rounded-2xl p-6 lg:p-8 transition-all duration-700 hover:border-emerald-500/30 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      {/* Popular badge */}
      {useCase.popular && (
        <div className="absolute -top-3 left-6 px-3 py-1 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full text-xs font-bold text-white">
          Most Popular
        </div>
      )}

      {/* Icon */}
      <div className={`w-14 h-14 bg-gradient-to-br ${useCase.gradient} rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform`}>
        {useCase.icon}
      </div>

      {/* Title & Description */}
      <h3 className="text-xl font-bold text-white mb-2">{useCase.title}</h3>
      <p className="text-slate-400 text-sm mb-6 leading-relaxed">{useCase.description}</p>

      {/* Pain Points → Solutions */}
      <div className="space-y-4 mb-6">
        <div>
          <div className="text-xs uppercase tracking-wider text-slate-500 mb-2">Common Challenges</div>
          <ul className="space-y-1.5">
            {useCase.painPoints.map((point) => (
              <li key={point} className="flex items-start gap-2 text-sm text-slate-400">
                <span className="text-rose-400 mt-0.5">✕</span>
                {point}
              </li>
            ))}
          </ul>
        </div>
        
        <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
        
        <div>
          <div className="text-xs uppercase tracking-wider text-emerald-400 mb-2">CricSmart Solution</div>
          <ul className="space-y-1.5">
            {useCase.solutions.map((solution) => (
              <li key={solution} className="flex items-start gap-2 text-sm text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                {solution}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* CTA */}
      <Link
        href={useCase.href}
        className={`flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r ${useCase.gradient} text-white font-semibold rounded-xl transition-all hover:shadow-lg hover:scale-[1.02]`}
      >
        {useCase.cta}
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
};

const UseCases: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} id="use-cases" className="py-24 px-4 sm:px-6 bg-slate-900 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-violet-500/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[150px]" />
      </div>

      <div className="relative max-w-6xl mx-auto">
        {/* Header */}
        <div 
          className={`text-center mb-16 transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500/10 border border-violet-500/20 rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-violet-400" />
            <span className="text-violet-400 text-sm font-medium">Built For You</span>
          </div>
          
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-6">
            Perfect For Every
            <br />
            <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-violet-400 bg-clip-text text-transparent">
              Cricket Community
            </span>
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">
            Whether you run a weekend team or a professional league, CricSmart adapts to your needs.
          </p>
        </div>

        {/* Use Case Cards */}
        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
          {useCases.map((useCase, index) => (
            <UseCaseCard
              key={useCase.id}
              useCase={useCase}
              index={index}
              isVisible={isVisible}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default UseCases;
