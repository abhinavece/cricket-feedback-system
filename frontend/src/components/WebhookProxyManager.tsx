import React, { useState, useEffect, useCallback } from 'react';
import {
  getWebhookProxyConfig,
  updateWebhookProxyConfig,
  toggleWebhookLocalRouting,
  addWebhookProxyPhone,
  removeWebhookProxyPhone,
  testWebhookLocalConnection,
  WebhookProxyConfig
} from '../services/api';
import { 
  Radio, 
  Wifi, 
  WifiOff, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Server, 
  Smartphone,
  Activity,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Zap
} from 'lucide-react';

const WebhookProxyManager: React.FC = () => {
  const [config, setConfig] = useState<WebhookProxyConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newPhone, setNewPhone] = useState('');
  const [newLocalUrl, setNewLocalUrl] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionResult, setConnectionResult] = useState<{ success: boolean; message: string } | null>(null);
  const [toggling, setToggling] = useState(false);

  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getWebhookProxyConfig();
      setConfig(response.data);
      setNewLocalUrl(response.data.localServerUrl);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch webhook proxy configuration');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleToggle = async () => {
    try {
      setToggling(true);
      const response = await toggleWebhookLocalRouting();
      setConfig(prev => prev ? { ...prev, localRoutingEnabled: response.data.localRoutingEnabled } : null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to toggle local routing');
    } finally {
      setToggling(false);
    }
  };

  const handleAddPhone = async () => {
    if (!newPhone.trim()) return;
    
    try {
      const response = await addWebhookProxyPhone(newPhone);
      setConfig(prev => prev ? { ...prev, localRoutingPhones: response.data.localRoutingPhones } : null);
      setNewPhone('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add phone number');
    }
  };

  const handleRemovePhone = async (phone: string) => {
    try {
      const response = await removeWebhookProxyPhone(phone);
      setConfig(prev => prev ? { ...prev, localRoutingPhones: response.data.localRoutingPhones } : null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to remove phone number');
    }
  };

  const handleUpdateLocalUrl = async () => {
    if (!newLocalUrl.trim()) return;
    
    try {
      await updateWebhookProxyConfig({ localServerUrl: newLocalUrl });
      setConfig(prev => prev ? { ...prev, localServerUrl: newLocalUrl } : null);
      setIsEditing(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update local server URL');
    }
  };

  const handleTestConnection = async () => {
    try {
      setTestingConnection(true);
      setConnectionResult(null);
      const response = await testWebhookLocalConnection();
      setConnectionResult({
        success: response.success,
        message: response.message
      });
    } catch (err: any) {
      setConnectionResult({
        success: false,
        message: err.response?.data?.message || 'Connection test failed'
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const formatPhone = (phone: string) => {
    if (phone.length === 12 && phone.startsWith('91')) {
      return `+${phone.slice(0, 2)} ${phone.slice(2, 7)} ${phone.slice(7)}`;
    }
    return phone;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full"></div>
          <span className="ml-3 text-slate-400">Loading configuration...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Radio className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Webhook Proxy</h2>
              <p className="text-sm text-slate-400">Route WhatsApp events to local development</p>
            </div>
          </div>
          <button
            onClick={fetchConfig}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            {error}
            <button onClick={() => setError(null)} className="ml-auto text-rose-400/60 hover:text-rose-400">
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Main Toggle - One Click Routing */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-slate-700/50 to-slate-800/50 border border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${config?.localRoutingEnabled ? 'bg-emerald-500/20' : 'bg-slate-600/30'}`}>
                {config?.localRoutingEnabled ? (
                  <Wifi className="w-6 h-6 text-emerald-400" />
                ) : (
                  <WifiOff className="w-6 h-6 text-slate-400" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Local Routing</h3>
                <p className="text-sm text-slate-400">
                  {config?.localRoutingEnabled 
                    ? 'Events from your phones will be forwarded to local server' 
                    : 'All events go to production only'}
                </p>
              </div>
            </div>
            <button
              onClick={handleToggle}
              disabled={toggling}
              className={`relative w-16 h-9 rounded-full transition-all duration-300 ${
                config?.localRoutingEnabled 
                  ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30' 
                  : 'bg-slate-600'
              }`}
            >
              <div className={`absolute top-1 w-7 h-7 rounded-full bg-white shadow-md transition-all duration-300 ${
                config?.localRoutingEnabled ? 'left-8' : 'left-1'
              }`}>
                {toggling && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Local Server Configuration */}
      <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Server className="w-5 h-5 text-violet-400" />
          <h3 className="text-lg font-semibold text-white">Local Development Server</h3>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {isEditing ? (
              <>
                <input
                  type="text"
                  value={newLocalUrl}
                  onChange={(e) => setNewLocalUrl(e.target.value)}
                  placeholder="http://localhost:5002 or http://192.168.1.100:5002"
                  className="flex-1 px-4 py-3 rounded-xl bg-slate-700/50 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30"
                />
                <button
                  onClick={handleUpdateLocalUrl}
                  className="px-4 py-3 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors font-medium"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setNewLocalUrl(config?.localServerUrl || '');
                  }}
                  className="px-4 py-3 rounded-xl bg-slate-600/30 text-slate-400 hover:bg-slate-600/50 transition-colors"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <div className="flex-1 px-4 py-3 rounded-xl bg-slate-700/30 border border-white/5 text-white font-mono text-sm">
                  {config?.localServerUrl || 'Not configured'}
                </div>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-3 rounded-xl bg-violet-500/20 text-violet-400 hover:bg-violet-500/30 transition-colors font-medium"
                >
                  Edit
                </button>
              </>
            )}
          </div>

          {/* Test Connection Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleTestConnection}
              disabled={testingConnection || !config?.localServerUrl}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {testingConnection ? (
                <>
                  <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                  Testing...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Test Connection
                </>
              )}
            </button>
            
            {connectionResult && (
              <div className={`flex items-center gap-2 text-sm ${connectionResult.success ? 'text-emerald-400' : 'text-rose-400'}`}>
                {connectionResult.success ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                {connectionResult.message}
              </div>
            )}
          </div>

          <p className="text-xs text-slate-500">
            Tip: Use your machine's IP address (e.g., http://192.168.1.100:5002) if testing from a different device on the same network.
          </p>
        </div>
      </div>

      {/* Phone Numbers for Local Routing */}
      <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Smartphone className="w-5 h-5 text-violet-400" />
          <h3 className="text-lg font-semibold text-white">Phones for Local Routing</h3>
        </div>

        <p className="text-sm text-slate-400 mb-4">
          Messages from these phone numbers will be forwarded to your local development server (in addition to production).
        </p>

        {/* Add Phone Form */}
        <div className="flex gap-3 mb-4">
          <input
            type="text"
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
            placeholder="Enter phone number (e.g., 918087102325)"
            className="flex-1 px-4 py-3 rounded-xl bg-slate-700/50 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30"
            onKeyPress={(e) => e.key === 'Enter' && handleAddPhone()}
          />
          <button
            onClick={handleAddPhone}
            disabled={!newPhone.trim()}
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-violet-500/20 text-violet-400 hover:bg-violet-500/30 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>

        {/* Phone List */}
        <div className="space-y-2">
          {config?.localRoutingPhones.length === 0 ? (
            <div className="text-center py-6 text-slate-500 text-sm">
              No phone numbers configured. Add your phone number to start routing events to local.
            </div>
          ) : (
            config?.localRoutingPhones.map((phone) => (
              <div
                key={phone}
                className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-700/30 border border-white/5 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                    <Smartphone className="w-4 h-4 text-emerald-400" />
                  </div>
                  <span className="text-white font-mono">{formatPhone(phone)}</span>
                </div>
                <button
                  onClick={() => handleRemovePhone(phone)}
                  className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Statistics */}
      <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-violet-400" />
          <h3 className="text-lg font-semibold text-white">Routing Statistics</h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-700/30 border border-white/5">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Total Events</p>
            <p className="text-2xl font-bold text-white">{config?.stats.totalEventsReceived || 0}</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-700/30 border border-white/5">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">To Production</p>
            <p className="text-2xl font-bold text-emerald-400">{config?.stats.eventsRoutedToProd || 0}</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-700/30 border border-white/5">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">To Local Dev</p>
            <p className="text-2xl font-bold text-violet-400">{config?.stats.eventsRoutedToLocal || 0}</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-700/30 border border-white/5">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Phones Configured</p>
            <p className="text-2xl font-bold text-amber-400">{config?.localRoutingPhones.length || 0}</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-700/20">
            <span className="text-slate-400">Last Event Received</span>
            <span className="text-white">{formatDate(config?.stats.lastEventAt || null)}</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-700/20">
            <span className="text-slate-400">Last Local Route</span>
            <span className="text-white">{formatDate(config?.stats.lastLocalRouteAt || null)}</span>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-gradient-to-br from-violet-500/10 to-purple-500/5 border border-violet-500/20 rounded-2xl p-6">
        <h4 className="text-sm font-semibold text-violet-300 mb-2">How it works</h4>
        <ul className="text-sm text-slate-400 space-y-2">
          <li className="flex items-start gap-2">
            <span className="text-violet-400 mt-0.5">1.</span>
            <span>All WhatsApp webhook events <strong className="text-white">always go to production</strong> - no data is ever lost</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-violet-400 mt-0.5">2.</span>
            <span>When local routing is <strong className="text-emerald-400">enabled</strong>, events from your configured phone numbers are <strong className="text-white">also</strong> forwarded to your local server</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-violet-400 mt-0.5">3.</span>
            <span>Events from other users' phones will <strong className="text-white">only</strong> go to production (not affected by local routing)</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default WebhookProxyManager;
