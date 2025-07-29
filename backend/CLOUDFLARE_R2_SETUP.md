# ☁️ Cloudflare R2 Integration Guide

## 🎯 **Why Cloudflare R2?**
- **No egress fees** - Perfect for video streaming
- **Global CDN** - Fast video delivery worldwide
- **S3-compatible API** - Easy migration from Wasabi
- **Cost-effective** - Better pricing for video content

## 📋 **Prerequisites:**
1. **Cloudflare account** with R2 plan
2. **R2 bucket** created
3. **API tokens** generated

## 🔧 **Setup Steps:**

### **Step 1: Create R2 Bucket**
1. Go to Cloudflare Dashboard
2. Navigate to **R2 Object Storage**
3. Create a new bucket: `movie-web-files`
4. Enable **Public Access** for the bucket

### **Step 2: Generate API Tokens**
1. Go to **My Profile** → **API Tokens**
2. Create **Custom Token** with these permissions:
   - **Zone:Zone:Read** (for your domain)
   - **Account:Cloudflare R2:Edit** (for R2 access)
3. Save the **Access Key ID** and **Secret Access Key**

### **Step 3: Environment Variables**
Add these to your Render environment variables:

```env
# Cloudflare R2 Configuration
CLOUDFLARE_R2_ACCESS_KEY_ID=your_access_key_id
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_secret_access_key
CLOUDFLARE_R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
CLOUDFLARE_R2_BUCKET_NAME=movie-web-files
CLOUDFLARE_R2_PUBLIC_URL=https://pub-<hash>.r2.dev
```

### **Step 4: CORS Configuration**
In your R2 bucket settings, add this CORS rule:

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

## 🚀 **Migration from Wasabi:**

### **Option 1: Gradual Migration**
1. Keep Wasabi for existing files
2. Use R2 for new uploads
3. Migrate old files gradually

### **Option 2: Complete Migration**
1. Download all files from Wasabi
2. Upload to R2
3. Update database URLs
4. Switch to R2 completely

## 📊 **Cost Comparison:**

| Service | Storage | Egress | CDN |
|---------|---------|--------|-----|
| Wasabi | $5.99/TB | $6.99/TB | ❌ |
| Cloudflare R2 | $15/TB | $0 | ✅ |

**For video streaming, R2 is significantly cheaper!**

## 🔄 **Code Changes:**

### **Backend Changes:**
- ✅ R2 configuration file created
- ✅ R2 routes ready for deployment
- ✅ Signed URL support for R2
- ✅ Migration scripts available

### **Frontend Changes:**
- ✅ Video player works with R2 URLs
- ✅ No changes needed for signed URLs

## 🎯 **Deployment Steps:**

1. **Purchase R2 plan** from Cloudflare
2. **Set up bucket** and API tokens
3. **Add environment variables** to Render
4. **Deploy R2 routes** (replace Wasabi routes)
5. **Test file uploads** and video playback
6. **Migrate existing files** (optional)

## 📈 **Benefits After Migration:**

- ✅ **No egress fees** - Unlimited video streaming
- ✅ **Global CDN** - Faster video delivery
- ✅ **Better performance** - Optimized for video
- ✅ **Cost savings** - Especially for high-traffic sites
- ✅ **S3 compatibility** - Easy to use

## 🚨 **Important Notes:**

1. **R2 URLs** use `r2.dev` domain
2. **Public access** must be enabled for direct video URLs
3. **Signed URLs** work for private access
4. **Migration** can be done gradually

**Ready to switch to R2 when you purchase the plan!** 🚀 