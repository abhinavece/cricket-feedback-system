'use client';

import React, { useEffect, useRef } from 'react';
import { X, Brain, Sparkles, Shield, Zap, MessageCircle, CreditCard } from 'lucide-react';
import { siteConfig } from '@/lib/api';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle Google login - redirect to app domain
  const handleGoogleLogin = () => {
    // Redirect to the app domain where Google OAuth is configured
    window.location.href = siteConfig.appUrl;
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
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent to-slate-700" />
              <span className="text-xs text-slate-500 uppercase tracking-wider">Sign in to continue</span>
              <div className="flex-1 h-px bg-gradient-to-l from-transparent to-slate-700" />
            </div>
            
            {/* Google Sign In Button */}
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white hover:bg-gray-50 text-slate-800 font-semibold rounded-xl transition-all duration-300 hover:shadow-lg"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </button>
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
      <style jsx>{`
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
        .animate-modal-enter {
          animation: modalEnter 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default LoginModal;
