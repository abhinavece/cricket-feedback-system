'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Star, Navigation, ArrowRight } from 'lucide-react';

interface GroundCard {
  name: string;
  location: string;
  rating: number;
  reviews: number;
  image?: string;
}

const sampleGrounds: GroundCard[] = [
  {
    name: 'Supertech Sports Complex',
    location: 'Noida Sector 137',
    rating: 4.5,
    reviews: 24,
  },
  {
    name: 'DDA Sports Complex',
    location: 'Dwarka Sector 12',
    rating: 4.8,
    reviews: 42,
  },
  {
    name: 'Tau Devi Lal Stadium',
    location: 'Gurgaon Sector 38',
    rating: 4.2,
    reviews: 18,
  },
];

const GroundPreviewCard: React.FC<{ ground: GroundCard; index: number; isVisible: boolean }> = ({ ground, index, isVisible }) => {
  return (
    <div
      className={`group relative bg-slate-800/50 backdrop-blur-sm border border-white/5 rounded-2xl overflow-hidden hover:border-emerald-500/30 transition-all duration-500 hover:scale-[1.02] ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
      style={{ transitionDelay: `${index * 100 + 200}ms` }}
    >
      {/* Placeholder gradient for image */}
      <div className="h-32 bg-gradient-to-br from-emerald-900/50 to-teal-900/50 relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <MapPin className="w-12 h-12 text-emerald-500/30" />
        </div>
        {/* Decorative cricket pitch lines */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-emerald-500/20 rounded-full" />
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-emerald-500/20 rounded-full" />
      </div>

      <div className="p-4">
        <h4 className="font-semibold text-white mb-1 group-hover:text-emerald-400 transition-colors">
          {ground.name}
        </h4>
        
        <div className="flex items-center gap-1 text-slate-400 text-sm mb-3">
          <Navigation className="w-3 h-3" />
          <span>{ground.location}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span className="text-white font-medium">{ground.rating}</span>
            <span className="text-slate-500 text-sm">({ground.reviews} reviews)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

interface GroundsPreviewProps {
  onExploreGrounds: () => void;
}

const GroundsPreview: React.FC<GroundsPreviewProps> = ({ onExploreGrounds }) => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-20 px-4 sm:px-6 bg-slate-950">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div 
          className={`text-center mb-12 transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
            Find Your Next Playing Field
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            Discover and review cricket grounds in your area. Community-driven ratings help you find the perfect venue.
          </p>
        </div>

        {/* Ground cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {sampleGrounds.map((ground, index) => (
            <GroundPreviewCard key={ground.name} ground={ground} index={index} isVisible={isVisible} />
          ))}
        </div>

        {/* CTA */}
        <div 
          className={`text-center transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
          style={{ transitionDelay: '500ms' }}
        >
          <button
            onClick={onExploreGrounds}
            className="group inline-flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-emerald-500/30 text-white font-medium rounded-xl transition-all duration-300"
          >
            Explore All Grounds
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default GroundsPreview;
