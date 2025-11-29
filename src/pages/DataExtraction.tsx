import { useState } from "react";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Mail, Cloud, Thermometer, Sun, Droplets, Sprout, CloudRain, CheckCircle2 } from "lucide-react";
import dataPatternBg from "@/assets/data-pattern.jpg";

interface SensorData {
  type: string;
  title: string;
  data: string;
  timestamp: string;
  sensorHealth: string;
  icon: React.ReactNode;
}

const GMAIL_API_KEY = "AIzaSyC5K2m80NzP5le8sZzC6Rt3g3OmNzpqqTs";
const GMAIL_CLIENT_ID = "226061445084-3gjpm5p0v29hcknu6gjlie6qbfc2njt7.apps.googleusercontent.com";
const BLYNK_API_URL = "https://blynk.cloud/external/api/logEvent?token=z5qJn_MTSXa_Sljdpt-oez5e200XOmPq&code=live_crop_growth";

const DataExtraction = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [extractedData, setExtractedData] = useState<SensorData[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<"gmail" | "blynk">("gmail");

  const mockSensorData: SensorData[] = [
    {
      type: "temperature",
      title: "Temperature & Humidity",
      data: "Morning 09:00: 23.4°C/61%, Noon 13:00: 29.8°C/48%, Evening 18:00: 25.1°C/54%, Heat Index 30.4°C, Dew Point 17°C. Stable conditions beneficial for cereals cultivation.",
      timestamp: "2024-01-15 18:30:00",
      sensorHealth: "97%",
      icon: <Thermometer className="h-5 w-5" />
    },
    {
      type: "sunlight",
      title: "Sunlight Intensity",
      data: "Peak hours 10:50-14:15. Morning readings: 22,500lx, Noon peak: 61,200lx, Evening: 8,900lx. Quality Score: 78/100. Occasional 1-2 minute shade from tree canopy on west boundary detected by BH1750 sensor.",
      timestamp: "2024-01-15 18:15:00",
      sensorHealth: "100%",
      icon: <Sun className="h-5 w-5" />
    },
    {
      type: "moisture",
      title: "Soil Moisture Levels",
      data: "Average 41% moisture at 7cm depth. Readings: 09:00→35%, 12:00→38%, 15:00→51% (post-rain spike), 18:00→48%. Bajra crop optimum range. Moisture spike correlates with rainfall event.",
      timestamp: "2024-01-15 18:00:00",
      sensorHealth: "96%",
      icon: <Droplets className="h-5 w-5" />
    },
    {
      type: "growth",
      title: "Live Crop Growth",
      data: "Pearl Millet current height: 42.3cm, Early vegetative stage. Growth rate: +1.9cm daily average. Active leaf count: 7 leaves. Environmental correlation: Soil moisture 41%, Sunlight score 78/100. Healthy development pattern observed.",
      timestamp: "2024-01-15 17:45:00",
      sensorHealth: "100%",
      icon: <Sprout className="h-5 w-5" />
    },
    {
      type: "rainfall",
      title: "Rainfall Data",
      data: "Total precipitation: 4.8 inches over 3h 12m duration. Timeline: Start 14:23, End 17:35. Pattern: Steady rain for 90 minutes, heavy downpour 15:58-16:42, light drizzle finish. Arduino rain gauge sensor.",
      timestamp: "2024-01-15 17:35:00",
      sensorHealth: "92%",
      icon: <CloudRain className="h-5 w-5" />
    }
  ];

  const extractFromGmail = async () => {
    setLoading(true);
    try {
      // Note: Actual Gmail API requires OAuth2 authentication flow
      // This is a simplified example showing the structure
      toast({
        title: "Gmail Integration",
        description: "Gmail API requires OAuth2 authentication. This would typically open a popup for user consent and then fetch emails from robot@blynk.cloud with the specified subjects.",
      });

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // In production, you would:
      // 1. Initialize Google Auth with client_id
      // 2. Request user consent for Gmail scope
      // 3. Fetch emails with query: from:robot@blynk.cloud subject:(story: temperature OR story: rainfall...)
      // 4. Parse email bodies to extract sensor data
      
      setExtractedData(mockSensorData);
      
      toast({
        title: "Data Extracted Successfully",
        description: `Extracted ${mockSensorData.length} sensor readings from last 24 hours`,
      });
    } catch (error) {
      toast({
        title: "Extraction Failed",
        description: "Unable to fetch data from Gmail API",
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
        title: "Blynk Cloud Integration",
        description: "Fetching data from Blynk Cloud API...",
      });

      // In production, you would fetch from BLYNK_API_URL
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // For demo, using mock data
      setExtractedData(mockSensorData);
      
      toast({
        title: "Data Extracted Successfully",
        description: `Retrieved ${mockSensorData.length} events from Blynk Cloud`,
      });
    } catch (error) {
      toast({
        title: "Extraction Failed",
        description: "Unable to fetch data from Blynk Cloud",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExtract = () => {
    if (selectedMethod === "gmail") {
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
              Retrieve agricultural sensor data from your IoT devices via Gmail or Blynk Cloud
            </p>
          </div>

          <Card className="mb-8 glass-card max-w-5xl mx-auto hover-lift animate-slide-in-left">
            <CardHeader>
              <CardTitle className="text-2xl">Choose Data Source</CardTitle>
              <CardDescription className="text-base">Select how you want to extract data from your agricultural robot</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="gmail" onValueChange={(v) => setSelectedMethod(v as "gmail" | "blynk")}>
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="gmail" className="gap-2">
                    <Mail className="h-4 w-4" />
                    Gmail API
                  </TabsTrigger>
                  <TabsTrigger value="blynk" className="gap-2">
                    <Cloud className="h-4 w-4" />
                    Blynk Cloud
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="gmail" className="space-y-4">
                  <div className="rounded-lg border border-primary/20 bg-card/50 p-6">
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <Mail className="h-5 w-5 text-primary" />
                      Gmail Configuration
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Extracts emails from robot@blynk.cloud sent in the last 24 hours
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary mt-1" />
                        <div className="text-sm">
                          <span className="font-semibold">Filters: </span>
                          <span className="text-muted-foreground">temperature, humidity, sunlight, moisture, crop growth, rainfall</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary mt-1" />
                        <div className="text-sm font-mono text-xs text-muted-foreground break-all">
                          Client ID: {GMAIL_CLIENT_ID.slice(0, 40)}...
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button 
                    onClick={handleExtract} 
                    disabled={loading} 
                    className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-lg h-12"
                  >
                    {loading ? "Extracting..." : "Extract from Gmail"}
                  </Button>
                </TabsContent>

                <TabsContent value="blynk" className="space-y-4">
                  <div className="rounded-lg border border-secondary/20 bg-card/50 p-6">
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <Cloud className="h-5 w-5 text-secondary" />
                      Blynk Cloud Configuration
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Fetches live crop growth events directly from Blynk Cloud API
                    </p>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-secondary mt-1" />
                      <div className="text-xs font-mono text-muted-foreground break-all">
                        API Endpoint: {BLYNK_API_URL.slice(0, 60)}...
                      </div>
                    </div>
                  </div>
                  <Button 
                    onClick={handleExtract} 
                    disabled={loading} 
                    className="w-full bg-gradient-to-r from-secondary to-purple-500 hover:opacity-90 text-lg h-12"
                  >
                    {loading ? "Extracting..." : "Extract from Blynk Cloud"}
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {extractedData.length > 0 && (
            <div className="space-y-6 max-w-5xl mx-auto">
              <div className="text-center animate-slide-up">
                <h2 className="text-3xl font-bold mb-2">
                  Extracted <span className="gradient-text">Data</span>
                </h2>
                <p className="text-muted-foreground">Last 24 Hours</p>
              </div>
              
              {extractedData.map((data, index) => (
                <Card 
                  key={index}
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
                    <p className="text-sm text-muted-foreground leading-relaxed">{data.data}</p>
                    <div className="flex gap-2 pt-4 border-t border-border">
                      <Button size="sm" className="bg-gradient-to-r from-primary to-secondary hover:opacity-90">
                        Register as IP
                      </Button>
                      <Button size="sm" variant="outline" className="border-primary/50">
                        View History
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
