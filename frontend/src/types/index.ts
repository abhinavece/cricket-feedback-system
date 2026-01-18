export interface FeedbackForm {
  playerName: string;
  matchDate: Date | string;
  batting: number;
  bowling: number;
  fielding: number;
  teamSpirit: number;
  feedbackText: string;
  issues: {
    venue: boolean;
    equipment: boolean;
    timing: boolean;
    umpiring: boolean;
    other: boolean;
  };
  additionalComments: string;
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
