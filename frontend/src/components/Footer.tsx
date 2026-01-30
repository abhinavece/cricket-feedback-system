import React from 'react';
import { Link } from 'react-router-dom';
import { 
  MapPin, 
  Mail, 
  Heart,
  MessageSquare,
  CreditCard,
  Brain,
  CalendarCheck,
  UsersRound,
  Instagram,
  Globe
} from 'lucide-react';

interface FooterProps {
  minimal?: boolean;  // For a simpler footer on certain pages
}

const Footer: React.FC<FooterProps> = ({ minimal = false }) => {
  const currentYear = new Date().getFullYear();

  if (minimal) {
    return (
      <footer className="bg-slate-900/50 border-t border-white/5 py-4 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <span>&copy; {currentYear} CricSmart.</span>
            <span className="hidden sm:inline">All rights reserved.</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/about" className="hover:text-emerald-400 transition-colors">About</Link>
            <Link to="/privacy" className="hover:text-emerald-400 transition-colors">Privacy Policy</Link>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="bg-slate-950 border-t border-slate-800">
      {/* Main Footer Content */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <span className="text-xl font-black text-white">C</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">CricSmart</h3>
                <p className="text-xs text-slate-400">AI Cricket Platform</p>
              </div>
            </Link>
            <p className="text-sm text-slate-400 mb-4">
              The intelligent platform for cricket team management. AI-powered payments, 
              WhatsApp automation, and smart squad building.
            </p>
            <div className="flex gap-3">
              <a 
                href="https://www.instagram.com/_mavericks_xi/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-9 h-9 bg-slate-800 rounded-lg flex items-center justify-center text-slate-400 hover:text-pink-400 hover:bg-pink-500/20 transition-all"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a 
                href="https://cricsmart.in" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-9 h-9 bg-slate-800 rounded-lg flex items-center justify-center text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/20 transition-all"
                aria-label="Website"
              >
                <Globe className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-sm text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-2">
                  <span className="w-1 h-1 bg-emerald-500 rounded-full"></span>
                  Home
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-sm text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-2">
                  <span className="w-1 h-1 bg-emerald-500 rounded-full"></span>
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-sm text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-2">
                  <span className="w-1 h-1 bg-emerald-500 rounded-full"></span>
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Features */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Features</h4>
            <ul className="space-y-2">
              <li className="text-sm text-slate-400 flex items-center gap-2">
                <Brain className="w-3.5 h-3.5 text-violet-400" />
                AI Payment Verification
              </li>
              <li className="text-sm text-slate-400 flex items-center gap-2">
                <CalendarCheck className="w-3.5 h-3.5 text-emerald-500" />
                Auto Availability Check
              </li>
              <li className="text-sm text-slate-400 flex items-center gap-2">
                <UsersRound className="w-3.5 h-3.5 text-emerald-500" />
                Smart Squad Builder
              </li>
              <li className="text-sm text-slate-400 flex items-center gap-2">
                <CreditCard className="w-3.5 h-3.5 text-emerald-500" />
                Payment Management
              </li>
              <li className="text-sm text-slate-400 flex items-center gap-2">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                WhatsApp Integration
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Contact</h4>
            <ul className="space-y-3">
              <li>
                <span className="text-sm text-slate-400 flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-500" />
                  <span>Noida, UP<br />India</span>
                </span>
              </li>
              <li>
                <a 
                  href="mailto:support@cricsmart.in" 
                  className="text-sm text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-2"
                >
                  <Mail className="w-4 h-4 flex-shrink-0 text-emerald-500" />
                  support@cricsmart.in
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-1">
              <span>&copy; {currentYear} CricSmart.</span>
              <span className="hidden sm:inline">All rights reserved.</span>
            </div>
            <div className="flex items-center gap-1">
              <span>Made with</span>
              <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
              <span>for cricket enthusiasts</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
