const express = require('express');
const router = express.Router();

// Test endpoint to check environment and database
router.get('/test', async (req, res) => {
  try {
    const db = require('../db');
    
    // Test database connection
    const result = await db.query('SELECT NOW() as current_time');
    
    res.json({
      status: 'success',
      message: 'Backend is running',
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        currentTime: result.rows[0].current_time
      },
      environment: {
        nodeEnv: process.env.NODE_ENV || 'not set',
        databaseUrl: process.env.DATABASE_URL ? 'set' : 'not set',
        frontendUrl: process.env.FRONTEND_URL || 'not set',
        wasabiBucket: process.env.WASABI_BUCKET_NAME || 'not set',
        cloudflareR2Endpoint: process.env.CLOUDFLARE_R2_ENDPOINT ? 'set' : 'not set',
        cloudflareR2Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME ? 'set' : 'not set',
        cloudflareR2AccessKey: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID ? 'set' : 'not set',
        cloudflareR2SecretKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY ? 'set' : 'not set',
        cloudflareR2PublicUrl: process.env.CLOUDFLARE_R2_PUBLIC_URL ? 'set' : 'not set'
      }
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Backend test failed',
      error: error.message,
      environment: {
        nodeEnv: process.env.NODE_ENV || 'not set',
        databaseUrl: process.env.DATABASE_URL ? 'set' : 'not set',
        cloudflareR2Endpoint: process.env.CLOUDFLARE_R2_ENDPOINT ? 'set' : 'not set',
        cloudflareR2Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME ? 'set' : 'not set',
        cloudflareR2AccessKey: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID ? 'set' : 'not set',
        cloudflareR2SecretKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY ? 'set' : 'not set',
        cloudflareR2PublicUrl: process.env.CLOUDFLARE_R2_PUBLIC_URL ? 'set' : 'not set'
      }
    });
  }
});

module.exports = router; 