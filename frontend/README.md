# Frontend Service

React + TypeScript web application for the Cricket Match Feedback & Team Management System.

## Overview

The frontend provides a responsive, mobile-first web interface for managing cricket teams, collecting match feedback, tracking player availability, processing payments, and communicating via WhatsApp.

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **React 18** | UI framework |
| **TypeScript** | Type safety |
| **React Router 7** | Client-side routing |
| **Tailwind CSS** | Styling |
| **Axios** | HTTP client |
| **Lucide React** | Icons |
| **Google OAuth** | Authentication |

## Quick Start

### Prerequisites

- Node.js 18+
- Backend service running (see [backend/README.md](../backend/README.md))

### Installation

```bash
cd frontend
npm install
```

### Environment Setup

```bash
cp .env.example .env
```

Edit `.env`:

```bash
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id
```

### Run Development Server

```bash
npm start
```

App runs at `http://localhost:3000`

### Production Build

```bash
npm run build
```

Output is in `build/` directory.

## Project Structure

```
frontend/src/
├── components/              # 79 React components
│   ├── mobile/             # 17 mobile-specific components
│   │   ├── MobileAdminDashboard.tsx
│   │   ├── MobileChatsTab.tsx
│   │   ├── MobileMatchesTab.tsx
│   │   ├── MobilePaymentsTab.tsx
│   │   ├── MobileGroundsTab.tsx
│   │   ├── MobileGroundProfile.tsx
│   │   └── ...
│   ├── home/               # 12 homepage components
│   │   ├── HeroSection.tsx
│   │   ├── FeaturesGrid.tsx
│   │   ├── HowItWorks.tsx
│   │   └── ...
│   ├── AdminDashboard.tsx  # Main dashboard
│   ├── MatchManagement.tsx # Match CRUD
│   ├── PaymentManagement.tsx
│   ├── GroundsTab.tsx
│   ├── WhatsAppMessagingTab.tsx
│   └── ...
├── pages/                  # 13 route-level pages
│   ├── HomePage.tsx        # Public landing page
│   ├── SettingsPage.tsx    # User settings
│   ├── PlayerProfilePage.tsx
│   ├── PublicMatchView.tsx
│   ├── PublicPaymentView.tsx
│   └── ...
├── contexts/               # React Context providers
│   ├── AuthContext.tsx     # User authentication state
│   └── OrganizationContext.tsx  # Multi-tenant org state
├── hooks/                  # Custom React hooks
│   ├── useSSE.ts           # Server-Sent Events
│   ├── useDevice.ts        # Responsive detection
│   ├── useFeatureFlags.ts  # Feature flags
│   └── useViewTracking.ts  # Analytics
├── services/
│   ├── api.ts              # Main API service (100+ methods)
│   └── matchApi.ts         # Match-specific API
├── types/
│   └── index.ts            # TypeScript definitions
├── config/
│   ├── featureFlags.ts     # Feature flag config
│   └── routes.ts           # Route definitions
├── utils/
│   ├── phoneValidation.ts  # Phone number utilities
│   ├── domain.ts           # Multi-domain detection
│   └── matchEvents.ts      # Event bus for match updates
├── App.tsx                 # Root component
├── index.tsx               # Entry point
├── theme.css               # Design system
└── index.css               # Global styles
```

## Routes

### Public Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/` | HomePage | Public landing page |
| `/login` | LoginPage | Google OAuth login |
| `/about` | AboutPage | About page |
| `/privacy` | PrivacyPolicyPage | Privacy policy |
| `/share/match/:token` | PublicMatchView | Shareable match details |
| `/share/payment/:token` | PublicPaymentView | Shareable payment details |
| `/tournament/:token` | TournamentPublicView | Public tournament view |
| `/invite/:code` | InvitePage | Organization invite |

### Protected Routes (Requires Auth)

| Path | Component | Description |
|------|-----------|-------------|
| `/settings` | SettingsPage | User profile settings |
| `/player/:playerId` | PlayerProfilePage | Player profile view |
| `/match/:matchId/feedback` | MatchFeedbackPage | Match feedback form |

### Dashboard Tabs (Admin)

| Tab | Component | Access |
|-----|-----------|--------|
| Feedback | FeedbackList | All users |
| Matches | MatchManagement | All users |
| Payments | PaymentManagement | All users |
| Grounds | GroundsTab | All users |
| History | HistoryTab | All users |
| WhatsApp | WhatsAppMessagingTab | Admin only |
| Users | UserManagement | Admin only |
| Analytics | ViewAnalytics | Admin only |
| Team | TeamSettingsTab | All users |
| Settings | Profile settings | All users |

## Components

### Desktop Components (50+)

- **Dashboard**: AdminDashboard, AdminMenu, Navigation
- **Feedback**: FeedbackForm, FeedbackCard, FeedbackList, FeedbackSummary
- **Matches**: MatchCard, MatchDetailModal, MatchForm, MatchManagement
- **Payments**: PaymentManagement, PlayerPaymentHistory
- **Grounds**: GroundsTab, GroundProfileModal, GroundRatingSelector
- **WhatsApp**: WhatsAppMessagingTab, ConversationPanel, WhatsAppAnalyticsTab
- **Players**: PlayerNameLink, PlayerFeedbackHistory, UserProfile
- **Team**: TeamOnboarding, TeamSettingsTab, OrganizationSwitcher
- **Utility**: ProtectedRoute, GoogleAuth, ShareLinkModal, ConfirmDialog

### Mobile Components (17)

All in `components/mobile/`:
- MobileAdminDashboard - Main mobile dashboard
- MobileNavigation - Bottom navigation
- MobileMatchesTab - Match list
- MobilePaymentsTab - Payment tracking
- MobileChatsTab - Conversation list
- MobileWhatsAppTab - Messaging interface
- MobileGroundsTab - Ground search
- MobileGroundProfile - Ground details
- MobileHistoryTab - Player history
- MobileSettingsTab - Settings

### Homepage Components (12)

All in `components/home/`:
- HeroSection - Main hero with CTA
- FeaturesGrid - Feature showcase
- HowItWorks - Step-by-step guide
- GroundsPreview - Ground discovery preview
- TrustSection - Trust indicators
- LoginModal - Auth modal

## API Service

The `services/api.ts` file contains 100+ API methods organized by domain:

### Authentication

```typescript
api.verifyToken()           // Verify JWT
api.googleLogin(token)      // Google OAuth login
api.getFeatureFlags()       // Get enabled features
api.logout()                // Clear session
```

### Players

```typescript
api.getPlayers(options)     // List with pagination
api.getPlayerProfile(id)    // Public profile
api.createPlayer(data)      // Create player
api.updatePlayer(id, data)  // Update player
api.deletePlayer(id)        // Delete player
```

### Matches

```typescript
api.getMatches()            // Full match list
api.getMatchesSummary()     // Lightweight list
api.getMatch(id)            // Single match
api.createMatch(data)       // Create match
api.updateMatch(id, data)   // Update match
api.deleteMatch(id)         // Delete match
```

### Feedback

```typescript
api.getAllFeedback(options) // List feedback
api.submitFeedback(data)    // Submit feedback
api.deleteFeedback(id)      // Soft delete
api.restoreFeedback(id)     // Restore deleted
api.generateFeedbackLink(matchId)  // Create shareable link
```

### Payments

```typescript
api.getPayments()           // List payments
api.createPayment(data)     // Create payment
api.updatePayment(id, data) // Update payment
api.recordPayment(id, memberId, amount) // Record member payment
api.getPlayerPaymentHistory(playerId)   // Player payment history
```

### WhatsApp

```typescript
api.getAllConversations()   // List conversations
api.getMessageHistory(phone) // Conversation messages
api.sendWhatsAppMessage(to, text) // Send message
api.getWhatsAppAnalyticsDashboard() // Message analytics
```

### Organizations

```typescript
api.getOrganizations()      // List user's orgs
api.switchOrganization(id)  // Switch active org
api.createOrganization(data) // Create org
api.searchOrganizations(query) // Team discovery
api.createOrganizationInvite(data) // Invite member
```

## Contexts

### AuthContext

Provides user authentication state:

```typescript
const { user, login, logout, isAdmin, canEdit } = useAuth();

// User object
interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'viewer' | 'editor' | 'admin';
  hasOrganizations?: boolean;
  activeOrganizationId?: string;
}
```

### OrganizationContext

Provides multi-tenant organization state:

```typescript
const {
  organization,
  organizations,
  switchOrganization,
  isOrgAdmin,
  isOrgOwner
} = useOrganization();
```

## Custom Hooks

### useSSE

Server-Sent Events for real-time updates:

```typescript
const { isConnected, status } = useSSE({
  subscriptions: ['messages', 'payments'],
  onEvent: (event) => console.log(event),
  enabled: true
});
```

### useDevice

Responsive device detection:

```typescript
const { isMobile, isTablet, isDesktop, screenWidth } = useDevice();
```

### useFeatureFlags

Feature flag management:

```typescript
const { isEnabled, isLoading } = useFeatureFlags();

if (isEnabled('TEAM_DISCOVERY')) {
  // Show team discovery UI
}
```

## Mobile-First Design

### Breakpoints

| Breakpoint | Width | Device |
|------------|-------|--------|
| `sm:` | 640px | Small phones |
| `md:` | 768px | Tablets |
| `lg:` | 1024px | Desktop |
| `xl:` | 1280px | Large desktop |

### Responsive Patterns

```tsx
// Mobile-first approach
<div className="p-3 sm:p-6">
  <h1 className="text-xl sm:text-3xl">Title</h1>
  <button className="w-full sm:w-auto">Action</button>
</div>
```

### Mobile Component Naming

Mobile-specific components use `Mobile` prefix:
- `MobileAdminDashboard.tsx`
- `MobileMatchesTab.tsx`
- `MobilePaymentsTab.tsx`

## Design System

### Colors

```css
/* Primary */
--emerald-500: #10b981;
--emerald-600: #059669;

/* Background */
--slate-800: #1e293b;
--slate-900: #0f172a;

/* Status */
--success: #10b981;  /* emerald */
--warning: #f59e0b;  /* amber */
--error: #f43f5e;    /* rose */
--info: #3b82f6;     /* blue */
```

### Component Styles

```tsx
// Cards
className="bg-slate-800/50 backdrop-blur-xl border border-white/10"

// Primary buttons
className="bg-gradient-to-r from-emerald-500 to-teal-600"

// Status badges
className="text-emerald-400 bg-emerald-500/20"  // Success
className="text-amber-400 bg-amber-500/20"      // Warning
className="text-rose-400 bg-rose-500/20"        // Error
```

## Testing

```bash
npm test           # Run tests
npm run test:watch # Watch mode
```

## Environment Variables

### Required

| Variable | Description |
|----------|-------------|
| `REACT_APP_API_URL` | Backend API URL |
| `REACT_APP_GOOGLE_CLIENT_ID` | Google OAuth client ID |

### Optional

| Variable | Default | Description |
|----------|---------|-------------|
| `REACT_APP_DISABLE_AUTH` | false | Bypass auth (dev only) |
| `REACT_APP_ENABLE_VIEW_TRACKING` | false | Enable analytics |
| `REACT_APP_FF_MULTI_TENANT` | true | Multi-tenant feature flag |
| `REACT_APP_FF_TEAM_DISCOVERY` | true | Team discovery feature flag |
| `REACT_APP_FF_WHATSAPP_BYOT` | true | WhatsApp BYOT feature flag |

## Build Configuration

### TypeScript (`tsconfig.json`)

- Target: ES5
- JSX: react-jsx
- Strict mode enabled

### Tailwind (`tailwind.config.js`)

- Scans: `./src/**/*.{js,jsx,ts,tsx}`
- Uses default theme

### Package Scripts

```bash
npm start                   # Dev server (port 3000)
npm run build              # Production build
npm test                   # Run tests
npm run generate-og-images # Generate social share images
```

## Docker

### Build

```bash
docker build -t cricket-feedback-frontend -f Dockerfile.cloudrun .
```

### Build with Args

```bash
docker build \
  --build-arg REACT_APP_API_URL=https://api.example.com \
  --build-arg REACT_APP_GOOGLE_CLIENT_ID=your-client-id \
  -t cricket-feedback-frontend .
```

## Deployment

### Vercel

1. Connect repository to Vercel
2. Set environment variables in dashboard
3. Deploy

### Cloud Run

See [infra/cloudrun/README.md](../infra/cloudrun/README.md)

### Kubernetes

See [k8s/README.md](../k8s/README.md) or Helm charts in [infra/helm/](../infra/helm/)

## Related Documentation

- [CLAUDE.md](../CLAUDE.md) - Development guidelines
- [Architecture](../ARCHITECTURE.md) - System architecture
- [Backend README](../backend/README.md) - Backend service
