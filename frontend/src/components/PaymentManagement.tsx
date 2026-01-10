import React, { useState, useEffect, useCallback } from 'react';
import {
  Wallet,
  Users,
  Send,
  Plus,
  Trash2,
  Check,
  Clock,
  AlertCircle,
  RefreshCw,
  Image,
  X,
  Edit2,
  Save,
  Calendar,
  MapPin,
  IndianRupee,
  UserPlus,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronRight,
  CreditCard,
  TrendingUp,
  Search,
  Eye
} from 'lucide-react';
import {
  getMatches,
  getPaymentByMatch,
  getPayments,
  createPayment,
  updatePayment,
  updatePaymentMember,
  addPaymentMember,
  removePaymentMember,
  loadSquadFromAvailability,
  sendPaymentRequests,
  getPaymentScreenshot
} from '../services/api';

interface PaymentHistoryEntry {
  amount: number;
  paidAt: string;
  paymentMethod: 'cash' | 'upi' | 'card' | 'bank_transfer' | 'other';
  notes: string;
}

interface SquadMember {
  _id: string;
  playerId?: string;
  playerName: string;
  playerPhone: string;
  calculatedAmount: number;
  adjustedAmount: number | null;
  effectiveAmount?: number;
  amountPaid: number;
  dueAmount: number;
  paymentStatus: 'pending' | 'paid' | 'partial' | 'due';
  paymentHistory: PaymentHistoryEntry[];
  dueDate?: string | null;
  messageSentAt: string | null;
  screenshotImage?: boolean;
  screenshotReceivedAt?: string;
  screenshotContentType?: string;
  paidAt: string | null;
  notes: string;
}

interface Payment {
  _id: string;
  matchId: {
    _id: string;
    date: string;
    opponent: string;
    ground: string;
    slot: string;
    matchId: string;
  };
  totalAmount: number;
  squadMembers: SquadMember[];
  status: 'draft' | 'sent' | 'partial' | 'completed';
  totalCollected: number;
  totalPending: number;
  membersCount: number;
  paidCount: number;
  createdAt: string;
  notes: string;
}

interface Match {
  _id: string;
  matchId: string;
  date: string;
  opponent: string;
  ground: string;
  slot: string;
  status: string;
}

interface MatchWithPayment extends Match {
  payment?: Payment | null;
}

const PaymentManagement: React.FC = () => {
  // Dashboard state
  const [matchesWithPayments, setMatchesWithPayments] = useState<MatchWithPayment[]>([]);
  const [allPayments, setAllPayments] = useState<Payment[]>([]);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'partial' | 'completed' | 'no-payment'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selected match detail view
  const [selectedMatchId, setSelectedMatchId] = useState<string>('');
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingSquad, setLoadingSquad] = useState(false);
  const [sendingMessages, setSendingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form states
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [tempSquad, setTempSquad] = useState<Array<{
    playerId?: string;
    playerName: string;
    playerPhone: string;
    adjustedAmount?: number;
  }>>([]);
  
  // Modals
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerPhone, setNewPlayerPhone] = useState('');
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState<number>(0);
  const [viewingScreenshot, setViewingScreenshot] = useState<{memberId: string; playerName: string} | null>(null);
  const [screenshotError, setScreenshotError] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  
  // Payment modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMember, setPaymentMember] = useState<SquadMember | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'card' | 'bank_transfer' | 'other'>('upi');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoadingDashboard(true);
    try {
      const [matchesData, paymentsData] = await Promise.all([
        getMatches(),
        getPayments()
      ]);
      
      const paymentsMap = new Map<string, Payment>();
      (paymentsData.payments || []).forEach((p: Payment) => {
        if (p.matchId?._id) {
          paymentsMap.set(p.matchId._id, p);
        }
      });
      
      const combined: MatchWithPayment[] = matchesData.map((match: Match) => ({
        ...match,
        payment: paymentsMap.get(match._id) || null
      }));
      
      setMatchesWithPayments(combined);
      setAllPayments(paymentsData.payments || []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load payment dashboard');
    } finally {
      setLoadingDashboard(false);
    }
  };

  const fetchPayment = useCallback(async (matchId: string) => {
    if (!matchId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await getPaymentByMatch(matchId);
      if (result.payment) {
        setPayment(result.payment);
        setTotalAmount(result.payment.totalAmount);
      } else {
        setPayment(null);
        setTotalAmount(0);
        setTempSquad([]);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch payment');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedMatchId) {
      fetchPayment(selectedMatchId);
    }
  }, [selectedMatchId, fetchPayment]);

  const handleLoadSquad = async () => {
    if (!selectedMatchId) return;
    setLoadingSquad(true);
    try {
      const result = await loadSquadFromAvailability(selectedMatchId);
      if (result.squad && result.squad.length > 0) {
        setTempSquad(result.squad);
        setSuccess(`Loaded ${result.count} players from availability`);
      } else {
        setError('No confirmed players found for this match');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load squad');
    } finally {
      setLoadingSquad(false);
    }
  };

  const handleCreatePayment = async () => {
    if (!selectedMatchId || !totalAmount || tempSquad.length === 0) {
      setError('Please set amount and add players');
      return;
    }
    setLoading(true);
    try {
      const result = await createPayment({
        matchId: selectedMatchId,
        totalAmount,
        squadMembers: tempSquad
      });
      setPayment(result.payment);
      setTempSquad([]);
      setSuccess('Payment record created successfully');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create payment');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTotalAmount = async () => {
    if (!payment) return;
    setLoading(true);
    try {
      const result = await updatePayment(payment._id, { totalAmount });
      setPayment(result.payment);
      setSuccess('Total amount updated');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update amount');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMemberAmount = async (memberId: string) => {
    if (!payment) return;
    setLoading(true);
    try {
      const result = await updatePaymentMember(payment._id, memberId, { adjustedAmount: editAmount });
      setPayment(result.payment);
      setEditingMember(null);
      setSuccess('Amount adjusted');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update member');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPaymentModal = (member: SquadMember) => {
    setPaymentMember(member);
    // Default to remaining due amount or full amount
    const effectiveAmount = member.adjustedAmount || member.calculatedAmount || 0;
    const amountPaid = member.amountPaid || 0;
    const remaining = effectiveAmount - amountPaid;
    setPaymentAmount(remaining > 0 ? remaining : effectiveAmount);
    setPaymentMethod('upi');
    setPaymentNotes('');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setShowPaymentModal(true);
  };

  const handleRecordPayment = async () => {
    if (!payment || !paymentMember || !paymentAmount || paymentAmount <= 0) return;
    setLoading(true);
    try {
      // Call new add-payment endpoint
      const response = await fetch(`/api/payments/${payment._id}/member/${paymentMember._id}/add-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: paymentAmount,
          paymentMethod,
          notes: paymentNotes,
          paidAt: paymentDate
        })
      });
      
      const result = await response.json();
      if (result.success) {
        setPayment(result.payment);
        setSuccess(`Payment of ₹${paymentAmount} recorded for ${paymentMember.playerName}`);
        setShowPaymentModal(false);
        setPaymentMember(null);
      } else {
        setError(result.error || 'Failed to record payment');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPlayer = async () => {
    if (!newPlayerName || !newPlayerPhone) {
      setError('Name and phone are required');
      return;
    }
    if (payment) {
      setLoading(true);
      try {
        const result = await addPaymentMember(payment._id, {
          playerName: newPlayerName,
          playerPhone: newPlayerPhone
        });
        setPayment(result.payment);
        setShowAddPlayer(false);
        setNewPlayerName('');
        setNewPlayerPhone('');
        setSuccess('Player added');
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to add player');
      } finally {
        setLoading(false);
      }
    } else {
      setTempSquad([...tempSquad, { playerName: newPlayerName, playerPhone: newPlayerPhone }]);
      setShowAddPlayer(false);
      setNewPlayerName('');
      setNewPlayerPhone('');
    }
  };

  const handleRemovePlayer = async (memberId: string) => {
    if (!payment) {
      setTempSquad(tempSquad.filter((_, i) => i.toString() !== memberId));
      return;
    }
    setLoading(true);
    try {
      const result = await removePaymentMember(payment._id, memberId);
      setPayment(result.payment);
      setSuccess('Player removed');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to remove player');
    } finally {
      setLoading(false);
    }
  };

  const handleSendPaymentRequests = async () => {
    if (!payment) return;
    const memberIds = selectedMembers.size > 0 ? Array.from(selectedMembers) : undefined;
    setSendingMessages(true);
    try {
      const result = await sendPaymentRequests(payment._id, memberIds);
      await fetchPayment(selectedMatchId);
      setSelectedMembers(new Set());
      setSuccess(`Sent ${result.data.sent} payment requests`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send requests');
    } finally {
      setSendingMessages(false);
    }
  };

  const toggleMemberSelection = (memberId: string) => {
    const newSelected = new Set(selectedMembers);
    if (newSelected.has(memberId)) {
      newSelected.delete(memberId);
    } else {
      newSelected.add(memberId);
    }
    setSelectedMembers(newSelected);
  };

  const selectAllPending = () => {
    if (!payment) return;
    const pendingIds = payment.squadMembers.filter(m => m.paymentStatus !== 'paid').map(m => m._id);
    setSelectedMembers(new Set(pendingIds));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': case 'completed': return 'text-emerald-400 bg-emerald-500/20';
      case 'pending': case 'draft': case 'sent': return 'text-yellow-400 bg-yellow-500/20';
      case 'partial': return 'text-orange-400 bg-orange-500/20';
      case 'due': return 'text-red-400 bg-red-500/20';
      default: return 'text-slate-400 bg-slate-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': case 'completed': return <CheckCircle2 className="w-4 h-4" />;
      case 'pending': case 'draft': case 'sent': return <Clock className="w-4 h-4" />;
      case 'partial': return <TrendingUp className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  // Filter matches
  const filteredMatches = matchesWithPayments.filter(match => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        match.opponent?.toLowerCase().includes(query) ||
        match.ground?.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }
    if (filterStatus === 'all') return true;
    if (filterStatus === 'no-payment') return !match.payment;
    if (filterStatus === 'pending') return match.payment?.status === 'draft' || match.payment?.status === 'sent';
    if (filterStatus === 'partial') return match.payment?.status === 'partial';
    if (filterStatus === 'completed') return match.payment?.status === 'completed';
    return true;
  });

  // Dashboard stats
  const dashboardStats = {
    totalMatches: matchesWithPayments.length,
    withPayments: matchesWithPayments.filter(m => m.payment).length,
    totalCollected: allPayments.reduce((sum, p) => sum + (p.totalCollected || 0), 0),
    totalPending: allPayments.reduce((sum, p) => sum + (p.totalPending || 0), 0),
    completedPayments: allPayments.filter(p => p.status === 'completed').length
  };

  const selectedMatch = matchesWithPayments.find(m => m._id === selectedMatchId);

  // ==================== DETAIL VIEW ====================
  if (selectedMatchId) {
    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Back button */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => { setSelectedMatchId(''); setPayment(null); fetchDashboardData(); }}
            className="p-2 bg-slate-700/50 hover:bg-slate-700 rounded-xl text-white transition-colors"
          >
            <ChevronRight className="w-5 h-5 rotate-180" />
          </button>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">{selectedMatch?.opponent || 'Match'} Payment</h2>
            <p className="text-xs sm:text-sm text-slate-400">
              {selectedMatch && formatDate(selectedMatch.date)} • {selectedMatch?.ground}
            </p>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl flex items-center gap-2 text-red-400">
            <XCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
            <button onClick={() => setError(null)} className="ml-auto"><X className="w-4 h-4" /></button>
          </div>
        )}
        {success && (
          <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-emerald-400">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{success}</span>
            <button onClick={() => setSuccess(null)} className="ml-auto"><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Loading */}
        {loading && !payment && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
          </div>
        )}

        {/* Setup Payment (no payment exists) */}
        {!payment && !loading && (
          <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <IndianRupee className="w-5 h-5 text-emerald-400" />
              Setup Payment Collection
            </h3>
            <div className="mb-4">
              <label className="block text-sm text-slate-400 mb-2">Total Match Fee</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
                <input
                  type="number"
                  value={totalAmount || ''}
                  onChange={(e) => setTotalAmount(Number(e.target.value))}
                  placeholder="6000"
                  className="w-full pl-8 pr-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
            <button
              onClick={handleLoadSquad}
              disabled={loadingSquad}
              className="w-full sm:w-auto mb-4 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              {loadingSquad ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Load from Availability
            </button>
            {tempSquad.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">Squad ({tempSquad.length} players)</span>
                  <button onClick={() => setShowAddPlayer(true)} className="text-sm text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
                    <UserPlus className="w-4 h-4" /> Add Player
                  </button>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {tempSquad.map((player, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-xl">
                      <div>
                        <div className="text-white font-medium">{player.playerName}</div>
                        <div className="text-xs text-slate-400">{player.playerPhone}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-400 font-medium">
                          ₹{totalAmount && tempSquad.length > 0 ? Math.ceil(totalAmount / tempSquad.length) : 0}
                        </span>
                        <button onClick={() => handleRemovePlayer(index.toString())} className="p-1 text-red-400 hover:bg-red-500/20 rounded">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <button
              onClick={handleCreatePayment}
              disabled={loading || !totalAmount || tempSquad.length === 0}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 text-white font-semibold rounded-xl flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
              Create Payment Record
            </button>
          </div>
        )}

        {/* Payment Details (payment exists) */}
        {payment && (
          <>
            {/* Compact Payment Summary */}
            <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6 space-y-3">
              {/* Header with Status */}
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <IndianRupee className="w-4 h-4 text-emerald-400" />
                  Payment Summary
                </h3>
                <div className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                  {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                </div>
              </div>

              {/* Compact Grid - 2x2 on mobile, 4 columns on desktop */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {/* Total */}
                <div className="p-2.5 bg-slate-700/40 rounded-lg">
                  <div className="text-xs text-slate-400 mb-0.5">Total</div>
                  <div className="text-base font-bold text-white">₹{payment.totalAmount}</div>
                </div>
                {/* Collected */}
                <div className="p-2.5 bg-emerald-500/15 rounded-lg">
                  <div className="text-xs text-emerald-400 mb-0.5">Collected</div>
                  <div className="text-base font-bold text-emerald-400">₹{payment.totalCollected}</div>
                </div>
                {/* Pending */}
                <div className="p-2.5 bg-yellow-500/15 rounded-lg">
                  <div className="text-xs text-yellow-400 mb-0.5">Pending</div>
                  <div className="text-base font-bold text-yellow-400">₹{payment.totalPending}</div>
                </div>
                {/* Paid Count */}
                <div className="p-2.5 bg-slate-700/40 rounded-lg">
                  <div className="text-xs text-slate-400 mb-0.5">Paid / Total</div>
                  <div className="text-base font-bold text-white">{payment.paidCount}/{payment.membersCount}</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="h-1.5 bg-slate-700/60 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                    style={{ width: `${(payment.paidCount / payment.membersCount) * 100}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Collection Progress</span>
                  <span className="text-emerald-400 font-medium">{Math.round((payment.totalCollected / payment.totalAmount) * 100)}%</span>
                </div>
              </div>
              <div className="mt-4 flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
                  <input
                    type="number"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(Number(e.target.value))}
                    className="w-full pl-8 pr-4 py-2 bg-slate-700/50 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <button
                  onClick={handleUpdateTotalAmount}
                  disabled={totalAmount === payment.totalAmount || loading}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl flex items-center gap-2"
                >
                  <Save className="w-4 h-4" /> Update
                </button>
              </div>
            </div>

            {/* Squad Members */}
            <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-400" />
                  Squad Members ({payment.squadMembers.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setShowAddPlayer(true)} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm flex items-center gap-1">
                    <UserPlus className="w-4 h-4" />
                  </button>
                  <button onClick={selectAllPending} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm flex items-center gap-1">
                    <Check className="w-4 h-4" /> Select Pending
                  </button>
                  <button
                    onClick={handleSendPaymentRequests}
                    disabled={sendingMessages}
                    className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 text-white rounded-lg text-sm flex items-center gap-1"
                  >
                    {sendingMessages ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Send {selectedMembers.size > 0 && `(${selectedMembers.size})`}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                {payment.squadMembers.map((member) => {
                  const effectiveAmount = member.adjustedAmount !== null ? member.adjustedAmount : member.calculatedAmount;
                  const isSelected = selectedMembers.has(member._id);
                  return (
                    <div
                      key={member._id}
                      className={`p-3 sm:p-4 rounded-xl border transition-all ${
                        isSelected ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-700/30 border-transparent hover:border-white/10'
                      }`}
                    >
                      <div className="flex items-start sm:items-center gap-3">
                        <button
                          onClick={() => toggleMemberSelection(member._id)}
                          className={`w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center ${
                            isSelected ? 'bg-emerald-500 border-emerald-500' : 'border-white/30 hover:border-white/50'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                            <span className="font-medium text-white truncate">{member.playerName}</span>
                            <span className="text-xs text-slate-400">{member.playerPhone}</span>
                          </div>
                          {member.messageSentAt && (
                            <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                              <MessageSquare className="w-3 h-3" />
                              Sent {new Date(member.messageSentAt).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {editingMember === member._id ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                value={editAmount}
                                onChange={(e) => setEditAmount(Number(e.target.value))}
                                className="w-20 px-2 py-1 bg-slate-600 border border-white/10 rounded text-white text-sm"
                                autoFocus
                              />
                              <button onClick={() => handleUpdateMemberAmount(member._id)} className="p-1 text-emerald-400 hover:bg-emerald-500/20 rounded">
                                <Check className="w-4 h-4" />
                              </button>
                              <button onClick={() => setEditingMember(null)} className="p-1 text-slate-400 hover:bg-slate-500/20 rounded">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => { setEditingMember(member._id); setEditAmount(effectiveAmount); }}
                              className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300"
                            >
                              <span className="font-semibold">₹{effectiveAmount}</span>
                              <Edit2 className="w-3 h-3 opacity-50" />
                            </button>
                          )}
                        </div>
                        <button
                          onClick={() => handleOpenPaymentModal(member)}
                          className={`px-2 py-1 rounded-lg flex items-center gap-1 text-xs font-medium ${getStatusColor(member.paymentStatus)}`}
                        >
                          {getStatusIcon(member.paymentStatus)}
                          <span className="hidden sm:inline capitalize">{member.paymentStatus}</span>
                        </button>
                        {member.screenshotReceivedAt && (
                          <button
                            onClick={() => { setViewingScreenshot({ memberId: member._id, playerName: member.playerName }); setScreenshotError(false); }}
                            className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30"
                          >
                            <Image className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => handleRemovePlayer(member._id)} className="p-1.5 text-red-400 hover:bg-red-500/20 rounded-lg">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* Add Player Modal */}
        {showAddPlayer && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-800 border border-white/10 rounded-2xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-emerald-400" /> Add Player
                </h3>
                <button onClick={() => setShowAddPlayer(false)} className="p-1 text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Player Name</label>
                  <input
                    type="text"
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    placeholder="Enter name"
                    className="w-full px-4 py-2 bg-slate-700/50 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={newPlayerPhone}
                    onChange={(e) => setNewPlayerPhone(e.target.value)}
                    placeholder="9876543210"
                    className="w-full px-4 py-2 bg-slate-700/50 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <button
                  onClick={handleAddPlayer}
                  disabled={!newPlayerName || !newPlayerPhone}
                  className="w-full py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 text-white font-semibold rounded-xl flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Add Player
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Screenshot Viewer */}
        {viewingScreenshot && payment && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-800 border border-white/10 rounded-2xl p-4 w-full max-w-2xl max-h-[90vh] overflow-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Payment Screenshot - {viewingScreenshot.playerName}</h3>
                <button onClick={() => setViewingScreenshot(null)} className="p-1 text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              {screenshotError ? (
                <div className="text-center py-12 text-slate-400">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Failed to load screenshot</p>
                </div>
              ) : (
                <img
                  src={getPaymentScreenshot(payment._id, viewingScreenshot.memberId)}
                  alt="Payment Screenshot"
                  className="w-full rounded-xl"
                  onError={() => setScreenshotError(true)}
                />
              )}
            </div>
          </div>
        )}

        {/* Payment Recording Modal */}
        {showPaymentModal && paymentMember && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-800 border border-white/10 rounded-2xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-400" /> Record Payment
                </h3>
                <button onClick={() => setShowPaymentModal(false)} className="p-1 text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="mb-4 p-3 bg-slate-700/30 rounded-xl">
                <p className="text-sm text-slate-400 mb-1">Player: <span className="text-white font-medium">{paymentMember.playerName}</span></p>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-slate-400">Expected:</span>
                  <span className="text-white font-semibold">₹{paymentMember.adjustedAmount || paymentMember.calculatedAmount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Paid:</span>
                  <span className="text-emerald-400 font-semibold">₹{paymentMember.amountPaid || 0}</span>
                </div>
                <div className="flex justify-between text-sm border-t border-white/10 mt-2 pt-2">
                  <span className="text-slate-400">Remaining:</span>
                  <span className="text-yellow-400 font-semibold">₹{paymentMember.dueAmount || 0}</span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Payment Amount *</label>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                    placeholder="Enter amount"
                    min="0"
                    step="1"
                    className="w-full px-4 py-2.5 bg-slate-700/50 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-2">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full px-4 py-2.5 bg-slate-700/50 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="upi">UPI</option>
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-2">Payment Date</label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-700/50 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Notes (Optional)</label>
                  <textarea
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    placeholder="Add payment notes..."
                    rows={2}
                    className="w-full px-4 py-2.5 bg-slate-700/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRecordPayment}
                    disabled={loading || !paymentAmount || paymentAmount <= 0}
                    className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 text-white font-semibold rounded-xl flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Record Payment
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==================== DASHBOARD VIEW ====================
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1">
          <div className="p-2 sm:p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex-shrink-0">
            <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl font-bold text-white truncate">Payment Dashboard</h2>
            <p className="text-xs text-slate-400 hidden sm:block">Manage match payments at a glance</p>
          </div>
        </div>
        <button
          onClick={fetchDashboardData}
          disabled={loadingDashboard}
          className="p-1.5 bg-slate-700/50 hover:bg-slate-700 rounded-lg text-white transition-colors flex-shrink-0"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loadingDashboard ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl flex items-center gap-2 text-red-400">
          <XCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Stats Cards - Desktop Grid */}
      <div className="hidden sm:grid grid-cols-4 gap-3">
        <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <CreditCard className="w-4 h-4" /> Total Collected
          </div>
          <div className="text-xl sm:text-2xl font-bold text-emerald-400">₹{dashboardStats.totalCollected.toLocaleString()}</div>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <Clock className="w-4 h-4" /> Pending
          </div>
          <div className="text-xl sm:text-2xl font-bold text-yellow-400">₹{dashboardStats.totalPending.toLocaleString()}</div>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <CheckCircle2 className="w-4 h-4" /> Completed
          </div>
          <div className="text-xl sm:text-2xl font-bold text-white">{dashboardStats.completedPayments}</div>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <Calendar className="w-4 h-4" /> With Payments
          </div>
          <div className="text-xl sm:text-2xl font-bold text-white">{dashboardStats.withPayments} / {dashboardStats.totalMatches}</div>
        </div>
      </div>

      {/* Stats Card - Mobile Merged */}
      <div className="sm:hidden bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-xl p-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
              <CreditCard className="w-3 h-3" /> Collected
            </div>
            <div className="text-lg font-bold text-emerald-400">₹{dashboardStats.totalCollected.toLocaleString()}</div>
          </div>
          <div>
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
              <Clock className="w-3 h-3" /> Pending
            </div>
            <div className="text-lg font-bold text-yellow-400">₹{dashboardStats.totalPending.toLocaleString()}</div>
          </div>
          <div>
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
              <CheckCircle2 className="w-3 h-3" /> Completed
            </div>
            <div className="text-lg font-bold text-white">{dashboardStats.completedPayments}</div>
          </div>
          <div>
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
              <Calendar className="w-3 h-3" /> Payments
            </div>
            <div className="text-lg font-bold text-white">{dashboardStats.withPayments}/{dashboardStats.totalMatches}</div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search matches..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[
            { value: 'all', label: 'All' },
            { value: 'no-payment', label: 'No Payment' },
            { value: 'pending', label: 'Pending' },
            { value: 'partial', label: 'Partial' },
            { value: 'completed', label: 'Completed' }
          ].map(option => (
            <button
              key={option.value}
              onClick={() => setFilterStatus(option.value as any)}
              className={`px-3 py-2 rounded-xl text-sm whitespace-nowrap transition-colors ${
                filterStatus === option.value
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loadingDashboard && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
        </div>
      )}

      {/* Match Cards */}
      {!loadingDashboard && (
        <div className="grid gap-3">
          {filteredMatches.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No matches found</p>
            </div>
          ) : (
            filteredMatches.map((match) => {
              const payment = match.payment;
              const progressPercent = payment ? (payment.paidCount / payment.membersCount) * 100 : 0;
              
              return (
                <div
                  key={match._id}
                  onClick={() => setSelectedMatchId(match._id)}
                  className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-xl p-4 cursor-pointer hover:border-emerald-500/30 hover:bg-slate-800/70 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    {/* Match Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-white truncate">{match.opponent || 'TBD'}</span>
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

                    {/* Payment Stats */}
                    {payment && (
                      <div className="hidden sm:flex items-center gap-4 text-sm">
                        <div className="text-right">
                          <div className="text-emerald-400 font-semibold">₹{payment.totalCollected}</div>
                          <div className="text-xs text-slate-400">collected</div>
                        </div>
                        <div className="text-right">
                          <div className="text-yellow-400 font-semibold">₹{payment.totalPending}</div>
                          <div className="text-xs text-slate-400">pending</div>
                        </div>
                        <div className="text-right">
                          <div className="text-white font-semibold">{payment.paidCount}/{payment.membersCount}</div>
                          <div className="text-xs text-slate-400">paid</div>
                        </div>
                      </div>
                    )}

                    {/* Arrow */}
                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-400 transition-colors" />
                  </div>

                  {/* Progress Bar (mobile shows full, desktop shows mini) */}
                  {payment && (
                    <div className="mt-3">
                      <div className="sm:hidden flex items-center justify-between text-xs text-slate-400 mb-1">
                        <span className="text-emerald-400">₹{payment.totalCollected}</span>
                        <span>{payment.paidCount}/{payment.membersCount} paid</span>
                        <span className="text-yellow-400">₹{payment.totalPending}</span>
                      </div>
                      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default PaymentManagement;
