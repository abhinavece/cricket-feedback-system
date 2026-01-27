# WhatsApp Analytics System - Implementation Documentation

## Overview

This document describes the comprehensive WhatsApp Analytics System implementation that provides:
- **24-Hour Rolling Session Tracking**: Track when users message you to enable free messaging within the session window
- **Template Rate Limiting**: Prevent template spam with configurable cooldown periods
- **Message Status Tracking**: Real-time status updates (sent → delivered → read → failed)
- **Cost Analytics**: Track costs per template category and per user
- **Error Tracking**: View and analyze failed messages

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Backend Changes](#backend-changes)
3. [Frontend Changes](#frontend-changes)
4. [Testing Guide](#testing-guide)
5. [Configuration Options](#configuration-options)
6. [API Reference](#api-reference)

---

## Architecture Overview

### Key Concepts

#### 24-Hour Rolling Session Window
```
User sends message at 10:00 AM
  → Session opens, expires at 10:00 AM next day (24hrs)

User sends another message at 3:00 PM
  → Session EXTENDS, now expires at 3:00 PM next day (rolling)

Within active session:
  → ALL messages FREE (templates or free-text)

Session expired:
  → Only templates allowed (charged per category)
  → Cannot send free-text messages (if blocking enabled)
```

#### Cost Matrix
| Scenario | Template? | Session Active? | Cost |
|----------|-----------|-----------------|------|
| Free-text | No | Yes | FREE |
| Free-text | No | No | BLOCKED (if enabled) |
| Template | Yes | Yes | FREE |
| Template | Yes | No | Charged (₹0.35-₹0.75) |

#### Rate Limiting (Separate from Session)
- Configurable cooldown between template sends (default: 12 hours)
- Prevents template spam regardless of session status

---

## Backend Changes

### New Files Created

#### 1. `backend/models/WhatsAppSession.js`
**Purpose**: Tracks 24-hour rolling session windows per user

**Schema Fields**:
| Field | Type | Description |
|-------|------|-------------|
| `phone` | String | Phone number (unique, indexed) |
| `playerId` | ObjectId | Reference to Player |
| `playerName` | String | Cached player name |
| `lastUserMessageAt` | Date | Last incoming message timestamp |
| `expiresAt` | Date | Session expiry (lastUserMessageAt + 24h) |
| `sessionStartedAt` | Date | When session chain started |
| `initiatingMessageId` | ObjectId | First message that started session |
| `userMessageCount` | Number | Messages received from user |
| `businessMessageCount` | Number | Messages sent to user |
| `status` | Enum | 'active' or 'expired' |

**Static Methods**:
- `extendSession(phone, messageId, playerId, playerName)` - Create/extend session
- `getSessionStatus(phone)` - Get session info with remaining time
- `getActiveSessions(options)` - List active sessions with pagination
- `incrementBusinessMessageCount(phone)` - Track outgoing messages

---

#### 2. `backend/models/TemplateRateLimit.js`
**Purpose**: Tracks when last template was sent to each user

**Schema Fields**:
| Field | Type | Description |
|-------|------|-------------|
| `phone` | String | Phone number (unique, indexed) |
| `lastTemplateSentAt` | Date | When last template was sent |
| `lastTemplateName` | String | Name of last template |
| `lastMessageId` | ObjectId | Reference to Message |
| `playerId` | ObjectId | Reference to Player |
| `playerName` | String | Cached player name |
| `totalTemplatesSent` | Number | Lifetime template count |

**Static Methods**:
- `checkRateLimit(phone, cooldownHours)` - Check if template can be sent
- `recordTemplateSent(phone, templateName, messageId, playerId, playerName)` - Record send
- `getCooldownRemaining(phone, cooldownHours)` - Get remaining cooldown time

---

#### 3. `backend/models/WhatsAppCostConfig.js`
**Purpose**: Singleton configuration for template pricing

**Schema Fields**:
| Field | Type | Default |
|-------|------|---------|
| `templateCosts.utility` | Number | 0.35 (INR) |
| `templateCosts.marketing` | Number | 0.75 (INR) |
| `templateCosts.authentication` | Number | 0.30 (INR) |
| `templateCosts.service` | Number | 0.00 (INR) |
| `currency` | String | 'INR' |

**Static Methods**:
- `getConfig()` - Get or create singleton config
- `updateConfig(updates, userId)` - Update pricing
- `getCostForCategory(category)` - Get cost for a template category

---

#### 4. `backend/services/whatsappAnalyticsService.js`
**Purpose**: Centralized service for all analytics operations

**Session Management Functions**:
```javascript
extendSession(phone, messageId, playerId, playerName)
getSessionStatus(phone)
getActiveSessions(options)
hasActiveSession(phone)
incrementBusinessMessageCount(phone)
```

**Rate Limiting Functions**:
```javascript
checkTemplateRateLimit(phone)
recordTemplateSent(phone, templateName, messageId, playerId, playerName)
getCooldownRemaining(phone)
```

**Cost Calculation Functions**:
```javascript
calculateMessageCost(phone, isTemplate, templateCategory)
getCostForCategory(category)
```

**Message Tracking Functions**:
```javascript
updateMessageStatus(whatsappMessageId, status, timestamp)
recordMessageError(messageId, code, errorMessage, details)
recordMessageCost(messageId, cost, category)
```

**Analytics Functions**:
```javascript
getDashboardOverview()
getCostAnalytics(options)
getUserCostSummary(phone)
getFailedMessages(options)
preSendCheck(phone, isTemplate, templateName, templateCategory)
```

---

#### 5. `backend/routes/whatsapp-analytics.js`
**Purpose**: Admin-only API endpoints for analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/whatsapp/analytics/dashboard` | Overall analytics summary |
| GET | `/api/whatsapp/analytics/sessions` | List active sessions |
| GET | `/api/whatsapp/analytics/session/:phone` | Check specific session |
| GET | `/api/whatsapp/analytics/costs` | Cost analytics |
| GET | `/api/whatsapp/analytics/costs/user/:phone` | Per-user costs |
| GET | `/api/whatsapp/analytics/errors` | Failed messages |
| POST | `/api/whatsapp/analytics/check-send` | Pre-flight check |
| GET | `/api/whatsapp/analytics/cost-config` | Get cost configuration |
| PUT | `/api/whatsapp/analytics/cost-config` | Update cost configuration |

---

### Modified Files

#### 1. `backend/models/Message.js`
**Added Fields**:
| Field | Type | Description |
|-------|------|-------------|
| `status` | Enum | 'pending', 'sent', 'delivered', 'read', 'failed' |
| `statusUpdatedAt` | Date | When status was last updated |
| `templateCategory` | Enum | 'utility', 'marketing', 'authentication', 'service', null |
| `messageCost` | Number | Cost in configured currency (0 if within session) |
| `errorCode` | String | Error code if failed |
| `errorMessage` | String | Error message if failed |
| `errorDetails` | Mixed | Full error object |
| `whatsappMessageId` | String | WhatsApp API message ID (for status tracking) |

---

#### 2. `backend/models/SystemSettings.js`
**Added Fields under `whatsapp`**:
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `templateCooldownHours` | Number | 12 | Hours between template sends |
| `rateLimitingEnabled` | Boolean | true | Enable/disable rate limiting |
| `sessionTrackingEnabled` | Boolean | true | Enable/disable session tracking |
| `costTrackingEnabled` | Boolean | true | Enable/disable cost tracking |
| `blockOutOfSessionMessages` | Boolean | false | Block free-text when no session |

---

#### 3. `backend/routes/whatsapp.js`
**Changes Made**:
1. Added import for `whatsappAnalyticsService`
2. Added status event processing in webhook POST handler
3. Added `processStatusUpdate()` function for handling sent/delivered/read/failed events
4. Added session creation in `processIncomingMessage()` after saving message
5. Updated `sendAndLogMessage()` to save `whatsappMessageId` and track costs

---

#### 4. `backend/index.js`
**Changes Made**:
- Added import for `whatsapp-analytics` routes
- Registered routes at `/api/whatsapp/analytics`

---

## Frontend Changes

### New Files Created

#### 1. `frontend/src/components/MessageStatusIndicator.tsx`
**Purpose**: Visual indicator for message delivery status

**Props**:
| Prop | Type | Description |
|------|------|-------------|
| `status` | 'pending' \| 'sent' \| 'delivered' \| 'read' \| 'failed' | Message status |
| `size` | 'sm' \| 'md' \| 'lg' | Icon size |
| `showTooltip` | boolean | Show tooltip on hover |
| `errorMessage` | string | Error message for failed status |

**Visual Indicators**:
- `pending`: Clock icon (gray)
- `sent`: Single check (gray)
- `delivered`: Double check (gray)
- `read`: Double check (blue)
- `failed`: Alert circle (red)

---

#### 2. `frontend/src/components/WhatsAppAnalyticsTab.tsx`
**Purpose**: Desktop analytics dashboard (admin only)

**Sub-tabs**:
1. **Overview**: Stats cards, message status breakdown, quick links
2. **Active Sessions**: List of users with active 24h windows
3. **Costs**: Cost breakdown by category and user
4. **Errors**: Failed messages with error details

**Features**:
- Real-time refresh
- Pagination for large datasets
- Duration formatting (e.g., "4h 23m")
- Currency formatting (e.g., "₹0.35")

---

#### 3. `frontend/src/components/mobile/MobileWhatsAppAnalyticsTab.tsx`
**Purpose**: Mobile-optimized analytics view

**Features**:
- Collapsible sections for Sessions, Costs, Errors
- Compact stats cards (2x2 grid)
- Touch-friendly UI
- Pull-to-refresh support

---

### Modified Files

#### 1. `frontend/src/services/api.ts`
**Added Types**:
```typescript
WhatsAppAnalyticsDashboard
WhatsAppSession
WhatsAppSessionStatus
WhatsAppCooldownStatus
WhatsAppCostAnalytics
WhatsAppFailedMessage
WhatsAppPreSendCheck
WhatsAppCostConfig
```

**Added Functions**:
```typescript
getWhatsAppAnalyticsDashboard()
getWhatsAppActiveSessions(params)
getWhatsAppSessionStatus(phone)
getWhatsAppCostAnalytics(params)
getWhatsAppUserCosts(phone)
getWhatsAppFailedMessages(params)
checkWhatsAppSendStatus(data)
getWhatsAppCostConfig()
updateWhatsAppCostConfig(data)
```

**Updated `SystemSettings` interface** to include new WhatsApp fields.

---

#### 2. `frontend/src/components/ConversationPanel.tsx`
**Changes Made**:
- Added import for `MessageStatusIndicator`
- Added SSE handler for `message:status` events
- Updated message rendering to use `MessageStatusIndicator`
- Status updates now appear in real-time

---

#### 3. `frontend/src/components/DeveloperSettings.tsx`
**Added Section**: "Analytics & Rate Limiting" under WhatsApp Settings

**New Controls**:
| Control | Type | Description |
|---------|------|-------------|
| Template Rate Limiting | Toggle | Enable/disable cooldown |
| Template Cooldown Period | Number input | 1-72 hours |
| Session Tracking | Toggle | Enable/disable session tracking |
| Cost Tracking | Toggle | Enable/disable cost tracking |
| Block Out-of-Session Messages | Toggle | Prevent free-text when no session |

---

#### 4. `frontend/src/components/AdminDashboard.tsx`
**Changes Made**:
- Added lazy import for `WhatsAppAnalyticsTab`
- Added 'analytics' to type definitions
- Added Analytics tab button (admin only)
- Added Analytics tab content rendering

---

#### 5. `frontend/src/components/mobile/MobileAdminDashboard.tsx`
**Changes Made**:
- Added lazy import for `MobileWhatsAppAnalyticsTab`
- Added BarChart3 icon import
- Added 'analytics' to type definitions
- Added 'analytics' to `allTabs` array
- Added 'analytics' to `adminOnlyTabs` array
- Added Analytics tab content rendering

---

#### 6. Other Type Updates
Files updated to include 'analytics' in tab type unions:
- `frontend/src/App.tsx`
- `frontend/src/components/Navigation.tsx`
- `frontend/src/components/mobile/MobileNavigation.tsx`

---

## Testing Guide

### Prerequisites
1. Backend server running on port 5000
2. Frontend running on port 3000
3. Admin user account
4. WhatsApp Business API configured
5. At least one player with a valid phone number

---

### Test 1: Session Tracking

**Objective**: Verify that sessions are created when users message you

**Steps**:
1. Log in as admin
2. Navigate to the **Analytics** tab
3. Note the current "Active Sessions" count
4. Have a user send a WhatsApp message to your business number
5. Wait a few seconds, then click **Refresh**
6. Verify:
   - [ ] Active Sessions count increased by 1
   - [ ] Click on "Active Sessions" sub-tab
   - [ ] New session appears with user's phone/name
   - [ ] Session shows "24h" or similar remaining time
   - [ ] User message count shows 1

**Expected Outcome**: Session created with 24-hour expiry

---

### Test 2: Session Extension (Rolling Window)

**Objective**: Verify sessions extend when users send more messages

**Steps**:
1. From Test 1, note the session expiry time
2. Wait 5-10 minutes
3. Have the same user send another message
4. Refresh the Analytics tab
5. Verify:
   - [ ] Session expiry time has been extended
   - [ ] User message count increased
   - [ ] Session still shows as "active"

**Expected Outcome**: Session expiry pushed forward by 24 hours from latest message

---

### Test 3: Message Status Tracking

**Objective**: Verify message status updates in real-time

**Steps**:
1. Navigate to **WhatsApp** tab
2. Select a player and open their chat
3. Send a message to them
4. Watch the message bubble
5. Verify status progression:
   - [ ] Initially shows clock icon (pending/sending)
   - [ ] Changes to single check (sent)
   - [ ] Changes to double check (delivered) - may take a few seconds
   - [ ] Changes to blue double check (read) - requires user to open message

**Expected Outcome**: Real-time status updates via SSE

---

### Test 4: Template Rate Limiting

**Objective**: Verify templates are rate-limited

**Steps**:
1. Go to **Settings** → **Developer Tools**
2. Enable "Template Rate Limiting" if not already enabled
3. Set "Template Cooldown Period" to 1 hour (for testing)
4. Click **Set**
5. Send an availability request template to a player
6. Wait a moment, then try to send another template to the same player
7. Verify:
   - [ ] Second template is blocked with cooldown message
   - [ ] Cooldown remaining time is displayed

**Expected Outcome**: Templates blocked until cooldown expires

---

### Test 5: Cost Tracking

**Objective**: Verify costs are recorded for template messages

**Steps**:
1. Ensure "Cost Tracking" is enabled in Developer Tools
2. Navigate to **Analytics** → **Costs** sub-tab
3. Note current total cost
4. Send a template message to a user who does NOT have an active session
5. Refresh the Costs tab
6. Verify:
   - [ ] Total cost increased
   - [ ] Cost appears under appropriate category (utility/marketing)
   - [ ] User appears in "Cost by User" section

**Expected Outcome**: Template costs tracked and displayed

---

### Test 6: Free Messaging Within Session

**Objective**: Verify messages are free within active sessions

**Steps**:
1. Ensure you have an active session (user messaged recently)
2. Navigate to **Analytics** → **Costs** sub-tab
3. Note current total cost
4. Send a free-text message to the user with active session
5. Refresh the Costs tab
6. Verify:
   - [ ] Total cost did NOT increase
   - [ ] Message was sent successfully

**Expected Outcome**: No cost charged for messages within session

---

### Test 7: Error Tracking

**Objective**: Verify failed messages are captured

**Steps**:
1. Navigate to **Analytics** → **Errors** sub-tab
2. Attempt to send a message to an invalid phone number (if possible)
3. Or wait for a naturally occurring failure
4. Refresh the Errors tab
5. Verify:
   - [ ] Failed message appears in list
   - [ ] Error code is displayed
   - [ ] Error message is displayed
   - [ ] Timestamp is shown

**Expected Outcome**: Failed messages logged with error details

---

### Test 8: Analytics Dashboard Overview

**Objective**: Verify dashboard shows accurate aggregate data

**Steps**:
1. Navigate to **Analytics** tab (Overview)
2. Verify the following cards display data:
   - [ ] "Messages Sent" shows total count
   - [ ] "Active Sessions" shows current active count
   - [ ] "Delivery Rate" shows percentage
   - [ ] "Total Cost" shows accumulated cost

3. Check "Message Status (Last 30 Days)" breakdown:
   - [ ] Shows counts for sent, delivered, read, failed
   - [ ] Numbers add up correctly

**Expected Outcome**: Dashboard accurately reflects system state

---

### Test 9: Developer Settings Configuration

**Objective**: Verify all settings can be toggled and saved

**Steps**:
1. Go to **Settings** → **Developer Tools**
2. Scroll to "WhatsApp Settings" section
3. Test each toggle:

   a. **Template Rate Limiting**:
   - [ ] Toggle ON/OFF
   - [ ] Cooldown input appears when ON
   - [ ] Changes persist after refresh

   b. **Session Tracking**:
   - [ ] Toggle ON/OFF
   - [ ] Changes persist after refresh

   c. **Cost Tracking**:
   - [ ] Toggle ON/OFF
   - [ ] Changes persist after refresh

   d. **Block Out-of-Session Messages**:
   - [ ] Toggle ON/OFF
   - [ ] Changes persist after refresh

4. Verify "Last modified" info updates

**Expected Outcome**: All settings save and persist correctly

---

### Test 10: Mobile Analytics View

**Objective**: Verify mobile analytics works correctly

**Steps**:
1. Switch to mobile view (or use mobile device)
2. Navigate to **Analytics** tab
3. Verify:
   - [ ] Stats cards display in 2x2 grid
   - [ ] "Active Sessions" section is collapsible
   - [ ] "Cost Breakdown" section is collapsible
   - [ ] "Failed Messages" section is collapsible
4. Expand each section and verify data loads
5. Use refresh button

**Expected Outcome**: Mobile-optimized analytics fully functional

---

### Test 11: SSE Real-time Updates

**Objective**: Verify real-time updates work in conversation panel

**Steps**:
1. Open a chat conversation
2. In another window/device, send a message to the system as that user
3. Verify:
   - [ ] New message appears without manual refresh
   - [ ] "Live" indicator shows in header
4. Send a message and watch for status updates
5. Verify:
   - [ ] Status changes from pending → sent → delivered in real-time

**Expected Outcome**: Real-time updates work via SSE

---

## Configuration Options

### System Settings (via Developer Tools)

| Setting | Default | Description |
|---------|---------|-------------|
| `whatsapp.enabled` | true | Master switch for WhatsApp messaging |
| `whatsapp.templateCooldownHours` | 12 | Hours between template sends to same user |
| `whatsapp.rateLimitingEnabled` | true | Enable template rate limiting |
| `whatsapp.sessionTrackingEnabled` | true | Track 24-hour session windows |
| `whatsapp.costTrackingEnabled` | true | Record message costs |
| `whatsapp.blockOutOfSessionMessages` | false | Block free-text when no active session |

### Cost Configuration (via API only for now)

| Category | Default Cost (INR) |
|----------|-------------------|
| Utility | ₹0.35 |
| Marketing | ₹0.75 |
| Authentication | ₹0.30 |
| Service | ₹0.00 |

---

## API Reference

### Analytics Endpoints

All endpoints require admin authentication.

#### GET `/api/whatsapp/analytics/dashboard`
Returns overview statistics.

**Response**:
```json
{
  "success": true,
  "data": {
    "messages": {
      "total": 150,
      "last30Days": 45,
      "last7Days": 12,
      "byDirection": { "incoming": 30, "outgoing": 120 },
      "byStatus": { "sent": 50, "delivered": 40, "read": 25, "failed": 5 }
    },
    "rates": {
      "deliveryRate": "87.5",
      "readRate": "21.7",
      "failureRate": "4.3"
    },
    "sessions": { "active": 8 },
    "costs": { "total": 12.50, "currency": "INR" }
  }
}
```

#### GET `/api/whatsapp/analytics/sessions`
Returns active sessions.

**Query Params**: `page`, `limit`

**Response**:
```json
{
  "success": true,
  "sessions": [
    {
      "_id": "...",
      "phone": "919876543210",
      "playerName": "John Doe",
      "expiresAt": "2024-01-24T10:00:00Z",
      "remainingMinutes": 720,
      "userMessageCount": 3,
      "businessMessageCount": 5
    }
  ],
  "pagination": { "current": 1, "pages": 1, "total": 8, "hasMore": false }
}
```

#### POST `/api/whatsapp/analytics/check-send`
Pre-flight check before sending.

**Body**:
```json
{
  "phone": "919876543210",
  "isTemplate": true,
  "templateName": "availability_request",
  "templateCategory": "utility"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "phone": "919876543210",
    "session": { "isActive": true, "remainingMinutes": 720 },
    "rateLimit": { "canSend": false, "cooldownRemainingMinutes": 45 },
    "cost": { "cost": 0, "reason": "within_session" },
    "canSend": false,
    "blockedReason": "rate_limited"
  }
}
```

---

## Troubleshooting

### Sessions Not Being Created
1. Check if `sessionTrackingEnabled` is true in settings
2. Verify webhook is receiving messages (check backend logs)
3. Ensure `whatsappAnalyticsService` is imported in whatsapp.js

### Status Updates Not Appearing
1. Check browser console for SSE connection errors
2. Verify webhook is receiving status events (check backend logs)
3. Ensure `whatsappMessageId` is being saved on outgoing messages

### Cost Not Being Tracked
1. Check if `costTrackingEnabled` is true in settings
2. Verify template category is being passed when sending
3. Check if session was active (costs are 0 within session)

### Analytics Tab Not Visible
1. Verify user has admin role
2. Check browser console for import errors
3. Clear browser cache and refresh

---

## Files Changed Summary

### Backend (11 files)
- `backend/models/WhatsAppSession.js` (NEW)
- `backend/models/TemplateRateLimit.js` (NEW)
- `backend/models/WhatsAppCostConfig.js` (NEW)
- `backend/services/whatsappAnalyticsService.js` (NEW)
- `backend/routes/whatsapp-analytics.js` (NEW)
- `backend/models/Message.js` (MODIFIED)
- `backend/models/SystemSettings.js` (MODIFIED)
- `backend/routes/whatsapp.js` (MODIFIED)
- `backend/index.js` (MODIFIED)

### Frontend (10 files)
- `frontend/src/components/MessageStatusIndicator.tsx` (NEW)
- `frontend/src/components/WhatsAppAnalyticsTab.tsx` (NEW)
- `frontend/src/components/mobile/MobileWhatsAppAnalyticsTab.tsx` (NEW)
- `frontend/src/services/api.ts` (MODIFIED)
- `frontend/src/components/ConversationPanel.tsx` (MODIFIED)
- `frontend/src/components/DeveloperSettings.tsx` (MODIFIED)
- `frontend/src/components/AdminDashboard.tsx` (MODIFIED)
- `frontend/src/components/mobile/MobileAdminDashboard.tsx` (MODIFIED)
- `frontend/src/components/Navigation.tsx` (MODIFIED)
- `frontend/src/components/mobile/MobileNavigation.tsx` (MODIFIED)
- `frontend/src/App.tsx` (MODIFIED)
