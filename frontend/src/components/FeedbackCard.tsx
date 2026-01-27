import React from 'react';
import { UserX, Calendar, MapPin, Users } from 'lucide-react';
import { FeedbackSubmission, MatchInfo } from '../types';

interface FeedbackCardProps {
  item: FeedbackSubmission;
  index: number;
  onClick: (item: FeedbackSubmission) => void;
  onTrash?: (id: string) => void;
  onRestore?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const FeedbackCard: React.FC<FeedbackCardProps> = ({ item, index, onClick, onTrash, onRestore, onDelete }) => {
  // Calculate average rating (excluding null/N/A ratings)
  const calculateAverage = (feedback: FeedbackSubmission): number | null => {
    const { batting, bowling, fielding, teamSpirit } = feedback;
    const ratings = [batting, bowling, fielding, teamSpirit].filter((r): r is number => r !== null && r !== undefined);
    if (ratings.length === 0) return null;
    return ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
  };

  const avgRating = calculateAverage(item) ?? 0;

  // Helper to check if matchId is a populated object with match info
  const getMatchInfo = (): MatchInfo | null => {
    if (item.matchId && typeof item.matchId === 'object' && 'opponent' in item.matchId) {
      return item.matchId as MatchInfo;
    }
    return null;
  };

  const matchInfo = getMatchInfo();
  const isMatchFeedback = item.feedbackType === 'match' || matchInfo !== null;

  // Format date for display
  const formatMatchDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div
      key={item._id}
      className="group relative h-full transition-all duration-300 hover:-translate-y-1"
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      {/* Dynamic Background Glow */}
      <div className={`absolute -inset-0.5 rounded-xl opacity-0 blur-lg transition-all duration-500 group-hover:opacity-60 ${
        avgRating >= 4 ? 'bg-emerald-500' : avgRating >= 3 ? 'bg-amber-500' : 'bg-rose-500'
      }`}></div>

      {/* Main Card Container */}
      <div 
        className={`relative h-full flex flex-col overflow-hidden rounded-xl border border-white/5 bg-gradient-to-br from-slate-800/70 to-slate-900/80 backdrop-blur-xl shadow-lg transition-all duration-300 group-hover:border-white/10 group-hover:shadow-2xl sm:p-5 p-4`}
        onClick={() => onClick(item)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            onClick(item);
          }
        }}
      >
        <div className="flex flex-col flex-1">
          {/* Mobile-First Header Section */}
          <div className="sm:hidden">
            <div className="flex items-center justify-between mb-2">
              {/* Player Info */}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="relative flex-shrink-0">
                  {item.isRedacted ? (
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-slate-700/50 shadow-lg">
                      <UserX className="w-5 h-5 text-slate-400" />
                    </div>
                  ) : (
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-black text-sm shadow-lg ${
                      avgRating >= 4 ? 'bg-gradient-to-br from-emerald-400 to-teal-600' :
                      avgRating >= 3 ? 'bg-gradient-to-br from-amber-400 to-orange-600' :
                      'bg-gradient-to-br from-rose-400 to-pink-600'
                    }`}>
                      {item.playerName ? item.playerName.charAt(0).toUpperCase() : '?'}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  {item.isRedacted ? (
                    <span className="inline-flex items-center gap-1 text-sm italic text-slate-400">
                      Anonymous
                    </span>
                  ) : (
                    <h3 className="text-sm font-black text-white tracking-tight leading-tight truncate">
                      {item.playerName}
                    </h3>
                  )}
                  <span className="text-[9px] font-bold text-slate-500 block">
                    {matchInfo ? formatMatchDate(matchInfo.date) : new Date(item.matchDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>

              {/* Mobile Rating Badge */}
              <div className="flex-shrink-0 ml-2">
                <div className={`px-2 py-1 rounded-full text-xs font-black text-white ${
                  avgRating >= 4 ? 'bg-emerald-500' : avgRating >= 3 ? 'bg-amber-500' : 'bg-rose-500'
                }`}>
                  {avgRating.toFixed(1)}
                </div>
              </div>
            </div>

            {/* Mobile Match Info Chips */}
            {matchInfo && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <Users className="w-3 h-3 text-blue-400" />
                  <span className="text-[9px] font-bold text-blue-400">vs {matchInfo.opponent}</span>
                </div>
                <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-pink-500/10 border border-pink-500/20">
                  <MapPin className="w-3 h-3 text-pink-400" />
                  <span className="text-[9px] font-bold text-pink-400 truncate max-w-[100px]">{matchInfo.ground}</span>
                </div>
              </div>
            )}

            {/* Mobile Aggregated Performance Tile */}
            <div className="mb-2">
              <div className="bg-gradient-to-br from-slate-700/40 to-slate-800/60 rounded-xl p-3 border border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Performance</span>
                  <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
                    avgRating >= 4 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                    avgRating >= 3 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                    'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}>
                    {avgRating.toFixed(1)} Avg
                  </span>
                </div>
                
                {/* Performance Bars */}
                <div className="space-y-1.5">
                  {[
                    { label: 'Batting', value: item.batting, color: 'emerald' },
                    { label: 'Bowling', value: item.bowling, color: 'sky' },
                    { label: 'Fielding', value: item.fielding, color: 'amber' },
                    { label: 'Team Spirit', value: item.teamSpirit, color: 'purple' },
                  ].map((metric) => (
                    <div key={metric.label} className="flex items-center gap-2">
                      <span className={`text-[9px] font-bold min-w-[60px] ${
                        metric.value === null ? 'text-slate-500' :
                        metric.color === 'emerald' ? 'text-emerald-400' :
                        metric.color === 'sky' ? 'text-sky-400' :
                        metric.color === 'amber' ? 'text-amber-400' :
                        'text-purple-400'
                      }`}>
                        {metric.label}
                      </span>
                      <div className="flex-1 bg-slate-700/50 rounded-full h-1.5 overflow-hidden">
                        {metric.value !== null ? (
                          <div 
                            className={`h-full rounded-full transition-all duration-1000 ease-out ${
                              metric.color === 'emerald' ? 'bg-emerald-400' :
                              metric.color === 'sky' ? 'bg-sky-400' :
                              metric.color === 'amber' ? 'bg-amber-400' :
                              'bg-purple-400'
                            }`}
                            style={{ width: `${(metric.value / 5) * 100}%` }}
                          ></div>
                        ) : (
                          <div className="h-full w-full bg-slate-600/50 flex items-center justify-center">
                            <span className="text-[6px] text-slate-500">N/A</span>
                          </div>
                        )}
                      </div>
                      <span className={`text-[10px] font-black min-w-[20px] text-right ${
                        metric.value === null ? 'text-slate-500' :
                        metric.color === 'emerald' ? 'text-emerald-400' :
                        metric.color === 'sky' ? 'text-sky-400' :
                        metric.color === 'amber' ? 'text-amber-400' :
                        'text-purple-400'
                      }`}>
                        {metric.value !== null ? metric.value.toFixed(1) : 'N/A'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Mobile Issues */}
            {Object.values(item.issues || {}).some(v => v) && (
              <div className="flex flex-wrap gap-1 mb-2">
                {Object.entries(item.issues || {}).map(([key, value]) => {
                  if (!value) return null;
                  return (
                    <div key={key} className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-600">
                      <span className="text-[7px] font-bold uppercase text-slate-400">{key.charAt(0)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Desktop Header Section */}
          <div className="hidden sm:block">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="relative flex-shrink-0">
                  {item.isRedacted ? (
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-700/50 shadow-lg transform rotate-2 group-hover:rotate-0 transition-transform duration-300">
                      <UserX className="w-5 h-5 text-slate-400" />
                    </div>
                  ) : (
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-base shadow-lg transform rotate-2 group-hover:rotate-0 transition-transform duration-300 ${
                      avgRating >= 4 ? 'bg-gradient-to-br from-emerald-400 to-teal-600' :
                      avgRating >= 3 ? 'bg-gradient-to-br from-amber-400 to-orange-600' :
                      'bg-gradient-to-br from-rose-400 to-pink-600'
                    }`}>
                      {item.playerName ? item.playerName.charAt(0).toUpperCase() : '?'}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  {item.isRedacted ? (
                    <span className="inline-flex items-center gap-1.5 text-base italic text-slate-400">
                      Anonymous Feedback
                    </span>
                  ) : (
                    <h3 className="text-base font-black text-white tracking-tight leading-tight truncate">
                      {item.playerName}
                    </h3>
                  )}
                  <span className="text-xs font-bold text-slate-500 block">
                    {matchInfo ? formatMatchDate(matchInfo.date) : new Date(item.matchDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>

              {/* Desktop Rating Indicator */}
              <div className="flex flex-col items-center flex-shrink-0">
                <div className="relative">
                  <svg className="w-10 h-10 transform -rotate-90">
                    <circle className="text-white/5" cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="2.5" fill="transparent" />
                    <circle
                      className={`${
                        avgRating >= 4 ? 'text-emerald-400' : avgRating >= 3 ? 'text-amber-400' : 'text-rose-400'
                      } transition-all duration-1000 ease-out`}
                      cx="20"
                      cy="20"
                      r="16"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      fill="transparent"
                      strokeDasharray={100.48}
                      strokeDashoffset={100.48 - (100.48 * avgRating) / 5}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-sm font-black text-white leading-none">{avgRating.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop Match Info Chips */}
            {matchInfo && (
              <div className="flex flex-wrap gap-2 mb-3">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <Users className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-xs font-bold text-blue-400">vs {matchInfo.opponent}</span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-pink-500/10 border border-pink-500/20">
                  <MapPin className="w-3.5 h-3.5 text-pink-400" />
                  <span className="text-xs font-bold text-pink-400">{matchInfo.ground}</span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <Calendar className="w-3.5 h-3.5 text-purple-400" />
                  <span className="text-xs font-bold text-purple-400">{formatMatchDate(matchInfo.date)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Desktop Performance Metrics Section */}
          <div className="hidden sm:block mb-3">
            <div className="grid grid-cols-4 gap-2">
              <MetricCard label="Bat" value={item.batting} icon={<BattingIcon />} color="emerald" />
              <MetricCard label="Bowl" value={item.bowling} icon={<BowlingIcon />} color="sky" />
              <MetricCard label="Field" value={item.fielding} icon={<FieldingIcon />} color="amber" />
              <MetricCard label="Spirit" value={item.teamSpirit} icon={<SpiritIcon />} color="purple" />
            </div>
          </div>

          {/* Desktop Issues */}
          <div className="hidden sm:block">
            {Object.values(item.issues || {}).some(v => v) && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {Object.entries(item.issues || {}).map(([key, value]) => {
                  if (!value) return null;
                  return (
                    <div key={key} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-900/50 border border-white/5">
                      <span className="text-[8px] font-bold uppercase text-slate-400">{key.charAt(0)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-auto flex items-center gap-2 pt-3 border-t border-white/5">
            <button
              className="flex-1 group/btn relative flex items-center justify-center gap-1.5 py-2 rounded-lg overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              onClick={(e) => { e.stopPropagation(); onClick(item); }}
            >
              <div className="absolute inset-0 bg-white/[0.03] group-hover/btn:bg-white/[0.08] transition-all duration-300"></div>
              
              <svg className="w-4 h-4 text-slate-400 group-hover/btn:text-white transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span className="relative z-10 text-[10px] font-bold uppercase tracking-wider text-slate-400 group-hover/btn:text-white transition-colors">View</span>
            </button>

            <div className="flex gap-1.5">
              {onTrash && <CompactActionButton onClick={onTrash} id={item._id} icon={<TrashIcon />} color="rose" title="Archive" />}
              {onRestore && <CompactActionButton onClick={onRestore} id={item._id} icon={<RestoreIcon />} color="emerald" title="Restore" />}
              {onDelete && <CompactActionButton onClick={onDelete} id={item._id} icon={<TrashIcon />} color="rose" title="Delete" />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ label, value, icon, color, compact = false }: { label: string; value: number | null; icon: React.ReactNode; color: string; compact?: boolean }) => {
  const colorMap: Record<string, string> = {
    emerald: 'text-emerald-400 bg-emerald-400/10',
    sky: 'text-sky-400 bg-sky-400/10',
    amber: 'text-amber-400 bg-amber-400/10',
    purple: 'text-purple-400 bg-purple-400/10'
  };
  const style = value !== null ? colorMap[color] : 'text-slate-500 bg-slate-500/10';

  if (compact) {
    return (
      <div className="flex flex-col items-center gap-0.5 p-1 rounded bg-slate-900/30 border border-white/5">
        <div className="p-0.5 rounded ${style}" style={{ fontSize: '8px' }}>
          {icon}
        </div>
        <span className={`font-black text-[9px] leading-none ${value !== null ? 'text-white' : 'text-slate-500'}`}>
          {value !== null ? value.toFixed(1) : 'N/A'}
        </span>
        <span className="font-bold uppercase text-slate-500 text-[6px] leading-none">{label}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-slate-900/30 border border-white/5">
      <div className="p-1.5 rounded-lg ${style}">
        {icon}
      </div>
      <span className={`font-black text-xs leading-none ${value !== null ? 'text-white' : 'text-slate-500'}`}>
        {value !== null ? value.toFixed(1) : 'N/A'}
      </span>
      <span className="font-bold uppercase text-slate-500 text-[8px] leading-none">{label}</span>
    </div>
  );
};

const CompactActionButton = ({ onClick, id, icon, color, title }: { onClick: (id: string) => void; id: string; icon: React.ReactNode; color: string; title: string }) => (
  <button
    className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-all duration-300 hover:scale-110 active:scale-95 ${
      color === 'rose' ? 
      'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white' : 
      'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white'
    }`}
    onClick={(e) => { e.stopPropagation(); onClick(id); }}
    title={title}
  >
    {icon}
  </button>
);

const BattingIcon = () => <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
const BowlingIcon = () => <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4.5 17.5l7.5-7.5 7.5 7.5m-15-11l7.5 7.5 7.5-7.5" /></svg>;
const FieldingIcon = () => <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
const SpiritIcon = () => <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>;
const TrashIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const RestoreIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>;

export default FeedbackCard;
