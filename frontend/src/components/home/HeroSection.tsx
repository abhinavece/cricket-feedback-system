import React from 'react';
import { ArrowRight, Compass } from 'lucide-react';

interface HeroSectionProps {
  onGetStarted: () => void;
  onExploreGrounds: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onGetStarted, onExploreGrounds }) => {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950">
        {/* Gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-teal-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-emerald-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '2s' }} />
        
        {/* Grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-8 animate-fade-in">
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          <span className="text-emerald-400 text-sm font-medium">Built for local cricket teams</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white mb-6 leading-tight">
          Manage Your Cricket Team
          <br />
          <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
            Like Never Before
          </span>
        </h1>

        {/* Sub-headline */}
        <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
          Availability tracking, match feedback, payments & WhatsApp communication — all in one place.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={onGetStarted}
            className="group relative w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-emerald-500/25 flex items-center justify-center gap-2"
          >
            Get Started — Free
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          
          <button
            onClick={onExploreGrounds}
            className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
          >
            <Compass className="w-5 h-5" />
            Explore Grounds
          </button>
        </div>

        {/* Cricket ball illustration */}
        <div className="mt-16 relative">
          <div className="w-20 h-20 mx-auto relative">
            {/* Cricket ball */}
            <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-red-700 rounded-full shadow-2xl shadow-red-500/30">
              {/* Seam */}
              <div className="absolute inset-2 border-2 border-dashed border-white/30 rounded-full" />
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/20 transform -rotate-12" />
            </div>
            {/* Glow */}
            <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl animate-pulse" />
          </div>
          
          {/* Decorative elements */}
          <div className="absolute -left-4 top-1/2 w-8 h-0.5 bg-gradient-to-r from-transparent to-emerald-500/50" />
          <div className="absolute -right-4 top-1/2 w-8 h-0.5 bg-gradient-to-l from-transparent to-emerald-500/50" />
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-2 text-slate-400 animate-bounce">
        <span className="text-xs uppercase tracking-widest">Scroll</span>
        <div className="w-6 h-10 border-2 border-slate-600 rounded-full flex justify-center pt-2">
          <div className="w-1 h-2 bg-slate-400 rounded-full animate-pulse" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
