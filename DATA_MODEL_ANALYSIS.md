# 📊 Cricket Feedback System - Data Model & API Analysis

## 🔗 **Data Model Relationships**

### **1. Match Model** (`/backend/models/Match.js`)
**Purpose:** Core match information and availability tracking statistics

**Key Fields:**
```javascript
{
  _id: ObjectId,                    // Primary key
  matchId: "MATCH-0001",           // Human readable ID
  date: Date,                      // Match date
  opponent: "SWAG-XI",            // Opponent team
  ground: "Nityansh Cricket Ground", // Venue
  
  // Availability Tracking Fields
  availabilitySent: true,          // Whether requests were sent
  availabilitySentAt: Date,        // When requests were sent
  totalPlayersRequested: 1,        // Total players contacted
  confirmedPlayers: 0,             // Players who confirmed
  declinedPlayers: 0,              // Players who declined
  tentativePlayers: 0,             // Players who are tentative
  noResponsePlayers: 1,            // Players who haven't responded
  
  // Squad Management
  squad: [{                        // Selected squad
    player: ObjectId,              // Reference to Player
    response: "pending",           // Squad response
    respondedAt: Date
  }],
  
  createdBy: ObjectId,             // Reference to User
  status: "draft"                  // Match status
}
```

### **2. Availability Model** (`/backend/models/Availability.js`)
**Purpose:** Individual player availability tracking per match

**Key Fields:**
```javascript
{
  _id: ObjectId,                   // Primary key
  matchId: ObjectId,               // Reference to Match
  playerId: ObjectId,              // Reference to Player
  playerName: "Abhinav Singh",     // Denormalized name
  playerPhone: "918087102325",     // Denormalized phone
  
  // Response Tracking
  response: "pending",             // yes/no/tentative/pending
  respondedAt: Date,               // When player responded
  messageContent: "Yes",           // Response text
  
  // Message Linking
  outgoingMessageId: "wamid.xxx",  // WhatsApp message ID sent
  incomingMessageId: "wamid.yyy",  // WhatsApp message ID received
  
  // Status & Tracking
  status: "sent",                  // sent/delivered/read/responded
  reminderSentAt: Date,             // When reminder was sent
  reminderCount: 0,                 // Number of reminders sent
  
  createdAt: Date,                 // When record was created
  updatedAt: Date                  // When record was last updated
}
```

### **3. Message Model** (`/backend/models/Message.js`)
**Purpose:** All WhatsApp messages (sent/received) with match context

**Key Fields:**
```javascript
{
  _id: ObjectId,                   // Primary key
  from: "918087102325",           // Sender phone
  to: "917410715517",             // Receiver phone
  text: "Yes",                     // Message content
  direction: "incoming",           // incoming/outgoing
  messageId: "wamid.xxx",          // WhatsApp message ID
  
  // Match Context (CRITICAL FOR MAPPING)
  matchId: ObjectId,               // Reference to Match
  matchTitle: "MATCH-0001 vs SWAG-XI", // Match description
  messageType: "availability_request", // Message type
  availabilityId: ObjectId,        // Link to Availability record
  
  timestamp: Date,                 // When message was sent/received
  templateUsed: "mavericks_team_availability" // Template name
}
```

### **4. Player Model** (`/backend/models/Player.js`)
**Purpose:** Player information and team association

**Key Fields:**
```javascript
{
  _id: ObjectId,                   // Primary key
  name: "Abhinav Singh",           // Player name
  phone: "8087102325",             // Player phone
  role: "player",                  // Player role
  team: "Mavericks XI",            // Team name
  isActive: true                   // Active status
}
```

## 🔍 **Relationship Diagram**

```
Match (1) ←→ (Many) Availability (1) ←→ (1) Player
   ↓              ↓                    ↓
   |              |                    |
   ↓              ↓                    ↓
Message (Many)   |                    |
   ↓              |                    |
   └─── availabilityId ──────────────┘
```

**Key Relationships:**
1. **Match ↔ Availability:** One match has many availability records (one per player)
2. **Availability ↔ Player:** Each availability belongs to one player
3. **Message ↔ Availability:** Messages link to availability records via `availabilityId`
4. **Message ↔ Match:** Messages have `matchId` for context

## 🚀 **API Endpoints & Data Flow**

### **1. Get Match Availability**
```
GET /api/availability/match/:matchId
```

**How it works:**
1. Finds all `Availability` records for the match
2. Populates player details (`name`, `phone`)
3. Calculates statistics (confirmed, declined, tentative, pending)
4. Returns structured data with stats

**Response Structure:**
```javascript
{
  success: true,
  data: [
    {
      _id: "695f6076f2128baffbe04098",
      matchId: "695d58d9fd050898efb55948",
      playerId: "695aa431252f620eaea92d99",
      playerName: "Abhinav Singh",
      playerPhone: "918087102325",
      response: "pending",
      status: "sent",
      createdAt: "2026-01-08T09:18:20.298Z",
      respondedAt: null,
      player: {                    // Populated from Player model
        name: "Abhinav Singh",
        phone: "8087102325"
      }
    }
  ],
  stats: {
    total: 1,
    confirmed: 0,
    declined: 0,
    tentative: 0,
    pending: 1,
    responded: 0,
    noResponse: 1
  }
}
```

### **2. WhatsApp Webhook Processing**
```
POST /api/whatsapp/webhook
```

**How it maps response to matchId:**

**Step 1: Extract Incoming Message Info**
```javascript
From Webhook:
{
  "from": "918087102325",           // Player's phone
  "text": "Yes",                    // Response
  "button": { "payload": "Yes" }    // Button response
}
```

**Step 2: Find Recent Outgoing Message**
```javascript
const recentMessage = await Message.findOne({
  to: { $in: phoneVariants },      // Match player's phone
  messageType: 'availability_request',
  direction: 'outgoing'
}).sort({ timestamp: -1 });
```

**Step 3: Get MatchId from Message**
```javascript
// From the found message:
{
  matchId: "695d58d9fd050898efb55948",  // ← THIS IS THE KEY!
  availabilityId: "695f6076f2128baffbe04098"
}
```

**Step 4: Update Availability Record**
```javascript
const availability = await Availability.findById(recentMessage.availabilityId);
availability.response = "yes";
availability.status = "responded";
availability.respondedAt = new Date();
await availability.save();
```

## 🔍 **Webhook Log Analysis - MatchId Mapping**

From your webhook logs:

```javascript
{
  "from": "918087102325",           // Player responded
  "text": "Yes",                    // Response content
  "button": { "payload": "Yes" }   // Button clicked
}
```

**The system finds the matchId by:**

1. **Phone Matching:** Looks for outgoing messages sent to `918087102325`
2. **Message Context:** Finds the most recent availability request message
3. **MatchId Extraction:** Gets `matchId` from that message
4. **Record Update:** Updates the linked availability record

**Complete Flow:**
```
Player: "918087102325" responds "Yes"
    ↓
Find: Message(to="918087102325", direction="outgoing")
    ↓
Found: Message.matchId="695d58d9fd050898efb55948"
    ↓
Update: Availability(matchId="695d58d9fd050898efb55948", response="yes")
    ↓
Result: Match statistics updated, UI refreshed
```

## 🏗️ **Team-Based Player Listing**

### **How Players are Listed by Team:**

**1. Player Model has `team` field:**
```javascript
{
  name: "Abhinav Singh",
  phone: "8087102325",
  team: "Mavericks XI",           // ← Team association
  role: "player"
}
```

**2. API can filter by team:**
```javascript
// Get players by team
const players = await Player.find({ 
  team: "Mavericks XI",
  isActive: true 
}).sort({ name: 1 });
```

**3. Match availability includes team info:**
```javascript
// When fetching availability for a match
const availabilities = await Availability.find({ matchId })
  .populate('playerId', 'name phone team')  // ← Include team
  .sort({ 'playerId.name': 1 });
```

## 🚨 **Current Issue Analysis**

**Problem:** No availability records exist despite `availabilitySent: true`

**Root Cause:** 
1. Messages were sent with old buggy code
2. No availability records were created (`if (matchId && template)` condition failed)
3. Incoming responses couldn't be linked to records

**Solution:**
1. Create availability records for existing messages
2. Link incoming responses to those records
3. Update match statistics

**Data Fix Needed:**
```javascript
// For each outgoing message without availabilityId:
1. Find player by phone number
2. Create availability record
3. Update message.availabilityId
4. Process any incoming responses
```

## ✅ **Summary**

**The system correctly maps WhatsApp responses to specific matches through:**
1. **Phone number matching** between incoming/outgoing messages
2. **Message context** stored in Message model (`matchId`, `availabilityId`)
3. **Availability records** that link players to matches
4. **Real-time updates** to match statistics

**The issue was not with the mapping logic, but with missing availability records due to the bug in the message sending code.**
