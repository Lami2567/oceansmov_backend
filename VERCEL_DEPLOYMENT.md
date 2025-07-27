# 🚀 Vercel Frontend Deployment Guide

## 📋 Deployment Steps

### 1. **Deploy to Vercel**

1. Go to [vercel.com](https://vercel.com) and sign up/login
2. Click "New Project"
3. Import your GitHub repository
4. Configure the project:

**Project Settings:**
- **Framework Preset**: Create React App
- **Root Directory**: `client`
- **Build Command**: `npm run build`
- **Output Directory**: `build`
- **Install Command**: `npm install`

### 2. **Set Environment Variables**

In Vercel dashboard → Project Settings → Environment Variables:

**Production Environment:**
```
REACT_APP_API_URL=https://oceansmov-backend.onrender.com/api
GENERATE_SOURCEMAP=false
```

**Preview Environment (optional):**
```
REACT_APP_API_URL=https://oceansmov-backend.onrender.com/api
GENERATE_SOURCEMAP=false
```

### 3. **Deploy**

Click "Deploy" and wait for the build to complete.

## 🔧 Configuration Details

### Environment Variables Explained

- **`REACT_APP_API_URL`**: Points to your Render backend API
- **`GENERATE_SOURCEMAP=false`**: Reduces build size for production

### API Configuration

The frontend is already configured to use:
- Backend URL: `https://oceansmov-backend.onrender.com/api`
- All API calls will go to your Render backend
- File uploads will go to Wasabi storage

## ✅ Success Indicators

After deployment:
- ✅ Build completes without errors
- ✅ Vercel provides a URL (e.g., `https://your-app.vercel.app`)
- ✅ Frontend loads without console errors
- ✅ API calls work (check Network tab)
- ✅ Login/registration works
- ✅ Movie uploads work

## 🔍 Testing

1. **Visit your Vercel URL**
2. **Open browser dev tools** (F12)
3. **Check Console** for any errors
4. **Check Network tab** for API calls
5. **Test login/registration**
6. **Test movie upload** (if admin)

## 🚨 Troubleshooting

### Common Issues:

**Build fails:**
- Check if all dependencies are in `client/package.json`
- Verify Node.js version compatibility

**API calls fail:**
- Verify `REACT_APP_API_URL` is set correctly
- Check if backend is running on Render
- Test backend directly: `https://oceansmov-backend.onrender.com/api/test`

**CORS errors:**
- Backend CORS should allow Vercel domain
- Check Render environment variables

## 🎯 Final Result

Your app will be accessible at:
- **Frontend**: `https://your-app.vercel.app`
- **Backend API**: `https://oceansmov-backend.onrender.com/api`

The frontend will automatically connect to your backend API! 