import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, ExternalLink, Shield, Zap, Coins } from "lucide-react";

interface MintSuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  txHash: string;
  licenseTokenIds?: bigint[];
  amount: number;
  datasetTitle: string;
  receiverAddress?: string;
}

export const MintSuccessDialog = ({
  open,
  onOpenChange,
  txHash,
  licenseTokenIds,
  amount,
  datasetTitle,
  receiverAddress,
}: MintSuccessDialogProps) => {
  
  // Construct Story Explorer URL using the transaction hash
  const storyExplorerUrltx = `https://aeneid.storyscan.io/tx/${txHash}`;
  
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
                License Minted! 🎉
              </h3>
              <p className="text-muted-foreground">
                Your license tokens have been successfully minted
              </p>
            </div>
          </div>

          {/* Right Column - Details & Actions */}
          <div className="flex-1 space-y-6">
            <div>
              <h4 className="text-lg font-semibold mb-4">Minting Details</h4>
              
              <div className="space-y-4">
                {/* Dataset Info */}
                <div>
                  <div className="text-xs font-semibold text-primary mb-2 flex items-center gap-2">
                    <Shield className="h-3 w-3" />
                    DATASET
                  </div>
                  <div className="text-sm bg-background/50 p-3 rounded-lg border border-border">
                    {datasetTitle}
                  </div>
                </div>

                {/* Amount & Token IDs */}
                <div>
                  <div className="text-xs font-semibold text-primary mb-2 flex items-center gap-2">
                    <Coins className="h-3 w-3" />
                    LICENSE TOKENS
                  </div>
                  <div className="bg-background/50 p-3 rounded-lg border border-border space-y-2">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Amount: </span>
                      <span className="font-semibold">{amount} License{amount > 1 ? 's' : ''}</span>
                    </div>
                    {licenseTokenIds && licenseTokenIds.length > 0 && (
                      <div className="text-xs">
                        <span className="text-muted-foreground">Token IDs: </span>
                        <span className="font-mono text-primary">
                          {licenseTokenIds.map(id => id.toString()).join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Receiver Address (if different from connected wallet) */}
                {receiverAddress && (
                  <div>
                    <div className="text-xs font-semibold text-primary mb-2 flex items-center gap-2">
                      <Shield className="h-3 w-3" />
                      RECEIVER ADDRESS
                    </div>
                    <div className="font-mono text-xs break-all bg-background/50 p-3 rounded-lg border border-border">
                      {receiverAddress}
                    </div>
                  </div>
                )}

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
                    ✓ Transaction confirmed on blockchain
                  </div>
                </div>
                
                {/* View on Story Explorer Button */}
                <a
                  href={storyExplorerUrltx}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 p-4 rounded-xl bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 transition-opacity font-semibold shadow-lg"
                >
                  <ExternalLink className="h-5 w-5" />
                  View on Story Explorer
                </a>
              </div>
            </div>

            {/* Close Button */}
            <Button 
              onClick={() => onOpenChange(false)}
              className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 font-semibold shadow-lg h-12"
            >
              Continue Browsing
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};