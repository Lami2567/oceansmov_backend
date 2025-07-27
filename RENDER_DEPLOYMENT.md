# 🚀 Render Deployment Guide

## Manual Render Configuration

Since the `render.yaml` approach isn't working, use these manual steps:

### 1. Create New Web Service on Render

1. Go to [render.com](https://render.com) and create account
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:

### 2. Service Configuration

**Basic Settings:**
- **Name**: `movie-web-backend`
- **Environment**: `Node`
- **Region**: Choose closest to you
- **Branch**: `master`
- **Root Directory**: Leave empty (will use root)
- **Build Command**: `npm install`
- **Start Command**: `npm start`

### 3. Environment Variables

**⚠️ CRITICAL: You MUST set these environment variables before deployment!**

Add these environment variables in Render dashboard:

```
NODE_ENV=production
DATABASE_URL=postgresql://postgres:[password]@[host]:5432/postgres
JWT_SECRET=your_secure_jwt_secret_here
FRONTEND_URL=https://your-vercel-app.vercel.app
WASABI_ACCESS_KEY_ID=your_wasabi_access_key
WASABI_SECRET_ACCESS_KEY=your_wasabi_secret_key
WASABI_BUCKET_NAME=your_wasabi_bucket_name
WASABI_REGION=us-east-1
WASABI_ENDPOINT=https://s3.us-east-1.wasabisys.com
```

**Important Notes:**
- `DATABASE_URL` must be a valid PostgreSQL connection string
- Get this from your Supabase dashboard → Settings → Database
- Format: `postgresql://postgres:[password]@[host]:5432/postgres`

### 4. Advanced Settings

- **Auto-Deploy**: Enabled
- **Health Check Path**: `/api/test`
- **Health Check Timeout**: 180 seconds

### 5. Deploy

Click "Create Web Service" and monitor the deployment logs.

## Troubleshooting

### If dependencies still fail to install:

1. **Clear build cache** in Render dashboard
2. **Check logs** for specific error messages
3. **Verify environment variables** are set correctly
4. **Try manual deployment** by pushing a new commit

### Common Issues:

- **Module not found**: Dependencies not installed
- **Database connection**: Check DATABASE_URL
- **CORS errors**: Verify FRONTEND_URL
- **File uploads**: Check Wasabi credentials

## Alternative: Use Railway

If Render continues to have issues, consider using Railway:

1. Go to [railway.app](https://railway.app)
2. Connect GitHub repository
3. Deploy with similar configuration
4. Railway often has better dependency resolution

## Success Indicators

✅ Build completes without errors
✅ Dependencies installed successfully
✅ Server starts on port 5000
✅ Health check endpoint responds
✅ Database connection established
✅ Environment variables loaded 