---
trigger: always_on
---

# Cricket Feedback System - Windsurf AI Guidelines

## 🏏 Project Overview
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
├── backend/                 # Node.js Express backend
│   ├── routes/             # API route handlers
│   ├── models/             # Database models
│   ├── middleware/         # Express middleware
│   └── services/           # Business logic services
├── infra/                  # Infrastructure as Code
│   ├── helm/              # Kubernetes Helm charts
│   └── docker/            # Docker configurations
└── scripts/               # Utility scripts
```

## 🎯 Core Features
1. **Match Management** - Create, edit, and manage cricket matches
2. **Squad Availability** - Track player responses (Yes/No/Tentative/Pending)
3. **WhatsApp Integration** - Send availability requests via WhatsApp
4. **Feedback System** - Collect player performance feedback
5. **Admin Dashboard** - System administration and analytics

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

### Infrastructure
- **Docker** containerization
- **Kubernetes** orchestration
- **Helm** package management
- **OCI Container Registry**

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
```

## 🧪 Testing Guidelines

### Frontend Testing
- Test responsive design at all breakpoints
- Verify mobile interactions work properly
- Test error states and loading conditions
- Validate form inputs and submissions

### Backend Testing
- Test all API endpoints
- Verify error handling
- Test database operations
- Validate authentication and authorization

## 📚 Key Files to Understand

### Essential Files
- `frontend/src/components/MatchDetailModal.tsx` - Main match details UI
- `frontend/src/components/MatchCard.tsx` - Match card component
- `frontend/src/components/WhatsAppMessagingTab.tsx` - WhatsApp integration
- `backend/routes/whatsapp.js` - WhatsApp webhook handling
- `backend/models/Match.js` - Match data model
- `infra/helm/cricket-feedback/values.yaml` - Kubernetes configuration

### Configuration Files
- `.env` - Environment variables (don't commit)
- `package.json` - Dependencies and scripts
- `Dockerfile` - Container configuration
- `nginx.conf` - Web server configuration

## 📁 File Organization Guidelines

### 🎯 File Placement Rules

#### **Frontend Files**
- **Components**: `frontend/src/components/`
- **Pages**: `frontend/src/pages/`
- **API Services**: `frontend/src/api/`
- **Types/Interfaces**: `frontend/src/types/`
- **Utils**: `frontend/src/utils/`
- **Hooks**: `frontend/src/hooks/`
- **Styles**: `frontend/src/styles/` (if any CSS files)

#### **Backend Files**
- **Routes**: `backend/routes/`
- **Models**: `backend/models/`
- **Middleware**: `backend/middleware/`
- **Services**: `backend/services/`
- **Utils**: `backend/utils/`
- **Config**: `backend/config/`

#### **Infrastructure Files**
- **Helm Charts**: `infra/helm/cricket-feedback/`
- **Docker**: `infra/docker/`
- **Scripts**: `scripts/`

#### **Utility Files**
- **Database Utilities**: `utils/database/`
- **Authentication Utilities**: `utils/auth/`
- **Deployment Utilities**: `utils/deployment/`
- **Migration Utilities**: `utils/migration/`
- **Setup Scripts**: Project root (essential scripts like `setup.sh`, `deploy-docker-desktop.sh`)

#### **Documentation Files**
- **Main README**: Project root (`README.md`)
- **Technical Docs**: `docs/technical/`
- **API Docs**: `docs/api/`
- **Deployment Docs**: `docs/deployment/`
- **User Guides**: `docs/user-guides/`
- **Setup Guides**: `docs/setup/`

### 📝 Markdown File Organization

#### **Rule: All .md files (except README.md) must go in categorized folders**

```
docs/
├── technical/
│   ├── architecture.md
│   ├── database-schema.md
│   ├── api-design.md
│   └── coding-standards.md
├── deployment/
│   ├── docker-setup.md
│   ├── kubernetes-deployment.md
│   ├── helm-configuration.md
│   └── ci-cd-pipeline.md
├── setup/
│   ├── local-development.md
│   ├── environment-variables.md
│   ├── google-oauth-setup.md
│   └── whatsapp-integration.md
├── user-guides/
│   ├── match-management.md
│   ├── feedback-system.md
│   ├── whatsapp-features.md
│   └── mobile-usage.md
├── api/
│   ├── endpoints.md
│   ├── authentication.md
│   ├── webhooks.md
│   └── error-codes.md
└── troubleshooting/
    ├── common-issues.md
    ├── debugging-tips.md
    └── performance-optimization.md
```

#### **File Naming Conventions**
- Use kebab-case for all file names: `file-name.md`
- Use descriptive names that indicate content
- Avoid spaces and special characters
- Keep names concise but meaningful

### 🚫 Common File Organization Mistakes

#### **❌ Don't Do This**
```bash
# Random file placement
/frontend/src/components/MatchCard.tsx
/backend/routes/match.js
/docs/random-notes.md
/GOOGLE_OAUTH_SETUP.md  # Should be in docs/setup/
```

#### **✅ Do This Instead**
```bash
# Proper file placement
/frontend/src/components/MatchCard.tsx
/backend/routes/match.js
/docs/setup/google-oauth-setup.md
```

### 📋 File Creation Checklist

#### **Before Creating Any File**
1. **Identify Category**: Is this frontend, backend, infrastructure, or documentation?
2. **Find Proper Folder**: Locate the correct subdirectory within the category
3. **Check Existing Files**: Ensure no similar file already exists
4. **Follow Naming**: Use appropriate naming convention
5. **Update Index**: If needed, update relevant index files or documentation

#### **For .md Files Specifically**
1. **Never** create .md files in project root (except README.md)
2. **Always** place in appropriate `docs/` subfolder
3. **Choose** the most specific category available
4. **Consider** if it should be split into multiple files
5. **Link** from related documentation if needed

### 🔄 File Organization Examples

#### **Example 1: Adding a New Component**
```bash
# ❌ Wrong
/frontend/MatchCard.tsx
/frontend/components/MatchCard.tsx
/docs/match-card-usage.md

# ✅ Correct
/frontend/src/components/MatchCard.tsx
/docs/user-guides/match-management.md  # If user-facing
/docs/technical/components.md          # If technical
```

#### **Example 2: Adding API Documentation**
```bash
# ❌ Wrong
/api-endpoints.md
/backend/api-docs.md
/docs/new-api.md

# ✅ Correct
/docs/api/endpoints.md
/docs/api/authentication.md
```

#### **Example 3: Adding Setup Instructions**
```bash
# ❌ Wrong
/SETUP.md
/GOOGLE_OAUTH_SETUP.md
/frontend/setup.md

# ✅ Correct
/docs/setup/local-development.md
/docs/setup/google-oauth-setup.md
/docs/setup/environment-variables.md
```

### 📂 Folder Structure Enforcement

#### **Frontend Structure**
```
frontend/src/
├── components/          # Reusable UI components
├── pages/              # Page-level components
├── api/                # API service layer
├── types/              # TypeScript interfaces
├── utils/              # Utility functions
├── hooks/              # Custom React hooks
├── styles/             # CSS/SCSS files (if any)
└── App.tsx             # Main app component
```

#### **Backend Structure**
```
backend/
├── routes/             # API route handlers
├── models/             # Database models
├── middleware/         # Express middleware
├── services/           # Business logic services
├── utils/              # Utility functions
├── config/             # Configuration files
└── server.js           # Server entry point
```

#### **Documentation Structure**
```
docs/
├── technical/          # Technical documentation
├── deployment/         # Deployment guides
├── setup/             # Setup instructions
├── user-guides/       # User documentation
├── api/               # API documentation
└── troubleshooting/   # Troubleshooting guides
```

#### **Utility Structure**
```
utils/
├── auth/              # Authentication utilities
├── database/          # Database utilities and scripts
├── deployment/        # Deployment utilities
└── migration/         # Migration scripts
```

## 🎯 Development Workflow

### When Adding New Features
1. **File Organization**: Create files in proper folders according to guidelines
2. **Mobile First**: Design for mobile, then enhance for desktop
3. **Component Structure**: Create reusable components with proper TypeScript interfaces
4. **API Integration**: Add service layer functions for API calls
5. **State Management**: Use appropriate React hooks
6. **Error Handling**: Implement proper error states and loading indicators
7. **Responsive Testing**: Test at all breakpoints
8. **Security**: Validate inputs and use environment variables
9. **Documentation**: Add .md files to appropriate `docs/` subfolder

### When Fixing Bugs
1. **Root Cause**: Identify the actual issue, don't just patch symptoms
2. **Minimal Changes**: Make the smallest possible fix
3. **Testing**: Verify the fix works and doesn't break other features
4. **Documentation**: Update relevant documentation if needed

## 📞 Important Integrations

### WhatsApp Integration
- Uses Meta Cloud WhatsApp API
- Webhook endpoint: `/webhooks/whatsapp`
- Message templates for availability requests
- Response parsing for player confirmations

### Google OAuth
- Google Sign-In for authentication
- Client ID stored in environment variables
- Proper token handling and validation

### MongoDB Integration
- Mongoose ODM for database operations
- Proper schema definitions
- Connection pooling and error handling

## 🎨 UI Component Library

### Common Patterns
```typescript
// Card component
<div className="bg-slate-800/50 backdrop-blur-xl rounded-lg border border-white/10 p-4">
  {/* Content */}
</div>

// Button component
<button className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium rounded-lg transition-all duration-200">
  {/* Button text */}
</button>

// Input component
<input className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 transition-all focus:border-emerald-500 focus:ring-emerald-500/20 focus:outline-none focus:ring-2" />
```

### Status Indicators
- **Success**: `text-emerald-400 bg-emerald-500/20 border-emerald-500/30`
- **Warning**: `text-amber-400 bg-amber-500/20 border-amber-500/30`
- **Error**: `text-rose-400 bg-rose-500/20 border-rose-500/30`
- **Info**: `text-blue-400 bg-blue-500/20 border-blue-500/30`

## 🔄 State Management Patterns

### Common State Patterns
```typescript
// Loading state
const [loading, setLoading] = useState(false);

// Data state
const [data, setData] = useState<Type[]>([]);

// Error state
const [error, setError] = useState<string | null>(null);

// Modal state
const [showModal, setShowModal] = useState(false);

// Form state
const [formData, setFormData] = useState<FormData>({
  field1: '',
  field2: ''
});
```

### Async Operations
```typescript
const fetchData = async () => {
  try {
    setLoading(true);
    setError(null);
    const result = await apiCall();
    setData(result);
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
```

## 🚀 Build and Deployment Pipeline

### 📋 Deployment Checklist
When user says "deploy the changes", follow these steps in sequence:

1. **Local Testing First**
   ```bash
   # Check and kill processes on ports before starting
   
   # Frontend (port 3000)
   lsof -ti:3000 | xargs kill -9 2>/dev/null || true
   cd frontend && npm start
   
   # Backend (port 5000)
   lsof -ti:5000 | xargs kill -9 2>/dev/null || true
   cd backend && npm start
   ```

2. **Update Image Versions**
   - Update `frontend.image.tag` in `infra/helm/cricket-feedback/values.yaml`
   - Update `frontend.image.tag` in `infra/helm/cricket-feedback/values-development.yaml`
   - Update `backend.image.tag` in both files if backend changes exist

3. **Build Frontend Docker Image**
   ```bash
   cd /Users/abhinav/Documents/FUN_PROJECTS/survey-project
   docker buildx build --platform linux/amd64 \
     --build-arg REACT_APP_API_URL=https://mavericks11.duckdns.org/api \
     --build-arg REACT_APP_GOOGLE_CLIENT_ID=xxxxxxx.apps.googleusercontent.com \
     -t phx.ocir.io/axkw6whnjncs/cricket-feedback-frontend:vXX \
     --push frontend
   ```

4. **Build Backend Docker Image**
   ```bash
   cd /Users/abhinav/Documents/FUN_PROJECTS/survey-project
   docker buildx build --platform linux/amd64 \
     --push -t phx.ocir.io/axkw6whnjncs/cricket-feedback-backend:vXX \
     -f backend/Dockerfile ./backend
   ```

5. **Deploy with Helm**
   ```bash
   cd /Users/abhinav/Documents/FUN_PROJECTS/survey-project
   helm upgrade cricket-feedback ./infra/helm/cricket-feedback \
     --namespace cricket-feedback \
     --values ./infra/helm/cricket-feedback/values.yaml \
     --values ./infra/helm/cricket-feedback/values-development.yaml
   ```

6. **Git Commit After Testing**
   - Create commit message based on changes made
   - Inform developer to commit with the generated message

### 🏷️ Version Management
- **Frontend**: Increment version number (e.g., v66 → v67)
- **Backend**: Increment version number (e.g., v29 → v30)
- **Always** update both `values.yaml` and `values-development.yaml`
- **Never** skip version updates when building new images

### 🔧 Build Requirements

#### Frontend Build Args (Required)
- `REACT_APP_API_URL`: API endpoint URL
- `REACT_APP_GOOGLE_CLIENT_ID`: Google OAuth client ID

#### Build Commands
```bash
# Frontend (with build args)
docker buildx build --platform linux/amd64 \
  --build-arg REACT_APP_API_URL=https://mavericks11.duckdns.org/api \
  --build-arg REACT_APP_GOOGLE_CLIENT_ID=xxxxxxx.apps.googleusercontent.com \
  -t phx.ocir.io/axkw6whnjncs/cricket-feedback-frontend:vXX \
  --push frontend

# Backend (simple build)
docker buildx build --platform linux/amd64 \
  --push -t phx.ocir.io/axkw6whnjncs/cricket-feedback-backend:vXX \
  -f backend/Dockerfile ./backend
```

### 🚢 Deployment Rules

#### Use Helm Always
- **ALWAYS** use Helm for service deployment
- **NEVER** use `kubectl apply` directly unless absolutely necessary
- **ALWAYS** include both values files in helm commands

#### Deployment Command Template
```bash
helm upgrade cricket-feedback ./infra/helm/cricket-feedback \
  --namespace cricket-feedback \
  --values ./infra/helm/cricket-feedback/values.yaml \
  --values ./infra/helm/cricket-feedback/values-development.yaml
```

#### Environment Configuration
- **Development**: Uses `values-development.yaml`
- **Production**: Uses `values.yaml`
- **Both files** should be updated with new image tags

### 🔌 Port Management

#### Port Configuration
- **Frontend**: Port 3000 (React development server)
- **Backend**: Port 5000 (Express API server)

#### Port Management Commands
```bash
# Check if port is in use
lsof -i :3000  # Frontend
lsof -i :5000  # Backend

# Kill process on specific port
lsof -ti:3000 | xargs kill -9  # Frontend
lsof -ti:5000 | xargs kill -9  # Backend

# Safe port cleanup (no error if port not in use)
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:5000 | xargs kill -9 2>/dev/null || true
```

#### Local Development Startup Sequence
```bash
# 1. Clean up existing processes
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:5000 | xargs kill -9 2>/dev/null || true

# 2. Start backend (in terminal 1)
cd backend && npm start

# 3. Start frontend (in terminal 2)
cd frontend && npm start
```

### 🧪 Testing Workflow

#### Before Deployment
1. **Port Management**: Check and kill existing processes on ports 3000 and 5000
2. **Local Testing**: Run `npm start` for both frontend and backend
3. **Functionality Testing**: Verify all features work locally
4. **Mobile Testing**: Test responsive design on mobile devices
5. **API Testing**: Verify all API endpoints work correctly

#### After Deployment
1. **Health Check**: Verify pods are running and healthy
2. **Functionality Testing**: Test features in deployed environment
3. **Mobile Testing**: Verify mobile responsiveness works
4. **Integration Testing**: Test WhatsApp and other integrations

### 📝 Commit Message Guidelines

#### Commit Message Format
```
feat: add mobile-optimized match detail modal

- Consolidated 5 stat boxes into single compact card for mobile
- Added text labels to response progress bars
- Optimized footer with minimal design for mobile
- Updated frontend to v67
```

#### Commit Message Types
- `feat:` New features
- `fix:` Bug fixes
- `optimize:` Performance or UI optimizations
- `refactor:` Code refactoring
- `docs:` Documentation updates

### ⚠️ Common Deployment Mistakes to Avoid

#### ❌ Don't Do This
- Skip local testing and deploy directly
- Forget to update image tags in YAML files
- Use `kubectl apply` instead of Helm
- Build without required build args for frontend
- Forget to increment version numbers

#### ✅ Do This Instead
- Always test locally first
- Update both values files with new tags
- Use Helm for all deployments
- Include all required build arguments
- Use proper version management

### 🔄 Deployment Sequence Example

#### When User Says "Deploy the Changes"
1. **File Organization**: Ensure all files are in proper folders according to guidelines
2. **Port Cleanup**: Kill existing processes on ports 3000 and 5000
3. **Test Locally**: `npm start` for both services
4. **Update Versions**: Edit `values.yaml` and `values-development.yaml`
5. **Build Frontend**: Docker build with build args
6. **Build Backend**: Docker build (if needed)
7. **Deploy**: Helm upgrade command
8. **Verify**: Test deployed application
9. **Commit**: Generate commit message and inform developer

### 📊 Image Registry Information

#### OCI Container Registry
- **Registry**: `phx.ocir.io/axkw6whnjncs`
- **Frontend Repo**: `cricket-feedback-frontend`
- **Backend Repo**: `cricket-feedback-backend`
- **Platform**: `linux/amd64` (required for Kubernetes)

#### Image Tagging Convention
- **Frontend**: `vXX` (e.g., v67, v68)
- **Backend**: `vXX` (e.g., v30, v31)
- **Always** use semantic versioning
- **Never** use `latest` tag

This guide should help Windsurf AI understand the project patterns, make consistent contributions, and avoid common mistakes when working on this cricket feedback system.
