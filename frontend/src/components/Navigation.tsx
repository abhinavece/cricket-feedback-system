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
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleAdminClick = () => {
    setIsMenuOpen(false);
    if (!user) {
      setShowAuthModal(true);
    } else if (hasPermission('view_dashboard')) {
      onViewChange('admin');
    } else {
      setShowPermissionNotification(true);
    }
  };

  const handleViewChange = (view: 'form' | 'admin') => {
    setIsMenuOpen(false);
    onViewChange(view);
  };

  return (
    <>
      <header className="header sticky top-0 z-40">
        <div className="header-content">
          <div className="flex items-center justify-between w-full md:w-auto">
            <div className="flex items-center">
              <div className="cricket-ball" style={{width: '32px', height: '32px', marginRight: '10px'}}></div>
              <h1 className="logo text-lg md:text-2xl">Mavericks XI</h1>
            </div>
            
            {/* Mobile Menu Toggle */}
            <button 
              className="md:hidden p-2 text-white focus:outline-none"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              <div className="space-y-1.5">
                <span className={`block w-6 h-0.5 bg-white transition-transform ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
                <span className={`block w-6 h-0.5 bg-white transition-opacity ${isMenuOpen ? 'opacity-0' : ''}`}></span>
                <span className={`block w-6 h-0.5 bg-white transition-transform ${isMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
              </div>
            </button>
          </div>

          <nav className={`${isMenuOpen ? 'flex' : 'hidden'} md:flex flex-col md:flex-row absolute md:relative top-full left-0 w-full md:w-auto bg-gradient-to-b from-[#16213e] to-[#1a1a2e] md:[background:none] p-6 md:p-0 border-b border-primary-green/30 md:border-none gap-4 md:gap-8 items-center z-[100] shadow-[0_20px_50px_rgba(0,0,0,0.5)] md:shadow-none animate-fade-in`}>
            <button
              onClick={() => handleViewChange('form')}
              className={`nav-link w-full md:w-auto text-left md:text-center text-lg md:text-base py-4 md:py-0 font-bold md:font-medium tracking-wide ${currentView === 'form' ? 'active text-primary-green' : 'text-white/90'}`}
            >
              Feedback Form
            </button>
            <button
              onClick={handleAdminClick}
              className={`nav-link w-full md:w-auto text-left md:text-center text-lg md:text-base py-4 md:py-0 font-bold md:font-medium tracking-wide ${currentView === 'admin' ? 'active text-primary-green' : 'text-white/90'}`}
            >
              Admin Dashboard
            </button>
            
            <div className="flex flex-col md:flex-row items-center w-full md:w-auto gap-5 md:gap-4 mt-4 md:mt-0 pt-6 md:pt-0 border-t border-white/10 md:border-none">
              {user ? (
                <>
                  <div className="flex items-center justify-between w-full md:w-auto md:space-x-3 p-4 md:p-0 bg-white/5 md:bg-transparent rounded-2xl border border-white/5 md:border-none">
                    <div className="flex items-center space-x-4">
                      {user.avatar && (
                        <img 
                          src={user.avatar} 
                          alt={user.name} 
                          className="w-12 h-12 md:w-8 md:h-8 rounded-full cursor-pointer border-2 border-primary-green shadow-lg shadow-primary-green/20"
                          onClick={() => setShowProfileModal(true)}
                        />
                      )}
                      <div>
                        <p className="text-lg md:text-sm font-black text-white">{user.name}</p>
                        <p className="text-xs text-secondary/70 uppercase tracking-widest font-bold">{user.role}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3 w-full md:w-auto">
                    <button
                      onClick={() => { setIsMenuOpen(false); setShowProfileModal(true); }}
                      className="btn btn-outline flex-1 md:flex-none h-14 md:h-auto rounded-xl"
                      style={{fontSize: '14px', fontWeight: '700'}}
                    >
                      Profile
                    </button>
                    <button
                      onClick={() => { setIsMenuOpen(false); onLogout(); }}
                      className="btn btn-outline flex-1 md:flex-none h-14 md:h-auto rounded-xl"
                      style={{fontSize: '14px', fontWeight: '700', borderColor: 'var(--accent-red)', color: 'var(--accent-red)'}}
                    >
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                <button 
                  onClick={() => { setIsMenuOpen(false); setShowAuthModal(true); }}
                  className="btn btn-primary w-full md:w-auto h-14 md:h-auto shadow-xl rounded-xl"
                  style={{fontSize: '16px', fontWeight: '800'}}
                >
                  Admin Login
                </button>
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
