import React, { useState, useEffect, useCallback } from 'react';
import { 
  getPayments, 
  getPaymentByMatch,
  updatePaymentMember,
  addPaymentMember,
  removePaymentMember,
  recordPayment,
  markPaymentUnpaid,
  sendPaymentRequests,
  getPaymentScreenshot,
  getMatches,
  createPayment,
  loadSquadFromAvailability,
  deletePayment
} from '../../services/api';
import { 
  Wallet, ChevronRight, X, Check, Clock, AlertCircle, RefreshCw, User, 
  Plus, Edit2, Trash2, Send, Image, MapPin, Calendar, CreditCard, Loader2, Trophy
} from 'lucide-react';

interface SquadMember {
  _id: string;
  playerId?: string;
  playerName: string;
  playerPhone: string;
  paymentStatus: 'pending' | 'paid' | 'partial' | 'due';
  amountPaid: number;
  dueAmount: number;
  adjustedAmount: number | null;
  calculatedAmount: number;
  messageSentAt?: string | null;
  screenshotReceivedAt?: string;
  screenshotImage?: boolean;
}

interface Match {
  _id: string;
  matchId: string;
  date: string;
  opponent: string;
  ground: string;
  status: string;
}

interface PaymentSummary {
  _id: string;
  totalAmount: number;
  totalCollected: number;
  totalPending: number;
  status: string;
  membersCount: number;
  paidCount: number;
}

interface MatchWithPayment extends Match {
  payment?: PaymentSummary;
}

interface DetailPayment {
  _id: string;
  matchId: string;
  totalAmount: number;
  totalCollected: number;
  totalPending: number;
  status: string;
  membersCount: number;
  paidCount: number;
  squadMembers?: SquadMember[];
}

const MobilePaymentsTab: React.FC = () => {
  const [matches, setMatches] = useState<MatchWithPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<MatchWithPayment | null>(null);
  const [detailPayment, setDetailPayment] = useState<DetailPayment | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  
  // Modals
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showScreenshot, setShowScreenshot] = useState<{memberId: string; name: string} | null>(null);
  const [showCreatePayment, setShowCreatePayment] = useState(false);
  const [editingMember, setEditingMember] = useState<string | null>(null);
  
  // Form states
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerPhone, setNewPlayerPhone] = useState('');
  const [editAmount, setEditAmount] = useState(0);
  const [paymentMember, setPaymentMember] = useState<SquadMember | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [newTotalAmount, setNewTotalAmount] = useState(5000);
  
  // Action states
  const [actionLoading, setActionLoading] = useState(false);
  const [sendingMessages, setSendingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      
      // Fetch both matches and payments
      const [matchesData, paymentsResponse] = await Promise.all([
        getMatches(),
        getPayments()
      ]);
      
      const paymentsList = Array.isArray(paymentsResponse) ? paymentsResponse : (paymentsResponse.payments || []);
      
      // Create a map of matchId -> payment
      const paymentMap = new Map();
      paymentsList.forEach((p: any) => {
        const matchId = typeof p.matchId === 'object' ? p.matchId._id : p.matchId;
        paymentMap.set(matchId, p);
      });
      
      // Merge matches with payment data
      const matchesWithPayments: MatchWithPayment[] = matchesData.map((match: Match) => ({
        ...match,
        payment: paymentMap.get(match._id)
      }));
      
      // Sort: matches with payments first, then by date descending
      matchesWithPayments.sort((a, b) => {
        if (a.payment && !b.payment) return -1;
        if (!a.payment && b.payment) return 1;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
      
      setMatches(matchesWithPayments);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchPaymentDetail = useCallback(async (matchId: string) => {
    setLoadingDetail(true);
    try {
      const result = await getPaymentByMatch(matchId, true);
      if (result.payment) {
        setDetailPayment({ ...result.payment, matchId });
      }
    } catch (err) {
      console.error('Error fetching payment detail:', err);
      setDetailPayment(null);
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedMatch?._id) {
      fetchPaymentDetail(selectedMatch._id);
    }
  }, [selectedMatch, fetchPaymentDetail]);

  const handleRefresh = () => {
    fetchData(true);
    if (selectedMatch?._id) {
      fetchPaymentDetail(selectedMatch._id);
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'No date';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      return date.toLocaleDateString('en-IN', { 
        weekday: 'short', day: 'numeric', month: 'short' 
      });
    } catch {
      return 'Invalid date';
    }
  };

  const formatCurrency = (amount: number | undefined) => {
    return `₹${(amount || 0).toLocaleString()}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': case 'completed': return 'bg-emerald-500/20 text-emerald-400';
      case 'partial': return 'bg-amber-500/20 text-amber-400';
      case 'pending': case 'due': return 'bg-red-500/20 text-red-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  // Action handlers
  const handleAddPlayer = async () => {
    if (!detailPayment || !newPlayerName || !newPlayerPhone) return;
    setActionLoading(true);
    try {
      const result = await addPaymentMember(detailPayment._id, {
        playerName: newPlayerName,
        playerPhone: newPlayerPhone
      });
      if (result.success && result.squadMembers) {
        setDetailPayment(prev => prev ? { ...prev, squadMembers: result.squadMembers } : null);
        setSuccess('Player added');
      }
      setShowAddPlayer(false);
      setNewPlayerName('');
      setNewPlayerPhone('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add player');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemovePlayer = async (memberId: string) => {
    if (!detailPayment || !window.confirm('Remove this player?')) return;
    setActionLoading(true);
    try {
      const result = await removePaymentMember(detailPayment._id, memberId);
      if (result.success && result.squadMembers) {
        setDetailPayment(prev => prev ? { ...prev, squadMembers: result.squadMembers } : null);
        setSuccess('Player removed');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to remove player');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateAmount = async (memberId: string) => {
    if (!detailPayment) return;
    setActionLoading(true);
    try {
      const result = await updatePaymentMember(detailPayment._id, memberId, { adjustedAmount: editAmount });
      if (result.success && result.squadMembers) {
        setDetailPayment(prev => prev ? { ...prev, squadMembers: result.squadMembers } : null);
        setSuccess('Amount updated & rebalanced');
      }
      setEditingMember(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update amount');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecordPayment = async () => {
    if (!detailPayment || !paymentMember || paymentAmount <= 0) return;
    setActionLoading(true);
    try {
      const result = await recordPayment(detailPayment._id, paymentMember._id, {
        amount: paymentAmount,
        paymentMethod: 'upi',
        notes: '',
        paidAt: new Date().toISOString().split('T')[0]
      });
      if (result.success) {
        // Refresh payment detail
        await fetchPaymentDetail(detailPayment.matchId);
        setSuccess(`₹${paymentAmount} recorded for ${paymentMember.playerName}`);
      }
      setShowPaymentModal(false);
      setPaymentMember(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to record payment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkUnpaid = async () => {
    if (!detailPayment || !paymentMember) return;
    setActionLoading(true);
    try {
      const result = await markPaymentUnpaid(detailPayment._id, paymentMember._id);
      if (result.success) {
        await fetchPaymentDetail(detailPayment.matchId);
        setSuccess(`Marked ${paymentMember.playerName} as unpaid`);
      }
      setShowPaymentModal(false);
      setPaymentMember(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to mark unpaid');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendRequests = async () => {
    if (!detailPayment) return;
    setSendingMessages(true);
    try {
      const result = await sendPaymentRequests(detailPayment._id);
      await fetchPaymentDetail(detailPayment.matchId);
      setSuccess(`Sent ${result.data?.sent || 0} payment requests`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send requests');
    } finally {
      setSendingMessages(false);
    }
  };

  const openPaymentModal = (member: SquadMember) => {
    setPaymentMember(member);
    const effective = member.adjustedAmount !== null ? member.adjustedAmount : member.calculatedAmount;
    setPaymentAmount(Math.max(0, effective - member.amountPaid));
    setShowPaymentModal(true);
  };

  const handleCreatePayment = async () => {
    if (!selectedMatch) return;
    setActionLoading(true);
    try {
      // First create the payment
      await createPayment({
        matchId: selectedMatch._id,
        totalAmount: newTotalAmount,
        squadMembers: []
      });
      
      // Then try to load squad from availability
      try {
        await loadSquadFromAvailability(selectedMatch._id);
      } catch (e) {
        // Squad load is optional, continue even if it fails
      }
      
      setSuccess('Payment created');
      setShowCreatePayment(false);
      setSelectedMatch(null);
      fetchData(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create payment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeletePayment = async () => {
    if (!detailPayment || !window.confirm('Delete this payment?')) return;
    setActionLoading(true);
    try {
      await deletePayment(detailPayment._id);
      setSuccess('Payment deleted');
      setSelectedMatch(null);
      setDetailPayment(null);
      fetchData(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete payment');
    } finally {
      setActionLoading(false);
    }
  };

  // Calculate totals from matches with payments
  const totalCollected = matches.reduce((sum: number, m: MatchWithPayment) => sum + (m.payment?.totalCollected || 0), 0);
  const totalPending = matches.reduce((sum: number, m: MatchWithPayment) => sum + (m.payment?.totalPending || 0), 0);
  const matchesWithPayments = matches.filter(m => m.payment);
  const matchesWithoutPayments = matches.filter(m => !m.payment);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="spinner"></div>
      </div>
    );
  }

  // Clear messages after delay
  if (error || success) {
    setTimeout(() => { setError(null); setSuccess(null); }, 3000);
  }

  return (
    <>
      {/* Toast Messages */}
      {(error || success) && (
        <div className={`fixed top-16 left-4 right-4 z-[60] p-3 rounded-xl ${error ? 'bg-red-500/90' : 'bg-emerald-500/90'} text-white text-sm`}>
          {error || success}
        </div>
      )}

      {/* Header with Refresh */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-white">Payment Overview</h2>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-medium disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? '...' : 'Refresh'}
        </button>
      </div>

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

      {/* Matches with Payments */}
      {matchesWithPayments.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-slate-400 mb-2 font-medium">With Payments ({matchesWithPayments.length})</p>
          <div className="space-y-2">
            {matchesWithPayments.map((match) => (
              <div
                key={match._id}
                className="bg-slate-800/50 rounded-xl p-3 border border-white/5 active:bg-slate-800/70"
                onClick={() => setSelectedMatch(match)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-white text-sm">vs {match.opponent || 'TBD'}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] ${getStatusColor(match.payment?.status || 'pending')}`}>
                        {match.payment?.status || 'pending'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(match.date)}
                      </span>
                      <span>{match.payment?.paidCount || 0}/{match.payment?.membersCount || 0} paid</span>
                    </div>
                    <div className="mt-2">
                      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${(match.payment?.totalAmount || 0) > 0 ? ((match.payment?.totalCollected || 0) / (match.payment?.totalAmount || 1)) * 100 : 0}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-1 text-xs">
                        <span className="text-emerald-400">{formatCurrency(match.payment?.totalCollected)}</span>
                        <span className="text-slate-500">{formatCurrency(match.payment?.totalAmount)}</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600 ml-2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Matches without Payments */}
      {matchesWithoutPayments.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-slate-400 mb-2 font-medium">No Payment Yet ({matchesWithoutPayments.length})</p>
          <div className="space-y-2">
            {matchesWithoutPayments.map((match) => (
              <div
                key={match._id}
                className="bg-slate-800/30 rounded-xl p-3 border border-dashed border-white/10 active:bg-slate-800/50"
                onClick={() => { setSelectedMatch(match); setShowCreatePayment(true); }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-white text-sm">vs {match.opponent || 'TBD'}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-600/50 text-slate-400">
                        No Payment
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(match.date)}</span>
                      <MapPin className="w-3 h-3" />
                      <span>{match.ground || 'TBD'}</span>
                    </div>
                  </div>
                  <Plus className="w-4 h-4 text-emerald-400 ml-2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {matches.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No matches found</p>
        </div>
      )}

      {/* Detail Modal */}
      {selectedMatch && selectedMatch.payment && !showCreatePayment && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" onClick={() => { setSelectedMatch(null); setDetailPayment(null); }}>
          <div
            className="absolute bottom-0 left-0 right-0 bg-slate-900 rounded-t-3xl max-h-[90vh] overflow-y-auto animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-slate-900 pt-3 pb-2 px-4 border-b border-white/5 z-10">
              <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mb-3" />
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">vs {selectedMatch.opponent || 'TBD'}</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(selectedMatch.date)}</span>
                    <MapPin className="w-3 h-3 ml-1" />
                    <span>{selectedMatch.ground || 'TBD'}</span>
                  </div>
                </div>
                <button onClick={() => { setSelectedMatch(null); setDetailPayment(null); }} className="p-2 text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {loadingDetail ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
              </div>
            ) : detailPayment && (
              <div className="p-4 space-y-4">
                {/* Payment Summary */}
                <div className="grid grid-cols-4 gap-2">
                  <div className="bg-slate-800/50 rounded-lg p-2 text-center">
                    <p className="text-[10px] text-slate-400">Total</p>
                    <p className="text-sm font-bold text-white">{formatCurrency(detailPayment.totalAmount)}</p>
                  </div>
                  <div className="bg-emerald-500/10 rounded-lg p-2 text-center">
                    <p className="text-[10px] text-emerald-400">Collected</p>
                    <p className="text-sm font-bold text-emerald-400">{formatCurrency(detailPayment.totalCollected)}</p>
                  </div>
                  <div className="bg-amber-500/10 rounded-lg p-2 text-center">
                    <p className="text-[10px] text-amber-400">Pending</p>
                    <p className="text-sm font-bold text-amber-400">{formatCurrency(detailPayment.totalPending)}</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-2 text-center">
                    <p className="text-[10px] text-slate-400">Paid</p>
                    <p className="text-sm font-bold text-white">{detailPayment.paidCount}/{detailPayment.membersCount}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowAddPlayer(true)}
                    className="flex-1 py-2 bg-slate-700 rounded-lg text-white text-xs font-medium flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                  <button
                    onClick={handleSendRequests}
                    disabled={sendingMessages}
                    className="flex-1 py-2 bg-emerald-500/20 rounded-lg text-emerald-400 text-xs font-medium flex items-center justify-center gap-1"
                  >
                    {sendingMessages ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    Send
                  </button>
                  <button
                    onClick={handleDeletePayment}
                    disabled={actionLoading}
                    className="py-2 px-3 bg-red-500/20 rounded-lg text-red-400 text-xs font-medium flex items-center justify-center"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Squad Members */}
                <div className="bg-slate-800/30 rounded-xl p-3">
                  <p className="text-xs text-slate-400 mb-3 font-medium">
                    Squad Members ({detailPayment.squadMembers?.length || 0})
                  </p>
                  <div className="space-y-2">
                    {detailPayment.squadMembers?.map((member) => {
                      const effectiveAmt = member.adjustedAmount !== null ? member.adjustedAmount : member.calculatedAmount;
                      const isFree = member.adjustedAmount === 0;
                      
                      return (
                        <div key={member._id} className="bg-slate-800/50 rounded-lg p-2.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
                                <User className="w-4 h-4 text-slate-400" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm text-white truncate">{member.playerName}</p>
                                <p className="text-[10px] text-slate-500">{member.playerPhone}</p>
                              </div>
                            </div>
                            
                            {/* Amount & Actions */}
                            <div className="flex items-center gap-1.5 ml-2">
                              {editingMember === member._id ? (
                                <div className="flex items-center gap-1">
                                  <input
                                    type="number"
                                    value={editAmount}
                                    onChange={(e) => setEditAmount(Number(e.target.value))}
                                    className="w-16 px-2 py-1 bg-slate-700 rounded text-white text-xs"
                                    autoFocus
                                  />
                                  <button onClick={() => handleUpdateAmount(member._id)} className="p-1 text-emerald-400">
                                    <Check className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => setEditingMember(null)} className="p-1 text-slate-400">
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <button
                                    onClick={() => { setEditingMember(member._id); setEditAmount(effectiveAmt); }}
                                    className="text-xs text-emerald-400 flex items-center gap-0.5"
                                  >
                                    {isFree ? <span className="text-purple-400">FREE</span> : `₹${effectiveAmt}`}
                                    <Edit2 className="w-3 h-3 opacity-50" />
                                  </button>
                                  
                                  <button
                                    onClick={() => openPaymentModal(member)}
                                    className={`px-2 py-1 rounded text-[10px] font-medium ${getStatusColor(member.paymentStatus)}`}
                                  >
                                    {member.paymentStatus}
                                  </button>
                                  
                                  {member.screenshotReceivedAt && (
                                    <button
                                      onClick={() => setShowScreenshot({ memberId: member._id, name: member.playerName })}
                                      className="p-1 bg-blue-500/20 text-blue-400 rounded"
                                    >
                                      <Image className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  
                                  <button
                                    onClick={() => handleRemovePlayer(member._id)}
                                    className="p-1 text-red-400"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                          
                          {/* Payment Info Row */}
                          {member.amountPaid > 0 && (
                            <div className="flex items-center gap-3 mt-1.5 pl-10 text-[10px]">
                              <span className="text-emerald-400">Paid: ₹{member.amountPaid}</span>
                              {member.dueAmount > 0 && <span className="text-amber-400">Due: ₹{member.dueAmount}</span>}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Progress */}
                <div className="bg-slate-800/30 rounded-xl p-3">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-slate-400">Collection Progress</span>
                    <span className="text-emerald-400">
                      {detailPayment.totalAmount > 0 ? Math.round((detailPayment.totalCollected / detailPayment.totalAmount) * 100) : 0}%
                    </span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                      style={{ width: `${detailPayment.totalAmount > 0 ? (detailPayment.totalCollected / detailPayment.totalAmount) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Player Modal */}
      {showAddPlayer && (
        <div className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-4" onClick={() => setShowAddPlayer(false)}>
          <div className="bg-slate-800 rounded-2xl p-4 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-400" /> Add Player
            </h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Player Name"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 rounded-lg text-white text-sm"
              />
              <input
                type="tel"
                placeholder="Phone Number"
                value={newPlayerPhone}
                onChange={(e) => setNewPlayerPhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 rounded-lg text-white text-sm"
              />
              <button
                onClick={handleAddPlayer}
                disabled={actionLoading || !newPlayerName || !newPlayerPhone}
                className="w-full py-2.5 bg-emerald-500 rounded-lg text-white font-medium disabled:opacity-50"
              >
                {actionLoading ? 'Adding...' : 'Add Player'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && paymentMember && (
        <div className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-4" onClick={() => setShowPaymentModal(false)}>
          <div className="bg-slate-800 rounded-2xl p-4 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-400" /> Update Payment
            </h3>
            
            <div className="bg-slate-700/50 rounded-lg p-3 mb-4">
              <p className="text-sm text-white font-medium">{paymentMember.playerName}</p>
              <div className="flex justify-between text-xs mt-2">
                <span className="text-slate-400">Expected:</span>
                <span className="text-white">₹{paymentMember.adjustedAmount !== null ? paymentMember.adjustedAmount : paymentMember.calculatedAmount}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Paid:</span>
                <span className="text-emerald-400">₹{paymentMember.amountPaid}</span>
              </div>
              <div className="flex justify-between text-xs border-t border-white/10 mt-2 pt-2">
                <span className="text-slate-400">Remaining:</span>
                <span className="text-amber-400">₹{paymentMember.dueAmount}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Amount to Record</label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-700 rounded-lg text-white text-sm"
                />
              </div>
              
              <button
                onClick={handleRecordPayment}
                disabled={actionLoading || paymentAmount <= 0}
                className="w-full py-2.5 bg-emerald-500 rounded-lg text-white font-medium disabled:opacity-50"
              >
                {actionLoading ? 'Recording...' : 'Record Payment'}
              </button>
              
              <button
                onClick={handleMarkUnpaid}
                disabled={actionLoading}
                className="w-full py-2.5 bg-red-500/20 rounded-lg text-red-400 font-medium"
              >
                Mark as Unpaid
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Screenshot Modal */}
      {showScreenshot && detailPayment && (
        <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4" onClick={() => setShowScreenshot(null)}>
          <div className="w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-medium">Screenshot - {showScreenshot.name}</h3>
              <button onClick={() => setShowScreenshot(null)} className="text-white"><X className="w-5 h-5" /></button>
            </div>
            <img
              src={getPaymentScreenshot(detailPayment._id, showScreenshot.memberId)}
              alt="Payment Screenshot"
              className="w-full rounded-xl"
              onError={(e) => { (e.target as HTMLImageElement).src = ''; }}
            />
          </div>
        </div>
      )}

      {/* Create Payment Modal */}
      {showCreatePayment && selectedMatch && (
        <div className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-4" onClick={() => { setShowCreatePayment(false); setSelectedMatch(null); }}>
          <div className="bg-slate-800 rounded-2xl p-4 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-400" /> Create Payment
            </h3>
            
            <div className="bg-slate-700/50 rounded-lg p-3 mb-4">
              <p className="text-sm text-white font-medium">vs {selectedMatch.opponent || 'TBD'}</p>
              <p className="text-xs text-slate-400 mt-1">{formatDate(selectedMatch.date)} • {selectedMatch.ground || 'TBD'}</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Total Amount (₹)</label>
                <input
                  type="number"
                  value={newTotalAmount}
                  onChange={(e) => setNewTotalAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-700 rounded-lg text-white text-sm"
                  placeholder="5000"
                />
              </div>
              
              <button
                onClick={handleCreatePayment}
                disabled={actionLoading || newTotalAmount <= 0}
                className="w-full py-2.5 bg-emerald-500 rounded-lg text-white font-medium disabled:opacity-50"
              >
                {actionLoading ? 'Creating...' : 'Create Payment'}
              </button>
              
              <button
                onClick={() => { setShowCreatePayment(false); setSelectedMatch(null); }}
                className="w-full py-2.5 bg-slate-700 rounded-lg text-slate-300 font-medium"
              >
                Cancel
              </button>
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
