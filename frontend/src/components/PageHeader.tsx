import React from 'react';
import { 
  ClipboardList, 
  MessageSquare, 
  Calendar, 
  CreditCard, 
  Users, 
  Settings,
  BarChart3,
  MapPin,
  Brain,
  Sparkles,
  History
} from 'lucide-react';

interface PageHeaderProps {
  activeTab: string;
  className?: string;
}

const tabConfig: Record<string, { 
  title: string; 
  description: string; 
  icon: React.ReactNode;
  gradient: string;
  badge?: string;
}> = {
  feedback: {
    title: 'Feedback Hub',
    description: 'Player performance insights',
    icon: <ClipboardList className="w-5 h-5" />,
    gradient: 'from-emerald-500 to-teal-500',
  },
  whatsapp: {
    title: 'Messaging Hub',
    description: 'WhatsApp team communication',
    icon: <MessageSquare className="w-5 h-5" />,
    gradient: 'from-green-500 to-emerald-500',
  },
  matches: {
    title: 'Match Central',
    description: 'Manage cricket matches',
    icon: <Calendar className="w-5 h-5" />,
    gradient: 'from-cyan-500 to-blue-500',
  },
  payments: {
    title: 'Payment Dashboard',
    description: 'Track team finances',
    icon: <CreditCard className="w-5 h-5" />,
    gradient: 'from-violet-500 to-purple-500',
    badge: 'AI',
  },
  users: {
    title: 'User Directory',
    description: 'Manage access & roles',
    icon: <Users className="w-5 h-5" />,
    gradient: 'from-amber-500 to-orange-500',
  },
  settings: {
    title: 'Settings',
    description: 'Account & preferences',
    icon: <Settings className="w-5 h-5" />,
    gradient: 'from-slate-500 to-slate-600',
  },
  analytics: {
    title: 'Analytics',
    description: 'Team insights & trends',
    icon: <BarChart3 className="w-5 h-5" />,
    gradient: 'from-rose-500 to-pink-500',
  },
  grounds: {
    title: 'Grounds',
    description: 'Cricket venues & reviews',
    icon: <MapPin className="w-5 h-5" />,
    gradient: 'from-teal-500 to-cyan-500',
  },
  'player-history': {
    title: 'Payment History',
    description: 'Player payment records',
    icon: <History className="w-5 h-5" />,
    gradient: 'from-indigo-500 to-violet-500',
  },
};

const PageHeader: React.FC<PageHeaderProps> = ({ activeTab, className = '' }) => {
  const config = tabConfig[activeTab] || tabConfig.feedback;

  return (
    <div className={`mb-6 md:mb-8 ${className}`}>
      {/* Desktop Header */}
      <div className="hidden md:flex items-center gap-4">
        {/* Icon with gradient background */}
        <div className={`relative w-12 h-12 bg-gradient-to-br ${config.gradient} rounded-xl flex items-center justify-center shadow-lg`}>
          <div className="text-white">
            {config.icon}
          </div>
          {config.badge && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-violet-500 rounded-full flex items-center justify-center shadow-lg border-2 border-slate-900">
              <Sparkles className="w-2.5 h-2.5 text-white" />
            </div>
          )}
        </div>
        
        {/* Title & Description */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white flex items-center gap-2">
            {config.title}
            {config.badge && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-violet-500/20 border border-violet-500/30 rounded-full text-xs text-violet-400 font-medium">
                <Brain className="w-3 h-3" />
                {config.badge}
              </span>
            )}
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">{config.description}</p>
        </div>
      </div>

      {/* Mobile Header - Compact */}
      <div className="md:hidden flex items-center gap-3">
        <div className={`w-10 h-10 bg-gradient-to-br ${config.gradient} rounded-lg flex items-center justify-center shadow-lg`}>
          <div className="text-white scale-90">
            {config.icon}
          </div>
        </div>
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-1.5">
            {config.title}
            {config.badge && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-violet-500/20 border border-violet-500/30 rounded-full text-[10px] text-violet-400 font-medium">
                <Brain className="w-2.5 h-2.5" />
              </span>
            )}
          </h1>
          <p className="text-slate-400 text-xs">{config.description}</p>
        </div>
      </div>
    </div>
  );
};

export default PageHeader;
