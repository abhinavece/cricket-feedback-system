import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Calendar, MapPin, CheckCircle, XCircle, AlertCircle, ExternalLink, 
  Sparkles, Share2, Zap, Wallet, TrendingUp, Users, IndianRupee, 
  Trophy, Gift
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { getHomepageUrl, getAppUrl } from '../utils/domain';

interface SquadMember {
  playerId: string;
  playerName: string;
  playerPhone?: string;
  amount: number;
  paidAmount: number;
  owedAmount: number;
  dueAmount: number;
  adjustedAmount?: number | null;
  isFreePlayer?: boolean;
  status: 'pending' | 'partial' | 'paid' | 'overpaid';
}

interface MatchInfo {
  opponent: string;
  date: string;
  time: string;
  ground: string;
  locationLink?: string;
  teamName?: string;
}

interface PaymentData {
  _id: string;
  match: MatchInfo | null;
  title: string;
  totalAmount: number;
  perPersonAmount: number;
  totalCollected: number;
  totalPending: number;
  totalOwed: number;
  paidCount: number;
  membersCount: number;
  status: string;
  squadMembers: SquadMember[];
  createdAt: string;
}

interface PublicData {
  type: string;
  viewType: string;
  payment: PaymentData;
}

const PublicPaymentView: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { token } = useParams<{ token: string }>();
  const { user } = useAuth();
  const [data, setData] = useState<PublicData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Neural network animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const particles: Array<{
      x: number; y: number; vx: number; vy: number; radius: number; opacity: number;
    }> = [];

    const numParticles = 50;
    
    for (let i = 0; i < numParticles; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.4 + 0.1,
      });
    }

    let animationId: number;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(99, 102, 241, ${p.opacity})`;
        ctx.fill();

        particles.slice(i + 1).forEach((p2) => {
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(99, 102, 241, ${0.1 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationId);
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const apiUrl = process.env.REACT_APP_API_URL || '';
        const response = await axios.get(`${apiUrl}/public/${token}`);
        
        if (response.data.success) {
          setData(response.data.data);
        } else {
          setError(response.data.error || 'Failed to load data');
        }
      } catch (err: any) {
        if (err.response?.status === 404) {
          setError('This link is invalid or has been removed');
        } else if (err.response?.status === 410) {
          setError('This link has expired');
        } else {
          setError('Failed to load payment data');
        }
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchData();
    }
  }, [token]);

  const handleLogoClick = () => {
    if (user) {
      window.location.href = getAppUrl();
    } else {
      window.location.href = getHomepageUrl();
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Payment: ${data?.payment?.title || 'Match Payment'}`,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center relative overflow-hidden">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
        <div className="relative z-10 text-center">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-2xl blur-lg opacity-50 animate-pulse" />
            <div className="relative w-16 h-16 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-2xl flex items-center justify-center">
              <Wallet className="w-8 h-8 text-white animate-pulse" />
            </div>
          </div>
          <p className="text-slate-400 text-lg">Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center relative overflow-hidden p-4">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl" />
        <div className="relative z-10 bg-slate-900/80 backdrop-blur-xl rounded-3xl p-8 max-w-md w-full text-center border border-white/10 shadow-2xl">
          <div className="w-20 h-20 bg-rose-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-10 h-10 text-rose-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Link Not Available</h1>
          <p className="text-slate-400 text-base mb-6">{error}</p>
          <button
            onClick={handleLogoClick}
            className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-medium rounded-xl shadow-lg shadow-indigo-500/20 transition-all hover:shadow-indigo-500/30"
          >
            Go to CricSmart
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { payment } = data;
  const matchDate = payment.match?.date ? new Date(payment.match.date) : null;
  const collectionRate = payment.totalAmount > 0 ? Math.round((payment.totalCollected / payment.totalAmount) * 100) : 0;
  const netCollected = (payment.totalCollected || 0) - (payment.totalOwed || 0);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getMemberStatus = (m: SquadMember) => {
    if (m.status && m.status !== 'pending') return m.status;
    if (m.isFreePlayer) return 'paid';
    const amount = m.amount || 0;
    const paid = m.paidAmount || 0;
    if (paid >= amount && amount > 0) return 'paid';
    if (m.owedAmount > 0) return 'overpaid';
    if (paid > 0) return 'partial';
    return 'pending';
  };

  const paidMembers = payment.squadMembers.filter(m => {
    const status = getMemberStatus(m);
    return status === 'paid' || status === 'overpaid';
  });
  
  const pendingMembers = payment.squadMembers.filter(m => {
    const status = getMemberStatus(m);
    return status === 'pending' || status === 'partial';
  });
  
  const getPendingAmount = (m: SquadMember) => {
    if (m.dueAmount !== undefined && m.dueAmount !== null) return m.dueAmount;
    const amount = m.amount || 0;
    const paid = m.paidAmount || 0;
    return Math.max(0, amount - paid);
  };

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Neural Network Background */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 0 }}
      />

      {/* Gradient Overlays */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/8 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-violet-500/8 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 bg-slate-900/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <button onClick={handleLogoClick} className="flex items-center gap-2 sm:gap-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity" />
                <div className="relative w-9 h-9 sm:w-11 sm:h-11 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-black text-lg sm:text-xl">C</span>
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-violet-500 rounded-full flex items-center justify-center border-2 border-slate-900">
                  <Sparkles className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-white" />
                </div>
              </div>
              <div>
                <span className="text-base sm:text-lg font-bold text-white">CricSmart</span>
                <span className="block text-[9px] sm:text-[10px] text-slate-500 uppercase tracking-wider">AI Cricket Platform</span>
              </div>
            </button>

            {/* Share Button */}
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 rounded-xl text-sm text-slate-300 transition-all"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Share</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-5xl mx-auto px-4 py-6 sm:py-8">
        {/* Payment Hero */}
        <div className="bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden mb-6">
          {/* Hero Gradient Bar */}
          <div className="h-2 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500" />
          
          <div className="p-6 sm:p-8">
            {/* Title */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-500/20 border border-indigo-500/30 rounded-full mb-4">
                <Wallet className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-medium text-indigo-400">Payment Tracker</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                {payment.title || 'Match Payment'}
              </h1>
              {payment.match && (
                <p className="text-slate-400">
                  <span className="text-emerald-400">{payment.match.teamName || 'Mavericks XI'}</span>
                  <span className="text-slate-500 mx-2">vs</span>
                  <span className="text-rose-400">{payment.match.opponent}</span>
                </p>
              )}
            </div>

            {/* Match Details */}
            {payment.match && (
              <div className="flex flex-wrap items-center justify-center gap-4 text-sm mb-6">
                {matchDate && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-lg">
                    <Calendar className="w-4 h-4 text-blue-400" />
                    <span className="text-slate-300">{formatDate(matchDate)}</span>
                  </div>
                )}
                {payment.match.ground && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-lg">
                    <MapPin className="w-4 h-4 text-pink-400" />
                    {payment.match.locationLink ? (
                      <a
                        href={payment.match.locationLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-pink-400 hover:text-pink-300 flex items-center gap-1"
                      >
                        {payment.match.ground}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-slate-300">{payment.match.ground}</span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Big Stats */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              <div className="bg-slate-800/50 rounded-2xl p-4 sm:p-5 text-center border border-slate-700/30">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-700/50 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <IndianRupee className="w-5 h-5 sm:w-6 sm:h-6 text-slate-400" />
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-white">₹{payment.totalAmount}</p>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">Total Amount</p>
              </div>
              <div className="bg-emerald-500/10 rounded-2xl p-4 sm:p-5 text-center border border-emerald-500/20">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-emerald-400">₹{netCollected}</p>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">Collected</p>
              </div>
              <div className="bg-amber-500/10 rounded-2xl p-4 sm:p-5 text-center border border-amber-500/20">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-amber-400">₹{payment.totalPending}</p>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">Pending</p>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Section */}
        <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-white/10 p-5 sm:p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-bold text-white">Collection Progress</h3>
            </div>
            <span className="text-sm font-medium text-emerald-400">
              {payment.paidCount || paidMembers.length} / {payment.membersCount || payment.squadMembers.length} paid
            </span>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-xs mb-2">
              <span className="text-slate-400">Amount Collected</span>
              <span className="text-indigo-400 font-medium">{collectionRate}%</span>
            </div>
            <div className="h-4 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 rounded-full transition-all duration-1000 relative"
                style={{ width: `${Math.min(100, collectionRate)}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Per Person Info */}
          <div className="flex items-center justify-center gap-4 text-sm">
            <div className="px-4 py-2 bg-slate-800/50 rounded-xl">
              <span className="text-slate-400">Per Person: </span>
              <span className="text-white font-bold">₹{payment.perPersonAmount}</span>
            </div>
          </div>
        </div>

        {/* Payment Lists */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Paid */}
          <div className="bg-emerald-500/10 backdrop-blur-sm border border-emerald-500/30 rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 px-4 py-3 border-b border-emerald-500/20">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <span className="font-bold text-emerald-400">Paid</span>
                <span className="ml-auto bg-emerald-500/30 px-2.5 py-0.5 rounded-full text-xs font-bold text-emerald-300">
                  {paidMembers.length}
                </span>
              </div>
            </div>
            <div className="p-3 space-y-2 max-h-80 overflow-y-auto">
              {paidMembers.map((member, idx) => (
                <div key={member.playerId || idx} className="bg-slate-800/50 rounded-xl px-3 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-7 h-7 bg-emerald-500/20 rounded-lg flex items-center justify-center text-emerald-400 text-xs font-bold shrink-0">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-white font-medium text-sm truncate">{member.playerName}</p>
                      {member.isFreePlayer && (
                        <span className="flex items-center gap-1 text-purple-400 text-xs">
                          <Gift className="w-3 h-3" />
                          Free Player
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    {member.isFreePlayer ? (
                      <span className="text-purple-400 font-bold text-sm">FREE</span>
                    ) : (
                      <span className="text-emerald-400 font-bold text-sm">₹{member.paidAmount || 0}</span>
                    )}
                    {(member.owedAmount || 0) > 0 && (
                      <p className="text-blue-400 text-xs">+₹{member.owedAmount} refund</p>
                    )}
                  </div>
                </div>
              ))}
              {paidMembers.length === 0 && (
                <div className="text-center py-8">
                  <CheckCircle className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">No payments yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Pending */}
          <div className="bg-amber-500/10 backdrop-blur-sm border border-amber-500/30 rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500/20 to-amber-600/20 px-4 py-3 border-b border-amber-500/20">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-400" />
                <span className="font-bold text-amber-400">Pending</span>
                <span className="ml-auto bg-amber-500/30 px-2.5 py-0.5 rounded-full text-xs font-bold text-amber-300">
                  {pendingMembers.length}
                </span>
              </div>
            </div>
            <div className="p-3 space-y-2 max-h-80 overflow-y-auto">
              {pendingMembers.map((member, idx) => (
                <div key={member.playerId || idx} className="bg-slate-800/50 rounded-xl px-3 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-7 h-7 bg-amber-500/20 rounded-lg flex items-center justify-center text-amber-400 text-xs font-bold shrink-0">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-white font-medium text-sm truncate">{member.playerName}</p>
                      {(member.paidAmount || 0) > 0 && (
                        <p className="text-slate-500 text-xs">Paid: ₹{member.paidAmount}</p>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 ml-2">
                    <span className="px-2.5 py-1 bg-amber-500/20 border border-amber-500/30 rounded-lg text-amber-400 font-bold text-sm">
                      ₹{getPendingAmount(member)} due
                    </span>
                  </div>
                </div>
              ))}
              {pendingMembers.length === 0 && (
                <div className="text-center py-8">
                  <Trophy className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                  <p className="text-emerald-400 font-medium text-sm">All payments collected!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 mt-12">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <button onClick={handleLogoClick} className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">C</span>
              </div>
              <span className="text-sm font-medium">CricSmart</span>
            </button>
            <p className="text-sm text-slate-600 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5" />
              Powered by AI Cricket Platform
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicPaymentView;
