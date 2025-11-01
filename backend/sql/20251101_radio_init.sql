-- Radio stations schema
CREATE TABLE IF NOT EXISTS radio_stations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT,
  stream_url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_radio_active ON radio_stations(is_active);
CREATE INDEX IF NOT EXISTS idx_radio_name ON radio_stations(name);
