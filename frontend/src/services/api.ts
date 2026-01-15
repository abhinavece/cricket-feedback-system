import axios from 'axios';
import type { FeedbackForm, FeedbackSubmission, Player } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth data and redirect to login
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export const submitFeedback = async (data: FeedbackForm): Promise<FeedbackSubmission> => {
  const response = await api.post('/feedback', data);
  return response.data;
};

export const getAllFeedback = async (params?: { page?: number; limit?: number }): Promise<{ feedback: FeedbackSubmission[]; pagination: { current: number; pages: number; total: number; hasMore: boolean } }> => {
  // Use lightweight summary endpoint for list view (excludes large text fields)
  const response = await api.get('/feedback/summary', { params });
  return response.data;
};

export const getFeedbackById = async (id: string): Promise<FeedbackSubmission> => {
  // Use full endpoint to get complete feedback details for modal view
  const response = await api.get(`/feedback/${id}`);
  return response.data;
};

export const getStats = async () => {
  const response = await api.get('/feedback/stats');
  return response.data;
};

export const deleteFeedback = async (id: string, deletedBy?: string) => {
  const response = await api.delete(`/feedback/${id}`, {
    data: { deletedBy: deletedBy || 'admin' }
  });
  return response.data;
};

export const getTrashFeedback = async () => {
  const response = await api.get('/feedback/trash');
  return response.data;
};

export const restoreFeedback = async (id: string) => {
  const response = await api.post(`/feedback/${id}/restore`);
  return response.data;
};

export const permanentDeleteFeedback = async (id: string) => {
  const response = await api.delete(`/feedback/${id}/permanent`);
  return response.data;
};

export const getPlayers = async (search?: string): Promise<Player[]> => {
  const params = search ? { search } : {};
  const response = await api.get('/players', { params });
  return response.data;
};

export const searchPlayers = async (search: string): Promise<Player[]> => {
  const response = await api.get('/players', { params: { search } });
  return response.data;
};

export const createPlayer = async (data: { name: string; phone: string; notes?: string }): Promise<Player> => {
  const response = await api.post('/players', data);
  return response.data;
};

export const updatePlayer = async (id: string, data: Partial<Player>): Promise<Player> => {
  const response = await api.put(`/players/${id}`, data);
  return response.data;
};

export const deletePlayer = async (id: string): Promise<void> => {
  await api.delete(`/players/${id}`);
};

export const sendWhatsAppMessage = async (payload: {
  playerIds: string[];
  message?: string;
  previewUrl?: boolean;
  template?: {
    name: string;
    languageCode: string;
    components?: any[];
  };
  matchId?: string;
  matchTitle?: string;
}) => {
  const response = await api.post('/whatsapp/send', payload);
  return response.data;
};

export const getMessageHistory = async (phone: string, options?: { limit?: number; before?: string }) => {
  const params = new URLSearchParams();
  params.append('t', Date.now().toString());
  if (options?.limit) params.append('limit', options.limit.toString());
  if (options?.before) params.append('before', options.before);
  
  const response = await api.get(`/whatsapp/messages/${phone}?${params.toString()}`);
  return response.data;
};

export const sendWhatsAppImage = async (payload: {
  playerIds: string[];
  imageBase64: string;
  caption?: string;
  matchTitle?: string;
}) => {
  const response = await api.post('/whatsapp/send-image', payload);
  return response.data;
};

// Match APIs
export const getMatches = async () => {
  // Use lightweight summary endpoint for listing views (80% smaller payload)
  const response = await api.get('/matches/summary', { params: { limit: 50 } });
  return response.data.matches || [];
};

export const getMatchesFull = async () => {
  // Use full endpoint when squad data is needed
  const response = await api.get('/matches', { params: { limit: 50 } });
  return response.data.matches || [];
};

export const getUpcomingMatches = async () => {
  // Use lightweight summary endpoint for listing views
  const response = await api.get('/matches/summary', { params: { limit: 50 } });
  const matches = response.data.matches || [];
  // Filter for upcoming matches (date >= today)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return matches.filter((match: any) => new Date(match.date) >= today);
};

export const getMatch = async (id: string) => {
  const response = await api.get(`/matches/${id}`);
  return response.data;
};

export const createMatch = async (data: any) => {
  const response = await api.post('/matches', data);
  return response.data;
};

export const updateMatch = async (id: string, data: any) => {
  const response = await api.put(`/matches/${id}`, data);
  return response.data;
};

export const deleteMatch = async (id: string) => {
  await api.delete(`/matches/${id}`);
};

// Availability APIs
export const getMatchAvailability = async (matchId: string) => {
  const response = await api.get(`/availability/match/${matchId}`);
  return response.data;
};

export const getPlayerAvailability = async (playerId: string) => {
  const response = await api.get(`/availability/player/${playerId}`);
  return response.data;
};

export const updateAvailability = async (id: string, data: { response: string; messageContent?: string }) => {
  const response = await api.put(`/availability/${id}`, data);
  return response.data;
};

export const createAvailability = async (matchId: string, playerIds: string[]) => {
  const response = await api.post('/availability', { matchId, playerIds });
  return response.data;
};

export const deleteAvailability = async (id: string) => {
  const response = await api.delete(`/availability/${id}`);
  return response.data;
};

export const sendReminder = async (matchId: string) => {
  const response = await api.post('/whatsapp/send-reminder', { matchId });
  return response.data;
};

// Payment APIs
export const getPayments = async () => {
  // Use the lightweight summary endpoint for list view
  const response = await api.get('/payments/summary');
  return response.data;
};

export const getPaymentByMatch = async (matchId: string, includeHistory = false) => {
  // Use optimized endpoint with optional history inclusion
  const query = includeHistory ? '?includeHistory=true' : '';
  const response = await api.get(`/payments/match/${matchId}${query}`);
  return response.data;
};

export const getPaymentById = async (paymentId: string, includeHistory = false) => {
  // Use optimized endpoint with optional history inclusion
  const query = includeHistory ? '?includeHistory=true' : '';
  const response = await api.get(`/payments/${paymentId}${query}`);
  return response.data;
};

export const createPayment = async (data: {
  matchId: string;
  totalAmount: number;
  squadMembers: Array<{
    playerId?: string;
    playerName: string;
    playerPhone: string;
    adjustedAmount?: number;
  }>;
  notes?: string;
}) => {
  const response = await api.post('/payments', data);
  return response.data;
};

export const updatePayment = async (id: string, data: any) => {
  const response = await api.put(`/payments/${id}`, data);
  return response.data;
};

export const updatePaymentMember = async (paymentId: string, memberId: string, data: {
  adjustedAmount?: number;
  paymentStatus?: string;
  notes?: string;
}) => {
  const response = await api.put(`/payments/${paymentId}/member/${memberId}`, data);
  return response.data;
};

export const addPaymentMember = async (paymentId: string, data: {
  playerName: string;
  playerPhone: string;
  playerId?: string;
  adjustedAmount?: number;
}) => {
  const response = await api.post(`/payments/${paymentId}/add-member`, data);
  return response.data;
};

export const removePaymentMember = async (paymentId: string, memberId: string) => {
  const response = await api.delete(`/payments/${paymentId}/member/${memberId}`);
  return response.data;
};

export const loadSquadFromAvailability = async (matchId: string) => {
  const response = await api.post(`/payments/load-squad/${matchId}`);
  return response.data;
};

export const sendPaymentRequests = async (paymentId: string, memberIds?: string[]) => {
  const response = await api.post(`/payments/${paymentId}/send-requests`, { memberIds });
  return response.data;
};

export const deletePayment = async (id: string) => {
  const response = await api.delete(`/payments/${id}`);
  return response.data;
};

export const recordPayment = async (paymentId: string, memberId: string, data: {
  amount: number;
  paymentMethod: string;
  notes?: string;
  paidAt?: string;
}) => {
  const response = await api.post(`/payments/${paymentId}/member/${memberId}/add-payment`, data);
  return response.data;
};

export const markPaymentUnpaid = async (paymentId: string, memberId: string) => {
  const response = await api.post(`/payments/${paymentId}/member/${memberId}/mark-unpaid`);
  return response.data;
};

export const getPaymentScreenshot = (paymentId: string, memberId: string) => {
  return `${API_BASE_URL}/payments/${paymentId}/screenshot/${memberId}`;
};

// Player Payment History APIs
export interface PlayerPaymentSummary {
  playerId: string;
  playerName: string;
  playerPhone: string;
  totalMatches: number;
  totalPaid: number;
  totalDue: number;
  freeMatches: number;
  pendingMatches: number;
}

export interface PaymentTransaction {
  type: 'payment' | 'refund';
  amount: number;
  date: string;
  method?: string;
  notes?: string;
}

export interface MatchPaymentHistory {
  paymentId: string;
  matchId: string;
  matchDate: string;
  opponent: string;
  ground: string;
  slot?: string;
  effectiveAmount: number;
  amountPaid: number;
  dueAmount: number;
  owedAmount: number;
  paymentStatus: string;
  isFreePlayer: boolean;
  transactions: PaymentTransaction[];
}

export interface DueMatch {
  matchId: string;
  paymentId: string;
  matchDate: string;
  opponent: string;
  dueAmount: number;
}

export interface PlayerPaymentHistoryResponse {
  success: boolean;
  playerId: string;
  playerName: string;
  playerPhone: string;
  summary: {
    totalMatches: number;
    totalPaid: number;
    totalDue: number;
    freeMatches: number;
    netContribution: number;
  };
  dueMatches: DueMatch[];
  matchHistory: MatchPaymentHistory[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export const getPlayersPaymentSummary = async (search?: string): Promise<{ players: PlayerPaymentSummary[]; total: number }> => {
  const params = search ? { search } : {};
  const response = await api.get('/payments/players-summary', { params });
  return response.data;
};

export const getPlayerPaymentHistory = async (
  playerId: string, 
  page = 1, 
  limit = 20
): Promise<PlayerPaymentHistoryResponse> => {
  const response = await api.get(`/payments/player-history/${playerId}`, { 
    params: { page, limit } 
  });
  return response.data;
};

// Public Link APIs
export const generatePublicLink = async (payload: {
  resourceType: 'match' | 'payment';
  resourceId: string;
  viewType?: 'full' | 'squad' | 'overview' | 'payment';
  expiresInDays?: number;
}) => {
  const response = await api.post('/public/generate', payload);
  return response.data;
};

// Get public resource - uses direct axios call without auth interceptors
// This endpoint is publicly accessible without authentication
export const getPublicResource = async (token: string) => {
  // API_BASE_URL already includes /api (e.g., http://localhost:5002/api)
  // Just append /public/token to it
  const response = await axios.get(`${API_BASE_URL}/public/${token}`);
  return response.data;
};

export const deactivatePublicLink = async (token: string) => {
  const response = await api.delete(`/public/${token}`);
  return response.data;
};

export const listPublicLinks = async (resourceType: string, resourceId: string) => {
  const response = await api.get(`/public/list/${resourceType}/${resourceId}`);
  return response.data;
};

// Profile APIs
export interface PlayerProfile {
  _id: string;
  name: string;
  phone: string;
  role: string;
  team: string;
  cricHeroesId?: string;
  about?: string;
  battingStyle?: string;
  bowlingStyle?: string;
}

export interface UserProfile {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  profileComplete: boolean;
}

export interface ProfileData {
  user: UserProfile;
  player: PlayerProfile | null;
}

export interface ProfileCreateData {
  name: string;
  phone: string;
  playerRole?: string;
  team?: string;
  cricHeroesId?: string;
  about?: string;
  battingStyle?: string;
  bowlingStyle?: string;
}

export const getProfile = async (): Promise<{ success: boolean; data: ProfileData }> => {
  const response = await api.get('/profile');
  return response.data;
};

export const createProfile = async (data: ProfileCreateData): Promise<{ success: boolean; data: ProfileData; message: string }> => {
  const response = await api.post('/profile', data);
  return response.data;
};

export const updateProfile = async (data: Partial<ProfileCreateData>): Promise<{ success: boolean; data: ProfileData; message: string }> => {
  const response = await api.put('/profile', data);
  return response.data;
};

export default api;
