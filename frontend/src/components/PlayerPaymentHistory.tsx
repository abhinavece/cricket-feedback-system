import React, { useState } from 'react';
import { Search, Calendar, CreditCard, TrendingUp, Phone, AlertCircle, Loader2 } from 'lucide-react';

interface PaymentHistoryEntry {
  amount: number;
  paidAt: string;
  paymentMethod: 'cash' | 'upi' | 'card' | 'bank_transfer' | 'other';
  notes: string;
}

interface MatchPaymentDetail {
  paymentId: string;
  match: {
    _id: string;
    date: string;
    opponent: string;
    ground: string;
    slot: string;
    matchId: string;
  };
  expectedAmount: number;
  amountPaid: number;
  dueAmount: number;
  paymentStatus: 'pending' | 'paid' | 'partial' | 'due';
  dueDate?: string;
  paymentHistory: PaymentHistoryEntry[];
  notes: string;
  lastPaymentDate?: string;
}

interface PlayerPaymentSummary {
  playerPhone: string;
  summary: {
    totalMatches: number;
    totalExpected: number;
    totalPaid: number;
    totalDue: number;
    totalPayments: number;
  };
  history: MatchPaymentDetail[];
}

const PlayerPaymentHistory: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [paymentData, setPaymentData] = useState<PlayerPaymentSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!phoneNumber.trim()) {
      setError('Please enter a phone number');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/payments/player/${phoneNumber}/history`);
      const result = await response.json();
      
      if (result.success) {
        setPaymentData(result);
      } else {
        setError(result.error || 'Failed to fetch payment history');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch payment history');
    } finally {
      setLoading(false);
    }
  };

  const getPaymentMethodColor = (method: string) => {
    switch (method) {
      case 'upi': return 'bg-blue-500/20 text-blue-400';
      case 'cash': return 'bg-green-500/20 text-green-400';
      case 'card': return 'bg-purple-500/20 text-purple-400';
      case 'bank_transfer': return 'bg-cyan-500/20 text-cyan-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'upi': return '📱';
      case 'cash': return '💵';
      case 'card': return '💳';
      case 'bank_transfer': return '🏦';
      default: return '💰';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'partial': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'pending': return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
      case 'due': return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-emerald-400" />
          Player Payment History
        </h2>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Enter player phone number..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-700/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Search
          </button>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-rose-500/20 border border-rose-500/30 rounded-lg flex items-center gap-2 text-rose-400 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}
      </div>

      {/* Payment Summary */}
      {paymentData && (
        <>
          <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6">
            <h3 className="text-lg font-bold text-white mb-4">Summary</h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
              <div className="p-3 bg-slate-700/40 rounded-lg">
                <div className="text-xs text-slate-400 mb-1">Matches</div>
                <div className="text-2xl font-bold text-white">{paymentData.summary.totalMatches}</div>
              </div>
              <div className="p-3 bg-blue-500/15 rounded-lg">
                <div className="text-xs text-blue-400 mb-1">Expected</div>
                <div className="text-2xl font-bold text-blue-400">₹{paymentData.summary.totalExpected}</div>
              </div>
              <div className="p-3 bg-emerald-500/15 rounded-lg">
                <div className="text-xs text-emerald-400 mb-1">Paid</div>
                <div className="text-2xl font-bold text-emerald-400">₹{paymentData.summary.totalPaid}</div>
              </div>
              <div className="p-3 bg-rose-500/15 rounded-lg">
                <div className="text-xs text-rose-400 mb-1">Due</div>
                <div className="text-2xl font-bold text-rose-400">₹{paymentData.summary.totalDue}</div>
              </div>
              <div className="p-3 bg-purple-500/15 rounded-lg">
                <div className="text-xs text-purple-400 mb-1">Payments</div>
                <div className="text-2xl font-bold text-purple-400">{paymentData.summary.totalPayments}</div>
              </div>
            </div>
          </div>

          {/* Match-wise Payment Details */}
          <div className="space-y-3">
            {paymentData.history.map((match, idx) => (
              <div key={match.paymentId} className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6">
                {/* Match Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 pb-4 border-b border-white/10">
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-white">{match.match.matchId}</h4>
                    <p className="text-sm text-slate-400">vs {match.match.opponent}</p>
                    <div className="flex flex-wrap gap-2 mt-2 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(match.match.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span>📍 {match.match.ground}</span>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(match.paymentStatus)}`}>
                    {match.paymentStatus.charAt(0).toUpperCase() + match.paymentStatus.slice(1)}
                  </div>
                </div>

                {/* Payment Summary for this Match */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="p-2 bg-slate-700/30 rounded-lg">
                    <div className="text-xs text-slate-400">Expected</div>
                    <div className="text-lg font-bold text-white">₹{match.expectedAmount}</div>
                  </div>
                  <div className="p-2 bg-emerald-500/15 rounded-lg">
                    <div className="text-xs text-emerald-400">Paid</div>
                    <div className="text-lg font-bold text-emerald-400">₹{match.amountPaid}</div>
                  </div>
                  <div className="p-2 bg-rose-500/15 rounded-lg">
                    <div className="text-xs text-rose-400">Due</div>
                    <div className="text-lg font-bold text-rose-400">₹{match.dueAmount}</div>
                  </div>
                </div>

                {/* Payment History for this Match */}
                {match.paymentHistory.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-sm font-semibold text-slate-300">Payment Transactions</h5>
                    {match.paymentHistory.map((payment, pidx) => (
                      <div key={pidx} className="flex items-center justify-between p-2 bg-slate-700/20 rounded-lg">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className="text-lg">{getPaymentMethodIcon(payment.paymentMethod)}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white">
                              {payment.paymentMethod.replace('_', ' ').toUpperCase()}
                            </p>
                            <p className="text-xs text-slate-400">
                              {new Date(payment.paidAt).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-emerald-400">₹{payment.amount}</p>
                          {payment.notes && (
                            <p className="text-xs text-slate-400 truncate">{payment.notes}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Due Date */}
                {match.dueDate && (
                  <div className="mt-3 p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                    <p className="text-xs text-amber-400">
                      Due by: {new Date(match.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                )}

                {/* Notes */}
                {match.notes && (
                  <div className="mt-3 p-2 bg-slate-700/30 rounded-lg">
                    <p className="text-xs text-slate-400">
                      <span className="font-semibold">Notes:</span> {match.notes}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Empty State */}
      {!paymentData && !loading && (
        <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 sm:p-12 text-center">
          <TrendingUp className="w-12 h-12 text-slate-400 mx-auto mb-4 opacity-50" />
          <p className="text-slate-400">Search for a player's phone number to view their payment history</p>
        </div>
      )}
    </div>
  );
};

export default PlayerPaymentHistory;
