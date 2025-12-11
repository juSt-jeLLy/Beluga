
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useIPRegistration } from '@/utils/ipRegistrationService';
import { SensorData } from '@/services/gmailService';
import { Loader2, CheckCircle, XCircle, ExternalLink, Sparkles, Upload, FileCheck, Coins, Shield, Zap, Info } from 'lucide-react';
import { networkInfo } from '@/utils/config';
import { SupabaseService } from '@/services/supabaseService';

interface IPRegistrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sensorData: SensorData | null;
  location: string;
  sensorDataId?: number;
  supabaseService?: SupabaseService;
  onRegistrationComplete?: () => void; 
}

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
    { icon: <Shield className="h-5 w-5" />, text: "License Registration", color: "from-indigo-500 to-purple-500" },
  ];

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-[900px] border-none bg-gradient-to-br from-background via-primary/5 to-secondary/5 backdrop-blur-xl p-6">
        <div className="space-y-8">
          {/* Header Section - More Compact */}
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
                  Registering IP Asset
                </span>
              </h2>
              <p className="text-xs text-muted-foreground">Processing your registration on Story Protocol</p>
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
                  : "Finalizing registration..."
                }
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default function IPRegistrationDialog({ 
  open, 
  onOpenChange, 
  sensorData, 
  location,
  sensorDataId,
  supabaseService,
  onRegistrationComplete
}: IPRegistrationDialogProps) {
  const [creatorName, setCreatorName] = useState('');
  const [revenueShare, setRevenueShare] = useState('10');
  const [mintingFee, setMintingFee] = useState('0.01');
  const [isRegistering, setIsRegistering] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [registrationResult, setRegistrationResult] = useState<{
    success: boolean;
    ipId?: string;
    txHash?: string;
    storyExplorerUrl?: string;
    error?: string;
  } | null>(null);
  
  const { toast } = useToast();
  const { registerIP, isConnected } = useIPRegistration(supabaseService);

  const handleRegister = async () => {
    if (!sensorData) return;
    
    if (!creatorName.trim()) {
      toast({
        title: 'Creator Name Required',
        description: 'Please enter the creator name',
        variant: 'destructive',
      });
      return;
    }

    const revenueNum = parseFloat(revenueShare);
    if (isNaN(revenueNum) || revenueNum < 0 || revenueNum > 100) {
      toast({
        title: 'Invalid Revenue Share',
        description: 'Revenue share must be between 0 and 100',
        variant: 'destructive',
      });
      return;
    }

    const feeNum = parseFloat(mintingFee);
    if (isNaN(feeNum) || feeNum < 0) {
      toast({
        title: 'Invalid Minting Fee',
        description: 'Minting fee must be a positive number',
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
        description: 'Cannot register IP without sensor data reference',
        variant: 'destructive',
      });
      return;
    }

    setIsRegistering(true);
    setRegistrationResult(null);
    setProcessingStep(0);

    try {
      const stepDelay = 1800;
      
      for (let i = 0; i < 5; i++) {
        setProcessingStep(i);
        await new Promise(resolve => setTimeout(resolve, stepDelay));
      }

      // Call registerIP with revenue share and minting fee
      const result = await registerIP(
        sensorData,
        location,
        creatorName.trim(),
        undefined,
        sensorDataId,
        revenueNum,  // Pass revenue share
        feeNum       // Pass minting fee
      );

      setRegistrationResult(result);

      if (result.success) {
        toast({
          title: 'IP Registered Successfully! 🎉',
          description: `IP ID: ${result.ipId?.slice(0, 10)}...`,
        });
        
        // Call callback to refresh parent component data
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
      setRegistrationResult({
        success: false,
        error: error.message || 'Failed to register IP'
      });
      toast({
        title: 'Registration Error',
        description: error.message || 'Failed to register IP',
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
      setRevenueShare('10');
      setMintingFee('0.01');
      setRegistrationResult(null);
      setProcessingStep(0);
      onOpenChange(false);
    }
  };

  return (
    <>
      <ProcessingDialog open={isRegistering} currentStep={processingStep} />

      <Dialog open={open && !isRegistering} onOpenChange={handleClose}>
        <DialogContent className="max-w-[900px] border-2 border-primary/20 bg-gradient-to-br from-background via-background to-primary/5 p-8">
          
          {!registrationResult ? (
            <div className="flex gap-8">
              {/* Left Column - Sensor Info & Creator Name */}
              <div className="flex-1 space-y-6">
                <div>
                  <DialogHeader className="space-y-3 mb-6">
                    <DialogTitle className="flex items-center gap-3 text-2xl">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                        <span className="text-xl">📝</span>
                      </div>
                      <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                        Register IP Asset
                      </span>
                    </DialogTitle>
                    <DialogDescription className="text-sm">
                      Transform sensor data into blockchain-protected IP
                    </DialogDescription>
                  </DialogHeader>

                  {/* Sensor Information Card */}
                  <div className="p-5 rounded-xl bg-gradient-to-br from-muted/50 via-muted/30 to-transparent border-2 border-border">
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

              {/* Right Column - License Configuration & Benefits */}
              <div className="flex-1 space-y-6">
                {/* License Configuration */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                    <Shield className="h-4 w-4" />
                    License Settings
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="revenue-share" className="text-xs font-semibold">
                        Revenue Share %
                      </Label>
                      <div className="relative">
                        <Input
                          id="revenue-share"
                          type="number"
                          min="0"
                          max="100"
                          step="1"
                          value={revenueShare}
                          onChange={(e) => setRevenueShare(e.target.value)}
                          className="h-11 border-2 border-primary/20 focus:border-primary pr-8"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Percentage you earn
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="minting-fee" className="text-xs font-semibold">
                        Minting Fee
                      </Label>
                      <div className="relative">
                        <Input
                          id="minting-fee"
                          type="number"
                          min="0"
                          step="0.001"
                          value={mintingFee}
                          onChange={(e) => setMintingFee(e.target.value)}
                          className="h-11 border-2 border-primary/20 focus:border-primary pr-12"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">IP</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Fee per license mint
                      </p>
                    </div>
                  </div>
                </div>

                {/* License Benefits Card */}
                <div className="p-5 rounded-xl bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 border-2 border-primary/30">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                      <Shield className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-primary text-sm mb-2">IP Protection Includes:</div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                          <span className="text-xs">Commercial Remix Rights</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                          <span className="text-xs">Royalty Enforcement</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                          <span className="text-xs">Transferable License</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                          <span className="text-xs">Automated Database Tracking</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Info Card */}
                <div className="p-4 rounded-xl bg-muted/30 border border-border">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-muted-foreground">
                      Your sensor data will be registered as an IP Asset on Story Protocol blockchain. 
                      Registration details will be automatically saved to your database.
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
                      disabled={isRegistering || !isConnected || !sensorDataId}
                      className="flex-1 bg-gradient-to-r from-primary to-secondary hover:opacity-90 font-semibold shadow-lg h-11"
                    >
                      {isRegistering ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Shield className="h-4 w-4 mr-2" />
                          Register IP Asset
                        </>
                      )}
                    </Button>
                  </div>
                </DialogFooter>
              </div>
            </div>
          ) : (
            /* Success/Failure State - Horizontal Layout */
            <div className="flex gap-8">
              {/* Left Column - Status Icon & Message */}
              <div className="flex-1 flex flex-col items-center justify-center space-y-6">
                {registrationResult.success ? (
                  <>
                    <div className="relative">
                      <div className="absolute inset-0 bg-green-500 rounded-full blur-2xl opacity-30 animate-pulse"></div>
                      <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center animate-bounce">
                        <CheckCircle className="h-16 w-16 text-white" />
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <h3 className="text-3xl font-bold text-green-600 mb-2">
                        Success! 🎉
                      </h3>
                      <p className="text-muted-foreground">
                        Your sensor data is now registered and saved to database
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center">
                      <XCircle className="h-16 w-16 text-white" />
                    </div>
                    
                    <div className="text-center">
                      <h3 className="text-3xl font-bold text-red-600 mb-2">
                        Registration Failed
                      </h3>
                      <p className="text-muted-foreground">
                        Something went wrong during registration
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Right Column - Details & Actions */}
              <div className="flex-1 space-y-6">
                <div>
                  <h4 className="text-lg font-semibold mb-4">
                    {registrationResult.success ? 'Registration Details' : 'Error Details'}
                  </h4>
                  
                  {registrationResult.success ? (
                    <div className="space-y-4">
                      <div>
                        <div className="text-xs font-semibold text-primary mb-2 flex items-center gap-2">
                          <Shield className="h-3 w-3" />
                          IP ASSET ID
                        </div>
                        <div className="font-mono text-xs break-all bg-background/50 p-3 rounded-lg border border-border">
                          {registrationResult.ipId}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-primary mb-2 flex items-center gap-2">
                          <Zap className="h-3 w-3" />
                          STORY EXPLORER URL
                        </div>
                        <div className="font-mono text-xs break-all bg-background/50 p-3 rounded-lg border border-border">
                          {registrationResult.storyExplorerUrl}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-primary mb-2 flex items-center gap-2">
                          <CheckCircle className="h-3 w-3" />
                          DATABASE STATUS
                        </div>
                        <div className="text-sm p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-600">
                          ✓ Registration details saved to database (ID: #{sensorDataId})
                        </div>
                      </div>
                      
                      {registrationResult.storyExplorerUrl && (
                        <a
                          href={registrationResult.storyExplorerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 p-4 rounded-xl bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 transition-opacity font-semibold shadow-lg"
                        >
                          <ExternalLink className="h-5 w-5" />
                          View on Story Explorer
                        </a>
                      )}
                    </div>
                  ) : (
                    <div className="p-5 rounded-xl bg-red-500/10 border-2 border-red-500/30">
                      <p className="text-sm text-red-600 dark:text-red-400">
                        {registrationResult.error}
                      </p>
                    </div>
                  )}
                </div>

                <Button 
                  onClick={handleClose}
                  className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 font-semibold shadow-lg h-12"
                >
                  {registrationResult.success ? 'View Dashboard' : 'Close'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
