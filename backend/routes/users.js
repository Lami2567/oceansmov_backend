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

module.exports = router;
