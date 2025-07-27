// Simple test to verify backend can start
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

console.log('Testing backend dependencies...');

// Test database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection failed:', err.message);
    process.exit(1);
  } else {
    console.log('Database connection successful');
    pool.end();
    console.log('All tests passed! Backend is ready to start.');
    process.exit(0);
  }
}); 