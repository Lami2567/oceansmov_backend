const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

// Register
router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ message: 'Username and password required' });
  
  try {
    // Check if user exists
    const userCheck = await db.query('SELECT * FROM users WHERE username = $1', [username]);
    
    if (userCheck.rows.length > 0) {
      return res.status(409).json({ message: 'User already exists' });
    }
    
    // Hash password and create user
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.query('INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id', [username, hashedPassword]);
    
    res.status(201).json({ message: 'User registered' });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ message: 'Username and password required' });
  
  try {
    const result = await db.query('SELECT * FROM users WHERE username = $1', [username]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password);
    
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { id: user.id, username, is_admin: user.is_admin }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );
    res.json({ token });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Google Login - accepts Google access token or ID token
router.post('/google-login', async (req, res) => {
  const { id_token, access_token, email } = req.body;
  
  if (!id_token && !access_token && !email) {
    return res.status(400).json({ message: 'Token or email required for Google login' });
  }
  
  try {
    console.log('[Google Login] Received login request');
    console.log('[Google Login] Has ID token:', !!id_token);
    console.log('[Google Login] Has access token:', !!access_token);
    console.log('[Google Login] Has email:', !!email);
    
    // Use email as username for Google logins
    const username = email || `google_${Date.now()}`;
    
    // Check if user exists
    let userResult = await db.query('SELECT * FROM users WHERE username = $1', [username]);
    
    let user = userResult.rows[0];
    
    // If user doesn't exist, create them
    if (!user) {
      console.log('[Google Login] User not found, creating new user:', username);
      
      // Create a random password for Google users (they won't use it)
      const randomPassword = await bcrypt.hash(Math.random().toString(36), 10);
      
      const createResult = await db.query(
        'INSERT INTO users (username, password, is_admin) VALUES ($1, $2, $3) RETURNING id, username, is_admin',
        [username, randomPassword, false]
      );
      
      user = createResult.rows[0];
      console.log('[Google Login] Created new user:', user.id);
    } else {
      console.log('[Google Login] Existing user found:', user.id);
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username, is_admin: user.is_admin }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );
    
    console.log('[Google Login] Token generated, user:', user.id);
    res.json({ 
      token,
      user: {
        id: user.id,
        username: user.username,
        email: username,
        is_admin: user.is_admin
      }
    });
  } catch (err) {
    console.error('[Google Login] Error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
