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
  
  // New fields for IP registration
  creator_address?: string;
  ip_asset_id?: string;
  story_explorer_url?: string;
  registered_at?: string;
  transaction_hash?: string;
  license_terms_ids?: string[];
  image_hash?: string;
  metadata_url?: string;
  
  created_at?: string;
  updated_at?: string;
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
   * This should be called AFTER successful IP registration
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
   * Fetch sensor data with filters
   */
  async fetchSensorData(filters?: {
    type?: string;
    location?: string;
    source?: 'gmail' | 'blynk';
    startDate?: string;
    endDate?: string;
    limit?: number;
    has_ip_registration?: boolean; // true = only registered, false = only unregistered
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
      // Get total registered count
      const { count: registeredCount, error: countError } = await this.client
        .from('sensor_data')
        .select('*', { count: 'exact', head: true })
        .not('ip_asset_id', 'is', null);

      if (countError) {
        console.error('Count registered error:', countError);
      }

      // Get total unregistered count
      const { count: unregisteredCount, error: unregError } = await this.client
        .from('sensor_data')
        .select('*', { count: 'exact', head: true })
        .is('ip_asset_id', null);

      if (unregError) {
        console.error('Count unregistered error:', unregError);
      }

      // Get recent registrations
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