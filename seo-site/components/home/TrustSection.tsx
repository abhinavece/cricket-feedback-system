'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Calendar, ArrowRight, Users, Shield, Zap } from 'lucide-react';

const TrustSection: React.FC = () => {
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
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const badges = [
    { icon: <Users className="w-4 h-4" />, text: '500+ Active Players' },
    { icon: <Calendar className="w-4 h-4" />, text: 'Since 2023' },
    { icon: <Shield className="w-4 h-4" />, text: 'Secure & Private' },
    { icon: <Zap className="w-4 h-4" />, text: 'AI-Powered' },
  ];

  return (
    <section ref={sectionRef} className="py-24 px-4 sm:px-6 bg-slate-950 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative max-w-4xl mx-auto text-center">
        {/* Logo mark */}
        <div 
          className={`mb-8 transition-all duration-700 ${
            isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-2xl border border-emerald-500/20">
            <span className="text-4xl font-black bg-gradient-to-br from-emerald-400 to-cyan-400 bg-clip-text text-transparent">C</span>
          </div>
        </div>

        {/* Headline */}
        <h2 
          className={`text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-6 transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
          style={{ transitionDelay: '100ms' }}
        >
          Built by Cricket Enthusiasts
          <br />
          <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            For Cricket Teams
          </span>
        </h2>

        {/* Description */}
        <p 
          className={`text-slate-400 text-lg max-w-2xl mx-auto mb-8 leading-relaxed transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
          style={{ transitionDelay: '200ms' }}
        >
          CricSmart started as a solution to our own team management challenges. 
          We combined our love for cricket with AI technology to create something that actually works 
          for local cricket teams.
        </p>

        {/* Badges */}
        <div 
          className={`flex flex-wrap justify-center gap-3 mb-10 transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
          style={{ transitionDelay: '300ms' }}
        >
          {badges.map((badge) => (
            <div
              key={badge.text}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-full text-slate-300 text-sm backdrop-blur-sm"
            >
              <span className="text-emerald-400">{badge.icon}</span>
              {badge.text}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div 
          className={`transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
          style={{ transitionDelay: '400ms' }}
        >
          <Link
            href="/about"
            className="group inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
          >
            Learn About Us
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default TrustSection;
