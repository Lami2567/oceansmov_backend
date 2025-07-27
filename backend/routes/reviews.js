const express = require('express');
const router = express.Router();
const pool = require('../db');
const jwt = require('jsonwebtoken');

function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  } else {
    res.sendStatus(401);
  }
}

async function requireAdmin(req, res, next) {
  if (req.user && req.user.id) {
    try {
      const result = await pool.query('SELECT is_admin FROM users WHERE id = $1', [req.user.id]);
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

// POST /reviews - add review (user)
router.post('/', authenticateJWT, async (req, res) => {
  const { movie_id, rating, comment } = req.body;
  if (!movie_id || !rating) return res.status(400).json({ message: 'Movie and rating required' });
  
  try {
    const result = await pool.query(
      'INSERT INTO reviews (user_id, movie_id, rating, comment) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.id, movie_id, rating, comment]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /movies/:id/reviews - list reviews for a movie (public)
router.get('/movie/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT r.*, u.username FROM reviews r JOIN users u ON r.user_id = u.id WHERE r.movie_id = $1 AND r.approved = true ORDER BY r.created_at DESC',
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /reviews/:id/approve - approve review (admin)
router.put('/:id/approve', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('UPDATE reviews SET approved = true WHERE id = $1 RETURNING *', [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /reviews/:id - delete review (admin)
router.delete('/:id', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM reviews WHERE id = $1', [req.params.id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    res.json({ message: 'Review deleted' });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router; 