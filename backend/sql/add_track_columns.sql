-- Add missing columns to tracks table
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS play_count INT DEFAULT 0;
