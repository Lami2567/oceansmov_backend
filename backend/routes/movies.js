const express = require('express');
const router = express.Router();
const db = require('../db');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { s3Client } = require('../config/wasabi');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { GetObjectCommand } = require('@aws-sdk/client-s3');

// Helper function to upload to Wasabi with fallback
const uploadToWasabi = async (file, key) => {
  // Check if Wasabi is configured
  if (!process.env.WASABI_BUCKET_NAME || !process.env.WASABI_ACCESS_KEY_ID) {
    throw new Error('Wasabi configuration is missing. Please configure Wasabi environment variables on Render.');
  }
  
  const { PutObjectCommand } = require('@aws-sdk/client-s3');
  
  const params = {
    Bucket: process.env.WASABI_BUCKET_NAME,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: 'public-read'
  };
  
  await s3Client.send(new PutObjectCommand(params));
  return `${process.env.WASABI_ENDPOINT}/${process.env.WASABI_BUCKET_NAME}/${key}`;
};

// Test route to verify server is working
router.get('/test', (req, res) => {
  res.json({ message: 'Movies route is working!' });
});

function authenticateJWT(req, res, next) {
  console.log('Auth middleware - headers:', req.headers.authorization ? 'Token present' : 'No token');
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        console.log('JWT verification failed:', err.message);
        return res.sendStatus(403);
      }
      console.log('JWT verified for user:', user.username);
      req.user = user;
      next();
    });
  } else {
    console.log('No valid auth header found');
    res.sendStatus(401);
  }
}

async function requireAdmin(req, res, next) {
  if (req.user && req.user.id) {
    try {
      // Check is_admin from DB
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

// Note: Directory creation removed - files are uploaded directly to Wasabi

// Use memory storage for Wasabi uploads
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
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit for movies (free tier friendly)
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['video/mp4', 'video/avi', 'video/quicktime', 'video/x-matroska', 'video/webm'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed for movies'));
    }
  }
});

// GET /movies - list, search, filter, paginate
router.get('/', async (req, res) => {
  const { 
    search, 
    genre, 
    year, 
    minRating, 
    maxRating,
    sortBy = 'created_at', 
    sortOrder = 'DESC',
    page = 1, 
    limit = 10 
  } = req.query;

  try {
    let query = 'SELECT * FROM movies WHERE 1=1';
    const params = [];
    let paramCount = 0;

    // Search functionality
    if (search) {
      paramCount++;
      params.push(`%${search}%`);
      query += ` AND (title ILIKE $${paramCount} OR description ILIKE $${paramCount})`;
    }

    // Genre filter
    if (genre && genre !== 'all') {
      paramCount++;
      params.push(genre);
      query += ` AND genre = $${paramCount}`;
    }

    // Year filter
    if (year && year !== 'all') {
      paramCount++;
      params.push(parseInt(year));
      query += ` AND release_year = $${paramCount}`;
    }

    // Rating filter
    if (minRating) {
      paramCount++;
      params.push(parseFloat(minRating));
      query += ` AND (SELECT AVG(rating) FROM reviews WHERE movie_id = movies.id) >= $${paramCount}`;
    }

    if (maxRating) {
      paramCount++;
      params.push(parseFloat(maxRating));
      query += ` AND (SELECT AVG(rating) FROM reviews WHERE movie_id = movies.id) <= $${paramCount}`;
    }

    // Sorting
    const allowedSortFields = ['title', 'release_year', 'genre', 'created_at'];
    const allowedSortOrders = ['ASC', 'DESC'];
    
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
    const sortDirection = allowedSortOrders.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';
    
    query += ` ORDER BY ${sortField} ${sortDirection}`;

    // Pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    paramCount++;
    params.push(parseInt(limit));
    paramCount++;
    params.push(offset);
    query += ` LIMIT $${paramCount - 1} OFFSET $${paramCount}`;
    
    console.log('Movies query:', query, 'Params:', params);
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /movies/genres - get all available genres
router.get('/genres', async (req, res) => {
  try {
    const result = await db.query('SELECT DISTINCT genre FROM movies WHERE genre IS NOT NULL AND genre != \'\' ORDER BY genre');
    const genres = result.rows.map(row => row.genre);
    res.json(genres);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /movies/years - get all available years
router.get('/years', async (req, res) => {
  try {
    const result = await db.query('SELECT DISTINCT release_year FROM movies WHERE release_year IS NOT NULL ORDER BY release_year DESC');
    const years = result.rows.map(row => row.release_year);
    res.json(years);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /movies/:id - movie details
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM movies WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Movie not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /movies - create movie (admin only)
router.post('/', authenticateJWT, requireAdmin, async (req, res) => {
  const { title, description, release_year, genre, poster_url, movie_file_url } = req.body;
  if (!title) return res.status(400).json({ message: 'Title is required' });
  
  try {
    const result = await db.query(
      'INSERT INTO movies (title, description, release_year, genre, poster_url, movie_file_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [title, description, release_year, genre, poster_url, movie_file_url]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /movies/:id/poster - upload poster (admin only)
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
      const key = `posters/${req.params.id}_${Date.now()}_${req.file.originalname}`;
      const posterUrl = await uploadToWasabi(req.file, key);
      
      await db.query('UPDATE movies SET poster_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [posterUrl, req.params.id]);
      res.json({ poster_url: posterUrl });
    } catch (err) {
      console.error('Poster upload error:', err);
      
      // Provide specific error messages
      if (err.message.includes('Wasabi configuration is missing')) {
        res.status(500).json({ 
          message: 'File upload service not configured. Please contact administrator.',
          error: 'Wasabi configuration missing on server'
        });
      } else {
        res.status(500).json({ message: 'Upload failed', error: err.message });
      }
    }
  });
});

// POST /movies/:id/movie - upload movie file (admin only)
router.post('/:id/movie', authenticateJWT, requireAdmin, (req, res, next) => {
  console.log('Movie upload route hit:', req.params.id);
  
  movieUpload.single('movieFile')(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File too large. Maximum size is 100MB for movies.' });
      }
      return res.status(400).json({ message: 'File upload error: ' + err.message });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }
    
    console.log('Request file:', req.file);
    console.log('Request body:', req.body);
    
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    
    try {
      const key = `movies/${req.params.id}_${Date.now()}_${req.file.originalname}`;
      const movieUrl = await uploadToWasabi(req.file, key);
      
      await db.query('UPDATE movies SET movie_file_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [movieUrl, req.params.id]);
      res.json({ movie_file_url: movieUrl });
    } catch (err) {
      console.error('Movie upload error:', err);
      
      // Provide specific error messages
      if (err.message.includes('Wasabi configuration is missing')) {
        res.status(500).json({ 
          message: 'File upload service not configured. Please contact administrator.',
          error: 'Wasabi configuration missing on server'
        });
      } else {
        res.status(500).json({ message: 'Upload failed', error: err.message });
      }
    }
  });
});

// PUT /movies/:id - update movie (admin only)
router.put('/:id', authenticateJWT, requireAdmin, async (req, res) => {
  const { title, description, release_year, genre, poster_url, movie_file_url } = req.body;
  
  try {
    const result = await db.query(
      'UPDATE movies SET title = $1, description = $2, release_year = $3, genre = $4, poster_url = $5, movie_file_url = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7 RETURNING *',
      [title, description, release_year, genre, poster_url, movie_file_url, req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Movie not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /movies/:id/video-url - get signed URL for video (authenticated users)
router.get('/:id/video-url', authenticateJWT, async (req, res) => {
  try {
    const movieId = req.params.id;
    
    // Get movie details
    const movieResult = await db.query('SELECT movie_file_url FROM movies WHERE id = $1', [movieId]);
    
    if (movieResult.rows.length === 0) {
      return res.status(404).json({ message: 'Movie not found' });
    }
    
    const movie = movieResult.rows[0];
    
    if (!movie.movie_file_url) {
      return res.status(404).json({ message: 'No video file found for this movie' });
    }
    
    // Extract key from Wasabi URL
    const url = new URL(movie.movie_file_url);
    const key = url.pathname.replace(`/${process.env.WASABI_BUCKET_NAME}/`, '');
    
    // Generate signed URL
    const command = new GetObjectCommand({
      Bucket: process.env.WASABI_BUCKET_NAME,
      Key: key
    });
    
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour
    
    res.json({ 
      signed_url: signedUrl,
      expires_in: 3600
    });
    
  } catch (error) {
    console.error('Error generating signed URL:', error);
    res.status(500).json({ message: 'Failed to generate video URL' });
  }
});

// DELETE /movies/:id - delete movie (admin only)
router.delete('/:id', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    // First, get the movie details to find the file paths
    const movieResult = await db.query('SELECT poster_url, movie_file_url FROM movies WHERE id = $1', [req.params.id]);
    
    if (movieResult.rows.length === 0) {
      return res.status(404).json({ message: 'Movie not found' });
    }
    
    const movie = movieResult.rows[0];
    const deleteFiles = [];
    
    // Delete poster file from Wasabi
    if (movie.poster_url && movie.poster_url.includes('wasabisys.com')) {
      try {
        const posterKey = movie.poster_url.split('/').slice(-1)[0]; // Extract filename
        await s3.deleteObject({
          Bucket: process.env.WASABI_BUCKET_NAME,
          Key: `posters/${posterKey}`
        }).promise();
        console.log(`Deleted poster from Wasabi: ${posterKey}`);
      } catch (fileErr) {
        console.error(`Error deleting poster from Wasabi: ${fileErr.message}`);
      }
    }
    
    // Delete movie file from Wasabi
    if (movie.movie_file_url && movie.movie_file_url.includes('wasabisys.com')) {
      try {
        const movieKey = movie.movie_file_url.split('/').slice(-1)[0]; // Extract filename
        await s3.deleteObject({
          Bucket: process.env.WASABI_BUCKET_NAME,
          Key: `movies/${movieKey}`
        }).promise();
        console.log(`Deleted movie from Wasabi: ${movieKey}`);
      } catch (fileErr) {
        console.error(`Error deleting movie from Wasabi: ${fileErr.message}`);
      }
    }
    
    // Delete the database record
    await db.query('DELETE FROM movies WHERE id = $1', [req.params.id]);
    
    res.json({ 
      message: 'Movie deleted successfully',
      deletedFiles: deleteFiles
    });
  } catch (err) {
    console.error('Error deleting movie:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router; 