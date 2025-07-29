# 🚀 Render + Cloudflare R2 Configuration Guide

## 🎯 **Complete Setup for Render Deployment with R2 Storage**

This guide will help you configure your Render backend to use Cloudflare R2 for data storage.

## 📋 **Prerequisites**

1. **Render Account** - Sign up at [render.com](https://render.com)
2. **Cloudflare R2 Setup** - Follow `R2_CONFIGURATION_GUIDE.md` first
3. **GitHub Repository** - Your code must be on GitHub
4. **PostgreSQL Database** - Neon, Supabase, or Render PostgreSQL

## 🔧 **Step-by-Step Render Configuration**

### **Step 1: Create New Web Service on Render**

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Select the repository containing your backend code

### **Step 2: Configure Service Settings**

**Basic Configuration:**
- **Name**: `movie-web-backend-r2`
- **Environment**: `Node`
- **Region**: Choose closest to your users
- **Branch**: `main` (or your default branch)
- **Root Directory**: `backend` (since your backend is in the backend folder)
- **Build Command**: `npm install`
- **Start Command**: `npm start`

### **Step 3: Environment Variables Configuration**

**⚠️ CRITICAL: Set these environment variables in Render dashboard**

Go to your service → **Environment** tab and add these variables:

#### **Core Application Variables:**
```env
NODE_ENV=production
PORT=10000
```

#### **Database Configuration:**
```env
DATABASE_URL=postgresql://username:password@host:5432/database_name
```

#### **JWT Security:**
```env
JWT_SECRET=your_very_secure_jwt_secret_here_make_it_long_and_random
```

#### **Frontend URL:**
```env
FRONTEND_URL=https://oceansmov.vercel.app
```

#### **Cloudflare R2 Configuration:**
```env
CLOUDFLARE_R2_ACCESS_KEY_ID=your_r2_access_key_id
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
CLOUDFLARE_R2_ENDPOINT=https://your_account_id.r2.cloudflarestorage.com
CLOUDFLARE_R2_BUCKET_NAME=movie-web-files
CLOUDFLARE_R2_PUBLIC_URL=https://pub-your_hash.r2.dev
```

### **Step 4: Advanced Settings**

**Health Check Configuration:**
- **Health Check Path**: `/api/test`
- **Health Check Timeout**: 180 seconds

**Auto-Deploy Settings:**
- **Auto-Deploy**: Enabled
- **Branch**: `main`

### **Step 5: Deploy and Test**

1. Click **"Create Web Service"**
2. Monitor the build logs
3. Wait for deployment to complete
4. Test the endpoints

## 🧪 **Testing Your Deployment**

### **Health Check Test:**
```bash
curl https://your-render-app.onrender.com/api/test
```

### **R2 Connection Test:**
```bash
curl https://your-render-app.onrender.com/
```

Should return:
```json
{
  "message": "Movie Web API is running with Cloudflare R2",
  "version": "2.0.0",
  "storage": "Cloudflare R2",
  "endpoints": {
    "test": "/api/test",
    "movies": "/api/movies",
    "users": "/api/users",
    "reviews": "/api/reviews"
  }
}
```

### **API Endpoint Tests:**
```bash
# Test user registration
curl -X POST https://your-render-app.onrender.com/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"testpass123"}'

# Test movie upload (requires authentication)
curl -X POST https://your-render-app.onrender.com/api/movies/1/poster \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "poster=@test-image.jpg"
```

## 🔍 **Troubleshooting Common Issues**

### **Build Failures:**

**Issue**: Dependencies not installing
**Solution**: 
- Check `package.json` has all required dependencies
- Verify Node.js version compatibility
- Clear build cache in Render dashboard

**Issue**: Module not found errors
**Solution**:
- Ensure all dependencies are in `dependencies` not `devDependencies`
- Check import/require statements are correct

### **Runtime Errors:**

**Issue**: Database connection failed
**Solution**:
- Verify `DATABASE_URL` is correct
- Check database is accessible from Render
- Ensure database credentials are valid

**Issue**: R2 connection failed
**Solution**:
- Verify all R2 environment variables are set
- Check R2 credentials are correct
- Ensure bucket exists and is accessible

**Issue**: CORS errors
**Solution**:
- Verify `FRONTEND_URL` is correct
- Check CORS configuration in `app.js`
- Ensure frontend domain is in allowed origins

### **File Upload Issues:**

**Issue**: File uploads failing
**Solution**:
- Check R2 bucket permissions
- Verify file size limits
- Ensure proper content-type headers

**Issue**: Signed URLs not working
**Solution**:
- Verify R2 credentials have proper permissions
- Check bucket public access settings
- Ensure proper URL generation

## 📊 **Monitoring and Logs**

### **View Logs:**
1. Go to your Render service
2. Click **"Logs"** tab
3. Monitor for errors and warnings

### **Key Log Messages to Watch:**
- ✅ `Server running on port 10000`
- ✅ `Database connected successfully`
- ✅ `R2 connection established`
- ❌ `Database connection failed`
- ❌ `R2 upload failed`
- ❌ `JWT verification failed`

## 🔄 **Updating Your Deployment**

### **Automatic Updates:**
- Push changes to your GitHub repository
- Render will automatically redeploy

### **Manual Updates:**
1. Go to Render dashboard
2. Click **"Manual Deploy"**
3. Select branch to deploy

### **Environment Variable Updates:**
1. Go to **Environment** tab
2. Update variables as needed
3. Click **"Save Changes"**
4. Service will restart automatically

## 🎯 **Performance Optimization**

### **Render Free Tier Limits:**
- **Build Time**: 15 minutes
- **Request Timeout**: 30 seconds
- **Sleep After Inactivity**: 15 minutes

### **Optimization Tips:**
- Use efficient database queries
- Implement proper caching
- Optimize file upload sizes
- Use CDN for static assets

## 🔗 **Useful Links**

- [Render Documentation](https://render.com/docs)
- [Render Environment Variables](https://render.com/docs/environment-variables)
- [Render Troubleshooting](https://render.com/docs/troubleshooting)
- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)

## 🎉 **Success Checklist**

- ✅ Service deploys without errors
- ✅ Health check endpoint responds
- ✅ Database connection established
- ✅ R2 connection working
- ✅ File uploads successful
- ✅ Video streaming works
- ✅ Frontend can connect to backend

**Your Render backend is now configured with Cloudflare R2!** 🚀 