const { s3Client } = require('./config/wasabi');
require('dotenv').config();

async function configureWasabiCORS() {
  console.log('🔧 Configuring Wasabi CORS for Video Playback');
  console.log('='.repeat(50));
  
  try {
    const { PutBucketCorsCommand } = require('@aws-sdk/client-s3');
    
    // CORS configuration for video playback
    const corsConfig = {
      Bucket: process.env.WASABI_BUCKET_NAME,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedHeaders: ['*'],
            AllowedMethods: ['GET', 'HEAD'],
            AllowedOrigins: [
              'https://oceansmov.vercel.app',
              'https://oceansmov-5jrsz4urx-lanes-projects-cbbebf7b.vercel.app',
              'https://*.vercel.app',
              'http://localhost:3000'
            ],
            ExposeHeaders: ['ETag'],
            MaxAgeSeconds: 3000
          }
        ]
      }
    };
    
    console.log('📋 CORS Configuration:');
    console.log('Bucket:', process.env.WASABI_BUCKET_NAME);
    console.log('Allowed Origins:', corsConfig.CORSConfiguration.CORSRules[0].AllowedOrigins);
    
    await s3Client.send(new PutBucketCorsCommand(corsConfig));
    console.log('✅ CORS configuration applied successfully!');
    
    console.log('\n🎯 This should fix video playback issues');
    console.log('📝 The browser can now access video files from Wasabi');
    
  } catch (error) {
    console.error('❌ Error configuring CORS:', error.message);
    console.log('\n🔧 Manual CORS Configuration:');
    console.log('1. Go to Wasabi Console');
    console.log('2. Navigate to your bucket: oceansmov-site-data');
    console.log('3. Go to Settings → CORS');
    console.log('4. Add this CORS rule:');
    console.log(`
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
    `);
  }
}

configureWasabiCORS(); 