# Database Skill

## Capability
Design and optimize MongoDB schemas, queries, and indexes for the Cricket Feedback System.

## Tech Stack
- MongoDB
- Mongoose ODM

## Data Models Overview

| Model | Purpose | Key Relationships |
|-------|---------|-------------------|
| User | Authentication, roles | → Player (via playerId) |
| Player | Cricket player profiles | → User (via userId), → Matches |
| Match | Match scheduling, squads | → Players (embedded), → Feedback |
| Feedback | Player feedback ratings | → Match, → Player |
| Availability | Player match responses | → Match, → Player |
| Message | WhatsApp history | → Match, → Player |
| MatchPayment | Payment tracking | → Match, → Players |

## Schema Design

### Basic Schema Pattern
```javascript
const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  // Required fields
  name: { type: String, required: true, trim: true },
  
  // Optional fields with defaults
  status: { 
    type: String, 
    enum: ['active', 'inactive'], 
    default: 'active' 
  },
  
  // References
  playerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Player',
    index: true 
  },
  
  // Soft delete fields
  isDeleted: { type: Boolean, default: false, index: true },
  deletedAt: { type: Date },
  deletedBy: { type: String }
}, { 
  timestamps: true  // Adds createdAt, updatedAt
});

// Compound indexes
resourceSchema.index({ isDeleted: 1, createdAt: -1 });
resourceSchema.index({ playerId: 1, status: 1 });

module.exports = mongoose.model('Resource', resourceSchema);
```

## Indexing Strategy

### When to Add Indexes
1. Fields used in `find()` queries
2. Fields used in `sort()`
3. Fields used in `$match` aggregations
4. Unique constraints

### Index Types
```javascript
// Single field index
schema.index({ field: 1 });  // Ascending
schema.index({ field: -1 }); // Descending

// Compound index
schema.index({ field1: 1, field2: -1 });

// Unique index
schema.index({ email: 1 }, { unique: true });

// Text index (for search)
schema.index({ name: 'text', description: 'text' });
```

### Current Indexes
```javascript
// Feedback
feedbackSchema.index({ isDeleted: 1, createdAt: -1 });
feedbackSchema.index({ matchId: 1, isDeleted: 1 });
feedbackSchema.index({ playerId: 1, isDeleted: 1 });

// Match
matchSchema.index({ date: 1 });
matchSchema.index({ status: 1 });

// Message
messageSchema.index({ from: 1, timestamp: -1 });
messageSchema.index({ to: 1, timestamp: -1 });

// Availability (unique constraint)
availabilitySchema.index({ matchId: 1, playerId: 1 }, { unique: true });
```

## Query Optimization

### Use .lean() for Read-Only
```javascript
// 50% faster - returns plain JS objects
const data = await Model.find(query).lean();

// Don't use .lean() if you need:
// - Model methods
// - Virtuals
// - Setters
```

### Use .select() to Limit Fields
```javascript
// Only fetch needed fields
const data = await Model.find(query)
  .select('_id name email role -__v')
  .lean();
```

### Pagination Pattern
```javascript
const { page = 1, limit = 10 } = req.query;
const pageNum = parseInt(page);
const limitNum = Math.min(parseInt(limit), 100); // Max 100

const data = await Model.find(query)
  .sort({ createdAt: -1 })
  .limit(limitNum)
  .skip((pageNum - 1) * limitNum)
  .lean();

const total = await Model.countDocuments(query);
const hasMore = (pageNum * limitNum) < total;
```

### Aggregation for Stats
```javascript
// More efficient than multiple queries
const stats = await Feedback.aggregate([
  { $match: { matchId, isDeleted: false } },
  {
    $group: {
      _id: null,
      count: { $sum: 1 },
      avgRating: { $avg: '$rating' },
      maxRating: { $max: '$rating' }
    }
  }
]);
```

## Relationship Patterns

### Reference by ObjectId
```javascript
// Schema
{
  matchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Match' },
  playerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' }
}

// Query with populate
await Feedback.find(query)
  .populate('matchId', 'opponent date ground')
  .populate('playerId', 'name')
  .lean();
```

### Denormalization (for performance)
```javascript
// Acceptable for frequently-accessed display fields
{
  playerId: { type: ObjectId, ref: 'Player' },
  playerName: String,  // Denormalized for quick display
  playerPhone: String  // Denormalized for WhatsApp
}
```

### Embedded Documents
```javascript
// Good for data that's always accessed together
{
  squad: [{
    playerId: { type: ObjectId, ref: 'Player' },
    playerName: String,
    response: { type: String, enum: ['yes', 'no', 'tentative', 'pending'] }
  }]
}
```

## Soft Delete Pattern

### Schema Fields
```javascript
{
  isDeleted: { type: Boolean, default: false, index: true },
  deletedAt: { type: Date },
  deletedBy: { type: String }
}
```

### Operations
```javascript
// Soft delete
await Model.findByIdAndUpdate(id, {
  isDeleted: true,
  deletedAt: new Date(),
  deletedBy: req.user.email
});

// Restore
await Model.findByIdAndUpdate(id, {
  isDeleted: false,
  deletedAt: null,
  deletedBy: null
});

// Query - ALWAYS filter deleted
await Model.find({ isDeleted: false, ...filters });
```

## Common Pitfalls

1. **Missing indexes** - Add indexes for frequently queried fields
2. **N+1 queries** - Use populate() or aggregation
3. **No pagination** - Always paginate list queries
4. **Forgetting isDeleted** - Always include in queries
5. **Over-fetching** - Use .select() to limit fields
6. **Blocking operations** - Use async/await properly
