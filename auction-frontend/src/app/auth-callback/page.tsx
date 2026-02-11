'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AUTH_STORAGE_KEY, AUTH_USER_KEY } from '@/lib/constants';

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400">Loading...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <AuthCallbackContent />
    </Suspense>
  );
}

function AuthCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    const userDataEncoded = searchParams.get('user');
    const nextPath = searchParams.get('next') || '/admin';

    if (token && userDataEncoded) {
      try {
        const userData = JSON.parse(atob(userDataEncoded));
        localStorage.setItem(AUTH_STORAGE_KEY, token);
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData));
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
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="bg-slate-900 border border-red-500/30 rounded-2xl p-8 max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Authentication Error</h2>
          <p className="text-slate-400 mb-6">{error}</p>
          <a
            href="/admin"
            className="inline-flex items-center px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold hover:from-amber-600 hover:to-orange-600 transition-all"
          >
            Try Again
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400">Authenticating...</p>
      </div>
    </div>
  );
}
