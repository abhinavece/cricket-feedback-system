# CricSmart Tournament Hub

A dedicated tournament management application for cricket tournaments at `tournament.cricsmart.in`.

## Features

- **Tournament Dashboard**: Create and manage multiple tournaments
- **Player Pool**: Manage all players participating in the tournament
- **Franchises**: Create teams/franchises with budgets and assign players
- **Feedback**: Collect performance ratings for players

## Tech Stack

- **React 18** + TypeScript
- **Vite** for fast development
- **Tailwind CSS** with custom sports-broadcast theme
- **TanStack Query** for data fetching
- **React Router** for navigation

## Design Aesthetic

Sports-broadcast inspired with:
- Deep black backgrounds (#0a0a0b)
- Teal/emerald accents (#14b8a6)
- Gold highlights for stats (#f59e0b)
- Bold typography (Bebas Neue, Oswald, DM Sans)

## Quick Start

```bash
# Install dependencies
npm install

# Start development server (port 3001)
npm run dev

# Build for production
npm run build
```

## Environment Variables

Create a `.env` file:

```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

## Structure

```
src/
├── components/
│   ├── Layout.tsx          # Main app shell
│   ├── LoadingScreen.tsx   # Loading state
│   └── tabs/
│       ├── PlayersTab.tsx    # Player management
│       ├── FranchisesTab.tsx # Franchise/team management
│       └── FeedbackTab.tsx   # Feedback collection
├── pages/
│   ├── LoginPage.tsx       # Google OAuth login
│   ├── DashboardPage.tsx   # Tournament list
│   └── TournamentPage.tsx  # Tournament detail with tabs
├── contexts/
│   ├── AuthContext.tsx     # Authentication state
│   └── TournamentContext.tsx
├── services/
│   └── api.ts              # API client
└── types/
    └── index.ts            # TypeScript types
```

## Backend API Requirements

The frontend expects these API endpoints:

### Tournaments
- `GET /api/tournaments` - List tournaments
- `POST /api/tournaments` - Create tournament
- `GET /api/tournaments/:id` - Get tournament
- `PUT /api/tournaments/:id` - Update tournament
- `DELETE /api/tournaments/:id` - Delete tournament

### Players
- `GET /api/tournaments/:id/players` - List players
- `POST /api/tournaments/:id/players` - Add player
- `POST /api/tournaments/:id/players/import` - Bulk import
- `PUT /api/tournaments/:id/players/:playerId` - Update player
- `DELETE /api/tournaments/:id/players/:playerId` - Delete player

### Franchises
- `GET /api/tournaments/:id/franchises` - List franchises
- `POST /api/tournaments/:id/franchises` - Create franchise
- `PUT /api/tournaments/:id/franchises/:fid` - Update franchise
- `DELETE /api/tournaments/:id/franchises/:fid` - Delete franchise

### Feedback
- `GET /api/tournaments/:id/feedback` - List feedback
- `POST /api/tournaments/:id/feedback` - Add feedback
- `GET /api/tournaments/:id/feedback/stats` - Feedback stats

## Deployment

Build and deploy to `tournament.cricsmart.in`:

```bash
# Build
npm run build

# Output in dist/ folder
```

Configure your web server to:
1. Serve static files from `dist/`
2. Route all requests to `index.html` (SPA routing)
3. Proxy `/api/*` to your backend server
