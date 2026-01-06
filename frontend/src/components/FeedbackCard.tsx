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
      className="group relative h-full transition-all duration-300 hover:-translate-y-1"
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      {/* Dynamic Background Glow */}
      <div className={`absolute -inset-0.5 rounded-xl opacity-0 blur-lg transition-all duration-500 group-hover:opacity-30 ${
        avgRating >= 4 ? 'bg-emerald-500' : avgRating >= 3 ? 'bg-amber-500' : 'bg-rose-500'
      }`}></div>

      {/* Main Card Container */}
      <div 
        className="relative h-full flex flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0f172a]/90 backdrop-blur-xl transition-all duration-300 group-hover:border-white/20 group-hover:shadow-lg"
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
        <div className={`h-0.5 w-full transition-all duration-300 ${
          avgRating >= 4 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 
          avgRating >= 3 ? 'bg-gradient-to-r from-amber-500 to-orange-400' : 
          'bg-gradient-to-r from-rose-500 to-pink-400'
        } opacity-60 group-hover:opacity-100`}></div>

        <div className="flex flex-col p-3 sm:p-4 flex-1">
          {/* Header Section */}
          <div className="flex items-start justify-between mb-3 sm:mb-4">
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <div className="relative flex-shrink-0">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center text-white font-black text-lg sm:text-xl shadow-lg transform rotate-2 group-hover:rotate-0 transition-transform duration-300 ${
                  avgRating >= 4 ? 'bg-gradient-to-br from-emerald-400 to-teal-600' : 
                  avgRating >= 3 ? 'bg-gradient-to-br from-amber-400 to-orange-600' : 
                  'bg-gradient-to-br from-rose-400 to-pink-600'
                }`}>
                  {item.playerName ? item.playerName.charAt(0).toUpperCase() : '?'}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight leading-tight mb-1 truncate">
                  {item.playerName}
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-500">
                    {new Date(item.matchDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>

            {/* Compact Rating Indicator */}
            <div className="flex flex-col items-center flex-shrink-0">
              <div className="relative">
                <svg className="w-12 h-12 sm:w-14 sm:h-14 transform -rotate-90">
                  <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="3" fill="transparent" className="text-white/5" />
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="transparent"
                    strokeDasharray={125.6}
                    strokeDashoffset={125.6 - (125.6 * avgRating) / 5}
                    className={`${
                      avgRating >= 4 ? 'text-emerald-400' : avgRating >= 3 ? 'text-amber-400' : 'text-rose-400'
                    } transition-all duration-1000 ease-out`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-base sm:text-lg font-black text-white leading-none">{avgRating.toFixed(1)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Metrics Section */}
          <div className="mb-3 sm:mb-4">
            <div className="grid grid-cols-4 gap-2">
              <MetricCard label="Bat" value={item.batting} icon={<BattingIcon />} color="emerald" />
              <MetricCard label="Bowl" value={item.bowling} icon={<BowlingIcon />} color="sky" />
              <MetricCard label="Field" value={item.fielding} icon={<FieldingIcon />} color="amber" />
              <MetricCard label="Spirit" value={item.teamSpirit} icon={<SpiritIcon />} color="purple" />
            </div>
          </div>

          {/* Alert Signals (Issues) */}
          {Object.values(item.issues || {}).some(v => v) && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {Object.entries(item.issues || {}).map(([key, value]) => {
                if (!value) return null;
                return (
                  <div key={key} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-900/50 border border-white/5">
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      key === 'venue' ? 'bg-rose-400' : 
                      key === 'equipment' ? 'bg-sky-400' : 
                      'bg-amber-400'
                    }`}></div>
                    <span className="text-[9px] font-bold uppercase text-slate-400">{key}</span>
                  </div>
                );
              })}
            </div>
          )}

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

const MetricCard = ({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) => {
  const colorMap: Record<string, string> = {
    emerald: 'text-emerald-400 bg-emerald-400/10',
    sky: 'text-sky-400 bg-sky-400/10',
    amber: 'text-amber-400 bg-amber-400/10',
    purple: 'text-purple-400 bg-purple-400/10'
  };
  const style = colorMap[color];

  return (
    <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-slate-900/30 border border-white/5">
      <div className={`p-1.5 rounded-lg ${style}`}>
        {icon}
      </div>
      <span className="text-xs font-black text-white">{value.toFixed(1)}</span>
      <span className="text-[8px] font-bold uppercase text-slate-500">{label}</span>
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
