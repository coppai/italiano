#!/bin/bash

# Deploy script for Italian Flashcards
# This script builds, commits, and pushes changes to trigger Render deployment

set -e  # Exit on error

echo "🔨 Building project..."
npm run build

echo ""
echo "📦 Checking for changes in public/ data files..."
git add public/*.json

# Check if there are changes to commit
if git diff --cached --quiet; then
    echo "❌ No changes detected in public/*.json files"
    echo "Nothing to deploy."
    exit 0
fi

echo ""
echo "📝 Changes to be committed:"
git diff --cached --name-only

echo ""
read -p "Enter commit message: " commit_message

if [ -z "$commit_message" ]; then
    echo "❌ Commit message cannot be empty"
    exit 1
fi

echo ""
echo "💾 Committing changes..."
git commit -m "$commit_message"

echo ""
echo "🚀 Pushing to origin..."
git push

echo ""
echo "✅ Deploy complete! Render will rebuild automatically."
echo "Check: https://dashboard.render.com"
