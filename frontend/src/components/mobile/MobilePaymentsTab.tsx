import React, { useState, useEffect } from 'react';
import { getPayments } from '../../services/api';
import { Wallet, ChevronRight, X, Check, Clock, AlertCircle } from 'lucide-react';

interface Payment {
  _id: string;
  matchId: {
    _id: string;
    date: string;
    opponent: string;
    ground: string;
  };
  totalAmount: number;
  collectedAmount: number;
  pendingAmount: number;
  status: string;
  membersCount: number;
  paidCount: number;
}

const MobilePaymentsTab: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setLoading(true);
        const data = await getPayments();
        setPayments(data);
      } catch (err) {
        console.error('Error fetching payments:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString()}`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <Check className="w-4 h-4 text-emerald-400" />;
      case 'partial': return <Clock className="w-4 h-4 text-amber-400" />;
      default: return <AlertCircle className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-500/20 text-emerald-400';
      case 'partial': return 'bg-amber-500/20 text-amber-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  // Calculate totals
  const totalCollected = payments.reduce((sum, p) => sum + (p.collectedAmount || 0), 0);
  const totalPending = payments.reduce((sum, p) => sum + (p.pendingAmount || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <>
      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-emerald-500/10 rounded-xl p-3 border border-emerald-500/20">
          <p className="text-xs text-emerald-400 mb-1">Collected</p>
          <p className="text-xl font-bold text-emerald-400">{formatCurrency(totalCollected)}</p>
        </div>
        <div className="bg-amber-500/10 rounded-xl p-3 border border-amber-500/20">
          <p className="text-xs text-amber-400 mb-1">Pending</p>
          <p className="text-xl font-bold text-amber-400">{formatCurrency(totalPending)}</p>
        </div>
      </div>

      {/* Payment List */}
      <div className="space-y-2">
        {payments.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Wallet className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No payments found</p>
          </div>
        ) : (
          payments.map((payment) => (
            <div
              key={payment._id}
              className="bg-slate-800/50 rounded-xl p-3 border border-white/5 active:bg-slate-800/70 transition-colors"
              onClick={() => setSelectedPayment(payment)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-white text-sm">vs {payment.matchId?.opponent || 'Match'}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${getStatusColor(payment.status)}`}>
                      {payment.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span>{formatDate(payment.matchId?.date)}</span>
                    <span>{payment.paidCount}/{payment.membersCount} paid</span>
                  </div>
                  {/* Progress Bar */}
                  <div className="mt-2">
                    <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{
                          width: `${payment.totalAmount > 0 ? (payment.collectedAmount / payment.totalAmount) * 100 : 0}%`
                        }}
                      />
                    </div>
                    <div className="flex justify-between mt-1 text-xs">
                      <span className="text-emerald-400">{formatCurrency(payment.collectedAmount)}</span>
                      <span className="text-slate-500">{formatCurrency(payment.totalAmount)}</span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600 ml-2" />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detail Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedPayment(null)}>
          <div
            className="absolute bottom-0 left-0 right-0 bg-slate-900 rounded-t-3xl max-h-[85vh] overflow-y-auto animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-slate-900 pt-3 pb-2 px-4 border-b border-white/5">
              <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mb-3" />
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">vs {selectedPayment.matchId?.opponent}</h3>
                <button onClick={() => setSelectedPayment(null)} className="p-2 text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-slate-500">{formatDate(selectedPayment.matchId?.date)}</p>
            </div>

            <div className="p-4 space-y-4">
              {/* Payment Summary */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-800/50 rounded-xl p-3 text-center">
                  <p className="text-xs text-slate-400 mb-1">Total</p>
                  <p className="text-sm font-bold text-white">{formatCurrency(selectedPayment.totalAmount)}</p>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-3 text-center">
                  <p className="text-xs text-slate-400 mb-1">Collected</p>
                  <p className="text-sm font-bold text-emerald-400">{formatCurrency(selectedPayment.collectedAmount)}</p>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-3 text-center">
                  <p className="text-xs text-slate-400 mb-1">Pending</p>
                  <p className="text-sm font-bold text-amber-400">{formatCurrency(selectedPayment.pendingAmount)}</p>
                </div>
              </div>

              {/* Info Note */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                <p className="text-xs text-blue-400">
                  For detailed payment management, please use the desktop version.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default MobilePaymentsTab;
