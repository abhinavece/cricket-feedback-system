import React, { useState, useEffect, lazy, Suspense } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { submitFeedback } from './services/api';
import { isMobileDevice } from './hooks/useDevice';
import type { FeedbackForm as FeedbackFormData } from './types';
import { Smartphone, Monitor } from 'lucide-react';
import './theme.css';

// Device detection at module level for code splitting
const getInitialDeviceMode = () => {
  const saved = localStorage.getItem('forceDeviceMode');
  if (saved) return saved === 'mobile';
  return isMobileDevice();
};

const IS_MOBILE_DEFAULT = getInitialDeviceMode();

// Lazy load heavy components - device-specific bundles
const FeedbackForm = lazy(() => import('./components/FeedbackForm'));
const GoogleAuth = lazy(() => import('./components/GoogleAuth'));
const ProtectedRoute = lazy(() => import('./components/ProtectedRoute'));
const MobileNavigation = lazy(() => import('./components/mobile/MobileNavigation'));
const DesktopNavigation = lazy(() => import('./components/Navigation'));
const MobileAdminDashboard = lazy(() => import('./components/mobile/MobileAdminDashboard'));
const DesktopAdminDashboard = lazy(() => import('./components/AdminDashboard'));

// Loading spinner component for Suspense fallback
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="spinner"></div>
  </div>
);

function AppContent() {
  const [currentView, setCurrentView] = useState<'form' | 'admin'>('form');
  const [activeTab, setActiveTab] = useState<'feedback' | 'users' | 'whatsapp' | 'matches' | 'payments' | 'player-history'>('feedback');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(IS_MOBILE_DEFAULT);
  const { user, isAuthenticated, logout } = useAuth();

  const toggleDeviceMode = () => {
    const newMode = !isMobile;
    setIsMobile(newMode);
    localStorage.setItem('forceDeviceMode', newMode ? 'mobile' : 'desktop');
  };

  // Always land on admin page when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      setCurrentView('admin');
    }
  }, [isAuthenticated]);

  const handleSubmit = async (data: FeedbackFormData) => {
    setLoading(true);
    setError(null);
    
    try {
      await submitFeedback(data);
      setSubmitted(true);
    } catch (err) {
      setError('Failed to submit feedback. Please try again.');
      console.error('Submission error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setError(null);
  };

  const handleLogout = () => {
    logout();
    setCurrentView('form');
  };

  return (
    <div className="App">
      <Suspense fallback={<div className="h-14 bg-slate-900" />}>
        {isMobile ? (
          <MobileNavigation 
            currentView={currentView} 
            onViewChange={setCurrentView} 
            user={user}
            onLogout={handleLogout}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onToggleDevice={toggleDeviceMode}
          />
        ) : (
          <DesktopNavigation 
            currentView={currentView} 
            onViewChange={setCurrentView} 
            user={user}
            onLogout={handleLogout}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onToggleDevice={toggleDeviceMode}
          />
        )}
      </Suspense>
      
      {error && currentView === 'form' && (
        <div className="alert alert-error container">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-4 text-xl leading-none"
          >
            ×
          </button>
        </div>
      )}
      
      <Suspense fallback={<LoadingSpinner />}>
        {currentView === 'form' ? (
          submitted ? (
            <div className="container flex items-center justify-center min-h-[60vh] fade-in">
              <div className="card text-center w-full max-w-lg p-8 md:p-12 shadow-2xl">
                <div className="cricket-ball mx-auto mb-8" style={{width: '64px', height: '64px'}}></div>
                <h2 className="text-2xl md:text-4xl font-bold mb-4" style={{color: 'var(--primary-green)'}}>Feedback Sent!</h2>
                <p className="text-secondary text-sm md:text-lg mb-10 leading-relaxed">
                  Awesome! Your feedback has been safely caught by our team.
                </p>
                <button
                  onClick={handleReset}
                  className="btn btn-primary w-full h-14 text-lg font-bold"
                >
                  Submit Another Entry
                </button>
              </div>
            </div>
          ) : (
            <div className="container fade-in">
              <FeedbackForm onSubmit={handleSubmit} loading={loading} />
            </div>
          )
        ) : (
          <ProtectedRoute permission="view_dashboard">
            {isMobile ? (
              <MobileAdminDashboard activeTab={activeTab} onTabChange={setActiveTab} />
            ) : (
              <DesktopAdminDashboard activeTab={activeTab} onTabChange={setActiveTab} />
            )}
          </ProtectedRoute>
        )}
      </Suspense>
    </div>
  );
}

function App() {
  return (
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID || 'your-google-client-id'}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
