# Claude Rules & Configuration

This directory contains rules, skills, and agent configurations for Claude AI when working on the Cricket Feedback System.

## Directory Structure

```
.claude/
├── rules/
│   ├── README.md           # This file
│   ├── global.md           # Global rules that always apply
│   ├── security.md         # Security constraints
│   ├── code-style.md       # Code formatting and style rules
│   └── git.md              # Git and commit rules
├── skills/
│   ├── README.md           # Skills documentation
│   ├── frontend.md         # Frontend development skills
│   ├── backend.md          # Backend development skills
│   ├── devops.md           # DevOps and deployment skills
│   ├── ai-service.md       # AI service development skills
│   └── database.md         # Database operations skills
├── agents/
│   ├── README.md           # Agents documentation
│   ├── frontend-dev.md     # Frontend developer agent
│   ├── backend-dev.md      # Backend developer agent
│   ├── devops.md           # DevOps engineer agent
│   ├── code-reviewer.md    # Code review agent
│   └── docs-writer.md      # Documentation writer agent
├── scripts/
│   └── generate-docs.sh    # Documentation generation script
└── settings.local.json     # Local permissions and hooks
```

## Usage

### Rules
Rules are constraints that MUST be followed. They are non-negotiable guidelines.

### Skills
Skills are specific capabilities with detailed instructions on HOW to perform tasks.

### Agents
Agents are specialized personas that combine skills and rules for specific workflows.

## Activation

Rules in `global.md` always apply. Other rules/skills/agents can be activated:
- Automatically based on file types being edited
- Manually by referencing them in conversation
- Through trigger conditions in the frontmatter
