// src/components/PayRoyaltyDialog.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  ArrowRightLeft, 
  ExternalLink, 
  Coins, 
  Zap, 
  Loader2, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  Wallet,
  Shield,
  Link as LinkIcon,
  Gift
} from "lucide-react";
import { useState } from "react";

interface PayRoyaltyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paying: boolean;
  success: boolean;
  txHash?: string;
  amount?: string;
  parentTitle?: string;
  parentIpId: string;
  derivativeTitle?: string;
  derivativeIpId: string;
  error?: string;
  onPayRoyalty: (amount: string) => Promise<void>;
  maxAmount?: string;
  isDirectPayment?: boolean; // Add this prop
}

export const PayRoyaltyDialog = ({
  open,
  onOpenChange,
  paying,
  success,
  txHash,
  amount,
  parentTitle,
  parentIpId,
  derivativeTitle,
  derivativeIpId,
  error,
  onPayRoyalty,
  maxAmount,
  isDirectPayment = false, // Default to false
}: PayRoyaltyDialogProps) => {
  const [royaltyAmount, setRoyaltyAmount] = useState("");
  const [customError, setCustomError] = useState<string>("");
  
  // Construct Story Explorer URL using the transaction hash
  const storyExplorerUrltx = txHash ? `https://aeneid.storyscan.io/tx/${txHash}` : '';
  
  // Construct IP explorer URLs
  const parentIpUrl = `https://aeneid.explorer.story.foundation/ipa/${parentIpId}`;
  const derivativeIpUrl = derivativeIpId !== "0x0000000000000000000000000000000000000000" 
    ? `https://aeneid.explorer.story.foundation/ipa/${derivativeIpId}`
    : '';
  
  const handleAmountChange = (value: string) => {
    setRoyaltyAmount(value);
    setCustomError("");
    
    // Validate amount
    if (value) {
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue <= 0) {
        setCustomError("Amount must be greater than 0");
      } else if (maxAmount && numValue > parseFloat(maxAmount)) {
        setCustomError(`Amount cannot exceed ${maxAmount} WIP`);
      }
    }
  };
  
  const handleMaxClick = () => {
    if (maxAmount) {
      setRoyaltyAmount(maxAmount);
      setCustomError("");
    }
  };
  
  const handlePay = async () => {
    if (!royaltyAmount || parseFloat(royaltyAmount) <= 0) {
      setCustomError("Please enter a valid amount");
      return;
    }
    
    if (maxAmount && parseFloat(royaltyAmount) > parseFloat(maxAmount)) {
      setCustomError(`Amount cannot exceed ${maxAmount} WIP`);
      return;
    }
    
    try {
      await onPayRoyalty(royaltyAmount);
    } catch (err) {
      console.error("Payment failed:", err);
    }
  };

  const handleClose = () => {
    if (!paying) {
      setRoyaltyAmount("");
      setCustomError("");
      onOpenChange(false);
    }
  };

  // Get title based on payment type
  const getDialogTitle = () => {
    if (success) return 'Royalty Payment Complete';
    if (isDirectPayment) return 'Pay Royalty to IP Asset';
    return 'Pay Royalty to Parent IP';
  };

  // Get status message based on payment type
  const getStatusMessage = () => {
    if (paying) return 'Processing royalty payment on blockchain';
    if (success) return 'Royalty payment completed successfully';
    if (error) return 'An error occurred while paying royalty';
    
    if (isDirectPayment) return 'Pay royalty directly to IP asset';
    return 'Pay royalty from derivative to parent IP';
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[900px] border-2 border-purple-500/20 bg-gradient-to-br from-background via-background to-purple-500/5 p-8">
        <div className="flex gap-8">
          {/* Left Column - Status Icon & Message */}
          <div className="flex-1 flex flex-col items-center justify-center space-y-6">
            {paying && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 bg-purple-500 rounded-full blur-2xl opacity-30 animate-pulse"></div>
                  <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Loader2 className="h-16 w-16 text-white animate-spin" />
                  </div>
                </div>
                
                <div className="text-center">
                  <h3 className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent mb-2">
                    Paying Royalty...
                  </h3>
                  <p className="text-muted-foreground">
                    {getStatusMessage()}
                  </p>
                </div>
              </>
            )}

            {success && !paying && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 bg-green-500 rounded-full blur-2xl opacity-30 animate-pulse"></div>
                  <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center animate-bounce">
                    <CheckCircle className="h-16 w-16 text-white" />
                  </div>
                </div>
                
                <div className="text-center">
                  <h3 className="text-3xl font-bold text-green-600 mb-2">
                    Royalty Paid! 🎉
                  </h3>
                  <p className="text-muted-foreground">
                    {getStatusMessage()}
                  </p>
                </div>
              </>
            )}

            {!paying && !success && !error && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 bg-purple-500 rounded-full blur-2xl opacity-30"></div>
                  <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    {isDirectPayment ? (
                      <Gift className="h-16 w-16 text-white" />
                    ) : (
                      <ArrowRightLeft className="h-16 w-16 text-white" />
                    )}
                  </div>
                </div>
                
                <div className="text-center">
                  <h3 className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent mb-2">
                    {isDirectPayment ? 'Support IP Creator' : 'Pay Royalty'}
                  </h3>
                  <p className="text-muted-foreground">
                    {getStatusMessage()}
                  </p>
                </div>
              </>
            )}

            {error && !paying && !success && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 bg-red-500 rounded-full blur-2xl opacity-30 animate-pulse"></div>
                  <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center">
                    <AlertCircle className="h-16 w-16 text-white" />
                  </div>
                </div>
                
                <div className="text-center">
                  <h3 className="text-3xl font-bold text-red-600 mb-2">
                    Payment Failed
                  </h3>
                  <p className="text-muted-foreground">
                    {getStatusMessage()}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Right Column - Details & Actions */}
          <div className="flex-1 space-y-6">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">
                {getDialogTitle()}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* IP Relationship Diagram */}
              <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-4 rounded-xl border border-purple-500/20">
                <div className="flex items-center justify-between mb-4">
                  {isDirectPayment ? (
                    // Direct payment layout
                    <>
                      <div className="text-center w-full">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <Gift className="h-4 w-4 text-green-500" />
                          <span className="text-sm font-semibold text-green-600">DIRECT PAYMENT</span>
                        </div>
                        <div className="text-xs font-mono bg-background/50 p-2 rounded border mb-2">
                          From Your Wallet
                        </div>
                        <div className="text-[10px] font-mono text-muted-foreground mt-1">
                          Direct royalty payment
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-center mx-4">
                        <ArrowRightLeft className="h-6 w-6 text-primary" />
                        <span className="text-xs text-muted-foreground mt-1">Supports</span>
                      </div>
                      
                      <div className="text-center w-full">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <Shield className="h-4 w-4 text-primary" />
                          <span className="text-sm font-semibold text-primary">IP ASSET</span>
                        </div>
                        <div className="text-xs font-mono bg-background/50 p-2 rounded border">
                          {parentTitle || 'IP Asset'}
                        </div>
                        <div className="text-[10px] font-mono text-muted-foreground mt-1 truncate">
                          {parentIpId.slice(0, 10)}...{parentIpId.slice(-8)}
                        </div>
                      </div>
                    </>
                  ) : (
                    // Derivative to parent layout
                    <>
                      <div className="text-center">
                        <div className="flex items-center gap-2 mb-2">
                          <Shield className="h-4 w-4 text-purple-500" />
                          <span className="text-sm font-semibold text-purple-600">DERIVATIVE IP</span>
                        </div>
                        <div className="text-xs font-mono bg-background/50 p-2 rounded border">
                          {derivativeTitle || 'Derivative'}
                        </div>
                        <div className="text-[10px] font-mono text-muted-foreground mt-1 truncate">
                          {derivativeIpId.slice(0, 10)}...{derivativeIpId.slice(-8)}
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-center">
                        <ArrowRightLeft className="h-6 w-6 text-primary" />
                        <span className="text-xs text-muted-foreground mt-1">Pays royalty to</span>
                      </div>
                      
                      <div className="text-center">
                        <div className="flex items-center gap-2 mb-2">
                          <Shield className="h-4 w-4 text-primary" />
                          <span className="text-sm font-semibold text-primary">PARENT IP</span>
                        </div>
                        <div className="text-xs font-mono bg-background/50 p-2 rounded border">
                          {parentTitle || 'Parent Dataset'}
                        </div>
                        <div className="text-[10px] font-mono text-muted-foreground mt-1 truncate">
                          {parentIpId.slice(0, 10)}...{parentIpId.slice(-8)}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Amount Input - Only show when not in success state */}
              {!success && !error && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="royaltyAmount" className="text-sm font-semibold flex items-center gap-2 mb-2">
                      <Coins className="h-4 w-4" />
                      ROYALTY AMOUNT (WIP)
                    </Label>
                    <div className="relative">
                      <Input
                        id="royaltyAmount"
                        type="number"
                        step="0.000001"
                        min="0"
                        value={royaltyAmount}
                        onChange={(e) => handleAmountChange(e.target.value)}
                        placeholder="Enter amount in WIP"
                        className="pr-24 text-lg py-6 border-primary/30 focus:border-primary"
                        disabled={paying}
                      />
                      {maxAmount && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleMaxClick}
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 px-3 text-xs"
                          disabled={paying}
                        >
                          MAX
                        </Button>
                      )}
                    </div>
                    {maxAmount && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Maximum: {maxAmount} WIP
                      </p>
                    )}
                    {customError && (
                      <p className="text-xs text-red-500 mt-2">{customError}</p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={handlePay}
                      disabled={paying || !!customError || !royaltyAmount}
                      className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 font-semibold shadow-lg h-12"
                    >
                      {paying ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Wallet className="h-4 w-4 mr-2" />
                          {isDirectPayment ? 'Support Creator' : 'Pay Royalty'}
                        </>
                      )}
                    </Button>
                    
                    <Button
                      onClick={handleClose}
                      variant="outline"
                      disabled={paying}
                      className="h-12"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Success Details */}
              {success && amount && (
                <div className="space-y-4">
                  {/* Paid Amount */}
                  <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 p-4 rounded-xl border border-green-500/20">
                    <div className="text-center">
                      <div className="text-xs font-semibold text-green-600 mb-2 flex items-center justify-center gap-2">
                        <Coins className="h-4 w-4" />
                        PAID AMOUNT
                      </div>
                      <div className="text-3xl font-bold text-green-600 mb-1">
                        {amount} WIP
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {isDirectPayment 
                          ? 'Successfully paid to IP asset creator' 
                          : 'Successfully paid to parent IP owner'}
                      </p>
                    </div>
                  </div>

                  {/* Transaction Hash */}
                  {txHash && (
                    <div>
                      <div className="text-xs font-semibold text-primary mb-2 flex items-center gap-2">
                        <LinkIcon className="h-4 w-4" />
                        TRANSACTION HASH
                      </div>
                      <div className="font-mono text-xs break-all bg-background/50 p-3 rounded-lg border border-border">
                        {txHash}
                      </div>
                    </div>
                  )}

                  {/* Status */}
                  <div className="bg-green-500/10 p-3 rounded-lg border border-green-500/30">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-semibold text-green-600">
                        ✓ Transaction confirmed on blockchain
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      The royalty has been recorded and the creator can claim their share
                    </p>
                  </div>

                  {/* View Links */}
                  <div className="grid grid-cols-2 gap-3 pt-4">
                    {txHash && (
                      <a
                        href={storyExplorerUrltx}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 p-3 rounded-lg bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 transition-opacity font-medium text-sm"
                      >
                        <ExternalLink className="h-4 w-4" />
                        View Transaction
                      </a>
                    )}
                    
                    <a
                      href={parentIpUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 p-3 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90 transition-opacity font-medium text-sm"
                    >
                      <ExternalLink className="h-4 w-4" />
                      View IP Asset
                    </a>
                  </div>
                </div>
              )}

              {/* Error State */}
              {error && !paying && !success && (
                <div className="space-y-4">
                  <div className="bg-red-500/10 p-4 rounded-lg border border-red-500/30">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                      <span className="text-sm font-semibold text-red-600">
                        Payment Error
                      </span>
                    </div>
                    <p className="text-sm text-red-500/90">{error}</p>
                  </div>

                  <Button
                    onClick={handleClose}
                    className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 font-semibold h-12"
                  >
                    Close
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};