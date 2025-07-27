const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create database file in the backend directory
const dbPath = path.join(__dirname, 'movie_web.db');

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
    initDatabase();
  }
});

function initDatabase() {
  // Create tables
  db.serialize(() => {
    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      is_admin BOOLEAN DEFAULT 0
    )`);

    // Movies table
    db.run(`CREATE TABLE IF NOT EXISTS movies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      release_year INTEGER,
      genre TEXT,
      poster_url TEXT,
      movie_file_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Reviews table
    db.run(`CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      movie_id INTEGER,
      rating INTEGER CHECK (rating >= 1 AND rating <= 5),
      comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      approved BOOLEAN DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (movie_id) REFERENCES movies (id) ON DELETE CASCADE
    )`);

    // Add sample data
    db.get("SELECT COUNT(*) as count FROM movies", (err, row) => {
      if (err) {
        console.error('Error checking movies:', err);
        return;
      }
      
      if (row.count === 0) {
        console.log('Adding sample movie...');
        db.run(`INSERT INTO movies (title, description, release_year, genre, poster_url, movie_file_url)
                VALUES (?, ?, ?, ?, ?, ?)`, [
          'Sample Movie',
          'This is a sample movie for testing video playback',
          2024,
          'Action',
          '/posters/sample_poster.jpg',
          '/movies/sample_movie.mp4'
        ], function(err) {
          if (err) {
            console.error('Error adding sample movie:', err);
          } else {
            console.log('✅ Sample movie added with ID:', this.lastID);
          }
        });
      } else {
        console.log('Movies already exist in database');
      }
    });

    // Add sample user
    db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
      if (err) {
        console.error('Error checking users:', err);
        return;
      }
      
      if (row.count === 0) {
        console.log('Adding sample user...');
        const bcrypt = require('bcryptjs');
        const hashedPassword = bcrypt.hashSync('password123', 10);
        
        db.run(`INSERT INTO users (username, password, is_admin)
                VALUES (?, ?, ?)`, [
          'admin',
          hashedPassword,
          1
        ], function(err) {
          if (err) {
            console.error('Error adding sample user:', err);
          } else {
            console.log('✅ Sample admin user added with ID:', this.lastID);
            console.log('Username: admin, Password: password123');
          }
        });
      } else {
        console.log('Users already exist in database');
      }
    });
  });
}

module.exports = db; 