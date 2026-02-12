import { siteConfig, AUTH_STORAGE_KEY } from './constants';

const API_BASE = siteConfig.apiUrl;

interface FetchOptions extends RequestInit {
  auth?: boolean;
}

async function fetchApi<T = any>(path: string, options: FetchOptions = {}): Promise<T> {
  const { auth = false, headers: customHeaders, ...rest } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(customHeaders as Record<string, string>),
  };

  if (auth && typeof window !== 'undefined') {
    const token = localStorage.getItem(AUTH_STORAGE_KEY);
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const res = await fetch(`${API_BASE}${path}`, { headers, ...rest });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error.error || error.message || `API error: ${res.status}`);
  }

  return res.json();
}

// ============================================================
// Public SEO Endpoints (no auth)
// ============================================================

export async function getPublicAuctions(page = 1, limit = 20, status?: string) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (status) params.set('status', status);
  return fetchApi(`/api/seo/auctions?${params}`);
}

export async function getAuctionBySlug(slug: string) {
  return fetchApi(`/api/seo/auctions/${slug}`);
}

export async function getAuctionTeams(slug: string) {
  return fetchApi(`/api/seo/auctions/${slug}/teams`);
}

export async function getAuctionAnalytics(slug: string) {
  return fetchApi(`/api/seo/auctions/${slug}/analytics`);
}

export async function getAuctionPlayers(slug: string, page = 1, limit = 50, status?: string) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (status) params.set('status', status);
  return fetchApi(`/api/seo/auctions/${slug}/players?${params}`);
}

export async function getSitemapAuctions() {
  return fetchApi('/api/seo/sitemap/auctions');
}

// ============================================================
// Admin Endpoints (auth required)
// ============================================================

export async function getMyAuctions(page = 1, limit = 20, status?: string) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (status) params.set('status', status);
  return fetchApi(`/api/v1/auctions?${params}`, { auth: true });
}

export async function getAuctionAdmin(auctionId: string) {
  return fetchApi(`/api/v1/auctions/${auctionId}`, { auth: true });
}

export async function createAuction(data: {
  name: string;
  description?: string;
  config: {
    basePrice: number;
    purseValue: number;
    minSquadSize: number;
    maxSquadSize: number;
    bidIncrementPreset?: string;
    retentionEnabled?: boolean;
    maxRetentions?: number;
  };
}) {
  return fetchApi('/api/v1/auctions', {
    method: 'POST',
    body: JSON.stringify(data),
    auth: true,
  });
}

export async function updateAuctionConfig(auctionId: string, data: Record<string, any>) {
  return fetchApi(`/api/v1/auctions/${auctionId}/config`, {
    method: 'PATCH',
    body: JSON.stringify(data),
    auth: true,
  });
}

export async function configureAuction(auctionId: string) {
  return fetchApi(`/api/v1/auctions/${auctionId}/configure`, {
    method: 'POST',
    auth: true,
  });
}

export async function goLiveAuction(auctionId: string) {
  return fetchApi(`/api/v1/auctions/${auctionId}/go-live`, {
    method: 'POST',
    auth: true,
  });
}

export async function pauseAuction(auctionId: string, reason?: string) {
  return fetchApi(`/api/v1/auctions/${auctionId}/pause`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
    auth: true,
  });
}

export async function resumeAuction(auctionId: string) {
  return fetchApi(`/api/v1/auctions/${auctionId}/resume`, {
    method: 'POST',
    auth: true,
  });
}

export async function completeAuction(auctionId: string, reason?: string) {
  return fetchApi(`/api/v1/auctions/${auctionId}/complete`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
    auth: true,
  });
}

export async function deleteAuction(auctionId: string) {
  return fetchApi(`/api/v1/auctions/${auctionId}`, {
    method: 'DELETE',
    auth: true,
  });
}

export async function addAuctionAdmin(auctionId: string, email: string) {
  return fetchApi(`/api/v1/auctions/${auctionId}/admins`, {
    method: 'POST',
    body: JSON.stringify({ email }),
    auth: true,
  });
}

export async function removeAuctionAdmin(auctionId: string, userId: string) {
  return fetchApi(`/api/v1/auctions/${auctionId}/admins/${userId}`, {
    method: 'DELETE',
    auth: true,
  });
}

export async function getBidIncrementPresets() {
  return fetchApi('/api/v1/auctions/presets/bid-increments');
}

// ============================================================
// Team Admin Endpoints
// ============================================================

export async function getAuctionTeamsAdmin(auctionId: string) {
  return fetchApi(`/api/v1/auctions/${auctionId}/teams`, { auth: true });
}

export async function addTeam(auctionId: string, data: {
  name: string;
  shortName: string;
  primaryColor?: string;
  owner?: { name?: string; email?: string; };
}) {
  return fetchApi(`/api/v1/auctions/${auctionId}/teams`, {
    method: 'POST',
    body: JSON.stringify(data),
    auth: true,
  });
}

export async function updateTeam(auctionId: string, teamId: string, data: Record<string, any>) {
  return fetchApi(`/api/v1/auctions/${auctionId}/teams/${teamId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
    auth: true,
  });
}

export async function deleteTeam(auctionId: string, teamId: string) {
  return fetchApi(`/api/v1/auctions/${auctionId}/teams/${teamId}`, {
    method: 'DELETE',
    auth: true,
  });
}

export async function regenerateTeamAccess(auctionId: string, teamId: string) {
  return fetchApi(`/api/v1/auctions/${auctionId}/teams/${teamId}/regenerate-access`, {
    method: 'POST',
    auth: true,
  });
}

// ============================================================
// Player Admin Endpoints
// ============================================================

export async function getAuctionPlayersAdmin(auctionId: string, params?: Record<string, string>) {
  const search = new URLSearchParams(params);
  return fetchApi(`/api/v1/auctions/${auctionId}/players?${search}`, { auth: true });
}

export async function addPlayer(auctionId: string, data: {
  name: string;
  role: string;
  imageUrl?: string;
  customFields?: Record<string, any>;
}) {
  return fetchApi(`/api/v1/auctions/${auctionId}/players`, {
    method: 'POST',
    body: JSON.stringify(data),
    auth: true,
  });
}

export async function importPlayersPreview(auctionId: string, file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const token = typeof window !== 'undefined' ? localStorage.getItem(AUTH_STORAGE_KEY) : null;
  const res = await fetch(`${API_BASE}/api/v1/auctions/${auctionId}/players/import`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error.error || `Import failed: ${res.status}`);
  }

  return res.json();
}

// ============================================================
// Display Config Endpoints
// ============================================================

export async function getDisplayConfig(auctionId: string) {
  return fetchApi(`/api/v1/auctions/${auctionId}/display-config`, { auth: true });
}

export async function updateDisplayConfig(auctionId: string, playerFields: any[]) {
  return fetchApi(`/api/v1/auctions/${auctionId}/display-config`, {
    method: 'PATCH',
    body: JSON.stringify({ playerFields }),
    auth: true,
  });
}

export async function importPlayersConfirm(auctionId: string, file: File, columnMapping: Record<string, string>) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('columnMapping', JSON.stringify(columnMapping));

  const token = typeof window !== 'undefined' ? localStorage.getItem(AUTH_STORAGE_KEY) : null;
  const res = await fetch(`${API_BASE}/api/v1/auctions/${auctionId}/players/import`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error.error || `Import failed: ${res.status}`);
  }

  return res.json();
}
