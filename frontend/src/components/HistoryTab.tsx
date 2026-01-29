import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Users, Calendar, ChevronDown, ChevronRight, Search, 
  Loader2, IndianRupee, CheckCircle2, Clock, AlertCircle,
  MapPin, Trophy, CreditCard
} from 'lucide-react';
import PlayerPaymentHistory from './PlayerPaymentHistory';
import { getMatches, getPayments } from '../services/api';

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

interface HistoryTabProps {
  onNavigateToMatch?: (matchId: string) => void;
}

const HistoryTab: React.FC<HistoryTabProps> = ({ onNavigateToMatch }) => {
  const [activeView, setActiveView] = useState<'players' | 'matches'>('players');
  const [matchesWithPayments, setMatchesWithPayments] = useState<MatchWithPayment[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedMatches, setExpandedMatches] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const hasFetchedMatches = useRef(false);

  // Fetch matches with payments for match history view
  const fetchMatchHistory = useCallback(async () => {
    if (hasFetchedMatches.current) return;
    
    setLoading(true);
    try {
      const [matches, paymentsRes] = await Promise.all([
        getMatches(),
        getPayments()
      ]);
      // getPayments returns { success, payments: [...] }, extract the array
      const payments = paymentsRes?.payments || [];

      // Merge payments with matches
      const merged = matches.map((match: Match) => {
        const payment = payments.find((p: Payment) => 
          p.matchId === match._id || p.matchId === match.matchId
        );
        return { ...match, payment };
      });

      // Sort by date descending
      merged.sort((a: MatchWithPayment, b: MatchWithPayment) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setMatchesWithPayments(merged);
      hasFetchedMatches.current = true;
    } catch (error) {
      console.error('Error fetching match history:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch when switching to matches view
  useEffect(() => {
    if (activeView === 'matches' && !hasFetchedMatches.current) {
      fetchMatchHistory();
    }
  }, [activeView, fetchMatchHistory]);

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

  const getActualCollected = (p: Payment) => {
    if (p.actualCollected !== undefined && p.actualCollected !== null) return p.actualCollected;
    const totalSettled = (p.squadMembers || []).reduce((sum, m) => sum + (m.settledAmount || 0), 0);
    return (p.totalCollected || 0) - totalSettled;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-gradient-to-r from-emerald-500/30 to-green-500/30 text-emerald-300 border-emerald-400/40';
      case 'partial': return 'bg-gradient-to-r from-amber-500/30 to-yellow-500/30 text-amber-300 border-amber-400/40';
      case 'pending': return 'bg-gradient-to-r from-red-500/30 to-rose-500/30 text-red-300 border-red-400/40';
      default: return 'bg-slate-700/50 text-slate-400 border-slate-600/50';
    }
  };

  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
      case 'partial': return <Clock className="w-3.5 h-3.5 text-amber-400" />;
      case 'pending': return <AlertCircle className="w-3.5 h-3.5 text-red-400" />;
      case 'overpaid': return <IndianRupee className="w-3.5 h-3.5 text-blue-400" />;
      default: return <Clock className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  // Filter matches based on search
  const filteredMatches = matchesWithPayments.filter(match =>
    match.opponent?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    match.ground?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Desktop Match History dashboard stats (aggregate across filtered matches)
  const matchDashboardStats = {
    totalCollected: filteredMatches.reduce((s, m) => s + (m.payment ? getActualCollected(m.payment) : 0), 0),
    totalPending: filteredMatches.reduce((s, m) => s + (m.payment?.totalPending || 0), 0),
    completedPayments: filteredMatches.filter(m => m.payment?.status === 'completed').length,
    withPayments: filteredMatches.filter(m => m.payment).length,
    totalMatches: filteredMatches.length
  };

  const formatCurrency = (n: number) => `₹${(n || 0).toLocaleString('en-IN')}`;

  return (
    <div className="space-y-4">
      {/* View Toggle Tabs */}
      <div className="flex gap-2 p-1 bg-slate-800/50 rounded-xl border border-white/10">
        <button
          onClick={() => setActiveView('players')}
          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
            activeView === 'players'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          <Users className="w-4 h-4" />
          <span className="hidden sm:inline">Player History</span>
          <span className="sm:hidden">Players</span>
        </button>
        <button
          onClick={() => setActiveView('matches')}
          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
            activeView === 'matches'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span className="hidden sm:inline">Match History</span>
          <span className="sm:hidden">Matches</span>
        </button>
      </div>

      {/* Player History View */}
      {activeView === 'players' && (
        <PlayerPaymentHistory onNavigateToMatch={onNavigateToMatch} />
      )}

      {/* Match History View */}
      {activeView === 'matches' && (
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search matches..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Desktop-only: Payment Dashboard-style summary (4 stat cards) */}
          <div className="hidden sm:grid grid-cols-4 gap-3">
            <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <CreditCard className="w-4 h-4" /> Total Collected
              </div>
              <div className="text-xl sm:text-2xl font-bold text-emerald-400">{formatCurrency(matchDashboardStats.totalCollected)}</div>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <Clock className="w-4 h-4" /> Pending
              </div>
              <div className="text-xl sm:text-2xl font-bold text-yellow-400">{formatCurrency(matchDashboardStats.totalPending)}</div>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <CheckCircle2 className="w-4 h-4" /> Completed
              </div>
              <div className="text-xl sm:text-2xl font-bold text-white">{matchDashboardStats.completedPayments}</div>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <Calendar className="w-4 h-4" /> With Payments
              </div>
              <div className="text-xl sm:text-2xl font-bold text-white">{matchDashboardStats.withPayments} / {matchDashboardStats.totalMatches}</div>
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
            </div>
          )}

          {/* Match List */}
          {!loading && (
            <div className="space-y-3">
              {filteredMatches.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No matches found</p>
                </div>
              ) : (
                filteredMatches.map((match) => {
                  const isExpanded = expandedMatches.has(match._id);
                  const payment = match.payment;
                  
                  return (
                    <div
                      key={match._id}
                      className="relative bg-gradient-to-r from-emerald-900/30 via-teal-900/20 to-cyan-900/30 border border-emerald-500/30 rounded-xl overflow-hidden hover:border-emerald-400 transition-all shadow-lg shadow-emerald-500/5 sm:bg-slate-800/50 sm:border-white/10 sm:hover:border-emerald-500/40 sm:hover:shadow-[0_0_0_1px_rgba(16,185,129,0.15)] sm:transition-all sm:duration-200 sm:shadow-none"
                    >
                      {/* Emerald gradient left border - mobile only */}
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-400 via-teal-400 to-cyan-400 shadow-lg shadow-emerald-400/30 rounded-tl-xl rounded-bl-xl sm:hidden"></div>
                      <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-r from-emerald-400/20 to-transparent rounded-tl-xl rounded-bl-xl sm:hidden"></div>
                      <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-emerald-500/10 to-transparent blur-sm rounded-tl-xl rounded-bl-xl sm:hidden"></div>
                      {/* Match Header - Clickable to expand */}
                      <div
                        onClick={() => toggleMatchExpand(match._id)}
                        className="p-4 cursor-pointer hover:bg-slate-700/20 sm:hover:bg-slate-800/70 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {/* Expand Icon */}
                          <div className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${isExpanded ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-800/50 text-emerald-300'} sm:bg-transparent sm:p-0 sm:text-slate-400`}>
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </div>

                          {/* Match Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Trophy className="w-4 h-4 text-emerald-400 sm:text-amber-400" />
                              <span className="font-bold text-white truncate">
                                {match.opponent || 'TBD'}
                              </span>
                              {payment && (
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusColor(payment.status)} sm:px-1.5 sm:py-0.5 sm:rounded sm:text-[10px]`}>
                                  {payment.status}
                                </span>
                              )}
                              {!payment && (
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-700/50 text-slate-400 border border-slate-600/50 sm:px-1.5 sm:py-0.5 sm:rounded sm:text-[10px]">
                                  No Payment
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-400">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" /> {formatDate(match.date)}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> {match.ground}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Summary row - same design as Player list: collected · pending | X/Y paid (both mobile and desktop) */}
                        {payment && (
                          <div className="flex items-center justify-between gap-4 mt-2 sm:mt-2 pt-2 sm:pt-2 border-t border-slate-700/50 sm:border-white/5 text-xs">
                            <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                              <span className="font-semibold text-emerald-400 tabular-nums">{formatCurrency(getActualCollected(payment))} collected</span>
                              <span className="text-slate-500/80 hidden sm:inline" aria-hidden>·</span>
                              <span className={`font-semibold tabular-nums ${payment.totalPending > 0 ? 'text-amber-400' : 'text-slate-500'}`}>{formatCurrency(payment.totalPending)} pending</span>
                            </div>
                            <span className="text-slate-400 flex-shrink-0 tabular-nums">
                              {payment.squadMembers?.filter((m: PaymentMember) => m.paymentStatus === 'paid').length || 0}/
                              {payment.squadMembers?.length || 0} paid
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Expanded Content - Squad Members */}
                      {isExpanded && payment && payment.squadMembers && (
                        <div className="relative border-t border-slate-700/50 sm:border-white/10 sm:bg-slate-900/30">
                          {/* Emerald gradient left border - mobile only */}
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-400 via-teal-400 to-cyan-400 shadow-lg shadow-emerald-400/30 sm:hidden"></div>
                          <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-r from-emerald-400/20 to-transparent sm:hidden"></div>
                          <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-emerald-500/10 to-transparent blur-sm sm:hidden"></div>
                          {/* Match Payment Summary - Mobile: Indigo/Blue style */}
                          <div className="relative overflow-hidden bg-gradient-to-br from-indigo-900/50 via-blue-900/40 to-purple-900/50 border-b border-indigo-500/50 p-5 shadow-lg shadow-indigo-500/20 sm:hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/8 to-blue-500/8"></div>
                            <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl"></div>
                            <div className="relative">
                              <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 bg-gradient-to-br from-indigo-500/30 to-blue-500/30 rounded-xl border border-indigo-400/40 shadow-lg shadow-indigo-500/20">
                                  <IndianRupee className="w-5 h-5 text-indigo-300" />
                                </div>
                                <div>
                                  <span className="text-indigo-200 font-bold uppercase tracking-wider text-xs block">Payment Summary</span>
                                  <span className="text-indigo-400/70 text-[10px]">Match Financial Overview</span>
                                </div>
                              </div>
                              {(() => {
                                const actualCollected = getActualCollected(payment);
                                const totalSettled = (payment.squadMembers || []).reduce((s, m) => s + (m.settledAmount || 0), 0);
                                return (
                                  <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-slate-900/60 backdrop-blur-sm rounded-lg p-3 border border-indigo-500/30 hover:border-indigo-400/50 transition-colors">
                                      <span className="text-indigo-300/80 text-[10px] font-semibold uppercase tracking-wide block mb-1.5">Total Amount</span>
                                      <span className="font-bold text-white text-lg">₹{payment.totalAmount}</span>
                                    </div>
                                    <div className="bg-slate-900/60 backdrop-blur-sm rounded-lg p-3 border border-emerald-500/30 hover:border-emerald-400/50 transition-colors">
                                      <span className="text-emerald-300/80 text-[10px] font-semibold uppercase tracking-wide block mb-1.5">Collected</span>
                                      <span className="font-bold text-emerald-400 text-lg">₹{actualCollected}</span>
                                    </div>
                                    <div className="bg-slate-900/60 backdrop-blur-sm rounded-lg p-3 border border-blue-500/30 hover:border-blue-400/50 transition-colors">
                                      <span className="text-blue-300/80 text-[10px] font-semibold uppercase tracking-wide block mb-1.5">Total Settled</span>
                                      <span className="font-bold text-blue-400 text-lg">₹{totalSettled}</span>
                                    </div>
                                    <div className={`bg-slate-900/60 backdrop-blur-sm rounded-lg p-3 border transition-colors ${
                                      payment.totalPending > 0
                                        ? 'border-amber-500/30 hover:border-amber-400/50'
                                        : 'border-slate-500/30 hover:border-slate-400/50'
                                    }`}>
                                      <span className={`text-[10px] font-semibold uppercase tracking-wide block mb-1.5 ${
                                        payment.totalPending > 0 ? 'text-amber-300/80' : 'text-slate-400/80'
                                      }`}>Pending</span>
                                      <span className={`font-bold text-lg ${
                                        payment.totalPending > 0 ? 'text-amber-400' : 'text-slate-500'
                                      }`}>₹{payment.totalPending}</span>
                                    </div>
                                    {(payment.totalOwed || 0) > 0 && (
                                      <div className="bg-slate-900/60 backdrop-blur-sm rounded-lg p-3 border border-red-500/30 hover:border-red-400/50 transition-colors col-span-2">
                                        <span className="text-red-300/80 text-[10px] font-semibold uppercase tracking-wide block mb-1.5">Refunds Due</span>
                                        <span className="font-bold text-red-400 text-lg">₹{payment.totalOwed}</span>
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                          {/* Match Payment Summary - Desktop: same design as Player Payment History / MobileHistoryTab */}
                          {(() => {
                            const actualCollected = getActualCollected(payment);
                            const totalSettled = (payment.squadMembers || []).reduce((s, m) => s + (m.settledAmount || 0), 0);
                            return (
                              <div className="hidden sm:block border-b border-white/10 bg-slate-900/30 p-4">
                                <div className="rounded-xl border border-emerald-500/25 bg-gradient-to-br from-slate-800/80 to-emerald-950/30 p-3 shadow-inner">
                                  <div className="flex items-center gap-2 mb-2.5">
                                    <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                                      <IndianRupee className="w-3.5 h-3.5 text-emerald-400" />
                                    </div>
                                    <p className="text-xs font-bold uppercase tracking-wider text-emerald-400/90">Payment Summary</p>
                                  </div>
                                  <div className="space-y-2 text-xs">
                                    <div className="flex justify-between items-center">
                                      <span className="text-slate-400">Total</span>
                                      <span className="font-bold text-white">{formatCurrency(payment.totalAmount)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-emerald-400">Collected</span>
                                      <span className="font-bold text-emerald-400">{formatCurrency(actualCollected)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-blue-400">Settled</span>
                                      <span className="font-bold text-blue-400">{formatCurrency(totalSettled)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-amber-400">Pending</span>
                                      <span className="font-bold text-amber-400">{formatCurrency(payment.totalPending)}</span>
                                    </div>
                                    {(payment.totalOwed ?? 0) > 0 && (
                                      <div className="flex justify-between items-center pt-1 border-t border-white/5">
                                        <span className="text-red-400">Refunds due</span>
                                        <span className="font-bold text-red-400">{formatCurrency(payment.totalOwed ?? 0)}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                          {/* Squad Members List - mobile gradient; desktop slate cards */}
                          <div className="p-4 bg-gradient-to-b from-emerald-900/15 to-teal-900/15 sm:bg-transparent sm:p-4">
                            <h4 className="text-[10px] font-semibold text-emerald-300 uppercase tracking-wider mb-3 sm:text-xs sm:text-slate-300 sm:mb-2">Squad Members ({payment.squadMembers.length})</h4>
                            <div className="space-y-2">
                              {payment.squadMembers.map((member: PaymentMember) => {
                                const effectiveAmount = member.adjustedAmount !== null 
                                  ? member.adjustedAmount 
                                  : member.calculatedAmount;
                                const isFree = member.adjustedAmount === 0;

                                return (
                                  <div
                                    key={member._id}
                                    className="relative flex items-center justify-between py-2.5 px-4 bg-gradient-to-r from-emerald-900/30 via-teal-900/20 to-cyan-900/30 border border-emerald-500/30 rounded-lg overflow-hidden hover:border-emerald-400 transition-all shadow-lg shadow-emerald-500/5 sm:bg-slate-800/50 sm:border-white/10 sm:rounded-lg sm:border sm:py-2 sm:px-3 sm:shadow-none sm:hover:border-white/20"
                                  >
                                    {/* Emerald gradient left border - mobile only */}
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-400 via-teal-400 to-cyan-400 shadow-lg shadow-emerald-400/30 rounded-tl-lg rounded-bl-lg sm:hidden"></div>
                                    <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-r from-emerald-400/20 to-transparent rounded-tl-lg rounded-bl-lg sm:hidden"></div>
                                    <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-emerald-500/10 to-transparent blur-sm rounded-tl-lg rounded-bl-lg sm:hidden"></div>
                                    <div className="flex items-center gap-3">
                                      {getPaymentStatusIcon(member.paymentStatus)}
                                      <div>
                                        <div className="text-sm font-semibold text-white flex items-center gap-2">
                                          {member.playerName}
                                          {isFree && (
                                            <span className="text-[10px] bg-gradient-to-r from-emerald-500/30 to-teal-500/30 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                                              🎁 Free
                                            </span>
                                          )}
                                        </div>
                                        <div className="text-xs text-slate-500">{member.playerPhone}</div>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="flex flex-col items-end gap-0.5 text-sm">
                                        <div className="flex items-center gap-1.5">
                                          <span className="font-bold text-emerald-400">₹{member.amountPaid}</span>
                                          {(member.settledAmount || 0) > 0 && (
                                            <span className="text-blue-400 text-xs">−₹{member.settledAmount} settled</span>
                                          )}
                                          <span className="text-slate-600">/</span>
                                          <span className="text-slate-400">₹{effectiveAmount}</span>
                                        </div>
                                        {(member.settledAmount || 0) > 0 && (
                                          <div className="text-xs text-emerald-400">Net: ₹{(member.amountPaid || 0) - (member.settledAmount || 0)}</div>
                                        )}
                                        {member.dueAmount > 0 && (
                                          <div className="text-xs font-medium text-amber-400">Pending: ₹{member.dueAmount}</div>
                                        )}
                                        {(member.owedAmount || 0) > 0 && (
                                          <div className="text-xs font-medium text-red-400">Overpaid / Refund due: ₹{member.owedAmount}</div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Expanded Content - No Payment */}
                      {isExpanded && !payment && (
                        <div className="border-t border-white/10 bg-slate-900/30 p-4">
                          <p className="text-center text-slate-400 text-sm">
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

export default HistoryTab;
