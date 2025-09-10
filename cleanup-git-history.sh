#!/bin/bash

# Git History Cleanup Script
# WARNING: This script rewrites git history. Use with caution!

echo "🚨 WARNING: This script will rewrite your git history!"
echo "This will remove sensitive files from all commits."
echo "Make sure you have a backup of your repository before proceeding."
echo ""
read -p "Do you want to continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

echo "🧹 Cleaning up git history..."

# Method 1: Remove files from git history (rewrites history)
echo "Removing sensitive files from git history..."
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch .env .env.production .env.staging .env.local' \
  --prune-empty --tag-name-filter cat -- --all

# Clean up the backup refs
echo "Cleaning up backup references..."
git for-each-ref --format='delete %(refname)' refs/original | git update-ref --stdin

# Expire and prune
echo "Expiring reflog and pruning..."
git reflog expire --expire=now --all
git gc --prune=now --aggressive

echo "✅ Git history cleanup completed!"
echo ""
echo "🚀 Next steps:"
echo "1. Force push to update remote repository:"
echo "   git push origin --force --all"
echo ""
echo "2. Notify team members to re-clone the repository"
echo ""
echo "3. Set up environment variables in your deployment platform"
echo ""
echo "4. Create local .env file from .env.example for development"

# Alternative safer method (commented out)
# echo "Alternative: Just remove from current commit (safer)"
# git rm --cached .env .env.production .env.staging .env.local 2>/dev/null || true
# git commit -m "Remove sensitive environment files from repository"
# echo "Run: git push"