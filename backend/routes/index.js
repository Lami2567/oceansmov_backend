var express = require('express');
var router = express.Router();
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

/* GET API status. */
router.get('/', function(req, res, next) {
  res.json({
    message: 'Movie Web API is running',
    version: '2.0.0',
    storage: 'Cloudflare R2',
    endpoints: {
      test: '/api/test',
      movies: '/api/movies',
      users: '/api/users',
      reviews: '/api/reviews'
    },
    timestamp: new Date().toISOString()
  });
});

// Example protected route
router.get('/protected', authenticateJWT, (req, res) => {
  res.json({ message: 'This is a protected route', user: req.user });
});

module.exports = router;
