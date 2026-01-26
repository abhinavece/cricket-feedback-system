# Architecture Documentation

This document provides a comprehensive overview of the Cricket Match Feedback & Team Management System architecture, designed to help AI agents and developers understand the codebase structure, data flow, and design decisions.

## Table of Contents

1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Data Models](#data-models)
5. [API Architecture](#api-architecture)
6. [Authentication & Authorization](#authentication--authorization)
7. [Frontend Architecture](#frontend-architecture)
8. [Backend Architecture](#backend-architecture)
9. [AI Service Architecture](#ai-service-architecture)
10. [Database Schema](#database-schema)
11. [Deployment Architecture](#deployment-architecture)
12. [Data Flow Diagrams](#data-flow-diagrams)

## System Overview

The Cricket Match Feedback & Team Management System is a full-stack web application that enables cricket teams to:
- Collect and manage match feedback from players
- Track player availability for matches
- Manage match schedules and squads
- Process payments and distributions
- Communicate via WhatsApp integration
- Provide admin dashboards for team management

### Core Components

1. **Frontend** (React + TypeScript): User interface for players and admins
2. **Backend** (Node.js + Express): RESTful API server
3. **AI Service** (Python + FastAPI): Payment screenshot parsing using AI
4. **Database** (MongoDB): Document store for all application data
5. **WhatsApp Integration**: Cloud API for messaging

## Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **Routing**: React Router v7
- **HTTP Client**: Axios
- **Authentication**: Google OAuth 2.0
- **Build Tool**: Create React App

### Backend
- **Runtime**: Node.js
- **Framework**: Express 5
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Express middleware
- **Logging**: Morgan

### AI Service
- **Framework**: FastAPI (Python)
- **AI Provider**: Google AI Studio (Gemini)
- **Image Processing**: PIL/Pillow
- **Validation**: Pydantic schemas

### Infrastructure
- **Containerization**: Docker
- **Orchestration**: Kubernetes
- **Package Management**: Helm
- **Cloud**: OCI (Oracle Cloud Infrastructure)

## Project Structure

```
survey-project/
├── frontend/                    # React frontend application
│   ├── src/
│   │   ├── components/          # React components (53 files)
│   │   │   ├── mobile/          # Mobile-specific components
│   │   │   └── ...
│   │   ├── pages/              # Route-level page components
│   │   ├── contexts/           # React Context providers (AuthContext)
│   │   ├── services/           # API service layer
│   │   │   ├── api.ts          # Main API client (50+ methods)
│   │   │   └── matchApi.ts     # Match-specific API methods
│   │   ├── hooks/              # Custom React hooks
│   │   ├── types/              # TypeScript type definitions
│   │   └── utils/              # Utility functions
│   ├── public/                 # Static assets
│   └── package.json
│
├── backend/                     # Node.js backend API
│   ├── config/                 # Configuration files
│   │   └── database.js         # MongoDB connection
│   ├── models/                 # Mongoose schemas (12 models)
│   │   ├── Feedback.js
│   │   ├── User.js
│   │   ├── Player.js
│   │   ├── Match.js
│   │   ├── Availability.js
│   │   ├── Message.js
│   │   └── ...
│   ├── routes/                 # Express route handlers (13 files)
│   │   ├── feedback.js         # Feedback CRUD operations
│   │   ├── auth.js             # Authentication endpoints
│   │   ├── players.js          # Player management
│   │   ├── matches.js          # Match management
│   │   ├── availability.js     # Availability tracking
│   │   ├── whatsapp.js         # WhatsApp webhook & messaging
│   │   └── ...
│   ├── services/               # Business logic layer
│   │   ├── feedbackService.js  # Feedback business logic
│   │   ├── playerService.js    # Player operations
│   │   ├── paymentCalculationService.js
│   │   └── ...
│   ├── middleware/             # Express middleware
│   │   └── auth.js             # JWT authentication
│   ├── tests/                  # Test suite (11 test files)
│   └── index.js                # Application entry point
│
├── ai-service/                  # Python AI service
│   ├── app.py                  # FastAPI application
│   ├── config.py               # Configuration management
│   ├── models/                 # Pydantic schemas
│   │   └── schemas.py          # Request/response models
│   ├── providers/              # AI provider abstractions
│   │   ├── base.py             # Base provider interface
│   │   └── google_ai_studio.py # Google AI Studio implementation
│   ├── services/               # Business logic
│   │   ├── payment_parser.py   # Main parsing service
│   │   ├── image_validator.py  # Image validation
│   │   └── date_validator.py   # Date validation
│   └── utils/                  # Utility functions
│
├── k8s/                        # Kubernetes manifests (Docker Desktop)
├── k8s-oci-prod/               # Production Kubernetes manifests
├── infra/                      # Infrastructure as Code
│   └── helm/                   # Helm charts
└── docs/                       # Documentation
```

## Data Models

### Core Entities

#### User
- **Purpose**: Authentication and authorization
- **Fields**: email, role (viewer/editor/admin), googleId, playerId (optional link)
- **Relationships**: → Player (optional one-to-one)

#### Player
- **Purpose**: Cricket player profiles
- **Fields**: name, phone, role, team, about, battingStyle, bowlingStyle, dateOfBirth, cricHeroesId
- **Relationships**: → User (via userId), → Matches (via squad array)

#### Match
- **Purpose**: Match scheduling and management
- **Fields**: opponent, ground, date, time, slot, squad[], status, cricHeroesId
- **Relationships**: → Players (embedded squad), → Feedback (via matchId), → Availability

#### Feedback
- **Purpose**: Player feedback on matches
- **Fields**: playerId, matchId, ratings (batting/bowling/fielding/teamSpirit), feedbackText, issues, isDeleted
- **Relationships**: → Match, → Player
- **Soft Delete**: Supports soft delete with isDeleted flag

#### Availability
- **Purpose**: Track player responses to match invitations
- **Fields**: matchId, playerId, response (yes/no/tentative/pending), message, reminderSent
- **Relationships**: → Match, → Player
- **Constraints**: Unique (matchId, playerId) pair

#### Message
- **Purpose**: WhatsApp message history
- **Fields**: from, to, message, direction (inbound/outbound), context, timestamp
- **Relationships**: → Match, → Player, → MatchPayment (via context)

### Design Principles

1. **Reference by ObjectId**: Use MongoDB ObjectId references, populate when needed
2. **Denormalization for Performance**: Store frequently-accessed fields (e.g., playerName) for quick display
3. **Soft Delete Pattern**: Use isDeleted flag instead of hard deletes
4. **Indexing**: Strategic indexes on frequently queried fields

## API Architecture

### Base URL
- **Development**: `http://localhost:5000/api`
- **Production**: Configured via `REACT_APP_API_URL`

### Endpoint Categories

#### Authentication (`/api/auth`)
- `POST /api/auth/google` - Google OAuth login
- `GET /api/auth/verify` - Verify JWT token
- `GET /api/auth/me` - Get current user

#### Feedback (`/api/feedback`)
- `POST /api/feedback` - Submit general feedback
- `GET /api/feedback` - List feedback (paginated)
- `GET /api/feedback/summary` - Lightweight summary list
- `GET /api/feedback/:id` - Get feedback details
- `GET /api/feedback/stats` - Get aggregated statistics
- `DELETE /api/feedback/:id` - Soft delete feedback
- `POST /api/feedback/:id/restore` - Restore soft-deleted feedback

#### Players (`/api/players`)
- `GET /api/players` - List players (with search)
- `POST /api/players` - Create player
- `GET /api/players/:id` - Get player details
- `GET /api/players/:id/profile` - Get public player profile
- `PUT /api/players/:id` - Update player
- `DELETE /api/players/:id` - Delete player

#### Matches (`/api/matches`)
- `GET /api/matches` - List matches (paginated)
- `POST /api/matches` - Create match
- `GET /api/matches/:id` - Get match details
- `PUT /api/matches/:id` - Update match
- `DELETE /api/matches/:id` - Delete match
- `POST /api/matches/:id/squad` - Update squad

#### Availability (`/api/availability`)
- `GET /api/availability` - List availability records
- `POST /api/availability` - Create/update availability
- `GET /api/availability/match/:matchId` - Get availability for match

#### WhatsApp (`/api/whatsapp`)
- `POST /api/whatsapp/webhook` - Receive WhatsApp messages
- `POST /api/whatsapp/send` - Send WhatsApp message
- `GET /api/whatsapp/conversations` - List conversations

### API Design Patterns

1. **Pagination**: All list endpoints support `page` and `limit` query parameters
2. **Role-Based Access**: Endpoints enforce role-based permissions (viewer/editor/admin)
3. **Data Redaction**: Viewer role sees redacted data (e.g., anonymous player names)
4. **Error Handling**: Consistent error response format
5. **Request Validation**: Input validation on all endpoints

## Authentication & Authorization

### Authentication Flow

1. User clicks "Sign in with Google"
2. Frontend redirects to Google OAuth
3. Google returns authorization code
4. Backend exchanges code for user info
5. Backend creates/updates User record
6. Backend generates JWT token (24h expiry)
7. Frontend stores token in localStorage
8. All API requests include `Authorization: Bearer <token>`

### Authorization Roles

#### Viewer
- **Can**: Submit feedback, view own data
- **Cannot**: See player names in feedback, edit data, manage users

#### Editor
- **Can**: All viewer permissions + view/edit all data
- **Cannot**: Manage users, delete permanently

#### Admin
- **Can**: All permissions including user management, permanent deletions

### JWT Token Structure
```json
{
  "userId": "ObjectId",
  "email": "user@example.com",
  "role": "viewer|editor|admin",
  "iat": 1234567890,
  "exp": 1234654290
}
```

## Frontend Architecture

### Component Structure

#### Page Components (`pages/`)
- Route-level components that compose smaller components
- Examples: `PlayerProfilePage.tsx`, `SettingsPage.tsx`

#### Reusable Components (`components/`)
- **Mobile Components** (`components/mobile/`): Mobile-optimized versions
- **Desktop Components**: Full-featured desktop components
- **Shared Components**: Used by both mobile and desktop

### State Management

#### AuthContext
- Global authentication state
- Provides: `user`, `login()`, `logout()`, `isAuthenticated`
- Persists token in localStorage

#### Component State
- Local state with `useState` for component-specific data
- `useEffect` for data fetching and side effects

### Routing

```
/ → Main app (FeedbackForm or AdminDashboard)
/player/:playerId → PlayerProfilePage
/share/match/:token → PublicMatchView
/share/payment/:token → PublicPaymentView
```

### API Integration

- **Service Layer**: `services/api.ts` - Centralized API client
- **Axios Interceptors**: Automatic token injection, 401 handling
- **Type Safety**: Full TypeScript types for all API responses

## Backend Architecture

### Request Flow

1. **Request** → Express middleware stack
2. **Authentication** → `auth` middleware validates JWT
3. **Authorization** → `requireEditor`/`requireAdmin` check role
4. **Route Handler** → Business logic execution
5. **Service Layer** → Reusable business logic functions
6. **Database** → Mongoose queries with proper indexing
7. **Response** → JSON response with consistent format

### Service Layer Pattern

**Purpose**: Centralize business logic, avoid duplication

**Services**:
- `feedbackService.js`: Feedback redaction, aggregation
- `playerService.js`: Player operations, phone formatting
- `paymentCalculationService.js`: Payment calculations
- `paymentDistributionService.js`: Payment distributions

**Usage**:
```javascript
// Route file
const feedbackService = require('../services/feedbackService');
const redactedFeedback = feedbackService.redactFeedbackList(feedback, userRole);
```

### Middleware Stack

1. `helmet()` - Security headers
2. `cors()` - Cross-origin resource sharing
3. `morgan()` - Request logging
4. `express.json()` - JSON body parsing
5. `auth` - JWT authentication (on protected routes)
6. Route handlers
7. Error handling middleware

## AI Service Architecture

### Purpose
Parse payment screenshots from WhatsApp messages using AI vision models.

### Request Flow

1. **Receive Request** → FastAPI endpoint receives image
2. **Image Validation** → Validate image format, size, content
3. **Cost Guardrails** → Check daily request limits
4. **AI Provider Call** → Send to Google AI Studio (Gemini)
5. **Response Parsing** → Extract payment data from AI response
6. **Date Validation** → Validate extracted dates
7. **Response** → Return structured payment data

### Provider Abstraction

- **Base Provider** (`providers/base.py`): Abstract interface
- **Google AI Studio** (`providers/google_ai_studio.py`): Implementation
- **Easy to extend**: Add new providers by implementing base interface

### Configuration

- Environment-based configuration
- Feature flags (AI_SERVICE_ENABLED)
- Rate limiting (DAILY_REQUEST_LIMIT)
- Confidence thresholds (MIN_CONFIDENCE_THRESHOLD)

## Database Schema

### Indexes (Performance Critical)

```javascript
// Feedback
feedbackSchema.index({ isDeleted: 1, createdAt: -1 });
feedbackSchema.index({ matchId: 1, isDeleted: 1 });
feedbackSchema.index({ playerId: 1, isDeleted: 1 });

// Match
matchSchema.index({ date: 1 });
matchSchema.index({ status: 1 });

// Message
messageSchema.index({ from: 1, timestamp: -1 });
messageSchema.index({ to: 1, timestamp: -1 });

// Availability
availabilitySchema.index({ matchId: 1, playerId: 1 }, { unique: true });
```

### Query Optimization

- Use `.lean()` for read-only queries (50% faster)
- Use `.select()` to limit returned fields
- Use aggregation pipelines for statistics
- Pagination on all list endpoints

## Deployment Architecture

### Development
- **Local**: Node.js + MongoDB locally
- **Docker Desktop**: Kubernetes cluster with local manifests

### Production
- **Kubernetes**: OCI Kubernetes cluster
- **Helm Charts**: Infrastructure as Code
- **OCI Registry**: Container image storage
- **Ingress**: Nginx ingress controller

### Environment Variables

See `.env.example` files for required configuration:
- Database connection strings
- JWT secrets
- OAuth credentials
- WhatsApp API tokens
- AI service configuration

## Data Flow Diagrams

### Feedback Submission Flow

```
User → Frontend Form → POST /api/feedback
  → Auth Middleware (JWT validation)
  → Route Handler (validation)
  → Feedback Model (save to DB)
  → Response (success/error)
  → Frontend (update UI)
```

### WhatsApp Message Flow

```
WhatsApp → Webhook → POST /api/whatsapp/webhook
  → Parse message
  → Check context (availability_request, etc.)
  → Update Availability if valid context
  → Save Message to DB
  → SSE Event (real-time update)
  → Frontend (update chat UI)
```

### Payment Parsing Flow

```
WhatsApp Image → Backend → POST /ai-service/parse-payment
  → Image Validation
  → Cost Guardrails Check
  → AI Provider (Gemini Vision)
  → Parse Response
  → Date Validation
  → Return Structured Data
  → Backend (save to MatchPayment)
```

## Best Practices

### Code Organization
- **Services**: Reusable business logic
- **Routes**: Thin controllers, delegate to services
- **Models**: Data validation and schema definition
- **Middleware**: Cross-cutting concerns (auth, logging)

### Error Handling
- Consistent error response format
- Proper HTTP status codes
- Error logging for debugging
- User-friendly error messages

### Security
- JWT token expiration (24h)
- Role-based access control
- Input validation on all endpoints
- Data redaction for viewer role
- Environment variable secrets

### Performance
- Database indexing
- Query optimization (.lean(), .select())
- Pagination on all lists
- Caching where appropriate

## Extension Points

### Adding New Features

1. **New Entity**: Create model → route → service → frontend component
2. **New Endpoint**: Add route → implement handler → add to API client
3. **New AI Provider**: Implement `AIProviderBase` interface
4. **New Frontend Page**: Create page component → add route → update navigation

### Testing

- **Backend**: Jest test suite in `backend/tests/`
- **Frontend**: React Testing Library
- **Integration**: End-to-end API tests

## Additional Resources

- **API Documentation**: See `docs/API_AUDIT_COMPREHENSIVE.md`
- **Deployment Guide**: See `docs/deployment/`
- **Feature Documentation**: See `docs/FEATURES.md`
- **Development Guide**: See `CONTRIBUTING.md`
