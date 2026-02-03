import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useOrganization } from '../contexts/OrganizationContext';
import GoogleAuth from './GoogleAuth';
import UserProfile from './UserProfile';
import Notification from './Notification';
import CricSmartLogo from './CricSmartLogo';
import OrganizationSwitcher from './OrganizationSwitcher';
import { Menu, X, Home, Settings, MessageSquare, Calendar, Wallet, Users, Smartphone, Building2 } from 'lucide-react';

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
  activeTab?: 'feedback' | 'users' | 'whatsapp' | 'chats' | 'matches' | 'payments' | 'player-history' | 'analytics' | 'settings' | 'grounds' | 'team' | 'tournaments';
  onTabChange?: (tab: 'feedback' | 'users' | 'whatsapp' | 'chats' | 'matches' | 'payments' | 'player-history' | 'analytics' | 'settings' | 'grounds' | 'team' | 'tournaments') => void;
  onToggleDevice?: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ 
  currentView, 
  onViewChange, 
  user, 
  onLogout,
  activeTab = 'feedback',
  onTabChange,
  onToggleDevice
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
          {/* Mobile Header - Clean & Beautiful */}
          <div className="md:hidden flex items-center justify-between w-full px-4 py-3.5">
            <button 
              onClick={() => handleViewChange('form')}
              className="flex items-center hover:opacity-80 transition-opacity"
              aria-label="Go to home page"
            >
              <CricSmartLogo size="xs" showText={true} showTagline={true} showAIBadge={true} />
            </button>
            
            <button 
              className="p-2 text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Mobile Dropdown Menu - Beautiful Design */}
          {isMenuOpen && (
            <nav className="md:hidden absolute top-full left-0 w-full bg-gradient-to-b from-[#0f172a]/95 to-[#0a0f1a]/95 backdrop-blur-xl border-b border-primary-green/10 z-[100] animate-fade-in">
              <div className="px-3 py-5 space-y-1">
                {/* Main Navigation Items */}
                <button
                  onClick={() => { handleViewChange('form'); setIsMenuOpen(false); }}
                  className={`w-full text-left px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    currentView === 'form' 
                      ? 'bg-primary-green/20 text-primary-green shadow-lg shadow-primary-green/10' 
                      : 'text-white/70 hover:text-white hover:bg-white/8'
                  }`}
                >
                  Feedback Form
                </button>
                <button
                  onClick={() => { handleAdminClick(); setIsMenuOpen(false); }}
                  className={`w-full text-left px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    currentView === 'admin' 
                      ? 'bg-primary-green/20 text-primary-green shadow-lg shadow-primary-green/10' 
                      : 'text-white/70 hover:text-white hover:bg-white/8'
                  }`}
                >
                  Admin Dashboard
                </button>
                
                {/* Divider */}
                <div className="h-px bg-gradient-to-r from-white/0 via-white/10 to-white/0 my-4"></div>
                
                {/* Device Toggle */}
                {onToggleDevice && (
                  <button
                    onClick={() => { onToggleDevice(); setIsMenuOpen(false); }}
                    className="w-full text-left px-4 py-3.5 rounded-xl text-sm font-medium text-sky-400 hover:text-sky-300 hover:bg-sky-500/10 transition-all duration-200 flex items-center gap-2"
                  >
                    <Smartphone className="w-4 h-4" />
                    Switch to Mobile
                  </button>
                )}

                {user && (
                  <>
                    {/* Divider */}
                    <div className="h-px bg-gradient-to-r from-white/0 via-white/10 to-white/0 my-4"></div>
                    
                    {/* User Section */}
                    <div className="px-2 py-2">
                      <div className="flex items-center gap-3 px-2 py-2 mb-3">
                        {user.avatar && (
                          <img 
                            src={user.avatar} 
                            alt={user.name} 
                            className="w-8 h-8 rounded-full border border-primary-green/30"
                          />
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-white truncate">{user.name}</p>
                          <p className="text-xs text-white/50 uppercase tracking-wider">{user.role}</p>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => { setShowProfileModal(true); setIsMenuOpen(false); }}
                        className="w-full text-left px-4 py-2.5 rounded-lg text-xs font-medium text-white/70 hover:text-white hover:bg-white/8 transition-all duration-200"
                      >
                        Profile Settings
                      </button>
                      <button
                        onClick={() => { onLogout(); setIsMenuOpen(false); }}
                        className="w-full text-left px-4 py-2.5 rounded-lg text-xs font-medium text-red-400/80 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200"
                      >
                        Logout
                      </button>
                    </div>
                  </>
                )}
              </div>
            </nav>
          )}

          {/* Desktop Header */}
          <div className="hidden md:flex items-center justify-between w-full">
            <div className="flex items-center gap-6">
              <button 
                onClick={() => handleViewChange('form')}
                className="flex items-center hover:opacity-80 transition-opacity"
                aria-label="Go to home page"
              >
                <CricSmartLogo size="sm" showText={true} showTagline={true} showAIBadge={true} />
              </button>
              
              {/* Organization Switcher - Show when user is logged in and in admin view */}
              {user && currentView === 'admin' && (
                <div className="pl-6 border-l border-white/10">
                  <OrganizationSwitcher />
                </div>
              )}
            </div>
            
            {/* Desktop Navigation */}
            <div className="flex items-center gap-8">
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
          </div>
        </div>
      </header>

      {/* Bottom Navigation Bar - Admin Tabs (Hidden - using top segmented control instead) */}
      {currentView === 'admin' && user && (
        <nav className="hidden bg-[#0a0f1a]/80 backdrop-blur-xl border-t border-primary-green/15 z-40">
          <div className="flex items-center justify-around h-16 px-1">
            {adminTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange?.(tab.id as any)}
                  className={`relative flex flex-col items-center justify-center gap-0.5 py-2 px-3 rounded-xl transition-all duration-300 ${
                    isActive 
                      ? 'text-primary-green' 
                      : 'text-white/50 hover:text-white/70'
                  }`}
                  aria-label={tab.label}
                >
                  {isActive && (
                    <div className="absolute inset-0 bg-primary-green/10 rounded-xl -z-10" />
                  )}
                  <Icon className={`transition-all duration-300 ${isActive ? 'w-5 h-5' : 'w-5 h-5'}`} />
                  <span className={`text-[10px] font-bold transition-all duration-300 ${isActive ? 'text-primary-green' : 'text-white/50'}`}>
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      )}

      {/* Desktop Tab Navigation - Admin (Hidden - using AdminDashboard cascade tabs instead) */}
      {currentView === 'admin' && user && (
        <div className="hidden bg-gradient-to-r from-[#0f3460] to-[#16213e] border-b border-primary-green/20">
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
          message="This area is restricted to authorized team members only. Please contact your team admin if you need access."
          onClose={() => setShowPermissionNotification(false)}
        />
      )}
    </>
  );
};

export default Navigation;
