import React, { useState } from 'react';

interface RatingStarsProps {
  rating: number;
  onChange: (value: number) => void;
  size?: 'sm' | 'md' | 'lg';
  readOnly?: boolean;
}

const RatingStars: React.FC<RatingStarsProps> = ({ 
  rating, 
  onChange, 
  size = 'md',
  readOnly = false
}) => {
  const [hoverRating, setHoverRating] = useState(0);
  
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

  const currentColor = getStarColor(hoverRating || rating);

  return (
    <div className="rating-stars flex gap-1 sm:gap-1.5 py-2 w-full justify-center sm:justify-start">
      {[1, 2, 3, 4, 5].map((star) => {
        const isActive = star <= (hoverRating || rating);
        const isHalf = !isActive && star === Math.ceil(rating) && rating % 1 !== 0;
        const starColor = isActive ? currentColor : 'text-slate-600';
        
        return (
          <button
            key={star}
            type="button"
            onClick={() => !readOnly && onChange(star)}
            onMouseEnter={() => !readOnly && setHoverRating(star)}
            onMouseLeave={() => !readOnly && setHoverRating(0)}
            onTouchStart={() => !readOnly && setHoverRating(star)}
            onTouchEnd={() => !readOnly && setHoverRating(0)}
            disabled={readOnly}
            className={`${sizeClasses[size]} ${touchTargetClasses[size]} transition-all duration-300 transform p-1 flex-shrink-0
              ${isActive 
                ? `${starColor} scale-110 drop-shadow-[0_0_8px_rgba(currentColor,0.5)]` 
                : 'text-slate-600 scale-100'
              } 
              ${!readOnly && `hover:${currentColor} hover:scale-110 hover:drop-shadow-[0_0_12px_rgba(currentColor,0.6)]`}
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
  );
};

export default RatingStars;
