import React from 'react';
import { FeedbackSubmission } from '../types';

interface FeedbackCardProps {
  item: FeedbackSubmission;
  index: number;
  onClick: (item: FeedbackSubmission) => void;
  onTrash?: (id: string) => void;
  onRestore?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const FeedbackCard: React.FC<FeedbackCardProps> = ({ item, index, onClick, onTrash, onRestore, onDelete }) => {
  // Calculate average rating
  const calculateAverage = (feedback: FeedbackSubmission): number => {
    const { batting, bowling, fielding, teamSpirit } = feedback;
    const sum = batting + bowling + fielding + teamSpirit;
    return sum / 4;
  };

  const avgRating = calculateAverage(item);

  return (
    <div
      key={item._id}
      className="group relative h-full transition-all duration-500 hover:-translate-y-2"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {/* Dynamic Background Glow */}
      <div className={`absolute -inset-1 rounded-[2rem] opacity-0 blur-xl transition-all duration-700 group-hover:opacity-40 ${
        avgRating >= 4 ? 'bg-emerald-500' : avgRating >= 3 ? 'bg-amber-500' : 'bg-rose-500'
      }`}></div>

      {/* Main Card Container */}
      <div 
        className="relative h-full flex flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-[#0f172a]/80 backdrop-blur-2xl transition-all duration-500 group-hover:border-white/20 group-hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
        onClick={() => onClick(item)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            onClick(item);
          }
        }}
      >
        {/* Top Accent Bar */}
        <div className={`h-1 w-full transition-all duration-500 ${
          avgRating >= 4 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 
          avgRating >= 3 ? 'bg-gradient-to-r from-amber-500 to-orange-400' : 
          'bg-gradient-to-r from-rose-500 to-pink-400'
        } opacity-50 group-hover:opacity-100`}></div>

        <div className="flex flex-col p-6 flex-1">
          {/* Header Section */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-2xl transform rotate-3 group-hover:rotate-0 transition-transform duration-500 ${
                  avgRating >= 4 ? 'bg-gradient-to-br from-emerald-400 to-teal-600 shadow-emerald-500/20' : 
                  avgRating >= 3 ? 'bg-gradient-to-br from-amber-400 to-orange-600 shadow-amber-500/20' : 
                  'bg-gradient-to-br from-rose-400 to-pink-600 shadow-rose-500/20'
                }`}>
                  {item.playerName ? item.playerName.charAt(0).toUpperCase() : '?'}
                  {/* Subtle inner glass effect */}
                  <div className="absolute inset-0.5 rounded-[1.1rem] bg-gradient-to-br from-white/20 to-transparent opacity-50"></div>
                </div>
                <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-slate-950 border-2 border-white/10 flex items-center justify-center shadow-lg">
                  <div className={`w-2.5 h-2.5 rounded-full ${
                    avgRating >= 4 ? 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]' : 
                    avgRating >= 3 ? 'bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.8)]' : 
                    'bg-rose-400 shadow-[0_0_12px_rgba(251,113,133,0.8)]'
                  }`}></div>
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-black text-white tracking-tight leading-none mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-white/70 transition-all duration-300">
                  {item.playerName}
                </h3>
                <div className="flex items-center gap-3">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                    Player Entry
                  </span>
                  <div className="w-1 h-1 rounded-full bg-slate-700"></div>
                  <span className="text-xs font-bold text-slate-500">
                    {new Date(item.matchDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>

            {/* Premium Rating Indicator */}
            <div className="flex flex-col items-center">
              <div className="relative group/rating">
                <svg className="w-20 h-20 transform -rotate-90">
                  <circle cx="40" cy="40" r="34" stroke="currentColor" strokeWidth="5" fill="transparent" className="text-white/5" />
                  <circle
                    cx="40"
                    cy="40"
                    r="34"
                    stroke="currentColor"
                    strokeWidth="5"
                    fill="transparent"
                    strokeDasharray={213.6}
                    strokeDashoffset={213.6 - (213.6 * avgRating) / 5}
                    className={`${
                      avgRating >= 4 ? 'text-emerald-400' : avgRating >= 3 ? 'text-amber-400' : 'text-rose-400'
                    } transition-all duration-1500 ease-out drop-shadow-[0_0_8px_rgba(currentColor,0.5)]`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pt-1">
                  <span className="text-2xl font-black text-white leading-none">{avgRating.toFixed(1)}</span>
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 mt-0.5">Rating</span>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Architecture Section */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-white/10"></div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Performance Metrics</span>
              <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-white/10"></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <MetricCard label="Batting" value={item.batting} icon={<BattingIcon />} color="emerald" />
              <MetricCard label="Bowling" value={item.bowling} icon={<BowlingIcon />} color="sky" />
              <MetricCard label="Fielding" value={item.fielding} icon={<FieldingIcon />} color="amber" />
              <MetricCard label="Spirit" value={item.teamSpirit} icon={<SpiritIcon />} color="purple" />
            </div>
          </div>

          {/* Alert Signals (Issues) */}
          <div className="flex flex-wrap gap-2.5 mb-8">
            {Object.entries(item.issues || {}).map(([key, value]) => {
              if (!value) return null;
              return (
                <div key={key} className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-900/50 border border-white/5 hover:border-white/20 transition-all duration-300 group/tag">
                  <div className={`w-2 h-2 rounded-full group-hover:scale-125 transition-transform duration-300 ${
                    key === 'venue' ? 'bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.6)]' : 
                    key === 'equipment' ? 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.6)]' : 
                    'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                  }`}></div>
                  <span className="text-[11px] font-black uppercase tracking-widest text-slate-300">{key}</span>
                </div>
              );
            })}
          </div>

          {/* Premium Action Suite */}
          <div className="mt-auto flex items-center gap-4 pt-8 border-t border-white/5">
            <button
              className="flex-1 group/btn relative flex items-center justify-center gap-3 py-4 rounded-[1.5rem] overflow-hidden transition-all duration-500 hover:scale-[1.02] active:scale-[0.98]"
              onClick={(e) => { e.stopPropagation(); onClick(item); }}
            >
              {/* Button Glass Background */}
              <div className="absolute inset-0 bg-white/[0.03] group-hover/btn:bg-white/[0.08] transition-all duration-300"></div>
              <div className="absolute inset-0 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-[-20deg] -translate-x-[150%] group-hover/btn:translate-x-[150%] duration-1000"></div>
              
              <svg className="w-5 h-5 text-slate-400 group-hover/btn:text-white group-hover/btn:scale-110 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span className="relative z-10 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover/btn:text-white transition-colors">Analytical Details</span>
            </button>

            <div className="flex gap-2">
              {onTrash && <PremiumActionButton onClick={onTrash} id={item._id} icon={<TrashIcon />} color="rose" title="Archive Entry" />}
              {onRestore && <PremiumActionButton onClick={onRestore} id={item._id} icon={<RestoreIcon />} color="emerald" title="Restore Entry" />}
              {onDelete && <PremiumActionButton onClick={onDelete} id={item._id} icon={<TrashIcon />} color="rose" title="Purge Permanently" />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) => {
  const colorMap: Record<string, string> = {
    emerald: 'text-emerald-400 bg-emerald-400/5 border-emerald-400/10 group-hover:bg-emerald-400/10 group-hover:border-emerald-400/20',
    sky: 'text-sky-400 bg-sky-400/5 border-sky-400/10 group-hover:bg-sky-400/10 group-hover:border-sky-400/20',
    amber: 'text-amber-400 bg-amber-400/5 border-amber-400/10 group-hover:bg-amber-400/10 group-hover:border-amber-400/20',
    purple: 'text-purple-400 bg-purple-400/5 border-purple-400/10 group-hover:bg-purple-400/10 group-hover:border-purple-400/20'
  };
  const style = colorMap[color];

  return (
    <div className={`flex flex-col gap-3 p-4 rounded-3xl bg-slate-900/30 border border-white/5 transition-all duration-500 hover:shadow-xl hover:shadow-black/20 group/metric`}>
      <div className="flex items-center justify-between">
        <div className={`p-2.5 rounded-xl border ${style} transition-all duration-500 group-hover/metric:scale-110 group-hover/metric:rotate-3`}>
          {icon}
        </div>
        <span className="text-lg font-black text-white group-hover/metric:scale-110 transition-transform duration-300">{value.toFixed(1)}</span>
      </div>
      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">{label}</span>
    </div>
  );
};

const PremiumActionButton = ({ onClick, id, icon, color, title }: { onClick: (id: string) => void; id: string; icon: React.ReactNode; color: string; title: string }) => (
  <button
    className={`w-14 h-14 flex items-center justify-center rounded-[1.25rem] border-2 transition-all duration-500 hover:scale-110 active:scale-95 ${
      color === 'rose' ? 
      'bg-rose-500/5 border-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white hover:shadow-[0_0_30px_rgba(244,63,94,0.4)]' : 
      'bg-emerald-500/5 border-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white hover:shadow-[0_0_30px_rgba(16,185,129,0.4)]'
    }`}
    onClick={(e) => { e.stopPropagation(); onClick(id); }}
    title={title}
  >
    {icon}
  </button>
);

const BattingIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
const BowlingIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4.5 17.5l7.5-7.5 7.5 7.5m-15-11l7.5 7.5 7.5-7.5" /></svg>;
const FieldingIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
const SpiritIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>;
const TrashIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const RestoreIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>;

export default FeedbackCard;
