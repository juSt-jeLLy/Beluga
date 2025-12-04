import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, ExternalLink, Coins, Zap, Loader2, TrendingUp } from "lucide-react";

interface ClaimRevenueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  claiming: boolean;
  success: boolean;
  txHash?: string;
  claimedAmount?: string;
  datasetTitle: string;
  ipAssetId: string;
  error?: string;
}

export const ClaimRevenueDialog = ({
  open,
  onOpenChange,
  claiming,
  success,
  txHash,
  claimedAmount,
  datasetTitle,
  ipAssetId,
  error,
}: ClaimRevenueDialogProps) => {
  
  // Construct Story Explorer URL using the transaction hash
  const storyExplorerUrltx = txHash ? `https://aeneid.storyscan.io/tx/${txHash}` : '';
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[900px] border-2 border-green-500/20 bg-gradient-to-br from-background via-background to-green-500/5 p-8">
        <div className="flex gap-8">
          {/* Left Column - Status Icon & Message */}
          <div className="flex-1 flex flex-col items-center justify-center space-y-6">
            {claiming && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 bg-primary rounded-full blur-2xl opacity-30 animate-pulse"></div>
                  <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                    <Loader2 className="h-16 w-16 text-white animate-spin" />
                  </div>
                </div>
                
                <div className="text-center">
                  <h3 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
                    Claiming Revenue...
                  </h3>
                  <p className="text-muted-foreground">
                    Please wait while we process your claim
                  </p>
                </div>
              </>
            )}

            {success && !claiming && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 bg-green-500 rounded-full blur-2xl opacity-30 animate-pulse"></div>
                  <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center animate-bounce">
                    <CheckCircle className="h-16 w-16 text-white" />
                  </div>
                </div>
                
                <div className="text-center">
                  <h3 className="text-3xl font-bold text-green-600 mb-2">
                    Revenue Claimed! 🎉
                  </h3>
                  <p className="text-muted-foreground">
                    Your revenue has been successfully claimed
                  </p>
                </div>
              </>
            )}

            {error && !claiming && !success && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 bg-red-500 rounded-full blur-2xl opacity-30 animate-pulse"></div>
                  <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center">
                    <Zap className="h-16 w-16 text-white" />
                  </div>
                </div>
                
                <div className="text-center">
                  <h3 className="text-3xl font-bold text-red-600 mb-2">
                    Claim Failed
                  </h3>
                  <p className="text-muted-foreground">
                    An error occurred while claiming
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Right Column - Details & Actions */}
          <div className="flex-1 space-y-6">
            <div>
              <h4 className="text-lg font-semibold mb-4">Claim Details</h4>
              
              <div className="space-y-4">
                {/* Dataset Info */}
                <div>
                  <div className="text-xs font-semibold text-primary mb-2 flex items-center gap-2">
                    <Coins className="h-3 w-3" />
                    DATASET
                  </div>
                  <div className="text-sm bg-background/50 p-3 rounded-lg border border-border">
                    {datasetTitle}
                  </div>
                </div>

                {/* IP Asset ID */}
                <div>
                  <div className="text-xs font-semibold text-primary mb-2 flex items-center gap-2">
                    <Zap className="h-3 w-3" />
                    IP ASSET ID
                  </div>
                  <div className="font-mono text-xs break-all bg-background/50 p-3 rounded-lg border border-border">
                    {ipAssetId}
                  </div>
                </div>

                {/* Claimed Amount - Only show if success */}
                {success && claimedAmount && (
                  <div>
                    <div className="text-xs font-semibold text-primary mb-2 flex items-center gap-2">
                      <TrendingUp className="h-3 w-3" />
                      CLAIMED AMOUNT
                    </div>
                    <div className="bg-background/50 p-3 rounded-lg border border-border">
                      <div className="text-2xl font-bold text-green-600">
                        {claimedAmount} WIP
                      </div>
                    </div>
                  </div>
                )}

                {/* Transaction Hash - Only show if success and txHash exists */}
                {success && txHash && (
                  <div>
                    <div className="text-xs font-semibold text-primary mb-2 flex items-center gap-2">
                      <Zap className="h-3 w-3" />
                      TRANSACTION HASH
                    </div>
                    <div className="font-mono text-xs break-all bg-background/50 p-3 rounded-lg border border-border">
                      {txHash}
                    </div>
                  </div>
                )}

                {/* Error Message - Only show if error */}
                {error && (
                  <div>
                    <div className="text-xs font-semibold text-red-600 mb-2 flex items-center gap-2">
                      <Zap className="h-3 w-3" />
                      ERROR
                    </div>
                    <div className="text-sm p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-600">
                      {error}
                    </div>
                  </div>
                )}

                {/* Status */}
                {claiming && (
                  <div>
                    <div className="text-xs font-semibold text-primary mb-2 flex items-center gap-2">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      STATUS
                    </div>
                    <div className="text-sm p-3 rounded-lg bg-primary/10 border border-primary/30 text-primary">
                      ⏳ Processing transaction...
                    </div>
                  </div>
                )}

                {success && (
                  <div>
                    <div className="text-xs font-semibold text-primary mb-2 flex items-center gap-2">
                      <CheckCircle className="h-3 w-3" />
                      STATUS
                    </div>
                    <div className="text-sm p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-600">
                      ✓ Transaction confirmed on blockchain
                    </div>
                  </div>
                )}
                
                {/* View on Story Explorer Button - Only show if success and txHash exists */}
                {success && txHash && (
                  <a
                    href={storyExplorerUrltx}
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
            {!claiming && (
              <Button 
                onClick={() => onOpenChange(false)}
                className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 font-semibold shadow-lg h-12"
              >
                {success ? 'Continue' : 'Close'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};