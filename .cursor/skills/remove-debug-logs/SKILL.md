---
name: remove-debug-logs
description: Removes console.log and other debug log statements added during implementation or debugging after the user confirms the feature works. Use when the user says debugging is done, changes are validated, or asks to remove or clean up logs from previous implementation.
---

# Remove Debug Logs After Validation

## When to Apply

Apply this skill when **all** of the following are true:

1. Debugging or implementation for a feature is complete.
2. The user has validated that the functionality works as expected.
3. The user asks to remove logs, clean up, or says "remove the logs which you created."

Do **not** remove logs before the user confirms the feature works.

## What to Remove

- `console.log(...)` added for debugging or tracing flow.
- `console.debug(...)` or `console.info(...)` used for development.
- Callbacks that only log (e.g. `onConnect: () => console.log('...')`); remove the log or replace with a no-op if the callback is required.

## What to Keep

- **Keep** `console.error(...)` and `console.warn(...)` that report real runtime errors or warnings to the user or logs.
- **Keep** existing application logging that is part of normal operation (e.g. request/audit logs) unless the user explicitly asked to remove logs from code you added.

## How to Find Logs

1. **Scope to changed files**: In the files you edited during the recent implementation or debugging, search for:
   - `console.log`
   - `console.debug`
   - `console.info`
2. Remove only statements that were added for that implementation or debugging, not pre-existing logs in the same file.
3. When removing a callback that only logged (e.g. in a hook), remove the callback entirely if the API allows (e.g. omit `onConnect`) or use an empty function if the parameter is required.

## Checklist

- [ ] User has confirmed the feature or fix works.
- [ ] Removed `console.log` / `console.debug` / `console.info` added during the recent work.
- [ ] Left `console.error` / `console.warn` that report real errors.
- [ ] Did not remove unrelated, pre-existing logging in the same files.
