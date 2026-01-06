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
      className="group relative bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-5 hover:bg-slate-800/60 transition-all duration-500 cursor-pointer animate-fade-in shadow-2xl hover:shadow-primary-solid/20 hover:scale-[1.02] active:scale-[0.98] ring-1 ring-white/5 hover:ring-primary-solid/30"
      style={{ animationDelay: `${index * 0.1}s` }}
      onClick={() => onClick(item)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick(item);
        }
      }}
    >
      {/* Decorative Gradient Glow */}
      <div className="absolute -inset-0.5 bg-gradient-to-br from-primary-solid/20 to-accent-info/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm"></div>

      <div className="relative z-10 flex flex-col h-full">
        {/* Header: Avatar, Name, Date and Rating */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-solid to-emerald-600 flex items-center justify-center text-white font-bold text-xl shadow-lg transform group-hover:rotate-6 transition-transform duration-500">
                {item.playerName ? item.playerName.charAt(0).toUpperCase() : '?'}
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-slate-900 rounded-lg flex items-center justify-center ring-2 ring-white/10">
                <div className={`w-2 h-2 rounded-full ${avgRating >= 4 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : avgRating >= 3 ? 'bg-amber-500' : 'bg-rose-500'}`}></div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white group-hover:text-primary-light transition-colors duration-300">
                {item.playerName}
              </h3>
              <p className="text-xs text-slate-400 font-medium tracking-wide">
                {new Date(item.matchDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </p>
            </div>
          </div>
          
          <div className="flex flex-col items-end">
            <div className="px-3 py-1 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md shadow-sm">
              <span className="text-xl font-black bg-gradient-to-r from-primary-light to-emerald-400 bg-clip-text text-transparent">
                {avgRating.toFixed(1)}
              </span>
              <span className="text-[10px] text-slate-500 font-bold ml-1 uppercase">Avg</span>
            </div>
          </div>
        </div>

        {/* Ratings Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <RatingItem label="Batting" value={item.batting} color="text-amber-400" icon={<BattingIcon />} />
          <RatingItem label="Bowling" value={item.bowling} color="text-sky-400" icon={<BowlingIcon />} />
          <RatingItem label="Fielding" value={item.fielding} color="text-emerald-400" icon={<FieldingIcon />} />
          <RatingItem label="Spirit" value={item.teamSpirit} color="text-purple-400" icon={<SpiritIcon />} />
        </div>

        {/* Issues Tags */}
        <div className="flex flex-wrap gap-2 mb-6 min-h-[28px]">
          {Object.entries(item.issues || {}).map(([key, value]) => {
            if (!value) return null;
            const issueColors: Record<string, string> = {
              venue: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
              equipment: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
              timing: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
              umpiring: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
              other: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
            };
            const style = issueColors[key] || issueColors.other;
            return (
              <span key={key} className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg border backdrop-blur-md ${style}`}>
                {key}
              </span>
            );
          })}
        </div>

        {/* Action Footer */}
        <div className="mt-auto pt-4 flex gap-2 border-t border-white/5">
          <button
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 text-xs font-bold text-slate-300 hover:text-white hover:bg-white/10 transition-all duration-300 border border-white/5"
            onClick={(e) => {
              e.stopPropagation();
              onClick(item);
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Review Details
          </button>
          
          {onTrash && (
            <button
              className="w-11 flex items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition-all duration-300 border border-rose-500/20 shadow-lg shadow-rose-500/10"
              onClick={(e) => {
                e.stopPropagation();
                onTrash(item._id);
              }}
              title="Move to Trash"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}

          {onRestore && (
            <button
              className="w-11 flex items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all duration-300 border border-emerald-500/20 shadow-lg shadow-emerald-500/10"
              onClick={(e) => {
                e.stopPropagation();
                onRestore(item._id);
              }}
              title="Restore"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
            </button>
          )}

          {onDelete && (
            <button
              className="w-11 flex items-center justify-center rounded-xl bg-rose-600/20 text-rose-500 hover:bg-rose-600 hover:text-white transition-all duration-300 border border-rose-600/30 shadow-lg"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(item._id);
              }}
              title="Delete Permanently"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const RatingItem = ({ label, value, color, icon }: { label: string; value: number; color: string; icon: React.ReactNode }) => (
  <div className="flex items-center gap-3 p-2 rounded-2xl bg-white/5 border border-white/5 shadow-inner group/item hover:bg-white/10 transition-colors duration-300">
    <div className={`p-2 rounded-xl bg-slate-900/50 ${color} group-hover/item:scale-110 transition-transform duration-300`}>
      {icon}
    </div>
    <div className="flex flex-col">
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter leading-none mb-1">{label}</span>
      <span className="text-sm font-black text-white leading-none">{value.toFixed(1)}</span>
    </div>
  </div>
);

const BattingIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const BowlingIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4.5 17.5l7.5-7.5 7.5 7.5m-15-11l7.5 7.5 7.5-7.5" />
  </svg>
);

const FieldingIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const SpiritIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
);

export default FeedbackCard;
