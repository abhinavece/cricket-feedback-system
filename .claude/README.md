# Claude AI Configuration

This directory contains the complete configuration for Claude AI when working on the Cricket Feedback System.

## Directory Structure

```
.claude/
├── README.md                 # This file
├── settings.local.json       # Permissions and hooks
│
├── rules/                    # Constraints (MUST follow)
│   ├── README.md
│   ├── global.md             # Always-applied rules
│   ├── security.md           # Security constraints
│   ├── code-style.md         # Code formatting rules
│   └── git.md                # Git/commit rules
│
├── skills/                   # Capabilities (HOW to do things)
│   ├── README.md
│   ├── frontend.md           # React/TypeScript/Tailwind
│   ├── backend.md            # Node.js/Express/MongoDB
│   ├── devops.md             # Docker/Kubernetes/Helm
│   ├── ai-service.md         # Python/FastAPI
│   └── database.md           # MongoDB optimization
│
├── agents/                   # Personas (WHO is working)
│   ├── README.md
│   ├── frontend-dev.md       # Frontend developer
│   ├── backend-dev.md        # Backend developer
│   ├── devops.md             # DevOps engineer
│   ├── code-reviewer.md      # Code reviewer
│   └── docs-writer.md        # Documentation writer
│
└── scripts/
    └── generate-docs.sh      # Documentation generation
```

## Quick Reference

### Rules (Always Apply)
Rules are non-negotiable constraints that MUST be followed:

| Rule | Description |
|------|-------------|
| `global.md` | Role-based access, services, mobile-first |
| `security.md` | Authentication, authorization, data protection |
| `code-style.md` | Code formatting, patterns, anti-patterns |
| `git.md` | Commit messages, safety rules |

### Skills (How To)
Skills are detailed instructions for specific capabilities:

| Skill | Use When |
|-------|----------|
| `frontend.md` | Creating React components |
| `backend.md` | Creating API endpoints |
| `devops.md` | Deploying applications |
| `ai-service.md` | Python AI service development |
| `database.md` | MongoDB schema/query optimization |

### Agents (Specialized Roles)
Agents combine skills and rules for specific workflows:

| Agent | Expertise |
|-------|-----------|
| `frontend-dev.md` | React, TypeScript, UI/UX |
| `backend-dev.md` | Node.js, Express, APIs |
| `devops.md` | Docker, K8s, Deployment |
| `code-reviewer.md` | Quality, security review |
| `docs-writer.md` | Technical documentation |

## Usage

### Automatic Activation
- **Rules**: `global.md` always applies
- **Skills**: Activated based on file types and task keywords
- **Agents**: Activated based on task type

### Manual Activation
Reference by name in conversation:
- "Follow the security rules for this endpoint"
- "Use the backend skill to create this API"
- "Act as the code reviewer agent"

## Key Principles

### 1. Role-Based Access Control
Always determine which roles (viewer/editor/admin) can access features.

### 2. Use Unified Services
Never duplicate logic - use existing services in `backend/services/`.

### 3. Mobile-First Design
Design for mobile first, then enhance for desktop.

### 4. Security First
Always validate input, protect sensitive data, use proper authentication.

### 5. Documentation
Update relevant documentation when adding features.

## Integration with Other AI Tools

### Windsurf AI
- Uses `.windsurf-rules` and `.windsurf/rules/`
- Similar content, different format

### Claude
- Uses this `.claude/` directory
- Uses `CLAUDE.md` as main reference

## Maintenance

When updating this configuration:
1. Update relevant rule/skill/agent file
2. Update this README if structure changes
3. Test with sample tasks
4. Commit with `docs:` prefix
