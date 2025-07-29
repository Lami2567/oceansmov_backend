# 🚀 Render Deployment Checklist

## ✅ Pre-Deployment Checklist

### **Environment Variables (Already Done)**
- [x] `NODE_ENV=production`
- [x] `PORT=10000`
- [x] `DATABASE_URL` (your PostgreSQL connection string)
- [x] `JWT_SECRET` (secure random string)
- [x] `FRONTEND_URL=https://oceansmov.vercel.app`
- [x] `CLOUDFLARE_R2_ACCESS_KEY_ID`
- [x] `CLOUDFLARE_R2_SECRET_ACCESS_KEY`
- [x] `CLOUDFLARE_R2_ENDPOINT`
- [x] `CLOUDFLARE_R2_BUCKET_NAME`
- [x] `CLOUDFLARE_R2_PUBLIC_URL`

### **Code Configuration**
- [x] `app.js` updated to use R2 routes
- [x] R2 configuration in `config/cloudflare-r2.js`
- [x] R2 routes in `routes/movies-r2.js`
- [x] `package.json` has all required dependencies
- [x] `Procfile` configured correctly

### **Cloudflare R2 Setup**
- [x] R2 bucket created
- [x] API tokens generated
- [x] Public access enabled
- [x] CORS configured (if needed)

## 🚀 Deployment Steps

### **Step 1: Create Render Web Service**
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure settings:
   - **Name**: `movie-web-backend-r2`
   - **Environment**: `Node`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

### **Step 2: Set Environment Variables**
Add all the environment variables listed above in Render dashboard → Environment tab.

### **Step 3: Configure Advanced Settings**
- **Health Check Path**: `/api/test`
- **Health Check Timeout**: 180 seconds
- **Auto-Deploy**: Enabled

### **Step 4: Deploy**
Click **"Create Web Service"** and monitor the build logs.

## 🧪 Post-Deployment Testing

### **Health Check**
```bash
curl https://your-app.onrender.com/api/test
```

### **API Status**
```bash
curl https://your-app.onrender.com/
```

Should return:
```json
{
  "message": "Movie Web API is running with Cloudflare R2",
  "version": "2.0.0",
  "storage": "Cloudflare R2"
}
```

### **Test File Upload**
1. Register a user
2. Login to get JWT token
3. Test poster upload
4. Test video upload
5. Test video playback

## 🔍 Troubleshooting

### **Build Issues**
- Check Render logs for specific errors
- Verify all dependencies are in `package.json`
- Ensure Node.js version compatibility

### **Runtime Issues**
- Check environment variables are set correctly
- Verify database connection
- Test R2 credentials

### **File Upload Issues**
- Check R2 bucket permissions
- Verify CORS configuration
- Test signed URL generation

## 📊 Success Indicators

- ✅ Build completes without errors
- ✅ Health check endpoint responds
- ✅ Database connection established
- ✅ R2 connection working
- ✅ File uploads successful
- ✅ Video streaming works
- ✅ Frontend can connect to backend

## 🔗 Useful Links

- [Render Dashboard](https://dashboard.render.com)
- [Cloudflare R2 Dashboard](https://dash.cloudflare.com)
- [R2 Configuration Guide](R2_CONFIGURATION_GUIDE.md)
- [Render Configuration Guide](RENDER_R2_CONFIGURATION.md)

---

**🎉 Ready to deploy! All configurations are in place.** 