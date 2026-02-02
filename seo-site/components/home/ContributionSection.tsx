'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit3, ArrowRight } from 'lucide-react';

interface ContributionSectionProps {
  onAddGround: () => void;
  onUpdateGround: () => void;
}

const ContributionSection: React.FC<ContributionSectionProps> = ({ onAddGround, onUpdateGround }) => {
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

  const cards = [
    {
      icon: <Plus className="w-8 h-8" />,
      title: 'Add New Ground',
      description: 'Know a ground not listed? Add it to help others discover it.',
      cta: 'Add Ground',
      onClick: onAddGround,
      gradient: 'from-emerald-500/20 to-teal-500/20',
      borderColor: 'hover:border-emerald-500/40',
    },
    {
      icon: <Edit3 className="w-8 h-8" />,
      title: 'Update Existing',
      description: 'Info outdated? Help keep ground details accurate for the community.',
      cta: 'Update Info',
      onClick: onUpdateGround,
      gradient: 'from-blue-500/20 to-indigo-500/20',
      borderColor: 'hover:border-blue-500/40',
    },
  ];

  return (
    <section ref={sectionRef} className="py-20 px-4 sm:px-6 bg-slate-900">
      <div className="max-w-4xl mx-auto">
        {/* Section header */}
        <div 
          className={`text-center mb-12 transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
            Help Your Cricket Community
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            Contribute to make cricket better for everyone
          </p>
        </div>

        {/* Contribution cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cards.map((card, index) => (
            <div
              key={card.title}
              className={`group relative p-8 bg-slate-800/50 backdrop-blur-sm border border-white/5 ${card.borderColor} rounded-2xl transition-all duration-500 hover:scale-[1.02] ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: `${index * 150 + 200}ms` }}
            >
              {/* Gradient overlay */}
              <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

              <div className="relative">
                {/* Icon */}
                <div className="mb-6 p-4 w-fit bg-white/5 rounded-2xl text-slate-300 group-hover:text-white transition-colors">
                  {card.icon}
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-white mb-3">{card.title}</h3>
                <p className="text-slate-400 mb-6 leading-relaxed">{card.description}</p>

                {/* CTA */}
                <button
                  onClick={card.onClick}
                  className="group/btn inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                >
                  {card.cta}
                  <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ContributionSection;
