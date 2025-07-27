require('dotenv').config();
const cors = require('cors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const { Pool } = require('pg');

const app = express();

// Body size limits for free tier deployment
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// CORS configuration for production
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [
        process.env.FRONTEND_URL || 'https://your-domain.com',
        'https://oceansmov-5jrsz4urx-lanes-projects-cbbebf7b.vercel.app',
        'https://oceansmov.vercel.app',
        'https://*.vercel.app'
      ] 
    : 'http://localhost:3000',
  credentials: true
};
app.use(cors(corsOptions));

// Note: Static file serving removed - files are served directly from Wasabi

// API routes
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
const moviesRouter = require('./routes/movies');
const reviewsRouter = require('./routes/reviews');
const testRouter = require('./routes/test');

app.use('/api', indexRouter);
app.use('/api/users', usersRouter);
app.use('/api/movies', moviesRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api', testRouter);

// API-only backend - frontend is served by Vercel
app.get('/', (req, res) => {
  res.json({ 
    message: 'Movie Web API is running',
    version: '1.0.0',
    endpoints: {
      test: '/api/test',
      movies: '/api/movies',
      users: '/api/users',
      reviews: '/api/reviews'
    }
  });
});

module.exports = app;
