// gmailService.ts
// Service for handling Gmail API operations using Google Identity Services

// Declare types for TypeScript
declare const gapi: any;
declare const google: any;

export interface SensorData {
  type: string;
  title: string;
  data: string;
  timestamp: string;
  sensorHealth: string;
  icon?: React.ReactNode;
}

export interface GmailConfig {
  apiKey: string;
  clientId: string;
  discoveryDocs: string[];
  scope: string;
}

export class GmailService {
  private config: GmailConfig;
  private tokenClient: any = null;
  private accessToken: string | null = null;

  constructor(config: GmailConfig) {
    this.config = config;
  }

  /**
   * Initialize Google API client (GAPI)
   */
  async initGapiClient(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof gapi === 'undefined') {
        reject(new Error('Google API not loaded'));
        return;
      }

      gapi.load('client', async () => {
        try {
          await gapi.client.init({
            apiKey: this.config.apiKey,
            discoveryDocs: this.config.discoveryDocs,
          });
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  /**
   * Initialize Google Identity Services (GIS) for OAuth
   */
  initGoogleIdentity(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.accounts) {
        reject(new Error('Google Identity Services not loaded'));
        return;
      }

      try {
        this.tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: this.config.clientId,
          scope: this.config.scope,
          callback: '', // Will be set when requesting token
        });
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Load Google API scripts dynamically
   */
  loadGoogleScripts(): Promise<void> {
    return new Promise((resolve) => {
      let scriptsLoaded = 0;
      const totalScripts = 2;

      const checkComplete = () => {
        scriptsLoaded++;
        if (scriptsLoaded === totalScripts) {
          resolve();
        }
      };

      // Load GAPI
      if (!document.querySelector('script[src="https://apis.google.com/js/api.js"]')) {
        const gapiScript = document.createElement('script');
        gapiScript.src = 'https://apis.google.com/js/api.js';
        gapiScript.async = true;
        gapiScript.defer = true;
        gapiScript.onload = () => checkComplete();
        document.body.appendChild(gapiScript);
      } else {
        checkComplete();
      }

      // Load GSI
      if (!document.querySelector('script[src="https://accounts.google.com/gsi/client"]')) {
        const gsiScript = document.createElement('script');
        gsiScript.src = 'https://accounts.google.com/gsi/client';
        gsiScript.async = true;
        gsiScript.defer = true;
        gsiScript.onload = () => checkComplete();
        document.body.appendChild(gsiScript);
      } else {
        checkComplete();
      }
    });
  }

  /**
   * Request access token from user
   */
  requestAccessToken(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.tokenClient) {
        reject(new Error('Token client not initialized'));
        return;
      }

      this.tokenClient.callback = (response: any) => {
        if (response.error) {
          reject(new Error(response.error));
          return;
        }
        this.accessToken = response.access_token;
        gapi.client.setToken({ access_token: this.accessToken });
        resolve(this.accessToken);
      };

      // Check if we already have a token
      const existingToken = gapi.client.getToken();
      if (existingToken && existingToken.access_token) {
        this.accessToken = existingToken.access_token;
        resolve(this.accessToken);
      } else {
        // Request new token
        this.tokenClient.requestAccessToken({ prompt: 'consent' });
      }
    });
  }

  /**
   * Decode base64 encoded email body
   */
  private decodeBase64(data: string): string {
    try {
      const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
      const decoded = atob(base64);
      return decodeURIComponent(escape(decoded));
    } catch (e) {
      try {
        return atob(data.replace(/-/g, '+').replace(/_/g, '/'));
      } catch (e2) {
        return data;
      }
    }
  }

  /**
   * Parse email body from payload
   */
  private parseEmailBody(payload: any): string {
    let body = '';
    
    if (payload.body?.data) {
      body = this.decodeBase64(payload.body.data);
    } else if (payload.parts) {
      for (const part of payload.parts) {
        if (part.mimeType === 'text/plain' && part.body?.data) {
          body = this.decodeBase64(part.body.data);
          break;
        } else if (part.mimeType === 'text/html' && part.body?.data) {
          const htmlBody = this.decodeBase64(part.body.data);
          // Remove HTML tags and clean up whitespace
          body = htmlBody
            .replace(/<style[^>]*>.*?<\/style>/gi, '')
            .replace(/<script[^>]*>.*?<\/script>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/\s+/g, ' ')
            .trim();
        } else if (part.parts) {
          // Recursive search for nested parts
          body = this.parseEmailBody(part);
          if (body) break;
        }
      }
    }
    
    return body;
  }

  /**
   * Extract sensor health percentage from body text
   */
  private extractSensorHealth(body: string): string {
    const match = body.match(/Sensor\s+(\d+%)/i);
    return match ? match[1] : '100%';
  }

  /**
   * Categorize email based on subject line
   */
  categorizeEmail(subject: string, body: string, internalDate: string): Omit<SensorData, 'icon'> | null {
    const lowerSubject = subject.toLowerCase();
    const timestamp = new Date(parseInt(internalDate)).toLocaleString('en-US', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: true
    });

    const sensorHealth = this.extractSensorHealth(body);

    if (lowerSubject.includes('temperature') || lowerSubject.includes('humidity')) {
      return {
        type: 'temperature',
        title: 'Temperature & Humidity',
        data: this.enhanceDescription(body, 'Temperature and humidity readings provide critical data for crop health monitoring. Optimal temperature ranges and humidity levels ensure proper plant growth and help prevent disease.'),
        timestamp,
        sensorHealth
      };
    } else if (lowerSubject.includes('sunlight')) {
      return {
        type: 'sunlight',
        title: 'Sunlight Intensity',
        data: this.enhanceDescription(body, 'Sunlight intensity measurements help optimize photosynthesis efficiency. The BH1750 sensor provides accurate lux readings throughout the day to track light availability for crops.'),
        timestamp,
        sensorHealth
      };
    } else if (lowerSubject.includes('moisture')) {
      return {
        type: 'moisture',
        title: 'Soil Moisture Levels',
        data: this.enhanceDescription(body, 'Soil moisture monitoring at various depths ensures optimal irrigation scheduling. Moisture levels correlate with rainfall events and help prevent both drought stress and waterlogging.'),
        timestamp,
        sensorHealth
      };
    } else if (lowerSubject.includes('crop growth') || lowerSubject.includes('growth')) {
      return {
        type: 'growth',
        title: 'Live Crop Growth',
        data: this.enhanceDescription(body, 'Real-time crop growth monitoring tracks height, leaf development, and growth rates. This data combined with environmental factors provides insights into crop health and development stages.'),
        timestamp,
        sensorHealth
      };
    } else if (lowerSubject.includes('rainfall') || lowerSubject.includes('rain')) {
      return {
        type: 'rainfall',
        title: 'Rainfall Data',
        data: this.enhanceDescription(body, 'Precise rainfall measurement using Arduino rain gauge sensors tracks precipitation patterns. Duration and intensity data helps correlate with soil moisture changes and irrigation needs.'),
        timestamp,
        sensorHealth
      };
    }
    
    return null;
  }

  /**
   * Enhance sensor description with context
   */
  private enhanceDescription(originalData: string, context: string): string {
    return `${originalData}\n\n📊 Context: ${context}`;
  }

  /**
   * Fetch emails from Gmail within last 24 hours
   */
  async fetchEmails(senderEmail: string = 'robot@blynk.cloud'): Promise<Omit<SensorData, 'icon'>[]> {
    // Calculate timestamp for 24 hours ago (in seconds)
    const oneDayAgo = Math.floor(Date.now() / 1000) - (24 * 60 * 60);
    
    // Search for emails from specified sender in last 24 hours
    const response = await gapi.client.gmail.users.messages.list({
      userId: 'me',
      q: `from:${senderEmail} after:${oneDayAgo} subject:(story)`,
      maxResults: 50
    });

    const messages = response.result.messages || [];
    
    if (messages.length === 0) {
      return [];
    }

    // Fetch full details for each message
    const sensorDataArray: Omit<SensorData, 'icon'>[] = [];
    
    for (const message of messages) {
      try {
        const fullMessage = await gapi.client.gmail.users.messages.get({
          userId: 'me',
          id: message.id,
          format: 'full'
        });

        const headers = fullMessage.result.payload.headers;
        const subject = headers.find((h: any) => h.name.toLowerCase() === 'subject')?.value || '';
        const body = this.parseEmailBody(fullMessage.result.payload);
        const internalDate = fullMessage.result.internalDate;

        if (body.trim()) {
          const sensorData = this.categorizeEmail(subject, body, internalDate);
          if (sensorData) {
            sensorDataArray.push(sensorData);
          }
        }
      } catch (error) {
        console.error(`Error fetching message ${message.id}:`, error);
      }
    }

    // Sort by timestamp (most recent first)
    sensorDataArray.sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
    
    return sensorDataArray;
  }

  /**
   * Check if user has valid access token
   */
  hasAccessToken(): boolean {
    const token = gapi.client.getToken();
    return token !== null && token.access_token !== null;
  }

  /**
   * Sign out user and revoke token
   */
  signOut(): void {
    const token = gapi.client.getToken();
    if (token && token.access_token) {
      google.accounts.oauth2.revoke(token.access_token, () => {
        console.log('Token revoked');
      });
      gapi.client.setToken(null);
      this.accessToken = null;
    }
  }
}

// Factory function to create service instance
export const createGmailService = (apiKey: string, clientId: string): GmailService => {
  return new GmailService({
    apiKey,
    clientId,
    discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest'],
    scope: 'https://www.googleapis.com/auth/gmail.readonly'
  });
};