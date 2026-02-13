'use client';

import { useState, useCallback } from 'react';
import { Shield } from 'lucide-react';

const SIZE_MAP = {
  xs: { px: 24, icon: 12, rounded: 'rounded-md' },
  sm: { px: 32, icon: 14, rounded: 'rounded-lg' },
  md: { px: 40, icon: 18, rounded: 'rounded-xl' },
  lg: { px: 56, icon: 24, rounded: 'rounded-xl' },
  xl: { px: 72, icon: 32, rounded: 'rounded-2xl' },
} as const;

interface TeamLogoProps {
  logo?: string;
  name: string;
  shortName?: string; // Now optional - not displayed anymore
  primaryColor: string;
  size?: keyof typeof SIZE_MAP;
  className?: string;
}

export default function TeamLogo({
  logo,
  name,
  primaryColor,
  size = 'sm',
  className = '',
}: TeamLogoProps) {
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const handleError = useCallback(() => setImgError(true), []);
  const handleLoad = useCallback(() => setImgLoaded(true), []);

  const config = SIZE_MAP[size];
  const hasValidLogo = logo && logo.trim() !== '' && !imgError;

  return (
    <div
      className={`relative flex-shrink-0 overflow-hidden ${config.rounded} ${className}`}
      style={{ width: config.px, height: config.px }}
      title={name}
    >
      {hasValidLogo ? (
        <>
          <img
            src={logo}
            alt={name}
            className={`w-full h-full object-contain transition-opacity duration-300 ${
              imgLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onError={handleError}
            onLoad={handleLoad}
            loading="lazy"
          />
          {!imgLoaded && (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ background: primaryColor }}
            >
              <Shield style={{ width: config.icon, height: config.icon }} className="text-white/80" />
            </div>
          )}
        </>
      ) : (
        <div
          className="w-full h-full flex items-center justify-center shadow-lg"
          style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)` }}
        >
          <Shield style={{ width: config.icon, height: config.icon }} className="text-white/90" />
        </div>
      )}
    </div>
  );
}
