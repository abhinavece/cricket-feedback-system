'use client';

import React, { useState } from 'react';
import { MessageCircle, X, Mail, Phone, Instagram, ArrowRight } from 'lucide-react';

const ContactWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-110 ${
          isOpen
            ? 'bg-slate-700 hover:bg-slate-600 rotate-0'
            : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 shadow-green-500/30'
        }`}
        aria-label={isOpen ? 'Close contact menu' : 'Contact us'}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <MessageCircle className="w-6 h-6 text-white" />
        )}
      </button>

      {/* Contact Panel */}
      <div
        className={`fixed bottom-24 right-6 z-50 w-80 transition-all duration-300 origin-bottom-right ${
          isOpen
            ? 'opacity-100 scale-100 translate-y-0'
            : 'opacity-0 scale-95 translate-y-4 pointer-events-none'
        }`}
      >
        <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-5 py-4">
            <h3 className="text-white font-bold text-lg">Chat with us</h3>
            <p className="text-green-100 text-xs mt-0.5">We typically reply within minutes</p>
          </div>

          {/* Contact Options */}
          <div className="p-4 space-y-3">
            {/* WhatsApp - Primary */}
            <a
              href="https://wa.me/918087102325?text=Hi%20CricSmart%20team!%20I%20have%20a%20question."
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-4 bg-green-500/10 border border-green-500/20 rounded-xl hover:bg-green-500/20 transition-all group"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <Phone className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm">WhatsApp</p>
                <p className="text-green-400 text-xs">+91 8087102325</p>
                <p className="text-slate-500 text-[10px] mt-0.5">Fastest response</p>
              </div>
              <ArrowRight className="w-4 h-4 text-green-400 group-hover:translate-x-1 transition-transform flex-shrink-0" />
            </a>

            {/* Email */}
            <a
              href="mailto:contact@cricsmart.in"
              className="flex items-center gap-4 p-4 bg-slate-800/50 border border-white/5 rounded-xl hover:bg-slate-800 hover:border-white/10 transition-all group"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <Mail className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm">Email</p>
                <p className="text-slate-400 text-xs truncate">contact@cricsmart.in</p>
                <p className="text-slate-500 text-[10px] mt-0.5">Within 24 hours</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition-transform flex-shrink-0" />
            </a>

            {/* Instagram */}
            <a
              href="https://www.instagram.com/_mavericks_xi/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-4 bg-slate-800/50 border border-white/5 rounded-xl hover:bg-slate-800 hover:border-white/10 transition-all group"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <Instagram className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm">Instagram</p>
                <p className="text-slate-400 text-xs">@_mavericks_xi</p>
                <p className="text-slate-500 text-[10px] mt-0.5">Follow for updates</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition-transform flex-shrink-0" />
            </a>
          </div>

          {/* Footer */}
          <div className="px-4 pb-4">
            <p className="text-[10px] text-slate-600 text-center">
              Powered by CricSmart &middot; We&apos;re here to help
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default ContactWidget;
