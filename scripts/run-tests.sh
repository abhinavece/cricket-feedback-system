#!/bin/bash

# Cricket Feedback System - Test Runner Script
# Usage: ./scripts/run-tests.sh [options]
#
# Options:
#   --all         Run all tests (default)
#   --unit        Run unit tests only
#   --integration Run integration tests only
#   --coverage    Run tests with coverage report
#   --watch       Run tests in watch mode
#   --specific    Run specific test file (e.g., --specific auth)
#   --verbose     Show detailed output
#   --help        Show this help message

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
TEST_TYPE="all"
COVERAGE=false
WATCH=false
VERBOSE=false
SPECIFIC=""

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --all)
            TEST_TYPE="all"
            shift
            ;;
        --unit)
            TEST_TYPE="unit"
            shift
            ;;
        --integration)
            TEST_TYPE="integration"
            shift
            ;;
        --coverage)
            COVERAGE=true
            shift
            ;;
        --watch)
            WATCH=true
            shift
            ;;
        --specific)
            SPECIFIC="$2"
            shift 2
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        --help)
            echo "Cricket Feedback System - Test Runner"
            echo ""
            echo "Usage: ./scripts/run-tests.sh [options]"
            echo ""
            echo "Options:"
            echo "  --all         Run all tests (default)"
            echo "  --unit        Run unit tests only (auth, admin, health)"
            echo "  --integration Run integration tests only"
            echo "  --coverage    Run tests with coverage report"
            echo "  --watch       Run tests in watch mode"
            echo "  --specific X  Run specific test file (auth, matches, players, etc.)"
            echo "  --verbose     Show detailed output"
            echo "  --help        Show this help message"
            echo ""
            echo "Examples:"
            echo "  ./scripts/run-tests.sh                    # Run all tests"
            echo "  ./scripts/run-tests.sh --coverage         # Run with coverage"
            echo "  ./scripts/run-tests.sh --specific auth    # Run auth tests only"
            echo "  ./scripts/run-tests.sh --watch            # Run in watch mode"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

# Navigate to backend directory
cd "$(dirname "$0")/../backend"

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}   Cricket Feedback System - Test Suite    ${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# Check if dependencies are installed
if [ ! -d "node_modules/jest" ] || [ ! -d "node_modules/supertest" ]; then
    echo -e "${YELLOW}Installing test dependencies...${NC}"
    npm install --save-dev jest supertest mongodb-memory-server
fi

# Build test command
TEST_CMD="npx jest"

# Add test pattern based on type
if [ -n "$SPECIFIC" ]; then
    TEST_CMD="$TEST_CMD tests/${SPECIFIC}.test.js"
    echo -e "${GREEN}Running: ${SPECIFIC} tests${NC}"
elif [ "$TEST_TYPE" = "unit" ]; then
    TEST_CMD="$TEST_CMD tests/auth.test.js tests/admin.test.js tests/health.test.js"
    echo -e "${GREEN}Running: Unit tests${NC}"
elif [ "$TEST_TYPE" = "integration" ]; then
    TEST_CMD="$TEST_CMD tests/integration.test.js"
    echo -e "${GREEN}Running: Integration tests${NC}"
else
    echo -e "${GREEN}Running: All tests${NC}"
fi

# Add coverage flag
if [ "$COVERAGE" = true ]; then
    TEST_CMD="$TEST_CMD --coverage"
    echo -e "${YELLOW}Coverage reporting: enabled${NC}"
fi

# Add watch flag
if [ "$WATCH" = true ]; then
    TEST_CMD="$TEST_CMD --watch"
    echo -e "${YELLOW}Watch mode: enabled${NC}"
fi

# Add verbose flag
if [ "$VERBOSE" = true ]; then
    TEST_CMD="$TEST_CMD --verbose"
fi

echo ""
echo -e "${BLUE}Command: ${TEST_CMD}${NC}"
echo ""

# Run tests
$TEST_CMD

# Check exit status
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}============================================${NC}"
    echo -e "${GREEN}   ✓ All tests passed successfully!        ${NC}"
    echo -e "${GREEN}============================================${NC}"
else
    echo ""
    echo -e "${RED}============================================${NC}"
    echo -e "${RED}   ✗ Some tests failed!                    ${NC}"
    echo -e "${RED}============================================${NC}"
    exit 1
fi
