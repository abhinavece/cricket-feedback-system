# Documentation Skill

## Capability
Automatically generate and update feature documentation after implementation. This ensures all features are properly documented in CLAUDE.md and project documentation files.

## Overview
After pushing any feature, this skill ensures:
1. Feature description is added to relevant sections
2. API endpoints are documented
3. Data models are referenced
4. UI components are listed
5. Usage patterns are explained
6. Related documentation is cross-referenced

## File Locations
- **Main guide**: `CLAUDE.md` - Central project documentation
- **Skill files**: `.claude/skills/*.md` - Skill-specific documentation
- **API documentation**: `docs/api-reference.md` (if exists)
- **Feature guides**: `docs/features/*.md` (if directory exists)

## Documentation Structure in CLAUDE.md

### 1. Key Data Models Section
```markdown
## Key Data Models

### NewModel
- Links to [RelatedModel] via `fieldName`
- Contains: field1, field2, field3
- Profile endpoint returns sanitized data (excludes sensitive fields)
```

### 2. Architecture - Key Directories Section
```markdown
backend/
├── routes/               # API routes (N route files)
│   ├── newfeature.js     # Description of what this route handles
│   └── ...
├── models/               # Mongoose schemas (N models)
│   ├── NewFeature.js     # Description of fields and relationships
│   └── ...
├── services/             # Business logic services
│   ├── newFeatureService.js  # Description of exported functions
│   └── ...

frontend/src/
├── components/           # React components
│   ├── NewFeatureTab.tsx     # Tab description
│   ├── mobile/
│   │   └── MobileNewFeatureTab.tsx  # Mobile variant
│   └── ...
├── pages/                # Route-level pages
│   ├── NewFeaturePage.tsx     # Page description
│   └── ...
├── services/             # API methods in api.ts
└── types/                # Type definitions in index.ts
```

### 3. API Structure Section
```markdown
| Route | Purpose |
|-------|---------|
| `/api/newfeature` | Feature CRUD, operations, stats |
```

### 4. Frontend Routing Section
For public-facing pages:
```markdown
/newfeature            → NewFeaturePage (description of page)
/newfeature/:id        → NewFeatureDetailPage (description)
```

### 5. UI/UX Guidelines Section
For visual/interaction patterns:
```markdown
### New Feature Design
- [Component name]: Describes the component's role and interaction
- Mobile vs Desktop: Specific design differences if any
```

### 6. Recent Features Added Section
Update this to include:
```markdown
### Feature Name System
- **[ComponentName]**: Description of component
- **[Backend]**: Route and service description
- **Features**: Key capabilities bulleted
```

## Step-by-Step Documentation Process

### After Pushing Backend Feature

1. **Update Data Models Section**
   - Add new model with fields and relationships
   - Note any soft-delete patterns, indexes, or constraints
   - Cross-reference related models

2. **Update Backend Architecture**
   - Add route file description (what it handles)
   - Add model schema file description
   - Add service file description (exported functions)
   - Maintain alphabetical order in lists

3. **Update API Structure Table**
   - Add/update route entry with purpose
   - Note what operations are available
   - Include any stats or aggregation endpoints

4. **Update Security/RBAC**
   - Note which roles can access endpoints
   - Document any special permission requirements
   - Update role-based data visibility table if needed

### After Pushing Frontend Feature

1. **Update Architecture - Key Directories**
   - Add component file descriptions
   - Note if mobile variant exists
   - Group related components

2. **Update Frontend Routing**
   - Add route path for new pages
   - Describe what the page shows
   - Note authentication requirements

3. **Update UI/UX Guidelines**
   - Add design system usage for component
   - Document any special interaction patterns
   - Note responsive breakpoint considerations

4. **Update Recent Features Added**
   - Create subsection for feature
   - Bullet point each related component/endpoint
   - Include key capabilities

### After Pushing Full-Stack Feature

1. Follow **Backend Feature** process
2. Follow **Frontend Feature** process
3. Add comprehensive **Recent Features Added** entry
4. Update **Key Directories** for all touched files
5. Cross-reference related features in new documentation

## Documentation Standards

### Code References
When mentioning code locations, use format: `file_path:line_number`
```markdown
Error handling: `backend/routes/feedback.js:45`
Component state: `frontend/src/components/NewComponent.tsx:23`
```

### Descriptions Style
- **Brief**: One-line summary of purpose
- **Details**: What it does, key relationships
- **Examples**: Show usage patterns if complex

### Lists and Tables
- **Routes table**: Always show (Route | Purpose) format
- **Models table**: Show model name and purpose
- **Components list**: Show component and description
- Maintain consistent formatting

### Sections to Check
- [ ] Key Data Models - Model added/updated
- [ ] Architecture Key Directories - Files listed with descriptions
- [ ] API Structure - Routes documented
- [ ] Frontend Routing - Pages documented if applicable
- [ ] UI/UX Guidelines - Design patterns documented if applicable
- [ ] Git Commit Guidelines - Examples updated with similar pattern
- [ ] Recent Features Added - Feature and components listed

## Common Patterns

### Documenting a New Backend Model
```markdown
### NewFeature
- Links to [RelatedModel] via `linkedFieldName`
- Contains: id, name, description, relatedId, timestamps
- Soft delete: isDeleted flag tracks status
- Index: Optimized for queries by userId and createdAt
```

### Documenting a New API Route
```markdown
| Route | Purpose |
|-------|---------|
| `/api/newfeature` | CRUD operations, stats, filtering |
```

In detail:
```
GET /api/newfeature         → List all (paginated)
POST /api/newfeature        → Create new
GET /api/newfeature/:id     → Get one
PUT /api/newfeature/:id     → Update
DELETE /api/newfeature/:id  → Soft delete
GET /api/newfeature/:id/stats → Aggregated stats
```

### Documenting a New Component
```markdown
### NewComponent
- **File**: `frontend/src/components/NewComponent.tsx`
- **Mobile**: `frontend/src/components/mobile/MobileNewComponent.tsx`
- **Purpose**: Describes what component does
- **Props**: Links to API data types
- **Integrations**: What services it uses
```

### Documenting a New Service Function
```markdown
```javascript
const newServiceFunction = async (param1, param2) => {
  // Description of what it does
  // Returns: Description of return value
  // Throws: Error conditions
};

module.exports = { newServiceFunction };
```
```

## Verification Checklist

Before marking documentation complete:

- [ ] All new files are listed in Architecture section
- [ ] All new routes are in API Structure table
- [ ] All new pages are in Frontend Routing
- [ ] Related models show proper links/references
- [ ] Examples match actual code patterns
- [ ] No typos or formatting issues
- [ ] Cross-references are bidirectional where applicable
- [ ] Recent Features entry is complete and accurate
- [ ] Architecture diagrams are updated if maintained

## Tools & Commands

### Find all new files in feature
```bash
git diff main..feature-branch --name-only
```

### Check file line counts
```bash
wc -l backend/routes/newfeature.js frontend/src/components/NewComponent.tsx
```

### Verify documentation references
```bash
grep -r "newfeature\|NewFeature" CLAUDE.md .claude/
```

## Examples

See "Recent Features Added" section in CLAUDE.md for real examples:
- Player Profile System
- Mobile Chats Tab
- Admin Dashboard Tabs

Each shows the documentation pattern for full-stack features.
