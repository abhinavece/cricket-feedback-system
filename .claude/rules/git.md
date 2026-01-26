# Git Rules

## Commit Message Format

```
<type>: <short summary>

<optional body with more details>

Co-Authored-By: Claude <assistant> <noreply@anthropic.com>
```

## Commit Types

| Type | Description |
|------|-------------|
| `feat:` | New feature or functionality |
| `fix:` | Bug fix |
| `refactor:` | Code restructuring without behavior change |
| `style:` | UI/CSS changes, formatting |
| `docs:` | Documentation updates |
| `chore:` | Build, config, dependency updates |
| `perf:` | Performance improvements |
| `test:` | Test additions/updates |

## Good Commit Examples

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

## What to Include

1. **Summary line**: What changed (imperative mood: "add" not "added")
2. **Body**: Why the change was made, key details
3. **Reference files**: Mention key files if helpful
4. **Breaking changes**: Note if behavior changes

## Git Safety Rules

- NEVER update git config
- NEVER run destructive commands (push --force, hard reset) without explicit request
- NEVER skip hooks (--no-verify) unless explicitly requested
- NEVER force push to main/master
- Avoid --amend unless:
  1. User explicitly requested it
  2. HEAD commit was created in this conversation
  3. Commit has NOT been pushed to remote

## Before Committing

- [ ] Run tests (if applicable)
- [ ] Check for linting errors
- [ ] Review changes with `git diff`
- [ ] Ensure no secrets in commit
- [ ] Update documentation if needed
