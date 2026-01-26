import React, { useState } from 'react';
import type { PerformanceRating } from '../types';

interface RatingStarsProps {
  rating: PerformanceRating;
  onChange: (value: PerformanceRating) => void;
  size?: 'sm' | 'md' | 'lg';
  readOnly?: boolean;
  allowNA?: boolean;  // Allow "Didn't get a chance" option
  naLabel?: string;   // Custom label for N/A button
}

const RatingStars: React.FC<RatingStarsProps> = ({ 
  rating, 
  onChange, 
  size = 'md',
  readOnly = false,
  allowNA = false,
  naLabel = "Didn't participate"
}) => {
  const [hoverRating, setHoverRating] = useState(0);
  const isNA = rating === null;
  
  // Size classes - mobile optimized (made larger)
  const sizeClasses = {
    sm: 'text-2xl sm:text-3xl',
    md: 'text-3xl sm:text-4xl',
    lg: 'text-4xl sm:text-5xl',
  };
  
  // Touch target sizes - responsive (made larger)
  const touchTargetClasses = {
    sm: 'min-w-[36px] min-h-[36px] sm:min-w-[40px] sm:min-h-[40px]',
    md: 'min-w-[40px] min-h-[40px] sm:min-w-[44px] sm:min-h-[44px]',
    lg: 'min-w-[44px] min-h-[44px] sm:min-w-[48px] sm:min-h-[48px]',
  };

  // Dynamic star colors based on rating
  const getStarColor = (starRating: number) => {
    if (starRating <= 2) return 'text-rose-400';
    if (starRating <= 3) return 'text-amber-400';
    if (starRating <= 4) return 'text-yellow-400';
    return 'text-emerald-400';
  };

  const currentColor = getStarColor(hoverRating || (rating ?? 0));

  // Handle N/A toggle
  const handleNAClick = () => {
    if (readOnly) return;
    // Toggle: if already N/A, clear it (set to 0 which will prompt rating selection)
    // if has rating, set to null (N/A)
    onChange(isNA ? 0 : null);
  };

  return (
    <div className="rating-stars-container">
      <div className={`rating-stars flex gap-1 sm:gap-1.5 py-2 w-full justify-center sm:justify-start ${isNA ? 'opacity-40 pointer-events-none' : ''}`}>
        {[1, 2, 3, 4, 5].map((star) => {
          const isActive = !isNA && star <= (hoverRating || (rating ?? 0));
          const starColor = isActive ? currentColor : 'text-slate-600';
          
          return (
            <button
              key={star}
              type="button"
              onClick={() => !readOnly && !isNA && onChange(star)}
              onMouseEnter={() => !readOnly && !isNA && setHoverRating(star)}
              onMouseLeave={() => !readOnly && setHoverRating(0)}
              onTouchStart={() => !readOnly && !isNA && setHoverRating(star)}
              onTouchEnd={() => !readOnly && setHoverRating(0)}
              disabled={readOnly || isNA}
              className={`${sizeClasses[size]} ${touchTargetClasses[size]} transition-all duration-300 transform p-1 flex-shrink-0
                ${isActive 
                  ? `${starColor} scale-110 drop-shadow-[0_0_8px_rgba(currentColor,0.5)]` 
                  : 'text-slate-600 scale-100'
                } 
                ${!readOnly && !isNA && `hover:${currentColor} hover:scale-110 hover:drop-shadow-[0_0_12px_rgba(currentColor,0.6)]`}
                focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-slate-500 rounded-lg flex items-center justify-center relative overflow-hidden`}
              title={`${star} star${star !== 1 ? 's' : ''}`}
              aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
            >
              <span className="relative z-10 pointer-events-none">
                {isActive ? '★' : '☆'}
              </span>
              
              {/* Dynamic glow effect on hover/active */}
              {isActive && (
                <span 
                  className="absolute inset-0 rounded-full blur-lg opacity-60 animate-pulse"
                  style={{
                    backgroundColor: `rgba(${currentColor === 'text-rose-400' ? '248,113,113' : 
                      currentColor === 'text-amber-400' ? '251,191,36' : 
                      currentColor === 'text-yellow-400' ? '250,204,21' : 
                      '52,211,153'}, 0.2)`
                  }}
                ></span>
              )}
              
              {/* Ripple effect on click */}
              <span 
                className="absolute inset-0 rounded-full transform scale-0 opacity-0 hover:scale-100 hover:opacity-30 transition-all duration-300"
                style={{
                  backgroundColor: `rgba(${currentColor === 'text-rose-400' ? '248,113,113' : 
                    currentColor === 'text-amber-400' ? '251,191,36' : 
                    currentColor === 'text-yellow-400' ? '250,204,21' : 
                    '52,211,153'}, 0.3)`
                }}
              ></span>
            </button>
          );
        })}
      </div>
      
      {/* N/A Option - "Didn't get a chance" */}
      {allowNA && !readOnly && (
        <button
          type="button"
          onClick={handleNAClick}
          className={`
            mt-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200
            flex items-center gap-1.5 mx-auto sm:mx-0
            ${isNA 
              ? 'bg-slate-600/80 text-white border border-slate-500 shadow-md' 
              : 'bg-slate-800/50 text-slate-400 border border-slate-700 hover:bg-slate-700/50 hover:text-slate-300'
            }
          `}
        >
          {isNA ? (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>N/A - {naLabel}</span>
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
              <span>{naLabel}</span>
            </>
          )}
        </button>
      )}
      
      {/* Display N/A badge when in read-only mode */}
      {isNA && readOnly && (
        <div className="flex justify-center sm:justify-start mt-1">
          <span className="px-3 py-1 bg-slate-700/50 text-slate-400 rounded-full text-xs font-medium border border-slate-600">
            N/A - {naLabel}
          </span>
        </div>
      )}
    </div>
  );
};

export default RatingStars;
