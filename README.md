# Cricket Match Feedback & Team Management System

A comprehensive full-stack application for managing cricket teams, collecting match feedback, tracking player availability, processing payments, and communicating via WhatsApp.

## Services

| Service | Description | Documentation |
|---------|-------------|---------------|
| **Frontend** | React + TypeScript web application | [frontend/README.md](./frontend/README.md) |
| **Backend** | Node.js + Express API server | [backend/README.md](./backend/README.md) |
| **AI Service** | Python FastAPI for payment parsing | [ai-service/README.md](./ai-service/README.md) |
| **Mobile App** | React Native + Expo mobile app | [mobile/README.md](./mobile/README.md) |
| **Tournament Hub** | Vite + React tournament management | [tournament-frontend/README.md](./tournament-frontend/README.md) |

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, TypeScript, Tailwind CSS, React Router 7 |
| **Backend** | Node.js, Express 5, MongoDB, Mongoose |
| **AI Service** | Python, FastAPI, Google AI Studio |
| **Mobile** | React Native, Expo SDK 52+, NativeWind |
| **Infrastructure** | Docker, Kubernetes, Helm, GCP Cloud Run |

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB (local or MongoDB Atlas)
- Google Cloud Console project (for OAuth)

### Local Development

```bash
# Clone the repository
git clone <repository-url>
cd survey-project

# Install and run backend
cd backend
npm install
cp .env.example .env  # Edit with your config
npm run dev

# In another terminal, run frontend
cd frontend
npm install
cp .env.example .env  # Edit with your config
npm start
```

**Local URLs:**
- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- Health Check: http://localhost:5000/api/health

### Docker Desktop Kubernetes

```bash
# Enable Kubernetes in Docker Desktop
kubectl apply -f k8s/

# Access the app
open http://app.localhost
```

See [k8s/README.md](./k8s/README.md) for details.

### Production Deployment

**GCP Cloud Run** (Recommended):
- See [infra/cloudrun/README.md](./infra/cloudrun/README.md)

**Kubernetes with Helm**:
- See [infra/helm/cricket-feedback/README.md](./infra/helm/cricket-feedback/README.md)

## Features

### Core Features

- **Match Management**: Schedule matches, track squad availability, opponent details
- **Feedback Collection**: Multi-field ratings (batting, bowling, fielding, team spirit)
- **Payment Tracking**: Per-match payments, screenshot parsing with AI, payment history
- **Player Profiles**: Cricket roles, batting/bowling styles, CricHeroes integration
- **Ground Discovery**: Cricket ground database with reviews and ratings

### Communication

- **WhatsApp Integration**: Availability requests, reminders, two-way messaging
- **Shareable Links**: Public match/payment views via tokens
- **Real-time Updates**: Server-Sent Events for live notifications

### Multi-Tenant

- **Organizations**: Team isolation with separate data
- **Role-Based Access**: Owner, Admin, Editor, Viewer roles
- **Team Discovery**: Search and join other teams
- **Feature Flags**: Gradual rollout of new features

## Project Structure

```
survey-project/
├── frontend/                 # React web application
│   └── README.md            # Frontend documentation
├── backend/                  # Node.js API server
│   └── README.md            # Backend documentation
├── ai-service/               # Python AI service
│   └── README.md            # AI service documentation
├── mobile/                   # React Native app
│   └── README.md            # Mobile documentation
├── tournament-frontend/      # Tournament management app
│   └── README.md            # Tournament documentation
├── k8s/                      # Local Kubernetes manifests
│   └── README.md            # K8s documentation
├── infra/
│   ├── helm/                # Helm charts for Kubernetes
│   │   └── cricket-feedback/
│   │       └── README.md   # Helm documentation
│   └── cloudrun/            # GCP Cloud Run config
│       └── README.md       # Cloud Run documentation
├── docs/                     # Additional documentation
│   ├── API_REFERENCE.md     # Complete API docs
│   └── ...
├── ARCHITECTURE.md           # System architecture
├── CONTRIBUTING.md           # Contribution guidelines
├── CLAUDE.md                 # AI agent development guide
└── README.md                 # This file
```

## Documentation

### Architecture & Design

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System architecture and design patterns |
| [CLAUDE.md](./CLAUDE.md) | Development guide for AI agents |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Contribution guidelines |

### API & Technical

| Document | Description |
|----------|-------------|
| [docs/API_REFERENCE.md](./docs/API_REFERENCE.md) | Complete API documentation |
| [docs/FEATURES.md](./docs/FEATURES.md) | Feature documentation |

### Deployment

| Document | Description |
|----------|-------------|
| [k8s/README.md](./k8s/README.md) | Local Kubernetes setup |
| [infra/helm/.../README.md](./infra/helm/cricket-feedback/README.md) | Helm chart deployment |
| [infra/cloudrun/README.md](./infra/cloudrun/README.md) | GCP Cloud Run deployment |

## Environment Variables

### Backend (Required)

```bash
MONGODB_URI=mongodb://localhost:27017/cricket-feedback
JWT_SECRET=your-secret-key-min-32-chars
GOOGLE_CLIENT_ID=from-google-cloud-console
GOOGLE_CLIENT_SECRET=from-google-cloud-console
```

### Frontend (Required)

```bash
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_GOOGLE_CLIENT_ID=from-google-cloud-console
```

### Optional

```bash
# Backend
WHATSAPP_ACCESS_TOKEN=your-whatsapp-token
AI_SERVICE_URL=http://localhost:8010

# Feature Flags
FF_MULTI_TENANT=true
FF_TEAM_DISCOVERY=true
FF_WHATSAPP_BYOT=false
```

## Feature Flags

Feature flags enable gradual rollout of new features:

| Flag | Description | Default |
|------|-------------|---------|
| `FF_MULTI_TENANT` | Multi-organization support | `true` |
| `FF_TEAM_DISCOVERY` | Team search and join requests | `true` |
| `FF_WHATSAPP_BYOT` | Bring Your Own Token for WhatsApp | `false` |

### Configuration

```bash
# Enable globally
FF_TEAM_DISCOVERY=true

# Enable for specific users
FF_TEAM_DISCOVERY_USERS=user1@email.com,user2@email.com

# Enable for specific organizations
FF_TEAM_DISCOVERY_ORGS=org-id-1,org-id-2
```

## API Overview

The backend provides REST APIs organized by domain:

| Route | Description |
|-------|-------------|
| `/api/auth` | Authentication (Google OAuth, JWT) |
| `/api/players` | Player CRUD, profiles |
| `/api/matches` | Match management, squad, stats |
| `/api/feedback` | Feedback CRUD, shareable links |
| `/api/payments` | Payment tracking, screenshots |
| `/api/grounds` | Ground discovery, reviews |
| `/api/organizations` | Multi-tenant management |
| `/api/whatsapp` | WhatsApp messaging |
| `/api/tournaments` | Tournament management |

For complete API documentation, see [docs/API_REFERENCE.md](./docs/API_REFERENCE.md).

## Development

### Running Tests

```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test
```

### Code Style

- Backend: ESLint with Node.js rules
- Frontend: ESLint + TypeScript + Prettier
- CSS: Tailwind with mobile-first approach

### Mobile-First Design

All UI components follow mobile-first responsive design:
- Design for mobile (`< 768px`) first
- Enhance for tablet (`768px - 1024px`)
- Optimize for desktop (`>= 1024px`)

## Contributing

1. Read [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines
2. Check [ARCHITECTURE.md](./ARCHITECTURE.md) to understand the system
3. Review the relevant service README for your changes
4. Follow code style guidelines
5. Test on both mobile and desktop for UI changes
6. Submit a pull request

### For AI Agents

1. Read [CLAUDE.md](./CLAUDE.md) for development guidelines
2. Always ask about role-based access control before implementing features
3. Use existing services - never duplicate logic
4. Test on both mobile and desktop for UI changes

## License

MIT License
