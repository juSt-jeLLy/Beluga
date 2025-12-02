import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Mail, Cloud, Thermometer, Sun, Droplets, Sprout, CloudRain, AlertCircle, Loader2, MapPin, Database, RefreshCw, CheckCircle, ExternalLink, Image } from "lucide-react";
import dataPatternBg from "@/assets/data-pattern.jpg";
import { createGmailService } from "@/services/gmailService";
import type { SensorData } from "@/services/gmailService";
import { createSupabaseService } from "@/services/supabaseService";
import type { SensorDataRecord } from "@/services/supabaseService";
import { createBlynkService } from "@/services/blynkService";
import IPRegistrationDialog from "@/components/IPRegistrationDialog";

const GMAIL_API_KEY = import.meta.env.VITE_GMAIL_API_KEY;
const GMAIL_CLIENT_ID = import.meta.env.VITE_GMAIL_CLIENT_ID;
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const BLYNK_API_URL = import.meta.env.VITE_BLYNK_API_URL;
const BLYNK_SERVER = import.meta.env.VITE_BLYNK_SERVER;
const BLYNK_ACCESS_TOKEN = import.meta.env.VITE_BLYNK_ACCESS_TOKEN;
const BLYNK_TEMPLATE_ID = parseInt(import.meta.env.VITE_BLYNK_TEMPLATE_ID);

// Define extended interface to include database ID and IP registration status
interface SensorDataWithId extends SensorData {
  id?: number; // Database ID
  icon?: React.ReactNode;
  isRegistered?: boolean; // IP registration status
  ip_asset_id?: string; // IP Asset ID if registered
  story_explorer_url?: string; // Story Explorer URL if registered
  registered_at?: string; // Registration timestamp
  imageHash?: string; // IPFS image hash
}

const getIconForType = (type: string): React.ReactNode => {
  switch (type) {
    case 'temperature':
      return <Thermometer className="h-5 w-5" />;
    case 'sunlight':
      return <Sun className="h-5 w-5" />;
    case 'moisture':
      return <Droplets className="h-5 w-5" />;
    case 'growth':
      return <Sprout className="h-5 w-5" />;
    case 'rainfall':
      return <CloudRain className="h-5 w-5" />;
    default:
      return <AlertCircle className="h-5 w-5" />;
  }
};

const convertToDisplayData = (record: SensorDataRecord): SensorDataWithId => {
  // Try to get image hash from database first
  let imageHash = record.image_hash;
  
  // If not in database, try to extract from data
  if (!imageHash && record.data) {
    const ipfsHashMatch = record.data.match(/(Qm[1-9A-HJ-NP-Za-km-z]{44}|bafy[a-z0-9]{59})/);
    if (ipfsHashMatch) {
      imageHash = ipfsHashMatch[0];
    }
  }
  
  return {
    id: record.id, // Store the database ID
    type: record.type,
    title: record.title,
    data: record.data,
    location: record.location,
    timestamp: new Date(record.timestamp).toLocaleString('en-US', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: true
    }),
    sensorHealth: record.sensor_health,
    icon: getIconForType(record.type),
    isRegistered: !!record.ip_asset_id, // Check if IP registered
    ip_asset_id: record.ip_asset_id, // IP Asset ID
    story_explorer_url: record.story_explorer_url, // Story Explorer URL
    registered_at: record.registered_at, // Registration timestamp
    imageHash: imageHash // Make sure this is included
  };
};

const DataExtraction = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [extractedData, setExtractedData] = useState<SensorDataWithId[]>([]); // Use extended type
  const [selectedMethod, setSelectedMethod] = useState<"gmail" | "blynk">("gmail");
  const [gmailService] = useState(() => createGmailService(GMAIL_API_KEY, GMAIL_CLIENT_ID));
  const [supabaseService] = useState(() => createSupabaseService(SUPABASE_URL, SUPABASE_ANON_KEY));
  const [blynkService] = useState(() => createBlynkService(
    BLYNK_SERVER,
    BLYNK_ACCESS_TOKEN,
    BLYNK_TEMPLATE_ID
  ));
  const [scriptsLoaded, setScriptsLoaded] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [savingToDb, setSavingToDb] = useState(false);
  const [loadingFromDb, setLoadingFromDb] = useState(false);
  const [selectedSensorForIP, setSelectedSensorForIP] = useState<{
    data: SensorDataWithId;
    location: string;
  } | null>(null);
  const [ipDialogOpen, setIpDialogOpen] = useState(false);
  const [originalRecords, setOriginalRecords] = useState<SensorDataRecord[]>([]); // Store original records with IDs

  useEffect(() => {
    const loadScripts = async () => {
      try {
        await gmailService.loadGoogleScripts();
        await new Promise(resolve => setTimeout(resolve, 1000));
        setScriptsLoaded(true);
      } catch (error) {
        console.error('Failed to load Google scripts:', error);
      }
    };
    
    loadScripts();
  }, [gmailService]);

  useEffect(() => {
    if (!initialLoadDone) {
      setInitialLoadDone(true);
      loadFromDatabase();
    }
  }, [initialLoadDone]);

  const loadFromDatabase = async () => {
    setLoadingFromDb(true);
    try {
      toast({
        title: "Loading Data",
        description: "Fetching stored sensor data from database...",
      });

      const result = await supabaseService.fetchSensorData({
        limit: 50
      });

      if (result.success && result.data && result.data.length > 0) {
        setOriginalRecords(result.data); // Store original records with IDs
        const displayData = result.data.map(convertToDisplayData);
        setExtractedData(displayData);
        
        toast({
          title: "Data Loaded",
          description: `Loaded ${result.data.length} sensor readings from database`,
        });
      } else {
        setOriginalRecords([]);
        setExtractedData([]);
        toast({
          title: "No Data",
          description: "No sensor data found in database. Click 'Fetch New Data' to retrieve fresh data.",
        });
      }
    } catch (error: any) {
      console.error('Load from database error:', error);
      toast({
        title: "Database Error",
        description: "Failed to load data from database",
        variant: "destructive",
      });
    } finally {
      setLoadingFromDb(false);
    }
  };

  const extractFromGmail = async () => {
    setLoading(true);
    try {
      if (!scriptsLoaded) {
        toast({
          title: "Loading Scripts",
          description: "Please wait...",
        });
        await gmailService.loadGoogleScripts();
        await new Promise(resolve => setTimeout(resolve, 1000));
        setScriptsLoaded(true);
      }

      await gmailService.initGapiClient();
      await gmailService.initGoogleIdentity();

      if (!gmailService.hasAccessToken()) {
        toast({
          title: "Sign In Required",
          description: "Please authorize access to your Gmail...",
        });
        
        await gmailService.requestAccessToken();
      }

      toast({
        title: "Fetching Data",
        description: "Retrieving sensor emails...",
      });

      const emails = await gmailService.fetchEmails('robot@blynk.cloud');
      
      if (emails.length === 0) {
        toast({
          title: "No New Data",
          description: "No new sensor emails found in the last 24 hours.",
        });
        return;
      }

      const dataWithIcons = emails.map(email => ({
        ...email,
        icon: getIconForType(email.type)
      }));

      await saveToSupabase(dataWithIcons, 'gmail');
      await loadFromDatabase();
      
      toast({
        title: "Success",
        description: `Fetched ${emails.length} sensor readings from Gmail`,
      });
    } catch (error: any) {
      console.error('Gmail extraction error:', error);
      
      toast({
        title: "Error",
        description: error.message || "Unable to fetch from Gmail",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const extractFromBlynk = async () => {
    setLoading(true);
    try {
      toast({
        title: "Fetching Data",
        description: "Connecting to Blynk Cloud...",
      });

      const result = await blynkService.fetchAllSensorData();
      
      if (!result.success || !result.data || result.data.length === 0) {
        toast({
          title: "No New Data",
          description: result.error || "No sensor data available from Blynk Cloud.",
        });
        return;
      }

      const blynkData: SensorData[] = result.data.map(item => ({
        type: item.type,
        title: item.title,
        data: item.data,
        timestamp: item.timestamp,
        sensorHealth: item.sensorHealth,
        location: item.location,
        icon: getIconForType(item.type)
      }));

      await saveToSupabase(blynkData, 'blynk');
      await loadFromDatabase();
      
      toast({
        title: "Success",
        description: `Fetched ${blynkData.length} sensor readings from Blynk Cloud`,
      });
    } catch (error: any) {
      console.error('Blynk extraction error:', error);
      
      toast({
        title: "Error",
        description: error.message || "Unable to connect to Blynk Cloud",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFetchNewData = () => {
    if (selectedMethod === "gmail") {
      extractFromGmail();
    } else {
      extractFromBlynk();
    }
  };

const saveToSupabase = async (data: SensorData[], source: 'gmail' | 'blynk') => {
  setSavingToDb(true);
  try {
    const records = data.map(item => {
      const locationMatch = item.data.match(/^([^,]+),/);
      const location = locationMatch ? locationMatch[1].trim() : item.location || '';
      const timestamp = new Date(item.timestamp).toISOString();

      // Extract image hash from the data
      let imageHash = item.imageHash; // First check if imageHash is already in the item
      
      // If not, try to extract it from the data
      if (!imageHash) {
        const ipfsHashMatch = item.data.match(/(Qm[1-9A-HJ-NP-Za-km-z]{44}|bafy[a-z0-9]{59})/);
        if (ipfsHashMatch) {
          imageHash = ipfsHashMatch[0];
        }
      }

      // Clean the data - remove duplicate image hash if present
      let cleanData = item.data;
      
      // Remove "Image Hash: {hash}" pattern if it exists
      if (cleanData.includes('Image Hash:')) {
        // Split by newlines
        const lines = cleanData.split('\n');
        // Filter out lines that contain "Image Hash:"
        const filteredLines = lines.filter(line => 
          !line.toLowerCase().includes('image hash:')
        );
        cleanData = filteredLines.join('\n').trim();
      }
      
      // Also remove any standalone IPFS hash at the end (without Image Hash label)
      const lines = cleanData.split('\n');
      const lastLine = lines[lines.length - 1]?.trim();
      if (lastLine && /^(Qm[1-9A-HJ-NP-Za-km-z]{44}|bafy[a-z0-9]{59})$/.test(lastLine)) {
        lines.pop();
        cleanData = lines.join('\n').trim();
      }

      return {
        type: item.type,
        title: item.title,
        data: cleanData, // Use cleaned data
        location: location || null,
        timestamp,
        sensor_health: item.sensorHealth,
        source,
        image_hash: imageHash || null // Save the image hash to database
      };
    });

    const uniqueRecords = [];
    for (const record of records) {
      const isDuplicate = await supabaseService.checkDuplicateExists(
        record.timestamp,
        record.type,
        record.location || undefined
      );
      
      if (!isDuplicate) {
        uniqueRecords.push(record);
      }
    }

    if (uniqueRecords.length === 0) {
      toast({
        title: "Already Saved",
        description: "All sensor readings are already in the database",
      });
      return;
    }

    const result = await supabaseService.insertMultipleSensorData(uniqueRecords);

    if (result.success) {
      toast({
        title: "Data Saved",
        description: `Successfully saved ${result.count} new sensor readings to database`,
      });
    } else {
      toast({
        title: "Save Failed",
        description: result.error || "Failed to save data to database",
        variant: "destructive",
      });
    }
  } catch (error: any) {
    console.error('Save to Supabase error:', error);
    toast({
      title: "Database Error",
      description: "Failed to save data to database",
      variant: "destructive",
    });
  } finally {
    setSavingToDb(false);
  }
};

  const handleRegisterAsIP = (data: SensorDataWithId, location: string) => {
    // Only allow if not already registered
    if (data.isRegistered) return;
    
    // Pass the data with its database ID
    setSelectedSensorForIP({ 
      data, 
      location 
    });
    setIpDialogOpen(true);
  };

  const handleRegistrationComplete = () => {
    // Refresh data after successful registration
    loadFromDatabase();
    toast({
      title: "Refreshing Data",
      description: "Updating sensor data list...",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="relative pt-24 pb-12 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={dataPatternBg} 
            alt="Data Pattern" 
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background to-background"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="mb-6 text-center animate-slide-up">
            <Badge className="mb-3 bg-primary/10 text-primary border-primary/20 animate-glow">
              Data Extraction
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-3">
              Extract <span className="gradient-text">Robot Data</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Retrieve agricultural sensor data from IoT devices
            </p>
          </div>

          <Card className="mb-6 glass-card max-w-2xl mx-auto hover-lift animate-slide-in-left">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Button 
                    onClick={() => setSelectedMethod("gmail")}
                    disabled={loading || loadingFromDb}
                    variant={selectedMethod === "gmail" ? "default" : "outline"}
                    className={`flex-1 h-10 text-sm ${selectedMethod === "gmail" ? "bg-gradient-to-r from-primary to-secondary shadow-md" : "bg-muted/30"}`}
                  >
                    <div className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      <span>Gmail API</span>
                    </div>
                  </Button>
                  
                  <Button 
                    onClick={() => setSelectedMethod("blynk")}
                    disabled={loading || loadingFromDb}
                    variant={selectedMethod === "blynk" ? "default" : "outline"}
                    className={`flex-1 h-10 text-sm ${selectedMethod === "blynk" ? "bg-gradient-to-r from-secondary to-purple-500 shadow-md" : "bg-muted/30"}`}
                  >
                    <div className="flex items-center gap-1">
                      <Cloud className="h-3 w-3" />
                      <span>Blynk Cloud</span>
                    </div>
                  </Button>
                </div>

                <div className="flex justify-center">
                  <Button
                    onClick={handleFetchNewData}
                    disabled={loading || loadingFromDb || savingToDb}
                    className="h-10 px-8 bg-gradient-to-r from-green-600 to-blue-600 hover:opacity-90 shadow-md font-medium"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                        Fetching...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-3 w-3 mr-2" />
                        Fetch New Data
                      </>
                    )}
                  </Button>
                </div>
                
                {savingToDb && (
                  <div className="flex items-center justify-center gap-1 text-green-600 bg-green-50 py-1 px-2 rounded border border-green-200 text-xs">
                    <Database className="h-2 w-2 animate-pulse" />
                    <span>Saving to database...</span>
                  </div>
                )}

                <div className="text-center">
                  <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/20 text-xs">
                    Current: {selectedMethod === "gmail" ? "Gmail API" : "Blynk Cloud"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {!loading && !loadingFromDb && extractedData.length === 0 && initialLoadDone && (
            <div className="text-center py-12 animate-slide-up">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-3">
                <AlertCircle className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No Data Available</h3>
              <p className="text-muted-foreground max-w-md mx-auto mb-3 text-sm">
                No sensor data found in the database.
              </p>
              <Button
                onClick={handleFetchNewData}
                className="bg-gradient-to-r from-primary to-secondary text-sm h-9"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Fetch Data from {selectedMethod === "gmail" ? "Gmail" : "Blynk Cloud"}
              </Button>
            </div>
          )}

          {loadingFromDb && (
            <div className="text-center py-12">
              <Loader2 className="h-10 w-10 animate-spin mx-auto mb-3 text-primary" />
              <p className="text-muted-foreground text-sm">Loading sensor data...</p>
            </div>
          )}

          {extractedData.length > 0 && !loadingFromDb && (
            <div className="space-y-4 max-w-5xl mx-auto">
              {extractedData.map((data, index) => {
                const locationMatch = data.data.match(/^([^,]+),/);
                const location = locationMatch ? locationMatch[1].trim() : data.location || '';
                const cleanData = locationMatch ? data.data.substring(locationMatch[0].length).trim() : data.data;
                
                // Extract image hash from the data (if it exists in CSV format)
                const ipfsHashMatch = data.data.match(/(Qm[1-9A-HJ-NP-Za-km-z]{44}|bafy[a-z0-9]{59})/);
                const imageHash = ipfsHashMatch ? ipfsHashMatch[0] : data.imageHash;
                
                return (
                <Card 
                  key={`${data.type}-${data.timestamp}-${index}`}
                  className="glass-card hover-lift animate-slide-in-right"
                  style={{animationDelay: `${index * 0.05}s`}}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          data.isRegistered 
                            ? 'bg-gradient-to-br from-green-500 to-emerald-500' 
                            : 'bg-gradient-to-br from-primary to-secondary'
                        }`}>
                          <div className="text-white">
                            {data.icon}
                          </div>
                        </div>
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            {data.title}
                            {data.isRegistered && (
                              <Badge className="bg-green-500/20 text-green-600 border-green-500/30 text-xs">
                                <CheckCircle className="h-2.5 w-2.5 mr-1" />
                                IP Registered
                              </Badge>
                            )}
                          </CardTitle>
                          <CardDescription className="text-xs mt-1">
                            {data.timestamp}
                            {data.id && (
                              <span className="ml-2 text-muted-foreground">
                                ID: {data.id}
                              </span>
                            )}
                            {data.isRegistered && data.registered_at && (
                              <span className="ml-2 text-green-600">
                                • Registered: {new Date(data.registered_at).toLocaleDateString()}
                              </span>
                            )}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex gap-1 items-center flex-wrap">
                        {location && (
                          <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20 text-xs">
                            <MapPin className="h-2 w-2 mr-1" />
                            {location}
                          </Badge>
                        )}
                        <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-xs">
                          Sensor: {data.sensorHealth}
                        </Badge>
                        {data.ip_asset_id && (
                          <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/20 text-xs">
                            IP: {data.ip_asset_id.slice(0, 6)}...
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Left column: Data readings */}
                      <div className="space-y-4">
                        <div className="bg-muted/30 p-4 rounded border border-border">
                          <div className="space-y-3">
                            {(() => {
                              const items = cleanData.split(',');
                              
                              // Filter out IPFS hashes from display
                              const filteredItems = items.filter(item => {
                                const trimmed = item.trim();
                                return !/^(Qm[1-9A-HJ-NP-Za-km-z]{44}|bafy[a-z0-9]{59})$/i.test(trimmed);
                              });
                              
                              return filteredItems.map((item, idx) => {
                                const trimmedItem = item.trim();
                                const isReading = /\d+[.,:]?\d*\s*(lx|°C|%|inches|cm|min|h|m)/.test(trimmedItem);
                                const isTimestamp = /\d{1,2}:\d{2}/.test(trimmedItem);
                                
                                return (
                                  <div key={idx} className="flex items-start gap-2">
                                    <div className="w-20 flex-shrink-0">
                                      <h4 className="text-xs font-semibold text-primary">
                                        {isReading && !isTimestamp ? (
                                          <span>Reading {idx + 1}</span>
                                        ) : isTimestamp ? (
                                          <span>Time Data</span>
                                        ) : (
                                          <span>Info</span>
                                        )}
                                      </h4>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm text-foreground break-words">
                                        {trimmedItem}
                                      </p>
                                    </div>
                                  </div>
                                );
                              });
                            })()}
                          </div>
                        </div>
                        
                        <div className="flex gap-1 pt-3 border-t border-border">
                          {data.isRegistered ? (
                            <>
                              {/* Show disabled "Registered" button for registered data */}
                              <Button 
                                size="sm" 
                                disabled
                                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:opacity-90 text-xs h-8 flex items-center gap-1"
                              >
                                <CheckCircle className="h-3 w-3" />
                                Registered as IP
                              </Button>
                              
                              {/* Show "View IP" button that links to Story Explorer */}
                              {data.story_explorer_url && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="border-purple-500/50 text-purple-600 text-xs h-8 flex items-center gap-1"
                                  onClick={() => window.open(data.story_explorer_url, '_blank')}
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  View IP
                                </Button>
                              )}
                            </>
                          ) : (
                            <>
                              {/* Show "Register as IP" button for unregistered data */}
                              <Button 
                                size="sm" 
                                className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-xs h-8"
                                onClick={() => handleRegisterAsIP(data, location)}
                              >
                                Register as IP
                              </Button>
                              <Button size="sm" variant="outline" className="border-primary/50 text-xs h-8">
                                View History
                              </Button>
                              <Button size="sm" variant="outline" className="border-secondary/50 text-xs h-8">
                                Export Data
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {/* Right column: Image display */}
                      <div className="space-y-4">
                        {imageHash ? (
                          <>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-foreground flex items-center gap-1">
                                  <Image className="h-3 w-3" />
                                  Captured Image
                                </h3>
                                <Badge variant="outline" className="text-xs">
                                  IPFS
                                </Badge>
                              </div>
                              <div className="bg-muted/30 rounded-lg border border-border overflow-hidden aspect-video relative">
                                <img
                                  src={`https://ipfs.io/ipfs/${imageHash}`}
                                  alt="Sensor captured image"
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    // If image fails to load, show a fallback
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    // Create fallback div
                                    const parent = target.parentElement;
                                    if (parent) {
                                      const fallback = document.createElement('div');
                                      fallback.className = 'w-full h-full flex flex-col items-center justify-center bg-muted/50 p-4';
                                      fallback.innerHTML = `
                                        <div class="text-center">
                                          <Image class="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                                          <p class="text-xs text-muted-foreground">Image not available</p>
                                        </div>
                                      `;
                                      parent.appendChild(fallback);
                                    }
                                  }}
                                />
                              </div>
                              <div className="text-xs text-muted-foreground">
                                <a
                                  href={`https://ipfs.io/ipfs/${imageHash}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline flex items-center gap-1"
                                >
                                  <ExternalLink className="h-2.5 w-2.5" />
                                  View original on IPFS
                                </a>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center bg-muted/30 rounded-lg border border-dashed border-border p-6 text-center">
                            <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                              <Image className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <h3 className="text-sm font-semibold mb-1">No Image Available</h3>
                            <p className="text-xs text-muted-foreground">
                              This sensor reading does not contain an image hash
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )})}
            </div>
          )}
        </div>
        
        <div className="absolute top-1/4 right-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-1/4 left-10 w-72 h-72 bg-secondary/10 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
      </div>
      
      <IPRegistrationDialog
        open={ipDialogOpen}
        onOpenChange={setIpDialogOpen}
        sensorData={selectedSensorForIP?.data || null}
        location={selectedSensorForIP?.location || ''}
        sensorDataId={selectedSensorForIP?.data?.id} // Pass the database ID
        supabaseService={supabaseService} // Pass the service
        onRegistrationComplete={handleRegistrationComplete}
      />
    </div>
  );
};

export default DataExtraction;