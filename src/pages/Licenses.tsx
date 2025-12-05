import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  AlertCircle, 
  ExternalLink, 
  Wallet,
  FileCheck,
  Calendar,
  MapPin,
  TrendingUp,
  Thermometer,
  Sun,
  Droplets,
  Sprout,
  CloudRain,
  DollarSign,
  Hash
} from "lucide-react";
import { createSupabaseService } from "@/services/supabaseService";
import type { LicenseRecord } from "@/services/supabaseService";

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

interface LicenseWithDataset extends LicenseRecord {
  dataset_title?: string;
  dataset_type?: string;
  dataset_location?: string;
  icon?: React.ReactNode;
  gradient?: string;
}

const getIconForType = (type?: string): React.ReactNode => {
  if (!type) return <TrendingUp className="h-5 w-5" />;
  
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
      return <TrendingUp className="h-5 w-5" />;
  }
};

const getGradientForType = (type?: string): string => {
  if (!type) return "from-purple-500 to-pink-500";
  
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
      return "from-purple-500 to-pink-500";
  }
};

const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const Licenses = () => {
  const { toast } = useToast();
  const { address, isConnected } = useAccount();
  const [loading, setLoading] = useState(true);
  const [licenses, setLicenses] = useState<LicenseWithDataset[]>([]);
  const [supabaseService] = useState(() => createSupabaseService(SUPABASE_URL, SUPABASE_ANON_KEY));
  const [supabaseClient] = useState(() => createClient(SUPABASE_URL, SUPABASE_ANON_KEY));


  useEffect(() => {
    if (isConnected && address) {
      fetchUserLicenses();
    } else {
      setLoading(false);
    }
  }, [address, isConnected]);

  const fetchUserLicenses = async () => {
    if (!address) return;

    setLoading(true);
    try {
      // Convert address to lowercase for case-insensitive matching
      const normalizedAddress = address.toLowerCase();
      console.log('Fetching licenses for receiver address:', normalizedAddress);
      
      // Fetch licenses using case-insensitive search
      const result = await supabaseClient
        .from('licenses')
        .select('*')
        .ilike('receiver_address', normalizedAddress)
        .order('minted_at', { ascending: false })
        .limit(100);

      console.log('Licenses query result:', result);

      if (result.error) {
        throw new Error(result.error.message);
      }

      if (result.data && result.data.length > 0) {
        // Get all unique sensor data IDs
        const sensorDataIds = [...new Set(result.data.map(l => l.sensor_data_id))];
        
        console.log('Fetching sensor data for IDs:', sensorDataIds);
        
        // Fetch all sensor data in one query using direct client
        const sensorDataResult = await supabaseClient
          .from('sensor_data')
          .select('*')
          .in('id', sensorDataIds);
        
        console.log('Sensor data result:', sensorDataResult);
        
        // Create a map for quick lookup
        const sensorDataMap = new Map(
          sensorDataResult.data?.map(sd => [sd.id, sd]) || []
        );
        
        // Enrich licenses with sensor data
        const enrichedLicenses = result.data.map((license) => {
          const sensorData = sensorDataMap.get(license.sensor_data_id);
          
          console.log(`License ${license.id}: sensor_data_id=${license.sensor_data_id}, found=${!!sensorData}`);
          
          return {
            ...license,
            dataset_title: sensorData?.title || 'Unknown Dataset',
            dataset_type: sensorData?.type || 'Unknown',
            dataset_location: sensorData?.location || undefined,
            icon: getIconForType(sensorData?.type),
            gradient: getGradientForType(sensorData?.type)
          };
        });

        setLicenses(enrichedLicenses);

        toast({
          title: "Licenses Loaded",
          description: `Found ${enrichedLicenses.length} licenses minted to your address`,
        });
      } else {
        setLicenses([]);
        toast({
          title: "No Licenses Found",
          description: "No licenses have been minted to your address yet",
        });
      }
    } catch (error: any) {
      console.error('Error fetching licenses:', error);
      toast({
        title: "Error",
        description: "Failed to load your licenses",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="relative pt-24 pb-12 overflow-hidden">
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center py-24 max-w-2xl mx-auto">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
                <Wallet className="h-10 w-10 text-primary" />
              </div>
              <h1 className="text-4xl font-bold mb-4">
                Connect Your <span className="gradient-text">Wallet</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-6">
                Please connect your wallet to view your license collection
              </p>
              <Button className="bg-gradient-to-r from-primary to-secondary">
                Connect Wallet
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="relative pt-24 pb-12 overflow-hidden">
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center py-24">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-6 text-primary" />
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Loading <span className="gradient-text">Your Licenses</span>
              </h1>
              <p className="text-xl text-muted-foreground">
                Fetching your license collection...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="relative pt-24 pb-12 overflow-hidden">
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-background/80 via-background to-background"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-12 animate-slide-up">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 animate-glow">
              My Collection
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold mb-4">
              Your <span className="gradient-text">Licenses</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-2">
              All agricultural data licenses minted to your address
            </p>
            <p className="text-sm text-muted-foreground font-mono">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </p>
          </div>

          {/* Licenses List */}
          {licenses.length === 0 ? (
            <div className="text-center py-24">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-6">
                <AlertCircle className="h-10 w-10 text-muted-foreground" />
              </div>
              <h2 className="text-3xl font-bold mb-4">No Licenses Yet</h2>
              <p className="text-xl text-muted-foreground mb-6 max-w-2xl mx-auto">
                No licenses have been minted to your address yet. Visit the marketplace to mint licenses for agricultural data!
              </p>
              <Button 
                onClick={() => window.location.href = '/marketplace'}
                className="bg-gradient-to-r from-primary to-secondary"
              >
                Browse Marketplace
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
              {licenses.map((license, index) => (
                <Card 
                  key={license.id}
                  className="glass-card hover-lift group animate-slide-in-left overflow-hidden"
                  style={{animationDelay: `${index * 0.05}s`}}
                >
                  <div className={`h-2 bg-gradient-to-r ${license.gradient}`}></div>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-12 h-12 bg-gradient-to-br ${license.gradient} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <div className="text-white">
                          {license.icon}
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-primary font-bold text-xs">
                        x{license.amount}
                      </Badge>
                    </div>
                    
                    <CardTitle className="text-lg group-hover:text-primary transition-colors mb-2">
                      {license.dataset_title || 'Unknown Dataset'}
                    </CardTitle>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-xs">
                        {license.dataset_type || 'Unknown'}
                      </Badge>
                      {license.revenue_share_percentage && (
                        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 text-xs">
                          {license.revenue_share_percentage}% Rev
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    {license.dataset_location && (
                      <div className="flex items-center gap-2 text-sm bg-blue-500/5 p-2 rounded border border-blue-500/20">
                        <MapPin className="h-3 w-3 text-blue-500 flex-shrink-0" />
                        <span className="text-foreground">{license.dataset_location}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 text-sm bg-purple-500/5 p-2 rounded border border-purple-500/20">
                      <Calendar className="h-3 w-3 text-purple-500 flex-shrink-0" />
                      <span className="text-xs text-muted-foreground">Minted:</span>
                      <span className="text-xs text-foreground font-medium">{formatDate(license.minted_at)}</span>
                    </div>
                    
                    {license.minting_fee_paid && (
                      <div className="flex items-center gap-2 text-sm bg-amber-500/5 p-2 rounded border border-amber-500/20">
                        <DollarSign className="h-3 w-3 text-amber-500 flex-shrink-0" />
                        <span className="text-xs text-muted-foreground">Paid:</span>
                        <span className="text-xs text-foreground font-medium">{license.minting_fee_paid.toFixed(4)} WIP</span>
                      </div>
                    )}
                    
                    <div className="pt-2 border-t border-border space-y-2">
                      <div className="flex items-center gap-2 text-xs">
                        <Hash className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">IP:</span>
                        <span className="font-mono text-primary">{license.ip_asset_id.slice(0, 10)}...</span>
                      </div>
                      
                      {license.license_token_ids && license.license_token_ids.length > 0 && (
                        <div className="flex items-center gap-2 text-xs">
                          <FileCheck className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">Tokens:</span>
                          <span className="font-mono text-foreground">
                            {license.license_token_ids.length} token(s)
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      {license.story_explorer_tx_url && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="flex-1 border-primary/50 text-xs h-8"
                          onClick={() => window.open(license.story_explorer_tx_url, '_blank')}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View TX
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex-1 border-purple-500/50 text-purple-600 text-xs h-8"
                        onClick={() => window.open(`https://aeneid.explorer.story.foundation/ipa/${license.ip_asset_id}`, '_blank')}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View IP
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
        
        <div className="absolute top-1/3 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-1/3 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-float" style={{animationDelay: '3s'}}></div>
      </div>
    </div>
  );
};

export default Licenses;