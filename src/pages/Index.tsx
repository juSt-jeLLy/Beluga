import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Shield, Database, TrendingUp, Cpu, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-tech-farm.jpg";

const Index = () => {
  const features = [
    {
      icon: <Database className="h-8 w-8" />,
      title: "Secure Data Registration",
      description: "Register your agricultural sensor data on blockchain via IP network for anti-theft protection",
      gradient: "from-primary to-orange-500"
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "IP-Based Protection",
      description: "Your data is protected through IP-based blockchain registration, ensuring ownership and preventing theft",
      gradient: "from-secondary to-purple-500"
    },
    {
      icon: <TrendingUp className="h-8 w-8" />,
      title: "Earn Royalties",
      description: "Generate income when insurers, weather stations, or other buyers subscribe to your registered data",
      gradient: "from-primary to-yellow-500"
    },
    {
      icon: <Cpu className="h-8 w-8" />,
      title: "Arduino Integration",
      description: "Seamlessly extract data from your agricultural Arduino robots including rainfall, temperature, humidity, and crop growth metrics",
      gradient: "from-secondary to-pink-500"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        <div className="absolute inset-0 z-0">
          <img 
            src={heroImage} 
            alt="Smart Agriculture" 
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/80 to-background"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8 animate-slide-up">
            <div className="inline-block px-4 py-2 bg-primary/10 border border-primary/20 rounded-full mb-4 animate-glow">
              <span className="text-primary font-semibold">Powered by Story Protocol</span>
            </div>
            
            <h1 className="text-6xl md:text-7xl font-bold leading-tight">
              <span className="gradient-text">Agricultural Data</span>
              <br />
              <span className="text-foreground">Marketplace</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
              Transform your farm data into valuable assets. Register sensor data on blockchain, 
              protect your intellectual property, and earn royalties from insurers and weather stations.
            </p>
            
            <div className="flex gap-4 justify-center items-center flex-wrap">
              <Link to="/marketplace">
                <Button size="lg" className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-lg gap-2 hover-lift">
                  Explore Marketplace
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link to="/extract">
                <Button size="lg" variant="outline" className="text-lg hover-lift border-primary/50">
                  Extract Your Data
                </Button>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-slide-up">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Why Choose <span className="gradient-text">Beluga</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Revolutionary platform connecting farmers with data buyers through secure blockchain technology
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <Card 
                key={index}
                className="p-8 glass-card hover-lift group cursor-pointer animate-slide-in-left"
                style={{animationDelay: `${index * 0.1}s`}}
              >
                <div className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <div className="text-white">
                    {feature.icon}
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-radial"></div>
        <div className="container mx-auto px-4 relative z-10">
          <Card className="glass-card p-12 max-w-4xl mx-auto text-center hover-lift">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to <span className="gradient-text">Monetize</span> Your Data?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of farmers already earning royalties from their agricultural sensor data
            </p>
            <Link to="/extract">
              <Button size="lg" className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-lg gap-2">
                Get Started Now
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Index;
