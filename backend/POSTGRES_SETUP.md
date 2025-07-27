# PostgreSQL Setup Guide

This guide will help you switch from SQLite to PostgreSQL while preserving your existing data.

## Prerequisites

1. **Install PostgreSQL** on your system:
   - **Windows**: Download from https://www.postgresql.org/download/windows/
   - **macOS**: `brew install postgresql`
   - **Linux**: `sudo apt-get install postgresql postgresql-contrib`

2. **Start PostgreSQL service**:
   - **Windows**: It should start automatically after installation
   - **macOS**: `brew services start postgresql`
   - **Linux**: `sudo systemctl start postgresql`

## Setup Steps

### 1. Create PostgreSQL Database

1. Open a terminal/command prompt
2. Connect to PostgreSQL as the postgres user:
   ```bash
   # Windows (if you set a password during installation)
   psql -U postgres -h localhost
   
   # macOS/Linux
   sudo -u postgres psql
   ```

3. Create the database and user:
   ```sql
   CREATE DATABASE movie_web;
   CREATE USER movie_user WITH PASSWORD 'your_password_here';
   GRANT ALL PRIVILEGES ON DATABASE movie_web TO movie_user;
   \q
   ```

### 2. Create Environment File

Create a `.env` file in the `backend` directory with the following content:

```env
DATABASE_URL=postgresql://movie_user:your_password_here@localhost:5432/movie_web
JWT_SECRET=your_jwt_secret_key_here
NODE_ENV=development
```

**Important**: Replace `your_password_here` with the password you set for the movie_user, and `your_jwt_secret_key_here` with a secure random string.

### 3. Initialize PostgreSQL Database

Run the initialization script to create tables and migrate data:

```bash
cd backend
node init-postgres.js
```

This script will:
- Create the necessary tables in PostgreSQL
- Migrate all existing data from SQLite to PostgreSQL
- Preserve all your movies, users, and reviews

### 4. Test the Connection

Start your backend server:

```bash
cd backend
npm start
```

You should see "Connected to PostgreSQL database" in the console.

### 5. Verify Data Migration

Check that your data was migrated correctly by:
1. Opening your application in the browser
2. Logging in with your existing admin account
3. Verifying that all movies and reviews are still present

## Troubleshooting

### Connection Issues
- Make sure PostgreSQL is running
- Verify the connection string in your `.env` file
- Check that the database and user exist
- Ensure the password is correct

### Migration Issues
- If the migration fails, you can run `node init-postgres.js` again
- The script uses `ON CONFLICT DO NOTHING` to prevent duplicate data
- Check the console output for specific error messages

### Permission Issues
- Make sure the movie_user has proper permissions on the database
- You may need to run: `GRANT ALL ON ALL TABLES IN SCHEMA public TO movie_user;`

## Rollback (if needed)

If you need to switch back to SQLite:
1. Your original `movie_web.db` file is still intact
2. Simply change `backend/db.js` back to use SQLite
3. Update the routes to use SQLite syntax

## Benefits of PostgreSQL

- Better performance for complex queries
- ACID compliance
- Better support for concurrent users
- More robust data integrity
- Better scalability 