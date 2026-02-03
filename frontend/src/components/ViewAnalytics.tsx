import React, { useState, useEffect } from 'react';
import { 
  Eye, 
  Users, 
  Calendar, 
  TrendingUp, 
  Link, 
  Home,
  RefreshCw,
  BarChart3,
  Clock
} from 'lucide-react';
import api from '../services/api';

interface ViewAnalyticsData {
  homepage: {
    totalViews: number;
    uniqueViews: number;
    lastViewedAt: string | null;
  };
  publicLinks: {
    totalViews: number;
    links: Array<{
      token: string;
      resourceType: string;
      totalViews: number;
      uniqueViews: number;
      lastViewedAt: string | null;
    }>;
  };
  summary: {
    totalViews: number;
    uniqueViews: number;
    recentViews: number;
  };
}

const ViewAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<ViewAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get('/analytics/views');
      setAnalytics(response.data.data);
    } catch (err: any) {
      console.error('Error fetching view analytics:', err);
      setError(err.response?.data?.error || 'Failed to fetch analytics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString('en-IN');
  };

  if (isLoading) {
    return (
      <div className="bg-slate-800/50 border border-white/10 rounded-xl p-6">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 animate-spin text-emerald-500" />
          <span className="ml-2 text-slate-400">Loading analytics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-800/50 border border-white/10 rounded-xl p-6">
        <div className="text-center py-8">
          <BarChart3 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 mb-4">{error}</p>
          <button
            onClick={fetchAnalytics}
            className="px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  return (
    <div className="bg-slate-800/50 border border-white/10 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-emerald-500" />
          View Analytics
        </h3>
        <button
          onClick={fetchAnalytics}
          className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          title="Refresh analytics"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <Eye className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{formatNumber(analytics.summary.totalViews)}</p>
              <p className="text-xs text-emerald-400">Total Views</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{formatNumber(analytics.summary.uniqueViews)}</p>
              <p className="text-xs text-blue-400">Unique Visitors</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <TrendingUp className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{formatNumber(analytics.summary.recentViews)}</p>
              <p className="text-xs text-purple-400">Last 7 Days</p>
            </div>
          </div>
        </div>
      </div>

      {/* Homepage Analytics */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Home className="w-4 h-4" />
          Homepage Views
        </h4>
        <div className="bg-slate-700/30 border border-white/5 rounded-xl p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-slate-500 mb-1">Total Views</p>
              <p className="text-lg font-semibold text-white">{formatNumber(analytics.homepage.totalViews)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Unique Visitors</p>
              <p className="text-lg font-semibold text-emerald-400">{formatNumber(analytics.homepage.uniqueViews)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Last Viewed</p>
              <p className="text-sm text-slate-300 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDate(analytics.homepage.lastViewedAt)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Public Links Analytics */}
      <div>
        <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Link className="w-4 h-4" />
          Public Links
        </h4>
        {analytics.publicLinks.links.length > 0 ? (
          <div className="space-y-3">
            <div className="bg-slate-700/30 border border-white/5 rounded-xl p-3">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Total Link Views</p>
                  <p className="text-lg font-semibold text-white">{formatNumber(analytics.publicLinks.totalViews)}</p>
                </div>
                <div className="md:col-span-3">
                  <p className="text-xs text-slate-500 mb-2">Individual Links</p>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {analytics.publicLinks.links.map((link, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-slate-600/30 rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-1 bg-slate-700/50 rounded text-slate-300">
                            {link.resourceType}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">
                            ...{link.token.slice(-6)}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-white">{formatNumber(link.totalViews)} views</span>
                          <span className="text-emerald-400">{formatNumber(link.uniqueViews)} unique</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-700/30 border border-white/5 rounded-xl p-6 text-center">
            <Link className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">No public links shared yet</p>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-white/5">
        <p className="text-xs text-slate-500 text-center">
          Analytics data is updated in real-time. Views are tracked per organization.
        </p>
      </div>
    </div>
  );
};

export default ViewAnalytics;
