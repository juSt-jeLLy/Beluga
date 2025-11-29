import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Thermometer, Sun, Droplets, Sprout, CloudRain, TrendingUp, Shield } from "lucide-react";

const Profile = () => {
  const registeredData = [
    {
      id: "IP-2024-001",
      type: "Temperature & Humidity Dataset",
      icon: <Thermometer className="h-5 w-5" />,
      registrationDate: "2024-01-10",
      status: "Active",
      earnings: "2.4 ETH",
      subscribers: 12,
      gradient: "from-orange-500 to-red-500"
    },
    {
      id: "IP-2024-002",
      type: "Sunlight Intensity Dataset",
      icon: <Sun className="h-5 w-5" />,
      registrationDate: "2024-01-12",
      status: "Active",
      earnings: "1.8 ETH",
      subscribers: 8,
      gradient: "from-yellow-500 to-orange-500"
    },
    {
      id: "IP-2024-003",
      type: "Soil Moisture Dataset",
      icon: <Droplets className="h-5 w-5" />,
      registrationDate: "2024-01-14",
      status: "Active",
      earnings: "2.1 ETH",
      subscribers: 10,
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      id: "IP-2024-004",
      type: "Crop Growth Dataset",
      icon: <Sprout className="h-5 w-5" />,
      registrationDate: "2024-01-15",
      status: "Active",
      earnings: "3.2 ETH",
      subscribers: 15,
      gradient: "from-green-500 to-emerald-500"
    },
    {
      id: "IP-2024-005",
      type: "Rainfall Dataset",
      icon: <CloudRain className="h-5 w-5" />,
      registrationDate: "2024-01-16",
      status: "Active",
      earnings: "1.5 ETH",
      subscribers: 7,
      gradient: "from-indigo-500 to-blue-500"
    }
  ];

  const totalEarnings = registeredData.reduce((sum, item) => {
    return sum + parseFloat(item.earnings.replace(" ETH", ""));
  }, 0);

  const totalSubscribers = registeredData.reduce((sum, item) => sum + item.subscribers, 0);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-24">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Profile Header */}
          <div className="text-center animate-slide-up">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 animate-glow">
              Your Profile
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold mb-4">
              Your <span className="gradient-text">Registered Data</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Track your IP-protected datasets and earnings
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid md:grid-cols-3 gap-6 animate-slide-in-left">
            <Card className="glass-card hover-lift">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
                    <TrendingUp className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Earnings</p>
                    <p className="text-3xl font-bold gradient-text">{totalEarnings.toFixed(1)} ETH</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card hover-lift">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                    <Shield className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Registered Datasets</p>
                    <p className="text-3xl font-bold">{registeredData.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card hover-lift">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                    <TrendingUp className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Subscribers</p>
                    <p className="text-3xl font-bold">{totalSubscribers}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Registered Data List */}
          <div className="space-y-4">
            <h2 className="text-3xl font-bold mb-6">
              IP-Protected <span className="gradient-text">Datasets</span>
            </h2>
            
            {registeredData.map((item, index) => (
              <Card 
                key={item.id}
                className="glass-card hover-lift animate-slide-in-right"
                style={{animationDelay: `${index * 0.1}s`}}
              >
                <div className={`h-1 bg-gradient-to-r ${item.gradient}`}></div>
                <CardHeader>
                  <div className="flex items-start justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 bg-gradient-to-br ${item.gradient} rounded-xl flex items-center justify-center`}>
                        <div className="text-white">
                          {item.icon}
                        </div>
                      </div>
                      <div>
                        <CardTitle className="text-xl">{item.type}</CardTitle>
                        <CardDescription className="mt-1">
                          IP Registration: <span className="font-mono font-semibold">{item.id}</span>
                        </CardDescription>
                      </div>
                    </div>
                    <Badge className="bg-primary/10 text-primary border-primary/20">
                      {item.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Registration Date</p>
                      <p className="font-semibold">{item.registrationDate}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Subscribers</p>
                      <p className="font-semibold">{item.subscribers}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Earnings</p>
                      <p className="font-semibold text-primary">{item.earnings}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <p className="font-semibold text-green-500">Active</p>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-4 border-t border-border">
                    <Button size="sm" className="bg-gradient-to-r from-primary to-secondary hover:opacity-90">
                      View Analytics
                    </Button>
                    <Button size="sm" variant="outline" className="border-primary/50">
                      Manage Access
                    </Button>
                    <Button size="sm" variant="outline" className="border-primary/50">
                      IP Certificate
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
      
      {/* Floating background elements */}
      <div className="fixed top-1/3 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-float pointer-events-none"></div>
      <div className="fixed bottom-1/3 right-10 w-96 h-96 bg-secondary/5 rounded-full blur-3xl animate-float pointer-events-none" style={{animationDelay: '3s'}}></div>
    </div>
  );
};

export default Profile;
