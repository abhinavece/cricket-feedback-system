import React from 'react';
// @ts-ignore
import { Calendar, Clock, MapPin, Users, Trophy, Edit, Trash2, Eye } from 'lucide-react';

interface SquadMember {
  player: {
    _id: string;
    name: string;
    phone: string;
    role: string;
    team: string;
  };
  response: 'yes' | 'no' | 'tentative' | 'pending';
  respondedAt: string | null;
  notes: string;
}

interface SquadStats {
  total: number;
  yes: number;
  no: number;
  tentative: number;
  pending: number;
}

interface MatchCardProps {
  match: {
    _id: string;
    matchId: string;
    cricHeroesMatchId: string;
    date: string;
    time: string;
    slot: string;
    opponent: string;
    ground: string;
    status: 'draft' | 'confirmed' | 'cancelled' | 'completed';
    squad?: SquadMember[]; // Optional - only present in full endpoint
    squadStats?: SquadStats; // Pre-computed stats from summary endpoint
    createdBy: {
      name: string;
      email: string;
    };
    createdAt: string;
    notes: string;
    // Availability tracking fields
    availabilitySent?: boolean;
    availabilitySentAt?: string;
    totalPlayersRequested?: number;
    confirmedPlayers?: number;
    declinedPlayers?: number;
    tentativePlayers?: number;
    noResponsePlayers?: number;
    lastAvailabilityUpdate?: string;
    squadStatus?: 'pending' | 'partial' | 'full';
  };
  onEdit: (match: any) => void;
  onDelete: (matchId: string) => void;
  onView: (match: any) => void;
  onManageSquad: (match: any) => void;
  onViewAvailability?: (match: any) => void;
}

const MatchCard: React.FC<MatchCardProps> = ({
  match,
  onEdit,
  onDelete,
  onView,
  onManageSquad,
  onViewAvailability
}) => {
  const getSquadStats = () => {
    // Priority 1: Use availability tracking fields if available
    if (match.availabilitySent && match.totalPlayersRequested) {
      const total = match.totalPlayersRequested || 0;
      const yes = match.confirmedPlayers || 0;
      const no = match.declinedPlayers || 0;
      const tentative = match.tentativePlayers || 0;
      const pending = match.noResponsePlayers || 0;
      const responded = yes + no + tentative;
      const responseRate = total > 0 ? Math.round((responded / total) * 100) : 0;

      return { total, yes, no, tentative, pending, responseRate, responded, isTracking: true };
    }
    
    // Priority 2: Use pre-computed squadStats from summary endpoint
    if (match.squadStats) {
      const { total, yes, no, tentative, pending } = match.squadStats;
      const responded = yes + no + tentative;
      const responseRate = total > 0 ? Math.round((responded / total) * 100) : 0;
      return { total, yes, no, tentative, pending, responseRate, responded, isTracking: false };
    }
    
    // Priority 3: Compute from squad array (full endpoint)
    if (match.squad && match.squad.length > 0) {
      const total = match.squad.length;
      const yes = match.squad.filter(s => s.response === 'yes').length;
      const no = match.squad.filter(s => s.response === 'no').length;
      const tentative = match.squad.filter(s => s.response === 'tentative').length;
      const pending = match.squad.filter(s => s.response === 'pending').length;
      const responded = yes + no + tentative;
      const responseRate = total > 0 ? Math.round((responded / total) * 100) : 0;

      return { total, yes, no, tentative, pending, responseRate, responded, isTracking: false };
    }
    
    // Fallback: No data available
    return { total: 0, yes: 0, no: 0, tentative: 0, pending: 0, responseRate: 0, responded: 0, isTracking: false };
  };

  const stats = getSquadStats();
  const matchDate = new Date(match.date);
  const isUpcoming = matchDate > new Date();
  const isPast = matchDate < new Date();

  const getStatusColor = () => {
    switch (match.status) {
      case 'confirmed': return 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30';
      case 'draft': return 'text-amber-400 bg-amber-500/20 border-amber-500/30';
      case 'cancelled': return 'text-rose-400 bg-rose-500/20 border-rose-500/30';
      case 'completed': return 'text-slate-400 bg-slate-500/20 border-slate-500/30';
      default: return 'text-slate-400 bg-slate-500/20 border-slate-500/30';
    }
  };

  const getSlotDisplay = () => {
    switch (match.slot) {
      case 'morning': return 'Morning';
      case 'evening': return 'Evening';
      case 'night': return 'Night';
      case 'custom': return match.time || 'Custom';
      default: return match.slot;
    }
  };

  return (
    <div 
      className="group relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden transition-all duration-300 hover:border-white/20 hover:shadow-xl hover:shadow-black/20 cursor-pointer"
      onClick={() => onView(match)}
    >
      {/* Status Badge */}
      <div className="absolute top-4 right-4 z-10">
        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor()}`}>
          {match.status.charAt(0).toUpperCase() + match.status.slice(1)}
        </span>
      </div>

      {/* Header */}
      <div className="p-6 border-b border-white/5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-5 h-5 text-emerald-400" />
              <span className="text-lg font-black text-white">{match.matchId}</span>
            </div>
            {match.opponent && (
              <p className="text-slate-300 font-medium">vs {match.opponent}</p>
            )}
          </div>
        </div>

        {/* Match Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-slate-400">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">{matchDate.toLocaleDateString('en-US', { 
              weekday: 'short', 
              month: 'short', 
              day: 'numeric' 
            })}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <Clock className="w-4 h-4" />
            <span className="text-sm">{getSlotDisplay()}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <MapPin className="w-4 h-4" />
            <span className="text-sm truncate">{match.ground}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <Users className="w-4 h-4" />
            <span className="text-sm">{stats.total} Players</span>
          </div>
        </div>
      </div>

      {/* Squad Stats */}
      <div className="p-6">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-300">
                {stats.isTracking ? 'Availability Tracking' : 'Squad Availability'}
              </span>
              {match.availabilitySent && (
                <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs font-bold rounded-full border border-blue-500/30">
                  📤 Sent
                </span>
              )}
            </div>
            <span className="text-xs text-slate-500">
              {stats.responded}/{stats.total} Responded ({stats.responseRate}%)
            </span>
          </div>
          
          {/* Availability Sent Info */}
          {match.availabilitySent && match.availabilitySentAt && (
            <div className="mb-2 text-xs text-slate-400">
              Sent {new Date(match.availabilitySentAt).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          )}
          
          {/* Progress Bar */}
          <div className="w-full bg-slate-700/50 rounded-full h-2 mb-3 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full transition-all duration-500"
              style={{ width: `${stats.responseRate}%` }}
            ></div>
          </div>

          {/* Mobile: Compact stats */}
          <div className="sm:hidden space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
              <span className="text-xs text-emerald-400 font-medium min-w-[50px]">Yes {stats.yes}</span>
              <div className="flex-1 bg-slate-700/50 rounded-full h-1.5 overflow-hidden">
                <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${stats.total > 0 ? (stats.yes / stats.total) * 100 : 0}%` }}></div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-400"></div>
              <span className="text-xs text-amber-400 font-medium min-w-[50px]">Maybe {stats.tentative}</span>
              <div className="flex-1 bg-slate-700/50 rounded-full h-1.5 overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full" style={{ width: `${stats.total > 0 ? (stats.tentative / stats.total) * 100 : 0}%` }}></div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-rose-400"></div>
              <span className="text-xs text-rose-400 font-medium min-w-[50px]">No {stats.no}</span>
              <div className="flex-1 bg-slate-700/50 rounded-full h-1.5 overflow-hidden">
                <div className="h-full bg-rose-400 rounded-full" style={{ width: `${stats.total > 0 ? (stats.no / stats.total) * 100 : 0}%` }}></div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-slate-400"></div>
              <span className="text-xs text-slate-400 font-medium min-w-[50px]">Pending {stats.pending}</span>
              <div className="flex-1 bg-slate-700/50 rounded-full h-1.5 overflow-hidden">
                <div className="h-full bg-slate-400 rounded-full" style={{ width: `${stats.total > 0 ? (stats.pending / stats.total) * 100 : 0}%` }}></div>
              </div>
            </div>
          </div>

          {/* Desktop: Stats Grid */}
          <div className="hidden sm:grid grid-cols-4 gap-2 text-center">
            <div className="bg-emerald-500/10 rounded-lg p-2">
              <div className="text-lg font-black text-emerald-400">{stats.yes}</div>
              <div className="text-xs text-slate-400">✅ Yes</div>
            </div>
            <div className="bg-amber-500/10 rounded-lg p-2">
              <div className="text-lg font-black text-amber-400">{stats.tentative}</div>
              <div className="text-xs text-slate-400">⏳ Maybe</div>
            </div>
            <div className="bg-rose-500/10 rounded-lg p-2">
              <div className="text-lg font-black text-rose-400">{stats.no}</div>
              <div className="text-xs text-slate-400">❌ No</div>
            </div>
            <div className="bg-slate-500/10 rounded-lg p-2">
              <div className="text-lg font-black text-slate-400">{stats.pending}</div>
              <div className="text-xs text-slate-400">⚪ Pending</div>
            </div>
          </div>
          
          {/* Squad Status Badge */}
          {match.squadStatus && stats.isTracking && (
            <div className="mt-3 text-center">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                match.squadStatus === 'full' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                match.squadStatus === 'partial' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                'bg-slate-500/20 text-slate-400 border border-slate-500/30'
              }`}>
                Squad: {match.squadStatus.charAt(0).toUpperCase() + match.squadStatus.slice(1)}
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {onViewAvailability && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewAvailability(match);
              }}
              className="flex-1 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-sm font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-1"
              title="View Availability Dashboard"
            >
              <Users className="w-3.5 h-3.5" />
              Availability
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onView(match);
            }}
            className="flex-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-1"
          >
            <Eye className="w-3.5 h-3.5" />
            View
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onManageSquad(match);
            }}
            className="flex-1 px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-sm font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-1"
          >
            <Users className="w-3.5 h-3.5" />
            Squad
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(match);
            }}
            className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-all duration-200"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(match._id);
            }}
            className="px-3 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 text-sm font-medium rounded-lg transition-all duration-200"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Hover Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
    </div>
  );
};

export default MatchCard;
