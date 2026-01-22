import React, { useState, useEffect, lazy, Suspense } from 'react';
import { getStats, getProfile } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { MessageSquare, Calendar, Wallet, Users, Send, History, Monitor, X, TrendingUp, Settings, MessageCircle, BarChart3 } from 'lucide-react';

// Lazy load tab content - only loaded when tab is selected
const MobileFeedbackTab = lazy(() => import('./MobileFeedbackTab'));
const MobileMatchesTab = lazy(() => import('./MobileMatchesTab'));
const MobilePaymentsTab = lazy(() => import('./MobilePaymentsTab'));
const MobileContactTeam = lazy(() => import('./MobileContactTeam'));
const MobileWhatsAppTab = lazy(() => import('./MobileWhatsAppTab'));
const MobileChatsTab = lazy(() => import('./MobileChatsTab'));
const MobileSettingsTab = lazy(() => import('./MobileSettingsTab'));
const MobileProfileSetup = lazy(() => import('./MobileProfileSetup'));
const MobileWhatsAppAnalyticsTab = lazy(() => import('./MobileWhatsAppAnalyticsTab'));

// Reuse desktop components for tabs that don't have mobile versions yet
const UserManagement = lazy(() => import('../UserManagement'));
const MobileHistoryTab = lazy(() => import('./MobileHistoryTab'));

const TabLoadingSpinner = () => (
  <div className="flex items-center justify-center py-16">
    <div className="spinner"></div>
  </div>
);

interface FeedbackStats {
  totalSubmissions: number;
  avgBatting: number;
  avgBowling: number;
  avgFielding: number;
  avgTeamSpirit: number;
}

interface MobileAdminDashboardProps {
  activeTab?: 'feedback' | 'users' | 'whatsapp' | 'chats' | 'matches' | 'payments' | 'player-history' | 'analytics' | 'settings';
  onTabChange?: (tab: 'feedback' | 'users' | 'whatsapp' | 'chats' | 'matches' | 'payments' | 'player-history' | 'analytics' | 'settings') => void;
  onLogout?: () => void;
}

const MobileAdminDashboard: React.FC<MobileAdminDashboardProps> = ({
  activeTab: propActiveTab = 'feedback',
  onTabChange,
  onLogout
}) => {
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(propActiveTab);
  const [profileComplete, setProfileComplete] = useState<boolean | null>(null);
  const { user, hasPermission, logout } = useAuth();

  useEffect(() => {
    setActiveTab(propActiveTab);
  }, [propActiveTab]);

  // Fetch stats and profile status on initial load
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, profileData] = await Promise.all([
          getStats(),
          getProfile()
        ]);
        setStats(statsData);
        setProfileComplete(profileData.data.user.profileComplete);
      } catch (err) {
        console.error('Error fetching data:', err);
        setProfileComplete(false);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    onTabChange?.(tab);
  };

  // Define all tabs - admin users see all, others see only feedback
  const allTabs = [
    { id: 'feedback', label: 'Feedback', icon: MessageSquare },
    { id: 'chats', label: 'Chats', icon: MessageCircle },
    { id: 'whatsapp', label: 'WhatsApp', icon: Send },
    { id: 'matches', label: 'Matches', icon: Calendar },
    { id: 'payments', label: 'Payments', icon: Wallet },
    { id: 'player-history', label: 'History', icon: History },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  // Admin users see all tabs, viewers see all except whatsapp, chats, analytics, and users
  const isViewer = user?.role === 'viewer';
  const adminOnlyTabs = ['whatsapp', 'chats', 'analytics', 'users'];
  const visibleTabs = user?.role === 'admin'
    ? allTabs
    : allTabs.filter(tab => !adminOnlyTabs.includes(tab.id));

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      logout();
    }
  };

  const handleProfileCreated = () => {
    setProfileComplete(true);
    handleTabChange('feedback');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="spinner"></div>
      </div>
    );
  }

  // Show profile setup for viewers without profile (except admins)
  if (isViewer && profileComplete === false && activeTab !== 'settings') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950">
        <Suspense fallback={<TabLoadingSpinner />}>
          <MobileProfileSetup 
            userName={user?.name} 
            userEmail={user?.email}
            onProfileCreated={handleProfileCreated}
          />
        </Suspense>
      </div>
    );
  }

  // Show contact page for viewers trying to access admin-only tabs (but not settings)
  if (isViewer && activeTab !== 'feedback' && activeTab !== 'settings') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950">
        <Suspense fallback={<TabLoadingSpinner />}>
          <MobileContactTeam userName={user?.name} />
        </Suspense>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950">
      {/* Compact Stats Header - Only show on feedback tab */}
      {stats && activeTab === 'feedback' && (
        <div className="px-4 py-3 border-b border-white/5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-slate-400">Total</span>
              <span className="text-sm font-bold text-white">{stats.totalSubmissions}</span>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-slate-400">Avg:</span>
              <span className="text-amber-400">⭐ {((stats.avgBatting + stats.avgBowling + stats.avgFielding + stats.avgTeamSpirit) / 4).toFixed(1)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation - Compact Scrollable Pills */}
      <div className="sticky top-[52px] z-30 bg-slate-900/95 backdrop-blur-lg border-b border-white/5">
        <div className="flex overflow-x-auto scrollbar-hide px-3 py-2 gap-2">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-800/50 text-slate-400 border border-transparent hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop Banner */}
      <div className="mx-3 mt-2 mb-3 bg-gradient-to-r from-sky-500/10 to-purple-500/10 rounded-xl p-3 border border-sky-500/20">
        <div className="flex items-center gap-2">
          <Monitor className="w-4 h-4 text-sky-400" />
          <p className="text-xs text-slate-300">
            <span className="text-sky-400 font-medium">Pro tip:</span> Use desktop for full features & better experience
          </p>
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-3 py-2">
        <Suspense fallback={<TabLoadingSpinner />}>
          {activeTab === 'feedback' && <MobileFeedbackTab />}
          {activeTab === 'chats' && <MobileChatsTab />}
          {activeTab === 'matches' && <MobileMatchesTab />}
          {activeTab === 'payments' && <MobilePaymentsTab />}
          {activeTab === 'whatsapp' && <MobileWhatsAppTab />}
          {activeTab === 'player-history' && <MobileHistoryTab />}
          {activeTab === 'analytics' && <MobileWhatsAppAnalyticsTab />}
          {activeTab === 'users' && (
            <div className="mobile-tab-wrapper">
              <UserManagement />
            </div>
          )}
          {activeTab === 'settings' && (
            <MobileSettingsTab onLogout={handleLogout} />
          )}
        </Suspense>
      </div>

      <style>{`
        .mobile-tab-wrapper {
          margin: -0.75rem;
        }
        .mobile-tab-wrapper .container {
          padding-left: 0.75rem;
          padding-right: 0.75rem;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default MobileAdminDashboard;
