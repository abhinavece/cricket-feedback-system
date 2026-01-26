# API Reference Documentation

Complete API reference for the Cricket Match Feedback & Team Management System.

**Base URL**: `http://localhost:5000/api` (development) or configured via `REACT_APP_API_URL`

**Authentication**: Most endpoints require JWT token in `Authorization: Bearer <token>` header.

## Table of Contents

1. [Authentication](#authentication)
2. [Feedback](#feedback)
3. [Players](#players)
4. [Matches](#matches)
5. [Availability](#availability)
6. [WhatsApp](#whatsapp)
7. [Payments](#payments)
8. [Admin](#admin)
9. [Public](#public)
10. [AI Service](#ai-service)

## Authentication

### POST /api/auth/google
Google OAuth login endpoint.

**Request Body**:
```json
{
  "token": "google-id-token"
}
```

**Response** (200):
```json
{
  "success": true,
  "token": "jwt-token",
  "user": {
    "_id": "userId",
    "email": "user@example.com",
    "role": "viewer|editor|admin",
    "playerId": "playerId" // optional
  }
}
```

**Error Responses**:
- `400`: Invalid token
- `500`: Server error

---

### GET /api/auth/verify
Verify JWT token validity.

**Headers**:
- `Authorization: Bearer <token>`

**Response** (200):
```json
{
  "valid": true,
  "user": {
    "_id": "userId",
    "email": "user@example.com",
    "role": "viewer|editor|admin"
  }
}
```

**Error Responses**:
- `401`: Invalid or expired token

---

### GET /api/auth/me
Get current authenticated user.

**Headers**:
- `Authorization: Bearer <token>`

**Response** (200):
```json
{
  "_id": "userId",
  "email": "user@example.com",
  "role": "viewer|editor|admin",
  "playerId": "playerId" // optional
}
```

---

## Feedback

### POST /api/feedback
Submit new general feedback (NOT match-specific).

**Headers**:
- `Authorization: Bearer <token>`

**Request Body**:
```json
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

**Response** (201):
```json
{
  "success": true,
  "feedback": {
    "_id": "feedbackId",
    "playerName": "John Doe",
    "matchDate": "2024-01-15",
    "batting": 4,
    "bowling": 3,
    "fielding": 5,
    "teamSpirit": 4,
    "feedbackText": "Great match experience!",
    "issues": { ... },
    "additionalComments": "The equipment could be better",
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z"
  }
}
```

**Error Responses**:
- `400`: Missing required fields or invalid ratings
- `401`: Unauthorized

---

### GET /api/feedback
Get all feedback submissions (paginated).

**Headers**:
- `Authorization: Bearer <token>`

**Query Parameters**:
- `page` (number, default: 1): Page number
- `limit` (number, default: 10, max: 100): Items per page
- `matchId` (string, optional): Filter by match ID
- `playerId` (string, optional): Filter by player ID

**Response** (200):
```json
{
  "success": true,
  "feedback": [
    {
      "_id": "feedbackId",
      "playerName": "John Doe", // Redacted for viewer role
      "matchDate": "2024-01-15",
      "batting": 4,
      "bowling": 3,
      "fielding": 5,
      "teamSpirit": 4,
      "feedbackText": "Great match experience!",
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "current": 1,
    "pages": 5,
    "total": 50,
    "hasMore": true
  }
}
```

**Note**: Player names are redacted (shown as "Anonymous Player") for `viewer` role.

---

### GET /api/feedback/summary
Get lightweight feedback summary (excludes large text fields).

**Headers**:
- `Authorization: Bearer <token>`

**Query Parameters**: Same as `/api/feedback`

**Response** (200): Same format as `/api/feedback` but excludes `feedbackText` and `additionalComments` fields.

---

### GET /api/feedback/:id
Get detailed feedback by ID.

**Headers**:
- `Authorization: Bearer <token>`

**Response** (200):
```json
{
  "success": true,
  "feedback": {
    "_id": "feedbackId",
    "playerName": "John Doe",
    "matchDate": "2024-01-15",
    "batting": 4,
    "bowling": 3,
    "fielding": 5,
    "teamSpirit": 4,
    "feedbackText": "Great match experience!",
    "issues": { ... },
    "additionalComments": "The equipment could be better",
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z"
  }
}
```

**Error Responses**:
- `404`: Feedback not found
- `401`: Unauthorized

---

### GET /api/feedback/stats
Get aggregated feedback statistics.

**Headers**:
- `Authorization: Bearer <token>`

**Query Parameters**:
- `matchId` (string, optional): Filter by match ID

**Response** (200):
```json
{
  "success": true,
  "stats": {
    "totalSubmissions": 150,
    "averageRatings": {
      "batting": 3.8,
      "bowling": 3.5,
      "fielding": 4.2,
      "teamSpirit": 4.0
    },
    "issues": {
      "venue": 5,
      "equipment": 12,
      "timing": 3,
      "umpiring": 2,
      "other": 8
    }
  }
}
```

---

### DELETE /api/feedback/:id
Soft delete feedback (requires editor+ role).

**Headers**:
- `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "deletedBy": "admin@example.com" // optional
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Feedback deleted successfully"
}
```

**Error Responses**:
- `403`: Insufficient permissions (requires editor+)
- `404`: Feedback not found

---

### POST /api/feedback/:id/restore
Restore soft-deleted feedback (requires editor+ role).

**Headers**:
- `Authorization: Bearer <token>`

**Response** (200):
```json
{
  "success": true,
  "message": "Feedback restored successfully"
}
```

---

## Players

### GET /api/players
List all players with optional search.

**Headers**:
- `Authorization: Bearer <token>`

**Query Parameters**:
- `search` (string, optional): Search by name or phone

**Response** (200):
```json
{
  "success": true,
  "players": [
    {
      "_id": "playerId",
      "name": "John Doe",
      "phone": "+1234567890",
      "role": "Batsman",
      "team": "Team A",
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

**Note**: Phone numbers are hidden for non-admin roles.

---

### POST /api/players
Create a new player (requires editor+ role).

**Headers**:
- `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "name": "John Doe",
  "phone": "+1234567890",
  "role": "Batsman",
  "team": "Team A",
  "notes": "Additional notes"
}
```

**Response** (201):
```json
{
  "success": true,
  "player": {
    "_id": "playerId",
    "name": "John Doe",
    "phone": "+1234567890",
    "role": "Batsman",
    "team": "Team A",
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

---

### GET /api/players/:id
Get player details.

**Headers**:
- `Authorization: Bearer <token>`

**Response** (200):
```json
{
  "success": true,
  "player": {
    "_id": "playerId",
    "name": "John Doe",
    "phone": "+1234567890", // Hidden for non-admin
    "role": "Batsman",
    "team": "Team A",
    "about": "Player bio",
    "battingStyle": "Right-handed",
    "bowlingStyle": "Right-arm fast",
    "dateOfBirth": "1990-01-15",
    "cricHeroesId": "ch123"
  }
}
```

---

### GET /api/players/:id/profile
Get public player profile (sanitized data).

**Headers**:
- `Authorization: Bearer <token>`

**Response** (200):
```json
{
  "success": true,
  "player": {
    "_id": "playerId",
    "name": "John Doe",
    "role": "Batsman",
    "team": "Team A",
    "about": "Player bio",
    "battingStyle": "Right-handed",
    "bowlingStyle": "Right-arm fast",
    "age": 34, // Calculated from DOB
    "cricHeroesId": "ch123",
    "email": "user@example.com" // If linked to User
  }
}
```

**Note**: Excludes phone, notes, and exact date of birth.

---

### PUT /api/players/:id
Update player (requires editor+ role).

**Headers**:
- `Authorization: Bearer <token>`

**Request Body**: Same as POST, all fields optional.

**Response** (200): Updated player object.

---

### DELETE /api/players/:id
Delete player (requires admin role).

**Headers**:
- `Authorization: Bearer <token>`

**Response** (200):
```json
{
  "success": true,
  "message": "Player deleted successfully"
}
```

---

## Matches

### GET /api/matches
List all matches (paginated).

**Headers**:
- `Authorization: Bearer <token>`

**Query Parameters**:
- `page` (number, default: 1)
- `limit` (number, default: 10, max: 100)
- `status` (string, optional): Filter by status
- `dateFrom` (string, optional): Filter from date
- `dateTo` (string, optional): Filter to date

**Response** (200):
```json
{
  "success": true,
  "matches": [
    {
      "_id": "matchId",
      "opponent": "Team B",
      "ground": "Ground Name",
      "date": "2024-01-20",
      "time": "10:00",
      "slot": "Morning",
      "status": "scheduled",
      "squad": [
        {
          "playerId": "playerId",
          "playerName": "John Doe",
          "response": "yes"
        }
      ],
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "current": 1,
    "pages": 5,
    "total": 50,
    "hasMore": true
  }
}
```

---

### POST /api/matches
Create a new match (requires editor+ role).

**Headers**:
- `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "opponent": "Team B",
  "ground": "Ground Name",
  "date": "2024-01-20",
  "time": "10:00",
  "slot": "Morning",
  "cricHeroesId": "ch456"
}
```

**Response** (201): Created match object.

---

### GET /api/matches/:id
Get match details.

**Headers**:
- `Authorization: Bearer <token>`

**Response** (200): Match object with full details.

---

### PUT /api/matches/:id
Update match (requires editor+ role).

**Headers**:
- `Authorization: Bearer <token>`

**Request Body**: Same as POST, all fields optional.

**Response** (200): Updated match object.

---

### POST /api/matches/:id/squad
Update match squad (requires editor+ role).

**Headers**:
- `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "squad": [
    {
      "playerId": "playerId1",
      "response": "yes"
    },
    {
      "playerId": "playerId2",
      "response": "no"
    }
  ]
}
```

**Response** (200): Updated match with squad.

---

## Availability

### GET /api/availability
List availability records.

**Headers**:
- `Authorization: Bearer <token>`

**Query Parameters**:
- `matchId` (string, optional): Filter by match
- `playerId` (string, optional): Filter by player

**Response** (200):
```json
{
  "success": true,
  "availability": [
    {
      "_id": "availabilityId",
      "matchId": "matchId",
      "playerId": "playerId",
      "response": "yes",
      "message": "I'll be there!",
      "reminderSent": false,
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

---

### POST /api/availability
Create or update availability.

**Headers**:
- `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "matchId": "matchId",
  "playerId": "playerId",
  "response": "yes|no|tentative|pending",
  "message": "I'll be there!"
}
```

**Response** (200): Created/updated availability object.

---

### GET /api/availability/match/:matchId
Get all availability for a specific match.

**Headers**:
- `Authorization: Bearer <token>`

**Response** (200): Array of availability records for the match.

---

## WhatsApp

### POST /api/whatsapp/webhook
WhatsApp webhook endpoint (receives messages from WhatsApp Cloud API).

**Note**: This endpoint is public (no auth required) but validates WhatsApp verify token.

**Query Parameters** (for verification):
- `hub.mode`: "subscribe"
- `hub.verify_token`: Must match `WHATSAPP_VERIFY_TOKEN`
- `hub.challenge`: Challenge string

**Request Body** (for messages):
```json
{
  "entry": [
    {
      "changes": [
        {
          "value": {
            "messages": [
              {
                "from": "1234567890",
                "text": {
                  "body": "Message text"
                },
                "context": {
                  "id": "contextId"
                },
                "timestamp": "1234567890"
              }
            ]
          }
        }
      ]
    }
  ]
}
```

**Response** (200):
```json
{
  "success": true
}
```

---

### POST /api/whatsapp/send
Send WhatsApp message (requires editor+ role).

**Headers**:
- `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "to": "+1234567890",
  "message": "Hello!",
  "context": {
    "type": "availability_request",
    "matchId": "matchId"
  }
}
```

**Response** (200):
```json
{
  "success": true,
  "messageId": "whatsapp-message-id"
}
```

---

### GET /api/whatsapp/conversations
Get all player conversations.

**Headers**:
- `Authorization: Bearer <token>`

**Response** (200):
```json
{
  "success": true,
  "conversations": [
    {
      "playerId": "playerId",
      "playerName": "John Doe",
      "lastMessage": "Last message text",
      "lastMessageTime": "2024-01-15T10:00:00Z",
      "unreadCount": 2
    }
  ]
}
```

---

## Payments

### GET /api/payments
List all payments (paginated).

**Headers**:
- `Authorization: Bearer <token>`

**Query Parameters**:
- `page` (number, default: 1)
- `limit` (number, default: 10, max: 100)
- `matchId` (string, optional): Filter by match

**Response** (200):
```json
{
  "success": true,
  "payments": [
    {
      "_id": "paymentId",
      "matchId": "matchId",
      "totalAmount": 5000,
      "playerPayments": [
        {
          "playerId": "playerId",
          "amount": 500,
          "paid": true
        }
      ],
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ],
  "pagination": { ... }
}
```

---

### POST /api/payments
Create payment record (requires editor+ role).

**Headers**:
- `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "matchId": "matchId",
  "totalAmount": 5000,
  "playerPayments": [
    {
      "playerId": "playerId",
      "amount": 500,
      "paid": false
    }
  ]
}
```

**Response** (201): Created payment object.

---

## Admin

### GET /api/admin/users
List all users (admin only).

**Headers**:
- `Authorization: Bearer <token>`

**Response** (200):
```json
{
  "success": true,
  "users": [
    {
      "_id": "userId",
      "email": "user@example.com",
      "role": "viewer|editor|admin",
      "playerId": "playerId",
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

---

### PUT /api/admin/users/:id/role
Update user role (admin only).

**Headers**:
- `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "role": "editor"
}
```

**Response** (200): Updated user object.

---

## Public

### GET /api/public/match/:token
Get public match view (no auth required).

**Response** (200): Match details (limited fields).

---

### GET /api/public/payment/:token
Get public payment view (no auth required).

**Response** (200): Payment details (limited fields).

---

## AI Service

### POST /ai-service/parse-payment
Parse payment screenshot using AI.

**Request**:
- `Content-Type: multipart/form-data`
- `image`: Image file (required)

**Response** (200):
```json
{
  "success": true,
  "data": {
    "totalAmount": 5000,
    "date": "2024-01-15",
    "players": [
      {
        "name": "John Doe",
        "amount": 500
      }
    ]
  },
  "metadata": {
    "confidence": 0.95,
    "processingTime": 1.23,
    "provider": "google-ai-studio"
  }
}
```

**Error Responses**:
- `400`: Invalid image or validation failed
- `429`: Rate limit exceeded
- `503`: AI service disabled

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "error": "Error message",
  "details": "Additional details (development only)"
}
```

**HTTP Status Codes**:
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation error)
- `401`: Unauthorized (missing/invalid token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `429`: Too Many Requests (rate limit)
- `500`: Internal Server Error
- `503`: Service Unavailable

---

## Rate Limiting

- **AI Service**: Daily request limit (configurable, default: 100)
- **General API**: No rate limiting currently (consider adding for production)

---

## Pagination

All list endpoints support pagination:

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)

Response includes pagination metadata:
```json
{
  "pagination": {
    "current": 1,
    "pages": 5,
    "total": 50,
    "hasMore": true
  }
}
```

---

## Data Redaction

For `viewer` role, certain data is redacted:
- Player names in feedback → "Anonymous Player"
- Phone numbers → Hidden
- Sensitive notes → Hidden

`editor` and `admin` roles see full data.
