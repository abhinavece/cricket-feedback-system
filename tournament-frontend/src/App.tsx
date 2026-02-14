import React, { Suspense, lazy, useCallback } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import LoadingScreen from './components/LoadingScreen';
import TournamentOnboarding from './components/TournamentOnboarding';

// Lazy load pages
const LoginPage = lazy(() => import('./pages/LoginPage'));
const AuthCallbackPage = lazy(() => import('./pages/AuthCallbackPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const TournamentPage = lazy(() => import('./pages/TournamentPage'));
const PublicTournamentView = lazy(() => import('./pages/PublicTournamentView'));

// Protected route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading, needsOnboarding, setNeedsOnboarding } = useAuth();

  const handleOnboardingComplete = useCallback(() => {
    setNeedsOnboarding(false);
    // Force reload to re-verify auth and get updated org data
    window.location.href = '/';
  }, [setNeedsOnboarding]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (needsOnboarding) {
    return <TournamentOnboarding onComplete={handleOnboardingComplete} />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  const { loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth-callback" element={<AuthCallbackPage />} />
        
        {/* Public tournament view - no auth required */}
        <Route path="/share/tournament/:token" element={<PublicTournamentView />} />
        
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="tournament/:tournamentId/*" element={<TournamentPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

export default App;
