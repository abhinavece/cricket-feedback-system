import axios from 'axios';
import type {
  Tournament,
  TournamentPlayer,
  Franchise,
  TournamentFeedback,
  ApiResponse,
  PaginatedResponse,
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('tournament_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('tournament_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ============ AUTH ============
export const authApi = {
  googleLogin: async (credential: string) => {
    const res = await api.post<ApiResponse<{ token: string; user: any }>>('/auth/google', { credential });
    return res.data;
  },

  // Dev login - for local development only
  devLogin: async (email: string) => {
    const res = await api.post<ApiResponse<{ token: string; user: any }>>('/auth/dev-login', { email });
    return res.data;
  },

  verifyToken: async () => {
    const res = await api.get<ApiResponse<{ user: any }>>('/auth/verify');
    return res.data;
  },

  logout: () => {
    localStorage.removeItem('tournament_token');
  },
};

// ============ TOURNAMENTS ============
export const tournamentApi = {
  list: async (page = 1, limit = 20) => {
    const res = await api.get<PaginatedResponse<Tournament>>(`/tournaments?page=${page}&limit=${limit}`);
    return res.data;
  },

  get: async (id: string) => {
    const res = await api.get<ApiResponse<Tournament>>(`/tournaments/${id}`);
    return res.data;
  },

  create: async (data: Partial<Tournament>) => {
    const res = await api.post<ApiResponse<Tournament>>('/tournaments', data);
    return res.data;
  },

  update: async (id: string, data: Partial<Tournament>) => {
    const res = await api.put<ApiResponse<Tournament>>(`/tournaments/${id}`, data);
    return res.data;
  },

  delete: async (id: string) => {
    const res = await api.delete<ApiResponse<void>>(`/tournaments/${id}`);
    return res.data;
  },

  getStats: async (id: string) => {
    const res = await api.get<ApiResponse<{
      playerCount: number;
      franchiseCount: number;
      feedbackCount: number;
      avgRating: number;
    }>>(`/tournaments/${id}/stats`);
    return res.data;
  },

  generatePublicLink: async (id: string) => {
    const res = await api.post<ApiResponse<{ publicToken: string }>>(`/tournaments/${id}/publish`);
    return res.data;
  },
};

// ============ PLAYERS (backend uses "entries" – map to player shape) ============
function entryToPlayer(entry: any): TournamentPlayer {
  if (!entry) return entry;
  const { entryData, tournamentId, _id } = entry;
  return {
    _id,
    tournamentId: tournamentId?.toString?.() ?? entry.tournamentId,
    name: entryData?.name ?? '',
    phone: entryData?.phone,
    email: entryData?.email,
    role: entryData?.role,
    battingStyle: (entryData as any)?.battingStyle,
    bowlingStyle: (entryData as any)?.bowlingStyle,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
  };
}

export const playerApi = {
  list: async (tournamentId: string, params?: { page?: number; limit?: number; search?: string; franchiseId?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', String(params.page));
    if (params?.limit) queryParams.set('limit', String(params.limit));
    if (params?.search) queryParams.set('search', params.search);
    // backend entries use teamName, not franchiseId
    const res = await api.get<any>(
      `/tournaments/${tournamentId}/entries?${queryParams}`
    );
    const raw = res.data ?? res;
    const data = raw?.data ?? raw;
    const list = Array.isArray(data) ? data : [];
    return {
      success: raw?.success ?? true,
      data: list.map(entryToPlayer),
      pagination: raw?.pagination ?? { current: 1, pages: 1, total: list.length, hasMore: false },
    };
  },

  get: async (tournamentId: string, playerId: string) => {
    const listRes = await playerApi.list(tournamentId, { limit: 1 });
    const found = (listRes.data as any[]).find((p: any) => p._id === playerId);
    if (!found) return { success: false, error: 'Player not found' };
    return { success: true, data: found };
  },

  create: async (tournamentId: string, data: Partial<TournamentPlayer>) => {
    const res = await api.post<any>(
      `/tournaments/${tournamentId}/entries`,
      {
        entryData: {
          name: data.name ?? '',
          phone: data.phone ?? '',
          email: data.email ?? '',
          role: data.role ?? 'player',
          battingStyle: (data as any).battingStyle,
          bowlingStyle: (data as any).bowlingStyle,
        },
      }
    );
    const entry = res.data?.data ?? res.data;
    return { ...res, data: entryToPlayer(entry) };
  },

  update: async (tournamentId: string, playerId: string, data: Partial<TournamentPlayer>) => {
    const res = await api.put<any>(
      `/tournaments/${tournamentId}/entries/${playerId}`,
      {
        entryData: {
          name: data.name,
          phone: data.phone,
          email: data.email,
          role: data.role,
          battingStyle: (data as any).battingStyle,
          bowlingStyle: (data as any).bowlingStyle,
        },
      }
    );
    const entry = res.data?.data ?? res.data;
    return { ...res, data: entryToPlayer(entry) };
  },

  delete: async (tournamentId: string, playerId: string) => {
    const res = await api.delete<ApiResponse<void>>(
      `/tournaments/${tournamentId}/entries/${playerId}`
    );
    return res.data;
  },

  bulkImport: async (tournamentId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post<any>(
      `/tournaments/${tournamentId}/entries/bulk`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    const body = res.data ?? res;
    const imported = body?.data?.imported ?? body?.imported ?? 0;
    return { ...res, data: { imported } };
  },

  assignToFranchise: async (tournamentId: string, playerId: string, franchiseId: string, soldPrice?: number) => {
    const res = await api.put<any>(
      `/tournaments/${tournamentId}/entries/${playerId}`,
      { entryData: { teamName: franchiseId }, status: 'confirmed' }
    );
    const entry = res.data?.data ?? res.data;
    return { ...res, data: entryToPlayer(entry) };
  },

  unassign: async (tournamentId: string, playerId: string) => {
    const res = await api.put<any>(
      `/tournaments/${tournamentId}/entries/${playerId}`,
      { entryData: { teamName: '' } }
    );
    const entry = res.data?.data ?? res.data;
    return { ...res, data: entryToPlayer(entry) };
  },
};

// ============ FRANCHISES ============
// Note: Backend may not have /tournaments/:id/franchises yet – list returns [] on 404 so UI shows empty state
export const franchiseApi = {
  list: async (tournamentId: string) => {
    try {
      const res = await api.get<ApiResponse<Franchise[]>>(`/tournaments/${tournamentId}/franchises`);
      return res.data;
    } catch (err: any) {
      if (err?.response?.status === 404) return { success: true, data: [] };
      throw err;
    }
  },

  get: async (tournamentId: string, franchiseId: string) => {
    const res = await api.get<ApiResponse<Franchise>>(
      `/tournaments/${tournamentId}/franchises/${franchiseId}`
    );
    return res.data;
  },

  create: async (tournamentId: string, data: Partial<Franchise>) => {
    const res = await api.post<ApiResponse<Franchise>>(
      `/tournaments/${tournamentId}/franchises`,
      data
    );
    return res.data;
  },

  update: async (tournamentId: string, franchiseId: string, data: Partial<Franchise>) => {
    const res = await api.put<ApiResponse<Franchise>>(
      `/tournaments/${tournamentId}/franchises/${franchiseId}`,
      data
    );
    return res.data;
  },

  delete: async (tournamentId: string, franchiseId: string) => {
    const res = await api.delete<ApiResponse<void>>(
      `/tournaments/${tournamentId}/franchises/${franchiseId}`
    );
    return res.data;
  },

  getPlayers: async (tournamentId: string, franchiseId: string) => {
    const res = await api.get<ApiResponse<TournamentPlayer[]>>(
      `/tournaments/${tournamentId}/franchises/${franchiseId}/players`
    );
    return res.data;
  },
};

// ============ FEEDBACK ============
// Note: Backend may not have /tournaments/:id/feedback yet – list returns [] on 404 so UI shows empty state
export const feedbackApi = {
  list: async (tournamentId: string, params?: { page?: number; playerId?: string; franchiseId?: string }) => {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.set('page', String(params.page));
      if (params?.playerId) queryParams.set('playerId', params.playerId);
      if (params?.franchiseId) queryParams.set('franchiseId', params.franchiseId);

      const res = await api.get<PaginatedResponse<TournamentFeedback>>(
        `/tournaments/${tournamentId}/feedback?${queryParams}`
      );
      return res.data;
    } catch (err: any) {
      if (err?.response?.status === 404) return { success: true, data: [], pagination: { current: 1, pages: 0, total: 0, hasMore: false } };
      throw err;
    }
  },

  create: async (tournamentId: string, data: Partial<TournamentFeedback>) => {
    const res = await api.post<ApiResponse<TournamentFeedback>>(
      `/tournaments/${tournamentId}/feedback`,
      data
    );
    return res.data;
  },

  getPlayerFeedback: async (tournamentId: string, playerId: string) => {
    const res = await api.get<ApiResponse<TournamentFeedback[]>>(
      `/tournaments/${tournamentId}/feedback/player/${playerId}`
    );
    return res.data;
  },

  getStats: async (tournamentId: string) => {
    const res = await api.get<ApiResponse<{
      totalFeedback: number;
      avgBatting: number;
      avgBowling: number;
      avgFielding: number;
      avgTeamSpirit: number;
    }>>(`/tournaments/${tournamentId}/feedback/stats`);
    return res.data;
  },
};

export default api;
