import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Menu, X, Home, Settings, LogOut } from 'lucide-react';

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
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({
  currentView,
  onViewChange,
  user,
  onLogout,
}) => {
  const { hasPermission } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleAdminClick = () => {
    setIsMenuOpen(false);
    if (user && hasPermission('view_dashboard')) {
      onViewChange('admin');
    }
  };

  return (
    <>
      {/* Compact Mobile Header */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-lg border-b border-white/5">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => { onViewChange('form'); setIsMenuOpen(false); }}
            className="flex items-center gap-2"
          >
            <div className="cricket-ball" style={{ width: '24px', height: '24px' }}></div>
            <span className="font-bold text-white text-sm">Mavericks XI</span>
          </button>

          <div className="flex items-center gap-2">
            {user && (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-7 h-7 rounded-full border border-emerald-500/30"
              />
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

              {user && hasPermission('view_dashboard') && (
                <button
                  onClick={handleAdminClick}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    currentView === 'admin'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  Dashboard
                </button>
              )}

              {user && (
                <>
                  <div className="h-px bg-white/10 my-2" />
                  <div className="px-4 py-2">
                    <p className="text-xs text-slate-500">Signed in as</p>
                    <p className="text-sm text-white font-medium truncate">{user.name}</p>
                  </div>
                  <button
                    onClick={() => { onLogout(); setIsMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </>
              )}
            </div>
          </nav>
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
      `}</style>
    </>
  );
};

export default MobileNavigation;
