import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Mail, Cloud, Thermometer, Sun, Droplets, Sprout, CloudRain, AlertCircle, Loader2 } from "lucide-react";
import dataPatternBg from "@/assets/data-pattern.jpg";
import { createGmailService } from "@/services/gmailService";
import type { SensorData } from "@/services/gmailService";

const GMAIL_API_KEY = "";
const GMAIL_CLIENT_ID = "";
const BLYNK_API_URL = "https://blynk.cloud/external/api/logEvent?token=z5qJn_MTSXa_Sljdpt-oez5e200XOmPq&code=live_crop_growth";

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

const DataExtraction = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [extractedData, setExtractedData] = useState<SensorData[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<"gmail" | "blynk">("gmail");
  const [gmailService] = useState(() => createGmailService(GMAIL_API_KEY, GMAIL_CLIENT_ID));
  const [scriptsLoaded, setScriptsLoaded] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

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

  // Auto-fetch on page load
  useEffect(() => {
    if (scriptsLoaded && !initialLoadDone) {
      setInitialLoadDone(true);
      if (selectedMethod === "gmail") {
        extractFromGmail();
      } else {
        extractFromBlynk();
      }
    }
  }, [scriptsLoaded, initialLoadDone, selectedMethod]);

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
        setExtractedData([]);
        toast({
          title: "No Data Available",
          description: "No sensor emails found in the last 24 hours.",
          variant: "destructive",
        });
        return;
      }

      // Add icons to the fetched data
      const dataWithIcons = emails.map(email => ({
        ...email,
        icon: getIconForType(email.type)
      }));

      setExtractedData(dataWithIcons);
      
      toast({
        title: "Success",
        description: `Extracted ${emails.length} sensor readings`,
      });
    } catch (error: any) {
      console.error('Gmail extraction error:', error);
      setExtractedData([]);
      
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

      // Fetch from Blynk Cloud API
      const response = await fetch(BLYNK_API_URL);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Parse Blynk response and create sensor data
      const blynkData: SensorData[] = [];
      
      if (data && typeof data === 'object') {
        const eventData = Array.isArray(data) ? data : [data];
        
        for (const event of eventData) {
          const description = event.description || event.data || JSON.stringify(event);
          
          blynkData.push({
            type: 'growth',
            title: 'Live Crop Growth',
            data: `${description}\n\n📊 Context: Real-time data from Blynk Cloud IoT platform tracking crop development metrics and environmental correlations.`,
            timestamp: event.timestamp || new Date().toLocaleString('en-US', { 
              year: 'numeric', 
              month: '2-digit', 
              day: '2-digit', 
              hour: '2-digit', 
              minute: '2-digit', 
              second: '2-digit',
              hour12: true
            }),
            sensorHealth: '100%',
            icon: <Sprout className="h-5 w-5" />
          });
        }
      }
      
      if (blynkData.length === 0) {
        setExtractedData([]);
        toast({
          title: "No Data Available",
          description: "Blynk API returned no events.",
          variant: "destructive",
        });
      } else {
        setExtractedData(blynkData);
        toast({
          title: "Success",
          description: `Retrieved ${blynkData.length} events from Blynk Cloud`,
        });
      }
    } catch (error: any) {
      console.error('Blynk extraction error:', error);
      setExtractedData([]);
      
      toast({
        title: "Error",
        description: "Unable to connect to Blynk Cloud",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMethodChange = (method: "gmail" | "blynk") => {
    setSelectedMethod(method);
    setExtractedData([]);
    if (method === "gmail") {
      extractFromGmail();
    } else {
      extractFromBlynk();
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

          <Card className="mb-8 glass-card max-w-3xl mx-auto hover-lift animate-slide-in-left">
            <CardHeader>
              <CardTitle className="text-2xl">Data Source</CardTitle>
              <CardDescription>Choose extraction method</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Button 
                  onClick={() => handleMethodChange("gmail")}
                  disabled={loading}
                  variant={selectedMethod === "gmail" ? "default" : "outline"}
                  className={`flex-1 h-20 ${selectedMethod === "gmail" ? "bg-gradient-to-r from-primary to-secondary" : ""}`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <Mail className="h-6 w-6" />
                    <span className="font-semibold">Gmail API</span>
                  </div>
                </Button>
                
                <Button 
                  onClick={() => handleMethodChange("blynk")}
                  disabled={loading}
                  variant={selectedMethod === "blynk" ? "default" : "outline"}
                  className={`flex-1 h-20 ${selectedMethod === "blynk" ? "bg-gradient-to-r from-secondary to-purple-500" : ""}`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <Cloud className="h-6 w-6" />
                    <span className="font-semibold">Blynk Cloud</span>
                  </div>
                </Button>
              </div>
              
              {loading && (
                <div className="mt-6 flex items-center justify-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading data...</span>
                </div>
              )}
            </CardContent>
          </Card>

          {!loading && extractedData.length === 0 && initialLoadDone && (
            <div className="text-center py-16 animate-slide-up">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-4">
                <AlertCircle className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-2xl font-semibold mb-2">No Data Available</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                No sensor data found in the last 24 hours from {selectedMethod === "gmail" ? "Gmail" : "Blynk Cloud"}.
              </p>
            </div>
          )}

          {extractedData.length > 0 && (
            <div className="space-y-6 max-w-5xl mx-auto">
              <div className="text-center animate-slide-up">
                <h2 className="text-3xl font-bold mb-2">
                  Extracted <span className="gradient-text">Data</span>
                </h2>
                <p className="text-muted-foreground">Last 24 Hours • {extractedData.length} readings</p>
              </div>
              
              {extractedData.map((data, index) => (
                <Card 
                  key={`${data.type}-${index}`}
                  className="glass-card hover-lift animate-slide-in-right"
                  style={{animationDelay: `${index * 0.1}s`}}
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
                      <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                        Sensor: {data.sensorHealth}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{data.data}</p>
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
              ))}
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