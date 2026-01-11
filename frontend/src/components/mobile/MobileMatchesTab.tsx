import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getMatches, getMatch } from '../../services/api';
import { Calendar, MapPin, Users, Clock, ChevronRight, X, CheckCircle, XCircle, HelpCircle } from 'lucide-react';

interface Match {
  _id: string;
  matchId: string;
  date: string;
  time: string;
  slot: string;
  opponent: string;
  ground: string;
  status: string;
  squadStats?: {
    confirmed: number;
    declined: number;
    tentative: number;
    pending: number;
    total: number;
  };
}

const MobileMatchesTab: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed'>('upcoming');

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setLoading(true);
        const data = await getMatches();
        setMatches(data);
      } catch (err) {
        console.error('Error fetching matches:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMatches();
  }, []);

  const handleViewDetail = async (match: Match) => {
    setLoadingDetail(true);
    try {
      const fullMatch = await getMatch(match._id);
      setSelectedMatch(fullMatch);
    } catch (err) {
      console.error('Error fetching match detail:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    return `${h > 12 ? h - 12 : h}:${minutes} ${h >= 12 ? 'PM' : 'AM'}`;
  };

  const isUpcoming = (dateString: string) => {
    return new Date(dateString) >= new Date(new Date().setHours(0, 0, 0, 0));
  };

  const filteredMatches = matches.filter(match => {
    if (filter === 'upcoming') return isUpcoming(match.date);
    if (filter === 'completed') return !isUpcoming(match.date);
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-emerald-500/20 text-emerald-400';
      case 'cancelled': return 'bg-red-500/20 text-red-400';
      case 'completed': return 'bg-blue-500/20 text-blue-400';
      default: return 'bg-slate-500/20 text-slate-400';
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
    <>
      {/* Filter Pills */}
      <div className="flex gap-2 mb-4">
        {(['upcoming', 'completed', 'all'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              filter === f
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-slate-800/50 text-slate-400'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Match List */}
      <div className="space-y-2">
        {filteredMatches.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No {filter} matches</p>
          </div>
        ) : (
          filteredMatches.map((match) => (
            <div
              key={match._id}
              className="bg-slate-800/50 rounded-xl p-3 border border-white/5 active:bg-slate-800/70 transition-colors"
              onClick={() => handleViewDetail(match)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-white text-sm">vs {match.opponent}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${getStatusColor(match.status)}`}>
                      {match.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(match.date)}
                    </span>
                    {match.time && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTime(match.time)}
                      </span>
                    )}
                  </div>
                  {match.squadStats && (
                    <div className="flex items-center gap-2 mt-2 text-xs">
                      <span className="text-emerald-400">✓{match.squadStats.confirmed}</span>
                      <span className="text-red-400">✗{match.squadStats.declined}</span>
                      <span className="text-amber-400">?{match.squadStats.tentative}</span>
                      <span className="text-slate-500">⏳{match.squadStats.pending}</span>
                    </div>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detail Modal */}
      {selectedMatch && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedMatch(null)}>
          <div
            className="absolute bottom-0 left-0 right-0 bg-slate-900 rounded-t-3xl max-h-[85vh] overflow-y-auto animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-slate-900 pt-3 pb-2 px-4 border-b border-white/5">
              <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mb-3" />
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">vs {selectedMatch.opponent}</h3>
                <button onClick={() => setSelectedMatch(null)} className="p-2 text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 space-y-4">
              {/* Match Info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-800/50 rounded-xl p-3">
                  <p className="text-xs text-slate-400 mb-1">Date & Time</p>
                  <p className="text-sm text-white">{formatDate(selectedMatch.date)}</p>
                  {selectedMatch.time && <p className="text-xs text-slate-400">{formatTime(selectedMatch.time)}</p>}
                </div>
                <div className="bg-slate-800/50 rounded-xl p-3">
                  <p className="text-xs text-slate-400 mb-1">Ground</p>
                  <p className="text-sm text-white truncate">{selectedMatch.ground || 'TBD'}</p>
                </div>
              </div>

              {/* Squad List */}
              {selectedMatch.squad && selectedMatch.squad.length > 0 && (
                <div className="bg-slate-800/50 rounded-xl p-4">
                  <p className="text-xs text-slate-400 mb-3">Squad ({selectedMatch.squad.length})</p>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {selectedMatch.squad.map((member: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                        <span className="text-sm text-white">{member.player?.name || 'Unknown'}</span>
                        <span className={`text-xs ${
                          member.response === 'yes' ? 'text-emerald-400' :
                          member.response === 'no' ? 'text-red-400' :
                          member.response === 'tentative' ? 'text-amber-400' : 'text-slate-500'
                        }`}>
                          {member.response === 'yes' ? '✓ Yes' :
                           member.response === 'no' ? '✗ No' :
                           member.response === 'tentative' ? '? Tentative' : '⏳ Pending'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {loadingDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
          <div className="spinner"></div>
        </div>
      )}

      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default MobileMatchesTab;
