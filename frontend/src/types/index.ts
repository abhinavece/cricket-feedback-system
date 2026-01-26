export type GroundRatingType = 'skip_it' | 'decent' | 'solid_pick' | 'prime_ground' | 'overpriced' | null;

// Performance rating can be 1-5 or null (N/A - didn't get a chance)
export type PerformanceRating = number | null;

export interface FeedbackForm {
  playerName: string;
  matchDate: Date | string;
  // Nullable ratings - null means "Didn't get a chance" (N/A)
  batting: PerformanceRating;
  bowling: PerformanceRating;
  fielding: PerformanceRating;
  teamSpirit: PerformanceRating;
  feedbackText: string;
  issues: {
    venue: boolean;
    timing: boolean;
    umpiring: boolean;
    other: boolean;
  };
  otherIssueText: string;  // Custom text when "other" is selected
  additionalComments: string;
  groundRating: GroundRatingType;
}

export interface MatchInfo {
  _id: string;
  opponent: string;
  date: string;
  ground: string;
  slot?: string;
  time?: string;
}

export interface FeedbackSubmission extends FeedbackForm {
  _id: string;
  createdAt: string;
  updatedAt: string;
  isRedacted?: boolean; // True when playerName is hidden for viewer role
  feedbackType?: 'match' | 'general';
  matchId?: string | MatchInfo; // Can be string (ID) or populated MatchInfo object
  playerId?: string;
  feedbackLinkId?: string;
}

export interface FeedbackLink {
  _id: string;
  token: string;
  matchId: string;
  isActive: boolean;
  expiresAt: string | null;
  accessCount: number;
  submissionCount: number;
  submittedPlayers: string[];
  createdAt: string;
  createdBy?: string;
}

export interface Player {
  _id: string;
  name: string;
  phone: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}
