# 🎯 Match Availability Tracking - Complete Design & Flow

## 📊 How matchId Tracking Works

### **Overview**
When you send a WhatsApp availability request for a match, the system creates a complete tracking chain that links:
- **Match** ↔️ **Availability Records** ↔️ **Messages** ↔️ **Player Responses**

---

## 🔄 Complete Data Flow

### **Phase 1: Sending Availability Request**

#### **1. User Action (Frontend)**
```
WhatsApp Tab → Select Match → Select Template → Select Players → Send
```

#### **2. API Request**
```bash
POST http://localhost:5001/api/whatsapp/send

Payload:
{
  "playerIds": ["695a650d0f069ca7b5ec87a4"],
  "matchId": "695f6076f2128baffbe04098",        # ← Match ObjectId
  "matchTitle": "Stuart Club",                   # ← Match Title
  "template": {
    "name": "mavericks_team_availability",
    "languageCode": "en",
    "components": [...]
  }
}
```

#### **3. Backend Processing** (`/backend/routes/whatsapp.js`)

```javascript
// Step 1: Extract matchId and matchTitle from request
const { playerIds, matchId, matchTitle, template } = req.body;

// Step 2: Get player details
const players = await Player.find({ '_id': { $in: playerIds } });

// Step 3: For each player, send WhatsApp message
for (const player of players) {
  
  // Step 3a: Send WhatsApp message via API
  const whatsappResponse = await axios.post(whatsappApiUrl, {
    messaging_product: 'whatsapp',
    to: player.phone,
    type: 'template',
    template: {
      name: 'mavericks_team_availability',
      language: { code: 'en' },
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: player.name },      // Player Name
            { type: 'text', text: '17/01/2026 05:30 AM' }, // Match DateTime
            { type: 'text', text: 'TestGround' }      // Venue
          ]
        }
      ]
    }
  });
  
  // Step 3b: Create Availability Record
  const availability = await Availability.create({
    matchId: matchId,                    // ← Links to Match
    playerId: player._id,                // ← Links to Player
    playerName: player.name,
    playerPhone: player.phone,
    response: 'pending',                 // Initial state
    status: 'sent',
    outgoingMessageId: whatsappResponse.data.messages[0].id
  });
  
  // Step 3c: Store Message with Match Context
  await Message.create({
    from: 'system',
    to: player.phone,
    text: `Availability request for ${matchTitle}`,
    direction: 'outgoing',
    messageId: whatsappResponse.data.messages[0].id,
    // Match context fields
    matchId: matchId,                    // ← Links to Match
    matchTitle: matchTitle,
    messageType: 'availability_request',
    templateUsed: 'mavericks_team_availability',
    availabilityId: availability._id     // ← Links to Availability
  });
}

// Step 4: Update Match Statistics
await Match.findByIdAndUpdate(matchId, {
  availabilitySent: true,
  availabilitySentAt: new Date(),
  totalPlayersRequested: players.length,
  noResponsePlayers: players.length,
  squadStatus: 'pending'
});
```

#### **4. Database State After Sending**

**Match Document:**
```javascript
{
  _id: "695f6076f2128baffbe04098",
  matchId: "MAV_2026_001",
  opponent: "Stuart Club",
  ground: "TestGround",
  date: "2026-01-17",
  // Tracking fields updated:
  availabilitySent: true,
  availabilitySentAt: "2026-01-08T08:00:00Z",
  totalPlayersRequested: 1,
  confirmedPlayers: 0,
  declinedPlayers: 0,
  tentativePlayers: 0,
  noResponsePlayers: 1,
  squadStatus: "pending"
}
```

**Availability Document:**
```javascript
{
  _id: "avail_123",
  matchId: "695f6076f2128baffbe04098",     // ← Links to Match
  playerId: "695a650d0f069ca7b5ec87a4",    // ← Links to Player
  playerName: "Abhinav Singh",
  playerPhone: "919876543210",
  response: "pending",                      // Waiting for response
  status: "sent",
  outgoingMessageId: "wamid.xxx",
  createdAt: "2026-01-08T08:00:00Z"
}
```

**Message Document:**
```javascript
{
  _id: "msg_456",
  from: "system",
  to: "919876543210",
  text: "Availability request for Stuart Club",
  direction: "outgoing",
  messageId: "wamid.xxx",
  matchId: "695f6076f2128baffbe04098",     // ← Links to Match
  matchTitle: "Stuart Club",
  messageType: "availability_request",
  templateUsed: "mavericks_team_availability",
  availabilityId: "avail_123",             // ← Links to Availability
  timestamp: "2026-01-08T08:00:00Z"
}
```

---

### **Phase 2: Player Responds via WhatsApp**

#### **1. Player Action**
```
Player receives WhatsApp message:
"Hi Abhinav Singh,
We have an upcoming match: Mavericks XI vs Stuart Club
on Friday, Jan 17 at 5:30 AM at TestGround.
Are you available for the match?
[Yes] [No] [Tentative]"

Player clicks: [Yes]
```

#### **2. WhatsApp Webhook Receives Response**
```bash
POST http://localhost:5001/api/whatsapp/webhook

Payload from WhatsApp:
{
  "entry": [{
    "changes": [{
      "value": {
        "messages": [{
          "from": "919876543210",
          "id": "wamid.incoming_yyy",
          "type": "interactive",
          "interactive": {
            "type": "button_reply",
            "button_reply": {
              "id": "yes",
              "title": "Yes"
            }
          }
        }]
      }
    }]
  }]
}
```

#### **3. Backend Webhook Processing** (`/backend/routes/whatsapp.js`)

```javascript
// Step 1: Extract response data
const from = message.from;           // "919876543210"
const messageText = "Yes";           // Button response

// Step 2: Find the original availability request message
const recentMessage = await Message.findOne({
  to: from,
  direction: 'outgoing',
  messageType: 'availability_request',
  matchId: { $exists: true }
}).sort({ timestamp: -1 });

if (!recentMessage) {
  console.log('No recent availability request found');
  return;
}

// Step 3: Extract matchId from the message
const matchId = recentMessage.matchId;        // "695f6076f2128baffbe04098"
const availabilityId = recentMessage.availabilityId;

console.log('Found matchId:', matchId);
console.log('Found availabilityId:', availabilityId);

// Step 4: Find the Availability record
const availability = await Availability.findOne({
  matchId: matchId,
  playerPhone: from
});

if (!availability) {
  console.log('Availability record not found');
  return;
}

// Step 5: Map response text to response type
let responseType = 'pending';
const lowerText = messageText.toLowerCase();
if (lowerText.includes('yes') || lowerText === 'yes') {
  responseType = 'yes';
} else if (lowerText.includes('no') || lowerText === 'no') {
  responseType = 'no';
} else if (lowerText.includes('tentative') || lowerText.includes('maybe')) {
  responseType = 'tentative';
}

// Step 6: Update Availability record
await Availability.findByIdAndUpdate(availability._id, {
  response: responseType,              // "yes"
  status: 'responded',
  respondedAt: new Date(),
  messageContent: messageText,
  incomingMessageId: message.id
});

console.log(`Updated availability: ${availability._id} with response: ${responseType}`);

// Step 7: Update Match document
const match = await Match.findById(matchId);

if (match) {
  // Add player to squad if confirmed
  if (responseType === 'yes') {
    const playerExists = match.squad.some(
      s => s.player.toString() === availability.playerId.toString()
    );
    
    if (!playerExists) {
      match.squad.push({
        player: availability.playerId,
        response: 'yes',
        respondedAt: new Date(),
        notes: ''
      });
    }
  }
  
  // Recalculate statistics
  const allAvailabilities = await Availability.find({ matchId: matchId });
  
  match.confirmedPlayers = allAvailabilities.filter(a => a.response === 'yes').length;
  match.declinedPlayers = allAvailabilities.filter(a => a.response === 'no').length;
  match.tentativePlayers = allAvailabilities.filter(a => a.response === 'tentative').length;
  match.noResponsePlayers = allAvailabilities.filter(a => a.response === 'pending').length;
  match.lastAvailabilityUpdate = new Date();
  
  // Update squad status
  if (match.confirmedPlayers >= 11) {
    match.squadStatus = 'full';
  } else if (match.confirmedPlayers > 0) {
    match.squadStatus = 'partial';
  }
  
  await match.save();
  
  console.log('Match updated:', {
    confirmed: match.confirmedPlayers,
    declined: match.declinedPlayers,
    tentative: match.tentativePlayers,
    noResponse: match.noResponsePlayers,
    squadStatus: match.squadStatus
  });
}

// Step 8: Store incoming message
await Message.create({
  from: from,
  to: 'system',
  text: messageText,
  direction: 'incoming',
  messageId: message.id,
  matchId: matchId,
  matchTitle: recentMessage.matchTitle,
  messageType: 'availability_response',
  availabilityId: availability._id
});
```

#### **4. Database State After Response**

**Availability Document (Updated):**
```javascript
{
  _id: "avail_123",
  matchId: "695f6076f2128baffbe04098",
  playerId: "695a650d0f069ca7b5ec87a4",
  playerName: "Abhinav Singh",
  playerPhone: "919876543210",
  response: "yes",                          // ← Updated from "pending"
  status: "responded",                      // ← Updated from "sent"
  respondedAt: "2026-01-08T08:05:00Z",     // ← New timestamp
  messageContent: "Yes",                    // ← Player's response
  incomingMessageId: "wamid.incoming_yyy", // ← New message ID
  outgoingMessageId: "wamid.xxx",
  createdAt: "2026-01-08T08:00:00Z",
  updatedAt: "2026-01-08T08:05:00Z"
}
```

**Match Document (Updated):**
```javascript
{
  _id: "695f6076f2128baffbe04098",
  matchId: "MAV_2026_001",
  opponent: "Stuart Club",
  squad: [
    {
      player: "695a650d0f069ca7b5ec87a4",  // ← Player added to squad
      response: "yes",
      respondedAt: "2026-01-08T08:05:00Z",
      notes: ""
    }
  ],
  // Statistics updated:
  availabilitySent: true,
  totalPlayersRequested: 1,
  confirmedPlayers: 1,                      // ← Incremented from 0
  declinedPlayers: 0,
  tentativePlayers: 0,
  noResponsePlayers: 0,                     // ← Decremented from 1
  lastAvailabilityUpdate: "2026-01-08T08:05:00Z",
  squadStatus: "partial"                    // ← Updated from "pending"
}
```

---

## 🎨 UI Display (What You See)

### **Match Management Page**

**Before Sending Availability:**
```
┌─────────────────────────────────────────┐
│ MAV_2026_001                    [Draft] │
│ vs Stuart Club                          │
│                                         │
│ 📅 Fri, Jan 17    ⏰ Morning           │
│ 📍 TestGround     👥 0 Players         │
│                                         │
│ Squad Availability                      │
│ 0/0 Responded (0%)                      │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│                                         │
│ ✅ 0  ⏳ 0  ❌ 0  ⚪ 0                  │
│                                         │
│ [Availability] [View] [Squad] [✏️] [🗑️] │
└─────────────────────────────────────────┘
```

**After Sending Availability (1 player):**
```
┌─────────────────────────────────────────┐
│ MAV_2026_001                    [Draft] │
│ vs Stuart Club                          │
│                                         │
│ 📅 Fri, Jan 17    ⏰ Morning           │
│ 📍 TestGround     👥 1 Players         │
│                                         │
│ Availability Tracking      [📤 Sent]    │
│ 0/1 Responded (0%)                      │
│ Sent Jan 8, 8:00 AM                     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│                                         │
│ ✅ 0  ⏳ 0  ❌ 0  ⚪ 1                  │
│                                         │
│ Squad: Pending                          │
│                                         │
│ [Availability] [View] [Squad] [✏️] [🗑️] │
└─────────────────────────────────────────┘
```

**After Player Responds "Yes":**
```
┌─────────────────────────────────────────┐
│ MAV_2026_001                    [Draft] │
│ vs Stuart Club                          │
│                                         │
│ 📅 Fri, Jan 17    ⏰ Morning           │
│ 📍 TestGround     👥 1 Players         │
│                                         │
│ Availability Tracking      [📤 Sent]    │
│ 1/1 Responded (100%)                    │
│ Sent Jan 8, 8:00 AM                     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│ ████████████████████████████████████    │
│                                         │
│ ✅ 1  ⏳ 0  ❌ 0  ⚪ 0                  │
│                                         │
│ Squad: Partial                          │
│                                         │
│ [Availability] [View] [Squad] [✏️] [🗑️] │
└─────────────────────────────────────────┘
```

### **Availability Dashboard (Click "Availability" button)**

```
┌─────────────────────────────────────────────────────────┐
│ Availability Dashboard                            [✕]   │
│ Stuart Club @ TestGround                                │
│                                                         │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│ │ ✅       │ │ ❌       │ │ ⏳       │ │ ⚪       │  │
│ │ Confirmed│ │ Declined │ │ Tentative│ │No Response│ │
│ │    1     │ │    0     │ │    0     │ │    0     │  │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│                                                         │
│ Response Rate: 1/1 (100%)                              │
│ ████████████████████████████████████████████████████   │
│                                                         │
│ Player Responses                                        │
│ ┌─────────────────────────────────────────────────┐   │
│ │ ✅ Abhinav Singh              [Confirmed]       │   │
│ │    919876543210                                 │   │
│ │    Responded 5 mins ago                         │   │
│ │    "Yes"                                        │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ Auto-refreshing every 10 seconds                       │
│ [Refresh Now]                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 🔍 How to Verify Tracking is Working

### **1. Check Match Document in MongoDB**
```bash
db.matches.findOne({ _id: ObjectId("695f6076f2128baffbe04098") })
```

Should show:
```javascript
{
  availabilitySent: true,
  totalPlayersRequested: 1,
  confirmedPlayers: 1,  // After response
  noResponsePlayers: 0,
  squadStatus: "partial"
}
```

### **2. Check Availability Collection**
```bash
db.availabilities.find({ matchId: ObjectId("695f6076f2128baffbe04098") })
```

Should show:
```javascript
[{
  matchId: ObjectId("695f6076f2128baffbe04098"),
  playerId: ObjectId("695a650d0f069ca7b5ec87a4"),
  response: "yes",
  status: "responded",
  respondedAt: ISODate("2026-01-08T08:05:00Z")
}]
```

### **3. Check Messages Collection**
```bash
db.messages.find({ matchId: ObjectId("695f6076f2128baffbe04098") })
```

Should show 2 messages:
```javascript
[
  {
    direction: "outgoing",
    messageType: "availability_request",
    matchId: ObjectId("695f6076f2128baffbe04098")
  },
  {
    direction: "incoming",
    messageType: "availability_response",
    matchId: ObjectId("695f6076f2128baffbe04098"),
    text: "Yes"
  }
]
```

---

## 🐛 Troubleshooting

### **Issue: Match card shows 0/0 players even after sending**

**Cause:** Frontend not receiving updated match data with availability fields.

**Solution:** 
1. Check backend API returns all fields
2. Refresh match list in frontend
3. Verify Match model includes new fields

### **Issue: Player response not updating match**

**Cause:** Webhook not finding matchId from message.

**Debug Steps:**
```javascript
// Add to webhook processing:
console.log('Incoming message from:', from);
console.log('Recent message found:', recentMessage);
console.log('MatchId extracted:', recentMessage?.matchId);
console.log('Availability found:', availability);
```

**Common causes:**
- Message not stored with matchId
- Player phone number mismatch
- Availability record not created

### **Issue: Dashboard shows empty**

**Cause:** Availability records not created during send.

**Solution:** Check backend logs during send:
```
✓ Created availability record for player: Abhinav Singh
✓ Match updated: availabilitySent = true
```

---

## 📈 Benefits of This Design

✅ **Complete Traceability** - Every response linked to specific match  
✅ **Real-time Updates** - Match statistics update automatically  
✅ **Historical Data** - Track player reliability over time  
✅ **Automatic Squad Building** - Squad updates as players respond  
✅ **No Manual Work** - Everything automated via WhatsApp  
✅ **Dashboard Visibility** - See all responses in one place  

---

## 🎯 Summary

**The matchId tracking works by:**

1. **Sending**: matchId included in API request → Creates Availability records → Stores in Messages
2. **Responding**: Webhook finds matchId from Message → Updates Availability → Updates Match stats
3. **Displaying**: Match card reads availability fields → Shows real tracking data → Dashboard shows details

**Key Tables:**
- **Match** - Stores aggregate statistics
- **Availability** - Stores individual player responses
- **Message** - Links WhatsApp messages to matches

**The chain:** Match ↔️ Availability ↔️ Message ↔️ WhatsApp Response

---

**Last Updated:** January 8, 2026  
**Status:** ✅ Fully Implemented and Working
