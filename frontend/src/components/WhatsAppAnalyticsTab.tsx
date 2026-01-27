import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  MessageSquare,
  Clock,
  DollarSign,
  AlertCircle,
  RefreshCw,
  Users,
  CheckCircle,
  Send,
  TrendingUp,
  Timer,
  ChevronRight
} from 'lucide-react';
import {
  getWhatsAppAnalyticsDashboard,
  getWhatsAppActiveSessions,
  getWhatsAppCostAnalytics,
  getWhatsAppFailedMessages,
  WhatsAppAnalyticsDashboard,
  WhatsAppSession,
  WhatsAppCostAnalytics,
  WhatsAppFailedMessage
} from '../services/api';
import PlayerNameLink from './PlayerNameLink';

type SubTab = 'overview' | 'sessions' | 'costs' | 'errors';

const WhatsAppAnalyticsTab: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [dashboard, setDashboard] = useState<WhatsAppAnalyticsDashboard | null>(null);
  const [sessions, setSessions] = useState<WhatsAppSession[]>([]);
  const [costAnalytics, setCostAnalytics] = useState<WhatsAppCostAnalytics | null>(null);
  const [failedMessages, setFailedMessages] = useState<WhatsAppFailedMessage[]>([]);

  // Pagination
  const [sessionsPage, setSessionsPage] = useState(1);
  const [costsPage, setCostsPage] = useState(1);
  const [errorsPage, setErrorsPage] = useState(1);
  const [sessionsHasMore, setSessionsHasMore] = useState(false);
  const [costsHasMore, setCostsHasMore] = useState(false);
  const [errorsHasMore, setErrorsHasMore] = useState(false);

  const loadDashboard = useCallback(async () => {
    try {
      const response = await getWhatsAppAnalyticsDashboard();
      if (response.success) {
        setDashboard(response.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    }
  }, []);

  const loadSessions = useCallback(async (page = 1) => {
    try {
      const response = await getWhatsAppActiveSessions({ page, limit: 20 });
      if (response.success) {
        setSessions(response.sessions);
        setSessionsHasMore(response.pagination.hasMore);
      }
    } catch (err) {
      console.error('Failed to load sessions:', err);
    }
  }, []);

  const loadCosts = useCallback(async (page = 1) => {
    try {
      const response = await getWhatsAppCostAnalytics({ page, limit: 20 });
      if (response.success) {
        setCostAnalytics(response);
        setCostsHasMore(response.pagination.hasMore);
      }
    } catch (err) {
      console.error('Failed to load costs:', err);
    }
  }, []);

  const loadErrors = useCallback(async (page = 1) => {
    try {
      const response = await getWhatsAppFailedMessages({ page, limit: 20 });
      if (response.success) {
        setFailedMessages(response.messages);
        setErrorsHasMore(response.pagination.hasMore);
      }
    } catch (err) {
      console.error('Failed to load errors:', err);
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        loadDashboard(),
        loadSessions(1),
        loadCosts(1),
        loadErrors(1)
      ]);
    } catch (err: any) {
      setError(err.message || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }, [loadDashboard, loadSessions, loadCosts, loadErrors]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const formatCurrency = (amount: number, currency = 'INR') => {
    if (currency === 'INR') {
      return `₹${amount.toFixed(2)}`;
    }
    return `${currency} ${amount.toFixed(2)}`;
  };

  const subTabs: { id: SubTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'sessions', label: 'Active Sessions', icon: <Users className="w-4 h-4" /> },
    { id: 'costs', label: 'Costs', icon: <DollarSign className="w-4 h-4" /> },
    { id: 'errors', label: 'Errors', icon: <AlertCircle className="w-4 h-4" /> }
  ];

  if (loading && !dashboard) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
        <span className="ml-2 text-slate-400">Loading analytics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-4" />
        <p className="text-rose-400">{error}</p>
        <button
          onClick={loadData}
          className="mt-4 px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-emerald-400" />
          WhatsApp Analytics
        </h2>
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Sub-navigation */}
      <div className="flex gap-2 border-b border-slate-700 pb-2">
        {subTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeSubTab === tab.id
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Panel */}
      {activeSubTab === 'overview' && dashboard && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Messages Sent */}
            <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm">Messages Sent</span>
                <Send className="w-5 h-5 text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-white">{dashboard.messages.total}</div>
              <div className="text-xs text-slate-500 mt-1">
                Last 30 days: {dashboard.messages.last30Days}
              </div>
            </div>

            {/* Active Sessions */}
            <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm">Active Sessions</span>
                <Users className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-white">{dashboard.sessions.active}</div>
              <div className="text-xs text-emerald-400 mt-1">
                Free messaging available
              </div>
            </div>

            {/* Delivery Rate */}
            <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm">Delivery Rate</span>
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
              <div className="text-2xl font-bold text-white">{dashboard.rates.deliveryRate}%</div>
              <div className="text-xs text-slate-500 mt-1">
                Read rate: {dashboard.rates.readRate}%
              </div>
            </div>

            {/* Total Cost */}
            <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm">Total Cost</span>
                <DollarSign className="w-5 h-5 text-amber-400" />
              </div>
              <div className="text-2xl font-bold text-white">
                {formatCurrency(dashboard.costs.total, dashboard.costs.currency)}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                All time
              </div>
            </div>
          </div>

          {/* Message Status Breakdown */}
          <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-emerald-400" />
              Message Status (Last 30 Days)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(dashboard.messages.byStatus).map(([status, count]) => (
                <div key={status} className="text-center">
                  <div className={`text-xl font-bold ${
                    status === 'read' ? 'text-blue-400' :
                    status === 'delivered' ? 'text-green-400' :
                    status === 'sent' ? 'text-slate-300' :
                    status === 'failed' ? 'text-rose-400' :
                    'text-amber-400'
                  }`}>
                    {count}
                  </div>
                  <div className="text-xs text-slate-500 capitalize">{status}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => setActiveSubTab('sessions')}
              className="flex items-center justify-between p-4 bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-xl hover:border-emerald-500/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Timer className="w-6 h-6 text-emerald-400" />
                <div className="text-left">
                  <div className="text-white font-medium">Active Sessions</div>
                  <div className="text-sm text-slate-400">{dashboard.sessions.active} users with free messaging</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </button>

            <button
              onClick={() => setActiveSubTab('errors')}
              className="flex items-center justify-between p-4 bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-xl hover:border-rose-500/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-rose-400" />
                <div className="text-left">
                  <div className="text-white font-medium">Failed Messages</div>
                  <div className="text-sm text-slate-400">View and retry failed sends</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>
      )}

      {/* Sessions Panel */}
      {activeSubTab === 'sessions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-slate-400">
              Active sessions allow free messaging (within 24-hour window)
            </p>
            <button
              onClick={() => loadSessions(sessionsPage)}
              className="text-sm text-emerald-400 hover:text-emerald-300"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {sessions.length === 0 ? (
            <div className="text-center py-12 bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-xl">
              <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No active sessions</p>
              <p className="text-sm text-slate-500 mt-1">Sessions are created when users message you</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map(session => (
                <div
                  key={session._id}
                  className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-xl p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        {session.playerName ? (
                          <PlayerNameLink
                            playerId={session.playerId?._id || ''}
                            playerName={session.playerName}
                          />
                        ) : (
                          <span className="text-white font-medium">{session.phone}</span>
                        )}
                      </div>
                      <div className="text-sm text-slate-400 mt-1">
                        {session.phone}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-emerald-400">
                        <Clock className="w-4 h-4" />
                        <span>{formatDuration(session.remainingMinutes)} remaining</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {session.userMessageCount} user / {session.businessMessageCount} business msgs
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {sessionsHasMore && (
                <button
                  onClick={() => {
                    setSessionsPage(p => p + 1);
                    loadSessions(sessionsPage + 1);
                  }}
                  className="w-full py-2 text-emerald-400 hover:text-emerald-300 text-sm"
                >
                  Load more sessions
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Costs Panel */}
      {activeSubTab === 'costs' && costAnalytics && (
        <div className="space-y-6">
          {/* Cost Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-xl p-4">
              <div className="text-slate-400 text-sm mb-1">Total Cost</div>
              <div className="text-2xl font-bold text-white">
                {formatCurrency(costAnalytics.summary.totalCost, costAnalytics.summary.currency)}
              </div>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-xl p-4">
              <div className="text-slate-400 text-sm mb-1">Total Messages</div>
              <div className="text-2xl font-bold text-white">{costAnalytics.summary.totalMessages}</div>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-xl p-4">
              <div className="text-slate-400 text-sm mb-1">Avg Cost/Message</div>
              <div className="text-2xl font-bold text-white">
                {costAnalytics.summary.totalMessages > 0
                  ? formatCurrency(costAnalytics.summary.totalCost / costAnalytics.summary.totalMessages, costAnalytics.summary.currency)
                  : formatCurrency(0, costAnalytics.summary.currency)
                }
              </div>
            </div>
          </div>

          {/* Cost by Category */}
          <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-medium text-white mb-4">Cost by Category</h3>
            {costAnalytics.byCategory.length === 0 ? (
              <p className="text-slate-400 text-center py-4">No cost data available</p>
            ) : (
              <div className="space-y-3">
                {costAnalytics.byCategory.map(cat => (
                  <div key={cat._id || 'unknown'} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        cat._id === 'utility' ? 'bg-blue-400' :
                        cat._id === 'marketing' ? 'bg-purple-400' :
                        cat._id === 'authentication' ? 'bg-amber-400' :
                        'bg-slate-400'
                      }`} />
                      <span className="text-white capitalize">{cat._id || 'Unknown'}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-slate-400">{cat.count} msgs</span>
                      <span className="text-emerald-400 font-medium">
                        {formatCurrency(cat.totalCost, costAnalytics.summary.currency)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cost by User */}
          <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-medium text-white mb-4">Cost by User</h3>
            {costAnalytics.byUser.length === 0 ? (
              <p className="text-slate-400 text-center py-4">No user cost data available</p>
            ) : (
              <div className="space-y-3">
                {costAnalytics.byUser.map(user => (
                  <div key={user._id} className="flex items-center justify-between">
                    <div>
                      <span className="text-white">{user.playerName || user._id}</span>
                      {user.playerName && (
                        <span className="text-slate-500 text-sm ml-2">{user._id}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-slate-400">{user.count} msgs</span>
                      <span className="text-emerald-400 font-medium">
                        {formatCurrency(user.totalCost, costAnalytics.summary.currency)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {costsHasMore && (
              <button
                onClick={() => {
                  setCostsPage(p => p + 1);
                  loadCosts(costsPage + 1);
                }}
                className="w-full mt-4 py-2 text-emerald-400 hover:text-emerald-300 text-sm"
              >
                Load more users
              </button>
            )}
          </div>
        </div>
      )}

      {/* Errors Panel */}
      {activeSubTab === 'errors' && (
        <div className="space-y-4">
          {failedMessages.length === 0 ? (
            <div className="text-center py-12 bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-xl">
              <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
              <p className="text-emerald-400">No failed messages</p>
              <p className="text-sm text-slate-500 mt-1">All messages were delivered successfully</p>
            </div>
          ) : (
            <div className="space-y-3">
              {failedMessages.map(msg => (
                <div
                  key={msg._id}
                  className="bg-slate-800/50 backdrop-blur-xl border border-rose-500/20 rounded-xl p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="text-white font-medium">
                        {msg.playerName || msg.to}
                      </span>
                      {msg.playerName && (
                        <span className="text-slate-500 text-sm ml-2">{msg.to}</span>
                      )}
                    </div>
                    <span className="text-xs text-slate-500">
                      {new Date(msg.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm mb-2 line-clamp-2">{msg.text}</p>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400" />
                    <span className="text-rose-400 text-sm">
                      {msg.errorCode && `[${msg.errorCode}] `}
                      {msg.errorMessage || 'Unknown error'}
                    </span>
                  </div>
                </div>
              ))}

              {errorsHasMore && (
                <button
                  onClick={() => {
                    setErrorsPage(p => p + 1);
                    loadErrors(errorsPage + 1);
                  }}
                  className="w-full py-2 text-emerald-400 hover:text-emerald-300 text-sm"
                >
                  Load more errors
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WhatsAppAnalyticsTab;
