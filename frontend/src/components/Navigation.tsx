import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import GoogleAuth from './GoogleAuth';
import UserProfile from './UserProfile';
import Notification from './Notification';
import { Menu, X, Home, Settings, MessageSquare, Calendar, Wallet, Users } from 'lucide-react';

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
  activeTab?: 'feedback' | 'users' | 'whatsapp' | 'matches' | 'payments';
  onTabChange?: (tab: 'feedback' | 'users' | 'whatsapp' | 'matches' | 'payments') => void;
}

const Navigation: React.FC<NavigationProps> = ({ 
  currentView, 
  onViewChange, 
  user, 
  onLogout,
  activeTab = 'feedback',
  onTabChange
}) => {
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

  const adminTabs = [
    { id: 'feedback', label: 'Feedback', icon: MessageSquare },
    { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
    { id: 'matches', label: 'Matches', icon: Calendar },
    { id: 'payments', label: 'Payments', icon: Wallet },
    { id: 'users', label: 'Users', icon: Users }
  ];

  return (
    <>
      <header className="header sticky top-0 z-40">
        <div className="header-content">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center">
              <button 
                onClick={() => handleViewChange('form')}
                className="flex items-center hover:opacity-80 transition-opacity"
                aria-label="Go to home page"
              >
                <div className="cricket-ball" style={{width: '32px', height: '32px', marginRight: '10px'}}></div>
                <h1 className="logo text-lg md:text-2xl">Mavericks XI</h1>
              </button>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <button
                onClick={() => handleViewChange('form')}
                className={`nav-link text-base font-medium tracking-wide transition-colors ${currentView === 'form' ? 'text-primary-green' : 'text-white/70 hover:text-white'}`}
              >
                Feedback
              </button>
              <button
                onClick={handleAdminClick}
                className={`nav-link text-base font-medium tracking-wide transition-colors ${currentView === 'admin' ? 'text-primary-green' : 'text-white/70 hover:text-white'}`}
              >
                Admin
              </button>
              
              {user ? (
                <div className="flex items-center gap-4 pl-8 border-l border-white/10">
                  <div className="flex items-center gap-3">
                    {user.avatar && (
                      <img 
                        src={user.avatar} 
                        alt={user.name} 
                        className="w-8 h-8 rounded-full cursor-pointer border-2 border-primary-green"
                        onClick={() => setShowProfileModal(true)}
                      />
                    )}
                    <div className="text-sm">
                      <p className="font-semibold text-white">{user.name}</p>
                      <p className="text-xs text-secondary/70 uppercase">{user.role}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => onLogout()}
                    className="text-xs text-secondary hover:text-accent-red transition-colors"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setShowAuthModal(true)}
                  className="btn btn-primary text-sm h-10 px-6 rounded-lg"
                >
                  Admin Login
                </button>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button 
              className="md:hidden p-2 text-white focus:outline-none"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>

          {/* Mobile Dropdown Menu */}
          {isMenuOpen && (
            <nav className="md:hidden absolute top-full left-0 w-full bg-gradient-to-b from-[#16213e] to-[#1a1a2e] border-b border-primary-green/30 p-4 space-y-3 z-[100] shadow-lg animate-fade-in">
              <button
                onClick={() => { handleViewChange('form'); setIsMenuOpen(false); }}
                className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${currentView === 'form' ? 'bg-primary-green/20 text-primary-green' : 'text-white/70 hover:bg-white/5'}`}
              >
                Feedback Form
              </button>
              <button
                onClick={() => { handleAdminClick(); setIsMenuOpen(false); }}
                className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${currentView === 'admin' ? 'bg-primary-green/20 text-primary-green' : 'text-white/70 hover:bg-white/5'}`}
              >
                Admin Dashboard
              </button>
              
              {user && (
                <>
                  <div className="border-t border-white/10 pt-3 mt-3">
                    <button
                      onClick={() => { setShowProfileModal(true); setIsMenuOpen(false); }}
                      className="w-full text-left px-4 py-3 rounded-lg font-medium text-white/70 hover:bg-white/5 transition-colors"
                    >
                      Profile
                    </button>
                    <button
                      onClick={() => { onLogout(); setIsMenuOpen(false); }}
                      className="w-full text-left px-4 py-3 rounded-lg font-medium text-accent-red hover:bg-red-500/10 transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                </>
              )}
            </nav>
          )}
        </div>
      </header>

      {/* Bottom Navigation Bar - Admin Tabs (Mobile Only) */}
      {currentView === 'admin' && user && (
        <nav className="fixed bottom-0 left-0 right-0 md:hidden bg-gradient-to-t from-[#0f3460] to-[#16213e] border-t border-primary-green/30 z-40">
          <div className="flex justify-around items-center h-20 px-2">
            {adminTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange?.(tab.id as any)}
                  className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-all ${
                    isActive 
                      ? 'text-primary-green' 
                      : 'text-white/50 hover:text-white/70'
                  }`}
                  aria-label={tab.label}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-semibold">{tab.label}</span>
                  {isActive && (
                    <div className="absolute bottom-0 w-12 h-1 bg-primary-green rounded-t-full" />
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      )}

      {/* Desktop Tab Navigation - Admin */}
      {currentView === 'admin' && user && (
        <div className="hidden md:block sticky top-16 z-30 bg-gradient-to-r from-[#0f3460] to-[#16213e] border-b border-primary-green/20">
          <div className="max-w-7xl mx-auto px-6 flex gap-8">
            {adminTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange?.(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-4 font-medium transition-all border-b-2 ${
                    isActive 
                      ? 'text-primary-green border-primary-green' 
                      : 'text-white/60 hover:text-white border-transparent'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

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
