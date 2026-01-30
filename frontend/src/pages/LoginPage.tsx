import React, { useEffect, Suspense, lazy } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft } from 'lucide-react';

const GoogleAuth = lazy(() => import('../components/GoogleAuth'));

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();

  // Get the intended destination from state, or default to feedback
  const from = (location.state as { from?: string })?.from || '/feedback';

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, user, navigate, from]);

  const handleLoginSuccess = () => {
    navigate(from, { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
        
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      {/* Login card */}
      <div className="relative z-10 w-full max-w-md">
        {/* Back to homepage link */}
        <a 
          href="https://cricsmart.in"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Homepage
        </a>

        <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20">
              <span className="text-3xl">🏏</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Welcome to CricSmart</h1>
            <p className="text-slate-400">Sign in to access your dashboard</p>
          </div>

          {/* Google Auth */}
          <Suspense fallback={
            <div className="flex justify-center py-4">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
          }>
            <GoogleAuth onSuccess={handleLoginSuccess} />
          </Suspense>

          {/* Terms */}
          <p className="text-center text-xs text-slate-500 mt-6">
            By signing in, you agree to our{' '}
            <a href="/privacy" className="text-emerald-400 hover:underline">Privacy Policy</a>
          </p>
        </div>

        {/* Footer note */}
        <p className="text-center text-slate-600 text-sm mt-6">
          Manage your cricket team like never before
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
