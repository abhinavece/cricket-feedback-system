'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

function AuthCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    const userDataEncoded = searchParams.get('user');
    const nextPath = searchParams.get('next') || '/';

    if (token && userDataEncoded) {
      try {
        // Decode and validate user data
        const userData = JSON.parse(atob(userDataEncoded));

        // Store auth data in localStorage (same domain)
        localStorage.setItem('authToken', token);
        localStorage.setItem('authUser', JSON.stringify(userData));

        // Redirect to the intended destination
        router.replace(nextPath);
      } catch (err) {
        console.error('Error processing auth callback:', err);
        setError('Invalid authentication data. Please try logging in again.');
      }
    } else {
      setError('Missing authentication data. Please try logging in again.');
    }
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl p-8 border border-white/10 max-w-md text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Authentication Error</h2>
          <p className="text-slate-400 mb-6">{error}</p>
          <Link
            href="/auth/login"
            className="inline-block px-6 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-semibold rounded-xl transition-all"
          >
            Go to Login
          </Link>
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
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
