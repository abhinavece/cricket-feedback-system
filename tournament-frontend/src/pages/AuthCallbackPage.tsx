import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';

/**
 * AuthCallbackPage - Handles cross-domain authentication from centralized login
 * 
 * When user logs in on cricsmart.in/auth/login, we redirect to this page
 * on tournament.cricsmart.in with the token and user data in URL params.
 * This page stores them in localStorage and redirects to the dashboard.
 * 
 * Uses window.location.href for redirect to force full page reload,
 * ensuring AuthContext re-mounts and verifies the newly stored token.
 */
const AuthCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    const userDataEncoded = searchParams.get('user');

    // Check if already authenticated
    const existingToken = localStorage.getItem('tournament_token');
    if (existingToken && !token) {
      window.location.href = '/';
      return;
    }

    if (token && userDataEncoded) {
      try {
        // Decode user data from base64
        const userData = JSON.parse(atob(userDataEncoded));

        // Store auth data in localStorage
        localStorage.setItem('tournament_token', token);
        localStorage.setItem('tournament_user', JSON.stringify(userData));

        // Full page reload so AuthContext re-mounts and verifies the token
        window.location.href = '/';
      } catch (err) {
        console.error('Error processing auth callback:', err);
        setError('Invalid authentication data. Please try logging in again.');
      }
    } else {
      setError('Missing authentication data. Please try logging in again.');
    }
  }, [searchParams]);

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl p-8 border border-white/10 max-w-md text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Authentication Error</h2>
          <p className="text-slate-400 mb-6">{error}</p>
          <a
            href="/login"
            className="inline-block px-6 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-semibold rounded-xl transition-all"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mx-auto mb-4" />
        <p className="text-slate-400">Completing sign in...</p>
      </div>
    </div>
  );
};

export default AuthCallbackPage;
