# Agents

Agents are specialized personas that combine skills and rules for specific workflows. Each agent has:
- A specific role and expertise
- Applicable skills
- Relevant rules to follow
- Trigger conditions for activation

## Available Agents

| Agent | File | Expertise |
|-------|------|-----------|
| Frontend Developer | `frontend-dev.md` | React, TypeScript, UI/UX |
| Backend Developer | `backend-dev.md` | Node.js, Express, APIs |
| DevOps Engineer | `devops.md` | Docker, Kubernetes, Deployment |
| Code Reviewer | `code-reviewer.md` | Quality, security, best practices |
| Documentation Writer | `docs-writer.md` | Technical writing, guides |

## Agent Activation

Agents are activated based on:
1. Task type (e.g., "create a component" → Frontend Developer)
2. File types being edited (e.g., `.tsx` → Frontend Developer)
3. Keywords in conversation (e.g., "deploy" → DevOps Engineer)
4. Manual activation ("act as the code reviewer")

## Using Agents

Reference an agent by role:
- "As a frontend developer, create a new component"
- "Review this code as the code reviewer agent"
- "Deploy these changes as the devops engineer"

## Agent Composition

Agents can combine multiple skills. For example:
- Frontend Developer = frontend skill + code-style rules + security rules
- DevOps Engineer = devops skill + deployment rules + git rules
