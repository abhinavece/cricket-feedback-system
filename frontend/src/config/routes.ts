/**
 * Route configuration for the application
 * Maps tab IDs to URL paths and vice versa
 */

export type TabId = 
  | 'feedback' 
  | 'messages' 
  | 'conversations' 
  | 'matches' 
  | 'payments' 
  | 'grounds' 
  | 'history' 
  | 'analytics' 
  | 'users' 
  | 'team'
  | 'settings';

// Legacy tab ID mapping (for backward compatibility)
export type LegacyTabId = 
  | 'feedback' 
  | 'whatsapp' 
  | 'chats' 
  | 'matches' 
  | 'payments' 
  | 'grounds' 
  | 'player-history' 
  | 'analytics' 
  | 'users' 
  | 'team'
  | 'settings';

interface RouteConfig {
  path: string;
  tabId: TabId;
  legacyTabId: LegacyTabId;
  label: string;
  adminOnly: boolean;
}

export const routes: RouteConfig[] = [
  { path: '/feedback', tabId: 'feedback', legacyTabId: 'feedback', label: 'Feedback', adminOnly: false },
  { path: '/messages', tabId: 'messages', legacyTabId: 'whatsapp', label: 'WhatsApp', adminOnly: true },
  { path: '/conversations', tabId: 'conversations', legacyTabId: 'chats', label: 'Chats', adminOnly: true },
  { path: '/matches', tabId: 'matches', legacyTabId: 'matches', label: 'Matches', adminOnly: false },
  { path: '/payments', tabId: 'payments', legacyTabId: 'payments', label: 'Payments', adminOnly: false },
  { path: '/grounds', tabId: 'grounds', legacyTabId: 'grounds', label: 'Grounds', adminOnly: false },
  { path: '/history', tabId: 'history', legacyTabId: 'player-history', label: 'History', adminOnly: false },
  { path: '/analytics', tabId: 'analytics', legacyTabId: 'analytics', label: 'Analytics', adminOnly: true },
  { path: '/users', tabId: 'users', legacyTabId: 'users', label: 'Users', adminOnly: true },
  { path: '/team', tabId: 'team', legacyTabId: 'team', label: 'Team', adminOnly: false },
  { path: '/settings', tabId: 'settings', legacyTabId: 'settings', label: 'Settings', adminOnly: false },
];

/**
 * Get route config by path (handles both /feedback and /app/feedback formats)
 */
export const getRouteByPath = (path: string): RouteConfig | undefined => {
  // Remove /app prefix if present (for localhost)
  const normalizedPath = path.startsWith('/app') ? path.replace('/app', '') : path;
  return routes.find(r => r.path === normalizedPath);
};

/**
 * Get route config by tab ID
 */
export const getRouteByTabId = (tabId: TabId | LegacyTabId): RouteConfig | undefined => {
  return routes.find(r => r.tabId === tabId || r.legacyTabId === tabId);
};

/**
 * Get path from tab ID (handles localhost /app prefix)
 */
export const getPathFromTabId = (tabId: TabId | LegacyTabId, includeAppPrefix: boolean = false): string => {
  const route = getRouteByTabId(tabId);
  const basePath = route?.path || '/feedback';
  
  // Check if we need /app prefix (localhost development)
  if (includeAppPrefix || (typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))) {
    // On localhost, check if current path has /app prefix
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/app')) {
      return `/app${basePath}`;
    }
  }
  
  return basePath;
};

/**
 * Get legacy tab ID from path (for component compatibility)
 */
export const getLegacyTabIdFromPath = (path: string): LegacyTabId => {
  const route = getRouteByPath(path);
  return route?.legacyTabId || 'feedback';
};

/**
 * Get tab ID from path
 */
export const getTabIdFromPath = (path: string): TabId => {
  const route = getRouteByPath(path);
  return route?.tabId || 'feedback';
};

/**
 * Default route path
 */
export const DEFAULT_ROUTE = '/feedback';

/**
 * Admin-only routes
 */
export const ADMIN_ONLY_ROUTES = routes.filter(r => r.adminOnly).map(r => r.path);
