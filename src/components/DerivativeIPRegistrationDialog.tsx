import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useDerivativeIPRegistration } from '@/utils/derivativeRegistrationService';
import { SensorData } from '@/services/gmailService';
import { Loader2, CheckCircle, XCircle, ExternalLink, Sparkles, Upload, FileCheck, Coins, Shield, Zap, Info, GitBranch, FileText } from 'lucide-react';
import { networkInfo } from '@/utils/config';
import { SupabaseService } from '@/services/supabaseService';
import { Address } from 'viem';

interface DerivativeIPRegistrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sensorData: SensorData | null;
  location: string;
  sensorDataId?: number;
  supabaseService?: SupabaseService;
  onRegistrationComplete?: () => void;
  parentIpAssetId?: string;    // Auto-fill from license
  licenseTermsId?: string;     // Auto-fill from license
}

interface DerivativeSuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ipId: string;
  txHash: string;
  storyExplorerUrl?: string;
  parentIpId?: string;
  datasetTitle: string;
  creatorName: string;
  sensorDataId?: number;
}

const DerivativeSuccessDialog = ({
  open,
  onOpenChange,
  ipId,
  txHash,
  storyExplorerUrl,
  parentIpId,
  datasetTitle,
  creatorName,
  sensorDataId,
}: DerivativeSuccessDialogProps) => {
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[900px] border-2 border-green-500/20 bg-gradient-to-br from-background via-background to-green-500/5 p-8">
        <div className="flex gap-8">
          {/* Left Column - Status Icon & Message */}
          <div className="flex-1 flex flex-col items-center justify-center space-y-6">
            <div className="relative">
              <div className="absolute inset-0 bg-green-500 rounded-full blur-2xl opacity-30 animate-pulse"></div>
              <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center animate-bounce">
                <CheckCircle className="h-16 w-16 text-white" />
              </div>
            </div>
            
            <div className="text-center">
              <h3 className="text-3xl font-bold text-green-600 mb-2">
                Derivative Created! 🎉
              </h3>
              <p className="text-muted-foreground">
                Your derivative IP has been successfully registered
              </p>
            </div>
          </div>

          {/* Right Column - Details & Actions */}
          <div className="flex-1 space-y-6">
            <div>
              <h4 className="text-lg font-semibold mb-4">Registration Details</h4>
              
              <div className="space-y-4">
                {/* Derivative IP ID */}
                <div>
                  <div className="text-xs font-semibold text-primary mb-2 flex items-center gap-2">
                    <Shield className="h-3 w-3" />
                    DERIVATIVE IP ID
                  </div>
                  <div className="font-mono text-xs break-all bg-background/50 p-3 rounded-lg border border-border">
                    {ipId}
                  </div>
                </div>

                {/* Parent IP ID */}
                {parentIpId && (
                  <div>
                    <div className="text-xs font-semibold text-primary mb-2 flex items-center gap-2">
                      <GitBranch className="h-3 w-3" />
                      PARENT IP ID
                    </div>
                    <div className="font-mono text-xs break-all bg-background/50 p-3 rounded-lg border border-border">
                      {parentIpId}
                    </div>
                  </div>
                )}

                {/* Dataset Info */}
                <div>
                  <div className="text-xs font-semibold text-primary mb-2 flex items-center gap-2">
                    <FileText className="h-3 w-3" />
                    DATASET
                  </div>
                  <div className="bg-background/50 p-3 rounded-lg border border-border space-y-2">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Title: </span>
                      <span className="font-semibold">{datasetTitle}</span>
                    </div>
                    <div className="text-xs">
                      <span className="text-muted-foreground">Creator: </span>
                      <span className="font-medium text-primary">{creatorName}</span>
                    </div>
                    {sensorDataId && (
                      <div className="text-xs">
                        <span className="text-muted-foreground">Dataset ID: </span>
                        <span className="font-mono text-primary">#{sensorDataId}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Transaction Hash */}
                <div>
                  <div className="text-xs font-semibold text-primary mb-2 flex items-center gap-2">
                    <Zap className="h-3 w-3" />
                    TRANSACTION HASH
                  </div>
                  <div className="font-mono text-xs break-all bg-background/50 p-3 rounded-lg border border-border">
                    {txHash}
                  </div>
                </div>

                {/* Success Status */}
                <div>
                  <div className="text-xs font-semibold text-primary mb-2 flex items-center gap-2">
                    <CheckCircle className="h-3 w-3" />
                    STATUS
                  </div>
                  <div className="text-sm p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-600">
                    ✓ Derivative IP registered on blockchain
                    {sensorDataId && (
                      <div className="mt-1 text-xs">
                        ✓ Saved to database (ID: #{sensorDataId})
                      </div>
                    )}
                  </div>
                </div>
                
                {/* View on Story Explorer Button */}
                {storyExplorerUrl && (
                  <a
                    href={storyExplorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 p-4 rounded-xl bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 transition-opacity font-semibold shadow-lg"
                  >
                    <ExternalLink className="h-5 w-5" />
                    View on Story Explorer
                  </a>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={() => {
                  // Open the new derivative IP in explorer
                  if (ipId) {
                    window.open(`https://aeneid.explorer.story.foundation/ipa/${ipId}`, '_blank');
                  }
                }}
                className="flex-1 border-primary/30"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View IP
              </Button>
              <Button 
                onClick={() => onOpenChange(false)}
                className="flex-1 bg-gradient-to-r from-primary to-secondary hover:opacity-90 font-semibold shadow-lg"
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const ProcessingDialog = ({ 
  open, 
  currentStep 
}: { 
  open: boolean; 
  currentStep: number;
}) => {
  const steps = [
    { icon: <FileCheck className="h-5 w-5" />, text: "AI Character File", color: "from-blue-500 to-cyan-500" },
    { icon: <Upload className="h-5 w-5" />, text: "Uploading IPFS", color: "from-purple-500 to-pink-500" },
    { icon: <Sparkles className="h-5 w-5" />, text: "Creating Metadata", color: "from-orange-500 to-red-500" },
    { icon: <Coins className="h-5 w-5" />, text: "Minting NFT", color: "from-green-500 to-emerald-500" },
    { icon: <GitBranch className="h-5 w-5" />, text: "Linking Derivative", color: "from-indigo-500 to-purple-500" },
  ];

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-[900px] border-none bg-gradient-to-br from-background via-primary/5 to-secondary/5 backdrop-blur-xl p-6">
        <div className="space-y-8">
          {/* Header Section */}
          <div className="flex items-center gap-4">
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary rounded-full blur-xl opacity-50 animate-pulse"></div>
              <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <div className="text-white animate-bounce">
                  {steps[currentStep]?.icon}
                </div>
              </div>
            </div>
            
            <div className="flex-1">
              <h2 className="text-xl font-bold mb-1">
                <span className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
                  Registering Derivative IP
                </span>
              </h2>
              <p className="text-xs text-muted-foreground">Processing your derivative registration on Story Protocol</p>
            </div>
          </div>

          {/* Progress Steps - Horizontal Timeline */}
          <div className="relative">
            {/* Progress Line */}
            <div className="absolute top-6 left-0 right-0 h-0.5 bg-muted/30 z-0">
              <div 
                className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-1000 ease-in-out"
                style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
              />
            </div>

            {/* Steps Container */}
            <div className="relative flex justify-between z-10">
              {steps.map((step, index) => (
                <div key={index} className="flex flex-col items-center">
                  {/* Step Circle */}
                  <div className="relative mb-3">
                    <div 
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 ${
                        index < currentStep
                          ? 'bg-green-500 shadow-lg shadow-green-500/50 scale-110'
                          : index === currentStep
                          ? `bg-gradient-to-br ${step.color} shadow-xl shadow-primary/50 animate-pulse`
                          : 'bg-muted/50 border-2 border-muted'
                      }`}
                    >
                      {index < currentStep ? (
                        <CheckCircle className="h-5 w-5 text-white" />
                      ) : index === currentStep ? (
                        <>
                          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent animate-ping opacity-75" />
                          <Loader2 className="h-5 w-5 text-white animate-spin" />
                        </>
                      ) : (
                        <div className="text-white font-bold text-sm">{index + 1}</div>
                      )}
                    </div>
                    
                    {/* Current Step Indicator */}
                    {index === currentStep && (
                      <div className="absolute -top-1 -right-1">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
                          <div className="w-2 h-2 rounded-full bg-white" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Step Label */}
                  <div className="text-center max-w-[100px]">
                    <p className={`text-xs font-semibold transition-all ${
                      index <= currentStep ? 'text-foreground' : 'text-muted-foreground'
                    }`}>
                      {step.text}
                    </p>
                    {index === currentStep && (
                      <div className="flex items-center justify-center gap-1 mt-1">
                        <div className="w-1 h-1 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-1 h-1 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-1 h-1 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Progress Percentage */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              Step {currentStep + 1} of {steps.length}
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                {Math.round((currentStep / (steps.length - 1)) * 100)}%
              </div>
              <div className="text-xs text-muted-foreground">Complete</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 bg-muted/30 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary via-secondary to-primary transition-all duration-1000 ease-in-out"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>

          {/* Status Message */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <Sparkles className="h-3 w-3 text-primary animate-pulse" />
              <span className="text-xs text-muted-foreground">
                {currentStep < steps.length - 1 
                  ? `Processing: ${steps[currentStep]?.text}...` 
                  : "Finalizing derivative registration..."
                }
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default function DerivativeIPRegistrationDialog({ 
  open, 
  onOpenChange, 
  sensorData, 
  location,
  sensorDataId,
  supabaseService,
  onRegistrationComplete,
  parentIpAssetId,
  licenseTermsId
}: DerivativeIPRegistrationDialogProps) {
  const [creatorName, setCreatorName] = useState('');
  const [royaltyRecipient, setRoyaltyRecipient] = useState('');
  const [royaltyPercentage, setRoyaltyPercentage] = useState('10');
  const [isRegistering, setIsRegistering] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  
  // Success dialog state
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successData, setSuccessData] = useState<{
    ipId?: string;
    txHash?: string;
    storyExplorerUrl?: string;
    parentIpId?: string;
    datasetTitle?: string;
    creatorName?: string;
  } | null>(null);
  
  const { toast } = useToast();
  const { registerDerivativeIP, isConnected } = useDerivativeIPRegistration(supabaseService);

  useEffect(() => {
    if (open && parentIpAssetId && licenseTermsId) {
      toast({
        title: "License Data Loaded",
        description: "Parent IP and License Terms auto-filled from your license",
      });
    }
  }, [open, parentIpAssetId, licenseTermsId]);

  const handleRegister = async () => {
    if (!sensorData) return;
    
    // Validation
    if (!creatorName.trim()) {
      toast({
        title: 'Creator Name Required',
        description: 'Please enter the creator name',
        variant: 'destructive',
      });
      return;
    }

    if (!parentIpAssetId) {
      toast({
        title: 'Parent IP ID Required',
        description: 'Parent IP Asset ID is required',
        variant: 'destructive',
      });
      return;
    }

    if (!licenseTermsId) {
      toast({
        title: 'License Terms ID Required',
        description: 'License terms ID is required',
        variant: 'destructive',
      });
      return;
    }

    const percentageNum = parseFloat(royaltyPercentage);
    if (isNaN(percentageNum) || percentageNum < 0 || percentageNum > 100) {
      toast({
        title: 'Invalid Royalty Percentage',
        description: 'Royalty percentage must be between 0 and 100',
        variant: 'destructive',
      });
      return;
    }

    if (!isConnected) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet first',
        variant: 'destructive',
      });
      return;
    }

    if (!sensorDataId) {
      toast({
        title: 'Sensor Data ID Missing',
        description: 'Cannot register derivative IP without sensor data reference',
        variant: 'destructive',
      });
      return;
    }

    setIsRegistering(true);
    setProcessingStep(0);

    try {
      const stepDelay = 1800;
      
      for (let i = 0; i < 5; i++) {
        setProcessingStep(i);
        await new Promise(resolve => setTimeout(resolve, stepDelay));
      }

      // Call registerDerivativeIP
      const result = await registerDerivativeIP(
        sensorData,
        location,
        creatorName.trim(),
        parentIpAssetId as Address,
        BigInt(licenseTermsId),
        royaltyRecipient.trim() ? royaltyRecipient.trim() as Address : undefined,
        percentageNum,
        sensorDataId
      );

      if (result.success) {
        // Set success data with all necessary information
        setSuccessData({
          ipId: result.ipId,
          txHash: result.txHash,
          storyExplorerUrl: result.storyExplorerUrl,
          parentIpId: parentIpAssetId,
          datasetTitle: sensorData.title,
          creatorName: creatorName,
        });
        
        // Close main dialog and show success dialog
        onOpenChange(false);
        setShowSuccessDialog(true);
        
        if (onRegistrationComplete) {
          onRegistrationComplete();
        }
      } else {
        toast({
          title: 'Registration Failed',
          description: result.error || 'Unknown error occurred',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        title: 'Registration Error',
        description: error.message || 'Failed to register derivative IP',
        variant: 'destructive',
      });
    } finally {
      setIsRegistering(false);
      setProcessingStep(0);
    }
  };

  const handleClose = () => {
    if (!isRegistering) {
      setCreatorName('');
      setRoyaltyRecipient('');
      setRoyaltyPercentage('10');
      setSuccessData(null);
      setProcessingStep(0);
      onOpenChange(false);
    }
  };

  return (
    <>
      <ProcessingDialog open={isRegistering} currentStep={processingStep} />
      
      {/* Success Dialog - Always render but control visibility with open prop */}
      <DerivativeSuccessDialog
        open={showSuccessDialog}
        onOpenChange={(open) => {
          setShowSuccessDialog(open);
          if (!open) {
            // Reset state when success dialog closes
            setCreatorName('');
            setRoyaltyRecipient('');
            setRoyaltyPercentage('10');
            setSuccessData(null);
          }
        }}
        ipId={successData?.ipId || ''}
        txHash={successData?.txHash || ''}
        storyExplorerUrl={successData?.storyExplorerUrl}
        parentIpId={successData?.parentIpId}
        datasetTitle={successData?.datasetTitle || 'Unknown Dataset'}
        creatorName={successData?.creatorName || 'Unknown Creator'}
        sensorDataId={sensorDataId}
      />

      {/* Main Registration Dialog - Show when not registering */}
      {!isRegistering && (
        <Dialog open={open} onOpenChange={handleClose}>
          <DialogContent className="max-w-[900px] border-2 border-primary/20 bg-gradient-to-br from-background via-background to-primary/5 p-8">
            
            <div className="flex gap-8">
              {/* Left Column - Sensor Info & License Details */}
              <div className="flex-1 space-y-6">
                <div>
                  <DialogHeader className="space-y-3 mb-6">
                    <DialogTitle className="flex items-center gap-3 text-2xl">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                        <GitBranch className="h-5 w-5 text-white" />
                      </div>
                      <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                        Register Derivative IP
                      </span>
                    </DialogTitle>
                    <DialogDescription className="text-sm">
                      Create a derivative work based on your licensed IP Asset
                    </DialogDescription>
                  </DialogHeader>

                  {/* Sensor Information Card */}
                  <div className="p-5 rounded-xl bg-gradient-to-br from-muted/50 via-muted/30 to-transparent border-2 border-border mb-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-primary mb-3">
                      <Zap className="h-4 w-4" />
                      Sensor Data
                    </div>
                    <div className="space-y-3">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Type</div>
                        <div className="font-semibold text-sm">{sensorData?.type}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Title</div>
                        <div className="font-semibold text-sm">{sensorData?.title}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Location</div>
                        <div className="font-semibold text-sm">{location}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Data ID</div>
                        <div className="font-mono text-xs text-muted-foreground">#{sensorDataId}</div>
                      </div>
                    </div>
                  </div>

                  {/* License Details - Simple Display */}
                  <div className="space-y-4">
                    {/* Parent IP Asset */}
                    {parentIpAssetId && (
                      <div className="space-y-2">
                        <div className="text-xs font-semibold text-primary flex items-center gap-2">
                          <Shield className="h-3 w-3" />
                          Parent IP Asset
                        </div>
                        <div className="font-mono text-xs bg-background/50 p-2 rounded border border-primary/20 break-all">
                          {parentIpAssetId}
                        </div>
                      </div>
                    )}

                    {/* License Terms */}
                    {licenseTermsId && (
                      <div className="space-y-2">
                        <div className="text-xs font-semibold text-primary flex items-center gap-2">
                          <FileText className="h-3 w-3" />
                          License Terms
                        </div>
                        <div className="space-y-1">
                          <div className="font-mono text-sm font-semibold bg-background/50 p-2 rounded border border-primary/20">
                            ID: {licenseTermsId}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Terms from your license agreement
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Creator Name Input */}
                    <div className="space-y-2">
                      <Label htmlFor="creator-name" className="text-sm font-semibold flex items-center gap-2">
                        Creator Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="creator-name"
                        placeholder="Enter your full name"
                        value={creatorName}
                        onChange={(e) => setCreatorName(e.target.value)}
                        className="h-11 border-2 border-primary/20 focus:border-primary"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Royalty Configuration */}
              <div className="flex-1 space-y-6">
                {/* Royalty Configuration */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                    <Coins className="h-4 w-4" />
                    Royalty Configuration
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="royalty-recipient" className="text-xs font-semibold">
                      Royalty Recipient (Optional)
                    </Label>
                    <Input
                      id="royalty-recipient"
                      placeholder="0x... (defaults to your wallet)"
                      value={royaltyRecipient}
                      onChange={(e) => setRoyaltyRecipient(e.target.value)}
                      className="h-11 border-2 border-primary/20 focus:border-primary font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      Leave empty to use your connected wallet
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="royalty-percentage" className="text-xs font-semibold">
                      Royalty Percentage
                    </Label>
                    <div className="relative">
                      <Input
                        id="royalty-percentage"
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        value={royaltyPercentage}
                        onChange={(e) => setRoyaltyPercentage(e.target.value)}
                        className="h-11 border-2 border-primary/20 focus:border-primary pr-8"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Percentage of royalties for recipient
                    </p>
                  </div>
                </div>

                {/* Info Card */}
                <div className="p-4 rounded-xl bg-muted/30 border border-border">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-muted-foreground">
                      This will create a derivative IP Asset linked to the parent IP. 
                      The derivative inherits license terms and pays royalties to the parent.
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <DialogFooter className="pt-4">
                  <div className="flex gap-3 w-full">
                    <Button 
                      variant="outline" 
                      onClick={handleClose}
                      className="flex-1 border-2 border-primary/20 hover:bg-primary/5 h-11"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleRegister}
                      disabled={isRegistering || !isConnected || !sensorDataId || !parentIpAssetId || !licenseTermsId}
                      className="flex-1 bg-gradient-to-r from-primary to-secondary hover:opacity-90 font-semibold shadow-lg h-11"
                    >
                      {isRegistering ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <GitBranch className="h-4 w-4 mr-2" />
                          Register Derivative
                        </>
                      )}
                    </Button>
                  </div>
                </DialogFooter>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}