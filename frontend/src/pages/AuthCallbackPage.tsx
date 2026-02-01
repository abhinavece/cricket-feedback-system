import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * AuthCallbackPage - Handles cross-domain authentication
 * 
 * When user logs in on the homepage (cricsmart.in), we redirect to this page
 * on the app domain (app.cricsmart.in) with the token and user data in URL params.
 * This page stores them in localStorage and redirects to the dashboard.
 */
const AuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, isAuthenticated } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    const userDataEncoded = searchParams.get('user');

    // If already authenticated, just redirect to dashboard
    if (isAuthenticated) {
      navigate('/feedback', { replace: true });
      return;
    }

    if (token && userDataEncoded) {
      try {
        // Decode user data from base64
        const userData = JSON.parse(atob(userDataEncoded));
        
        // Log the user in (stores in localStorage)
        login(token, userData);
        
        // Clear URL params and redirect to dashboard
        navigate('/feedback', { replace: true });
      } catch (err) {
        console.error('Error processing auth callback:', err);
        setError('Invalid authentication data. Please try logging in again.');
      }
    } else if (!isAuthenticated) {
      // No token provided and not authenticated - redirect to login
      navigate('/login', { replace: true });
    }
  }, [searchParams, login, navigate, isAuthenticated]);

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-8 border border-white/10 max-w-md text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-400 text-2xl">!</span>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Authentication Error</h2>
          <p className="text-slate-400 mb-4">{error}</p>
          <a 
            href="/login"
            className="inline-block px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-colors"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400">Completing sign in...</p>
      </div>
    </div>
  );
};

export default AuthCallbackPage;
