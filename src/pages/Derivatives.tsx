import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import Navbar from "@/components/Navbar";
import DerivativeIPRegistrationDialog from "@/components/DerivativeIPRegistrationDialog";
import { DerivativeSuccessDialog } from "@/components/DerivativeSuccessDialog"; // Import from separate file
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
  Hash,
  Info,
  Image as ImageIcon,
  User,
  ChevronDown,
  ChevronUp,
  GitBranch,
  FileText,
  Shield
} from "lucide-react";
import { createSupabaseService } from "@/services/supabaseService";
import type { LicenseRecord } from "@/services/supabaseService";
import { getEnrichedMetadata, type EnrichedIPMetadata } from "@/utils/coreMetadataViewService";
import { createClient } from '@supabase/supabase-js';
import { SensorData } from "@/services/gmailService";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

interface LicenseWithDataset extends LicenseRecord {
  dataset_title?: string;
  dataset_type?: string;
  dataset_location?: string;
  dataset_data?: string;
  dataset_timestamp?: string;
  dataset_sensor_health?: string;
  dataset_image_hash?: string;
  icon?: React.ReactNode;
  gradient?: string;
  metadata?: EnrichedIPMetadata;
  metadataLoading?: boolean;
  showMetadata?: boolean;
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

const Derivatives = () => {
  const { toast } = useToast();
  const { address, isConnected } = useAccount();
  const [loading, setLoading] = useState(true);
  const [licenses, setLicenses] = useState<LicenseWithDataset[]>([]);
  const [supabaseService] = useState(() => createSupabaseService(SUPABASE_URL, SUPABASE_ANON_KEY));
  const [supabaseClient] = useState(() => createClient(SUPABASE_URL, SUPABASE_ANON_KEY));
  
  // Dialog states
  const [derivativeDialogOpen, setDerivativeDialogOpen] = useState(false);
  const [showDerivativeSuccess, setShowDerivativeSuccess] = useState(false);
  const [selectedLicenseForDerivative, setSelectedLicenseForDerivative] = useState<LicenseWithDataset | null>(null);
  const [successData, setSuccessData] = useState<{
    ipId?: string;
    txHash?: string;
    storyExplorerUrl?: string;
    parentIpId?: string;
    datasetTitle?: string;
    creatorName?: string;
  } | null>(null);

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
      const normalizedAddress = address.toLowerCase();
      console.log('Fetching licenses for receiver address:', normalizedAddress);
      
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
        const sensorDataIds = [...new Set(result.data.map(l => l.sensor_data_id))];
        
        console.log('Fetching sensor data for IDs:', sensorDataIds);
        
        const sensorDataResult = await supabaseClient
          .from('sensor_data')
          .select('*')
          .in('id', sensorDataIds);
        
        console.log('Sensor data result:', sensorDataResult);
        
        const sensorDataMap = new Map(
          sensorDataResult.data?.map(sd => [sd.id, sd]) || []
        );
        
        const enrichedLicenses = result.data.map((license) => {
          const sensorData = sensorDataMap.get(license.sensor_data_id);
          
          console.log(`License ${license.id}: sensor_data_id=${license.sensor_data_id}, found=${!!sensorData}`);
          
          return {
            ...license,
            dataset_title: sensorData?.title || 'Unknown Dataset',
            dataset_type: sensorData?.type || 'Unknown',
            dataset_location: sensorData?.location || undefined,
            dataset_data: sensorData?.data || undefined,
            dataset_timestamp: sensorData?.timestamp || undefined,
            dataset_sensor_health: sensorData?.sensor_health || undefined,
            dataset_image_hash: sensorData?.image_hash || undefined,
            icon: getIconForType(sensorData?.type),
            gradient: getGradientForType(sensorData?.type),
            showMetadata: false,
            metadataLoading: false,
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

  const decodeJsonString = (jsonString?: string) => {
    if (!jsonString) return null;
    
    try {
      const base64Data = jsonString.replace('data:application/json;base64,', '');
      const decodedString = atob(base64Data);
      return JSON.parse(decodedString);
    } catch (error) {
      console.error('Error decoding jsonString:', error);
      return null;
    }
  };

  const toggleMetadata = async (licenseId: number | string) => {
    const license = licenses.find(l => l.id === licenseId);
    if (!license) return;

    if (license.showMetadata) {
      setLicenses(prev => prev.map(l => 
        l.id === licenseId ? { ...l, showMetadata: false } : l
      ));
      return;
    }

    if (!license.metadata && !license.metadataLoading) {
      setLicenses(prev => prev.map(l => 
        l.id === licenseId ? { ...l, metadataLoading: true } : l
      ));

      try {
        const metadata = await getEnrichedMetadata(license.ip_asset_id as `0x${string}`);
        console.log('Fetched metadata for', license.ip_asset_id, metadata);
        
        const decodedJson = decodeJsonString(metadata.jsonString);
        console.log('Decoded JSON:', decodedJson);
        
        if (decodedJson) {
          const attributes = decodedJson.attributes || [];
          const attributesMap = new Map(
            attributes.map((attr: any) => [attr.trait_type, attr.value])
          );
          
          const ownerValue = attributesMap.get('Owner');
          const metadataURIValue = attributesMap.get('MetadataURI');
          const nftTokenURIValue = attributesMap.get('NFTTokenURI');
          const metadataHashValue = attributesMap.get('MetadataHash');
          const nftMetadataHashValue = attributesMap.get('NFTMetadataHash');
          const regDateStr = attributesMap.get('Registration Date');
          
          if (ownerValue && typeof ownerValue === 'string') {
            metadata.owner = ownerValue as `0x${string}`;
          }
          if (metadataURIValue && typeof metadataURIValue === 'string') {
            metadata.metadataURI = metadataURIValue;
          }
          if (nftTokenURIValue && typeof nftTokenURIValue === 'string') {
            metadata.nftTokenURI = nftTokenURIValue;
          }
          if (metadataHashValue && typeof metadataHashValue === 'string') {
            metadata.metadataHash = metadataHashValue as `0x${string}`;
          }
          if (nftMetadataHashValue && typeof nftMetadataHashValue === 'string') {
            metadata.nftMetadataHash = nftMetadataHashValue as `0x${string}`;
          }
          if (regDateStr && (typeof regDateStr === 'string' || typeof regDateStr === 'number')) {
            metadata.registrationDate = BigInt(regDateStr);
          }
          
          if (metadata.metadataURI) {
            try {
              const ipfsUrl = metadata.metadataURI.replace('ipfs://', 'https://ipfs.io/ipfs/');
              const response = await fetch(ipfsUrl);
              if (response.ok) {
                metadata.ipMetadataDetails = await response.json();
              }
            } catch (err) {
              console.error('Error fetching IP metadata from URI:', err);
            }
          }
          
          if (metadata.nftTokenURI) {
            try {
              const ipfsUrl = metadata.nftTokenURI.replace('ipfs://', 'https://ipfs.io/ipfs/');
              const response = await fetch(ipfsUrl);
              if (response.ok) {
                metadata.nftMetadataDetails = await response.json();
              }
            } catch (err) {
              console.error('Error fetching NFT metadata from URI:', err);
            }
          }
        }
        
        setLicenses(prev => prev.map(l => 
          l.id === licenseId ? { 
            ...l, 
            metadata, 
            metadataLoading: false, 
            showMetadata: true 
          } : l
        ));

        toast({
          title: "Metadata Loaded",
          description: "Successfully fetched IP metadata",
        });
      } catch (error: any) {
        console.error('Error fetching metadata:', error);
        setLicenses(prev => prev.map(l => 
          l.id === licenseId ? { ...l, metadataLoading: false } : l
        ));
        
        toast({
          title: "Error",
          description: "Failed to load metadata",
          variant: "destructive",
        });
      }
    } else {
      setLicenses(prev => prev.map(l => 
        l.id === licenseId ? { ...l, showMetadata: true } : l
      ));
    }
  };

  const handleOpenDerivativeDialog = (license: LicenseWithDataset) => {
    // Check if we have all required license data
    if (!license.ip_asset_id || !license.license_terms_id) {
      toast({
        title: "Missing License Data",
        description: "This license doesn't have complete IP data for derivative registration",
        variant: "destructive",
      });
      return;
    }

    // Check if we have sensor data
    if (!license.dataset_data || !license.dataset_timestamp) {
      toast({
        title: "Missing Sensor Data",
        description: "This license doesn't have complete sensor data for derivative registration",
        variant: "destructive",
      });
      return;
    }

    setSelectedLicenseForDerivative(license);
    setDerivativeDialogOpen(true);
    setShowDerivativeSuccess(false); // Reset success state
    setSuccessData(null);
  };

  const handleDerivativeRegistrationComplete = (successData?: {
    ipId?: string;
    txHash?: string;
    storyExplorerUrl?: string;
    parentIpId?: string;
    datasetTitle?: string;
    creatorName?: string;
  }) => {
    // Close the registration dialog
    setDerivativeDialogOpen(false);
    
    // Set success data and show success dialog
    if (successData) {
      setSuccessData(successData);
      setTimeout(() => {
        setShowDerivativeSuccess(true);
      }, 100);
    }
    
    toast({
      title: "Derivative Created! 🎉",
      description: "Your derivative IP has been successfully registered",
    });
    
    // Optionally refresh licenses
    fetchUserLicenses();
  };

  const handleCloseDerivativeSuccess = () => {
    setShowDerivativeSuccess(false);
    setSuccessData(null);
    setSelectedLicenseForDerivative(null);
  };

  const convertLicenseToSensorData = (license: LicenseWithDataset): SensorData | null => {
    if (!license.dataset_data || !license.dataset_timestamp || !license.dataset_type || !license.dataset_title) {
      return null;
    }

    return {
      type: license.dataset_type,
      title: license.dataset_title,
      data: license.dataset_data,
      timestamp: license.dataset_timestamp,
      sensorHealth: license.dataset_sensor_health || 'Unknown',
      imageHash: license.dataset_image_hash || '',
    };
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
      
      {/* Derivative Registration Dialog */}
      {selectedLicenseForDerivative && (
        <DerivativeIPRegistrationDialog
          open={derivativeDialogOpen}
          onOpenChange={(open) => {
            setDerivativeDialogOpen(open);
            if (!open) {
              setSelectedLicenseForDerivative(null);
            }
          }}
          sensorData={convertLicenseToSensorData(selectedLicenseForDerivative)}
          location={selectedLicenseForDerivative.dataset_location || 'Unknown Location'}
          sensorDataId={selectedLicenseForDerivative.sensor_data_id}
          supabaseService={supabaseService}
          onRegistrationComplete={handleDerivativeRegistrationComplete}
          parentIpAssetId={selectedLicenseForDerivative.ip_asset_id}
          licenseTermsId={selectedLicenseForDerivative.license_terms_id}
        />
      )}
      
      {/* Derivative Success Dialog */}
      {successData && selectedLicenseForDerivative && (
        <DerivativeSuccessDialog
          open={showDerivativeSuccess}
          onOpenChange={handleCloseDerivativeSuccess}
          ipId={successData.ipId || ''}
          txHash={successData.txHash || ''}
          storyExplorerUrl={successData.storyExplorerUrl}
          parentIpId={successData.parentIpId}
          datasetTitle={selectedLicenseForDerivative.dataset_title || 'Unknown Dataset'}
          creatorName={successData.creatorName || 'Unknown Creator'}
          sensorDataId={selectedLicenseForDerivative.sensor_data_id}
        />
      )}
      
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
                      {/* IP Asset ID */}
                      <div className="flex items-center gap-2 text-xs">
                        <Shield className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">IP:</span>
                        <span className="font-mono text-primary">{license.ip_asset_id.slice(0, 10)}...</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`https://aeneid.explorer.story.foundation/ipa/${license.ip_asset_id}`, '_blank');
                          }}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      {/* License Terms ID */}
                      <div className="flex items-center gap-2 text-xs">
                        <FileText className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">License:</span>
                        <span className="font-mono text-foreground">
                          {license.license_terms_id.slice(0, 10)}...
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`https://aeneid.explorer.story.foundation/license-terms/${license.license_terms_id}`, '_blank');
                          }}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
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

                    {/* Create Derivative Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-indigo-500/50 text-indigo-600 hover:bg-indigo-500/10 text-xs h-9"
                      onClick={() => handleOpenDerivativeDialog(license)}
                    >
                      <GitBranch className="h-3 w-3 mr-1" />
                      Create Derivative IP
                    </Button>

                    {/* Metadata Toggle Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-primary/30 text-primary text-xs h-8"
                      onClick={() => toggleMetadata(license.id)}
                      disabled={license.metadataLoading}
                    >
                      {license.metadataLoading ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Loading Metadata...
                        </>
                      ) : (
                        <>
                          <Info className="h-3 w-3 mr-1" />
                          {license.showMetadata ? 'Hide' : 'Show'} IP Metadata
                          {license.showMetadata ? (
                            <ChevronUp className="h-3 w-3 ml-1" />
                          ) : (
                            <ChevronDown className="h-3 w-3 ml-1" />
                          )}
                        </>
                      )}
                    </Button>

                    {/* Metadata Display */}
                    {license.showMetadata && license.metadata && (
                      <div className="space-y-3 pt-3 border-t border-border">
                        <div className="text-xs font-semibold text-primary flex items-center gap-1">
                          <Info className="h-3 w-3" />
                          IP Metadata Details
                        </div>

                        {license.metadata.ipMetadataDetails?.description && (
                          <div className="bg-primary/5 p-2 rounded border border-primary/20">
                            <div className="text-xs text-muted-foreground mb-1">Description</div>
                            <div className="text-xs">{license.metadata.ipMetadataDetails.description}</div>
                          </div>
                        )}

                        {license.metadata.ipMetadataDetails?.image && (
                          <div className="bg-primary/5 p-2 rounded border border-primary/20">
                            <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                              <ImageIcon className="h-3 w-3" />
                              Image
                            </div>
                            <img 
                              src={license.metadata.ipMetadataDetails.image.replace('ipfs://', 'https://ipfs.io/ipfs/')} 
                              alt="IP Asset"
                              className="w-full h-32 object-cover rounded"
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                          </div>
                        )}

                        {license.metadata.owner && (
                          <div className="bg-primary/5 p-2 rounded border border-primary/20">
                            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                              <User className="h-3 w-3" />
                              Owner
                            </div>
                            <div className="text-xs font-mono break-all">{license.metadata.owner}</div>
                          </div>
                        )}

                        {license.metadata.registrationDate && (
                          <div className="bg-primary/5 p-2 rounded border border-primary/20">
                            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Registered
                            </div>
                            <div className="text-xs">
                              {(() => {
                                try {
                                  const timestamp = typeof license.metadata.registrationDate === 'bigint' 
                                    ? Number(license.metadata.registrationDate) 
                                    : license.metadata.registrationDate;
                                  const date = new Date(timestamp * 1000);
                                  return date.toLocaleString();
                                } catch (e) {
                                  return 'N/A';
                                }
                              })()}
                            </div>
                          </div>
                        )}

                        {license.metadata.ipMetadataDetails?.creators && license.metadata.ipMetadataDetails.creators.length > 0 && (
                          <div className="bg-primary/5 p-2 rounded border border-primary/20">
                            <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                              <User className="h-3 w-3" />
                              Creators
                            </div>
                            {license.metadata.ipMetadataDetails.creators.map((creator, idx) => (
                              <div key={idx} className="text-xs mb-1">
                                <div className="flex justify-between items-center">
                                  <span className="font-medium">{creator.name}</span>
                                  <span className="text-muted-foreground">{creator.contributionPercent}%</span>
                                </div>
                                {creator.address && (
                                  <div className="font-mono text-muted-foreground text-[10px] mt-0.5">
                                    {creator.address}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    
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

export default Derivatives;