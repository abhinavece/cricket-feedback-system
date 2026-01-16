# Changelog

All notable changes to the Mavericks XI Cricket Feedback System.

---

## [Unreleased]

### Added
- Player profile page with public player information display
- Email field in player profiles (from linked Google account)
- Mobile Chats tab for conversation list
- ConversationPanel component for reusable chat UI
- PlayerNameLink component for clickable player navigation
- Documentation auto-generation hook for post-commit updates
- Comprehensive FEATURES.md documentation

### Changed
- Reverted WhatsApp desktop tab from split-panel back to modal-based chat
- Updated CLAUDE.md with git commit guidelines and project context

---

## [January 2025]

### [2025-01-17] - Player Profile & Documentation
- **feat**: Add player profile page at `/player/:playerId`
- **feat**: Display email from linked User account in profiles
- **feat**: Add PlayerNameLink component for navigation
- **fix**: Revert WhatsApp tab to original modal design
- **docs**: Update CLAUDE.md with commit guidelines
- **chore**: Set up documentation auto-generation hook

### [2025-01-16] - UI Improvements
- **style**: UI changes for profile page and mobile UX (`4a8d848`)
- **style**: UI fixes and improvements (`bb215bf`)

### [2025-01-15] - Webhook Router
- **feat**: Webhook router setting developed (`d7cb4da`)
- **feat**: Mavericks logo integration (`f80f816`)

### [2025-01-14] - Public Share Links
- **feat**: Public link share functionality (`f8a7346`)
- **fix**: Correct image URL construction, add caching (`19687f1`)

### [2025-01-13] - SSE & Real-Time Features
- **fix**: SSE fixes for WhatsApp messaging (`03222fc`)
- **feat**: SSE feature for WhatsApp chat history (`df0793c`)
- **fix**: SSE fix for match availability page (`8431fa3`)
- **feat**: Server-sent events initial implementation (`5f8e352`)

### [2025-01-12] - CI/CD Improvements
- **fix**: Add Bitnami Helm repo before building dependencies (`38dc01e`)
- **fix**: Move import to top, add Helm dependency build step (`7754b9a`)
- **fix**: Add git pull --rebase for race conditions (`22a1189`)
- **fix**: Add write permissions for GitHub Actions (`5823550`)

### [2025-01-11] - Pipeline Creation
- **feat**: CI/CD pipeline creation (`2951c5f`)
- **chore**: Backend version bump to trigger pipeline (`2993b57`)

---

## Feature Highlights

### Player Profile System
Navigate to any player's profile by clicking their name. Profiles show:
- Name, team, and role
- Calculated age from date of birth
- Batting and bowling styles
- About/bio section
- Email (from Google account)
- CricHeroes external link

### Mobile Chats Tab
New dedicated tab in mobile navigation for:
- Viewing all WhatsApp conversations
- Searching players by name
- Seeing last message preview
- Full-screen chat interface

### Real-Time Updates (SSE)
Server-Sent Events power:
- Live WhatsApp message sync
- Match availability updates
- Instant notification delivery

### Public Share Links
Generate shareable links for:
- Match details and schedules
- Payment summaries
- No authentication required for viewers

---

## Commit Convention

This project follows conventional commits:

| Prefix | Description |
|--------|-------------|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `refactor:` | Code restructuring |
| `style:` | UI/CSS changes |
| `docs:` | Documentation |
| `chore:` | Build/config updates |
| `perf:` | Performance improvements |

---

*This changelog is auto-updated by `.claude/scripts/generate-docs.sh` after feature commits.*
