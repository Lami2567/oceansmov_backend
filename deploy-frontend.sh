#!/bin/bash

echo "🚀 Deploying Frontend with Correct API URL..."

# Check if we're in the right directory
if [ ! -f "client/package.json" ]; then
    echo "❌ Error: Please run this script from the project root"
    exit 1
fi

# Add all changes
echo "📦 Adding files..."
git add .

# Commit changes
echo "💾 Committing changes..."
git commit -m "Fix API URL configuration and add build-time verification"

# Push to trigger deployment
echo "📤 Pushing to remote..."
git push origin master

echo "✅ Deployment triggered!"
echo ""
echo "🔧 Next steps:"
echo "1. Go to https://vercel.com/dashboard"
echo "2. Click on your oceansmov project"
echo "3. Go to Settings > Environment Variables"
echo "4. Add/Update REACT_APP_API_URL = https://oceansmov-backend.onrender.com/api"
echo "5. Select all environments (Production, Preview, Development)"
echo "6. Save and redeploy"
echo ""
echo "🌐 Your backend URL: https://oceansmov-backend.onrender.com/api"
echo "🎯 Expected API URL: https://oceansmov-backend.onrender.com/api" 