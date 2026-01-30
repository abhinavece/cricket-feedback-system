import React, { useState, useEffect } from 'react';
import { Menu, X, LogIn, Compass, Info, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

interface HomeNavbarProps {
  onLogin: () => void;
}

const HomeNavbar: React.FC<HomeNavbarProps> = ({ onLogin }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when pressing escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMobileMenuOpen(false);
    };

    if (isMobileMenuOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMobileMenuOpen(false);
  };

  const navLinks = [
    { label: 'Features', action: () => scrollToSection('features'), icon: <Sparkles className="w-4 h-4" /> },
    { label: 'Grounds', action: () => scrollToSection('grounds'), icon: <Compass className="w-4 h-4" /> },
    { label: 'About', href: '/about', icon: <Info className="w-4 h-4" /> },
  ];

  return (
    <>
      {/* Main navbar */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-slate-900/95 backdrop-blur-md border-b border-white/5 shadow-lg'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <span className="text-lg sm:text-xl">🏏</span>
              </div>
              <span className="text-lg sm:text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">
                Mavericks XI
              </span>
            </Link>

            {/* Desktop navigation */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) =>
                link.href ? (
                  <Link
                    key={link.label}
                    to={link.href}
                    className="text-slate-300 hover:text-white transition-colors font-medium"
                  >
                    {link.label}
                  </Link>
                ) : (
                  <button
                    key={link.label}
                    onClick={link.action}
                    className="text-slate-300 hover:text-white transition-colors font-medium"
                  >
                    {link.label}
                  </button>
                )
              )}

              <button
                onClick={onLogin}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-emerald-500/25"
              >
                <LogIn className="w-4 h-4" />
                Login
              </button>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 text-slate-300 hover:text-white transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu drawer */}
      <div
        className={`fixed inset-0 z-50 md:hidden transition-opacity duration-300 ${
          isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />

        {/* Drawer */}
        <div
          className={`absolute top-0 right-0 bottom-0 w-72 bg-slate-900 border-l border-white/10 transition-transform duration-300 ${
            isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {/* Drawer header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <span className="text-lg font-bold text-white">Menu</span>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 text-slate-400 hover:text-white transition-colors"
              aria-label="Close menu"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Drawer content */}
          <div className="p-4 space-y-2">
            {navLinks.map((link) =>
              link.href ? (
                <Link
                  key={link.label}
                  to={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 p-3 text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                >
                  <span className="text-emerald-400">{link.icon}</span>
                  {link.label}
                </Link>
              ) : (
                <button
                  key={link.label}
                  onClick={() => {
                    link.action?.();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 w-full p-3 text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors text-left"
                >
                  <span className="text-emerald-400">{link.icon}</span>
                  {link.label}
                </button>
              )
            )}

            {/* Login button */}
            <div className="pt-4 mt-4 border-t border-white/10">
              <button
                onClick={() => {
                  onLogin();
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center justify-center gap-2 w-full p-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold rounded-xl transition-all duration-300"
              >
                <LogIn className="w-5 h-5" />
                Login
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default HomeNavbar;
