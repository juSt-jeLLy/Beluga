import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, ExternalLink, Shield, GitBranch, FileText, Zap } from 'lucide-react';

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

export function DerivativeSuccessDialog({
  open,
  onOpenChange,
  ipId,
  txHash,
  storyExplorerUrl,
  parentIpId,
  datasetTitle,
  creatorName,
  sensorDataId,
}: DerivativeSuccessDialogProps) {
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[900px] border-2 border-green-500/20 bg-gradient-to-br from-background via-background to-green-500/5 p-8">
        <div className="flex gap-8">
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

          <div className="flex-1 space-y-6">
            <div>
              <h4 className="text-lg font-semibold mb-4">Registration Details</h4>
              
              <div className="space-y-4">
                <div>
                  <div className="text-xs font-semibold text-primary mb-2 flex items-center gap-2">
                    <Shield className="h-3 w-3" />
                    DERIVATIVE IP ID
                  </div>
                  <div className="font-mono text-xs break-all bg-background/50 p-3 rounded-lg border border-border">
                    {ipId}
                  </div>
                </div>

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

                <div>
                  <div className="text-xs font-semibold text-primary mb-2 flex items-center gap-2">
                    <Zap className="h-3 w-3" />
                    TRANSACTION HASH
                  </div>
                  <div className="font-mono text-xs break-all bg-background/50 p-3 rounded-lg border border-border">
                    {txHash}
                  </div>
                </div>

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

            <div className="flex gap-2">
              {ipId && (
                <Button 
                  variant="outline"
                  onClick={() => {
                    window.open(`https://aeneid.explorer.story.foundation/ipa/${ipId}`, '_blank');
                  }}
                  className="flex-1 border-primary/30"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View IP
                </Button>
              )}
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
}