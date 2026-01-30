import React from 'react';
import { Sparkles, Brain } from 'lucide-react';

interface CricSmartLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  showTagline?: boolean;
  showAIBadge?: boolean;
  className?: string;
}

const CricSmartLogo: React.FC<CricSmartLogoProps> = ({
  size = 'md',
  showText = true,
  showTagline = false,
  showAIBadge = false,
  className = '',
}) => {
  const sizeConfig = {
    xs: {
      container: 'w-6 h-6',
      letter: 'text-sm',
      text: 'text-sm',
      tagline: 'text-[8px]',
      badge: 'w-3 h-3 -top-0.5 -right-0.5',
      badgeIcon: 'w-1.5 h-1.5',
      gap: 'gap-1.5',
    },
    sm: {
      container: 'w-8 h-8',
      letter: 'text-base',
      text: 'text-base',
      tagline: 'text-[9px]',
      badge: 'w-4 h-4 -top-0.5 -right-0.5',
      badgeIcon: 'w-2 h-2',
      gap: 'gap-2',
    },
    md: {
      container: 'w-10 h-10',
      letter: 'text-xl',
      text: 'text-lg',
      tagline: 'text-[10px]',
      badge: 'w-5 h-5 -top-1 -right-1',
      badgeIcon: 'w-2.5 h-2.5',
      gap: 'gap-2.5',
    },
    lg: {
      container: 'w-14 h-14',
      letter: 'text-2xl',
      text: 'text-xl',
      tagline: 'text-xs',
      badge: 'w-6 h-6 -top-1 -right-1',
      badgeIcon: 'w-3 h-3',
      gap: 'gap-3',
    },
    xl: {
      container: 'w-20 h-20',
      letter: 'text-4xl',
      text: 'text-2xl',
      tagline: 'text-sm',
      badge: 'w-7 h-7 -top-1 -right-1',
      badgeIcon: 'w-3.5 h-3.5',
      gap: 'gap-3',
    },
  };

  const config = sizeConfig[size];

  return (
    <div className={`flex items-center ${config.gap} ${className}`}>
      {/* Logo Mark */}
      <div className="relative">
        {/* Glow effect */}
        <div className={`absolute inset-0 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl blur-lg opacity-30`} />
        
        {/* Main container */}
        <div className={`relative ${config.container} bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20`}>
          <span className={`text-white font-black ${config.letter}`}>C</span>
        </div>

        {/* AI Badge */}
        {showAIBadge && (
          <div className={`absolute ${config.badge} bg-violet-500 rounded-full flex items-center justify-center shadow-lg border-2 border-slate-900`}>
            <Sparkles className={`${config.badgeIcon} text-white`} />
          </div>
        )}
      </div>

      {/* Text */}
      {showText && (
        <div className="flex flex-col">
          <span className={`font-bold text-white ${config.text} leading-tight`}>
            CricSmart
          </span>
          {showTagline && (
            <span className={`text-slate-500 font-medium uppercase tracking-wider ${config.tagline}`}>
              AI Cricket Platform
            </span>
          )}
        </div>
      )}
    </div>
  );
};

// Static logo mark only - for use in favicons, small spaces
export const CricSmartLogoMark: React.FC<{ size?: 'xs' | 'sm' | 'md' | 'lg'; className?: string }> = ({
  size = 'md',
  className = '',
}) => {
  const sizes = {
    xs: 'w-6 h-6 text-xs rounded-md',
    sm: 'w-8 h-8 text-sm rounded-lg',
    md: 'w-10 h-10 text-lg rounded-xl',
    lg: 'w-14 h-14 text-2xl rounded-xl',
  };

  return (
    <div className={`${sizes[size]} bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 ${className}`}>
      <span className="text-white font-black">C</span>
    </div>
  );
};

// Full branding with AI emphasis
export const CricSmartBrand: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl blur-xl opacity-40 animate-pulse" />
        <div className="relative w-16 h-16 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-500/30">
          <span className="text-white font-black text-3xl">C</span>
        </div>
        <div className="absolute -top-1 -right-1 w-6 h-6 bg-violet-500 rounded-full flex items-center justify-center shadow-lg border-2 border-slate-900">
          <Brain className="w-3 h-3 text-white" />
        </div>
      </div>
      <div className="flex flex-col">
        <span className="text-2xl font-bold text-white">CricSmart</span>
        <span className="text-xs text-slate-400">AI-Powered Cricket Management</span>
      </div>
    </div>
  );
};

export default CricSmartLogo;
