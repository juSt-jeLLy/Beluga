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
import IPRegistrationDialog from "@/components/IPRegistrationDialog";

const GMAIL_API_KEY = import.meta.env.VITE_GMAIL_API_KEY;
const GMAIL_CLIENT_ID = import.meta.env.VITE_GMAIL_CLIENT_ID;
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const BLYNK_API_URL = import.meta.env.VITE_BLYNK_API_URL;
const BLYNK_SERVER = import.meta.env.VITE_BLYNK_SERVER;
const BLYNK_ACCESS_TOKEN = import.meta.env.VITE_BLYNK_ACCESS_TOKEN;
const BLYNK_TEMPLATE_ID = parseInt(import.meta.env.VITE_BLYNK_TEMPLATE_ID);

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
    BLYNK_TEMPLATE_ID
  ));
  const [scriptsLoaded, setScriptsLoaded] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [savingToDb, setSavingToDb] = useState(false);
  const [loadingFromDb, setLoadingFromDb] = useState(false);
  const [selectedSensorForIP, setSelectedSensorForIP] = useState<{
    data: SensorData;
    location: string;
  } | null>(null);
  const [ipDialogOpen, setIpDialogOpen] = useState(false);

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

  const handleRegisterAsIP = (data: SensorData, location: string) => {
    setSelectedSensorForIP({ data, location });
    setIpDialogOpen(true);
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
                
                return (
                <Card 
                  key={`${data.type}-${data.timestamp}-${index}`}
                  className="glass-card hover-lift animate-slide-in-right"
                  style={{animationDelay: `${index * 0.05}s`}}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                          <div className="text-white">
                            {data.icon}
                          </div>
                        </div>
                        <div>
                          <CardTitle className="text-lg">{data.title}</CardTitle>
                          <CardDescription className="text-xs mt-1">
                            {data.timestamp}
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
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="bg-muted/30 p-4 rounded border border-border">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          {(() => {
                            const items = cleanData.split(',');
                            const halfPoint = Math.ceil(items.length / 2);
                            return items.slice(0, halfPoint).map((item, idx) => {
                              const trimmedItem = item.trim();
                              const isReading = /\d+[.,:]?\d*\s*(lx|°C|%|inches|cm|min|h|m)/.test(trimmedItem);
                              const isTimestamp = /\d{1,2}:\d{2}/.test(trimmedItem);
                              
                              return (
                                <div key={idx}>
                                  {isReading && !isTimestamp ? (
                                    <div>
                                      <h4 className="text-xs font-semibold text-primary mb-1">Reading {idx + 1}</h4>
                                      <p className="text-sm ml-2">{trimmedItem}</p>
                                    </div>
                                  ) : isTimestamp ? (
                                    <div>
                                      <h4 className="text-xs font-semibold text-primary mb-1">Time Data</h4>
                                      <p className="text-sm ml-2">{trimmedItem}</p>
                                    </div>
                                  ) : (
                                    <div>
                                      <h4 className="text-xs font-semibold text-primary mb-1">Info</h4>
                                      <p className="text-sm ml-2">{trimmedItem}</p>
                                    </div>
                                  )}
                                </div>
                              );
                            });
                          })()}
                        </div>
                        
                        <div className="space-y-3">
                          {(() => {
                            const items = cleanData.split(',');
                            const halfPoint = Math.ceil(items.length / 2);
                            return items.slice(halfPoint).map((item, idx) => {
                              const trimmedItem = item.trim();
                              const isReading = /\d+[.,:]?\d*\s*(lx|°C|%|inches|cm|min|h|m)/.test(trimmedItem);
                              const isTimestamp = /\d{1,2}:\d{2}/.test(trimmedItem);
                              
                              return (
                                <div key={idx}>
                                  {isReading && !isTimestamp ? (
                                    <div>
                                      <h4 className="text-xs font-semibold text-primary mb-1">Reading {halfPoint + idx + 1}</h4>
                                      <p className="text-sm ml-2">{trimmedItem}</p>
                                    </div>
                                  ) : isTimestamp ? (
                                    <div>
                                      <h4 className="text-xs font-semibold text-primary mb-1">Time Data</h4>
                                      <p className="text-sm ml-2">{trimmedItem}</p>
                                    </div>
                                  ) : (
                                    <div>
                                      <h4 className="text-xs font-semibold text-primary mb-1">Info</h4>
                                      <p className="text-sm ml-2">{trimmedItem}</p>
                                    </div>
                                  )}
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1 pt-3 border-t border-border">
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
      />
    </div>
  );
};

export default DataExtraction;