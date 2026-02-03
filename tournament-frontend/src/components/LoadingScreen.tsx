import React from 'react';

const LoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-broadcast-900 flex items-center justify-center">
      <div className="text-center">
        {/* Animated logo */}
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-accent-400 to-accent-600 animate-pulse" />
          <div className="absolute inset-2 rounded-full bg-broadcast-900 flex items-center justify-center">
            <span className="font-display text-3xl text-accent-400">T</span>
          </div>
          {/* Orbit ring */}
          <div className="absolute inset-[-4px] rounded-full border-2 border-transparent border-t-accent-400 animate-spin" style={{ animationDuration: '1.5s' }} />
        </div>
        
        <p className="font-heading text-sm uppercase tracking-widest text-slate-500">
          Loading Tournament
        </p>
      </div>
    </div>
  );
};

export default LoadingScreen;
