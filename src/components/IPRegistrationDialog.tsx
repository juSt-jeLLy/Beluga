import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useIPRegistration } from '@/utils/ipRegistrationService';
import { SensorData } from '@/services/gmailService';
import { Loader2, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { networkInfo } from '@/utils/config';

interface IPRegistrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sensorData: SensorData | null;
  location: string;
}

export default function IPRegistrationDialog({ 
  open, 
  onOpenChange, 
  sensorData, 
  location 
}: IPRegistrationDialogProps) {
  const [creatorName, setCreatorName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationResult, setRegistrationResult] = useState<{
    success: boolean;
    ipId?: string;
    txHash?: string;
    error?: string;
  } | null>(null);
  
  const { toast } = useToast();
  const { registerIP, isConnected } = useIPRegistration();

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

    if (!isConnected) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet first',
        variant: 'destructive',
      });
      return;
    }

    setIsRegistering(true);
    setRegistrationResult(null);

    try {
      toast({
        title: 'Starting Registration',
        description: 'Preparing metadata and uploading to IPFS...',
      });

      const result = await registerIP(
        sensorData,
        location,
        creatorName.trim(),
        imageUrl.trim() || undefined
      );

      setRegistrationResult(result);

      if (result.success) {
        toast({
          title: 'IP Registered Successfully! 🎉',
          description: `IP ID: ${result.ipId?.slice(0, 10)}...`,
        });
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
        description: error.message || 'Failed to register IP',
        variant: 'destructive',
      });
    } finally {
      setIsRegistering(false);
    }
  };

  const handleClose = () => {
    if (!isRegistering) {
      setCreatorName('');
      setImageUrl('');
      setRegistrationResult(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">📝</span>
            Register as IP Asset
          </DialogTitle>
          <DialogDescription>
            Register this sensor data as an Intellectual Property Asset on Story Protocol
          </DialogDescription>
        </DialogHeader>

        {!registrationResult ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="sensor-info">Sensor Data</Label>
              <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
                <div><strong>Type:</strong> {sensorData?.type}</div>
                <div><strong>Title:</strong> {sensorData?.title}</div>
                <div><strong>Location:</strong> {location}</div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="creator-name">Creator Name *</Label>
              <Input
                id="creator-name"
                placeholder="Enter your name"
                value={creatorName}
                onChange={(e) => setCreatorName(e.target.value)}
                disabled={isRegistering}
              />
              <p className="text-xs text-muted-foreground">
                This will be recorded as the creator of this IP Asset
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image-url">Image URL (Optional)</Label>
              <Input
                id="image-url"
                placeholder="https://example.com/image.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                disabled={isRegistering}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to use a default generated icon
              </p>
            </div>

            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-sm space-y-1">
              <div className="font-semibold text-blue-600">License Terms:</div>
              <div>• Commercial Remix Allowed</div>
              <div>• 10% Revenue Share</div>
              <div>• 0.01 IP Minting Fee</div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {registrationResult.success ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-semibold">Registration Successful!</span>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="p-3 bg-muted rounded-lg space-y-2">
                    <div>
                      <strong>IP ID:</strong>
                      <div className="font-mono text-xs mt-1 break-all">
                        {registrationResult.ipId}
                      </div>
                    </div>
                    <div>
                      <strong>Transaction Hash:</strong>
                      <div className="font-mono text-xs mt-1 break-all">
                        {registrationResult.txHash}
                      </div>
                    </div>
                  </div>
                  
                  <a
                    href={`${networkInfo.protocolExplorer}/ipa/${registrationResult.ipId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:underline"
                  >
                    View on Story Explorer
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-red-600">
                  <XCircle className="h-5 w-5" />
                  <span className="font-semibold">Registration Failed</span>
                </div>
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm">
                  {registrationResult.error}
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {!registrationResult ? (
            <>
              <Button 
                variant="outline" 
                onClick={handleClose}
                disabled={isRegistering}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleRegister}
                disabled={isRegistering || !isConnected}
                className="bg-gradient-to-r from-primary to-secondary"
              >
                {isRegistering ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Registering...
                  </>
                ) : (
                  'Register IP'
                )}
              </Button>
            </>
          ) : (
            <Button onClick={handleClose}>
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}