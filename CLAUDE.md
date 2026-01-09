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
├── components/     # React components (20+)
├── contexts/       # AuthContext for user state
├── services/       # api.ts with 40+ API methods
└── types/          # TypeScript interfaces

backend/
├── routes/         # 7 route files (feedback, auth, players, matches, availability, whatsapp, admin)
├── models/         # 6 Mongoose schemas (Feedback, User, Player, Match, Availability, Message)
├── middleware/     # JWT auth middleware
└── config/         # Database connection
```

### API Structure
Base URL: `http://localhost:5000/api` (dev) or configured via `REACT_APP_API_URL`

| Route | Purpose |
|-------|---------|
| `/api/feedback` | Feedback CRUD, stats, soft delete/restore |
| `/api/auth` | Google OAuth, JWT verification, user management |
| `/api/players` | Player CRUD operations |
| `/api/matches` | Match CRUD, squad management, stats |
| `/api/availability` | Availability tracking per player-match |
| `/api/whatsapp` | Webhook receiver, message sending, history |

### Authentication Flow
1. Google OAuth login → Server generates 24h JWT
2. Token stored in localStorage, sent via `Authorization: Bearer <token>`
3. Three roles: `viewer` (submit), `editor` (view/edit), `admin` (all + manage users)

### WhatsApp Integration
- Webhook endpoint at `/api/whatsapp/webhook` for receiving messages
- Context ID validation: Only updates availability when `context.id` matches valid `availability_request` or `availability_reminder` message
- All incoming messages are persisted regardless of context validation outcome

## Key Data Models

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

### Design System
- **Colors**: Slate/dark theme with emerald accents
- **Cards**: `bg-slate-800/50 backdrop-blur-xl border border-white/10`
- **Primary buttons**: `bg-gradient-to-r from-emerald-500 to-teal-600`
- **Icons**: Lucide React consistently

### Status Colors
- Success: `text-emerald-400 bg-emerald-500/20`
- Warning: `text-amber-400 bg-amber-500/20`
- Error: `text-rose-400 bg-rose-500/20`
- Info: `text-blue-400 bg-blue-500/20`

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
