import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Users, Calendar, ChevronDown, ChevronRight, Search, 
  Loader2, CheckCircle2, Clock, AlertCircle, RefreshCw,
  MapPin, Trophy, IndianRupee
} from 'lucide-react';
import PlayerPaymentHistory from '../PlayerPaymentHistory';
import { getMatches, getPayments } from '../../services/api';

interface Match {
  _id: string;
  matchId: string;
  date: string;
  opponent: string;
  ground: string;
  slot: string;
  status: string;
}

interface PaymentMember {
  _id: string;
  playerName: string;
  playerPhone: string;
  amountPaid: number;
  dueAmount: number;
  owedAmount?: number;
  settledAmount?: number;
  paymentStatus: 'pending' | 'paid' | 'partial' | 'due' | 'overpaid';
  adjustedAmount: number | null;
  calculatedAmount: number;
}

interface Payment {
  _id: string;
  matchId: string;
  totalAmount: number;
  totalCollected: number;
  actualCollected?: number;
  totalPending: number;
  totalOwed?: number;
  status: 'pending' | 'partial' | 'completed';
  squadMembers: PaymentMember[];
}

interface MatchWithPayment extends Match {
  payment?: Payment;
}

const MobileHistoryTab: React.FC = () => {
  const [activeView, setActiveView] = useState<'players' | 'matches'>('players');
  const [matchesWithPayments, setMatchesWithPayments] = useState<MatchWithPayment[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedMatches, setExpandedMatches] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const hasFetchedMatches = useRef(false);

  const fetchMatchHistory = useCallback(async (isRefresh = false) => {
    if (!isRefresh && hasFetchedMatches.current) return;
    
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    try {
      const [matches, paymentsRes] = await Promise.all([
        getMatches(),
        getPayments()
      ]);
      const payments = (paymentsRes?.payments ?? paymentsRes) || [];

      const merged = matches.map((match: Match) => {
        const payment = payments.find((p: Payment) => 
          p.matchId === match._id || p.matchId === match.matchId
        );
        return { ...match, payment };
      });

      merged.sort((a: MatchWithPayment, b: MatchWithPayment) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setMatchesWithPayments(merged);
      hasFetchedMatches.current = true;
    } catch (error) {
      console.error('Error fetching match history:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (activeView === 'matches' && !hasFetchedMatches.current) {
      fetchMatchHistory();
    }
  }, [activeView, fetchMatchHistory]);

  const handleRefresh = () => {
    if (activeView === 'matches') {
      fetchMatchHistory(true);
    }
  };

  const toggleMatchExpand = (matchId: string) => {
    setExpandedMatches(prev => {
      const newSet = new Set(prev);
      if (newSet.has(matchId)) {
        newSet.delete(matchId);
      } else {
        newSet.add(matchId);
      }
      return newSet;
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => `₹${(amount || 0).toLocaleString('en-IN')}`;

  const getActualCollected = (p: Payment) => {
    if (p.actualCollected !== undefined && p.actualCollected !== null) return p.actualCollected;
    const totalSettled = (p.squadMembers || []).reduce((s, m) => s + (m.settledAmount || 0), 0);
    return (p.totalCollected || 0) - totalSettled;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-500/20 text-emerald-400';
      case 'partial': return 'bg-amber-500/20 text-amber-400';
      case 'pending': return 'bg-red-500/20 text-red-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle2 className="w-3 h-3 text-emerald-400" />;
      case 'partial': return <Clock className="w-3 h-3 text-amber-400" />;
      case 'pending': return <AlertCircle className="w-3 h-3 text-red-400" />;
      case 'overpaid': return <IndianRupee className="w-3 h-3 text-blue-400" />;
      default: return <Clock className="w-3 h-3 text-slate-400" />;
    }
  };

  const filteredMatches = matchesWithPayments.filter(match =>
    match.opponent?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    match.ground?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-3">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">Payment History</h2>
        <button
          onClick={handleRefresh}
          disabled={refreshing || loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-medium disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? '...' : 'Refresh'}
        </button>
      </div>

      {/* View Toggle Tabs */}
      <div className="flex gap-1 p-1 bg-slate-800/50 rounded-xl border border-white/10">
        <button
          onClick={() => setActiveView('players')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
            activeView === 'players'
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'text-slate-400'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Players
        </button>
        <button
          onClick={() => setActiveView('matches')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
            activeView === 'matches'
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'text-slate-400'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          Matches
        </button>
      </div>

      {/* Player History View */}
      {activeView === 'players' && (
        <PlayerPaymentHistory />
      )}

      {/* Match History View */}
      {activeView === 'matches' && (
        <div className="space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search matches..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-800/50 border border-white/10 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
            </div>
          )}

          {/* Match List */}
          {!loading && (
            <div className="space-y-2">
              {filteredMatches.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Calendar className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No matches found</p>
                </div>
              ) : (
                filteredMatches.map((match) => {
                  const isExpanded = expandedMatches.has(match._id);
                  const payment = match.payment;
                  
                  return (
                    <div
                      key={match._id}
                      className="bg-slate-800/50 border border-white/10 rounded-xl overflow-hidden"
                    >
                      {/* Match Header */}
                      <div
                        onClick={() => toggleMatchExpand(match._id)}
                        className="p-3 cursor-pointer active:bg-slate-700/30"
                      >
                        <div className="flex items-center gap-2">
                          <div className="text-slate-400">
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Trophy className="w-3.5 h-3.5 text-amber-400" />
                              <span className="font-medium text-white text-sm truncate">
                                {match.opponent || 'TBD'}
                              </span>
                              {payment && (
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${getStatusColor(payment.status)}`}>
                                  {payment.status}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-2.5 h-2.5" /> {formatDate(match.date)}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-2.5 h-2.5" /> {match.ground}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Payment Summary */}
                        {payment && (
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5 text-[10px]">
                            <span className="text-emerald-400">{formatCurrency(getActualCollected(payment))} collected</span>
                            <span className="text-amber-400">{formatCurrency(payment.totalPending)} pending</span>
                            <span className="text-slate-400">
                              {payment.squadMembers?.filter((m: PaymentMember) => m.paymentStatus === 'paid').length || 0}/
                              {payment.squadMembers?.length || 0} paid
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Expanded Content */}
                      {isExpanded && payment && payment.squadMembers && (
                        <div className="border-t border-white/10 bg-slate-900/30 p-3 space-y-3">
                          {/* Payment Summary */}
                          {(() => {
                            const actualCollected = getActualCollected(payment);
                            const totalSettled = payment.squadMembers.reduce((s, m) => s + (m.settledAmount || 0), 0);
                            return (
                              <div className="rounded-lg border border-white/10 bg-slate-800/50 p-2">
                                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Summary</p>
                                <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px]">
                                  <span><span className="text-slate-400">Total</span> <span className="font-semibold text-white">{formatCurrency(payment.totalAmount)}</span></span>
                                  <span><span className="text-emerald-400">Collected</span> <span className="font-semibold text-emerald-400">{formatCurrency(actualCollected)}</span></span>
                                  <span><span className="text-blue-400">Settled</span> <span className="font-semibold text-blue-400">{formatCurrency(totalSettled)}</span></span>
                                  <span><span className="text-amber-400">Pending</span> <span className="font-semibold text-amber-400">{formatCurrency(payment.totalPending)}</span></span>
                                  {(payment.totalOwed || 0) > 0 && (
                                    <span><span className="text-red-400">Refunds due</span> <span className="font-semibold text-red-400">{formatCurrency(payment.totalOwed ?? 0)}</span></span>
                                  )}
                                </div>
                              </div>
                            );
                          })()}
                          <h4 className="text-xs font-medium text-slate-300 mb-2">Squad Members</h4>
                          <div className="space-y-1.5">
                            {payment.squadMembers.map((member: PaymentMember) => {
                              const effectiveAmount = member.adjustedAmount !== null
                                ? member.adjustedAmount
                                : member.calculatedAmount;
                              const isFree = member.adjustedAmount === 0;
                              const settled = member.settledAmount || 0;
                              const netPaid = (member.amountPaid || 0) - settled;

                              return (
                                <div
                                  key={member._id}
                                  className="flex items-center justify-between p-2 bg-slate-800/50 rounded-lg"
                                >
                                  <div className="flex items-center gap-2">
                                    {getPaymentStatusIcon(member.paymentStatus)}
                                    <div>
                                      <div className="text-xs font-medium text-white flex items-center gap-1">
                                        {member.playerName}
                                        {isFree && (
                                          <span className="text-[9px] bg-purple-500/20 text-purple-400 px-1 py-0.5 rounded">
                                            🎁
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-xs font-medium text-white">
                                      {formatCurrency(member.amountPaid)} / {formatCurrency(effectiveAmount)}
                                      {settled > 0 && (
                                        <span className="text-blue-400 text-[10px] ml-1">−{formatCurrency(settled)} settled</span>
                                      )}
                                    </div>
                                    {settled > 0 && (
                                      <div className="text-[10px] text-emerald-400">Net: {formatCurrency(netPaid)}</div>
                                    )}
                                    {member.dueAmount > 0 && (
                                      <div className="text-[10px] text-amber-400">Pending: {formatCurrency(member.dueAmount)}</div>
                                    )}
                                    {(member.owedAmount || 0) > 0 && (
                                      <div className="text-[10px] text-red-400">Refund due: {formatCurrency(member.owedAmount ?? 0)}</div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {isExpanded && !payment && (
                        <div className="border-t border-white/10 bg-slate-900/30 p-3">
                          <p className="text-center text-slate-400 text-xs">
                            No payment record for this match
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MobileHistoryTab;
