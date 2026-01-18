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

export interface FeedbackSubmission extends FeedbackForm {
  _id: string;
  createdAt: string;
  updatedAt: string;
  isRedacted?: boolean; // True when playerName is hidden for viewer role
}

export interface Player {
  _id: string;
  name: string;
  phone: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}
