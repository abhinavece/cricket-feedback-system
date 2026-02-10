'use client';

import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import AuctionComingSoonModal from './AuctionComingSoonModal';

interface AuctionCTAButtonProps {
  className?: string;
  children: React.ReactNode;
}

const AuctionCTAButton: React.FC<AuctionCTAButtonProps> = ({ className, children }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={className}
      >
        {children}
      </button>
      
      <AuctionComingSoonModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};

export default AuctionCTAButton;
