'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Users, MapPin, Trophy, Star } from 'lucide-react';

interface StatItem {
  value: number;
  suffix: string;
  label: string;
  icon: React.ReactNode;
}

const stats: StatItem[] = [
  { value: 500, suffix: '+', label: 'Players', icon: <Users className="w-5 h-5" /> },
  { value: 50, suffix: '+', label: 'Grounds', icon: <MapPin className="w-5 h-5" /> },
  { value: 1000, suffix: '+', label: 'Matches', icon: <Trophy className="w-5 h-5" /> },
  { value: 4.8, suffix: '★', label: 'Avg Rating', icon: <Star className="w-5 h-5" /> },
];

const useCountUp = (end: number, duration: number = 2000, startCounting: boolean = false) => {
  const [count, setCount] = useState(0);
  const countRef = useRef(0);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!startCounting) return;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      countRef.current = end * easeOutQuart;
      setCount(countRef.current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [end, duration, startCounting]);

  return count;
};

const StatCard: React.FC<{ stat: StatItem; index: number; isVisible: boolean }> = ({ stat, index, isVisible }) => {
  const count = useCountUp(stat.value, 2000, isVisible);
  const displayValue = stat.value % 1 === 0 ? Math.round(count) : count.toFixed(1);

  return (
    <div
      className="relative group p-6 bg-slate-800/50 backdrop-blur-sm border border-white/5 rounded-2xl hover:border-emerald-500/30 transition-all duration-300 hover:scale-[1.02]"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Glow on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="relative flex flex-col items-center text-center">
        <div className="mb-3 p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
          {stat.icon}
        </div>
        <div className="text-3xl sm:text-4xl font-black text-white tabular-nums">
          {displayValue}{stat.suffix}
        </div>
        <div className="text-sm text-slate-400 mt-1 font-medium">{stat.label}</div>
      </div>
    </div>
  );
};

const StatsBar: React.FC = () => {
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
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-16 px-4 sm:px-6 bg-slate-900/50">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((stat, index) => (
            <StatCard key={stat.label} stat={stat} index={index} isVisible={isVisible} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsBar;
