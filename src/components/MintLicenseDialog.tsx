// src/components/MintLicenseDialog.tsx
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useLicenseMinting } from "@/utils/licenseMintingService";
import { Loader2, ShoppingCart, ExternalLink, Check, Coins, Percent } from "lucide-react";
import { Address } from "viem";
import { Badge } from "@/components/ui/badge";

interface MintLicenseDialogProps {
  ipId: string;
  licenseTermsId?: bigint[];
  datasetTitle: string;
  location?: string;
  revenueShare?: number;
  mintingFee?: number;
  storyExplorerUrl?: string;
}

export const MintLicenseDialog = ({
  ipId,
  licenseTermsId,
  datasetTitle,
  location,
  revenueShare = 10,
  mintingFee = 0.01,
  storyExplorerUrl,
}: MintLicenseDialogProps) => {
  const { toast } = useToast();
  const { mintLicense, isConnected } = useLicenseMinting();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(1);
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [receiver, setReceiver] = useState<string>("");

  // Get the first license term ID (typically the one we want to use)
  const licenseTermId = licenseTermsId && licenseTermsId.length > 0 
    ? Number(licenseTermsId[0]) 
    : 1; // Default to 1 if not available

  const handleMint = async () => {
    if (!isConnected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to mint licenses",
        variant: "destructive",
      });
      return;
    }

    if (amount < 1) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid number of licenses (minimum 1)",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setTxHash(null);

    try {
      const result = await mintLicense(
        ipId as Address,
        licenseTermId,
        amount,
        receiver && receiver.trim() ? (receiver as Address) : undefined
      );

      if (result.success) {
        setTxHash(result.txHash!);
        toast({
          title: "License Minted Successfully! 🎉",
          description: (
            <div className="space-y-2">
              <p>Minted {amount} license{amount > 1 ? 's' : ''} for {datasetTitle}</p>
              {result.licenseTokenIds && (
                <p className="text-xs font-mono">
                  Token IDs: {result.licenseTokenIds.map(id => id.toString()).join(', ')}
                </p>
              )}
            </div>
          ),
        });
        
        // Reset and close after success
        setTimeout(() => {
          setAmount(1);
          setReceiver("");
          setOpen(false);
          setTxHash(null);
        }, 3000);
      } else {
        toast({
          title: "Minting Failed",
          description: result.error || "Failed to mint license",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error minting license:", error);
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const totalCost = (amount * mintingFee).toFixed(4);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          className="flex-1 bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-sm h-9"
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          Mint License
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto glass-card border-primary/20">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <ShoppingCart className="h-6 w-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold gradient-text">
                Mint License Tokens
              </DialogTitle>
              <DialogDescription className="text-base">
                Purchase license tokens to use this dataset commercially
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Horizontal Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          {/* Left Column - Dataset Info */}
          <div className="space-y-4">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Dataset Information
              </h3>
              
              {/* Dataset Title */}
              <div className="p-4 rounded-lg bg-gradient-to-br from-primary/5 to-secondary/5 border border-primary/10">
                <p className="text-xs text-muted-foreground mb-1">Dataset Name</p>
                <p className="font-semibold text-lg">{datasetTitle}</p>
              </div>

              {/* Location */}
              {location && (
                <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/10">
                  <p className="text-xs text-muted-foreground mb-1">Location</p>
                  <p className="font-medium text-blue-600">{location}</p>
                </div>
              )}

              {/* License Terms */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Percent className="h-4 w-4 text-green-600" />
                    <p className="text-xs text-muted-foreground">Revenue Share</p>
                  </div>
                  <p className="text-2xl font-bold text-green-600">{revenueShare}%</p>
                </div>
                
                <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Coins className="h-4 w-4 text-blue-600" />
                    <p className="text-xs text-muted-foreground">Minting Fee</p>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">{mintingFee} WIP</p>
                </div>
              </div>

              {/* Technical Details */}
              <div className="space-y-2 p-4 rounded-lg bg-muted/30 border border-border">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">IP Asset ID</p>
                  <p className="font-mono text-xs break-all text-foreground">{ipId}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">License Terms ID</p>
                  <p className="font-mono text-sm font-semibold text-primary">{licenseTermId}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Minting Form */}
          <div className="space-y-4">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Minting Configuration
              </h3>

              {/* Amount Input */}
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-sm font-medium">
                  Number of Licenses
                </Label>
                <div className="relative">
                  <Input
                    id="amount"
                    type="number"
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(Math.max(1, parseInt(e.target.value) || 1))}
                    placeholder="Enter amount"
                    disabled={loading}
                    className="text-lg font-semibold pr-20 h-14"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    licenses
                  </div>
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <span className="inline-block w-1 h-1 rounded-full bg-primary"></span>
                  Minimum: 1 license per transaction
                </p>
              </div>

              {/* Receiver Address Input (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="receiver" className="text-sm font-medium">
                  Receiver Address (Optional)
                </Label>
                <Input
                  id="receiver"
                  type="text"
                  value={receiver}
                  onChange={(e) => setReceiver(e.target.value)}
                  placeholder="0x... (defaults to your wallet)"
                  disabled={loading}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <span className="inline-block w-1 h-1 rounded-full bg-primary"></span>
                  Leave empty to mint to your connected wallet
                </p>
              </div>

              {/* Cost Summary */}
              <div className="p-6 rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10 border-2 border-primary/20">
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Unit Price</span>
                    <span className="font-medium">{mintingFee} WIP</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Quantity</span>
                    <span className="font-medium">× {amount}</span>
                  </div>
                  <div className="border-t border-primary/20 pt-3 flex justify-between items-center">
                    <span className="font-semibold text-lg">Total Cost</span>
                    <span className="text-3xl font-bold gradient-text">{totalCost} WIP</span>
                  </div>
                </div>
              </div>

              {/* Success State */}
              {txHash && (
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 animate-slide-up">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                      <Check className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <p className="text-sm font-semibold text-green-600">
                        Transaction Confirmed
                      </p>
                      <p className="text-xs font-mono break-all text-muted-foreground">{txHash}</p>
                      {storyExplorerUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full border-green-500/30 text-green-600 hover:bg-green-500/10"
                          onClick={() => window.open(storyExplorerUrl, '_blank')}
                        >
                          <ExternalLink className="h-3 w-3 mr-2" />
                          View on Story Explorer
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={loading}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleMint}
                  disabled={loading || !isConnected}
                  className="flex-1 bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white font-semibold"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Minting...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Mint {amount} License{amount > 1 ? 's' : ''}
                    </>
                  )}
                </Button>
              </div>

              {/* Info Note */}
              {!isConnected && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <p className="text-xs text-amber-600">
                    Please connect your wallet to mint licenses
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};