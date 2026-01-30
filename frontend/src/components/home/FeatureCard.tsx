import React from 'react';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  size?: 'small' | 'medium' | 'large';
  gradient?: string;
  delay?: number;
  isVisible?: boolean;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
  size = 'medium',
  gradient = 'from-emerald-500/10 to-teal-500/10',
  delay = 0,
  isVisible = true,
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
      className={`${sizeClasses[size]} group relative overflow-hidden rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-white/5 hover:border-emerald-500/30 transition-all duration-500 hover:scale-[1.02] ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {/* Hover gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
      
      {/* Corner accent */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className={`relative ${paddingClasses[size]} h-full flex flex-col`}>
        {/* Icon */}
        <div className="mb-4 p-3 w-fit bg-emerald-500/10 rounded-xl text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
          {icon}
        </div>

        {/* Title */}
        <h3 className={`font-bold text-white mb-2 ${size === 'large' ? 'text-xl lg:text-2xl' : 'text-lg'}`}>
          {title}
        </h3>

        {/* Description */}
        <p className={`text-slate-400 leading-relaxed ${size === 'large' ? 'text-sm lg:text-base' : 'text-sm'}`}>
          {description}
        </p>
      </div>
    </div>
  );
};

export default FeatureCard;
