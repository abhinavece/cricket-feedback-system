import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Trophy,
  Users,
  BarChart3,
  Upload,
  Shield,
  Zap,
  ArrowRight,
  ChevronRight,
  Star,
  Globe,
  Sparkles,
  Play,
  Check,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface LandingPageProps {
  embedded?: boolean; // When true, shown within authenticated Layout (hides nav)
}

// ---------- Animated Background ----------
const ParticleCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const particles: Array<{
      x: number; y: number; vx: number; vy: number; r: number; o: number;
    }> = [];
    const count = Math.min(60, Math.floor(window.innerWidth / 20));
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 1.5 + 0.5,
        o: Math.random() * 0.4 + 0.15,
      });
    }

    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(139, 92, 246, ${p.o})`;
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const dx = p.x - particles[j].x;
          const dy = p.y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(139, 92, 246, ${0.12 * (1 - dist / 100)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      });
      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" style={{ opacity: 0.5 }} />;
};

// ---------- Stat Counter Animation ----------
const AnimatedNumber: React.FC<{ target: string; suffix?: string }> = ({ target, suffix = '' }) => {
  const [display, setDisplay] = useState('0');
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const num = parseInt(target.replace(/[^0-9]/g, ''));
    if (isNaN(num)) { setDisplay(target); return; }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          let start = 0;
          const duration = 1500;
          const startTime = performance.now();
          const animate = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            start = Math.floor(eased * num);
            setDisplay(start.toLocaleString());
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

  return <span ref={ref}>{display}{suffix}</span>;
};

// ---------- Feature Data ----------
const features = [
  {
    icon: Trophy,
    title: 'Tournament Setup',
    desc: 'Create and configure tournaments in minutes. Custom branding, rules, and schedules.',
    gradient: 'from-violet-500 to-purple-600',
    glow: 'violet-500',
  },
  {
    icon: Users,
    title: 'Team & Franchise System',
    desc: 'Set up franchises with team admins. Each team manages their own roster independently.',
    gradient: 'from-blue-500 to-cyan-500',
    glow: 'blue-500',
  },
  {
    icon: Upload,
    title: 'Bulk Player Import',
    desc: 'Import hundreds of players via Excel or CSV. Smart column auto-detection.',
    gradient: 'from-emerald-500 to-teal-500',
    glow: 'emerald-500',
  },
  {
    icon: Globe,
    title: 'Public Registration Links',
    desc: 'Share a link and let players register themselves. Filterable player pools.',
    gradient: 'from-amber-500 to-orange-500',
    glow: 'amber-500',
  },
  {
    icon: BarChart3,
    title: 'Analytics & Insights',
    desc: 'Player performance dashboards. Team comparisons and tournament statistics.',
    gradient: 'from-pink-500 to-rose-500',
    glow: 'pink-500',
  },
  {
    icon: Zap,
    title: 'Auction Integration',
    desc: 'Seamlessly connect with CricSmart Auctions for live player bidding events.',
    gradient: 'from-yellow-500 to-amber-500',
    glow: 'yellow-500',
  },
];

const steps = [
  {
    num: '01',
    title: 'Create Tournament',
    desc: 'Set up your tournament with custom branding, rules, and team configuration.',
    icon: Trophy,
  },
  {
    num: '02',
    title: 'Add Teams & Players',
    desc: 'Build franchises, import player pools via CSV, or share a registration link.',
    icon: Users,
  },
  {
    num: '03',
    title: 'Go Live',
    desc: 'Publish your tournament, run auctions, and track performance in real-time.',
    icon: Play,
  },
];

const testimonials = [
  {
    name: 'Rahul Sharma',
    role: 'Tournament Organizer, Delhi',
    quote: 'CricSmart cut our tournament setup time from days to minutes. The franchise system is brilliant.',
    rating: 5,
  },
  {
    name: 'Priya Patel',
    role: 'League Coordinator, Mumbai',
    quote: 'Managing 16 teams and 200+ players was chaos before CricSmart. Now it\'s seamless.',
    rating: 5,
  },
  {
    name: 'Arjun Reddy',
    role: 'Corporate Cricket League',
    quote: 'The auction integration made our annual draft night the most exciting event of the year.',
    rating: 5,
  },
];

// ---------- Main Landing Page ----------
const LandingPage: React.FC<LandingPageProps> = ({ embedded = false }) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Only redirect to dashboard if not embedded (standalone landing page)
  useEffect(() => {
    if (isAuthenticated && !embedded) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate, embedded]);

  const handleGetStarted = () => {
    const siteUrl = import.meta.env.VITE_SITE_URL || 'https://cricsmart.in';
    const currentOrigin = window.location.origin;
    window.location.href = `${siteUrl}/auth/login?redirect=${encodeURIComponent(currentOrigin)}&service=tournament`;
  };

  return (
    <div className={`${embedded ? '' : 'min-h-screen'} text-white overflow-x-hidden bg-broadcast-900`}>
      {/* ==================== NAV (hidden when embedded in Layout) ==================== */}
      {!embedded && (
      <nav className="fixed top-0 left-0 right-0 z-50 bg-broadcast-900/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <a href="https://cricsmart.in" className="flex items-center gap-2.5 group">
              <div className="relative w-9 h-9 group-hover:scale-110 transition-transform duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg shadow-lg shadow-violet-500/20" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="hidden sm:block">
                <span className="font-display text-lg tracking-wide text-white">CricSmart</span>
                <p className="text-[10px] font-heading uppercase tracking-widest text-violet-400 -mt-1">Tournament Hub</p>
              </div>
            </a>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Features</a>
              <a href="#how-it-works" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">How It Works</a>
              <a href="#testimonials" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Testimonials</a>
              <button
                onClick={handleGetStarted}
                className="px-5 py-2 rounded-lg text-sm font-heading uppercase tracking-wider bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500 transition-all shadow-lg shadow-violet-500/25 active:scale-[0.97]"
              >
                Get Started
              </button>
            </div>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-broadcast-800/95 backdrop-blur-xl border-t border-white/5 animate-slide-down">
            <div className="px-4 py-4 space-y-3">
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-white/5">Features</a>
              <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-white/5">How It Works</a>
              <a href="#testimonials" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-white/5">Testimonials</a>
              <button
                onClick={handleGetStarted}
                className="w-full px-5 py-3 rounded-lg text-sm font-heading uppercase tracking-wider bg-gradient-to-r from-violet-500 to-purple-600 text-white"
              >
                Get Started Free
              </button>
            </div>
          </div>
        )}
      </nav>
      )}

      {/* ==================== HERO ==================== */}
      <section className="relative min-h-[90vh] sm:min-h-screen flex items-center pt-16">
        {/* Background layers */}
        <div className="absolute inset-0 bg-gradient-to-b from-broadcast-900 via-[#0d0a1a] to-broadcast-900" />
        <ParticleCanvas />

        {/* Gradient orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/6 w-[400px] h-[400px] bg-violet-500/15 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '7s' }} />
          <div className="absolute bottom-1/3 right-1/4 w-[350px] h-[350px] bg-purple-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '9s', animationDelay: '2s' }} />
          <div className="absolute top-1/2 right-1/6 w-[250px] h-[250px] bg-fuchsia-500/8 rounded-full blur-[80px] animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
        </div>

        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.015] pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(rgba(139, 92, 246, 0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(139, 92, 246, 0.4) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 mb-6 sm:mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <Sparkles className="w-4 h-4 text-violet-400" />
              <span className="text-xs sm:text-sm font-medium text-violet-300 uppercase tracking-wider">Powered by CricSmart AI</span>
            </div>

            {/* Main heading */}
            <h1
              className="text-4xl sm:text-6xl lg:text-7xl font-bold leading-[0.95] mb-4 sm:mb-6 animate-fade-in-up"
              style={{ fontFamily: "'Bebas Neue', sans-serif", animationDelay: '0.2s' }}
            >
              <span className="text-white">Run Your Cricket</span>
              <br />
              <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
                Tournament Like a Pro
              </span>
            </h1>

            {/* Subheading */}
            <p
              className="text-base sm:text-lg lg:text-xl text-slate-400 max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed animate-fade-in-up"
              style={{ fontFamily: "'DM Sans', sans-serif", animationDelay: '0.3s' }}
            >
              Create tournaments, manage franchises, import players, and run live auctions — all from one beautiful platform.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-12 sm:mb-16 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              <button
                onClick={handleGetStarted}
                className="w-full sm:w-auto group px-8 py-3.5 rounded-xl text-base font-heading uppercase tracking-wider bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500 transition-all shadow-xl shadow-violet-500/25 hover:shadow-violet-500/40 active:scale-[0.97] flex items-center justify-center gap-2"
              >
                Create Tournament
                <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <a
                href="#how-it-works"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl text-base font-heading uppercase tracking-wider bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" />
                See How It Works
              </a>
            </div>

            {/* Stats Bar */}
            <div className="flex items-center justify-center gap-6 sm:gap-12 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
              {[
                { value: '500', suffix: '+', label: 'Tournaments' },
                { value: '10000', suffix: '+', label: 'Players' },
                { value: '50', suffix: '+', label: 'Cities' },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-2xl sm:text-3xl font-display tracking-wide text-white">
                    <AnimatedNumber target={stat.value} suffix={stat.suffix} />
                  </p>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium uppercase tracking-wider">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-broadcast-900 to-transparent pointer-events-none" />
      </section>

      {/* ==================== FEATURES ==================== */}
      <section id="features" className="relative py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-12 sm:mb-16">
            <span className="inline-block px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs font-heading uppercase tracking-widest text-violet-400 mb-4">
              Features
            </span>
            <h2
              className="text-3xl sm:text-5xl font-bold text-white mb-4"
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            >
              Everything You Need to
              <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent"> Organize</span>
            </h2>
            <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              From player registration to live auctions, CricSmart handles every aspect of tournament management.
            </p>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="group relative rounded-2xl bg-broadcast-800/60 border border-white/5 hover:border-white/10 p-6 sm:p-8 transition-all duration-300 hover:-translate-y-1"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-5 shadow-lg shadow-${f.glow}/20 group-hover:scale-110 transition-transform duration-300`}>
                  <f.icon className="w-6 h-6 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-lg font-heading uppercase tracking-wider text-white mb-2">{f.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  {f.desc}
                </p>

                {/* Hover glow */}
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${f.gradient} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-300`} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== HOW IT WORKS ==================== */}
      <section id="how-it-works" className="relative py-20 sm:py-28 overflow-hidden">
        {/* Background accent */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-500/[0.02] to-transparent" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-12 sm:mb-16">
            <span className="inline-block px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs font-heading uppercase tracking-widest text-purple-400 mb-4">
              How It Works
            </span>
            <h2
              className="text-3xl sm:text-5xl font-bold text-white mb-4"
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            >
              Up and Running in
              <span className="bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent"> 3 Steps</span>
            </h2>
          </div>

          {/* Steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {steps.map((step, i) => (
              <div key={step.num} className="relative">
                {/* Connector line (desktop) */}
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-16 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-px bg-gradient-to-r from-violet-500/30 to-transparent" />
                )}

                <div className="relative text-center group">
                  {/* Step number */}
                  <div className="relative w-32 h-32 mx-auto mb-6">
                    {/* Outer ring */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-500/20 to-purple-500/10 group-hover:from-violet-500/30 group-hover:to-purple-500/20 transition-all duration-300" />
                    {/* Inner circle */}
                    <div className="absolute inset-3 rounded-full bg-broadcast-800 border border-white/10 flex flex-col items-center justify-center">
                      <span className="font-display text-3xl text-violet-400">{step.num}</span>
                      <step.icon className="w-5 h-5 text-slate-500 mt-1" />
                    </div>
                  </div>

                  <h3 className="text-lg font-heading uppercase tracking-wider text-white mb-2">{step.title}</h3>
                  <p className="text-sm text-slate-400 max-w-xs mx-auto" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center mt-12 sm:mt-16">
            <button
              onClick={handleGetStarted}
              className="group inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-heading uppercase tracking-wider bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500 transition-all shadow-xl shadow-violet-500/25 hover:shadow-violet-500/40 active:scale-[0.97]"
            >
              Start Your Tournament
              <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* ==================== TESTIMONIALS ==================== */}
      <section id="testimonials" className="relative py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-12 sm:mb-16">
            <span className="inline-block px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-heading uppercase tracking-widest text-amber-400 mb-4">
              Testimonials
            </span>
            <h2
              className="text-3xl sm:text-5xl font-bold text-white mb-4"
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            >
              Trusted by
              <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent"> Organizers</span>
            </h2>
          </div>

          {/* Testimonial Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {testimonials.map((t, i) => (
              <div
                key={t.name}
                className="relative rounded-2xl bg-broadcast-800/60 border border-white/5 p-6 sm:p-8 hover:border-white/10 transition-all duration-300"
              >
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>

                {/* Quote */}
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  "{t.quote}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500/30 to-purple-500/30 flex items-center justify-center border border-white/10">
                    <span className="text-sm font-bold text-violet-300">{t.name.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== PRICING ==================== */}
      <section className="relative py-20 sm:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/[0.02] to-transparent" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-12 sm:mb-16">
            <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-heading uppercase tracking-widest text-emerald-400 mb-4">
              Pricing
            </span>
            <h2
              className="text-3xl sm:text-5xl font-bold text-white mb-4"
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            >
              Simple, Transparent
              <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent"> Pricing</span>
            </h2>
            <p className="text-slate-400 text-base max-w-xl mx-auto" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Start free and scale as you grow. No hidden fees.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Free */}
            <div className="rounded-2xl bg-broadcast-800/60 border border-white/5 p-6 sm:p-8">
              <div className="mb-6">
                <h3 className="font-heading text-lg uppercase tracking-wider text-slate-300 mb-2">Free</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-display text-white">₹0</span>
                  <span className="text-sm text-slate-500">/forever</span>
                </div>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  'Up to 2 tournaments',
                  'Up to 8 teams per tournament',
                  'Bulk player import (CSV/Excel)',
                  'Public registration links',
                  'Basic analytics',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-slate-300" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    <Check className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <button
                onClick={handleGetStarted}
                className="w-full py-3 rounded-xl font-heading uppercase tracking-wider text-sm bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
              >
                Get Started Free
              </button>
            </div>

            {/* Pro */}
            <div className="relative rounded-2xl bg-broadcast-800/60 border border-violet-500/30 p-6 sm:p-8 shadow-lg shadow-violet-500/5">
              {/* Popular badge */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 text-xs font-heading uppercase tracking-widest">
                Most Popular
              </div>

              <div className="mb-6 mt-2">
                <h3 className="font-heading text-lg uppercase tracking-wider text-violet-300 mb-2">Pro</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-display text-white">₹999</span>
                  <span className="text-sm text-slate-500">/month</span>
                </div>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  'Unlimited tournaments',
                  'Unlimited teams & players',
                  'Custom branding & themes',
                  'Auction integration',
                  'Advanced analytics & reports',
                  'Priority support',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-slate-300" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    <Check className="w-4 h-4 text-violet-400 mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <button
                onClick={handleGetStarted}
                className="w-full py-3 rounded-xl font-heading uppercase tracking-wider text-sm bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500 transition-all shadow-lg shadow-violet-500/25"
              >
                Upgrade to Pro
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== FINAL CTA ==================== */}
      <section className="relative py-20 sm:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Glow background */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[500px] h-[300px] bg-violet-500/10 rounded-full blur-[120px]" />
          </div>

          <div className="relative">
            <h2
              className="text-3xl sm:text-5xl lg:text-6xl font-bold text-white mb-6"
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            >
              Ready to Organize Your
              <br />
              <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
                Next Tournament?
              </span>
            </h2>
            <p className="text-slate-400 text-base sm:text-lg max-w-xl mx-auto mb-8" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Join hundreds of tournament organizers who trust CricSmart. It's free to get started.
            </p>
            <button
              onClick={handleGetStarted}
              className="group inline-flex items-center gap-2 px-10 py-4 rounded-xl text-lg font-heading uppercase tracking-wider bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500 transition-all shadow-2xl shadow-violet-500/30 hover:shadow-violet-500/50 active:scale-[0.97]"
            >
              Create Your Tournament
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* ==================== FOOTER ==================== */}
      <footer className="relative border-t border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                  <Trophy className="w-4 h-4 text-white" />
                </div>
                <span className="font-display text-lg tracking-wide text-white">CricSmart</span>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                AI-powered cricket management platform for teams, tournaments, and auctions.
              </p>
            </div>

            {/* Products */}
            <div>
              <h4 className="font-heading text-sm uppercase tracking-widest text-slate-400 mb-4">Products</h4>
              <ul className="space-y-2">
                <li><a href="https://app.cricsmart.in" className="text-sm text-slate-500 hover:text-violet-400 transition-colors">Team Management</a></li>
                <li><a href="https://tournament.cricsmart.in" className="text-sm text-violet-400">Tournament Hub</a></li>
                <li><a href="https://auction.cricsmart.in" className="text-sm text-slate-500 hover:text-violet-400 transition-colors">Auctions</a></li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="font-heading text-sm uppercase tracking-widest text-slate-400 mb-4">Resources</h4>
              <ul className="space-y-2">
                <li><a href="https://cricsmart.in/about" className="text-sm text-slate-500 hover:text-violet-400 transition-colors">About Us</a></li>
                <li><a href="https://cricsmart.in/contact" className="text-sm text-slate-500 hover:text-violet-400 transition-colors">Contact</a></li>
                <li><a href="https://cricsmart.in/privacy" className="text-sm text-slate-500 hover:text-violet-400 transition-colors">Privacy Policy</a></li>
              </ul>
            </div>

            {/* Connect */}
            <div>
              <h4 className="font-heading text-sm uppercase tracking-widest text-slate-400 mb-4">Connect</h4>
              <ul className="space-y-2">
                <li><a href="mailto:support@cricsmart.in" className="text-sm text-slate-500 hover:text-violet-400 transition-colors">support@cricsmart.in</a></li>
                <li><a href="https://cricsmart.in" className="text-sm text-slate-500 hover:text-violet-400 transition-colors">cricsmart.in</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-10 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-600" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              © {new Date().getFullYear()} CricSmart. All rights reserved.
            </p>
            <div className="flex items-center gap-1 text-xs text-slate-600">
              <span>Made with</span>
              <span className="text-violet-500">♥</span>
              <span>in India</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Bottom accent line */}
      <div className="fixed bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-violet-500/50 to-transparent pointer-events-none z-40" />
    </div>
  );
};

export default LandingPage;
