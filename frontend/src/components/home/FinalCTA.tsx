import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Sparkles, Brain, Zap } from 'lucide-react';

interface FinalCTAProps {
  onGetStarted: () => void;
}

const FinalCTA: React.FC<FinalCTAProps> = ({ onGetStarted }) => {
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
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 px-4 sm:px-6 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/50 via-slate-900 to-cyan-950/50" />
      
      {/* Animated orbs */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '6s' }} />
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-cyan-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '8s', animationDelay: '2s' }} />

      {/* Content */}
      <div className="relative max-w-3xl mx-auto text-center">
        {/* Badge */}
        <div 
          className={`inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 rounded-full mb-8 transition-all duration-700 backdrop-blur-sm ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span className="text-emerald-400 text-sm font-medium">100% Free to Use</span>
        </div>

        {/* Headline */}
        <h2 
          className={`text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-6 transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
          style={{ transitionDelay: '100ms' }}
        >
          Ready to Make Your
          <br />
          <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
            Team Management Smarter?
          </span>
        </h2>

        {/* Subtext */}
        <p 
          className={`text-slate-400 text-lg mb-8 transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
          style={{ transitionDelay: '200ms' }}
        >
          Join cricket teams across India already using CricSmart's AI-powered platform
        </p>

        {/* Feature highlights */}
        <div 
          className={`flex flex-wrap justify-center gap-4 mb-10 transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
          style={{ transitionDelay: '250ms' }}
        >
          {[
            { icon: <Brain className="w-4 h-4" />, text: 'AI Payment Verification' },
            { icon: <Zap className="w-4 h-4" />, text: 'WhatsApp Automation' },
          ].map((item) => (
            <div 
              key={item.text}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800/30 border border-slate-700/50 rounded-full text-sm text-slate-300"
            >
              <span className="text-emerald-400">{item.icon}</span>
              {item.text}
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <div 
          className={`transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
          style={{ transitionDelay: '300ms' }}
        >
          <button
            onClick={onGetStarted}
            className="group relative px-10 py-5 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white text-lg font-bold rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-emerald-500/30"
          >
            <span className="flex items-center justify-center gap-3">
              Get Started — It's Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>

            {/* Shine effect on hover */}
            <div className="absolute inset-0 rounded-2xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </div>
          </button>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
