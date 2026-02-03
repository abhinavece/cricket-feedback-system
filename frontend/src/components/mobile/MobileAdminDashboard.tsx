import React, { useState, useEffect, lazy, Suspense } from 'react';
import { getStats, getProfile } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { MessageSquare, Calendar, Wallet, TrendingUp } from 'lucide-react';
import Footer from '../Footer';
import AdminMenu, { getMobileAdminMenuItems } from '../AdminMenu';

// Lazy load tab content - only loaded when tab is selected
const MobileFeedbackTab = lazy(() => import('./MobileFeedbackTab'));
const MobileMatchesTab = lazy(() => import('./MobileMatchesTab'));
const MobilePaymentsTab = lazy(() => import('./MobilePaymentsTab'));
const MobileContactTeam = lazy(() => import('./MobileContactTeam'));
const MobileWhatsAppTab = lazy(() => import('./MobileWhatsAppTab'));
const MobileChatsTab = lazy(() => import('./MobileChatsTab'));
const MobileSettingsTab = lazy(() => import('./MobileSettingsTab'));
const TeamSettingsTab = lazy(() => import('../TeamSettingsTab'));
const MobileProfileSetup = lazy(() => import('./MobileProfileSetup'));
const MobileWhatsAppAnalyticsTab = lazy(() => import('./MobileWhatsAppAnalyticsTab'));
const MobileGroundsTab = lazy(() => import('./MobileGroundsTab'));
const MobileTournamentDashboard = lazy(() => import('./MobileTournamentDashboard'));

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

type TabId = 'feedback' | 'users' | 'whatsapp' | 'chats' | 'matches' | 'payments' | 'player-history' | 'analytics' | 'settings' | 'grounds' | 'team' | 'tournaments';

interface MobileAdminDashboardProps {
  activeTab?: TabId;
  onTabChange?: (tab: TabId) => void;
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

  // Fetch stats and profile status on initial load (safe access to avoid UI errors)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, profileData] = await Promise.all([
          getStats(),
          getProfile()
        ]);
        setStats(statsData ?? null);
        const complete = profileData?.data?.user?.profileComplete;
        setProfileComplete(typeof complete === 'boolean' ? complete : false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setStats(null);
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

  // Main tabs: only Feedback, Matches, Payments in the bar; everything else in 9-dot "More" menu
  const mainTabs = [
    { id: 'feedback', label: 'Feedback', icon: MessageSquare },
    { id: 'matches', label: 'Matches', icon: Calendar },
    { id: 'payments', label: 'Payments', icon: Wallet },
  ];

  const visibleTabs = mainTabs;
  const isViewer = user?.role === 'viewer';

  const adminMenuItems = getMobileAdminMenuItems(
    (tab) => handleTabChange(tab as TabId),
    user?.role
  );

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

  // Show contact page only for viewers trying to access admin-only tabs
  // Viewers CAN access: feedback, matches, payments, grounds, player-history, team, settings
  const viewerAccessibleTabs = ['feedback', 'matches', 'payments', 'grounds', 'player-history', 'team', 'settings'];
  if (isViewer && !viewerAccessibleTabs.includes(activeTab)) {
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
              <span className="text-sm font-bold text-white">{stats.totalSubmissions ?? 0}</span>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-slate-400">Avg:</span>
              <span className="text-amber-400">
                ⭐ {(
                  ((Number(stats.avgBatting) || 0) + (Number(stats.avgBowling) || 0) +
                   (Number(stats.avgFielding) || 0) + (Number(stats.avgTeamSpirit) || 0)) / 4
                ).toFixed(1)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tab bar: compact, refined design */}
      <div className="sticky top-0 z-30 bg-gradient-to-b from-slate-900 via-slate-900/98 to-slate-900/95 backdrop-blur-xl">
        <div className="flex items-center gap-1.5 px-2 py-1.5">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as TabId)}
                className={`
                  flex-1 flex items-center justify-center gap-1.5 rounded-lg h-9 text-[11px] font-semibold
                  transition-all duration-150 active:scale-[0.97]
                  ${isActive
                    ? 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}
                `}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
          <AdminMenu
            items={adminMenuItems}
            userRole={user?.role}
            variant="mobile"
          />
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />
      </div>

      {/* Tab Content */}
      <div className="px-3 py-2">
        <Suspense fallback={<TabLoadingSpinner />}>
          {activeTab === 'feedback' && <MobileFeedbackTab />}
          {activeTab === 'chats' && <MobileChatsTab />}
          {activeTab === 'matches' && <MobileMatchesTab />}
          {activeTab === 'payments' && <MobilePaymentsTab />}
          {activeTab === 'grounds' && <MobileGroundsTab />}
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
          {activeTab === 'team' && (
            <TeamSettingsTab />
          )}
          {activeTab === 'tournaments' && (
            <MobileTournamentDashboard 
              onBack={() => handleTabChange('feedback')} 
            />
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

      {/* Footer */}
      <Footer minimal />
    </div>
  );
};

export default MobileAdminDashboard;
