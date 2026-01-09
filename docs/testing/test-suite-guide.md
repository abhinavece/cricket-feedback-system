# Cricket Feedback System - Test Suite Guide

## Overview

This comprehensive test suite covers all API endpoints in the Cricket Feedback System. The tests ensure that new features don't break existing functionality.

## Test Coverage

| Module | Test File | Endpoints Tested |
|--------|-----------|------------------|
| Auth | `auth.test.js` | Token verification, user management, role updates, profile |
| Admin | `admin.test.js` | Password authentication |
| Matches | `matches.test.js` | CRUD, squad management, statistics |
| Players | `players.test.js` | CRUD operations |
| Availability | `availability.test.js` | Match/player queries, CRUD, stats |
| Feedback | `feedback.test.js` | Submit, list, stats, trash, restore, delete |
| WhatsApp | `whatsapp.test.js` | Webhook, messages, send, reminders |
| Health | `health.test.js` | Health check endpoint |
| Integration | `integration.test.js` | Full user flow tests |

## Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Run All Tests

```bash
# Run all tests (simplest way)
npm test

# Or use the shell script
chmod +x ../scripts/run-tests.sh
../scripts/run-tests.sh
```

### 3. Run Specific Tests

```bash
# Individual module tests
npm run test:auth
npm run test:matches
npm run test:players
npm run test:availability
npm run test:feedback
npm run test:whatsapp
npm run test:admin
npm run test:integration

# Or using shell script
../scripts/run-tests.sh --specific auth
../scripts/run-tests.sh --specific matches
```

## Available npm Scripts

| Command | Description |
|---------|-------------|
| `npm test` | Run all tests |
| `npm run test:watch` | Run tests in watch mode (auto-rerun on changes) |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run test:auth` | Run authentication tests only |
| `npm run test:matches` | Run matches tests only |
| `npm run test:players` | Run players tests only |
| `npm run test:availability` | Run availability tests only |
| `npm run test:feedback` | Run feedback tests only |
| `npm run test:whatsapp` | Run WhatsApp tests only |
| `npm run test:admin` | Run admin tests only |
| `npm run test:integration` | Run integration tests only |
| `npm run test:ci` | Run tests in CI mode with coverage |

## Shell Script Options

```bash
./scripts/run-tests.sh [options]

Options:
  --all         Run all tests (default)
  --unit        Run unit tests only (auth, admin, health)
  --integration Run integration tests only
  --coverage    Run tests with coverage report
  --watch       Run tests in watch mode
  --specific X  Run specific test file (auth, matches, players, etc.)
  --verbose     Show detailed output
  --help        Show help message
```

### Examples

```bash
# Run all tests
./scripts/run-tests.sh

# Run with coverage
./scripts/run-tests.sh --coverage

# Run specific module
./scripts/run-tests.sh --specific feedback

# Watch mode for development
./scripts/run-tests.sh --watch

# Integration tests only
./scripts/run-tests.sh --integration
```

## Test Database

Tests use a separate test database to avoid affecting production data:
- Default: `mongodb://localhost:27017/cricket_feedback_test`
- Override: Set `MONGODB_TEST_URI` environment variable

Tests automatically:
1. Connect to the test database
2. Create test data with identifiable prefixes (`Test `, `TEST-`)
3. Clean up test data after each test run

## Test Structure

Each test file follows this structure:

```javascript
describe('API Module', () => {
  beforeAll(async () => {
    // Connect to test DB
    // Create test app
  });

  afterAll(async () => {
    // Clean up test data
    // Disconnect from DB
  });

  beforeEach(async () => {
    // Create fresh test user/data
  });

  describe('ENDPOINT /api/resource', () => {
    it('should handle success case', async () => {});
    it('should handle error case', async () => {});
    it('should validate input', async () => {});
  });
});
```

## Writing New Tests

When adding a new feature:

1. **Add test cases** to the relevant test file
2. **Test success scenarios** - valid inputs, expected outputs
3. **Test error scenarios** - invalid inputs, authentication, authorization
4. **Test edge cases** - empty data, duplicates, non-existent resources

### Example: Testing a New Endpoint

```javascript
describe('POST /api/newfeature', () => {
  it('should create new resource with valid data', async () => {
    const res = await request(app)
      .post('/api/newfeature')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ data: 'valid' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it('should reject invalid data', async () => {
    const res = await request(app)
      .post('/api/newfeature')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ data: null });

    expect(res.status).toBe(400);
  });

  it('should require authentication', async () => {
    const res = await request(app)
      .post('/api/newfeature')
      .send({ data: 'valid' });

    expect(res.status).toBe(401);
  });
});
```

## CI/CD Integration

For CI/CD pipelines, use:

```bash
npm run test:ci
```

This runs:
- All tests in CI mode
- Sequential execution (no parallel)
- Coverage report generation
- Exit on first failure

### GitHub Actions Example

```yaml
- name: Run Tests
  run: |
    cd backend
    npm install
    npm run test:ci
  env:
    MONGODB_TEST_URI: ${{ secrets.MONGODB_TEST_URI }}
    JWT_SECRET: ${{ secrets.JWT_SECRET }}
```

## Troubleshooting

### Tests Hanging

If tests hang after completion:
- Tests use `--forceExit` flag
- Check for unclosed database connections
- Ensure async operations are properly awaited

### Database Connection Errors

1. Ensure MongoDB is running: `mongod`
2. Check connection string in `.env`
3. Verify network access to database

### Authentication Failures

1. Check `JWT_SECRET` is set
2. Verify test user creation in `setup.js`
3. Ensure token is passed in Authorization header

### Test Data Pollution

If test data appears in production:
1. Verify `MONGODB_TEST_URI` is different from `MONGODB_URI`
2. Run cleanup: Tests automatically clean `Test ` prefixed data

## Test Results Interpretation

### Success Output
```
✓ Auth API
  ✓ GET /api/auth/verify
    ✓ should verify a valid token and return user data (45 ms)
    ✓ should reject request without token (12 ms)
```

### Failure Output
```
✕ Auth API
  ✕ GET /api/auth/verify
    ✕ should verify a valid token and return user data (45 ms)
      Expected: 200
      Received: 401
```

## Coverage Report

After running `npm run test:coverage`:

- **Text summary** appears in terminal
- **HTML report** at `backend/coverage/lcov-report/index.html`
- **Coverage threshold** recommended: 80%

## Best Practices

1. **Run tests before every commit**
2. **Add tests for new features** before marking complete
3. **Don't skip failing tests** - fix them
4. **Keep tests independent** - each test should run in isolation
5. **Use descriptive test names** - `should reject invalid phone number`
6. **Test edge cases** - empty arrays, null values, max limits
