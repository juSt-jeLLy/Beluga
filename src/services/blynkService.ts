
export interface BlynkEvent {
  id: number;
  type: 'INFORMATION' | 'WARNING' | 'ERROR' | 'CRITICAL';
  name: string;
  eventCode: string;
  description?: string;
  timestamp?: string;
}

export interface BlynkLogEvent {
  description: string;
  timestamp?: number;
  eventCode?: string;
  metadata?: Record<string, any>;
}

export interface BlynkConfig {
  serverAddress: string;
  accessToken: string;
  templateId?: number;
  logEventToken?: string;
}

export interface SensorDataFromBlynk {
  type: string;
  title: string;
  data: string;
  timestamp: string;
  sensorHealth: string;
  location?: string;
  eventCode?: string;
  eventType?: string;
}

export class BlynkService {
  private config: BlynkConfig;

  constructor(config: BlynkConfig) {
    this.config = config;
  }

  /**
   * Get template events from Blynk Cloud
   */
  async getTemplateEvents(templateId?: number): Promise<{ success: boolean; data?: BlynkEvent[]; error?: string }> {
    try {
      const id = templateId || this.config.templateId;
      
      if (!id) {
        return { success: false, error: 'Template ID is required' };
      }

      const url = `${this.config.serverAddress}/api/v1/organization/template/events?templateId=${id}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return { success: false, error: 'Template not found' };
        }
        return { success: false, error: `API error: ${response.status} ${response.statusText}` };
      }

      const data: BlynkEvent[] = await response.json();
      return { success: true, data };
    } catch (error: any) {
      console.error('Blynk get template events error:', error);
      return { success: false, error: error.message || 'Failed to fetch template events' };
    }
  }

  /**
   * Fetch log events from Blynk Cloud (for a specific event code)
   */
  async fetchLogEvents(eventCode: string): Promise<{ success: boolean; data?: BlynkLogEvent[]; error?: string }> {
    try {
      if (!this.config.logEventToken) {
        return { success: false, error: 'Log event token is required' };
      }

      const url = `https://blynk.cloud/external/api/logEvent?token=${this.config.logEventToken}&code=${eventCode}`;
      
      const response = await fetch(url, {
        method: 'GET',
      });

      if (!response.ok) {
        return { success: false, error: `API error: ${response.status} ${response.statusText}` };
      }

      const data = await response.json();
      
      // Convert response to array if it's a single object
      const events: BlynkLogEvent[] = Array.isArray(data) ? data : [data];
      
      return { success: true, data: events };
    } catch (error: any) {
      console.error('Blynk fetch log events error:', error);
      return { success: false, error: error.message || 'Failed to fetch log events' };
    }
  }

  /**
   * Parse Blynk event data into sensor data format
   */
  parseSensorData(event: BlynkLogEvent, eventInfo?: BlynkEvent): SensorDataFromBlynk {
    const timestamp = event.timestamp 
      ? new Date(event.timestamp * 1000).toLocaleString('en-US', { 
          year: 'numeric', 
          month: '2-digit', 
          day: '2-digit', 
          hour: '2-digit', 
          minute: '2-digit', 
          second: '2-digit',
          hour12: true
        })
      : new Date().toLocaleString('en-US', { 
          year: 'numeric', 
          month: '2-digit', 
          day: '2-digit', 
          hour: '2-digit', 
          minute: '2-digit', 
          second: '2-digit',
          hour12: true
        });

    // Extract location from description if available
    const locationMatch = event.description?.match(/^([^,]+),/);
    const location = locationMatch ? locationMatch[1].trim() : '';

    // Determine type based on event code or name
    const eventCode = event.eventCode || eventInfo?.eventCode || '';
    const eventName = eventInfo?.name || '';
    
    let type = 'growth'; // default
    let title = eventName || 'Sensor Event';

    if (eventCode.includes('temp') || eventName.toLowerCase().includes('temperature')) {
      type = 'temperature';
      title = 'Temperature & Humidity';
    } else if (eventCode.includes('sun') || eventName.toLowerCase().includes('sunlight')) {
      type = 'sunlight';
      title = 'Sunlight Intensity';
    } else if (eventCode.includes('moisture') || eventName.toLowerCase().includes('moisture')) {
      type = 'moisture';
      title = 'Soil Moisture Levels';
    } else if (eventCode.includes('growth') || eventName.toLowerCase().includes('growth')) {
      type = 'growth';
      title = 'Live Crop Growth';
    } else if (eventCode.includes('rain') || eventName.toLowerCase().includes('rain')) {
      type = 'rainfall';
      title = 'Rainfall Data';
    }

    return {
      type,
      title,
      data: event.description || JSON.stringify(event.metadata || {}),
      timestamp,
      sensorHealth: '100%',
      location,
      eventCode,
      eventType: eventInfo?.type
    };
  }

  /**
   * Fetch all sensor data from Blynk (combines template events and log data)
   */
  async fetchAllSensorData(): Promise<{ success: boolean; data?: SensorDataFromBlynk[]; error?: string }> {
    try {
      // First, get template events to know what event codes exist
      const eventsResult = await this.getTemplateEvents();
      
      if (!eventsResult.success || !eventsResult.data) {
        // If we can't get template events, try to fetch using the log event token directly
        if (this.config.logEventToken) {
          return await this.fetchSensorDataFromLogs();
        }
        return { success: false, error: eventsResult.error || 'Failed to fetch events' };
      }

      const allSensorData: SensorDataFromBlynk[] = [];

      // For each event, fetch its log data
      for (const event of eventsResult.data) {
        const logResult = await this.fetchLogEvents(event.eventCode);
        
        if (logResult.success && logResult.data) {
          for (const logEvent of logResult.data) {
            const sensorData = this.parseSensorData(logEvent, event);
            allSensorData.push(sensorData);
          }
        }
      }

      // Sort by timestamp (most recent first)
      allSensorData.sort((a, b) => {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });

      return { success: true, data: allSensorData };
    } catch (error: any) {
      console.error('Blynk fetch all sensor data error:', error);
      return { success: false, error: error.message || 'Failed to fetch sensor data' };
    }
  }

  /**
   * Fetch sensor data using log event token (simplified approach)
   */
  private async fetchSensorDataFromLogs(): Promise<{ success: boolean; data?: SensorDataFromBlynk[]; error?: string }> {
    try {
      if (!this.config.logEventToken) {
        return { success: false, error: 'Log event token is required' };
      }

      // Common event codes to try
      const eventCodes = ['live_crop_growth', 'temperature', 'moisture', 'sunlight', 'rainfall'];
      const allSensorData: SensorDataFromBlynk[] = [];

      for (const eventCode of eventCodes) {
        const logResult = await this.fetchLogEvents(eventCode);
        
        if (logResult.success && logResult.data) {
          for (const logEvent of logResult.data) {
            const sensorData = this.parseSensorData(logEvent);
            allSensorData.push(sensorData);
          }
        }
      }

      return { success: true, data: allSensorData };
    } catch (error: any) {
      console.error('Blynk fetch from logs error:', error);
      return { success: false, error: error.message || 'Failed to fetch sensor data from logs' };
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<BlynkConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration (without sensitive data)
   */
  getConfig(): Omit<BlynkConfig, 'accessToken' | 'logEventToken'> {
    return {
      serverAddress: this.config.serverAddress,
      templateId: this.config.templateId,
    };
  }
}

// Factory function to create service instance
export const createBlynkService = (
  serverAddress: string,
  accessToken: string,
  templateId?: number,
  logEventToken?: string
): BlynkService => {
  return new BlynkService({
    serverAddress,
    accessToken,
    templateId,
    logEventToken,
  });
};