import React, { useState, useEffect } from 'react';
import { getPlayers, sendWhatsAppMessage, getUpcomingMatches } from '../../services/api';
import type { Player } from '../../types';
import { Send, Users, Calendar, Check, CheckCheck, RefreshCw, ChevronDown, ChevronUp, MessageCircle } from 'lucide-react';

interface Match {
  _id: string;
  opponent: string;
  date: string;
  time: string;
  ground: string;
}

const MobileWhatsAppTab: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);
  const [showMatchPicker, setShowMatchPicker] = useState(false);
  const [showPlayerPicker, setShowPlayerPicker] = useState(false);
  const [sendResult, setSendResult] = useState<{ sent: number; failed: number } | null>(null);

  const fetchData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      
      const [playersData, matchesData] = await Promise.all([
        getPlayers(),
        getUpcomingMatches()
      ]);
      setPlayers(playersData);
      setMatches(matchesData);
      
      if (matchesData.length > 0 && !selectedMatch) {
        setSelectedMatch(matchesData[0]);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSelectAll = () => {
    if (selectedPlayers.length === players.length) {
      setSelectedPlayers([]);
    } else {
      setSelectedPlayers(players.map(p => p._id));
    }
  };

  const togglePlayer = (playerId: string) => {
    setSelectedPlayers(prev => 
      prev.includes(playerId) 
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      weekday: 'short', month: 'short', day: 'numeric' 
    });
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    return `${h > 12 ? h - 12 : h}:${minutes} ${h >= 12 ? 'PM' : 'AM'}`;
  };

  const handleSendMessage = async () => {
    if (!selectedMatch || selectedPlayers.length === 0) return;
    
    setSending(true);
    setSendResult(null);
    
    try {
      const response = await sendWhatsAppMessage({
        playerIds: selectedPlayers,
        template: {
          name: 'mavericks_team_availability',
          languageCode: 'en',
          components: [
            {
              type: 'body',
              parameters: [
                { type: 'text', text: selectedMatch.ground },
                { type: 'text', text: formatDate(selectedMatch.date) }
              ]
            }
          ]
        },
        matchId: selectedMatch._id
      });
      
      setSendResult({
        sent: response.results?.filter((r: any) => r.status === 'success').length || 0,
        failed: response.results?.filter((r: any) => r.status !== 'success').length || 0
      });
    } catch (err) {
      console.error('Error sending messages:', err);
      setSendResult({ sent: 0, failed: selectedPlayers.length });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-emerald-400" />
          Send Availability Request
        </h2>
        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-medium disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Match Selection */}
      <div className="bg-slate-800/50 rounded-xl border border-white/5 overflow-hidden">
        <button
          onClick={() => setShowMatchPicker(!showMatchPicker)}
          className="w-full flex items-center justify-between p-3"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-left">
              <p className="text-xs text-slate-400">Selected Match</p>
              {selectedMatch ? (
                <p className="text-sm font-medium text-white">
                  vs {selectedMatch.opponent} • {formatDate(selectedMatch.date)}
                </p>
              ) : (
                <p className="text-sm text-slate-500">No match selected</p>
              )}
            </div>
          </div>
          {showMatchPicker ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>
        
        {showMatchPicker && (
          <div className="border-t border-white/5 max-h-[200px] overflow-y-auto">
            {matches.length === 0 ? (
              <p className="p-3 text-xs text-slate-500 text-center">No upcoming matches</p>
            ) : (
              matches.map(match => (
                <button
                  key={match._id}
                  onClick={() => { setSelectedMatch(match); setShowMatchPicker(false); }}
                  className={`w-full p-3 text-left hover:bg-slate-800 transition-colors ${
                    selectedMatch?._id === match._id ? 'bg-emerald-500/10' : ''
                  }`}
                >
                  <p className="text-sm text-white">vs {match.opponent}</p>
                  <p className="text-xs text-slate-400">{formatDate(match.date)} • {match.ground}</p>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Player Selection */}
      <div className="bg-slate-800/50 rounded-xl border border-white/5 overflow-hidden">
        <button
          onClick={() => setShowPlayerPicker(!showPlayerPicker)}
          className="w-full flex items-center justify-between p-3"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-sky-500/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-sky-400" />
            </div>
            <div className="text-left">
              <p className="text-xs text-slate-400">Recipients</p>
              <p className="text-sm font-medium text-white">
                {selectedPlayers.length} of {players.length} players selected
              </p>
            </div>
          </div>
          {showPlayerPicker ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>
        
        {showPlayerPicker && (
          <div className="border-t border-white/5">
            <button
              onClick={handleSelectAll}
              className="w-full p-3 flex items-center justify-between hover:bg-slate-800 transition-colors border-b border-white/5"
            >
              <span className="text-sm text-emerald-400 font-medium">
                {selectedPlayers.length === players.length ? 'Deselect All' : 'Select All'}
              </span>
              {selectedPlayers.length === players.length && <CheckCheck className="w-4 h-4 text-emerald-400" />}
            </button>
            <div className="max-h-[250px] overflow-y-auto">
              {players.map(player => (
                <button
                  key={player._id}
                  onClick={() => togglePlayer(player._id)}
                  className={`w-full p-3 flex items-center justify-between hover:bg-slate-800 transition-colors ${
                    selectedPlayers.includes(player._id) ? 'bg-emerald-500/5' : ''
                  }`}
                >
                  <div>
                    <p className="text-sm text-white text-left">{player.name}</p>
                    <p className="text-xs text-slate-500">{player.phone}</p>
                  </div>
                  {selectedPlayers.includes(player._id) && (
                    <Check className="w-4 h-4 text-emerald-400" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Message Preview */}
      {selectedMatch && (
        <div className="bg-slate-800/30 rounded-xl p-3 border border-white/5">
          <p className="text-xs text-slate-400 mb-2">Message Preview</p>
          <div className="bg-emerald-900/30 rounded-lg p-3 border border-emerald-500/20">
            <p className="text-xs text-emerald-100 leading-relaxed">
              Hi [Player Name],<br/><br/>
              We have an upcoming match scheduled at <strong>{selectedMatch.ground}</strong> on <strong>{formatDate(selectedMatch.date)}</strong>.<br/><br/>
              Are you available for the match?
            </p>
            <div className="flex gap-2 mt-3">
              <span className="px-3 py-1 bg-white/10 rounded-full text-xs text-white">Yes</span>
              <span className="px-3 py-1 bg-white/10 rounded-full text-xs text-white">No</span>
            </div>
          </div>
        </div>
      )}

      {/* Send Result */}
      {sendResult && (
        <div className={`rounded-xl p-3 ${sendResult.failed > 0 ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-emerald-500/10 border border-emerald-500/20'}`}>
          <p className="text-sm font-medium text-white mb-1">Messages Sent</p>
          <p className="text-xs text-slate-300">
            ✓ {sendResult.sent} sent successfully
            {sendResult.failed > 0 && <span className="text-amber-400"> • ✗ {sendResult.failed} failed</span>}
          </p>
        </div>
      )}

      {/* Send Button */}
      <button
        onClick={handleSendMessage}
        disabled={sending || !selectedMatch || selectedPlayers.length === 0}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {sending ? (
          <>
            <div className="spinner w-4 h-4 border-2"></div>
            Sending...
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            Send to {selectedPlayers.length} Player{selectedPlayers.length !== 1 ? 's' : ''}
          </>
        )}
      </button>

      {/* Info Note */}
      <p className="text-xs text-slate-500 text-center">
        Messages will be sent via WhatsApp Business API
      </p>
    </div>
  );
};

export default MobileWhatsAppTab;
