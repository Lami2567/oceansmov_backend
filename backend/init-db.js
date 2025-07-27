const db = require('./db');

// Initialize database with tables and sample data
db.serialize(() => {
  console.log('Initializing database...');
  
  // Create tables
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    is_admin BOOLEAN DEFAULT 0
  )`, (err) => {
    if (err) {
      console.error('Error creating users table:', err);
    } else {
      console.log('✅ Users table created/verified');
    }
  });

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
  )`, (err) => {
    if (err) {
      console.error('Error creating movies table:', err);
    } else {
      console.log('✅ Movies table created/verified');
    }
  });

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
  )`, (err) => {
    if (err) {
      console.error('Error creating reviews table:', err);
    } else {
      console.log('✅ Reviews table created/verified');
    }
  });

  // Add sample data
  db.get("SELECT COUNT(*) as count FROM movies", (err, row) => {
    if (err) {
      console.error('Error checking movies:', err);
      return;
    }
    
    if (row.count === 0) {
      console.log('Adding sample movies...');
      
      // Add sample movie with video file
      db.run(`INSERT INTO movies (title, description, release_year, genre, poster_url, movie_file_url)
              VALUES (?, ?, ?, ?, ?, ?)`, [
        'Sample Action Movie',
        'This is a sample action movie for testing video playback functionality',
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

      // Add another sample movie
      db.run(`INSERT INTO movies (title, description, release_year, genre, poster_url, movie_file_url)
              VALUES (?, ?, ?, ?, ?, ?)`, [
        'Test Comedy Film',
        'A hilarious comedy for testing the video player',
        2023,
        'Comedy',
        '/posters/comedy_poster.jpg',
        '/movies/comedy_movie.mp4'
      ], function(err) {
        if (err) {
          console.error('Error adding comedy movie:', err);
        } else {
          console.log('✅ Comedy movie added with ID:', this.lastID);
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
      console.log('Adding sample users...');
      const bcrypt = require('bcryptjs');
      const hashedPassword = bcrypt.hashSync('password123', 10);
      
      // Add admin user
      db.run(`INSERT INTO users (username, password, is_admin)
              VALUES (?, ?, ?)`, [
        'admin',
        hashedPassword,
        1
      ], function(err) {
        if (err) {
          console.error('Error adding admin user:', err);
        } else {
          console.log('✅ Admin user added with ID:', this.lastID);
          console.log('Username: admin, Password: password123');
        }
      });

      // Add regular user
      const userPassword = bcrypt.hashSync('user123', 10);
      db.run(`INSERT INTO users (username, password, is_admin)
              VALUES (?, ?, ?)`, [
        'user',
        userPassword,
        0
      ], function(err) {
        if (err) {
          console.error('Error adding regular user:', err);
        } else {
          console.log('✅ Regular user added with ID:', this.lastID);
          console.log('Username: user, Password: user123');
        }
      });
    } else {
      console.log('Users already exist in database');
    }
  });
});

console.log('Database initialization complete!');
console.log('You can now start the server with: node ./bin/www'); 