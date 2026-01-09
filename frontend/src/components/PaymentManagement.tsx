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
  Loader2
} from 'lucide-react';
import {
  getMatches,
  getPaymentByMatch,
  createPayment,
  updatePayment,
  updatePaymentMember,
  addPaymentMember,
  removePaymentMember,
  loadSquadFromAvailability,
  sendPaymentRequests,
  getPaymentScreenshot
} from '../services/api';

interface SquadMember {
  _id: string;
  playerId?: string;
  playerName: string;
  playerPhone: string;
  calculatedAmount: number;
  adjustedAmount: number | null;
  effectiveAmount?: number;
  paymentStatus: 'pending' | 'paid' | 'due';
  messageSentAt: string | null;
  screenshotImage?: boolean;
  screenshotReceivedAt?: string;
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

const PaymentManagement: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);
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
  
  // Add player modal
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerPhone, setNewPlayerPhone] = useState('');
  
  // Edit amount modal
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState<number>(0);
  
  // Screenshot viewer
  const [viewingScreenshot, setViewingScreenshot] = useState<{memberId: string; playerName: string} | null>(null);
  
  // Selected members for sending
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      const data = await getMatches();
      // Show all matches for payment collection
      setMatches(data);
    } catch (err) {
      console.error('Error fetching matches:', err);
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
      console.error('Error fetching payment:', err);
      setError(err.response?.data?.error || 'Failed to fetch payment');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedMatchId) {
      fetchPayment(selectedMatchId);
    } else {
      setPayment(null);
      setTempSquad([]);
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
      setError('Please select a match, set amount, and add players');
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
      const result = await updatePaymentMember(payment._id, memberId, {
        adjustedAmount: editAmount
      });
      setPayment(result.payment);
      setEditingMember(null);
      setSuccess('Amount adjusted');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update member');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePaidStatus = async (member: SquadMember) => {
    if (!payment) return;

    const newStatus = member.paymentStatus === 'paid' ? 'pending' : 'paid';
    
    setLoading(true);
    try {
      const result = await updatePaymentMember(payment._id, member._id, {
        paymentStatus: newStatus
      });
      setPayment(result.payment);
      setSuccess(`${member.playerName} marked as ${newStatus}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update status');
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
      // Add to existing payment
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
      // Add to temp squad
      setTempSquad([...tempSquad, {
        playerName: newPlayerName,
        playerPhone: newPlayerPhone
      }]);
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

    const memberIds = selectedMembers.size > 0 
      ? Array.from(selectedMembers) 
      : undefined;

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
    const pendingIds = payment.squadMembers
      .filter(m => m.paymentStatus !== 'paid')
      .map(m => m._id);
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
      case 'paid': return 'text-emerald-400 bg-emerald-500/20';
      case 'pending': return 'text-yellow-400 bg-yellow-500/20';
      case 'due': return 'text-red-400 bg-red-500/20';
      default: return 'text-slate-400 bg-slate-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle2 className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'due': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const selectedMatch = matches.find(m => m._id === selectedMatchId);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 sm:p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl">
            <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">Payment Collection</h2>
            <p className="text-xs sm:text-sm text-slate-400">Collect match fees from players</p>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl flex items-center gap-2 text-red-400">
          <XCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-emerald-400">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">{success}</span>
          <button onClick={() => setSuccess(null)} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Match Selection */}
      <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-emerald-400" />
          Select Match
        </h3>
        
        <select
          value={selectedMatchId}
          onChange={(e) => setSelectedMatchId(e.target.value)}
          className="w-full p-3 bg-slate-700/50 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">-- Select a Match --</option>
          {matches.map((match) => (
            <option key={match._id} value={match._id}>
              {formatDate(match.date)} - {match.opponent || 'TBD'} @ {match.ground}
            </option>
          ))}
        </select>

        {selectedMatch && (
          <div className="mt-4 p-3 bg-slate-700/30 rounded-xl flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2 text-slate-300">
              <Calendar className="w-4 h-4 text-emerald-400" />
              {formatDate(selectedMatch.date)}
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <MapPin className="w-4 h-4 text-emerald-400" />
              {selectedMatch.ground}
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Users className="w-4 h-4 text-emerald-400" />
              vs {selectedMatch.opponent || 'TBD'}
            </div>
          </div>
        )}
      </div>

      {/* Payment Setup (when no payment exists) */}
      {selectedMatchId && !payment && !loading && (
        <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <IndianRupee className="w-5 h-5 text-emerald-400" />
            Setup Payment Collection
          </h3>

          {/* Total Amount */}
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

          {/* Load Squad Button */}
          <button
            onClick={handleLoadSquad}
            disabled={loadingSquad}
            className="w-full sm:w-auto mb-4 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            {loadingSquad ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Load from Availability
          </button>

          {/* Temp Squad List */}
          {tempSquad.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">Squad ({tempSquad.length} players)</span>
                <button
                  onClick={() => setShowAddPlayer(true)}
                  className="text-sm text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                >
                  <UserPlus className="w-4 h-4" />
                  Add Player
                </button>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {tempSquad.map((player, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-slate-700/30 rounded-xl"
                  >
                    <div>
                      <div className="text-white font-medium">{player.playerName}</div>
                      <div className="text-xs text-slate-400">{player.playerPhone}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400 font-medium">
                        ₹{totalAmount && tempSquad.length > 0 
                          ? Math.ceil(totalAmount / tempSquad.length) 
                          : 0}
                      </span>
                      <button
                        onClick={() => handleRemovePlayer(index.toString())}
                        className="p-1 text-red-400 hover:bg-red-500/20 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Create Button */}
          <button
            onClick={handleCreatePayment}
            disabled={loading || !totalAmount || tempSquad.length === 0}
            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Check className="w-5 h-5" />
            )}
            Create Payment Record
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && !payment && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
        </div>
      )}

      {/* Payment Details (when payment exists) */}
      {payment && (
        <>
          {/* Summary Card */}
          <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <IndianRupee className="w-5 h-5 text-emerald-400" />
                Payment Summary
              </h3>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                payment.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                payment.status === 'partial' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-slate-500/20 text-slate-400'
              }`}>
                {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4">
              <div className="p-3 bg-slate-700/30 rounded-xl">
                <div className="text-xs text-slate-400 mb-1">Total Amount</div>
                <div className="text-lg sm:text-xl font-bold text-white">₹{payment.totalAmount}</div>
              </div>
              <div className="p-3 bg-emerald-500/10 rounded-xl">
                <div className="text-xs text-emerald-400 mb-1">Collected</div>
                <div className="text-lg sm:text-xl font-bold text-emerald-400">₹{payment.totalCollected}</div>
              </div>
              <div className="p-3 bg-yellow-500/10 rounded-xl">
                <div className="text-xs text-yellow-400 mb-1">Pending</div>
                <div className="text-lg sm:text-xl font-bold text-yellow-400">₹{payment.totalPending}</div>
              </div>
              <div className="p-3 bg-slate-700/30 rounded-xl">
                <div className="text-xs text-slate-400 mb-1">Paid / Total</div>
                <div className="text-lg sm:text-xl font-bold text-white">{payment.paidCount} / {payment.membersCount}</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                style={{ width: `${(payment.paidCount / payment.membersCount) * 100}%` }}
              />
            </div>

            {/* Edit Total Amount */}
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
                <Save className="w-4 h-4" />
                Update Amount
              </button>
            </div>
          </div>

          {/* Squad Members */}
          <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-400" />
                Squad Members
              </h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setShowAddPlayer(true)}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm flex items-center gap-1"
                >
                  <UserPlus className="w-4 h-4" />
                  <span className="hidden sm:inline">Add Player</span>
                </button>
                <button
                  onClick={selectAllPending}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm flex items-center gap-1"
                >
                  <Check className="w-4 h-4" />
                  <span className="hidden sm:inline">Select Pending</span>
                </button>
                <button
                  onClick={handleSendPaymentRequests}
                  disabled={sendingMessages || (selectedMembers.size === 0 && payment.squadMembers.every(m => m.paymentStatus === 'paid'))}
                  className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 text-white rounded-lg text-sm flex items-center gap-1"
                >
                  {sendingMessages ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">Send Requests</span>
                  {selectedMembers.size > 0 && (
                    <span className="bg-white/20 px-1.5 py-0.5 rounded text-xs">
                      {selectedMembers.size}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Members List */}
            <div className="space-y-2">
              {payment.squadMembers.map((member) => {
                const effectiveAmount = member.adjustedAmount !== null 
                  ? member.adjustedAmount 
                  : member.calculatedAmount;
                const isSelected = selectedMembers.has(member._id);

                return (
                  <div
                    key={member._id}
                    className={`p-3 sm:p-4 rounded-xl border transition-all ${
                      isSelected 
                        ? 'bg-emerald-500/10 border-emerald-500/30' 
                        : 'bg-slate-700/30 border-transparent hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-start sm:items-center gap-3">
                      {/* Selection checkbox */}
                      <button
                        onClick={() => toggleMemberSelection(member._id)}
                        className={`w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
                          isSelected 
                            ? 'bg-emerald-500 border-emerald-500' 
                            : 'border-white/30 hover:border-white/50'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </button>

                      {/* Player Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                          <span className="font-medium text-white truncate">{member.playerName}</span>
                          <span className="text-xs text-slate-400">{member.playerPhone}</span>
                        </div>
                        
                        {/* Message sent indicator */}
                        {member.messageSentAt && (
                          <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                            <MessageSquare className="w-3 h-3" />
                            Sent {new Date(member.messageSentAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>

                      {/* Amount */}
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
                            <button
                              onClick={() => handleUpdateMemberAmount(member._id)}
                              className="p-1 text-emerald-400 hover:bg-emerald-500/20 rounded"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingMember(null)}
                              className="p-1 text-slate-400 hover:bg-slate-500/20 rounded"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingMember(member._id);
                              setEditAmount(effectiveAmount);
                            }}
                            className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300"
                          >
                            <span className="font-semibold">₹{effectiveAmount}</span>
                            <Edit2 className="w-3 h-3 opacity-50" />
                          </button>
                        )}
                      </div>

                      {/* Status */}
                      <button
                        onClick={() => handleTogglePaidStatus(member)}
                        className={`px-2 py-1 rounded-lg flex items-center gap-1 text-xs font-medium ${getStatusColor(member.paymentStatus)}`}
                      >
                        {getStatusIcon(member.paymentStatus)}
                        <span className="hidden sm:inline capitalize">{member.paymentStatus}</span>
                      </button>

                      {/* Screenshot indicator */}
                      {member.screenshotReceivedAt && (
                        <button
                          onClick={() => setViewingScreenshot({ memberId: member._id, playerName: member.playerName })}
                          className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30"
                          title="View Screenshot"
                        >
                          <Image className="w-4 h-4" />
                        </button>
                      )}

                      {/* Remove button */}
                      <button
                        onClick={() => handleRemovePlayer(member._id)}
                        className="p-1.5 text-red-400 hover:bg-red-500/20 rounded-lg"
                        title="Remove Player"
                      >
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
                <UserPlus className="w-5 h-5 text-emerald-400" />
                Add Player
              </h3>
              <button
                onClick={() => setShowAddPlayer(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
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
                <Plus className="w-4 h-4" />
                Add Player
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Screenshot Viewer Modal */}
      {viewingScreenshot && payment && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-white/10 rounded-2xl p-4 w-full max-w-2xl max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                Payment Screenshot - {viewingScreenshot.playerName}
              </h3>
              <button
                onClick={() => setViewingScreenshot(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <img
              src={getPaymentScreenshot(payment._id, viewingScreenshot.memberId)}
              alt="Payment Screenshot"
              className="w-full rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentManagement;
