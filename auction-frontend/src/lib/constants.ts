export const siteConfig = {
  name: 'CricSmart Auctions',
  shortName: 'Auctions',
  description: 'IPL-style cricket player auctions powered by AI. Real-time bidding, smart player valuation, budget management, and spectator mode.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://auction.cricsmart.in',
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://app.cricsmart.in',
  seoUrl: process.env.NEXT_PUBLIC_SEO_URL || 'https://cricsmart.in',
  ogImage: '/og/auction-default.jpg',
  twitterHandle: '@cricsmart',
  locale: 'en_IN',
  keywords: [
    'cricket auction',
    'IPL auction',
    'player auction',
    'cricket player bidding',
    'online auction',
    'team management',
    'cricket league',
    'fantasy auction',
    'live bidding',
    'CricSmart',
  ],
};

export const AUCTION_STATUSES = {
  draft: { label: 'Draft', color: 'text-slate-400', bg: 'bg-slate-500/20', dot: 'bg-slate-400' },
  configured: { label: 'Ready', color: 'text-blue-400', bg: 'bg-blue-500/20', dot: 'bg-blue-400' },
  live: { label: 'LIVE', color: 'text-red-400', bg: 'bg-red-500/20', dot: 'bg-red-500 animate-pulse' },
  paused: { label: 'Paused', color: 'text-yellow-400', bg: 'bg-yellow-500/20', dot: 'bg-yellow-400' },
  completed: { label: 'Completed', color: 'text-emerald-400', bg: 'bg-emerald-500/20', dot: 'bg-emerald-400' },
  trade_window: { label: 'Trading', color: 'text-purple-400', bg: 'bg-purple-500/20', dot: 'bg-purple-400' },
  finalized: { label: 'Finalized', color: 'text-slate-300', bg: 'bg-slate-600/20', dot: 'bg-slate-300' },
} as const;

export const PLAYER_ROLES = {
  batsman: { label: 'Batsman', icon: '🏏', color: 'text-blue-400' },
  bowler: { label: 'Bowler', icon: '🎯', color: 'text-red-400' },
  'all-rounder': { label: 'All-Rounder', icon: '⭐', color: 'text-amber-400' },
  'wicket-keeper': { label: 'Wicket Keeper', icon: '🧤', color: 'text-emerald-400' },
} as const;

export const AUTH_STORAGE_KEY = 'auction_auth_token';
export const AUTH_USER_KEY = 'auction_auth_user';
