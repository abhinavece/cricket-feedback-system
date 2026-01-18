import React, { useState, useEffect } from 'react';
import { Clock, ArrowRight } from 'lucide-react';

interface CountdownTimerProps {
  seconds: number;
  onComplete: () => void;
  message: string;
  className?: string;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({
  seconds,
  onComplete,
  message,
  className = ""
}) => {
  const [timeLeft, setTimeLeft] = useState(seconds);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (timeLeft <= 0) {
      setIsComplete(true);
      onComplete();
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, onComplete]);

  // Calculate progress for circular indicator
  const progress = ((seconds - timeLeft) / seconds) * 100;
  const circumference = 2 * Math.PI * 45; // radius = 45
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className={`text-center ${className}`}>
      {/* Circular Progress Timer */}
      <div className="relative inline-flex items-center justify-center mb-6">
        {/* Background circle */}
        <svg className="w-24 h-24 transform -rotate-90">
          <circle
            cx="48"
            cy="48"
            r="45"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-slate-700"
          />
          {/* Progress circle */}
          <circle
            cx="48"
            cy="48"
            r="45"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-emerald-500 transition-all duration-1000 ease-linear"
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: strokeDashoffset,
              strokeLinecap: 'round'
            }}
          />
        </svg>
        
        {/* Timer content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Clock className={`w-6 h-6 mb-1 transition-colors duration-300 ${
            isComplete ? 'text-emerald-400' : 'text-slate-300'
          }`} />
          <span className={`text-2xl font-bold transition-colors duration-300 ${
            isComplete ? 'text-emerald-400' : 'text-white'
          }`}>
            {isComplete ? '✓' : timeLeft}
          </span>
        </div>
      </div>

      {/* Message */}
      <p className="text-slate-300 text-lg mb-4 leading-relaxed">
        {message}
      </p>

      {/* Redirect indicator */}
      {!isComplete && (
        <div className="flex items-center justify-center gap-2 text-emerald-400 text-sm animate-pulse">
          <span>Redirecting in {timeLeft} seconds...</span>
          <ArrowRight className="w-4 h-4" />
        </div>
      )}

      {isComplete && (
        <div className="flex items-center justify-center gap-2 text-emerald-400 text-sm">
          <span>Redirecting...</span>
          <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};

export default CountdownTimer;
