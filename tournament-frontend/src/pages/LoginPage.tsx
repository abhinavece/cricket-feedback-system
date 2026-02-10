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

// Neural network background matching cricsmart.in homepage design
const NeuralNetworkCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 pointer-events-none"
      style={{ opacity: 0.6 }}
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
      return;
    }

    // Always redirect to centralized auth portal (for testing)
    const siteUrl = import.meta.env.VITE_SITE_URL || 'http://localhost:3002';
    const currentOrigin = window.location.origin;
    window.location.href = `${siteUrl}/auth/login?redirect=${encodeURIComponent(currentOrigin)}&service=tournament`;
    return;
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    // Only load Google Sign-In in dev mode (production uses centralized auth)
    if (!isDev) return;

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
    <div className="min-h-screen text-white overflow-hidden">
      {/* Dark gradient base */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" />
      
      {/* Neural network canvas */}
      <NeuralNetworkCanvas />

      {/* Gradient orbs - AI themed colors */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-emerald-500/15 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '8s', animationDelay: '2s' }} />
        <div className="absolute top-1/3 right-1/3 w-[300px] h-[300px] bg-teal-500/10 rounded-full blur-[80px] animate-pulse" style={{ animationDuration: '7s', animationDelay: '1s' }} />
      </div>

      {/* Grid overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(16, 185, 129, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(16, 185, 129, 0.3) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
      />

      {/* Main container - Centered login */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-12">

        {/* Login Section - Centered */}
        <div className="relative z-10 w-full max-w-md">
          {/* Login Card */}
          <div className="relative">
            {/* Elegant glow effect with emerald-cyan gradient */}
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 rounded-3xl blur-xl" />
            
            <div className="relative bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
              {/* Logo & Header */}
              <div className="text-center mb-8">
                {/* CricSmart Logo - Matching frontend branding */}
                <a href="https://cricsmart.in" className="flex items-center justify-center gap-3 mb-6 group cursor-pointer">
                  <div className="relative w-12 h-12 group-hover:scale-110 transition-transform duration-300">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition-shadow" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-white font-black text-lg">C</span>
                    </div>
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xl font-bold text-white group-hover:text-emerald-400 leading-tight transition-colors">CricSmart</span>
                    <span className="text-xs text-emerald-400 font-medium uppercase tracking-wider">AI Cricket Platform</span>
                  </div>
                </a>
                
                <h2 
                  className="text-3xl font-bold text-white mb-2"
                  style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                >
                  Tournament Hub
                </h2>
                <p className="text-sm text-slate-400" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  AI-powered tournament management & analytics
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
                          className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
                          style={{ fontFamily: "'DM Sans', sans-serif" }}
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={!devEmail.trim() || isLoggingIn}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-600 text-white font-semibold hover:from-emerald-400 hover:to-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-500/25"
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
                      <strong className="text-slate-300">For local testing:</strong> Make sure the backend is running on <code className="px-1.5 py-0.5 rounded bg-slate-700 text-emerald-400 text-[10px]">localhost:5000</code>
                    </p>
                  </div>
                </div>
              )}

              {/* Terms */}
              <p className="mt-6 text-xs text-center text-slate-500" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                By signing in, you agree to our{' '}
                <a href="#" className="text-emerald-400 hover:text-emerald-300">Terms</a>
                {' '}and{' '}
                <a href="#" className="text-emerald-400 hover:text-emerald-300">Privacy Policy</a>
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
  );
};

export default LoginPage;
