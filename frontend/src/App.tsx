import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { submitFeedback } from './services/api';
import { isMobileDevice } from './hooks/useDevice';
import type { FeedbackForm as FeedbackFormData } from './types';
import { Smartphone, Monitor, LogIn } from 'lucide-react';
import CountdownTimer from './components/CountdownTimer';
import './theme.css';

// Public pages (no auth required)
const PublicMatchView = lazy(() => import('./pages/PublicMatchView'));
const PublicPaymentView = lazy(() => import('./pages/PublicPaymentView'));
const PlayerProfilePage = lazy(() => import('./pages/PlayerProfilePage'));
const MatchFeedbackPage = lazy(() => import('./pages/MatchFeedbackPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));

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
const Footer = lazy(() => import('./components/Footer'));

// Loading spinner component for Suspense fallback
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="spinner"></div>
  </div>
);

function AppContent() {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<'form' | 'admin'>('form');
  const [activeTab, setActiveTab] = useState<'feedback' | 'users' | 'whatsapp' | 'chats' | 'matches' | 'payments' | 'player-history' | 'analytics' | 'settings'>(() => {
    const savedTab = localStorage.getItem('activeTab');
    return (savedTab as any) || 'feedback';
  });
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

  // Persist active tab to localStorage
  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

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
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
              <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl p-10 max-w-md w-full text-center border border-white/10 shadow-2xl">
                {/* Cricket Ball Icon */}
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/30">
                  <div className="cricket-ball" style={{width: '48px', height: '48px'}}></div>
                </div>
                
                <h2 className="text-2xl font-bold text-white mb-3">Feedback Sent!</h2>
                <p className="text-slate-400 mb-8">Awesome! Your feedback has been safely caught by our team.</p>
                
                {/* Conditional content based on authentication */}
                {isAuthenticated ? (
                  /* Logged-in user: Show countdown timer */
                  <CountdownTimer
                    seconds={5}
                    onComplete={() => {
                      // Ensure we land on the feedback tab, not the last visited tab
                      localStorage.setItem('activeTab', 'feedback');
                      navigate('/');
                      handleReset();
                    }}
                    message="Let's check out other feedback from the team!"
                  />
                ) : (
                  /* Non-logged-in user: Show login prompt */
                  <div className="space-y-6">
                    <div className="bg-slate-800/50 rounded-xl p-4 border border-white/5">
                      <p className="text-slate-300 mb-4">Want to see feedback from other players?</p>
                      <p className="text-slate-500 text-sm">Login to view all feedback and team insights</p>
                    </div>
                    
                    <button
                      onClick={() => {
                        // Switch to admin view (which will show login)
                        setCurrentView('admin');
                      }}
                      className="w-full py-3 px-6 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25"
                    >
                      <LogIn className="w-5 h-5" />
                      Login to View Feedback
                    </button>
                    
                    <button
                      onClick={handleReset}
                      className="w-full py-3 px-6 rounded-xl font-medium text-slate-400 bg-slate-800/50 hover:bg-slate-700/50 transition-all border border-white/10"
                    >
                      Submit Another Feedback
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="container fade-in">
              <FeedbackForm onSubmit={handleSubmit} loading={loading} />
              <Footer minimal />
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
    <BrowserRouter>
      <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID || 'your-google-client-id'}>
        <AuthProvider>
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              {/* Public share routes - no auth required */}
              <Route path="/share/match/:token" element={<PublicMatchView />} />
              <Route path="/share/payment/:token" element={<PublicPaymentView />} />
              <Route path="/feedback/:token" element={<MatchFeedbackPage />} />

              {/* Static pages - no auth required */}
              <Route path="/about" element={<AboutPage />} />
              <Route path="/privacy" element={<PrivacyPolicyPage />} />

              {/* Player profile - requires auth */}
              <Route path="/player/:playerId" element={<PlayerProfilePage />} />

              {/* Main app route */}
              <Route path="/*" element={<AppContent />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </GoogleOAuthProvider>
    </BrowserRouter>
  );
}

export default App;
