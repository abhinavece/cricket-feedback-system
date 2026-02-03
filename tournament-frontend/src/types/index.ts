// Tournament types
export interface Tournament {
  _id: string;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status: 'draft' | 'active' | 'completed';
  createdBy: string;
  organizationId: string;
  playerCount?: number;
  franchiseCount?: number;
  publicToken?: string;
  isActive?: boolean;
  branding?: {
    logo?: string;
    primaryColor?: string;
    secondaryColor?: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Player in tournament pool
export interface TournamentPlayer {
  _id: string;
  tournamentId: string;
  name: string;
  phone?: string;
  email?: string;
  role?: 'batsman' | 'bowler' | 'all-rounder' | 'wicket-keeper';
  battingStyle?: 'right-hand' | 'left-hand';
  bowlingStyle?: string;
  basePrice?: number;
  soldPrice?: number;
  franchiseId?: string; // null if unsold/available
  stats?: PlayerStats;
  createdAt: string;
}

export interface PlayerStats {
  matches?: number;
  runs?: number;
  wickets?: number;
  catches?: number;
  avgRating?: number;
}

// Franchise (team in tournament)
export interface Franchise {
  _id: string;
  tournamentId: string;
  name: string;
  shortName: string; // e.g., "CSK", "MI"
  primaryColor: string;
  secondaryColor?: string;
  logo?: string;
  owner?: string;
  captain?: string;
  budget: number;
  remainingBudget: number;
  playerIds: string[];
  createdAt: string;
}

// Feedback for tournament players
export interface TournamentFeedback {
  _id: string;
  tournamentId: string;
  playerId: string;
  playerName?: string;
  franchiseId?: string;
  matchId?: string;
  batting?: number;
  bowling?: number;
  fielding?: number;
  teamSpirit?: number;
  comments?: string;
  submittedBy: string;
  createdAt: string;
}

// User
export interface User {
  _id: string;
  email: string;
  name: string;
  picture?: string;
  role: 'viewer' | 'editor' | 'admin' | 'tournament_admin';
  organizationId?: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
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
