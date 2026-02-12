/**
 * Server-side API functions for SSR pages.
 * These use fetch() directly (not the client-side api.ts) so they work in Server Components.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://auction.cricsmart.in/api';

async function serverFetch<T = any>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    next: { revalidate: 30 },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error.error || `API error: ${res.status}`);
  }

  return res.json();
}

export async function fetchPublicAuctions(page = 1, limit = 50, status?: string) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (status) params.set('status', status);
  return serverFetch(`/api/seo/auctions?${params}`);
}

export async function fetchAuctionBySlug(slug: string) {
  return serverFetch(`/api/seo/auctions/${slug}`);
}

export async function fetchAuctionTeams(slug: string) {
  return serverFetch(`/api/seo/auctions/${slug}/teams`);
}

export async function fetchAuctionAnalytics(slug: string) {
  return serverFetch(`/api/seo/auctions/${slug}/analytics`);
}

export async function fetchAuctionPlayers(slug: string, params?: { status?: string; role?: string; page?: number; limit?: number }) {
  const qp = new URLSearchParams();
  if (params?.status) qp.set('status', params.status);
  if (params?.role) qp.set('role', params.role);
  if (params?.page) qp.set('page', String(params.page));
  if (params?.limit) qp.set('limit', String(params.limit));
  const qs = qp.toString();
  return serverFetch(`/api/seo/auctions/${slug}/players${qs ? `?${qs}` : ''}`);
}

export async function fetchSitemapAuctions() {
  return serverFetch('/api/seo/sitemap/auctions');
}
