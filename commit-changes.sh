#!/bin/bash

echo "🚀 Committing Movie Web Application Changes"
echo "=========================================="

# Navigate to project root
cd ..

echo "📋 Checking git status..."
git status

echo ""
echo "📦 Adding all changes..."
git add .

echo ""
echo "📝 Creating commit with comprehensive message..."
git commit -m "🎬 Movie Web App - Complete Production Setup

✅ Backend Improvements:
- Fixed CORS configuration for Vercel frontend
- Added comprehensive error handling for file uploads
- Improved Wasabi integration with better error messages
- Added admin user management scripts
- Enhanced database connection handling

✅ Frontend Improvements:
- Enhanced VideoPlayer with format auto-detection
- Added better error handling for video playback
- Improved user experience with error recovery options
- Added support for multiple video formats (MP4, WebM, OGG, etc.)

✅ Configuration Updates:
- Fixed Wasabi region configuration (us-west-1)
- Added proper environment variable handling
- Enhanced deployment scripts and testing tools

✅ Bug Fixes:
- Resolved 401 login errors (JWT_SECRET)
- Fixed 500 file upload errors (Wasabi config)
- Resolved CORS issues between Vercel and Render
- Improved video playback error handling

🔧 Technical Details:
- CORS now properly configured for oceansmov.vercel.app
- Video player supports multiple formats with fallbacks
- Enhanced error messages for debugging
- Production-ready configuration for Render deployment

🎯 Status: Ready for production deployment"

echo ""
echo "✅ Commit completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Push to GitHub: git push origin main"
echo "2. Deploy to Render (automatic from GitHub)"
echo "3. Deploy to Vercel (automatic from GitHub)"
echo ""
echo "🎉 Your app should now be fully functional!" 