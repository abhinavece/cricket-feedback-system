import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Users, Calendar, ChevronDown, ChevronRight, Search, 
  Loader2, IndianRupee, CheckCircle2, Clock, AlertCircle,
  MapPin, Trophy
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
  paymentStatus: 'pending' | 'paid' | 'partial' | 'due' | 'overpaid';
  adjustedAmount: number | null;
  calculatedAmount: number;
}

interface Payment {
  _id: string;
  matchId: string;
  totalAmount: number;
  totalCollected: number;
  totalPending: number;
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
      const payments = paymentsRes || [];

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

  return (
    <div className="space-y-4">
      {/* View Toggle Tabs */}
      <div className="flex gap-2 p-1 bg-slate-800/50 rounded-xl border border-white/10">
        <button
          onClick={() => setActiveView('players')}
          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
            activeView === 'players'
              ? 'bg-emerald-500/20 text-emerald-400'
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
              ? 'bg-emerald-500/20 text-emerald-400'
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
                      className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden"
                    >
                      {/* Match Header - Clickable to expand */}
                      <div
                        onClick={() => toggleMatchExpand(match._id)}
                        className="p-4 cursor-pointer hover:bg-slate-700/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {/* Expand Icon */}
                          <div className="text-slate-400">
                            {isExpanded ? (
                              <ChevronDown className="w-5 h-5" />
                            ) : (
                              <ChevronRight className="w-5 h-5" />
                            )}
                          </div>

                          {/* Match Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Trophy className="w-4 h-4 text-amber-400" />
                              <span className="font-semibold text-white truncate">
                                {match.opponent || 'TBD'}
                              </span>
                              {payment && (
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                                  {payment.status}
                                </span>
                              )}
                              {!payment && (
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-600/50 text-slate-400">
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

                          {/* Payment Summary */}
                          {payment && (
                            <div className="hidden sm:flex items-center gap-4 text-sm">
                              <div className="text-right">
                                <div className="text-emerald-400 font-semibold">₹{payment.totalCollected}</div>
                                <div className="text-xs text-slate-400">collected</div>
                              </div>
                              <div className="text-right">
                                <div className="text-amber-400 font-semibold">₹{payment.totalPending}</div>
                                <div className="text-xs text-slate-400">pending</div>
                              </div>
                              <div className="text-right">
                                <div className="text-white font-semibold">
                                  {payment.squadMembers?.filter((m: PaymentMember) => m.paymentStatus === 'paid').length || 0}/
                                  {payment.squadMembers?.length || 0}
                                </div>
                                <div className="text-xs text-slate-400">paid</div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Mobile Payment Summary */}
                        {payment && (
                          <div className="sm:hidden flex items-center justify-between mt-3 pt-3 border-t border-white/5 text-xs">
                            <span className="text-emerald-400">₹{payment.totalCollected} collected</span>
                            <span className="text-amber-400">₹{payment.totalPending} pending</span>
                            <span className="text-slate-400">
                              {payment.squadMembers?.filter((m: PaymentMember) => m.paymentStatus === 'paid').length || 0}/
                              {payment.squadMembers?.length || 0} paid
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Expanded Content - Squad Members */}
                      {isExpanded && payment && payment.squadMembers && (
                        <div className="border-t border-white/10 bg-slate-900/30">
                          <div className="p-4">
                            <h4 className="text-sm font-medium text-slate-300 mb-3">Squad Members</h4>
                            <div className="space-y-2">
                              {payment.squadMembers.map((member: PaymentMember) => {
                                const effectiveAmount = member.adjustedAmount !== null 
                                  ? member.adjustedAmount 
                                  : member.calculatedAmount;
                                const isFree = member.adjustedAmount === 0;

                                return (
                                  <div
                                    key={member._id}
                                    className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg"
                                  >
                                    <div className="flex items-center gap-3">
                                      {getPaymentStatusIcon(member.paymentStatus)}
                                      <div>
                                        <div className="text-sm font-medium text-white flex items-center gap-2">
                                          {member.playerName}
                                          {isFree && (
                                            <span className="text-xs bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded">
                                              🎁 Free
                                            </span>
                                          )}
                                        </div>
                                        <div className="text-xs text-slate-400">{member.playerPhone}</div>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-sm font-medium text-white">
                                        ₹{member.amountPaid} / ₹{effectiveAmount}
                                      </div>
                                      {member.dueAmount > 0 && (
                                        <div className="text-xs text-amber-400">
                                          Due: ₹{member.dueAmount}
                                        </div>
                                      )}
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
