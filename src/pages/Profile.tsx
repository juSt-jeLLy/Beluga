import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Thermometer, Sun, Droplets, Sprout, CloudRain, TrendingUp, Shield, Loader2, ExternalLink, AlertCircle,MapPin } from "lucide-react";
import { useAccount } from "wagmi";
import { useToast } from "@/hooks/use-toast";
import { createSupabaseService } from "@/services/supabaseService";
import type { SensorDataRecord } from "@/services/supabaseService";
import { CheckCircle } from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

interface RegisteredDataset {
  id: number;
  ip_asset_id: string;
  type: string;
  title: string;
  registrationDate: string;
  status: string;
  creator_address: string;
  story_explorer_url?: string;
  icon: React.ReactNode;
  gradient: string;
  location?: string;
  timestamp: string;
  sensor_health: string;
}

const getIconForType = (type: string): React.ReactNode => {
  switch (type.toLowerCase()) {
    case 'temperature':
    case 'temp':
      return <Thermometer className="h-5 w-5" />;
    case 'sunlight':
    case 'sun':
      return <Sun className="h-5 w-5" />;
    case 'moisture':
    case 'soil':
      return <Droplets className="h-5 w-5" />;
    case 'growth':
    case 'crop':
      return <Sprout className="h-5 w-5" />;
    case 'rainfall':
    case 'rain':
      return <CloudRain className="h-5 w-5" />;
    default:
      return <AlertCircle className="h-5 w-5" />;
  }
};

const getGradientForType = (type: string): string => {
  switch (type.toLowerCase()) {
    case 'temperature':
    case 'temp':
      return "from-orange-500 to-red-500";
    case 'sunlight':
    case 'sun':
      return "from-yellow-500 to-orange-500";
    case 'moisture':
    case 'soil':
      return "from-blue-500 to-cyan-500";
    case 'growth':
    case 'crop':
      return "from-green-500 to-emerald-500";
    case 'rainfall':
    case 'rain':
      return "from-indigo-500 to-blue-500";
    default:
      return "from-primary to-secondary";
  }
};

const Profile = () => {
  const { address, isConnected } = useAccount();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [registeredData, setRegisteredData] = useState<RegisteredDataset[]>([]);
  const [supabaseService] = useState(() => createSupabaseService(SUPABASE_URL, SUPABASE_ANON_KEY));

  useEffect(() => {
    if (isConnected && address) {
      fetchRegisteredData();
    } else {
      setLoading(false);
    }
  }, [address, isConnected]);

  const fetchRegisteredData = async () => {
    setLoading(true);
    try {
      // Fetch only data registered through the connected wallet address
      const result = await supabaseService.fetchSensorData({
        has_ip_registration: true // Only get registered data
      });

      if (result.success && result.data) {
        // Filter by creator_address (current wallet address)
        const myRegisteredData = result.data.filter(
          record => record.creator_address?.toLowerCase() === address?.toLowerCase()
        );

        // Transform data to match the profile format
        const transformedData: RegisteredDataset[] = myRegisteredData.map(record => ({
          id: record.id!,
          ip_asset_id: record.ip_asset_id!,
          type: record.type,
          title: record.title,
          registrationDate: record.registered_at 
            ? new Date(record.registered_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })
            : 'Unknown',
          status: 'Active',
          creator_address: record.creator_address!,
          story_explorer_url: record.story_explorer_url,
          icon: getIconForType(record.type),
          gradient: getGradientForType(record.type),
          location: record.location || undefined,
          timestamp: record.timestamp,
          sensor_health: record.sensor_health
        }));

        setRegisteredData(transformedData);
        
        toast({
          title: "Data Loaded",
          description: `Found ${transformedData.length} registered datasets`,
        });
      } else {
        setRegisteredData([]);
      }
    } catch (error: any) {
      console.error('Error fetching registered data:', error);
      toast({
        title: "Error",
        description: "Failed to load registered data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const totalEarnings = registeredData.length * 0; // Placeholder - you might want to fetch actual earnings from blockchain
  const totalSubscribers = registeredData.length * 0; // Placeholder - fetch actual subscribers if available

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-24">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-6">
              <AlertCircle className="h-10 w-10 text-muted-foreground" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Wallet Not Connected
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Please connect your wallet to view your registered IP assets
            </p>
            <p className="text-sm text-muted-foreground">
              Your registered datasets will appear here once you connect your wallet
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-24">
          <div className="max-w-4xl mx-auto text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-6 text-primary" />
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Loading Your Data
            </h1>
            <p className="text-xl text-muted-foreground">
              Fetching your registered IP assets...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-24">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Profile Header */}
          <div className="text-center animate-slide-up">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 animate-glow">
              Your Profile
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold mb-4">
              Your <span className="gradient-text">Registered IP</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Track your IP-protected datasets registered through your wallet
            </p>
           
          </div>

          {/* Stats Overview */}
          <div className="grid md:grid-cols-3 gap-6 animate-slide-in-left">
            <Card className="glass-card hover-lift">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
                    <TrendingUp className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Earnings</p>
                    <p className="text-3xl font-bold gradient-text">{totalEarnings.toFixed(1)} IP</p>
                    <p className="text-xs text-muted-foreground mt-1">(Placeholder - Real earnings coming soon)</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card hover-lift">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                    <Shield className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Registered Datasets</p>
                    <p className="text-3xl font-bold">{registeredData.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card hover-lift">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                    <TrendingUp className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Subscribers</p>
                    <p className="text-3xl font-bold">{totalSubscribers}</p>
                    <p className="text-xs text-muted-foreground mt-1">(Placeholder - Real subscribers coming soon)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Registered Data List */}
          <div className="space-y-4">
            <h2 className="text-3xl font-bold mb-6">
              IP-Protected <span className="gradient-text">Datasets</span>
            </h2>
            
            {registeredData.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-4">
                  <AlertCircle className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No Registered Datasets Found</h3>
                <p className="text-muted-foreground mb-6">
                  You haven't registered any IP assets yet. Go to the Extract Data page to register your sensor data.
                </p>
                <Button 
                  onClick={() => window.location.href = '/extract'}
                  className="bg-gradient-to-r from-primary to-secondary"
                >
                  Go to Extract Data
                </Button>
              </div>
            ) : (
              registeredData.map((item, index) => (
                <Card 
                  key={item.id}
                  className="glass-card hover-lift animate-slide-in-right"
                  style={{animationDelay: `${index * 0.1}s`}}
                >
                  <div className={`h-1 bg-gradient-to-r ${item.gradient}`}></div>
                  <CardHeader>
                    <div className="flex items-start justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 bg-gradient-to-br ${item.gradient} rounded-xl flex items-center justify-center`}>
                          <div className="text-white">
                            {item.icon}
                          </div>
                        </div>
                        <div>
                          <CardTitle className="text-xl">{item.title}</CardTitle>
                          <CardDescription className="mt-1">
                            IP Asset ID: <span className="font-mono font-semibold">{item.ip_asset_id.slice(0, 12)}...</span>
                            {item.location && (
                              <span className="ml-3 text-blue-500">
                                <MapPin className="inline h-3 w-3 mr-1" />
                                {item.location}
                              </span>
                            )}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge className="bg-green-500/20 text-green-600 border-green-500/30">
                        <CheckCircle className="h-2.5 w-2.5 mr-1" />
                        {item.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Registration Date</p>
                        <p className="font-semibold">{item.registrationDate}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Sensor Type</p>
                        <p className="font-semibold capitalize">{item.type}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Health Status</p>
                        <p className="font-semibold">{item.sensor_health}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <p className="font-semibold text-green-500">Active</p>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-4 border-t border-border">
                      <Button 
                        size="sm" 
                        className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                      >
                        View Analytics
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="border-primary/50"
                      >
                        Manage Access
                      </Button>
                      {item.story_explorer_url && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="border-purple-500/50 text-purple-600"
                          onClick={() => window.open(item.story_explorer_url, '_blank')}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View IP
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
      
      {/* Floating background elements */}
      <div className="fixed top-1/3 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-float pointer-events-none"></div>
      <div className="fixed bottom-1/3 right-10 w-96 h-96 bg-secondary/5 rounded-full blur-3xl animate-float pointer-events-none" style={{animationDelay: '3s'}}></div>
    </div>
  );
};

export default Profile;