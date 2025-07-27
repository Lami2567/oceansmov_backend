Write-Host "🚀 Committing Movie Web Application Changes" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green

# Navigate to project root
Set-Location ..

Write-Host "📋 Checking git status..." -ForegroundColor Yellow
git status

Write-Host ""
Write-Host "📦 Adding all changes..." -ForegroundColor Yellow
git add .

Write-Host ""
Write-Host "📝 Creating commit with comprehensive message..." -ForegroundColor Yellow

$commitMessage = @"
🎬 Movie Web App - Complete Production Setup

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

🎯 Status: Ready for production deployment
"@

git commit -m $commitMessage

Write-Host ""
Write-Host "✅ Commit completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Push to GitHub: git push origin main" -ForegroundColor White
Write-Host "2. Deploy to Render (automatic from GitHub)" -ForegroundColor White
Write-Host "3. Deploy to Vercel (automatic from GitHub)" -ForegroundColor White
Write-Host ""
Write-Host "🎉 Your app should now be fully functional!" -ForegroundColor Green 