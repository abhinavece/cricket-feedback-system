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
  
  // Size classes
  const sizeClasses = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl',
  };
  
  // Touch target sizes
  const touchTargetClasses = {
    sm: 'min-w-[36px] min-h-[36px]',
    md: 'min-w-[44px] min-h-[44px]',
    lg: 'min-w-[52px] min-h-[52px]',
  };

  return (
    <div className="rating-stars flex gap-1 py-2">
      {[1, 2, 3, 4, 5].map((star) => {
        const isActive = star <= (hoverRating || rating);
        const isHalf = !isActive && star === Math.ceil(rating) && rating % 1 !== 0;
        
        return (
          <button
            key={star}
            type="button"
            onClick={() => !readOnly && onChange(star)}
            onMouseEnter={() => !readOnly && setHoverRating(star)}
            onMouseLeave={() => !readOnly && setHoverRating(0)}
            disabled={readOnly}
            className={`${sizeClasses[size]} ${touchTargetClasses[size]} transition-all duration-200 transform p-1 
              ${isActive 
                ? 'text-accent-warning scale-110' 
                : 'text-gray-600 scale-100'
              } 
              ${!readOnly && 'hover:text-accent-warning hover:scale-110'}
              focus-ring rounded-lg flex items-center justify-center relative overflow-hidden`}
            title={`${star} star${star !== 1 ? 's' : ''}`}
            aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
          >
            <span className="relative z-10 pointer-events-none">
              {isActive ? '★' : '☆'}
            </span>
            
            {/* Glow effect on hover/active */}
            {isActive && (
              <span className="absolute inset-0 bg-accent-warning/10 rounded-full blur-md transform scale-90"></span>
            )}
            
            {/* Ripple effect on click */}
            <span className="absolute inset-0 bg-accent-warning/5 rounded-full transform scale-0 opacity-0 hover:scale-100 hover:opacity-100 transition-all duration-300"></span>
          </button>
        );
      })}
    </div>
  );
};

export default RatingStars;
