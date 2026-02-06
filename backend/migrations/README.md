# Database Migrations

This directory contains database migrations that run automatically on application startup.

## How It Works

1. **Automatic Execution**: All migrations in this directory run automatically when the backend server starts
2. **Order**: Migrations run in order based on their filename prefix (001-, 002-, etc.)
3. **Safe Failures**: If a migration fails, the application continues to start (prevents deployment failures)
4. **Idempotent**: Migrations can be run multiple times safely - they check if changes are needed before applying

## Current Migrations

### 001-fix-matchid-index.js
**Purpose**: Fixes the matchId index for multi-tenant support

**What it does**:
- Drops the old global unique index on `matchId` (prevents duplicate matchId across organizations)
- Ensures the compound index `organizationId_1_matchId_1` exists (allows each org to have its own matchId sequence)

**When it runs**: Automatically on every server startup

**Cloud Run Deployment**: No manual intervention needed - the migration runs automatically when the container starts

## Adding New Migrations

1. Create a new file with the next number prefix: `002-your-migration-name.js`
2. Export a `runMigration` function that returns a Promise<boolean>
3. Add the migration to the imports in `index.js`
4. The migration will run automatically on next deployment

### Migration Template

```javascript
#!/usr/bin/env node

async function runMigration() {
  const migrationName = '00X-your-migration-name';
  console.log(`[Migration] Running: ${migrationName}`);
  
  try {
    const db = mongoose.connection.db;
    
    // Your migration logic here
    
    console.log(`[Migration] ✓ ${migrationName} completed successfully`);
    return true;
  } catch (error) {
    console.error(`[Migration] ✗ ${migrationName} failed:`, error.message);
    return false;
  }
}

module.exports = { runMigration };
```

## Deployment Process

### Local Development
Migrations run automatically when you start the backend:
```bash
cd backend
npm start
```

### Cloud Run Deployment
Migrations run automatically when the container starts. No manual steps required.

The deployment flow:
1. Code is pushed to repository
2. Cloud Run builds new container
3. Container starts
4. MongoDB connection established
5. **Migrations run automatically** ✓
6. Application starts serving requests

### Monitoring
Check Cloud Run logs to verify migrations ran successfully:
```bash
gcloud logging read "resource.type=cloud_run_revision" --limit 50
```

Look for log entries like:
```
[Migrations] Starting migration runner...
[Migration] Running: 001-fix-matchid-index
[Migration] ✓ 001-fix-matchid-index completed successfully
[Migrations] Completed: 1 successful, 0 failed
```

## Troubleshooting

**Migration fails but app still starts**: This is intentional. Migrations are designed to be non-blocking to prevent deployment failures.

**Need to re-run a migration**: Restart the backend server. Migrations are idempotent and safe to run multiple times.

**Manual execution**: If needed, you can run migrations manually:
```bash
cd backend
node migrations/001-fix-matchid-index.js
```

## Best Practices

1. **Idempotent**: Always check if the change is needed before applying
2. **Non-blocking**: Don't throw errors that would prevent app startup
3. **Logging**: Log clear success/failure messages
4. **Testing**: Test migrations locally before deploying
5. **Reversible**: Consider how to rollback if needed (create a reverse migration)
