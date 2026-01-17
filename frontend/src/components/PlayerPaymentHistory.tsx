import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  Calendar, 
  CreditCard, 
  TrendingUp, 
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
      case 'paid': return 'bg-gradient-to-r from-emerald-500/30 to-green-500/30 text-emerald-300 border-emerald-400/40';
      case 'partial': return 'bg-gradient-to-r from-amber-500/30 to-yellow-500/30 text-amber-300 border-amber-400/40';
      case 'pending': return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
      case 'due': return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      case 'overpaid': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
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

    return (
      <div className="space-y-4">
        {/* Back Button & Player Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSelectedPlayer(null)}
            className="p-2 bg-slate-700/50 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white">{selectedPlayer.playerName}</h3>
            <p className="text-sm text-slate-400">{selectedPlayer.playerPhone}</p>
          </div>
        </div>

        {/* Summary Cards - Vibrant gradient with glow effect */}
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-900/40 via-teal-900/30 to-cyan-900/40 border border-emerald-400/40 rounded-xl p-4 shadow-lg shadow-emerald-500/10">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-cyan-500/5"></div>
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-emerald-500/20 rounded-lg">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-sm font-bold text-emerald-300 uppercase tracking-wider">Payment Summary</span>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {/* Actual Paid */}
              <div className="flex items-baseline gap-2">
                <span className="text-xs text-slate-400">Paid:</span>
                <span className="text-lg font-bold text-emerald-400">₹{selectedPlayer.summary.netContribution || (selectedPlayer.summary.totalPaid - (selectedPlayer.summary.totalSettled || 0))}</span>
                {(selectedPlayer.summary.totalSettled || 0) > 0 && (
                  <span className="text-[10px] text-slate-500">(₹{selectedPlayer.summary.totalPaid}-₹{selectedPlayer.summary.totalSettled})</span>
                )}
              </div>
              {/* Due */}
              <div className="flex items-baseline gap-2">
                <span className="text-xs text-slate-400">Due:</span>
                <span className={`text-lg font-bold ${selectedPlayer.summary.totalDue > 0 ? 'text-red-400' : 'text-slate-500'}`}>₹{selectedPlayer.summary.totalDue}</span>
              </div>
              {/* Refunded */}
              {(selectedPlayer.summary.totalSettled || 0) > 0 && (
                <div className="flex items-baseline gap-2">
                  <span className="text-xs text-slate-400">Refunded:</span>
                  <span className="text-lg font-bold text-cyan-400">₹{selectedPlayer.summary.totalSettled}</span>
                </div>
              )}
              {/* Matches */}
              <div className="flex items-baseline gap-2">
                <span className="text-xs text-slate-400">Matches:</span>
                <span className="text-lg font-bold text-white">{selectedPlayer.summary.totalMatches}</span>
                {selectedPlayer.summary.freeMatches > 0 && (
                  <span className="text-xs text-purple-400">({selectedPlayer.summary.freeMatches} free)</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Pending Payments Section - Vibrant warning style */}
        {selectedPlayer.dueMatches.length > 0 && (
          <div className="relative overflow-hidden bg-gradient-to-br from-rose-900/30 via-red-900/20 to-orange-900/30 border border-rose-500/40 rounded-xl p-4 shadow-lg shadow-rose-500/10">
            <div className="absolute inset-0 bg-gradient-to-r from-rose-500/5 to-orange-500/5"></div>
            <div className="relative">
              <h4 className="text-sm font-bold text-rose-300 mb-3 flex items-center gap-2">
                <div className="p-1 bg-rose-500/20 rounded-lg animate-pulse">
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                </div>
                Pending Payments ({selectedPlayer.dueMatches.length})
              </h4>
              <div className="space-y-2">
                {selectedPlayer.dueMatches.map((due) => (
                  <div key={due.matchId} className="flex items-center justify-between p-3 bg-slate-900/60 rounded-lg border border-white/5 hover:border-rose-500/30 transition-colors">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">vs {due.opponent}</p>
                    <p className="text-xs text-slate-400">{formatDate(due.matchDate)}</p>
                  </div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-rose-400">₹{due.dueAmount}</span>
                      <button
                        onClick={() => handleSendReminder(due.matchId, due.opponent, due.dueAmount)}
                        disabled={sendingReminder === due.matchId}
                        className="p-1.5 bg-amber-500/30 hover:bg-amber-500/40 rounded-lg text-amber-300 transition-colors"
                        title="Send Reminder"
                      >
                        {sendingReminder === due.matchId ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Bell className="w-4 h-4" />
                        )}
                      </button>
                      {onNavigateToMatch && (
                        <button
                          onClick={() => onNavigateToMatch(due.matchId)}
                          className="p-1.5 bg-slate-700/50 hover:bg-slate-600 rounded-lg text-slate-300 hover:text-white transition-colors"
                          title="View Match"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Match History */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-slate-300 flex items-center gap-2">
            <div className="p-1 bg-slate-700/50 rounded">
              <Calendar className="w-4 h-4 text-slate-400" />
            </div>
            Match History
          </h4>
          {selectedPlayer.matchHistory.map((match) => (
            <div key={match.paymentId} className="relative bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-pink-900/40 border border-indigo-500/40 rounded-xl p-4 hover:border-indigo-400 transition-all shadow-lg shadow-indigo-500/10">
              {/* Fancy purple gradient left border with glow and rounded edges */}
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-400 via-indigo-400 to-pink-400 shadow-lg shadow-purple-400/50 rounded-tl-xl rounded-bl-xl"></div>
              <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-r from-indigo-400/30 to-transparent rounded-tl-xl rounded-bl-xl"></div>
              {/* Additional glow effect */}
              <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-purple-500/20 to-transparent blur-sm rounded-tl-xl rounded-bl-xl"></div>
              {/* Match Header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h5 className="text-base font-semibold text-white">vs {match.opponent}</h5>
                    {match.isFreePlayer && (
                      <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded-full">
                        🎁 FREE
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(match.matchDate)}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {match.ground}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(match.paymentStatus)}`}>
                    {match.paymentStatus.charAt(0).toUpperCase() + match.paymentStatus.slice(1)}
                  </span>
                  {onNavigateToMatch && (
                    <button
                      onClick={() => onNavigateToMatch(match.matchId)}
                      className="p-1.5 bg-slate-700/50 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
                      title="View Match"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Payment Summary - Colorful inline stats */}
              {!match.isFreePlayer && (
                <div className="flex flex-wrap items-center gap-4 mb-3 py-2.5 px-4 bg-gradient-to-r from-indigo-800/50 to-purple-800/40 rounded-lg text-sm border border-indigo-600/40 shadow-inner">
                  <div className="flex items-center gap-1.5">
                    <span className="text-indigo-300 text-xs font-medium">Expected</span>
                    <span className="font-bold text-white">₹{match.effectiveAmount}</span>
                  </div>
                  <div className="w-px h-4 bg-indigo-600/40"></div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-indigo-300 text-xs font-medium">Paid</span>
                    <span className="font-bold text-emerald-400">₹{(match.settledAmount || 0) > 0 ? match.amountPaid - (match.settledAmount || 0) : match.amountPaid}</span>
                  </div>
                  {(match.settledAmount || 0) > 0 && (
                    <>
                      <div className="w-px h-4 bg-indigo-600/40"></div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-indigo-300 text-xs font-medium">Refunded</span>
                        <span className="font-bold text-cyan-400">₹{match.settledAmount}</span>
                      </div>
                    </>
                  )}
                  {match.dueAmount > 0 && (
                    <>
                      <div className="w-px h-4 bg-indigo-600/40"></div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-indigo-300 text-xs font-medium">Due</span>
                        <span className="font-bold text-red-400">₹{match.dueAmount}</span>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Transactions - Payment Timeline with vibrant styling */}
              {match.transactions.length > 0 && (
                <div className="space-y-1.5 mt-2">
                  <p className="text-[10px] text-indigo-300 font-semibold uppercase tracking-wider mb-2">Transaction History</p>
                  {match.transactions.map((txn, idx) => {
                    // Determine display based on transaction type and notes
                    const isSettlement = txn.type === 'settlement' || (txn.notes && txn.notes.includes('SETTLEMENT'));
                    const isPayment = txn.type === 'payment' || (txn.isValid && !isSettlement);
                    
                    // Show all valid payments and settlements
                    if (!isPayment && !isSettlement) return null;
                    
                    return (
                      <div key={idx} className={`flex items-center gap-3 py-2 px-3 rounded-lg transition-all ${
                        isSettlement 
                          ? 'bg-purple-500/10 border border-purple-500/20 hover:border-purple-500/40' 
                          : 'bg-indigo-500/10 border border-indigo-500/20 hover:border-indigo-500/40'
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
                <p className="text-xs text-purple-400 text-center py-2">
                  No payment required for this match
                </p>
              )}
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
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search players by name..."
          className="w-full pl-10 pr-4 py-2.5 bg-slate-700/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {/* Players List */}
      {loadingList ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
        </div>
      ) : players.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-slate-500 mx-auto mb-3 opacity-50" />
          <p className="text-slate-400">No players with payment history found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {players.map((player) => (
            <div
              key={player.playerId}
              onClick={() => fetchPlayerDetail(player.playerId)}
              className="relative bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-pink-900/40 border border-indigo-500/40 rounded-xl overflow-hidden hover:border-indigo-400 transition-all shadow-lg shadow-indigo-500/10"
            >
              {/* Fancy purple gradient left border with glow and rounded edges */}
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-400 via-indigo-400 to-pink-400 shadow-lg shadow-purple-400/50 rounded-tl-xl rounded-bl-xl"></div>
              <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-r from-indigo-400/30 to-transparent rounded-tl-xl rounded-bl-xl"></div>
              {/* Additional glow effect */}
              <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-purple-500/20 to-transparent blur-sm rounded-tl-xl rounded-bl-xl"></div>
              
              {/* Player Header - Clickable */}
              <div className="p-4 cursor-pointer hover:bg-slate-700/20 transition-colors">
                <div className="flex items-center gap-3">
                  {/* Expand Icon */}
                  <div className="p-1.5 rounded-lg bg-indigo-800/50 text-indigo-300">
                    <ChevronRight className="w-4 h-4" />
                  </div>

                  {/* Player Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="w-4 h-4 text-purple-400" />
                      <span className="font-bold text-white truncate">{player.playerName}</span>
                      {player.totalDue > 0 && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-gradient-to-r from-rose-500/30 to-red-500/30 text-rose-300 border-rose-500/30">
                          Due
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {player.totalMatches} matches
                      </span>
                      {player.pendingMatches > 0 && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {player.pendingMatches} pending
                        </span>
                      )}
                      {player.freeMatches > 0 && (
                        <span className="flex items-center gap-1">
                          <Gift className="w-3 h-3" /> {player.freeMatches} free
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Payment Summary - Desktop */}
                  <div className="hidden sm:flex items-center gap-5 text-sm">
                    <div className="text-right">
                      <div className="text-lg font-bold text-emerald-400">₹{player.totalPaid}</div>
                      <div className="text-[10px] text-indigo-300 uppercase tracking-wide">paid</div>
                    </div>
                    {player.totalDue > 0 && (
                      <div className="text-right">
                        <div className="text-lg font-bold text-amber-400">₹{player.totalDue}</div>
                        <div className="text-[10px] text-indigo-300 uppercase tracking-wide">due</div>
                      </div>
                    )}
                    <div className="text-right">
                      <div className="text-lg font-bold text-white">{player.totalMatches}</div>
                      <div className="text-[10px] text-indigo-300 uppercase tracking-wide">matches</div>
                    </div>
                  </div>
                </div>

                {/* Mobile Payment Summary */}
                <div className="sm:hidden flex items-center justify-between mt-3 pt-3 border-t border-slate-700/50 text-xs">
                  <span className="font-semibold text-emerald-400">₹{player.totalPaid} paid</span>
                  {player.totalDue > 0 && (
                    <span className="font-semibold text-amber-400">₹{player.totalDue} due</span>
                  )}
                  <span className="text-slate-400">{player.totalMatches} matches</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-slate-700/30 backdrop-blur-xl border border-slate-600/30 rounded-2xl p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-emerald-400" />
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
