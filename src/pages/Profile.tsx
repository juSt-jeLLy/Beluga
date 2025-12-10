// src/pages/Profile.tsx
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Thermometer, 
  Sun, 
  Droplets, 
  Sprout, 
  CloudRain, 
  TrendingUp, 
  Shield, 
  Loader2, 
  ExternalLink, 
  AlertCircle, 
  MapPin, 
  Coins, 
  CheckCircle,
  FileCheck,
  Calendar,
  DollarSign,
  FileText,
  Info,
  ChevronDown,
  ChevronUp,
  User,
  Image as ImageIcon,
  ArrowRightLeft
} from "lucide-react";
import { useAccount } from "wagmi";
import { useToast } from "@/hooks/use-toast";
import { createSupabaseService } from "@/services/supabaseService";
import type { SensorDataRecord, LicenseRecord } from "@/services/supabaseService";
import { 
  useRevenueClaiming, 
  useClaimableRevenue,
  useRevenueClaimingFromDerivatives 
} from "@/utils/revenueClaimingService";
import { Address, zeroAddress } from "viem";
import { ClaimRevenueDialog } from "@/components/ClaimRevenueDialog";
import { getEnrichedMetadata, type EnrichedIPMetadata } from "@/utils/coreMetadataViewService";
import { createClient } from '@supabase/supabase-js';
import { useRoyaltyPayment } from "@/utils/royaltyPaymentService";
import { PayRoyaltyDialog } from "@/components/PayRoyaltyDialog";

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

interface DerivativeWithRevenue {
  id: number;
  sensor_data_id: number;
  derivative_ip_id: string;
  parent_ip_id: string;
  license_terms_id: string;
  creator_name: string;
  creator_address: string;
  royalty_recipient: string;
  royalty_percentage: number;
  max_minting_fee: number;
  max_revenue_share: number;
  max_rts: number;
  transaction_hash: string;
  story_explorer_url?: string;
  metadata_url: string;
  character_file_url: string;
  nft_token_id: string;
  nft_contract_address: string;
  image_url: string;
  registered_at: string;
  created_at: string;
  derivative_type: string;
  derivative_title: string;
  derivative_location?: string;
  derivative_timestamp?: string;
  derivative_data?: string;
  parent_type?: string;
  parent_title?: string;
  parent_location?: string;
  parent_creator_address?: string;
  claimableAmount?: string;
  claiming?: boolean;
}

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

interface LicenseCardProps {
  license: LicenseWithDataset;
  index: number;
  toggleMetadata: (licenseId: number | string) => void;
  toast: any;
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

// Component to display and claim revenue for each dataset
const DatasetRevenueCard = ({ dataset }: { dataset: RegisteredDataset }) => {
  const { claimableAmount, loading: fetchingRevenue, refetch } = useClaimableRevenue(dataset.ip_asset_id as Address);
  const { claimRevenue, claiming } = useRevenueClaiming();
  const { claimRevenueFromDerivatives, claimingFromDerivatives } = useRevenueClaimingFromDerivatives();
  const { toast } = useToast();
  const [supabaseClient] = useState(() => createClient(SUPABASE_URL, SUPABASE_ANON_KEY));
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [claimTxHash, setClaimTxHash] = useState<string>("");
  const [claimError, setClaimError] = useState<string>("");
  
  const [claimDerivativesDialogOpen, setClaimDerivativesDialogOpen] = useState(false);
  const [claimDerivativesSuccess, setClaimDerivativesSuccess] = useState(false);
  const [claimDerivativesTxHash, setClaimDerivativesTxHash] = useState<string>("");
  const [claimDerivativesError, setClaimDerivativesError] = useState<string>("");
  const [derivativesForDataset, setDerivativesForDataset] = useState<DerivativeWithRevenue[]>([]);
  const [loadingDerivatives, setLoadingDerivatives] = useState(false);

  const formattedAmount = claimableAmount 
    ? (parseFloat(claimableAmount) / 1e18).toFixed(6)
    : '0.000000';

  const handleClaimRevenue = async () => {
    setClaimSuccess(false);
    setClaimError("");
    setClaimTxHash("");
    setDialogOpen(true);
    
    try {
      const result = await claimRevenue(dataset.ip_asset_id as Address);
      
      if (result.success) {
        const txHash = result.txHashes && result.txHashes.length > 0
          ? result.txHashes[0]
          : '';
        
        setClaimTxHash(txHash);
        setClaimSuccess(true);
        setTimeout(() => refetch(), 2000);
      } else {
        setClaimError(result.error || "Failed to claim revenue");
        setClaimSuccess(false);
      }
    } catch (error: any) {
      console.error('Claim error:', error);
      setClaimError(error.message || "An unexpected error occurred");
      setClaimSuccess(false);
    }
  };

  const handleClaimRevenueFromDerivatives = async () => {
    setLoadingDerivatives(true);
    
    try {
      // Fetch derivatives for this dataset (parent IP)
      const result = await supabaseClient
        .from('derivative_ip_assets')
        .select(`
          derivative_ip_id,
          parent_ip_id,
          creator_name
        `)
        .eq('parent_ip_id', dataset.ip_asset_id);
      
      if (result.error) {
        throw new Error(result.error.message);
      }
      
      if (result.data && result.data.length > 0) {
        setDerivativesForDataset(result.data.map(d => ({
          id: 0,
          sensor_data_id: 0,
          derivative_ip_id: d.derivative_ip_id,
          parent_ip_id: d.parent_ip_id,
          license_terms_id: "",
          creator_name: d.creator_name,
          creator_address: "",
          royalty_recipient: "",
          royalty_percentage: 0,
          max_minting_fee: 0,
          max_revenue_share: 0,
          max_rts: 0,
          transaction_hash: "",
          metadata_url: "",
          character_file_url: "",
          nft_token_id: "",
          nft_contract_address: "",
          image_url: "",
          registered_at: "",
          created_at: "",
          derivative_type: "",
          derivative_title: "",
          claimableAmount: "0",
          claiming: false
        })));
        
        setClaimDerivativesDialogOpen(true);
      } else {
        toast({
          title: "No Derivatives Found",
          description: "This dataset doesn't have any derivatives yet.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Error fetching derivatives:', error);
      toast({
        title: "Error",
        description: "Failed to fetch derivatives",
        variant: "destructive",
      });
    } finally {
      setLoadingDerivatives(false);
    }
  };

  const handleConfirmClaimFromDerivatives = async () => {
    if (derivativesForDataset.length === 0) {
      setClaimDerivativesError("No derivatives found for this dataset");
      return;
    }

    setClaimDerivativesSuccess(false);
    setClaimDerivativesError("");
    setClaimDerivativesTxHash("");
    
    try {
      // Convert derivative IP IDs to Address type
      const childIpIds = derivativesForDataset.map(d => d.derivative_ip_id as Address);
      
      console.log('Claiming from derivatives:', {
        parentIpId: dataset.ip_asset_id,
        childCount: childIpIds.length,
        childIpIds
      });
      
      const result = await claimRevenueFromDerivatives(
        dataset.ip_asset_id as Address,
        childIpIds
      );
      
      if (result.success) {
        const txHash = result.txHashes && result.txHashes.length > 0
          ? result.txHashes[0]
          : '';
        
        setClaimDerivativesTxHash(txHash);
        setClaimDerivativesSuccess(true);
        setTimeout(() => refetch(), 2000);
        
        toast({
          title: "Revenue Claimed from Derivatives",
          description: `Successfully claimed revenue from ${childIpIds.length} derivatives`,
        });
      } else {
        setClaimDerivativesError(result.error || "Failed to claim revenue from derivatives");
        setClaimDerivativesSuccess(false);
      }
    } catch (error: any) {
      console.error('Claim from derivatives error:', error);
      setClaimDerivativesError(error.message || "An unexpected error occurred");
      setClaimDerivativesSuccess(false);
    }
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setTimeout(() => {
        setClaimSuccess(false);
        setClaimError("");
        setClaimTxHash("");
      }, 300);
    }
  };

  const handleClaimDerivativesDialogClose = (open: boolean) => {
    setClaimDerivativesDialogOpen(open);
    if (!open) {
      setTimeout(() => {
        setClaimDerivativesSuccess(false);
        setClaimDerivativesError("");
        setClaimDerivativesTxHash("");
        setDerivativesForDataset([]);
      }, 300);
    }
  };

  return (
    <>
      <Card className="glass-card hover-lift">
        <div className={`h-1 bg-gradient-to-r ${dataset.gradient}`}></div>
        <CardHeader>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 bg-gradient-to-br ${dataset.gradient} rounded-xl flex items-center justify-center`}>
                <div className="text-white">
                  {dataset.icon}
                </div>
              </div>
              <div>
                <CardTitle className="text-xl">{dataset.title}</CardTitle>
                <CardDescription className="mt-1">
                  IP Asset ID: <span className="font-mono font-semibold">{dataset.ip_asset_id.slice(0, 12)}...</span>
                  {dataset.location && (
                    <span className="ml-3 text-blue-500">
                      <MapPin className="inline h-3 w-3 mr-1" />
                      {dataset.location}
                    </span>
                  )}
                </CardDescription>
              </div>
            </div>
            <Badge className="bg-green-500/20 text-green-600 border-green-500/30">
              <CheckCircle className="h-2.5 w-2.5 mr-1" />
              {dataset.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <p className="text-sm text-muted-foreground">Registration Date</p>
              <p className="font-semibold">{dataset.registrationDate}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Sensor Type</p>
              <p className="font-semibold capitalize">{dataset.type}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Health Status</p>
              <p className="font-semibold">{dataset.sensor_health}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Claimable Revenue</p>
              {fetchingRevenue ? (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              ) : (
                <p className="font-bold text-green-600 flex items-center gap-1">
                  <Coins className="h-3 w-3" />
                  {formattedAmount} WIP
                </p>
              )}
            </div>
          </div>
          
          <div className="flex gap-2 pt-4 border-t border-border flex-wrap">
            {/* Claim Revenue Button */}
            <Button 
              size="sm" 
              variant="outline"
              className="border-green-500/50 text-green-600 hover:bg-green-500/10"
              onClick={handleClaimRevenue}
              disabled={claiming || fetchingRevenue || parseFloat(formattedAmount) === 0}
            >
              {claiming ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Claiming...
                </>
              ) : (
                <>
                  <Coins className="h-3 w-3 mr-1" />
                  Claim Revenue
                </>
              )}
            </Button>
            
            {/* Claim Revenue from Derivatives Button */}
            <Button 
              size="sm" 
              variant="outline"
              className="border-blue-500/50 text-blue-600 hover:bg-blue-500/10"
              onClick={handleClaimRevenueFromDerivatives}
              disabled={loadingDerivatives || claimingFromDerivatives}
            >
              {loadingDerivatives || claimingFromDerivatives ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  {loadingDerivatives ? 'Loading...' : 'Claiming...'}
                </>
              ) : (
                <>
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Claim from Derivatives
                </>
              )}
            </Button>
            
            {dataset.story_explorer_url && (
              <Button 
                size="sm" 
                variant="outline" 
                className="border-purple-500/50 text-purple-600"
                onClick={() => window.open(dataset.story_explorer_url, '_blank')}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                View IP
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Claim Revenue Dialog */}
      <ClaimRevenueDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        claiming={claiming}
        success={claimSuccess}
        txHash={claimTxHash}
        claimedAmount={formattedAmount}
        datasetTitle={dataset.title}
        ipAssetId={dataset.ip_asset_id}
        error={claimError}
      />

      {/* Claim Revenue from Derivatives Dialog */}
      <Dialog open={claimDerivativesDialogOpen} onOpenChange={handleClaimDerivativesDialogClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Claim Revenue from Derivatives
            </DialogTitle>
            <DialogDescription>
              Claim revenue earned from derivatives of this dataset
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {claimDerivativesSuccess ? (
              <div className="space-y-3">
                <div className="bg-green-500/10 p-4 rounded-lg border border-green-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-semibold text-green-600">Success!</span>
                  </div>
                  <p className="text-sm">
                    Successfully claimed revenue from {derivativesForDataset.length} derivatives
                  </p>
                </div>
                
                {claimDerivativesTxHash && (
                  <div>
                    <p className="text-sm font-semibold mb-1">Transaction Hash:</p>
                    <p className="text-xs font-mono break-all bg-muted p-2 rounded">
                      {claimDerivativesTxHash}
                    </p>
                  </div>
                )}
                
                <div className="flex justify-end">
                  <Button onClick={() => handleClaimDerivativesDialogClose(false)}>
                    Close
                  </Button>
                </div>
              </div>
            ) : claimDerivativesError ? (
              <div className="space-y-3">
                <div className="bg-red-500/10 p-4 rounded-lg border border-red-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <span className="font-semibold text-red-600">Error</span>
                  </div>
                  <p className="text-sm">{claimDerivativesError}</p>
                </div>
                
                <div className="flex justify-end">
                  <Button onClick={() => setClaimDerivativesError("")}>
                    Try Again
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <p className="text-sm font-semibold mb-2">Dataset:</p>
                  <p className="text-sm">{dataset.title}</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {dataset.ip_asset_id.slice(0, 20)}...
                  </p>
                </div>
                
                <div>
                  <p className="text-sm font-semibold mb-2">Derivatives Found:</p>
                  {derivativesForDataset.length > 0 ? (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {derivativesForDataset.map((derivative, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                          <div>
                            <p className="text-xs font-medium">Derivative {index + 1}</p>
                            <p className="text-xs text-muted-foreground font-mono">
                              {derivative.derivative_ip_id.slice(0, 10)}...{derivative.derivative_ip_id.slice(-8)}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {derivative.creator_name}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No derivatives found</p>
                  )}
                </div>
                
                <div className="flex justify-between pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => handleClaimDerivativesDialogClose(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleConfirmClaimFromDerivatives}
                    disabled={claimingFromDerivatives || derivativesForDataset.length === 0}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {claimingFromDerivatives ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Claiming...
                      </>
                    ) : (
                      <>
                        <Coins className="h-4 w-4 mr-2" />
                        Claim from {derivativesForDataset.length} Derivatives
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

// Component to display and claim revenue for each derivative
const DerivativeRevenueCard = ({ derivative }: { derivative: DerivativeWithRevenue }) => {
  const { claimableAmount, loading: fetchingRevenue, refetch } = useClaimableRevenue(derivative.derivative_ip_id as Address);
  const { claimRevenue, claiming } = useRevenueClaiming();
  const { toast } = useToast();
  
  // Add royalty payment state
  const { payRoyalty, paying: payingRoyalty, isConnected: isRoyaltyConnected } = useRoyaltyPayment();
  const [royaltyDialogOpen, setRoyaltyDialogOpen] = useState(false);
  const [royaltySuccess, setRoyaltySuccess] = useState(false);
  const [royaltyTxHash, setRoyaltyTxHash] = useState<string>("");
  const [royaltyAmount, setRoyaltyAmount] = useState<string>("");
  const [royaltyError, setRoyaltyError] = useState<string>("");
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [claimTxHash, setClaimTxHash] = useState<string>("");
  const [claimError, setClaimError] = useState<string>("");

  const formattedAmount = claimableAmount 
    ? (parseFloat(claimableAmount) / 1e18).toFixed(6)
    : '0.000000';

  const handleClaimRevenue = async () => {
    setClaimSuccess(false);
    setClaimError("");
    setClaimTxHash("");
    setDialogOpen(true);
    
    try {
      const result = await claimRevenue(derivative.derivative_ip_id as Address);
      
      if (result.success) {
        const txHash = result.txHashes && result.txHashes.length > 0
          ? result.txHashes[0]
          : '';
        
        setClaimTxHash(txHash);
        setClaimSuccess(true);
        setTimeout(() => refetch(), 2000);
        
        toast({
          title: "Revenue Claimed",
          description: `Successfully claimed ${formattedAmount} WIP from derivative`,
        });
      } else {
        setClaimError(result.error || "Failed to claim revenue");
        setClaimSuccess(false);
      }
    } catch (error: any) {
      console.error('Claim error:', error);
      setClaimError(error.message || "An unexpected error occurred");
      setClaimSuccess(false);
    }
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setTimeout(() => {
        setClaimSuccess(false);
        setClaimError("");
        setClaimTxHash("");
      }, 300);
    }
  };

  // Handle royalty payment for derivative
  const handlePayRoyalty = async (amount: string) => {
    setRoyaltySuccess(false);
    setRoyaltyError("");
    setRoyaltyTxHash("");
    setRoyaltyAmount(amount);
    
    try {
      const result = await payRoyalty(
        derivative.parent_ip_id as Address, // receiverIpId = parent IP ID
        derivative.derivative_ip_id as Address, // payerIpId = derivative IP ID
        amount // amount in WIP
      );
      
      if (result.success) {
        setRoyaltyTxHash(result.txHash || "");
        setRoyaltySuccess(true);
        
        toast({
          title: "Royalty Paid",
          description: `Successfully paid ${amount} WIP to parent IP`,
        });
      } else {
        setRoyaltyError(result.error || "Failed to pay royalty");
        setRoyaltySuccess(false);
      }
    } catch (error: any) {
      console.error('Royalty payment error:', error);
      setRoyaltyError(error.message || "An unexpected error occurred");
      setRoyaltySuccess(false);
    }
  };

  const handleRoyaltyDialogClose = (open: boolean) => {
    setRoyaltyDialogOpen(open);
    if (!open) {
      setTimeout(() => {
        setRoyaltySuccess(false);
        setRoyaltyError("");
        setRoyaltyTxHash("");
        setRoyaltyAmount("");
      }, 300);
    }
  };

  return (
    <>
      <Card className="glass-card hover-lift">
        <div className={`h-1 bg-gradient-to-r ${getGradientForType(derivative.derivative_type)}`}></div>
        <CardHeader>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 bg-gradient-to-br ${getGradientForType(derivative.derivative_type)} rounded-xl flex items-center justify-center`}>
                <div className="text-white">
                  {getIconForType(derivative.derivative_type)}
                </div>
              </div>
              <div>
                <CardTitle className="text-xl">{derivative.derivative_title}</CardTitle>
                <CardDescription className="mt-1">
                  Derivative IP ID: <span className="font-mono font-semibold">{derivative.derivative_ip_id.slice(0, 12)}...</span>
                  {derivative.derivative_location && (
                    <span className="ml-3 text-blue-500">
                      <MapPin className="inline h-3 w-3 mr-1" />
                      {derivative.derivative_location}
                    </span>
                  )}
                </CardDescription>
              </div>
            </div>
            <Badge className="bg-purple-500/20 text-purple-600 border-purple-500/30">
              <CheckCircle className="h-2.5 w-2.5 mr-1" />
              Derivative
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <p className="text-sm text-muted-foreground">Registration Date</p>
              <p className="font-semibold">{formatDate(derivative.registered_at)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Type</p>
              <p className="font-semibold capitalize">{derivative.derivative_type}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Creator</p>
              <p className="font-semibold">{derivative.creator_name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Claimable Revenue</p>
              {fetchingRevenue ? (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              ) : (
                <p className="font-bold text-green-600 flex items-center gap-1">
                  <Coins className="h-3 w-3" />
                  {formattedAmount} WIP
                </p>
              )}
            </div>
          </div>

          <div className="bg-primary/5 p-4 rounded-lg border border-primary/20 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold text-primary">Parent IP Asset</p>
            </div>
            <p className="text-sm font-mono mb-1">{derivative.parent_ip_id.slice(0, 20)}...{derivative.parent_ip_id.slice(-10)}</p>
            {derivative.parent_title && (
              <p className="text-sm text-muted-foreground">{derivative.parent_title}</p>
            )}
            {derivative.royalty_percentage && (
              <p className="text-xs text-purple-600 mt-1">
                Royalty Rate: {derivative.royalty_percentage}%
              </p>
            )}
          </div>
          
          <div className="flex gap-2 pt-4 border-t border-border flex-wrap">
            {/* Claim Revenue Button */}
            <Button 
              size="sm" 
              variant="outline"
              className="border-green-500/50 text-green-600 hover:bg-green-500/10"
              onClick={handleClaimRevenue}
              disabled={claiming || fetchingRevenue || parseFloat(formattedAmount) === 0}
            >
              {claiming ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Claiming...
                </>
              ) : (
                <>
                  <Coins className="h-3 w-3 mr-1" />
                  Claim Revenue
                </>
              )}
            </Button>
            
            {/* Pay Royalty Button */}
            <Button 
              size="sm" 
              variant="outline"
              className="border-purple-500/50 text-purple-600 hover:bg-purple-500/10"
              onClick={() => setRoyaltyDialogOpen(true)}
              disabled={payingRoyalty}
            >
              {payingRoyalty ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Paying...
                </>
              ) : (
                <>
                  <ArrowRightLeft className="h-3 w-3 mr-1" />
                  Pay Royalty to Parent
                </>
              )}
            </Button>
            
            {/* View Derivative Button */}
            {derivative.story_explorer_url && (
              <Button 
                size="sm" 
                variant="outline"
                className="border-primary/50 text-primary hover:bg-primary/10"
                onClick={() => window.open(derivative.story_explorer_url, '_blank')}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                View Derivative
              </Button>
            )}
            
            {/* View Parent IP Button */}
            <Button 
              size="sm" 
              variant="outline" 
              className="border-purple-500/50 text-purple-600 hover:bg-purple-500/10"
              onClick={() => window.open(`https://aeneid.explorer.story.foundation/ipa/${derivative.parent_ip_id}`, '_blank')}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              View Parent IP
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Claim Revenue Dialog */}
      <ClaimRevenueDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        claiming={claiming}
        success={claimSuccess}
        txHash={claimTxHash}
        claimedAmount={formattedAmount}
        datasetTitle={derivative.derivative_title}
        ipAssetId={derivative.derivative_ip_id}
        error={claimError}
        isDerivative={true}
      />

      {/* Pay Royalty Dialog for Derivative */}
      <PayRoyaltyDialog
        open={royaltyDialogOpen}
        onOpenChange={handleRoyaltyDialogClose}
        paying={payingRoyalty}
        success={royaltySuccess}
        txHash={royaltyTxHash}
        amount={royaltyAmount}
        parentTitle={derivative.parent_title || 'Parent Dataset'}
        parentIpId={derivative.parent_ip_id}
        derivativeTitle={derivative.derivative_title}
        derivativeIpId={derivative.derivative_ip_id}
        error={royaltyError}
        onPayRoyalty={handlePayRoyalty}
        maxAmount="100"
      />
    </>
  );
};

// Component for License Card with Pay Royalty to IP functionality
const LicenseCard = ({ license, index, toggleMetadata, toast }: LicenseCardProps) => {
  const { payRoyalty, paying: payingRoyalty, isConnected } = useRoyaltyPayment();
  const [royaltyDialogOpen, setRoyaltyDialogOpen] = useState(false);
  const [royaltySuccess, setRoyaltySuccess] = useState(false);
  const [royaltyTxHash, setRoyaltyTxHash] = useState<string>("");
  const [royaltyAmount, setRoyaltyAmount] = useState<string>("");
  const [royaltyError, setRoyaltyError] = useState<string>("");

  // Handle royalty payment for license - payerIpId is zeroAddress
  const handlePayRoyaltyToIP = async (amount: string) => {
    setRoyaltySuccess(false);
    setRoyaltyError("");
    setRoyaltyTxHash("");
    setRoyaltyAmount(amount);
    
    try {
      // Use zeroAddress as payerIpId as specified
      const result = await payRoyalty(
        license.ip_asset_id as Address, // receiverIpId = IP Asset ID (who receives)
        zeroAddress as Address, // payerIpId = zeroAddress (as per your requirement)
        amount // amount in WIP
      );
      
      if (result.success) {
        setRoyaltyTxHash(result.txHash || "");
        setRoyaltySuccess(true);
        
        toast({
          title: "Royalty Paid",
          description: `Successfully paid ${amount} WIP to IP Asset ${license.dataset_title}`,
        });
      } else {
        setRoyaltyError(result.error || "Failed to pay royalty");
        setRoyaltySuccess(false);
      }
    } catch (error: any) {
      console.error('Royalty payment error:', error);
      setRoyaltyError(error.message || "An unexpected error occurred");
      setRoyaltySuccess(false);
    }
  };

  const handleRoyaltyDialogClose = (open: boolean) => {
    setRoyaltyDialogOpen(open);
    if (!open) {
      setTimeout(() => {
        setRoyaltySuccess(false);
        setRoyaltyError("");
        setRoyaltyTxHash("");
        setRoyaltyAmount("");
      }, 300);
    }
  };

  return (
    <>
      <Card 
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

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            {/* Pay Royalty to IP Button */}
            <Button 
              variant="outline" 
              size="sm"
              className="flex-1 border-purple-500/50 text-purple-600 hover:bg-purple-500/10 text-xs h-8"
              onClick={() => setRoyaltyDialogOpen(true)}
              disabled={payingRoyalty}
            >
              {payingRoyalty ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Paying...
                </>
              ) : (
                <>
                  <ArrowRightLeft className="h-3 w-3 mr-1" />
                  Pay Royalty to IP
                </>
              )}
            </Button>

            {/* Metadata Toggle Button */}
            <Button
              variant="outline"
              size="sm"
              className="flex-1 border-primary/30 text-primary text-xs h-8"
              onClick={() => toggleMetadata(license.id)}
              disabled={license.metadataLoading}
            >
              {license.metadataLoading ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Info className="h-3 w-3 mr-1" />
                  {license.showMetadata ? 'Hide' : 'Show'} Metadata
                </>
              )}
            </Button>
          </div>

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

      {/* Pay Royalty Dialog for License */}
      <PayRoyaltyDialog
        open={royaltyDialogOpen}
        onOpenChange={handleRoyaltyDialogClose}
        paying={payingRoyalty}
        success={royaltySuccess}
        txHash={royaltyTxHash}
        amount={royaltyAmount}
        parentTitle={license.dataset_title || 'IP Asset'}
        parentIpId={license.ip_asset_id}
        derivativeTitle="Direct Payment"
        derivativeIpId={zeroAddress}
        error={royaltyError}
        onPayRoyalty={handlePayRoyaltyToIP}
        maxAmount="100"
        isDirectPayment={true}
      />
    </>
  );
};

const Profile = () => {
  const { address, isConnected } = useAccount();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [registeredData, setRegisteredData] = useState<RegisteredDataset[]>([]);
  const [licenses, setLicenses] = useState<LicenseWithDataset[]>([]);
  const [loadingLicenses, setLoadingLicenses] = useState(false);
  const [totalLicenses, setTotalLicenses] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [loadingEarnings, setLoadingEarnings] = useState(false);
  const [derivatives, setDerivatives] = useState<DerivativeWithRevenue[]>([]);
  const [loadingDerivatives, setLoadingDerivatives] = useState(false);
  const [supabaseService] = useState(() => createSupabaseService(SUPABASE_URL, SUPABASE_ANON_KEY));
  const [supabaseClient] = useState(() => createClient(SUPABASE_URL, SUPABASE_ANON_KEY));

  useEffect(() => {
    if (isConnected && address) {
      fetchRegisteredData();
      fetchUserLicenses();
      fetchUserDerivatives();
    } else {
      setLoading(false);
    }
  }, [address, isConnected]);

  const fetchRegisteredData = async () => {
    setLoading(true);
    try {
      const result = await supabaseService.fetchSensorData({
        has_ip_registration: true
      });

      if (result.success && result.data) {
        const myRegisteredData = result.data.filter(
          record => record.creator_address?.toLowerCase() === address?.toLowerCase()
        );

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
        
        await Promise.all([
          fetchTotalLicenses(myRegisteredData.map(r => r.id!)),
          fetchTotalEarnings(myRegisteredData.map(r => r.id!))
        ]);
        
        toast({
          title: "Data Loaded",
          description: `Found ${transformedData.length} registered datasets`,
        });
      } else {
        setRegisteredData([]);
        setTotalLicenses(0);
        setTotalEarnings(0);
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

  const fetchUserLicenses = async () => {
    if (!address) return;

    setLoadingLicenses(true);
    try {
      const normalizedAddress = address.toLowerCase();
      
      const result = await supabaseClient
        .from('licenses')
        .select('*')
        .ilike('receiver_address', normalizedAddress)
        .order('minted_at', { ascending: false })
        .limit(100);

      if (result.error) {
        throw new Error(result.error.message);
      }

      if (result.data && result.data.length > 0) {
        const sensorDataIds = [...new Set(result.data.map(l => l.sensor_data_id))];
        
        const sensorDataResult = await supabaseClient
          .from('sensor_data')
          .select('*')
          .in('id', sensorDataIds);
        
        const sensorDataMap = new Map(
          sensorDataResult.data?.map(sd => [sd.id, sd]) || []
        );
        
        const enrichedLicenses = result.data.map((license) => {
          const sensorData = sensorDataMap.get(license.sensor_data_id);
          
          return {
            ...license,
            dataset_title: sensorData?.title || 'Unknown Dataset',
            dataset_type: sensorData?.type || 'Unknown',
            dataset_location: sensorData?.location || undefined,
            dataset_data: sensorData?.data || undefined,
            dataset_timestamp: sensorData?.timestamp || undefined,
            dataset_sensor_health: sensorData?.sensor_health || undefined,
            dataset_image_hash: sensorData?.image_hash || undefined,
            icon: getIconForType(sensorData?.type || 'Unknown'),
            gradient: getGradientForType(sensorData?.type || 'Unknown'),
            showMetadata: false,
            metadataLoading: false,
          };
        });

        setLicenses(enrichedLicenses);
      } else {
        setLicenses([]);
      }
    } catch (error: any) {
      console.error('Error fetching licenses:', error);
      toast({
        title: "Error",
        description: "Failed to load your licenses",
        variant: "destructive",
      });
    } finally {
      setLoadingLicenses(false);
    }
  };

  const fetchUserDerivatives = async () => {
    if (!address) {
      console.log('No address available for fetching derivatives');
      return;
    }

    setLoadingDerivatives(true);
    try {
      const normalizedAddress = address.toLowerCase();
      
      const result = await supabaseClient
        .from('derivative_ip_assets')
        .select(`
          id,
          sensor_data_id,
          derivative_ip_id,
          parent_ip_id,
          license_terms_id,
          creator_name,
          creator_address,
          royalty_recipient,
          royalty_percentage,
          max_minting_fee,
          max_revenue_share,
          max_rts,
          transaction_hash,
          story_explorer_url,
          metadata_url,
          character_file_url,
          nft_token_id,
          nft_contract_address,
          image_url,
          registered_at,
          created_at,
          sensor_data:sensor_data!sensor_data_id (
            id,
            type,
            title,
            location,
            timestamp,
            data,
            sensor_health,
            creator_address
          )
        `)
        .ilike('creator_address', normalizedAddress)
        .order('registered_at', { ascending: false });

      if (result.error) {
        console.error('Error fetching derivatives:', result.error);
        throw new Error(result.error.message);
      }

      if (result.data && result.data.length > 0) {
        const enrichedDerivatives = await Promise.all(
          result.data.map(async (derivative: any) => {
            let parentInfo = null;
            try {
              const parentResult = await supabaseClient
                .from('sensor_data')
                .select('id, type, title, location, creator_address, ip_asset_id')
                .eq('ip_asset_id', derivative.parent_ip_id)
                .single();
              
              if (parentResult.data) {
                parentInfo = parentResult.data;
              }
            } catch (err) {
              console.log('Parent IP not in our database:', derivative.parent_ip_id);
            }

            return {
              id: derivative.id,
              sensor_data_id: derivative.sensor_data_id,
              derivative_ip_id: derivative.derivative_ip_id,
              parent_ip_id: derivative.parent_ip_id,
              license_terms_id: derivative.license_terms_id,
              creator_name: derivative.creator_name,
              creator_address: derivative.creator_address,
              royalty_recipient: derivative.royalty_recipient,
              royalty_percentage: derivative.royalty_percentage,
              max_minting_fee: derivative.max_minting_fee,
              max_revenue_share: derivative.max_revenue_share,
              max_rts: derivative.max_rts,
              transaction_hash: derivative.transaction_hash,
              story_explorer_url: derivative.story_explorer_url,
              metadata_url: derivative.metadata_url,
              character_file_url: derivative.character_file_url,
              nft_token_id: derivative.nft_token_id,
              nft_contract_address: derivative.nft_contract_address,
              image_url: derivative.image_url,
              registered_at: derivative.registered_at,
              created_at: derivative.created_at,
              derivative_type: derivative.sensor_data?.type || 'Unknown',
              derivative_title: derivative.sensor_data?.title || 'Untitled Derivative',
              derivative_location: derivative.sensor_data?.location,
              derivative_timestamp: derivative.sensor_data?.timestamp,
              derivative_data: derivative.sensor_data?.data,
              parent_type: parentInfo?.type,
              parent_title: parentInfo?.title,
              parent_location: parentInfo?.location,
              parent_creator_address: parentInfo?.creator_address,
              claimableAmount: '0',
              claiming: false,
            };
          })
        );

        setDerivatives(enrichedDerivatives);

        toast({
          title: "Derivatives Loaded",
          description: `Found ${enrichedDerivatives.length} derivatives you created`,
        });
      } else {
        console.log('No derivatives found created by:', normalizedAddress);
        setDerivatives([]);
      }
    } catch (error: any) {
      console.error('Error fetching derivatives:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load derivatives",
        variant: "destructive",
      });
      setDerivatives([]);
    } finally {
      setLoadingDerivatives(false);
    }
  };

  const fetchTotalLicenses = async (datasetIds: number[]) => {
    if (datasetIds.length === 0) {
      setTotalLicenses(0);
      return;
    }

    try {
      let totalCount = 0;

      for (const datasetId of datasetIds) {
        const result = await supabaseService.fetchLicenses({
          sensor_data_id: datasetId
        });

        if (result.success && result.data) {
          const datasetLicenseCount = result.data.reduce((sum, license) => sum + (license.amount || 0), 0);
          totalCount += datasetLicenseCount;
        }
      }

      setTotalLicenses(totalCount);
    } catch (error: any) {
      console.error('Error fetching total licenses:', error);
      setTotalLicenses(0);
    }
  };

  const fetchTotalEarnings = async (datasetIds: number[]) => {
    if (datasetIds.length === 0) {
      setTotalEarnings(0);
      return;
    }

    setLoadingEarnings(true);
    try {
      let totalEarningsSum = 0;

      for (const datasetId of datasetIds) {
        const result = await supabaseService.fetchLicenses({
          sensor_data_id: datasetId
        });

        if (result.success && result.data) {
          const datasetEarnings = result.data.reduce((sum, license) => {
            return sum + (license.minting_fee_paid || 0);
          }, 0);
          totalEarningsSum += datasetEarnings;
        }
      }

      setTotalEarnings(totalEarningsSum);
    } catch (error: any) {
      console.error('Error fetching total earnings:', error);
      setTotalEarnings(0);
    } finally {
      setLoadingEarnings(false);
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
        
        const decodedJson = decodeJsonString(metadata.jsonString);
        
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
              Please connect your wallet to view your profile
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
              Fetching your profile information...
            </p>
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
          {/* Profile Header */}
          <div className="text-center mb-12 animate-slide-up">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 animate-glow">
              Your Profile
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold mb-4">
              Your <span className="gradient-text">IP Dashboard</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-2">
              Track your IP-protected datasets and acquired licenses
            </p>
            <p className="text-sm text-muted-foreground font-mono">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid md:grid-cols-4 gap-6 mb-12 animate-slide-in-left">
            <Card className="glass-card hover-lift">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
                    <TrendingUp className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Earnings</p>
                    {loadingEarnings ? (
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    ) : (
                      <p className="text-3xl font-bold gradient-text">{totalEarnings.toFixed(6)} WIP</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">From license minting</p>
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
                    <p className="text-xs text-muted-foreground mt-1">IP-protected assets</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card hover-lift">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                    <Coins className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Derivatives</p>
                    <p className="text-3xl font-bold">{derivatives.length}</p>
                    <p className="text-xs text-muted-foreground mt-1">Created by you</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card hover-lift">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
                    <FileCheck className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Licenses Held</p>
                    {loadingLicenses ? (
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    ) : (
                      <p className="text-3xl font-bold">{licenses.length}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">Acquired licenses</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Registered Datasets Section */}
          <div className="space-y-4 mb-16">
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
                <div 
                  key={item.id}
                  className="animate-slide-in-right"
                  style={{animationDelay: `${index * 0.1}s`}}
                >
                  <DatasetRevenueCard dataset={item} />
                </div>
              ))
            )}
          </div>

          {/* Registered Derivatives Section */}
          <div className="space-y-4 mb-16">
            <h2 className="text-3xl font-bold mb-6">
              Registered <span className="gradient-text">Derivatives</span>
            </h2>
            
            {loadingDerivatives ? (
              <div className="text-center py-12">
                <Loader2 className="h-12 w-12 animate-spin mx-auto mb-6 text-primary" />
                <h3 className="text-2xl font-bold mb-4">
                  Loading <span className="gradient-text">Your Derivatives</span>
                </h3>
                <p className="text-xl text-muted-foreground">
                  Fetching your derivative IP assets...
                </p>
              </div>
            ) : derivatives.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-4">
                  <AlertCircle className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No Derivatives Created</h3>
                <p className="text-muted-foreground mb-6">
                  You haven't created any derivative IP assets yet.
                </p>
              </div>
            ) : (
              derivatives.map((derivative, index) => (
                <div 
                  key={derivative.id}
                  className="animate-slide-in-right"
                  style={{animationDelay: `${index * 0.1}s`}}
                >
                  <DerivativeRevenueCard derivative={derivative} />
                </div>
              ))
            )}
          </div>

          {/* Acquired Licenses Section */}
          <div className="space-y-4">
            <h2 className="text-3xl font-bold mb-6">
              Acquired <span className="gradient-text">Licenses</span>
            </h2>
            
            {loadingLicenses ? (
              <div className="text-center py-24">
                <Loader2 className="h-12 w-12 animate-spin mx-auto mb-6 text-primary" />
                <h3 className="text-2xl font-bold mb-4">
                  Loading <span className="gradient-text">Your Licenses</span>
                </h3>
                <p className="text-xl text-muted-foreground">
                  Fetching your license collection...
                </p>
              </div>
            ) : licenses.length === 0 ? (
              <div className="text-center py-24">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-6">
                  <AlertCircle className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-3xl font-bold mb-4">No Licenses Yet</h3>
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {licenses.map((license, index) => (
                  <LicenseCard 
                    key={license.id}
                    license={license}
                    index={index}
                    toggleMetadata={toggleMetadata}
                    toast={toast}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="absolute top-1/3 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-1/3 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-float" style={{animationDelay: '3s'}}></div>
      </div>
    </div>
  );
};

export default Profile;