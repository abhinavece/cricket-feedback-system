import React, { useState, useEffect, useRef } from 'react';
import { Calendar, MessageSquare, BarChart3, Target } from 'lucide-react';

interface Step {
  number: number;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const steps: Step[] = [
  {
    number: 1,
    title: 'Create',
    description: 'Set up your match with opponent, ground, date & time',
    icon: <Calendar className="w-6 h-6" />,
  },
  {
    number: 2,
    title: 'Invite',
    description: 'Send WhatsApp availability requests to your squad',
    icon: <MessageSquare className="w-6 h-6" />,
  },
  {
    number: 3,
    title: 'Track',
    description: "See who's available, unavailable, or tentative",
    icon: <BarChart3 className="w-6 h-6" />,
  },
  {
    number: 4,
    title: 'Play',
    description: 'Know your final squad and hit the ground',
    icon: <Target className="w-6 h-6" />,
  },
];

const StepCard: React.FC<{ step: Step; index: number; isVisible: boolean }> = ({ step, index, isVisible }) => {
  return (
    <div
      className={`relative flex flex-col items-center text-center transition-all duration-700 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
      style={{ transitionDelay: `${index * 150}ms` }}
    >
      {/* Connector line (hidden on mobile, shown on desktop) */}
      {index < steps.length - 1 && (
        <div className="hidden lg:block absolute top-10 left-[60%] w-full h-0.5 bg-gradient-to-r from-emerald-500/50 to-transparent" />
      )}
      
      {/* Mobile connector */}
      {index < steps.length - 1 && (
        <div className="lg:hidden absolute top-full left-1/2 w-0.5 h-8 bg-gradient-to-b from-emerald-500/50 to-transparent transform -translate-x-1/2" />
      )}

      {/* Step number circle */}
      <div className="relative mb-4">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center group hover:scale-110 transition-transform duration-300">
          <div className="text-emerald-400">
            {step.icon}
          </div>
        </div>
        {/* Step number badge */}
        <div className="absolute -top-2 -right-2 w-7 h-7 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-emerald-500/30">
          {step.number}
        </div>
      </div>

      {/* Content */}
      <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
      <p className="text-slate-400 text-sm max-w-[200px] leading-relaxed">{step.description}</p>
    </div>
  );
};

const HowItWorks: React.FC = () => {
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
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
            How It Works
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            From match creation to squad confirmation in four simple steps
          </p>
        </div>

        {/* Steps grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 lg:gap-8">
          {steps.map((step, index) => (
            <StepCard key={step.number} step={step} index={index} isVisible={isVisible} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
