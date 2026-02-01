import React, { useState, useEffect } from 'react';
import { Server, Monitor, Calendar, RefreshCw, CheckCircle, AlertCircle, Brain } from 'lucide-react';
import { getBackendVersion, getAIServiceVersion, getFrontendVersion, ServiceVersionInfo } from '../services/api';

interface ServiceStatus {
  info: ServiceVersionInfo | null;
  loading: boolean;
  error: string | null;
}

const DeploymentInfo: React.FC = () => {
  const [frontend, setFrontend] = useState<ServiceStatus>({
    info: null,
    loading: true,
    error: null
  });
  const [backend, setBackend] = useState<ServiceStatus>({
    info: null,
    loading: true,
    error: null
  });
  const [aiService, setAIService] = useState<ServiceStatus>({
    info: null,
    loading: true,
    error: null
  });

  const fetchVersions = async () => {
    // Frontend version (from env vars - instant)
    try {
      const frontendInfo = getFrontendVersion();
      setFrontend({ info: frontendInfo, loading: false, error: null });
    } catch {
      setFrontend({ info: null, loading: false, error: 'Failed to load' });
    }

    // Backend version (API call)
    setBackend(prev => ({ ...prev, loading: true }));
    try {
      const backendInfo = await getBackendVersion();
      setBackend({ info: backendInfo, loading: false, error: null });
    } catch {
      setBackend({ info: null, loading: false, error: 'Failed to load' });
    }

    // AI Service version (API call via backend proxy)
    setAIService(prev => ({ ...prev, loading: true }));
    try {
      const aiInfo = await getAIServiceVersion();
      setAIService({ info: aiInfo, loading: false, error: null });
    } catch {
      setAIService({ info: null, loading: false, error: 'Failed to load' });
    }
  };

  useEffect(() => {
    fetchVersions();
  }, []);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return dateStr;
    }
  };

  const isDevVersion = (version: string) => {
    return version === '0.0.0' || version.includes('dev') || !version;
  };

  return (
    <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl border border-white/5 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <Server className="w-4 h-4" />
          Deployment Info
        </h3>
        <button
          onClick={fetchVersions}
          className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-700/50 rounded-lg transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        {/* Frontend */}
        <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
              <Monitor className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-200">Frontend</p>
              {frontend.loading ? (
                <p className="text-xs text-slate-500">Loading...</p>
              ) : frontend.error ? (
                <p className="text-xs text-red-400">{frontend.error}</p>
              ) : (
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(frontend.info?.buildDate || null)}
                </p>
              )}
            </div>
          </div>
          <div className="text-right">
            {frontend.loading ? (
              <div className="w-16 h-5 bg-slate-600/50 rounded animate-pulse" />
            ) : frontend.error ? (
              <AlertCircle className="w-4 h-4 text-red-400" />
            ) : (
              <div className="flex items-center gap-2">
                <span className={`text-sm font-mono ${isDevVersion(frontend.info?.version || '') ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {frontend.info?.version || 'N/A'}
                </span>
                {!isDevVersion(frontend.info?.version || '') && (
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Backend */}
        <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Server className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-200">Backend</p>
              {backend.loading ? (
                <p className="text-xs text-slate-500">Loading...</p>
              ) : backend.error ? (
                <p className="text-xs text-red-400">{backend.error}</p>
              ) : (
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(backend.info?.buildDate || null)}
                </p>
              )}
            </div>
          </div>
          <div className="text-right">
            {backend.loading ? (
              <div className="w-16 h-5 bg-slate-600/50 rounded animate-pulse" />
            ) : backend.error ? (
              <AlertCircle className="w-4 h-4 text-red-400" />
            ) : (
              <div className="flex items-center gap-2">
                <span className={`text-sm font-mono ${isDevVersion(backend.info?.version || '') ? 'text-amber-400' : 'text-blue-400'}`}>
                  {backend.info?.version || 'N/A'}
                </span>
                {!isDevVersion(backend.info?.version || '') && (
                  <CheckCircle className="w-4 h-4 text-blue-400" />
                )}
              </div>
            )}
          </div>
        </div>

        {/* AI Service */}
        <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Brain className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-200">AI Service</p>
              {aiService.loading ? (
                <p className="text-xs text-slate-500">Loading...</p>
              ) : aiService.error ? (
                <p className="text-xs text-red-400">{aiService.error}</p>
              ) : (
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(aiService.info?.buildDate || null)}
                </p>
              )}
            </div>
          </div>
          <div className="text-right">
            {aiService.loading ? (
              <div className="w-16 h-5 bg-slate-600/50 rounded animate-pulse" />
            ) : aiService.error ? (
              <AlertCircle className="w-4 h-4 text-red-400" />
            ) : (
              <div className="flex items-center gap-2">
                <span className={`text-sm font-mono ${isDevVersion(aiService.info?.version || '') ? 'text-amber-400' : 'text-purple-400'}`}>
                  {aiService.info?.version || 'N/A'}
                </span>
                {!isDevVersion(aiService.info?.version || '') && (
                  <CheckCircle className="w-4 h-4 text-purple-400" />
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Environment indicator */}
      {backend.info?.environment && (
        <div className="mt-3 flex items-center justify-center">
          <span className={`text-xs px-2 py-1 rounded-full ${
            backend.info.environment === 'production' 
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
          }`}>
            {backend.info.environment}
          </span>
        </div>
      )}
    </div>
  );
};

export default DeploymentInfo;
