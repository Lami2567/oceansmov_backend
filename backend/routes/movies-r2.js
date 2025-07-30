const express = require('express');
const router = express.Router();
const db = require('../db');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { r2Client } = require('../config/cloudflare-r2');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { GetObjectCommand, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

// Helper function to upload to Cloudflare R2
const uploadToR2 = async (file, key) => {
  try {
    console.log('🔧 uploadToR2 - Starting upload...');
    console.log('📦 Bucket:', process.env.CLOUDFLARE_R2_BUCKET_NAME);
    console.log('🔑 Key:', key);
    console.log('📄 Content-Type:', file.mimetype);
    console.log('📏 File size:', file.buffer.length, 'bytes');
    
    const params = {
      Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read'
    };
    
    console.log('🚀 Sending PutObjectCommand to R2...');
    await r2Client.send(new PutObjectCommand(params));
    console.log('✅ R2 upload command successful');
    
    const publicUrl = `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${key}`;
    console.log('🔗 Generated public URL:', publicUrl);
    
    return publicUrl;
  } catch (error) {
    console.error('❌ uploadToR2 error:', error);
    console.error('🔍 Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      statusCode: error.$metadata?.httpStatusCode
    });
    throw error;
  }
};

// Helper function to generate signed URL for R2
const generateR2SignedUrl = async (key, expiresIn = 3600) => {
  try {
    const command = new GetObjectCommand({
      Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
      Key: key
    });
    
    const signedUrl = await getSignedUrl(r2Client, command, { expiresIn });
    return signedUrl;
  } catch (error) {
    console.error('Error generating R2 signed URL:', error);
    return null;
  }
};

// Authentication middleware
function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        return res.sendStatus(403);
      }
      req.user = user;
      next();
    });
  } else {
    res.sendStatus(401);
  }
}

// Admin middleware
async function requireAdmin(req, res, next) {
  if (req.user && req.user.id) {
    try {
      const result = await db.query('SELECT is_admin FROM users WHERE id = $1', [req.user.id]);
      if (result.rows.length > 0 && result.rows[0].is_admin) {
        next();
      } else {
        res.status(403).json({ message: 'Admin access required' });
      }
    } catch (err) {
      return res.status(500).json({ message: 'Server error' });
    }
  } else {
    res.status(401).json({ message: 'Unauthorized' });
  }
}

// Multer configuration for R2 uploads
const memoryStorage = multer.memoryStorage();

const posterUpload = multer({ 
  storage: memoryStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit for posters
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for posters'));
    }
  }
});

const movieUpload = multer({ 
  storage: memoryStorage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB limit for movies (R2 allows larger files)
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['video/mp4', 'video/avi', 'video/quicktime', 'video/x-matroska', 'video/webm'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed for movies'));
    }
  }
});

// GET /movies - get all movies (public)
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM movies ORDER BY created_at DESC');
    res.json({ data: result.rows });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /movies/genres - get all unique genres for filtering
router.get('/genres', async (req, res) => {
  try {
    const result = await db.query('SELECT DISTINCT genre FROM movies WHERE genre IS NOT NULL AND genre != \'\' ORDER BY genre');
    const genres = result.rows.map(row => row.genre.trim()).filter(genre => genre);
    res.json({ data: genres });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /movies/years - get all unique years for filtering
router.get('/years', async (req, res) => {
  try {
    const result = await db.query('SELECT DISTINCT release_year FROM movies WHERE release_year IS NOT NULL ORDER BY release_year DESC');
    const years = result.rows.map(row => row.release_year).filter(year => year);
    res.json({ data: years });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /movies/:id - get single movie (public)
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM movies WHERE id = $1', [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Movie not found' });
    }
    
    res.json({ data: result.rows[0] });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /movies - create new movie (admin only)
router.post('/', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const { title, description, release_year, genre } = req.body;
    
    const result = await db.query(
      'INSERT INTO movies (title, description, release_year, genre) VALUES ($1, $2, $3, $4) RETURNING *',
      [title, description, release_year, genre]
    );
    
    res.status(201).json({ data: result.rows[0] });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /movies/:id - update movie (admin only)
router.put('/:id', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const { title, description, release_year, genre } = req.body;
    
    const result = await db.query(
      'UPDATE movies SET title = $1, description = $2, release_year = $3, genre = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *',
      [title, description, release_year, genre, req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Movie not found' });
    }
    
    res.json({ data: result.rows[0] });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /movies/:id/poster - upload poster to R2 (admin only)
router.post('/:id/poster', authenticateJWT, requireAdmin, (req, res, next) => {
  posterUpload.single('poster')(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File too large. Maximum size is 5MB for posters.' });
      }
      return res.status(400).json({ message: 'File upload error: ' + err.message });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }
    
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    
    try {
      console.log('📤 Starting R2 poster upload...');
      console.log('📁 File info:', {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      });
      console.log('🎬 Movie ID:', req.params.id);
      
      const key = `posters/${req.params.id}_${Date.now()}_${req.file.originalname}`;
      console.log('🔑 R2 Key:', key);
      
      const posterUrl = await uploadToR2(req.file, key);
      console.log('✅ R2 upload successful, URL:', posterUrl);
      
      await db.query('UPDATE movies SET poster_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [posterUrl, req.params.id]);
      console.log('✅ Database updated successfully');
      
      res.json({ poster_url: posterUrl });
    } catch (err) {
      console.error('❌ R2 poster upload error:', err);
      console.error('🔍 Error stack:', err.stack);
      console.error('📋 Error details:', {
        name: err.name,
        message: err.message,
        code: err.code
      });
      res.status(500).json({ message: 'Upload failed', error: err.message });
    }
  });
});

// POST /movies/:id/movie - upload movie file to R2 (admin only)
router.post('/:id/movie', authenticateJWT, requireAdmin, (req, res, next) => {
  movieUpload.single('movieFile')(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File too large. Maximum size is 500MB for movies.' });
      }
      return res.status(400).json({ message: 'File upload error: ' + err.message });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }
    
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    
    try {
      const key = `movies/${req.params.id}_${Date.now()}_${req.file.originalname}`;
      const movieUrl = await uploadToR2(req.file, key);
      
      await db.query('UPDATE movies SET movie_file_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [movieUrl, req.params.id]);
      res.json({ movie_file_url: movieUrl });
    } catch (err) {
      console.error('R2 movie upload error:', err);
      res.status(500).json({ message: 'Upload failed', error: err.message });
    }
  });
});

// GET /movies/:id/video-url - get signed URL for R2 video (authenticated users)
router.get('/:id/video-url', authenticateJWT, async (req, res) => {
  try {
    const movieId = req.params.id;
    
    const movieResult = await db.query('SELECT movie_file_url FROM movies WHERE id = $1', [movieId]);
    
    if (movieResult.rows.length === 0) {
      return res.status(404).json({ message: 'Movie not found' });
    }
    
    const movie = movieResult.rows[0];
    
    if (!movie.movie_file_url) {
      return res.status(404).json({ message: 'No video file found for this movie' });
    }
    
    // Extract key from R2 URL
    const url = new URL(movie.movie_file_url);
    const key = url.pathname.replace(`/${process.env.CLOUDFLARE_R2_BUCKET_NAME}/`, '');
    
    const signedUrl = await generateR2SignedUrl(key, 3600); // 1 hour
    
    res.json({ 
      signed_url: signedUrl,
      expires_in: 3600
    });
    
  } catch (error) {
    console.error('Error generating R2 signed URL:', error);
    res.status(500).json({ message: 'Failed to generate video URL' });
  }
});

// DELETE /movies/:id - delete movie and files from R2 (admin only)
router.delete('/:id', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const movieResult = await db.query('SELECT poster_url, movie_file_url FROM movies WHERE id = $1', [req.params.id]);
    
    if (movieResult.rows.length === 0) {
      return res.status(404).json({ message: 'Movie not found' });
    }
    
    const movie = movieResult.rows[0];
    
    // Delete poster file from R2
    if (movie.poster_url && movie.poster_url.includes('r2.dev')) {
      try {
        const posterKey = movie.poster_url.split('/').slice(-1)[0];
        await r2Client.send(new DeleteObjectCommand({
          Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
          Key: `posters/${posterKey}`
        }));
        console.log(`Deleted poster from R2: ${posterKey}`);
      } catch (fileErr) {
        console.error(`Error deleting poster from R2: ${fileErr.message}`);
      }
    }
    
    // Delete movie file from R2
    if (movie.movie_file_url && movie.movie_file_url.includes('r2.dev')) {
      try {
        const movieKey = movie.movie_file_url.split('/').slice(-1)[0];
        await r2Client.send(new DeleteObjectCommand({
          Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
          Key: `movies/${movieKey}`
        }));
        console.log(`Deleted movie from R2: ${movieKey}`);
      } catch (fileErr) {
        console.error(`Error deleting movie from R2: ${fileErr.message}`);
      }
    }
    
    // Delete from database
    await db.query('DELETE FROM movies WHERE id = $1', [req.params.id]);
    res.json({ message: 'Movie deleted successfully' });
    
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router; 