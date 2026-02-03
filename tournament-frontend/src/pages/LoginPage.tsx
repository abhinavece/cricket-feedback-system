import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Zap, Users, BarChart3, Code, Shield, Star, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (element: HTMLElement, config: any) => void;
        };
      };
    };
  }
}

const isDev = import.meta.env.DEV || (typeof window !== 'undefined' && window.location.hostname === 'localhost');

// Animated cricket ball background
const CricketBallCanvas: React.FC = () => {
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

    // Particles representing cricket elements
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      opacity: number;
      type: 'ball' | 'star' | 'line';
    }> = [];

    // Create particles
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 3 + 1,
        opacity: Math.random() * 0.4 + 0.1,
        type: Math.random() > 0.7 ? 'ball' : Math.random() > 0.5 ? 'star' : 'line',
      });
    }

    let animId: number;
    const animate = () => {
      ctx.fillStyle = 'rgba(10, 10, 11, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;

        // Bounce off edges
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.save();
        ctx.globalAlpha = p.opacity;

        if (p.type === 'ball') {
          // Cricket ball
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
          ctx.fillStyle = '#dc2626';
          ctx.fill();
          // Seam
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 2, 0.2, Math.PI - 0.2);
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 0.5;
          ctx.stroke();
        } else if (p.type === 'star') {
          // Star sparkle
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = '#14b8a6';
          ctx.fill();
        } else {
          // Trajectory line
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.vx * 20, p.y + p.vy * 20);
          ctx.strokeStyle = 'rgba(20, 184, 166, 0.3)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        ctx.restore();

        // Connect nearby particles
        particles.slice(i + 1).forEach((p2) => {
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(20, 184, 166, ${0.08 * (1 - dist / 120)})`;
            ctx.stroke();
          }
        });
      });

      animId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
};

const LoginPage: React.FC = () => {
  const { login, loginDev, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [devEmail, setDevEmail] = useState('admin@test.com');
  const [showDevLogin, setShowDevLogin] = useState(true); // Show by default in dev
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    // Load Google Sign-In script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      if (window.google && clientId) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
        });

        const buttonDiv = document.getElementById('google-signin-button');
        if (buttonDiv) {
          window.google.accounts.id.renderButton(buttonDiv, {
            theme: 'filled_black',
            size: 'large',
            width: 320,
            text: 'continue_with',
            shape: 'pill',
          });
        }
      }
    };

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const handleCredentialResponse = async (response: { credential: string }) => {
    setIsLoggingIn(true);
    setLoginError('');
    try {
      await login(response.credential);
      navigate('/', { replace: true });
    } catch (error: any) {
      console.error('Login failed:', error);
      setLoginError(error.message || 'Login failed. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleDevLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!devEmail.trim()) return;
    setIsLoggingIn(true);
    setLoginError('');
    try {
      await loginDev(devEmail.trim());
      navigate('/', { replace: true });
    } catch (error: any) {
      console.error('Dev login failed:', error);
      setLoginError(error.message || 'Dev login failed. Is the backend running on port 5000?');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const stats = [
    { value: '500+', label: 'Tournaments' },
    { value: '50K+', label: 'Players' },
    { value: '1M+', label: 'Matches' },
  ];

  const features = [
    { icon: Users, label: 'Player Pool', desc: 'Manage 240+ players effortlessly', color: 'from-blue-500 to-cyan-500' },
    { icon: Shield, label: 'Franchise System', desc: 'Create teams & run auctions', color: 'from-purple-500 to-pink-500' },
    { icon: BarChart3, label: 'Live Analytics', desc: 'Real-time performance tracking', color: 'from-amber-500 to-orange-500' },
    { icon: Zap, label: 'AI Insights', desc: 'Smart player recommendations', color: 'from-emerald-500 to-teal-500' },
  ];

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-500/30 border-t-teal-500 rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-slate-400 font-medium uppercase tracking-widest text-sm">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white overflow-hidden">
      <CricketBallCanvas />

      {/* Main container */}
      <div className="relative z-10 min-h-screen flex flex-col lg:flex-row">
        {/* Left Hero Section */}
        <div className="lg:w-3/5 xl:w-2/3 relative flex flex-col justify-center px-6 sm:px-12 lg:px-16 xl:px-24 py-12 lg:py-0">
          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 via-transparent to-purple-500/5" />
          <div className="absolute top-0 left-0 w-96 h-96 bg-teal-500/20 rounded-full blur-[128px]" />
          <div className="absolute bottom-0 right-1/3 w-64 h-64 bg-purple-500/10 rounded-full blur-[100px]" />
          
          {/* Content */}
          <div className="relative z-10 max-w-2xl">
            {/* Logo */}
            <div className="flex items-center gap-4 mb-8 lg:mb-12">
              <div className="relative">
                <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-2xl bg-gradient-to-br from-teal-400 via-teal-500 to-emerald-600 flex items-center justify-center shadow-2xl shadow-teal-500/40">
                  <Trophy className="w-7 h-7 lg:w-8 lg:h-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center">
                  <Star className="w-2.5 h-2.5 text-amber-900" fill="currentColor" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold tracking-tight" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                  CRICSMART
                </h1>
                <p className="text-xs lg:text-sm uppercase tracking-[0.25em] text-teal-400 font-semibold" style={{ fontFamily: "'Oswald', sans-serif" }}>
                  Tournament Hub
                </p>
              </div>
            </div>

            {/* Headline */}
            <h2 
              className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-[0.95] mb-6"
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            >
              <span className="block text-white">MANAGE YOUR</span>
              <span className="block bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                TOURNAMENT
              </span>
              <span className="block text-white">LIKE A PRO</span>
            </h2>

            <p className="text-base lg:text-lg text-slate-400 mb-8 lg:mb-10 max-w-lg leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              The ultimate platform for cricket tournament organizers. 
              Track players, manage franchises, and run seamless auctions.
            </p>

            {/* Stats */}
            <div className="flex gap-8 lg:gap-12 mb-10 lg:mb-14">
              {stats.map((stat, i) => (
                <div key={stat.label} className="animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
                  <p 
                    className="text-2xl lg:text-3xl font-bold text-white"
                    style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                  >
                    {stat.value}
                  </p>
                  <p className="text-xs uppercase tracking-wider text-slate-500" style={{ fontFamily: "'Oswald', sans-serif" }}>
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>

            {/* Features - Desktop only */}
            <div className="hidden lg:grid grid-cols-2 gap-4">
              {features.map((feature, i) => (
                <div
                  key={feature.label}
                  className="group flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300"
                  style={{ animationDelay: `${i * 100 + 200}ms` }}
                >
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                    <feature.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm" style={{ fontFamily: "'Oswald', sans-serif" }}>
                      {feature.label}
                    </p>
                    <p className="text-xs text-slate-500">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Login Section */}
        <div className="lg:w-2/5 xl:w-1/3 flex items-center justify-center px-6 py-12 lg:py-0">
          <div className="w-full max-w-sm">
            {/* Login Card */}
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-teal-500/20 to-purple-500/20 rounded-3xl blur-xl" />
              
              <div className="relative bg-[#111113]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
                {/* Header */}
                <div className="text-center mb-8">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 mb-4">
                    <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                    <span className="text-xs uppercase tracking-wider text-teal-400 font-medium" style={{ fontFamily: "'Oswald', sans-serif" }}>
                      Tournament Admin
                    </span>
                  </div>
                  <h2 
                    className="text-2xl font-bold text-white mb-2"
                    style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                  >
                    WELCOME BACK
                  </h2>
                  <p className="text-sm text-slate-400" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    Sign in to manage your tournaments
                  </p>
                </div>

                {/* Error Message */}
                {loginError && (
                  <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <p className="text-sm text-red-400 text-center">{loginError}</p>
                  </div>
                )}

                {/* Google Sign-In */}
                <div className="flex justify-center mb-6">
                  <div id="google-signin-button" className="w-full flex justify-center" />
                </div>

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="px-3 text-xs text-slate-500 bg-[#111113]">OR</span>
                  </div>
                </div>

                {/* Dev Login Section */}
                {isDev && (
                  <div className="space-y-4">
                    <button
                      type="button"
                      onClick={() => setShowDevLogin(!showDevLogin)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 transition-all text-sm font-medium"
                      style={{ fontFamily: "'Oswald', sans-serif" }}
                    >
                      <Code className="w-4 h-4" />
                      Dev Login (Local Testing)
                    </button>

                    {showDevLogin && (
                      <form onSubmit={handleDevLogin} className="space-y-4 animate-fade-in">
                        <div>
                          <label className="block text-xs uppercase tracking-wider text-slate-500 mb-2" style={{ fontFamily: "'Oswald', sans-serif" }}>
                            Email Address
                          </label>
                          <input
                            type="email"
                            value={devEmail}
                            onChange={(e) => setDevEmail(e.target.value)}
                            placeholder="admin@test.com"
                            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:border-teal-500/50 focus:ring-2 focus:ring-teal-500/20 transition-all outline-none"
                            style={{ fontFamily: "'DM Sans', sans-serif" }}
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={!devEmail.trim() || isLoggingIn}
                          className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-semibold hover:from-teal-400 hover:to-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-teal-500/25"
                          style={{ fontFamily: "'Oswald', sans-serif" }}
                        >
                          {isLoggingIn ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Logging in...
                            </>
                          ) : (
                            <>
                              Sign In
                              <ArrowRight className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      </form>
                    )}

                    {/* Dev Instructions */}
                    <div className="mt-4 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                      <p className="text-xs text-slate-400 leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                        <strong className="text-slate-300">For local testing:</strong> Make sure the backend is running on <code className="px-1.5 py-0.5 rounded bg-slate-700 text-teal-400 text-[10px]">localhost:5000</code>
                      </p>
                    </div>
                  </div>
                )}

                {/* Terms */}
                <p className="mt-6 text-xs text-center text-slate-500" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  By signing in, you agree to our{' '}
                  <a href="#" className="text-teal-400 hover:text-teal-300">Terms</a>
                  {' '}and{' '}
                  <a href="#" className="text-teal-400 hover:text-teal-300">Privacy Policy</a>
                </p>
              </div>
            </div>

            {/* Bottom text */}
            <p className="text-center text-sm text-slate-600 mt-8" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Need access? Contact your tournament organizer.
            </p>
          </div>
        </div>
      </div>

      {/* Mobile features carousel */}
      <div className="lg:hidden px-6 pb-12">
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6 snap-x snap-mandatory">
          {features.map((feature) => (
            <div
              key={feature.label}
              className="flex-shrink-0 w-64 snap-start flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]"
            >
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-lg`}>
                <feature.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-white text-sm" style={{ fontFamily: "'Oswald', sans-serif" }}>
                  {feature.label}
                </p>
                <p className="text-xs text-slate-500">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 py-4 text-center lg:text-left lg:px-16">
        <p className="text-xs text-slate-600" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          Powered by <span className="text-teal-500 font-medium">CricSmart AI</span> • Making cricket tournaments smarter
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
