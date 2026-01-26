# Security Rules

## Authentication & Authorization

### Route Protection
```javascript
// Viewer+ access (anyone authenticated)
router.get('/data', auth, async (req, res) => { ... });

// Editor+ access (can modify data)
router.post('/data', auth, requireEditor, async (req, res) => { ... });

// Admin only (user management, deletions)
router.delete('/data', auth, requireAdmin, async (req, res) => { ... });
```

### Data Visibility by Role

| Data Type | Viewer | Editor | Admin |
|-----------|--------|--------|-------|
| Player names in feedback | Anonymous | Visible | Visible |
| Player phone numbers | Hidden | Hidden | Visible |
| User passwords | Never | Never | Never |
| JWT secrets/API keys | Never | Never | Never |

## Input Validation

### Required Checks
```javascript
// Always validate ObjectId before MongoDB queries
const mongoose = require('mongoose');
if (!mongoose.Types.ObjectId.isValid(id)) {
  return res.status(400).json({ error: 'Invalid ID format' });
}

// Sanitize user input
const sanitizedName = playerName.trim().substring(0, 100);
```

### API Endpoint Checklist
Before creating ANY endpoint:
- [ ] Authentication: Does this need `auth` middleware?
- [ ] Authorization: Does this need `requireEditor` or `requireAdmin`?
- [ ] Input Validation: Validate all inputs
- [ ] Data Redaction: What should viewers NOT see?
- [ ] Pagination: Is response limited?

## Environment Variables

### NEVER Commit
- `.env` files
- API keys
- JWT secrets
- Database credentials
- OAuth client secrets

### Always Use
```javascript
// ✅ GOOD
const apiUrl = process.env.REACT_APP_API_URL;

// ❌ BAD
const apiUrl = "https://api.example.com";
```

## WhatsApp Webhook Security
- Verify webhook signatures
- Validate context IDs before updating availability
- Log all incoming messages for audit
