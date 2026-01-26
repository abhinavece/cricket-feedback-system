import React from 'react';
import type { GroundRatingType } from '../types';

interface GroundRatingSelectorProps {
  value: GroundRatingType;
  onChange: (value: GroundRatingType) => void;
}

interface RatingOption {
  value: GroundRatingType;
  label: string;
  tagline: string;
  emoji: string;
  colors: {
    bg: string;
    border: string;
    text: string;
    glow: string;
  };
}

const RATING_OPTIONS: RatingOption[] = [
  {
    value: 'skip_it',
    label: 'Skip This One',
    tagline: 'Only if desperate',
    emoji: '🚫',
    colors: {
      bg: 'from-red-500/20 to-red-600/10',
      border: 'border-red-500/50',
      text: 'text-red-400',
      glow: 'shadow-red-500/30',
    },
  },
  {
    value: 'decent',
    label: 'Gets the Job Done',
    tagline: 'No major complaints',
    emoji: '😐',
    colors: {
      bg: 'from-amber-500/20 to-amber-600/10',
      border: 'border-amber-500/50',
      text: 'text-amber-400',
      glow: 'shadow-amber-500/30',
    },
  },
  {
    value: 'solid_pick',
    label: 'Solid Pick',
    tagline: "Would book again!",
    emoji: '👍',
    colors: {
      bg: 'from-emerald-500/20 to-emerald-600/10',
      border: 'border-emerald-500/50',
      text: 'text-emerald-400',
      glow: 'shadow-emerald-500/30',
    },
  },
  {
    value: 'prime_ground',
    label: 'Prime Time Ground',
    tagline: 'Worth every penny',
    emoji: '🏆',
    colors: {
      bg: 'from-violet-500/20 to-violet-600/10',
      border: 'border-violet-500/50',
      text: 'text-violet-400',
      glow: 'shadow-violet-500/30',
    },
  },
  {
    value: 'overpriced',
    label: 'Overpriced',
    tagline: "Doesn't justify the cost",
    emoji: '💸',
    colors: {
      bg: 'from-orange-500/20 to-orange-600/10',
      border: 'border-orange-500/50',
      text: 'text-orange-400',
      glow: 'shadow-orange-500/30',
    },
  },
];

const GroundRatingSelector: React.FC<GroundRatingSelectorProps> = ({ value, onChange }) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold bg-gradient-to-r from-slate-300 to-slate-500 bg-clip-text text-transparent flex items-center gap-2">
          <span className="text-lg">🏟️</span> Rate the Ground
        </h3>
        <span className="text-xs px-2 py-0.5 bg-slate-700 text-slate-300 rounded-full">Optional</span>
      </div>

      <div className="grid gap-2">
        {RATING_OPTIONS.map((option) => {
          const isSelected = value === option.value;
          
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(isSelected ? null : option.value)}
              className={`
                relative w-full p-3 rounded-xl transition-all duration-300 text-left
                ${isSelected 
                  ? `bg-gradient-to-r ${option.colors.bg} ${option.colors.border} border-2 shadow-lg ${option.colors.glow} scale-[1.02]` 
                  : 'bg-slate-800/50 border border-slate-700/50 hover:border-slate-600 hover:bg-slate-700/50'
                }
              `}
            >
              <div className="flex items-center gap-3">
                {/* Emoji with animated background */}
                <div className={`
                  w-10 h-10 rounded-lg flex items-center justify-center text-xl
                  ${isSelected 
                    ? `bg-gradient-to-br ${option.colors.bg} ring-2 ring-white/20` 
                    : 'bg-slate-700/50'
                  }
                  transition-all duration-300
                `}>
                  {option.emoji}
                </div>

                {/* Text content */}
                <div className="flex-1 min-w-0">
                  <div className={`font-bold text-sm ${isSelected ? option.colors.text : 'text-slate-300'} transition-colors`}>
                    {option.label}
                  </div>
                  <div className={`text-xs ${isSelected ? 'text-slate-300' : 'text-slate-500'} truncate transition-colors`}>
                    {option.tagline}
                  </div>
                </div>

                {/* Selection indicator */}
                <div className={`
                  w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300
                  ${isSelected 
                    ? `bg-gradient-to-br ${option.colors.bg} ring-2 ${option.colors.border}` 
                    : 'border-2 border-slate-600'
                  }
                `}>
                  {isSelected && (
                    <svg className={`w-3 h-3 ${option.colors.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Quick tip */}
      <p className="text-xs text-slate-500 text-center italic">
        Help us find the best venues for future matches
      </p>
    </div>
  );
};

export default GroundRatingSelector;
