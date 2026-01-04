import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import GoogleAuth from './GoogleAuth';
import UserProfile from './UserProfile';
import Notification from './Notification';

interface NavigationProps {
  currentView: 'form' | 'admin';
  onViewChange: (view: 'form' | 'admin') => void;
  user: {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    role: 'viewer' | 'editor' | 'admin';
  } | null;
  onLogout: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentView, onViewChange, user, onLogout }) => {
  const { hasPermission } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPermissionNotification, setShowPermissionNotification] = useState(false);

  const handleAdminClick = () => {
    if (!user) {
      setShowAuthModal(true);
    } else if (hasPermission('view_dashboard')) {
      onViewChange('admin');
    } else {
      // Show permission denied notification for non-admin users
      setShowPermissionNotification(true);
    }
  };

  return (
    <>
      <header className="header">
        <div className="header-content">
          <div className="flex items-center">
            <div className="cricket-ball" style={{width: '40px', height: '40px', marginRight: '12px'}}></div>
            <h1 className="logo">Cricket Feedback</h1>
          </div>
          <nav className="nav">
            <button
              onClick={() => onViewChange('form')}
              className={`nav-link ${currentView === 'form' ? 'active' : ''}`}
            >
              Feedback Form
            </button>
            <button
              onClick={handleAdminClick}
              className={`nav-link ${currentView === 'admin' ? 'active' : ''}`}
            >
              Admin Dashboard
            </button>
            <div className="flex items-center space-x-3">
              {user && (
                <>
                  <div className="flex items-center space-x-2">
                    {user.avatar && (
                      <img 
                        src={user.avatar} 
                        alt={user.name} 
                        className="w-8 h-8 rounded-full cursor-pointer hover:ring-2 hover:ring-primary-green"
                        onClick={() => setShowProfileModal(true)}
                        title="View Profile"
                      />
                    )}
                    <div className="hidden sm:block">
                      <p className="text-sm font-medium text-primary">{user.name}</p>
                      <p className="text-xs text-secondary capitalize">{user.role}</p>
                    </div>
                  </div>
                    <button
                      onClick={() => setShowProfileModal(true)}
                      className="btn btn-outline"
                      style={{padding: '6px 12px', fontSize: '12px'}}
                      title="Edit Profile"
                    >
                      Profile
                    </button>
                    <button
                      onClick={onLogout}
                      className="btn btn-outline"
                      style={{padding: '6px 12px', fontSize: '12px', borderColor: 'var(--accent-red)', color: 'var(--accent-red)'}}
                    >
                      Logout
                    </button>
                  </>
                )}
              </div>
            </nav>
        </div>
      </header>

      {/* Authentication Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="card" style={{maxWidth: '500px', width: '90%'}}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Admin Access Required</h3>
              <button
                onClick={() => setShowAuthModal(false)}
                className="text-2xl text-secondary hover:text-primary"
              >
                ×
              </button>
            </div>
            <div className="text-center py-4">
              <p className="text-secondary mb-6">Please sign in with your Google account to access the admin dashboard.</p>
              <GoogleAuth onSuccess={() => setShowAuthModal(false)} />
            </div>
          </div>
        </div>
      )}

      {/* User Profile Modal */}
      {showProfileModal && (
        <UserProfile onClose={() => setShowProfileModal(false)} />
      )}

      {/* Permission Denied Notification */}
      {showPermissionNotification && (
        <Notification 
          message="This area is restricted to Mavericks Team members only. Please contact the Mavericks Team if you need admin access."
          onClose={() => setShowPermissionNotification(false)}
        />
      )}
    </>
  );
};

export default Navigation;
