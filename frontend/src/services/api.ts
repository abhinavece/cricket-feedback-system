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

export const sendPaymentRequests = async (paymentId: string, memberIds?: string[], customMessage?: string) => {
  const response = await api.post(`/payments/${paymentId}/send-requests`, { memberIds, customMessage });
  return response.data;
};

export const settleOverpayment = async (paymentId: string, memberId: string) => {
  const response = await api.post(`/payments/${paymentId}/member/${memberId}/settle-overpayment`);
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

// New Screenshot Collection APIs
export interface ScreenshotAIAnalysis {
  confidence: number | null;
  provider: string | null;
  model: string | null;
  transactionId: string | null;
  paymentDate: string | null;
  payerName: string | null;
  payeeName: string | null;
  paymentMethod: string | null;
  requiresReview: boolean;
  reviewReason: string | null;
}

export interface ScreenshotDistribution {
  matchId: string;
  paymentId: string;
  memberId: string;
  amountApplied: number;
  appliedAt: string;
}

export interface PaymentScreenshotData {
  _id: string;
  receivedAt: string;
  extractedAmount: number | null;
  status: 'pending_ai' | 'ai_complete' | 'ai_failed' | 'pending_review' | 'approved' | 'rejected' | 'auto_applied' | 'duplicate';
  isDuplicate: boolean;
  duplicateOf: string | null;
  reviewedBy?: { _id: string; name: string; email: string } | null;
  reviewedAt?: string | null;
  reviewNotes?: string | null;
  aiAnalysis: ScreenshotAIAnalysis;
  distributions: ScreenshotDistribution[];
  totalDistributed: number;
  remainingAmount: number | null;
}

export const getMemberScreenshots = async (paymentId: string, memberId: string): Promise<{
  success: boolean;
  data: { screenshots: PaymentScreenshotData[]; totalCount: number };
}> => {
  const response = await api.get(`/payments/${paymentId}/member/${memberId}/screenshots`);
  return response.data;
};

export const getScreenshotImage = (screenshotId: string) => {
  return `${API_BASE_URL}/payments/screenshots/${screenshotId}/image`;
};

export const getScreenshotDetails = async (screenshotId: string) => {
  const response = await api.get(`/payments/screenshots/${screenshotId}`);
  return response.data;
};

export const reviewScreenshot = async (screenshotId: string, data: {
  action: 'approve' | 'reject' | 'override';
  notes?: string;
  overrideAmount?: number;
}) => {
  const response = await api.post(`/payments/screenshots/${screenshotId}/review`, data);
  return response.data;
};

export const resolveMemberReview = async (paymentId: string, memberId: string, data: {
  action: 'accept' | 'override' | 'reject';
  correctedAmount?: number;
  notes?: string;
}) => {
  const response = await api.put(`/payments/${paymentId}/member/${memberId}/resolve-review`, data);
  return response.data;
};

export const getPendingReviewScreenshots = async (limit = 50) => {
  const response = await api.get(`/payments/screenshots/pending-review?limit=${limit}`);
  return response.data;
};

// Player Payment History APIs
export interface PlayerPaymentSummary {
  playerId: string;
  playerName: string;
  playerPhone: string;
  totalMatches: number;
  totalPaid: number;
  totalSettled?: number;
  totalDue: number;
  freeMatches: number;
  pendingMatches: number;
  /** Net paid after refunds/settlements (totalPaid - totalSettled). Prefer over totalPaid for display. */
  netContribution?: number;
}

export interface PaymentTransaction {
  type: 'payment' | 'refund' | 'settlement' | 'adjusted' | 'invalid';
  amount: number;
  date: string;
  method?: string;
  notes?: string;
  isValid?: boolean;
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
  settledAmount?: number;
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
    totalSettled: number;
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
  dateOfBirth: string;
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
  dateOfBirth: string;
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

// Webhook Proxy APIs
export interface WebhookProxyConfig {
  localRoutingEnabled: boolean;
  localServerUrl: string;
  localRoutingPhones: string[];
  productionWebhookUrl: string;
  stats: {
    totalEventsReceived: number;
    eventsRoutedToLocal: number;
    eventsRoutedToProd: number;
    lastEventAt: string | null;
    lastLocalRouteAt: string | null;
  };
  lastModifiedAt: string;
}

export const getWebhookProxyConfig = async (): Promise<{ success: boolean; data: WebhookProxyConfig }> => {
  const response = await api.get('/webhook-proxy/config');
  return response.data;
};

export const updateWebhookProxyConfig = async (data: Partial<WebhookProxyConfig>): Promise<{ success: boolean; data: WebhookProxyConfig; message: string }> => {
  const response = await api.put('/webhook-proxy/config', data);
  return response.data;
};

export const toggleWebhookLocalRouting = async (): Promise<{ success: boolean; data: { localRoutingEnabled: boolean }; message: string }> => {
  const response = await api.post('/webhook-proxy/toggle-local');
  return response.data;
};

export const addWebhookProxyPhone = async (phone: string): Promise<{ success: boolean; data: { phone: string; localRoutingPhones: string[] }; message: string }> => {
  const response = await api.post('/webhook-proxy/add-phone', { phone });
  return response.data;
};

export const removeWebhookProxyPhone = async (phone: string): Promise<{ success: boolean; data: { localRoutingPhones: string[] }; message: string }> => {
  const response = await api.delete(`/webhook-proxy/remove-phone/${phone}`);
  return response.data;
};

export const getWebhookProxyStats = async (): Promise<{ success: boolean; data: WebhookProxyConfig['stats'] & { localRoutingEnabled: boolean; configuredPhones: number } }> => {
  const response = await api.get('/webhook-proxy/stats');
  return response.data;
};

export const testWebhookLocalConnection = async (): Promise<{ success: boolean; message: string; data: { url: string; statusCode?: number; error?: string } }> => {
  const response = await api.post('/webhook-proxy/test-local');
  return response.data;
};

// Developer Tools APIs
export interface SystemSettings {
  payment: {
    bypassImageReview: boolean;
    bypassDuplicateCheck: boolean;
    forceAdminReviewThreshold: number | null;
  };
  whatsapp: {
    enabled: boolean;
    templateCooldownHours: number;
    rateLimitingEnabled: boolean;
    sessionTrackingEnabled: boolean;
    costTrackingEnabled: boolean;
    blockOutOfSessionMessages: boolean;
  };
  lastModifiedBy?: {
    _id: string;
    name: string;
    email: string;
  } | null;
  lastModifiedAt?: string | null;
}

export interface DeveloperUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  hasDeveloperAccess: boolean;
  isMasterDeveloper: boolean;
  lastLogin: string;
}

export const checkDeveloperAccess = async (): Promise<{ success: boolean; hasDeveloperAccess: boolean; isMasterDeveloper: boolean }> => {
  const response = await api.get('/developer/access');
  return response.data;
};

export const getSystemSettings = async (): Promise<{ success: boolean; settings: SystemSettings }> => {
  const response = await api.get('/developer/settings');
  return response.data;
};

export const updateSystemSettings = async (data: {
  payment?: Partial<SystemSettings['payment']>;
  whatsapp?: Partial<SystemSettings['whatsapp']>;
}): Promise<{ success: boolean; settings: SystemSettings; message: string }> => {
  const response = await api.put('/developer/settings', data);
  return response.data;
};

export const getDeveloperUsers = async (): Promise<{ success: boolean; users: DeveloperUser[] }> => {
  const response = await api.get('/developer/users');
  return response.data;
};

export const updateUserDeveloperAccess = async (userId: string, hasDeveloperAccess: boolean): Promise<{ success: boolean; user: DeveloperUser; message: string }> => {
  const response = await api.put(`/developer/users/${userId}/access`, { hasDeveloperAccess });
  return response.data;
};


// Player Public Profile API
export interface PublicPlayerProfile {
  _id: string;
  name: string;
  role: string;
  team: string;
  about?: string;
  battingStyle?: string;
  bowlingStyle?: string;
  cricHeroesId?: string;
  age: number | null;
  isActive: boolean;
  email?: string | null;
}

export const getPlayerProfile = async (playerId: string): Promise<{ success: boolean; data: PublicPlayerProfile }> => {
  const response = await api.get(`/players/${playerId}/profile`);
  return response.data;
};

// Get all conversations (for mobile chats tab)
export const getAllConversations = async (): Promise<{ success: boolean; data: Array<{ player: { _id: string; name: string; phone: string }; lastMessage: { text: string; timestamp: string; direction: string } | null; unreadCount: number }> }> => {
  const response = await api.get('/whatsapp/conversations');
  return response.data;
};

// ============================================================================
// FEEDBACK LINK APIs (Match-Specific Feedback)
// ============================================================================

export interface FeedbackLinkInfo {
  token: string;
  url: string;
  expiresAt: string | null;
  isExisting?: boolean;
  matchInfo?: {
    opponent: string;
    date: string;
    ground: string;
  };
  accessCount?: number;
  submissionCount?: number;
}

export interface MatchFeedbackStats {
  totalSubmissions: number;
  avgBatting: number;
  avgBowling: number;
  avgFielding: number;
  avgTeamSpirit: number;
  issues: {
    venue: number;
    equipment: number;
    timing: number;
    umpiring: number;
    other: number;
  };
}

export interface MatchFeedbackItem {
  _id: string;
  playerName: string;
  batting: number;
  bowling: number;
  fielding: number;
  teamSpirit: number;
  feedbackText: string;
  additionalComments?: string;
  issues: {
    venue: boolean;
    equipment: boolean;
    timing: boolean;
    umpiring: boolean;
    other: boolean;
  };
  createdAt: string;
  playerId?: {
    _id: string;
    name: string;
  };
}

export interface MatchFeedbackDashboard {
  success: boolean;
  match: {
    _id: string;
    opponent: string;
    date: string;
    time: string;
    ground: string;
    slot: string;
  };
  stats: MatchFeedbackStats;
  feedback: MatchFeedbackItem[];
  feedbackLink: {
    token: string;
    url: string;
    expiresAt: string | null;
    accessCount: number;
    submissionCount: number;
    isActive: boolean;
  } | null;
  pagination: {
    current: number;
    pages: number;
    total: number;
    hasMore: boolean;
  };
}

export interface PlayerFeedbackStats {
  totalFeedback: number;
  avgBatting: number;
  avgBowling: number;
  avgFielding: number;
  avgTeamSpirit: number;
}

export interface PlayerFeedbackItem {
  _id: string;
  playerName: string;
  matchDate: string;
  batting: number;
  bowling: number;
  fielding: number;
  teamSpirit: number;
  feedbackText: string;
  additionalComments?: string;
  issues: {
    venue: boolean;
    equipment: boolean;
    timing: boolean;
    umpiring: boolean;
    other: boolean;
  };
  createdAt: string;
  feedbackType: 'match' | 'general';
  matchId?: {
    _id: string;
    opponent: string;
    date: string;
    ground: string;
    slot: string;
  };
}

export interface PlayerFeedbackHistoryResponse {
  success: boolean;
  player: {
    _id: string;
    name: string;
  };
  stats: PlayerFeedbackStats;
  feedback: PlayerFeedbackItem[];
  pagination: {
    current: number;
    pages: number;
    total: number;
    hasMore: boolean;
  };
}

// Generate a feedback link for a match (Admin only)
export const generateFeedbackLink = async (matchId: string): Promise<FeedbackLinkInfo> => {
  const response = await api.post('/feedback/link/generate', { matchId });
  return response.data;
};

// Get feedback link info (Public)
export const getFeedbackLinkInfo = async (token: string, playerName?: string): Promise<any> => {
  const params = playerName ? { playerName } : {};
  const response = await api.get(`/feedback/link/${token}`, { params });
  return response.data;
};

// Submit feedback via link (Public)
export const submitMatchFeedback = async (token: string, data: any): Promise<any> => {
  const response = await api.post(`/feedback/link/${token}/submit`, data);
  return response.data;
};

// Get all feedback links for a match (Admin only)
export const getMatchFeedbackLinks = async (matchId: string): Promise<{ success: boolean; links: any[] }> => {
  const response = await api.get(`/feedback/link/${matchId}/links`);
  return response.data;
};

// Deactivate a feedback link (Admin only)
export const deleteFeedbackLink = async (token: string): Promise<any> => {
  const response = await api.delete(`/feedback/link/${token}`);
  return response.data;
};

// Get match feedback dashboard with stats
export const getMatchFeedback = async (matchId: string, params?: { page?: number; limit?: number }): Promise<MatchFeedbackDashboard> => {
  const response = await api.get(`/matches/${matchId}/feedback`, { params });
  return response.data;
};

// Get player feedback history
export const getPlayerFeedback = async (playerId: string, params?: { page?: number; limit?: number }): Promise<PlayerFeedbackHistoryResponse> => {
  const response = await api.get(`/players/${playerId}/feedback`, { params });
  return response.data;
};

// ============================================================================
// WHATSAPP ANALYTICS APIs
// ============================================================================

export interface WhatsAppAnalyticsDashboard {
  messages: {
    total: number;
    last30Days: number;
    last7Days: number;
    byDirection: { incoming?: number; outgoing?: number };
    byStatus: { [key: string]: number };
  };
  rates: {
    deliveryRate: string | number;
    readRate: string | number;
    failureRate: string | number;
  };
  sessions: {
    active: number;
  };
  costs: {
    total: number;
    currency: string;
  };
}

export interface WhatsAppSession {
  _id: string;
  phone: string;
  playerId?: { _id: string; name: string; phone: string };
  playerName?: string;
  lastUserMessageAt: string;
  expiresAt: string;
  sessionStartedAt: string;
  userMessageCount: number;
  businessMessageCount: number;
  status: 'active' | 'expired';
  remainingMinutes: number;
}

export interface WhatsAppSessionStatus {
  isActive: boolean;
  hasSession: boolean;
  expiresAt: string | null;
  remainingMinutes: number;
  isFree: boolean;
  sessionStartedAt?: string;
  userMessageCount?: number;
  businessMessageCount?: number;
  playerId?: string;
  playerName?: string;
}

export interface WhatsAppCooldownStatus {
  phone: string;
  cooldownRemainingMs: number;
  cooldownRemainingMinutes: number;
  cooldownRemainingHours: number;
  canSendTemplate: boolean;
  lastTemplateSentAt: string | null;
  lastTemplateName?: string;
}

export interface WhatsAppCostAnalytics {
  period: { startDate: string; endDate: string };
  summary: {
    totalCost: number;
    currency: string;
    totalMessages: number;
  };
  byCategory: Array<{ _id: string; count: number; totalCost: number }>;
  byUser: Array<{ _id: string; playerName?: string; count: number; totalCost: number }>;
  pagination: {
    current: number;
    pages: number;
    total: number;
    hasMore: boolean;
  };
}

export interface WhatsAppFailedMessage {
  _id: string;
  to: string;
  text: string;
  status: string;
  errorCode?: string;
  errorMessage?: string;
  errorDetails?: any;
  createdAt: string;
  playerId?: { _id: string; name: string; phone: string };
  playerName?: string;
}

export interface WhatsAppPreSendCheck {
  phone: string;
  session: WhatsAppSessionStatus;
  rateLimit: WhatsAppCooldownStatus | null;
  cost: {
    cost: number | null;
    reason: string;
    sessionExpiresAt?: string;
    remainingMinutes?: number;
    canSend: boolean;
    blocked?: boolean;
    category?: string;
    currency?: string;
  };
  canSend: boolean;
  blockedReason: string | null;
}

export interface WhatsAppCostConfig {
  _id: string;
  templateCosts: {
    utility: number;
    marketing: number;
    authentication: number;
    service: number;
  };
  currency: string;
  lastModifiedBy?: string;
  lastModifiedAt?: string;
}

// Get WhatsApp analytics dashboard overview
export const getWhatsAppAnalyticsDashboard = async (): Promise<{ success: boolean; data: WhatsAppAnalyticsDashboard }> => {
  const response = await api.get('/whatsapp/analytics/dashboard');
  return response.data;
};

// Get active WhatsApp sessions
export const getWhatsAppActiveSessions = async (params?: { page?: number; limit?: number }): Promise<{
  success: boolean;
  sessions: WhatsAppSession[];
  pagination: { current: number; pages: number; total: number; hasMore: boolean };
}> => {
  const response = await api.get('/whatsapp/analytics/sessions', { params });
  return response.data;
};

// Get session status for a specific phone
export const getWhatsAppSessionStatus = async (phone: string): Promise<{
  success: boolean;
  data: { session: WhatsAppSessionStatus; cooldown: WhatsAppCooldownStatus };
}> => {
  const response = await api.get(`/whatsapp/analytics/session/${phone}`);
  return response.data;
};

// Get cost analytics
export const getWhatsAppCostAnalytics = async (params?: {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}): Promise<{ success: boolean } & WhatsAppCostAnalytics> => {
  const response = await api.get('/whatsapp/analytics/costs', { params });
  return response.data;
};

// Get cost summary for a specific user
export const getWhatsAppUserCosts = async (phone: string): Promise<{
  success: boolean;
  data: { phone: string; totalCost: number; totalMessages: number; currency: string; byCategory: any[] };
}> => {
  const response = await api.get(`/whatsapp/analytics/costs/user/${phone}`);
  return response.data;
};

// Get failed messages
export const getWhatsAppFailedMessages = async (params?: {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}): Promise<{
  success: boolean;
  messages: WhatsAppFailedMessage[];
  pagination: { current: number; pages: number; total: number; hasMore: boolean };
}> => {
  const response = await api.get('/whatsapp/analytics/errors', { params });
  return response.data;
};

// Pre-flight check before sending a message
export const checkWhatsAppSendStatus = async (data: {
  phone: string;
  isTemplate?: boolean;
  templateName?: string;
  templateCategory?: string;
}): Promise<{ success: boolean; data: WhatsAppPreSendCheck }> => {
  const response = await api.post('/whatsapp/analytics/check-send', data);
  return response.data;
};

// Get WhatsApp cost configuration
export const getWhatsAppCostConfig = async (): Promise<{ success: boolean; data: WhatsAppCostConfig }> => {
  const response = await api.get('/whatsapp/analytics/cost-config');
  return response.data;
};

// Update WhatsApp cost configuration
export const updateWhatsAppCostConfig = async (data: {
  templateCosts?: Partial<WhatsAppCostConfig['templateCosts']>;
  currency?: string;
}): Promise<{ success: boolean; data: WhatsAppCostConfig }> => {
  const response = await api.put('/whatsapp/analytics/cost-config', data);
  return response.data;
};

// ============================================================================
// GROUND REVIEW APIs
// ============================================================================

export interface GroundLocation {
  address: string;
  city: string;
  state?: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface GroundAmenities {
  hasFloodlights: boolean;
  hasNets: boolean;
  hasParking: boolean;
  hasChangingRoom: boolean;
  hasToilets: boolean;
  hasDrinkingWater: boolean;
  hasScoreboard: boolean;
  hasPavilion: boolean;
}

export interface GroundCharacteristics {
  pitchType: 'turf' | 'matting' | 'cement' | 'astroturf' | 'mixed' | 'unknown';
  groundSize: 'small' | 'medium' | 'large' | 'unknown';
  boundaryType: 'rope' | 'fence' | 'natural' | 'mixed' | 'unknown';
}

export interface GroundRatingCategory {
  avg: number;
  count: number;
}

export interface GroundAggregatedRatings {
  pitch: GroundRatingCategory;
  outfield: GroundRatingCategory;
  lighting: GroundRatingCategory;
  routeAccess: GroundRatingCategory;
  locationAccessibility: GroundRatingCategory;
  nets: GroundRatingCategory;
  parking: GroundRatingCategory;
  amenities: GroundRatingCategory;
  management: GroundRatingCategory;
}

export interface GroundTrends {
  last30Days: { avg: number; count: number };
  last90Days: { avg: number; count: number };
  last365Days: { avg: number; count: number };
}

export interface Ground {
  _id: string;
  name: string;
  location: GroundLocation;
  formattedLocation?: string;
  mapsUrl?: string;
  photos: string[];
  amenities: GroundAmenities;
  characteristics: GroundCharacteristics;
  aggregatedRatings: GroundAggregatedRatings;
  overallScore: number;
  reviewCount: number;
  verifiedReviewCount: number;
  trends: GroundTrends;
  popularTags: Array<{ tag: string; count: number }>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  distanceKm?: number; // Only for nearby search
}

export interface GroundReviewRatings {
  pitch: number;
  outfield: number;
  lighting?: number | null;
  routeAccess: number;
  locationAccessibility: number;
  nets?: number | null;
  parking: number;
  amenities: number;
  management: number;
}

export interface GroundReview {
  _id: string;
  groundId: string;
  reviewerId: string;
  reviewerName: string;
  matchId?: string;
  isVerified: boolean;
  ratings: GroundReviewRatings;
  tags: string[];
  comment?: string;
  photos: string[];
  visitDate: string;
  visitType: 'match' | 'practice' | 'casual' | 'other';
  timeSlot: 'morning' | 'afternoon' | 'evening' | 'night';
  helpfulCount: number;
  createdAt: string;
}

export interface GroundCity {
  city: string;
  count: number;
  avgScore: number;
}

export interface Pagination {
  current: number;
  pages: number;
  total: number;
  hasMore: boolean;
}

// Get all grounds with search and pagination
export const getGrounds = async (params?: {
  search?: string;
  city?: string;
  page?: number;
  limit?: number;
  sortBy?: 'overallScore' | 'createdAt';
}): Promise<{ success: boolean; data: Ground[]; pagination: Pagination }> => {
  const response = await api.get('/grounds', { params });
  return response.data;
};

// Get nearby grounds
export const getNearbyGrounds = async (params: {
  lat: number;
  lng: number;
  maxDistance?: number;
  limit?: number;
}): Promise<{ success: boolean; data: Ground[] }> => {
  const response = await api.get('/grounds/nearby', { params });
  return response.data;
};

// Get list of cities with ground counts
export const getGroundCities = async (): Promise<{ success: boolean; data: GroundCity[] }> => {
  const response = await api.get('/grounds/cities');
  return response.data;
};

// Get predefined review tags
export const getGroundReviewTags = async (): Promise<{ success: boolean; data: string[] }> => {
  const response = await api.get('/grounds/tags');
  return response.data;
};

// Get a specific ground with reviews
export const getGroundById = async (id: string, params?: {
  page?: number;
  limit?: number;
}): Promise<{
  success: boolean;
  data: Ground;
  reviews: GroundReview[];
  pagination: Pagination;
}> => {
  const response = await api.get(`/grounds/${id}`, { params });
  return response.data;
};

// Create a new ground (Admin only)
export const createGround = async (data: {
  name: string;
  location: GroundLocation;
  photos?: string[];
  amenities?: Partial<GroundAmenities>;
  characteristics?: Partial<GroundCharacteristics>;
}): Promise<{ success: boolean; data: Ground; message: string }> => {
  const response = await api.post('/grounds', data);
  return response.data;
};

// Update a ground (Admin only)
export const updateGround = async (id: string, data: {
  name?: string;
  location?: GroundLocation;
  photos?: string[];
  amenities?: Partial<GroundAmenities>;
  characteristics?: Partial<GroundCharacteristics>;
  isActive?: boolean;
}): Promise<{ success: boolean; data: Ground; message: string }> => {
  const response = await api.put(`/grounds/${id}`, data);
  return response.data;
};

// Delete a ground (Admin only, soft delete)
export const deleteGround = async (id: string): Promise<{ success: boolean; message: string }> => {
  const response = await api.delete(`/grounds/${id}`);
  return response.data;
};

// Submit a review for a ground
export const submitGroundReview = async (groundId: string, data: {
  ratings: GroundReviewRatings;
  tags?: string[];
  comment?: string;
  visitDate?: string;
  visitType?: 'match' | 'practice' | 'casual' | 'other';
  timeSlot?: 'morning' | 'afternoon' | 'evening' | 'night';
  matchId?: string;
}): Promise<{ success: boolean; data: GroundReview; message: string }> => {
  const response = await api.post(`/grounds/${groundId}/reviews`, data);
  return response.data;
};

// Get reviews for a ground
export const getGroundReviews = async (groundId: string, params?: {
  page?: number;
  limit?: number;
  verified?: boolean;
}): Promise<{ success: boolean; data: GroundReview[]; pagination: Pagination }> => {
  const response = await api.get(`/grounds/${groundId}/reviews`, { params });
  return response.data;
};

// Delete a review (Owner or Admin)
export const deleteGroundReview = async (groundId: string, reviewId: string): Promise<{ success: boolean; message: string }> => {
  const response = await api.delete(`/grounds/${groundId}/reviews/${reviewId}`);
  return response.data;
};

// Get current user's reviews
export const getMyGroundReviews = async (params?: {
  page?: number;
  limit?: number;
}): Promise<{ success: boolean; data: GroundReview[]; pagination: Pagination }> => {
  const response = await api.get('/grounds/user/reviews', { params });
  return response.data;
};

// ===== Organization APIs =====

export interface Organization {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  plan: 'free' | 'starter' | 'pro' | 'enterprise';
  limits: {
    maxPlayers: number;
    maxMatches: number;
    maxAdmins: number;
    maxEditors: number;
  };
  settings: {
    defaultTimeSlot: string;
    defaultGround?: string;
    feedbackEnabled: boolean;
    paymentTrackingEnabled: boolean;
    availabilityTrackingEnabled: boolean;
    timezone: string;
  };
  stats: {
    playerCount: number;
    matchCount: number;
    memberCount: number;
  };
  whatsapp: {
    enabled: boolean;
    connectionStatus: 'pending' | 'connected' | 'disconnected' | 'error';
    displayPhoneNumber?: string;
  };
  createdAt: string;
  userRole?: 'owner' | 'admin' | 'editor' | 'viewer';
}

export interface OrganizationMember {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  playerId?: string;
  joinedAt: string;
}

// Get list of user's organizations
export const getOrganizations = async (): Promise<{
  success: boolean;
  organizations: Organization[];
  activeOrganizationId?: string;
}> => {
  const response = await api.get('/organizations');
  return response.data;
};

// Get current active organization
export const getCurrentOrganization = async (): Promise<{
  success: boolean;
  organization: Organization;
  userRole: string;
}> => {
  const response = await api.get('/organizations/current');
  return response.data;
};

// Create a new organization
export const createOrganization = async (data: {
  name: string;
  description?: string;
}): Promise<{
  success: boolean;
  organization: Organization;
  message: string;
}> => {
  const response = await api.post('/organizations', data);
  return response.data;
};

// Update current organization
export const updateOrganization = async (data: {
  name?: string;
  description?: string;
  settings?: Partial<Organization['settings']>;
}): Promise<{
  success: boolean;
  organization: Organization;
  message: string;
}> => {
  const response = await api.put('/organizations/current', data);
  return response.data;
};

// Switch active organization
export const switchOrganization = async (organizationId: string): Promise<{
  success: boolean;
  message: string;
  organization: { _id: string; name: string; slug: string };
  userRole: string;
}> => {
  const response = await api.post('/organizations/switch', { organizationId });
  return response.data;
};

// Get organization members
export const getOrganizationMembers = async (): Promise<{
  success: boolean;
  members: OrganizationMember[];
  count: number;
}> => {
  const response = await api.get('/organizations/members');
  return response.data;
};

// Invite a member to organization
export const inviteOrganizationMember = async (data: {
  email: string;
  role?: 'viewer' | 'editor' | 'admin';
}): Promise<{
  success: boolean;
  member?: OrganizationMember;
  message: string;
}> => {
  const response = await api.post('/organizations/members/invite', data);
  return response.data;
};

// Update member role
export const updateMemberRole = async (userId: string, role: string): Promise<{
  success: boolean;
  message: string;
}> => {
  const response = await api.put(`/organizations/members/${userId}/role`, { role });
  return response.data;
};

// Remove member from organization
export const removeMember = async (userId: string): Promise<{
  success: boolean;
  message: string;
}> => {
  const response = await api.delete(`/organizations/members/${userId}`);
  return response.data;
};

// Leave organization
export const leaveOrganization = async (): Promise<{
  success: boolean;
  message: string;
  newActiveOrganizationId?: string;
}> => {
  const response = await api.post('/organizations/leave');
  return response.data;
};

// Delete organization (owner only)
export const deleteOrganization = async (): Promise<{
  success: boolean;
  message: string;
  newActiveOrganizationId?: string;
}> => {
  const response = await api.delete('/organizations/current');
  return response.data;
};

export default api;
