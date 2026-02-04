# Backend Service

Node.js + Express API server for the Cricket Match Feedback & Team Management System.

## Overview

The backend provides a RESTful API for managing cricket teams, matches, player availability, feedback collection, payments, WhatsApp messaging, and multi-tenant organization management.

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **Node.js** | Runtime environment |
| **Express 5** | Web framework |
| **MongoDB** | Database (via Mongoose ODM) |
| **JWT** | Authentication tokens |
| **Google OAuth 2.0** | User authentication |
| **WhatsApp Cloud API** | Messaging integration |

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB (local or MongoDB Atlas)
- Google Cloud Console project (for OAuth)

### Installation

```bash
cd backend
npm install
```

### Environment Setup

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```bash
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/cricket-feedback

# Authentication
JWT_SECRET=your-super-secret-key-min-32-chars
GOOGLE_CLIENT_ID=from-google-cloud-console
GOOGLE_CLIENT_SECRET=from-google-cloud-console

# Development (optional)
DISABLE_AUTH=false  # Set true to bypass auth locally

# WhatsApp (optional)
WHATSAPP_ACCESS_TOKEN=your-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-id
WHATSAPP_VERIFY_TOKEN=your-verify-token
```

### Run Development Server

```bash
npm run dev   # With hot reload (nodemon)
npm start     # Without hot reload
```

Server runs at `http://localhost:5000`

### Verify Installation

```bash
curl http://localhost:5000/api/health
# Expected: {"status":"OK","timestamp":"...","uptime":...}
```

## Project Structure

```
backend/
├── config/
│   ├── database.js           # MongoDB connection
│   └── featureFlags.js       # Feature flag system
├── middleware/
│   ├── auth.js               # JWT verification, role checks
│   ├── tenantResolver.js     # Multi-tenant context
│   └── viewTracker.js        # Analytics tracking
├── models/                   # Mongoose schemas (24 models)
│   ├── User.js               # User accounts with org memberships
│   ├── Organization.js       # Multi-tenant organizations
│   ├── Player.js             # Cricket player profiles
│   ├── Match.js              # Match scheduling & squad
│   ├── Feedback.js           # Player feedback ratings
│   ├── Availability.js       # Player match responses
│   ├── Message.js            # WhatsApp message history
│   ├── MatchPayment.js       # Payment tracking
│   ├── Ground.js             # Cricket ground database
│   ├── GroundReview.js       # Ground ratings & reviews
│   ├── Tournament.js         # Tournament management
│   └── ...                   # 13 more models
├── routes/                   # API route handlers (18 files)
│   ├── auth.js               # Google OAuth, JWT, user management
│   ├── players.js            # Player CRUD, profiles
│   ├── matches.js            # Match CRUD, squad, stats
│   ├── feedback.js           # Feedback CRUD, links, stats
│   ├── availability.js       # Availability tracking
│   ├── payments.js           # Payment management
│   ├── grounds.js            # Ground CRUD, reviews
│   ├── organizations.js      # Multi-tenant management
│   ├── tournaments.js        # Tournament CRUD
│   ├── whatsapp.js           # Messaging & webhooks
│   └── ...                   # 8 more route files
├── services/                 # Business logic (10 services)
│   ├── feedbackService.js    # Feedback redaction & queries
│   ├── playerService.js      # Player operations
│   ├── paymentCalculationService.js  # Payment math
│   ├── groundService.js      # Ground search & aggregation
│   ├── messageService.js     # WhatsApp message processing
│   ├── aiService.js          # AI service integration
│   └── ...                   # 4 more services
├── utils/
│   ├── tenantQuery.js        # Multi-tenant query helpers
│   └── sseManager.js         # Server-Sent Events
├── scripts/                  # Database migrations
├── tests/                    # Jest test suite (11 files)
├── index.js                  # Server entry point
├── Dockerfile                # Docker image definition
└── package.json
```

## API Routes

### Authentication (`/api/auth`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/google` | Google OAuth login (web) | No |
| POST | `/google/mobile` | Google OAuth login (mobile) | No |
| POST | `/dev-login` | Development mode login | No |
| GET | `/verify` | Verify JWT token | Yes |
| GET | `/users` | List all users | Admin |
| PUT | `/users/:userId/role` | Change user role | Admin |
| GET | `/feature-flags` | Get enabled features | Yes |

### Players (`/api/players`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | List players (paginated) | Yes |
| GET | `/:id` | Get player details | Yes |
| GET | `/:id/profile` | Public player profile | Yes |
| POST | `/` | Create player | Editor+ |
| PUT | `/:id` | Update player | Editor+ |
| DELETE | `/:id` | Delete player | Admin |
| GET | `/:id/feedback` | Get player's feedback | Yes |

### Matches (`/api/matches`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/summary` | Lightweight match list | Yes |
| GET | `/` | Full match list | Yes |
| GET | `/:id` | Match details | Yes |
| GET | `/:id/stats` | Match statistics | Yes |
| POST | `/` | Create match | Admin |
| PUT | `/:id` | Update match | Admin |
| DELETE | `/:id` | Delete match | Admin |
| PUT | `/:id/squad/:playerId` | Update player response | Editor+ |
| PUT | `/:id/squad/bulk` | Bulk update squad | Editor+ |

### Feedback (`/api/feedback`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | List feedback (paginated) | Yes |
| GET | `/stats` | Feedback statistics | Yes |
| GET | `/trash` | Deleted feedback | Admin |
| POST | `/` | Submit feedback | Yes |
| DELETE | `/:id` | Soft delete | Editor+ |
| POST | `/:id/restore` | Restore deleted | Admin |
| POST | `/link/generate` | Create shareable link | Editor+ |
| GET | `/link/:token` | View feedback form | No |
| POST | `/link/:token/submit` | Submit via link | No |

### Payments (`/api/payments`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | List payments | Yes |
| GET | `/:id` | Payment details | Yes |
| POST | `/` | Create payment | Editor+ |
| PUT | `/:id` | Update payment | Editor+ |
| GET | `/match/:matchId` | Match payments | Yes |
| POST | `/screenshot` | Upload payment proof | Yes |
| POST | `/ocr-extract` | Extract amount from image | Yes |
| GET | `/player/:playerId/summary` | Player payment summary | Yes |

### Grounds (`/api/grounds`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | Search grounds | Yes |
| GET | `/nearby` | Find nearby grounds | Yes |
| GET | `/:id` | Ground details + reviews | Yes |
| POST | `/` | Create ground | Admin |
| PUT | `/:id` | Update ground | Admin |
| POST | `/:id/reviews` | Submit review | Yes |
| GET | `/:id/reviews` | List reviews | Yes |
| DELETE | `/:groundId/reviews/:reviewId` | Delete review | Owner/Admin |

### Organizations (`/api/organizations`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/` | Create organization | Yes |
| GET | `/` | List user's organizations | Yes |
| GET | `/current` | Get active organization | Yes |
| POST | `/switch` | Switch active organization | Yes |
| GET | `/members` | List org members | Yes |
| POST | `/members/invite` | Invite member | OrgAdmin |
| GET | `/search` | Search teams (discovery) | Yes |
| POST | `/:id/join-request` | Request to join | Yes |

### WhatsApp (`/api/whatsapp`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/webhook` | Webhook verification | No |
| POST | `/webhook` | Incoming messages | No |
| GET | `/conversations` | List conversations | Admin |
| GET | `/messages/:phone` | Conversation history | Admin |
| POST | `/send` | Send message | Admin |
| POST | `/send-reminder` | Send availability reminder | Admin |

### System Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/version` | Backend version |
| GET | `/api/events` | SSE connection |

## Database Models

### Core Models

| Model | Purpose | Key Fields |
|-------|---------|------------|
| **User** | User accounts | email, googleId, role, organizations[] |
| **Organization** | Multi-tenant teams | name, slug, ownerId, members[], whatsappConfig |
| **Player** | Cricket players | name, phone, role, team, battingStyle, bowlingStyle |
| **Match** | Match scheduling | date, opponent, ground, squad[], availabilityStats |
| **Feedback** | Player ratings | batting, bowling, fielding, teamSpirit, feedbackText |

### Supporting Models

| Model | Purpose |
|-------|---------|
| **Availability** | Player match responses |
| **Message** | WhatsApp message history |
| **MatchPayment** | Payment tracking per match |
| **Ground** | Cricket ground database |
| **GroundReview** | Ground ratings & reviews |
| **Tournament** | Tournament management |
| **FeedbackLink** | Shareable feedback URLs |
| **PublicLink** | Shareable resource URLs |

## Services Layer

Services contain reusable business logic that routes call:

| Service | Purpose |
|---------|---------|
| `feedbackService` | Feedback redaction based on user role, queries |
| `playerService` | Player CRUD with phone normalization |
| `paymentCalculationService` | Payment math, per-person calculations |
| `paymentDistributionService` | FIFO payment allocation across matches |
| `groundService` | Ground search, nearby, review aggregation |
| `messageService` | WhatsApp message processing |
| `aiService` | AI service integration for screenshot parsing |

## Middleware

### Authentication (`middleware/auth.js`)

```javascript
// Protect route - any authenticated user
router.get('/data', auth, handler);

// Require editor role or higher
router.post('/data', auth, requireEditor, handler);

// Require admin role
router.delete('/data', auth, requireAdmin, handler);
```

### Multi-Tenant (`middleware/tenantResolver.js`)

```javascript
// Resolve organization context
router.use('/api/matches', auth, resolveTenant);

// Require org admin role
router.put('/settings', auth, resolveTenant, requireOrgAdmin, handler);
```

## Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# With coverage
npm run test:coverage

# Specific test file
npm test -- auth.test.js
```

Test files are in `tests/` directory:
- `auth.test.js` - Authentication endpoints
- `matches.test.js` - Match management
- `players.test.js` - Player CRUD
- `feedback.test.js` - Feedback system
- `availability.test.js` - Availability tracking
- `whatsapp.test.js` - WhatsApp integration
- `integration.test.js` - End-to-end flows

## Feature Flags

Feature flags allow gradual rollout of new features:

```bash
# Enable globally
FF_MULTI_TENANT=true

# Enable for specific users
FF_TEAM_DISCOVERY_USERS=user1@email.com,user2@email.com

# Enable for specific organizations
FF_WHATSAPP_BYOT_ORGS=org-id-1,org-id-2
```

Available flags:
- `FF_MULTI_TENANT` - Multi-organization support
- `FF_TEAM_DISCOVERY` - Team search and join requests
- `FF_WHATSAPP_BYOT` - Bring Your Own Token for WhatsApp

## Docker

### Build

```bash
docker build -t cricket-feedback-backend .
```

### Run

```bash
docker run -p 5000:5000 \
  -e MONGODB_URI=mongodb://host.docker.internal:27017/cricket-feedback \
  -e JWT_SECRET=your-secret \
  cricket-feedback-backend
```

## Scripts

### Database Migrations

```bash
# Initialize indexes
node scripts/init-indexes.js

# Verify indexes
node scripts/verify-indexes.js

# Migrate to multi-tenant
node scripts/migrate-to-multi-tenant.js

# Sync availability stats
node scripts/sync-availability-stats.js
```

## Environment Variables Reference

### Required

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | JWT signing secret (min 32 chars) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |

### Optional

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 5000 | Server port |
| `NODE_ENV` | development | Environment mode |
| `DISABLE_AUTH` | false | Bypass auth for local dev |
| `AI_SERVICE_URL` | - | AI service endpoint |
| `WHATSAPP_ACCESS_TOKEN` | - | WhatsApp API token |
| `WHATSAPP_PHONE_NUMBER_ID` | - | WhatsApp phone number ID |
| `WHATSAPP_VERIFY_TOKEN` | - | Webhook verification token |

## Related Documentation

- [API Reference](../docs/API_REFERENCE.md) - Complete API documentation
- [Architecture](../ARCHITECTURE.md) - System architecture
- [CLAUDE.md](../CLAUDE.md) - Development guidelines
