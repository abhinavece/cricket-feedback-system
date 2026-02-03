import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Zap, Users, BarChart3, Code } from 'lucide-react';
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

const isDev = import.meta.env.DEV || window.location.hostname === 'localhost';

const LoginPage: React.FC = () => {
  const { login, loginDev, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [devEmail, setDevEmail] = useState('');
  const [showDevLogin, setShowDevLogin] = useState(false);

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
            width: 280,
            text: 'continue_with',
            shape: 'rectangular',
          });
        }
      } else if (!clientId) {
        const btn = document.getElementById('google-signin-button');
        if (btn) {
          btn.innerHTML = '<p class="text-sm text-amber-400 text-center px-4">Add VITE_GOOGLE_CLIENT_ID to tournament-frontend/.env (same value as backend GOOGLE_CLIENT_ID)</p>';
        }
      }
    };

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleCredentialResponse = async (response: { credential: string }) => {
    try {
      await login(response.credential);
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleDevLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!devEmail.trim()) return;
    try {
      await loginDev(devEmail.trim());
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Dev login failed:', error);
    }
  };

  const features = [
    { icon: Users, label: 'Player Pool Management', desc: 'Track all tournament players' },
    { icon: Zap, label: 'Franchise System', desc: 'Create teams & assign players' },
    { icon: BarChart3, label: 'Performance Feedback', desc: 'Rate & review players' },
  ];

  return (
    <div className="min-h-screen bg-broadcast-900 flex">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(20,184,166,0.15),transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(20,184,166,0.1),transparent_50%)]" />
          {/* Grid lines */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `
                linear-gradient(to right, white 1px, transparent 1px),
                linear-gradient(to bottom, white 1px, transparent 1px)
              `,
              backgroundSize: '60px 60px',
            }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          {/* Logo */}
          <div className="flex items-center gap-4 mb-12">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center shadow-2xl shadow-accent-500/30">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="font-display text-4xl text-white tracking-wide">
                CRICSMART
              </h1>
              <p className="font-heading text-sm uppercase tracking-[0.3em] text-accent-400">
                Tournament Hub
              </p>
            </div>
          </div>

          {/* Tagline */}
          <h2 className="font-display text-5xl xl:text-6xl text-white leading-[1.1] mb-6">
            MANAGE YOUR
            <br />
            <span className="text-accent-400">TOURNAMENT</span>
            <br />
            LIKE A PRO
          </h2>

          <p className="text-lg text-slate-400 max-w-md mb-12 leading-relaxed">
            Streamlined player management, franchise operations, and performance tracking for cricket tournaments.
          </p>

          {/* Features */}
          <div className="space-y-4">
            {features.map((feature, i) => (
              <div
                key={feature.label}
                className="flex items-center gap-4 animate-slide-up"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="w-10 h-10 rounded-lg bg-broadcast-700/50 border border-white/10 flex items-center justify-center">
                  <feature.icon className="w-5 h-5 text-accent-400" />
                </div>
                <div>
                  <p className="font-heading text-sm uppercase tracking-wider text-white">
                    {feature.label}
                  </p>
                  <p className="text-xs text-slate-500">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-broadcast-900 to-transparent" />
      </div>

      {/* Right panel - login */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-12">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-display text-2xl text-white">CRICSMART</h1>
              <p className="font-heading text-[10px] uppercase tracking-[0.2em] text-accent-400">
                Tournament Hub
              </p>
            </div>
          </div>

          {/* Login card */}
          <div className="glass-panel p-8 rounded-2xl">
            <div className="text-center mb-8">
              <h2 className="font-display text-2xl text-white mb-2">
                WELCOME BACK
              </h2>
              <p className="text-sm text-slate-400">
                Sign in to manage your tournaments
              </p>
            </div>

            {/* Google Sign-In button */}
            <div className="flex justify-center mb-6">
              <div id="google-signin-button" />
            </div>

            <p className="text-xs text-center text-slate-500">
              By signing in, you agree to our Terms of Service and Privacy Policy
            </p>

            {/* Dev Login - only in development */}
            {isDev && (
              <div className="mt-6 pt-6 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowDevLogin(!showDevLogin)}
                  className="flex items-center justify-center gap-2 w-full text-xs text-slate-500 hover:text-slate-400 transition-colors"
                >
                  <Code className="w-3.5 h-3.5" />
                  Dev Login (localhost only)
                </button>

                {showDevLogin && (
                  <form onSubmit={handleDevLogin} className="mt-4 space-y-3 animate-fade-in">
                    <input
                      type="email"
                      value={devEmail}
                      onChange={(e) => setDevEmail(e.target.value)}
                      placeholder="Enter email for dev login"
                      className="input-field text-sm"
                      autoFocus
                    />
                    <button
                      type="submit"
                      disabled={!devEmail.trim()}
                      className="w-full btn-secondary text-sm disabled:opacity-50"
                    >
                      Login as Dev User
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* Bottom text */}
          <p className="text-center text-sm text-slate-600 mt-8">
            Tournament Admin? Contact your organizer for access.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
