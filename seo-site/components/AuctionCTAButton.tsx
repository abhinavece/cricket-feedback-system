'use client';

import React from 'react';
import Link from 'next/link';

interface AuctionCTAButtonProps {
  className?: string;
  children: React.ReactNode;
}

const AuctionCTAButton: React.FC<AuctionCTAButtonProps> = ({ className, children }) => {
  return (
    <Link
      href="/auth/login?redirect=https%3A%2F%2Fauction.cricsmart.in&service=auction"
      className={className}
    >
      {children}
    </Link>
  );
};

export default AuctionCTAButton;
