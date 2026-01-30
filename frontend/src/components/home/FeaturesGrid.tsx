import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Star, CreditCard, MapPin, Users } from 'lucide-react';
import FeatureCard from './FeatureCard';

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
  size: 'small' | 'medium' | 'large';
  gradient?: string;
}

const features: Feature[] = [
  {
    icon: <MessageCircle className="w-6 h-6" />,
    title: 'WhatsApp Integration',
    description: 'Send availability requests, reminders, and payment notifications directly to your squad via WhatsApp. No app downloads needed.',
    size: 'large',
    gradient: 'from-green-500/10 to-emerald-500/10',
  },
  {
    icon: <Star className="w-6 h-6" />,
    title: 'Match Feedback',
    description: 'Collect player ratings after every match. Track batting, bowling, and fielding performance over time.',
    size: 'medium',
    gradient: 'from-amber-500/10 to-orange-500/10',
  },
  {
    icon: <CreditCard className="w-6 h-6" />,
    title: 'Payment Tracking',
    description: 'Track who paid, who owes. AI-powered screenshot parsing makes it easy.',
    size: 'small',
    gradient: 'from-blue-500/10 to-indigo-500/10',
  },
  {
    icon: <MapPin className="w-6 h-6" />,
    title: 'Ground Reviews',
    description: 'Rate pitches, facilities, and access. Community-driven venue insights.',
    size: 'small',
    gradient: 'from-rose-500/10 to-pink-500/10',
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: 'Availability Dashboard',
    description: 'See your squad at a glance. Real-time availability tracking shows who\'s in, who\'s out, and who\'s maybe. Build your playing XI with confidence.',
    size: 'large',
    gradient: 'from-purple-500/10 to-violet-500/10',
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
    <section ref={sectionRef} className="py-20 px-4 sm:px-6 bg-slate-900">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
            Everything You Need to
            <br />
            <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              Run Your Team
            </span>
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            From availability tracking to payment management, we've got you covered
          </p>
        </div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-fr">
          {/* Row 1: Large (2 cols) + Medium (1 col) on desktop */}
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
              size="large"
              delay={100}
              isVisible={isVisible}
            />
          </div>

          {/* Row 2: Small + Small + Large (2 cols) on desktop */}
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
        </div>
      </div>
    </section>
  );
};

export default FeaturesGrid;
