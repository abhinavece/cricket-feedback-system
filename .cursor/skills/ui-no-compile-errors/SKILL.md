---
name: ui-no-compile-errors
description: After making UI or frontend changes, verify there are no compile or lint errors. If any are found, acknowledge that they were caught by this skill and fix them before finishing.
---

# No Compile Errors After UI Changes

## When to Apply

Apply this skill whenever you change UI or frontend code (e.g. React/TSX components, styles, frontend config).

## What to Do

1. **After editing UI/frontend files**, check for compile and lint errors:
   - Use the linter/build diagnostics (e.g. ReadLints on the changed paths).
   - If the project has a frontend build, run it (e.g. `npm run build` in frontend or `npm run build` at root) to surface TypeScript/compile errors.

2. **If errors are found**:
   - State clearly that **we found them through the "ui-no-compile-errors" skill** (or "through this skill").
   - Fix the errors (types, imports, syntax, missing props, etc.) before considering the task done.
   - Re-check until there are no errors.

3. **If no errors**: You may briefly note that the check was done and the build is clean (optional).

## Scope

- Focus on files you changed (e.g. `frontend/src/**/*.tsx`, `frontend/src/**/*.ts`, and any config those depend on).
- Prefer checking only the edited paths when using ReadLints to keep feedback relevant.

## Rule

Do not leave UI changes in a broken state. Always verify and fix compile/lint errors before finishing.
