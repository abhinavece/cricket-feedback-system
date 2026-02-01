import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import GoogleAuth from '../GoogleAuth';
import { Menu, X, Home, Settings, LogOut, LogIn, Monitor, User, Info, Building2 } from 'lucide-react';

interface MobileNavigationProps {
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
  activeTab?: 'feedback' | 'users' | 'whatsapp' | 'chats' | 'matches' | 'payments' | 'player-history' | 'analytics' | 'settings' | 'grounds' | 'team';
  onTabChange?: (tab: 'feedback' | 'users' | 'whatsapp' | 'chats' | 'matches' | 'payments' | 'player-history' | 'analytics' | 'settings' | 'grounds' | 'team') => void;
  onToggleDevice?: () => void;
}

function MobileNavigation({
  currentView,
  onViewChange,
  user,
  onLogout,
  activeTab,
  onTabChange,
  onToggleDevice,
}: MobileNavigationProps) {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const { currentOrg } = useOrganization();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleAdminClick = () => {
    setIsMenuOpen(false);
    if (!user) {
      setShowAuthModal(true);
    } else if (hasPermission('view_dashboard')) {
      onViewChange('admin');
    }
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    onViewChange('admin');
  };

  return (
    <>
      {/* Compact Mobile Header */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-lg border-b border-white/5">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => { onViewChange('form'); setIsMenuOpen(false); }}
            className="flex items-center"
          >
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="w-7 h-7 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <span className="text-white font-black text-sm">C</span>
                </div>
                <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-violet-500 rounded-full flex items-center justify-center border-2 border-slate-900">
                  <span className="text-white text-[8px]">✦</span>
                </div>
              </div>
              <div className="flex flex-col leading-tight">
                {/* Show org name in admin view, otherwise show CricSmart */}
                {user && currentView === 'admin' && currentOrg ? (
                  <>
                    <span className="font-bold text-white text-sm truncate max-w-[120px]">{currentOrg.name}</span>
                    <span className="text-[9px] text-emerald-400 font-medium capitalize">{currentOrg.userRole}</span>
                  </>
                ) : (
                  <>
                    <span className="font-bold text-white text-sm">CricSmart</span>
                    <span className="text-[9px] text-slate-500 font-medium uppercase tracking-wider">AI Cricket Platform</span>
                  </>
                )}
              </div>
            </div>
          </button>

          <div className="flex items-center gap-2">
            {user ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-7 h-7 rounded-full border border-emerald-500/30"
              />
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-medium"
              >
                <LogIn className="w-3.5 h-3.5" />
                Login
              </button>
            )}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-slate-400 hover:text-white"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Slide-down Menu */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsMenuOpen(false)}
        >
          <nav
            className="absolute top-[52px] left-0 right-0 bg-slate-900 border-b border-white/10 animate-slide-down"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 space-y-1">
              <button
                onClick={() => { onViewChange('form'); setIsMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  currentView === 'form'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Home className="w-4 h-4" />
                Feedback Form
              </button>

              <button
                onClick={handleAdminClick}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  currentView === 'admin' && activeTab !== 'settings'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Settings className="w-4 h-4" />
                Dashboard
              </button>

              {user && (
                <button
                  onClick={() => { 
                    onViewChange('admin'); 
                    onTabChange?.('settings'); 
                    setIsMenuOpen(false); 
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    currentView === 'admin' && activeTab === 'settings'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <User className="w-4 h-4" />
                  My Profile
                </button>
              )}

              <div className="h-px bg-white/10 my-2" />
              
              {onToggleDevice && (
                <button
                  onClick={() => { onToggleDevice(); setIsMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-sky-400 hover:bg-sky-500/10 transition-all"
                >
                  <Monitor className="w-4 h-4" />
                  Switch to Desktop
                </button>
              )}

              <button
                onClick={() => { navigate('/about'); setIsMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-800 transition-all"
              >
                <Info className="w-4 h-4" />
                About Us
              </button>

              {user ? (
                <>
                  <div className="h-px bg-white/10 my-2" />
                  <div className="px-4 py-2">
                    <p className="text-xs text-slate-500">Signed in as</p>
                    <p className="text-sm text-white font-medium truncate">{user.name}</p>
                    <p className="text-xs text-slate-500 capitalize">{user.role}</p>
                  </div>
                  <button
                    onClick={() => { onLogout(); setIsMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <div className="h-px bg-white/10 my-2" />
                  <button
                    onClick={() => { setShowAuthModal(true); setIsMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-emerald-400 hover:bg-emerald-500/10 transition-all"
                  >
                    <LogIn className="w-4 h-4" />
                    Sign In with Google
                  </button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}

      {/* Auth Modal */}
      {showAuthModal && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowAuthModal(false)}
        >
          <div
            className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20">
                <span className="text-white font-black text-2xl">C</span>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Welcome to CricSmart</h2>
              <p className="text-sm text-slate-400">Sign in to access the dashboard</p>
            </div>
            <GoogleAuth onSuccess={handleAuthSuccess} />
            <button
              onClick={() => setShowAuthModal(false)}
              className="w-full mt-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slide-down {
          from { transform: translateY(-10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-down {
          animation: slide-down 0.2s ease-out;
        }
        @keyframes slide-up {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </>
  );
}

export default MobileNavigation;
