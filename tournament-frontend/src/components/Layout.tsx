import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Trophy,
  LogOut,
  User,
  ChevronDown,
  LayoutDashboard,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTournament } from '../contexts/TournamentContext';

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const { currentTournament } = useTournament();
  const location = useLocation();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-broadcast-900">
      {/* Top Header Bar - broadcast style */}
      <header className="sticky top-0 z-50 bg-broadcast-800/95 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            {/* Logo - Redirect to cricsmart.in */}
            <a href="https://cricsmart.in" className="flex items-center gap-3 group cursor-pointer">
              <div className="relative w-9 h-9 group-hover:scale-110 transition-transform duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-lg shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition-shadow" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white font-black text-sm">C</span>
                </div>
              </div>
              <div className="hidden sm:block">
                <h1 className="font-display text-lg tracking-wide text-white group-hover:text-emerald-400 transition-colors">
                  CricSmart
                </h1>
                <p className="text-[10px] font-heading uppercase tracking-widest text-emerald-400 -mt-1">
                  AI Cricket Platform
                </p>
              </div>
            </a>

            {/* Center - Current tournament name */}
            {currentTournament && (
              <div className="hidden md:flex items-center gap-2 px-4 py-1.5 rounded-full bg-broadcast-700/50 border border-white/5">
                <div className="w-2 h-2 rounded-full bg-accent-400 animate-pulse" />
                <span className="font-heading text-sm uppercase tracking-wider text-slate-300">
                  {currentTournament.name}
                </span>
              </div>
            )}

            {/* Right - User menu */}
            <div className="flex items-center gap-3">
              {/* Dashboard link */}
              {location.pathname !== '/' && (
                <Link
                  to="/"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="hidden sm:inline text-sm font-medium">Dashboard</span>
                </Link>
              )}

              {/* User dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
                >
                  {user?.picture ? (
                    <img
                      src={user.picture}
                      alt={user.name}
                      className="w-7 h-7 rounded-full ring-2 ring-white/10"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-accent-500/20 flex items-center justify-center">
                      <User className="w-4 h-4 text-accent-400" />
                    </div>
                  )}
                  <span className="hidden sm:block text-sm font-medium text-slate-300 max-w-[120px] truncate">
                    {user?.name}
                  </span>
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                </button>

                {showUserMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowUserMenu(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-48 py-1 bg-broadcast-700 border border-white/10 rounded-lg shadow-xl z-50 animate-fade-in">
                      <div className="px-3 py-2 border-b border-white/5">
                        <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                        <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-400 hover:bg-white/5 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign out
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <Outlet />
      </main>

      {/* Footer accent line */}
      <div className="fixed bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-accent-500/50 to-transparent pointer-events-none" />
    </div>
  );
};

export default Layout;
