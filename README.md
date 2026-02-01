# Cricket Match Feedback & Team Management System

A comprehensive full-stack web application for managing cricket teams, collecting match feedback, tracking player availability, processing payments, and communicating via WhatsApp. Built with React, Node.js, MongoDB, and Python AI services.

## 📚 Documentation

For comprehensive documentation, see:
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System architecture and design patterns
- **[docs/API_REFERENCE.md](./docs/API_REFERENCE.md)** - Complete API documentation
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - Development and contribution guidelines
- **[CLAUDE.md](./CLAUDE.md)** - Development guide for AI agents and developers

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Desktop (with Kubernetes enabled)
- Node.js (for local development)
- MongoDB (or use the provided Docker setup)

### Option 1: Docker Desktop Kubernetes (Recommended)
```bash
# Enable Kubernetes in Docker Desktop
# Apply the manifests
kubectl apply -f k8s/

# Access the app
open http://localhost/
```

### Option 2: Local Development
```bash
# Backend
cd backend
npm install
npm run dev

# Frontend
cd frontend
npm install
npm start
```

## 📋 Features

### Frontend
- **Feedback Form** with:
  - Match date picker
  - Player name input
  - 1-5 star ratings for batting, bowling, fielding, and team spirit
  - Detailed experience text area
  - Issues faced checkboxes (venue, equipment, timing, umpiring, other)
  - Additional comments section
  - Form validation and error handling
  - Mobile-responsive design with Tailwind CSS

- **Admin Dashboard** with:
  - Password-protected access for admins only
  - Aggregated statistics and ratings
  - Issues summary with accurate counts
  - Detailed feedback table with clickable rows
  - Interactive modal for viewing complete feedback details
  - Real-time data updates
  - Enhanced total submissions card with detailed averages
  - Session persistence and logout functionality

### Backend
- **REST API** endpoints:
  - `POST /api/feedback` - Submit new feedback
  - `GET /api/feedback` - Get all feedback submissions
  - `GET /api/feedback/stats` - Get aggregated statistics
  - `POST /api/admin/authenticate` - Admin authentication
  - `GET /api/health` - Health check endpoint

- **Authentication**:
  - Password-protected admin dashboard
  - Session management with localStorage
  - Environment variable for admin password

- **Database**:
  - MongoDB with Mongoose ODM
  - Schema validation
  - Timestamp tracking

## Tech Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **Routing**: React Router v7
- **HTTP Client**: Axios
- **Authentication**: Google OAuth 2.0

### Backend
- **Runtime**: Node.js
- **Framework**: Express 5
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Express middleware

### AI Service
- **Framework**: FastAPI (Python)
- **AI Provider**: Google AI Studio (Gemini)
- **Purpose**: Payment screenshot parsing

### Infrastructure
- **Containerization**: Docker
- **Orchestration**: Kubernetes
- **Package Management**: Helm
- **Cloud**: OCI (Oracle Cloud Infrastructure)

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or MongoDB Atlas)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd survey-project
```

2. Install dependencies:
```bash
npm install
cd frontend && npm install
cd ../backend && npm install
```

3. Set up environment variables:
```bash
# Backend
cd backend
cp .env.example .env
# Edit .env with your MongoDB URI

# Frontend
cd ../frontend
cp .env.example .env
# Edit .env with your API URL (for development)
```

4. Start the development servers:
```bash
# From root directory
npm run dev
```

This will start both frontend (http://localhost:3000) and backend (http://localhost:5000) concurrently.

### Local Development

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Health check: http://localhost:5000/api/health

## API Endpoints

### Submit Feedback
```http
POST /api/feedback
Content-Type: application/json

{
  "playerName": "John Doe",
  "matchDate": "2024-01-15",
  "batting": 4,
  "bowling": 3,
  "fielding": 5,
  "teamSpirit": 4,
  "feedbackText": "Great match experience!",
  "issues": {
    "venue": false,
    "equipment": true,
    "timing": false,
    "umpiring": false,
    "other": false
  },
  "additionalComments": "The equipment could be better"
}
```

### Get All Feedback
```http
GET /api/feedback
```

### Get Statistics
```http
GET /api/feedback/stats
```

## Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set environment variables in Vercel dashboard:
   - `MONGODB_URI`: Your MongoDB connection string
4. Deploy!

The application is configured with `vercel.json` for automatic deployment.

### Environment Variables for Production

- `MONGODB_URI`: MongoDB connection string (required)
- `NODE_ENV`: Set to 'production' automatically by Vercel
- `PORT`: Set automatically by Vercel

## 🚩 Feature Flags

The application supports feature flags for gradual rollout of new features. This allows you to:
- Ship features to production but keep them disabled
- Enable features for specific beta testers by email
- Enable features for specific organizations
- Gradually roll out features to all users

### Available Feature Flags

| Flag | Description | Default |
|------|-------------|---------|
| `FF_MULTI_TENANT` | Master flag for entire multi-tenant system | `false` |
| `FF_TEAM_DISCOVERY` | Team search and join request features | `false` |
| `FF_WHATSAPP_BYOT` | Custom WhatsApp number (BYOT) for teams | `false` |

### Configuration

Feature flags are configured via environment variables in your `backend/.env` file:

```bash
# ============= FEATURE FLAGS =============
# Set to 'true' to enable globally, or use allowlists for gradual rollout

# Multi-Tenant System (master flag)
FF_MULTI_TENANT=false
FF_MULTI_TENANT_USERS=beta@example.com,tester@example.com
FF_MULTI_TENANT_ORGS=

# Team Discovery (search, join requests)
FF_TEAM_DISCOVERY=false
FF_TEAM_DISCOVERY_USERS=

# WhatsApp BYOT (Bring Your Own Token)
FF_WHATSAPP_BYOT=false
FF_WHATSAPP_BYOT_ORGS=
```

### How It Works

1. **Global Toggle**: Set `FF_<FLAG>=true` to enable for all users
2. **User Allowlist**: Set `FF_<FLAG>_USERS=email1,email2` to enable for specific users
3. **Organization Allowlist**: Set `FF_<FLAG>_ORGS=orgId1,orgId2` to enable for specific teams

The system checks in this order:
1. If globally enabled → feature is ON
2. If user's email is in allowlist → feature is ON for that user
3. If user's organization is in allowlist → feature is ON for that user
4. Otherwise → feature is OFF

### Rollout Strategy

**Phase 1: Internal Testing**
```bash
FF_TEAM_DISCOVERY=false
FF_TEAM_DISCOVERY_USERS=your-email@domain.com
```

**Phase 2: Beta Testers**
```bash
FF_TEAM_DISCOVERY=false
FF_TEAM_DISCOVERY_USERS=beta1@domain.com,beta2@domain.com,beta3@domain.com
```

**Phase 3: Specific Organizations**
```bash
FF_TEAM_DISCOVERY=false
FF_TEAM_DISCOVERY_ORGS=64abc123def456,64def789abc012
```

**Phase 4: Global Rollout**
```bash
FF_TEAM_DISCOVERY=true
# Remove allowlists or leave them (they'll be ignored)
```

### Backend Usage

```javascript
const { isFeatureEnabled, requireFeature } = require('./config/featureFlags');

// Check in code
if (isFeatureEnabled('TEAM_DISCOVERY', { user: req.user })) {
  // Feature-specific code
}

// Protect entire route
router.get('/search', auth, requireFeature('TEAM_DISCOVERY'), handler);
```

### Frontend Usage

```typescript
import { isFeatureEnabled } from './config/featureFlags';

// Check in component
if (isFeatureEnabled('TEAM_DISCOVERY')) {
  return <TeamSearchComponent />;
}
```

### Protected Routes When Disabled

When a feature flag is disabled, protected API routes return `404 Not Found`. This:
- Hides the feature's existence from unauthorized users
- Prevents accidental access via direct URL
- Maintains clean error handling

### Debugging

Check which flags are enabled for a user:
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:5000/api/auth/feature-flags
```

Response:
```json
{
  "success": true,
  "flags": {
    "MULTI_TENANT": false,
    "TEAM_DISCOVERY": true,
    "WHATSAPP_BYOT": false
  }
}
```

## Project Structure

```
survey-project/
├── frontend/                    # React frontend application
│   ├── src/
│   │   ├── components/         # React components (53 files)
│   │   │   ├── mobile/         # Mobile-specific components
│   │   │   └── ...
│   │   ├── pages/              # Route-level page components
│   │   ├── contexts/           # React Context providers
│   │   ├── services/           # API service layer
│   │   ├── hooks/              # Custom React hooks
│   │   ├── types/              # TypeScript type definitions
│   │   └── utils/              # Utility functions
│   └── package.json
│
├── backend/                     # Node.js backend API
│   ├── config/                 # Configuration files
│   ├── models/                 # Mongoose schemas (12 models)
│   ├── routes/                 # Express route handlers (13 files)
│   ├── services/               # Business logic layer
│   ├── middleware/             # Express middleware
│   ├── tests/                  # Test suite (11 test files)
│   └── index.js                # Application entry point
│
├── ai-service/                  # Python AI service
│   ├── app.py                  # FastAPI application
│   ├── models/                 # Pydantic schemas
│   ├── providers/              # AI provider abstractions
│   ├── services/               # Business logic
│   └── utils/                  # Utility functions
│
├── k8s/                        # Kubernetes manifests
├── infra/                      # Infrastructure as Code (Helm)
├── docs/                       # Documentation
│   ├── API_REFERENCE.md        # Complete API documentation
│   └── ...
├── ARCHITECTURE.md             # System architecture
├── CONTRIBUTING.md             # Contribution guidelines
└── README.md                   # This file
```

For detailed architecture information, see [ARCHITECTURE.md](./ARCHITECTURE.md).

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines.

### Quick Start for Contributors

1. Read [CONTRIBUTING.md](./CONTRIBUTING.md) for development setup
2. Check [ARCHITECTURE.md](./ARCHITECTURE.md) to understand the system
3. Review [docs/API_REFERENCE.md](./docs/API_REFERENCE.md) for API details
4. Follow the code style guidelines
5. Write tests for new features
6. Submit a pull request

### For AI Agents

If you're an AI agent working on this codebase:
1. Read [CLAUDE.md](./CLAUDE.md) for development guidelines
2. Check [ARCHITECTURE.md](./ARCHITECTURE.md) for system design
3. Always ask about role-based access control before implementing features
4. Use existing services - never duplicate logic
5. Test on both mobile and desktop for UI changes

## License

MIT License
