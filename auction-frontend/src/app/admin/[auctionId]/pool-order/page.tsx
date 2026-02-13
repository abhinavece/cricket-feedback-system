'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { getPoolOrder, reorderPool } from '@/lib/api';
import { PLAYER_ROLES } from '@/lib/constants';
import {
  Loader2, GripVertical, ArrowUp, ArrowDown, Save, RotateCcw,
  AlertTriangle, Shuffle, ArrowUpToLine, ArrowDownToLine,
} from 'lucide-react';

interface PoolPlayer {
  _id: string;
  name: string;
  playerNumber: number;
  role: string;
  imageUrl?: string;
}

export default function PoolOrderPage() {
  const params = useParams();
  const auctionId = params.auctionId as string;

  const [players, setPlayers] = useState<PoolPlayer[]>([]);
  const [originalOrder, setOriginalOrder] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [auctionStatus, setAuctionStatus] = useState('');
  const [error, setError] = useState<string | null>(null);

  const isDirty = JSON.stringify(players.map(p => p._id)) !== JSON.stringify(originalOrder);

  const loadPoolOrder = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getPoolOrder(auctionId);
      setPlayers(res.data);
      setOriginalOrder(res.data.map((p: PoolPlayer) => p._id));
      setAuctionStatus(res.status);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [auctionId]);

  useEffect(() => { loadPoolOrder(); }, [loadPoolOrder]);

  const movePlayer = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= players.length) return;
    const newPlayers = [...players];
    [newPlayers[index], newPlayers[newIndex]] = [newPlayers[newIndex], newPlayers[index]];
    setPlayers(newPlayers);
  };

  const moveToTop = (index: number) => {
    if (index === 0) return;
    const newPlayers = [...players];
    const [player] = newPlayers.splice(index, 1);
    newPlayers.unshift(player);
    setPlayers(newPlayers);
  };

  const moveToBottom = (index: number) => {
    if (index === players.length - 1) return;
    const newPlayers = [...players];
    const [player] = newPlayers.splice(index, 1);
    newPlayers.push(player);
    setPlayers(newPlayers);
  };

  const shufflePlayers = () => {
    const shuffled = [...players];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setPlayers(shuffled);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await reorderPool(auctionId, players.map(p => p._id));
      setOriginalOrder(players.map(p => p._id));
    } catch (err: any) {
      alert(err.message || 'Failed to save order');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    const playerMap = new Map(players.map(p => [p._id, p]));
    setPlayers(originalOrder.map(id => playerMap.get(id)!).filter(Boolean));
  };

  const roleConfig = (role: string) =>
    PLAYER_ROLES[role as keyof typeof PLAYER_ROLES] || { label: role, icon: '🏏', color: 'text-slate-400' };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-8 text-center">
        <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  const isLiveOrPaused = ['live', 'paused'].includes(auctionStatus);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">Pool Order</h2>
          <p className="text-sm text-slate-400 mt-1">
            {players.length} player{players.length !== 1 ? 's' : ''} remaining in pool
            {!isLiveOrPaused && (
              <span className="text-amber-400 ml-2">• Auction must be live/paused to use this order</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={shufflePlayers}
            disabled={players.length === 0}
            className="btn-secondary text-sm"
          >
            <Shuffle className="w-4 h-4" /> Shuffle
          </button>
          {isDirty && (
            <>
              <button onClick={handleReset} className="btn-secondary text-sm">
                <RotateCcw className="w-4 h-4" /> Reset
              </button>
              <button onClick={handleSave} disabled={saving} className="btn-primary text-sm">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save Order</>}
              </button>
            </>
          )}
        </div>
      </div>

      {players.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <GripVertical className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">Empty Pool</h3>
          <p className="text-sm text-slate-400">
            {isLiveOrPaused
              ? 'All players have been auctioned or removed from the pool.'
              : 'The pool is populated when the auction goes live.'}
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {players.map((player, index) => {
            const rc = roleConfig(player.role);
            return (
              <div
                key={player._id}
                className="glass-card flex items-center gap-3 p-3 sm:p-4 group hover:bg-white/[0.03] transition-colors"
              >
                {/* Position number */}
                <span className="w-8 text-center text-xs font-bold text-slate-500 font-mono">
                  {index + 1}
                </span>

                {/* Grip icon */}
                <GripVertical className="w-4 h-4 text-slate-600 flex-shrink-0" />

                {/* Player info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-mono">#{player.playerNumber}</span>
                    <span className="font-medium text-white truncate">{player.name}</span>
                    <span className={`text-xs font-medium ${rc.color} hidden sm:inline`}>
                      {rc.icon} {rc.label}
                    </span>
                  </div>
                </div>

                {/* Move buttons */}
                <div className="flex items-center gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => moveToTop(index)}
                    disabled={index === 0}
                    className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                    title="Move to top"
                  >
                    <ArrowUpToLine className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => movePlayer(index, 'up')}
                    disabled={index === 0}
                    className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                    title="Move up"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => movePlayer(index, 'down')}
                    disabled={index === players.length - 1}
                    className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                    title="Move down"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => moveToBottom(index)}
                    disabled={index === players.length - 1}
                    className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                    title="Move to bottom"
                  >
                    <ArrowDownToLine className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sticky save bar */}
      {isDirty && (
        <div className="sticky bottom-0 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 bg-slate-900/95 backdrop-blur-xl border-t border-white/5">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <span className="text-sm text-amber-400 font-medium">Unsaved changes</span>
            <div className="flex items-center gap-2">
              <button onClick={handleReset} className="btn-secondary text-sm">Reset</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary text-sm">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save Order</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
