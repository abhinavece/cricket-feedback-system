# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Cricket Match Feedback & Team Management System - a MERN stack application with WhatsApp Cloud API integration for managing cricket team matches, collecting player feedback, tracking availability, and providing admin dashboards.

## Build & Run Commands

### Local Development
```bash
# Backend (port 5000)
cd backend && npm run dev

# Frontend (port 3000)
cd frontend && npm start

# Both concurrently (from root)
npm run dev
```

### Docker/Kubernetes Deployment
```bash
# Docker Desktop k8s
kubectl apply -f k8s/

# OCI Cloud with Helm
helm upgrade cricket-feedback ./infra/helm/cricket-feedback \
  --namespace cricket-feedback \
  --values ./infra/helm/cricket-feedback/values.yaml \
  --values ./infra/helm/cricket-feedback/values-development.yaml
```

### Docker Build (OCI Registry)
```bash
# Frontend (requires build args)
docker buildx build --platform linux/amd64 \
  --build-arg REACT_APP_API_URL=https://mavericks11.duckdns.org/api \
  --build-arg REACT_APP_GOOGLE_CLIENT_ID=<client-id> \
  -t phx.ocir.io/axkw6whnjncs/cricket-feedback-frontend:vXX \
  --push frontend

# Backend
docker buildx build --platform linux/amd64 \
  --push -t phx.ocir.io/axkw6whnjncs/cricket-feedback-backend:vXX \
  -f backend/Dockerfile ./backend
```

## Architecture

### Tech Stack
- **Frontend**: React 18 + TypeScript, Tailwind CSS, Axios, Google OAuth
- **Backend**: Node.js + Express 5, MongoDB/Mongoose, JWT auth
- **Infrastructure**: Docker, Kubernetes, Helm, OCI

### Key Directories
```
frontend/src/
├── components/           # React components (25+)
│   ├── mobile/           # Mobile-specific components
│   │   ├── MobileAdminDashboard.tsx
│   │   ├── MobileChatsTab.tsx      # Mobile conversations list
│   │   ├── MobileNavigation.tsx
│   │   └── ...
│   ├── WhatsAppMessagingTab.tsx    # Desktop WhatsApp with modal chat
│   ├── ConversationPanel.tsx       # Reusable chat panel (fullscreen/panel modes)
│   ├── PlayerNameLink.tsx          # Clickable player name → profile navigation
│   └── ...
├── pages/                # Route-level components
│   ├── PlayerProfilePage.tsx       # Public player profile (/player/:playerId)
│   ├── SettingsPage.tsx            # User settings
│   └── ...
├── contexts/             # AuthContext for user state
├── services/             # api.ts with 50+ API methods
├── hooks/                # Custom hooks (useSSE, useDevice, etc.)
├── utils/                # Utility functions
└── types/                # TypeScript interfaces

backend/
├── routes/               # 7 route files
│   ├── feedback.js       # Feedback CRUD, stats, soft delete/restore
│   ├── auth.js           # Google OAuth, JWT verification, user management
│   ├── players.js        # Player CRUD, profile endpoint
│   ├── matches.js        # Match CRUD, squad management, stats
│   ├── availability.js   # Availability tracking per player-match
│   ├── whatsapp.js       # Webhook receiver, message sending, conversations
│   └── admin.js          # Admin-only operations
├── models/               # 6 Mongoose schemas
│   ├── Feedback.js
│   ├── User.js
│   ├── Player.js         # Links to User via userId field
│   ├── Match.js
│   ├── Availability.js
│   └── Message.js
├── middleware/           # JWT auth middleware
└── config/               # Database connection
```

### API Structure
Base URL: `http://localhost:5000/api` (dev) or configured via `REACT_APP_API_URL`

| Route | Purpose |
|-------|---------|
| `/api/feedback` | Feedback CRUD, stats, soft delete/restore |
| `/api/auth` | Google OAuth, JWT verification, user management |
| `/api/players` | Player CRUD, `/players/:id/profile` for public profile |
| `/api/matches` | Match CRUD, squad management, stats |
| `/api/availability` | Availability tracking per player-match |
| `/api/whatsapp` | Webhook, message sending, `/conversations` for chat list |

### Frontend Routing
```
/                     → Main app (FeedbackForm or AdminDashboard based on auth)
/player/:playerId     → PlayerProfilePage (public player info, requires auth)
/share/match/:token   → PublicMatchView (shareable match details)
/share/payment/:token → PublicPaymentView (shareable payment details)
```

### Authentication Flow
1. Google OAuth login → Server generates 24h JWT
2. Token stored in localStorage, sent via `Authorization: Bearer <token>`
3. Three roles: `viewer` (submit), `editor` (view/edit), `admin` (all + manage users)

### WhatsApp Integration
- Webhook endpoint at `/api/whatsapp/webhook` for receiving messages
- Context ID validation: Only updates availability when `context.id` matches valid `availability_request` or `availability_reminder` message
- All incoming messages are persisted regardless of context validation outcome
- SSE (Server-Sent Events) for real-time message updates in chat UI

## Key Data Models

### Player
- Links to User via `userId` field (for email association)
- Contains: name, phone, role, team, about, battingStyle, bowlingStyle, dateOfBirth, cricHeroesId
- Profile endpoint returns sanitized data (excludes phone, notes, exact DOB)

### Match
Tracks opponent, ground, date/time, squad responses (yes/no/tentative/pending), availability stats, CricHeroes integration

### Availability
Links player to match with response status, timestamps, message content, reminder tracking

### Message
WhatsApp message history with direction, context linking to matches/availability, message types (general, availability_request, availability_response, availability_reminder)

## UI/UX Guidelines

### Mobile-First Design
- Design for mobile first, then enhance for desktop
- Use Tailwind responsive classes: `sm:`, `md:`, `lg:`
- Consolidate stats into compact cards for mobile
- Icon-only buttons on mobile, text on desktop

### CRITICAL: Dual Platform Development
**ALWAYS develop features for BOTH mobile browser UI AND desktop browser UI:**
1. Create mobile-specific components in `frontend/src/components/mobile/`
2. Ensure desktop components remain functional and beautiful
3. Test features on both mobile (responsive mode) and desktop views
4. Include refresh buttons on mobile tabs for real-time data updates
5. Always ask user to **verify both mobile and desktop** after implementation

Mobile component naming convention: `Mobile[ComponentName].tsx`
Example: `MobileFeedbackTab.tsx`, `MobilePaymentsTab.tsx`, `MobileWhatsAppTab.tsx`

### Design System
- **Colors**: Slate/dark theme with emerald accents
- **Cards**: `bg-slate-800/50 backdrop-blur-xl border border-white/10`
- **Primary buttons**: `bg-gradient-to-r from-emerald-500 to-teal-600`
- **Icons**: Lucide React consistently
- **Modals**: Use `fixed inset-0 z-50` with backdrop blur

### Status Colors
- Success: `text-emerald-400 bg-emerald-500/20`
- Warning: `text-amber-400 bg-amber-500/20`
- Error: `text-rose-400 bg-rose-500/20`
- Info: `text-blue-400 bg-blue-500/20`

## Git Commit Guidelines

### Commit Message Format
Use conventional commits with clear, descriptive messages:
```
<type>: <short summary>

<optional body with more details>

Co-Authored-By: Claude <assistant-name> <noreply@anthropic.com>
```

### Commit Types
- `feat:` New feature or functionality
- `fix:` Bug fix
- `refactor:` Code restructuring without behavior change
- `style:` UI/CSS changes, formatting
- `docs:` Documentation updates
- `chore:` Build, config, dependency updates
- `perf:` Performance improvements

### Good Commit Examples
```
feat: add player profile page with public info display

- Created PlayerProfilePage at /player/:playerId route
- Added backend endpoint GET /api/players/:id/profile
- Shows name, team, role, age, cricket skills, CricHeroes link
- Email displayed for linked user accounts
```

```
fix: revert WhatsApp tab to modal-based chat design

Desktop split-panel was confusing. Reverted to original modal
popup for message history while keeping clickable player names.
```

### What to Include in Commits
1. **Summary line**: What changed (imperative mood: "add" not "added")
2. **Body**: Why the change was made, any important details
3. **Reference files**: Mention key files if helpful
4. **Breaking changes**: Note if something changes existing behavior

## Environment Variables

### Backend
```
MONGODB_URI, JWT_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_VERIFY_TOKEN
```

### Frontend
```
REACT_APP_API_URL, REACT_APP_GOOGLE_CLIENT_ID
```

## Deployment Workflow

When deploying changes:
1. Update image tags in `infra/helm/cricket-feedback/values.yaml` and `values-development.yaml`
2. Build Docker images with `--platform linux/amd64`
3. Push to OCI registry
4. Deploy with Helm (never use `kubectl apply` directly for services)
5. Always use semantic versioning for image tags (vXX), never `latest`

## Port Management
```bash
# Kill existing processes before starting local dev
lsof -ti:3000 | xargs kill -9 2>/dev/null || true  # Frontend
lsof -ti:5000 | xargs kill -9 2>/dev/null || true  # Backend
```

## Development Guidelines

### CRITICAL: Role-Based Access Control
**Before implementing ANY feature, ask the developer about accessibility by different user roles:**
1. Which roles can access this feature? (viewer, editor, admin)
2. What data should be visible/hidden for each role?
3. Should certain fields be redacted for specific roles? (e.g., player names hidden for viewers)
4. Are there admin-only actions or views?

**Example questions to ask:**
- "Who should be able to see player names in this feedback list - all users or only editors/admins?"
- "Should this action be restricted to admin users only?"
- "What information should be hidden from viewer role users?"

### CRITICAL: Use Unified Services
**Always use unified services for related functionality - never create duplicate logic in multiple places:**

| Domain | Service Location | Functions |
|--------|------------------|-----------|
| Feedback | `backend/services/feedbackService.js` | `redactFeedbackItem`, `redactFeedbackList`, `getMatchFeedback`, `getPlayerFeedback`, stats |
| Payment | `backend/services/paymentCalculationService.js`, `paymentDistributionService.js` | Payment calculations, distributions |
| Player | `backend/services/playerService.js` | `getOrCreatePlayer`, `formatPhoneNumber`, `updatePlayer` |
| OCR | `backend/services/ocrService.js` | Image text extraction |

**Service usage rules:**
1. Check if a service exists before creating new logic
2. Add new functions to existing services, don't create duplicate helpers in routes
3. All data redaction/transformation should go through services
4. Services ensure consistent behavior across all endpoints

**Example - Feedback redaction:**
```javascript
// CORRECT: Use unified service
const feedbackService = require('../services/feedbackService');
const redactedFeedback = feedbackService.redactFeedbackList(feedback, userRole);

// WRONG: Creating local helper in route file
const redactFeedback = (list, role) => { ... }; // Don't do this!
```

## Recent Features Added

### Player Profile System
- **PlayerNameLink**: Reusable component for clickable player names
- **PlayerProfilePage**: Shows public player info (name, team, role, skills, email, CricHeroes)
- **Backend**: `GET /api/players/:id/profile` returns sanitized public data

### Mobile Chats Tab
- **MobileChatsTab**: Conversation list with search, last message preview
- **ConversationPanel**: Reusable chat component with fullscreen/panel variants
- **Backend**: `GET /api/whatsapp/conversations` returns all player conversations

### Admin Dashboard Tabs
Desktop and mobile have these tabs:
- Feedback, WhatsApp, Matches, Payments, Users, Player History, Settings (profile)
- Mobile has additional "Chats" tab for conversation list
