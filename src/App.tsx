import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Web3Providers from "./services/Web3Providers";
import Index from "./pages/Index";
import Marketplace from "./pages/Marketplace";
import DataExtraction from "./pages/DataExtraction";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const App = () => {
  // Force dark mode
  document.documentElement.classList.add('dark');
  
  return (
    <Web3Providers>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/extract" element={<DataExtraction />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </Web3Providers>
  );
};

export default App;