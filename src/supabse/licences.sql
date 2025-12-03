
DROP VIEW IF EXISTS recent_license_activity CASCADE;
DROP VIEW IF EXISTS address_license_holdings CASCADE;
DROP VIEW IF EXISTS dataset_license_stats CASCADE;
DROP FUNCTION IF EXISTS update_licenses_updated_at() CASCADE;
DROP FUNCTION IF EXISTS get_dataset_license_stats(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS get_address_licenses(TEXT) CASCADE;
DROP TABLE IF EXISTS licenses CASCADE;

-- Create licenses table to track all minted licenses
CREATE TABLE licenses (
  id BIGSERIAL PRIMARY KEY,
  
  -- Reference to the sensor data that was licensed
  sensor_data_id INTEGER NOT NULL,
  
  -- License details
  license_token_ids TEXT[] NOT NULL, -- Array of license token IDs (bigint as strings)
  amount INTEGER NOT NULL, -- Number of licenses minted in this transaction
  
  -- IP and license terms info
  ip_asset_id TEXT NOT NULL, -- The IP asset that was licensed
  license_terms_id TEXT NOT NULL, -- The license terms ID used
  
  -- Transaction details
  transaction_hash TEXT NOT NULL UNIQUE, -- Blockchain transaction hash
  story_explorer_tx_url TEXT, -- Link to view transaction on Story Explorer
  
  -- Minter details
  minter_address TEXT NOT NULL, -- Address that minted the license
  receiver_address TEXT NOT NULL, -- Address that received the license tokens
  
  -- Financial details
  minting_fee_paid DECIMAL(20, 6), -- Total fee paid for minting (amount * unit fee)
  unit_minting_fee DECIMAL(20, 6), -- Fee per license at time of minting
  revenue_share_percentage DECIMAL(5, 2), -- Revenue share % at time of minting
  
  -- Timestamps
  minted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Foreign key constraint
  CONSTRAINT licenses_sensor_data_id_fkey FOREIGN KEY (sensor_data_id) 
    REFERENCES sensor_data(id) ON DELETE CASCADE
);

-- Create indexes for efficient queries
CREATE INDEX idx_licenses_sensor_data_id ON licenses(sensor_data_id);
CREATE INDEX idx_licenses_ip_asset_id ON licenses(ip_asset_id);
CREATE INDEX idx_licenses_minter_address ON licenses(minter_address);
CREATE INDEX idx_licenses_receiver_address ON licenses(receiver_address);
CREATE INDEX idx_licenses_transaction_hash ON licenses(transaction_hash);
CREATE INDEX idx_licenses_minted_at ON licenses(minted_at DESC);

-- Create trigger function to update updated_at timestamp
CREATE FUNCTION update_licenses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trigger_update_licenses_updated_at
  BEFORE UPDATE ON licenses
  FOR EACH ROW
  EXECUTE FUNCTION update_licenses_updated_at();

-- Create view for license statistics per dataset
CREATE VIEW dataset_license_stats AS
SELECT 
  sd.id as sensor_data_id,
  sd.ip_asset_id,
  sd.type,
  sd.title,
  sd.location,
  COUNT(DISTINCT l.id) as total_license_transactions,
  COALESCE(SUM(l.amount), 0) as total_licenses_minted,
  COUNT(DISTINCT l.minter_address) as unique_minters,
  COUNT(DISTINCT l.receiver_address) as unique_license_holders,
  COALESCE(SUM(l.minting_fee_paid), 0) as total_revenue_generated,
  MAX(l.minted_at) as last_minted_at
FROM sensor_data sd
LEFT JOIN licenses l ON sd.id = l.sensor_data_id
WHERE sd.ip_asset_id IS NOT NULL
GROUP BY sd.id, sd.ip_asset_id, sd.type, sd.title, sd.location;

-- Create view for licenses held by each address
CREATE VIEW address_license_holdings AS
SELECT 
  l.receiver_address,
  COUNT(DISTINCT l.sensor_data_id) as unique_datasets_licensed,
  SUM(l.amount) as total_licenses_held,
  SUM(l.minting_fee_paid) as total_spent,
  ARRAY_AGG(DISTINCT sd.ip_asset_id) as licensed_ip_assets,
  MAX(l.minted_at) as last_license_acquired
FROM licenses l
JOIN sensor_data sd ON l.sensor_data_id = sd.id
GROUP BY l.receiver_address;

-- Create view for recent license activity
CREATE VIEW recent_license_activity AS
SELECT 
  l.id,
  l.sensor_data_id,
  sd.title as dataset_title,
  sd.type as dataset_type,
  sd.location,
  l.ip_asset_id,
  l.amount,
  l.minter_address,
  l.receiver_address,
  l.minting_fee_paid,
  l.transaction_hash,
  l.story_explorer_tx_url,
  l.minted_at
FROM licenses l
JOIN sensor_data sd ON l.sensor_data_id = sd.id
ORDER BY l.minted_at DESC
LIMIT 100;

-- Function to get license statistics for a specific dataset
CREATE FUNCTION get_dataset_license_stats(dataset_id INTEGER)
RETURNS TABLE (
  total_transactions BIGINT,
  total_licenses BIGINT,
  unique_minters BIGINT,
  unique_holders BIGINT,
  total_revenue DECIMAL,
  last_minted TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT l.id)::BIGINT,
    COALESCE(SUM(l.amount), 0)::BIGINT,
    COUNT(DISTINCT l.minter_address)::BIGINT,
    COUNT(DISTINCT l.receiver_address)::BIGINT,
    COALESCE(SUM(l.minting_fee_paid), 0)::DECIMAL,
    MAX(l.minted_at)
  FROM licenses l
  WHERE l.sensor_data_id = dataset_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get all licenses held by an address
CREATE FUNCTION get_address_licenses(holder_address TEXT)
RETURNS TABLE (
  license_id BIGINT,
  dataset_id INTEGER,
  dataset_title TEXT,
  ip_asset_id TEXT,
  amount INTEGER,
  minted_at TIMESTAMP WITH TIME ZONE,
  transaction_hash TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.id,
    l.sensor_data_id,
    sd.title,
    l.ip_asset_id,
    l.amount,
    l.minted_at,
    l.transaction_hash
  FROM licenses l
  JOIN sensor_data sd ON l.sensor_data_id = sd.id
  WHERE l.receiver_address = holder_address
  ORDER BY l.minted_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE licenses IS 'Tracks all license tokens minted for IP assets';
COMMENT ON COLUMN licenses.license_token_ids IS 'Array of license token IDs returned from blockchain';
COMMENT ON COLUMN licenses.amount IS 'Number of licenses minted in this transaction';
COMMENT ON COLUMN licenses.minting_fee_paid IS 'Total fee paid (amount * unit_minting_fee)';
COMMENT ON VIEW dataset_license_stats IS 'Statistics about licenses minted for each dataset';
COMMENT ON VIEW address_license_holdings IS 'Summary of licenses held by each address';
COMMENT ON VIEW recent_license_activity IS 'Recent license minting activity across all datasets';