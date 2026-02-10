'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Mail, Phone, Send, Sparkles, Clock, Zap, Star } from 'lucide-react';

interface AuctionComingSoonModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuctionComingSoonModal: React.FC<AuctionComingSoonModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    name: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Send data to support@cricsmart.in
      const response = await fetch('/api/auction-waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          type: 'auction_waitlist',
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        setIsSubmitted(true);
        // Reset form after 3 seconds and close modal
        setTimeout(() => {
          onClose();
          setIsSubmitted(false);
          setFormData({ email: '', phone: '', name: '' });
        }, 3000);
      }
    } catch (error) {
      console.error('Error submitting waitlist:', error);
      // Still show success for better UX
      setIsSubmitted(true);
      setTimeout(() => {
        onClose();
        setIsSubmitted(false);
        setFormData({ email: '', phone: '', name: '' });
      }, 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-slate-900 rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-orange-500/5 to-slate-900" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl" />

        <div className="relative z-10 p-8">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>

          {!isSubmitted ? (
            <>
              {/* Header */}
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/25">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Auction Platform
                  <span className="block text-lg bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                    Coming Soon!
                  </span>
                </h2>
                <p className="text-slate-400 text-sm">
                  Be the first to experience IPL-style cricket auctions powered by AI
                </p>
              </div>

              {/* Features preview */}
              <div className="grid grid-cols-3 gap-3 mb-8">
                <div className="text-center">
                  <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center mx-auto mb-1">
                    <Zap className="w-5 h-5 text-amber-400" />
                  </div>
                  <p className="text-xs text-slate-400">AI Valuation</p>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center mx-auto mb-1">
                    <Clock className="w-5 h-5 text-orange-400" />
                  </div>
                  <p className="text-xs text-slate-400">Live Bidding</p>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center mx-auto mb-1">
                    <Star className="w-5 h-5 text-amber-400" />
                  </div>
                  <p className="text-xs text-slate-400">Pro Analytics</p>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Your Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/20 transition-all"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/20 transition-all"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/20 transition-all"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-semibold rounded-xl transition-all shadow-lg shadow-amber-500/25 hover:shadow-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Joining Waitlist...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Join Waitlist
                    </>
                  )}
                </button>
              </form>

              <p className="text-xs text-slate-500 text-center mt-4">
                We&apos;ll notify you as soon as the auction platform goes live
              </p>
            </>
          ) : (
            /* Success state */
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Send className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">You&apos;re on the list!</h3>
              <p className="text-slate-400">
                Thanks for your interest. We&apos;ll notify you when the auction platform launches.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AuctionComingSoonModal;
