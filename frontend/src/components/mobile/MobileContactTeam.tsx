import React from 'react';
import { Mail, Phone, MessageCircle, ExternalLink, Users, Shield } from 'lucide-react';

interface MobileContactTeamProps {
  userName?: string;
}

const MobileContactTeam: React.FC<MobileContactTeamProps> = ({ userName }) => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center border border-emerald-500/30">
          <Shield className="w-10 h-10 text-emerald-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">
          Welcome{userName ? `, ${userName.split(' ')[0]}` : ''}!
        </h2>
        <p className="text-sm text-slate-400 leading-relaxed max-w-xs mx-auto">
          You're logged in as a <span className="text-emerald-400 font-medium">Viewer</span>. 
          Contact the Mavericks XI team for admin access.
        </p>
      </div>

      {/* Contact Options */}
      <div className="w-full max-w-sm space-y-3">
        <a
          href="https://wa.me/919876543210?text=Hi%20Mavericks%20XI%20Team,%20I%20would%20like%20to%20request%20admin%20access%20to%20the%20Cricket%20Feedback%20System."
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-4 p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20 hover:bg-emerald-500/20 transition-all group"
        >
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <MessageCircle className="w-6 h-6 text-emerald-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-white">WhatsApp</p>
            <p className="text-xs text-slate-400">Quick response</p>
          </div>
          <ExternalLink className="w-4 h-4 text-emerald-400" />
        </a>

        <a
          href="mailto:mavericksxi@cricket.com?subject=Admin%20Access%20Request&body=Hi%20Mavericks%20XI%20Team,%0A%0AI%20would%20like%20to%20request%20admin%20access%20to%20the%20Cricket%20Feedback%20System.%0A%0AThank%20you!"
          className="flex items-center gap-4 p-4 bg-sky-500/10 rounded-xl border border-sky-500/20 hover:bg-sky-500/20 transition-all group"
        >
          <div className="w-12 h-12 rounded-full bg-sky-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Mail className="w-6 h-6 text-sky-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-white">Email</p>
            <p className="text-xs text-slate-400">mavericksxi@cricket.com</p>
          </div>
          <ExternalLink className="w-4 h-4 text-sky-400" />
        </a>

        <a
          href="tel:+919876543210"
          className="flex items-center gap-4 p-4 bg-purple-500/10 rounded-xl border border-purple-500/20 hover:bg-purple-500/20 transition-all group"
        >
          <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Phone className="w-6 h-6 text-purple-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-white">Call</p>
            <p className="text-xs text-slate-400">+91 98765 43210</p>
          </div>
          <ExternalLink className="w-4 h-4 text-purple-400" />
        </a>
      </div>

      {/* Info Card */}
      <div className="mt-8 w-full max-w-sm">
        <div className="bg-slate-800/30 rounded-xl p-4 border border-white/5">
          <div className="flex items-start gap-3">
            <Users className="w-5 h-5 text-amber-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-white mb-1">What can viewers do?</p>
              <ul className="text-xs text-slate-400 space-y-1">
                <li>• View feedback submissions</li>
                <li>• Submit match feedback</li>
                <li>• View basic statistics</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <p className="mt-8 text-xs text-slate-500 text-center">
        Mavericks XI Cricket Team • Est. 2020
      </p>
    </div>
  );
};

export default MobileContactTeam;
