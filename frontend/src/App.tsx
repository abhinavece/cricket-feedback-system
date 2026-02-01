import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { OrganizationProvider, useOrganization } from './contexts/OrganizationContext';
import { submitFeedback } from './services/api';
import { isMobileDevice } from './hooks/useDevice';
import { getDomainType, getAppUrl } from './utils/domain';
import { DEFAULT_ROUTE, getLegacyTabIdFromPath, getPathFromTabId, type LegacyTabId } from './config/routes';
import type { FeedbackForm as FeedbackFormData } from './types';
import { LogIn } from 'lucide-react';
import CountdownTimer from './components/CountdownTimer';
import './theme.css';

// Public pages (no auth required)
const PublicMatchView = lazy(() => import('./pages/PublicMatchView'));
const PublicPaymentView = lazy(() => import('./pages/PublicPaymentView'));
const PlayerProfilePage = lazy(() => import('./pages/PlayerProfilePage'));
const MatchFeedbackPage = lazy(() => import('./pages/MatchFeedbackPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const HomePage = lazy(() => import('./pages/HomePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const TeamOnboarding = lazy(() => import('./components/TeamOnboarding'));
const InvitePage = lazy(() => import('./pages/InvitePage'));

// Device detection at module level for code splitting
const getInitialDeviceMode = () => {
  const saved = localStorage.getItem('forceDeviceMode');
  if (saved) return saved === 'mobile';
  return isMobileDevice();
};

const IS_MOBILE_DEFAULT = getInitialDeviceMode();

// Lazy load heavy components - device-specific bundles
const FeedbackForm = lazy(() => import('./components/FeedbackForm'));
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

/**
 * RequireAuth component - redirects to login if not authenticated
 */
const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    // Redirect to login page, saving the attempted location
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
};

/**
 * RequireOrganization component - shows onboarding if user has no organization
 */
const RequireOrganization: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { hasOrganization, loading } = useOrganization();

  if (loading) {
    return <LoadingSpinner />;
  }

  // If user has no organization, show onboarding
  if (!hasOrganization) {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <TeamOnboarding 
          onComplete={() => {
            // Refresh the page to load new organization context
            window.location.reload();
          }}
        />
      </Suspense>
    );
  }

  return <>{children}</>;
};

/**
 * DashboardLayout - Provides navigation and common layout for all dashboard routes
 */
function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentView, setCurrentView] = useState<'form' | 'admin'>('admin');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(IS_MOBILE_DEFAULT);
  const { user, isAuthenticated, logout } = useAuth();

  // Get active tab from current path
  const activeTab = getLegacyTabIdFromPath(location.pathname) as LegacyTabId;

  const toggleDeviceMode = () => {
    const newMode = !isMobile;
    setIsMobile(newMode);
    localStorage.setItem('forceDeviceMode', newMode ? 'mobile' : 'desktop');
  };

  // Auto-switch to admin view when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      setCurrentView('admin');
    }
  }, [isAuthenticated]);

  // Handle tab change via URL navigation
  const handleTabChange = (tab: LegacyTabId) => {
    const path = getPathFromTabId(tab);
    navigate(path);
  };

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
    const domainType = getDomainType();
    
    // For app domain, clear storage and redirect to homepage immediately
    // We do this before calling logout() to avoid React re-render race condition
    if (domainType === 'app') {
      // Clear storage directly
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      // Full page redirect to homepage
      window.location.href = 'https://cricsmart.in';
      return;
    }
    
    // For other domains (localhost, homepage), use normal logout flow
    logout();
    if (domainType === 'localhost') {
      // Redirect to homepage in localhost
      window.location.href = window.location.origin;
    } else {
      setCurrentView('form');
      navigate('/');
    }
  };

  const handleViewChange = (view: 'form' | 'admin') => {
    setCurrentView(view);
    if (view === 'admin') {
      navigate(DEFAULT_ROUTE);
    }
  };

  return (
    <div className="App">
      <Suspense fallback={<div className="h-14 bg-slate-900" />}>
        {isMobile ? (
          <MobileNavigation 
            currentView={currentView} 
            onViewChange={handleViewChange} 
            user={user}
            onLogout={handleLogout}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            onToggleDevice={toggleDeviceMode}
          />
        ) : (
          <DesktopNavigation 
            currentView={currentView} 
            onViewChange={handleViewChange} 
            user={user}
            onLogout={handleLogout}
            activeTab={activeTab}
            onTabChange={handleTabChange}
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
                      navigate('/feedback');
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
              <MobileAdminDashboard activeTab={activeTab} onTabChange={handleTabChange} />
            ) : (
              <DesktopAdminDashboard activeTab={activeTab} onTabChange={handleTabChange} />
            )}
          </ProtectedRoute>
        )}
      </Suspense>
    </div>
  );
}

/**
 * HomepageRoutes - Routes available on homepage domain (cricsmart.in / www.cricsmart.in)
 */
const HomepageRoutes: React.FC = () => (
  <Routes>
    {/* Homepage */}
    <Route path="/" element={<HomePage />} />
    
    {/* Static pages */}
    <Route path="/about" element={<AboutPage />} />
    <Route path="/privacy" element={<PrivacyPolicyPage />} />
    
    {/* Invite link - redirects to app domain */}
    <Route path="/invite/:code" element={<InvitePage />} />
    
    {/* Public share routes */}
    <Route path="/share/match/:token" element={<PublicMatchView />} />
    <Route path="/share/payment/:token" element={<PublicPaymentView />} />
    <Route path="/feedback/:token" element={<MatchFeedbackPage />} />
    
    {/* Redirect /app to app domain */}
    <Route path="/app/*" element={<RedirectToAppDomain />} />
    
    {/* 404 for everything else */}
    <Route path="*" element={<NotFoundPage />} />
  </Routes>
);

/**
 * AppRoutes - Routes available on app domain (app.cricsmart.in)
 * Each tab has its own URL path
 */
const AppRoutes: React.FC = () => (
  <Routes>
    {/* Default redirect to feedback */}
    <Route path="/" element={<Navigate to="/feedback" replace />} />
    
    {/* Login page */}
    <Route path="/login" element={<LoginPage />} />
    
    {/* Team onboarding route */}
    <Route path="/onboarding" element={
      <RequireAuth>
        <TeamOnboarding onComplete={() => window.location.href = '/feedback'} />
      </RequireAuth>
    } />
    
    {/* Invite link - join a team */}
    <Route path="/invite/:code" element={<InvitePage />} />
    
    {/* Dashboard routes - all protected and require organization */}
    <Route path="/feedback" element={<RequireAuth><RequireOrganization><DashboardLayout /></RequireOrganization></RequireAuth>} />
    <Route path="/messages" element={<RequireAuth><RequireOrganization><DashboardLayout /></RequireOrganization></RequireAuth>} />
    <Route path="/conversations" element={<RequireAuth><RequireOrganization><DashboardLayout /></RequireOrganization></RequireAuth>} />
    <Route path="/matches" element={<RequireAuth><RequireOrganization><DashboardLayout /></RequireOrganization></RequireAuth>} />
    <Route path="/payments" element={<RequireAuth><RequireOrganization><DashboardLayout /></RequireOrganization></RequireAuth>} />
    <Route path="/grounds" element={<RequireAuth><RequireOrganization><DashboardLayout /></RequireOrganization></RequireAuth>} />
    <Route path="/history" element={<RequireAuth><RequireOrganization><DashboardLayout /></RequireOrganization></RequireAuth>} />
    <Route path="/analytics" element={<RequireAuth><RequireOrganization><DashboardLayout /></RequireOrganization></RequireAuth>} />
    <Route path="/users" element={<RequireAuth><RequireOrganization><DashboardLayout /></RequireOrganization></RequireAuth>} />
    <Route path="/settings" element={<RequireAuth><RequireOrganization><DashboardLayout /></RequireOrganization></RequireAuth>} />
    
    {/* Player profile - protected */}
    <Route path="/player/:playerId" element={
      <RequireAuth>
        <RequireOrganization>
          <PlayerProfilePage />
        </RequireOrganization>
      </RequireAuth>
    } />
    
    {/* Public share routes (accessible without login) */}
    <Route path="/share/match/:token" element={<PublicMatchView />} />
    <Route path="/share/payment/:token" element={<PublicPaymentView />} />
    <Route path="/feedback/:token" element={<MatchFeedbackPage />} />
    
    {/* Static pages */}
    <Route path="/about" element={<AboutPage />} />
    <Route path="/privacy" element={<PrivacyPolicyPage />} />
    
    {/* Legacy /app redirect */}
    <Route path="/app/*" element={<Navigate to="/feedback" replace />} />
    <Route path="/app" element={<Navigate to="/feedback" replace />} />
    
    {/* 404 for everything else */}
    <Route path="*" element={<NotFoundPage />} />
  </Routes>
);

/**
 * LocalhostRoutes - All routes available for local development
 */
const LocalhostRoutes: React.FC = () => (
  <Routes>
    {/* Homepage */}
    <Route path="/" element={<HomePage />} />
    
    {/* Login page */}
    <Route path="/login" element={<LoginPage />} />
    
    {/* Team onboarding route */}
    <Route path="/onboarding" element={
      <RequireAuth>
        <TeamOnboarding onComplete={() => window.location.href = '/app/feedback'} />
      </RequireAuth>
    } />
    
    {/* Invite link - join a team */}
    <Route path="/invite/:code" element={<InvitePage />} />
    
    {/* Dashboard routes at /app/* for localhost - require organization */}
    <Route path="/app" element={<Navigate to="/app/feedback" replace />} />
    <Route path="/app/feedback" element={<RequireOrganization><DashboardLayout /></RequireOrganization>} />
    <Route path="/app/messages" element={<RequireOrganization><DashboardLayout /></RequireOrganization>} />
    <Route path="/app/conversations" element={<RequireOrganization><DashboardLayout /></RequireOrganization>} />
    <Route path="/app/matches" element={<RequireOrganization><DashboardLayout /></RequireOrganization>} />
    <Route path="/app/payments" element={<RequireOrganization><DashboardLayout /></RequireOrganization>} />
    <Route path="/app/grounds" element={<RequireOrganization><DashboardLayout /></RequireOrganization>} />
    <Route path="/app/history" element={<RequireOrganization><DashboardLayout /></RequireOrganization>} />
    <Route path="/app/analytics" element={<RequireOrganization><DashboardLayout /></RequireOrganization>} />
    <Route path="/app/users" element={<RequireOrganization><DashboardLayout /></RequireOrganization>} />
    <Route path="/app/settings" element={<RequireOrganization><DashboardLayout /></RequireOrganization>} />
    
    {/* Player profile */}
    <Route path="/player/:playerId" element={<RequireOrganization><PlayerProfilePage /></RequireOrganization>} />
    
    {/* Public share routes */}
    <Route path="/share/match/:token" element={<PublicMatchView />} />
    <Route path="/share/payment/:token" element={<PublicPaymentView />} />
    <Route path="/feedback/:token" element={<MatchFeedbackPage />} />
    
    {/* Static pages */}
    <Route path="/about" element={<AboutPage />} />
    <Route path="/privacy" element={<PrivacyPolicyPage />} />
    
    {/* 404 for everything else */}
    <Route path="*" element={<NotFoundPage />} />
  </Routes>
);

/**
 * RedirectToAppDomain - Redirects to app.cricsmart.in
 */
const RedirectToAppDomain: React.FC = () => {
  useEffect(() => {
    window.location.href = getAppUrl();
  }, []);
  
  return <LoadingSpinner />;
};

/**
 * DomainRouter - Selects routes based on current domain
 */
const DomainRouter: React.FC = () => {
  const domainType = getDomainType();
  
  if (domainType === 'homepage') {
    return <HomepageRoutes />;
  }
  
  if (domainType === 'app') {
    return <AppRoutes />;
  }
  
  // Localhost - show all routes for development
  return <LocalhostRoutes />;
};

function App() {
  return (
    <BrowserRouter>
      <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID || 'your-google-client-id'}>
        <AuthProvider>
          <OrganizationProvider>
            <Suspense fallback={<LoadingSpinner />}>
              <DomainRouter />
            </Suspense>
          </OrganizationProvider>
        </AuthProvider>
      </GoogleOAuthProvider>
    </BrowserRouter>
  );
}

export default App;
