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
  ChevronDown,
  ChevronUp
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
} from '../../services/api';

const MobileWhatsAppAnalyticsTab: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [dashboard, setDashboard] = useState<WhatsAppAnalyticsDashboard | null>(null);
  const [sessions, setSessions] = useState<WhatsAppSession[]>([]);
  const [costAnalytics, setCostAnalytics] = useState<WhatsAppCostAnalytics | null>(null);
  const [failedMessages, setFailedMessages] = useState<WhatsAppFailedMessage[]>([]);

  // Collapsible sections
  const [showSessions, setShowSessions] = useState(false);
  const [showCosts, setShowCosts] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashboardRes, sessionsRes, costsRes, errorsRes] = await Promise.all([
        getWhatsAppAnalyticsDashboard(),
        getWhatsAppActiveSessions({ limit: 10 }),
        getWhatsAppCostAnalytics({ limit: 10 }),
        getWhatsAppFailedMessages({ limit: 10 })
      ]);

      if (dashboardRes.success) setDashboard(dashboardRes.data);
      if (sessionsRes.success) setSessions(sessionsRes.sessions);
      if (costsRes.success) setCostAnalytics(costsRes);
      if (errorsRes.success) setFailedMessages(errorsRes.messages);
    } catch (err: any) {
      setError(err.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, []);

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
    if (currency === 'INR') return `₹${amount.toFixed(2)}`;
    return `${currency} ${amount.toFixed(2)}`;
  };

  if (loading && !dashboard) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
        <span className="ml-2 text-slate-400">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 px-4">
        <AlertCircle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
        <p className="text-rose-400 text-sm">{error}</p>
        <button
          onClick={loadData}
          className="mt-3 px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-2">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-emerald-400" />
          Analytics
        </h2>
        <button
          onClick={loadData}
          disabled={loading}
          className="p-2 bg-slate-700/50 rounded-lg"
        >
          <RefreshCw className={`w-4 h-4 text-slate-300 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Stats Cards */}
      {dashboard && (
        <div className="grid grid-cols-2 gap-3 px-4">
          {/* Messages */}
          <div className="bg-slate-800/50 border border-white/10 rounded-xl p-3">
            <div className="flex items-center justify-between mb-1">
              <Send className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-slate-500">30d</span>
            </div>
            <div className="text-xl font-bold text-white">{dashboard.messages.last30Days}</div>
            <div className="text-xs text-slate-400">Messages sent</div>
          </div>

          {/* Sessions */}
          <div className="bg-slate-800/50 border border-white/10 rounded-xl p-3">
            <div className="flex items-center justify-between mb-1">
              <Users className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl font-bold text-white">{dashboard.sessions.active}</div>
            <div className="text-xs text-slate-400">Active sessions</div>
          </div>

          {/* Delivery Rate */}
          <div className="bg-slate-800/50 border border-white/10 rounded-xl p-3">
            <div className="flex items-center justify-between mb-1">
              <CheckCircle className="w-4 h-4 text-green-400" />
            </div>
            <div className="text-xl font-bold text-white">{dashboard.rates.deliveryRate}%</div>
            <div className="text-xs text-slate-400">Delivery rate</div>
          </div>

          {/* Cost */}
          <div className="bg-slate-800/50 border border-white/10 rounded-xl p-3">
            <div className="flex items-center justify-between mb-1">
              <DollarSign className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl font-bold text-white">
              {formatCurrency(dashboard.costs.total, dashboard.costs.currency)}
            </div>
            <div className="text-xs text-slate-400">Total cost</div>
          </div>
        </div>
      )}

      {/* Active Sessions Section */}
      <div className="mx-4 bg-slate-800/50 border border-white/10 rounded-xl overflow-hidden">
        <button
          onClick={() => setShowSessions(!showSessions)}
          className="w-full flex items-center justify-between p-4"
        >
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            <span className="text-white font-medium">Active Sessions</span>
            <span className="text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full">
              {sessions.length}
            </span>
          </div>
          {showSessions ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </button>

        {showSessions && (
          <div className="border-t border-white/10">
            {sessions.length === 0 ? (
              <div className="p-4 text-center text-slate-400 text-sm">
                No active sessions
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {sessions.map(session => (
                  <div key={session._id} className="p-3 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span className="text-white text-sm">
                          {session.playerName || session.phone}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 ml-4">
                        {session.userMessageCount} / {session.businessMessageCount} msgs
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-emerald-400 text-sm">
                        <Clock className="w-3 h-3" />
                        {formatDuration(session.remainingMinutes)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cost Breakdown Section */}
      <div className="mx-4 bg-slate-800/50 border border-white/10 rounded-xl overflow-hidden">
        <button
          onClick={() => setShowCosts(!showCosts)}
          className="w-full flex items-center justify-between p-4"
        >
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-amber-400" />
            <span className="text-white font-medium">Cost Breakdown</span>
          </div>
          {showCosts ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </button>

        {showCosts && costAnalytics && (
          <div className="border-t border-white/10 p-4">
            {costAnalytics.byCategory.length === 0 ? (
              <div className="text-center text-slate-400 text-sm">
                No cost data available
              </div>
            ) : (
              <div className="space-y-3">
                {costAnalytics.byCategory.map(cat => (
                  <div key={cat._id || 'unknown'} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        cat._id === 'utility' ? 'bg-blue-400' :
                        cat._id === 'marketing' ? 'bg-purple-400' :
                        'bg-slate-400'
                      }`} />
                      <span className="text-white text-sm capitalize">{cat._id || 'Unknown'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-400 text-xs">{cat.count} msgs</span>
                      <span className="text-emerald-400 text-sm font-medium">
                        {formatCurrency(cat.totalCost, costAnalytics.summary.currency)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Failed Messages Section */}
      <div className="mx-4 bg-slate-800/50 border border-white/10 rounded-xl overflow-hidden">
        <button
          onClick={() => setShowErrors(!showErrors)}
          className="w-full flex items-center justify-between p-4"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-400" />
            <span className="text-white font-medium">Failed Messages</span>
            {failedMessages.length > 0 && (
              <span className="text-xs px-2 py-0.5 bg-rose-500/20 text-rose-400 rounded-full">
                {failedMessages.length}
              </span>
            )}
          </div>
          {showErrors ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </button>

        {showErrors && (
          <div className="border-t border-white/10">
            {failedMessages.length === 0 ? (
              <div className="p-4 text-center">
                <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-emerald-400 text-sm">No failed messages</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {failedMessages.map(msg => (
                  <div key={msg._id} className="p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white text-sm">
                        {msg.playerName || msg.to}
                      </span>
                      <span className="text-xs text-slate-500">
                        {new Date(msg.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs line-clamp-1 mb-1">{msg.text}</p>
                    <div className="flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-rose-400" />
                      <span className="text-rose-400 text-xs">
                        {msg.errorMessage || 'Unknown error'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileWhatsAppAnalyticsTab;
