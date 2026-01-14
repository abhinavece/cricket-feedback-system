import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Calendar, Clock, MapPin, DollarSign, CheckCircle, XCircle, AlertCircle, Users } from 'lucide-react';
import axios from 'axios';

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
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<PublicData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // REACT_APP_API_URL already includes /api, so we just append /public/token
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-8 max-w-md w-full text-center border border-white/10">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Link Not Available</h1>
          <p className="text-slate-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { payment } = data;
  const matchDate = payment.match?.date ? new Date(payment.match.date) : null;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'text-emerald-400 bg-emerald-500/20';
      case 'partial': return 'text-amber-400 bg-amber-500/20';
      case 'overpaid': return 'text-blue-400 bg-blue-500/20';
      default: return 'text-slate-400 bg-slate-500/20';
    }
  };

  // Use status from API, with fallback calculation
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

  // Separate members into paid (including overpaid, free players) and pending (including partial)
  const paidMembers = payment.squadMembers.filter(m => {
    const status = getMemberStatus(m);
    return status === 'paid' || status === 'overpaid';
  });
  const pendingMembers = payment.squadMembers.filter(m => {
    const status = getMemberStatus(m);
    return status === 'pending' || status === 'partial';
  });
  
  // Get display amount for pending members
  const getPendingAmount = (m: SquadMember) => {
    // Use dueAmount directly from API if available
    if (m.dueAmount !== undefined && m.dueAmount !== null) return m.dueAmount;
    // Fallback calculation
    const amount = m.amount || 0;
    const paid = m.paidAmount || 0;
    return Math.max(0, amount - paid);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 py-6 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-full flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              Payment Details
            </h1>
          </div>
          <p className="text-center text-blue-100 text-sm">{payment.title || 'Match Payment'}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        {/* Match Info Card */}
        {payment.match && (
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <h2 className="text-lg font-semibold text-white mb-4 text-center">
              vs {payment.match.opponent}
            </h2>
            <div className="flex flex-wrap justify-center gap-4 md:gap-8 text-sm">
              {matchDate && (
                <div className="flex items-center gap-2 text-slate-300">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  <span>{formatDate(matchDate)}</span>
                </div>
              )}
              {payment.match.ground && (
                <div className="flex items-center gap-2 text-slate-300">
                  <MapPin className="w-4 h-4 text-pink-400" />
                  <span>{payment.match.ground}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Payment Summary */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4 text-center">
            <p className="text-2xl md:text-3xl font-bold text-white">₹{payment.totalAmount}</p>
            <p className="text-xs text-slate-400 mt-1">Total Amount</p>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-center">
            <p className="text-2xl md:text-3xl font-bold text-emerald-400">
              ₹{(payment.totalCollected || 0) - (payment.totalOwed || 0)}
            </p>
            <p className="text-xs text-slate-400 mt-1">Collected</p>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-center md:col-span-1 col-span-2">
            <p className="text-2xl md:text-3xl font-bold text-amber-400">₹{payment.totalPending}</p>
            <p className="text-xs text-slate-400 mt-1">Pending</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-4 border border-white/10">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-400">Collection Progress</span>
            <span className="text-white font-medium">
              {payment.paidCount || 0} / {payment.membersCount || payment.squadMembers.length} paid
            </span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, payment.totalAmount > 0 ? ((payment.totalCollected || 0) / payment.totalAmount) * 100 : 0)}%` }}
            ></div>
          </div>
          <p className="text-right text-xs text-slate-500 mt-1">
            {payment.totalAmount > 0 ? Math.round(((payment.totalCollected || 0) / payment.totalAmount) * 100) : 0}% collected
          </p>
        </div>

        {/* Squad Payment Status */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Paid */}
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl overflow-hidden">
            <div className="bg-emerald-500/20 px-4 py-3 border-b border-emerald-500/30">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <span className="font-semibold text-emerald-400">Paid ({paidMembers.length})</span>
              </div>
            </div>
            <div className="p-3 space-y-2 max-h-80 overflow-y-auto">
              {paidMembers.map((member, idx) => (
                <div key={member.playerId || idx} className="bg-slate-800/50 rounded-lg px-3 py-2 flex justify-between items-center">
                  <div>
                    <span className="text-white font-medium text-sm">{idx + 1}. {member.playerName}</span>
                    {member.isFreePlayer && (
                      <span className="text-purple-400 text-xs ml-2">(Free)</span>
                    )}
                  </div>
                  <div className="text-right">
                    {member.isFreePlayer ? (
                      <span className="text-purple-400 text-sm font-medium">FREE</span>
                    ) : (
                      <span className="text-emerald-400 text-sm font-medium">₹{member.paidAmount || 0}</span>
                    )}
                    {(member.owedAmount || 0) > 0 && (
                      <span className="text-blue-400 text-xs block">+₹{member.owedAmount} refund</span>
                    )}
                  </div>
                </div>
              ))}
              {paidMembers.length === 0 && (
                <p className="text-slate-500 text-center py-4 text-sm">No payments yet</p>
              )}
            </div>
          </div>

          {/* Pending */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl overflow-hidden">
            <div className="bg-amber-500/20 px-4 py-3 border-b border-amber-500/30">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-400" />
                <span className="font-semibold text-amber-400">Pending ({pendingMembers.length})</span>
              </div>
            </div>
            <div className="p-3 space-y-2 max-h-80 overflow-y-auto">
              {pendingMembers.map((member, idx) => (
                <div key={member.playerId || idx} className="bg-slate-800/50 rounded-lg px-3 py-2 flex justify-between items-center">
                  <div>
                    <span className="text-white font-medium text-sm">{idx + 1}. {member.playerName}</span>
                    {(member.paidAmount || 0) > 0 && (
                      <span className="text-slate-500 text-xs ml-2">(Paid: ₹{member.paidAmount})</span>
                    )}
                  </div>
                  <span className="text-amber-400 text-sm font-medium">
                    ₹{getPendingAmount(member)} due
                  </span>
                </div>
              ))}
              {pendingMembers.length === 0 && (
                <p className="text-slate-500 text-center py-4 text-sm">All payments collected!</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-4">
          <p className="text-xs text-slate-500">
            💰 Payment details shared publicly
          </p>
        </div>
      </div>
    </div>
  );
};

export default PublicPaymentView;
