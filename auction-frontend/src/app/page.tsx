'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { 
  Gavel, Users, Zap, BarChart3, Shield, Eye, ArrowRight, 
  Timer, TrendingUp, Play, ChevronRight, ChevronLeft, Check, Radio,
  Layers, Target, Award, Rocket, Activity
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
// PREMIUM ANIMATED CANVAS BACKGROUND
// ═══════════════════════════════════════════════════════════════
const PremiumBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let particles: Array<{
      x: number; y: number; vx: number; vy: number;
      size: number; opacity: number; hue: number;
    }> = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight * 3;
    };

    const initParticles = () => {
      particles = [];
      const count = Math.min(80, Math.floor(canvas.width / 25));
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          size: Math.random() * 2 + 0.5,
          opacity: Math.random() * 0.5 + 0.1,
          hue: Math.random() > 0.5 ? 38 : 280,
        });
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 80%, 60%, ${p.opacity})`;
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const dx = p.x - particles[j].x;
          const dy = p.y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `hsla(${p.hue}, 70%, 50%, ${0.08 * (1 - dist / 150)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      });

      animationId = requestAnimationFrame(draw);
    };

    resize();
    initParticles();
    draw();

    window.addEventListener('resize', () => {
      resize();
      initParticles();
    });

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none opacity-60"
      style={{ zIndex: 0 }}
    />
  );
};

// ═══════════════════════════════════════════════════════════════
// ANIMATED NUMBER COUNTER
// ═══════════════════════════════════════════════════════════════
const AnimatedCounter = ({ target, suffix = '' }: { target: string; suffix?: string }) => {
  const [count, setCount] = useState('0');
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const num = parseInt(target.replace(/[^0-9]/g, ''));
    if (isNaN(num)) {
      setCount(target);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          let start = 0;
          const duration = 2000;
          const startTime = performance.now();

          const animate = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 4);
            start = Math.floor(eased * num);
            setCount(start.toLocaleString());
            if (progress < 1) requestAnimationFrame(animate);
          };

          requestAnimationFrame(animate);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return <span ref={ref}>{count}{suffix}</span>;
};

// ═══════════════════════════════════════════════════════════════
// DATA
// ═══════════════════════════════════════════════════════════════
const features = [
  {
    icon: Zap,
    title: 'Real-Time Bidding Engine',
    description: 'WebSocket-powered live auctions with sub-50ms latency. Going-once/twice timers, instant bid updates, and real-time purse tracking.',
    highlight: 'Sub-50ms latency',
  },
  {
    icon: Users,
    title: 'Team & Squad Management',
    description: 'Create unlimited teams with custom budgets. Manage retained players, captain designations, role-based slots, and track composition live.',
    highlight: 'Unlimited teams',
  },
  {
    icon: BarChart3,
    title: 'Advanced Analytics',
    description: 'Post-auction insights with spending breakdowns, role-wise pricing analysis, value picks identification, and exportable reports.',
    highlight: 'Deep insights',
  },
  {
    icon: Shield,
    title: 'Admin Control Center',
    description: 'Undo last 3 actions, pause mid-bid, disqualify players with automatic purse refunds. Complete oversight with manual overrides.',
    highlight: 'Full control',
  },
  {
    icon: Eye,
    title: 'Spectator Broadcasting',
    description: 'Public live view for unlimited spectators. Share your auction link and let anyone watch the bidding war unfold in real-time.',
    highlight: 'Unlimited viewers',
  },
  {
    icon: Timer,
    title: 'Configurable Auction Rules',
    description: 'Tiered bid increments, customizable windows, going-once/twice phases, player pools, RTM rules — configure every aspect.',
    highlight: 'IPL-style rules',
  },
];

const stats = [
  { value: '100', suffix: '+', label: 'Auctions Completed' },
  { value: '6000', suffix: '+', label: 'Players Auctioned' },
  { value: '50', suffix: 'ms', label: 'Average Latency' },
  { value: '99.9', suffix: '%', label: 'Uptime SLA' },
];

const processSteps = [
  {
    num: '01',
    title: 'Configure',
    description: 'Set up your auction with custom rules, teams, budgets, and player pools. Import via Excel or add manually.',
    icon: Layers,
  },
  {
    num: '02',
    title: 'Go Live',
    description: 'Launch your auction. Teams bid in real-time via secure magic links. Spectators watch the action unfold.',
    icon: Radio,
  },
  {
    num: '03',
    title: 'Analyze',
    description: 'Review comprehensive analytics, export results, and share public dashboards with all stakeholders.',
    icon: Target,
  },
];

const testimonials = [
  {
    quote: "The most professional auction platform we've used. Our corporate league felt like a real IPL event.",
    author: 'Rajesh Kumar',
    role: 'Tournament Director, TechCorp Premier League',
    avatar: 'RK',
  },
  {
    quote: "Real-time bidding with zero lag. The spectator mode made our auction a community event with 500+ viewers.",
    author: 'Priya Sharma',
    role: 'Organizer, Bangalore Corporate Cricket',
    avatar: 'PS',
  },
  {
    quote: "From setup to final analytics, everything just works. We've run 12 auctions without a single issue.",
    author: 'Amit Patel',
    role: 'Secretary, Mumbai Cricket Association',
    avatar: 'AP',
  },
];

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function HomePage() {
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative min-h-screen bg-slate-950 overflow-hidden">
      <PremiumBackground />
      
      {/* Gradient overlays */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-amber-500/10 rounded-full blur-[150px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '12s', animationDelay: '4s' }} />
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          HERO SECTION
          ═══════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 pb-32">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-amber-500/10 border border-amber-500/20 mb-10 backdrop-blur-sm animate-fade-in">
              <div className="relative flex items-center justify-center w-5 h-5">
                <div className="absolute w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
                <div className="w-2 h-2 bg-emerald-400 rounded-full" />
              </div>
              <span className="text-sm font-medium bg-gradient-to-r from-amber-200 to-orange-200 bg-clip-text text-transparent">
                Trusted by 500+ Cricket Leagues Worldwide
              </span>
            </div>

            {/* Main headline */}
            <h1 className="text-5xl sm:text-7xl lg:text-[5.5rem] font-bold tracking-tight mb-8 animate-slide-up">
              <span className="block text-white mb-2">The Ultimate Platform for</span>
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400 bg-clip-text text-transparent">
                  Cricket Auctions
                </span>
                <svg className="absolute -bottom-2 left-0 w-full h-3 text-amber-500/30" viewBox="0 0 200 8" preserveAspectRatio="none">
                  <path d="M0,5 Q50,0 100,5 T200,5" stroke="currentColor" strokeWidth="2" fill="none" />
                </svg>
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl text-slate-400 max-w-3xl mx-auto mb-12 leading-relaxed animate-slide-up" style={{ animationDelay: '0.1s' }}>
              Run professional cricket player auctions with real-time bidding, live spectator broadcasting, 
              and comprehensive analytics. Built for leagues that demand excellence.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <Link href="/admin" className="group relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 rounded-2xl blur-xl opacity-50 group-hover:opacity-80 transition-all duration-500 group-hover:scale-105" />
                <div className="relative flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl shadow-2xl shadow-amber-500/25 hover:shadow-amber-500/40 transition-all duration-300">
                  <Rocket className="w-5 h-5" />
                  Start Your Auction
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
              <Link 
                href="/explore" 
                className="group flex items-center gap-3 px-8 py-4 bg-white/5 border border-white/10 text-white font-medium rounded-xl hover:bg-white/10 hover:border-white/20 backdrop-blur-sm transition-all duration-300"
              >
                <Play className="w-5 h-5 text-amber-400" />
                Watch Live Auctions
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          STATS SECTION
          ═══════════════════════════════════════════════════════════════ */}
      <section className="relative py-20 border-y border-white/5 bg-slate-900/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center group">
                <div className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent mb-2">
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-sm sm:text-base text-slate-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          FEATURES SECTION
          ═══════════════════════════════════════════════════════════════ */}
      <section className="relative py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 mb-6">
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-medium text-amber-300">Enterprise-Grade Features</span>
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
              Built for <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">Professional</span> Leagues
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Every feature crafted to deliver a seamless, broadcast-quality auction experience
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature) => (
              <div 
                key={feature.title}
                className="group relative p-5 rounded-xl bg-gradient-to-br from-slate-900/80 to-slate-800/50 border border-white/5 hover:border-amber-500/30 transition-all duration-500 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative">
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-105 group-hover:border-amber-500/40 transition-all duration-500">
                      <feature.icon className="w-5 h-5 text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base font-semibold text-white group-hover:text-amber-400 transition-colors truncate">
                          {feature.title}
                        </h3>
                      </div>
                      <span className="inline-block px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[9px] font-bold uppercase tracking-wider mb-2">
                        {feature.highlight}
                      </span>
                      <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          HOW IT WORKS
          ═══════════════════════════════════════════════════════════════ */}
      <section className="relative py-20 bg-gradient-to-b from-slate-900/50 to-transparent">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Three Steps to <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">Success</span>
            </h2>
            <p className="text-base text-slate-400 max-w-xl mx-auto">
              From setup to analytics, run your auction like a professional league
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
            
            {processSteps.map((step, idx) => (
              <div key={step.num} className="relative text-center group">
                <div className="relative inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 mb-5 group-hover:border-amber-500/30 transition-all duration-500">
                  <step.icon className="w-6 h-6 text-amber-400 relative z-10" />
                  <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-amber-500/30">
                    {idx + 1}
                  </div>
                </div>
                
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-amber-400 transition-colors">
                  {step.title}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed max-w-[200px] mx-auto">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          TESTIMONIALS
          ═══════════════════════════════════════════════════════════════ */}
      <section className="relative py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-4">
              <Award className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-medium text-emerald-300">Trusted Worldwide</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              Loved by <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Organizers</span>
            </h2>
          </div>

          <div className="relative">
            {/* Left/Right Navigation */}
            <button
              onClick={() => setActiveTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length)}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 sm:-translate-x-6 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-800/80 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700/80 hover:border-white/20 transition-all duration-300 backdrop-blur-sm"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setActiveTestimonial((prev) => (prev + 1) % testimonials.length)}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 sm:translate-x-6 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-800/80 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700/80 hover:border-white/20 transition-all duration-300 backdrop-blur-sm"
              aria-label="Next testimonial"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-800/70 border border-white/10 p-8 sm:p-10">
              {testimonials.map((testimonial, idx) => (
                <div 
                  key={idx}
                  className={`transition-all duration-500 ${idx === activeTestimonial ? 'opacity-100' : 'opacity-0 absolute inset-0 pointer-events-none'}`}
                >
                  <blockquote className="text-lg sm:text-xl text-white font-medium leading-relaxed mb-6 text-center">
                    &ldquo;{testimonial.quote}&rdquo;
                  </blockquote>
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-sm font-bold text-white mb-3">
                      {testimonial.avatar}
                    </div>
                    <div className="text-white font-semibold text-sm">{testimonial.author}</div>
                    <div className="text-xs text-slate-400">{testimonial.role}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center gap-2 mt-5">
              {testimonials.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveTestimonial(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === activeTestimonial ? 'w-6 bg-amber-500' : 'w-1.5 bg-slate-600 hover:bg-slate-500'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          FINAL CTA
          ═══════════════════════════════════════════════════════════════ */}
      <section className="relative py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="relative rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-purple-500/20" />
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-3xl" />
            
            <div className="relative p-8 sm:p-12 text-center">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200px] h-[100px] bg-amber-500/30 rounded-full blur-[60px]" />
              
              <div className="relative">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 mb-5 shadow-xl shadow-amber-500/30">
                  <TrendingUp className="w-7 h-7 text-white" />
                </div>
                
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4">
                  Ready to Transform Your <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">Cricket Auction?</span>
                </h2>
                
                <p className="text-sm sm:text-base text-slate-300 mb-6 max-w-md mx-auto">
                  Join 500+ leagues running professional auctions. Free to start, no credit card required.
                </p>
                
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link href="/admin" className="group relative">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 rounded-xl blur-lg opacity-50 group-hover:opacity-80 transition-all duration-500" />
                    <div className="relative flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-semibold rounded-lg shadow-xl">
                      Get Started Free
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </Link>
                  <Link 
                    href="/explore"
                    className="flex items-center gap-2 px-5 py-3 text-slate-300 text-sm font-medium hover:text-white transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    See Live Demo
                  </Link>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-4 mt-6 pt-5 border-t border-white/5">
                  {['No Credit Card', 'Free Forever Plan', 'Cancel Anytime'].map((badge) => (
                    <div key={badge} className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      {badge}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
