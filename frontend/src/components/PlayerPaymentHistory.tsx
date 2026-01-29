import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  Calendar, 
  CreditCard, 
  AlertCircle, 
  Loader2,
  ChevronRight,
  ChevronLeft,
  Users,
  Gift,
  Clock,
  CheckCircle2,
  IndianRupee,
  MapPin,
  ExternalLink,
  Bell,
  Trophy,
  X
} from 'lucide-react';
import {
  getPlayersPaymentSummary,
  getPlayerPaymentHistory,
  sendWhatsAppMessage,
  type PlayerPaymentSummary,
  type PlayerPaymentHistoryResponse,
  type MatchPaymentHistory
} from '../services/api';

interface PlayerPaymentHistoryProps {
  onNavigateToMatch?: (matchId: string) => void;
  initialPlayerId?: string;
}

const PlayerPaymentHistory: React.FC<PlayerPaymentHistoryProps> = ({ 
  onNavigateToMatch,
  initialPlayerId 
}) => {
  // List view state
  const [players, setPlayers] = useState<PlayerPaymentSummary[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingList, setLoadingList] = useState(false);
  
  // Detail view state
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerPaymentHistoryResponse | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Common state
  const [error, setError] = useState<string | null>(null);
  const [sendingReminder, setSendingReminder] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch players list
  const fetchPlayers = useCallback(async (search?: string) => {
    setLoadingList(true);
    setError(null);
    try {
      const result = await getPlayersPaymentSummary(search);
      setPlayers(result.players || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch players');
    } finally {
      setLoadingList(false);
    }
  }, []);

  // Fetch player detail
  const fetchPlayerDetail = useCallback(async (playerId: string, page = 1) => {
    setLoadingDetail(true);
    setError(null);
    try {
      const result = await getPlayerPaymentHistory(playerId, page);
      setSelectedPlayer(result);
      setCurrentPage(page);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch player history');
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  // Handle initial player selection
  useEffect(() => {
    if (initialPlayerId) {
      fetchPlayerDetail(initialPlayerId);
    }
  }, [initialPlayerId, fetchPlayerDetail]);

  // Auto-clear messages
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Search handler with debounce - also handles initial load
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPlayers(searchTerm || undefined);
    }, searchTerm ? 300 : 0); // No delay for initial load
    return () => clearTimeout(timer);
  }, [searchTerm]); // Remove fetchPlayers from deps to prevent re-triggering

  // Send reminder for due payments
  const handleSendReminder = async (matchId: string, opponent: string, dueAmount: number) => {
    if (!selectedPlayer) return;
    
    setSendingReminder(matchId);
    try {
      const message = `Hi ${selectedPlayer.playerName}! 🏏\n\nThis is a reminder that you have a pending payment of ₹${dueAmount} for the match against ${opponent}.\n\nPlease complete the payment at your earliest convenience. Thank you!`;
      
      await sendWhatsAppMessage({
        playerIds: [selectedPlayer.playerId],
        message
      });
      
      setSuccess(`Reminder sent to ${selectedPlayer.playerName}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send reminder');
    } finally {
      setSendingReminder(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-emerald-500/20 text-emerald-400';
      case 'partial': return 'bg-amber-500/20 text-amber-400';
      case 'pending': return 'bg-slate-500/20 text-slate-400';
      case 'due': return 'bg-amber-500/20 text-amber-400';
      case 'overpaid': return 'bg-blue-500/20 text-blue-400';
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Render Player Detail View
  const renderDetailView = () => {
    if (!selectedPlayer) return null;
    const netPaid = selectedPlayer.summary.netContribution ?? (selectedPlayer.summary.totalPaid - (selectedPlayer.summary.totalSettled || 0));
    const hasRefunded = (selectedPlayer.summary.totalSettled || 0) > 0;

    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Back Button & Player Header - larger on desktop */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSelectedPlayer(null)}
            className="p-2 sm:p-3 bg-slate-700/50 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <div className="flex-1 min-w-0">
            <h3 className="text-xl sm:text-2xl font-bold text-white truncate">{selectedPlayer.playerName}</h3>
            <p className="text-sm text-slate-400 mt-0.5">{selectedPlayer.playerPhone}</p>
          </div>
        </div>

        {/* Payment Summary - mobile: compact block (Match tab style) */}
        <div className="sm:hidden rounded-xl border border-emerald-500/25 bg-gradient-to-br from-slate-800/80 to-emerald-950/30 p-3 shadow-inner">
          <div className="flex items-center gap-2 mb-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <IndianRupee className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-400/90">Payment Summary</p>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Paid (net)</span>
              <span className="font-bold text-emerald-400">₹{netPaid}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-amber-400">Due</span>
              <span className="font-bold text-amber-400">₹{selectedPlayer.summary.totalDue}</span>
            </div>
            {hasRefunded && (
              <div className="flex justify-between items-center">
                <span className="text-blue-400">Refunded</span>
                <span className="font-bold text-blue-400">₹{selectedPlayer.summary.totalSettled}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-1 border-t border-white/5">
              <span className="text-slate-400">Matches</span>
              <span className="font-bold text-white">{selectedPlayer.summary.totalMatches}{selectedPlayer.summary.freeMatches > 0 ? ` (${selectedPlayer.summary.freeMatches} free)` : ''}</span>
            </div>
          </div>
        </div>

        {/* Payment Summary - desktop: Payment Dashboard style (4 stat cards) */}
        <div className="hidden sm:grid grid-cols-4 gap-3">
          <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <CreditCard className="w-4 h-4" /> Paid (net)
            </div>
            <div className="text-xl sm:text-2xl font-bold text-emerald-400">₹{netPaid.toLocaleString('en-IN')}</div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <Clock className="w-4 h-4" /> Due
            </div>
            <div className="text-xl sm:text-2xl font-bold text-yellow-400">₹{selectedPlayer.summary.totalDue.toLocaleString('en-IN')}</div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <IndianRupee className="w-4 h-4" /> Refunded
            </div>
            <div className="text-xl sm:text-2xl font-bold text-blue-400">₹{(selectedPlayer.summary.totalSettled || 0).toLocaleString('en-IN')}</div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <Calendar className="w-4 h-4" /> Matches
            </div>
            <div className="text-xl sm:text-2xl font-bold text-white">{selectedPlayer.summary.totalMatches}{selectedPlayer.summary.freeMatches > 0 ? ` (${selectedPlayer.summary.freeMatches} free)` : ''}</div>
          </div>
        </div>

        {/* Pending Payments - mobile compact; desktop larger */}
        {selectedPlayer.dueMatches.length > 0 && (
          <div className="rounded-xl border border-amber-500/25 bg-slate-800/50 p-3 sm:p-4 shadow-inner">
            <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-amber-400/90 mb-2.5 sm:mb-3 flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Pending Payments ({selectedPlayer.dueMatches.length})
            </h4>
            <div className="space-y-1.5 sm:space-y-2">
              {selectedPlayer.dueMatches.map((due) => (
                <div key={due.matchId} className="flex items-center justify-between p-2 sm:p-3 bg-slate-800/50 rounded-lg border border-white/5">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-white truncate">vs {due.opponent}</p>
                    <p className="text-[10px] sm:text-xs text-slate-400">{formatDate(due.matchDate)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-bold text-amber-400">₹{due.dueAmount}</span>
                    <button
                      onClick={() => handleSendReminder(due.matchId, due.opponent, due.dueAmount)}
                      disabled={sendingReminder === due.matchId}
                      className="p-1.5 sm:p-2 bg-amber-500/20 rounded-lg text-amber-400 transition-colors"
                      title="Send Reminder"
                    >
                      {sendingReminder === due.matchId ? (
                        <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                      ) : (
                        <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      )}
                    </button>
                    {onNavigateToMatch && (
                      <button
                        onClick={() => onNavigateToMatch(due.matchId)}
                        className="p-1.5 sm:p-2 bg-slate-700/50 rounded-lg text-slate-400 hover:text-white transition-colors"
                        title="View Match"
                      >
                        <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Match History - mobile compact; desktop larger cards */}
        <div className="space-y-3 sm:space-y-4">
          <h4 className="text-xs sm:text-sm font-semibold text-slate-300 uppercase tracking-wider mb-2 sm:mb-3 flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
            Match History
          </h4>
          {selectedPlayer.matchHistory.map((match) => (
            <div key={match.paymentId} className="bg-slate-800/50 border border-white/10 rounded-xl overflow-hidden">
              {/* Match Header - same as Match tab; larger on desktop */}
              <div className="p-3 sm:p-4">
                <div className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 flex-shrink-0" />
                      <span className="font-medium text-white text-sm sm:text-base truncate">vs {match.opponent}</span>
                      {match.isFreePlayer && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-medium bg-emerald-500/20 text-emerald-400">free</span>
                      )}
                      <span className={`px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-medium ${getStatusColor(match.paymentStatus)}`}>
                        {match.paymentStatus}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] sm:text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> {formatDate(match.matchDate)}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> {match.ground}
                      </span>
                    </div>
                  </div>
                  {onNavigateToMatch && (
                    <button
                      onClick={() => onNavigateToMatch(match.matchId)}
                      className="p-1.5 sm:p-2 bg-slate-700/50 rounded-lg text-slate-400 hover:text-white transition-colors flex-shrink-0"
                      title="View Match"
                    >
                      <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                  )}
                </div>
                {/* Summary row - same colour proportion as Match tab; larger on desktop */}
                {!match.isFreePlayer && (
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5 text-[10px] sm:text-xs">
                    <span className="text-emerald-400">₹{(match.settledAmount || 0) > 0 ? match.amountPaid - (match.settledAmount || 0) : match.amountPaid} paid</span>
                    {match.dueAmount > 0 ? (
                      <span className="text-amber-400">₹{match.dueAmount} due</span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                    {(match.settledAmount || 0) > 0 && (
                      <span className="text-blue-400">−₹{match.settledAmount} refunded</span>
                    )}
                    {match.dueAmount === 0 && (match.settledAmount || 0) === 0 && (
                      <span className="text-slate-400">₹{match.effectiveAmount} expected</span>
                    )}
                  </div>
                )}

                {/* Transactions - same panel style as Match tab expanded */}
                {match.transactions.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/10 space-y-1.5">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-2">Transaction History</p>
                    {match.transactions.map((txn, idx) => {
                      const isSettlement = txn.type === 'settlement' || (txn.notes && txn.notes.includes('SETTLEMENT'));
                      const isPayment = txn.type === 'payment' || (txn.isValid && !isSettlement);
                      if (!isPayment && !isSettlement) return null;
                      return (
                      <div key={idx} className={`flex items-center gap-3 py-2 px-3 rounded-lg transition-all ${
                        isSettlement 
                          ? 'bg-cyan-500/10 border border-cyan-500/20 hover:border-cyan-500/40' 
                          : 'bg-emerald-500/10 border border-emerald-500/20 hover:border-emerald-500/40'
                      }`}>
                        {/* Direction indicator - vibrant look */}
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shadow-inner ${
                          isSettlement 
                            ? 'bg-gradient-to-br from-cyan-500/30 to-blue-500/30 text-cyan-300 border border-cyan-400/40' 
                            : 'bg-gradient-to-br from-emerald-500/30 to-green-500/30 text-emerald-300 border border-emerald-400/40'
                        }`}>
                          {isSettlement ? '↩' : '↓'}
                        </div>
                        {/* Transaction details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-semibold ${isSettlement ? 'text-cyan-300' : 'text-emerald-300'}`}>
                              {isSettlement ? 'Refund' : (txn.method || 'payment').replace('_', ' ')}
                            </span>
                            <span className="text-xs text-slate-500">{formatDateTime(txn.date)}</span>
                          </div>
                          {txn.notes && !isSettlement && (
                            <p className="text-xs text-slate-400 truncate mt-0.5">{txn.notes}</p>
                          )}
                        </div>
                        {/* Amount */}
                        <span className={`text-base font-bold tabular-nums ${isSettlement ? 'text-cyan-400' : 'text-emerald-400'}`}>
                          {isSettlement ? '−' : '+'}₹{txn.amount}
                        </span>
                      </div>
                    );
                    })}
                  </div>
                )}

                {/* Free Player Message */}
                {match.isFreePlayer && match.transactions.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-2 mt-2">
                    No payment required for this match
                  </p>
                )}
              </div>
            </div>
          ))}

          {/* Pagination */}
          {selectedPlayer.pagination.total > selectedPlayer.pagination.limit && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => fetchPlayerDetail(selectedPlayer.playerId, currentPage - 1)}
                disabled={currentPage === 1 || loadingDetail}
                className="px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 disabled:opacity-50 rounded-lg text-sm text-white transition-colors"
              >
                Previous
              </button>
              <span className="text-sm text-slate-400">
                Page {currentPage} of {Math.ceil(selectedPlayer.pagination.total / selectedPlayer.pagination.limit)}
              </span>
              <button
                onClick={() => fetchPlayerDetail(selectedPlayer.playerId, currentPage + 1)}
                disabled={!selectedPlayer.pagination.hasMore || loadingDetail}
                className="px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 disabled:opacity-50 rounded-lg text-sm text-white transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render Player List View
  const renderListView = () => (
    <div className="space-y-4 sm:space-y-5">
      {/* Search - larger on desktop */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search players by name..."
          className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 bg-slate-800/50 border border-white/10 rounded-xl text-sm sm:text-base text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {/* Players List */}
      {loadingList ? (
        <div className="flex items-center justify-center py-12 sm:py-16">
          <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-400 animate-spin" />
        </div>
      ) : players.length === 0 ? (
        <div className="text-center py-12 sm:py-16">
          <Users className="w-12 h-12 sm:w-14 sm:h-14 text-slate-500 mx-auto mb-3 opacity-50" />
          <p className="text-slate-400 text-sm sm:text-base">No players with payment history found</p>
        </div>
      ) : (
        <div className="space-y-2 sm:space-y-3">
          {players.map((player) => (
            <div
              key={player.playerId}
              onClick={() => fetchPlayerDetail(player.playerId)}
              className="bg-slate-800/50 border border-white/10 rounded-xl overflow-hidden cursor-pointer active:bg-slate-700/30 transition-all duration-200 hover:border-emerald-500/40 hover:shadow-[0_0_0_1px_rgba(16,185,129,0.15)] hover:bg-slate-800/70"
            >
              {/* Player Header - compact on mobile; larger on desktop */}
              <div className="p-3 sm:p-4">
                <div className="flex items-center gap-2">
                  <div className="text-slate-400 flex-shrink-0">
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 flex-shrink-0" />
                      <span className="font-medium text-white text-sm sm:text-base truncate">
                        {player.playerName}
                      </span>
                      {player.totalDue > 0 && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-medium bg-amber-500/20 text-amber-400">
                          due
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] sm:text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> {player.totalMatches} matches
                      </span>
                      {player.pendingMatches > 0 && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> {player.pendingMatches} pending
                        </span>
                      )}
                      {player.freeMatches > 0 && (
                        <span className="flex items-center gap-1">
                          <Gift className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> {player.freeMatches} free
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {/* Summary row: paid + due grouped; matches on the right */}
                <div className="flex items-center justify-between gap-4 mt-2 pt-2 border-t border-white/5 text-[10px] sm:text-xs">
                  <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                    <span className="text-emerald-400 font-medium tabular-nums">₹{player.totalPaid} paid</span>
                    <span className="text-slate-500/80" aria-hidden>·</span>
                    {player.totalDue > 0 ? (
                      <span className="text-amber-400 font-medium tabular-nums">₹{player.totalDue} due</span>
                    ) : (
                      <span className="text-slate-500">— due</span>
                    )}
                  </div>
                  <span className="text-slate-400 flex-shrink-0 tabular-nums">
                    {player.totalMatches} matches
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-slate-700/30 backdrop-blur-xl border border-slate-600/30 rounded-2xl p-4 sm:p-6 sm:min-w-0">
      {/* Header - larger on desktop */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
          <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
          Player Payment History
        </h2>
        {selectedPlayer && (
          <button
            onClick={() => setSelectedPlayer(null)}
            className="p-1.5 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-4 p-3 bg-rose-500/20 border border-rose-500/30 rounded-lg flex items-center gap-2 text-rose-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-lg flex items-center gap-2 text-emerald-400 text-sm">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          {success}
        </div>
      )}

      {/* Loading Detail */}
      {loadingDetail && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
        </div>
      )}

      {/* Content */}
      {!loadingDetail && (selectedPlayer ? renderDetailView() : renderListView())}
    </div>
  );
};

export default PlayerPaymentHistory;
