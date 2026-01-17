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
      case 'paid': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'partial': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
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

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
          {/* Actual Contribution (Net) */}
          <div className="p-3 bg-emerald-500/15 rounded-xl">
            <div className="flex items-center gap-2 text-xs text-emerald-400 mb-1">
              <IndianRupee className="w-3 h-3" /> Actual Paid
            </div>
            <div className="text-xl font-bold text-emerald-400">₹{selectedPlayer.summary.netContribution || (selectedPlayer.summary.totalPaid - (selectedPlayer.summary.totalSettled || 0))}</div>
            {(selectedPlayer.summary.totalSettled || 0) > 0 && (
              <div className="text-xs text-slate-400 mt-0.5">
                ₹{selectedPlayer.summary.totalPaid} - ₹{selectedPlayer.summary.totalSettled} settled
              </div>
            )}
          </div>
          {/* Total Due */}
          <div className="p-3 bg-rose-500/15 rounded-xl">
            <div className="flex items-center gap-2 text-xs text-rose-400 mb-1">
              <Clock className="w-3 h-3" /> Total Due
            </div>
            <div className="text-xl font-bold text-rose-400">₹{selectedPlayer.summary.totalDue}</div>
          </div>
          {/* Refunded */}
          {(selectedPlayer.summary.totalSettled || 0) > 0 && (
            <div className="p-3 bg-blue-500/15 rounded-xl">
              <div className="flex items-center gap-2 text-xs text-blue-400 mb-1">
                <CreditCard className="w-3 h-3" /> Refunded
              </div>
              <div className="text-xl font-bold text-blue-400">₹{selectedPlayer.summary.totalSettled}</div>
            </div>
          )}
          {/* Matches */}
          <div className="p-3 bg-slate-700/40 rounded-xl">
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
              <Users className="w-3 h-3" /> Matches
            </div>
            <div className="text-xl font-bold text-white">{selectedPlayer.summary.totalMatches}</div>
          </div>
          {/* Free Matches */}
          <div className="p-3 bg-purple-500/15 rounded-xl">
            <div className="flex items-center gap-2 text-xs text-purple-400 mb-1">
              <Gift className="w-3 h-3" /> Free
            </div>
            <div className="text-xl font-bold text-purple-400">{selectedPlayer.summary.freeMatches}</div>
          </div>
        </div>

        {/* Pending Payments Section */}
        {selectedPlayer.dueMatches.length > 0 && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-rose-400 mb-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> Pending Payments ({selectedPlayer.dueMatches.length})
            </h4>
            <div className="space-y-2">
              {selectedPlayer.dueMatches.map((due) => (
                <div key={due.matchId} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">vs {due.opponent}</p>
                    <p className="text-xs text-slate-400">{formatDate(due.matchDate)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-rose-400">₹{due.dueAmount}</span>
                    <button
                      onClick={() => handleSendReminder(due.matchId, due.opponent, due.dueAmount)}
                      disabled={sendingReminder === due.matchId}
                      className="p-1.5 bg-amber-500/20 hover:bg-amber-500/30 rounded-lg text-amber-400 transition-colors"
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
                        className="p-1.5 bg-slate-700/50 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
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
        )}

        {/* Match History */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-slate-300">Match History</h4>
          {selectedPlayer.matchHistory.map((match) => (
            <div key={match.paymentId} className="bg-slate-800/50 border border-white/10 rounded-xl p-4">
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

              {/* Payment Summary */}
              {!match.isFreePlayer && (
                <div className={`grid ${(match.settledAmount || 0) > 0 ? 'grid-cols-4' : 'grid-cols-3'} gap-2 mb-3`}>
                  <div className="p-2 bg-slate-700/30 rounded-lg text-center">
                    <div className="text-xs text-slate-400">Expected</div>
                    <div className="text-sm font-bold text-white">₹{match.effectiveAmount}</div>
                  </div>
                  <div className="p-2 bg-emerald-500/10 rounded-lg text-center">
                    <div className="text-xs text-emerald-400">Paid</div>
                    <div className="text-sm font-bold text-emerald-400">
                      ₹{(match.settledAmount || 0) > 0 
                        ? match.amountPaid - (match.settledAmount || 0) 
                        : match.amountPaid}
                    </div>
                    {(match.settledAmount || 0) > 0 && (
                      <div className="text-[10px] text-slate-500">₹{match.amountPaid} - ₹{match.settledAmount}</div>
                    )}
                  </div>
                  {(match.settledAmount || 0) > 0 && (
                    <div className="p-2 bg-blue-500/10 rounded-lg text-center">
                      <div className="text-xs text-blue-400">Refunded</div>
                      <div className="text-sm font-bold text-blue-400">₹{match.settledAmount}</div>
                    </div>
                  )}
                  <div className="p-2 bg-rose-500/10 rounded-lg text-center">
                    <div className="text-xs text-rose-400">Due</div>
                    <div className="text-sm font-bold text-rose-400">₹{match.dueAmount}</div>
                  </div>
                </div>
              )}

              {/* Transactions - Payment Timeline */}
              {match.transactions.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs text-slate-400 font-medium">Payment Timeline</p>
                  {match.transactions.map((txn, idx) => {
                    // Determine display based on transaction type and notes
                    const isSettlement = txn.type === 'settlement' || (txn.notes && txn.notes.includes('SETTLEMENT'));
                    const isPayment = txn.type === 'payment' || (txn.isValid && !isSettlement);
                    
                    // Show all valid payments and settlements
                    if (!isPayment && !isSettlement) return null;
                    
                    return (
                      <div key={idx} className={`flex items-center justify-between p-2 rounded-lg ${
                        isSettlement ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-slate-700/20'
                      }`}>
                        <div className="flex items-center gap-2">
                          <span className="text-base">
                            {isSettlement ? '💸' : getPaymentMethodIcon(txn.method || 'other')}
                          </span>
                          <div>
                            <p className={`text-xs font-medium ${isSettlement ? 'text-blue-400' : 'text-white'}`}>
                              {isSettlement ? 'SETTLEMENT (Refund)' : 
                                (txn.method || 'payment').replace('_', ' ').toUpperCase()}
                            </p>
                            <p className="text-xs text-slate-500">{formatDateTime(txn.date)}</p>
                            {txn.notes && !isSettlement && (
                              <p className="text-xs text-slate-400 mt-0.5">{txn.notes}</p>
                            )}
                          </div>
                        </div>
                        <span className={`text-sm font-bold ${isSettlement ? 'text-blue-400' : 'text-emerald-400'}`}>
                          {isSettlement ? '-' : '+'}₹{txn.amount}
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
              className="flex items-center justify-between p-4 bg-slate-800/50 hover:bg-slate-800 border border-white/10 rounded-xl cursor-pointer transition-colors"
            >
              <div className="flex-1 min-w-0">
                <h4 className="text-base font-semibold text-white truncate">{player.playerName}</h4>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-400">
                  <span>{player.totalMatches} matches</span>
                  {player.pendingMatches > 0 && (
                    <span className="px-1.5 py-0.5 bg-rose-500/20 text-rose-400 rounded">
                      {player.pendingMatches} pending
                    </span>
                  )}
                  {player.freeMatches > 0 && (
                    <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-400 rounded">
                      {player.freeMatches} free
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-bold text-emerald-400">₹{player.totalPaid}</p>
                  {player.totalDue > 0 && (
                    <p className="text-xs text-rose-400">Due: ₹{player.totalDue}</p>
                  )}
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6">
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
