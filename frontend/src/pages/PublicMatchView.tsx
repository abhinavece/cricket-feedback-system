import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Calendar, Clock, MapPin, Users, CheckCircle, XCircle, AlertCircle, Circle, Eye, Share2 } from 'lucide-react';
import axios from 'axios';

interface AvailabilityRecord {
  _id: string;
  playerName: string;
  playerPhone: string;
  response: 'yes' | 'no' | 'tentative' | 'pending' | null;
  respondedAt: string;
}

interface MatchData {
  _id: string;
  matchId: string;
  opponent: string;
  date: string;
  time: string;
  slot: string;
  ground: string;
  status: string;
  teamName: string;
  availabilitySent: boolean;
  statistics: {
    totalPlayers: number;
    responded: number;
    available: number;
    unavailable: number;
    tentative: number;
    pending: number;
  };
}

interface PublicData {
  type: string;
  viewType: string;
  match: MatchData;
  availabilities: AvailabilityRecord[];
  squad: {
    available: AvailabilityRecord[];
    tentative: AvailabilityRecord[];
    unavailable: AvailabilityRecord[];
    pending: AvailabilityRecord[];
  };
}

const PublicMatchView: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<PublicData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // REACT_APP_API_URL already includes /api, so we just append /public/token
        const apiUrl = process.env.REACT_APP_API_URL || '';
        const response = await axios.get(`${apiUrl}/public/${token}`);
        
        if (response.data.success) {
          setData(response.data.data);
        } else {
          setError(response.data.error || 'Failed to load data');
        }
      } catch (err: any) {
        if (err.response?.status === 404) {
          setError('This link is invalid or has been removed');
        } else if (err.response?.status === 410) {
          setError('This link has expired');
        } else {
          setError('Failed to load match data');
        }
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchData();
    }
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading match details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-8 max-w-md w-full text-center border border-white/10">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Link Not Available</h1>
          <p className="text-slate-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { match, squad } = data;
  const matchDate = new Date(match.date);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 py-6 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-full flex items-center justify-center">
              <span className="text-white text-xl font-bold">M</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              {match.teamName || 'Mavericks XI'}
            </h1>
          </div>
          <p className="text-center text-emerald-100 text-sm">Squad Availability</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        {/* Match Info Card */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-4 mb-4">
              <span className="text-xl md:text-2xl font-bold text-emerald-400">
                {match.teamName || 'Mavericks XI'}
              </span>
              <span className="px-4 py-2 bg-slate-700/50 rounded-full text-slate-300 font-medium">
                VS
              </span>
              <span className="text-xl md:text-2xl font-bold text-rose-400">
                {match.opponent || 'TBD'}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-4 md:gap-8 text-sm">
            <div className="flex items-center gap-2 text-slate-300">
              <Calendar className="w-4 h-4 text-blue-400" />
              <span>{formatDate(matchDate)}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Clock className="w-4 h-4 text-purple-400" />
              <span>{match.slot || match.time}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <MapPin className="w-4 h-4 text-pink-400" />
              <span>{match.ground}</span>
            </div>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-center">
            <p className="text-2xl md:text-3xl font-bold text-emerald-400">{squad.available.length}</p>
            <p className="text-xs text-slate-400 mt-1">Available</p>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-center">
            <p className="text-2xl md:text-3xl font-bold text-amber-400">{squad.tentative.length}</p>
            <p className="text-xs text-slate-400 mt-1">Tentative</p>
          </div>
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 text-center">
            <p className="text-2xl md:text-3xl font-bold text-rose-400">{squad.unavailable.length}</p>
            <p className="text-xs text-slate-400 mt-1">Unavailable</p>
          </div>
          <div className="bg-slate-500/10 border border-slate-500/30 rounded-xl p-4 text-center">
            <p className="text-2xl md:text-3xl font-bold text-slate-400">{squad.pending.length}</p>
            <p className="text-xs text-slate-400 mt-1">Pending</p>
          </div>
        </div>

        {/* Squad Lists */}
        <div className="grid md:grid-cols-3 gap-4">
          {/* Available */}
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl overflow-hidden">
            <div className="bg-emerald-500/20 px-4 py-3 border-b border-emerald-500/30">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <span className="font-semibold text-emerald-400">Available ({squad.available.length})</span>
              </div>
            </div>
            <div className="p-3 space-y-2 max-h-80 overflow-y-auto">
              {squad.available.map((player, idx) => (
                <div key={player._id} className="bg-slate-800/50 rounded-lg px-3 py-2">
                  <p className="text-white font-medium text-sm">{idx + 1}. {player.playerName}</p>
                </div>
              ))}
              {squad.available.length === 0 && (
                <p className="text-slate-500 text-center py-4 text-sm">No confirmed players</p>
              )}
            </div>
          </div>

          {/* Tentative */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl overflow-hidden">
            <div className="bg-amber-500/20 px-4 py-3 border-b border-amber-500/30">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-400" />
                <span className="font-semibold text-amber-400">Tentative ({squad.tentative.length})</span>
              </div>
            </div>
            <div className="p-3 space-y-2 max-h-80 overflow-y-auto">
              {squad.tentative.map((player, idx) => (
                <div key={player._id} className="bg-slate-800/50 rounded-lg px-3 py-2">
                  <p className="text-white font-medium text-sm">{idx + 1}. {player.playerName}</p>
                </div>
              ))}
              {squad.tentative.length === 0 && (
                <p className="text-slate-500 text-center py-4 text-sm">No tentative players</p>
              )}
            </div>
          </div>

          {/* Not Available */}
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl overflow-hidden">
            <div className="bg-rose-500/20 px-4 py-3 border-b border-rose-500/30">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-400" />
                <span className="font-semibold text-rose-400">Not Available ({squad.unavailable.length})</span>
              </div>
            </div>
            <div className="p-3 space-y-2 max-h-80 overflow-y-auto">
              {squad.unavailable.map((player, idx) => (
                <div key={player._id} className="bg-slate-800/50 rounded-lg px-3 py-2">
                  <p className="text-white font-medium text-sm">{idx + 1}. {player.playerName}</p>
                </div>
              ))}
              {squad.unavailable.length === 0 && (
                <p className="text-slate-500 text-center py-4 text-sm">No declined players</p>
              )}
            </div>
          </div>
        </div>

        {/* Pending Section */}
        {squad.pending.length > 0 && (
          <div className="bg-slate-700/30 border border-slate-600/30 rounded-xl overflow-hidden">
            <div className="bg-slate-700/50 px-4 py-3 border-b border-slate-600/30">
              <div className="flex items-center gap-2">
                <Circle className="w-5 h-5 text-slate-400" />
                <span className="font-semibold text-slate-400">Awaiting Response ({squad.pending.length})</span>
              </div>
            </div>
            <div className="p-3">
              <div className="flex flex-wrap gap-2">
                {squad.pending.map((player) => (
                  <span key={player._id} className="bg-slate-800/50 rounded-full px-3 py-1 text-sm text-slate-300">
                    {player.playerName}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center py-4">
          <p className="text-xs text-slate-500">
            🏏 {match.teamName || 'Mavericks XI'} • Shared publicly
          </p>
        </div>
      </div>
    </div>
  );
};

export default PublicMatchView;
