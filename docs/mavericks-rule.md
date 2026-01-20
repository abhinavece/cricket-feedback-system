# Cricket Feedback System - Backend & System Guidelines

## 🏏️ Project Overview
This is a full-stack cricket team management system with WhatsApp integration, availability tracking, and feedback collection. The system helps cricket teams manage matches, track player availability, send WhatsApp notifications, and collect match related feedback.

## 📁 Project Structure
```
survey-project/
├── frontend/                 # React TypeScript frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── api/            # API service layer
│   │   └── App.tsx         # Main app component
├── ai-service/              # AI service for payment parsing
│   ├── providers/         # AI provider implementations
│   ├── models/            # Data models
│   ├── services/          # Business logic
│   └── Dockerfile         # Container configuration
├── backend/                 # Node.js Express backend
│   ├── routes/             # API route handlers
│   ├── models/             # Database models
│   ├── middleware/         # Express middleware
│   └── services/           # Business logic services
└── infra/                  # Infrastructure as Code
    ├── helm/              # Kubernetes Helm charts
    └── docker/            # Docker configurations
```

## 🎯 Core Features
1. **Match Management** - Create, edit, and manage cricket matches
2. **Squad Availability** - Track player responses (Yes/No/Tentative/Pending)
3. **WhatsApp Integration** - Send availability requests via WhatsApp
4. **Feedback System** - Collect player performance feedback
5. **Admin Dashboard** - System administration and analytics
6. **AI Payment Parser** - Extract payment info from screenshots

## 🔧 Technical Stack

### Backend
- **Node.js** with Express
- **MongoDB** with Mongoose
- **JWT** for authentication
- **Meta Cloud APIs** for WhatsApp integration
- **OCI** for cloud infrastructure

### AI Service
- **Python** with FastAPI
- **Google AI Studio** with Gemma-3-27B-IT
- **Docker** containerization
- **Pydantic** for data validation

### Infrastructure
- **Docker** containerization
- **Kubernetes** orchestration
- **Helm** package management
- **OCI Container Registry**

## 📋 Backend Coding Standards

### Route Handler Structure
```javascript
// Route handler structure
router.get('/endpoint', async (req, res) => {
  try {
    // Validation
    const { required } = req.body;
    
    // Business logic
    const result = await service.method(required);
    
    // Response
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
```

### Model Structure (Mongoose)
```javascript
const matchSchema = new mongoose.Schema({
  opponent: { type: String, required: true },
  date: { type: Date, required: true },
  venue: { type: String, required: true },
  team: { type: String, required: true },
  availability: [{
    player: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
    response: { type: String, enum: ['Yes', 'No', 'Tentative', 'Pending'] },
    timestamp: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
```

### Service Layer Pattern
```javascript
class MatchService {
  static async createMatch(matchData) {
    try {
      // Validation
      const validatedData = this.validateMatchData(matchData);
      
      // Database operation
      const match = new Match(validatedData);
      await match.save();
      
      // Side effects (notifications, etc.)
      await this.notifyPlayers(match);
      
      return match;
    } catch (error) {
      throw new Error(`Failed to create match: ${error.message}`);
    }
  }
  
  static async validateMatchData(data) {
    // Validation logic
    if (!data.opponent) throw new Error('Opponent is required');
    if (!data.date) throw new Error('Date is required');
    return data;
  }
}
```

## 🤖 AI Service Architecture

### Provider Pattern
```python
class AIProviderBase:
    """Abstract base for AI providers"""
    
    def parse_payment_image(self, image_base64: str, match_date: str) -> dict:
        raise NotImplementedError
    
    def is_free_tier(self) -> bool:
        return True

class GoogleAIStudioProvider(AIProviderBase):
    """Google AI Studio implementation"""
    
    DEFAULT_MODEL = "gemma-3-27b-it"
    
    async def parse_payment_image(self, image_base64: str, match_date: str) -> dict:
        # Implementation
        pass
```

### Response Schema (Pydantic)
```python
class PaymentData(BaseModel):
    amount: float = Field(default=0.0)
    currency: str = Field(default="INR")
    payer_name: str = Field(default="")
    payee_name: str = Field(default="")
    date: str = Field(default="")
    time: str = Field(default="")
    transaction_id: str = Field(default="")
    payment_method: str = Field(default="unknown")

class ResponseMetadata(BaseModel):
    confidence: float = Field(ge=0.0, le=1.0)
    model: str = Field(default="")
    model_cost_tier: str = Field(default="free")
    image_hash: str = Field(default="")
    processing_time_ms: int = Field(default=0)
```

## 🚫 What NOT to Do

### Backend Anti-Patterns
1. **NEVER** trust client input - always validate server-side
2. **NEVER** use synchronous database operations in routes
3. **NEVER** hardcode database connections
4. **NEVER** skip error handling in async operations
5. **NEVER** return raw database objects to clients
6. **NEVER** use eval() or similar with user input
7. **NEVER** commit secrets or API keys

### Common Mistakes
```javascript
// ❌ BAD - No error handling
router.post('/match', async (req, res) => {
  const match = await Match.create(req.body);
  res.json(match);
});

// ❌ BAD - Trusting client input
router.post('/match', async (req, res) => {
  const match = new Match(req.body); // No validation!
  await match.save();
  res.json(match);
});

// ✅ GOOD - Proper validation and error handling
router.post('/match', async (req, res) => {
  try {
    const validatedData = MatchService.validateMatchData(req.body);
    const match = await MatchService.createMatch(validatedData);
    res.json({ success: true, data: match });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});
```

## 🔐 Security Guidelines

### Authentication & Authorization
```javascript
// JWT middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};
```

### Input Validation
```javascript
// Validation middleware
const validateMatchInput = (req, res, next) => {
  const { opponent, date, venue } = req.body;
  
  const errors = [];
  if (!opponent || opponent.trim().length === 0) {
    errors.push('Opponent is required');
  }
  if (!date || isNaN(Date.parse(date))) {
    errors.push('Valid date is required');
  }
  if (!venue || venue.trim().length === 0) {
    errors.push('Venue is required');
  }
  
  if (errors.length > 0) {
    return res.status(400).json({ 
      success: false, 
      errors 
    });
  }
  
  next();
};
```

### Database Security
```javascript
// Use parameterized queries (if using raw SQL)
// For Mongoose, use built-in protection
const safeQuery = Match.find({ 
  team: req.user.teamId, 
  date: { $gte: new Date() } 
});
```

## 📱 WhatsApp Integration

### Webhook Handler
```javascript
router.post('/whatsapp/webhook', async (req, res) => {
  try {
    const { From, Body } = req.body;
    
    // Verify webhook signature
    if (!verifyWhatsAppSignature(req)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }
    
    // Process message
    const response = await WhatsAppService.processMessage(From, Body);
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('WhatsApp webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});
```

### Message Templates
```javascript
class WhatsAppService {
  static async sendAvailabilityRequest(match, players) {
    for (const player of players) {
      const message = `🏏 Match Alert!\n\n` +
        `Opponent: ${match.opponent}\n` +
        `Date: ${match.date.toLocaleDateString()}\n` +
        `Venue: ${match.venue}\n\n` +
        `Please respond with: YES, NO, or MAYBE`;
      
      await this.sendMessage(player.phone, message);
    }
  }
}
```

## 🐳 Docker & Deployment

### Dockerfile Best Practices
```dockerfile
# Multi-stage build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS production
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

### Environment Configuration
```bash
# Production environment variables
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://mongo:27017/cricket
JWT_SECRET=your-super-secret-jwt-key
WHATSUP_API_KEY=your-whatsapp-api-key
OCI_REGION=us-ashburn-1
```

### Kubernetes Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cricket-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: cricket-backend
  template:
    spec:
      containers:
      - name: backend
        image: cricket-backend:latest
        ports:
        - containerPort: 5000
        env:
        - name: NODE_ENV
          value: "production"
        - name: MONGODB_URI
          valueFrom:
            secretKeyRef:
              name: cricket-secrets
              key: mongodb-uri
```

## 📊 Monitoring & Logging

### Structured Logging
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' })
  ]
});

// Usage
logger.info('Match created', { 
  matchId: match._id, 
  createdBy: req.user.id,
  opponent: match.opponent 
});
```

### Health Checks
```javascript
router.get('/health', async (req, res) => {
  try {
    // Check database connection
    await mongoose.connection.db.admin().ping();
    
    // Check external services
    const whatsappStatus = await WhatsAppService.checkHealth();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        whatsapp: whatsappStatus
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});
```

## 📚 Documentation Requirements

### 📖 **CRITICAL**: Documentation Updates Required

**Whenever you add a new feature or modify existing functionality, you MUST update:**

1. **README.md** - Add feature description, API changes, and deployment updates
2. **windsurf-rule.md** - Update UI component patterns and mobile guidelines
3. **mavericks-rule.md** - Update backend patterns, security guidelines, and system architecture

### Documentation Checklist
- [ ] Feature description added to README.md
- [ ] API endpoints documented with examples
- [ ] Database schema changes documented
- [ ] Environment variables documented
- [ ] Security considerations updated
- [ ] Deployment instructions updated
- [ ] Monitoring and logging documented

### Git Hooks Enforcement
- **Pre-commit hook** will check if documentation is updated when source code changes
- **Post-commit hook** will remind about documentation updates
- Use `git commit --no-verify` to bypass (not recommended)

## 📋 Key Files to Understand

### Backend Essential Files
- `backend/routes/match.js` - Match management routes
- `backend/models/Match.js` - Match data model
- `backend/services/WhatsAppService.js` - WhatsApp integration
- `backend/middleware/auth.js` - Authentication middleware
- `backend/config/database.js` - Database configuration

### AI Service Essential Files
- `ai-service/app.py` - FastAPI application entry point
- `ai-service/providers/google_ai_studio.py` - AI provider implementation
- `ai-service/models/schemas.py` - Request/response schemas
- `ai-service/services/payment_parser.py` - Main payment parsing service
- `ai-service/Dockerfile` - Container configuration

### Infrastructure Files
- `infra/helm/cricket-feedback/values.yaml` - Kubernetes configuration
- `infra/docker/docker-compose.yml` - Development environment
- `scripts/deploy.sh` - Deployment automation

---

**Last Updated**: January 2026  
**Version**: 1.0.0  
**Documentation**: MANDATORY for all feature changes
