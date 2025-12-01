// supabaseService.ts
// Service for handling Supabase database operations

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
  created_at?: string;
  updated_at?: string;
}

export interface IPRegistrationRecord {
  id?: number;
  sensor_data_id: number;
  ip_asset_id: string;
  owner_address: string;
  tx_hash: string;
  story_explorer_url: string;
  creator_name: string;
  revenue_share: number;
  minting_fee: string;
  license_terms_ids?: string[];
  character_file_url?: string;
  ip_metadata_uri?: string;
  nft_metadata_uri?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SensorDataWithIP extends SensorDataRecord {
  ip_registration_id?: number;
  ip_asset_id?: string;
  owner_address?: string;
  tx_hash?: string;
  story_explorer_url?: string;
  creator_name?: string;
  revenue_share?: number;
  minting_fee?: string;
  character_file_url?: string;
  is_registered: boolean;
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
   * Check if a sensor reading already exists (to avoid duplicates)
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
   * Fetch sensor data with IP registration status
   */
  async fetchSensorDataWithIP(filters?: {
    type?: string;
    location?: string;
    source?: 'gmail' | 'blynk';
    startDate?: string;
    endDate?: string;
    limit?: number;
    registeredOnly?: boolean;
  }): Promise<{ success: boolean; data?: SensorDataWithIP[]; error?: string }> {
    try {
      let query = this.client
        .from('sensor_data_with_ip')
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

      if (filters?.registeredOnly !== undefined) {
        query = query.eq('is_registered', filters.registeredOnly);
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
      console.error('Fetch sensor data with IP error:', error);
      return { success: false, error: error.message || 'Failed to fetch data' };
    }
  }

  /**
   * Fetch sensor data (legacy method for backward compatibility)
   */
  async fetchSensorData(filters?: {
    type?: string;
    location?: string;
    source?: 'gmail' | 'blynk';
    startDate?: string;
    endDate?: string;
    limit?: number;
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
   * Insert IP registration record
   */
  async insertIPRegistration(data: Omit<IPRegistrationRecord, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; data?: IPRegistrationRecord; error?: string }> {
    try {
      const { data: insertedData, error } = await this.client
        .from('ip_registrations')
        .insert([data])
        .select()
        .single();

      if (error) {
        console.error('Supabase IP registration insert error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: insertedData };
    } catch (error: any) {
      console.error('Insert IP registration error:', error);
      return { success: false, error: error.message || 'Failed to insert IP registration' };
    }
  }

  /**
   * Check if sensor data is already registered as IP
   */
  async checkIPRegistrationExists(sensorDataId: number): Promise<{ exists: boolean; registration?: IPRegistrationRecord }> {
    try {
      const { data, error } = await this.client
        .from('ip_registrations')
        .select('*')
        .eq('sensor_data_id', sensorDataId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // Not found
          return { exists: false };
        }
        console.error('Check IP registration error:', error);
        return { exists: false };
      }

      return { exists: true, registration: data };
    } catch (error) {
      console.error('Check IP registration error:', error);
      return { exists: false };
    }
  }

  /**
   * Get IP registration by sensor data ID
   */
  async getIPRegistrationBySensorId(sensorDataId: number): Promise<{ success: boolean; data?: IPRegistrationRecord; error?: string }> {
    try {
      const { data, error } = await this.client
        .from('ip_registrations')
        .select('*')
        .eq('sensor_data_id', sensorDataId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return { success: false, error: 'No registration found' };
        }
        console.error('Get IP registration error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error: any) {
      console.error('Get IP registration error:', error);
      return { success: false, error: error.message || 'Failed to get IP registration' };
    }
  }

  /**
   * Get all IP registrations by owner address
   */
  async getIPRegistrationsByOwner(ownerAddress: string): Promise<{ success: boolean; data?: IPRegistrationRecord[]; error?: string }> {
    try {
      const { data, error } = await this.client
        .from('ip_registrations')
        .select('*')
        .eq('owner_address', ownerAddress)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Get IP registrations by owner error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error: any) {
      console.error('Get IP registrations by owner error:', error);
      return { success: false, error: error.message || 'Failed to get IP registrations' };
    }
  }

  /**
   * Get sensor data by ID
   */
  async getSensorDataById(id: number): Promise<{ success: boolean; data?: SensorDataRecord; error?: string }> {
    try {
      const { data, error } = await this.client
        .from('sensor_data')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Get sensor data by ID error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error: any) {
      console.error('Get sensor data by ID error:', error);
      return { success: false, error: error.message || 'Failed to get sensor data' };
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
}

// Factory function to create service instance
export const createSupabaseService = (url: string, anonKey: string): SupabaseService => {
  return new SupabaseService({ url, anonKey });
};