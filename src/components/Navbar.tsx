import { Link } from "react-router-dom";
import { Wallet } from "lucide-react";
import { Button } from "./ui/button";

const Navbar = () => {
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
            <Link to="/profile">
              <Button variant="ghost" className="hover-lift">Profile</Button>
            </Link>
          </div>
          
          <Button className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity gap-2">
            <Wallet className="h-4 w-4" />
            Connect Wallet
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
