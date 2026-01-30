import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Calendar, Heart, ArrowRight } from 'lucide-react';

interface TrustSectionProps {
  onMeetTeam: () => void;
}

const TrustSection: React.FC<TrustSectionProps> = ({ onMeetTeam }) => {
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

  const badges = [
    { icon: <MapPin className="w-4 h-4" />, text: 'Noida, India' },
    { icon: <Calendar className="w-4 h-4" />, text: 'Since 2023' },
    { icon: <Heart className="w-4 h-4" />, text: 'Community-driven' },
  ];

  return (
    <section ref={sectionRef} className="py-20 px-4 sm:px-6 bg-slate-950">
      <div className="max-w-4xl mx-auto text-center">
        {/* Decorative cricket bat */}
        <div 
          className={`mb-8 transition-all duration-700 ${
            isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500/10 rounded-full">
            <span className="text-4xl">🏏</span>
          </div>
        </div>

        {/* Headline */}
        <h2 
          className={`text-3xl sm:text-4xl font-black text-white mb-6 transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
          style={{ transitionDelay: '100ms' }}
        >
          Built by Cricket Lovers
        </h2>

        {/* Description */}
        <p 
          className={`text-slate-400 text-lg max-w-2xl mx-auto mb-8 leading-relaxed transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
          style={{ transitionDelay: '200ms' }}
        >
          Mavericks XI started as a passion project to solve our own team management headaches. 
          Now we're sharing it with the cricket community.
        </p>

        {/* Badges */}
        <div 
          className={`flex flex-wrap justify-center gap-3 mb-10 transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
          style={{ transitionDelay: '300ms' }}
        >
          {badges.map((badge) => (
            <div
              key={badge.text}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/50 border border-white/5 rounded-full text-slate-300 text-sm"
            >
              <span className="text-emerald-400">{badge.icon}</span>
              {badge.text}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div 
          className={`transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
          style={{ transitionDelay: '400ms' }}
        >
          <button
            onClick={onMeetTeam}
            className="group inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
          >
            Meet the Team
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default TrustSection;
