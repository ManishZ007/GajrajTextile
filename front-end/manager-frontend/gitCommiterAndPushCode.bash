#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Validate arguments (allow defaults for branches)
COMMIT_MSG="$1"
SOURCE_BRANCH="${2:-dev}"
TARGET_BRANCH="${3:-main}"

if [ -z "$COMMIT_MSG" ]; then
    echo "Usage: $0 <commit_message> [source_branch] [target_branch]"
    echo "Example: $0 \"Fix login bug\" dev main"
    exit 1
fi

echo "🚀 Starting deployment workflow..."
echo "Source: $SOURCE_BRANCH | Target: $TARGET_BRANCH | Message: $COMMIT_MSG"

# 1. Ensure we are on the source branch before committing
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "$SOURCE_BRANCH" ]; then
    echo "⚠️  Switching from $CURRENT_BRANCH to $SOURCE_BRANCH..."
    git switch "$SOURCE_BRANCH"
fi

echo "📦 adding changes..."
git add .

echo "💾 committing changes..."
git commit -m "$COMMIT_MSG"

echo "⬆️  pushing $SOURCE_BRANCH to remote..."
git push origin "$SOURCE_BRANCH"

echo "🔄 switching to target branch $TARGET_BRANCH..."
git switch "$TARGET_BRANCH"

echo "⬇️  pulling latest $TARGET_BRANCH..."
git pull origin "$TARGET_BRANCH"

echo "🔀 merging $SOURCE_BRANCH into $TARGET_BRANCH..."
# --no-ff ensures a merge commit is created even if fast-forward is possible
# This preserves the history of the dev branch explicitly
git merge "$SOURCE_BRANCH" --no-ff -m "Merge $SOURCE_BRANCH into $TARGET_BRANCH: $COMMIT_MSG"

echo "⬆️  pushing merged $TARGET_BRANCH..."
git push origin "$TARGET_BRANCH"

echo "🔙 switching back to $SOURCE_BRANCH..."
git switch "$SOURCE_BRANCH"

echo "✅ Workflow complete!"   