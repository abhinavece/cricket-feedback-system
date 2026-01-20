# Windsurf AI Guidelines

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

## 🎨 UI/UX Guidelines

### Mobile-First Design
- **ALWAYS** design for mobile first, then enhance for desktop
- Use responsive Tailwind classes: `sm:`, `md:`, `lg:`
- Compact layouts for mobile: single cards instead of multiple boxes
- Progress bars with labels for stats visualization
- First try with icon-only buttons for mobile if that works, with text on desktop

### Design Patterns
- **Color Scheme**: Slate/dark theme with emerald accents
- **Components**: Use backdrop-blur, glass-morphism effects
- **Cards**: `bg-slate-800/50 backdrop-blur-xl border border-white/10`
- **Buttons**: Gradient primary buttons `from-emerald-500 to-teal-600`
- **Icons**: Lucide React icons consistently

### Responsive Breakpoints
- Mobile: Default (< 640px)
- Tablet: `sm:` (640px+)
- Desktop: `md:` (768px+)
- Large: `lg:` (1024px+)

## 🔧 Technical Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **React Router** for navigation
- **Axios** for API calls
- **React DatePicker** for date inputs

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

## 📋 Coding Standards

### Frontend Code Style
```typescript
// Component structure
interface ComponentProps {
  prop1: string;
  prop2?: number;
}

const Component: React.FC<ComponentProps> = ({ prop1, prop2 }) => {
  // State hooks first
  const [state, setState] = useState<Type>();
  
  // Effect hooks
  useEffect(() => {
    // Side effects
  }, []);
  
  // Event handlers
  const handleClick = () => {
    // Handler logic
  };
  
  // Render
  return (
    <div className="responsive-classes">
      {/* JSX content */}
    </div>
  );
};
```

### Backend Code Style
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

## 🚫 What NOT to Do

### Common Mistakes to Avoid
1. **NEVER** hardcode API URLs - use environment variables
2. **NEVER** commit secrets or API keys
3. **NEVER** use inline styles - use Tailwind classes
4. **NEVER** forget responsive design - always test mobile
5. **NEVER** use large images without optimization
6. **NEVER** skip error handling in API calls
7. **NEVER** forget loading states for async operations

### Anti-Patterns
```typescript
// ❌ BAD - Hardcoded values
const api = "https://api.example.com";

// ❌ BAD - Inline styles
<div style={{ color: 'red' }}>

// ❌ BAD - No responsive design
<div className="w-full h-96">

// ✅ GOOD - Environment variables
const api = process.env.REACT_APP_API_URL;

// ✅ GOOD - Tailwind classes
<div className="text-red-500">

// ✅ GOOD - Responsive design
<div className="w-full h-64 sm:h-96">
```

## 🏗️ Component Patterns

### Reusable Components
- **FeedbackCard** - Display individual feedback entries
- **MatchCard** - Display match information with stats
- **MatchDetailModal** - Full match details with availability
- **WhatsAppMessagingTab** - WhatsApp integration interface

### State Management
- Use local state with `useState` for component state
- Use `useEffect` for side effects and data fetching
- Keep API calls in service files (`api/` directory)
- Use proper TypeScript interfaces for props

### Data Flow
```typescript
// 1. Define interfaces
interface Match {
  _id: string;
  opponent: string;
  date: string;
  // ... other fields
}

// 2. API service
export const getMatches = async (): Promise<Match[]> => {
  const response = await api.get('/matches');
  return response.data;
};

// 3. Component usage
const [matches, setMatches] = useState<Match[]>([]);

useEffect(() => {
  getMatches().then(setMatches);
}, []);
```

## 📱 Mobile Optimization Rules

### Space Efficiency
- **ALWAYS** consolidate multiple stat boxes into single compact cards
- Use progress bars instead of separate stat tiles
- Implement filter buttons with popup menus instead of dropdowns
- Use icon-only buttons with tooltips for mobile
- Hide unnecessary text/labels on mobile

### Responsive Implementation
```typescript
// Mobile-first approach
<div className="p-3 sm:p-6">
  <h1 className="text-xl sm:text-3xl">
  <button className="w-full sm:w-auto">
  
  {/* Mobile specific content */}
  <div className="sm:hidden">
    {/* Compact mobile layout */}
  </div>
  
  {/* Desktop specific content */}
  <div className="hidden sm:block">
    {/* Full desktop layout */}
  </div>
</div>
```

## 🔐 Security Guidelines

### Frontend Security
- Store sensitive data in environment variables
- Use HTTPS for all API calls
- Implement proper authentication with JWT tokens
- Sanitize user inputs before displaying

### Backend Security
- Validate all incoming data
- Use parameterized queries for database operations
- Implement rate limiting for API endpoints
- Secure WhatsApp webhook endpoints

## 🚀 Deployment Guidelines

### Docker Configuration
- Use multi-stage builds for optimization
- Minimize image sizes with alpine variants
- Proper health checks for containers

### Kubernetes/Helm
- Use proper resource limits and requests
- Implement readiness and liveness probes
- Use secrets for sensitive configuration
- Proper ingress configuration for routing

### Environment Variables
```bash
# Frontend
REACT_APP_API_URL=https://api.example.com
REACT_APP_GOOGLE_CLIENT_ID=your-client-id

# Backend
MONGODB_URI=mongodb://localhost:27017/cricket
JWT_SECRET=your-secret-key
TWILIO_ACCOUNT_SID=your-sid

# AI Service
GOOGLE_AI_STUDIO_API_KEY=your-api-key
AI_SERVICE_ENABLED=true
```

## 📚 Documentation Requirements

### 📖 **CRITICAL**: Documentation Updates Required

**Whenever you add a new feature or modify existing functionality, you MUST update:**

1. **README.md** - Add feature description, usage examples, and API changes
2. **windsurf-rule.md** - Update UI component patterns and mobile guidelines
3. **mavericks-rule.md** - Update backend patterns and system architecture

### Documentation Checklist
- [ ] Feature description added to README.md
- [ ] Usage examples provided
- [ ] API endpoints documented
- [ ] UI components updated in windsurf-rule.md
- [ ] Backend patterns updated in mavericks-rule.md
- [ ] Environment variables documented
- [ ] Deployment instructions updated

### Git Hooks Enforcement
- **Pre-commit hook** will check if documentation is updated when source code changes
- **Post-commit hook** will remind about documentation updates
- Use `git commit --no-verify` to bypass (not recommended)

## 📋 Key Files to Understand

### Essential Files
- `frontend/src/components/MatchDetailModal.tsx` - Main match details UI
- `frontend/src/components/MatchCard.tsx` - Match card component
- `ai-service/providers/google_ai_studio.py` - AI provider implementation
- `backend/routes/whatsapp.js` - WhatsApp webhook handling
- `ai-service/models/Match.js` - Match data model
- `ai-service/Dockerfile` - Container configuration

### Configuration Files
- `.env` - Environment variables (don't commit)
- `package.json` - Dependencies and scripts
- `docker-compose.yml` - Development environment
- `requirements.txt` - Python dependencies

---

**Last Updated**: January 2026  
**Version**: 1.0.0  
**Documentation**: MANDATORY for all feature changes
