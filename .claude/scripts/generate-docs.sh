#!/bin/bash
# Auto-documentation generator for Cricket Feedback project
# This script updates documentation after feature merges

set -e

PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
DOCS_DIR="$PROJECT_ROOT/docs"
FEATURES_FILE="$DOCS_DIR/FEATURES.md"
CHANGELOG_FILE="$PROJECT_ROOT/CHANGELOG.md"

# Get the last commit message
LAST_COMMIT_MSG=$(git log -1 --pretty=%B 2>/dev/null || echo "")
LAST_COMMIT_HASH=$(git log -1 --pretty=%h 2>/dev/null || echo "")
LAST_COMMIT_DATE=$(git log -1 --pretty=%ci 2>/dev/null | cut -d' ' -f1 || echo "")

# Check if this is a feature/fix commit (not chore/docs)
if echo "$LAST_COMMIT_MSG" | grep -qE "^(feat|fix|refactor|perf):"; then
    echo "Feature commit detected. Updating documentation..."

    # Extract commit type and message
    COMMIT_TYPE=$(echo "$LAST_COMMIT_MSG" | head -1 | cut -d':' -f1)
    COMMIT_SUMMARY=$(echo "$LAST_COMMIT_MSG" | head -1 | cut -d':' -f2- | sed 's/^ *//')

    # Prepend to CHANGELOG if it exists
    if [ -f "$CHANGELOG_FILE" ]; then
        # Create temp file with new entry
        {
            head -n 5 "$CHANGELOG_FILE"
            echo ""
            echo "### [$LAST_COMMIT_DATE] - $COMMIT_SUMMARY"
            echo "- **Type**: $COMMIT_TYPE"
            echo "- **Commit**: \`$LAST_COMMIT_HASH\`"
            echo ""
            tail -n +6 "$CHANGELOG_FILE"
        } > "$CHANGELOG_FILE.tmp"
        mv "$CHANGELOG_FILE.tmp" "$CHANGELOG_FILE"
        echo "Updated CHANGELOG.md"
    fi

    echo "Documentation sync complete."
else
    echo "Non-feature commit. Skipping documentation update."
fi
