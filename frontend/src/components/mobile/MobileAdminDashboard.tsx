import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { getAllFeedback, getStats, deleteFeedback, getFeedbackById } from '../../services/api';
import type { FeedbackSubmission } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { MessageSquare, Calendar, Wallet, Users, ChevronRight, Star, TrendingUp } from 'lucide-react';

// Lazy load tab content - only loaded when tab is selected
const MobileFeedbackTab = lazy(() => import('./MobileFeedbackTab'));
const MobileMatchesTab = lazy(() => import('./MobileMatchesTab'));
const MobilePaymentsTab = lazy(() => import('./MobilePaymentsTab'));

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
  activeTab?: 'feedback' | 'users' | 'whatsapp' | 'matches' | 'payments' | 'player-history';
  onTabChange?: (tab: 'feedback' | 'users' | 'whatsapp' | 'matches' | 'payments' | 'player-history') => void;
}

const MobileAdminDashboard: React.FC<MobileAdminDashboardProps> = ({
  activeTab: propActiveTab = 'feedback',
  onTabChange
}) => {
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(propActiveTab);
  const { user, hasPermission } = useAuth();

  useEffect(() => {
    setActiveTab(propActiveTab);
  }, [propActiveTab]);

  // Fetch only stats on initial load - tabs lazy load their own data
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const statsData = await getStats();
        setStats(statsData);
      } catch (err) {
        console.error('Error fetching stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    onTabChange?.(tab);
  };

  const tabs = [
    { id: 'feedback', label: 'Feedback', icon: MessageSquare, permission: 'view_feedback' },
    { id: 'matches', label: 'Matches', icon: Calendar, permission: 'view_matches' },
    { id: 'payments', label: 'Payments', icon: Wallet, permission: 'manage_payments' },
    { id: 'users', label: 'Users', icon: Users, permission: 'manage_users' },
  ];

  const visibleTabs = tabs.filter(tab => hasPermission(tab.permission as any));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950">
      {/* Compact Stats Header */}
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

      {/* Tab Content */}
      <div className="px-3 py-4">
        <Suspense fallback={<TabLoadingSpinner />}>
          {activeTab === 'feedback' && <MobileFeedbackTab />}
          {activeTab === 'matches' && <MobileMatchesTab />}
          {activeTab === 'payments' && <MobilePaymentsTab />}
          {activeTab === 'users' && (
            <div className="text-center py-12 text-slate-400">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">User management available on desktop</p>
            </div>
          )}
        </Suspense>
      </div>
    </div>
  );
};

export default MobileAdminDashboard;
