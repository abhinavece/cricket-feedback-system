import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../contexts/AuthContext';
import { Brain, Sparkles, Shield } from 'lucide-react';

interface GoogleAuthProps {
  onSuccess?: () => void;
  /** Called with raw auth data for cross-domain auth handling */
  onAuthData?: (token: string, user: object) => void;
  /** If true, skip storing in localStorage (for cross-domain auth) */
  skipLocalStorage?: boolean;
  compact?: boolean;
}

const GoogleAuth: React.FC<GoogleAuthProps> = ({ onSuccess, onAuthData, skipLocalStorage = false, compact = false }) => {
  const { login } = useAuth();

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: credentialResponse.credential }),
      });

      const data = await response.json();

      if (response.ok) {
        // If onAuthData is provided (for cross-domain auth), call it with raw data
        if (onAuthData) {
          onAuthData(data.token, data.user);
          return;
        }
        
        // Normal flow: store in localStorage
        if (!skipLocalStorage) {
          login(data.token, data.user);
        }
        onSuccess?.();
      } else {
        console.error('Authentication failed:', data.error);
      }
    } catch (error) {
      console.error('Google auth error:', error);
    }
  };

  const handleGoogleError = () => {
    console.log('Google Login Failed');
  };

  if (compact) {
    return (
      <div className="w-full flex justify-center">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
          theme="filled_blue"
          text="continue_with"
          shape="pill"
          width="280"
          logo_alignment="left"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full max-w-sm mx-auto">
      {/* Logo & Title */}
      <div className="text-center mb-8">
        {/* AI-themed Logo */}
        <div className="relative w-20 h-20 mx-auto mb-6">
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl blur-xl opacity-40 animate-pulse" />
          {/* Logo container */}
          <div className="relative w-full h-full bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-500/30">
            <span className="text-white font-black text-4xl">C</span>
          </div>
          {/* AI sparkle indicator */}
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-violet-500 rounded-full flex items-center justify-center shadow-lg">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
        </div>

        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
          Welcome to <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">CricSmart</span>
        </h2>
        <p className="text-slate-400 text-sm md:text-base">
          AI-powered cricket team management
        </p>
      </div>

      {/* Feature pills */}
      <div className="flex flex-wrap justify-center gap-2 mb-6">
        {[
          { icon: <Brain className="w-3 h-3" />, text: 'AI Payments' },
          { icon: <Sparkles className="w-3 h-3" />, text: 'Smart Squad' },
          { icon: <Shield className="w-3 h-3" />, text: 'Secure' },
        ].map((item) => (
          <div
            key={item.text}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800/50 border border-slate-700/50 rounded-full text-xs text-slate-400"
          >
            <span className="text-emerald-400">{item.icon}</span>
            {item.text}
          </div>
        ))}
      </div>
      
      {/* Google Login Button */}
      <div className="w-full flex justify-center py-2">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
          theme="filled_blue"
          text="continue_with"
          shape="pill"
          width="280"
          logo_alignment="left"
        />
      </div>
      
      {/* Terms */}
      <div className="text-center text-[10px] md:text-xs text-slate-500 mt-6">
        <p>By signing in, you agree to our <a href="/privacy" className="text-emerald-400 hover:underline">Privacy Policy</a></p>
      </div>
    </div>
  );
};

export default GoogleAuth;
