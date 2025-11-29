import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Mail, Cloud, Thermometer, Sun, Droplets, Sprout, CloudRain, AlertCircle, Loader2, MapPin, Database, RefreshCw } from "lucide-react";
import dataPatternBg from "@/assets/data-pattern.jpg";
import { createGmailService } from "@/services/gmailService";
import type { SensorData } from "@/services/gmailService";
import { createSupabaseService } from "@/services/supabaseService";
import type { SensorDataRecord } from "@/services/supabaseService";
import { createBlynkService } from "@/services/blynkService";
import type { SensorDataFromBlynk } from "@/services/blynkService";

const GMAIL_API_KEY = "";
const GMAIL_CLIENT_ID = "";
const SUPABASE_URL = "";
const SUPABASE_ANON_KEY = "";
const BLYNK_SERVER = "https://fra1.blynk.cloud";
const BLYNK_ACCESS_TOKEN = "";
const BLYNK_TEMPLATE_ID = 1;
const BLYNK_LOG_EVENT_TOKEN = "z5qJn_MTSXa_Sljdpt-oez5e200XOmPq";

// Icon mapping helper
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

// Convert SensorDataRecord to SensorData for display
const convertToDisplayData = (record: SensorDataRecord): SensorData => {
  return {
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
    icon: getIconForType(record.type)
  };
};

const DataExtraction = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [extractedData, setExtractedData] = useState<SensorData[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<"gmail" | "blynk">("gmail");
  const [gmailService] = useState(() => createGmailService(GMAIL_API_KEY, GMAIL_CLIENT_ID));
  const [supabaseService] = useState(() => createSupabaseService(SUPABASE_URL, SUPABASE_ANON_KEY));
  const [blynkService] = useState(() => createBlynkService(
    BLYNK_SERVER,
    BLYNK_ACCESS_TOKEN,
    BLYNK_TEMPLATE_ID,
    BLYNK_LOG_EVENT_TOKEN
  ));
  const [scriptsLoaded, setScriptsLoaded] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [savingToDb, setSavingToDb] = useState(false);
  const [loadingFromDb, setLoadingFromDb] = useState(false);

  // Load Google API scripts on component mount
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

  // Load data from database on page load
  useEffect(() => {
    if (!initialLoadDone) {
      setInitialLoadDone(true);
      loadFromDatabase();
    }
  }, [initialLoadDone]);

  // Load existing data from Supabase
  const loadFromDatabase = async () => {
    setLoadingFromDb(true);
    try {
      toast({
        title: "Loading Data",
        description: "Fetching stored sensor data from database...",
      });

      const result = await supabaseService.fetchSensorData({
        limit: 50 // Load last 50 records
      });

      if (result.success && result.data && result.data.length > 0) {
        const displayData = result.data.map(convertToDisplayData);
        setExtractedData(displayData);
        
        toast({
          title: "Data Loaded",
          description: `Loaded ${result.data.length} sensor readings from database`,
        });
      } else {
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

      // Initialize GAPI client
      await gmailService.initGapiClient();
      
      // Initialize Google Identity Services
      await gmailService.initGoogleIdentity();

      // Check if already has token
      if (!gmailService.hasAccessToken()) {
        toast({
          title: "Sign In Required",
          description: "Please authorize access to your Gmail...",
        });
        
        // Request access token (this will show the OAuth popup)
        await gmailService.requestAccessToken();
      }

      toast({
        title: "Fetching Data",
        description: "Retrieving sensor emails...",
      });

      // Fetch emails from last 24 hours
      const emails = await gmailService.fetchEmails('robot@blynk.cloud');
      
      if (emails.length === 0) {
        toast({
          title: "No New Data",
          description: "No new sensor emails found in the last 24 hours.",
        });
        return;
      }

      // Add icons to the fetched data
      const dataWithIcons = emails.map(email => ({
        ...email,
        icon: getIconForType(email.type)
      }));

      // Save to Supabase
      await saveToSupabase(dataWithIcons, 'gmail');
      
      // Reload from database to show merged data (no duplicates)
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

      // Fetch sensor data using the Blynk service
      const result = await blynkService.fetchAllSensorData();
      
      if (!result.success || !result.data || result.data.length === 0) {
        toast({
          title: "No New Data",
          description: result.error || "No sensor data available from Blynk Cloud.",
        });
        return;
      }

      // Convert Blynk data to SensorData format
      const blynkData: SensorData[] = result.data.map(item => ({
        type: item.type,
        title: item.title,
        data: item.data,
        timestamp: item.timestamp,
        sensorHealth: item.sensorHealth,
        location: item.location,
        icon: getIconForType(item.type)
      }));

      // Save to Supabase
      await saveToSupabase(blynkData, 'blynk');
      
      // Reload from database to show merged data (no duplicates)
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
      // Prepare data for Supabase
      const records = data.map(item => {
        // Extract location from data
        const locationMatch = item.data.match(/^([^,]+),/);
        const location = locationMatch ? locationMatch[1].trim() : item.location || '';

        // Convert timestamp to ISO format
        const timestamp = new Date(item.timestamp).toISOString();

        return {
          type: item.type,
          title: item.title,
          data: item.data,
          location: location || null,
          timestamp,
          sensor_health: item.sensorHealth,
          source
        };
      });

      // Check for duplicates and filter them out
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

      // Insert records
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
          <div className="mb-8 text-center animate-slide-up">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 animate-glow">
              Data Extraction
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold mb-4">
              Extract <span className="gradient-text">Robot Data</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Retrieve agricultural sensor data from IoT devices
            </p>
          </div>

          {/* Updated Compact Data Source Section */}
          <Card className="mb-8 glass-card max-w-3xl mx-auto hover-lift animate-slide-in-left">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl flex items-center gap-2">
                <Database className="h-5 w-5" />
                Data Source
              </CardTitle>
              <CardDescription>Choose extraction method and fetch data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Method Selection - Compact Horizontal Layout */}
              <div className="flex gap-3">
                <Button 
                  onClick={() => setSelectedMethod("gmail")}
                  disabled={loading || loadingFromDb}
                  variant={selectedMethod === "gmail" ? "default" : "outline"}
                  className={`flex-1 h-12 ${selectedMethod === "gmail" ? "bg-gradient-to-r from-primary to-secondary shadow-lg" : "bg-muted/50"}`}
                >
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span className="font-medium">Gmail API</span>
                  </div>
                </Button>
                
                <Button 
                  onClick={() => setSelectedMethod("blynk")}
                  disabled={loading || loadingFromDb}
                  variant={selectedMethod === "blynk" ? "default" : "outline"}
                  className={`flex-1 h-12 ${selectedMethod === "blynk" ? "bg-gradient-to-r from-secondary to-purple-500 shadow-lg" : "bg-muted/50"}`}
                >
                  <div className="flex items-center gap-2">
                    <Cloud className="h-4 w-4" />
                    <span className="font-medium">Blynk Cloud</span>
                  </div>
                </Button>
              </div>

              {/* Action Buttons - Wider and Better Spaced */}
              <div className="flex gap-3">
                <Button
                  onClick={handleFetchNewData}
                  disabled={loading || loadingFromDb || savingToDb}
                  className="flex-[2] h-12 bg-gradient-to-r from-green-600 to-blue-600 hover:opacity-90 shadow-lg font-semibold"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Fetching...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Fetch New Data
                    </>
                  )}
                </Button>

                <Button
                  onClick={loadFromDatabase}
                  disabled={loading || loadingFromDb || savingToDb}
                  variant="outline"
                  className="flex-1 h-12 border-primary/30 hover:bg-primary/5 font-medium"
                >
                  {loadingFromDb ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Database className="h-4 w-4 mr-2" />
                      Reload DB
                    </>
                  )}
                </Button>
              </div>
              
              {/* Status Indicator */}
              {savingToDb && (
                <div className="flex items-center justify-center gap-2 text-green-600 bg-green-50 py-2 px-3 rounded-lg border border-green-200">
                  <Database className="h-3 w-3 animate-pulse" />
                  <span className="text-sm font-medium">Saving to database...</span>
                </div>
              )}

              {/* Selected Method Indicator */}
              <div className="text-center">
                <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/20">
                  Current: {selectedMethod === "gmail" ? "Gmail API" : "Blynk Cloud"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {!loading && !loadingFromDb && extractedData.length === 0 && initialLoadDone && (
            <div className="text-center py-16 animate-slide-up">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-4">
                <AlertCircle className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-2xl font-semibold mb-2">No Data Available</h3>
              <p className="text-muted-foreground max-w-md mx-auto mb-4">
                No sensor data found in the database.
              </p>
              <Button
                onClick={handleFetchNewData}
                className="bg-gradient-to-r from-primary to-secondary"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Fetch Data from {selectedMethod === "gmail" ? "Gmail" : "Blynk Cloud"}
              </Button>
            </div>
          )}

          {(loadingFromDb) && (
            <div className="text-center py-16">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Loading sensor data...</p>
            </div>
          )}

          {extractedData.length > 0 && !loadingFromDb && (
            <div className="space-y-6 max-w-5xl mx-auto">
              <div className="text-center animate-slide-up">
                <h2 className="text-3xl font-bold mb-2">
                  Sensor <span className="gradient-text">Data</span>
                </h2>
                <p className="text-muted-foreground">Total: {extractedData.length} readings</p>
              </div>
              
              {extractedData.map((data, index) => {
                // Extract location from the first comma-separated value in data
                const locationMatch = data.data.match(/^([^,]+),/);
                const location = locationMatch ? locationMatch[1].trim() : data.location || '';
                
                return (
                <Card 
                  key={`${data.type}-${data.timestamp}-${index}`}
                  className="glass-card hover-lift animate-slide-in-right"
                  style={{animationDelay: `${index * 0.05}s`}}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
                          <div className="text-white">
                            {data.icon}
                          </div>
                        </div>
                        <div>
                          <CardTitle className="text-xl">{data.title}</CardTitle>
                          <CardDescription className="text-xs mt-1">
                            {data.timestamp}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex gap-2 items-center flex-wrap">
                        {location && (
                          <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                            <MapPin className="h-3 w-3 mr-1" />
                            {location}
                          </Badge>
                        )}
                        <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                          Sensor: {data.sensorHealth}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-muted/30 p-4 rounded-lg border border-border">
                      <p className="text-sm font-mono leading-relaxed whitespace-pre-wrap">{data.data}</p>
                    </div>
                    <div className="flex gap-2 pt-4 border-t border-border">
                      <Button size="sm" className="bg-gradient-to-r from-primary to-secondary hover:opacity-90">
                        Register as IP
                      </Button>
                      <Button size="sm" variant="outline" className="border-primary/50">
                        View History
                      </Button>
                      <Button size="sm" variant="outline" className="border-secondary/50">
                        Export Data
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )})}
            </div>
          )}
        </div>
        
        {/* Floating background elements */}
        <div className="absolute top-1/4 right-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-1/4 left-10 w-72 h-72 bg-secondary/10 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
      </div>
    </div>
  );
};

export default DataExtraction;