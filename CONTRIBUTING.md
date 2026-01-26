# Contributing Guide

Thank you for your interest in contributing to the Cricket Match Feedback & Team Management System! This guide will help you get started with development and ensure your contributions align with the project's standards.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Development Setup](#development-setup)
3. [Code Style Guidelines](#code-style-guidelines)
4. [Architecture Guidelines](#architecture-guidelines)
5. [Testing Guidelines](#testing-guidelines)
6. [Commit Guidelines](#commit-guidelines)
7. [Pull Request Process](#pull-request-process)
8. [AI Agent Guidelines](#ai-agent-guidelines)

## Getting Started

### Prerequisites

- **Node.js**: v16 or higher
- **Python**: 3.8+ (for AI service)
- **MongoDB**: 4.4+ (local or MongoDB Atlas)
- **Docker**: (optional, for containerized development)
- **Git**: Latest version

### Development Tools

- **VS Code** (recommended) with extensions:
  - ESLint
  - Prettier
  - Python
  - TypeScript

## Development Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd survey-project
```

### 2. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install

# AI Service (if working on AI features)
cd ../ai-service
pip install -r requirements.txt
```

### 3. Environment Setup

Copy and configure environment variables:

```bash
# Backend
cd backend
cp .env.example .env
# Edit .env with your MongoDB URI and other config

# Frontend
cd ../frontend
cp .env.example .env
# Edit .env with your API URL

# AI Service
cd ../ai-service
cp .env.example .env
# Edit .env with your AI provider credentials
```

### 4. Start Development Servers

```bash
# From root directory
npm run dev
```

This starts:
- Backend: http://localhost:5000
- Frontend: http://localhost:3000

## Code Style Guidelines

### JavaScript/TypeScript

#### Naming Conventions
- **Variables/Functions**: `camelCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Classes/Components**: `PascalCase`
- **Files**: `camelCase.js` or `PascalCase.tsx` for components

#### Code Formatting
- Use 2 spaces for indentation
- Use single quotes for strings (JavaScript)
- Use double quotes for strings (TypeScript/JSX)
- Trailing commas in multi-line objects/arrays
- Semicolons required

#### Example

```javascript
/**
 * Get feedback for a specific match
 * @param {string} matchId - The match ID
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Feedback data
 */
const getMatchFeedback = async (matchId, options = {}) => {
  const { page = 1, limit = 20 } = options;
  // Implementation
};
```

### Python

#### Naming Conventions
- **Variables/Functions**: `snake_case`
- **Constants**: `UPPER_SNAKE_CASE`
- **Classes**: `PascalCase`

#### Type Hints
Always include type hints for function parameters and return types:

```python
from typing import Optional, Tuple

def validate_image(
    image_base64: str,
    max_size_mb: float = 10.0
) -> Tuple[bool, Optional[str]]:
    """
    Validate image for processing.
    
    Args:
        image_base64: Base64 encoded image data
        max_size_mb: Maximum file size in MB
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    # Implementation
    return True, None
```

### Documentation

#### JSDoc (JavaScript)
```javascript
/**
 * Create a new player
 * @param {Object} playerData - Player information
 * @param {string} playerData.name - Player name
 * @param {string} playerData.phone - Player phone number
 * @param {string} [playerData.role] - Player role (optional)
 * @returns {Promise<Object>} Created player object
 * @throws {Error} If validation fails
 */
```

#### Docstrings (Python)
```python
def parse_payment_screenshot(
    image_base64: str,
    match_date: Optional[str] = None
) -> ParsePaymentResponse:
    """
    Parse a payment screenshot and return structured data.
    
    Args:
        image_base64: Base64 encoded image
        match_date: Optional match date for validation
        
    Returns:
        ParsePaymentResponse with extracted data or error
        
    Raises:
        ValueError: If image is invalid
    """
```

## Architecture Guidelines

### Backend Architecture

#### Service Layer Pattern
**Always use services for business logic** - never duplicate logic in routes.

```javascript
// ✅ CORRECT: Use service
const feedbackService = require('../services/feedbackService');
const redactedFeedback = feedbackService.redactFeedbackList(feedback, userRole);

// ❌ WRONG: Duplicate logic in route
const redactFeedback = (list, role) => { ... }; // Don't do this!
```

#### Route Structure
- Routes should be thin controllers
- Delegate business logic to services
- Handle errors consistently
- Use middleware for cross-cutting concerns

```javascript
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await someService.getById(id);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

### Frontend Architecture

#### Component Structure
- **Page Components**: Route-level components in `pages/`
- **Reusable Components**: Shared components in `components/`
- **Mobile Components**: Mobile-specific in `components/mobile/`

#### State Management
- Use React Context for global state (AuthContext)
- Use `useState` for component-local state
- Use `useEffect` for side effects and data fetching

#### API Integration
- Always use the centralized API client (`services/api.ts`)
- Never make direct fetch calls
- Handle errors consistently

```typescript
// ✅ CORRECT: Use API service
import { getPlayers } from '../services/api';
const players = await getPlayers();

// ❌ WRONG: Direct fetch
const response = await fetch('/api/players');
```

### Database Patterns

#### Indexing
Always add indexes for frequently queried fields:

```javascript
feedbackSchema.index({ matchId: 1, isDeleted: 1 });
feedbackSchema.index({ playerId: 1, isDeleted: 1 });
```

#### Query Optimization
- Use `.lean()` for read-only queries (50% faster)
- Use `.select()` to limit returned fields
- Always paginate list endpoints

```javascript
// ✅ CORRECT: Optimized query
const feedback = await Feedback.find(query)
  .select('_id playerName matchDate ratings')
  .sort({ createdAt: -1 })
  .limit(limit)
  .skip((page - 1) * limit)
  .lean();
```

## Testing Guidelines

### Backend Tests

Tests are located in `backend/tests/`. Use Jest for testing.

```javascript
describe('Feedback API', () => {
  it('should create feedback with valid data', async () => {
    const response = await request(app)
      .post('/api/feedback')
      .send(validFeedbackData)
      .expect(201);
    
    expect(response.body).toHaveProperty('_id');
  });
});
```

### Running Tests

```bash
# All tests
cd backend && npm test

# Specific test file
npm run test:feedback

# With coverage
npm run test:coverage
```

### Frontend Tests

Use React Testing Library for component tests.

```typescript
import { render, screen } from '@testing-library/react';
import FeedbackForm from './FeedbackForm';

test('renders feedback form', () => {
  render(<FeedbackForm />);
  expect(screen.getByLabelText(/player name/i)).toBeInTheDocument();
});
```

## Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/).

### Commit Format

```
<type>: <short summary>

<optional body with more details>

Co-Authored-By: Your Name <your.email@example.com>
```

### Commit Types

- `feat:` New feature
- `fix:` Bug fix
- `refactor:` Code restructuring
- `style:` UI/CSS changes, formatting
- `docs:` Documentation updates
- `chore:` Build, config, dependency updates
- `perf:` Performance improvements
- `test:` Test additions/updates

### Examples

```
feat: add player profile page with public info display

- Created PlayerProfilePage at /player/:playerId route
- Added backend endpoint GET /api/players/:id/profile
- Shows name, team, role, age, cricket skills, CricHeroes link
- Email displayed for linked user accounts
```

```
fix: resolve WhatsApp webhook context validation issue

Context ID validation was too strict. Now accepts any valid
availability_request or availability_reminder context.
```

## Pull Request Process

### Before Submitting

1. **Update Documentation**: Update relevant docs if needed
2. **Add Tests**: Include tests for new features
3. **Check Linting**: Run `npm run lint` (if available)
4. **Test Locally**: Verify changes work as expected

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tests added/updated
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Documentation updated
- [ ] Tests pass
- [ ] No breaking changes (or documented)
```

### Review Process

1. PR is reviewed by maintainers
2. Address review comments
3. Once approved, PR is merged
4. Delete feature branch after merge

## AI Agent Guidelines

If you're an AI agent working on this codebase, follow these guidelines:

### Code Understanding

1. **Read Documentation First**: Check `ARCHITECTURE.md`, `API_REFERENCE.md`, and `CLAUDE.md`
2. **Understand Patterns**: Study existing code patterns before making changes
3. **Use Services**: Always check for existing services before creating new logic
4. **Follow Conventions**: Adhere to naming and structure conventions

### Making Changes

1. **Ask About Access Control**: Before implementing features, ask about role-based access
2. **Check Dependencies**: Verify if functionality exists in services
3. **Test Both Platforms**: For UI changes, test mobile and desktop
4. **Document Changes**: Update relevant documentation

### Common Patterns

#### Adding a New Endpoint

1. Add route in `backend/routes/[domain].js`
2. Add service method in `backend/services/[domain]Service.js` (if needed)
3. Add API method in `frontend/src/services/api.ts`
4. Add TypeScript types in `frontend/src/types/index.ts`
5. Update `docs/API_REFERENCE.md`

#### Adding a New Component

1. Create component in appropriate directory
2. Add TypeScript types
3. Use existing API services
4. Follow mobile-first design principles
5. Test on both mobile and desktop

### Questions to Ask

Before implementing features, ask:
- Which roles can access this? (viewer/editor/admin)
- What data should be visible/hidden for each role?
- Should this be mobile-specific or work on both platforms?
- Does similar functionality already exist?
- What are the performance implications?

## Additional Resources

- **Architecture**: See `ARCHITECTURE.md`
- **API Reference**: See `docs/API_REFERENCE.md`
- **Development Guide**: See `CLAUDE.md`
- **Feature Documentation**: See `docs/FEATURES.md`

## Getting Help

- Open an issue for bugs or feature requests
- Check existing documentation first
- Review similar code in the codebase
- Ask questions in PR comments

Thank you for contributing! 🎉
