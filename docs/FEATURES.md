# Mavericks XI - Feature Documentation

Complete documentation of all features in the Cricket Match Feedback & Team Management System.

---

## Table of Contents

1. [Core Features](#core-features)
2. [Player Management](#player-management)
3. [Match Management](#match-management)
4. [WhatsApp Integration](#whatsapp-integration)
5. [Payment Tracking](#payment-tracking)
6. [Admin Dashboard](#admin-dashboard)
7. [Mobile Experience](#mobile-experience)
8. [Recent Additions](#recent-additions)

---

## Core Features

### Authentication System
- **Google OAuth Integration**: Secure login via Google accounts
- **JWT Token Management**: 24-hour token validity with automatic refresh
- **Role-Based Access Control**:
  - `viewer`: Can submit feedback forms
  - `editor`: Can view and edit dashboard data
  - `admin`: Full access including user management

### Feedback Collection
- **Anonymous Feedback Form**: Public-facing form for match feedback
- **Rating System**: Multi-criteria player ratings
- **Submission Tracking**: Track submission timestamps and sources
- **Soft Delete/Restore**: Admin can archive and restore feedback entries

---

## Player Management

### Player Registry
- **Player Profiles**: Name, phone, role, team assignment
- **Cricket Details**: Batting style, bowling style, preferred position
- **CricHeroes Integration**: Link to external stats platform
- **Age Tracking**: Date of birth with calculated age display

### Player Profile Page (`/player/:playerId`)
- **Public View**: Accessible to all authenticated users
- **Displays**:
  - Name, team, role badges
  - Age (calculated from DOB)
  - Batting & bowling styles
  - About/bio section
  - Email (from linked Google account)
  - CricHeroes external link
- **Privacy Protected**: Phone number, admin notes, exact DOB hidden
- **Admin Actions**: "Start Conversation" button for quick WhatsApp access

### PlayerNameLink Component
- Reusable component for clickable player names
- Navigates to player profile on click
- Used throughout dashboard and chat interfaces

---

## Match Management

### Match Creation & Editing
- **Match Details**: Opponent, venue, date/time
- **Squad Management**: Select players for each match
- **Availability Tracking**: Yes/No/Tentative/Pending statuses
- **CricHeroes Match ID**: Link to external match record

### Match Dashboard
- **Upcoming Matches View**: Chronological list of future matches
- **Availability Stats**: Real-time player response counts
- **Share Links**: Generate public shareable match summaries

### Match Detail Modal
- **Squad List**: All selected players with availability status
- **Response Breakdown**: Visual summary of confirmations
- **Quick Actions**: Send reminders, edit match details

---

## WhatsApp Integration

### WhatsApp Cloud API
- **Webhook Receiver**: `/api/whatsapp/webhook` for incoming messages
- **Message Templates**: Pre-approved templates for availability requests
- **Custom Messages**: Free-form text messaging to players

### Messaging Features
- **Bulk Messaging**: Send to multiple players at once
- **Template Selection**: Choose from approved WhatsApp templates
- **Match Context**: Auto-populate match details in messages
- **Delivery Status**: Track sent/failed message status

### Chat Interface (Desktop)
- **Modal-Based Chat**: Click "Chat" button to open conversation modal
- **Message History**: Full conversation thread with player
- **Real-Time Updates**: SSE-powered live message sync
- **Quick Reply**: Type and send messages directly from modal

### Chat Interface (Mobile)
- **Chats Tab**: Dedicated bottom navigation tab
- **Conversation List**: All player conversations with last message preview
- **Search**: Filter conversations by player name
- **Full-Screen Chat**: Tap conversation for immersive chat view

### Availability Tracking via WhatsApp
- **Context-Based Responses**: System validates response context
- **Automatic Status Updates**: Player replies update availability records
- **Reminder System**: Send follow-up reminders to non-respondents

---

## Payment Tracking

### Payment Management
- **Per-Match Payments**: Track player payments for each match
- **Payment Status**: Paid/Unpaid/Partial status tracking
- **Payment History**: Historical view of all payments

### Payment Reports
- **Player Payment History**: Individual payment records
- **Match Payment Summary**: Per-match financial overview
- **Export Options**: Shareable payment summaries

---

## Admin Dashboard

### Dashboard Tabs
| Tab | Description |
|-----|-------------|
| Feedback | View and manage player feedback submissions |
| WhatsApp | Send messages, view recipient list |
| Matches | Create/edit matches, manage squads |
| Payments | Track and record player payments |
| Users | Manage user roles and permissions |
| Player History | View player activity and statistics |
| Settings | User profile and preferences |

### User Management (Admin Only)
- **Role Assignment**: Promote/demote users
- **User List**: View all registered users
- **Activity Tracking**: See last login timestamps

---

## Mobile Experience

### Mobile-First Design
- **Responsive Layout**: Optimized for all screen sizes
- **Touch-Friendly**: Large tap targets, swipe gestures
- **Bottom Navigation**: Quick tab switching
- **Pull-to-Refresh**: Update data with swipe gesture

### Mobile-Specific Components
Located in `frontend/src/components/mobile/`:

| Component | Purpose |
|-----------|---------|
| `MobileNavigation.tsx` | Header and hamburger menu |
| `MobileAdminDashboard.tsx` | Tab-based dashboard layout |
| `MobileFeedbackTab.tsx` | Feedback list and management |
| `MobileWhatsAppTab.tsx` | WhatsApp messaging interface |
| `MobileMatchesTab.tsx` | Match list and management |
| `MobilePaymentsTab.tsx` | Payment tracking interface |
| `MobileChatsTab.tsx` | Conversation list with search |
| `MobileProfileSetup.tsx` | Profile editing form |

### Device Toggle
- Switch between mobile and desktop views
- Preference saved to localStorage
- Accessible from navigation menu

---

## Recent Additions

### Player Profile System (January 2025)
- **New Route**: `/player/:playerId` for public player profiles
- **PlayerNameLink**: Clickable names throughout the app
- **Email Display**: Shows linked Google account email
- **Backend Endpoint**: `GET /api/players/:id/profile` with sanitized data

### Mobile Chats Tab (January 2025)
- **New Navigation Item**: "Chats" in mobile bottom nav
- **Conversation List**: All WhatsApp conversations at a glance
- **Last Message Preview**: See most recent message per player
- **Full-Screen Chat**: Immersive conversation view

### ConversationPanel Component (January 2025)
- **Reusable Chat UI**: Works in modal and fullscreen modes
- **SSE Integration**: Real-time message updates
- **Message Input**: Send messages with auto-capitalize
- **Player Navigation**: Click player name to view profile

### Settings/Profile Page (January 2025)
- **Profile Editing**: Update name, role, cricket preferences
- **Batting/Bowling Styles**: Dropdown selections
- **About Section**: Free-text bio field
- **Date of Birth**: Date picker with age calculation

### Documentation Hooks (January 2025)
- **Auto-Documentation**: Hook runs after feature commits
- **CHANGELOG Updates**: Automatic changelog entries
- **Git Commit Guidelines**: Standardized commit message format

---

## API Endpoints Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/google` | Google OAuth login |
| GET | `/api/auth/verify` | Verify JWT token |
| GET | `/api/auth/users` | List all users (admin) |
| PUT | `/api/auth/users/:id/role` | Update user role (admin) |

### Players
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/players` | List all players |
| POST | `/api/players` | Create new player |
| GET | `/api/players/:id` | Get player details |
| GET | `/api/players/:id/profile` | Get public profile (sanitized) |
| PUT | `/api/players/:id` | Update player |
| DELETE | `/api/players/:id` | Delete player |

### Matches
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/matches` | List all matches |
| POST | `/api/matches` | Create new match |
| GET | `/api/matches/:id` | Get match details |
| PUT | `/api/matches/:id` | Update match |
| DELETE | `/api/matches/:id` | Delete match |

### WhatsApp
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/whatsapp/webhook` | Webhook for incoming messages |
| GET | `/api/whatsapp/webhook` | Webhook verification |
| POST | `/api/whatsapp/send` | Send message(s) |
| GET | `/api/whatsapp/history/:phone` | Get message history |
| GET | `/api/whatsapp/conversations` | List all conversations |

### Feedback
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/feedback` | List all feedback |
| POST | `/api/feedback` | Submit feedback |
| DELETE | `/api/feedback/:id` | Soft delete feedback |
| PUT | `/api/feedback/:id/restore` | Restore deleted feedback |

---

## Tech Stack Summary

| Layer | Technologies |
|-------|--------------|
| Frontend | React 18, TypeScript, Tailwind CSS, Axios |
| Backend | Node.js, Express 5, MongoDB, Mongoose |
| Auth | Google OAuth 2.0, JWT |
| Messaging | WhatsApp Cloud API, SSE |
| Deployment | Docker, Kubernetes, Helm, OCI |

---

*Last Updated: January 2025*
