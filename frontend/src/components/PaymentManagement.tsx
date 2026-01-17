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
  Eye,
  Filter,
  Share2
} from 'lucide-react';
import ShareLinkModal from './ShareLinkModal';
import { validateIndianPhoneNumber, sanitizeIndianPhoneNumber } from '../utils/phoneValidation';
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
  recordPayment,
  markPaymentUnpaid,
  getPaymentScreenshot,
  deletePayment,
  getPlayers,
  createPlayer,
  settleOverpayment
} from '../services/api';

interface PaymentHistoryEntry {
  amount: number;
  paidAt: string;
  paymentMethod: 'cash' | 'upi' | 'card' | 'bank_transfer' | 'other';
  notes: string;
  isValidPayment?: boolean; // For distinguishing settlements from regular payments
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
  owedAmount?: number; // Amount owed back to player when overpaid
  settledAmount?: number; // Amount that has been settled/refunded to player
  paymentStatus: 'pending' | 'paid' | 'partial' | 'due' | 'overpaid';
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
  totalOwed?: number;
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
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  
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
  const [allPlayers, setAllPlayers] = useState<any[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<any[]>([]);
  const [playerSearchTerm, setPlayerSearchTerm] = useState('');
  const [showCreatePlayerForm, setShowCreatePlayerForm] = useState(false);
  const [isCreatingPlayer, setIsCreatingPlayer] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState<number>(0);
  const [viewingScreenshot, setViewingScreenshot] = useState<{memberId: string; playerName: string} | null>(null);
  const [screenshotError, setScreenshotError] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [showPendingTooltip, setShowPendingTooltip] = useState(false);
  
  // Payment modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMember, setPaymentMember] = useState<SquadMember | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'card' | 'bank_transfer' | 'other'>('upi');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const hasFetchedInitial = React.useRef(false);
  
  // Share Link modal
  const [showShareLinkModal, setShowShareLinkModal] = useState(false);
  
  // Message Preview modal (ISSUE 5 & 6)
  const [showMessagePreview, setShowMessagePreview] = useState(false);
  const [previewMessage, setPreviewMessage] = useState('');
  const [previewMembers, setPreviewMembers] = useState<SquadMember[]>([]);

  useEffect(() => {
    if (hasFetchedInitial.current) return;
    hasFetchedInitial.current = true;
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
        // Handle both cases: matchId as string or as object with _id
        const matchId = typeof p.matchId === 'string' ? p.matchId : p.matchId?._id;
        if (matchId) {
          paymentsMap.set(matchId, p);
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

  // Load all players when Add Player modal opens
  useEffect(() => {
    if (showAddPlayer) {
      setModalError(null);
      setPlayerSearchTerm('');
      fetchPlayers('');
    }
  }, [showAddPlayer]);

  const handleLoadSquad = async () => {
    if (!selectedMatchId) return;
    setLoadingSquad(true);
    try {
      const result = await loadSquadFromAvailability(selectedMatchId);
      if (result.squad && result.squad.length > 0) {
        // Filter out duplicates from loaded squad
        const uniqueSquad = result.squad.filter((newPlayer: any) => {
          const newPhone = sanitizeIndianPhoneNumber(newPlayer.playerPhone);
          return !tempSquad.some(existing => {
            const existingPhone = sanitizeIndianPhoneNumber(existing.playerPhone);
            return existingPhone === newPhone || existingPhone === `91${newPhone}` || `91${existingPhone}` === newPhone;
          });
        });
        
        if (uniqueSquad.length > 0) {
          setTempSquad([...tempSquad, ...uniqueSquad]);
          setSuccess(`Loaded ${uniqueSquad.length} players from availability${uniqueSquad.length < result.squad.length ? ` (${result.squad.length - uniqueSquad.length} duplicates skipped)` : ''}`);
        } else {
          setSuccess('All players from availability are already in the squad');
        }
      } else {
        // Don't show error - just inform user they can add players manually
        setSuccess('No confirmed players yet. You can add players manually below.');
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
      
      // Update all squad members (rebalancing affects all non-adjusted members)
      if (result.success && result.squadMembers) {
        const updatedPayment = { ...payment };
        
        // Replace all squad members with the rebalanced data
        updatedPayment.squadMembers = result.squadMembers.map((newMember: any) => {
          const existingMember = updatedPayment.squadMembers.find(m => m._id === newMember._id);
          return {
            ...existingMember,
            ...newMember
          };
        });
        
        // Update payment summary if provided
        if (result.paymentSummary) {
          updatedPayment.totalCollected = result.paymentSummary.totalCollected;
          updatedPayment.totalPending = result.paymentSummary.totalPending;
          updatedPayment.totalOwed = result.paymentSummary.totalOwed;
          updatedPayment.paidCount = result.paymentSummary.paidCount;
          updatedPayment.status = result.paymentSummary.status;
        }
        
        setPayment(updatedPayment);
      }
      
      setEditingMember(null);
      setSuccess('Amount adjusted and rebalanced');
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
      const result = await recordPayment(payment._id, paymentMember._id, {
        amount: paymentAmount,
        paymentMethod,
        notes: paymentNotes,
        paidAt: paymentDate
      });
      
      if (result.success) {
        // Update the specific member in the payment state
        if (result.member) {
          const updatedPayment = { ...payment };
          const memberIndex = updatedPayment.squadMembers.findIndex(m => m._id === paymentMember._id);
          if (memberIndex >= 0) {
            updatedPayment.squadMembers[memberIndex] = {
              ...updatedPayment.squadMembers[memberIndex],
              ...result.member
            };
          }
          
          // Update payment summary if provided
          if (result.paymentSummary) {
            updatedPayment.totalCollected = result.paymentSummary.totalCollected;
            updatedPayment.totalPending = result.paymentSummary.totalPending;
            updatedPayment.totalOwed = result.paymentSummary.totalOwed;
            updatedPayment.paidCount = result.paymentSummary.paidCount;
            updatedPayment.status = result.paymentSummary.status;
          }
          
          setPayment(updatedPayment);
        }
        
        setSuccess(`Payment of ₹${paymentAmount} recorded for ${paymentMember.playerName}`);
        setShowPaymentModal(false);
        setPaymentMember(null);
        setPaymentAmount(0);
        setPaymentNotes('');
      } else {
        setError(result.error || 'Failed to record payment');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  // Fetch all players for the selection list
  const fetchPlayers = async (search?: string) => {
    try {
      const players = await getPlayers(search);
      
      // Filter out players already in the squad
      const existingPhones = new Set(
        (payment?.squadMembers || tempSquad).map(m => {
          const phone = sanitizeIndianPhoneNumber(m.playerPhone);
          return [phone, `91${phone}`];
        }).flat()
      );
      
      const availablePlayers = players.filter(player => {
        const playerPhone = sanitizeIndianPhoneNumber(player.phone);
        return !existingPhones.has(playerPhone) && !existingPhones.has(`91${playerPhone}`);
      });
      
      if (search) {
        setFilteredPlayers(availablePlayers);
      } else {
        setAllPlayers(availablePlayers);
        setFilteredPlayers(availablePlayers);
      }
      return availablePlayers;
    } catch (err) {
      console.error('Failed to fetch players:', err);
      return [];
    }
  };

  // Handle player search with backend API
  const handlePlayerSearch = async (searchTerm: string) => {
    setPlayerSearchTerm(searchTerm);
    await fetchPlayers(searchTerm);
  };
  
  // Create a new player directly in database
  const handleCreatePlayer = async () => {
    if (!newPlayerName) {
      return;
    }
    
    if (!newPlayerPhone) {
      return;
    }
    
    if (!validateIndianPhoneNumber(newPlayerPhone)) {
      return;
    }
    
    const sanitizedPhone = sanitizeIndianPhoneNumber(newPlayerPhone);
    
    setIsCreatingPlayer(true);
    try {
      const player = await createPlayer({
        name: newPlayerName,
        phone: sanitizedPhone
      });
      
      setAllPlayers([...allPlayers, player]);
      setFilteredPlayers([...allPlayers, player]);
      setNewPlayerName('');
      setNewPlayerPhone('');
      setShowCreatePlayerForm(false);
      setSuccess('Player created successfully');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create player');
    } finally {
      setIsCreatingPlayer(false);
    }
  };

  // Add player to payment or temp squad
  const handleAddPlayer = async (playerName?: string, playerPhone?: string) => {
    // Use passed params or fall back to state
    const name = playerName || newPlayerName;
    const phone = playerPhone || newPlayerPhone;
    
    if (!name) {
      return;
    }
    
    if (!phone) {
      return;
    }
    
    if (!validateIndianPhoneNumber(phone)) {
      return;
    }
    
    const sanitizedPhone = sanitizeIndianPhoneNumber(phone);
    
    // Check for duplicates in existing squad
    if (payment) {
      const isDuplicate = payment.squadMembers.some(
        member => member.playerPhone === sanitizedPhone || member.playerPhone === `91${sanitizedPhone}`
      );
      if (isDuplicate) {
        setModalError(`${name} is already in the squad`);
        return;
      }
    } else {
      const isDuplicate = tempSquad.some(
        member => member.playerPhone === sanitizedPhone || member.playerPhone === `91${sanitizedPhone}`
      );
      if (isDuplicate) {
        setModalError(`${name} is already in the squad`);
        return;
      }
    }
    
    if (payment) {
      setLoading(true);
      try {
        const result = await addPaymentMember(payment._id, {
          playerName: name,
          playerPhone: sanitizedPhone
        });
        
        // Update all squad members (rebalancing affects all non-adjusted members)
        if (result.success && result.squadMembers) {
          const updatedPayment = { ...payment };
          updatedPayment.squadMembers = result.squadMembers;
          
          // Update payment summary if provided
          if (result.paymentSummary) {
            updatedPayment.totalCollected = result.paymentSummary.totalCollected;
            updatedPayment.totalPending = result.paymentSummary.totalPending;
            updatedPayment.totalOwed = result.paymentSummary.totalOwed;
            updatedPayment.paidCount = result.paymentSummary.paidCount;
            updatedPayment.membersCount = result.paymentSummary.membersCount;
            updatedPayment.status = result.paymentSummary.status;
          }
          
          setPayment(updatedPayment);
        }
        
        setShowAddPlayer(false);
        setNewPlayerName('');
        setNewPlayerPhone('');
        setSuccess('Player added and amounts rebalanced');
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to add player');
      } finally {
        setLoading(false);
      }
    } else {
      setTempSquad([...tempSquad, { playerName: name, playerPhone: phone }]);
      setShowAddPlayer(false);
      setNewPlayerName('');
      setNewPlayerPhone('');
      setShowCreatePlayerForm(false);
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
      
      // Update all squad members (rebalancing affects all non-adjusted members)
      if (result.success && result.squadMembers) {
        const updatedPayment = { ...payment };
        updatedPayment.squadMembers = result.squadMembers;
        
        // Update payment summary if provided
        if (result.paymentSummary) {
          updatedPayment.totalCollected = result.paymentSummary.totalCollected;
          updatedPayment.totalPending = result.paymentSummary.totalPending;
          updatedPayment.totalOwed = result.paymentSummary.totalOwed;
          updatedPayment.paidCount = result.paymentSummary.paidCount;
          updatedPayment.membersCount = result.paymentSummary.membersCount;
          updatedPayment.status = result.paymentSummary.status;
        }
        
        setPayment(updatedPayment);
      }
      
      setSuccess('Player removed and amounts rebalanced');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to remove player');
    } finally {
      setLoading(false);
    }
  };

  // Open message preview modal (ISSUE 5 & 6)
  const handleOpenMessagePreview = () => {
    if (!payment) return;
    
    // ISSUE 5: Validate that players are selected
    if (selectedMembers.size === 0) {
      setError('Please select at least one player to send payment reminder.');
      return;
    }
    
    // Get selected members with pending amounts
    const membersToNotify = payment.squadMembers.filter(m => 
      selectedMembers.has(m._id) && m.dueAmount > 0
    );
    
    if (membersToNotify.length === 0) {
      setError('No selected players have pending amounts to notify.');
      return;
    }
    
    // Generate default message template
    const matchInfo = selectedMatch;
    const defaultMessage = `🏏 *Mavericks XI - Payment Reminder*\n\n` +
      `Hi {playerName},\n\n` +
      `This is a friendly reminder for your pending payment of *₹{dueAmount}* for the match against *${matchInfo?.opponent || 'TBD'}* on ${matchInfo ? new Date(matchInfo.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) : ''}.\n\n` +
      `Please complete the payment at your earliest convenience.\n\n` +
      `Thank you! 🙏`;
    
    setPreviewMessage(defaultMessage);
    setPreviewMembers(membersToNotify);
    setShowMessagePreview(true);
  };

  // Actual send function after preview
  const handleSendPaymentRequests = async () => {
    if (!payment) return;
    const memberIds = selectedMembers.size > 0 ? Array.from(selectedMembers) : undefined;
    setSendingMessages(true);
    setShowMessagePreview(false);
    try {
      const result = await sendPaymentRequests(payment._id, memberIds, previewMessage);
      await fetchPayment(selectedMatchId);
      setSelectedMembers(new Set());
      setSuccess(`Sent ${result.data.sent} payment requests`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send requests');
    } finally {
      setSendingMessages(false);
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!window.confirm('Delete this payment record? This action cannot be undone.')) return;
    setLoading(true);
    try {
      await deletePayment(paymentId);
      setSuccess('Payment deleted');
      setPayment(null);
      setSelectedMatchId('');
      fetchDashboardData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete payment');
    } finally {
      setLoading(false);
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
    // Only select players who have amount due (exclude 'paid' and 'overpaid')
    const pendingIds = payment.squadMembers
      .filter(m => m.paymentStatus !== 'paid' && m.paymentStatus !== 'overpaid' && m.dueAmount > 0)
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
      case 'paid': case 'completed': return 'text-emerald-400 bg-emerald-500/20';
      case 'pending': case 'draft': case 'sent': return 'text-yellow-400 bg-yellow-500/20';
      case 'partial': return 'text-orange-400 bg-orange-500/20';
      case 'due': return 'text-red-400 bg-red-500/20';
      case 'overpaid': return 'text-blue-400 bg-blue-500/20';
      default: return 'text-slate-400 bg-slate-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': case 'completed': return <CheckCircle2 className="w-4 h-4" />;
      case 'pending': case 'draft': case 'sent': return <Clock className="w-4 h-4" />;
      case 'partial': return <TrendingUp className="w-4 h-4" />;
      case 'overpaid': return <IndianRupee className="w-4 h-4" />;
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
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={handleLoadSquad}
                disabled={loadingSquad}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                {loadingSquad ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Load from Availability
              </button>
              <button
                onClick={async () => {
                  await fetchPlayers();
                  setShowAddPlayer(true);
                }}
                className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                <UserPlus className="w-4 h-4" /> Add Player Manually
              </button>
            </div>
            
            {/* Squad List */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">Squad ({tempSquad.length} players)</span>
              </div>
              {tempSquad.length === 0 ? (
                <div className="p-4 bg-slate-700/20 border border-dashed border-white/10 rounded-xl text-center">
                  <Users className="w-8 h-8 mx-auto mb-2 text-slate-500" />
                  <p className="text-sm text-slate-400">No players added yet</p>
                  <p className="text-xs text-slate-500 mt-1">Load from availability or add players manually</p>
                </div>
              ) : (
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
              )}
            </div>
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
                <div className="flex items-center gap-2">
                  <div className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                    {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                  </div>
                  <button
                    onClick={() => fetchPayment(selectedMatchId!)}
                    disabled={loading}
                    className="p-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg transition-colors disabled:opacity-50"
                    title="Refresh"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setShowShareLinkModal(true);
                    }}
                    className="p-1.5 bg-pink-500/20 hover:bg-pink-500/30 text-pink-400 rounded-lg transition-colors"
                    title="Share Payment Link"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeletePayment(payment._id)}
                    className="p-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                    title="Delete Payment"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Compact Grid - 2x2 on mobile, 5 columns on desktop */}
              {(() => {
                const totalSettled = payment.squadMembers.reduce((sum, m) => sum + (m.settledAmount || 0), 0);
                const actualCollected = payment.totalCollected - totalSettled;
                return (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {/* Total */}
                    <div className="p-2.5 bg-slate-700/40 rounded-lg">
                      <div className="text-xs text-slate-400 mb-0.5">Total</div>
                      <div className="text-base font-bold text-white">₹{payment.totalAmount}</div>
                    </div>
                    {/* Collected (Actual = Total Paid - Settled) */}
                    <div className="p-2.5 bg-emerald-500/15 rounded-lg">
                      <div className="text-xs text-emerald-400 mb-0.5">Collected</div>
                      <div className="text-base font-bold text-emerald-400">₹{actualCollected}</div>
                      {totalSettled > 0 && (
                        <div className="text-xs text-slate-400 mt-0.5">(-₹{totalSettled} settled)</div>
                      )}
                    </div>
                    {/* Pending */}
                    <div className="p-2.5 bg-yellow-500/15 rounded-lg">
                      <div className="text-xs text-yellow-400 mb-0.5">Pending</div>
                      <div className="text-base font-bold text-yellow-400">₹{payment.totalPending}</div>
                    </div>
                    {/* Refunds Due - only show if > 0 */}
                    {(payment.totalOwed || 0) > 0 && (
                      <div className="p-2.5 bg-red-500/15 rounded-lg">
                        <div className="text-xs text-red-400 mb-0.5">Refunds Due</div>
                        <div className="text-base font-bold text-red-400">₹{payment.totalOwed}</div>
                      </div>
                    )}
                    {/* Paid Count */}
                    <div className="p-2.5 bg-slate-700/40 rounded-lg">
                      <div className="text-xs text-slate-400 mb-0.5">Paid / Total</div>
                      <div className="text-base font-bold text-white">{payment.paidCount}/{payment.membersCount}</div>
                    </div>
                  </div>
                );
              })()}

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
                    onClick={handleOpenMessagePreview}
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
                      className={`p-3 sm:p-4 rounded-xl border transition-all cursor-pointer ${
                        isSelected ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-700/30 border-transparent hover:border-white/10 hover:bg-slate-700/50'
                      }`}
                      onClick={() => handleOpenPaymentModal(member)}
                    >
                      <div className="flex items-start sm:items-center gap-3">
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleMemberSelection(member._id); }}
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
                          <div className="flex items-center gap-2 mt-1 text-xs flex-wrap">
                            {member.amountPaid > 0 && (
                              <span className="text-emerald-400">
                                Paid: ₹{(member.settledAmount || 0) > 0 
                                  ? `${member.amountPaid - (member.settledAmount || 0)} (₹${member.amountPaid} - ₹${member.settledAmount} settled)` 
                                  : member.amountPaid}
                              </span>
                            )}
                            {member.dueAmount > 0 && (
                              <span className="text-yellow-400">Due: ₹{member.dueAmount}</span>
                            )}
                            {(member.owedAmount && member.owedAmount > 0) && (
                              <span className="text-blue-400">Owed: ₹{member.owedAmount}</span>
                            )}
                          </div>
                          {member.messageSentAt && (
                            <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                              <MessageSquare className="w-3 h-3" />
                              Sent {new Date(member.messageSentAt).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          {editingMember === member._id ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                value={editAmount || ''}
                                onChange={(e) => {
                                  const inputVal = e.target.value;
                                  if (inputVal === '') {
                                    setEditAmount(0);
                                  } else {
                                    const val = Number(inputVal);
                                    if (!isNaN(val) && val >= 0) {
                                      setEditAmount(val);
                                    }
                                  }
                                }}
                                className="w-20 px-2 py-1 bg-slate-600 border border-white/10 rounded text-white text-sm"
                                autoFocus
                                placeholder="0"
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
                              {member.adjustedAmount === 0 ? (
                                <span className="font-semibold text-purple-400">FREE PLAYER</span>
                              ) : (
                                <span className="font-semibold">₹{effectiveAmount}</span>
                              )}
                              <Edit2 className="w-3 h-3 opacity-50" />
                            </button>
                          )}
                        </div>
                        <div
                          className={`px-2 py-1 rounded-lg flex items-center gap-1 text-xs font-medium ${getStatusColor(member.paymentStatus)}`}
                        >
                          {getStatusIcon(member.paymentStatus)}
                          <span className="hidden sm:inline capitalize">{member.paymentStatus}</span>
                        </div>
                        {member.screenshotReceivedAt && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setViewingScreenshot({ memberId: member._id, playerName: member.playerName }); setScreenshotError(false); }}
                            className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30"
                          >
                            <Image className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); handleRemovePlayer(member._id); }} className="p-1.5 text-red-400 hover:bg-red-500/20 rounded-lg">
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
            <div className="bg-slate-800 border border-white/10 rounded-2xl p-6 w-full max-w-md max-h-[85vh] overflow-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-emerald-400" /> Add Player
                </h3>
                <button onClick={() => setShowAddPlayer(false)} className="p-1 text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Modal Error Message */}
              {modalError && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-400">{modalError}</p>
                </div>
              )}
              
              {showCreatePlayerForm ? (
                // Create New Player Form
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
                      onChange={(e) => {
                        // Only allow digits and limit to 10 characters
                        const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setNewPlayerPhone(digitsOnly);
                      }}
                      placeholder="9876543210"
                      maxLength={10}
                      className="w-full px-4 py-2 bg-slate-700/50 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowCreatePlayerForm(false)}
                      className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleCreatePlayer}
                      disabled={!newPlayerName || !newPlayerPhone || !validateIndianPhoneNumber(newPlayerPhone) || isCreatingPlayer}
                      className="flex-1 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 text-white font-semibold rounded-xl flex items-center justify-center gap-2"
                    >
                      {isCreatingPlayer ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} 
                      Create Player
                    </button>
                  </div>
                </div>
              ) : (
                // Select Existing Player or Create New
                <div className="space-y-4">
                  {/* Search input */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={playerSearchTerm}
                      placeholder="Search player by name..."
                      className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-white/10 rounded-xl text-white"
                      onChange={(e) => handlePlayerSearch(e.target.value)}
                    />
                  </div>
                  
                  {/* Players list */}
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {filteredPlayers.map((player) => (
                      <div
                        key={player._id}
                        className="flex items-center justify-between p-3 bg-slate-700/30 hover:bg-slate-700/50 rounded-xl cursor-pointer transition-colors"
                        onClick={() => {
                          // Add player directly with their info
                          handleAddPlayer(player.name, player.phone.replace(/^\+/, ''));
                        }}
                      >
                        <div>
                          <div className="text-white font-medium">{player.name}</div>
                          <div className="text-xs text-slate-400">{player.phone}</div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                    ))}
                  </div>
                  
                  {/* Create new player option */}
                  <div className="border-t border-white/10 pt-4">
                    <button
                      onClick={() => setShowCreatePlayerForm(true)}
                      className="w-full py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 rounded-xl flex items-center justify-center gap-2"
                    >
                      <UserPlus className="w-4 h-4" /> Create New Player
                    </button>
                  </div>
                </div>
              )}
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
                  <CreditCard className="w-5 h-5 text-emerald-400" /> Payment Status
                </h3>
                <button onClick={() => setShowPaymentModal(false)} className="p-1 text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="mb-6 p-3 bg-slate-700/30 rounded-xl">
                <p className="text-sm text-slate-400 mb-1">Player: <span className="text-white font-medium">{paymentMember.playerName}</span></p>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-slate-400">Expected:</span>
                  {paymentMember.adjustedAmount === 0 ? (
                    <span className="text-purple-400 font-semibold">FREE PLAYER</span>
                  ) : (
                    <span className="text-white font-semibold">₹{paymentMember.adjustedAmount !== null ? paymentMember.adjustedAmount : paymentMember.calculatedAmount}</span>
                  )}
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Total Paid:</span>
                  <span className="text-emerald-400 font-semibold">₹{paymentMember.amountPaid || 0}</span>
                </div>
                {/* Show settled amount if any */}
                {(paymentMember.settledAmount || 0) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Settled (Refunded):</span>
                    <span className="text-blue-400 font-semibold">-₹{paymentMember.settledAmount}</span>
                  </div>
                )}
                {/* Show actual paid = total paid - settled */}
                {(paymentMember.settledAmount || 0) > 0 && (
                  <div className="flex justify-between text-sm border-t border-white/10 mt-1 pt-1">
                    <span className="text-slate-400">Actual Contribution:</span>
                    <span className="text-emerald-400 font-semibold">₹{(paymentMember.amountPaid || 0) - (paymentMember.settledAmount || 0)}</span>
                  </div>
                )}
                {/* Show remaining due only if > 0 */}
                {(paymentMember.dueAmount || 0) > 0 && (
                  <div className="flex justify-between text-sm border-t border-white/10 mt-2 pt-2">
                    <span className="text-slate-400">Remaining:</span>
                    <span className="text-yellow-400 font-semibold">₹{paymentMember.dueAmount}</span>
                  </div>
                )}
                {/* Show owed amount for overpaid players only if > 0 */}
                {(paymentMember.owedAmount || 0) > 0 && (
                  <div className="flex justify-between text-sm border-t border-white/10 mt-2 pt-2">
                    <span className="text-slate-400">Owed to Player:</span>
                    <span className="text-blue-400 font-semibold">₹{paymentMember.owedAmount}</span>
                  </div>
                )}
                {/* Show fully paid message when no due and no owed */}
                {(paymentMember.dueAmount || 0) === 0 && (paymentMember.owedAmount || 0) === 0 && (paymentMember.amountPaid || 0) > 0 && (
                  <div className="flex justify-between text-sm border-t border-white/10 mt-2 pt-2">
                    <span className="text-slate-400">Status:</span>
                    <span className="text-emerald-400 font-semibold">✓ Fully Paid</span>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Add Payment Amount</label>
                  <input
                    type="number"
                    value={paymentAmount || ''}
                    onChange={(e) => {
                      const inputVal = e.target.value;
                      if (inputVal === '') {
                        setPaymentAmount(0);
                      } else {
                        const val = parseFloat(inputVal);
                        if (!isNaN(val) && val >= 0) {
                          setPaymentAmount(val);
                        }
                      }
                    }}
                    placeholder="Enter payment amount"
                    min="0"
                    step="1"
                    className="w-full px-4 py-2.5 bg-slate-700/50 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  {paymentAmount > 0 && (
                    <p className="text-xs text-slate-400 mt-2">
                      {(() => {
                        const effectiveAmount = paymentMember.adjustedAmount !== null ? paymentMember.adjustedAmount : paymentMember.calculatedAmount;
                        const settledAmount = paymentMember.settledAmount || 0;
                        const currentActualPaid = (paymentMember.amountPaid || 0) - settledAmount;
                        const newTotalPaid = (paymentMember.amountPaid || 0) + paymentAmount;
                        const newActualPaid = newTotalPaid - settledAmount;
                        const diff = effectiveAmount - newActualPaid;
                        return (
                          <>
                            New total paid: <span className="text-emerald-400 font-medium">₹{newTotalPaid}</span>
                            {settledAmount > 0 && <span className="text-blue-400"> (Actual: ₹{newActualPaid})</span>}
                            {diff > 0 && <span className="text-yellow-400"> → Due: ₹{diff}</span>}
                            {diff < 0 && <span className="text-blue-400"> → Overpaid: ₹{Math.abs(diff)}</span>}
                            {diff === 0 && <span className="text-emerald-400"> → Fully Paid</span>}
                          </>
                        );
                      })()}
                    </p>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={handleRecordPayment}
                    disabled={loading || !paymentAmount || paymentAmount <= 0}
                    className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Add Payment
                  </button>
                </div>

                <button
                  onClick={async () => {
                    if (!payment || !paymentMember) return;
                    setLoading(true);
                    try {
                      const result = await markPaymentUnpaid(payment._id, paymentMember._id);
                      if (result.success) {
                        // Update the specific member in the payment state
                        if (result.member) {
                          const updatedPayment = { ...payment };
                          const memberIndex = updatedPayment.squadMembers.findIndex(m => m._id === paymentMember._id);
                          if (memberIndex >= 0) {
                            updatedPayment.squadMembers[memberIndex] = {
                              ...updatedPayment.squadMembers[memberIndex],
                              ...result.member
                            };
                          }
                          
                          // Update payment summary if provided
                          if (result.paymentSummary) {
                            updatedPayment.totalCollected = result.paymentSummary.totalCollected;
                            updatedPayment.totalPending = result.paymentSummary.totalPending;
                            updatedPayment.totalOwed = result.paymentSummary.totalOwed;
                            updatedPayment.paidCount = result.paymentSummary.paidCount;
                            updatedPayment.status = result.paymentSummary.status;
                          }
                          
                          setPayment(updatedPayment);
                        }
                        
                        setSuccess(`Marked as unpaid for ${paymentMember.playerName}`);
                        setShowPaymentModal(false);
                        setPaymentMember(null);
                      } else {
                        setError(result.error || 'Failed to mark as unpaid');
                      }
                    } catch (err: any) {
                      setError(err.response?.data?.error || err.message || 'Failed to mark as unpaid');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                  className="w-full py-2.5 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertCircle className="w-4 h-4" />}
                  Mark as Unpaid
                </button>

                {/* Settle Overpayment button - always visible, disabled when owedAmount is 0 */}
                <button
                  onClick={async () => {
                    if (!payment || !paymentMember || !(paymentMember.owedAmount && paymentMember.owedAmount > 0)) return;
                    setLoading(true);
                    try {
                      const result = await settleOverpayment(payment._id, paymentMember._id);
                      if (result.success) {
                        // Update the specific member in the payment state
                        if (result.member) {
                          const updatedPayment = { ...payment };
                          const memberIndex = updatedPayment.squadMembers.findIndex(m => m._id === paymentMember._id);
                          if (memberIndex >= 0) {
                            updatedPayment.squadMembers[memberIndex] = {
                              ...updatedPayment.squadMembers[memberIndex],
                              ...result.member
                            };
                          }
                          
                          // Update payment summary if provided
                          if (result.paymentSummary) {
                            updatedPayment.totalCollected = result.paymentSummary.totalCollected;
                            updatedPayment.totalPending = result.paymentSummary.totalPending;
                            updatedPayment.totalOwed = result.paymentSummary.totalOwed;
                            updatedPayment.paidCount = result.paymentSummary.paidCount;
                            updatedPayment.status = result.paymentSummary.status;
                          }
                          
                          setPayment(updatedPayment);
                        }
                        
                        setSuccess(`Settlement of ₹${paymentMember.owedAmount} completed for ${paymentMember.playerName}. WhatsApp notification sent.`);
                        setShowPaymentModal(false);
                        setPaymentMember(null);
                      } else {
                        setError(result.error || 'Failed to settle overpayment');
                      }
                    } catch (err: any) {
                      setError(err.response?.data?.error || err.message || 'Failed to settle overpayment');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading || !(paymentMember.owedAmount && paymentMember.owedAmount > 0)}
                  className="w-full py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <IndianRupee className="w-4 h-4" />}
                  Settle Payment {(paymentMember.owedAmount || 0) > 0 ? `(₹${paymentMember.owedAmount})` : '(₹0)'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Share Link Modal - in detail view */}
        <ShareLinkModal
          isOpen={showShareLinkModal && !!payment}
          onClose={() => setShowShareLinkModal(false)}
          resourceType="payment"
          resourceId={payment?._id || ''}
          resourceTitle={payment ? `Payment: ${selectedMatch?.opponent || 'Match'} - ₹${payment.totalAmount}` : ''}
        />

        {/* Message Preview Modal (ISSUE 5 & 6) */}
        {showMessagePreview && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-800 border border-white/10 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-emerald-400" /> Preview & Edit Message
                </h3>
                <button onClick={() => setShowMessagePreview(false)} className="p-1 text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Recipients Summary */}
              <div className="mb-4 p-3 bg-slate-700/30 rounded-xl">
                <p className="text-sm text-slate-400 mb-2">
                  Sending to <span className="text-white font-semibold">{previewMembers.length}</span> player{previewMembers.length !== 1 ? 's' : ''}:
                </p>
                <div className="flex flex-wrap gap-2">
                  {previewMembers.slice(0, 5).map(m => (
                    <span key={m._id} className="px-2 py-1 bg-slate-600/50 rounded-lg text-xs text-white">
                      {m.playerName} (₹{m.dueAmount})
                    </span>
                  ))}
                  {previewMembers.length > 5 && (
                    <span className="px-2 py-1 bg-slate-600/50 rounded-lg text-xs text-slate-400">
                      +{previewMembers.length - 5} more
                    </span>
                  )}
                </div>
              </div>

              {/* Message Editor */}
              <div className="mb-4">
                <label className="block text-sm text-slate-400 mb-2">
                  Message Template
                  <span className="text-xs text-slate-500 ml-2">
                    (Use {'{playerName}'} and {'{dueAmount}'} as placeholders)
                  </span>
                </label>
                <textarea
                  value={previewMessage}
                  onChange={(e) => setPreviewMessage(e.target.value)}
                  rows={8}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-mono"
                  placeholder="Enter your message..."
                />
              </div>

              {/* Preview for first player */}
              {previewMembers.length > 0 && (
                <div className="mb-4">
                  <label className="block text-sm text-slate-400 mb-2">Preview (for {previewMembers[0].playerName})</label>
                  <div className="p-3 bg-[#dcf8c6] rounded-xl text-sm text-gray-800 whitespace-pre-wrap">
                    {previewMessage
                      .replace(/{playerName}/g, previewMembers[0].playerName)
                      .replace(/{dueAmount}/g, previewMembers[0].dueAmount.toString())
                    }
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowMessagePreview(false)}
                  className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendPaymentRequests}
                  disabled={sendingMessages || !previewMessage.trim()}
                  className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  {sendingMessages ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Send to {previewMembers.length} Player{previewMembers.length !== 1 ? 's' : ''}
                </button>
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
        <div 
          className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-xl p-4 relative cursor-pointer hover:bg-slate-800/70 transition-colors"
          onMouseEnter={() => setShowPendingTooltip(true)}
          onMouseLeave={() => setShowPendingTooltip(false)}
          onClick={() => setShowPendingTooltip(!showPendingTooltip)}
        >
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <Clock className="w-4 h-4" /> Pending
            <span className="text-[10px] opacity-60">(hover for details)</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-yellow-400">₹{dashboardStats.totalPending.toLocaleString()}</div>
          
          {/* Pending Amount Tooltip */}
          {showPendingTooltip && dashboardStats.totalPending > 0 && (
            <div className="absolute top-full left-0 mt-2 z-50 bg-slate-900 border border-white/20 rounded-xl p-3 shadow-xl min-w-[280px] max-h-[300px] overflow-auto">
              <div className="text-xs font-semibold text-white mb-2">Matches with Pending Amounts</div>
              <div className="space-y-2">
                {matchesWithPayments
                  .filter(m => m.payment && m.payment.totalPending > 0)
                  .map(match => (
                    <div 
                      key={match._id} 
                      className="flex items-center justify-between p-2 bg-slate-800/50 rounded-lg cursor-pointer hover:bg-slate-700/50"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedMatchId(match._id);
                        setShowPendingTooltip(false);
                      }}
                    >
                      <div>
                        <div className="text-sm text-white font-medium">{match.opponent || 'TBD'}</div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(match.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-yellow-400 font-semibold text-sm">₹{match.payment?.totalPending}</div>
                        <div className="text-[10px] text-slate-400">
                          {match.payment?.squadMembers?.filter((m: SquadMember) => m.paymentStatus !== 'paid' && m.paymentStatus !== 'overpaid').length || 0} unpaid
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
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
          <div 
            className="relative cursor-pointer"
            onClick={() => setShowPendingTooltip(!showPendingTooltip)}
          >
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
              <Clock className="w-3 h-3" /> Pending
            </div>
            <div className="text-lg font-bold text-yellow-400">₹{dashboardStats.totalPending.toLocaleString()}</div>
            
            {/* Mobile Pending Tooltip */}
            {showPendingTooltip && dashboardStats.totalPending > 0 && (
              <div className="absolute top-full left-0 mt-2 z-50 bg-slate-900 border border-white/20 rounded-xl p-3 shadow-xl min-w-[200px] max-h-[250px] overflow-auto">
                <div className="text-xs font-semibold text-white mb-2">Pending by Match</div>
                <div className="space-y-2">
                  {matchesWithPayments
                    .filter(m => m.payment && m.payment.totalPending > 0)
                    .map(match => (
                      <div 
                        key={match._id} 
                        className="flex items-center justify-between p-2 bg-slate-800/50 rounded-lg"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMatchId(match._id);
                          setShowPendingTooltip(false);
                        }}
                      >
                        <div className="text-xs text-white">{match.opponent || 'TBD'}</div>
                        <div className="text-yellow-400 font-semibold text-xs">₹{match.payment?.totalPending}</div>
                      </div>
                    ))}
                </div>
              </div>
            )}
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

      {/* Search and Filter Dropdown */}
      <div className="flex gap-3 items-center">
        {/* Search Bar - 80% width */}
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

        {/* Filter Dropdown Button - 20% width */}
        <div className="relative">
          <button
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            className="px-4 py-2.5 bg-slate-800/50 border border-white/10 rounded-xl text-white text-sm font-medium hover:bg-slate-700/50 transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <Filter className="w-4 h-4" />
            {filterStatus === 'all' ? 'Filter' : filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1).replace('-', ' ')}
          </button>

          {/* Dropdown Menu */}
          {showFilterDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-white/10 rounded-xl shadow-lg z-50">
              {[
                { value: 'all', label: 'All' },
                { value: 'no-payment', label: 'No Payment' },
                { value: 'pending', label: 'Pending' },
                { value: 'partial', label: 'Partial' },
                { value: 'completed', label: 'Completed' }
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => {
                    setFilterStatus(option.value as any);
                    setShowFilterDropdown(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                    filterStatus === option.value
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'text-slate-300 hover:bg-slate-700/50'
                  } ${option.value === 'all' ? 'border-b border-white/10' : ''}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
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
                        {payment.totalOwed && payment.totalOwed > 0 && (
                          <div className="text-right">
                            <div className="text-red-400 font-semibold">₹{payment.totalOwed}</div>
                            <div className="text-xs text-slate-400">refund</div>
                          </div>
                        )}
                        <div className="text-right">
                          <div className="text-white font-semibold">{payment.paidCount}/{payment.membersCount}</div>
                          <div className="text-xs text-slate-400">paid</div>
                        </div>
                      </div>
                    )}

                    {/* Delete Button (only if payment exists) */}
                    {payment && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePayment(payment._id);
                        }}
                        className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete Payment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
                        {payment.totalOwed && payment.totalOwed > 0 && (
                          <span className="text-red-400">₹{payment.totalOwed} refund</span>
                        )}
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
