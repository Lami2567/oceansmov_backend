#!/bin/bash

echo "🚀 Auto-Deploying Database Connection Fix..."

# Add all backend changes
echo "📦 Adding files..."
git add backend/db.js backend/db-auto-debug.js backend/db-alternative.js backend/db-simple.js backend/test-dns.js

# Commit with descriptive message
echo "💾 Committing changes..."
git commit -m "Add intelligent auto-debug database connection system with automatic diagnostics and fallback strategies"

# Push to remote
echo "📤 Pushing to remote..."
git push origin master

echo "✅ Deployment complete! Check Render logs for auto-debug results." 