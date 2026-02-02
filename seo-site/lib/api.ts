/**
 * API client for fetching data from the CricSmart backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.cricsmart.in';

export interface Ground {
  _id: string;
  name: string;
  slug: string;
  location: string;
  city: string;
  state: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  amenities: string[];
  description?: string;
  images?: string[];
  averageRating: number;
  reviewCount: number;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GroundReview {
  _id: string;
  groundId: string;
  userId: string;
  reviewerName: string;
  rating: number;
  comment: string;
  visitDate?: string;
  createdAt: string;
}

export interface Player {
  _id: string;
  name: string;
  team?: string;
  role?: string;
  battingStyle?: string;
  bowlingStyle?: string;
  about?: string;
  isPublicProfile: boolean;
}

export interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: string;
  tags: string[];
  featuredImage?: string;
  status: 'draft' | 'published';
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GlossaryTerm {
  term: string;
  slug: string;
  definition: string;
  category: string;
  relatedTerms?: string[];
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    current: number;
    pages: number;
    total: number;
    hasMore: boolean;
  };
}

// API fetch helper with error handling
async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      // Cache for 1 hour by default for SEO pages
      next: { revalidate: 3600 },
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error);
    throw error;
  }
}

// Grounds API
export async function getPublicGrounds(page = 1, limit = 20): Promise<PaginatedResponse<Ground>> {
  return fetchApi(`/api/public/grounds?page=${page}&limit=${limit}`);
}

export async function getGroundBySlug(slug: string): Promise<{ success: boolean; data: Ground }> {
  return fetchApi(`/api/public/grounds/slug/${slug}`);
}

export async function getGroundReviews(groundId: string, page = 1, limit = 10): Promise<PaginatedResponse<GroundReview>> {
  return fetchApi(`/api/public/grounds/${groundId}/reviews?page=${page}&limit=${limit}`);
}

export async function getAllGroundSlugs(): Promise<{ slugs: string[] }> {
  return fetchApi('/api/sitemap/grounds');
}

// Players API
export async function getPublicPlayers(page = 1, limit = 20): Promise<PaginatedResponse<Player>> {
  return fetchApi(`/api/public/players?page=${page}&limit=${limit}`);
}

export async function getPlayerById(id: string): Promise<{ success: boolean; data: Player }> {
  return fetchApi(`/api/public/players/${id}`);
}

// Blog API
export async function getBlogPosts(page = 1, limit = 10): Promise<PaginatedResponse<BlogPost>> {
  return fetchApi(`/api/public/blog?page=${page}&limit=${limit}`);
}

export async function getBlogPostBySlug(slug: string): Promise<{ success: boolean; data: BlogPost }> {
  return fetchApi(`/api/public/blog/${slug}`);
}

export async function getAllBlogSlugs(): Promise<{ slugs: string[] }> {
  return fetchApi('/api/sitemap/blog');
}

// Site configuration
export const siteConfig = {
  name: 'CricSmart',
  description: 'AI-powered cricket team management platform. Smart match scheduling, player availability tracking, payment management, and cricket ground discovery.',
  url: 'https://cricsmart.in',
  appUrl: 'https://app.cricsmart.in',
  apiUrl: API_BASE_URL,
  ogImage: 'https://cricsmart.in/og-image.jpg',
  twitterHandle: '@cricsmart',
  locale: 'en_IN',
  keywords: [
    'cricket',
    'cricket team management',
    'cricket grounds',
    'cricket glossary',
    'cricket calculator',
    'run rate calculator',
    'DLS calculator',
    'cricket tools',
    'match scheduling',
    'player availability',
    'cricket india',
  ],
};
