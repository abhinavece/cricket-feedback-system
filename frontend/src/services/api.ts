import axios from 'axios';
import type { FeedbackForm, FeedbackSubmission, Player } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

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

export const getAllFeedback = async (): Promise<FeedbackSubmission[]> => {
  const response = await api.get('/feedback');
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

export const getPlayers = async (): Promise<Player[]> => {
  const response = await api.get('/players');
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

export const getMessageHistory = async (phone: string) => {
  const response = await api.get(`/whatsapp/messages/${phone}?t=${Date.now()}`);
  return response.data;
};

// Match APIs
export const getMatches = async () => {
  const response = await api.get('/matches', { params: { limit: 100 } });
  return response.data.matches || [];
};

export const getUpcomingMatches = async () => {
  const response = await api.get('/matches', { params: { limit: 100 } });
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

export const sendReminder = async (matchId: string) => {
  const response = await api.post('/whatsapp/send-reminder', { matchId });
  return response.data;
};

// Payment APIs
export const getPayments = async () => {
  const response = await api.get('/payments');
  return response.data;
};

export const getPaymentByMatch = async (matchId: string) => {
  const response = await api.get(`/payments/match/${matchId}`);
  return response.data;
};

export const getPaymentById = async (id: string) => {
  const response = await api.get(`/payments/${id}`);
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

export const getPaymentScreenshot = (paymentId: string, memberId: string) => {
  return `${API_BASE_URL}/payments/${paymentId}/screenshot/${memberId}`;
};

export default api;
