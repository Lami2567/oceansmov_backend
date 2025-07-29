# ☁️ Cloudflare R2 Configuration Guide

## 🎯 **Complete Setup for Movie Web App**

This guide will help you configure Cloudflare R2 for your movie web application. R2 is perfect for video hosting because it has **no egress fees** and provides global CDN access.

## 📋 **Prerequisites**

1. **Cloudflare Account** - Sign up at [cloudflare.com](https://cloudflare.com)
2. **R2 Plan** - Purchase R2 storage (starts at $15/month for 1TB)
3. **Domain** (optional but recommended)

## 🔧 **Step-by-Step Setup**

### **Step 1: Enable R2 in Cloudflare Dashboard**

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **R2 Object Storage**
3. Click **"Get started with R2"**
4. Choose your plan and complete payment

### **Step 2: Create R2 Bucket**

1. In R2 dashboard, click **"Create bucket"**
2. Enter bucket name: `movie-web-files`
3. Choose region: **Auto** (recommended for global access)
4. Click **"Create bucket"**

### **Step 3: Configure Bucket Settings**

1. Click on your bucket name
2. Go to **Settings** tab
3. Enable **"Public access"** (required for direct video URLs)
4. Copy the **Public URL** (format: `https://pub-<hash>.r2.dev`)

### **Step 4: Generate API Tokens**

1. Go to **My Profile** → **API Tokens**
2. Click **"Create Token"**
3. Choose **"Custom token"**
4. Add these permissions:
   - **Zone:Zone:Read** (for your domain)
   - **Account:Cloudflare R2:Edit** (for R2 access)
5. Set **Account Resources** to your account
6. Click **"Continue to summary"** and **"Create Token"**
7. **Save the Access Key ID and Secret Access Key**

### **Step 5: Get Your Account ID**

1. In Cloudflare dashboard, look at the URL
2. Your account ID is in the URL: `https://dash.cloudflare.com/<account-id>`
3. Or go to **My Profile** → **Account Home** to see it

### **Step 6: Configure Environment Variables**

Add these to your **Render environment variables**:

```env
# Cloudflare R2 Configuration
CLOUDFLARE_R2_ACCESS_KEY_ID=your_access_key_id_here
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_secret_access_key_here
CLOUDFLARE_R2_ENDPOINT=https://your_account_id.r2.cloudflarestorage.com
CLOUDFLARE_R2_BUCKET_NAME=movie-web-files
CLOUDFLARE_R2_PUBLIC_URL=https://pub-your_hash.r2.dev
```

### **Step 7: Configure CORS (Optional)**

If you need CORS for direct browser uploads, add this to your bucket settings:

```json
{
  "AllowedHeaders": ["*"],
  "AllowedMethods": ["GET", "HEAD", "PUT", "POST", "DELETE"],
  "AllowedOrigins": [
    "https://oceansmov.vercel.app",
    "https://*.vercel.app",
    "http://localhost:3000"
  ],
  "ExposeHeaders": ["ETag"],
  "MaxAgeSeconds": 3000
}
```

## 🧪 **Testing Your Setup**

### **Local Testing**

Run the setup script to verify everything works:

```bash
cd backend
node setup-r2.js
```

This will:
- ✅ Check environment variables
- ✅ Test R2 connection
- ✅ Verify bucket access
- ✅ Test file upload/download
- ✅ Validate public URL

### **Deployment Testing**

1. Deploy your backend to Render
2. Test the API endpoints:
   - `POST /api/movies/:id/poster` - Upload poster
   - `POST /api/movies/:id/movie` - Upload video
   - `GET /api/movies/:id/video-url` - Get signed URL

## 🚀 **Migration from Wasabi (Optional)**

If you have existing files in Wasabi, you can migrate them:

```bash
cd backend
node migrate-to-r2.js
```

This will:
- Download all files from Wasabi
- Upload them to R2
- Update database URLs
- Preserve all metadata

## 📊 **Cost Comparison**

| Service | Storage | Egress | CDN | Monthly Cost |
|---------|---------|--------|-----|--------------|
| Wasabi | $5.99/TB | $6.99/TB | ❌ | $12.98/TB |
| Cloudflare R2 | $15/TB | $0 | ✅ | $15/TB |

**For video streaming, R2 is actually cheaper!** No egress fees mean unlimited video views.

## 🔧 **Code Changes Made**

### **Backend Changes:**
- ✅ Updated `app.js` to use R2 routes
- ✅ R2 configuration in `config/cloudflare-r2.js`
- ✅ R2 routes in `routes/movies-r2.js`
- ✅ Setup script in `setup-r2.js`
- ✅ Migration script in `migrate-to-r2.js`

### **Frontend Changes:**
- ✅ No changes needed - works with R2 URLs
- ✅ Video player supports R2 signed URLs
- ✅ File uploads work with R2

## 🎯 **Benefits After Migration**

- ✅ **No egress fees** - Unlimited video streaming
- ✅ **Global CDN** - Faster video delivery worldwide
- ✅ **Better performance** - Optimized for video content
- ✅ **Cost savings** - Especially for high-traffic sites
- ✅ **S3 compatibility** - Easy to use and maintain

## 🚨 **Important Notes**

1. **R2 URLs** use `r2.dev` domain for public access
2. **Signed URLs** work for private access with expiration
3. **File size limits** - R2 supports files up to 5TB
4. **Migration** can be done gradually or all at once
5. **Backup** - Keep Wasabi data until you verify R2 works

## 🔗 **Useful Links**

- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [R2 API Reference](https://developers.cloudflare.com/r2/api/)
- [R2 Pricing](https://developers.cloudflare.com/r2/platform/pricing/)
- [API Tokens Guide](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/)

## 🎉 **Next Steps**

1. **Run the setup script** to verify configuration
2. **Deploy to Render** with new environment variables
3. **Test file uploads** from your frontend
4. **Verify video playback** works correctly
5. **Migrate existing files** (optional)

**Your movie web app is now ready for Cloudflare R2!** 🚀 