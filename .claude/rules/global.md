# Global Rules

These rules ALWAYS apply when working on this codebase.

## Critical Constraints

### 1. Role-Based Access Control
**Before implementing ANY feature, determine:**
- Which roles can access this? (viewer/editor/admin)
- What data should be visible/hidden for each role?
- Should certain fields be redacted?

### 2. Use Unified Services
**NEVER duplicate logic** - always check for existing services:

| Domain | Service Location |
|--------|------------------|
| Feedback | `backend/services/feedbackService.js` |
| Player | `backend/services/playerService.js` |
| Payment | `backend/services/paymentCalculationService.js` |
| AI | `backend/services/aiService.js` |

### 3. Mobile-First Design
- Design for mobile FIRST, then enhance for desktop
- Test on both mobile and desktop views
- Use responsive Tailwind classes: `sm:`, `md:`, `lg:`

### 4. Security First
- NEVER hardcode secrets or API keys
- ALWAYS validate user input
- ALWAYS use authentication middleware on protected routes
- NEVER expose sensitive data (phone numbers to non-admins)

### 5. Documentation Required
- Update relevant documentation when adding features
- Add JSDoc/docstrings to new functions
- Update API_REFERENCE.md for new endpoints

## File Organization

### Frontend Files
- Components: `frontend/src/components/`
- Mobile components: `frontend/src/components/mobile/`
- Pages: `frontend/src/pages/`
- API Services: `frontend/src/services/`
- Types: `frontend/src/types/`

### Backend Files
- Routes: `backend/routes/`
- Models: `backend/models/`
- Services: `backend/services/`
- Middleware: `backend/middleware/`

### Documentation
- All `.md` files (except README.md) go in `docs/` subfolders
- Never create `.md` files in project root

## Naming Conventions

### Files
- React components: `PascalCase.tsx`
- Backend files: `camelCase.js`
- Python files: `snake_case.py`
- Documentation: `kebab-case.md`

### Code
- JavaScript variables/functions: `camelCase`
- Python variables/functions: `snake_case`
- React components: `PascalCase`
- Constants: `UPPER_SNAKE_CASE`
