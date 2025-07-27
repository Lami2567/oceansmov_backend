const db = require('./db');

// Update the movie to use the correct video file
db.run(`UPDATE movies SET 
  title = ?, 
  description = ?, 
  release_year = ?, 
  genre = ?, 
  poster_url = ?, 
  movie_file_url = ?
  WHERE id = 1`, [
  'Real Test Movie',
  'This is a real movie file for testing video playback functionality',
  2024,
  'Action',
  '/posters/poster_10_1753489431358.jpg',
  '/movies/movie_10_1753489431419.mp4'
], function(err) {
  if (err) {
    console.error('Error updating movie:', err);
  } else {
    console.log('✅ Movie updated successfully!');
    console.log('Video URL: /movies/movie_10_1753489431419.mp4');
    console.log('Poster URL: /posters/poster_10_1753489431358.jpg');
  }
  
  // Close the database connection
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    } else {
      console.log('Database connection closed');
    }
  });
}); 