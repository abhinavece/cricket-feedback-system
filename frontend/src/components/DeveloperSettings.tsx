import React, { useState, useEffect, useCallback } from 'react';
import {
  getSystemSettings,
  updateSystemSettings,
  getDeveloperUsers,
  updateUserDeveloperAccess,
  SystemSettings,
  DeveloperUser
} from '../services/api';
import {
  Settings,
  Shield,
  Users,
  Image,
  Copy,
  MessageSquare,
  DollarSign,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Crown,
  UserCheck,
  UserX,
  Info
} from 'lucide-react';
import WebhookProxyManager from './WebhookProxyManager';

interface DeveloperSettingsProps {
  isMasterDeveloper: boolean;
}

const DeveloperSettings: React.FC<DeveloperSettingsProps> = ({ isMasterDeveloper }) => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [users, setUsers] = useState<DeveloperUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [thresholdInput, setThresholdInput] = useState<string>('');

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getSystemSettings();
      setSettings(response.settings);
      setThresholdInput(
        response.settings.payment.forceAdminReviewThreshold !== null
          ? response.settings.payment.forceAdminReviewThreshold.toString()
          : ''
      );
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    if (!isMasterDeveloper) return;
    
    try {
      setLoadingUsers(true);
      const response = await getDeveloperUsers();
      setUsers(response.users);
    } catch (err: any) {
      console.error('Failed to load users:', err);
    } finally {
      setLoadingUsers(false);
    }
  }, [isMasterDeveloper]);

  useEffect(() => {
    fetchSettings();
    fetchUsers();
  }, [fetchSettings, fetchUsers]);

  const handleToggle = async (
    category: 'payment' | 'whatsapp',
    field: string,
    value: boolean
  ) => {
    if (!settings) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const updateData: any = {};
      updateData[category] = { [field]: value };

      const response = await updateSystemSettings(updateData);
      setSettings(response.settings);
      setSuccess(response.message);
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update setting');
    } finally {
      setSaving(false);
    }
  };

  const handleThresholdUpdate = async () => {
    if (!settings) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const threshold = thresholdInput.trim() === '' ? null : parseFloat(thresholdInput);
      
      if (threshold !== null && (isNaN(threshold) || threshold < 0)) {
        setError('Please enter a valid positive number or leave empty to disable');
        setSaving(false);
        return;
      }

      const response = await updateSystemSettings({
        payment: { forceAdminReviewThreshold: threshold }
      });
      setSettings(response.settings);
      setSuccess(response.message);
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update threshold');
    } finally {
      setSaving(false);
    }
  };

  const handleUserAccessToggle = async (userId: string, currentAccess: boolean) => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await updateUserDeveloperAccess(userId, !currentAccess);
      
      // Update local state
      setUsers(prev => prev.map(u => 
        u._id === userId ? { ...u, hasDeveloperAccess: !currentAccess } : u
      ));
      
      setSuccess(response.message);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update user access');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-800/50 dark:bg-slate-800/50 bg-white backdrop-blur-xl border border-white/10 dark:border-white/10 border-slate-200 rounded-2xl p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
          <span className="ml-3 text-slate-400 dark:text-slate-400 text-slate-600">Loading developer settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-800/50 dark:bg-slate-800/50 bg-white backdrop-blur-xl border border-white/10 dark:border-white/10 border-slate-200 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white dark:text-white text-slate-800">System Settings</h2>
              <p className="text-sm text-slate-400 dark:text-slate-400 text-slate-600">
                Configure global system behavior
                {isMasterDeveloper && (
                  <span className="ml-2 inline-flex items-center gap-1 text-amber-400">
                    <Crown className="w-3 h-3" />
                    Master Developer
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={() => { fetchSettings(); fetchUsers(); }}
            className="p-2 rounded-lg bg-white/5 dark:bg-white/5 bg-slate-100 hover:bg-white/10 dark:hover:bg-white/10 hover:bg-slate-200 text-slate-400 dark:text-slate-400 text-slate-600 hover:text-white dark:hover:text-white hover:text-slate-800 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            {error}
            <button onClick={() => setError(null)} className="ml-auto text-rose-400/60 hover:text-rose-400">
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            {success}
          </div>
        )}

        {/* Payment Settings */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-400 dark:text-slate-400 text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Payment Settings
          </h3>

          {/* Bypass Image Review */}
          <div className="p-4 rounded-xl bg-slate-700/30 dark:bg-slate-700/30 bg-slate-50 border border-white/5 dark:border-white/5 border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${settings?.payment.bypassImageReview ? 'bg-amber-500/20' : 'bg-slate-600/30 dark:bg-slate-600/30 bg-slate-200'}`}>
                  <Image className={`w-5 h-5 ${settings?.payment.bypassImageReview ? 'text-amber-400' : 'text-slate-400'}`} />
                </div>
                <div>
                  <p className="font-medium text-white dark:text-white text-slate-800">Bypass Payment Image Review</p>
                  <p className="text-sm text-slate-400 dark:text-slate-400 text-slate-500">
                    Skip admin review for payment screenshots (auto-approve)
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleToggle('payment', 'bypassImageReview', !settings?.payment.bypassImageReview)}
                disabled={saving}
                className={`relative w-14 h-8 rounded-full transition-all duration-300 ${
                  settings?.payment.bypassImageReview
                    ? 'bg-amber-500 shadow-lg shadow-amber-500/30'
                    : 'bg-slate-600 dark:bg-slate-600 bg-slate-300'
                }`}
              >
                <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300 ${
                  settings?.payment.bypassImageReview ? 'left-7' : 'left-1'
                }`} />
              </button>
            </div>
          </div>

          {/* Bypass Duplicate Check */}
          <div className="p-4 rounded-xl bg-slate-700/30 dark:bg-slate-700/30 bg-slate-50 border border-white/5 dark:border-white/5 border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${settings?.payment.bypassDuplicateCheck ? 'bg-amber-500/20' : 'bg-slate-600/30 dark:bg-slate-600/30 bg-slate-200'}`}>
                  <Copy className={`w-5 h-5 ${settings?.payment.bypassDuplicateCheck ? 'text-amber-400' : 'text-slate-400'}`} />
                </div>
                <div>
                  <p className="font-medium text-white dark:text-white text-slate-800">Bypass Duplicate Check</p>
                  <p className="text-sm text-slate-400 dark:text-slate-400 text-slate-500">
                    Skip duplicate image detection for payment screenshots
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleToggle('payment', 'bypassDuplicateCheck', !settings?.payment.bypassDuplicateCheck)}
                disabled={saving}
                className={`relative w-14 h-8 rounded-full transition-all duration-300 ${
                  settings?.payment.bypassDuplicateCheck
                    ? 'bg-amber-500 shadow-lg shadow-amber-500/30'
                    : 'bg-slate-600 dark:bg-slate-600 bg-slate-300'
                }`}
              >
                <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300 ${
                  settings?.payment.bypassDuplicateCheck ? 'left-7' : 'left-1'
                }`} />
              </button>
            </div>
          </div>

          {/* Force Admin Review Threshold */}
          <div className="p-4 rounded-xl bg-slate-700/30 dark:bg-slate-700/30 bg-slate-50 border border-white/5 dark:border-white/5 border-slate-200">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${settings?.payment.forceAdminReviewThreshold !== null ? 'bg-rose-500/20' : 'bg-slate-600/30 dark:bg-slate-600/30 bg-slate-200'}`}>
                <Shield className={`w-5 h-5 ${settings?.payment.forceAdminReviewThreshold !== null ? 'text-rose-400' : 'text-slate-400'}`} />
              </div>
              <div className="flex-1">
                <p className="font-medium text-white dark:text-white text-slate-800">Force Admin Review Threshold</p>
                <p className="text-sm text-slate-400 dark:text-slate-400 text-slate-500 mb-3">
                  Payments above this amount require admin review (leave empty to disable)
                </p>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1 max-w-[200px]">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
                    <input
                      type="number"
                      value={thresholdInput}
                      onChange={(e) => setThresholdInput(e.target.value)}
                      placeholder="e.g., 5000"
                      min="0"
                      className="w-full pl-8 pr-4 py-2 rounded-lg bg-slate-700/50 dark:bg-slate-700/50 bg-white border border-white/10 dark:border-white/10 border-slate-300 text-white dark:text-white text-slate-800 placeholder-slate-500 focus:outline-none focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/30"
                    />
                  </div>
                  <button
                    onClick={handleThresholdUpdate}
                    disabled={saving}
                    className="px-4 py-2 rounded-lg bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 transition-colors font-medium disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Set'}
                  </button>
                  {settings?.payment.forceAdminReviewThreshold !== null && settings?.payment.forceAdminReviewThreshold !== undefined && (
                    <span className="text-sm text-rose-400">
                      Active: ₹{settings?.payment.forceAdminReviewThreshold}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* WhatsApp Settings */}
        <div className="mt-6 space-y-4">
          <h3 className="text-sm font-semibold text-slate-400 dark:text-slate-400 text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            WhatsApp Settings
          </h3>

          <div className="p-4 rounded-xl bg-slate-700/30 dark:bg-slate-700/30 bg-slate-50 border border-white/5 dark:border-white/5 border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${settings?.whatsapp.enabled ? 'bg-emerald-500/20' : 'bg-rose-500/20'}`}>
                  <MessageSquare className={`w-5 h-5 ${settings?.whatsapp.enabled ? 'text-emerald-400' : 'text-rose-400'}`} />
                </div>
                <div>
                  <p className="font-medium text-white dark:text-white text-slate-800">WhatsApp Messaging</p>
                  <p className="text-sm text-slate-400 dark:text-slate-400 text-slate-500">
                    {settings?.whatsapp.enabled ? 'WhatsApp messages are enabled' : 'WhatsApp messages are disabled system-wide'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleToggle('whatsapp', 'enabled', !settings?.whatsapp.enabled)}
                disabled={saving}
                className={`relative w-14 h-8 rounded-full transition-all duration-300 ${
                  settings?.whatsapp.enabled
                    ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30'
                    : 'bg-rose-500 shadow-lg shadow-rose-500/30'
                }`}
              >
                <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300 ${
                  settings?.whatsapp.enabled ? 'left-7' : 'left-1'
                }`} />
              </button>
            </div>
          </div>
        </div>

        {/* Last Modified Info */}
        {settings?.lastModifiedAt && (
          <div className="mt-6 pt-4 border-t border-white/5 dark:border-white/5 border-slate-200">
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <Info className="w-3 h-3" />
              Last modified by {settings.lastModifiedBy?.name || 'Unknown'} on{' '}
              {new Date(settings.lastModifiedAt).toLocaleString()}
            </p>
          </div>
        )}
      </div>

      {/* User Access Management - Master Developer Only */}
      {isMasterDeveloper && (
        <div className="bg-slate-800/50 dark:bg-slate-800/50 bg-white backdrop-blur-xl border border-white/10 dark:border-white/10 border-slate-200 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-violet-400" />
            <h3 className="text-lg font-semibold text-white dark:text-white text-slate-800">Developer Access Management</h3>
          </div>
          
          <p className="text-sm text-slate-400 dark:text-slate-400 text-slate-600 mb-4">
            Grant or revoke developer tool access for other users. Only you can manage this.
          </p>

          {loadingUsers ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
              <span className="ml-2 text-slate-400">Loading users...</span>
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {users.map(user => (
                <div
                  key={user._id}
                  className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-700/30 dark:bg-slate-700/30 bg-slate-50 border border-white/5 dark:border-white/5 border-slate-200"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      user.isMasterDeveloper 
                        ? 'bg-amber-500/20' 
                        : user.hasDeveloperAccess 
                          ? 'bg-emerald-500/20' 
                          : 'bg-slate-600/30 dark:bg-slate-600/30 bg-slate-200'
                    }`}>
                      {user.isMasterDeveloper ? (
                        <Crown className="w-5 h-5 text-amber-400" />
                      ) : user.hasDeveloperAccess ? (
                        <UserCheck className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <UserX className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-white dark:text-white text-slate-800">
                        {user.name}
                        {user.isMasterDeveloper && (
                          <span className="ml-2 text-xs text-amber-400">(Master)</span>
                        )}
                      </p>
                      <p className="text-sm text-slate-400 dark:text-slate-400 text-slate-500">{user.email}</p>
                    </div>
                  </div>
                  {!user.isMasterDeveloper && (
                    <button
                      onClick={() => handleUserAccessToggle(user._id, user.hasDeveloperAccess)}
                      disabled={saving}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        user.hasDeveloperAccess
                          ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                      }`}
                    >
                      {user.hasDeveloperAccess ? 'Revoke' : 'Grant'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Webhook Proxy Manager */}
      <WebhookProxyManager />
    </div>
  );
};

export default DeveloperSettings;
