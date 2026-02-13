'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { PLAYER_ROLES } from '@/lib/constants';
import { X, ExternalLink } from 'lucide-react';

export interface PlayerDetailData {
  _id: string;
  name: string;
  role: string;
  playerNumber?: number;
  imageUrl?: string;
  customFields?: Record<string, any>;
  status?: string;
  soldAmount?: number;
  soldInRound?: number;
  soldTo?: { _id: string; name: string; shortName: string; primaryColor: string; logo?: string };
}

interface PlayerDetailModalProps {
  player: PlayerDetailData | null;
  onClose: () => void;
  customFieldKeys?: string[];
  fieldLabelMap?: Record<string, string>;
  basePrice?: number;
}

function formatCurrency(amount: number) {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  return `₹${amount.toLocaleString('en-IN')}`;
}

function FieldValue({ value, fieldKey }: { value: any; fieldKey: string }) {
  if (value === undefined || value === null || value === '') return <span className="text-slate-600">—</span>;
  const strVal = String(value);
  if (/^https?:\/\//i.test(strVal)) {
    return (
      <a href={strVal} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 inline-flex items-center gap-0.5 text-sm">
        <ExternalLink className="w-3 h-3" /> Link
      </a>
    );
  }
  return <span>{strVal}</span>;
}

export default function PlayerDetailModal({ player, onClose, customFieldKeys, fieldLabelMap, basePrice }: PlayerDetailModalProps) {
  if (!player) return null;

  const rc = PLAYER_ROLES[player.role as keyof typeof PLAYER_ROLES] || { label: player.role, icon: '🏏', color: 'text-slate-400' };
  const isSold = player.status === 'sold';
  const multiplier = isSold && player.soldAmount && basePrice && basePrice > 0
    ? (player.soldAmount / basePrice).toFixed(1)
    : null;

  // Derive custom field keys from player data if not provided
  const fieldKeys = customFieldKeys || (player.customFields ? Object.keys(player.customFields) : []);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          onClick={e => e.stopPropagation()}
          className="glass-card w-full max-w-md max-h-[85vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-start gap-4 p-5 border-b border-white/5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-700/80 to-slate-800/80 flex items-center justify-center border border-white/10 overflow-hidden flex-shrink-0">
              {player.imageUrl ? (
                <img src={player.imageUrl} alt={player.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl">{rc.icon}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {player.playerNumber && (
                  <span className="text-xs text-slate-500 font-mono">#{player.playerNumber}</span>
                )}
                {player.status && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${
                    isSold ? 'bg-emerald-500/15 text-emerald-400' :
                    player.status === 'unsold' ? 'bg-orange-500/15 text-orange-400' :
                    'bg-blue-500/15 text-blue-400'
                  }`}>
                    {player.status}
                  </span>
                )}
              </div>
              <h3 className="text-xl font-bold text-white truncate">{player.name}</h3>
              <span className={`text-xs font-medium ${rc.color}`}>{rc.icon} {rc.label}</span>
            </div>
            <button onClick={onClose} className="btn-ghost p-1.5 flex-shrink-0">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Sold info */}
          {isSold && player.soldTo && (
            <div className="px-5 py-3 bg-emerald-500/5 border-b border-white/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-bold text-white"
                    style={{ background: player.soldTo.primaryColor }}
                  >
                    {player.soldTo.shortName?.charAt(0)}
                  </span>
                  <div>
                    <span className="text-sm text-white font-medium">{player.soldTo.name}</span>
                    {player.soldInRound && (
                      <span className="text-[10px] text-slate-500 ml-2">Round {player.soldInRound}</span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-emerald-400">{formatCurrency(player.soldAmount!)}</span>
                  {multiplier && Number(multiplier) > 1 && (
                    <span className="text-[10px] text-slate-500 ml-1">({multiplier}×)</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Sold amount without team info (for trade context where soldTo isn't populated) */}
          {isSold && !player.soldTo && player.soldAmount && (
            <div className="px-5 py-3 bg-emerald-500/5 border-b border-white/5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Purchase Price</span>
                <span className="text-sm font-bold text-emerald-400">{formatCurrency(player.soldAmount)}</span>
              </div>
            </div>
          )}

          {/* Custom fields */}
          <div className="p-5">
            {fieldKeys.length > 0 && player.customFields ? (
              <div className="space-y-0">
                {fieldKeys.map(k => {
                  const val = player.customFields?.[k];
                  return (
                    <div key={k} className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
                      <span className="text-sm text-slate-400 capitalize">{fieldLabelMap?.[k] || k.replace(/_/g, ' ')}</span>
                      <span className="text-sm font-medium text-white">
                        <FieldValue value={val} fieldKey={k} />
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-4">No additional details</p>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
