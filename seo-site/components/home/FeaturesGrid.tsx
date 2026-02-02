'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Star, CreditCard, MapPin, Users, Brain, Scan, Bell, LineChart, Zap } from 'lucide-react';
import FeatureCard from './FeatureCard';

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
  size: 'small' | 'medium' | 'large';
  gradient?: string;
  badge?: string;
}

const features: Feature[] = [
  {
    icon: <Brain className="w-6 h-6" />,
    title: 'AI Payment Verification',
    description: 'Upload payment screenshots — our AI automatically extracts amount, verifies payments, and updates records. No manual data entry needed.',
    size: 'large',
    gradient: 'from-violet-500/20 to-purple-500/20',
    badge: 'AI Powered',
  },
  {
    icon: <MessageCircle className="w-6 h-6" />,
    title: 'WhatsApp Automation',
    description: 'Send availability requests, match reminders, and payment notifications directly via WhatsApp. Players respond with a single tap.',
    size: 'large',
    gradient: 'from-green-500/20 to-emerald-500/20',
  },
  {
    icon: <Scan className="w-6 h-6" />,
    title: 'Smart OCR',
    description: 'Scan UPI payment screens to auto-extract transaction IDs and amounts.',
    size: 'small',
    gradient: 'from-cyan-500/20 to-blue-500/20',
    badge: 'AI',
  },
  {
    icon: <Bell className="w-6 h-6" />,
    title: 'Auto Reminders',
    description: "Intelligent follow-ups sent to players who haven't responded yet.",
    size: 'small',
    gradient: 'from-amber-500/20 to-orange-500/20',
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: 'Squad Builder',
    description: "Real-time availability tracking shows who's in, who's out, and who's maybe. Build your playing XI with full visibility of your squad.",
    size: 'large',
    gradient: 'from-teal-500/20 to-cyan-500/20',
  },
  {
    icon: <Star className="w-6 h-6" />,
    title: 'Performance Tracking',
    description: 'Collect player ratings after every match. Track batting, bowling, and fielding stats over time.',
    size: 'medium',
    gradient: 'from-amber-500/20 to-yellow-500/20',
  },
  {
    icon: <LineChart className="w-6 h-6" />,
    title: 'Analytics Dashboard',
    description: 'Insights on team performance, payment trends, and player availability patterns.',
    size: 'small',
    gradient: 'from-rose-500/20 to-pink-500/20',
  },
  {
    icon: <MapPin className="w-6 h-6" />,
    title: 'Ground Reviews',
    description: 'Community-driven venue ratings and facility information.',
    size: 'small',
    gradient: 'from-emerald-500/20 to-green-500/20',
  },
];

const FeaturesGrid: React.FC = () => {
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
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 px-4 sm:px-6 bg-slate-900 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative max-w-6xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-violet-500/10 border border-violet-500/20 rounded-full mb-6">
            <Zap className="w-4 h-4 text-violet-400" />
            <span className="text-violet-400 text-sm font-medium">Intelligent Features</span>
          </div>
          
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-4">
            Everything You Need,
            <br />
            <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-violet-400 bg-clip-text text-transparent">
              Powered by AI
            </span>
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto text-lg">
            From smart availability tracking to AI payment verification — cricket management reimagined
          </p>
        </div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-fr">
          {/* Row 1: AI Payment (2 cols) + WhatsApp (2 cols) */}
          <div className="lg:col-span-2">
            <FeatureCard
              {...features[0]}
              delay={0}
              isVisible={isVisible}
            />
          </div>
          <div className="lg:col-span-2">
            <FeatureCard
              {...features[1]}
              delay={100}
              isVisible={isVisible}
            />
          </div>

          {/* Row 2: OCR + Reminders + Squad Builder (2 cols) */}
          <FeatureCard
            {...features[2]}
            delay={200}
            isVisible={isVisible}
          />
          <FeatureCard
            {...features[3]}
            delay={300}
            isVisible={isVisible}
          />
          <div className="lg:col-span-2">
            <FeatureCard
              {...features[4]}
              delay={400}
              isVisible={isVisible}
            />
          </div>

          {/* Row 3: Performance (2 cols) + Analytics + Grounds */}
          <div className="lg:col-span-2">
            <FeatureCard
              {...features[5]}
              size="large"
              delay={500}
              isVisible={isVisible}
            />
          </div>
          <FeatureCard
            {...features[6]}
            delay={600}
            isVisible={isVisible}
          />
          <FeatureCard
            {...features[7]}
            delay={700}
            isVisible={isVisible}
          />
        </div>
      </div>
    </section>
  );
};

export default FeaturesGrid;
