import React, { useEffect, useState } from 'react';
import { getMatchAvailability } from '../services/api';

interface AvailabilityRecord {
  _id: string;
  matchId: string;
  playerId: string;
  playerName: string;
  playerPhone: string;
  response: 'yes' | 'no' | 'tentative' | 'pending';
  respondedAt?: Date;
  messageContent?: string;
  status: 'sent' | 'delivered' | 'read' | 'responded' | 'no_response';
  createdAt: Date;
}

interface AvailabilityStats {
  total: number;
  confirmed: number;
  declined: number;
  tentative: number;
  pending: number;
  responded: number;
  noResponse: number;
}

interface Props {
  matchId: string;
  matchTitle?: string;
  onClose?: () => void;
}

const MatchAvailabilityDashboard: React.FC<Props> = ({ matchId, matchTitle, onClose }) => {
  const [availabilities, setAvailabilities] = useState<AvailabilityRecord[]>([]);
  const [stats, setStats] = useState<AvailabilityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAvailability = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getMatchAvailability(matchId);
      setAvailabilities(response.data || []);
      setStats(response.stats || null);
    } catch (err: any) {
      console.error('Failed to load availability:', err);
      setError(err.response?.data?.error || 'Failed to load availability data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAvailability();
    
    // Auto-refresh every 10 seconds
    const interval = setInterval(loadAvailability, 10000);
    return () => clearInterval(interval);
  }, [matchId]);

  const getResponseIcon = (response: string) => {
    switch (response) {
      case 'yes':
        return '✅';
      case 'no':
        return '❌';
      case 'tentative':
        return '⏳';
      default:
        return '⚪';
    }
  };

  const getResponseColor = (response: string) => {
    switch (response) {
      case 'yes':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'no':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'tentative':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getResponseLabel = (response: string) => {
    switch (response) {
      case 'yes':
        return 'Confirmed';
      case 'no':
        return 'Declined';
      case 'tentative':
        return 'Tentative';
      default:
        return 'No Response';
    }
  };

  if (loading && !availabilities.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading availability data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-800">{error}</p>
        <button
          onClick={loadAvailability}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
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
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Availability Dashboard</h2>
          {matchTitle && <p className="text-gray-600 mt-1">{matchTitle}</p>}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Confirmed</p>
                <p className="text-3xl font-bold text-green-700">{stats.confirmed}</p>
              </div>
              <div className="text-4xl">✅</div>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 font-medium">Declined</p>
                <p className="text-3xl font-bold text-red-700">{stats.declined}</p>
              </div>
              <div className="text-4xl">❌</div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600 font-medium">Tentative</p>
                <p className="text-3xl font-bold text-yellow-700">{stats.tentative}</p>
              </div>
              <div className="text-4xl">⏳</div>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">No Response</p>
                <p className="text-3xl font-bold text-gray-700">{stats.pending}</p>
              </div>
              <div className="text-4xl">⚪</div>
            </div>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      {stats && stats.total > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Response Rate</span>
            <span className="text-sm font-bold text-gray-900">
              {stats.responded}/{stats.total} ({Math.round((stats.responded / stats.total) * 100)}%)
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${(stats.responded / stats.total) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Player Responses List */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Player Responses</h3>
        </div>

        {availabilities.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p>No availability requests sent yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {availabilities.map((availability) => (
              <div key={availability._id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-3xl">{getResponseIcon(availability.response)}</div>
                    <div>
                      <p className="font-semibold text-gray-900">{availability.playerName}</p>
                      <p className="text-sm text-gray-500">{availability.playerPhone}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getResponseColor(availability.response)}`}>
                      {getResponseLabel(availability.response)}
                    </span>
                    {availability.respondedAt && (
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(availability.respondedAt).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    )}
                  </div>
                </div>
                {availability.messageContent && availability.response !== 'pending' && (
                  <div className="mt-2 ml-16 text-sm text-gray-600 italic">
                    "{availability.messageContent}"
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Refresh Info */}
      <div className="text-center text-sm text-gray-500">
        <p>Auto-refreshing every 10 seconds</p>
        <button
          onClick={loadAvailability}
          className="mt-2 text-blue-600 hover:text-blue-700 font-medium"
        >
          Refresh Now
        </button>
      </div>
    </div>
  );
};

export default MatchAvailabilityDashboard;
