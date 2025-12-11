-- Drop existing objects if they exist
DROP VIEW IF EXISTS derivative_ip_with_parent_info CASCADE;
DROP VIEW IF EXISTS derivative_ip_stats CASCADE;
DROP FUNCTION IF EXISTS update_derivative_ip_updated_at() CASCADE;
DROP FUNCTION IF EXISTS get_derivative_ip_by_parent(TEXT) CASCADE;
DROP FUNCTION IF EXISTS get_derivative_ip_chain(TEXT) CASCADE;
DROP TABLE IF EXISTS derivative_ip_assets CASCADE;

-- Create derivative_ip_assets table to track all derivative IP registrations
CREATE TABLE derivative_ip_assets (
  id BIGSERIAL PRIMARY KEY,
  
  -- Reference to the sensor data that was registered as derivative
  sensor_data_id INTEGER NOT NULL,
  
  -- Derivative IP details
  derivative_ip_id TEXT NOT NULL UNIQUE, -- The derivative IP asset ID
  parent_ip_id TEXT NOT NULL, -- The parent IP asset this derives from
  
  -- License terms used from parent
  license_terms_id TEXT NOT NULL, -- License terms ID used from parent
  
  -- Creator details
  creator_name TEXT NOT NULL,
  creator_address TEXT NOT NULL, -- Address that created the derivative
  
  -- Royalty configuration
  royalty_recipient TEXT, -- Address receiving royalties (if different from creator)
  royalty_percentage DECIMAL(5, 2), -- Royalty percentage (0-100)
  max_minting_fee DECIMAL(20, 6), -- Maximum minting fee allowed
  max_revenue_share DECIMAL(5, 2), -- Maximum revenue share percentage
  max_rts BIGINT, -- Maximum royalty token supply
  
  -- Transaction details
  transaction_hash TEXT NOT NULL UNIQUE, -- Blockchain transaction hash
  story_explorer_url TEXT, -- Link to view on Story Explorer
  
  -- Metadata
  metadata_url TEXT, -- IPFS URL for IP metadata
  character_file_url TEXT, -- IPFS URL for AI character file
  character_file_hash TEXT, -- Hash of character file
  
  -- NFT details
  nft_token_id TEXT, -- Token ID of the minted NFT
  nft_contract_address TEXT, -- Contract address of the NFT
  nft_metadata_url TEXT, -- IPFS URL for NFT metadata
  
  -- Image details
  image_url TEXT, -- IPFS URL for image
  image_hash TEXT, -- Hash of image
  
  -- Timestamps
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Foreign key constraint
  CONSTRAINT derivative_ip_sensor_data_fkey FOREIGN KEY (sensor_data_id) 
    REFERENCES sensor_data(id) ON DELETE CASCADE
);

-- Create indexes for efficient queries
CREATE INDEX idx_derivative_ip_sensor_data_id ON derivative_ip_assets(sensor_data_id);
CREATE INDEX idx_derivative_ip_derivative_ip_id ON derivative_ip_assets(derivative_ip_id);
CREATE INDEX idx_derivative_ip_parent_ip_id ON derivative_ip_assets(parent_ip_id);
CREATE INDEX idx_derivative_ip_creator_address ON derivative_ip_assets(creator_address);
CREATE INDEX idx_derivative_ip_transaction_hash ON derivative_ip_assets(transaction_hash);
CREATE INDEX idx_derivative_ip_registered_at ON derivative_ip_assets(registered_at DESC);

-- Create trigger function to update updated_at timestamp
CREATE FUNCTION update_derivative_ip_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trigger_update_derivative_ip_updated_at
  BEFORE UPDATE ON derivative_ip_assets
  FOR EACH ROW
  EXECUTE FUNCTION update_derivative_ip_updated_at();

-- Create view for derivative IP with parent information
CREATE VIEW derivative_ip_with_parent_info AS
SELECT 
  d.id,
  d.sensor_data_id,
  d.derivative_ip_id,
  d.parent_ip_id,
  d.license_terms_id,
  d.creator_name,
  d.creator_address,
  d.royalty_recipient,
  d.royalty_percentage,
  d.transaction_hash,
  d.story_explorer_url,
  d.metadata_url,
  d.registered_at,
  -- Derivative sensor data info
  sd.type as derivative_type,
  sd.title as derivative_title,
  sd.location as derivative_location,
  sd.timestamp as derivative_timestamp,
  sd.data as derivative_data,
  -- Parent sensor data info (if parent is also in our system)
  parent_sd.type as parent_type,
  parent_sd.title as parent_title,
  parent_sd.location as parent_location,
  parent_sd.ip_asset_id as parent_ip_confirmed
FROM derivative_ip_assets d
JOIN sensor_data sd ON d.sensor_data_id = sd.id
LEFT JOIN sensor_data parent_sd ON parent_sd.ip_asset_id = d.parent_ip_id
ORDER BY d.registered_at DESC;

-- Create view for derivative IP statistics
CREATE VIEW derivative_ip_stats AS
SELECT 
  COUNT(*) as total_derivatives,
  COUNT(DISTINCT parent_ip_id) as unique_parent_ips,
  COUNT(DISTINCT creator_address) as unique_creators,
  AVG(royalty_percentage) as avg_royalty_percentage,
  MAX(registered_at) as last_registered_at,
  -- Group by parent IP
  parent_ip_id,
  COUNT(*) as derivatives_count,
  ARRAY_AGG(derivative_ip_id ORDER BY registered_at DESC) as derivative_ip_ids,
  ARRAY_AGG(creator_address) as creator_addresses
FROM derivative_ip_assets
GROUP BY parent_ip_id;

-- Function to get all derivatives for a parent IP
CREATE FUNCTION get_derivative_ip_by_parent(parent_ip TEXT)
RETURNS TABLE (
  derivative_id BIGINT,
  derivative_ip_id TEXT,
  sensor_data_id INTEGER,
  dataset_title TEXT,
  creator_name TEXT,
  creator_address TEXT,
  royalty_percentage DECIMAL,
  registered_at TIMESTAMP WITH TIME ZONE,
  transaction_hash TEXT,
  story_explorer_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.derivative_ip_id,
    d.sensor_data_id,
    sd.title,
    d.creator_name,
    d.creator_address,
    d.royalty_percentage,
    d.registered_at,
    d.transaction_hash,
    d.story_explorer_url
  FROM derivative_ip_assets d
  JOIN sensor_data sd ON d.sensor_data_id = sd.id
  WHERE d.parent_ip_id = parent_ip
  ORDER BY d.registered_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get the derivative chain (parent -> children -> grandchildren)
CREATE FUNCTION get_derivative_ip_chain(start_ip_id TEXT)
RETURNS TABLE (
  level INTEGER,
  ip_id TEXT,
  parent_ip_id TEXT,
  creator_name TEXT,
  dataset_title TEXT,
  registered_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE derivative_chain AS (
    -- Base case: start with the given IP (as potential parent)
    SELECT 
      0 as level,
      start_ip_id as ip_id,
      NULL::TEXT as parent_ip_id,
      NULL::TEXT as creator_name,
      NULL::TEXT as dataset_title,
      NULL::TIMESTAMP WITH TIME ZONE as registered_at
    
    UNION ALL
    
    -- Recursive case: find children
    SELECT 
      dc.level + 1,
      d.derivative_ip_id,
      d.parent_ip_id,
      d.creator_name,
      sd.title,
      d.registered_at
    FROM derivative_chain dc
    JOIN derivative_ip_assets d ON d.parent_ip_id = dc.ip_id
    JOIN sensor_data sd ON sd.id = d.sensor_data_id
    WHERE dc.level < 10 -- Prevent infinite recursion
  )
  SELECT * FROM derivative_chain
  WHERE level > 0 OR (level = 0 AND ip_id = start_ip_id)
  ORDER BY level, registered_at;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE derivative_ip_assets IS 'Tracks all derivative IP assets registered from sensor data';
COMMENT ON COLUMN derivative_ip_assets.derivative_ip_id IS 'The IP asset ID of the derivative work';
COMMENT ON COLUMN derivative_ip_assets.parent_ip_id IS 'The parent IP asset that this work derives from';
COMMENT ON COLUMN derivative_ip_assets.license_terms_id IS 'License terms ID used from the parent IP';
COMMENT ON COLUMN derivative_ip_assets.max_rts IS 'Maximum royalty token supply';
COMMENT ON VIEW derivative_ip_with_parent_info IS 'Derivative IPs with parent and sensor data information';
COMMENT ON VIEW derivative_ip_stats IS 'Statistics about derivative IPs grouped by parent';
COMMENT ON FUNCTION get_derivative_ip_by_parent IS 'Get all derivative IPs for a given parent IP';
COMMENT ON FUNCTION get_derivative_ip_chain IS 'Get the full derivative chain starting from an IP';