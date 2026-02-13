'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { proposeTrade, getMyTrades } from '@/lib/api';
import {
  ArrowLeftRight, Check, X, Clock, CheckCircle2, XCircle,
  Gavel, Loader2, ChevronDown, ChevronUp, Users, AlertTriangle,
  MessageSquare, Trophy, Lock, Send,
} from 'lucide-react';
import { siteConfig } from '@/lib/constants';

interface Player {
  _id: string;
  name: string;
  role?: string;
  soldAmount?: number;
}

interface Team {
  _id: string;
  name: string;
  shortName: string;
  primaryColor?: string;
  purseRemaining: number;
  squadSize: number;
}

interface TradeData {
  _id: string;
  fromTeamId: string;
  toTeamId: string;
  fromPlayers: { playerId: string; name: string }[];
  toPlayers: { playerId: string; name: string }[];
  fromTeam?: { name: string; shortName: string; primaryColor?: string };
  toTeam?: { name: string; shortName: string; primaryColor?: string };
  status: 'proposed' | 'approved' | 'rejected' | 'executed';
  rejectionReason?: string;
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
  proposed: { label: 'Pending', icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  approved: { label: 'Approved', icon: CheckCircle2, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  rejected: { label: 'Rejected', icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10' },
  executed: { label: 'Executed', icon: Gavel, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
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
  const [loading, setLoading] = useState(true);
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [proposalLoading, setProposalLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Proposal form state
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [selectedFromPlayers, setSelectedFromPlayers] = useState<string[]>([]);
  const [selectedToPlayers, setSelectedToPlayers] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [otherTeamPlayers, setOtherTeamPlayers] = useState<Player[]>([]);
  const [loadingOtherPlayers, setLoadingOtherPlayers] = useState(false);

  // Time left
  const [timeLeft, setTimeLeft] = useState('');

  const isTradeWindow = auctionStatus === 'trade_window';
  const isFinalized = auctionStatus === 'finalized';

  const loadTrades = useCallback(async () => {
    try {
      const res = await getMyTrades(auctionId, teamToken);
      setMyTrades(res.data || []);
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
      setSelectedToPlayers([]);
      return;
    }
    setLoadingOtherPlayers(true);
    fetch(`${siteConfig.apiUrl}/api/v1/auctions/${auctionId}/trades/team-players/${selectedTeam}`, {
      headers: { 'X-Team-Token': teamToken },
    })
      .then(res => res.json())
      .then(data => {
        setOtherTeamPlayers((data.data || []).map((p: any) => ({
          _id: p._id,
          name: p.name,
          role: p.role,
          soldAmount: p.soldAmount,
        })));
      })
      .catch(() => setOtherTeamPlayers([]))
      .finally(() => setLoadingOtherPlayers(false));
  }, [selectedTeam, auctionId, teamToken]);

  const activeTrades = myTrades.filter(t => ['proposed', 'approved', 'executed'].includes(t.status));
  const canPropose = isTradeWindow && activeTrades.length < maxTradesPerTeam;

  const handleSubmitProposal = async () => {
    if (!selectedTeam || selectedFromPlayers.length === 0 || selectedToPlayers.length === 0) {
      setError('Select at least one player from each team');
      return;
    }

    setProposalLoading(true);
    setError('');
    try {
      await proposeTrade(auctionId, teamToken, {
        toTeamId: selectedTeam,
        fromPlayerIds: selectedFromPlayers,
        toPlayerIds: selectedToPlayers,
        message: message.trim() || undefined,
      });
      setSuccess('Trade proposal submitted! Admin will review it.');
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

  const resetForm = () => {
    setSelectedTeam('');
    setSelectedFromPlayers([]);
    setSelectedToPlayers([]);
    setMessage('');
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
                ? `Propose player swaps with other teams · ${timeLeft} remaining · Max ${maxTradesPerTeam} trades`
                : isFinalized
                ? 'Results are permanent. No further trades.'
                : 'Waiting for admin to open the trade window.'}
            </p>
          </div>
          {isTradeWindow && timeLeft && (
            <div className="text-right shrink-0">
              <div className="text-sm font-bold text-purple-300">{timeLeft}</div>
            </div>
          )}
        </div>
      </div>

      {/* Success message */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-400 flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" /> {success}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Propose Trade Button */}
      {canPropose && !showProposalForm && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => setShowProposalForm(true)}
          className="w-full p-4 rounded-2xl bg-gradient-to-r from-purple-500/20 to-violet-500/20 border border-purple-500/20 text-center hover:from-purple-500/30 hover:to-violet-500/30 transition-all group"
        >
          <div className="flex items-center justify-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-semibold text-purple-300">Propose a Trade</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {activeTrades.length} of {maxTradesPerTeam} trades used
          </p>
        </motion.button>
      )}

      {/* Proposal Form */}
      <AnimatePresence>
        {showProposalForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="glass-card p-4 sm:p-5 space-y-4 border border-purple-500/20">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ArrowLeftRight className="w-4 h-4 text-purple-400" />
                  New Trade Proposal
                </h3>
                <button onClick={() => { setShowProposalForm(false); resetForm(); }} className="text-slate-500 hover:text-white p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Select receiving team */}
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Trade with team</label>
                <select
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-sm text-white focus:outline-none focus:border-purple-500/50"
                >
                  <option value="">Select a team...</option>
                  {otherTeams.map(t => (
                    <option key={t._id} value={t._id}>{t.name} ({t.shortName})</option>
                  ))}
                </select>
              </div>

              {selectedTeam && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Your players to send */}
                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 block">
                      Players you send ({selectedFromPlayers.length} selected)
                    </label>
                    <div className="max-h-48 overflow-y-auto space-y-1 rounded-xl bg-slate-900/30 p-2 border border-white/5">
                      {myPlayers.length === 0 ? (
                        <p className="text-xs text-slate-500 p-2 text-center">No players in your squad</p>
                      ) : myPlayers.map(p => {
                        const selected = selectedFromPlayers.includes(p._id);
                        return (
                          <button
                            key={p._id}
                            onClick={() => togglePlayer(p._id, selectedFromPlayers, setSelectedFromPlayers)}
                            className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-all text-sm ${
                              selected
                                ? 'bg-red-500/15 border border-red-500/20 text-red-300'
                                : 'hover:bg-slate-800/50 text-slate-300 border border-transparent'
                            }`}
                          >
                            <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                              selected ? 'bg-red-500 border-red-500' : 'border-slate-600'
                            }`}>
                              {selected && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <span className="truncate flex-1">{p.name}</span>
                            {p.role && <span className="text-[10px] text-slate-500">{p.role}</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Other team's players to receive */}
                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 block">
                      Players you receive ({selectedToPlayers.length} selected)
                    </label>
                    <div className="max-h-48 overflow-y-auto space-y-1 rounded-xl bg-slate-900/30 p-2 border border-white/5">
                      {loadingOtherPlayers ? (
                        <div className="flex items-center justify-center p-4">
                          <Loader2 className="w-4 h-4 text-slate-500 animate-spin" />
                        </div>
                      ) : otherTeamPlayers.length === 0 ? (
                        <p className="text-xs text-slate-500 p-2 text-center">No players found</p>
                      ) : otherTeamPlayers.map(p => {
                        const selected = selectedToPlayers.includes(p._id);
                        return (
                          <button
                            key={p._id}
                            onClick={() => togglePlayer(p._id, selectedToPlayers, setSelectedToPlayers)}
                            className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-all text-sm ${
                              selected
                                ? 'bg-emerald-500/15 border border-emerald-500/20 text-emerald-300'
                                : 'hover:bg-slate-800/50 text-slate-300 border border-transparent'
                            }`}
                          >
                            <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                              selected ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600'
                            }`}>
                              {selected && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <span className="truncate flex-1">{p.name}</span>
                            {p.role && <span className="text-[10px] text-slate-500">{p.role}</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Optional message */}
              {selectedTeam && (
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">Message to admin (optional)</label>
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Reason for this trade..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-900/50 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
                  />
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {error}
                </div>
              )}

              {/* Submit */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleSubmitProposal}
                  disabled={!selectedTeam || selectedFromPlayers.length === 0 || selectedToPlayers.length === 0 || proposalLoading}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-purple-500 to-violet-500 text-white hover:shadow-lg hover:scale-[1.01] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {proposalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Submit Proposal
                </button>
                <button
                  onClick={() => { setShowProposalForm(false); resetForm(); }}
                  className="px-4 py-2.5 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* My Trades List */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-slate-500 animate-spin" />
        </div>
      ) : myTrades.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.15em] flex items-center gap-2">
            <div className="w-1 h-4 rounded-full bg-gradient-to-b from-purple-500 to-violet-500" />
            Your Trades ({myTrades.length})
          </h3>
          {myTrades.map(trade => (
            <TradeHistoryCard key={trade._id} trade={trade} myTeamId={myTeamId} />
          ))}
        </div>
      ) : isTradeWindow ? (
        <div className="glass-card p-8 text-center">
          <ArrowLeftRight className="w-8 h-8 text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-400">No trade proposals yet. Propose a player swap above!</p>
        </div>
      ) : null}
    </div>
  );
}

function TradeHistoryCard({ trade, myTeamId }: { trade: TradeData; myTeamId: string }) {
  const statusCfg = STATUS_CONFIG[trade.status] || STATUS_CONFIG.proposed;
  const StatusIcon = statusCfg.icon;
  const isSender = trade.fromTeamId === myTeamId;

  return (
    <div className="glass-card p-3 sm:p-4 border border-white/5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-lg ${statusCfg.bg} flex items-center justify-center`}>
            <StatusIcon className={`w-3.5 h-3.5 ${statusCfg.color}`} />
          </div>
          <span className={`text-xs font-semibold ${statusCfg.color}`}>{statusCfg.label}</span>
        </div>
        <span className="text-[10px] text-slate-500">
          {new Date(trade.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <div className="flex-1">
          <p className="text-[10px] text-slate-500 mb-1">You send</p>
          <div className="space-y-1">
            {(isSender ? trade.fromPlayers : trade.toPlayers).map(p => (
              <span key={p.playerId} className="inline-block px-2 py-0.5 rounded bg-red-500/10 text-red-300 text-xs mr-1">
                {p.name}
              </span>
            ))}
          </div>
        </div>
        <ArrowLeftRight className="w-4 h-4 text-purple-400 shrink-0" />
        <div className="flex-1 text-right">
          <p className="text-[10px] text-slate-500 mb-1">You receive</p>
          <div className="space-y-1">
            {(isSender ? trade.toPlayers : trade.fromPlayers).map(p => (
              <span key={p.playerId} className="inline-block px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 text-xs ml-1">
                {p.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {trade.status === 'rejected' && trade.rejectionReason && (
        <div className="mt-2.5 p-2 rounded-lg bg-red-500/5 border border-red-500/10">
          <p className="text-xs text-red-300/70 flex items-start gap-1.5">
            <MessageSquare className="w-3 h-3 mt-0.5 shrink-0" />
            {trade.rejectionReason}
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
