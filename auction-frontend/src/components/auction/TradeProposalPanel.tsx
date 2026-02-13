'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  proposeTrade, getMyTrades, getAllTrades, acceptTrade, rejectTrade,
  withdrawTrade, getTeamPlayers,
} from '@/lib/api';
import PlayerDetailModal, { PlayerDetailData } from '@/components/auction/PlayerDetailModal';
import {
  ArrowLeftRight, Check, X, Clock, CheckCircle2, XCircle,
  Gavel, Loader2, AlertTriangle, MessageSquare, Trophy, Lock,
  Send, Inbox, ExternalLink, Ban, Globe, RefreshCw,
} from 'lucide-react';

interface Player {
  _id: string;
  name: string;
  role?: string;
  soldAmount?: number;
  customFields?: Record<string, any>;
  imageUrl?: string;
  playerNumber?: number;
  isLocked?: boolean;
}

interface Team {
  _id: string;
  name: string;
  shortName: string;
  primaryColor?: string;
  purseRemaining: number;
  squadSize: number;
}

interface TradePlayer {
  playerId: string;
  name: string;
  role?: string;
  soldAmount?: number;
}

interface TradeData {
  _id: string;
  initiatorTeamId: string;
  counterpartyTeamId: string;
  initiatorPlayers: TradePlayer[];
  counterpartyPlayers: TradePlayer[];
  initiatorTeam?: { _id: string; name: string; shortName: string; primaryColor?: string; purseRemaining?: number };
  counterpartyTeam?: { _id: string; name: string; shortName: string; primaryColor?: string; purseRemaining?: number };
  status: 'pending_counterparty' | 'both_agreed' | 'executed' | 'rejected' | 'withdrawn' | 'cancelled' | 'expired';
  initiatorTotalValue?: number;
  counterpartyTotalValue?: number;
  settlementAmount?: number;
  settlementDirection?: string;
  purseSettlementEnabled?: boolean;
  initiatorMessage?: string;
  counterpartyMessage?: string;
  rejectedBy?: string;
  rejectionReason?: string;
  cancellationReason?: string;
  publicAnnouncement?: string;
  createdAt: string;
}

interface TradeProposalPanelProps {
  auctionId: string;
  teamToken: string;
  myTeamId: string;
  myTeamName: string;
  myTeamShortName: string;
  myTeamColor?: string;
  teams: Team[];
  auctionStatus: string;
  tradeWindowEndsAt?: string;
  maxTradesPerTeam: number;
  myPlayers: Player[];
}

const STATUS_CONFIG: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  pending_counterparty: { label: 'Pending', icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  both_agreed: { label: 'Agreed', icon: CheckCircle2, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  executed: { label: 'Executed', icon: Gavel, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  rejected: { label: 'Rejected', icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10' },
  withdrawn: { label: 'Withdrawn', icon: Ban, color: 'text-slate-400', bg: 'bg-slate-500/10' },
  cancelled: { label: 'Cancelled', icon: XCircle, color: 'text-orange-400', bg: 'bg-orange-500/10' },
  expired: { label: 'Expired', icon: Clock, color: 'text-slate-500', bg: 'bg-slate-500/10' },
};

function formatCurrency(amount: number) {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  return `₹${amount.toLocaleString('en-IN')}`;
}

export default function TradeProposalPanel({
  auctionId, teamToken, myTeamId, myTeamName, myTeamShortName, myTeamColor,
  teams, auctionStatus, tradeWindowEndsAt, maxTradesPerTeam, myPlayers,
}: TradeProposalPanelProps) {
  const [myTrades, setMyTrades] = useState<TradeData[]>([]);
  const [allAuctionTrades, setAllAuctionTrades] = useState<TradeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'my' | 'all'>('my');
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [proposalLoading, setProposalLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedPlayerDetail, setSelectedPlayerDetail] = useState<PlayerDetailData | null>(null);

  // Proposal form state
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [selectedInitiatorPlayers, setSelectedInitiatorPlayers] = useState<string[]>([]);
  const [selectedCounterpartyPlayers, setSelectedCounterpartyPlayers] = useState<string[]>([]);
  const [proposalMessage, setProposalMessage] = useState('');
  const [otherTeamPlayers, setOtherTeamPlayers] = useState<Player[]>([]);
  const [loadingOtherPlayers, setLoadingOtherPlayers] = useState(false);

  // Reject reason
  const [rejectTradeId, setRejectTradeId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const [timeLeft, setTimeLeft] = useState('');

  const isTradeWindow = auctionStatus === 'trade_window';
  const isFinalized = auctionStatus === 'finalized';

  const loadTrades = useCallback(async () => {
    try {
      const [myRes, allRes] = await Promise.all([
        getMyTrades(auctionId, teamToken),
        getAllTrades(auctionId, teamToken),
      ]);
      setMyTrades(myRes.data || []);
      setAllAuctionTrades(allRes.data || []);
    } catch (err: any) {
      console.error('Failed to load trades:', err);
    } finally {
      setLoading(false);
    }
  }, [auctionId, teamToken]);

  useEffect(() => { loadTrades(); }, [loadTrades]);

  // Countdown timer
  useEffect(() => {
    if (!tradeWindowEndsAt || !isTradeWindow) return;
    const update = () => {
      const remaining = new Date(tradeWindowEndsAt).getTime() - Date.now();
      if (remaining <= 0) { setTimeLeft('Expired'); return; }
      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      setTimeLeft(`${hours}h ${minutes}m`);
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [tradeWindowEndsAt, isTradeWindow]);

  // Load other team's players when selected
  useEffect(() => {
    if (!selectedTeam) {
      setOtherTeamPlayers([]);
      setSelectedCounterpartyPlayers([]);
      return;
    }
    setLoadingOtherPlayers(true);
    getTeamPlayers(auctionId, teamToken, selectedTeam)
      .then(data => setOtherTeamPlayers(data.data || []))
      .catch(() => setOtherTeamPlayers([]))
      .finally(() => setLoadingOtherPlayers(false));
  }, [selectedTeam, auctionId, teamToken]);

  // Derived data
  const executedTrades = myTrades.filter(t => t.status === 'executed');
  const canPropose = isTradeWindow && executedTrades.length < maxTradesPerTeam;

  const incomingTrades = myTrades.filter(
    t => t.counterpartyTeamId === myTeamId && t.status === 'pending_counterparty'
  );
  const outgoingTrades = myTrades.filter(
    t => t.initiatorTeamId === myTeamId && t.status === 'pending_counterparty'
  );
  const agreedTrades = myTrades.filter(t => t.status === 'both_agreed');
  const historyTrades = myTrades.filter(
    t => ['executed', 'rejected', 'withdrawn', 'cancelled', 'expired'].includes(t.status)
  );
  const otherTeamsTrades = allAuctionTrades.filter(
    t => t.initiatorTeamId !== myTeamId && t.counterpartyTeamId !== myTeamId
  );

  // Settlement calculation for proposal form
  const proposalSettlement = (() => {
    const initTotal = myPlayers
      .filter(p => selectedInitiatorPlayers.includes(p._id))
      .reduce((s, p) => s + (p.soldAmount || 0), 0);
    const cpTotal = otherTeamPlayers
      .filter(p => selectedCounterpartyPlayers.includes(p._id))
      .reduce((s, p) => s + (p.soldAmount || 0), 0);
    const diff = Math.abs(initTotal - cpTotal);
    return { initTotal, cpTotal, diff, direction: initTotal < cpTotal ? 'you_pay' : initTotal > cpTotal ? 'you_receive' : 'even' };
  })();

  const handleSubmitProposal = async () => {
    if (!selectedTeam || selectedInitiatorPlayers.length === 0 || selectedCounterpartyPlayers.length === 0) {
      setError('Select at least one player from each team');
      return;
    }
    setProposalLoading(true);
    setError('');
    try {
      await proposeTrade(auctionId, teamToken, {
        counterpartyTeamId: selectedTeam,
        initiatorPlayerIds: selectedInitiatorPlayers,
        counterpartyPlayerIds: selectedCounterpartyPlayers,
        message: proposalMessage.trim() || undefined,
      });
      setSuccess('Trade proposal sent! Waiting for counterparty to accept.');
      setShowProposalForm(false);
      resetForm();
      await loadTrades();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProposalLoading(false);
    }
  };

  const handleAccept = async (tradeId: string) => {
    setActionLoading(tradeId);
    try {
      await acceptTrade(auctionId, teamToken, tradeId);
      setSuccess('Trade accepted! Waiting for admin approval.');
      await loadTrades();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(''), 5000);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (tradeId: string) => {
    setActionLoading(tradeId);
    try {
      await rejectTrade(auctionId, teamToken, tradeId, rejectReason);
      setRejectTradeId(null);
      setRejectReason('');
      await loadTrades();
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(''), 5000);
    } finally {
      setActionLoading(null);
    }
  };

  const handleWithdraw = async (tradeId: string) => {
    setActionLoading(tradeId);
    try {
      await withdrawTrade(auctionId, teamToken, tradeId);
      await loadTrades();
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(''), 5000);
    } finally {
      setActionLoading(null);
    }
  };

  const resetForm = () => {
    setSelectedTeam('');
    setSelectedInitiatorPlayers([]);
    setSelectedCounterpartyPlayers([]);
    setProposalMessage('');
  };

  const togglePlayer = (playerId: string, list: string[], setList: (l: string[]) => void) => {
    setList(list.includes(playerId) ? list.filter(id => id !== playerId) : [...list, playerId]);
  };

  const otherTeams = teams.filter(t => t._id !== myTeamId);

  return (
    <div className="space-y-4">
      {/* Trade Window Banner */}
      <div className={`p-4 rounded-2xl border ${
        isTradeWindow ? 'bg-purple-500/10 border-purple-500/20' :
        isFinalized ? 'bg-emerald-500/10 border-emerald-500/20' :
        'bg-slate-800/50 border-white/5'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            isTradeWindow ? 'bg-purple-500/20' : isFinalized ? 'bg-emerald-500/20' : 'bg-slate-700/50'
          }`}>
            {isTradeWindow ? <ArrowLeftRight className="w-5 h-5 text-purple-400" /> :
             isFinalized ? <Lock className="w-5 h-5 text-emerald-400" /> :
             <Trophy className="w-5 h-5 text-amber-400" />}
          </div>
          <div className="flex-1">
            <p className={`text-sm font-semibold ${
              isTradeWindow ? 'text-purple-400' : isFinalized ? 'text-emerald-400' : 'text-white'
            }`}>
              {isTradeWindow ? 'Trade Window Open' : isFinalized ? 'Auction Finalized' : 'Auction Completed'}
            </p>
            <p className="text-xs text-slate-400">
              {isTradeWindow
                ? `${executedTrades.length}/${maxTradesPerTeam} trades executed · ${timeLeft ? timeLeft + ' remaining' : ''}`
                : isFinalized ? 'Results are permanent. No further trades.'
                : 'Waiting for admin to open the trade window.'}
            </p>
          </div>
          {isTradeWindow && (
            <button onClick={() => loadTrades()} className="p-2 rounded-lg hover:bg-white/5 transition-colors">
              <RefreshCw className="w-4 h-4 text-slate-400" />
            </button>
          )}
        </div>
      </div>

      {/* Tab switcher: My Trades / All Trades */}
      <div className="flex gap-1 p-1 rounded-xl bg-slate-800/30 border border-white/5">
        <button
          onClick={() => setActiveTab('my')}
          className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'my' ? 'bg-purple-500/20 text-purple-300' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Inbox className="w-3.5 h-3.5" />
          My Trades
          {incomingTrades.length > 0 && (
            <span className="ml-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
              {incomingTrades.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'all' ? 'bg-purple-500/20 text-purple-300' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          All Trades
        </button>
      </div>

      {/* Alerts */}
      <AnimatePresence>
        {success && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" /> {success}
          </motion.div>
        )}
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-slate-500 animate-spin" />
        </div>
      ) : activeTab === 'my' ? (
        <div className="space-y-4">
          {/* --- INCOMING TRADES --- */}
          {incomingTrades.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-[0.15em] flex items-center gap-2">
                <div className="w-1 h-4 rounded-full bg-gradient-to-b from-amber-500 to-red-500" />
                Incoming ({incomingTrades.length})
              </h3>
              {incomingTrades.map(trade => (
                <IncomingTradeCard
                  key={trade._id}
                  trade={trade}
                  onAccept={() => handleAccept(trade._id)}
                  onReject={() => setRejectTradeId(trade._id)}
                  loading={actionLoading === trade._id}
                />
              ))}
            </div>
          )}

          {/* --- AGREED (waiting admin) --- */}
          {agreedTrades.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-blue-400 uppercase tracking-[0.15em] flex items-center gap-2">
                <div className="w-1 h-4 rounded-full bg-gradient-to-b from-blue-500 to-cyan-500" />
                Awaiting Admin ({agreedTrades.length})
              </h3>
              {agreedTrades.map(trade => (
                <TradeCard key={trade._id} trade={trade} myTeamId={myTeamId} />
              ))}
            </div>
          )}

          {/* --- OUTGOING TRADES --- */}
          {outgoingTrades.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-purple-400 uppercase tracking-[0.15em] flex items-center gap-2">
                <div className="w-1 h-4 rounded-full bg-gradient-to-b from-purple-500 to-violet-500" />
                Outgoing ({outgoingTrades.length})
              </h3>
              {outgoingTrades.map(trade => (
                <OutgoingTradeCard
                  key={trade._id}
                  trade={trade}
                  onWithdraw={() => handleWithdraw(trade._id)}
                  loading={actionLoading === trade._id}
                />
              ))}
            </div>
          )}

          {/* --- PROPOSE BUTTON --- */}
          {canPropose && !showProposalForm && (
            <motion.button
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              onClick={() => setShowProposalForm(true)}
              className="w-full p-4 rounded-2xl bg-gradient-to-r from-purple-500/20 to-violet-500/20 border border-purple-500/20 text-center hover:from-purple-500/30 hover:to-violet-500/30 transition-all group"
            >
              <div className="flex items-center justify-center gap-2">
                <ArrowLeftRight className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-semibold text-purple-300">Propose a Trade</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {executedTrades.length} of {maxTradesPerTeam} trades executed
              </p>
            </motion.button>
          )}

          {/* --- PROPOSAL FORM --- */}
          <AnimatePresence>
            {showProposalForm && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="glass-card p-4 sm:p-5 space-y-4 border border-purple-500/20">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <ArrowLeftRight className="w-4 h-4 text-purple-400" /> New Trade Proposal
                    </h3>
                    <button onClick={() => { setShowProposalForm(false); resetForm(); }} className="text-slate-500 hover:text-white p-1"><X className="w-4 h-4" /></button>
                  </div>

                  {/* Select team */}
                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 block">Trade with team</label>
                    <select value={selectedTeam} onChange={e => setSelectedTeam(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-sm text-white focus:outline-none focus:border-purple-500/50">
                      <option value="">Select a team...</option>
                      {otherTeams.map(t => <option key={t._id} value={t._id}>{t.name} ({t.shortName})</option>)}
                    </select>
                  </div>

                  {selectedTeam && (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Your players */}
                        <div>
                          <label className="text-xs text-slate-400 mb-1.5 block">You send ({selectedInitiatorPlayers.length})</label>
                          <div className="max-h-52 overflow-y-auto space-y-1 rounded-xl bg-slate-900/30 p-2 border border-white/5">
                            {myPlayers.length === 0 ? (
                              <p className="text-xs text-slate-500 p-2 text-center">No players</p>
                            ) : myPlayers.map(p => {
                              const selected = selectedInitiatorPlayers.includes(p._id);
                              const locked = p.isLocked && !selected;
                              return (
                                <button key={p._id} disabled={locked}
                                  onClick={() => !locked && togglePlayer(p._id, selectedInitiatorPlayers, setSelectedInitiatorPlayers)}
                                  className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-all text-sm ${
                                    locked ? 'opacity-40 cursor-not-allowed' :
                                    selected ? 'bg-red-500/15 border border-red-500/20 text-red-300' :
                                    'hover:bg-slate-800/50 text-slate-300 border border-transparent'
                                  }`}>
                                  <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                                    selected ? 'bg-red-500 border-red-500' : 'border-slate-600'
                                  }`}>{selected && <Check className="w-3 h-3 text-white" />}</div>
                                  <span className="truncate flex-1">{p.name}</span>
                                  {p.soldAmount ? <span className="text-[10px] text-emerald-400 shrink-0">{formatCurrency(p.soldAmount)}</span> : null}
                                  {locked && <Lock className="w-3 h-3 text-slate-500 shrink-0" />}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Counterparty players */}
                        <div>
                          <label className="text-xs text-slate-400 mb-1.5 block">You receive ({selectedCounterpartyPlayers.length})</label>
                          <div className="max-h-52 overflow-y-auto space-y-1 rounded-xl bg-slate-900/30 p-2 border border-white/5">
                            {loadingOtherPlayers ? (
                              <div className="flex items-center justify-center p-4"><Loader2 className="w-4 h-4 text-slate-500 animate-spin" /></div>
                            ) : otherTeamPlayers.length === 0 ? (
                              <p className="text-xs text-slate-500 p-2 text-center">No players found</p>
                            ) : otherTeamPlayers.map(p => {
                              const selected = selectedCounterpartyPlayers.includes(p._id);
                              const locked = p.isLocked && !selected;
                              return (
                                <button key={p._id} disabled={locked}
                                  onClick={() => !locked && togglePlayer(p._id, selectedCounterpartyPlayers, setSelectedCounterpartyPlayers)}
                                  className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-all text-sm ${
                                    locked ? 'opacity-40 cursor-not-allowed' :
                                    selected ? 'bg-emerald-500/15 border border-emerald-500/20 text-emerald-300' :
                                    'hover:bg-slate-800/50 text-slate-300 border border-transparent'
                                  }`}>
                                  <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                                    selected ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600'
                                  }`}>{selected && <Check className="w-3 h-3 text-white" />}</div>
                                  <span className="truncate flex-1">{p.name}</span>
                                  {p.soldAmount ? <span className="text-[10px] text-emerald-400 shrink-0">{formatCurrency(p.soldAmount)}</span> : null}
                                  {locked && <Lock className="w-3 h-3 text-slate-500 shrink-0" />}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Settlement Summary */}
                      {(selectedInitiatorPlayers.length > 0 || selectedCounterpartyPlayers.length > 0) && (
                        <div className="p-3 rounded-xl bg-slate-800/50 border border-white/5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400">You send: <span className="text-red-300 font-semibold">{formatCurrency(proposalSettlement.initTotal)}</span></span>
                            <ArrowLeftRight className="w-3.5 h-3.5 text-purple-400" />
                            <span className="text-slate-400">You receive: <span className="text-emerald-300 font-semibold">{formatCurrency(proposalSettlement.cpTotal)}</span></span>
                          </div>
                          {proposalSettlement.diff > 0 && (
                            <p className="text-[11px] text-center mt-1.5 text-slate-500">
                              Settlement: <span className={proposalSettlement.direction === 'you_pay' ? 'text-red-400' : 'text-emerald-400'}>
                                {formatCurrency(proposalSettlement.diff)} {proposalSettlement.direction === 'you_pay' ? 'you pay' : 'you receive'}
                              </span>
                            </p>
                          )}
                        </div>
                      )}

                      {/* Message */}
                      <div>
                        <label className="text-xs text-slate-400 mb-1.5 block">Message (optional)</label>
                        <input type="text" value={proposalMessage} onChange={e => setProposalMessage(e.target.value)}
                          placeholder="Reason for this trade..."
                          className="w-full px-3 py-2 rounded-xl bg-slate-900/50 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50" />
                      </div>
                    </>
                  )}

                  {/* Submit */}
                  <div className="flex gap-2 pt-1">
                    <button onClick={handleSubmitProposal}
                      disabled={!selectedTeam || selectedInitiatorPlayers.length === 0 || selectedCounterpartyPlayers.length === 0 || proposalLoading}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-purple-500 to-violet-500 text-white hover:shadow-lg hover:scale-[1.01] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100">
                      {proposalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      Send Proposal
                    </button>
                    <button onClick={() => { setShowProposalForm(false); resetForm(); }}
                      className="px-4 py-2.5 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all">
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* --- HISTORY --- */}
          {historyTrades.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.15em] flex items-center gap-2">
                <div className="w-1 h-4 rounded-full bg-gradient-to-b from-slate-500 to-slate-700" />
                History ({historyTrades.length})
              </h3>
              {historyTrades.map(trade => (
                <TradeCard key={trade._id} trade={trade} myTeamId={myTeamId} />
              ))}
            </div>
          )}

          {/* Empty state */}
          {myTrades.length === 0 && !showProposalForm && isTradeWindow && (
            <div className="glass-card p-8 text-center">
              <ArrowLeftRight className="w-8 h-8 text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-400">No trades yet. Propose a player swap above!</p>
            </div>
          )}
        </div>
      ) : (
        /* === ALL TRADES TAB === */
        <div className="space-y-3">
          {allAuctionTrades.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <Globe className="w-8 h-8 text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-400">No trades in this auction yet.</p>
            </div>
          ) : (
            allAuctionTrades.map(trade => (
              <TradeCard key={trade._id} trade={trade} myTeamId={myTeamId} showTeams />
            ))
          )}
        </div>
      )}

      {/* Reject reason modal */}
      <AnimatePresence>
        {rejectTradeId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setRejectTradeId(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="glass-card p-5 w-full max-w-sm space-y-4">
              <h3 className="text-sm font-bold text-white">Reject Trade</h3>
              <input type="text" value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                placeholder="Reason (optional)..."
                className="w-full px-3 py-2 rounded-xl bg-slate-900/50 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500/50" />
              <div className="flex gap-2">
                <button onClick={() => handleReject(rejectTradeId)} disabled={actionLoading === rejectTradeId}
                  className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-all">
                  {actionLoading === rejectTradeId ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Reject'}
                </button>
                <button onClick={() => { setRejectTradeId(null); setRejectReason(''); }}
                  className="px-4 py-2 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all">
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Player detail modal */}
      {selectedPlayerDetail && (
        <PlayerDetailModal player={selectedPlayerDetail} onClose={() => setSelectedPlayerDetail(null)} />
      )}
    </div>
  );
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

function SettlementBadge({ trade }: { trade: TradeData }) {
  if (!trade.settlementAmount || trade.settlementAmount === 0) return null;
  return (
    <div className="mt-2 flex items-center justify-center gap-1 text-[10px] text-slate-500">
      Settlement: <span className="font-semibold text-slate-300">{formatCurrency(trade.settlementAmount)}</span>
      {trade.settlementDirection === 'initiator_pays'
        ? <span className="text-red-400">({trade.initiatorTeam?.shortName || 'Initiator'} pays)</span>
        : <span className="text-emerald-400">({trade.counterpartyTeam?.shortName || 'Counterparty'} pays)</span>}
    </div>
  );
}

function TradePlayersRow({ trade, myTeamId, showTeams }: { trade: TradeData; myTeamId: string; showTeams?: boolean }) {
  const isInitiator = trade.initiatorTeamId === myTeamId;
  const leftLabel = showTeams
    ? (trade.initiatorTeam?.shortName || '?')
    : (isInitiator ? 'You send' : 'They send');
  const rightLabel = showTeams
    ? (trade.counterpartyTeam?.shortName || '?')
    : (isInitiator ? 'You receive' : 'They want');
  const leftPlayers = trade.initiatorPlayers;
  const rightPlayers = trade.counterpartyPlayers;

  return (
    <div>
      <div className="flex items-center gap-2 text-sm">
        <div className="flex-1">
          <p className="text-[10px] text-slate-500 mb-1">{leftLabel}</p>
          <div className="flex flex-wrap gap-1">
            {leftPlayers.map(p => (
              <span key={p.playerId} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-500/10 text-red-300 text-xs">
                {p.name}
                {p.soldAmount ? <span className="text-[9px] text-red-400/60">{formatCurrency(p.soldAmount)}</span> : null}
              </span>
            ))}
          </div>
        </div>
        <ArrowLeftRight className="w-4 h-4 text-purple-400 shrink-0" />
        <div className="flex-1 text-right">
          <p className="text-[10px] text-slate-500 mb-1">{rightLabel}</p>
          <div className="flex flex-wrap gap-1 justify-end">
            {rightPlayers.map(p => (
              <span key={p.playerId} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 text-xs">
                {p.name}
                {p.soldAmount ? <span className="text-[9px] text-emerald-400/60">{formatCurrency(p.soldAmount)}</span> : null}
              </span>
            ))}
          </div>
        </div>
      </div>
      <SettlementBadge trade={trade} />
    </div>
  );
}

function IncomingTradeCard({ trade, onAccept, onReject, loading }: {
  trade: TradeData; onAccept: () => void; onReject: () => void; loading: boolean;
}) {
  return (
    <div className="glass-card p-3 sm:p-4 border border-amber-500/20 bg-amber-500/5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-amber-400">
            From {trade.initiatorTeam?.shortName || 'Unknown'}
          </span>
          {trade.initiatorTeam?.primaryColor && (
            <span className="w-3 h-3 rounded" style={{ background: trade.initiatorTeam.primaryColor }} />
          )}
        </div>
        <span className="text-[10px] text-slate-500">
          {new Date(trade.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      <TradePlayersRow trade={trade} myTeamId="" showTeams />

      {trade.initiatorMessage && (
        <div className="mt-2.5 p-2 rounded-lg bg-slate-800/50 border border-white/5">
          <p className="text-xs text-slate-400 flex items-start gap-1.5">
            <MessageSquare className="w-3 h-3 mt-0.5 shrink-0 text-slate-500" />
            {trade.initiatorMessage}
          </p>
        </div>
      )}

      <div className="flex gap-2 mt-3">
        <button onClick={onAccept} disabled={loading}
          className="flex-1 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 transition-all disabled:opacity-40 flex items-center justify-center gap-1.5">
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
          Accept
        </button>
        <button onClick={onReject} disabled={loading}
          className="flex-1 px-3 py-2 rounded-xl text-xs font-semibold bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-all disabled:opacity-40 flex items-center justify-center gap-1.5">
          <XCircle className="w-3.5 h-3.5" /> Reject
        </button>
      </div>
    </div>
  );
}

function OutgoingTradeCard({ trade, onWithdraw, loading }: {
  trade: TradeData; onWithdraw: () => void; loading: boolean;
}) {
  return (
    <div className="glass-card p-3 sm:p-4 border border-purple-500/10">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-purple-400">
            To {trade.counterpartyTeam?.shortName || 'Unknown'}
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] text-amber-400">
            <Clock className="w-3 h-3" /> Waiting...
          </span>
        </div>
        <span className="text-[10px] text-slate-500">
          {new Date(trade.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      <TradePlayersRow trade={trade} myTeamId={trade.initiatorTeamId} />

      <div className="flex justify-end mt-3">
        <button onClick={onWithdraw} disabled={loading}
          className="px-3 py-1.5 rounded-lg text-[11px] font-semibold text-slate-400 hover:text-red-300 hover:bg-red-500/10 transition-all disabled:opacity-40 flex items-center gap-1.5">
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
          Withdraw
        </button>
      </div>
    </div>
  );
}

function TradeCard({ trade, myTeamId, showTeams }: { trade: TradeData; myTeamId: string; showTeams?: boolean }) {
  const statusCfg = STATUS_CONFIG[trade.status] || STATUS_CONFIG.pending_counterparty;
  const StatusIcon = statusCfg.icon;

  return (
    <div className="glass-card p-3 sm:p-4 border border-white/5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded-md ${statusCfg.bg} flex items-center justify-center`}>
            <StatusIcon className={`w-3 h-3 ${statusCfg.color}`} />
          </div>
          <span className={`text-xs font-semibold ${statusCfg.color}`}>{statusCfg.label}</span>
          {showTeams && (
            <span className="text-[10px] text-slate-500">
              {trade.initiatorTeam?.shortName} ↔ {trade.counterpartyTeam?.shortName}
            </span>
          )}
        </div>
        <span className="text-[10px] text-slate-500">
          {new Date(trade.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      <TradePlayersRow trade={trade} myTeamId={myTeamId} showTeams={showTeams} />

      {trade.status === 'rejected' && trade.rejectionReason && (
        <div className="mt-2.5 p-2 rounded-lg bg-red-500/5 border border-red-500/10">
          <p className="text-xs text-red-300/70 flex items-start gap-1.5">
            <MessageSquare className="w-3 h-3 mt-0.5 shrink-0" />
            {trade.rejectedBy === 'admin' ? '(Admin) ' : '(Team) '}{trade.rejectionReason}
          </p>
        </div>
      )}

      {trade.status === 'cancelled' && trade.cancellationReason && (
        <div className="mt-2.5 p-2 rounded-lg bg-orange-500/5 border border-orange-500/10">
          <p className="text-xs text-orange-300/70 flex items-start gap-1.5">
            <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
            {trade.cancellationReason}
          </p>
        </div>
      )}

      {trade.status === 'executed' && trade.publicAnnouncement && (
        <div className="mt-2.5 p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
          <p className="text-xs text-emerald-300/70 flex items-start gap-1.5">
            <Gavel className="w-3 h-3 mt-0.5 shrink-0" />
            {trade.publicAnnouncement}
          </p>
        </div>
      )}
    </div>
  );
}
