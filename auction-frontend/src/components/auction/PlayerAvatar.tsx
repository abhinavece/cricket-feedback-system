'use client';

import { useState, useCallback } from 'react';

const SIZE_MAP = {
  xs: { px: 24, text: 'text-[9px]', rounded: 'rounded-md' },
  sm: { px: 32, text: 'text-[10px]', rounded: 'rounded-lg' },
  md: { px: 40, text: 'text-xs', rounded: 'rounded-xl' },
  lg: { px: 64, text: 'text-lg', rounded: 'rounded-2xl' },
  xl: { px: 80, text: 'text-xl', rounded: 'rounded-2xl' },
  '2xl': { px: 96, text: 'text-2xl', rounded: 'rounded-2xl' },
  '3xl': { px: 112, text: 'text-3xl', rounded: 'rounded-2xl' },
} as const;

const ROLE_GRADIENTS: Record<string, string> = {
  batsman: 'from-blue-600/80 to-blue-800/80',
  bowler: 'from-red-600/80 to-red-800/80',
  'all-rounder': 'from-purple-600/80 to-purple-800/80',
  'wicket-keeper': 'from-emerald-600/80 to-emerald-800/80',
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

interface PlayerAvatarProps {
  imageUrl?: string;
  name: string;
  role?: string;
  size?: keyof typeof SIZE_MAP;
  cropPosition?: string;
  className?: string;
}

export default function PlayerAvatar({
  imageUrl,
  name,
  role = 'batsman',
  size = 'md',
  cropPosition = 'center top',
  className = '',
}: PlayerAvatarProps) {
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const handleError = useCallback(() => setImgError(true), []);
  const handleLoad = useCallback(() => setImgLoaded(true), []);

  const config = SIZE_MAP[size];
  const gradient = ROLE_GRADIENTS[role] || ROLE_GRADIENTS.batsman;
  const initials = getInitials(name);
  const hasValidImage = imageUrl && imageUrl.trim() !== '' && !imgError;

  return (
    <div
      className={`relative flex-shrink-0 overflow-hidden ${config.rounded} ${className}`}
      style={{ width: config.px, height: config.px }}
    >
      {hasValidImage ? (
        <>
          <img
            src={imageUrl}
            alt={name}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              imgLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ objectPosition: cropPosition }}
            onError={handleError}
            onLoad={handleLoad}
            loading="lazy"
          />
          {!imgLoaded && (
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient} flex items-center justify-center`}>
              <span className={`${config.text} font-bold text-white/80`}>{initials}</span>
            </div>
          )}
        </>
      ) : (
        <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center border border-white/10`}>
          <span className={`${config.text} font-bold text-white`}>{initials}</span>
        </div>
      )}
    </div>
  );
}
