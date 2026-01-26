# AI Agent Guide

This guide is specifically designed for AI agents (like Claude, ChatGPT, etc.) working on this codebase. It provides quick reference information and common patterns.

## Quick Reference

### Key Documentation Files

1. **ARCHITECTURE.md** - System architecture, data models, design patterns
2. **docs/API_REFERENCE.md** - Complete API endpoint documentation
3. **CLAUDE.md** - Development guidelines and patterns
4. **CONTRIBUTING.md** - Contribution process and code style

### Critical Rules

#### 1. Always Ask About Role-Based Access
Before implementing ANY feature, ask:
- Which roles can access this? (viewer/editor/admin)
- What data should be visible/hidden for each role?
- Should certain fields be redacted?

#### 2. Use Unified Services
**NEVER duplicate logic** - always check for existing services:

| Domain | Service Location |
|--------|------------------|
| Feedback | `backend/services/feedbackService.js` |
| Player | `backend/services/playerService.js` |
| Payment | `backend/services/paymentCalculationService.js` |
| OCR | `backend/services/ocrService.js` |

#### 3. Test Both Platforms
For UI changes:
- Test on mobile browser (responsive mode)
- Test on desktop browser
- Mobile components in `frontend/src/components/mobile/`

#### 4. Follow Service Layer Pattern
```javascript
// ✅ CORRECT: Use service
const feedbackService = require('../services/feedbackService');
const redacted = feedbackService.redactFeedbackList(feedback, userRole);

// ❌ WRONG: Duplicate logic
const redact = (list, role) => { ... }; // Don't do this!
```

## Common Tasks

### Adding a New API Endpoint

1. **Add Route** in `backend/routes/[domain].js`:
```javascript
/**
 * GET /api/example
 * @route GET /api/example
 * @access Private (requires authentication)
 * @param {number} req.query.page - Page number
 * @returns {Object} 200 - Success response
 */
router.get('/', auth, async (req, res) => {
  try {
    const result = await someService.getData(req.query);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

2. **Add Service Method** (if needed) in `backend/services/[domain]Service.js`
3. **Add API Client Method** in `frontend/src/services/api.ts`
4. **Add TypeScript Types** in `frontend/src/types/index.ts`
5. **Update API_REFERENCE.md**

### Adding a New Component

1. **Create Component** in appropriate directory:
   - `components/` for shared components
   - `components/mobile/` for mobile-specific
   - `pages/` for route-level components

2. **Add Types**:
```typescript
interface ComponentProps {
  data: DataType;
  onAction: () => void;
}
```

3. **Use API Services**:
```typescript
import { getData } from '../services/api';
const data = await getData();
```

4. **Test Both Platforms**: Mobile and desktop

### Adding a New Data Model

1. **Create Schema** in `backend/models/[Model].js`:
```javascript
const schema = new mongoose.Schema({
  field: { type: String, required: true },
  // ... other fields
}, { timestamps: true });

schema.index({ field: 1 }); // Add indexes
module.exports = mongoose.model('Model', schema);
```

2. **Add Routes** in `backend/routes/[domain].js`
3. **Add Service Methods** if needed
4. **Update ARCHITECTURE.md** data models section

## Code Patterns

### Backend Route Pattern
```javascript
router.get('/:id', auth, async (req, res) => {
  try {
    // Validation
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid ID' });
    }
    
    // Business logic (use service)
    const result = await service.getById(req.params.id);
    
    // Response
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

### Frontend Component Pattern
```typescript
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getData } from '../services/api';

const Component = () => {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getData();
        setData(result);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;
  return <div>{/* Component JSX */}</div>;
};
```

### Service Pattern
```javascript
/**
 * Get data with role-based filtering
 * @param {string} id - Resource ID
 * @param {string} userRole - User role for access control
 * @returns {Promise<Object>} Data with appropriate redaction
 */
const getData = async (id, userRole) => {
  const data = await Model.findById(id).lean();
  
  // Apply role-based redaction
  if (userRole === 'viewer') {
    return redactData(data);
  }
  
  return data;
};
```

## Database Patterns

### Query Optimization
```javascript
// ✅ Use .lean() for read-only queries
const data = await Model.find(query).lean();

// ✅ Use .select() to limit fields
const data = await Model.find(query)
  .select('_id name email')
  .lean();

// ✅ Always paginate lists
const data = await Model.find(query)
  .limit(limit)
  .skip((page - 1) * limit)
  .lean();
```

### Indexing
```javascript
// Add indexes for frequently queried fields
schema.index({ field1: 1, field2: -1 });
schema.index({ isDeleted: 1, createdAt: -1 });
```

## Error Handling

### Backend
```javascript
try {
  // Operation
} catch (error) {
  console.error('Error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
}
```

### Frontend
```typescript
try {
  const result = await api.getData();
} catch (error) {
  if (error.response?.status === 401) {
    // Handle unauthorized
  } else {
    // Handle other errors
  }
}
```

## Testing Checklist

Before submitting changes:
- [ ] Code follows style guidelines
- [ ] JSDoc/docstrings added
- [ ] Tests pass (if applicable)
- [ ] Tested on mobile browser
- [ ] Tested on desktop browser
- [ ] Role-based access verified
- [ ] Documentation updated
- [ ] No duplicate logic created

## Common Questions

### Q: Where should I add new business logic?
**A**: Check if a service exists in `backend/services/`. If yes, add to that service. If no, create a new service file.

### Q: How do I handle role-based data redaction?
**A**: Use existing services like `feedbackService.redactFeedbackList()`. Don't create new redaction logic.

### Q: Should I create mobile and desktop versions?
**A**: Check existing patterns. Some components are shared, some have mobile-specific versions in `components/mobile/`.

### Q: How do I add a new API endpoint?
**A**: 1) Add route, 2) Add service method (if needed), 3) Add API client method, 4) Add types, 5) Update docs.

### Q: Where are environment variables documented?
**A**: Check `.env.example` files in each directory (backend, frontend, ai-service).

## Quick Commands

```bash
# Start development
npm run dev  # From root (starts both frontend and backend)

# Backend only
cd backend && npm run dev

# Frontend only
cd frontend && npm start

# Run tests
cd backend && npm test

# Check linting
npm run lint  # If available
```

## File Locations Reference

| What | Where |
|------|-------|
| Backend routes | `backend/routes/` |
| Backend services | `backend/services/` |
| Backend models | `backend/models/` |
| Frontend components | `frontend/src/components/` |
| Frontend API client | `frontend/src/services/api.ts` |
| Frontend types | `frontend/src/types/index.ts` |
| AI service | `ai-service/` |
| Documentation | `docs/` |

## Need Help?

1. Check existing code for similar patterns
2. Read ARCHITECTURE.md for system design
3. Read CLAUDE.md for development guidelines
4. Check API_REFERENCE.md for endpoint details
5. Review CONTRIBUTING.md for code style

Remember: When in doubt, ask the user about requirements, especially for role-based access control!
