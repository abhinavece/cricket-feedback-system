# 🏏 Cricket Feedback & Match Management System - Complete Features Documentation

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [Authentication & User Management](#authentication--user-management)
3. [Feedback Management](#feedback-management)
4. [Player Management](#player-management)
5. [Match Management](#match-management)
6. [WhatsApp Integration](#whatsapp-integration)
7. [Match Availability System](#match-availability-system)
8. [Backend API Endpoints](#backend-api-endpoints)
9. [Frontend Components](#frontend-components)
10. [Workflows](#workflows)

---

## 🎯 System Overview

A comprehensive cricket team management system that combines feedback collection, player management, match scheduling, and automated WhatsApp communication for availability tracking.

### **Tech Stack**
- **Backend**: Node.js, Express.js, MongoDB, Mongoose
- **Frontend**: React, TypeScript, TailwindCSS
- **Communication**: WhatsApp Business API
- **Authentication**: JWT-based authentication

### **Key Features**
- ✅ Player feedback collection and analysis
- ✅ Player database management
- ✅ Match scheduling and management
- ✅ WhatsApp messaging with templates
- ✅ Automated availability tracking per match
- ✅ Real-time squad building
- ✅ Availability dashboard with live updates

---

## 🔐 Authentication & User Management

### **Features**
- JWT-based authentication
- Secure login/logout
- Protected routes
- Session management
- Auto-logout on token expiry

### **Components**
- **Login Component** (`/frontend/src/components/Login.tsx`)
  - Email/password authentication
  - Remember me functionality
  - Error handling
  - Redirect after successful login

### **API Endpoints**
```
POST /api/auth/login
  Body: { email, password }
  Response: { token, user: { name, email, role } }

POST /api/auth/logout
  Headers: { Authorization: Bearer <token> }
  Response: { message: "Logged out successfully" }
```

### **Workflow**
1. User enters credentials
2. Backend validates credentials
3. JWT token generated and returned
4. Token stored in localStorage
5. Token included in all subsequent API requests
6. Auto-redirect to login on 401 errors

---

## 📝 Feedback Management

### **Features**
- Collect player feedback after matches
- Rate performance (1-5 stars)
- Categorize feedback (batting, bowling, fielding, fitness, attitude)
- Anonymous feedback option
- Soft delete with trash management
- Restore deleted feedback
- Permanent deletion

### **Components**

#### **1. Feedback Form** (`/frontend/src/components/FeedbackForm.tsx`)
- Player selection dropdown
- Star rating system
- Category selection
- Comment text area
- Anonymous submission toggle
- Form validation

#### **2. Admin Dashboard** (`/frontend/src/components/AdminDashboard.tsx`)
- View all feedback
- Filter by player, category, rating
- Search functionality
- Delete/restore feedback
- Statistics overview
- Export functionality

#### **3. Feedback Card** (`/frontend/src/components/FeedbackCard.tsx`)
- Display individual feedback
- Show rating, category, timestamp
- Action buttons (delete, restore)
- Anonymous indicator

### **API Endpoints**
```
POST /api/feedback
  Body: { playerId, rating, category, comments, isAnonymous }
  Response: { feedback object }

GET /api/feedback
  Query: ?player=<id>&category=<cat>&rating=<num>
  Response: [ feedback array ]

GET /api/feedback/stats
  Response: { totalFeedback, averageRating, categoryBreakdown, etc. }

DELETE /api/feedback/:id
  Body: { deletedBy: "admin" }
  Response: { message: "Moved to trash" }

GET /api/feedback/trash
  Response: [ deleted feedback array ]

POST /api/feedback/:id/restore
  Response: { message: "Restored successfully" }

DELETE /api/feedback/:id/permanent
  Response: { message: "Permanently deleted" }
```

### **Database Schema**
```javascript
{
  playerId: ObjectId (ref: Player),
  rating: Number (1-5),
  category: String (batting|bowling|fielding|fitness|attitude),
  comments: String,
  isAnonymous: Boolean,
  isDeleted: Boolean,
  deletedAt: Date,
  deletedBy: String,
  createdAt: Date,
  updatedAt: Date
}
```

### **Workflow**
1. User submits feedback form
2. Backend validates and saves to database
3. Feedback appears in admin dashboard
4. Admin can filter, search, and manage feedback
5. Deleted feedback moves to trash
6. Can restore or permanently delete

---

## 👥 Player Management

### **Features**
- Add/edit/delete players
- Store player contact information
- WhatsApp number validation
- Player notes
- Search and filter players
- Player statistics

### **Components**

#### **1. WhatsApp Messaging Tab** (`/frontend/src/components/WhatsAppMessagingTab.tsx`)
- Player list with checkboxes
- Add new player form
- Edit player inline
- Delete player with confirmation
- Player statistics (total, selected)
- Search functionality

### **API Endpoints**
```
GET /api/players
  Response: [ player array ]

POST /api/players
  Body: { name, phone, notes }
  Response: { player object }

PUT /api/players/:id
  Body: { name, phone, notes }
  Response: { updated player }

DELETE /api/players/:id
  Response: { message: "Deleted successfully" }
```

### **Database Schema**
```javascript
{
  name: String (required),
  phone: String (required, unique),
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

### **Workflow**
1. Admin adds player with name and WhatsApp number
2. Player saved to database
3. Player appears in player list
4. Can edit/delete players
5. Players available for selection in messaging and matches

---

## 🏆 Match Management

### **Features**
- Create/edit/delete matches
- Schedule matches with date, time, venue
- Set match status (draft, confirmed, cancelled, completed)
- Opponent information
- Match notes
- Squad management
- Filter by status
- Search matches

### **Components**

#### **1. Match Management** (`/frontend/src/components/MatchManagement.tsx`)
- Match grid view
- Statistics cards (total, upcoming, confirmed, completed)
- Create match button
- Search and filter
- Match cards with actions

#### **2. Match Form** (`/frontend/src/components/MatchForm.tsx`)
- Match details input
- Date/time picker
- Venue selection
- Opponent input
- Status selection
- Notes field
- Validation

#### **3. Match Card** (`/frontend/src/components/MatchCard.tsx`)
- Display match details
- Squad statistics
- Status badge
- Action buttons (View, Availability, Squad, Edit, Delete)
- Response rate progress bar

### **API Endpoints**
```
GET /api/matches
  Query: ?status=<status>&page=<num>&limit=<num>
  Response: { matches: [], pagination: {} }

GET /api/matches/:id
  Response: { match object with populated squad }

POST /api/matches
  Body: { date, time, slot, opponent, ground, status, notes }
  Response: { match object }

PUT /api/matches/:id
  Body: { match fields to update }
  Response: { updated match }

DELETE /api/matches/:id
  Response: { message: "Deleted successfully" }
```

### **Database Schema**
```javascript
{
  matchId: String (unique),
  cricHeroesMatchId: String,
  date: Date (required),
  time: String,
  slot: String (morning|evening|night|custom),
  opponent: String,
  ground: String (required),
  status: String (draft|confirmed|cancelled|completed),
  squad: [{
    player: ObjectId (ref: Player),
    response: String (yes|no|tentative|pending),
    respondedAt: Date,
    notes: String
  }],
  // Availability tracking fields
  availabilitySent: Boolean,
  availabilitySentAt: Date,
  totalPlayersRequested: Number,
  confirmedPlayers: Number,
  declinedPlayers: Number,
  tentativePlayers: Number,
  noResponsePlayers: Number,
  lastAvailabilityUpdate: Date,
  squadStatus: String (pending|partial|full),
  createdBy: ObjectId (ref: User),
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

### **Workflow**
1. Admin creates match with details
2. Match saved to database
3. Match appears in match management grid
4. Admin can edit/delete matches
5. Admin can send availability requests
6. Squad builds automatically based on responses

---

## 💬 WhatsApp Integration

### **Features**
- Send text messages to players
- Send template messages (pre-approved by WhatsApp)
- Select multiple recipients
- Message history per player
- Real-time message sync
- Template parameter filling
- Message preview
- Match context in messages

### **Components**

#### **1. WhatsApp Messaging Tab** (`/frontend/src/components/WhatsAppMessagingTab.tsx`)
- Send mode toggle (text/template)
- Match selection dropdown (NEW)
- Template selection
- Player selection with checkboxes
- Message input/template parameters
- Send button with validation
- Message history modal
- Real-time chat interface

### **Templates Available**
1. **Team Availability** (`mavericks_team_availability`)
   - Parameters: Player Name, Match Date/Time, Venue
   - Buttons: Yes, No, Tentative
   - Used for match availability requests

2. **Custom Templates**
   - User-defined template name
   - Custom parameters
   - Flexible for various use cases

### **API Endpoints**
```
POST /api/whatsapp/send
  Body: {
    playerIds: [id1, id2],
    message: "text" (for text mode),
    template: {
      name: "template_name",
      languageCode: "en",
      components: [...]
    },
    matchId: "match_object_id" (NEW),
    matchTitle: "Match Title" (NEW)
  }
  Response: {
    sent: 5,
    failed: 0,
    attempted: 5,
    results: [...]
  }

POST /api/whatsapp/webhook
  Body: { WhatsApp webhook payload }
  Response: "EVENT_RECEIVED"
  
  Processes:
  - Incoming messages
  - Button responses
  - Updates availability records
  - Updates match squad

GET /api/whatsapp/messages/:phone
  Response: [ message array ]

POST /api/whatsapp/test
  Body: { to: "phone_number", message: "text" }
  Response: { success: true, messageId: "..." }
```

### **Database Schema - Messages**
```javascript
{
  from: String (required),
  to: String (required),
  text: String (required),
  direction: String (incoming|outgoing),
  messageId: String (unique),
  status: String,
  timestamp: Date,
  // Match context fields (NEW)
  matchId: ObjectId (ref: Match),
  matchTitle: String,
  messageType: String (general|availability_request|availability_response|match_update),
  templateUsed: String,
  availabilityId: ObjectId (ref: Availability),
  createdAt: Date,
  updatedAt: Date
}
```

### **Workflow - Text Message**
1. Admin selects players
2. Types message
3. Clicks send
4. Backend sends to WhatsApp API
5. Messages stored in database
6. Success/failure reported

### **Workflow - Template Message with Match**
1. Admin selects match from dropdown
2. Match details auto-filled
3. Selects template
4. Fills template parameters
5. Selects players
6. Clicks send
7. Backend:
   - Creates availability records (matchId + playerId)
   - Sends WhatsApp messages with match context
   - Updates match statistics
8. Messages stored with matchId reference

---

## 📊 Match Availability System

### **Features** (NEW)
- Match-specific availability tracking
- Automatic availability record creation
- Real-time response processing
- Automatic squad building
- Availability dashboard
- Response statistics
- Auto-refresh dashboard
- Player response history

### **Components**

#### **1. Match Availability Dashboard** (`/frontend/src/components/MatchAvailabilityDashboard.tsx`)
- Statistics cards (Confirmed, Declined, Tentative, No Response)
- Response rate progress bar
- Player response list with status
- Real-time updates (auto-refresh every 10 seconds)
- Color-coded status indicators
- Response timestamps
- Message content display
- Close/refresh controls

### **API Endpoints**
```
GET /api/availability/match/:matchId
  Response: {
    data: [ availability records ],
    stats: {
      total, confirmed, declined, tentative,
      pending, responded, noResponse
    }
  }

GET /api/availability/player/:playerId
  Response: {
    data: [ availability history ],
    stats: { total, confirmed, declined, tentative, responseRate }
  }

POST /api/availability
  Body: { matchId, playerIds: [] }
  Response: {
    message: "Created X availability records",
    data: [ availability records ]
  }

PUT /api/availability/:id
  Body: { response: "yes|no|tentative", messageContent: "..." }
  Response: { updated availability record }

DELETE /api/availability/:id
  Response: { message: "Deleted successfully" }

GET /api/availability/stats/summary
  Response: {
    totalRecords, responded, pending,
    confirmed, declined, tentative,
    responseRate, confirmationRate
  }
```

### **Database Schema - Availability**
```javascript
{
  matchId: ObjectId (ref: Match, required, indexed),
  playerId: ObjectId (ref: Player, required, indexed),
  playerName: String (required),
  playerPhone: String (required),
  response: String (yes|no|tentative|pending),
  respondedAt: Date,
  messageContent: String,
  outgoingMessageId: String,
  incomingMessageId: String,
  status: String (sent|delivered|read|responded|no_response),
  createdAt: Date,
  updatedAt: Date,
  
  // Compound unique index on (matchId, playerId)
}
```

### **Workflow - Complete Availability Cycle**

#### **Phase 1: Send Availability Request**
```
1. Admin opens WhatsApp Messaging Tab
2. Selects match from dropdown
   - Shows: "Jan 15 - Thunderbolts @ M. Chinnaswamy Stadium"
3. Match details auto-filled in template
4. Selects "Team Availability" template
5. Selects 15 players
6. Clicks "Send to 15 Players"

Backend Processing:
├─ For each player:
│  ├─ Create Availability record
│  │  ├─ matchId: "match_123"
│  │  ├─ playerId: "player_456"
│  │  ├─ response: "pending"
│  │  ├─ status: "sent"
│  │  └─ outgoingMessageId: "whatsapp_msg_789"
│  ├─ Send WhatsApp message
│  │  ├─ Template: "mavericks_team_availability"
│  │  ├─ Parameters: [PlayerName, DateTime, Venue]
│  │  └─ Buttons: [Yes, No, Tentative]
│  └─ Store Message with matchId
│     ├─ matchId: "match_123"
│     ├─ messageType: "availability_request"
│     └─ availabilityId: "avail_101"
└─ Update Match
   ├─ availabilitySent: true
   ├─ availabilitySentAt: Date.now()
   ├─ totalPlayersRequested: 15
   └─ noResponsePlayers: 15
```

#### **Phase 2: Player Responds**
```
1. Player receives WhatsApp message:
   "Hi Abhinav,
    We have an upcoming match: Mavericks XI vs Thunderbolts
    on Sunday, Jan 15 at 6:00 PM at M. Chinnaswamy Stadium.
    Are you available for the match?
    [Yes] [No] [Tentative]"

2. Player clicks "Yes" button
3. WhatsApp sends response to webhook

Backend Processing:
├─ Webhook receives button response
├─ Extract: from="91XXXXXXXXXX", text="Yes"
├─ Find recent availability_request message to this number
├─ Extract matchId from message
├─ Find Availability record (matchId + playerId)
├─ Update Availability:
│  ├─ response: "yes"
│  ├─ status: "responded"
│  ├─ respondedAt: Date.now()
│  └─ messageContent: "Yes"
├─ Find Match by matchId
├─ Update Match:
│  ├─ Add player to squad array
│  │  └─ { player: playerId, response: "yes", respondedAt: Date.now() }
│  ├─ Recalculate statistics:
│  │  ├─ confirmedPlayers: 1 (increment)
│  │  ├─ noResponsePlayers: 14 (decrement)
│  │  └─ lastAvailabilityUpdate: Date.now()
│  └─ Update squadStatus:
│     └─ "partial" (if confirmedPlayers > 0 && < 11)
└─ Store incoming message
   ├─ matchId: "match_123"
   └─ messageType: "availability_response"
```

#### **Phase 3: View Dashboard**
```
1. Admin opens Match Management
2. Finds match card
3. Clicks "Availability" button
4. Modal opens with MatchAvailabilityDashboard

Dashboard Shows:
├─ Statistics Cards:
│  ├─ ✅ Confirmed: 8
│  ├─ ❌ Declined: 3
│  ├─ ⏳ Tentative: 2
│  └─ ⚪ No Response: 2
├─ Response Rate: 13/15 (87%)
└─ Player List:
   ├─ ✅ Abhinav Singh - Confirmed
   │  └─ Responded 2 hours ago
   ├─ ✅ Rohan Kumar - Confirmed
   │  └─ Responded 1 hour ago
   ├─ ❌ Vijay Patel - Declined
   │  └─ "Out of town" - 30 mins ago
   ├─ ⏳ Amit Sharma - Tentative
   │  └─ "Will confirm tomorrow" - 15 mins ago
   └─ ⚪ Rahul Singh - No Response
      └─ Sent 3 hours ago

Auto-refresh: Every 10 seconds
```

---

## 🔌 Backend API Endpoints - Complete Reference

### **Authentication**
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | No | User login |
| POST | `/api/auth/logout` | Yes | User logout |

### **Feedback**
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/feedback` | Yes | Get all feedback (with filters) |
| POST | `/api/feedback` | No | Submit new feedback |
| GET | `/api/feedback/stats` | Yes | Get feedback statistics |
| DELETE | `/api/feedback/:id` | Yes | Soft delete feedback |
| GET | `/api/feedback/trash` | Yes | Get deleted feedback |
| POST | `/api/feedback/:id/restore` | Yes | Restore deleted feedback |
| DELETE | `/api/feedback/:id/permanent` | Yes | Permanently delete feedback |

### **Players**
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/players` | Yes | Get all players |
| POST | `/api/players` | Yes | Create new player |
| PUT | `/api/players/:id` | Yes | Update player |
| DELETE | `/api/players/:id` | Yes | Delete player |

### **Matches**
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/matches` | Yes | Get all matches (paginated) |
| GET | `/api/matches/:id` | Yes | Get single match |
| POST | `/api/matches` | Yes | Create new match |
| PUT | `/api/matches/:id` | Yes | Update match |
| DELETE | `/api/matches/:id` | Yes | Delete match |

### **WhatsApp**
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/whatsapp/send` | Yes | Send WhatsApp messages |
| POST | `/api/whatsapp/webhook` | No | WhatsApp webhook (incoming) |
| GET | `/api/whatsapp/webhook` | No | Webhook verification |
| GET | `/api/whatsapp/messages/:phone` | Yes | Get message history |
| POST | `/api/whatsapp/test` | Yes | Test message sending |

### **Availability (NEW)**
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/availability/match/:matchId` | Yes | Get match availability |
| GET | `/api/availability/player/:playerId` | Yes | Get player availability history |
| POST | `/api/availability` | Yes | Create availability records |
| PUT | `/api/availability/:id` | Yes | Update availability response |
| DELETE | `/api/availability/:id` | Yes | Delete availability record |
| GET | `/api/availability/stats/summary` | Yes | Get overall statistics |

### **Health Check**
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/health` | No | Server health check |

---

## 🎨 Frontend Components - Complete Reference

### **Authentication**
- `Login.tsx` - Login form with email/password

### **Dashboard**
- `AdminDashboard.tsx` - Main admin dashboard with feedback management
- `Navigation.tsx` - Top navigation bar with tabs

### **Feedback**
- `FeedbackForm.tsx` - Submit feedback form
- `FeedbackCard.tsx` - Display individual feedback
- `ConfirmDialog.tsx` - Confirmation dialog for actions

### **Players & WhatsApp**
- `WhatsAppMessagingTab.tsx` - Complete WhatsApp messaging interface
  - Player management
  - Message sending (text/template)
  - Match selection (NEW)
  - Message history
  - Real-time chat

### **Matches**
- `MatchManagement.tsx` - Match grid view with filters
- `MatchForm.tsx` - Create/edit match form
- `MatchCard.tsx` - Individual match card display
- `MatchAvailabilityDashboard.tsx` - Availability dashboard (NEW)

### **Shared**
- `ConfirmDialog.tsx` - Reusable confirmation dialog

---

## 🔄 Complete System Workflows

### **1. New Player Onboarding**
```
Admin Dashboard → WhatsApp Tab → Add Player
├─ Enter name: "Abhinav Singh"
├─ Enter phone: "9876543210"
├─ Add notes: "All-rounder, good fielder"
└─ Click "Add Player"
   └─ Player saved to database
      └─ Available for selection in messaging and matches
```

### **2. Match Creation**
```
Match Management → Create Match
├─ Enter opponent: "Thunderbolts"
├─ Select date: "Jan 15, 2026"
├─ Select time: "6:00 PM"
├─ Enter venue: "M. Chinnaswamy Stadium"
├─ Set status: "Confirmed"
└─ Click "Create Match"
   └─ Match saved to database
      └─ Appears in match grid
         └─ Ready for availability requests
```

### **3. Send Availability Request**
```
WhatsApp Tab → Template Mode
├─ Select Match: "Jan 15 - Thunderbolts @ M. Chinnaswamy"
│  └─ Match details auto-filled
├─ Select Template: "Team Availability"
├─ Select Players: 15 players checked
└─ Click "Send to 15 Players"
   ├─ Backend creates 15 availability records
   ├─ Sends 15 WhatsApp messages
   ├─ Updates match: availabilitySent = true
   └─ Success message: "15 sent, 0 failed"
```

### **4. Player Response Processing**
```
Player receives WhatsApp → Clicks "Yes"
└─ Webhook receives response
   ├─ Finds matchId from original message
   ├─ Updates availability record
   ├─ Adds player to match squad
   ├─ Updates match statistics
   └─ Dashboard updates in real-time
```

### **5. View Availability Dashboard**
```
Match Management → Find Match → Click "Availability"
└─ Modal opens with dashboard
   ├─ Shows statistics cards
   ├─ Shows response rate
   ├─ Lists all player responses
   ├─ Auto-refreshes every 10 seconds
   └─ Click "Refresh Now" for manual update
```

### **6. Feedback Collection**
```
Public Feedback Form → Player submits feedback
├─ Select player
├─ Rate performance (1-5 stars)
├─ Select category
├─ Write comments
├─ Toggle anonymous (optional)
└─ Submit
   └─ Feedback saved to database
      └─ Appears in admin dashboard
         └─ Admin can view/filter/delete
```

---

## 📈 Statistics & Analytics

### **Feedback Statistics**
- Total feedback count
- Average rating
- Category breakdown
- Player-wise statistics
- Rating distribution
- Anonymous vs identified feedback ratio

### **Match Statistics**
- Total matches
- Upcoming matches
- Confirmed matches
- Completed matches
- Average squad size
- Response rates

### **Availability Statistics**
- Total availability requests
- Response rate percentage
- Confirmation rate percentage
- Average response time
- Player reliability scores
- Match-wise availability trends

### **Player Statistics**
- Total players
- Active players
- Feedback received
- Matches participated
- Availability response rate
- Confirmation rate

---

## 🔒 Security Features

- JWT-based authentication
- Protected API routes
- Token expiry handling
- Auto-logout on unauthorized access
- Input validation
- SQL injection prevention (MongoDB)
- XSS protection
- CORS configuration
- Environment variable management
- Secure password handling

---

## 🚀 Deployment Configuration

### **Environment Variables**
```
# Backend (.env)
PORT=5001
MONGODB_URI=mongodb://localhost:27017/cricket-feedback
JWT_SECRET=your_jwt_secret
WHATSAPP_ACCESS_TOKEN=your_whatsapp_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_VERIFY_TOKEN=your_verify_token

# Frontend (.env)
REACT_APP_API_URL=http://localhost:5001/api
```

### **Database Indexes**
- Players: phone (unique)
- Messages: from, to, timestamp, matchId, messageType
- Availability: (matchId, playerId) compound unique, matchId, playerId
- Matches: date, status
- Feedback: playerId, category, rating

---

## 📱 Mobile Responsiveness

All components are fully responsive:
- Adaptive layouts for mobile/tablet/desktop
- Touch-friendly buttons and controls
- Mobile-optimized modals
- Responsive tables and grids
- Mobile navigation
- WhatsApp-style chat interface

---

## 🎯 Future Enhancements

### **Planned Features**
- Push notifications for responses
- Email notifications
- Advanced analytics dashboard
- Player performance tracking
- Match result recording
- Tournament management
- Payment tracking
- Practice session scheduling
- Injury tracking
- Equipment management

### **Technical Improvements**
- WebSocket for real-time updates
- Redis caching
- Rate limiting
- API versioning
- Comprehensive testing suite
- CI/CD pipeline
- Docker containerization
- Kubernetes deployment

---

## 📞 Support & Maintenance

### **Monitoring**
- Health check endpoint: `/api/health`
- Server logs with Morgan
- Error tracking
- Performance monitoring

### **Backup Strategy**
- Daily MongoDB backups
- Message history retention
- Feedback archive
- Match data preservation

---

## 🎓 User Roles & Permissions

### **Admin**
- Full access to all features
- Manage players
- Create/edit/delete matches
- Send WhatsApp messages
- View all feedback
- Access availability dashboard
- Manage system settings

### **Player (via WhatsApp)**
- Receive availability requests
- Respond to availability
- Submit feedback (public form)

---

## 📊 Data Models Summary

### **Collections**
1. **users** - Admin users
2. **players** - Team players
3. **matches** - Match schedule
4. **feedback** - Player feedback
5. **messages** - WhatsApp messages
6. **availability** - Match availability tracking (NEW)

### **Relationships**
- Feedback → Player (many-to-one)
- Match → Players (many-to-many via squad)
- Message → Match (many-to-one)
- Availability → Match (many-to-one)
- Availability → Player (many-to-one)
- Message → Availability (one-to-one)

---

## 🏁 Getting Started

### **Prerequisites**
- Node.js v14+
- MongoDB v4+
- WhatsApp Business API account
- npm or yarn

### **Installation**
```bash
# Clone repository
git clone <repo-url>

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your credentials

# Start MongoDB
mongod

# Start backend
cd backend
npm run dev

# Start frontend
cd frontend
npm start
```

### **Access**
- Frontend: http://localhost:3000
- Backend: http://localhost:5001
- Health Check: http://localhost:5001/api/health

---

## 📝 Version History

### **v2.0.0 - Match Availability System** (Current)
- ✅ Match-specific availability tracking
- ✅ Automatic squad building
- ✅ Real-time availability dashboard
- ✅ Enhanced WhatsApp integration with match context
- ✅ Comprehensive statistics

### **v1.0.0 - Initial Release**
- ✅ Feedback management
- ✅ Player management
- ✅ Match management
- ✅ WhatsApp messaging
- ✅ Admin dashboard

---

**Last Updated**: January 8, 2026
**System Status**: ✅ Fully Operational
**Documentation Version**: 2.0.0
