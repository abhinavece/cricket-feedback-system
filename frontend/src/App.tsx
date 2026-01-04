import React, { useState } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import FeedbackForm from './components/FeedbackForm';
import AdminDashboard from './components/AdminDashboard';
import GoogleAuth from './components/GoogleAuth';
import ProtectedRoute from './components/ProtectedRoute';
import Navigation from './components/Navigation';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { submitFeedback } from './services/api';
import type { FeedbackForm as FeedbackFormData } from './types';
import './theme.css';

function AppContent() {
  const [currentView, setCurrentView] = useState<'form' | 'admin'>('form');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated, logout } = useAuth();

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
      <Navigation 
        currentView={currentView} 
        onViewChange={setCurrentView} 
        user={user}
        onLogout={handleLogout}
      />
      
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
      
      {currentView === 'form' ? (
        submitted ? (
          <div className="container fade-in">
            <div className="card text-center" style={{maxWidth: '500px', margin: '0 auto'}}>
              <div className="cricket-ball" style={{margin: '0 auto 20px'}}></div>
              <h2 className="text-3xl font-bold mb-4" style={{color: 'var(--primary-green)'}}>Feedback Submitted!</h2>
              <p className="text-secondary mb-6">Thank you for your feedback. It has been successfully submitted.</p>
              <button
                onClick={handleReset}
                className="btn btn-primary"
              >
                Submit Another Feedback
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
          <AdminDashboard />
        </ProtectedRoute>
      )}
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
