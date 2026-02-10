'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Send, BarChart3, Trophy, CreditCard, RefreshCw, ArrowRight, CheckCircle2 } from 'lucide-react';

interface Step {
  number: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const steps: Step[] = [
  {
    number: 1,
    title: 'Create Match',
    description: 'Set up your match with opponent, ground, date & time in seconds',
    icon: <Calendar className="w-6 h-6" />,
    color: 'from-emerald-500 to-emerald-600',
  },
  {
    number: 2,
    title: 'Invite Squad',
    description: 'Auto-send WhatsApp availability requests to all players',
    icon: <Send className="w-6 h-6" />,
    color: 'from-cyan-500 to-cyan-600',
  },
  {
    number: 3,
    title: 'Track Response',
    description: "Real-time dashboard showing who's in, out, or maybe",
    icon: <BarChart3 className="w-6 h-6" />,
    color: 'from-teal-500 to-teal-600',
  },
  {
    number: 4,
    title: 'Play Match',
    description: 'Know your final XI and hit the ground with confidence',
    icon: <Trophy className="w-6 h-6" />,
    color: 'from-amber-500 to-amber-600',
  },
  {
    number: 5,
    title: 'Manage Payment',
    description: 'AI verifies payment screenshots automatically',
    icon: <CreditCard className="w-6 h-6" />,
    color: 'from-violet-500 to-violet-600',
  },
  {
    number: 6,
    title: 'Plan Next',
    description: 'Analyze performance, gather feedback, repeat',
    icon: <RefreshCw className="w-6 h-6" />,
    color: 'from-rose-500 to-rose-600',
  },
];

const StepCard: React.FC<{ step: Step; index: number; isVisible: boolean; total: number }> = ({ step, index, isVisible, total }) => {
  return (
    <div
      className={`relative group transition-all duration-700 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      {/* Connector line - horizontal on desktop */}
      {index < total - 1 && (
        <div className="hidden lg:block absolute top-8 left-[60%] w-full h-[2px]">
          <div className="h-full bg-gradient-to-r from-slate-700 via-emerald-500/30 to-slate-700 opacity-50" />
          <ArrowRight className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
        </div>
      )}
      
      {/* Mobile connector */}
      {index < total - 1 && (
        <div className="lg:hidden absolute top-full left-1/2 w-[2px] h-6 -translate-x-1/2">
          <div className="h-full bg-gradient-to-b from-emerald-500/50 to-transparent" />
        </div>
      )}

      {/* Card */}
      <div className="relative flex flex-col items-center text-center p-4">
        {/* Icon container with glow */}
        <div className="relative mb-4">
          {/* Glow effect */}
          <div className={`absolute inset-0 bg-gradient-to-br ${step.color} rounded-2xl blur-xl opacity-0 group-hover:opacity-40 transition-opacity duration-500`} />
          
          {/* Icon box */}
          <div className={`relative w-16 h-16 bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
            <div className="text-white">
              {step.icon}
            </div>
          </div>
          
          {/* Step number badge */}
          <div className="absolute -top-2 -right-2 w-7 h-7 bg-slate-800 border-2 border-slate-700 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-lg">
            {step.number}
          </div>
        </div>

        {/* Content */}
        <h3 className="text-lg font-bold text-white mb-1 group-hover:text-emerald-400 transition-colors">
          {step.title}
        </h3>
        <p className="text-slate-400 text-sm leading-relaxed max-w-[180px]">
          {step.description}
        </p>
      </div>
    </div>
  );
};

const HowItWorks: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
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
    <section ref={sectionRef} id="how-it-works" className="py-24 px-4 sm:px-6 bg-slate-950 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] bg-cyan-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative max-w-6xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-6">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-emerald-400 text-sm font-medium">Simple 6-Step Process</span>
          </div>
          
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-4">
            How <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">CricSmart</span> Works
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto text-lg">
            From match creation to payment settlement — your complete cricket management cycle
          </p>
        </div>

        {/* Steps grid - 6 columns on desktop, 2 on tablet, 1 on mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6 lg:gap-4">
          {steps.map((step, index) => (
            <StepCard 
              key={step.number} 
              step={step} 
              index={index} 
              isVisible={isVisible}
              total={steps.length}
            />
          ))}
        </div>

        {/* Bottom decoration - cycle indicator */}
        <div className="hidden lg:flex justify-center mt-12">
          <div className="flex items-center gap-3 px-6 py-3 bg-slate-800/50 border border-slate-700/50 rounded-full">
            <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin" style={{ animationDuration: '8s' }} />
            <span className="text-sm text-slate-400">Continuous improvement cycle for your team</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
