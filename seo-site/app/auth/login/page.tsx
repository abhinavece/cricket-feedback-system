'use client';

import React, { useEffect, useRef, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Brain,
  Sparkles,
  Shield,
  Zap,
  Users,
  Trophy,
  Gavel,
  Loader2,
  AlertCircle,
} from 'lucide-react';

// Service branding configuration
const SERVICE_CONFIG: Record<string, {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  gradient: string;
  iconGradient: string;
  features: string[];
}> = {
  team: {
    title: 'Team Manager',
    subtitle: 'AI-powered cricket team management',
    icon: Users,
    gradient: 'from-emerald-500 to-cyan-500',
    iconGradient: 'from-emerald-500 to-cyan-500',
    features: ['Smart Squad Building', 'WhatsApp Automation', 'AI Payments', 'Match Analytics'],
  },
  tournament: {
    title: 'Tournament Hub',
    subtitle: 'AI-powered tournament management & analytics',
    icon: Trophy,
    gradient: 'from-amber-500 to-orange-500',
    iconGradient: 'from-amber-500 to-orange-500',
    features: ['Player Auctions', 'Live Scoring', 'Franchise System', 'Performance Stats'],
  },
  auction: {
    title: 'Cricket Auction',
    subtitle: 'Smart player auctions & bidding',
    icon: Gavel,
    gradient: 'from-purple-500 to-pink-500',
    iconGradient: 'from-purple-500 to-pink-500',
    features: ['Live Bidding', 'Player Analytics', 'Budget Tracking', 'Team Building'],
  },
  default: {
    title: 'CricSmart',
    subtitle: 'AI-powered cricket platform',
    icon: Brain,
    gradient: 'from-emerald-500 to-cyan-500',
    iconGradient: 'from-emerald-500 to-cyan-500',
    features: ['AI Payments', 'Smart Availability', 'Auto Reminders', 'Match Analytics'],
  },
};

// Allowed redirect domains for security
const ALLOWED_DOMAINS = [
  'cricsmart.in',
  'www.cricsmart.in',
  'app.cricsmart.in',
  'tournament.cricsmart.in',
  'auction.cricsmart.in',
  'localhost',
  '127.0.0.1',
];

function isAllowedRedirect(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ALLOWED_DOMAINS.some(domain => parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`));
  } catch {
    return false;
  }
}

function getDefaultRedirect(): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.cricsmart.in';
  return appUrl;
}

function LoginPageContent() {
  const searchParams = useSearchParams();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Read query params
  const redirectParam = searchParams.get('redirect') || getDefaultRedirect();
  const serviceParam = searchParams.get('service') || 'default';

  // Get service config
  const config = SERVICE_CONFIG[serviceParam] || SERVICE_CONFIG.default;
  const ServiceIcon = config.icon;

  // Validate redirect URL
  const redirectUrl = isAllowedRedirect(redirectParam) ? redirectParam : getDefaultRedirect();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Neural network canvas animation
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

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      opacity: number;
    }> = [];

    const numParticles = Math.min(60, Math.floor(window.innerWidth / 20));

    for (let i = 0; i < numParticles; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 2 + 1,
        opacity: Math.random() * 0.4 + 0.1,
      });
    }

    let animationId: number;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(16, 185, 129, ${p.opacity})`;
        ctx.fill();

        particles.slice(i + 1).forEach((p2) => {
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(16, 185, 129, ${0.12 * (1 - dist / 100)})`;
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

  // Handle Google credential response
  const handleCredentialResponse = useCallback(async (response: { credential: string }) => {
    setIsLoading(true);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://cricsmart.in';
      const res = await fetch(`${apiUrl}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: response.credential }),
      });

      const data = await res.json();

      if (res.ok && data.token) {
        // Encode user data
        const userEncoded = btoa(JSON.stringify(data.user));

        // Build callback URL
        const targetUrl = new URL(redirectUrl);
        const currentOrigin = window.location.origin;
        const isSameDomain = targetUrl.origin === currentOrigin;

        if (isSameDomain) {
          // Same-domain redirect: use /auth/callback with ?next param
          const nextPath = targetUrl.pathname !== '/' ? targetUrl.pathname : '/';
          const callbackParams = new URLSearchParams({
            token: data.token,
            user: userEncoded,
            next: nextPath,
          });
          window.location.href = `/auth/callback?${callbackParams.toString()}`;
        } else {
          // Cross-domain redirect: use target's /auth-callback
          const callbackParams = new URLSearchParams({
            token: data.token,
            user: userEncoded,
          });
          window.location.href = `${targetUrl.origin}/auth-callback?${callbackParams.toString()}`;
        }
      } else {
        setError(data.error || 'Authentication failed. Please try again.');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  }, [redirectUrl]);

  // Initialize Google Sign-In
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      if ((window as any).google && clientId) {
        (window as any).google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
        });

        const buttonDiv = document.getElementById('google-signin-button');
        if (buttonDiv) {
          (window as any).google.accounts.id.renderButton(buttonDiv, {
            theme: 'filled_black',
            size: 'large',
            width: 380,
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
  }, [handleCredentialResponse]);

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden">
      {/* Dark gradient base */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" />

      {/* Neural network canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{ opacity: 0.5 }}
      />

      {/* Gradient orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-cyan-500/8 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '8s', animationDelay: '2s' }} />
      </div>

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(16, 185, 129, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(16, 185, 129, 0.3) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Content */}
      <div className={`relative z-10 w-full max-w-md mx-auto px-4 py-12 sm:py-16 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
        {/* Back to home */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-emerald-400 transition-colors mb-8 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        {/* Login card */}
        <div className="relative bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
          {/* Card background decoration */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-20 -right-20 w-60 h-60 bg-emerald-500/8 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-cyan-500/8 rounded-full blur-3xl" />
            <div
              className="absolute inset-0 opacity-[0.02]"
              style={{
                backgroundImage: `linear-gradient(rgba(16, 185, 129, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(16, 185, 129, 0.5) 1px, transparent 1px)`,
                backgroundSize: '30px 30px',
              }}
            />
          </div>

          <div className="relative p-8">
            {/* Logo + Service branding */}
            <div className="text-center mb-8">
              {/* CricSmart Logo */}
              <div className="relative w-20 h-20 mx-auto mb-6">
                <div className={`absolute inset-0 bg-gradient-to-br ${config.iconGradient} rounded-2xl blur-xl opacity-50 animate-pulse`} style={{ animationDuration: '3s' }} />
                <div className={`relative w-full h-full bg-gradient-to-br ${config.iconGradient} rounded-2xl flex items-center justify-center shadow-2xl`}>
                  <span className="text-white font-black text-4xl">C</span>
                </div>
                <div className="absolute -top-1 -right-1 w-7 h-7 bg-violet-500 rounded-full flex items-center justify-center shadow-lg border-2 border-slate-900">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
              </div>

              {/* Service badge */}
              {serviceParam !== 'default' && (
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r ${config.gradient} bg-opacity-10 border border-white/10 rounded-full mb-4`}
                  style={{ background: `linear-gradient(to right, rgba(16, 185, 129, 0.1), rgba(6, 182, 212, 0.1))` }}
                >
                  <ServiceIcon className="w-3.5 h-3.5 text-white/80" />
                  <span className="text-white/80 text-xs font-medium">{config.title}</span>
                </div>
              )}

              <h1 className="text-2xl sm:text-3xl font-black text-white mb-2">
                Sign in to{' '}
                <span className={`bg-gradient-to-r ${config.gradient} bg-clip-text text-transparent`}>
                  CricSmart
                </span>
              </h1>
              <p className="text-slate-400 text-sm">
                {config.subtitle}
              </p>
            </div>

            {/* Feature pills */}
            <div className="grid grid-cols-2 gap-2 mb-8">
              {config.features.map((feature) => (
                <div
                  key={feature}
                  className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl"
                >
                  <Zap className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                  <span className="text-xs text-slate-300 truncate">{feature}</span>
                </div>
              ))}
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent to-slate-700" />
              <span className="text-xs text-slate-500 uppercase tracking-wider">Sign in to continue</span>
              <div className="flex-1 h-px bg-gradient-to-l from-transparent to-slate-700" />
            </div>

            {/* Error message */}
            {error && (
              <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl mb-4">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            {/* Google Sign-In */}
            {isLoading ? (
              <div className="flex items-center justify-center gap-3 px-6 py-4 bg-slate-800/50 border border-slate-700/50 rounded-xl">
                <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
                <span className="text-slate-300 text-sm">Signing you in...</span>
              </div>
            ) : (
              <div className="flex justify-center">
                <div id="google-signin-button" className="w-full flex justify-center" />
              </div>
            )}

            {/* Security badge */}
            <div className="flex items-center justify-center gap-2 mt-6 text-xs text-slate-500">
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
              <span>Secure authentication via Google</span>
            </div>

            {/* Terms */}
            <p className="text-center text-[10px] text-slate-600 mt-4">
              By signing in, you agree to our{' '}
              <Link href="/privacy" className="text-emerald-400 hover:underline">Privacy Policy</Link>
            </p>
          </div>
        </div>

        {/* Services links */}
        <div className="mt-8 text-center">
          <p className="text-xs text-slate-500 mb-3">Access all CricSmart services</p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { label: 'Team Manager', service: 'team', href: `?redirect=${encodeURIComponent(process.env.NEXT_PUBLIC_APP_URL || 'https://app.cricsmart.in')}&service=team` },
              { label: 'Tournaments', service: 'tournament', href: `?redirect=${encodeURIComponent(process.env.NEXT_PUBLIC_TOURNAMENT_URL || 'https://tournament.cricsmart.in')}&service=tournament` },
              { label: 'Auctions', service: 'auction', href: `?redirect=${encodeURIComponent((process.env.NEXT_PUBLIC_SITE_URL || 'https://cricsmart.in') + '/auctions')}&service=auction` },
            ].map((item) => (
              <Link
                key={item.service}
                href={`/auth/login${item.href}`}
                className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                  serviceParam === item.service
                    ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                    : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:text-white hover:border-slate-600'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* JSON-LD for login page */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Login to CricSmart',
            description: 'Sign in to CricSmart AI-powered cricket platform',
            url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://cricsmart.in'}/auth/login`,
            isPartOf: {
              '@type': 'WebSite',
              name: 'CricSmart',
              url: process.env.NEXT_PUBLIC_SITE_URL || 'https://cricsmart.in',
            },
            potentialAction: {
              '@type': 'LoginAction',
              target: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://cricsmart.in'}/auth/login`,
            },
          }),
        }}
      />
    </div>
  );
}

// Wrap in Suspense for useSearchParams
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}
