// User types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'viewer' | 'editor' | 'admin';
  lastLogin?: string;
  createdAt?: string;
}

// Feedback types
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
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
}

// Player types
export interface Player {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Match types
export interface SquadMember {
  playerId: Player | string;
  response: 'yes' | 'no' | 'tentative' | 'pending';
  respondedAt?: string;
  notes?: string;
}

export interface SquadStats {
  total: number;
  yes: number;
  no: number;
  tentative: number;
  pending: number;
}

export interface Match {
  _id: string;
  opponent: string;
  date: string;
  time: string;
  venue: string;
  matchType: 'friendly' | 'league' | 'tournament' | 'practice';
  status: 'upcoming' | 'completed' | 'cancelled';
  squad?: SquadMember[];
  squadStats?: SquadStats;
  notes?: string;
  availabilitySent?: boolean;
  totalPlayersRequested?: number;
  yesCount?: number;
  noCount?: number;
  tentativeCount?: number;
  pendingCount?: number;
  createdBy?: User | string;
  createdAt?: string;
  updatedAt?: string;
}

// Payment types
export interface PaymentHistory {
  amount: number;
  paidAt: string;
  method?: string;
  screenshot?: string;
  notes?: string;
}

export interface SquadPaymentMember {
  playerId: Player | string;
  allocatedAmount: number;
  amountPaid: number;
  dueAmount: number;
  paymentStatus: 'pending' | 'partial' | 'paid';
  isAdjusted: boolean;
  paymentHistory: PaymentHistory[];
}

export interface MatchPayment {
  _id: string;
  matchId: Match | string;
  totalAmount: number;
  collectedAmount: number;
  pendingAmount: number;
  squadMembers: SquadPaymentMember[];
  status: 'pending' | 'partial' | 'completed';
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Stats types
export interface FeedbackStats {
  totalFeedback: number;
  avgBatting: number;
  avgBowling: number;
  avgFielding: number;
  avgTeamSpirit: number;
  issuesCounts: {
    venue: number;
    equipment: number;
    timing: number;
    umpiring: number;
    other: number;
  };
}

// API Response types
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    current: number;
    pages: number;
    total: number;
    hasMore: boolean;
  };
}

export interface ApiError {
  error: string;
  details?: string;
}
