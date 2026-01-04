import React, { useState } from 'react';

interface RatingStarsProps {
  rating: number;
  onChange: (value: number) => void;
}

const RatingStars: React.FC<RatingStarsProps> = ({ rating, onChange }) => {
  const [hoverRating, setHoverRating] = useState(0);

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHoverRating(star)}
          onMouseLeave={() => setHoverRating(0)}
          className={`text-2xl transition-all duration-200 transform ${
            star <= (hoverRating || rating) 
              ? 'text-yellow-400 scale-110' 
              : 'text-gray-300 scale-100'
          } hover:text-yellow-400 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 rounded`}
          title={`${star} star${star !== 1 ? 's' : ''}`}
        >
          ★
        </button>
      ))}
    </div>
  );
};

export default RatingStars;
