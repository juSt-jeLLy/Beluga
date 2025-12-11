
declare const gapi: any;
declare const google: any;

export interface SensorData {
  type: string;
  title: string;
  data: string;
  timestamp: string;
  sensorHealth: string;
  location?: string;
  imageHash?: string; 
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
          callback: '', 
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
   * Extract CSV data from email body
   */
  private extractCSVData(body: string): { csvRows: string[][]; csvText: string } {
    let csvText = '';
    const csvRows: string[][] = [];

    // Try to find CSV data in the email body
    // Look for patterns like CSV lines with commas
    const lines = body.split('\n');
    const csvLines: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      // Check if line looks like CSV (contains commas and not HTML)
      if (trimmed && trimmed.includes(',') && !trimmed.startsWith('<') && !trimmed.endsWith('>')) {
        csvLines.push(trimmed);
      }
    }

    if (csvLines.length > 0) {
      csvText = csvLines.join('\n');
      
      // Parse CSV rows
      for (const line of csvLines) {
        // Simple CSV parsing - split by comma but handle quoted values
        const row: string[] = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            row.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        
        // Add the last value
        row.push(current.trim());
        csvRows.push(row);
      }
    }

    return { csvRows, csvText };
  }

  /**
   * Extract location and image hash from CSV data
   */
  private extractCSVValues(csvRows: string[][]): { location: string; imageHash: string } {
    let location = '';
    let imageHash = '';

    if (csvRows.length > 0) {
      // Get the first row (assuming it's the data row)
      const firstRow = csvRows[0];
      
      // First value is location
      if (firstRow.length > 0) {
        location = firstRow[0].trim();
      }
      
      // Last value is image hash
      if (firstRow.length > 1) {
        imageHash = firstRow[firstRow.length - 1].trim();
        
        // Remove any quotes from the image hash
        imageHash = imageHash.replace(/^["']|["']$/g, '');
      }
    }

    return { location, imageHash };
  }

  /**
   * Extract clean data from HTML body
   */
  private extractCleanData(htmlBody: string): { 
    location: string; 
    data: string;
    imageHash: string;
    csvRows: string[][];
    csvText: string;
  } {
    let location = '';
    let data = '';
    let imageHash = '';
    let csvRows: string[][] = [];
    let csvText = '';

    // First, try to extract content from <pre> tag (main data)
    const preMatch = htmlBody.match(/<pre>([\s\S]*?)<\/pre>/i);
    
    if (preMatch && preMatch[1]) {
      const preContent = preMatch[1].trim();
      
      // Extract CSV data
      const csvData = this.extractCSVData(preContent);
      csvRows = csvData.csvRows;
      csvText = csvData.csvText;
      
      // Extract location and image hash from CSV
      const csvValues = this.extractCSVValues(csvRows);
      location = csvValues.location;
      imageHash = csvValues.imageHash;
      
      // Get the full data from pre tag
      data = preContent;
    } else {
      // If no <pre> tag, try to extract CSV data from the entire HTML
      const csvData = this.extractCSVData(htmlBody);
      csvRows = csvData.csvRows;
      csvText = csvData.csvText;
      
      // Extract location and image hash from CSV
      const csvValues = this.extractCSVValues(csvRows);
      location = csvValues.location;
      imageHash = csvValues.imageHash;
      
      // Get text content from HTML
      const textOnly = htmlBody
        .replace(/<[^>]*>/g, ' ') 
        .replace(/\s+/g, ' ') 
        .trim();
      
      data = textOnly;
    }

    return { location, data, imageHash, csvRows, csvText };
  }

  /**
   * Parse email body from payload
   */
  private parseEmailBody(payload: any): { 
    raw: string; 
    location: string; 
    cleanData: string; 
    imageHash: string;
    csvRows: string[][];
    csvText: string;
  } {
    let rawBody = '';
    let location = '';
    let cleanData = '';
    let imageHash = '';
    let csvRows: string[][] = [];
    let csvText = '';
    
    if (payload.body?.data) {
      const decoded = this.decodeBase64(payload.body.data);
      rawBody = decoded;
      
      // Try to extract clean data if it's HTML
      if (decoded.includes('<')) {
        const extracted = this.extractCleanData(decoded);
        location = extracted.location;
        cleanData = extracted.data;
        imageHash = extracted.imageHash;
        csvRows = extracted.csvRows;
        csvText = extracted.csvText;
      } else {
        // If it's plain text, extract CSV data
        const csvData = this.extractCSVData(decoded);
        csvRows = csvData.csvRows;
        csvText = csvData.csvText;
        
        // Extract location and image hash from CSV
        const csvValues = this.extractCSVValues(csvRows);
        location = csvValues.location;
        imageHash = csvValues.imageHash;
        
        // Use plain text as clean data
        cleanData = decoded;
      }
    } else if (payload.parts) {
      for (const part of payload.parts) {
        if (part.mimeType === 'text/html' && part.body?.data) {
          const htmlBody = this.decodeBase64(part.body.data);
          rawBody = htmlBody;
          
          // Extract clean data and CSV values from HTML
          const extracted = this.extractCleanData(htmlBody);
          location = extracted.location;
          cleanData = extracted.data;
          imageHash = extracted.imageHash;
          csvRows = extracted.csvRows;
          csvText = extracted.csvText;
          
          // If we found clean data, we're done
          if (cleanData) break;
        } else if (part.mimeType === 'text/plain' && part.body?.data) {
          const plainText = this.decodeBase64(part.body.data);
          rawBody = plainText;
          
          // Extract CSV data from plain text
          const csvData = this.extractCSVData(plainText);
          csvRows = csvData.csvRows;
          csvText = csvData.csvText;
          
          // Extract location and image hash from CSV
          const csvValues = this.extractCSVValues(csvRows);
          location = csvValues.location;
          imageHash = csvValues.imageHash;
          
          // Use plain text as clean data
          if (!cleanData) {
            cleanData = plainText;
          }
        } else if (part.parts) {
          // Recursive search for nested parts
          const result = this.parseEmailBody(part);
          if (result.cleanData || result.raw) {
            rawBody = result.raw;
            location = result.location;
            cleanData = result.cleanData;
            imageHash = result.imageHash;
            csvRows = result.csvRows;
            csvText = result.csvText;
            if (cleanData) break;
          }
        }
      }
    }
    
    // If we still don't have clean data, use raw body
    if (!cleanData.trim() && rawBody.trim()) {
      cleanData = rawBody;
    }
    
    // If we don't have image hash from CSV, try to extract from the raw body
    if (!imageHash && rawBody) {
      // Look for IPFS hash patterns (Qm... or bafy...)
      const ipfsHashMatch = rawBody.match(/(Qm[1-9A-HJ-NP-Za-km-z]{44}|bafy[a-z0-9]{59})/);
      if (ipfsHashMatch) {
        imageHash = ipfsHashMatch[0];
      }
    }
    
    return { 
      raw: rawBody, 
      location, 
      cleanData, 
      imageHash,
      csvRows,
      csvText
    };
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
  categorizeEmail(
    subject: string, 
    body: string, 
    internalDate: string, 
    location: string, 
    cleanData: string,
    imageHash: string
  ): Omit<SensorData, 'icon'> | null {
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

    // Use clean data if available, otherwise use raw body
    let displayData = body;
    
    if (cleanData && cleanData.trim()) {
      displayData = cleanData;
      
      // Add location info if not already in the clean data
      if (location && !cleanData.includes(location)) {
        displayData = `Location: ${location}\n\n${cleanData}`;
      }
    }
    
    // Add image hash to display data if available
    if (imageHash) {
      displayData += `\n\nImage Hash: ${imageHash}`;
    }
    
    // Ensure we have at least 200 characters or the full text
    if (displayData.length < 200 && body.length > displayData.length) {
      displayData = body;
    }
    
    const sensorHealth = this.extractSensorHealth(displayData);

    // Debug logging to see what we're getting
    console.log('Email categorization:', {
      subject: lowerSubject,
      hasCleanData: !!cleanData,
      cleanDataLength: cleanData?.length || 0,
      rawBodyLength: body.length,
      displayDataLength: displayData.length,
      location,
      imageHash,
      sensorHealth,
      preview: displayData.substring(0, 200) + '...'
    });

    if (lowerSubject.includes('temperature') || lowerSubject.includes('humidity')) {
      return {
        type: 'temperature',
        title: 'Temperature & Humidity',
        data: displayData,
        timestamp,
        sensorHealth,
        location: location || 'Unknown',
        imageHash: imageHash || undefined
      };
    } else if (lowerSubject.includes('sunlight')) {
      return {
        type: 'sunlight',
        title: 'Sunlight Intensity',
        data: displayData,
        timestamp,
        sensorHealth,
        location: location || 'Unknown',
        imageHash: imageHash || undefined
      };
    } else if (lowerSubject.includes('moisture')) {
      return {
        type: 'moisture',
        title: 'Soil Moisture Levels',
        data: displayData,
        timestamp,
        sensorHealth,
        location: location || 'Unknown',
        imageHash: imageHash || undefined
      };
    } else if (lowerSubject.includes('crop growth') || lowerSubject.includes('growth')) {
      return {
        type: 'growth',
        title: 'Live Crop Growth',
        data: displayData,
        timestamp,
        sensorHealth,
        location: location || 'Unknown',
        imageHash: imageHash || undefined
      };
    } else if (lowerSubject.includes('rainfall') || lowerSubject.includes('rain')) {
      return {
        type: 'rainfall',
        title: 'Rainfall Data',
        data: displayData,
        timestamp,
        sensorHealth,
        location: location || 'Unknown',
        imageHash: imageHash || undefined
      };
    }
    
    // If no specific category, still save with a generic type
    return {
      type: 'general',
      title: 'Sensor Data',
      data: displayData,
      timestamp,
      sensorHealth,
      location: location || 'Unknown',
      imageHash: imageHash || undefined
    };
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
      console.log('No messages found for the given criteria');
      return [];
    }

    console.log(`Found ${messages.length} messages to process`);
    
    // Fetch full details for each message
    const sensorDataArray: Omit<SensorData, 'icon'>[] = [];
    
    for (const message of messages) {
      try {
        console.log(`Processing message: ${message.id}`);
        
        const fullMessage = await gapi.client.gmail.users.messages.get({
          userId: 'me',
          id: message.id,
          format: 'full'
        });

        const headers = fullMessage.result.payload.headers;
        const subject = headers.find((h: any) => h.name.toLowerCase() === 'subject')?.value || '';
        const { 
          raw, 
          location, 
          cleanData, 
          imageHash,
          csvRows,
          csvText 
        } = this.parseEmailBody(fullMessage.result.payload);
        const internalDate = fullMessage.result.internalDate;

        console.log(`Extracted data for message ${message.id}:`, {
          subject,
          location,
          imageHash,
          csvRowsFound: csvRows.length,
          csvTextLength: csvText.length,
          cleanDataLength: cleanData?.length || 0,
          rawLength: raw?.length || 0,
          hasData: !!(cleanData?.trim() || raw?.trim())
        });

        if (cleanData?.trim() || raw?.trim()) {
          const sensorData = this.categorizeEmail(
            subject, 
            raw, 
            internalDate, 
            location, 
            cleanData,
            imageHash
          );
          
          if (sensorData) {
            console.log(`Categorized as: ${sensorData.type} - ${sensorData.title}`);
            console.log(`Location: ${sensorData.location}`);
            console.log(`Image Hash: ${sensorData.imageHash}`);
            console.log(`Data preview: ${sensorData.data.substring(0, 100)}...`);
            sensorDataArray.push(sensorData);
          } else {
            console.log(`Could not categorize message: ${subject}`);
          }
        } else {
          console.log(`No usable data found in message: ${message.id}`);
        }
      } catch (error) {
        console.error(`Error fetching message ${message.id}:`, error);
      }
    }

    console.log(`Processed ${sensorDataArray.length} sensor data entries`);
    
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

  /**
   * Utility method to parse CSV data from a string
   */
  parseCSV(csvString: string): { location: string; imageHash: string; allValues: string[] } {
    const lines = csvString.split('\n').filter(line => line.trim());
    const location = '';
    const imageHash = '';
    
    if (lines.length > 0) {
      const firstLine = lines[0];
      const values = firstLine.split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
      
      return {
        location: values.length > 0 ? values[0] : '',
        imageHash: values.length > 0 ? values[values.length - 1] : '',
        allValues: values
      };
    }
    
    return { location, imageHash, allValues: [] };
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