import React from 'react';
import { 
  Calendar, Clock, MapPin, Users, Trophy, Edit, Trash2, 
  MessageSquare, CheckCircle, XCircle, AlertCircle, Circle,
  Sparkles, Zap, Send
} from 'lucide-react';

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
    locationLink?: string;
    status: 'draft' | 'confirmed' | 'cancelled' | 'completed';
    matchType?: 'practice' | 'tournament' | 'friendly';
    squad?: SquadMember[];
    squadStats?: SquadStats;
    createdBy: {
      name: string;
      email: string;
    };
    createdAt: string;
    notes: string;
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
  onEdit?: (match: any) => void;
  onDelete?: (matchId: string) => void;
  onFeedback?: (match: any) => void;
  onViewAvailability?: (match: any) => void;
  animationDelay?: number;
}

const MatchCard: React.FC<MatchCardProps> = ({
  match,
  onEdit,
  onDelete,
  onFeedback,
  onViewAvailability,
  animationDelay = 0
}) => {
  const getSquadStats = () => {
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
    
    if (match.squadStats) {
      const { total, yes, no, tentative, pending } = match.squadStats;
      const responded = yes + no + tentative;
      const responseRate = total > 0 ? Math.round((responded / total) * 100) : 0;
      return { total, yes, no, tentative, pending, responseRate, responded, isTracking: false };
    }
    
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
    
    return { total: 0, yes: 0, no: 0, tentative: 0, pending: 0, responseRate: 0, responded: 0, isTracking: false };
  };

  const stats = getSquadStats();
  const matchDate = new Date(match.date);
  const isUpcoming = matchDate > new Date();

  const getStatusConfig = () => {
    switch (match.status) {
      case 'confirmed':
        return { 
          bg: 'bg-emerald-500/20', 
          text: 'text-emerald-400', 
          border: 'border-emerald-500/30',
          icon: <CheckCircle className="w-3 h-3" />,
          glow: 'shadow-emerald-500/20'
        };
      case 'draft':
        return { 
          bg: 'bg-amber-500/20', 
          text: 'text-amber-400', 
          border: 'border-amber-500/30',
          icon: <Clock className="w-3 h-3" />,
          glow: 'shadow-amber-500/20'
        };
      case 'cancelled':
        return { 
          bg: 'bg-rose-500/20', 
          text: 'text-rose-400', 
          border: 'border-rose-500/30',
          icon: <XCircle className="w-3 h-3" />,
          glow: 'shadow-rose-500/20'
        };
      case 'completed':
        return { 
          bg: 'bg-violet-500/20', 
          text: 'text-violet-400', 
          border: 'border-violet-500/30',
          icon: <Trophy className="w-3 h-3" />,
          glow: 'shadow-violet-500/20'
        };
      default:
        return { 
          bg: 'bg-slate-500/20', 
          text: 'text-slate-400', 
          border: 'border-slate-500/30',
          icon: <Circle className="w-3 h-3" />,
          glow: ''
        };
    }
  };

  const getMatchTypeConfig = () => {
    switch (match.matchType) {
      case 'tournament':
        return { emoji: '🏆', bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' };
      case 'friendly':
        return { emoji: '🤝', bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' };
      default:
        return { emoji: '🏏', bg: 'bg-slate-500/20', text: 'text-slate-400', border: 'border-slate-500/30' };
    }
  };

  const getSlotDisplay = () => {
    switch (match.slot) {
      case 'morning': return '🌅 Morning';
      case 'evening': return '🌆 Evening';
      case 'night': return '🌙 Night';
      case 'custom': return match.time || 'Custom';
      default: return match.slot;
    }
  };

  const statusConfig = getStatusConfig();
  const matchTypeConfig = getMatchTypeConfig();

  return (
    <div 
      className="group relative bg-slate-800/40 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden transition-all duration-300 hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/5 cursor-pointer"
      onClick={() => onFeedback && onFeedback(match)}
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      {/* Gradient Border Effect on Hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 via-cyan-500/0 to-violet-500/0 group-hover:from-emerald-500/5 group-hover:via-cyan-500/5 group-hover:to-violet-500/5 transition-all duration-500 pointer-events-none" />
      
      {/* Top Gradient Bar */}
      <div className={`h-1 w-full bg-gradient-to-r ${
        match.status === 'confirmed' ? 'from-emerald-500 to-cyan-500' :
        match.status === 'completed' ? 'from-violet-500 to-purple-500' :
        match.status === 'cancelled' ? 'from-rose-500 to-pink-500' :
        'from-amber-500 to-orange-500'
      }`} />

      {/* Header */}
      <div className="p-4 md:p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base md:text-lg font-bold text-white truncate">
                {match.matchId}
              </span>
              {match.availabilitySent && (
                <span className="flex items-center gap-1 px-1.5 py-0.5 bg-cyan-500/20 text-cyan-400 text-[10px] font-medium rounded border border-cyan-500/30">
                  <Send className="w-2.5 h-2.5" />
                </span>
              )}
            </div>
            {match.opponent && (
              <p className="text-sm text-slate-300 truncate">vs {match.opponent}</p>
            )}
          </div>
          
          {/* Status & Type Badges */}
          <div className="flex flex-col items-end gap-1.5 shrink-0 ml-3">
            <span className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
              {statusConfig.icon}
              {match.status.charAt(0).toUpperCase() + match.status.slice(1)}
            </span>
            {match.matchType && (
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium border ${matchTypeConfig.bg} ${matchTypeConfig.text} ${matchTypeConfig.border}`}>
                {matchTypeConfig.emoji} {match.matchType.charAt(0).toUpperCase() + match.matchType.slice(1)}
              </span>
            )}
          </div>
        </div>

        {/* Match Details Grid */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="flex items-center gap-2 px-2.5 py-2 bg-slate-900/50 rounded-lg">
            <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="text-xs text-slate-300 truncate">
              {matchDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          </div>
          <div className="flex items-center gap-2 px-2.5 py-2 bg-slate-900/50 rounded-lg">
            <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-xs text-slate-300 truncate">{getSlotDisplay()}</span>
          </div>
          <div className="flex items-center gap-2 px-2.5 py-2 bg-slate-900/50 rounded-lg col-span-2">
            <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span className="text-xs text-slate-300 truncate">{match.ground}</span>
          </div>
        </div>

        {/* Squad Availability Section */}
        {stats.total > 0 && (
          <div className="bg-slate-900/30 rounded-xl p-3 mb-4 border border-slate-700/30">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs font-medium text-slate-300">
                  {stats.isTracking ? 'Availability' : 'Squad'}
                </span>
              </div>
              <span className="text-[10px] text-slate-500">
                {stats.responded}/{stats.total} ({stats.responseRate}%)
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1.5 bg-slate-700/50 rounded-full overflow-hidden mb-3">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full transition-all duration-700"
                style={{ width: `${stats.responseRate}%` }}
              />
            </div>

            {/* Mini Stats */}
            <div className="grid grid-cols-4 gap-1.5">
              <div className="flex flex-col items-center p-1.5 bg-emerald-500/10 rounded-lg">
                <span className="text-sm font-bold text-emerald-400">{stats.yes}</span>
                <span className="text-[9px] text-slate-500">Yes</span>
              </div>
              <div className="flex flex-col items-center p-1.5 bg-amber-500/10 rounded-lg">
                <span className="text-sm font-bold text-amber-400">{stats.tentative}</span>
                <span className="text-[9px] text-slate-500">Maybe</span>
              </div>
              <div className="flex flex-col items-center p-1.5 bg-rose-500/10 rounded-lg">
                <span className="text-sm font-bold text-rose-400">{stats.no}</span>
                <span className="text-[9px] text-slate-500">No</span>
              </div>
              <div className="flex flex-col items-center p-1.5 bg-slate-500/10 rounded-lg">
                <span className="text-sm font-bold text-slate-400">{stats.pending}</span>
                <span className="text-[9px] text-slate-500">Pending</span>
              </div>
            </div>

            {/* Squad Status */}
            {match.squadStatus && stats.isTracking && (
              <div className="mt-2 flex justify-center">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                  match.squadStatus === 'full' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                  match.squadStatus === 'partial' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                  'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                }`}>
                  <Sparkles className="w-2.5 h-2.5" />
                  Squad: {match.squadStatus.charAt(0).toUpperCase() + match.squadStatus.slice(1)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {onViewAvailability && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewAvailability(match);
              }}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-xs font-medium rounded-lg transition-all border border-cyan-500/20 hover:border-cyan-500/30"
            >
              <Users className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Availability</span>
            </button>
          )}
          {onFeedback && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onFeedback(match);
              }}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-medium rounded-lg transition-all border border-emerald-500/20 hover:border-emerald-500/30"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Details</span>
            </button>
          )}
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(match);
              }}
              className="flex items-center justify-center px-2.5 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-all"
              title="Edit Match"
            >
              <Edit className="w-3.5 h-3.5" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(match._id);
              }}
              className="flex items-center justify-center px-2.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-all"
              title="Delete Match"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MatchCard;
