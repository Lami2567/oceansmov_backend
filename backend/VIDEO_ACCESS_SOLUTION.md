# 🎬 Video Access Solution Guide

## 🚨 **Issue Identified:**
Your Wasabi account has **public access disabled** at the account level, causing 403 errors when trying to access video files.

## 🔧 **Solution 1: Enable Public Access (Recommended)**

### **Step 1: Contact Wasabi Support**
**Email:** support@wasabi.com
**Subject:** "Enable Public Access for Account"

**Message:**
```
Hi,

I need to enable public access for objects in my Wasabi account.
Account details: [your account info]
Bucket: oceansmov-site-data

Please enable public object access so I can serve video files directly to users.

Thank you!
```

### **Step 2: After Public Access is Enabled**
1. Configure CORS in Wasabi Console:
   - Go to Bucket Settings → CORS
   - Add this rule:
   ```json
   {
     "AllowedHeaders": ["*"],
     "AllowedMethods": ["GET", "HEAD"],
     "AllowedOrigins": [
       "https://oceansmov.vercel.app",
       "https://*.vercel.app",
       "http://localhost:3000"
     ],
     "ExposeHeaders": ["ETag"],
     "MaxAgeSeconds": 3000
   }
   ```

## 🔐 **Solution 2: Signed URLs (Temporary)**

I've added a new API endpoint that generates signed URLs for video access:

### **API Endpoint:**
```
GET /api/movies/:id/video-url
```

### **Usage:**
1. **Frontend calls this endpoint** when loading a video
2. **Backend generates a signed URL** (valid for 1 hour)
3. **Frontend uses the signed URL** for video playback

### **Frontend Implementation:**
```javascript
// In your video player component
const fetchVideoUrl = async (movieId) => {
  try {
    const response = await fetch(`/api/movies/${movieId}/video-url`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();
    return data.signed_url;
  } catch (error) {
    console.error('Error fetching video URL:', error);
  }
};
```

## 🎯 **Recommended Action:**

1. **Contact Wasabi Support** to enable public access
2. **Wait for confirmation** from support
3. **Configure CORS** settings
4. **Test video playback**

## 📋 **Current Status:**
- ✅ Backend configured for signed URLs
- ✅ API endpoint ready
- ❌ Public access disabled (contacting support)
- ❌ CORS not configured (waiting for public access)

## 🚀 **After Support Enables Public Access:**
1. Configure CORS in Wasabi Console
2. Test video URLs directly
3. Deploy updated frontend if needed
4. Video playback should work perfectly!

**The signed URL solution is ready as a backup, but public access is the cleaner long-term solution.** 