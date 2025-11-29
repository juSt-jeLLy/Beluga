import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Thermometer, Sun, Droplets, Sprout, CloudRain, TrendingUp } from "lucide-react";
import marketplaceBg from "@/assets/marketplace-bg.jpg";

const Marketplace = () => {
  const mockData = [
    {
      id: 1,
      type: "Temperature & Humidity",
      icon: <Thermometer className="h-6 w-6" />,
      description: "Real-time temperature and humidity monitoring with heat index and dew point calculations",
      price: "0.5 ETH/month",
      dataPoints: "24/7 monitoring",
      accuracy: "±0.5°C",
      gradient: "from-orange-500 to-red-500"
    },
    {
      id: 2,
      type: "Sunlight Intensity",
      icon: <Sun className="h-6 w-6" />,
      description: "Peak hours tracking, lux readings, and shade pattern detection using BH1750 sensor",
      price: "0.3 ETH/month",
      dataPoints: "Hourly readings",
      accuracy: "±20 lux",
      gradient: "from-yellow-500 to-orange-500"
    },
    {
      id: 3,
      type: "Soil Moisture",
      icon: <Droplets className="h-6 w-6" />,
      description: "Multi-depth moisture tracking optimized for various crop types with rain correlation",
      price: "0.4 ETH/month",
      dataPoints: "4x daily updates",
      accuracy: "±2%",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      id: 4,
      type: "Live Crop Growth",
      icon: <Sprout className="h-6 w-6" />,
      description: "Height tracking, growth rate analysis, leaf count, and environmental correlation data",
      price: "0.6 ETH/month",
      dataPoints: "Daily measurements",
      accuracy: "±0.5cm",
      gradient: "from-green-500 to-emerald-500"
    },
    {
      id: 5,
      type: "Rainfall Data",
      icon: <CloudRain className="h-6 w-6" />,
      description: "Precipitation tracking with duration, intensity patterns via Arduino rain gauge",
      price: "0.35 ETH/month",
      dataPoints: "Real-time alerts",
      accuracy: "±0.1 inches",
      gradient: "from-indigo-500 to-blue-500"
    },
    {
      id: 6,
      type: "Complete Package",
      icon: <TrendingUp className="h-6 w-6" />,
      description: "All sensor data combined with analytics dashboard and historical insights",
      price: "1.8 ETH/month",
      dataPoints: "Full access",
      accuracy: "Premium",
      gradient: "from-purple-500 to-pink-500"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="relative pt-24 pb-12 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={marketplaceBg} 
            alt="Data Marketplace" 
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background to-background"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-12 animate-slide-up">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 animate-glow">
              Live Marketplace
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold mb-4">
              <span className="gradient-text">Data</span> Marketplace
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Subscribe to verified agricultural sensor data from farms worldwide. 
              All data is IP-protected on blockchain.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {mockData.map((item, index) => (
              <Card 
                key={item.id}
                className="glass-card hover-lift group animate-slide-in-left overflow-hidden"
                style={{animationDelay: `${index * 0.1}s`}}
              >
                <div className={`h-2 bg-gradient-to-r ${item.gradient}`}></div>
                <CardHeader>
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-14 h-14 bg-gradient-to-br ${item.gradient} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <div className="text-white">
                        {item.icon}
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-primary font-bold">
                      {item.price}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">
                    {item.type}
                  </CardTitle>
                  <CardDescription className="text-base">
                    {item.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Data Points:</span>
                    <span className="font-semibold">{item.dataPoints}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Accuracy:</span>
                    <span className="font-semibold">{item.accuracy}</span>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button className="flex-1 bg-gradient-to-r from-primary to-secondary hover:opacity-90">
                      Subscribe
                    </Button>
                    <Button variant="outline" className="border-primary/50">
                      Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        
        {/* Floating background elements */}
        <div className="absolute top-1/3 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-1/3 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-float" style={{animationDelay: '3s'}}></div>
      </div>
    </div>
  );
};

export default Marketplace;
