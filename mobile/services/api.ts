import axios, { AxiosInstance, AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from '@/constants/config';
import type {
  FeedbackForm,
  FeedbackSubmission,
  FeedbackStats,
  Player,
  Match,
  MatchPayment,
  User,
} from '@/types';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Clear auth data on 401
      await SecureStore.deleteItemAsync('authToken');
      await SecureStore.deleteItemAsync('authUser');
      // Navigation to login will be handled by auth state
    }
    return Promise.reject(error);
  }
);

// ============ Auth API ============

export const loginWithGoogle = async (accessToken: string): Promise<{ token: string; user: User }> => {
  const response = await api.post('/auth/google/mobile', { accessToken });
  return response.data;
};

// ============ Feedback API ============

export const submitFeedback = async (data: FeedbackForm): Promise<FeedbackSubmission> => {
  const response = await api.post('/feedback', data);
  return response.data;
};

export const getAllFeedback = async (params?: { page?: number; limit?: number }): Promise<{
  feedback: FeedbackSubmission[];
  pagination: { current: number; pages: number; total: number; hasMore: boolean };
}> => {
  const response = await api.get('/feedback/summary', { params });
  return response.data;
};

export const getFeedbackById = async (id: string): Promise<FeedbackSubmission> => {
  const response = await api.get(`/feedback/${id}`);
  return response.data;
};

export const getStats = async (): Promise<FeedbackStats> => {
  const response = await api.get('/feedback/stats');
  return response.data;
};

export const deleteFeedback = async (id: string, deletedBy?: string): Promise<void> => {
  await api.delete(`/feedback/${id}`, { data: { deletedBy: deletedBy || 'admin' } });
};

export const getTrashFeedback = async (): Promise<FeedbackSubmission[]> => {
  const response = await api.get('/feedback/trash');
  return response.data;
};

export const restoreFeedback = async (id: string): Promise<void> => {
  await api.post(`/feedback/${id}/restore`);
};

export const permanentDeleteFeedback = async (id: string): Promise<void> => {
  await api.delete(`/feedback/${id}/permanent`);
};

// ============ Players API ============

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

// ============ Matches API ============

export const getMatches = async (params?: { status?: string }): Promise<Match[]> => {
  const response = await api.get('/matches/summary', { params });
  return response.data;
};

export const getMatchById = async (id: string): Promise<Match> => {
  const response = await api.get(`/matches/${id}`);
  return response.data;
};

export const createMatch = async (data: Partial<Match>): Promise<Match> => {
  const response = await api.post('/matches', data);
  return response.data;
};

export const updateMatch = async (id: string, data: Partial<Match>): Promise<Match> => {
  const response = await api.put(`/matches/${id}`, data);
  return response.data;
};

export const deleteMatch = async (id: string): Promise<void> => {
  await api.delete(`/matches/${id}`);
};

export const updateSquadResponse = async (
  matchId: string,
  playerId: string,
  response: 'yes' | 'no' | 'tentative',
  notes?: string
): Promise<Match> => {
  const res = await api.put(`/matches/${matchId}/squad/${playerId}/response`, { response, notes });
  return res.data;
};

// ============ Payments API ============

export const getPayments = async (): Promise<MatchPayment[]> => {
  const response = await api.get('/payments');
  return response.data;
};

export const getPaymentById = async (id: string): Promise<MatchPayment> => {
  const response = await api.get(`/payments/${id}`);
  return response.data;
};

export const createPayment = async (data: {
  matchId: string;
  totalAmount: number;
  playerIds: string[];
}): Promise<MatchPayment> => {
  const response = await api.post('/payments', data);
  return response.data;
};

export const recordPayment = async (
  paymentId: string,
  memberId: string,
  amount: number,
  method?: string,
  screenshot?: string
): Promise<{ member: any; summary: any }> => {
  const response = await api.post(`/payments/${paymentId}/member/${memberId}/add-payment`, {
    amount,
    method,
    screenshot,
  });
  return response.data;
};

export const updateMemberAmount = async (
  paymentId: string,
  memberId: string,
  amount: number
): Promise<{ squadMembers: any[]; summary: any }> => {
  const response = await api.put(`/payments/${paymentId}/member/${memberId}`, {
    allocatedAmount: amount,
  });
  return response.data;
};

// ============ Users API ============

export const getUsers = async (): Promise<User[]> => {
  const response = await api.get('/admin/users');
  return response.data;
};

export const updateUserRole = async (userId: string, role: string): Promise<User> => {
  const response = await api.put(`/admin/users/${userId}/role`, { role });
  return response.data;
};

export default api;
