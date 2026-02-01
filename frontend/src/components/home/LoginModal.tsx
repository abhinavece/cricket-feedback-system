import React, { useEffect, useRef, Suspense, lazy } from 'react';
import { X, Brain, Sparkles, Shield, Zap, MessageCircle, CreditCard } from 'lucide-react';
import { getDomainType, getAuthCallbackUrl } from '../../utils/domain';

const GoogleAuth = lazy(() => import('../GoogleAuth'));

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const domainType = getDomainType();
  const isCrossDomain = domainType === 'homepage';

  // Handle cross-domain authentication
  const handleAuthData = (token: string, user: object) => {
    // For homepage domain, redirect to app domain with token in URL
    const callbackUrl = getAuthCallbackUrl(token, user);
    window.location.href = callbackUrl;
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Handle click outside
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const features = [
    { icon: <Brain className="w-4 h-4" />, text: 'AI Payment Verification', color: 'text-violet-400' },
    { icon: <MessageCircle className="w-4 h-4" />, text: 'WhatsApp Automation', color: 'text-green-400' },
    { icon: <CreditCard className="w-4 h-4" />, text: 'Smart Payment Tracking', color: 'text-blue-400' },
    { icon: <Zap className="w-4 h-4" />, text: 'Instant Squad Building', color: 'text-amber-400' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      {/* Backdrop with blur */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

      {/* Modal */}
      <div
        ref={modalRef}
        className="relative w-full max-w-lg bg-slate-900 rounded-3xl border border-slate-700/50 shadow-2xl overflow-hidden animate-modal-enter"
        style={{
          animation: 'modalEnter 0.3s ease-out forwards',
        }}
      >
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-cyan-500/10 rounded-full blur-3xl" />
          {/* Grid pattern */}
          <div 
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: `linear-gradient(rgba(16, 185, 129, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(16, 185, 129, 0.5) 1px, transparent 1px)`,
              backgroundSize: '30px 30px'
            }}
          />
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all z-10"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="relative p-8">
          {/* Header with logo */}
          <div className="text-center mb-8">
            {/* AI-themed Logo */}
            <div className="relative w-20 h-20 mx-auto mb-6">
              {/* Animated glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl blur-xl opacity-50 animate-pulse" style={{ animationDuration: '3s' }} />
              {/* Logo container */}
              <div className="relative w-full h-full bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-500/30">
                <span className="text-white font-black text-4xl">C</span>
              </div>
              {/* AI sparkle indicator */}
              <div className="absolute -top-1 -right-1 w-7 h-7 bg-violet-500 rounded-full flex items-center justify-center shadow-lg border-2 border-slate-900">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">
              Welcome to{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                CricSmart
              </span>
            </h2>
            <p className="text-slate-400">
              AI-powered cricket team management platform
            </p>
          </div>

          {/* Features list */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            {features.map((feature) => (
              <div
                key={feature.text}
                className="flex items-center gap-2 px-3 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-xl"
              >
                <span className={feature.color}>{feature.icon}</span>
                <span className="text-xs text-slate-300">{feature.text}</span>
              </div>
            ))}
          </div>

          {/* Google Auth */}
          <div className="relative">
            {/* Decorative line */}
            <div className="absolute left-0 right-0 top-0 flex items-center gap-4 mb-4">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent to-slate-700" />
              <span className="text-xs text-slate-500 uppercase tracking-wider">Sign in to continue</span>
              <div className="flex-1 h-px bg-gradient-to-l from-transparent to-slate-700" />
            </div>
            
            <div className="pt-8">
              <Suspense fallback={
                <div className="flex justify-center py-4">
                  <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                </div>
              }>
                {isCrossDomain ? (
                  // Cross-domain: redirect to app with token in URL
                  <GoogleAuth onAuthData={handleAuthData} skipLocalStorage compact />
                ) : (
                  // Same domain: normal login flow
                  <GoogleAuth onSuccess={onSuccess} compact />
                )}
              </Suspense>
            </div>
          </div>

          {/* Security badge */}
          <div className="flex items-center justify-center gap-2 mt-6 text-xs text-slate-500">
            <Shield className="w-3.5 h-3.5 text-emerald-500" />
            <span>Secure authentication via Google</span>
          </div>

          {/* Terms */}
          <p className="text-center text-[10px] text-slate-600 mt-4">
            By signing in, you agree to our{' '}
            <a href="/privacy" className="text-emerald-400 hover:underline">Privacy Policy</a>
          </p>
        </div>
      </div>

      {/* Add animation keyframes */}
      <style>{`
        @keyframes modalEnter {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default LoginModal;
