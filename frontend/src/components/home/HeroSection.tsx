import React, { useEffect, useRef } from 'react';
import { ArrowRight, Sparkles, Zap, Brain } from 'lucide-react';

interface HeroSectionProps {
  onGetStarted: () => void;
  onExploreGrounds: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onGetStarted, onExploreGrounds }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Animated neural network background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Particles
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      opacity: number;
    }> = [];

    const numParticles = Math.min(80, Math.floor(window.innerWidth / 15));
    
    for (let i = 0; i < numParticles; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 2 + 1,
        opacity: Math.random() * 0.5 + 0.2,
      });
    }

    let animationId: number;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around edges
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(16, 185, 129, ${p.opacity})`;
        ctx.fill();

        // Draw connections
        particles.slice(i + 1).forEach((p2) => {
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(16, 185, 129, ${0.15 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <section className="relative min-h-[100vh] flex items-center justify-center overflow-hidden">
      {/* Dark gradient base */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" />
      
      {/* Neural network canvas */}
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 pointer-events-none"
        style={{ opacity: 0.6 }}
      />

      {/* Gradient orbs - AI themed colors */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-emerald-500/15 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '8s', animationDelay: '2s' }} />
        <div className="absolute top-1/3 right-1/3 w-[300px] h-[300px] bg-teal-500/10 rounded-full blur-[80px] animate-pulse" style={{ animationDuration: '7s', animationDelay: '1s' }} />
      </div>

      {/* Grid overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(16, 185, 129, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(16, 185, 129, 0.3) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center pt-20">
        {/* AI Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 rounded-full mb-8 backdrop-blur-sm animate-home-fade-in">
          <Brain className="w-4 h-4 text-emerald-400" />
          <span className="text-emerald-400 text-sm font-medium">AI-Powered Cricket Management</span>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white mb-6 leading-[1.1] tracking-tight">
          <span className="block">Smart Cricket</span>
          <span className="block mt-2">
            <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
              Team Management
            </span>
          </span>
        </h1>

        {/* Sub-headline with AI emphasis */}
        <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto mb-4 leading-relaxed">
          The intelligent platform for cricket teams. 
          <span className="text-emerald-400"> AI-powered payment verification</span>, 
          WhatsApp automation, and smart squad building.
        </p>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {['AI OCR Payments', 'Smart Availability', 'Auto Reminders', 'Match Analytics'].map((feature, i) => (
            <span 
              key={feature}
              className="px-3 py-1.5 bg-slate-800/50 border border-slate-700/50 rounded-full text-xs text-slate-400 backdrop-blur-sm"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <Zap className="w-3 h-3 inline mr-1 text-emerald-500" />
              {feature}
            </span>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={onGetStarted}
            className="group relative w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-bold rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-emerald-500/30 flex items-center justify-center gap-2 overflow-hidden"
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            <Sparkles className="w-5 h-5" />
            Get Started Free
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          
          <button
            onClick={onExploreGrounds}
            className="w-full sm:w-auto px-8 py-4 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 hover:border-emerald-500/30 text-white font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 backdrop-blur-sm"
          >
            See How It Works
          </button>
        </div>

        {/* Stats row */}
        <div className="mt-16 pt-8 border-t border-slate-800/50 grid grid-cols-3 gap-4 max-w-xl mx-auto">
          {[
            { value: '500+', label: 'Active Players' },
            { value: '50+', label: 'Cricket Grounds' },
            { value: '1000+', label: 'Matches Managed' },
          ].map((stat, i) => (
            <div key={stat.label} className="text-center" style={{ animationDelay: `${i * 150}ms` }}>
              <div className="text-2xl sm:text-3xl font-black text-white">{stat.value}</div>
              <div className="text-xs sm:text-sm text-slate-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-2 text-slate-500">
        <div className="w-6 h-10 border-2 border-slate-700 rounded-full flex justify-center pt-2">
          <div className="w-1 h-2 bg-emerald-500 rounded-full animate-bounce" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
