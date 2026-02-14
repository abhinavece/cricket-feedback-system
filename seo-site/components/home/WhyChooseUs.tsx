'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Check, 
  X, 
  Zap, 
  Shield, 
  IndianRupee,
  Smartphone,
  Globe,
  HeartHandshake,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';

interface ComparisonFeature {
  feature: string;
  cricsmart: boolean | string;
  others: boolean | string;
  highlight?: boolean;
}

const comparisonFeatures: ComparisonFeature[] = [
  { feature: 'AI Payment Verification', cricsmart: true, others: false, highlight: true },
  { feature: 'WhatsApp Integration', cricsmart: true, others: false, highlight: true },
  { feature: 'UPI Payment Support', cricsmart: true, others: false },
  { feature: 'Free for Small Teams', cricsmart: 'Up to 50 players', others: 'Limited trials' },
  { feature: 'Live Player Auctions', cricsmart: true, others: false, highlight: true },
  { feature: 'Tournament Management', cricsmart: true, others: 'Basic' },
  { feature: 'Mobile Responsive', cricsmart: true, others: true },
  { feature: 'Real-time Notifications', cricsmart: true, others: 'Email only' },
  { feature: 'Multi-admin Support', cricsmart: true, others: false },
  { feature: 'Built for Indian Teams', cricsmart: true, others: false },
];

const advantages = [
  {
    icon: <Zap className="w-6 h-6" />,
    title: 'AI-First Approach',
    description: 'Automated payment verification, smart reminders, and intelligent squad suggestions.',
    gradient: 'from-violet-500 to-purple-500'
  },
  {
    icon: <IndianRupee className="w-6 h-6" />,
    title: 'Made for India',
    description: 'UPI integration, WhatsApp support, and features built for Indian cricket culture.',
    gradient: 'from-emerald-500 to-cyan-500'
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: 'Privacy First',
    description: 'Your team data stays secure. No selling of player information to third parties.',
    gradient: 'from-blue-500 to-indigo-500'
  },
  {
    icon: <HeartHandshake className="w-6 h-6" />,
    title: 'Free Forever Plan',
    description: 'Teams up to 50 players use CricSmart completely free. No credit card needed.',
    gradient: 'from-rose-500 to-pink-500'
  },
];

const WhyChooseUs: React.FC = () => {
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
    <section ref={sectionRef} id="why-cricsmart" className="py-24 px-4 sm:px-6 bg-slate-950 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/3 left-1/4 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] bg-violet-500/5 rounded-full blur-[150px]" />
      </div>

      <div className="relative max-w-6xl mx-auto">
        {/* Header */}
        <div 
          className={`text-center mb-16 transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-6">
            <Globe className="w-4 h-4 text-emerald-400" />
            <span className="text-emerald-400 text-sm font-medium">The CricSmart Difference</span>
          </div>
          
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-6">
            Why Teams Choose
            <br />
            <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
              CricSmart Over Others
            </span>
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">
            Purpose-built for Indian cricket teams with features you won&apos;t find anywhere else.
          </p>
        </div>

        {/* Comparison Table */}
        <div 
          className={`mb-20 transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
          style={{ transitionDelay: '100ms' }}
        >
          <div className="bg-slate-800/30 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-3 bg-slate-800/50 border-b border-white/10">
              <div className="p-4 lg:p-6 text-slate-400 font-medium">Feature</div>
              <div className="p-4 lg:p-6 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 rounded-full">
                  <span className="font-bold text-emerald-400">CricSmart</span>
                </div>
              </div>
              <div className="p-4 lg:p-6 text-center text-slate-500 font-medium">Other Apps</div>
            </div>

            {/* Table Body */}
            {comparisonFeatures.map((item, index) => (
              <div 
                key={item.feature}
                className={`grid grid-cols-3 border-b border-white/5 ${
                  item.highlight ? 'bg-emerald-500/5' : ''
                } hover:bg-white/5 transition-colors`}
              >
                <div className="p-4 lg:p-5 text-slate-300 text-sm lg:text-base flex items-center gap-2">
                  {item.highlight && <Zap className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
                  {item.feature}
                </div>
                <div className="p-4 lg:p-5 flex justify-center items-center">
                  {typeof item.cricsmart === 'boolean' ? (
                    item.cricsmart ? (
                      <div className="w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center">
                        <Check className="w-5 h-5 text-emerald-400" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 bg-rose-500/20 rounded-full flex items-center justify-center">
                        <X className="w-5 h-5 text-rose-400" />
                      </div>
                    )
                  ) : (
                    <span className="text-emerald-400 text-sm font-medium">{item.cricsmart}</span>
                  )}
                </div>
                <div className="p-4 lg:p-5 flex justify-center items-center">
                  {typeof item.others === 'boolean' ? (
                    item.others ? (
                      <div className="w-8 h-8 bg-slate-700/50 rounded-full flex items-center justify-center">
                        <Check className="w-5 h-5 text-slate-400" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 bg-rose-500/10 rounded-full flex items-center justify-center">
                        <X className="w-5 h-5 text-rose-400/60" />
                      </div>
                    )
                  ) : (
                    <span className="text-slate-500 text-sm">{item.others}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Advantages Grid */}
        <div 
          className={`grid sm:grid-cols-2 lg:grid-cols-4 gap-6 transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
          style={{ transitionDelay: '200ms' }}
        >
          {advantages.map((advantage, index) => (
            <div
              key={advantage.title}
              className="group p-6 bg-slate-800/30 backdrop-blur-sm border border-white/10 rounded-2xl hover:border-emerald-500/30 transition-all"
            >
              <div className={`w-12 h-12 bg-gradient-to-br ${advantage.gradient} rounded-xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}>
                {advantage.icon}
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{advantage.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{advantage.description}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div 
          className={`text-center mt-16 transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
          style={{ transitionDelay: '300ms' }}
        >
          <Link
            href="/auth/login?redirect=https%3A%2F%2Fapp.cricsmart.in&service=team"
            className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-bold rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-emerald-500/25"
          >
            Start Free Today
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <p className="mt-4 text-sm text-slate-500">No credit card required • Free forever for small teams</p>
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
