import { Link } from "react-router-dom";
import { useConnectModal } from "@tomo-inc/tomo-evm-kit";
import { useAccount, useDisconnect, useBalance } from "wagmi";
import { Button } from "./ui/button";
import { formatEther } from "viem";
import { useState, useRef, useEffect } from "react";
import { Copy, LogOut, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Navbar = () => {
  const { openConnectModal } = useConnectModal();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { data: balance } = useBalance({
    address: address,
  });
  const { toast } = useToast();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleWalletAction = () => {
    if (isConnected) {
      setIsDropdownOpen(!isDropdownOpen);
    } else {
      openConnectModal();
    }
  };

  const handleCopyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      toast({
        title: "Address copied!",
        description: "Wallet address copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setIsDropdownOpen(false);
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatBalance = () => {
    if (!balance) return "0.00 IP";
    const formatted = parseFloat(formatEther(balance.value)).toFixed(2);
    return `${formatted} ${balance.symbol}`;
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center animate-glow">
              <span className="text-2xl font-bold text-primary-foreground">B</span>
            </div>
            <span className="text-2xl font-bold gradient-text">Beluga</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-1">
            <Link to="/">
              <Button variant="ghost" className="hover-lift">Home</Button>
            </Link>
            <Link to="/marketplace">
              <Button variant="ghost" className="hover-lift">Marketplace</Button>
            </Link>
            <Link to="/extract">
              <Button variant="ghost" className="hover-lift">Extract Data</Button>
            </Link>
            <Link to="/licenses">
              <Button variant="ghost" className="hover-lift">Derivatives</Button>
            </Link>
            <Link to="/profile">
              <Button variant="ghost" className="hover-lift">Profile</Button>
            </Link>
          </div>
          
          <div className="flex items-center gap-3 relative" ref={dropdownRef}>
            {isConnected && balance && (
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 rounded-lg backdrop-blur-sm">
                <span className="text-sm font-semibold gradient-text">{formatBalance()}</span>
              </div>
            )}
            <Button 
              onClick={handleWalletAction}
              className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity"
            >
              {isConnected ? formatAddress(address!) : "Connect Wallet"}
            </Button>

            {isConnected && isDropdownOpen && (
              <div className="absolute top-full right-0 mt-2 w-64 bg-card/95 backdrop-blur-md border border-border rounded-lg shadow-lg overflow-hidden z-50">
                <div className="p-4 border-b border-border bg-gradient-to-r from-primary/5 to-secondary/5">
                  <p className="text-xs text-muted-foreground mb-1">Connected Wallet</p>
                  <p className="text-sm font-mono font-semibold">{formatAddress(address!)}</p>
                </div>
                
                <div className="p-2">
                  <button
                    onClick={handleCopyAddress}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors text-left"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                    <span className="text-sm">{copied ? "Copied!" : "Copy Address"}</span>
                  </button>
                  
                  <button
                    onClick={handleDisconnect}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-destructive/10 text-destructive transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm">Disconnect</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;