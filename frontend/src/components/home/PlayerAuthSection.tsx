import React, { useState, useEffect, useRef } from 'react';
import { LogIn, UserPlus, ArrowRight, Shield, Zap, Users, Trophy } from 'lucide-react';

interface PlayerAuthSectionProps {
  onLogin: () => void;
  onSignup: () => void;
}

const PlayerAuthSection: React.FC<PlayerAuthSectionProps> = ({ onLogin, onSignup }) => {
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

  const authOptions = [
    {
      id: 'existing',
      icon: <LogIn className="w-6 h-6" />,
      title: 'Existing Player',
      description: 'Welcome back! Sign in to access your team dashboard and manage your matches.',
      cta: 'Sign In',
      onClick: onLogin,
      gradient: 'from-blue-500/20 to-indigo-500/20',
      borderColor: 'hover:border-blue-500/40',
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-400',
      features: ['Access Dashboard', 'View Matches', 'Manage Availability'],
    },
    {
      id: 'new',
      icon: <UserPlus className="w-6 h-6" />,
      title: 'New Player',
      description: 'Join the community! Create your team and start managing cricket matches smartly.',
      cta: 'Create Team',
      onClick: onSignup,
      gradient: 'from-emerald-500/20 to-teal-500/20',
      borderColor: 'hover:border-emerald-500/40',
      iconBg: 'bg-emerald-500/10',
      iconColor: 'text-emerald-400',
      features: ['Free Setup', '50 Players Free', 'AI Features'],
    },
  ];

  return (
    <section ref={sectionRef} className="py-20 px-4 sm:px-6 bg-slate-900/50">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div 
          className={`text-center mb-16 transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
            Join Your Cricket Community
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">
            Whether you're returning or just starting, we've got the perfect path for you
          </p>
        </div>

        {/* Auth options */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {authOptions.map((option, index) => (
            <div
              key={option.id}
              className={`group relative p-8 bg-slate-800/50 backdrop-blur-sm border border-white/5 ${option.borderColor} rounded-3xl transition-all duration-500 hover:scale-[1.02] ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: `${index * 200 + 300}ms` }}
            >
              {/* Gradient overlay */}
              <div className={`absolute inset-0 bg-gradient-to-br ${option.gradient} rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

              <div className="relative">
                {/* Icon */}
                <div className={`mb-6 p-4 w-fit ${option.iconBg} rounded-2xl ${option.iconColor} group-hover:text-white transition-colors`}>
                  {option.icon}
                </div>

                {/* Content */}
                <h3 className="text-2xl font-bold text-white mb-3">{option.title}</h3>
                <p className="text-slate-300 mb-6 text-lg leading-relaxed">{option.description}</p>

                {/* Features */}
                <div className="space-y-3 mb-8">
                  {option.features.map((feature, i) => (
                    <div key={feature} className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full flex-shrink-0" />
                      <span className="text-slate-400 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <button
                  onClick={option.onClick}
                  className={`group/btn w-full px-6 py-4 bg-gradient-to-r ${
                    option.id === 'existing' 
                      ? 'from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400' 
                      : 'from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400'
                  } text-white font-bold rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-${
                    option.id === 'existing' ? 'blue-500/30' : 'emerald-500/30'
                  } flex items-center justify-center gap-2 overflow-hidden active:scale-95`}
                >
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-500" />
                  <span className="relative z-10">{option.cta}</span>
                  <ArrowRight className="w-5 h-5 relative z-10 group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Trust indicators */}
        <div 
          className={`text-center transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
          style={{ transitionDelay: '700ms' }}
        >
          <div className="inline-flex items-center gap-8 px-8 py-4 bg-slate-800/30 backdrop-blur-sm border border-white/5 rounded-2xl">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-400" />
              <span className="text-slate-300 text-sm font-medium">Secure Login</span>
            </div>
            <div className="w-px h-6 bg-slate-700" />
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-emerald-400" />
              <span className="text-slate-300 text-sm font-medium">Quick Setup</span>
            </div>
            <div className="w-px h-6 bg-slate-700" />
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-400" />
              <span className="text-slate-300 text-sm font-medium">50 Players Free</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PlayerAuthSection;
