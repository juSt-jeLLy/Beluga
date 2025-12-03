-- Create sensor_data table for storing agricultural IoT data
CREATE TABLE sensor_data (
  id BIGSERIAL PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  data TEXT NOT NULL,
  location VARCHAR(255),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  sensor_health VARCHAR(10) NOT NULL,
  source VARCHAR(50) NOT NULL, -- 'gmail' or 'blynk'
  raw_email_id VARCHAR(255), -- Gmail message ID for reference
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on timestamp for faster queries
CREATE INDEX idx_sensor_data_timestamp ON sensor_data(timestamp DESC);

-- Create index on type for filtering by sensor type
CREATE INDEX idx_sensor_data_type ON sensor_data(type);

-- Create index on location for location-based queries
CREATE INDEX idx_sensor_data_location ON sensor_data(location);

-- Create index on source for filtering by data source
CREATE INDEX idx_sensor_data_source ON sensor_data(source);

-- Create a composite index for common queries
CREATE INDEX idx_sensor_data_type_timestamp ON sensor_data(type, timestamp DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE sensor_data ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to read all sensor data
CREATE POLICY "Allow authenticated users to read sensor data"
  ON sensor_data
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policy to allow authenticated users to insert sensor data
CREATE POLICY "Allow authenticated users to insert sensor data"
  ON sensor_data
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policy to allow public (anon) users to read sensor data
-- Remove this if you want to restrict access to authenticated users only
CREATE POLICY "Allow public read access to sensor data"
  ON sensor_data
  FOR SELECT
  TO anon
  USING (true);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_sensor_data_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER set_sensor_data_updated_at
  BEFORE UPDATE ON sensor_data
  FOR EACH ROW
  EXECUTE FUNCTION update_sensor_data_updated_at();

-- Create a view for latest sensor readings by type
CREATE VIEW latest_sensor_readings AS
SELECT DISTINCT ON (type, location)
  id,
  type,
  title,
  data,
  location,
  timestamp,
  sensor_health,
  source,
  created_at
FROM sensor_data
ORDER BY type, location, timestamp DESC;

-- Comment the table and columns for documentation
COMMENT ON TABLE sensor_data IS 'Stores agricultural sensor data from IoT devices';
COMMENT ON COLUMN sensor_data.type IS 'Type of sensor: temperature, sunlight, moisture, growth, rainfall';
COMMENT ON COLUMN sensor_data.title IS 'Human-readable title for the sensor reading';
COMMENT ON COLUMN sensor_data.data IS 'Main sensor data content';
COMMENT ON COLUMN sensor_data.location IS 'Geographic location of the sensor';
COMMENT ON COLUMN sensor_data.timestamp IS 'Time when the sensor reading was taken';
COMMENT ON COLUMN sensor_data.sensor_health IS 'Health status of the sensor (e.g., 96%)';
COMMENT ON COLUMN sensor_data.source IS 'Data source: gmail or blynk';
COMMENT ON COLUMN sensor_data.raw_email_id IS 'Reference to original Gmail message ID if applicable';