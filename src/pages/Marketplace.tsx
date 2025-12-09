import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Thermometer, 
  Sun, 
  Droplets, 
  Sprout, 
  CloudRain, 
  TrendingUp, 
  MapPin, 
  Calendar, 
  Clock,
  Loader2,
  AlertCircle,
  ExternalLink,
  Info,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  User
} from "lucide-react";
import marketplaceBg from "@/assets/marketplace-bg.jpg";
import { createSupabaseService } from "@/services/supabaseService";
import { useToast } from "@/hooks/use-toast";
import { MintLicenseDialog } from "@/components/MintLicenseDialog";
import { getEnrichedMetadata, type EnrichedIPMetadata } from "@/utils/coreMetadataViewService";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

interface MarketplaceDataset {
  id: number;
  ip_asset_id: string;
  type: string;
  title: string;
  description: string;
  location?: string;
  timestamp: string;
  registered_at: string;
  creator_address: string;
  story_explorer_url?: string;
  icon: React.ReactNode;
  gradient: string;
  sensor_health: string;
  data: string;
  license_terms_ids?: string[];
  revenue_share?: number;
  minting_fee?: number;
  metadata?: EnrichedIPMetadata;
  metadataLoading?: boolean;
  showMetadata?: boolean;
}

const getIconForType = (type: string): React.ReactNode => {
  switch (type.toLowerCase()) {
    case 'temperature':
    case 'temp':
      return <Thermometer className="h-6 w-6" />;
    case 'sunlight':
    case 'sun':
      return <Sun className="h-6 w-6" />;
    case 'moisture':
    case 'soil':
      return <Droplets className="h-6 w-6" />;
    case 'growth':
    case 'crop':
      return <Sprout className="h-6 w-6" />;
    case 'rainfall':
    case 'rain':
      return <CloudRain className="h-6 w-6" />;
    default:
      return <TrendingUp className="h-6 w-6" />;
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
      return "from-purple-500 to-pink-500";
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const Marketplace = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [datasets, setDatasets] = useState<MarketplaceDataset[]>([]);
  const [supabaseService] = useState(() => createSupabaseService(SUPABASE_URL, SUPABASE_ANON_KEY));

  useEffect(() => {
    fetchRegisteredDatasets();
  }, []);

  const fetchRegisteredDatasets = async () => {
    setLoading(true);
    try {
      const result = await supabaseService.fetchSensorData({
        has_ip_registration: true
      });

      if (result.success && result.data && result.data.length > 0) {
        const transformedData: MarketplaceDataset[] = result.data.map(record => {
          const dataPreview = record.data.length > 100 
            ? record.data.substring(0, 100) + '...' 
            : record.data;
          
          return {
            id: record.id!,
            ip_asset_id: record.ip_asset_id!,
            type: record.type,
            title: record.title,
            description: `${record.type} data from ${record.location || 'unknown location'}. ${dataPreview}`,
            location: record.location,
            timestamp: record.timestamp,
            registered_at: record.registered_at || record.created_at || record.timestamp,
            creator_address: record.creator_address!,
            story_explorer_url: record.story_explorer_url,
            icon: getIconForType(record.type),
            gradient: getGradientForType(record.type),
            sensor_health: record.sensor_health,
            data: record.data,
            license_terms_ids: record.license_terms_ids,
            revenue_share: record.revenue_share,
            minting_fee: record.minting_fee,
            showMetadata: false,
            metadataLoading: false,
          };
        });

        setDatasets(transformedData);
        
        toast({
          title: "Marketplace Updated",
          description: `Found ${transformedData.length} registered datasets available for licensing`,
        });
      } else {
        setDatasets([]);
      }
    } catch (error: any) {
      console.error('Error fetching marketplace data:', error);
      toast({
        title: "Error",
        description: "Failed to load marketplace data",
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

  const toggleMetadata = async (datasetId: number) => {
    const dataset = datasets.find(d => d.id === datasetId);
    if (!dataset) return;

    if (dataset.showMetadata) {
      setDatasets(prev => prev.map(d => 
        d.id === datasetId ? { ...d, showMetadata: false } : d
      ));
      return;
    }

    if (!dataset.metadata && !dataset.metadataLoading) {
      setDatasets(prev => prev.map(d => 
        d.id === datasetId ? { ...d, metadataLoading: true } : d
      ));

      try {
        const metadata = await getEnrichedMetadata(dataset.ip_asset_id as `0x${string}`);
        console.log('Fetched metadata for', dataset.ip_asset_id, metadata);
        
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
        
        setDatasets(prev => prev.map(d => 
          d.id === datasetId ? { 
            ...d, 
            metadata, 
            metadataLoading: false, 
            showMetadata: true 
          } : d
        ));

        toast({
          title: "Metadata Loaded",
          description: "Successfully fetched IP metadata",
        });
      } catch (error: any) {
        console.error('Error fetching metadata:', error);
        setDatasets(prev => prev.map(d => 
          d.id === datasetId ? { ...d, metadataLoading: false } : d
        ));
        
        toast({
          title: "Error",
          description: "Failed to load metadata",
          variant: "destructive",
        });
      }
    } else {
      setDatasets(prev => prev.map(d => 
        d.id === datasetId ? { ...d, showMetadata: true } : d
      ));
    }
  };

  const handleViewDetails = (dataset: MarketplaceDataset) => {
    toast({
      title: dataset.title,
      description: `Location: ${dataset.location || 'Unknown'}\nRecorded: ${formatDateTime(dataset.timestamp)}`,
    });
  };

  const handleViewIP = (url: string) => {
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="relative pt-24 pb-12 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img 
              src={marketplaceBg} 
              alt="Data Marketplace" 
              className="w-full h-full object-cover opacity-20"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background to-background"></div>
          </div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center py-24">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-6 text-primary" />
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Loading <span className="gradient-text">Marketplace</span>
              </h1>
              <p className="text-xl text-muted-foreground">
                Fetching registered datasets...
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
        <div className="absolute inset-0 z-0">
          <img 
            src={marketplaceBg} 
            alt="Data Marketplace" 
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background to-background"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-12 animate-slide-up">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 animate-glow">
              Live Marketplace
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold mb-4">
              <span className="gradient-text">Data</span> Marketplace
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Mint licenses for verified agricultural sensor data from farms worldwide. 
              All data is IP-protected on blockchain.
            </p>
            <div className="mt-6 flex items-center justify-center gap-4">
              <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
                {datasets.length} Datasets Available
              </Badge>
              <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/30">
                IP Protected
              </Badge>
              <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/30">
                Licensable
              </Badge>
            </div>
          </div>

          {datasets.length === 0 ? (
            <div className="text-center py-24">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-6">
                <AlertCircle className="h-10 w-10 text-muted-foreground" />
              </div>
              <h2 className="text-3xl font-bold mb-4">No Datasets Available</h2>
              <p className="text-xl text-muted-foreground mb-6 max-w-2xl mx-auto">
                There are no registered datasets in the marketplace yet. 
                Be the first to register your sensor data as IP!
              </p>
              <Button 
                onClick={() => window.location.href = '/extract'}
                className="bg-gradient-to-r from-primary to-secondary"
              >
                Register Your Data
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
                {datasets.map((dataset, index) => (
                  <Card 
                    key={dataset.id}
                    className="glass-card hover-lift group animate-slide-in-left overflow-hidden"
                    style={{animationDelay: `${index * 0.05}s`}}
                  >
                    <div className={`h-2 bg-gradient-to-r ${dataset.gradient}`}></div>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between mb-3">
                        <div className={`w-14 h-14 bg-gradient-to-br ${dataset.gradient} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                          <div className="text-white">
                            {dataset.icon}
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-primary font-bold text-xs">
                          IP Protected
                        </Badge>
                      </div>
                      
                      <CardTitle className="text-xl group-hover:text-primary transition-colors mb-2">
                        {dataset.title}
                      </CardTitle>
                      
                      <div className="flex flex-wrap gap-2 mb-2">
                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-xs">
                          {dataset.type}
                        </Badge>
                        <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 text-xs">
                          {dataset.sensor_health}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 mt-3">
                        {dataset.location && (
                          <div className="flex items-center gap-2 text-sm bg-blue-500/5 p-2 rounded border border-blue-500/20">
                            <MapPin className="h-3 w-3 text-blue-500 flex-shrink-0" />
                            <span className="font-semibold text-blue-600">Location:</span>
                            <span className="text-foreground font-medium">{dataset.location}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 text-sm bg-amber-500/5 p-2 rounded border border-amber-500/20">
                          <Calendar className="h-3 w-3 text-amber-500 flex-shrink-0" />
                          <span className="font-semibold text-amber-600">Recorded:</span>
                          <span className="text-foreground font-medium">{formatDate(dataset.timestamp)}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm bg-purple-500/5 p-2 rounded border border-purple-500/20">
                          <Clock className="h-3 w-3 text-purple-500 flex-shrink-0" />
                          <span className="font-semibold text-purple-600">Time:</span>
                          <span className="text-foreground font-medium">{formatTime(dataset.timestamp)}</span>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-3">
                      <div className="text-sm text-muted-foreground line-clamp-2">
                        {dataset.description}
                      </div>
                      
                      <div className="flex flex-wrap gap-2 text-xs">
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">IP ID:</span>
                          <span className="font-mono text-primary">
                            {dataset.ip_asset_id.slice(0, 8)}...
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">Registered:</span>
                          <span className="font-semibold">{formatDate(dataset.registered_at)}</span>
                        </div>
                      </div>
                      
                      {(dataset.revenue_share || dataset.minting_fee) && (
                        <div className="flex gap-2 text-xs">
                          {dataset.revenue_share && (
                            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                              {dataset.revenue_share}% Rev Share
                            </Badge>
                          )}
                          {dataset.minting_fee && (
                            <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">
                              {dataset.minting_fee} WIP
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Metadata Toggle Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full border-primary/30 text-primary text-xs h-8"
                        onClick={() => toggleMetadata(dataset.id)}
                        disabled={dataset.metadataLoading}
                      >
                        {dataset.metadataLoading ? (
                          <>
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            Loading Metadata...
                          </>
                        ) : (
                          <>
                            <Info className="h-3 w-3 mr-1" />
                            {dataset.showMetadata ? 'Hide' : 'Show'} IP Metadata
                            {dataset.showMetadata ? (
                              <ChevronUp className="h-3 w-3 ml-1" />
                            ) : (
                              <ChevronDown className="h-3 w-3 ml-1" />
                            )}
                          </>
                        )}
                      </Button>

                      {/* Metadata Display */}
                      {dataset.showMetadata && dataset.metadata && (
                        <div className="space-y-3 pt-3 border-t border-border">
                          <div className="text-xs font-semibold text-primary flex items-center gap-1">
                            <Info className="h-3 w-3" />
                            IP Metadata Details
                          </div>

                          {dataset.metadata.ipMetadataDetails?.description && (
                            <div className="bg-primary/5 p-2 rounded border border-primary/20">
                              <div className="text-xs text-muted-foreground mb-1">Description</div>
                              <div className="text-xs">{dataset.metadata.ipMetadataDetails.description}</div>
                            </div>
                          )}

                          {dataset.metadata.ipMetadataDetails?.image && (
                            <div className="bg-primary/5 p-2 rounded border border-primary/20">
                              <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                                <ImageIcon className="h-3 w-3" />
                                Image
                              </div>
                              <img 
                                src={dataset.metadata.ipMetadataDetails.image.replace('ipfs://', 'https://ipfs.io/ipfs/')} 
                                alt="IP Asset"
                                className="w-full h-32 object-cover rounded"
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                              />
                            </div>
                          )}

                          {dataset.metadata.owner && (
                            <div className="bg-primary/5 p-2 rounded border border-primary/20">
                              <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                <User className="h-3 w-3" />
                                Owner
                              </div>
                              <div className="text-xs font-mono break-all">{dataset.metadata.owner}</div>
                            </div>
                          )}

                          {dataset.metadata.registrationDate && (
                            <div className="bg-primary/5 p-2 rounded border border-primary/20">
                              <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Registered
                              </div>
                              <div className="text-xs">
                                {(() => {
                                  try {
                                    const timestamp = typeof dataset.metadata.registrationDate === 'bigint' 
                                      ? Number(dataset.metadata.registrationDate) 
                                      : dataset.metadata.registrationDate;
                                    const date = new Date(timestamp * 1000);
                                    return date.toLocaleString();
                                  } catch (e) {
                                    return 'N/A';
                                  }
                                })()}
                              </div>
                            </div>
                          )}

                          {dataset.metadata.ipMetadataDetails?.creators && dataset.metadata.ipMetadataDetails.creators.length > 0 && (
                            <div className="bg-primary/5 p-2 rounded border border-primary/20">
                              <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                                <User className="h-3 w-3" />
                                Creators
                              </div>
                              {dataset.metadata.ipMetadataDetails.creators.map((creator, idx) => (
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
                        <MintLicenseDialog
                          ipId={dataset.ip_asset_id}
                          licenseTermsId={dataset.license_terms_ids?.map(id => BigInt(id))}
                          datasetTitle={dataset.title}
                          location={dataset.location}
                          revenueShare={dataset.revenue_share}
                          mintingFee={dataset.minting_fee}
                          storyExplorerUrl={dataset.story_explorer_url}
                          sensorDataId={dataset.id}
                          supabaseService={supabaseService}
                        />
                        <Button 
                          variant="outline" 
                          className="border-primary/50 text-sm h-9"
                          onClick={() => handleViewDetails(dataset)}
                        >
                          Details
                        </Button>
                        {dataset.story_explorer_url && (
                          <Button 
                            variant="outline" 
                            className="border-purple-500/50 text-purple-600 text-sm h-9"
                            onClick={() => handleViewIP(dataset.story_explorer_url!)}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              <div className="mt-12 pt-8 border-t border-border">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-center">
                  <div>
                    <p className="text-3xl font-bold gradient-text">{datasets.length}</p>
                    <p className="text-sm text-muted-foreground">Total Datasets</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold gradient-text">
                      {new Set(datasets.map(d => d.type)).size}
                    </p>
                    <p className="text-sm text-muted-foreground">Sensor Types</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold gradient-text">
                      {new Set(datasets.filter(d => d.location).map(d => d.location)).size}
                    </p>
                    <p className="text-sm text-muted-foreground">Locations</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold gradient-text">
                      {new Set(datasets.map(d => d.creator_address.slice(0, 10) + '...')).size}
                    </p>
                    <p className="text-sm text-muted-foreground">Creators</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
        
        <div className="absolute top-1/3 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-1/3 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-float" style={{animationDelay: '3s'}}></div>
      </div>
    </div>
  );
};

export default Marketplace;