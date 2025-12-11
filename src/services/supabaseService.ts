
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface SensorDataRecord {
  id?: number;
  type: string;
  title: string;
  data: string;
  location?: string;
  timestamp: string;
  sensor_health: string;
  source: 'gmail' | 'blynk';
  raw_email_id?: string;
  
  // IP registration fields
  creator_address?: string;
  ip_asset_id?: string;
  story_explorer_url?: string;
  registered_at?: string;
  transaction_hash?: string;
  license_terms_ids?: string[];
  image_hash?: string;
  metadata_url?: string;
  revenue_share?: number;
  minting_fee?: number;
  
  created_at?: string;
  updated_at?: string;
}

export interface DerivativeIPRecord {
  id?: number;
  sensor_data_id: number;
  derivative_ip_id: string;
  parent_ip_id: string;
  license_terms_id: string;
  creator_name: string;
  creator_address: string;
  royalty_recipient?: string;
  max_revenue_share?: number;
  max_rts?: number;
  transaction_hash: string;
  story_explorer_url?: string;
  metadata_url?: string;
  character_file_url?: string;
  character_file_hash?: string;
  nft_token_id?: string;
  nft_contract_address?: string;
  nft_metadata_url?: string;
  image_url?: string;
  image_hash?: string;
  registered_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DerivativeIPWithParentInfo {
  id: number;
  sensor_data_id: number;
  derivative_ip_id: string;
  parent_ip_id: string;
  license_terms_id: string;
  creator_name: string;
  creator_address: string;
  royalty_recipient?: string;
  royalty_percentage?: number;
  transaction_hash: string;
  story_explorer_url?: string;
  metadata_url?: string;
  registered_at: string;
  derivative_type: string;
  derivative_title: string;
  derivative_location?: string;
  derivative_timestamp: string;
  derivative_data: string;
  parent_type?: string;
  parent_title?: string;
  parent_location?: string;
  parent_ip_confirmed?: string;
}

export interface DerivativeIPStats {
  total_derivatives: number;
  unique_parent_ips: number;
  unique_creators: number;
  avg_royalty_percentage: number;
  last_registered_at?: string;
  parent_ip_id: string;
  derivatives_count: number;
  derivative_ip_ids: string[];
  creator_addresses: string[];
}

export interface LicenseRecord {
  id?: number;
  sensor_data_id: number;
  license_token_ids: string[];
  amount: number;
  ip_asset_id: string;
  license_terms_id: string;
  transaction_hash: string;
  story_explorer_tx_url?: string;
  minter_address: string;
  receiver_address: string;
  minting_fee_paid?: number;
  unit_minting_fee?: number;
  revenue_share_percentage?: number;
  minted_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DatasetLicenseStats {
  sensor_data_id: number;
  ip_asset_id: string;
  type: string;
  title: string;
  location?: string;
  total_license_transactions: number;
  total_licenses_minted: number;
  unique_minters: number;
  unique_license_holders: number;
  total_revenue_generated: number;
  last_minted_at?: string;
}

export interface AddressLicenseHoldings {
  receiver_address: string;
  unique_datasets_licensed: number;
  total_licenses_held: number;
  total_spent: number;
  licensed_ip_assets: string[];
  last_license_acquired?: string;
}

export interface RecentLicenseActivity {
  id: number;
  sensor_data_id: number;
  dataset_title: string;
  dataset_type: string;
  location?: string;
  ip_asset_id: string;
  amount: number;
  minter_address: string;
  receiver_address: string;
  minting_fee_paid?: number;
  transaction_hash: string;
  story_explorer_tx_url?: string;
  minted_at: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export class SupabaseService {
  private client: SupabaseClient;

  constructor(config: SupabaseConfig) {
    this.client = createClient(config.url, config.anonKey);
  }

  /**
   * Insert a single sensor data record
   */
  async insertSensorData(data: Omit<SensorDataRecord, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; data?: SensorDataRecord; error?: string }> {
    try {
      const { data: insertedData, error } = await this.client
        .from('sensor_data')
        .insert([data])
        .select()
        .single();

      if (error) {
        console.error('Supabase insert error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: insertedData };
    } catch (error: any) {
      console.error('Insert sensor data error:', error);
      return { success: false, error: error.message || 'Failed to insert data' };
    }
  }

  /**
   * Insert multiple sensor data records
   */
  async insertMultipleSensorData(dataArray: Omit<SensorDataRecord, 'id' | 'created_at' | 'updated_at'>[]): Promise<{ success: boolean; count?: number; error?: string }> {
    try {
      const { data, error } = await this.client
        .from('sensor_data')
        .insert(dataArray)
        .select();

      if (error) {
        console.error('Supabase bulk insert error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, count: data?.length || 0 };
    } catch (error: any) {
      console.error('Bulk insert sensor data error:', error);
      return { success: false, error: error.message || 'Failed to insert data' };
    }
  }

  /**
   * Save IP registration data to sensor_data record
   */
  async saveIPRegistrationData(
    sensorDataId: number,
    ipRegistrationData: {
      creator_address: string;
      ip_asset_id: string;
      story_explorer_url: string;
      transaction_hash?: string;
      license_terms_ids?: string[];
      metadata_url?: string;
      revenue_share?: number;
      minting_fee?: number;
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.client
        .from('sensor_data')
        .update({
          creator_address: ipRegistrationData.creator_address,
          ip_asset_id: ipRegistrationData.ip_asset_id,
          story_explorer_url: ipRegistrationData.story_explorer_url,
          transaction_hash: ipRegistrationData.transaction_hash,
          license_terms_ids: ipRegistrationData.license_terms_ids,
          metadata_url: ipRegistrationData.metadata_url,
          revenue_share: ipRegistrationData.revenue_share,
          minting_fee: ipRegistrationData.minting_fee,
          registered_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', sensorDataId);

      if (error) {
        console.error('Supabase save IP registration error:', error);
        return { success: false, error: error.message };
      }

      console.log(`IP registration data saved for sensor data ID: ${sensorDataId}`);
      return { success: true };
    } catch (error: any) {
      console.error('Save IP registration error:', error);
      return { success: false, error: error.message || 'Failed to save IP registration' };
    }
  }

  // ============================================================================
  // DERIVATIVE IP ASSET METHODS
  // ============================================================================

  /**
   * Save derivative IP registration data
   */
  async saveDerivativeIPRegistration(
    derivativeData: Omit<DerivativeIPRecord, 'id' | 'created_at' | 'updated_at' | 'registered_at'>
  ): Promise<{ success: boolean; data?: DerivativeIPRecord; error?: string }> {
    try {
      const { data: insertedData, error } = await this.client
        .from('derivative_ip_assets')
        .insert([{
          ...derivativeData,
          registered_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) {
        console.error('Supabase save derivative IP error:', error);
        return { success: false, error: error.message };
      }

      console.log(`Derivative IP registration saved for sensor data ID: ${derivativeData.sensor_data_id}`);
      return { success: true, data: insertedData };
    } catch (error: any) {
      console.error('Save derivative IP registration error:', error);
      return { success: false, error: error.message || 'Failed to save derivative IP registration' };
    }
  }

  /**
   * Fetch derivative IPs with optional filters
   */
  async fetchDerivativeIPs(filters?: {
    sensor_data_id?: number;
    parent_ip_id?: string;
    derivative_ip_id?: string;
    creator_address?: string;
    limit?: number;
  }): Promise<{ success: boolean; data?: DerivativeIPRecord[]; error?: string }> {
    try {
      let query = this.client
        .from('derivative_ip_assets')
        .select('*')
        .order('registered_at', { ascending: false });

      if (filters?.sensor_data_id) {
        query = query.eq('sensor_data_id', filters.sensor_data_id);
      }

      if (filters?.parent_ip_id) {
        query = query.eq('parent_ip_id', filters.parent_ip_id);
      }

      if (filters?.derivative_ip_id) {
        query = query.eq('derivative_ip_id', filters.derivative_ip_id);
      }

      if (filters?.creator_address) {
        query = query.eq('creator_address', filters.creator_address);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Supabase fetch derivative IPs error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error: any) {
      console.error('Fetch derivative IPs error:', error);
      return { success: false, error: error.message || 'Failed to fetch derivative IPs' };
    }
  }

  /**
   * Get derivative IPs with parent information
   */
  async getDerivativeIPsWithParentInfo(filters?: {
    parent_ip_id?: string;
    creator_address?: string;
    limit?: number;
  }): Promise<{ success: boolean; data?: DerivativeIPWithParentInfo[]; error?: string }> {
    try {
      let query = this.client
        .from('derivative_ip_with_parent_info')
        .select('*');

      if (filters?.parent_ip_id) {
        query = query.eq('parent_ip_id', filters.parent_ip_id);
      }

      if (filters?.creator_address) {
        query = query.eq('creator_address', filters.creator_address);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Supabase get derivative IPs with parent info error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error: any) {
      console.error('Get derivative IPs with parent info error:', error);
      return { success: false, error: error.message || 'Failed to get derivative IPs with parent info' };
    }
  }

  /**
   * Get derivative IP statistics
   */
  async getDerivativeIPStats(parentIpId?: string): Promise<{ success: boolean; data?: DerivativeIPStats[]; error?: string }> {
    try {
      let query = this.client
        .from('derivative_ip_stats')
        .select('*');

      if (parentIpId) {
        query = query.eq('parent_ip_id', parentIpId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Supabase derivative IP stats error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error: any) {
      console.error('Get derivative IP stats error:', error);
      return { success: false, error: error.message || 'Failed to get derivative IP stats' };
    }
  }

  /**
   * Call stored procedure to get derivatives by parent IP
   */
  async callGetDerivativesByParent(parentIp: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const { data, error } = await this.client
        .rpc('get_derivative_ip_by_parent', { parent_ip: parentIp });

      if (error) {
        console.error('Supabase RPC get_derivative_ip_by_parent error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error: any) {
      console.error('Call get_derivative_ip_by_parent error:', error);
      return { success: false, error: error.message || 'Failed to call get_derivative_ip_by_parent' };
    }
  }

  /**
   * Call stored procedure to get derivative IP chain
   */
  async callGetDerivativeChain(startIpId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const { data, error } = await this.client
        .rpc('get_derivative_ip_chain', { start_ip_id: startIpId });

      if (error) {
        console.error('Supabase RPC get_derivative_ip_chain error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error: any) {
      console.error('Call get_derivative_ip_chain error:', error);
      return { success: false, error: error.message || 'Failed to call get_derivative_ip_chain' };
    }
  }

  /**
   * Update derivative IP record
   */
  async updateDerivativeIP(
    derivativeId: number,
    updates: Partial<Omit<DerivativeIPRecord, 'id' | 'created_at' | 'updated_at' | 'registered_at'>>
  ): Promise<{ success: boolean; data?: DerivativeIPRecord; error?: string }> {
    try {
      const { data, error } = await this.client
        .from('derivative_ip_assets')
        .update(updates)
        .eq('id', derivativeId)
        .select()
        .single();

      if (error) {
        console.error('Supabase update derivative IP error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error: any) {
      console.error('Update derivative IP error:', error);
      return { success: false, error: error.message || 'Failed to update derivative IP' };
    }
  }

  // ============================================================================
  // LICENSE METHODS (unchanged from original)
  // ============================================================================

  /**
   * Save license minting data to licenses table
   */
  async saveLicenseMinting(licenseData: Omit<LicenseRecord, 'id' | 'created_at' | 'updated_at' | 'minted_at'>): Promise<{ success: boolean; data?: LicenseRecord; error?: string }> {
    try {
      const { data: insertedData, error } = await this.client
        .from('licenses')
        .insert([{
          ...licenseData,
          minted_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) {
        console.error('Supabase save license minting error:', error);
        return { success: false, error: error.message };
      }

      console.log(`License minting data saved for sensor data ID: ${licenseData.sensor_data_id}`);
      return { success: true, data: insertedData };
    } catch (error: any) {
      console.error('Save license minting error:', error);
      return { success: false, error: error.message || 'Failed to save license minting' };
    }
  }

  /**
   * Fetch all licenses with optional filters
   */
  async fetchLicenses(filters?: {
    sensor_data_id?: number;
    minter_address?: string;
    receiver_address?: string;
    ip_asset_id?: string;
    limit?: number;
  }): Promise<{ success: boolean; data?: LicenseRecord[]; error?: string }> {
    try {
      let query = this.client
        .from('licenses')
        .select('*')
        .order('minted_at', { ascending: false });

      if (filters?.sensor_data_id) {
        query = query.eq('sensor_data_id', filters.sensor_data_id);
      }

      if (filters?.minter_address) {
        query = query.eq('minter_address', filters.minter_address);
      }

      if (filters?.receiver_address) {
        query = query.eq('receiver_address', filters.receiver_address);
      }

      if (filters?.ip_asset_id) {
        query = query.eq('ip_asset_id', filters.ip_asset_id);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Supabase fetch licenses error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error: any) {
      console.error('Fetch licenses error:', error);
      return { success: false, error: error.message || 'Failed to fetch licenses' };
    }
  }

  /**
   * Get dataset license statistics
   */
  async getDatasetLicenseStats(sensorDataId?: number): Promise<{ success: boolean; data?: DatasetLicenseStats[]; error?: string }> {
    try {
      let query = this.client
        .from('dataset_license_stats')
        .select('*');

      if (sensorDataId) {
        query = query.eq('sensor_data_id', sensorDataId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Supabase dataset license stats error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error: any) {
      console.error('Get dataset license stats error:', error);
      return { success: false, error: error.message || 'Failed to get dataset license stats' };
    }
  }

  /**
   * Get address license holdings
   */
  async getAddressLicenseHoldings(receiverAddress?: string): Promise<{ success: boolean; data?: AddressLicenseHoldings[]; error?: string }> {
    try {
      let query = this.client
        .from('address_license_holdings')
        .select('*');

      if (receiverAddress) {
        query = query.eq('receiver_address', receiverAddress);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Supabase address license holdings error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error: any) {
      console.error('Get address license holdings error:', error);
      return { success: false, error: error.message || 'Failed to get address license holdings' };
    }
  }

  /**
   * Get recent license activity
   */
  async getRecentLicenseActivity(limit: number = 100): Promise<{ success: boolean; data?: RecentLicenseActivity[]; error?: string }> {
    try {
      const { data, error } = await this.client
        .from('recent_license_activity')
        .select('*')
        .limit(limit);

      if (error) {
        console.error('Supabase recent license activity error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error: any) {
      console.error('Get recent license activity error:', error);
      return { success: false, error: error.message || 'Failed to get recent license activity' };
    }
  }

  /**
   * Call stored procedure to get dataset license stats
   */
  async callGetDatasetLicenseStats(datasetId: number): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const { data, error } = await this.client
        .rpc('get_dataset_license_stats', { dataset_id: datasetId });

      if (error) {
        console.error('Supabase RPC get_dataset_license_stats error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error: any) {
      console.error('Call get_dataset_license_stats error:', error);
      return { success: false, error: error.message || 'Failed to call get_dataset_license_stats' };
    }
  }

  /**
   * Call stored procedure to get address licenses
   */
  async callGetAddressLicenses(holderAddress: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const { data, error } = await this.client
        .rpc('get_address_licenses', { holder_address: holderAddress });

      if (error) {
        console.error('Supabase RPC get_address_licenses error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error: any) {
      console.error('Call get_address_licenses error:', error);
      return { success: false, error: error.message || 'Failed to call get_address_licenses' };
    }
  }

  /**
   * Update license amount
   */
  async updateLicenseAmount(
    licenseId: number,
    newAmount: number
  ): Promise<{ success: boolean; data?: LicenseRecord; error?: string }> {
    try {
      if (newAmount < 0) {
        return { success: false, error: 'License amount cannot be negative' };
      }

      const { data, error } = await this.client
        .from('licenses')
        .update({ amount: newAmount })
        .eq('id', licenseId)
        .select()
        .single();

      if (error) {
        console.error('Supabase update license amount error:', error);
        return { success: false, error: error.message };
      }

      console.log(`License amount updated for license ID: ${licenseId}`);
      return { success: true, data };
    } catch (error: any) {
      console.error('Update license amount error:', error);
      return { success: false, error: error.message || 'Failed to update license amount' };
    }
  }

  /**
   * Decrement license amount
   */
  async decrementLicenseAmount(
    licenseId: number,
    decrementBy: number = 1
  ): Promise<{ success: boolean; data?: LicenseRecord; error?: string }> {
    try {
      const { data: currentLicense, error: fetchError } = await this.client
        .from('licenses')
        .select('amount')
        .eq('id', licenseId)
        .single();

      if (fetchError) {
        console.error('Fetch license error:', fetchError);
        return { success: false, error: fetchError.message };
      }

      if (!currentLicense) {
        return { success: false, error: 'License not found' };
      }

      const newAmount = currentLicense.amount - decrementBy;

      if (newAmount < 0) {
        return { success: false, error: `Cannot decrement by ${decrementBy}. Current amount: ${currentLicense.amount}` };
      }

      const { data, error } = await this.client
        .from('licenses')
        .update({ amount: newAmount })
        .eq('id', licenseId)
        .select()
        .single();

      if (error) {
        console.error('Supabase decrement license amount error:', error);
        return { success: false, error: error.message };
      }

      console.log(`License amount decremented by ${decrementBy} for license ID: ${licenseId}. New amount: ${newAmount}`);
      return { success: true, data };
    } catch (error: any) {
      console.error('Decrement license amount error:', error);
      return { success: false, error: error.message || 'Failed to decrement license amount' };
    }
  }

  // ============================================================================
  // SENSOR DATA METHODS (unchanged from original)
  // ============================================================================

  /**
   * Check if a sensor reading already exists
   */
  async checkDuplicateExists(timestamp: string, type: string, location?: string): Promise<boolean> {
    try {
      let query = this.client
        .from('sensor_data')
        .select('id')
        .eq('timestamp', timestamp)
        .eq('type', type);

      if (location) {
        query = query.eq('location', location);
      }

      const { data, error } = await query.limit(1);

      if (error) {
        console.error('Duplicate check error:', error);
        return false;
      }

      return (data && data.length > 0) || false;
    } catch (error) {
      console.error('Check duplicate error:', error);
      return false;
    }
  }

  /**
   * Fetch sensor data with filters
   */
  async fetchSensorData(filters?: {
    type?: string;
    location?: string;
    source?: 'gmail' | 'blynk';
    startDate?: string;
    endDate?: string;
    limit?: number;
    has_ip_registration?: boolean;
  }): Promise<{ success: boolean; data?: SensorDataRecord[]; error?: string }> {
    try {
      let query = this.client
        .from('sensor_data')
        .select('*')
        .order('timestamp', { ascending: false });

      if (filters?.type) {
        query = query.eq('type', filters.type);
      }

      if (filters?.location) {
        query = query.eq('location', filters.location);
      }

      if (filters?.source) {
        query = query.eq('source', filters.source);
      }

      if (filters?.startDate) {
        query = query.gte('timestamp', filters.startDate);
      }

      if (filters?.endDate) {
        query = query.lte('timestamp', filters.endDate);
      }

      if (filters?.has_ip_registration !== undefined) {
        if (filters.has_ip_registration) {
          query = query.not('ip_asset_id', 'is', null);
        } else {
          query = query.is('ip_asset_id', null);
        }
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Supabase fetch error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error: any) {
      console.error('Fetch sensor data error:', error);
      return { success: false, error: error.message || 'Failed to fetch data' };
    }
  }

  /**
   * Get latest sensor readings by type
   */
  async getLatestReadings(): Promise<{ success: boolean; data?: SensorDataRecord[]; error?: string }> {
    try {
      const { data, error } = await this.client
        .from('latest_sensor_readings')
        .select('*');

      if (error) {
        console.error('Supabase fetch latest error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error: any) {
      console.error('Fetch latest readings error:', error);
      return { success: false, error: error.message || 'Failed to fetch latest readings' };
    }
  }

  /**
   * Delete sensor data by ID
   */
  async deleteSensorData(id: number): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.client
        .from('sensor_data')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Supabase delete error:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Delete sensor data error:', error);
      return { success: false, error: error.message || 'Failed to delete data' };
    }
  }

  /**
   * Get sensor data statistics
   */
  async getStatistics(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const { data, error } = await this.client
        .rpc('get_sensor_statistics');

      if (error) {
        console.error('Supabase statistics error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error: any) {
      console.error('Get statistics error:', error);
      return { success: false, error: error.message || 'Failed to get statistics' };
    }
  }

  /**
   * Get IP registration statistics
   */
  async getIPRegistrationStats(): Promise<{ 
    success: boolean; 
    data?: {
      total_registered: number;
      total_unregistered: number;
      recent_registrations: SensorDataRecord[];
    }; 
    error?: string 
  }> {
    try {
      const { count: registeredCount, error: countError } = await this.client
        .from('sensor_data')
        .select('*', { count: 'exact', head: true })
        .not('ip_asset_id', 'is', null);

      if (countError) {
        console.error('Count registered error:', countError);
      }

      const { count: unregisteredCount, error: unregError } = await this.client
        .from('sensor_data')
        .select('*', { count: 'exact', head: true })
        .is('ip_asset_id', null);

      if (unregError) {
        console.error('Count unregistered error:', unregError);
      }

      const { data: recentRegistrations, error: recentError } = await this.client
        .from('sensor_data')
        .select('*')
        .not('ip_asset_id', 'is', null)
        .order('registered_at', { ascending: false })
        .limit(5);

      if (recentError) {
        console.error('Recent registrations error:', recentError);
      }

      return {
        success: true,
        data: {
          total_registered: registeredCount || 0,
          total_unregistered: unregisteredCount || 0,
          recent_registrations: recentRegistrations || [],
        }
      };
    } catch (error: any) {
      console.error('Get IP registration stats error:', error);
      return { success: false, error: error.message || 'Failed to get IP registration stats' };
    }
  }
}

// Factory function to create service instance
export const createSupabaseService = (url: string, anonKey: string): SupabaseService => {
  return new SupabaseService({ url, anonKey });
};