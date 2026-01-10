import axios from 'axios';

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

export interface MatchFormData {
  date: string;
  time: string;
  slot: 'morning' | 'evening' | 'night' | 'custom';
  ground: string;
  opponent: string;
  cricHeroesMatchId: string;
  notes: string;
}

export interface SquadMember {
  player: {
    _id: string;
    name: string;
    phone: string;
    role: string;
    team: string;
  };
  response: 'yes' | 'no' | 'tentative' | 'pending';
  respondedAt: string | null;
  notes: string;
}

export interface Match {
  _id: string;
  matchId: string;
  cricHeroesMatchId: string;
  date: string;
  time: string;
  slot: string;
  opponent: string;
  ground: string;
  status: 'draft' | 'confirmed' | 'cancelled' | 'completed';
  squad: SquadMember[];
  createdBy: {
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  notes: string;
  // Availability tracking fields
  availabilitySent?: boolean;
  availabilitySentAt?: string;
  totalPlayersRequested?: number;
  confirmedPlayers?: number;
  declinedPlayers?: number;
  tentativePlayers?: number;
  noResponsePlayers?: number;
  lastAvailabilityUpdate?: string;
  squadStatus?: 'pending' | 'partial' | 'full';
}

export interface MatchStats {
  total: number;
  yes: number;
  no: number;
  tentative: number;
  pending: number;
  responseRate: number;
}

export interface MatchesResponse {
  matches: Match[];
  pagination: {
    current: number;
    pages: number;
    total: number;
    hasMore: boolean;
  };
}

class MatchApiService {
  private baseUrl = '/api/matches';

  // Get all matches with optional filters
  async getMatches(filters?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<MatchesResponse> {
    const params: any = {};
    if (filters?.status) params.status = filters.status;
    if (filters?.page) params.page = filters.page;
    if (filters?.limit) params.limit = filters.limit;

    const response = await api.get('/matches', { params });
    return response.data;
  }

  // Get single match by ID
  async getMatch(id: string): Promise<Match> {
    const response = await api.get(`/matches/${id}`);
    return response.data;
  }

  // Create new match
  async createMatch(data: MatchFormData): Promise<Match> {
    const response = await api.post('/matches', data);
    return response.data;
  }

  // Update existing match
  async updateMatch(id: string, data: Partial<MatchFormData>): Promise<Match> {
    const response = await api.put(`/matches/${id}`, data);
    return response.data;
  }

  // Delete match
  async deleteMatch(id: string): Promise<void> {
    await api.delete(`/matches/${id}`);
  }

  // Update squad response for a single player
  async updateSquadResponse(
    matchId: string, 
    playerId: string, 
    response: 'yes' | 'no' | 'tentative', 
    notes?: string
  ): Promise<Match> {
    const responseData: any = { response };
    if (notes !== undefined) responseData.notes = notes;

    const res = await api.put(`/matches/${matchId}/squad/${playerId}`, responseData);
    return res.data;
  }

  // Bulk update squad responses
  async bulkUpdateSquadResponses(
    matchId: string, 
    responses: Array<{
      playerId: string;
      response: 'yes' | 'no' | 'tentative';
      notes?: string;
    }>
  ): Promise<Match> {
    const response = await api.put(`/matches/${matchId}/squad/bulk`, { responses });
    return response.data;
  }

  // Get match statistics
  async getMatchStats(matchId: string): Promise<MatchStats> {
    const response = await api.get(`/matches/${matchId}/stats`);
    return response.data;
  }

  // Helper method to get upcoming matches
  async getUpcomingMatches(): Promise<Match[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const matchesResponse = await this.getMatches({ limit: 100 });
    return matchesResponse.matches.filter(match => 
      new Date(match.date) >= today && match.status !== 'cancelled'
    );
  }

  // Helper method to get past matches
  async getPastMatches(): Promise<Match[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const matchesResponse = await this.getMatches({ limit: 100 });
    return matchesResponse.matches.filter(match => 
      new Date(match.date) < today || match.status === 'completed'
    );
  }
}

export const matchApi = new MatchApiService();
