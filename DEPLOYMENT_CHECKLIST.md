# 🚀 Deployment Checklist - Vercel + Render + Supabase + Wasabi

## ⚠️ Important: Memory Optimization

**Before deploying, ensure:**
- [ ] `node_modules` folders are removed from Git
- [ ] Build artifacts are cleaned up
- [ ] Repository size is under 100MB

## 📋 Pre-Deployment Setup

### 1. Supabase Database Setup
- [ ] Create Supabase account at [supabase.com](https://supabase.com)
- [ ] Create new project
- [ ] Get database connection string from Settings → Database
- [ ] Test connection: `node backend/test-db.js`

### 2. Wasabi Storage Setup
- [ ] Create Wasabi account at [wasabi.com](https://wasabi.com)
- [ ] Create bucket for movie files
- [ ] Get credentials:
  - [ ] Access Key ID
  - [ ] Secret Access Key
  - [ ] Bucket name
  - [ ] Region (e.g., us-east-1)
- [ ] Test connection: `node backend/test-wasabi.js`

### 3. Environment Variables

#### Backend (.env for Render)
```env
NODE_ENV=production
DATABASE_URL=postgresql://postgres:[password]@[host]:5432/postgres
JWT_SECRET=your_secure_jwt_secret_here
FRONTEND_URL=https://your-vercel-app.vercel.app

# Wasabi Configuration
WASABI_ACCESS_KEY_ID=your_access_key
WASABI_SECRET_ACCESS_KEY=your_secret_key
WASABI_BUCKET_NAME=your_bucket_name
WASABI_REGION=us-east-1
WASABI_ENDPOINT=https://s3.us-east-1.wasabisys.com
```

#### Frontend (.env.production for Vercel)
```env
REACT_APP_API_URL=https://your-render-app.onrender.com/api
GENERATE_SOURCEMAP=false
```

## 🚀 Deployment Steps

### 1. Backend Deployment (Render)
- [ ] Create Render account at [render.com](https://render.com)
- [ ] Create new Web Service
- [ ] Connect GitHub repository
- [ ] Configure:
  - [ ] Build Command: `npm install`
  - [ ] Start Command: `npm start`
  - [ ] Root Directory: `backend`
- [ ] Set environment variables (see above)
- [ ] Deploy

### 2. Frontend Deployment (Vercel)
- [ ] Create Vercel account at [vercel.com](https://vercel.com)
- [ ] Import GitHub repository
- [ ] Configure:
  - [ ] Framework Preset: Create React App
  - [ ] Root Directory: `client`
  - [ ] Build Command: `npm run build`
  - [ ] Output Directory: `build`
- [ ] Set environment variables (see above)
- [ ] Deploy

### 3. Database Migration
- [ ] Run database initialization: `node backend/init-postgres.js`
- [ ] Verify tables are created
- [ ] Test database connection

### 4. File Migration (Optional)
- [ ] Run migration script: `node backend/migrate-to-wasabi.js`
- [ ] Verify files are uploaded to Wasabi
- [ ] Test file access

## ✅ Post-Deployment Verification

### Backend (Render)
- [ ] Health check: `https://your-render-app.onrender.com/api/test`
- [ ] Database connection working
- [ ] File uploads working with Wasabi
- [ ] Environment variables set correctly

### Frontend (Vercel)
- [ ] App loads without errors
- [ ] API calls working
- [ ] Authentication working
- [ ] Video streaming working

### Database (Supabase)
- [ ] Tables created successfully
- [ ] Data migration completed
- [ ] Connection stable

### Storage (Wasabi)
- [ ] File uploads working
- [ ] File downloads working
- [ ] Video streaming working
- [ ] Bucket permissions correct

## 🔧 Testing Checklist

### User Features
- [ ] User registration
- [ ] User login
- [ ] Movie browsing
- [ ] Movie search and filtering
- [ ] Movie watching
- [ ] Review submission
- [ ] Theme switching

### Admin Features
- [ ] Admin login
- [ ] Movie upload (poster + video)
- [ ] Movie management
- [ ] Review moderation
- [ ] User management

### Technical Features
- [ ] File uploads to Wasabi
- [ ] Video streaming from Wasabi
- [ ] Database operations
- [ ] JWT authentication
- [ ] CORS configuration
- [ ] Error handling

## 🛠️ Troubleshooting

### Memory Issues
- [ ] Remove `node_modules` from Git: `git rm -r --cached node_modules`
- [ ] Clean build artifacts: `git rm -r --cached client/build`
- [ ] Check repository size: `git count-objects -vH`

### Common Issues
- [ ] CORS errors → Check FRONTEND_URL in Render
- [ ] Database connection → Verify Supabase connection string
- [ ] File uploads → Check Wasabi credentials and bucket permissions
- [ ] Build errors → Ensure all dependencies are installed

### Debug Commands
```bash
# Test database
node backend/test-db.js

# Test Wasabi
node backend/test-wasabi.js

# Check repository size
git count-objects -vH

# Check logs
# Render: Dashboard → Service → Logs
# Vercel: Dashboard → Project → Deployments
```

## 🔒 Security Checklist

- [ ] JWT secret is secure (32+ characters)
- [ ] Environment variables are not in Git
- [ ] HTTPS enabled on all services
- [ ] CORS properly configured
- [ ] File upload validation working
- [ ] Database connection is secure

## 💰 Cost Optimization

- [ ] Supabase: Free tier (500MB database)
- [ ] Wasabi: $5.99/TB/month
- [ ] Render: Free tier for backend
- [ ] Vercel: Free tier for frontend

## 📞 Support Resources

- [Supabase Docs](https://supabase.com/docs)
- [Wasabi Docs](https://wasabi.com/support/)
- [Render Docs](https://render.com/docs)
- [Vercel Docs](https://vercel.com/docs)

---

**Status**: ⏳ Ready for deployment
**Last Updated**: [Current Date] 