'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  size?: 'small' | 'medium' | 'large';
  gradient?: string;
  delay?: number;
  isVisible?: boolean;
  badge?: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
  size = 'medium',
  gradient = 'from-emerald-500/10 to-teal-500/10',
  delay = 0,
  isVisible = true,
  badge,
}) => {
  const sizeClasses = {
    small: 'col-span-1 row-span-1',
    medium: 'col-span-1 row-span-1 lg:col-span-1',
    large: 'col-span-1 lg:col-span-2 row-span-1',
  };

  const paddingClasses = {
    small: 'p-5',
    medium: 'p-6',
    large: 'p-6 lg:p-8',
  };

  return (
    <div
      className={`${sizeClasses[size]} group relative overflow-hidden rounded-2xl bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 hover:border-emerald-500/30 transition-all duration-500 hover:scale-[1.02] h-full ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {/* Hover gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
      
      {/* Animated border glow on hover */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute inset-[-1px] rounded-2xl bg-gradient-to-r from-emerald-500/20 via-cyan-500/20 to-emerald-500/20 blur-sm" />
      </div>

      <div className={`relative ${paddingClasses[size]} h-full flex flex-col`}>
        {/* Badge */}
        {badge && (
          <div className="absolute top-4 right-4 flex items-center gap-1 px-2 py-1 bg-violet-500/20 border border-violet-500/30 rounded-full">
            <Sparkles className="w-3 h-3 text-violet-400" />
            <span className="text-xs font-medium text-violet-400">{badge}</span>
          </div>
        )}

        {/* Icon */}
        <div className={`mb-4 p-3 w-fit rounded-xl text-emerald-400 transition-all duration-300 ${
          badge 
            ? 'bg-gradient-to-br from-violet-500/20 to-purple-500/20 group-hover:from-violet-500/30 group-hover:to-purple-500/30' 
            : 'bg-emerald-500/10 group-hover:bg-emerald-500/20'
        }`}>
          {icon}
        </div>

        {/* Title */}
        <h3 className={`font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors ${
          size === 'large' ? 'text-xl lg:text-2xl' : 'text-lg'
        }`}>
          {title}
        </h3>

        {/* Description */}
        <p className={`text-slate-400 leading-relaxed flex-grow ${
          size === 'large' ? 'text-sm lg:text-base' : 'text-sm'
        }`}>
          {description}
        </p>
      </div>
    </div>
  );
};

export default FeatureCard;
