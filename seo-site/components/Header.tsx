'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Menu, X, LogIn, Compass, Info, Sparkles, Brain, BookOpen, Calculator, HelpCircle } from 'lucide-react';
import { siteConfig } from '@/lib/api';

interface HeaderProps {
  onLogin?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLogin }) => {
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
    { label: 'How It Works', action: () => scrollToSection('how-it-works'), icon: <Brain className="w-4 h-4" /> },
    { label: 'Grounds', href: '/grounds', icon: <Compass className="w-4 h-4" /> },
    { label: 'Tools', href: '/tools', icon: <Calculator className="w-4 h-4" /> },
    { label: 'Glossary', href: '/glossary', icon: <BookOpen className="w-4 h-4" /> },
    { label: 'FAQ', href: '/faq', icon: <HelpCircle className="w-4 h-4" /> },
    { label: 'About', href: '/about', icon: <Info className="w-4 h-4" /> },
  ];

  const handleLoginClick = () => {
    if (onLogin) {
      onLogin();
    } else {
      // Default: redirect to app
      window.location.href = siteConfig.appUrl;
    }
  };

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
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="relative w-9 h-9 sm:w-10 sm:h-10">
                {/* Logo background with gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl shadow-lg shadow-emerald-500/20" />
                {/* Logo text */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white font-black text-lg sm:text-xl">C</span>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-lg sm:text-xl font-bold text-white group-hover:text-emerald-400 transition-colors leading-tight">
                  CricSmart
                </span>
                <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider hidden sm:block">
                  AI Cricket Platform
                </span>
              </div>
            </Link>

            {/* Desktop navigation */}
            <div className="hidden md:flex items-center gap-6">
              {navLinks.map((link) =>
                link.href ? (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="text-slate-300 hover:text-white transition-colors font-medium text-sm"
                  >
                    {link.label}
                  </Link>
                ) : (
                  <button
                    key={link.label}
                    onClick={link.action}
                    className="text-slate-300 hover:text-white transition-colors font-medium text-sm"
                  >
                    {link.label}
                  </button>
                )
              )}

              <button
                onClick={handleLoginClick}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-emerald-500/25"
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
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-black">C</span>
              </div>
              <span className="font-bold text-white">CricSmart</span>
            </div>
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
                  href={link.href}
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
                  handleLoginClick();
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center justify-center gap-2 w-full p-4 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-semibold rounded-xl transition-all duration-300"
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

export default Header;
