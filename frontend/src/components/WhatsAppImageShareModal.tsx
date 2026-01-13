import React, { useState, useEffect } from 'react';
import { X, Send, Search, Check, Loader2, Users, Image as ImageIcon } from 'lucide-react';
import { getPlayers } from '../services/api';

interface Player {
  _id: string;
  name: string;
  phone: string;
}

interface WhatsAppImageShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageBlob: Blob | null;
  matchTitle: string;
  onSend: (playerIds: string[], imageBlob: Blob) => Promise<void>;
}

const WhatsAppImageShareModal: React.FC<WhatsAppImageShareModalProps> = ({
  isOpen,
  onClose,
  imageBlob,
  matchTitle,
  onSend
}) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchPlayers();
    }
  }, [isOpen]);

  const fetchPlayers = async () => {
    setLoading(true);
    try {
      const data = await getPlayers();
      setPlayers(data);
    } catch (err) {
      setError('Failed to load players');
    } finally {
      setLoading(false);
    }
  };

  const togglePlayer = (playerId: string) => {
    setSelectedPlayers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(playerId)) {
        newSet.delete(playerId);
      } else {
        newSet.add(playerId);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    setSelectedPlayers(new Set(filteredPlayers.map(p => p._id)));
  };

  const deselectAll = () => {
    setSelectedPlayers(new Set());
  };

  const handleSend = async () => {
    if (!imageBlob || selectedPlayers.size === 0) return;
    
    setSending(true);
    setError(null);
    try {
      await onSend(Array.from(selectedPlayers), imageBlob);
      setSuccess(`Squad image sent to ${selectedPlayers.size} player(s)!`);
      setTimeout(() => {
        onClose();
        setSuccess(null);
        setSelectedPlayers(new Set());
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to send image');
    } finally {
      setSending(false);
    }
  };

  const filteredPlayers = players.filter(player =>
    player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    player.phone.includes(searchTerm)
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-2xl w-full max-w-lg max-h-[85vh] overflow-hidden border border-white/10 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
              <Send className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Share via WhatsApp</h3>
              <p className="text-xs text-slate-400">Select players to send squad image</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Match Info */}
        <div className="px-4 py-3 bg-slate-800/50 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2 text-sm">
            <ImageIcon className="w-4 h-4 text-purple-400" />
            <span className="text-slate-300">Sharing:</span>
            <span className="text-white font-medium">{matchTitle}</span>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mx-4 mt-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 text-sm">
            {success}
          </div>
        )}
        {error && (
          <div className="mx-4 mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Search & Selection Controls */}
        <div className="p-4 space-y-3 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search players..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Users className="w-4 h-4" />
              <span>{selectedPlayers.size} of {filteredPlayers.length} selected</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={selectAll}
                className="px-3 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
              >
                Select All
              </button>
              <button
                onClick={deselectAll}
                className="px-3 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Players List */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-green-400 animate-spin" />
            </div>
          ) : filteredPlayers.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p>No players found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredPlayers.map((player) => {
                const isSelected = selectedPlayers.has(player._id);
                return (
                  <div
                    key={player._id}
                    onClick={() => togglePlayer(player._id)}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-green-500/20 border border-green-500/30'
                        : 'bg-slate-800/50 border border-transparent hover:bg-slate-800'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center ${
                      isSelected ? 'bg-green-500' : 'bg-slate-700 border border-slate-600'
                    }`}>
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{player.name}</p>
                      <p className="text-xs text-slate-400">{player.phone}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 shrink-0">
          <button
            onClick={handleSend}
            disabled={sending || selectedPlayers.size === 0 || !imageBlob}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 disabled:bg-slate-700 disabled:text-slate-400 text-white font-medium rounded-xl transition-colors"
          >
            {sending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Send to {selectedPlayers.size} Player{selectedPlayers.size !== 1 ? 's' : ''}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppImageShareModal;
