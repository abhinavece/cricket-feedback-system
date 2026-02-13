'use client';

import { useState, useCallback } from 'react';

const SIZE_MAP = {
  xs: { px: 24, text: 'text-[7px]', rounded: 'rounded-md' },
  sm: { px: 32, text: 'text-[9px]', rounded: 'rounded-lg' },
  md: { px: 40, text: 'text-[10px]', rounded: 'rounded-xl' },
  lg: { px: 56, text: 'text-sm', rounded: 'rounded-xl' },
  xl: { px: 72, text: 'text-base', rounded: 'rounded-2xl' },
} as const;

interface TeamLogoProps {
  logo?: string;
  name: string;
  shortName: string;
  primaryColor: string;
  size?: keyof typeof SIZE_MAP;
  className?: string;
}

export default function TeamLogo({
  logo,
  name,
  shortName,
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
              <span className={`${config.text} font-bold text-white`}>{shortName}</span>
            </div>
          )}
        </>
      ) : (
        <div
          className="w-full h-full flex items-center justify-center shadow-lg"
          style={{ background: primaryColor }}
        >
          <span className={`${config.text} font-bold text-white`}>{shortName}</span>
        </div>
      )}
    </div>
  );
}
