# Movie Web - Deployment Guide

This guide will help you deploy your Movie Web application using:
- **Frontend**: Vercel
- **Backend**: Render
- **Database**: Supabase
- **Storage**: Wasabi

## 🚀 Deployment Setup

### 1. Database Setup (Supabase)

1. **Create Supabase account** at [supabase.com](https://supabase.com)
2. **Create a new project**
3. **Get your database connection string**:
   - Go to Settings → Database
   - Copy the connection string (URI format)
   - It looks like: `postgresql://postgres:[password]@[host]:5432/postgres`

4. **Run the database initialization**:
   ```bash
   # Update your .env file with Supabase connection
   DATABASE_URL=your_supabase_connection_string
   
   # Run the initialization script
   node backend/init-postgres.js
   ```

### 2. Storage Setup (Wasabi)

1. **Create Wasabi account** at [wasabi.com](https://wasabi.com)
2. **Create a bucket** for your movie files
3. **Get your credentials**:
   - Access Key ID
   - Secret Access Key
   - Bucket name
   - Region (e.g., us-east-1)

4. **Install AWS SDK** (Wasabi is S3-compatible):
   ```bash
   cd backend
   npm install aws-sdk
   ```

### 3. Backend Setup (Render)

1. **Create Render account** at [render.com](https://render.com)
2. **Create a new Web Service**:
   - Connect your GitHub repository
   - Set build command: `npm install && npm run build`
   - Set start command: `npm start`
   - Choose the `backend` directory as root

3. **Set environment variables**:
   ```
   NODE_ENV=production
   DATABASE_URL=your_supabase_connection_string
   JWT_SECRET=your_secure_jwt_secret_here
   FRONTEND_URL=https://your-vercel-app.vercel.app
   
   # Wasabi credentials
   WASABI_ACCESS_KEY_ID=your_wasabi_access_key
   WASABI_SECRET_ACCESS_KEY=your_wasabi_secret_key
   WASABI_BUCKET_NAME=your_bucket_name
   WASABI_REGION=your_region
   WASABI_ENDPOINT=https://s3.your_region.wasabisys.com
   ```

4. **Deploy the backend**

### 4. Frontend Setup (Vercel)

1. **Create Vercel account** at [vercel.com](https://vercel.com)
2. **Import your GitHub repository**
3. **Configure the project**:
   - Framework Preset: Create React App
   - Root Directory: `client`
   - Build Command: `npm run build`
   - Output Directory: `build`

4. **Set environment variables**:
   ```
   REACT_APP_API_URL=https://your-render-app.onrender.com/api
   ```

5. **Deploy the frontend**

## 🔧 Configuration Updates

### Update Backend for Wasabi Storage

Create `backend/config/wasabi.js`:
```javascript
const AWS = require('aws-sdk');

const wasabiConfig = {
  accessKeyId: process.env.WASABI_ACCESS_KEY_ID,
  secretAccessKey: process.env.WASABI_SECRET_ACCESS_KEY,
  region: process.env.WASABI_REGION,
  endpoint: process.env.WASABI_ENDPOINT,
  s3ForcePathStyle: true
};

const s3 = new AWS.S3(wasabiConfig);

module.exports = { s3, wasabiConfig };
```

### Update Upload Routes

Update `backend/routes/movies.js` to use Wasabi instead of local storage:

```javascript
const { s3 } = require('../config/wasabi');

// Update poster upload
const uploadToWasabi = async (file, key) => {
  const params = {
    Bucket: process.env.WASABI_BUCKET_NAME,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: 'public-read'
  };
  
  const result = await s3.upload(params).promise();
  return result.Location;
};

// Update movie upload route
router.post('/:id/movie', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const file = req.file;
    const key = `movies/${req.params.id}_${Date.now()}_${file.originalname}`;
    
    const fileUrl = await uploadToWasabi(file, key);
    
    await pool.query(
      'UPDATE movies SET movie_file_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [fileUrl, req.params.id]
    );
    
    res.json({ movie_file_url: fileUrl });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ message: 'Upload failed' });
  }
});
```

## 📁 Environment Variables Summary

### Backend (.env for Render)
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

### Frontend (.env.production for Vercel)
```env
REACT_APP_API_URL=https://your-render-app.onrender.com/api
GENERATE_SOURCEMAP=false
```

## 🔄 Migration Steps

1. **Update database URLs** in your existing data:
   ```sql
   UPDATE movies 
   SET movie_file_url = REPLACE(movie_file_url, '/movie-files/', 'https://your-bucket.s3.region.wasabisys.com/movies/')
   WHERE movie_file_url LIKE '/movie-files/%';
   ```

2. **Upload existing files** to Wasabi:
   - Use the Wasabi console or AWS CLI
   - Maintain the same file structure

## 🚀 Deployment Commands

### 1. Prepare for deployment:
```bash
# Install dependencies
npm run install-all

# Build the frontend
npm run build

# Test locally
npm start
```

### 2. Deploy to Render:
```bash
# Push to GitHub (Render will auto-deploy)
git add .
git commit -m "Configure for Render deployment"
git push origin main
```

### 3. Deploy to Vercel:
- Connect your GitHub repo to Vercel
- Set environment variables
- Deploy automatically

## 🔍 Post-Deployment Checklist

- [ ] Supabase database is connected
- [ ] Wasabi storage is configured
- [ ] Render backend is running
- [ ] Vercel frontend is deployed
- [ ] Environment variables are set correctly
- [ ] File uploads work with Wasabi
- [ ] Video streaming works
- [ ] Authentication works
- [ ] CORS is configured properly

## 🛠️ Troubleshooting

### Common Issues:

1. **CORS errors**: Check FRONTEND_URL in Render environment variables
2. **Database connection**: Verify Supabase connection string
3. **File uploads**: Check Wasabi credentials and bucket permissions
4. **Build errors**: Ensure all dependencies are in package.json

### Debug Commands:

```bash
# Check Render logs
# Go to Render dashboard → Your service → Logs

# Check Vercel deployment
# Go to Vercel dashboard → Your project → Deployments

# Test database connection
node backend/test-db.js

# Test Wasabi connection
node backend/test-wasabi.js
```

## 💰 Cost Optimization

- **Supabase**: Free tier includes 500MB database
- **Wasabi**: $5.99/TB/month (much cheaper than AWS S3)
- **Render**: Free tier for backend
- **Vercel**: Free tier for frontend

## 🔒 Security Notes

1. **Never commit environment variables** to Git
2. **Use strong JWT secrets** (32+ characters)
3. **Set up proper CORS** for your domains
4. **Configure Wasabi bucket policies** for security
5. **Enable HTTPS** on all services

## 📞 Support

- [Supabase Documentation](https://supabase.com/docs)
- [Wasabi Documentation](https://wasabi.com/support/)
- [Render Documentation](https://render.com/docs)
- [Vercel Documentation](https://vercel.com/docs) 